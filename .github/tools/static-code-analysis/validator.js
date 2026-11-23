#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const slug = process.argv[2] || '';
const phase = process.argv[3] || '';

if (!slug || !phase) {
  console.error('Usage: node validator.js <SLUG> <scan|extract|resolver|graph|reports>');
  process.exit(1);
}

const codebaseRoot = path.join(repoRoot, '.discovery', 'code');
const scanDir = path.join(codebaseRoot, 'scans', slug);
const symbolsDir = path.join(codebaseRoot, 'symbols', slug);
const graphDir = path.join(codebaseRoot, 'graph', slug);
const modulesDir = path.join(codebaseRoot, 'modules', slug);
const reportsDir = path.join(codebaseRoot, 'reports', slug);

const paths = {
  manifest: path.join(scanDir, 'scan-manifest.json'),
  state: path.join(scanDir, 'state.json'),
  resolver: path.join(scanDir, 'resolver-angularjs.json'),
  symbolsIndex: path.join(symbolsDir, 'index.json'),
  edges: path.join(graphDir, 'edges.json'),
  summaryReport: path.join(reportsDir, 'summary.md'),
  depsReport: path.join(reportsDir, 'dependencies.md'),
  apiReport: path.join(reportsDir, 'api-surface.md'),
};

function readJson(filePath, label, errors) {
  if (!fs.existsSync(filePath)) {
    errors.push(`${label}: file not found at ${filePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${label}: invalid JSON (${error.message})`);
    return null;
  }
}

