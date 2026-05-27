import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workerDir = path.join(__dirname, '.vercel', 'output', 'static', '_worker.js');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('from"async_hooks"')) {
        content = content.replaceAll('from"async_hooks"', 'from"node:async_hooks"');
        fs.writeFileSync(fullPath, content);
      }
      // Also catch spacing variations just in case
      if (content.includes('from "async_hooks"')) {
        content = content.replaceAll('from "async_hooks"', 'from "node:async_hooks"');
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

try {
  walk(workerDir);
  console.log("Successfully patched async_hooks imports for Cloudflare.");
} catch (e) {
  console.error("Error patching async_hooks:", e);
}
