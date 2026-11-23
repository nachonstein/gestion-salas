#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const slug = process.argv[2] || '';
const phase = process.argv[3] || '';

if (!slug || !phase) {
  console.error('Usage: node validator.js <slug> <observe|flows>');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..', '..', '..');
const OBS_DIR = path.join(ROOT, '.discovery', 'runtime', 'observations', slug);
const FLOWS_DIR = path.join(ROOT, '.requirement', slug, 'flows');

function assert(errors, condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

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

function existsRelativeToObs(relPath) {
  return fs.existsSync(path.join(OBS_DIR, relPath));
}

function validateObserve() {
  const errors = [];
  const warnings = [];
  const checks = {};

  assert(errors, fs.existsSync(OBS_DIR), `observations directory does not exist: ${OBS_DIR}`);
  const sitemapPath = path.join(OBS_DIR, 'sitemap.json');
  const sitemap = readJson(sitemapPath, 'sitemap', errors);
  if (!sitemap) {
    return { ok: false, errors, warnings, checks };
  }

  assert(errors, sitemap.slug === slug, 'sitemap.slug must match runtime slug');
  assert(errors, typeof sitemap.base_url === 'string' && sitemap.base_url.length > 0, 'sitemap.base_url must be non-empty string');
  assert(errors, Array.isArray(sitemap.pages), 'sitemap.pages must be an array');
  assert(errors, typeof sitemap.total_pages === 'number', 'sitemap.total_pages must be a number');
  assert(errors, typeof sitemap.total_routes_attempted === 'number', 'sitemap.total_routes_attempted must be a number');

  const successfulPages = (sitemap.pages || []).filter((p) => !p.error);
  assert(errors, sitemap.total_pages === successfulPages.length, 'sitemap.total_pages must equal count of pages without error');
  assert(errors, sitemap.total_routes_attempted === (sitemap.pages || []).length, 'sitemap.total_routes_attempted must equal pages.length');

  for (const page of successfulPages) {
    assert(errors, typeof page.route === 'string', 'page.route must be string');
    assert(errors, typeof page.screenshot === 'string' && page.screenshot.length > 0, 'successful page must include screenshot path');
    if (typeof page.screenshot === 'string') {
      assert(errors, existsRelativeToObs(page.screenshot), `missing screenshot: ${page.screenshot}`);
    }

    // Derive expected dom files from route slug contract used in observe-app.js
    const routeSlug = String(page.route || '/').replace(/^\//, '').replace(/[#\/]/g, '-').replace(/^-/, '') || 'home';
    const domHtml = path.join(OBS_DIR, 'doms', `${routeSlug}.html`);
    const domJson = path.join(OBS_DIR, 'doms', `${routeSlug}.json`);
    assert(errors, fs.existsSync(domHtml), `missing DOM html snapshot: doms/${routeSlug}.html`);
    assert(errors, fs.existsSync(domJson), `missing DOM json snapshot: doms/${routeSlug}.json`);
  }

  checks.pages_total = (sitemap.pages || []).length;
  checks.pages_success = successfulPages.length;
  checks.routes_attempted = sitemap.total_routes_attempted;

  return { ok: errors.length === 0, errors, warnings, checks };
}

function validateFlows() {
  const errors = [];
  const warnings = [];
  const checks = {};

  const indexPath = path.join(FLOWS_DIR, 'flows-index.json');
  const index = readJson(indexPath, 'flows-index', errors);
  if (!index) {
    return { ok: false, errors, warnings, checks };
  }

  assert(errors, index.slug === slug, 'flows-index.slug must match runtime slug');
  assert(errors, typeof index.base_url === 'string' && index.base_url.length > 0, 'flows-index.base_url must be non-empty string');
  assert(errors, typeof index.total_flows === 'number', 'flows-index.total_flows must be a number');
  assert(errors, typeof index.completed === 'number', 'flows-index.completed must be a number');
  assert(errors, typeof index.errors === 'number', 'flows-index.errors must be a number');
  assert(errors, Array.isArray(index.flows), 'flows-index.flows must be an array');
  assert(errors, index.total_flows === (index.flows || []).length, 'flows-index.total_flows must equal flows.length');
  assert(errors, index.completed + index.errors === index.total_flows, 'flows-index completed + errors must equal total_flows');

  for (const flow of index.flows || []) {
    assert(errors, typeof flow.name === 'string' && flow.name.length > 0, 'flow entry name must be non-empty string');
    assert(errors, ['completed', 'error'].includes(flow.status), 'flow entry status must be completed|error');

    if (flow.status === 'completed') {
      const flowPath = path.join(FLOWS_DIR, `flow-${flow.name}.json`);
      const flowRecord = readJson(flowPath, `flow-${flow.name}`, errors);
      if (!flowRecord) continue;

      assert(errors, flowRecord.name === flow.name, `flow-${flow.name}.json name must match`);
      assert(errors, Array.isArray(flowRecord.steps), `flow-${flow.name}.json steps must be an array`);
      assert(errors, flowRecord.steps.length > 0, `flow-${flow.name}.json must contain at least one step`);
      assert(errors, flowRecord.outcome === 'completed', `flow-${flow.name}.json outcome must be completed`);

      for (const step of flowRecord.steps || []) {
        if (typeof step.screenshot === 'string' && step.screenshot.length > 0) {
          assert(errors, existsRelativeToObs(step.screenshot), `missing flow step screenshot: ${step.screenshot}`);
        }
      }
    }
  }

  checks.flows_total = index.total_flows;
  checks.flows_completed = index.completed;
  checks.flows_errors = index.errors;

  return { ok: errors.length === 0, errors, warnings, checks };
}

const validators = {
  observe: validateObserve,
  flows: validateFlows,
};

if (!validators[phase]) {
  console.error(`Unknown runtime validation phase: ${phase}`);
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
