import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
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
  // Strip any previous cache-busting queries so re-runs are idempotent
  // (and so beasties can resolve the CSS file on disk)
  s = s.replace(/styles\.css\?v=[a-f0-9]+/g, 'styles.css');
  s = s.replace(/main\.js\?v=[a-f0-9]+/g, 'main.js');
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

  // Content hash of the compiled CSS, used to cache-bust the stylesheet URL
  // (the site sits behind a CDN that caches CSS for hours; a versioned URL
  // makes every deploy take effect immediately).
  const css = await fs.readFile(path.join(projectRoot, 'dist', 'styles.css'));
  const cssHash = crypto.createHash('md5').update(css).digest('hex').slice(0, 8);
  const js = await fs.readFile(path.join(projectRoot, 'src', 'scripts', 'main.js'));
  const jsHash = crypto.createHash('md5').update(js).digest('hex').slice(0, 8);

  for (const rel of files) {
    const p = path.join(projectRoot, rel);
    const raw = await fs.readFile(p, 'utf8');
    const clean = sanitize(raw);
    try {
      let processed = await beasties.process(clean);
      processed = processed.replaceAll('dist/styles.css', `dist/styles.css?v=${cssHash}`);
      processed = processed.replaceAll('scripts/main.js', `scripts/main.js?v=${jsHash}`);
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
