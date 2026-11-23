#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Parser = require('tree-sitter');

const GRAMMAR_MAP = {
  '.js': 'tree-sitter-javascript',
  '.jsx': 'tree-sitter-javascript',
  '.mjs': 'tree-sitter-javascript',
  '.cjs': 'tree-sitter-javascript',
  '.ts': 'tree-sitter-typescript',
  '.tsx': 'tree-sitter-typescript',
  '.py': 'tree-sitter-python',
  '.go': 'tree-sitter-go',
  '.rs': 'tree-sitter-rust',
  '.java': 'tree-sitter-java',
  '.rb': 'tree-sitter-ruby',
  '.c': 'tree-sitter-c',
  '.h': 'tree-sitter-c',
  '.cpp': 'tree-sitter-cpp',
  '.hpp': 'tree-sitter-cpp',
  '.cc': 'tree-sitter-cpp',
  '.cs': 'tree-sitter-c-sharp',
  '.html': 'tree-sitter-html',
  '.css': 'tree-sitter-css',
};

// TypeScript grammar uses a sub-module for tsx vs ts
const TS_SUBGRAMMAR = {
  '.ts': 'typescript',
  '.tsx': 'tsx',
};

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node ts-parse.js <filepath>');
  process.exit(1);
}

const ext = path.extname(filePath).toLowerCase();
const grammarName = GRAMMAR_MAP[ext];
if (!grammarName) {
  console.log(JSON.stringify({ error: 'no-grammar', ext }));
  process.exit(0);
}

function loadLanguage(moduleName, ext) {
  const mod = require(moduleName);
  // tree-sitter-typescript exports { typescript, tsx }
  if (TS_SUBGRAMMAR[ext] && mod[TS_SUBGRAMMAR[ext]]) {
    return mod[TS_SUBGRAMMAR[ext]];
  }
  return mod.nodeTypeInfo ? mod : (mod.language || mod);
}

function lineOfIndex(source, index) {
  return source.slice(0, index).split('\n').length;
}

function preview(source, node) {
  return source.slice(node.startIndex, Math.min(node.startIndex + 220, node.endIndex)).replace(/\s+/g, ' ').trim();
}

function parseInSegments(parser, source) {
  try {
    return [{ tree: parser.parse(source), source, lineOffset: 0 }];
  } catch (error) {
    if (!/Invalid argument/i.test(String(error && error.message))) {
      throw error;
    }
  }

  const lines = source.split('\n');
  const segments = [];
  var chunk = [];
  var chunkSize = 0;
  var lineOffset = 0;

  function flush() {
    if (!chunk.length) return;
    const chunkSource = chunk.join('\n');
    segments.push({
      tree: parser.parse(chunkSource),
      source: chunkSource,
      lineOffset: lineOffset,
    });
    lineOffset += chunk.length;
    chunk = [];
    chunkSize = 0;
  }

  for (const line of lines) {
    if (chunkSize + line.length + 1 > 30000) {
      flush();
    }
    chunk.push(line);
    chunkSize += line.length + 1;
  }
  flush();
  return segments;
}

// -- Generic symbol extractors (work with any JS/TS/Python/Go/etc.) --

function extractJsSymbols(tree, source, lineOffset) {
  const symbolTypes = new Set([
    'function_declaration',
    'method_definition',
    'call_expression',
    'assignment_expression',
    'variable_declarator',
    'class_declaration',
    // TypeScript additions
    'interface_declaration',
    'type_alias_declaration',
    'enum_declaration',
  ]);
  const symbols = [];

  function getName(node) {
    if (node.type === 'call_expression') {
      const fnNode = node.childForFieldName('function') || node.firstNamedChild;
      return fnNode ? source.slice(fnNode.startIndex, fnNode.endIndex) : '(call)';
    }
    if (node.type === 'assignment_expression') {
      const leftNode = node.childForFieldName('left') || node.firstNamedChild;
      return leftNode ? source.slice(leftNode.startIndex, leftNode.endIndex) : '(assignment)';
    }
    if (node.type === 'variable_declarator') {
      const nameNode = node.childForFieldName('name') || node.firstNamedChild;
      return nameNode ? source.slice(nameNode.startIndex, nameNode.endIndex) : '(variable)';
    }
    const nameNode = node.childForFieldName('name') || node.firstNamedChild;
    return nameNode ? source.slice(nameNode.startIndex, nameNode.endIndex) : '(anonymous)';
  }

  function walk(node) {
    if (symbolTypes.has(node.type)) {
      symbols.push({
        type: node.type,
        name: getName(node),
        start: node.startPosition.row + 1 + lineOffset,
        end: node.endPosition.row + 1 + lineOffset,
        text_preview: preview(source, node),
      });
    }
    for (var i = 0; i < node.childCount; i++) {
      walk(node.child(i));
    }
  }

  walk(tree.rootNode);
  return symbols;
}

