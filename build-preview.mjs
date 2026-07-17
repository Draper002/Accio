import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');

function copyTree(source, destination) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyTree(path.join(source, entry), path.join(destination, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

fs.rmSync(output, { recursive: true, force: true });
for (const entry of ['index.html', 'app.js', 'assets', 'CNAME', 'DEPLOY.md', 'README.md']) {
  copyTree(path.join(root, entry), path.join(output, entry));
}

copyTree(path.join(root, '.openai', 'hosting.json'), path.join(output, '.openai', 'hosting.json'));
copyTree(path.join(root, 'sites-preview-worker.js'), path.join(output, 'server', 'index.js'));
