import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const blogDir = path.join(projectRoot, 'blog');

const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  console.error('Usage: npm run new-post "<title>"');
  process.exit(1);
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

const slug = slugify(title);
if (!slug) {
  console.error('Error: title produced empty slug.');
  process.exit(1);
}

const now = new Date();
const dateISO = now.toISOString().split('T')[0];

const filename = `${slug}.md`;
const filepath = path.join(blogDir, filename);

try {
  await fs.access(filepath);
  console.error(`Error: ${filename} already exists.`);
  process.exit(1);
} catch {
  /* file doesn't exist, good */
}

const body = `---
title: ${title.includes(':') ? `"${title}"` : title}
description: TODO
date: ${dateISO}
toc: false
---

Write here.
`;

await fs.writeFile(filepath, body, 'utf8');
console.log(`Created ${path.relative(projectRoot, filepath)}`);
console.log(`Run \`npm run build:blog\` to render, or \`npm run dev\` to preview live.`);
