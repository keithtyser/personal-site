# keithtyser.com

My personal site and blog. Static HTML + Tailwind. Deployed to GitHub Pages on the `gh-pages` branch, custom domain `keithtyser.com`.

## Tech

- HTML and Tailwind CSS, no framework. "Operator's console" design: phosphor-green accent, self-hosted Schibsted Grotesk + JetBrains Mono variable fonts, vim-style status bar on every page.
- `src/scripts/render-blog.mjs` renders markdown to HTML. It auto-discovers `blog/*.md` and `pages/*.md`, parses frontmatter with gray-matter, and generates blog post pages (with per-post OG images, reading time, prev/next links), a flat blog index, an RSS feed, `palette.json` for the command palette, and standalone pages (like `/books.html` and `/tech-stack.html`).
- `src/scripts/inline-critical.mjs` inlines critical CSS (beasties) and cache-busts the stylesheet URL with a content hash so deploys take effect through the CDN immediately.
- `src/scripts/main.js`: dark mode, status bar clock + GitHub activity, command palette (Ctrl+K), terminal mode (with the orbit game), article reading progress, copy buttons, TOC scrollspy, MOTD, resume-reading. Minified to `dist/main.js` by esbuild at build. Deep layer (all opt-in from the terminal): `startx` boots KeithOS, `demo` attract mode, `selfie` ascii webcam, `top` live metrics, `matrix`, `say` TTS, konami code, `chat` (keef-mini: Qwen3.5-0.8B in-browser via WebLLM/WebGPU, retrieval over build-generated chat-context.json).
- `drafts/` is gitignored; move a draft into `blog/` to publish it.

## Scripts

```bash
npm install           # first time
npm run dev           # http://localhost:8080 with auto-reload
npm run build         # production build (CSS + blog + pages + feed)
npm run new-post "Title of post"   # scaffold a dated markdown file in blog/
```

## Structure

```
.
├── index.html            # landing
├── archive.html          # past projects
├── books.html            # generated from pages/books.md
├── tech-stack.html       # generated from pages/tech-stack.md
├── blog/
│   ├── index.html        # generated flat reverse-chron list
│   ├── *.md              # post sources
│   └── *.html            # generated post pages
├── pages/
│   └── *.md              # standalone page sources (books, tech stack, ...)
├── dist/styles.css       # compiled Tailwind (committed so gh-pages serves it)
├── feed.xml              # generated RSS
└── src/
    ├── styles/main.css   # design tokens + components
    └── scripts/
        ├── main.js       # dark mode toggle
        ├── render-blog.mjs
        └── new-post.mjs
```

## Writing a post

```bash
npm run new-post "The thing I want to say"
```

Edit the new `.md` file in `blog/`. Frontmatter:

```yaml
---
title: The thing I want to say
description: One short sentence for meta tags.
date: 2026-04-16
toc: false    # set to true to get a sidebar TOC on desktop
---
```

Save. The browser auto-reloads if `npm run dev` is running.

Drafts: name the file `blog/DRAFT-whatever.md`. It renders at `/blog/DRAFT-whatever.html` for local preview but stays out of the index, feed, sitemap, palette, and git (gitignored). Rename without the prefix to publish.

Images: drop originals in `blog/images/src/` (gitignored) and run `npm run build:images`; committed max-1400px webp files land in `blog/images/`. Reference as `/blog/images/<name>.webp`.

## Contact

- Email: keithtyser@gmail.com
- X: [@keithtyser](https://twitter.com/keithtyser)
- LinkedIn: [keithtyser](https://linkedin.com/in/keithtyser)
- GitHub: [@keithtyser](https://github.com/keithtyser)