function extractPythonSymbols(tree, source, lineOffset) {
  const symbolTypes = new Set([
    'function_definition',
    'class_definition',
    'call',
    'assignment',
    'decorated_definition',
    'import_statement',
    'import_from_statement',
  ]);
  const symbols = [];

  function getName(node) {
    if (node.type === 'call') {
      const fnNode = node.childForFieldName('function') || node.firstNamedChild;
      return fnNode ? source.slice(fnNode.startIndex, fnNode.endIndex) : '(call)';
    }
    if (node.type === 'assignment') {
      const leftNode = node.childForFieldName('left') || node.firstNamedChild;
      return leftNode ? source.slice(leftNode.startIndex, leftNode.endIndex) : '(assignment)';
    }
    if (node.type === 'decorated_definition') {
      // Get the inner function/class name
      for (var i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child.type === 'function_definition' || child.type === 'class_definition') {
          const nameNode = child.childForFieldName('name');
          return nameNode ? source.slice(nameNode.startIndex, nameNode.endIndex) : '(decorated)';
        }
      }
      return '(decorated)';
    }
    if (node.type === 'import_statement' || node.type === 'import_from_statement') {
      return source.slice(node.startIndex, node.endIndex).split('\n')[0].slice(0, 100);
    }
    const nameNode = node.childForFieldName('name') || node.firstNamedChild;
    return nameNode ? source.slice(nameNode.startIndex, nameNode.endIndex) : '(anonymous)';
  }

  function walk(node) {
    if (symbolTypes.has(node.type)) {
      symbols.push({
        type: node.type,
        name: getName(node),
        start: node.startPosition.row + 1 + lineOffset,
        end: node.endPosition.row + 1 + lineOffset,
        text_preview: preview(source, node),
      });
    }
    for (var i = 0; i < node.childCount; i++) {
      walk(node.child(i));
    }
  }

  walk(tree.rootNode);
  return symbols;
}

function extractGenericSymbols(tree, source, lineOffset) {
  // Generic extractor for Go, Java, C#, Rust, C/C++, Ruby, etc.
  const symbolTypes = new Set([
    // Go
    'function_declaration', 'method_declaration', 'type_declaration',
    // Java / C#
    'class_declaration', 'interface_declaration', 'method_declaration',
    'constructor_declaration', 'enum_declaration',
    // Rust
    'function_item', 'struct_item', 'enum_item', 'impl_item', 'trait_item',
    // C / C++
    'function_definition', 'struct_specifier', 'class_specifier',
    // Ruby
    'method', 'class', 'module',
    // Common
    'call_expression',
  ]);
  const symbols = [];

  function getName(node) {
    const nameNode = node.childForFieldName('name') || node.firstNamedChild;
    if (nameNode) {
      return source.slice(nameNode.startIndex, nameNode.endIndex);
    }
    return source.slice(node.startIndex, Math.min(node.startIndex + 60, node.endIndex)).replace(/\s+/g, ' ').trim();
  }

  function walk(node) {
    if (symbolTypes.has(node.type)) {
      symbols.push({
        type: node.type,
        name: getName(node),
        start: node.startPosition.row + 1 + lineOffset,
        end: node.endPosition.row + 1 + lineOffset,
        text_preview: preview(source, node),
      });
    }
    for (var i = 0; i < node.childCount; i++) {
      walk(node.child(i));
    }
  }

  walk(tree.rootNode);
  return symbols;
}

// -- AngularJS-specific extractors (only used when AngularJS is detected) --

