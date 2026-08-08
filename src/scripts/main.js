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

  initPalette();
  initKonami();
  initIdle();
  initListen();
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
    echo: (args) => ctx.print(args.join(' ')),
    fortune: () => ctx.print(randomFortune()),
    cowsay: (args) => ctx.print(cowsay(args.join(' ') || randomFortune())),
    motd: () => ctx.print(motdLine()),
    say: (args) => {
      const text = args.join(' ') || randomFortune();
      speak(text);
      ctx.print(`saying: "${text}"`);
    },
    sound: (args) => {
      const mode = (args[0] || '').toLowerCase();
      if (mode === 'on') { sound.set(true); ctx.print('sound: on. the console hums.'); }
      else if (mode === 'off') { sound.set(false); ctx.print('sound: off.'); }
      else ctx.print(`sound is ${sound.enabled ? 'on' : 'off'}. usage: sound on | off`);
    },
    matrix: () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        ctx.print('matrix: reduced motion is on. no rain today.');
        return;
      }
      ctx.close();
      startMatrix();
    },
    demo: () => { ctx.close(); runDemo(); },
    startx: () => { ctx.close(); bootOS(); },
    top: (args) => {
      if (ctx.isTerminal) return; // terminal runs the live version
      ctx.print(collectTopStats(null));
    },
    help: () => ctx.print(
      ctx.isTerminal
        ? 'commands: ls, cd, cat <file>, open <file>, pwd, whoami, date, history, play, top, selfie, chat, matrix, say, sound, demo, startx, fortune, cowsay, motd, theme [crt|dark|light], reboot, clear, exit\ntab completes. up/down for history. esc leaves.'
        : 'try: whoami, cat <page>, history, chat, fortune, matrix, demo, startx, theme crt, terminal. or just type where you want to go.',
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
          sound.tick();
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
    { title: 'Chat with keef-mini', hint: 'ai in your tab', action: 'chat' },
    { title: 'Toggle theme', hint: 'action', action: 'theme' },
    { title: 'GitHub', hint: 'social', href: 'https://github.com/keithtyser', external: true },
    { title: 'LinkedIn', hint: 'social', href: 'https://linkedin.com/in/keithtyser/', external: true },
    { title: 'X (Twitter)', hint: 'social', href: 'https://twitter.com/keithtyser', external: true },
    { title: 'Google Scholar', hint: 'social', href: 'https://scholar.google.com/citations?user=LyyIWSYAAAAJ', external: true },
    { title: 'Kaggle', hint: 'social', href: 'https://www.kaggle.com/keithtyser', external: true },
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
      cmdCtx.print('home/  writing/  shipped/  archive/  now/  tech-stack/  ai/');
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
    if (item.action === 'chat') {
      close();
      openTerminal().then(() => {
        if (window.__terminal) window.__terminal.run('chat');
      });
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

  // keef-mini chat state
  const chat = {
    engine: null,
    loading: false,
    gate: false,      // awaiting y/n on the download
    mode: false,      // input lines go to the model
    busy: false,      // a generation is in flight
    nano: false,
    history: [],
    context: null,    // { bio, chunks } from chat-context.json
  };

  const prompt = () => (chat.mode
    ? `${chat.nano ? 'keef-nano' : 'keef-mini'}>`
    : `keith@keithtyser.com:${cwd}$`);
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
    return ['blog/', 'home', 'shipped', 'archive', ...pages];
  }

  function blogEntries() {
    return siteData.posts.map((p) => `${slugOf(p)}.md`);
  }

  function entriesFor(dir) {
    return dir === '~/blog' ? blogEntries() : rootEntries();
  }

  /* ---- "orbit" mini-game: collect *, outrun B. turn-based. ---- */
  const game = { active: false, frame: null };

  // A "program" temporarily owns the keyboard (top, selfie)
  let prog = null;

  function makeFrame() {
    const frame = document.createElement('div');
    frame.className = 'term-line term-game';
    log.appendChild(frame);
    return frame;
  }

  function startTop() {
    const frame = makeFrame();
    print('top: live page metrics. q quits.');
    let frames = 0;
    let rafId = 0;
    const countFrame = () => { frames += 1; rafId = requestAnimationFrame(countFrame); };
    countFrame();
    const render = (fps) => {
      frame.textContent = collectTopStats(fps);
      log.scrollTop = log.scrollHeight;
    };
    render('...');
    const iv = setInterval(() => {
      render(frames);
      frames = 0;
    }, 1000);
    prog = {
      key: (k) => {
        if (k === 'q' || k === 'Escape') {
          clearInterval(iv);
          cancelAnimationFrame(rafId);
          prog = null;
          print('top: stopped.');
        }
      },
    };
  }

  async function startSelfie() {
    print('selfie: your camera, rendered as text, entirely on your machine. nothing is uploaded. q quits.');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 180 } });
    } catch {
      print('selfie: no camera access. probably wise.');
      return;
    }
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    await video.play();
    const W = 64;
    const H = 28;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const cx = canvas.getContext('2d', { willReadFrequently: true });
    const frame = makeFrame();
    const RAMP = ' .:-=+*#%@';
    const iv = setInterval(() => {
      cx.save();
      cx.scale(-1, 1);
      cx.drawImage(video, -W, 0, W, H);
      cx.restore();
      const d = cx.getImageData(0, 0, W, H).data;
      let out = '';
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const l = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
          out += RAMP[Math.min(RAMP.length - 1, Math.floor(l * RAMP.length))];
        }
        out += '\n';
      }
      frame.textContent = out;
      log.scrollTop = log.scrollHeight;
    }, 100);
    prog = {
      key: (k) => {
        if (k === 'q' || k === 'Escape') {
          clearInterval(iv);
          stream.getTracks().forEach((t) => t.stop());
          prog = null;
          print('selfie: camera off.');
        }
      },
    };
  }

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
      sound.blip();
      while (game.pellets.length < 3) spawnPellet();
    }
    if (game.score >= 10) {
      sound.win();
      endGame('you win. the leaderboard remains very far away.');
      return;
    }
    const steps = game.score >= 6 ? 2 : 1;
    for (let i = 0; i < steps; i++) {
      botStep();
      if (game.bot.x === game.player.x && game.bot.y === game.player.y) {
        sound.over();
        endGame('B caught you. self-play makes brutal opponents.');
        return;
      }
    }
    drawGame(game.score >= 6 ? 'B is accelerating' : '');
  }

  /* ---- keef-mini: a small LLM in the visitor's browser ---- */
  const CHAT_MODELS = {
    main: { id: 'Qwen3.5-0.8B-q4f16_1-MLC', label: 'keef-mini (qwen3.5-0.8b, ~520MB download)' },
    nano: { id: 'SmolLM2-360M-Instruct-q4f16_1-MLC', label: 'keef-nano (smollm2-360m, ~210MB download)' },
  };

  async function loadChatContext() {
    if (chat.context) return chat.context;
    const res = await fetch('/chat-context.json');
    chat.context = res.ok ? await res.json() : { bio: '', chunks: [] };
    return chat.context;
  }

  function retrieveChunks(question, k = 2) {
    const stop = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'to', 'is', 'are', 'was', 'what', 'whats', 'who', 'how', 'does', 'do', 'did', 'his', 'her', 'their', 'keith', 'tyser', 'about', 'with', 'for', 'you', 'your', 'tell', 'me']);
    const terms = question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter((t) => t.length > 2 && !stop.has(t));
    if (!terms.length) return [];
    const scored = chat.context.chunks.map((c) => {
      const lc = c.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (lc.includes(t)) score += 2;
        if (lc.slice(0, 80).includes(t)) score += 1; // title/topic bonus
      }
      return { c, score };
    }).filter((x) => x.score > 1);
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map((x) => x.c);
  }

  function chatGateOpen(nano) {
    chat.nano = Boolean(nano);
    const m = chat.nano ? CHAT_MODELS.nano : CHAT_MODELS.main;
    print(`${m.label}`);
    print('runs entirely in this tab via webgpu. one download, cached after that. no servers, no api keys, nothing leaves your browser.');
    print('small models are charming but fallible: for ground truth, read the actual posts.');
    print('proceed? [y/n]');
    chat.gate = true;
  }

  async function chatLoad() {
    chat.gate = false;
    if (!navigator.gpu) {
      print('chat: this browser has no webgpu. your browser cannot run a language model yet. imagine that sentence five years ago.');
      return;
    }
    chat.loading = true;
    const m = chat.nano ? CHAT_MODELS.nano : CHAT_MODELS.main;
    const progressLine = makeFrame();
    progressLine.textContent = 'fetching webllm runtime...';
    try {
      const [webllm] = await Promise.all([
        import('https://esm.run/@mlc-ai/web-llm@0.2.84'),
        loadChatContext(),
      ]);
      const engine = await webllm.CreateMLCEngine(
        m.id,
        {
          initProgressCallback: (p) => {
            progressLine.textContent = p.text.length > 90 ? `${p.text.slice(0, 90)}…` : p.text;
            log.scrollTop = log.scrollHeight;
          },
        },
        { context_window_size: 3072 },
      );
      chat.engine = engine;
      chat.mode = true;
      chat.history = [];
      progressLine.textContent = 'model loaded.';
      sound.boot();
      print(`${chat.nano ? 'keef-nano' : 'keef-mini'} online. ask about keith, the lab, the projects. /exit leaves, /clear resets, /stats for numbers.`);
      refreshPrompt();
    } catch (err) {
      progressLine.textContent = 'model load failed.';
      print(`chat: ${err && err.message ? String(err.message).slice(0, 120) : 'load error'}`);
      if (!chat.nano) print('that can be a memory limit. try the smaller model: chat small');
    } finally {
      chat.loading = false;
    }
  }

  async function chatSend(text) {
    if (chat.busy) { print('keef-mini is still typing. patience.'); return; }
    chat.busy = true;
    const excerpts = retrieveChunks(text);
    const system = `You are keef-mini, a tiny language model running entirely inside a visitor's browser tab on keithtyser.com, Keith Tyser's personal site. You answer questions about Keith using the FACTS below plus any SITE EXCERPTS in the user message. Answer naturally and directly from what you know here; broad questions like "tell me about keith" are answered from FACTS. Greetings and small talk get one short friendly line. Only when the user asks for specific information that genuinely appears nowhere in the FACTS or excerpts, reply: "that's not on the site - try the palette search (ctrl+k)". Keep answers under 80 words. Plain text, no markdown. A dry, lowercase tone fits the house.\n\nFACTS:\n${chat.context.bio}`;
    const userMsg = excerpts.length
      ? `site excerpts:\n${excerpts.join('\n')}\n\nquestion: ${text}`
      : `question: ${text}`;
    const messages = [
      { role: 'system', content: system },
      ...chat.history.slice(-4),
      { role: 'user', content: userMsg },
    ];
    const out = makeFrame();
    out.textContent = '…';
    let acc = '';
    try {
      const stream = await chat.engine.chat.completions.create({
        messages,
        stream: true,
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 220,
        extra_body: { enable_thinking: false },
      });
      for await (const part of stream) {
        acc += (part.choices[0] && part.choices[0].delta && part.choices[0].delta.content) || '';
        out.textContent = acc.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').trimStart() || '…';
        log.scrollTop = log.scrollHeight;
      }
      const clean = acc.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').trim();
      out.textContent = clean || '(empty reply. small models, man.)';
      chat.history.push({ role: 'user', content: text }, { role: 'assistant', content: clean });
      try {
        const stats = await chat.engine.runtimeStatsText();
        const dim = document.createElement('div');
        dim.className = 'term-line term-dim';
        dim.textContent = `[ ${stats} ]`;
        log.appendChild(dim);
      } catch { /* stats are a bonus */ }
      log.scrollTop = log.scrollHeight;
    } catch (err) {
      out.textContent = `chat error: ${err && err.message ? String(err.message).slice(0, 120) : 'generation failed'}`;
    } finally {
      chat.busy = false;
    }
  }

  function run(line) {
    print(`${prompt()} ${line}`);

    // chat interceptors come before normal command parsing
    if (chat.gate) {
      chat.gate = false;
      if (line.trim().toLowerCase() === 'y') chatLoad();
      else print('chat: aborted. the weights remain undownloaded.');
      return;
    }
    if (chat.mode) {
      const t = line.trim();
      if (t === '/exit') {
        chat.mode = false;
        refreshPrompt();
        print('keef-mini suspended. chat re-enters without re-downloading.');
        return;
      }
      if (t === '/clear') { chat.history = []; print('context cleared.'); return; }
      if (t === '/stats') {
        chat.engine.runtimeStatsText().then((s) => print(`[ ${s} ]`)).catch(() => print('no stats yet.'));
        return;
      }
      if (t) chatSend(t);
      return;
    }

    const parsed = parseCommandLine(line);
    if (!parsed) return;
    const { cmd, args } = parsed;

    if (cmd === 'chat') {
      if (chat.loading) { print('chat: still loading.'); return; }
      if (chat.engine) {
        chat.mode = true;
        refreshPrompt();
        print(`${chat.nano ? 'keef-nano' : 'keef-mini'} resumed. /exit leaves.`);
      } else {
        chatGateOpen(args[0] === 'small');
      }
      return;
    }

    if (cmd === 'play' || cmd === 'orbit') {
      startGame();
      return;
    }
    if (cmd === 'top') {
      startTop();
      return;
    }
    if (cmd === 'selfie') {
      startSelfie();
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
    if (e.isTrusted) {
      if (e.key === 'Enter') sound.enter();
      else if (e.key.length === 1) sound.click();
    }
    if (prog) {
      e.preventDefault();
      prog.key(e.key);
      return;
    }
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
        ? ['ls', 'cd', 'cat', 'open', 'pwd', 'whoami', 'date', 'history', 'play', 'top', 'selfie', 'chat', 'matrix', 'say', 'sound', 'demo', 'startx', 'fortune', 'cowsay', 'motd', 'theme', 'reboot', 'clear', 'exit', 'help']
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
  window.__terminal = { open: openTerminal, close: closeTerminal, play: startGame, run };
}

/* =================================================================
   Sound design: synthesized, opt-in via "sound on", off by default.
   No audio files; everything is WebAudio oscillators.
   ================================================================= */
const sound = {
  enabled: localStorage.getItem('sound') === '1',
  ctx: null,
  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* no audio */ }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(freq, dur = 0.05, type = 'square', gain = 0.03, when = 0) {
    if (!this.enabled) return;
    const c = this.ensure();
    if (!c) return;
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  },
  click() { this.tone(1700 + Math.random() * 600, 0.012, 'square', 0.012); },
  enter() { this.tone(440, 0.04, 'square', 0.02); },
  blip() { this.tone(880, 0.05, 'sine', 0.03); },
  tick() { this.tone(1100, 0.02, 'square', 0.015); },
  boot() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.09, 'sine', 0.03, i * 0.09)); },
  win() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.08, 'sine', 0.03, i * 0.08)); },
  over() { [392, 311, 233].forEach((f, i) => this.tone(f, 0.12, 'sine', 0.03, i * 0.1)); },
  set(on) {
    this.enabled = on;
    if (on) {
      localStorage.setItem('sound', '1');
      this.blip();
    } else {
      localStorage.removeItem('sound');
    }
  },
};

