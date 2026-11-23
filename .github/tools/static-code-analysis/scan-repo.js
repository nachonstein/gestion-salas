#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const sourceRoot = path.resolve(process.argv[2] || '.');
const slug = process.argv[3] || path.basename(sourceRoot);
const now = new Date().toISOString();

const codebaseRoot = path.join(repoRoot, '.discovery/code');
const scansDir = path.join(codebaseRoot, 'scans', slug);
const symbolsDir = path.join(codebaseRoot, 'symbols', slug);
const graphDir = path.join(codebaseRoot, 'graph', slug);
const modulesDir = path.join(codebaseRoot, 'modules', slug);
const reportsDir = path.join(codebaseRoot, 'reports', slug);
const repomixDir = path.join(codebaseRoot, 'scans', slug);
const registryPath = path.join(codebaseRoot, 'registry.json');

const EXCLUDED_DIRS = new Set([
  '.git',
  '.github',
  '.discovery',
  '.foundation',
  '.requirement',
  'node_modules',
  '__pycache__',
  '.venv',
  'venv',
  'env',
  '.tox',
  'dist',
  'build',
  'out',
  'target',
  'bin',
  'obj',
  'test-results',
  'coverage',
  '.next',
  '.nuxt',
  'vendor',
]);

const ROOT_DIR_IGNORES = new Set(['css', 'test', 'tests', 'dist', 'build', 'assets', 'public', 'static']);

const PARSEABLE_EXTS = new Set([
  // JavaScript / TypeScript
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  // Python
  '.py', '.pyi',
  // Java / Kotlin
  '.java', '.kt', '.kts',
  // C# / .NET
  '.cs',
  // Go
  '.go',
  // Rust
  '.rs',
  // C / C++
  '.c', '.h', '.cpp', '.hpp', '.cc', '.hh',
  // Ruby
  '.rb',
  // PHP
  '.php',
  // Swift
  '.swift',
  // Scala
  '.scala',
  // Shell
  '.sh', '.bash', '.zsh',
  // Web
  '.html', '.htm', '.css', '.scss', '.sass', '.less', '.vue', '.svelte',
  // Data / Config
  '.json', '.yml', '.yaml', '.xml', '.xsd', '.toml',
  // Docs / Text
  '.txt', '.md',
  // SQL
  '.sql',
]);

for (const dir of [scansDir, symbolsDir, graphDir, modulesDir, reportsDir, repomixDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeRel(value) {
  return value.replace(/\\/g, '/');
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function pathIfExists(absPath) {
  return fs.existsSync(absPath) ? absPath : null;
}

function relIfExists(absPath) {
  return absPath && fs.existsSync(absPath) ? normalizeRel(path.relative(sourceRoot, absPath)) : null;
}

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return null;
  }
}

function walk(dir, outDirs, outFiles) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }
    const abs = path.join(dir, entry.name);
    const rel = normalizeRel(path.relative(sourceRoot, abs));
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue;
      }
      outDirs.push(rel);
      walk(abs, outDirs, outFiles);
      continue;
    }
    outFiles.push(rel);
  }
}

// -- Package / module discovery (language-agnostic) --

