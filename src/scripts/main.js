document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------------------------------------------
  // Dark mode toggle
  // ---------------------------------------------------------------
  const toggleButton = document.getElementById('darkModeToggle');
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleTheme);
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
  // Command palette
  // ---------------------------------------------------------------
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

/* =================================================================
   Command palette: Ctrl+K / Cmd+K / "/" or the statusbar hint.
   DOM built lazily on first open; page/post data from /palette.json.
   ================================================================= */
function initPalette() {
  const STATIC_ITEMS = [
    { title: 'Toggle theme', hint: 'action', action: 'theme' },
    { title: 'GitHub', hint: 'social', href: 'https://github.com/keithtyser', external: true },
    { title: 'LinkedIn', hint: 'social', href: 'https://linkedin.com/in/keithtyser/', external: true },
    { title: 'X (Twitter)', hint: 'social', href: 'https://twitter.com/keithtyser', external: true },
    { title: 'Google Scholar', hint: 'social', href: 'https://scholar.google.com/citations?user=LyyIWSYAAAAJ', external: true },
    { title: 'Email Keith', hint: 'social', href: 'mailto:keithtyser@gmail.com' },
    { title: 'RSS feed', hint: 'social', href: '/feed.xml' },
  ];

  // Terminal easter eggs: exact command input runs these instead of nav
  const COMMANDS = {
    whoami: () => 'guest. the one with the green status dot is keith.',
    pwd: () => `~${window.location.pathname.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '')}`,
    ls: () => 'home/  writing/  archive/  now/  books/  tech-stack/  ai/',
    sudo: () => 'guest is not in the sudoers file. this incident will be reported.',
    vim: () => 'you are now stuck in vim. refresh the page to exit.',
    'rm -rf /': () => 'nice try. this site is version controlled.',
    man: () => 'no manual entry. there never was a manual.',
    help: () => 'try: whoami, pwd, ls, sudo, vim, man, clear, exit. or just type where you want to go.',
    clear: 'clear',
    exit: 'exit',
  };

  let overlay = null;
  let input = null;
  let list = null;
  let output = null;
  let items = [];
  let filtered = [];
  let active = 0;
  let loaded = false;
  let lastFocused = null;

  function buildDom() {
    overlay = document.createElement('div');
    overlay.className = 'palette-overlay';
    overlay.innerHTML = `
      <div class="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div class="palette-head">
          <span class="palette-prompt" aria-hidden="true">$</span>
          <input class="palette-input" type="text" placeholder="jump to... (or try: whoami)" aria-label="Search pages, posts, and actions" autocomplete="off" spellcheck="false">
          <kbd class="palette-esc" aria-hidden="true">esc</kbd>
        </div>
        <div class="palette-output" role="status" hidden></div>
        <ul class="palette-list" role="listbox"></ul>
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
    const cmd = value.trim().toLowerCase();
    const handler = COMMANDS[cmd] || (cmd.startsWith('sudo ') ? COMMANDS.sudo : null)
      || (cmd.startsWith('rm ') ? COMMANDS['rm -rf /'] : null)
      || (cmd.startsWith('man ') ? COMMANDS.man : null);
    if (!handler) return false;
    if (handler === 'exit') { close(); return true; }
    if (handler === 'clear') {
      output.hidden = true;
      output.textContent = '';
      input.value = '';
      render();
      return true;
    }
    output.textContent = `$ ${cmd}\n${handler()}`;
    output.hidden = false;
    input.value = '';
    render();
    return true;
  }

  async function loadItems() {
    if (loaded) return;
    loaded = true;
    let dynamic = [];
    try {
      const res = await fetch('/palette.json');
      if (res.ok) {
        const data = await res.json();
        dynamic = [
          ...data.pages.map((p) => ({ title: p.title, hint: 'page', href: p.href })),
          ...data.posts.map((p) => ({ title: p.title, hint: p.date, href: p.href })),
        ];
      }
    } catch { /* palette still works with static items */ }
    items = [...dynamic, ...STATIC_ITEMS];
    render();
  }

  function render() {
    const q = input.value.trim().toLowerCase();
    filtered = q
      ? items.filter((i) => (i.title + ' ' + (i.hint || '')).toLowerCase().includes(q))
      : items.slice();
    if (active >= filtered.length) active = Math.max(0, filtered.length - 1);
    list.innerHTML = filtered.length
      ? filtered
          .map((item, idx) => `
        <li class="palette-item${idx === active ? ' is-active' : ''}" role="option" aria-selected="${idx === active}" data-idx="${idx}">
          <span class="palette-item-title">${escapeText(item.title)}</span>
          <span class="palette-item-hint">${escapeText(item.hint || '')}</span>
        </li>`)
          .join('')
      : '<li class="palette-empty">no matches found</li>';
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
    loadItems();
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
    if (e.key === '/' && !isOpen()) {
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
