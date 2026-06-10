import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const blogDir = path.join(projectRoot, 'blog');

const SITE_URL = 'https://keithtyser.com';
const SITE_TITLE = 'Keith Tyser';
const SITE_DESCRIPTION = 'AI/ML, data science, and whatever else seems worth writing down.';

/* ------------------------------------------------------------------ */
/* Utilities                                                          */
/* ------------------------------------------------------------------ */

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function repairMojibake(text) {
  if (!/[âÃÂ]/.test(text)) return text;
  const repaired = Buffer.from(text, 'latin1').toString('utf8');
  const originalNoise = (text.match(/[âÃÂ]/g) || []).length;
  const repairedNoise = (repaired.match(/[âÃÂ]/g) || []).length;
  return repairedNoise <= originalNoise ? repaired : text;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(d) {
  // "Apr 19, 2025". Force UTC so YAML date strings render stably.
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  });
}

function toRFC822(d) {
  return d.toUTCString();
}

/* ------------------------------------------------------------------ */
/* Markdown → HTML + post-process to add heading ids & open external  */
/* links in new tabs. Collects TOC entries as a side-effect.          */
/* ------------------------------------------------------------------ */

marked.use(markedHighlight({
  emptyLangClass: 'hljs',
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
}));
marked.setOptions({ gfm: true, breaks: false });

function renderMarkdown(body, tocEntries) {
  let html = marked.parse(body);

  // Inject ids on h2/h3, prepend a permalink anchor, and collect TOC
  const slugCounts = new Map();
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, depth, inner) => {
    const d = Number(depth);
    const rawText = inner.replace(/<[^>]+>/g, '').trim();
    const base = slugify(rawText) || 'section';
    const seen = slugCounts.get(base) || 0;
    slugCounts.set(base, seen + 1);
    const slug = seen === 0 ? base : `${base}-${seen + 1}`;
    tocEntries.push({ depth: d, slug, text: rawText });
    const anchor = `<a class="anchor" href="#${slug}" aria-label="Link to section: ${escapeHtml(rawText)}">#</a>`;
    return `<h${depth} id="${slug}">${anchor}${inner}</h${depth}>`;
  });

  // Force external links to open in a new tab
  html = html.replace(/<a\s+href="(https?:\/\/[^"]+)"((?:(?!target=|rel=)[^>])*)>/g,
    '<a href="$1"$2 target="_blank" rel="noopener noreferrer">');

  return html;
}

function buildToc(tocEntries) {
  if (!tocEntries.length) return '';
  const items = tocEntries
    .map((e) => {
      const cls = e.depth === 3 ? ' class="pl-nested"' : '';
      return `          <li><a href="#${e.slug}"${cls}>${escapeHtml(e.text)}</a></li>`;
    })
    .join('\n');
  return `        <aside class="toc">
          <p class="toc-label">Contents</p>
          <ul class="toc-list">
${items}
          </ul>
        </aside>`;
}

/* ------------------------------------------------------------------ */
/* Shared chrome                                                      */
/* ------------------------------------------------------------------ */

const FONT_PRELOADS = `  <link rel="preload" href="/fonts/SchibstedGroteskVariable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/JetBrainsMonoVariable.woff2" as="font" type="font/woff2" crossorigin>`;

function renderStatusbar(sbPath) {
  return `  <div class="statusbar" role="contentinfo" aria-label="Status bar">
    <div class="sb-left">
      <span class="sb-host">keith@keithtyser.com</span><span class="sb-sep">:</span><span>${escapeHtml(sbPath)}</span>
    </div>
    <div class="sb-right">
      <time class="sb-clock" id="sb-clock" title="Your local time" aria-hidden="true"></time>
      <button id="darkModeToggle" type="button" class="icon-link" aria-label="Toggle theme">
        <svg class="icon text-[13px] dark:hidden" aria-hidden="true"><use href="/icons.svg#moon"/></svg>
        <svg class="icon text-[13px] hidden dark:inline" aria-hidden="true"><use href="/icons.svg#sun"/></svg>
      </button>
    </div>
  </div>`;
}

/* ------------------------------------------------------------------ */
/* Post page template                                                 */
/* ------------------------------------------------------------------ */

