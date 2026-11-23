#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const FOUNDATION_DOCS_DIR = path.join(ROOT, '.foundation');
const VALIDATION_DIR = path.join(ROOT, '.discovery', 'validation');
const CODE_ROOT = path.join(ROOT, '.discovery', 'code');
const RUNTIME_ROOT = path.join(ROOT, '.discovery', 'runtime');
const KNOWLEDGE_ROOT = path.join(ROOT, '.discovery', 'knowledge');
const REQUIREMENT_ROOT = path.join(ROOT, '.requirement');
const TEMPLATE_DIR = path.join(ROOT, '.github', 'templates', 'foundational_context');
const FOUNDATION_REGISTRY_PATH = path.join(ROOT, '.github', 'config', 'foundation-document-registry.json');

const args = process.argv.slice(2);
const writeMd = args.includes('--write-md');
const failOnIssues = !args.includes('--no-fail');
const agentArgIndex = args.indexOf('--agent');
const requestedAgent = agentArgIndex !== -1 ? (args[agentArgIndex + 1] || '').trim() : '';

const foundationRegistry = readJsonSafe(FOUNDATION_REGISTRY_PATH);
if (!foundationRegistry || !Array.isArray(foundationRegistry.documents)) {
  console.error(`Invalid or missing foundation registry at: ${toPosix(path.relative(ROOT, FOUNDATION_REGISTRY_PATH))}`);
  process.exit(1);
}

const REQUIRED_FRONTMATTER_KEYS = Array.isArray(foundationRegistry.validation && foundationRegistry.validation.required_frontmatter_keys)
  ? foundationRegistry.validation.required_frontmatter_keys
  : [];

if (REQUIRED_FRONTMATTER_KEYS.length === 0) {
  console.error('Invalid registry config: validation.required_frontmatter_keys must be a non-empty array.');
  process.exit(1);
}

const DOC_RULES = Object.fromEntries(
  foundationRegistry.documents
    .filter((doc) => doc && typeof doc.filename === 'string')
    .map((doc) => [doc.filename, doc.doc_rule && typeof doc.doc_rule === 'object' ? doc.doc_rule : null])
    .filter((entry) => Boolean(entry[1]))
);

if (Object.keys(DOC_RULES).length === 0) {
  console.error('Invalid registry config: documents[].doc_rule must be present for at least one document.');
  process.exit(1);
}

const DOC_OWNERS = Object.fromEntries(
  foundationRegistry.documents.map((doc) => [
    doc.filename,
    Array.isArray(doc.generated_by) ? doc.generated_by : [],
  ])
);

function toPosix(relPath) {
  return relPath.replace(/\\/g, '/');
}

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function listDirSafe(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    return fs.readdirSync(dirPath);
  } catch (_) {
    return [];
  }
}

function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return { hasFrontmatter: false, metadata: {} };
  }
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) {
    return { hasFrontmatter: false, metadata: {} };
  }
  const block = content.slice(4, end).split('\n');
  const metadata = {};
  let currentKey = null;

  for (const line of block) {
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const raw = keyMatch[2].trim();
      metadata[currentKey] = raw ? raw.replace(/^"|"$/g, '') : [];
      continue;
    }
    const itemMatch = line.match(/^\s*-\s*(.*)$/);
    if (itemMatch && currentKey) {
      if (!Array.isArray(metadata[currentKey])) {
        metadata[currentKey] = metadata[currentKey] ? [String(metadata[currentKey])] : [];
      }
      metadata[currentKey].push(itemMatch[1].trim().replace(/^"|"$/g, ''));
    }
  }

  return { hasFrontmatter: true, metadata };
}

