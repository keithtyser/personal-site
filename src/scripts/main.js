document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------------------------------------------
  // Dark mode toggle + CRT easter egg persistence
  // ---------------------------------------------------------------
  const toggleButton = document.getElementById('darkModeToggle');
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleTheme);
  }
  if (localStorage.getItem('crt') === '1') {
    document.documentElement.classList.add('crt');
  }

  // ---------------------------------------------------------------
  // Status bar clock (visitor's local time)
  // ---------------------------------------------------------------
  const clock = document.getElementById('sb-clock');
  if (clock) {
    const tick = () => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    };
    tick();
    setInterval(tick, 1000);
  }

  // ---------------------------------------------------------------
  // Reading progress line on article pages (fills along statusbar top)
  // ---------------------------------------------------------------
  const articleBody = document.querySelector('.article-body');
  const statusbar = document.querySelector('.statusbar');
  if (articleBody && statusbar) {
    const progress = document.createElement('span');
    progress.className = 'sb-progress';
    progress.setAttribute('aria-hidden', 'true');
    statusbar.appendChild(progress);
    let raf = 0;
    let total = 0;
    const measure = () => {
      total = document.documentElement.scrollHeight - window.innerHeight;
    };
    const update = () => {
      raf = 0;
      const pct = total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0;
      progress.style.width = `${pct}%`;
    };
    window.addEventListener('resize', () => { measure(); update(); });
    window.addEventListener('load', () => { measure(); update(); });
    window.addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    measure();
    update();
  }

  // ---------------------------------------------------------------
  // Card cursor spotlight (pointer devices only)
  // ---------------------------------------------------------------
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    });
  }

  // ---------------------------------------------------------------
  // 404 page: show the path the visitor actually asked for
  // ---------------------------------------------------------------
  if (document.title.startsWith('404')) {
    document.querySelectorAll('.article-body pre code').forEach((code) => {
      if (code.textContent.includes('/this/page')) {
        code.textContent = code.textContent.replaceAll('/this/page', window.location.pathname);
      }
    });
  }

  // ---------------------------------------------------------------
  // Copy permalink on anchor click (blog headings)
  // ---------------------------------------------------------------
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a.anchor');
    if (!anchor) return;
    e.preventDefault();
    const hash = anchor.getAttribute('href');
    const url = new URL(hash, window.location.href).href;
    history.replaceState(null, '', hash);
    const target = document.querySelector(hash);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        const original = anchor.textContent;
        anchor.textContent = '✓';
        setTimeout(() => { anchor.textContent = original; }, 1000);
      }).catch(() => {});
    }
  });

  // ---------------------------------------------------------------
  // Latest GitHub public activity, shown in the status bar (landing)
  // ---------------------------------------------------------------
  const ghTarget = document.getElementById('gh-activity');
  if (ghTarget) {
    const username = ghTarget.dataset.user || 'keithtyser';
    fetch(`https://api.github.com/users/${username}/events/public?per_page=30`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((events) => {
        const push = events.find((e) => e.type === 'PushEvent' && e.repo);
        if (!push) throw new Error('no recent push');
        const repo = push.repo.name;
        const shortRepo = repo.startsWith(`${username}/`) ? repo.slice(username.length + 1) : repo;
        const sha = push.payload && push.payload.head;
        const href = sha
          ? `https://github.com/${repo}/commit/${sha}`
          : `https://github.com/${repo}`;
        const when = relativeTime(new Date(push.created_at));
        ghTarget.innerHTML = `push: <a href="${href}" target="_blank" rel="noopener">${escapeText(shortRepo)}</a> ${when}`;
        ghTarget.hidden = false;
      })
      .catch(() => { ghTarget.hidden = true; });
  }

  // ---------------------------------------------------------------
  // Visit tracking for the MOTD (localStorage only, nothing sent)
  // ---------------------------------------------------------------
  if (!sessionStorage.getItem('session-started')) {
    sessionStorage.setItem('session-started', '1');
    const prev = localStorage.getItem('visit-ts');
    if (prev) localStorage.setItem('prev-visit', prev);
    localStorage.setItem('visit-ts', String(Date.now()));
  }

  // ---------------------------------------------------------------
  // Copy buttons on article code blocks
  // ---------------------------------------------------------------
  document.querySelectorAll('.article-body pre').forEach((pre) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'copy';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code');
      navigator.clipboard.writeText((code || pre).textContent).then(() => {
        btn.textContent = 'copied ✓';
        btn.classList.add('is-copied');
        setTimeout(() => {
          btn.textContent = 'copy';
          btn.classList.remove('is-copied');
        }, 1400);
      }).catch(() => {});
    });
    pre.appendChild(btn);
  });

  // ---------------------------------------------------------------
  // TOC scrollspy: highlight the section you're reading
  // ---------------------------------------------------------------
  const tocLinks = document.querySelectorAll('.toc-list a');
  if (tocLinks.length) {
    const byId = new Map();
    tocLinks.forEach((a) => byId.set(a.getAttribute('href').slice(1), a));
    const heads = [...byId.keys()]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    let current = null;
    let spyRaf = 0;
    const spy = () => {
      spyRaf = 0;
      const y = window.scrollY + 130;
      let pick = heads[0];
      for (const h of heads) {
        if (h.getBoundingClientRect().top + window.scrollY <= y) pick = h;
        else break;
      }
      const link = pick ? byId.get(pick.id) : null;
      if (link !== current) {
        if (current) current.classList.remove('is-current');
        current = link;
        if (current) current.classList.add('is-current');
      }
    };
    window.addEventListener('scroll', () => {
      if (!spyRaf) spyRaf = requestAnimationFrame(spy);
    }, { passive: true });
    spy();
  }

  // ---------------------------------------------------------------
  // Resume reading: offer to jump back to where you left off
  // ---------------------------------------------------------------
  if (articleBody && statusbar) {
    const posKey = `pos:${window.location.pathname}`;
    const saved = Number(localStorage.getItem(posKey) || 0);
    if (saved > 0.08 && window.scrollY < 50 && !window.location.hash) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'sb-hint sb-resume';
      chip.textContent = `resume ${Math.round(saved * 100)}% →`;
      chip.addEventListener('click', () => {
        window.scrollTo({ top: saved * (document.documentElement.scrollHeight - window.innerHeight), behavior: 'smooth' });
        chip.remove();
      });
      statusbar.querySelector('.sb-right').prepend(chip);
      setTimeout(() => chip.remove(), 30000);
    }
    let saveTimer = 0;
    window.addEventListener('scroll', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const pct = total > 0 ? window.scrollY / total : 0;
        if (pct > 0.05 && pct < 0.9) localStorage.setItem(posKey, pct.toFixed(3));
        else if (pct >= 0.9) localStorage.removeItem(posKey);
      }, 400);
    }, { passive: true });
  }

  // ---------------------------------------------------------------
  // Per-post view counts (blog index). GoatCounter public endpoint;
  // silently absent until public access is enabled in GC settings.
  // ---------------------------------------------------------------
  document.querySelectorAll('[data-views-path]').forEach((el) => {
    fetch(`https://keithtyser.goatcounter.com/counter/${encodeURIComponent(el.dataset.viewsPath)}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (data && data.count) {
          el.textContent = `${String(data.count).trim()} views`;
          el.hidden = false;
        }
      })
      .catch(() => {});
  });

  // ---------------------------------------------------------------
  // Hero "currently" line: typewriter reveal (instant under
  // prefers-reduced-motion)
  // ---------------------------------------------------------------
  const currently = document.getElementById('hero-currently-text');
  if (currently) {
    const full = currently.textContent;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // leave as-is
    } else {
      currently.textContent = '';
      let i = 0;
      const type = () => {
        if (i <= full.length) {
          currently.textContent = full.slice(0, i);
          i += 1;
          setTimeout(type, 18);
        }
      };
      setTimeout(type, 700);
    }
  }

  initPalette();
});

function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  if (document.documentElement.classList.contains('dark')) {
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
}

function setCrt(on) {
  document.documentElement.classList.toggle('crt', on);
  if (on) localStorage.setItem('crt', '1');
  else localStorage.removeItem('crt');
}

/* =================================================================
   Site data: pages + posts (with markdown source paths and post
   text for full-text search), lazily fetched from /palette.json.
   ================================================================= */
const siteData = { pages: [], posts: [], promise: null };

function loadSiteData() {
  if (!siteData.promise) {
    siteData.promise = fetch('/palette.json')
      .then((r) => (r.ok ? r.json() : { pages: [], posts: [] }))
      .then((data) => {
        siteData.pages = data.pages || [];
        siteData.posts = data.posts || [];
        return siteData;
      })
      .catch(() => siteData);
  }
  return siteData.promise;
}

function slugOf(entry) {
  if (entry.src) return entry.src.split('/').pop().replace(/\.md$/, '');
  if (entry.href === '/') return 'home';
  if (entry.href === '/blog/') return 'writing';
  return entry.href.replace(/^\//, '').replace(/\.html$/, '');
}

/* =================================================================
   Shared command core. Used by both the palette and terminal mode.
   Handlers print via the provided sink; return true if handled.
   ================================================================= */
const BOOT_LINES = [
  '[ ok ] mounting ~keith',
  '[ ok ] loading phosphor profile',
  '[ ok ] starting statusbar.service',
  '[ ok ] syncing experiment queue',
  'ready.',
];

const FORTUNES = [
  'B caught you. self-play makes brutal opponents.',
  'most search is like that. please return to your crawl.',
  'a regression never flows downstream.',
  'it fits. that is the achievement.',
  'the public recipe is that good. the leaderboard is humbling.',
  'NVMe, obviously.',
  'it is a lab, not a dragster.',
  'when that date gets stale, so does this page.',
  'keith is available. also hireable. remarkably hireable.',
  'give it ~20s to warm up.',
];

function randomFortune() {
  return FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
}

function cowsay(text) {
  const width = Math.min(38, Math.max(8, text.length));
  const lines = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    if ((line + ' ' + w).trim().length > width && line) { lines.push(line); line = w; }
    else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  const pad = (s) => s + ' '.repeat(width - s.length);
  const bubble = lines.length === 1
    ? [`< ${pad(lines[0])} >`]
    : lines.map((l, i) => {
        const open = i === 0 ? '/' : i === lines.length - 1 ? '\\' : '|';
        const shut = i === 0 ? '\\' : i === lines.length - 1 ? '/' : '|';
        return `${open} ${pad(l)} ${shut}`;
      });
  return [
    ` ${'_'.repeat(width + 2)}`,
    ...bubble,
    ` ${'-'.repeat(width + 2)}`,
    '        \\   ^__^',
    '         \\  (oo)\\_______',
    '            (__)\\       )\\/\\',
    '                ||----w |',
    '                ||     ||',
  ].join('\n');
}

function motdLine() {
  const prev = Number(localStorage.getItem('prev-visit') || 0);
  if (!prev) return 'first login. welcome aboard.';
  const when = relativeTime(new Date(prev));
  let fresh = 0;
  for (const p of siteData.posts) {
    const d = p.src && p.date ? new Date(p.date).getTime() : NaN;
    if (!Number.isNaN(d) && d > prev) fresh += 1;
  }
  return fresh > 0
    ? `last login: ${when}. ${fresh} new post${fresh === 1 ? '' : 's'} since.`
    : `last login: ${when}.`;
}

function makeCommands(ctx) {
  // ctx: { print(text), clear(), close(), isTerminal }
  const cmds = {
    whoami: () => ctx.print('guest. the one with the green status dot is keith.'),
    pwd: () => ctx.print(`~${window.location.pathname.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '')}`),
    date: () => ctx.print(new Date().toString()),
    sudo: () => ctx.print('guest is not in the sudoers file. this incident will be reported.'),
    vim: () => ctx.print('you are now stuck in vim. refresh the page to exit.'),
    rm: () => ctx.print('nice try. this site is version controlled.'),
    man: () => ctx.print('no manual entry. there never was a manual.'),
    clear: () => ctx.clear(),
    exit: () => ctx.close(),
    fortune: () => ctx.print(randomFortune()),
    cowsay: (args) => ctx.print(cowsay(args.join(' ') || randomFortune())),
    motd: () => ctx.print(motdLine()),
    help: () => ctx.print(
      ctx.isTerminal
        ? 'commands: ls, cd, cat <file>, open <file>, pwd, whoami, date, history, play, fortune, cowsay, motd, theme [crt|dark|light], reboot, clear, exit\ntab completes. up/down for history. esc leaves.'
        : 'try: whoami, ls, cat <page>, history, fortune, theme crt, reboot, terminal. or just type where you want to go.',
    ),
    history: async () => {
      ctx.print('fetching site history...');
      try {
        const res = await fetch('https://api.github.com/repos/keithtyser/personal-site/commits?sha=gh-pages&per_page=10');
        if (!res.ok) throw new Error(String(res.status));
        const commits = await res.json();
        const lines = commits.map((c) => {
          const date = c.commit.author.date.slice(0, 10);
          const msg = c.commit.message.split('\n')[0].slice(0, 64);
          return `${c.sha.slice(0, 7)}  ${date}  ${msg}`;
        });
        ctx.print(lines.join('\n'));
      } catch {
        ctx.print('history: github api unavailable (rate limited, probably)');
      }
    },
    theme: (args) => {
      const mode = (args[0] || '').toLowerCase();
      if (mode === 'crt') { setCrt(true); ctx.print('phosphor mode engaged. theme default to recover.'); }
      else if (mode === 'default' || mode === 'off') { setCrt(false); ctx.print('back to civilian display.'); }
      else if (mode === 'dark' || mode === 'light') {
        document.documentElement.classList.toggle('dark', mode === 'dark');
        localStorage.setItem('theme', mode);
        ctx.print(`theme: ${mode}`);
      } else ctx.print('usage: theme crt | default | dark | light');
    },
    reboot: () => {
      let i = 0;
      const step = () => {
        if (i < BOOT_LINES.length) {
          ctx.print(BOOT_LINES[i++]);
          setTimeout(step, 260);
        } else {
          setTimeout(() => window.location.reload(), 350);
        }
      };
      step();
    },
    cat: async (args) => {
      const name = (args[0] || '').replace(/\.md$/, '').replace(/^(blog|pages)\//, '');
      if (!name) { ctx.print('usage: cat <page|post-slug>  (ls shows what exists)'); return; }
      await loadSiteData();
      const all = [...siteData.pages, ...siteData.posts].filter((e) => e.src);
      const entry = all.find((e) => slugOf(e) === name)
        || all.find((e) => e.title.toLowerCase() === name.toLowerCase())
        || all.find((e) => slugOf(e).startsWith(name));
      if (!entry) { ctx.print(`cat: ${name}: No such file`); return; }
      try {
        const res = await fetch(entry.src);
        if (!res.ok) throw new Error(String(res.status));
        let text = await res.text();
        const MAX = 6000;
        if (text.length > MAX) text = `${text.slice(0, MAX)}\n\n--- truncated. open ${slugOf(entry)} for the rest ---`;
        ctx.print(text);
      } catch {
        ctx.print(`cat: ${name}: read error`);
      }
    },
    open: async (args) => {
      const name = (args[0] || '').replace(/\.md$/, '').replace(/^(blog|pages)\//, '');
      if (!name) { ctx.print('usage: open <page|post-slug>'); return; }
      await loadSiteData();
      const all = [...siteData.pages, ...siteData.posts];
      const entry = all.find((e) => slugOf(e) === name)
        || all.find((e) => e.title.toLowerCase().includes(name.toLowerCase()))
        || all.find((e) => slugOf(e).startsWith(name));
      if (!entry) { ctx.print(`open: ${name}: not found`); return; }
      window.location.href = entry.href;
    },
  };
  return cmds;
}

function parseCommandLine(value) {
  // the one pipe this shell supports
  if (/^fortune\s*\|\s*cowsay$/i.test(value.trim())) {
    return { cmd: 'cowsay', args: [] };
  }
  const parts = value.trim().split(/\s+/);
  if (!parts[0]) return null;
  let cmd = parts[0].toLowerCase();
  let args = parts.slice(1);
  // sudo/rm/man swallow their arguments; "rm -rf /" stays one joke
  if (cmd === 'rm' || cmd === 'man' || cmd === 'sudo') args = [];
  return { cmd, args };
}

/* =================================================================
   Command palette: Ctrl+K / Cmd+K / "/" or the statusbar hint.
   ================================================================= */
function initPalette() {
  const STATIC_ITEMS = [
    { title: 'Terminal mode', hint: 'action', action: 'terminal' },
    { title: 'Toggle theme', hint: 'action', action: 'theme' },
    { title: 'GitHub', hint: 'social', href: 'https://github.com/keithtyser', external: true },
    { title: 'LinkedIn', hint: 'social', href: 'https://linkedin.com/in/keithtyser/', external: true },
    { title: 'X (Twitter)', hint: 'social', href: 'https://twitter.com/keithtyser', external: true },
    { title: 'Google Scholar', hint: 'social', href: 'https://scholar.google.com/citations?user=LyyIWSYAAAAJ', external: true },
    { title: 'Email Keith', hint: 'social', href: 'mailto:keithtyser@gmail.com' },
    { title: 'Newsletter', hint: 'social', href: 'https://buttondown.com/keithtyser', external: true },
    { title: 'RSS feed', hint: 'social', href: '/feed.xml' },
  ];

  let overlay = null;
  let input = null;
  let list = null;
  let output = null;
  let items = [];
  let filtered = [];
  let active = 0;
  let loaded = false;
  let lastFocused = null;

  const cmdCtx = {
    print: (text) => {
      output.textContent = output.hidden ? text : `${output.textContent}\n${text}`;
      output.hidden = false;
      output.scrollTop = output.scrollHeight;
    },
    clear: () => { output.hidden = true; output.textContent = ''; },
    close: () => close(),
    isTerminal: false,
  };
  const commands = makeCommands(cmdCtx);

  function buildDom() {
    overlay = document.createElement('div');
    overlay.className = 'palette-overlay';
    overlay.innerHTML = `
      <div class="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div class="palette-head">
          <span class="palette-prompt" aria-hidden="true">$</span>
          <input class="palette-input" type="text" placeholder="jump to... (or try: terminal)" aria-label="Search pages, posts, and actions" autocomplete="off" spellcheck="false">
          <kbd class="palette-esc" aria-hidden="true">esc</kbd>
        </div>
        <div class="palette-output" role="status" hidden></div>
        <ul class="palette-list" role="listbox"></ul>
        <div class="palette-foot" aria-hidden="true">tip: type <kbd>terminal</kbd> for the full shell · <kbd>whoami</kbd>, <kbd>cat now</kbd>, <kbd>theme crt</kbd> work too</div>
      </div>`;
    document.body.appendChild(overlay);
    input = overlay.querySelector('.palette-input');
    list = overlay.querySelector('.palette-list');
    output = overlay.querySelector('.palette-output');

    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) close();
    });
    // Focus trap: the input is the dialog's only focusable control
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        input.focus();
      }
    });
    input.addEventListener('input', () => { active = 0; render(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (!runCommand(input.value)) execute(filtered[active]);
      }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
  }

  function runCommand(value) {
    const parsed = parseCommandLine(value);
    if (!parsed) return false;
    const { cmd, args } = parsed;
    if (cmd === 'terminal' || cmd === 'term') {
      close();
      openTerminal();
      return true;
    }
    if (cmd === 'ls') {
      cmdCtx.print('home/  writing/  archive/  now/  books/  tech-stack/  ai/');
      input.value = '';
      render();
      return true;
    }
    if (!commands[cmd]) return false;
    // Bare command words that are also plausible search text only run
    // as commands when they match exactly
    commands[cmd](args);
    input.value = '';
    render();
    return true;
  }

  async function loadItems() {
    if (loaded) return;
    loaded = true;
    await loadSiteData();
    const dynamic = [
      ...siteData.pages.map((p) => ({ title: p.title, hint: 'page', href: p.href })),
      ...siteData.posts.map((p) => ({ title: p.title, hint: p.date, href: p.href, text: (p.text || '').toLowerCase() })),
    ];
    items = [...dynamic, ...STATIC_ITEMS];
    render();
  }

  function render() {
    const q = input.value.trim().toLowerCase();
    filtered = q
      ? items
          .map((i) => {
            const inMeta = (i.title + ' ' + (i.hint || '')).toLowerCase().includes(q);
            if (inMeta) return { ...i, matched: 'meta' };
            if (i.text && i.text.includes(q)) {
              const at = i.text.indexOf(q);
              const start = Math.max(0, at - 24);
              const snippet = (start > 0 ? '…' : '') + i.text.slice(start, at + q.length + 32) + '…';
              return { ...i, matched: 'body', snippet };
            }
            return null;
          })
          .filter(Boolean)
      : items.slice();
    if (active >= filtered.length) active = Math.max(0, filtered.length - 1);
    list.innerHTML = filtered.length
      ? filtered
          .map((item, idx) => `
        <li class="palette-item${idx === active ? ' is-active' : ''}" role="option" aria-selected="${idx === active}" data-idx="${idx}">
          <span class="palette-item-title">${escapeText(item.title)}</span>
          <span class="palette-item-hint">${escapeText(item.snippet || item.hint || '')}</span>
        </li>`)
          .join('')
      : '<li class="palette-empty">no matches. (commands work too: help)</li>';
    list.querySelectorAll('.palette-item').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        active = Number(el.dataset.idx);
        render();
      });
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        execute(filtered[Number(el.dataset.idx)]);
      });
    });
    const activeEl = list.querySelector('.is-active');
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
  }

  function move(delta) {
    if (!filtered.length) return;
    active = (active + delta + filtered.length) % filtered.length;
    render();
  }

  function execute(item) {
    if (!item) return;
    if (item.action === 'theme') {
      toggleTheme();
      close();
      return;
    }
    if (item.action === 'terminal') {
      close();
      openTerminal();
      return;
    }
    if (item.external) {
      window.open(item.href, '_blank', 'noopener');
      close();
    } else {
      window.location.href = item.href;
    }
  }

  function open() {
    if (!overlay) buildDom();
    lastFocused = document.activeElement;
    loadItems().then(() => {
      const m = motdLine();
      if (m.includes('new post') && overlay.classList.contains('is-open') && output.hidden) {
        cmdCtx.print(m);
      }
    });
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    input.value = '';
    output.hidden = true;
    output.textContent = '';
    active = 0;
    render();
    input.focus();
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function isOpen() {
    return overlay && overlay.classList.contains('is-open');
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      isOpen() ? close() : open();
      return;
    }
    if (e.key === '/' && !isOpen() && !terminalIsOpen()) {
      const t = e.target;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (!typing) {
        e.preventDefault();
        open();
      }
    }
  });

  document.querySelectorAll('[data-palette-open]').forEach((el) => {
    el.addEventListener('click', open);
  });

  // Console users and tests can drive it too
  window.__palette = { open, close };
}

/* =================================================================
   Full terminal mode: the whole site, navigable as a filesystem.
   ================================================================= */
let term = null;

function terminalIsOpen() {
  return term && term.overlay.classList.contains('is-open');
}

async function openTerminal() {
  await loadSiteData();
  if (!term) buildTerminal();
  term.overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  term.input.focus();
}

function closeTerminal() {
  if (!term) return;
  term.overlay.classList.remove('is-open');
  document.body.style.overflow = '';
}

function buildTerminal() {
  const overlay = document.createElement('div');
  overlay.className = 'term-overlay';
  overlay.innerHTML = `
    <div class="term" role="dialog" aria-modal="true" aria-label="Terminal">
      <div class="term-log" aria-live="polite"></div>
      <div class="term-input-row">
        <span class="term-prompt"></span>
        <input class="term-input" type="text" aria-label="Terminal input" autocomplete="off" spellcheck="false" autocapitalize="off" autocorrect="off" enterkeyhint="send">
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const log = overlay.querySelector('.term-log');
  const input = overlay.querySelector('.term-input');
  const promptEl = overlay.querySelector('.term-prompt');

  let cwd = '~';
  const history = [];
  let histIdx = -1;

  const prompt = () => `keith@keithtyser.com:${cwd}$`;
  const refreshPrompt = () => { promptEl.textContent = prompt(); };

  const print = (text) => {
    const div = document.createElement('div');
    div.className = 'term-line';
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  };

  const ctx = {
    print,
    clear: () => { log.innerHTML = ''; },
    close: closeTerminal,
    isTerminal: true,
  };
  const commands = makeCommands(ctx);

  function rootEntries() {
    const pages = siteData.pages.filter((p) => p.src).map((p) => `${slugOf(p)}.md`);
    return ['blog/', 'home', 'archive', ...pages];
  }

  function blogEntries() {
    return siteData.posts.map((p) => `${slugOf(p)}.md`);
  }

  function entriesFor(dir) {
    return dir === '~/blog' ? blogEntries() : rootEntries();
  }

  /* ---- "orbit" mini-game: collect *, outrun B. turn-based. ---- */
  const game = { active: false, frame: null };

  function startGame() {
    game.active = true;
    const touch = window.matchMedia('(hover: none)').matches;
    game.w = touch ? 26 : 38;
    game.h = touch ? 11 : 13;
    game.player = { x: 4, y: 6 };
    game.bot = { x: 33, y: 6 };
    game.score = 0;
    game.pellets = [];
    while (game.pellets.length < 3) spawnPellet();
    game.frame = document.createElement('div');
    game.frame.className = 'term-line term-game';
    log.appendChild(game.frame);
    print(window.matchMedia('(hover: none)').matches
      ? 'orbit v0.1: swipe anywhere to move, collect *, avoid B. double-tap the board to quit.'
      : 'orbit v0.1: wasd/arrows to move, collect *, avoid B. q quits.');
    drawGame('collect 10 to win');
  }

  function spawnPellet() {
    const x = 1 + Math.floor(Math.random() * (game.w - 2));
    const y = 1 + Math.floor(Math.random() * (game.h - 2));
    const occupied = (game.player.x === x && game.player.y === y)
      || (game.bot.x === x && game.bot.y === y)
      || game.pellets.some((p) => p.x === x && p.y === y);
    if (!occupied) game.pellets.push({ x, y });
  }

  function drawGame(status) {
    const rows = [];
    rows.push('+' + '-'.repeat(game.w) + '+');
    for (let y = 0; y < game.h; y++) {
      let row = '';
      for (let x = 0; x < game.w; x++) {
        if (game.player.x === x && game.player.y === y) row += 'K';
        else if (game.bot.x === x && game.bot.y === y) row += 'B';
        else if (game.pellets.some((p) => p.x === x && p.y === y)) row += '*';
        else row += ' ';
      }
      rows.push('|' + row + '|');
    }
    rows.push('+' + '-'.repeat(game.w) + '+');
    rows.push(`score: ${game.score}/10   ${status || ''}`);
    game.frame.textContent = rows.join('\n');
    log.scrollTop = log.scrollHeight;
  }

  function endGame(message) {
    game.active = false;
    const best = Math.max(game.score, Number(localStorage.getItem('orbit-best') || 0));
    localStorage.setItem('orbit-best', String(best));
    drawGame('');
    print(`${message}  (score ${game.score}, best ${best})`);
  }

  function botStep() {
    const dx = Math.sign(game.player.x - game.bot.x);
    const dy = Math.sign(game.player.y - game.bot.y);
    if (Math.random() < 0.25) {
      // lateral wobble keeps it beatable
      if (Math.random() < 0.5) game.bot.x = clamp(game.bot.x + (Math.random() < 0.5 ? -1 : 1), 0, game.w - 1);
      else game.bot.y = clamp(game.bot.y + (Math.random() < 0.5 ? -1 : 1), 0, game.h - 1);
    } else if (Math.abs(game.player.x - game.bot.x) > Math.abs(game.player.y - game.bot.y)) {
      game.bot.x = clamp(game.bot.x + dx, 0, game.w - 1);
    } else {
      game.bot.y = clamp(game.bot.y + dy, 0, game.h - 1);
    }
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function gameKey(key) {
    const moves = {
      arrowup: [0, -1], w: [0, -1],
      arrowdown: [0, 1], s: [0, 1],
      arrowleft: [-1, 0], a: [-1, 0],
      arrowright: [1, 0], d: [1, 0],
    };
    const k = key.toLowerCase();
    if (k === 'q' || k === 'escape') { endGame('you powered down the simulator.'); return; }
    const mv = moves[k];
    if (!mv) return;
    game.player.x = clamp(game.player.x + mv[0], 0, game.w - 1);
    game.player.y = clamp(game.player.y + mv[1], 0, game.h - 1);
    const hit = game.pellets.findIndex((p) => p.x === game.player.x && p.y === game.player.y);
    if (hit >= 0) {
      game.pellets.splice(hit, 1);
      game.score += 1;
      while (game.pellets.length < 3) spawnPellet();
    }
    if (game.score >= 10) { endGame('you win. the leaderboard remains very far away.'); return; }
    const steps = game.score >= 6 ? 2 : 1;
    for (let i = 0; i < steps; i++) {
      botStep();
      if (game.bot.x === game.player.x && game.bot.y === game.player.y) {
        endGame('B caught you. self-play makes brutal opponents.');
        return;
      }
    }
    drawGame(game.score >= 6 ? 'B is accelerating' : '');
  }

  function run(line) {
    print(`${prompt()} ${line}`);
    const parsed = parseCommandLine(line);
    if (!parsed) return;
    const { cmd, args } = parsed;

    if (cmd === 'play' || cmd === 'orbit') {
      startGame();
      return;
    }

    if (cmd === 'ls') {
      print(entriesFor(args[0] === 'blog' ? '~/blog' : cwd).join('  '));
      return;
    }
    if (cmd === 'cd') {
      const target = (args[0] || '~').replace(/\/$/, '');
      if (target === '~' || target === '/' || target === '..' && cwd === '~/blog') cwd = '~';
      else if (target === '..') cwd = '~';
      else if (target === 'blog' || target === '~/blog') cwd = '~/blog';
      else { print(`cd: ${target}: No such directory`); return; }
      refreshPrompt();
      return;
    }
    if (cmd === 'cat' && cwd === '~/blog' && args[0] && !args[0].includes('/')) {
      commands.cat([`blog/${args[0]}`]);
      return;
    }
    if (commands[cmd]) {
      commands[cmd](args);
      return;
    }
    // bare page/post name acts like open
    if (cmd && entriesFor(cwd).some((e) => e.replace(/\.md$/, '').replace(/\/$/, '') === cmd)) {
      commands.open([cmd]);
      return;
    }
    print(`${cmd}: command not found. try: help`);
  }

  input.addEventListener('keydown', (e) => {
    if (game.active) {
      e.preventDefault();
      gameKey(e.key);
      return;
    }
    if (e.key === 'Enter') {
      const line = input.value;
      input.value = '';
      if (line.trim()) {
        history.push(line);
        histIdx = history.length;
        run(line);
      } else {
        print(prompt());
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx > 0) { histIdx -= 1; input.value = history[histIdx] || ''; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < history.length) { histIdx += 1; input.value = history[histIdx] || ''; }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.value.split(/\s+/);
      const last = parts[parts.length - 1];
      if (!last) return;
      const pool = parts.length === 1
        ? ['ls', 'cd', 'cat', 'open', 'pwd', 'whoami', 'date', 'history', 'play', 'fortune', 'cowsay', 'motd', 'theme', 'reboot', 'clear', 'exit', 'help']
        : entriesFor(cwd).map((x) => x.replace(/\/$/, ''));
      const match = pool.find((p) => p.startsWith(last));
      if (match) {
        parts[parts.length - 1] = match;
        input.value = parts.join(' ');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeTerminal();
    }
  });

  overlay.addEventListener('mousedown', () => input.focus());

  // Touch controls: swipe to steer the game, double-tap to quit it
  let touchStart = null;
  let lastTap = 0;
  overlay.addEventListener('touchstart', (e) => {
    if (!game.active) return;
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  overlay.addEventListener('touchmove', (e) => {
    if (game.active) e.preventDefault();
  }, { passive: false });
  overlay.addEventListener('touchend', (e) => {
    if (!game.active || !touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) {
      const now = Date.now();
      if (now - lastTap < 400) { gameKey('q'); lastTap = 0; }
      else lastTap = now;
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) gameKey(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    else gameKey(dy > 0 ? 'ArrowDown' : 'ArrowUp');
  }, { passive: true });

  refreshPrompt();
  print('keithtyser.com terminal. help for commands, esc to leave.');
  print(motdLine());

  term = { overlay, input };
  window.__terminal = { open: openTerminal, close: closeTerminal };
}

function relativeTime(date) {
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 30) return `${day}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeText(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