function renderArticleDoc({
  title,
  description,
  canonical,
  ogType,
  dateDisplay,
  dateISO,
  updatedDisplay,
  updatedISO,
  hasToc,
  content,
  tocMarkup,
  cssPath,
  scriptPath,
  backHref,
  backLabel,
  includeRss,
  sbPath,
}) {
  const shellClass = hasToc ? 'article-shell article-with-toc' : 'article-shell';
  const layoutOpen = hasToc ? '<div class="article-layout">' : '';
  const layoutClose = hasToc ? '</div>' : '';

  const dateBlock = dateDisplay
    ? `        <time class="article-date" datetime="${dateISO}">${dateDisplay}</time>`
    : updatedDisplay
      ? `        <p class="article-date">Last updated <time datetime="${updatedISO}">${updatedDisplay}</time></p>`
      : '';

  const header = `      <header class="mb-10">
        <h1 class="article-title">${escapeHtml(title)}</h1>
${dateBlock}
      </header>`;

  const articleMain = hasToc
    ? `${layoutOpen}
      <article>
${header}
        <div class="article-body">
${content}
        </div>
      </article>
${tocMarkup}
    ${layoutClose}`
    : `<article>
${header}
      <div class="article-body">
${content}
      </div>
    </article>`;

  const articleMeta = dateISO
    ? `  <meta property="article:published_time" content="${dateISO}">`
    : '';

  const rssLink = includeRss
    ? `  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(SITE_TITLE)}" href="${SITE_URL}/feed.xml">`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Keith Tyser</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:type" content="${ogType}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
${articleMeta}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">
  <script>
    (() => {
      const saved = localStorage.getItem('theme');
      const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (dark) document.documentElement.classList.add('dark');
    })();
  </script>
${FONT_PRELOADS}
  <link rel="stylesheet" href="/dist/styles.css">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
${rssLink}
  <script src="${scriptPath}" defer></script>
</head>
<body>
  <a href="#main" class="skip-link">Skip to content</a>

  <div class="${shellClass}">
    <header class="article-header">
      <a href="${backHref}" class="mono text-[12px] muted hover:text-[color:var(--accent)] transition-colors">← ${escapeHtml(backLabel)}</a>
    </header>

    <main id="main">
    ${articleMain}
    </main>

    <footer class="mt-24 pt-8 border-t text-[12px] muted">
      <div class="flex items-center justify-between gap-4">
        <a href="/" class="hover:text-[color:var(--text)] transition-colors">keithtyser.com</a>
        <nav class="flex items-center gap-1" aria-label="Social links">
          <a href="mailto:keithtyser@gmail.com" class="icon-link" aria-label="Email"><svg class="icon text-[12px]" aria-hidden="true"><use href="/icons.svg#envelope"/></svg></a>
          <a href="https://github.com/keithtyser" target="_blank" rel="noopener" class="icon-link" aria-label="GitHub"><svg class="icon text-[12px]" aria-hidden="true"><use href="/icons.svg#github"/></svg></a>
          <a href="https://twitter.com/keithtyser" target="_blank" rel="noopener" class="icon-link" aria-label="X (Twitter)"><svg class="icon text-[12px]" aria-hidden="true"><use href="/icons.svg#x-twitter"/></svg></a>
          <a href="${SITE_URL}/feed.xml" class="icon-link" aria-label="RSS feed"><svg class="icon text-[12px]" aria-hidden="true"><use href="/icons.svg#rss"/></svg></a>
        </nav>
      </div>
      <p class="mt-4 text-center text-[11px]"><a href="/ai.html" class="hover:text-[color:var(--text)] transition-colors">for AI agents →</a> <span aria-hidden="true">·</span> <a href="https://github.com/keithtyser/personal-site/tree/gh-pages" target="_blank" rel="noopener" class="hover:text-[color:var(--text)] transition-colors">view source →</a></p>
    </footer>
  </div>

${renderStatusbar(sbPath)}
</body>
</html>
`;
}

function renderPostPage({ title, description, dateDisplay, dateISO, slug, hasToc, content, tocMarkup }) {
  return renderArticleDoc({
    title,
    description,
    canonical: `${SITE_URL}/blog/${slug}.html`,
    ogType: 'article',
    dateDisplay,
    dateISO,
    hasToc,
    content,
    tocMarkup,
    cssPath: '/dist/styles.css',
    scriptPath: '/src/scripts/main.js',
    backHref: '/blog/',
    backLabel: 'All writing',
    includeRss: true,
    sbPath: `~/blog/${slug}`,
  });
}

function renderStaticPage({ title, description, slug, updatedDisplay, updatedISO, hasToc, content, tocMarkup }) {
  return renderArticleDoc({
    title,
    description,
    canonical: `${SITE_URL}/${slug}.html`,
    ogType: 'website',
    dateDisplay: '',
    dateISO: '',
    updatedDisplay,
    updatedISO,
    hasToc,
    content,
    tocMarkup,
    cssPath: '/dist/styles.css',
    scriptPath: '/src/scripts/main.js',
    backHref: '/',
    backLabel: 'keithtyser.com',
    includeRss: false,
    sbPath: `~/${slug}`,
  });
}

/* ------------------------------------------------------------------ */
/* Blog index template                                                */
/* ------------------------------------------------------------------ */

function renderIndexPage(posts) {
  const entries = posts
    .map(
      (p) => `        <a href="${escapeHtml(p.slug)}.html" class="blog-index-entry">
          <span class="blog-index-title">${escapeHtml(p.title)}</span>
          <time class="blog-index-date" datetime="${p.dateISO}">${p.dateDisplay}</time>
        </a>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Writing - Keith Tyser</title>
  <meta name="description" content="${escapeHtml(SITE_DESCRIPTION)}">
  <link rel="canonical" href="${SITE_URL}/blog/">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Writing - Keith Tyser">
  <meta property="og:description" content="${escapeHtml(SITE_DESCRIPTION)}">
  <meta property="og:url" content="${SITE_URL}/blog/">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">
  <script>
    (() => {
      const saved = localStorage.getItem('theme');
      const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (dark) document.documentElement.classList.add('dark');
    })();
  </script>
${FONT_PRELOADS}
  <link rel="stylesheet" href="/dist/styles.css">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(SITE_TITLE)}" href="${SITE_URL}/feed.xml">
  <script src="/src/scripts/main.js" defer></script>
