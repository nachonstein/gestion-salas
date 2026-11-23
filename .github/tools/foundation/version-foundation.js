#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_VERSION = '1.0.0';
const VALID_BUMPS = new Set(['major', 'minor', 'patch']);

function printUsage() {
  console.error([
    'Usage: node .github/tools/foundation/version-foundation.js [options]',
    '',
    'Options:',
    '  --file <path>           Version a single foundation document (repeatable)',
    '  --dir <path>            Version all .md files in a directory (default: .foundation)',
    '  --agent <name>          Required. Sets last_modified_by',
    '  --produced-from <path>  Source artifact path (repeatable or comma-separated)',
    '  --bump <type>           major | minor | patch (default: patch)',
    '  --root <path>           Repository root override (default: cwd)',
  ].join('\n'));
}

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}

function parseArgs(argv) {
  const options = {
    agent: '',
    defaultAgentVersion: '',
    bump: 'patch',
    dir: '.foundation',
    files: [],
    producedFrom: [],
    root: process.cwd(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--file') {
      options.files.push(argv[index + 1]);
      index += 1;
    } else if (arg === '--dir') {
      options.dir = argv[index + 1];
      index += 1;
    } else if (arg === '--agent') {
      options.agent = argv[index + 1] || '';
      index += 1;
    } else if (arg === '--produced-from') {
      const rawValue = argv[index + 1] || '';
      options.producedFrom.push(...rawValue.split(',').map(item => item.trim()).filter(Boolean));
      index += 1;
    } else if (arg === '--bump') {
      options.bump = argv[index + 1] || 'patch';
      index += 1;
    } else if (arg === '--root') {
      options.root = argv[index + 1] || process.cwd();
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      printUsage();
      process.exit(1);
    }
  }

  if (!options.agent) {
    console.error('Missing required argument: --agent <name>');
    printUsage();
    process.exit(1);
  }
  if (!VALID_BUMPS.has(options.bump)) {
    console.error(`Invalid bump type: ${options.bump}`);
    printUsage();
    process.exit(1);
  }

  options.root = path.resolve(options.root);
  options.dir = path.resolve(options.root, options.dir);
  options.files = options.files.map(filePath => path.resolve(options.root, filePath));
  options.producedFrom = Array.from(new Set(options.producedFrom.map(normalizePath)));
  options.defaultAgentVersion = resolveAgentVersionFromPackage(options.root);

  return options;
}

function resolveAgentVersionFromPackage(rootPath) {
  const packageJsonPath = path.join(rootPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`Missing package.json at ${packageJsonPath}. Run from repository root or pass --root <path>.`);
    process.exit(1);
  }

  let parsedPackage;
  try {
    parsedPackage = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    console.error(`Unable to parse ${packageJsonPath}: ${error.message}`);
    process.exit(1);
  }

  const version = typeof parsedPackage.version === 'string' ? parsedPackage.version.trim() : '';
  if (!version) {
    console.error(`Invalid or missing version in ${packageJsonPath}.`);
    process.exit(1);
  }

  return version;
}

function readFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontmatterMatch) {
    return { metadata: {}, body: content, hadFrontmatter: false, keyOrder: [] };
  }

  const rawFrontmatter = frontmatterMatch[1];
  const body = content.slice(frontmatterMatch[0].length);
  const metadata = {};
  const keyOrder = [];
  let currentKey = null;

  for (const line of rawFrontmatter.split('\n')) {
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):(.*)$/);
    if (keyMatch) {
      const key = keyMatch[1];
      const rawValue = keyMatch[2].trim();
      keyOrder.push(key);
      currentKey = key;
      if (!rawValue) {
        metadata[key] = [];
      } else {
        metadata[key] = unquoteYamlValue(rawValue);
      }
      continue;
    }

    const listMatch = line.match(/^\s*-\s*(.*)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(metadata[currentKey])) {
        metadata[currentKey] = metadata[currentKey] === '' ? [] : [String(metadata[currentKey])];
      }
      metadata[currentKey].push(unquoteYamlValue(listMatch[1].trim()));
      continue;
    }
  }

  return { metadata, body, hadFrontmatter: true, keyOrder };
}

function stripDuplicateLeadingFrontmatter(body) {
  let nextBody = body;
  let removedBlocks = 0;

  while (true) {
    const leadingBlankLinesMatch = nextBody.match(/^[\r\n]*/);
    const leadingBlankLines = leadingBlankLinesMatch ? leadingBlankLinesMatch[0] : '';
    const candidate = nextBody.slice(leadingBlankLines.length);
    if (!/^---\r?\n/.test(candidate)) {
      break;
    }

    const parsed = readFrontmatter(candidate);
    const hasYamlMetadata = Object.keys(parsed.metadata).length > 0;
    if (!parsed.hadFrontmatter || !hasYamlMetadata) {
      break;
    }

    nextBody = `${leadingBlankLines}${parsed.body}`;
    removedBlocks += 1;
  }

  return { body: nextBody, removedBlocks };
}

