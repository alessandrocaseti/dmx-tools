const fs = require('fs');
const path = require('path');

const root = process.cwd();
const out = path.join(root, 'public');

const itemsToCopy = [
  'index.html',
  'app.css',
  'app.js',
  'desktop.js',
  'cmd',
  'assets',
  'elements',
  'export',
  'fixtures',
  'fonts',
  'images',
  'pages',
  'qxf_converter'
];

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
  } else if (stat.isFile()) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

fs.rmSync(out, { recursive: true, force: true });
ensureDir(out);

for (const item of itemsToCopy) {
  const src = path.join(root, item);
  if (!fs.existsSync(src)) {
    throw new Error(`Required web build input is missing: ${item}`);
  }

  copyRecursive(src, path.join(out, item));
  console.log('copied', item);
}

console.log('\nPublic directory created at:', out);