/* =================================================================
   Deep layer: say, top stats, matrix, demo, konami, idle, KeithOS.
   Everything opt-in; the default page stays calm.
   ================================================================= */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function speak(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    window.speechSynthesis.speak(u);
  } catch { /* no speech support */ }
}

function collectTopStats(fps) {
  const up = Math.round(performance.now() / 1000);
  const mem = performance.memory
    ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)} MB used`
    : 'n/a (chromium only)';
  const nav = performance.getEntriesByType('navigation')[0];
  const res = performance.getEntriesByType('resource');
  const bytes = ((nav && nav.transferSize) || 0)
    + res.reduce((s, r) => s + (r.transferSize || 0), 0);
  const conn = (navigator.connection && navigator.connection.effectiveType) || 'unknown';
  let lsBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    lsBytes += k.length + (localStorage.getItem(k) || '').length;
  }
  const lines = [
    `uptime     ${up}s since page boot`,
    `heap       ${mem}`,
    `transfer   ${(bytes / 1024).toFixed(0)} KB this page`,
    `network    ${conn}`,
    `storage    ${localStorage.length} keys · ${(lsBytes / 1024).toFixed(1)} KB localStorage`,
  ];
  if (fps !== null && fps !== undefined) lines.push(`fps        ${fps}`);
  return lines.join('\n');
}

/* ---- matrix rain ---- */
let matrixStop = null;

function startMatrix() {
  if (matrixStop) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'matrix-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const cx = canvas.getContext('2d');
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue('--accent').trim() || '#7ce38b';
  const bg = styles.getPropertyValue('--bg').trim() || '#0a0c0a';
  cx.fillStyle = bg;
  cx.fillRect(0, 0, canvas.width, canvas.height);
  const colW = 14;
  const cols = Math.ceil(canvas.width / colW);
  const drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -60));
  const CH = 'abcdefghijklmnopqrstuvwxyz0123456789$#@*+=<>/\\|';
  const iv = setInterval(() => {
    cx.globalAlpha = 0.14;
    cx.fillStyle = bg;
    cx.fillRect(0, 0, canvas.width, canvas.height);
    cx.globalAlpha = 1;
    cx.fillStyle = accent;
    cx.font = '13px monospace';
    for (let i = 0; i < cols; i++) {
      const ch = CH[Math.floor(Math.random() * CH.length)];
      cx.fillText(ch, i * colW, drops[i] * 16);
      drops[i] += 1;
      if (drops[i] * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
    }
  }, 50);
  const stop = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    clearInterval(iv);
    canvas.remove();
    document.removeEventListener('keydown', stop, true);
    document.removeEventListener('pointerdown', stop, true);
    window.removeEventListener('resize', resize);
    matrixStop = null;
  };
  document.addEventListener('keydown', stop, true);
  document.addEventListener('pointerdown', stop, true);
  window.addEventListener('resize', resize);
  matrixStop = stop;
}

/* ---- attract mode ---- */
let demoActive = false;

async function typeInto(input, text, perChar = 65) {
  for (const ch of text) {
    if (!demoActive) return false;
    input.value += ch;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(perChar);
  }
  return demoActive;
}

async function runDemo() {
  if (demoActive) return;
  demoActive = true;
  sessionStorage.setItem('demo-done', '1');
  // only real user input cancels; the demo's own synthetic events
  // (isTrusted: false) must not stop the show
  const cancel = (e) => { if (e.isTrusted) demoActive = false; };
  document.addEventListener('keydown', cancel, true);
  document.addEventListener('pointerdown', cancel, true);
  const alive = async (ms) => { await sleep(ms); return demoActive; };
  try {
    if (!await alive(600)) return;
    window.__palette.open();
    if (!await alive(800)) return;
    const pin = document.querySelector('.palette-input');
    if (!await typeInto(pin, 'dgx spark')) return;
    if (!await alive(1400)) return;
    window.__palette.close();
    if (!await alive(500)) return;
    await openTerminal();
    const tin = document.querySelector('.term-input');
    if (!await typeInto(tin, 'fortune | cowsay')) return;
    tin.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    if (!await alive(1800)) return;
    if (!await typeInto(tin, 'play')) return;
    tin.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    const moves = ['ArrowRight', 'ArrowRight', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'];
    for (const m of moves) {
      if (!await alive(420)) return;
      tin.dispatchEvent(new KeyboardEvent('keydown', { key: m, bubbles: true }));
    }
    if (!await alive(700)) return;
    tin.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true }));
    if (!await alive(400)) return;
    if (window.__terminal) window.__terminal.run('echo demo over. your turn: try help.');
  } finally {
    document.removeEventListener('keydown', cancel, true);
    document.removeEventListener('pointerdown', cancel, true);
    demoActive = false;
  }
}

/* ---- konami ---- */
function initKonami() {
  const SEQ = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let idx = 0;
  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    idx = k === SEQ[idx] ? idx + 1 : (k === SEQ[0] ? 1 : 0);
    if (idx === SEQ.length) {
      idx = 0;
      openTerminal().then(() => {
        if (window.__terminal) window.__terminal.play();
      });
    }
  });
}

/* ---- idle: CRT screensaver, homepage attract ---- */
function initIdle() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let timer = 0;
  const onIdle = () => {
    if (document.hidden || demoActive || matrixStop) { reset(); return; }
    if (document.documentElement.classList.contains('crt')) {
      startMatrix();
    } else if (
      (window.location.pathname === '/' || window.location.pathname.endsWith('/index.html'))
      && !window.location.pathname.includes('/blog/')
      && !sessionStorage.getItem('demo-done')
      && !terminalIsOpen()
    ) {
      runDemo();
    }
    reset();
  };
  const reset = () => {
    clearTimeout(timer);
    timer = setTimeout(onIdle, 90000);
  };
  ['pointermove', 'keydown', 'scroll', 'touchstart'].forEach((ev) => {
    window.addEventListener(ev, reset, { passive: true });
  });
  reset();
}

/* ---- listen: the blog reads itself ---- */
function initListen() {
  const body = document.querySelector('.article-body');
  const dateEl = document.querySelector('.article-date');
  if (!body || !dateEl || !('speechSynthesis' in window)) return;
  const sep = document.createElement('span');
  sep.className = 'sb-sep';
  sep.setAttribute('aria-hidden', 'true');
  sep.textContent = ' · ';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'listen-btn';
  btn.textContent = '▸ listen';
  dateEl.appendChild(sep);
  dateEl.appendChild(btn);
  let playing = false;
  const stopAll = () => {
    window.speechSynthesis.cancel();
    playing = false;
    btn.textContent = '▸ listen';
  };
  btn.addEventListener('click', () => {
    if (playing) { stopAll(); return; }
    const parts = [...body.querySelectorAll('p, li, h2, h3, blockquote')]
      .filter((el) => !el.closest('pre') && el.textContent.trim())
      .map((el) => el.textContent.replace(/^#\s*/, '').trim());
    if (!parts.length) return;
    playing = true;
    btn.textContent = '■ stop';
    let i = 0;
    const next = () => {
      if (!playing || i >= parts.length) { stopAll(); return; }
      const u = new SpeechSynthesisUtterance(parts[i]);
      i += 1;
      u.onend = next;
      u.onerror = stopAll;
      window.speechSynthesis.speak(u);
    };
    window.speechSynthesis.cancel();
    next();
  });
  window.addEventListener('pagehide', stopAll);
}

/* =================================================================
   KeithOS: startx from the terminal or palette.
   ================================================================= */
let os = null;

async function bootOS() {
  await loadSiteData();
  if (!os) buildOS();
  sound.boot();
  os.overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  if (!os.booted) {
    os.booted = true;
    osOpenWindow('about');
    if (!window.matchMedia('(max-width: 700px)').matches) osOpenWindow('files');
  }
}

function shutdownOS() {
  if (!os) return;
  os.overlay.classList.remove('is-open');
  document.body.style.overflow = '';
  os.windows.forEach((w) => w.cleanup && w.cleanup());
}

function buildOS() {
  const overlay = document.createElement('div');
  overlay.className = 'os-overlay';
  overlay.innerHTML = `
    <div class="os-topbar">
      <span class="os-brand">keithos 0.1</span>
      <span class="os-topbar-right">
        <span class="os-clock" aria-hidden="true"></span>
        <button type="button" class="os-shutdown">shutdown</button>
      </span>
    </div>
    <div class="os-desktop"></div>
    <nav class="os-dock" aria-label="KeithOS dock">
      <button type="button" data-app="files">files</button>
      <button type="button" data-app="monitor">monitor</button>
      <button type="button" data-app="orbit">orbit</button>
      <button type="button" data-app="terminal">terminal</button>
      <button type="button" data-app="about">about</button>
    </nav>`;
  document.body.appendChild(overlay);

  const desktop = overlay.querySelector('.os-desktop');
  const clock = overlay.querySelector('.os-clock');
  setInterval(() => {
    const n = new Date();
    const pad = (x) => String(x).padStart(2, '0');
    clock.textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}`;
  }, 1000);

  overlay.querySelector('.os-shutdown').addEventListener('click', shutdownOS);
  overlay.querySelectorAll('.os-dock button').forEach((b) => {
    b.addEventListener('click', () => {
      const app = b.dataset.app;
      if (app === 'terminal') { shutdownOS(); openTerminal(); return; }
      if (app === 'orbit') {
        shutdownOS();
        openTerminal().then(() => window.__terminal && window.__terminal.play());
        return;
      }
      osOpenWindow(app);
    });
  });

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') shutdownOS();
  });

  os = { overlay, desktop, windows: new Map(), z: 10, cascade: 0, booted: false };
}