function discoverPackageRoots() {
  const roots = [];
  // Node.js / JS projects
  if (pathIfExists(path.join(sourceRoot, 'package.json'))) {
    roots.push('');
  }
  // Python projects
  if (pathIfExists(path.join(sourceRoot, 'pyproject.toml')) || pathIfExists(path.join(sourceRoot, 'setup.py')) || pathIfExists(path.join(sourceRoot, 'setup.cfg'))) {
    if (!roots.includes('')) roots.push('');
  }
  // Java / Kotlin projects
  if (pathIfExists(path.join(sourceRoot, 'pom.xml')) || pathIfExists(path.join(sourceRoot, 'build.gradle')) || pathIfExists(path.join(sourceRoot, 'build.gradle.kts'))) {
    if (!roots.includes('')) roots.push('');
  }
  // C# / .NET projects
  const csprojFiles = fs.readdirSync(sourceRoot).filter(function(f) { return f.endsWith('.csproj') || f.endsWith('.sln'); });
  if (csprojFiles.length) {
    if (!roots.includes('')) roots.push('');
  }
  // Go projects
  if (pathIfExists(path.join(sourceRoot, 'go.mod'))) {
    if (!roots.includes('')) roots.push('');
  }
  // Rust projects
  if (pathIfExists(path.join(sourceRoot, 'Cargo.toml'))) {
    if (!roots.includes('')) roots.push('');
  }

  // Sub-packages (monorepo detection)
  for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || EXCLUDED_DIRS.has(entry.name)) {
      continue;
    }
    const packageDir = path.join(sourceRoot, entry.name);
    const dirEntries = fs.readdirSync(packageDir);
    const hasManifest =
      pathIfExists(path.join(packageDir, 'package.json')) ||
      pathIfExists(path.join(packageDir, 'pyproject.toml')) ||
      pathIfExists(path.join(packageDir, 'setup.py')) ||
      pathIfExists(path.join(packageDir, 'pom.xml')) ||
      pathIfExists(path.join(packageDir, 'build.gradle')) ||
      pathIfExists(path.join(packageDir, 'build.gradle.kts')) ||
      pathIfExists(path.join(packageDir, 'Cargo.toml')) ||
      pathIfExists(path.join(packageDir, 'go.mod')) ||
      dirEntries.some(function(f) { return f.endsWith('.csproj'); });
    if (hasManifest) {
      roots.push(entry.name);
    }
  }
  return uniqueSorted(roots);
}

function packageDirName(packageDir) {
  return packageDir ? path.basename(packageDir) : path.basename(sourceRoot);
}

function packageAliases(packageDir, pkg) {
  const aliases = new Set([packageDirName(packageDir)]);
  if (!pkg || !pkg.name) {
    return [...aliases];
  }

  aliases.add(pkg.name);
  // Handle scoped packages (@scope/name -> name)
  if (pkg.name.includes('/')) {
    aliases.add(pkg.name.split('/')[1]);
  }

  return [...aliases].filter(Boolean);
}

function findFeatureDirs(srcDir) {
  if (!fs.existsSync(srcDir)) return [];
  return fs.readdirSync(srcDir, { withFileTypes: true })
    .filter(function(entry) { return entry.isDirectory() && !ROOT_DIR_IGNORES.has(entry.name); })
    .map(function(entry) { return entry.name; })
    .sort();
}

function buildFeaturePackages(packageInfos) {
  return packageInfos
    .flatMap(function(info) {
      const srcDir = path.join(sourceRoot, info.package_dir, 'src');
      if (!fs.existsSync(srcDir)) return [];
      return findFeatureDirs(srcDir).map(function(feature) {
        return {
          feature: feature,
          package_dir: info.package_dir,
          package_name: info.package_json && info.package_json.name ? info.package_json.name : info.dirName,
          prefix: normalizeRel(path.join(info.package_dir, 'src', feature)),
        };
      });
    })
    .sort(function(a, b) { return a.feature.localeCompare(b.feature); });
}

function buildAliasMap(packageInfos) {
  const aliasMap = new Map();
  for (const info of packageInfos) {
    for (const alias of info.aliases) {
      aliasMap.set(alias, info.package_dir);
    }
  }
  return aliasMap;
}