function assert(errors, condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function validateScan() {
  const errors = [];
  const warnings = [];
  const manifest = readJson(paths.manifest, 'scan-manifest', errors);
  const state = readJson(paths.state, 'state', errors);

  if (!manifest || !state) {
    return { ok: false, errors, warnings, checks: {} };
  }

  assert(errors, manifest.module_slug === slug, 'scan-manifest.module_slug must match slug');
  assert(errors, typeof manifest.version === 'number', 'scan-manifest.version must be a number');
  assert(errors, typeof manifest.root === 'string' && manifest.root.length > 0, 'scan-manifest.root must be a non-empty string');
  assert(errors, fs.existsSync(manifest.root), 'scan-manifest.root path must exist');

  assert(errors, Array.isArray(manifest.frameworks), 'scan-manifest.frameworks must be an array');
  assert(errors, Array.isArray(manifest.features), 'scan-manifest.features must be an array');
  assert(errors, Array.isArray(manifest.routes), 'scan-manifest.routes must be an array');

  const fileBuckets = ['source_files', 'test_files', 'config_files', 'mock_files', 'i18n_files', 'enum_files', 'annotated_files'];
  assert(errors, isObject(manifest.files), 'scan-manifest.files must be an object');
  let computedTotal = 0;
  if (isObject(manifest.files)) {
    for (const bucket of fileBuckets) {
      assert(errors, isStringArray(manifest.files[bucket]), `scan-manifest.files.${bucket} must be string[]`);
      computedTotal += Array.isArray(manifest.files[bucket]) ? manifest.files[bucket].length : 0;
    }
  }
  assert(errors, typeof manifest.total_files === 'number', 'scan-manifest.total_files must be a number');
  if (typeof manifest.total_files === 'number') {
    assert(errors, manifest.total_files === computedTotal, 'scan-manifest.total_files must equal the sum of files buckets');
  }

  for (const route of manifest.routes || []) {
    assert(errors, typeof route.state === 'string' && route.state.length > 0, 'route.state must be non-empty');
    assert(errors, route.url === null || typeof route.url === 'string', 'route.url must be string|null');
    assert(errors, route.template === null || typeof route.template === 'string', 'route.template must be string|null');
    assert(errors, Array.isArray(route.lazy_contexts), 'route.lazy_contexts must be an array');
  }

  assert(errors, state.module_slug === slug, 'state.module_slug must match slug');
  assert(errors, isObject(state.pipeline), 'state.pipeline must be an object');
  assert(errors, isObject(state.pipeline && state.pipeline.scan), 'state.pipeline.scan must exist');
  if (isObject(state.pipeline && state.pipeline.scan)) {
    assert(errors, state.pipeline.scan.status === 'completed', 'state.pipeline.scan.status must be completed');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checks: {
      total_files: manifest.total_files,
      features: (manifest.features || []).length,
      routes: (manifest.routes || []).length,
    },
  };
}

function validateExtract() {
  const errors = [];
  const warnings = [];
  const index = readJson(paths.symbolsIndex, 'symbols-index', errors);
  const manifest = readJson(paths.manifest, 'scan-manifest', errors);

  if (!index || !manifest) {
    return { ok: false, errors, warnings, checks: {} };
  }

  assert(errors, index.module_slug === slug, 'symbols/index.module_slug must match slug');
  assert(errors, typeof index.version === 'number', 'symbols/index.version must be a number');
  assert(errors, Array.isArray(index.symbols), 'symbols/index.symbols must be an array');
  assert(errors, typeof index.total_files === 'number', 'symbols/index.total_files must be a number');
  assert(errors, typeof index.total_symbols === 'number', 'symbols/index.total_symbols must be a number');

  if (Array.isArray(index.symbols)) {
    assert(errors, index.symbols.length === index.total_symbols, 'symbols/index.total_symbols must equal symbols.length');
  }

  assert(errors, isObject(index.by_source), 'symbols/index.by_source must be an object');
  for (const key of ['tree-sitter', 'deterministic-parse', 'text-extract', 'resolver', 'llm']) {
    assert(errors, typeof (index.by_source || {})[key] === 'number', `symbols/index.by_source.${key} must be a number`);
  }

  const symbolFiles = fs.existsSync(symbolsDir)
    ? fs.readdirSync(symbolsDir).filter((entry) => entry.endsWith('.json') && entry !== 'index.json')
    : [];

  assert(errors, symbolFiles.length === index.total_files, 'symbols/index.total_files must equal number of per-file symbol JSON files');

  let perFileSymbolsTotal = 0;
  for (const fileName of symbolFiles) {
    const fileData = readJson(path.join(symbolsDir, fileName), `symbols/${fileName}`, errors);
    if (!fileData) continue;
    assert(errors, typeof fileData.file === 'string' && fileData.file.length > 0, `symbols/${fileName}.file must be non-empty string`);
    assert(errors, Array.isArray(fileData.symbols), `symbols/${fileName}.symbols must be an array`);
    perFileSymbolsTotal += Array.isArray(fileData.symbols) ? fileData.symbols.length : 0;
    for (const symbol of fileData.symbols || []) {
      assert(errors, typeof symbol.id === 'string' && symbol.id.length > 0, `symbols/${fileName}: symbol.id must be non-empty`);
      assert(errors, typeof symbol.file === 'string' && symbol.file.length > 0, `symbols/${fileName}: symbol.file must be non-empty`);
      assert(errors, typeof symbol.kind === 'string' && symbol.kind.length > 0, `symbols/${fileName}: symbol.kind must be non-empty`);
      assert(errors, typeof symbol.name === 'string', `symbols/${fileName}: symbol.name must be string`);
      assert(errors, Number.isInteger(symbol.line) && symbol.line > 0, `symbols/${fileName}: symbol.line must be integer > 0`);
      assert(errors, typeof symbol.source === 'string' && symbol.source.length > 0, `symbols/${fileName}: symbol.source must be non-empty`);
    }
  }

  assert(errors, perFileSymbolsTotal === index.total_symbols, 'sum of per-file symbols must equal symbols/index.total_symbols');

  const fileBuckets = ['source_files', 'test_files', 'config_files', 'mock_files', 'i18n_files', 'enum_files', 'annotated_files'];
  const expectedFiles = new Set(fileBuckets.flatMap((bucket) => manifest.files && Array.isArray(manifest.files[bucket]) ? manifest.files[bucket] : []));
  const actualFiles = new Set();
  for (const fileName of symbolFiles) {
    const fileData = readJson(path.join(symbolsDir, fileName), `symbols/${fileName}`, errors);
    if (fileData && typeof fileData.file === 'string') {
      actualFiles.add(fileData.file);
    }
  }
  assert(errors, expectedFiles.size === actualFiles.size, 'parsed files count must match manifest files count');
  for (const file of expectedFiles) {
    assert(errors, actualFiles.has(file), `missing symbols output for file ${file}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checks: {
      files: index.total_files,
      symbols: index.total_symbols,
      tree_sitter_symbols: (index.by_source || {})['tree-sitter'] || 0,
    },
  };
}

function validateResolver() {
  const errors = [];
  const warnings = [];
  const manifest = readJson(paths.manifest, 'scan-manifest', errors);
  const resolver = readJson(paths.resolver, 'resolver-angularjs', errors);

  if (!manifest || !resolver) {
    return { ok: false, errors, warnings, checks: {} };
  }

  assert(errors, resolver.module_slug === slug, 'resolver.module_slug must match slug');
  assert(errors, typeof resolver.version === 'number', 'resolver.version must be a number');
  assert(errors, resolver.resolver === 'angularjs-static', 'resolver.resolver must be angularjs-static');
  assert(errors, Array.isArray(resolver.platform_services), 'resolver.platform_services must be an array');
  assert(errors, isObject(resolver.module_profiles), 'resolver.module_profiles must be an object');
  assert(errors, Array.isArray(resolver.additional_edges), 'resolver.additional_edges must be an array');

  for (const edge of resolver.additional_edges || []) {
    assert(errors, typeof edge.source === 'string' && edge.source.length > 0, 'resolver additional edge source must be non-empty string');
    assert(errors, typeof edge.target === 'string' && edge.target.length > 0, 'resolver additional edge target must be non-empty string');
    assert(errors, typeof edge.type === 'string' && edge.type.length > 0, 'resolver additional edge type must be non-empty string');
  }

  const manifestFeatures = new Set(manifest.features || []);
  for (const featureName of Object.keys(resolver.module_profiles || {})) {
    if (!manifestFeatures.has(featureName)) {
      warnings.push(`resolver module profile ${featureName} is not listed in manifest.features`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checks: {
      module_profiles: Object.keys(resolver.module_profiles || {}).length,
      additional_edges: (resolver.additional_edges || []).length,
      platform_services: (resolver.platform_services || []).length,
    },
  };
}

function validateGraph() {
  const errors = [];
  const warnings = [];
  const graph = readJson(paths.edges, 'edges', errors);
  const index = readJson(paths.symbolsIndex, 'symbols-index', errors);

  if (!graph || !index) {
    return { ok: false, errors, warnings, checks: {} };
  }

  assert(errors, graph.module_slug === slug, 'edges.module_slug must match slug');
  assert(errors, typeof graph.version === 'number', 'edges.version must be a number');
  assert(errors, Array.isArray(graph.edges), 'edges.edges must be an array');
  assert(errors, typeof graph.total_edges === 'number', 'edges.total_edges must be a number');
  if (Array.isArray(graph.edges)) {
    assert(errors, graph.edges.length === graph.total_edges, 'edges.total_edges must equal edges.length');
  }

  assert(errors, isObject(graph.by_type), 'edges.by_type must be an object');
  assert(errors, isObject(graph.by_confidence), 'edges.by_confidence must be an object');

  let byTypeSum = 0;
  for (const value of Object.values(graph.by_type || {})) {
    assert(errors, typeof value === 'number', 'edges.by_type values must be numeric');
    byTypeSum += typeof value === 'number' ? value : 0;
  }
  assert(errors, byTypeSum === graph.total_edges, 'sum(edges.by_type) must equal edges.total_edges');

  for (const edge of graph.edges || []) {
    assert(errors, typeof edge.source === 'string' && edge.source.length > 0, 'edge.source must be non-empty string');
    assert(errors, typeof edge.target === 'string' && edge.target.length > 0, 'edge.target must be non-empty string');
    assert(errors, typeof edge.type === 'string' && edge.type.length > 0, 'edge.type must be non-empty string');
    assert(errors, typeof edge.confidence === 'string' && edge.confidence.length > 0, 'edge.confidence must be non-empty string');
    assert(errors, Array.isArray(edge.sources), 'edge.sources must be an array');
  }

  if ((index.total_symbols || 0) > 0 && graph.total_edges === 0) {
    warnings.push('graph has 0 edges while symbols index has symbols > 0');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checks: {
      total_edges: graph.total_edges,
      edge_types: Object.keys(graph.by_type || {}).length,
    },
  };
}

function validateReports() {
  const errors = [];
  const warnings = [];
  const manifest = readJson(paths.manifest, 'scan-manifest', errors);

  if (!manifest) {
    return { ok: false, errors, warnings, checks: {} };
  }

  const requiredReports = [
    { key: 'summary', filePath: paths.summaryReport, heading: '# Static code analysis summary' },
    { key: 'dependencies', filePath: paths.depsReport, heading: '# Feature dependency report' },
    { key: 'api', filePath: paths.apiReport, heading: '# API surface report' },
  ];

  for (const report of requiredReports) {
    if (!fs.existsSync(report.filePath)) {
      errors.push(`missing report file: ${report.filePath}`);
      continue;
    }
    const content = fs.readFileSync(report.filePath, 'utf8');
    assert(errors, content.trim().length > 0, `${report.key} report must be non-empty`);
    assert(errors, content.includes(report.heading), `${report.key} report must include heading ${report.heading}`);
  }

  const features = manifest.features || [];
  for (const feature of features) {
    const modulePath = path.join(modulesDir, `${feature}.json`);
    const moduleData = readJson(modulePath, `modules/${feature}.json`, errors);
    if (!moduleData) continue;
    assert(errors, moduleData.feature === feature, `modules/${feature}.json feature field must match file name`);
    assert(errors, isObject(moduleData.graph_summary), `modules/${feature}.json must include graph_summary object`);
    if (isObject(moduleData.graph_summary)) {
      assert(errors, typeof moduleData.graph_summary.total_edges === 'number', `modules/${feature}.json graph_summary.total_edges must be a number`);
      assert(errors, isObject(moduleData.graph_summary.outgoing), `modules/${feature}.json graph_summary.outgoing must be an object`);
      assert(errors, isObject(moduleData.graph_summary.incoming), `modules/${feature}.json graph_summary.incoming must be an object`);
    }
  }

  const moduleFiles = fs.existsSync(modulesDir)
    ? fs.readdirSync(modulesDir).filter((entry) => entry.endsWith('.json'))
    : [];
  if (moduleFiles.length !== features.length) {
    warnings.push(`modules count (${moduleFiles.length}) differs from manifest.features count (${features.length})`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checks: {
      module_reports: features.length,
      markdown_reports: requiredReports.length,
    },
  };
}

const validators = {
  scan: validateScan,
  extract: validateExtract,
  resolver: validateResolver,
  graph: validateGraph,
  reports: validateReports,
};

if (!validators[phase]) {
  console.error(`Unknown validation phase: ${phase}`);
  process.exit(1);
}

const result = validators[phase]();
const output = {
  slug,
  phase,
  status: result.ok ? 'passed' : 'failed',
  validated_at: new Date().toISOString(),
  validator_version: '1.0.0',
  checks: result.checks,
  warnings: result.warnings,
  errors: result.errors,
};

console.log(JSON.stringify(output, null, 2));
process.exit(result.ok ? 0 : 2);