function unquoteYamlValue(value) {
  if (!value) {
    return '';
  }
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function formatYamlValue(value, indent) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '';
    }
    return `\n${value.map(item => `${indent}- ${JSON.stringify(String(item))}`).join('\n')}`;
  }
  return ` ${JSON.stringify(String(value))}`;
}

function isSemver(value) {
  return /^\d+\.\d+\.\d+$/.test(value);
}

function bumpVersion(version, bumpType) {
  if (!isSemver(version)) {
    return DEFAULT_VERSION;
  }
  const parts = version.split('.').map(Number);
  if (bumpType === 'major') {
    return `${parts[0] + 1}.0.0`;
  }
  if (bumpType === 'minor') {
    return `${parts[0]}.${parts[1] + 1}.0`;
  }
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}

function stableBody(body) {
  const normalized = body.replace(/\r\n/g, '\n').trimEnd();
  return `${normalized}\n`;
}

function hashBody(body) {
  return crypto.createHash('sha256').update(stableBody(body), 'utf8').digest('hex');
}

function collectTargetFiles(options) {
  if (options.files.length > 0) {
    return options.files;
  }
  if (!fs.existsSync(options.dir)) {
    return [];
  }
  return fs.readdirSync(options.dir)
    .filter(name => name.endsWith('.md'))
    .map(name => path.join(options.dir, name));
}

function relativeToRoot(root, targetPath) {
  return normalizePath(path.relative(root, targetPath));
}

function mergeProducedFrom(existingValue, incomingValues) {
  const existingItems = Array.isArray(existingValue)
    ? existingValue
    : existingValue
      ? [String(existingValue)]
      : [];
  return Array.from(new Set([...existingItems.map(normalizePath), ...incomingValues]));
}

function buildMetadata(rawMetadata, keyOrder, updates) {
  const orderedKeys = [];
  const seen = new Set();
  const preferredOrder = ['version', 'generated_at', 'last_modified_by', 'last_modified_by_version', 'foundation_hash', 'produced_from'];

  for (const key of preferredOrder) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      orderedKeys.push(key);
      seen.add(key);
    }
  }

  for (const key of keyOrder) {
    if (!seen.has(key) && Object.prototype.hasOwnProperty.call(rawMetadata, key)) {
      orderedKeys.push(key);
      seen.add(key);
    }
  }

  for (const key of Object.keys(rawMetadata)) {
    if (!seen.has(key)) {
      orderedKeys.push(key);
      seen.add(key);
    }
  }

  const metadata = { ...rawMetadata, ...updates };
  const lines = ['---'];
  for (const key of orderedKeys) {
    if (!Object.prototype.hasOwnProperty.call(metadata, key)) {
      continue;
    }
    lines.push(`${key}:${formatYamlValue(metadata[key], '  ')}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}

function versionFile(filePath, options) {
  const original = fs.readFileSync(filePath, 'utf8');
  const { metadata, body, keyOrder } = readFrontmatter(original);
  const normalizedBodyResult = stripDuplicateLeadingFrontmatter(body);
  const normalizedBody = normalizedBodyResult.body;
  const nextHash = hashBody(normalizedBody);
  const previousVersion = isSemver(metadata.version) ? metadata.version : DEFAULT_VERSION;
  const bodyChanged = metadata.foundation_hash !== nextHash;
  const now = new Date().toISOString();
  const producedFrom = mergeProducedFrom(metadata.produced_from, options.producedFrom);
  const nextVersion = bodyChanged
    ? (isSemver(metadata.version) ? bumpVersion(previousVersion, options.bump) : DEFAULT_VERSION)
    : previousVersion;
  const nextMetadata = {
    version: nextVersion,
    generated_at: bodyChanged ? now : (metadata.generated_at || now),
    last_modified_by: options.agent,
    last_modified_by_version: options.defaultAgentVersion,
    foundation_hash: nextHash,
    produced_from: producedFrom,
  };
  const content = `${buildMetadata(metadata, keyOrder, nextMetadata)}${stableBody(normalizedBody)}`;
  fs.writeFileSync(filePath, content, 'utf8');

  return {
    file: relativeToRoot(options.root, filePath),
    version: nextVersion,
    last_modified_by_version: nextMetadata.last_modified_by_version,
    changed: bodyChanged,
    removed_duplicate_frontmatter_blocks: normalizedBodyResult.removedBlocks,
    foundation_hash: nextHash,
    produced_from: producedFrom,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const targetFiles = collectTargetFiles(options);
  if (targetFiles.length === 0) {
    console.log(JSON.stringify({ updated: 0, files: [] }, null, 2));
    return;
  }

  const results = targetFiles.map(filePath => versionFile(filePath, options));
  console.log(JSON.stringify({ updated: results.length, files: results }, null, 2));
}

main();