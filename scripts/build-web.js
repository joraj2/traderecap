/**
 * Builds the web assets into dist/ for Capacitor to wrap into the Android app.
 * Run via:  npm run build:web
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.resolve(ROOT, 'dist');

const FILES = ['index.html', 'styles.css', 'manifest.json'];
const DIRS  = ['js', 'data', 'assets'];

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  if (fs.statSync(p).isDirectory()) {
    for (const f of fs.readdirSync(p)) rmrf(path.join(p, f));
    fs.rmdirSync(p);
  } else {
    fs.unlinkSync(p);
  }
}
function copyRecursive(src, dst) {
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src)) copyRecursive(path.join(src, f), path.join(dst, f));
  } else {
    fs.copyFileSync(src, dst);
  }
}

rmrf(DIST);
fs.mkdirSync(DIST, { recursive: true });

let copied = 0;
for (const f of FILES) {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(DIST, f)); copied++; }
}
for (const d of DIRS) {
  const src = path.join(ROOT, d);
  if (fs.existsSync(src)) { copyRecursive(src, path.join(DIST, d)); copied++; }
}

console.log(`[build:web] copied ${copied} entries → ${DIST}`);
