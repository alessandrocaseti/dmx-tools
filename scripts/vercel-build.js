const fs = require('fs');
const path = require('path');

const root = process.cwd();
const out = path.join(root, 'public');

const itemsToCopy = [
  'index.html',
  'app.html',
  'app.css',
  'app.js',
  'main.js',
  'assets',
  'pages',
  'images',
  'fonts',
  'export',
  'elements',
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

ensureDir(out);

for (const item of itemsToCopy) {
  const src = path.join(root, item);
  if (fs.existsSync(src)) {
    const dest = path.join(out, item);
    try {
      copyRecursive(src, dest);
      console.log('copied', item);
    } catch (err) {
      console.error('failed to copy', item, err.message);
    }
  }
}

console.log('\nPublic directory created at:', out);
