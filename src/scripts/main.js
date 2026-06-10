document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------------------------------------------
  // Dark mode toggle
  // ---------------------------------------------------------------
  const toggleButton = document.getElementById('darkModeToggle');
  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      if (document.documentElement.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
      } else {
        localStorage.setItem('theme', 'light');
      }
    });
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
});

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