function resolvePackageImport(importPath, baseFileRel, aliasMap) {
  if (!importPath) return null;
  const normalized = normalizeRel(importPath).replace(/\/+$/, '');

  // Handle scoped packages (@scope/name/path)
  if (normalized.startsWith('@')) {
    const parts = normalized.split('/');
    const scopedName = parts[0] + '/' + parts[1];
    const subPath = parts.slice(2).join('/');
    const unscoped = parts[1];
    if (aliasMap.has(unscoped)) {
      const packageDir = aliasMap.get(unscoped);
      const relPath = normalizeRel(path.join(packageDir, subPath));
      return relPath;
    }
    if (aliasMap.has(scopedName)) {
      const packageDir = aliasMap.get(scopedName);
      const relPath = normalizeRel(path.join(packageDir, subPath));
      return relPath;
    }
    return normalized;
  }

  if (normalized.startsWith('./') || normalized.startsWith('../')) {
    const baseDir = normalizeRel(path.dirname(baseFileRel));
    return normalizeRel(path.normalize(path.join(baseDir, normalized)));
  }

  if (normalized.startsWith('src/')) {
    return normalized;
  }

  return normalized;
}

function inferFeatureFromPath(relPath) {
  if (!relPath || relPath.startsWith('@')) return null;

  const moduleMatch = relPath.match(/(?:^|\/)src\/([^/]+)(?:\/|$)/);
  if (moduleMatch && !ROOT_DIR_IGNORES.has(moduleMatch[1])) {
    return moduleMatch[1];
  }

  return null;
}

// -- Framework detection (auto-detect, never hardcode) --

function detectFrameworks(files, packageInfos) {
  const frameworks = [];

  // Collect all package.json dependencies
  const allDeps = new Set();
  for (const info of packageInfos) {
    if (!info.package_json) continue;
    for (const key of ['dependencies', 'devDependencies', 'peerDependencies']) {
      if (info.package_json[key]) {
        for (const dep of Object.keys(info.package_json[key])) {
          allDeps.add(dep);
        }
      }
    }
  }

  // Check for pyproject.toml / setup.py dependencies
  const pyprojectContent = readIfExists(path.join(sourceRoot, 'pyproject.toml'));

  // JavaScript / TypeScript frameworks
  if (allDeps.has('@angular/core')) frameworks.push('angular');
  if (allDeps.has('react') || allDeps.has('react-dom')) frameworks.push('react');
  if (allDeps.has('vue') || allDeps.has('@vue/core')) frameworks.push('vue');
  if (allDeps.has('svelte')) frameworks.push('svelte');
  if (allDeps.has('next')) frameworks.push('nextjs');
  if (allDeps.has('nuxt') || allDeps.has('nuxt3')) frameworks.push('nuxt');
  if (allDeps.has('express')) frameworks.push('express');
  if (allDeps.has('fastify')) frameworks.push('fastify');
  if (allDeps.has('nestjs') || allDeps.has('@nestjs/core')) frameworks.push('nestjs');
  if (allDeps.has('jquery')) frameworks.push('jquery');

  // AngularJS detection (legacy) - angular without @angular/core
  if (allDeps.has('angular') && !allDeps.has('@angular/core')) {
    frameworks.push('angularjs');
  }
  // Also check source code for AngularJS patterns
  if (!frameworks.includes('angularjs')) {
    for (const file of files.slice(0, 200)) {
      if (!file.endsWith('.js')) continue;
      const absPath = path.join(sourceRoot, file);
      if (!fs.existsSync(absPath)) continue;
      const content = readIfExists(absPath);
      if (content.includes('angular.module') || content.includes('.controller(') || content.includes('$stateProvider')) {
        frameworks.push('angularjs');
        break;
      }
    }
  }

  // AngularJS sub-frameworks
  if (frameworks.includes('angularjs')) {
    if (allDeps.has('angular-ui-router') || allDeps.has('@uirouter/angularjs')) frameworks.push('ui-router');
    if (allDeps.has('oclazyload')) frameworks.push('ocLazyLoad');
    if (allDeps.has('angular-gettext')) frameworks.push('gettext');
  }

  // Python frameworks
  for (const source of [pyprojectContent, readIfExists(path.join(sourceRoot, 'requirements.txt')), readIfExists(path.join(sourceRoot, 'setup.py')), readIfExists(path.join(sourceRoot, 'Pipfile'))]) {
    if (/\bdjango\b/i.test(source) && !frameworks.includes('django')) frameworks.push('django');
    if (/\bflask\b/i.test(source) && !frameworks.includes('flask')) frameworks.push('flask');
    if (/\bfastapi\b/i.test(source) && !frameworks.includes('fastapi')) frameworks.push('fastapi');
    if (/\bstarlette\b/i.test(source) && !frameworks.includes('starlette')) frameworks.push('starlette');
    if (/\baiohttp\b/i.test(source) && !frameworks.includes('aiohttp')) frameworks.push('aiohttp');
  }

  // Java / Kotlin
  const pomContent = readIfExists(path.join(sourceRoot, 'pom.xml'));
  const gradleContent = readIfExists(path.join(sourceRoot, 'build.gradle')) || readIfExists(path.join(sourceRoot, 'build.gradle.kts'));
  if (pomContent.includes('spring-boot') || gradleContent.includes('spring-boot')) frameworks.push('spring-boot');
  if (pomContent.includes('quarkus') || gradleContent.includes('quarkus')) frameworks.push('quarkus');
  if (pomContent.includes('micronaut') || gradleContent.includes('micronaut')) frameworks.push('micronaut');

  // C# / .NET
  for (const f of fs.readdirSync(sourceRoot).filter(function(f) { return f.endsWith('.csproj'); })) {
    const csprojContent = readIfExists(path.join(sourceRoot, f));
    if (csprojContent.includes('Microsoft.AspNetCore') || csprojContent.includes('Microsoft.NET.Sdk.Web')) { if (!frameworks.includes('aspnet')) frameworks.push('aspnet'); }
    if (csprojContent.includes('Blazor')) { if (!frameworks.includes('blazor')) frameworks.push('blazor'); }
  }

  // Go
  const goModContent = readIfExists(path.join(sourceRoot, 'go.mod'));
  if (goModContent.includes('gin-gonic')) frameworks.push('gin');
  if (goModContent.includes('gorilla/mux')) frameworks.push('gorilla');
  if (goModContent.includes('labstack/echo')) frameworks.push('echo');
  if (goModContent.includes('gofiber/fiber')) frameworks.push('fiber');

  // Rust
  const cargoContent = readIfExists(path.join(sourceRoot, 'Cargo.toml'));
  if (cargoContent.includes('actix-web')) frameworks.push('actix');
  if (cargoContent.includes('rocket')) frameworks.push('rocket');
  if (cargoContent.includes('axum')) frameworks.push('axum');

  return uniqueSorted(frameworks);
}

