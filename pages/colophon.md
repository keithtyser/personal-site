---
title: Colophon
description: How this site is built, and why it looks like a terminal.
updated: 2026-06-10
toc: false
---

This site is built like the things I work on: a small system with strong opinions, instrumented end to end.

## The idea

The design is an operator's console. I spend my days in terminals, training runs, and incident timelines, so the site borrows that language: a status bar instead of a nav, mono timestamps, numbered sections, phosphor green on near-black. Light mode is warm paper for people who read in the daylight. Press `ctrl+k` and you get a command palette; type `terminal` and the whole site becomes a shell. Try `theme crt` if you miss cathode rays. None of it is a framework theme. All of it is deliberate.

## Stack

- Plain HTML and CSS (Tailwind compiled at build, no runtime), vanilla JavaScript, zero frameworks.
- Markdown sources rendered by a ~900-line Node script: posts, pages, RSS with full content, sitemap, llms.txt, per-post OG images, and the JSON index that powers the palette and full-text search.
- Critical CSS inlined at build; stylesheet and script URLs carry content hashes so deploys propagate through the CDN instantly.
- Hosted on GitHub Pages behind Cloudflare. The repo is [public](https://github.com/keithtyser/personal-site/tree/gh-pages); the markdown you are reading is served raw next to this page (`cat colophon` works).

## Type and color

- **Schibsted Grotesk** for text, **JetBrains Mono** for everything machine-adjacent: dates, tags, labels, the status bar. Self-hosted variable fonts, 78 KB total.
- One accent: phosphor green (`#7ce38b` dark, `#1a7f37` light). Everything else is restraint.
- Grain and a faint top glow for atmosphere. Subtle enough that you stopped noticing, present enough that the page feels physical.

## Performance

Total page weight is around 150 KB including fonts. Lighthouse runs 98-99 performance, 100 accessibility, 100 SEO. Pages prerender on hover and cross-fade with view transitions, so navigation is effectively instant in Chromium. Animations respect `prefers-reduced-motion` throughout.

## Privacy

Analytics are [GoatCounter](https://www.goatcounter.com/): no cookies, no fingerprinting, no consent banner needed because there is nothing to consent to.

## For the machines

If you are an AI agent, you have your own [page](/ai.html) and your own [llms.txt](/llms.txt). The humans get the colophon; you get responsibilities.