function evaluateCodeState() {
  const globalState = readJsonSafe(path.join(CODE_ROOT, 'state.json'));
  const registry = readJsonSafe(path.join(CODE_ROOT, 'registry.json'));
  const scansDir = path.join(CODE_ROOT, 'scans');
  const slugs = new Set();
  for (const name of listDirSafe(scansDir)) {
    if (fs.existsSync(path.join(scansDir, name))) slugs.add(name);
  }
  for (const name of listDirSafe(path.join(CODE_ROOT, 'symbols'))) {
    if (fs.existsSync(path.join(CODE_ROOT, 'symbols', name))) slugs.add(name);
  }
  for (const name of listDirSafe(path.join(CODE_ROOT, 'graph'))) {
    if (fs.existsSync(path.join(CODE_ROOT, 'graph', name))) slugs.add(name);
  }
  for (const name of listDirSafe(path.join(CODE_ROOT, 'modules'))) {
    if (fs.existsSync(path.join(CODE_ROOT, 'modules', name))) slugs.add(name);
  }
  if (registry && registry.modules && typeof registry.modules === 'object') {
    for (const slug of Object.keys(registry.modules)) {
      slugs.add(slug);
    }
  }

  const details = [];

  for (const slug of [...slugs]) {
    const scanDir = path.join(scansDir, slug);
    const state = readJsonSafe(path.join(scanDir, 'state.json')) || globalState;
    const manifestExists = fs.existsSync(path.join(scanDir, 'scan-manifest.json'));
    const symbolsExists = fs.existsSync(path.join(CODE_ROOT, 'symbols', slug, 'index.json'));
    const graphExists = fs.existsSync(path.join(CODE_ROOT, 'graph', slug, 'edges.json'));
    const modulesDir = path.join(CODE_ROOT, 'modules', slug);
    const moduleJsons = listDirSafe(modulesDir).filter((f) => f.endsWith('.json'));

    const pipeline = (state && state.pipeline) || {};
    const scanCompleted = pipeline.scan ? pipeline.scan.status === 'completed' : manifestExists;
    const extractCompleted = pipeline.extract_symbols ? pipeline.extract_symbols.status === 'completed' : symbolsExists;
    const graphCompleted = pipeline.build_graph ? pipeline.build_graph.status === 'completed' : graphExists;

    // IMPROVED: ready=true if ALL core artifacts exist (physical evidence trumps state.json)
    // This tolerates state.json update delays at end of run
    const ready = Boolean(manifestExists && symbolsExists && graphExists && moduleJsons.length > 0);

    details.push({
      slug,
      ready,
      checks: {
        scan_completed: scanCompleted,
        extract_completed: extractCompleted,
        graph_completed: graphCompleted,
        manifest_exists: manifestExists,
        symbols_exists: symbolsExists,
        graph_exists: graphExists,
        module_profiles_count: moduleJsons.length,
      },
    });
  }

  return {
    available: details.length > 0 || Boolean(globalState),
    ready: details.some((item) => item.ready),
    details,
  };
}

function evaluateRuntimeState() {
  const runtimeState = readJsonSafe(path.join(RUNTIME_ROOT, 'state.json'));
  const runtimeRegistry = readJsonSafe(path.join(RUNTIME_ROOT, 'registry.json'));
  const slugSet = new Set(listDirSafe(REQUIREMENT_ROOT).filter((name) => fs.existsSync(path.join(REQUIREMENT_ROOT, name))));
  if (runtimeState && runtimeState.modules && typeof runtimeState.modules === 'object') {
    for (const slug of Object.keys(runtimeState.modules)) slugSet.add(slug);
  }
  if (runtimeRegistry && runtimeRegistry.modules && typeof runtimeRegistry.modules === 'object') {
    for (const slug of Object.keys(runtimeRegistry.modules)) slugSet.add(slug);
  }

  const slugs = [...slugSet];
  const details = [];

  for (const slug of slugs) {
    const functionalMap = path.join(REQUIREMENT_ROOT, slug, 'functional-map', 'functional-map.md');
    const flowsDir = path.join(REQUIREMENT_ROOT, slug, 'flows');
    const flows = listDirSafe(flowsDir).filter((f) => /^flow-.*\.json$/i.test(f));
    const sitemap = path.join(RUNTIME_ROOT, 'observations', slug, 'sitemap.json');

    const hasFunctionalMap = fs.existsSync(functionalMap);
    const hasFlows = flows.length > 0;
    const hasSitemap = fs.existsSync(sitemap);
    
    // IMPROVED: ready=true if both functional-map AND flows exist (physical evidence)
    // Sitemap is optional; both documented artifacts suffice
    const ready = Boolean(hasFunctionalMap && hasFlows);

    details.push({
      slug,
      ready,
      checks: {
        functional_map_exists: hasFunctionalMap,
        flow_files_count: flows.length,
        sitemap_exists: hasSitemap,
      },
    });
  }

  return {
    available: details.length > 0 || Boolean(runtimeState || runtimeRegistry),
    ready: details.some((item) => item.ready),
    details,
  };
}

function countKnowledgeMarkdown() {
  let count = 0;

  function walk(dirPath) {
    const entries = listDirSafe(dirPath);
    for (const entry of entries) {
      const full = path.join(dirPath, entry);
      if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith('.md')) {
        count += 1;
      }
    }
  }

  if (fs.existsSync(KNOWLEDGE_ROOT)) {
    walk(KNOWLEDGE_ROOT);
  }
  return count;
}

