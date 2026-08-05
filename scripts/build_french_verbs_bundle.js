// scripts/build_french_verbs_bundle.js - Generates lib/french-verbs-bundle.js for GlossaPop Browser Extension using esbuild

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, '../src');
const libDir = path.join(__dirname, '../lib');

if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true });
if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });

const entryPath = path.join(srcDir, 'french-verbs-entry.js');
const outputPath = path.join(libDir, 'french-verbs-bundle.js');

const entryContent = `// Auto-generated entry script for esbuild
(function() {
  const lefff = require('french-verbs-lefff/dist/conjugations.json');
  const frenchVerbs = require('french-verbs');
  if (typeof window !== 'undefined') {
    window.Lefff = lefff;
    window.frenchVerbs = frenchVerbs;
  }
  if (typeof global !== 'undefined') {
    global.Lefff = lefff;
    global.frenchVerbs = frenchVerbs;
  }
})();
`;

fs.writeFileSync(entryPath, entryContent, 'utf8');

console.log('📦 Bundling french-verbs and LEFFF database using esbuild...');
execSync(`npx -y esbuild "${entryPath}" --bundle --outfile="${outputPath}" --format=iife --minify`, { stdio: 'inherit' });

const stats = fs.statSync(outputPath);
console.log(`✅ Successfully generated lib/french-verbs-bundle.js (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
