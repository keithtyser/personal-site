# keithtyser.com

My personal site and blog. Static HTML + Tailwind. Deployed to GitHub Pages on the `gh-pages` branch, custom domain `keithtyser.com`.

## Tech

- HTML and Tailwind CSS, no framework.
- `src/scripts/render-blog.mjs` renders markdown to HTML. It auto-discovers `blog/*.md` and `pages/*.md`, parses frontmatter with gray-matter, and generates blog post pages, a flat blog index, an RSS feed, and standalone pages (like `/books.html` and `/tech-stack.html`).
- Dark mode via a tiny script in `src/scripts/main.js` and a CSS class on the root element.

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

## Contact

- Email: keithtyser@gmail.com
- X: [@keithtyser](https://twitter.com/keithtyser)
- LinkedIn: [keithtyser](https://linkedin.com/in/keithtyser)
- GitHub: [@keithtyser](https://github.com/keithtyser)