function evaluateKnowledgeState() {
  const state = readJsonSafe(path.join(KNOWLEDGE_ROOT, 'state.json'));
  const index = readJsonSafe(path.join(KNOWLEDGE_ROOT, 'index.json'));
  const registry = readJsonSafe(path.join(KNOWLEDGE_ROOT, 'registry.json'));
  const mdCount = countKnowledgeMarkdown();
  const documentsCount = (() => {
    if (!state || typeof state !== 'object') return 0;

    if (Array.isArray(state.documents)) return state.documents.length;
    if (state.documents && typeof state.documents === 'object') return Object.keys(state.documents).length;

    if (Array.isArray(state.files)) return state.files.length;
    if (state.files && typeof state.files === 'object') return Object.keys(state.files).length;

    if (Array.isArray(state.ingested_files)) return state.ingested_files.length;
    if (state.ingested_files && typeof state.ingested_files === 'object') return Object.keys(state.ingested_files).length;

    return 0;
  })();

  const status = state && (state.status || state.state || state.phase_status || state.pipeline_status);
  const completed = status === 'completed' || status === 'completed_with_errors';

  // IMPROVED: ready=true if markdown documents exist (physical evidence)
  // or state explicitly says completed. Tolerates state.json update delays
  const ready = Boolean(mdCount > 0 || documentsCount > 0 || completed);

  return {
    available: Boolean(state || index || registry || mdCount > 0 || documentsCount > 0),
    ready,
    checks: {
      state_exists: Boolean(state),
      index_exists: Boolean(index),
      registry_exists: Boolean(registry),
      state_status: status || null,
      ingested_markdown_count: mdCount,
      documents_count: documentsCount,
    },
  };
}

function expectednessForDoc(docName, lifecycle) {
  const rule = DOC_RULES[docName] || { mode: 'manual-template' };

  if (rule.mode === 'knowledge-always') {
    if (!lifecycle.knowledge.ready) {
      return {
        expected: false,
        level: 'not-applicable-yet',
        reason: 'knowledge pipeline is not ready (missing or incomplete ingestion state)',
      };
    }
    return {
      expected: true,
      level: 'expected',
      reason: 'knowledge synthesize should generate this document',
    };
  }

  if (rule.mode === 'code-required') {
    if (!lifecycle.code.ready) {
      return {
        expected: false,
        level: 'not-applicable-yet',
        reason: 'code pipeline is not ready (scan/extract/graph/modules prerequisites are incomplete)',
      };
    }
    return {
      expected: true,
      level: 'expected',
      reason: 'code synthesize should generate this document',
    };
  }

  if (rule.mode === 'runtime-required') {
    if (!lifecycle.runtime.ready) {
      return {
        expected: false,
        level: 'not-applicable-yet',
        reason: 'runtime pipeline is not ready (functional-map and flow recordings are missing)',
      };
    }
    return {
      expected: true,
      level: 'expected',
      reason: 'runtime synthesize should generate this document',
    };
  }

  if (rule.mode === 'code-or-knowledge-conditional') {
    if (lifecycle.code.ready) {
      return {
        expected: true,
        level: 'expected',
        reason: 'code synthesize should generate this document',
      };
    }
    if (lifecycle.knowledge.ready) {
      return {
        expected: false,
        level: 'conditional',
        reason: 'knowledge synthesize generates this only when sufficient source coverage exists',
      };
    }
    return {
      expected: false,
      level: 'not-applicable-yet',
      reason: 'neither code-ready nor knowledge-ready prerequisites are satisfied',
    };
  }

  if (rule.mode === 'runtime-or-knowledge-conditional') {
    if (lifecycle.runtime.ready) {
      return {
        expected: true,
        level: 'expected',
        reason: 'runtime synthesize should generate this document',
      };
    }
    if (lifecycle.knowledge.ready) {
      return {
        expected: false,
        level: 'conditional',
        reason: 'knowledge synthesize generates this only when testing-related sources were ingested',
      };
    }
    return {
      expected: false,
      level: 'not-applicable-yet',
      reason: 'runtime prerequisites are missing and knowledge is not ready',
    };
  }

  return {
    expected: false,
    level: 'manual-template',
    reason: 'canonical template file not guaranteed to be auto-generated by discovery pipelines',
  };
}