function extractAngularRegistrations(source) {
  const registrations = [];
  // Generic angular.module().controller/factory/service/directive pattern
  const genericPattern = /(?:angular\.module\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*\.ngModule|[A-Za-z_$][A-Za-z0-9_$]*)\.(controller|factory|service|directive)\(\s*['"]([^'"]+)['"]\s*,\s*\[([\s\S]*?)function\s*\(([^)]*)\)/g;
  var match;
  while ((match = genericPattern.exec(source)) !== null) {
    const deps = [...match[3].matchAll(/['"]([^'"]+)['"]/g)].map(function(item) { return item[1]; });
    registrations.push({
      type: 'angular_registration',
      kind: 'angular_registration',
      registration_kind: match[1],
      name: match[2],
      di_dependencies: deps,
      function_params: match[4].split(',').map(function(item) { return item.trim(); }).filter(Boolean),
      line: lineOfIndex(source, match.index),
      text_preview: match[0].slice(0, 220).replace(/\s+/g, ' ').trim(),
    });
  }

  const lifecycle = /(?:angular\.module\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*\.ngModule|[A-Za-z_$][A-Za-z0-9_$]*)\.(run|config)\(\s*\[([\s\S]*?)function\s*\(([^)]*)\)/g;
  while ((match = lifecycle.exec(source)) !== null) {
    const deps = [...match[2].matchAll(/['"]([^'"]+)['"]/g)].map(function(item) { return item[1]; });
    registrations.push({
      type: 'angular_registration',
      kind: 'angular_registration',
      registration_kind: match[1],
      name: match[1],
      di_dependencies: deps,
      function_params: match[3].split(',').map(function(item) { return item.trim(); }).filter(Boolean),
      line: lineOfIndex(source, match.index),
      text_preview: match[0].slice(0, 220).replace(/\s+/g, ' ').trim(),
    });
  }

  return registrations;
}

function extractScopeAssignments(source) {
  return [...source.matchAll(/\$scope\.([A-Za-z0-9_]+)\s*=\s*function\s*\(([^)]*)\)/g)].map(function(match) {
    return {
      type: 'scope_assignment',
      kind: 'scope_assignment',
      name: '$scope.' + match[1],
      scope_property: match[1],
      parameters: match[2].split(',').map(function(item) { return item.trim(); }).filter(Boolean),
      line: lineOfIndex(source, match.index),
      text_preview: match[0].slice(0, 200).replace(/\s+/g, ' ').trim(),
    };
  });
}

function extractStateTransitions(source) {
  return [...source.matchAll(/\$state\.go\(\s*['"]([^'"]+)['"]/g)].map(function(match) {
    return {
      type: 'state_transition',
      kind: 'state_transition',
      name: match[1],
      line: lineOfIndex(source, match.index),
      text_preview: match[0],
    };
  });
}

function extractApiUrls(source) {
  return [...source.matchAll(/(?:var|let|const)\s+(URL_[A-Z0-9_]+)\s*=\s*['"]([^'"]+)['"]/g)].map(function(match) {
    return {
      type: 'api_url',
      kind: 'api_url',
      name: match[1],
      url_template: match[2],
      line: lineOfIndex(source, match.index),
      text_preview: match[0],
    };
  });
}

function extractHttpCalls(source, apiUrls) {
  const urlMap = Object.fromEntries(apiUrls.map(function(item) { return [item.name, item.url_template]; }));
  // Generic HTTP service call patterns
  const patterns = [
    /\$http\.(get|post|put|delete|patch)\s*\(\s*([A-Za-z0-9_]+)/g,
    /(?:[A-Za-z_$][A-Za-z0-9_$]*)(?:\[['"]([A-Za-z]+)['"]\]|\.(get|post|put|delete|patch))\s*\(\s*([A-Za-z0-9_]+)/g,
  ];
  const calls = [];
  for (const regex of patterns) {
    var match;
    while ((match = regex.exec(source)) !== null) {
      const method = (match[1] || match[2] || 'get').toUpperCase();
      const urlVar = match[3] || match[2] || '';
      calls.push({
        type: 'http_call',
        kind: 'http_call',
        name: method,
        http_method: method,
        url_variable: urlVar,
        url_template: urlMap[urlVar] || null,
        line: lineOfIndex(source, match.index),
        text_preview: match[0],
      });
    }
  }
  return calls;
}

function extractRouteStates(source) {
  const routes = [];
  const stateStartRegex = /\.state\(\s*['"]([^'"]+)['"]\s*,\s*{/g;
  const matches = [...source.matchAll(stateStartRegex)];
  for (var i = 0; i < matches.length; i++) {
    const match = matches[i];
    const start = match.index;
    const end = i + 1 < matches.length ? matches[i + 1].index : source.length;
    const block = source.slice(start, end);
    routes.push({
      type: 'route_state',
      kind: 'route_state',
      name: match[1],
      url: (block.match(/url:\s*['"]([^'"]+)['"]/) || [])[1] || null,
      template: (block.match(/template:\s*require\(['"](.+?)['"]\)/) || [])[1] || null,
      lazy_contexts: [...block.matchAll(/require\.context\(\s*['"](.+?)['"]/g)].map(function(item) { return item[1]; }),
      line: lineOfIndex(source, start),
      text_preview: block.slice(0, 220).replace(/\s+/g, ' ').trim(),
    });
  }
  return routes;
}

function extractCssDependencies(source) {
  return [...source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)]
    .map(function(match) { return match[1]; })
    .filter(function(value) { return value.endsWith('.css') || value.includes('static'); })
    .map(function(value, index) {
      return {
        type: 'css_dependency',
        kind: 'css_dependency',
        name: value,
        line: index + 1,
      };
    });
}

function extractHtmlSymbols(tree, source, lineOffset) {
  const symbols = [];
  function walk(node) {
    if (node.type === 'element') {
      const openTag = node.childForFieldName('start_tag') || node.firstNamedChild;
      const name = openTag ? preview(source, openTag).split(/\s+/)[0].replace('<', '') : 'element';
      symbols.push({
        type: 'html_element',
        name: name,
        start: node.startPosition.row + 1 + lineOffset,
        end: node.endPosition.row + 1 + lineOffset,
        text_preview: preview(source, node),
      });
    }
    for (var i = 0; i < node.childCount; i++) {
      walk(node.child(i));
    }
  }
  walk(tree.rootNode);
  return symbols;
}

function extractHtmlBindings(source) {
  const bindings = [];
  const patterns = [
    { regex: /\b(?:data-)?ng-controller="([^"]+)"/g, kind: 'ng_controller' },
    { regex: /\b(?:data-)?ng-click="([^"]+)"/g, kind: 'ng_click' },
    { regex: /\b(?:data-)?ng-model="([^"]+)"/g, kind: 'ng_model' },
    { regex: /\b(?:data-)?ng-init="([^"]+)"/g, kind: 'ng_init' },
    { regex: /\bui-sref="([^"]+)"/g, kind: 'ui_sref' },
    { regex: /\bdata-translate>([^<]+)</g, kind: 'translate_key' },
  ];

  for (const item of patterns) {
    var match;
    while ((match = item.regex.exec(source)) !== null) {
      bindings.push({
        type: item.kind,
        kind: item.kind,
        name: match[1].trim(),
        line: lineOfIndex(source, match.index),
        text_preview: match[0].slice(0, 180),
      });
    }
  }

  return bindings;
}

function extractCssSelectors(source) {
  return [...new Set([...source.matchAll(/\.([A-Za-z_-][A-Za-z0-9_-]*)/g)].map(function(match) { return match[1]; }))].map(function(name) {
    return {
      type: 'css_selector',
      kind: 'css_selector',
      name: name,
      line: 1,
    };
  });
}

// -- Detect if AngularJS is in use (check scan-manifest if available) --

function isAngularJSProject() {
  // Check via environment or scan-manifest
  const slug = process.env.SCA_SLUG;
  if (slug) {
    const manifestPath = path.join(process.cwd(), '.discovery/code/scans', slug, 'scan-manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        return (manifest.frameworks || []).some(function(f) { return f.toLowerCase().includes('angularjs'); });
      } catch (_) {}
    }
  }
  // Fallback: check if the source looks like AngularJS
  return false;
}

var angularJSDetected = isAngularJSProject();

// -- Main --

var language;
try {
  language = loadLanguage(grammarName, ext);
} catch (error) {
  console.log(JSON.stringify({ error: 'grammar-not-installed', grammar: grammarName }));
  process.exit(0);
}

const parser = new Parser();
parser.setLanguage(language);

const source = fs.readFileSync(filePath, 'utf8');
const parsedSegments = parseInSegments(parser, source);
const output = {
  file: filePath,
  language: ext,
  symbols: [],
};

if (ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs' || ext === '.ts' || ext === '.tsx') {
  output.symbols = parsedSegments.flatMap(function(segment) { return extractJsSymbols(segment.tree, segment.source, segment.lineOffset); });

  // AngularJS-specific extractions: only run when AngularJS is detected or source contains AngularJS patterns
  if (angularJSDetected || source.includes('angular.module') || source.includes('.controller(') || source.includes('$scope.') || source.includes('ngModule')) {
    output.angular_registrations = extractAngularRegistrations(source);
    output.scope_assignments = extractScopeAssignments(source);
    output.state_transitions = extractStateTransitions(source);
    output.api_urls = extractApiUrls(source);
    output.http_calls = extractHttpCalls(source, output.api_urls);
    output.route_states = path.basename(filePath) === 'app.js' ? extractRouteStates(source) : [];
    output.css_dependencies = path.basename(filePath) === 'index.js' ? extractCssDependencies(source) : [];
  }
}

if (ext === '.py' || ext === '.pyi') {
  output.symbols = parsedSegments.flatMap(function(segment) { return extractPythonSymbols(segment.tree, segment.source, segment.lineOffset); });
}

if (['.go', '.rs', '.java', '.cs', '.rb', '.c', '.h', '.cpp', '.hpp', '.cc'].includes(ext)) {
  output.symbols = parsedSegments.flatMap(function(segment) { return extractGenericSymbols(segment.tree, segment.source, segment.lineOffset); });
}

if (ext === '.html' || ext === '.htm') {
  output.symbols = parsedSegments.flatMap(function(segment) { return extractHtmlSymbols(segment.tree, segment.source, segment.lineOffset); });
  // Only extract AngularJS bindings if relevant
  if (angularJSDetected || source.includes('ng-') || source.includes('ui-sref') || source.includes('data-translate')) {
    output.ng_bindings = extractHtmlBindings(source);
  }
}

if (ext === '.css' || ext === '.scss' || ext === '.sass' || ext === '.less') {
  output.symbols = extractCssSelectors(source);
}

console.log(JSON.stringify(output, null, 2));