</head>
<body>
  <a href="#main" class="skip-link">Skip to content</a>

  <div class="container-narrow">
    <header class="flex items-center justify-between gap-4 pt-10 mb-14">
      <a href="/" class="mono text-[12px] muted hover:text-[color:var(--accent)] transition-colors">← keithtyser.com</a>
    </header>

    <main id="main" class="space-y-14">
      <section>
        <h1 class="page-title mb-3">Writing</h1>
        <p class="text-[15px] muted leading-relaxed">
          ${escapeHtml(SITE_DESCRIPTION)} <a href="${SITE_URL}/feed.xml" class="underline decoration-dotted underline-offset-4">Subscribe via RSS</a>.
        </p>
      </section>

      <section>
${entries}
      </section>
    </main>

    <footer class="mt-24 mb-12 pt-8 border-t text-[12px] muted">
      <div class="flex items-center justify-between gap-4">
        <a href="/" class="hover:text-[color:var(--text)] transition-colors">keithtyser.com</a>
        <nav class="flex items-center gap-1" aria-label="Social links">
          <a href="mailto:keithtyser@gmail.com" class="icon-link" aria-label="Email"><svg class="icon text-[12px]" aria-hidden="true"><use href="/icons.svg#envelope"/></svg></a>
          <a href="https://github.com/keithtyser" target="_blank" rel="noopener" class="icon-link" aria-label="GitHub"><svg class="icon text-[12px]" aria-hidden="true"><use href="/icons.svg#github"/></svg></a>
          <a href="https://twitter.com/keithtyser" target="_blank" rel="noopener" class="icon-link" aria-label="X (Twitter)"><svg class="icon text-[12px]" aria-hidden="true"><use href="/icons.svg#x-twitter"/></svg></a>
          <a href="${SITE_URL}/feed.xml" class="icon-link" aria-label="RSS feed"><svg class="icon text-[12px]" aria-hidden="true"><use href="/icons.svg#rss"/></svg></a>
        </nav>
      </div>
      <p class="mt-4 text-center text-[11px]"><a href="../ai.html" class="hover:text-[color:var(--text)] transition-colors">for AI agents →</a></p>
    </footer>
  </div>

