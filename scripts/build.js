// Cross-platform build: install frontend deps, build the SPA, copy output to /dist.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');

execSync('npm install --prefix frontend', { stdio: 'inherit', cwd: root });
execSync('npm run build --prefix frontend', { stdio: 'inherit', cwd: root });

const src = path.join(root, 'frontend', 'dist');
const dest = path.join(root, 'dist');

if (!fs.existsSync(src)) {
  console.error('[build] frontend/dist not found. Did the frontend build fail?');
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

console.log(`[build] Copied ${src} -> ${dest}`);
