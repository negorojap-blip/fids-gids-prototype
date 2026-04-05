/**
 * post-build-es5.js
 * 
 * Vite ビルド後に dist/assets/ 内の .js ファイルを
 * Babel で ES5 にトランスパイルし、Terser で圧縮するスクリプト。
 * 
 * SCALA Player (Chromium 73) 互換性のための処置。
 */

import { transformFileAsync } from '@babel/core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, 'dist', 'assets');
const DIST_DIR = path.join(__dirname, 'dist');

/**
 * Patch dist/index.html:
 *  - Replace <script type="module" ...> with <script ...> (remove type="module")
 *  - Remove <link rel="modulepreload" ...> tags
 */
function patchIndexHtml() {
  const htmlPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    console.log('  ⚠️  index.html not found, skipping HTML patch.');
    return;
  }

  let html = fs.readFileSync(htmlPath, 'utf-8');
  
  // Remove type="module" and add defer (module scripts defer by default,
  // but regular scripts don't — without defer, the script runs before #app exists)
  html = html.replace(/<script\s+type="module"\s+/g, '<script defer ');
  
  // Remove modulepreload links (not needed for ES5)
  html = html.replace(/<link\s+rel="modulepreload"[^>]*>\s*/g, '');

  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log('  ✅ index.html patched (type="module" → defer)');
}

async function processFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`  🔄 Transpiling: ${fileName}`);

  try {
    // Step 1: Babel transpile to ES5
    const result = await transformFileAsync(filePath, {
      configFile: path.join(__dirname, 'babel.config.json'),
    });

    if (!result || !result.code) {
      console.error(`  ❌ Babel returned no output for ${fileName}`);
      return false;
    }

    // Step 2: Minify with Terser (ES5-safe)
    const minified = await minify(result.code, {
      ecma: 5,
      compress: {
        ecma: 5,
        warnings: false,
        comparisons: false,
        inline: 2,
      },
      mangle: true,
      output: {
        ecma: 5,
        comments: false,
        ascii_only: true,
      },
    });

    if (!minified || !minified.code) {
      // If minification fails, just write the Babel output
      fs.writeFileSync(filePath, result.code, 'utf-8');
      console.log(`  ⚠️  Minification skipped for ${fileName}, using Babel output.`);
      return true;
    }

    fs.writeFileSync(filePath, minified.code, 'utf-8');

    const originalSize = fs.statSync(filePath).size;
    console.log(`  ✅ Done: ${fileName} (${(originalSize / 1024).toFixed(1)} KB)`);
    return true;
  } catch (err) {
    console.error(`  ❌ Error processing ${fileName}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('');
  console.log('========================================');
  console.log('  ES5 Post-Build Transpilation');
  console.log('  Target: Chrome 73 (SCALA Player)');
  console.log('========================================');
  console.log('');

  if (!fs.existsSync(ASSETS_DIR)) {
    console.error('❌ dist/assets/ directory not found. Run "vite build" first.');
    process.exit(1);
  }

  const jsFiles = fs.readdirSync(ASSETS_DIR)
    .filter(f => f.endsWith('.js'))
    .map(f => path.join(ASSETS_DIR, f));

  if (jsFiles.length === 0) {
    console.log('No .js files found in dist/assets/.');
    return;
  }

  console.log(`Found ${jsFiles.length} JS file(s) to transpile:\n`);

  let success = 0;
  let fail = 0;

  for (const file of jsFiles) {
    const ok = await processFile(file);
    if (ok) success++;
    else fail++;
  }

  console.log('');
  console.log(`Result: ${success} succeeded, ${fail} failed.`);
  
  // Patch index.html to remove type="module"
  console.log('');
  patchIndexHtml();
  
  // Show final sizes
  console.log('');
  console.log('Final file sizes:');
  const allFiles = fs.readdirSync(ASSETS_DIR);
  for (const f of allFiles) {
    const fp = path.join(ASSETS_DIR, f);
    const stat = fs.statSync(fp);
    console.log(`  ${f}: ${(stat.size / 1024).toFixed(1)} KB`);
  }
  console.log('');

  if (fail > 0) process.exit(1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