// -- Route collection (AngularJS ui-router -- only used when AngularJS detected) --

function collectRoutes(appSource, appRelPath, aliasMap) {
  const routes = [];
  const stateStartRegex = /\.state\(\s*['"]([^'"]+)['"]\s*,\s*{/g;
  const matches = [...appSource.matchAll(stateStartRegex)];

  for (let index = 0; index < matches.length; index++) {
    const match = matches[index];
    const blockStart = match.index;
    const blockEnd = index + 1 < matches.length ? matches[index + 1].index : appSource.length;
    const block = appSource.slice(blockStart, blockEnd);
    const templateRaw = (block.match(/template:\s*require\(['"](.+?)['"]\)/) || [])[1] || null;
    const template = templateRaw ? resolvePackageImport(templateRaw, appRelPath, aliasMap) : null;
    const lazyContexts = uniqueSorted(
      [...block.matchAll(/require\.context\(\s*['"](.+?)['"]/g)].map(function(item) {
        return resolvePackageImport(item[1], appRelPath, aliasMap);
      })
    );

    routes.push({
      state: match[1],
      url: (block.match(/url:\s*['"]([^'"]+)['"]/) || [])[1] || null,
      template: template,
      lazy_contexts: lazyContexts,
      feature: inferFeatureFromPath(template) || lazyContexts.map(inferFeatureFromPath).find(Boolean) || null,
    });
  }

  return routes;
}

function collectCssDependencies(indexSource, indexRelPath, aliasMap) {
  return uniqueSorted(
    [...indexSource.matchAll(/require\(\s*['"]([^'"]+?)['"]\s*\)/g)]
      .map(function(item) { return resolvePackageImport(item[1], indexRelPath, aliasMap); })
      .filter(function(value) { return value && (value.endsWith('.css') || value.includes('static')); })
  );
}

// -- File classification --

function classifyFile(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  if (ext === '.txt') return 'annotated_files';
  if (ext === '.json' && /\/lang\/.+\.json$/i.test(relPath)) return 'i18n_files';
  if (ext === '.json' && /\/(?:locale|i18n|translations?)\/.+\.json$/i.test(relPath)) return 'i18n_files';
  if (ext === '.json' && /\/enum\/.+\.json$/i.test(relPath)) return 'enum_files';
  if (/\/(?:test|tests|__tests__|spec)\//i.test(relPath) ||
      /\.(?:spec|test)\.[^.]+$/i.test(relPath) ||
      /(?:Spec|Test)\.[^.]+$/i.test(relPath) ||
      relPath.startsWith('test/') || relPath.startsWith('tests/')) return 'test_files';
  if (/\/(?:mocks?|__mocks__|fixtures?|stubs?)\//i.test(relPath)) return 'mock_files';
  if (/(^|\/)(?:conf|config)\//i.test(relPath) ||
      path.basename(relPath) === 'package.json' ||
      path.basename(relPath) === 'tsconfig.json' ||
      path.basename(relPath) === 'pyproject.toml' ||
      path.basename(relPath) === 'pom.xml' ||
      path.basename(relPath) === 'Cargo.toml' ||
      path.basename(relPath) === 'go.mod' ||
      ['.yml', '.yaml', '.xml', '.xsd', '.toml'].includes(ext)) {
    return 'config_files';
  }
  return 'source_files';
}

function languageName(ext) {
  const map = {
    '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
    '.ts': 'typescript', '.tsx': 'typescript',
    '.py': 'python', '.pyi': 'python',
    '.java': 'java',
    '.kt': 'kotlin', '.kts': 'kotlin',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.c': 'c', '.h': 'c',
    '.cpp': 'cpp', '.hpp': 'cpp', '.cc': 'cpp', '.hh': 'cpp',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.scala': 'scala',
    '.sh': 'shell', '.bash': 'shell', '.zsh': 'shell',
    '.html': 'html', '.htm': 'html',
    '.css': 'css', '.scss': 'scss', '.sass': 'sass', '.less': 'less',
    '.vue': 'vue', '.svelte': 'svelte',
    '.json': 'json',
    '.yml': 'yaml', '.yaml': 'yaml',
    '.xml': 'xml', '.xsd': 'xml',
    '.toml': 'toml',
    '.txt': 'text', '.md': 'markdown',
    '.sql': 'sql',
  };
  return map[ext] || ext.replace(/^\./, '') || 'unknown';
}

// -- Entry point detection --

function detectEntryPoints(packageDir) {
  const candidates = [
    // JavaScript / TypeScript
    'src/index.js', 'src/index.ts', 'src/index.tsx', 'src/index.jsx',
    'src/main.js', 'src/main.ts', 'src/main.tsx',
    'src/app.js', 'src/app.ts', 'src/app.tsx',
    'src/App.js', 'src/App.ts', 'src/App.tsx', 'src/App.jsx',
    'src/index.html',
    'index.js', 'index.ts', 'main.js', 'main.ts',
    'app.js', 'app.ts',
    'server.js', 'server.ts',
    // Python
    'src/main.py', 'main.py', 'app.py', 'manage.py', 'wsgi.py', 'asgi.py',
    'src/app.py', 'src/__main__.py', '__main__.py',
    // Java
    'src/main/java', 'src/main/kotlin',
    // Go
    'main.go', 'cmd/main.go',
    // Rust
    'src/main.rs', 'src/lib.rs',
    // C#
    'Program.cs',
    // Ruby
    'app.rb', 'config.ru',
  ];

  return uniqueSorted(
    candidates
      .map(function(c) { return relIfExists(path.join(sourceRoot, packageDir, c)); })
      .filter(Boolean)
  );
}

// -- Main --

const directories = [];
const files = [];
walk(sourceRoot, directories, files);

const packageRoots = discoverPackageRoots();
const packageInfos = packageRoots.map(function(packageDir) {
  const absPackageDir = packageDir ? path.join(sourceRoot, packageDir) : sourceRoot;
  const packageJson = readJsonIfExists(path.join(absPackageDir, 'package.json'));
  return {
    package_dir: packageDir,
    dirName: packageDirName(packageDir),
    package_json: packageJson,
    aliases: packageAliases(packageDir, packageJson),
  };
});

const aliasMap = buildAliasMap(packageInfos);
const featurePackages = buildFeaturePackages(packageInfos);

const parseableFiles = files.filter(function(file) { return PARSEABLE_EXTS.has(path.extname(file).toLowerCase()); });
const fileArrays = {
  source_files: [],
  test_files: [],
  config_files: [],
  mock_files: [],
  i18n_files: [],
  enum_files: [],
  annotated_files: [],
};

for (const relPath of parseableFiles) {
  fileArrays[classifyFile(relPath)].push(relPath);
}

for (const key of Object.keys(fileArrays)) {
  fileArrays[key] = uniqueSorted(fileArrays[key]);
}

const extCounts = new Map();
for (const relPath of parseableFiles) {
  const ext = path.extname(relPath).toLowerCase();
  extCounts.set(ext, (extCounts.get(ext) || 0) + 1);
}

const languages = [...extCounts.entries()]
  .sort(function(a, b) { return b[1] - a[1]; })
  .map(function(item) {
    return {
      language: languageName(item[0]),
      files: item[1],
      extensions: [item[0]],
      confidence: 'high',
    };
  });

const frameworks = detectFrameworks(parseableFiles, packageInfos);

// Determine primary language
const primaryLanguage = languages.length ? languages[0].language : 'unknown';

const manifestsFound = uniqueSorted(
  packageRoots.flatMap(function(packageDir) {
    const absDir = packageDir ? path.join(sourceRoot, packageDir) : sourceRoot;
    const manifestFiles = ['package.json', 'pyproject.toml', 'setup.py', 'setup.cfg',
      'pom.xml', 'build.gradle', 'build.gradle.kts',
      'Cargo.toml', 'go.mod'];
    return manifestFiles
      .map(function(f) { return fs.existsSync(path.join(absDir, f)) ? normalizeRel(path.join(packageDir, f)) : null; })
      .concat(
        fs.readdirSync(absDir)
          .filter(function(f) { return f.endsWith('.csproj') || f.endsWith('.sln'); })
          .map(function(f) { return normalizeRel(path.join(packageDir, f)); })
      )
      .filter(Boolean);
  })
);

// Detect entry points from the main package root
const mainPackageDir = packageRoots[0] || '';
const entryPoints = detectEntryPoints(mainPackageDir);

// AngularJS-specific: collect routes and CSS deps if detected
var routes = [];
var cssDependencies = [];
var frameworkDetails = null;

if (frameworks.includes('angularjs')) {
  const appRelPath = relIfExists(path.join(sourceRoot, mainPackageDir, 'src', 'app.js')) || 'src/app.js';
  const indexRelPath = relIfExists(path.join(sourceRoot, mainPackageDir, 'src', 'index.js')) || 'src/index.js';
  const indexSource = readIfExists(path.join(sourceRoot, indexRelPath));
  const appSource = readIfExists(path.join(sourceRoot, appRelPath));
  routes = collectRoutes(appSource, appRelPath, aliasMap);
  cssDependencies = collectCssDependencies(indexSource, indexRelPath, aliasMap);
  frameworkDetails = {
    framework: 'AngularJS',
    module_name:
      (indexSource.match(/name:\s*['"]([^'"]+)['"]/) || [])[1] ||
      (packageInfos[0] && packageInfos[0].package_json && packageInfos[0].package_json.name) ||
      slug,
    css_dependencies: cssDependencies,
    container_package: mainPackageDir || null,
  };
}

// Read package.json for label/description
const mainPackageJson = packageInfos.length ? packageInfos[0].package_json : null;

const manifest = {
  version: 3,
  module_slug: slug,
  scanned_at: now,
  root: sourceRoot,
  primary_language: primaryLanguage,
  frameworks: frameworks,
  framework_details: frameworkDetails,
  manifests_found: manifestsFound,
  entry_points: entryPoints,
  routes: routes,
  features: featurePackages.map(function(item) { return item.feature; }),
  feature_packages: featurePackages,
  package_roots: packageRoots,
  platform_services: [],
  api_endpoints: [],
  languages: languages,
  directories: {
    total: directories.length + 1,
    source: uniqueSorted(
      featurePackages.map(function(item) { return item.prefix + '/'; })
        .concat(entryPoints.length ? [normalizeRel(path.join(mainPackageDir, 'src/'))] : ['src/'])
    ),
    test: ['**/test/', '**/tests/', '**/__tests__/', '**/*.spec.*', '**/*.test.*'],
    config: uniqueSorted(
      packageRoots
        .flatMap(function(item) { return ['conf/', 'config/'].map(function(d) { return normalizeRel(path.join(item, d)); }); })
        .filter(function(item) { return fs.existsSync(path.join(sourceRoot, item)); })
    ),
    excluded: [...EXCLUDED_DIRS].map(function(d) { return d + '/'; }),
  },
  total_files: parseableFiles.length,
  user_context: 'full pipeline for ' + slug,
  exclusions: [...EXCLUDED_DIRS],
  files: fileArrays,
};

const statePath = path.join(scansDir, 'state.json');
var state = { version: 1, module_slug: slug, pipeline: {}, file_hashes: {} };
if (fs.existsSync(statePath)) {
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (error) {
    state = { version: 1, module_slug: slug, pipeline: {}, file_hashes: {} };
  }
}
state.version = 1;
state.module_slug = slug;
state.pipeline = state.pipeline || {};
state.pipeline.scan = {
  status: 'completed',
  completed_at: now,
  root: sourceRoot,
  total_files: parseableFiles.length,
};

var registry = { modules: {} };
if (fs.existsSync(registryPath)) {
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  } catch (error) {
    registry = { modules: {} };
  }
}
registry.modules = registry.modules || {};
registry.modules[slug] = {
  label:
    (mainPackageJson && mainPackageJson.description) ||
    (mainPackageJson && mainPackageJson.name) ||
    slug,
  source_root: sourceRoot,
  app_url: null,
  artifacts: {
    scan_manifest: 'scans/' + slug + '/scan-manifest.json',
    state: 'scans/' + slug + '/state.json',
    symbols: 'symbols/' + slug + '/index.json',
    graph: 'graph/' + slug + '/edges.json',
    modules: 'modules/' + slug + '/',
    reports: 'reports/' + slug + '/',
    repomix: 'scans/' + slug + '/repomix-output.xml',
  },
  scanned_at: now,
};

fs.writeFileSync(path.join(scansDir, 'scan-manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

console.log(JSON.stringify({
  slug: slug,
  root: sourceRoot,
  primary_language: primaryLanguage,
  total_files: manifest.total_files,
  features: manifest.features,
  frameworks: manifest.frameworks,
  routes: manifest.routes.length,
  manifest: path.join('.discovery/code', 'scans', slug, 'scan-manifest.json'),
}, null, 2));