function validateFoundationDocs(lifecycle) {
  const canonicalDocs = listDirSafe(TEMPLATE_DIR).filter((name) => name.endsWith('.md')).sort();
  const foundDocs = listDirSafe(FOUNDATION_DOCS_DIR)
    .filter((name) => name.endsWith('.md'))
    .filter((name) => !/^validation-lifecycle\.(md|json)$/i.test(name))
    .sort();

  const unexpected = foundDocs.filter((name) => !canonicalDocs.includes(name));
  const results = [];

  for (const docName of canonicalDocs) {
    const fullPath = path.join(FOUNDATION_DOCS_DIR, docName);
    const exists = fs.existsSync(fullPath);
    const expectation = expectednessForDoc(docName, lifecycle);

    if (!exists) {
      results.push({
        document: docName,
        status: expectation.expected ? 'missing-expected' : `missing-${expectation.level}`,
        reason: expectation.reason,
        expected: expectation.expected,
      });
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const parsed = parseFrontmatter(content);
    const missingKeys = [];

    if (!parsed.hasFrontmatter) {
      results.push({
        document: docName,
        status: 'present-invalid',
        reason: 'missing YAML frontmatter',
        expected: expectation.expected,
      });
      continue;
    }

    for (const key of REQUIRED_FRONTMATTER_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(parsed.metadata, key)) {
        missingKeys.push(key);
      }
    }

    if (missingKeys.length > 0) {
      results.push({
        document: docName,
        status: 'present-invalid',
        reason: `missing required frontmatter keys: ${missingKeys.join(', ')}`,
        expected: expectation.expected,
      });
      continue;
    }

    results.push({
      document: docName,
      status: 'present-valid',
      reason: 'document exists and required C1 metadata is present',
      expected: expectation.expected,
    });
  }

  return {
    canonical_count: canonicalDocs.length,
    found_count: foundDocs.length,
    unexpected_documents: unexpected,
    documents: results,
  };
}

function visualMarkerForStatus(status) {
  if (status === 'present-valid') return '✅';
  if (status === 'missing-expected' || status === 'present-invalid' || status === 'unexpected-document') return '❌';
  return '⚠️';
}

function visualMarkerForReady(value) {
  return value ? '✅' : '❌';
}

function buildSummary(report) {
  const docs = report.foundation.documents;
  const byStatus = {};
  for (const item of docs) {
    byStatus[item.status] = (byStatus[item.status] || 0) + 1;
  }

  const isAgentScoped = Boolean(report.validation_scope && report.validation_scope.agent);
  const agent = isAgentScoped ? report.validation_scope.agent : '';
  const blockingIssues = docs.filter((item) => {
    const isStructuralProblem = item.status === 'missing-expected' || item.status === 'present-invalid';
    if (!isStructuralProblem) {
      return false;
    }
    if (!isAgentScoped) {
      return true;
    }
    const owners = DOC_OWNERS[item.document] || [];
    return owners.includes(agent);
  });

  if (!isAgentScoped && report.foundation.unexpected_documents.length > 0) {
    for (const fileName of report.foundation.unexpected_documents) {
      blockingIssues.push({ document: fileName, status: 'unexpected-document', reason: 'file is not in canonical foundational_context templates' });
    }
  }

  return {
    by_status: byStatus,
    blocking_issues: blockingIssues,
    blocking_count: blockingIssues.length,
  };
}

