import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Beasties from 'beasties';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

async function collectHtmlFiles() {
  const rootFiles = await fs.readdir(projectRoot);
  const rootHtml = rootFiles.filter((f) => f.endsWith('.html'));

  const blogDir = path.join(projectRoot, 'blog');
  const blogFiles = (await fs.readdir(blogDir)).filter((f) => f.endsWith('.html'));

  return [...rootHtml, ...blogFiles.map((f) => path.join('blog', f))];
}

// Undo any previous beasties edits so re-runs are idempotent.
function sanitize(html) {
  let s = html;
  s = s.replace(/<html([^>]*)\sdata-beasties-container([^>]*)>/g, '<html$1$2>');
  // Remove any <noscript> block that contains a stylesheet link or inline style
  // (only beasties emits these; we don't author any).
  s = s.replace(/<noscript>[\s\S]*?<\/noscript>/g, (m) =>
    /styles\.css|<style/i.test(m) ? '' : m,
  );
  // Remove every inlined <style>...</style> block. We never author inline styles.
  s = s.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
  // Convert beasties' async preload back to a plain stylesheet link
  s = s.replace(
    /<link rel="preload" href="([^"]+)" onload="this\.rel='stylesheet'" as="style">/g,
    '<link rel="stylesheet" href="$1">',
  );
  return s;
}

async function main() {
  const beasties = new Beasties({
    path: projectRoot,
    publicPath: '/',
    preload: 'swap',
    pruneSource: false,
    reduceInlineStyles: false,
    mergeStylesheets: false,
    compress: true,
    logLevel: 'silent',
  });

  const files = await collectHtmlFiles();

  for (const rel of files) {
    const p = path.join(projectRoot, rel);
    const raw = await fs.readFile(p, 'utf8');
    const clean = sanitize(raw);
    try {
      const processed = await beasties.process(clean);
      await fs.writeFile(p, processed, 'utf8');
      const inlined = (processed.match(/<style[^>]*>/g) || []).length;
      console.log(`  ${rel.padEnd(56)} (${inlined} style block${inlined === 1 ? '' : 's'} inlined)`);
    } catch (err) {
      console.error(`  ${rel} FAILED:`, err.message);
    }
  }

  console.log(`\n[inline-critical] Processed ${files.length} HTML files.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
