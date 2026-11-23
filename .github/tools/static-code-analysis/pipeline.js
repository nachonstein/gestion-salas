#!/usr/bin/env node
/**
 * SCA Pipeline — deterministic orchestrator for all extraction tools.
 *
 * Runs the full static code analysis pipeline in order:
 *   1. scan-repo.js       → scan-manifest.json
 *   2. batch-extract-all.js → symbols/*.json + index.json
 *   3. <framework>-resolve.js → resolver-<framework>.json (if framework detected and resolver exists)
 *   4. build-graph.js      → graph/SLUG/edges.json
 *   5. generate-modules-reports.js → modules/SLUG/*.json + reports/SLUG/*.md
 *
 * Usage:
 *   node .github/tools/static-code-analysis/pipeline.js <SOURCE_DIR> <SLUG>
 *   node .github/tools/static-code-analysis/pipeline.js   (uses defaults from scan-manifest)
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const repoRoot = process.cwd();
const toolsDir = path.join(repoRoot, '.github', 'tools', 'static-code-analysis');
const sourceDir = process.argv[2] || '';
const slugArg = process.argv[3] || '';

if (!sourceDir) {
  console.error('Usage: node pipeline.js <SOURCE_DIR> [SLUG]');
  process.exit(1);
}

const slug = slugArg || path.basename(sourceDir);
const scanDir = path.join(repoRoot, '.discovery', 'code', 'scans', slug);
const statePath = path.join(scanDir, 'state.json');

function run(label, script, args) {
  const scriptPath = path.join(toolsDir, script);
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ ${label}: script not found: ${scriptPath}`);
    process.exit(1);
  }
  console.log(`\n⏳ ${label}...`);
  const start = Date.now();
  try {
    const output = execFileSync('node', [scriptPath, ...args], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'inherit'],
      maxBuffer: 50 * 1024 * 1024,
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    // Parse JSON output if available
    try {
      const result = JSON.parse(output);
      console.log(`✅ ${label} (${elapsed}s)`, JSON.stringify(result, null, 2).slice(0, 500));
    } catch (_) {
      console.log(`✅ ${label} (${elapsed}s)`);
    }
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`❌ ${label} failed (${elapsed}s): ${err.message}`);
    process.exit(1);
  }
}

function updateValidationStatus(phase, validation) {
  let state = { version: 1, module_slug: slug, pipeline: {}, file_hashes: {}, validation_status: {} };
  if (fs.existsSync(statePath)) {
    try {
      state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch (_) {
      state = { version: 1, module_slug: slug, pipeline: {}, file_hashes: {}, validation_status: {} };
    }
  }
  state.validation_status = state.validation_status || {};
  state.validation_status[phase] = validation;
  fs.mkdirSync(scanDir, { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function runValidation(phase) {
  const scriptPath = path.join(toolsDir, 'validator.js');
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Validation script not found: ${scriptPath}`);
    process.exit(1);
  }

  console.log(`\n🔍 Validate ${phase} artifacts...`);
  const start = Date.now();
  try {
    const output = execFileSync('node', [scriptPath, slug, phase], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'inherit'],
      maxBuffer: 20 * 1024 * 1024,
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const result = JSON.parse(output);
    updateValidationStatus(phase, result);
    console.log(`✅ Validation ${phase} (${elapsed}s)`);
    return result;
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const failed = {
      slug,
      phase,
      status: 'failed',
      validated_at: new Date().toISOString(),
      validator_version: '1.0.0',
      checks: {},
      warnings: [],
      errors: [err.message],
    };

    if (err.stdout) {
      try {
        const parsed = JSON.parse(String(err.stdout));
        Object.assign(failed, parsed);
      } catch (_) {
        failed.errors.push(String(err.stdout));
      }
    }

    updateValidationStatus(phase, failed);
    console.error(`❌ Validation ${phase} failed (${elapsed}s)`);
    process.exit(1);
  }
}

// ── Step 1: Scan repo ─────────────────────────────────────────────
run('Scan repo', 'scan-repo.js', [sourceDir, slug]);
runValidation('scan');

// ── Step 2: Extract symbols ───────────────────────────────────────
run('Extract symbols', 'batch-extract-all.js', [slug]);
runValidation('extract');

// ── Step 3: Framework resolvers (run any matching resolver) ───
const manifestPath = path.join(repoRoot, '.discovery/code', 'scans', slug, 'scan-manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const frameworks = (manifest.frameworks || []).map(f => f.toLowerCase());

  // Map framework names to resolver scripts
  const resolverMap = {
    'angularjs': 'angularjs-resolve.js',
  };

  let resolverRan = false;
  for (const [framework, script] of Object.entries(resolverMap)) {
    const scriptPath = path.join(toolsDir, script);
    if (!fs.existsSync(scriptPath)) continue;
    if (frameworks.some(f => f.includes(framework))) {
      run(`${framework} resolver`, script, [slug]);
      resolverRan = true;
      runValidation('resolver');  
    }
  }
  if (!resolverRan) {
    console.log('\n⏭️  No framework resolvers matched — skipping');
    updateValidationStatus('resolver', {
      slug,
      phase: 'resolver',
      status: 'skipped',
      validated_at: new Date().toISOString(),
      validator_version: '1.0.0',
      checks: {},
      warnings: ['validation skipped because no framework resolver matched'],
      errors: [],
    });
  }
} else {
  console.log('\n⚠️  No scan-manifest.json found — skipping resolvers');
  updateValidationStatus('resolver', {
    slug,
    phase: 'resolver',
    status: 'skipped',
    validated_at: new Date().toISOString(),
    validator_version: '1.0.0',
    checks: {},
    warnings: ['validation skipped because scan-manifest.json was not found'],
    errors: [],
  });
}

// ── Step 4: Build graph ───────────────────────────────────────────
run('Build graph', 'build-graph.js', [slug]);
runValidation('graph');

// ── Step 5: Generate module reports ───────────────────────────────
run('Generate modules & reports', 'generate-modules-reports.js', [slug]);
runValidation('reports');

// ── Summary ───────────────────────────────────────────────────────
const scaRoot = path.join(repoRoot, '.discovery/code');
const stats = {
  slug,
  symbols: fs.readdirSync(path.join(scaRoot, 'symbols', slug)).filter(f => f.endsWith('.json') && f !== 'index.json').length,
  features: fs.readdirSync(path.join(scaRoot, 'modules', slug)).filter(f => f.endsWith('.json')).length,
  reports: fs.readdirSync(path.join(scaRoot, 'reports', slug)).filter(f => f.endsWith('.md')).length,
};

try {
  const edges = JSON.parse(fs.readFileSync(path.join(scaRoot, 'graph', slug, 'edges.json'), 'utf8'));
  stats.edges = edges.total_edges;
  stats.edge_types = edges.by_type;
} catch (_) {}

console.log('\n══════════════════════════════════════════');
console.log('✅ SCA Pipeline complete');
console.log(JSON.stringify(stats, null, 2));