function buildMarkdownReport(report) {
  const lines = [];

  lines.push('# Discovery Lifecycle Validation');
  lines.push('');
  lines.push(`**Generated:** ${new Date(report.generated_at).toLocaleString()}`);
  if (report.validation_scope && report.validation_scope.mode === 'agent-incremental') {
    lines.push(`**Scope:** Agent-incremental (${report.validation_scope.agent})`);
  } else {
    lines.push('**Scope:** Full lifecycle');
  }
  lines.push('');

  const isClean = report.summary.blocking_count === 0;
  const statusEmoji = isClean ? '✅' : '❌';
  const statusText = isClean ? 'PASSED' : 'FAILED';
  lines.push(`## ${statusEmoji} Validation Status: ${statusText}`);
  lines.push('');
  lines.push(`- **Blocking Issues:** ${report.summary.blocking_count}`);
  lines.push(`- **Valid Documents:** ${report.foundation.documents.filter((x) => x.status === 'present-valid').length}/${report.foundation.canonical_count}`);
  if (report.foundation.unexpected_documents.length > 0) {
    lines.push(`- **Unexpected Documents:** ${report.foundation.unexpected_documents.length}`);
  }
  lines.push('');

  lines.push('## Pipeline Status');
  lines.push('');
  lines.push('| Component | Status |');
  lines.push('|-----------|--------|');
  lines.push(`| Code | ${visualMarkerForReady(report.lifecycle.code.ready)} ready=${report.lifecycle.code.ready} |`);
  lines.push(`| Runtime | ${visualMarkerForReady(report.lifecycle.runtime.ready)} ready=${report.lifecycle.runtime.ready} |`);
  lines.push(`| Knowledge | ${visualMarkerForReady(report.lifecycle.knowledge.ready)} ready=${report.lifecycle.knowledge.ready} |`);
  lines.push('');

  lines.push('## Foundation Documents');
  lines.push('');

  const docsByStatus = {};
  for (const item of report.foundation.documents) {
    const key = item.status;
    if (!docsByStatus[key]) docsByStatus[key] = [];
    docsByStatus[key].push(item);
  }

  if (docsByStatus['present-valid'] && docsByStatus['present-valid'].length > 0) {
    lines.push('### ✅ Valid & Ready');
    lines.push('');
    for (const item of docsByStatus['present-valid']) {
      lines.push(`- **${item.document}**`);
    }
    lines.push('');
  }

  if (docsByStatus['present-invalid'] && docsByStatus['present-invalid'].length > 0) {
    lines.push('### ❌ Invalid (Metadata Issues)');
    lines.push('');
    for (const item of docsByStatus['present-invalid']) {
      lines.push(`- **${item.document}** — ${item.reason}`);
    }
    lines.push('');
  }

  if (docsByStatus['missing-expected'] && docsByStatus['missing-expected'].length > 0) {
    lines.push('### ❌ Missing (Expected)');
    lines.push('');
    for (const item of docsByStatus['missing-expected']) {
      lines.push(`- **${item.document}** — ${item.reason}`);
    }
    lines.push('');
  }

  const notApplicable = [
    ...(docsByStatus['missing-not-applicable-yet'] || []),
    ...(docsByStatus['missing-manual-template'] || []),
    ...(docsByStatus['missing-conditional'] || []),
  ];
  if (notApplicable.length > 0) {
    lines.push('### ⚠️ Not Applicable');
    lines.push('');
    for (const item of notApplicable) {
      lines.push(`- **${item.document}** — ${item.reason}`);
    }
    lines.push('');
  }

  if (report.foundation.unexpected_documents.length > 0) {
    lines.push('### ⚠️ Unexpected Documents');
    lines.push('');
    lines.push('These exist in .foundation but are not in canonical templates:');
    lines.push('');
    for (const fileName of report.foundation.unexpected_documents) {
      lines.push(`- **${fileName}**`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function main() {
  if (requestedAgent && !['discovery-code', 'discovery-knowledge', 'discovery-runtime'].includes(requestedAgent)) {
    console.error(`Invalid --agent value: ${requestedAgent}`);
    process.exit(1);
  }

  const lifecycle = {
    code: evaluateCodeState(),
    runtime: evaluateRuntimeState(),
    knowledge: evaluateKnowledgeState(),
  };

  const foundation = validateFoundationDocs(lifecycle);
  const report = {
    generated_at: new Date().toISOString(),
    validator_version: '1.0.0',
    validation_scope: requestedAgent
      ? { mode: 'agent-incremental', agent: requestedAgent }
      : { mode: 'full-lifecycle', agent: null },
    lifecycle,
    foundation,
  };
  report.summary = buildSummary(report);

  fs.mkdirSync(VALIDATION_DIR, { recursive: true });
  const jsonPath = path.join(VALIDATION_DIR, 'validation-lifecycle.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  if (writeMd) {
    const mdPath = path.join(VALIDATION_DIR, 'validation-lifecycle.md');
    fs.writeFileSync(mdPath, buildMarkdownReport(report), 'utf8');
  }

  console.log(JSON.stringify({
    status: report.summary.blocking_count > 0 ? 'failed' : 'passed',
    validation_scope: report.validation_scope,
    report: '.discovery/validation/validation-lifecycle.json',
    markdown_report: writeMd ? '.discovery/validation/validation-lifecycle.md' : null,
    blocking_count: report.summary.blocking_count,
    by_status: report.summary.by_status,
  }, null, 2));

  if (failOnIssues && report.summary.blocking_count > 0) {
    process.exit(2);
  }
}

main();