function osFocus(win) {
  os.z += 1;
  win.el.style.zIndex = String(os.z);
}

function osOpenWindow(kind, payload) {
  const id = kind === 'reader' ? `reader:${payload && payload.src}` : kind;
  if (os.windows.has(id)) {
    osFocus(os.windows.get(id));
    return;
  }
  const mobile = window.matchMedia('(max-width: 700px)').matches;
  if (mobile) {
    // one window at a time on small screens
    os.windows.forEach((w) => osCloseWindow(w));
  }
  const el = document.createElement('section');
  el.className = 'os-window';
  const titles = { files: '~/files', monitor: 'monitor', about: 'about.txt' };
  const title = kind === 'reader' ? (payload.title || 'reader') : titles[kind] || kind;
  el.innerHTML = `
    <header class="os-titlebar">
      <span class="os-title">${escapeText(title)}</span>
      <button type="button" class="os-close" aria-label="Close window">×</button>
    </header>
    <div class="os-body"></div>`;
  if (!mobile) {
    const offset = (os.cascade % 5) * 32;
    os.cascade += 1;
    el.style.left = `${48 + offset}px`;
    el.style.top = `${56 + offset}px`;
  }
  os.desktop.appendChild(el);

  const win = { id, el, cleanup: null };
  os.windows.set(id, win);
  osFocus(win);
  el.addEventListener('pointerdown', () => osFocus(win));
  el.querySelector('.os-close').addEventListener('click', () => osCloseWindow(win));

  // drag by titlebar (desktop only)
  if (!mobile) {
    const bar = el.querySelector('.os-titlebar');
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.os-close')) return;
      const startX = e.clientX - el.offsetLeft;
      const startY = e.clientY - el.offsetTop;
      const move = (ev) => {
        el.style.left = `${Math.max(0, ev.clientX - startX)}px`;
        el.style.top = `${Math.max(0, ev.clientY - startY)}px`;
      };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });
  }

  const body = el.querySelector('.os-body');
  if (kind === 'about') {
    body.innerHTML = `<pre class="os-pre">keith tyser
ai-ml engineer · data scientist · cyber ops officer

this is keithos, the layer under keithtyser.com.
drag the windows. read the files. play orbit.
shutdown returns you to the regular site.

contact: keithtyser@gmail.com</pre>`;
  } else if (kind === 'files') {
    const entries = [...siteData.pages.filter((p) => p.src), ...siteData.posts];
    body.innerHTML = `<ul class="os-files">${entries
      .map((p, i) => `<li><button type="button" data-idx="${i}">${escapeText(slugOf(p))}.md</button></li>`)
      .join('')}</ul>`;
    body.querySelectorAll('button[data-idx]').forEach((b) => {
      b.addEventListener('click', () => {
        const entry = entries[Number(b.dataset.idx)];
        osOpenWindow('reader', { src: entry.src, title: `${slugOf(entry)}.md` });
      });
    });
  } else if (kind === 'reader') {
    body.innerHTML = '<pre class="os-pre">loading…</pre>';
    fetch(payload.src)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((text) => { body.querySelector('.os-pre').textContent = text; })
      .catch(() => { body.querySelector('.os-pre').textContent = 'read error.'; });
  } else if (kind === 'monitor') {
    const pre = document.createElement('pre');
    pre.className = 'os-pre os-monitor';
    body.appendChild(pre);
    pre.textContent = collectTopStats(null);
    const iv = setInterval(() => { pre.textContent = collectTopStats(null); }, 1000);
    win.cleanup = () => clearInterval(iv);
  }
}

function osCloseWindow(win) {
  if (win.cleanup) win.cleanup();
  win.el.remove();
  os.windows.delete(win.id);
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
