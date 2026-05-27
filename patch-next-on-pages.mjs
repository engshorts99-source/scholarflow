import fs from 'node:fs';
import path from 'node:path';

const binPath = path.join(process.cwd(), 'node_modules', '@cloudflare', 'next-on-pages', 'bin', 'index.js');

if (fs.existsSync(binPath)) {
  let content = fs.readFileSync(binPath, 'utf8');
  
  if (!content.includes('node fix-cloudflare-build.mjs')) {
    content = content.replace(
      /\)\.on\('exit', code =>\s+process\.exit\(code === undefined \|\| code === null \? 0 : code\),\s+\);/,
      `).on('exit', code => {
  if (code === 0 || code === undefined || code === null) {
    try {
      console.log("Running custom fix for async_hooks...");
      require('child_process').execSync('node fix-cloudflare-build.mjs', { stdio: 'inherit', cwd: process.cwd() });
    } catch(e) {
      console.error(e);
    }
  }
  process.exit(code === undefined || code === null ? 0 : code);
});`
    );
    fs.writeFileSync(binPath, content);
    console.log('Successfully patched @cloudflare/next-on-pages to run post-build fix.');
  }
}
