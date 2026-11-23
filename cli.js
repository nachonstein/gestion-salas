#!/usr/bin/env node
/**
 * cli.js — invoked by `npx vg-discovery-agent`
 * Copies all files listed in package.json into the current working directory and exits cleanly.
 */

const fs   = require('fs');
const path = require('path');

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath  = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyItem(srcPath, destPath) {
  const stats = fs.statSync(srcPath);
  if (stats.isDirectory()) {
    copyDir(srcPath, destPath);
    return;
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
}

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const entries = Array.isArray(packageJson.files) ? packageJson.files : ['.github'];
const baseDest = process.env.INIT_CWD || process.cwd();

for (const entry of entries) {
  const srcPath = path.join(__dirname, entry);
  if (!fs.existsSync(srcPath)) {
    continue;
  }

  const destPath = path.join(baseDest, entry);
  copyItem(srcPath, destPath);
}

console.log('vg-discovery-agent: files copied to', baseDest);