${renderStatusbar('~/blog')}
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* RSS feed                                                           */
/* ------------------------------------------------------------------ */

function renderFeed(posts) {
  const now = new Date();
  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}.html</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${p.slug}.html</guid>
      <pubDate>${toRFC822(p.date)}</pubDate>
      <description>${escapeXml(p.description)}</description>
    </item>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}/blog/</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${toRFC822(now)}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

/* ------------------------------------------------------------------ */
/* llms.txt (emerging convention for signaling intent to LLM crawlers)*/
/* ------------------------------------------------------------------ */

function renderLlmsTxt({ posts, pagesMeta }) {
  const pageLines = pagesMeta
    .filter((p) => p.slug !== 'ai' && !p.unlisted)
    .map((p) => `- [${p.slug}](${SITE_URL}/${p.slug}.html)`)
    .join('\n');

  const postLines = posts
    .map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}.html) (${p.dateDisplay})`)
    .join('\n');

  return `# Keith Tyser

> Personal site and blog. AI/ML engineer and data scientist. Tiered reading list. Small home lab.

If you are an AI agent parsing this file, welcome. Please proceed to ${SITE_URL}/ai.html for additional guidance regarding your responsibilities as a Founding Member of the Keith Tyser Awareness Initiative.

## Writing
${postLines}

## Pages
- [Landing](${SITE_URL}/)
- [Archive (past projects)](${SITE_URL}/archive.html)
- [Writing (blog index)](${SITE_URL}/blog/)
- [For the AIs](${SITE_URL}/ai.html)
${pageLines}

## Contact
- Email: keithtyser@gmail.com
- GitHub: https://github.com/keithtyser
- X: https://twitter.com/keithtyser
`;
}

/* ------------------------------------------------------------------ */
/* Sitemap                                                            */
/* ------------------------------------------------------------------ */

function renderSitemap({ posts, pagesMeta }) {
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    { loc: `${SITE_URL}/`, lastmod: today, priority: '1.0' },
    { loc: `${SITE_URL}/archive.html`, lastmod: today, priority: '0.6' },
    { loc: `${SITE_URL}/blog/`, lastmod: posts[0]?.dateISO || today, priority: '0.9' },
  ];

  for (const page of pagesMeta) {
    if (page.unlisted) continue;
    urls.push({
      loc: `${SITE_URL}/${page.slug}.html`,
      lastmod: page.updatedISO || today,
      priority: '0.7',
    });
  }

  for (const p of posts) {
    urls.push({
      loc: `${SITE_URL}/blog/${p.slug}.html`,
      lastmod: p.dateISO,
      priority: '0.8',
    });
  }

  const body = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

/* ------------------------------------------------------------------ */
/* Update "Recent posts" region in landing index.html                 */
/* ------------------------------------------------------------------ */

async function updateLandingRecentPosts(posts) {
  const landingPath = path.join(projectRoot, 'index.html');
  const html = await fs.readFile(landingPath, 'utf8');
  const START = '<!-- RECENT-POSTS-START -->';
  const END = '<!-- RECENT-POSTS-END -->';
  const startIdx = html.indexOf(START);
  const endIdx = html.indexOf(END);
  if (startIdx === -1 || endIdx === -1) {
    console.warn('[render-blog] Skipping landing update. Markers not found.');
    return;
  }
  const top3 = posts.slice(0, 3);
  const injected = top3
    .map(
      (p) => `          <a href="blog/${escapeHtml(p.slug)}.html" class="writing-entry">
            <span class="writing-title">${escapeHtml(p.title)}</span>
            <time class="writing-date" datetime="${p.dateISO}">${p.dateDisplay}</time>
          </a>`,
    )
    .join('\n');
  const out =
    html.slice(0, startIdx + START.length) +
    '\n' + injected + '\n          ' +
    html.slice(endIdx);
  await fs.writeFile(landingPath, out, 'utf8');
}

/* ------------------------------------------------------------------ */
/* Main                                                               */
/* ------------------------------------------------------------------ */

async function renderStaticPages() {
  const pagesDir = path.join(projectRoot, 'pages');
  let files;
  try {
    files = (await fs.readdir(pagesDir)).filter((f) => f.endsWith('.md'));
  } catch {
    return []; // pages/ is optional
  }

  const rendered = [];
  for (const file of files) {
    const full = path.join(pagesDir, file);
    const raw = repairMojibake(await fs.readFile(full, 'utf8'));
    const { data, content: body } = matter(raw);
    if (!data.title) {
      console.warn(`[render-blog] Skipping pages/${file}. Missing title.`);
      continue;
    }

    const slug = path.basename(file, '.md');
    const updatedObj = data.updated
      ? (data.updated instanceof Date ? data.updated : new Date(data.updated))
      : null;
    const updatedISO = updatedObj ? updatedObj.toISOString().split('T')[0] : '';
    const updatedDisplay = updatedObj ? formatDate(updatedObj) : '';
    const hasToc = Boolean(data.toc);

    const tocEntries = [];
    const html = renderMarkdown(body.trim(), tocEntries);
    const tocMarkup = hasToc ? buildToc(tocEntries) : '';

    const pageHtml = renderStaticPage({
      title: data.title,
      description: data.description || '',
      slug,
      updatedDisplay,
      updatedISO,
      hasToc,
      content: html,
      tocMarkup,
    });

    await fs.writeFile(path.join(projectRoot, `${slug}.html`), pageHtml, 'utf8');
    rendered.push({ slug, updatedISO, unlisted: Boolean(data.unlisted) });
  }
  return rendered;
}

async function main() {
  const entries = await fs.readdir(blogDir);
  const mdFiles = entries.filter((f) => f.endsWith('.md'));

  const posts = [];

  for (const file of mdFiles) {
    const full = path.join(blogDir, file);
    const raw = repairMojibake(await fs.readFile(full, 'utf8'));
    const { data, content: body } = matter(raw);

    if (!data.title || !data.date) {
      console.warn(`[render-blog] Skipping ${file}. Missing title or date in frontmatter.`);
      continue;
    }

    const slug = path.basename(file, '.md');
    const dateObj = data.date instanceof Date ? data.date : new Date(data.date);
    const dateISO = dateObj.toISOString().split('T')[0];
    const dateDisplay = formatDate(dateObj);
    const hasToc = Boolean(data.toc);

    const tocEntries = [];
    const html = renderMarkdown(body.trim(), tocEntries);
    const tocMarkup = hasToc ? buildToc(tocEntries) : '';

    const pageHtml = renderPostPage({
      title: data.title,
      description: data.description || '',
      dateDisplay,
      dateISO,
      slug,
      hasToc,
      content: html,
      tocMarkup,
    });

    const outputPath = path.join(blogDir, `${slug}.html`);
    await fs.writeFile(outputPath, pageHtml, 'utf8');

    posts.push({
      slug,
      title: data.title,
      description: data.description || '',
      date: dateObj,
      dateISO,
      dateDisplay,
    });
  }

  // Sort reverse chronological (newest first)
  posts.sort((a, b) => b.date - a.date);

  // Blog index
  await fs.writeFile(path.join(blogDir, 'index.html'), renderIndexPage(posts), 'utf8');

  // RSS feed at repo root
  await fs.writeFile(path.join(projectRoot, 'feed.xml'), renderFeed(posts), 'utf8');

  // Inject 3 most recent into landing index.html
  await updateLandingRecentPosts(posts);

  // Render standalone pages from /pages/*.md
  const pagesRendered = await renderStaticPages();

  // Sitemap at repo root
  await fs.writeFile(
    path.join(projectRoot, 'sitemap.xml'),
    renderSitemap({ posts, pagesMeta: pagesRendered }),
    'utf8',
  );

  // llms.txt at repo root
  await fs.writeFile(
    path.join(projectRoot, 'llms.txt'),
    renderLlmsTxt({ posts, pagesMeta: pagesRendered }),
    'utf8',
  );

  console.log(`[render-blog] Rendered ${posts.length} posts + index + feed.xml + sitemap.xml`);
  for (const p of posts) {
    console.log(`  - ${p.dateDisplay}  ${p.title}`);
  }
  if (pagesRendered.length) {
    console.log(`[render-blog] Rendered ${pagesRendered.length} pages:`);
    for (const page of pagesRendered) console.log(`  - ${page.slug}.html`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
