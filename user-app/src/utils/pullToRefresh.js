// Pull-to-refresh gesture handler (mobile touch)
export function initPullToRefresh(onRefresh, scrollSelector = '.page') {
  let startY = 0;
  let pulling = false;
  let refreshing = false;
  let indicator = null;
  const THRESHOLD = 55;

  function getScrollTop() {
    const el = document.querySelector(scrollSelector);
    if (el) return el.scrollTop;
    return window.scrollY || document.documentElement.scrollTop || 0;
  }

  function ensureIndicator() {
    if (!indicator || !document.body.contains(indicator)) {
      indicator = document.createElement('div');
      indicator.className = 'ptr-indicator';
      indicator.innerHTML = '<span class="material-symbols-outlined ptr-icon">arrow_downward</span>';
      document.body.appendChild(indicator);
    }
    return indicator;
  }

  function removeIndicator() {
    if (indicator) {
      indicator.style.top = '-50px';
      indicator.style.opacity = '0';
      setTimeout(() => { if (indicator) { indicator.remove(); indicator = null; } }, 250);
    }
  }

  document.addEventListener('touchstart', (e) => {
    if (refreshing) return;
    if (getScrollTop() <= 5) {
      startY = e.touches[0].clientY;
      pulling = true;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!pulling || refreshing) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 10 && getScrollTop() <= 5) {
      const pull = Math.min(dy * 0.4, 70);
      const ind = ensureIndicator();
      ind.style.top = (pull - 20) + 'px';
      ind.style.opacity = String(Math.min(pull / THRESHOLD, 1));
      const icon = ind.querySelector('.ptr-icon');
      if (pull >= THRESHOLD) {
        icon.textContent = 'refresh';
        ind.dataset.ready = '1';
      } else {
        icon.textContent = 'arrow_downward';
        ind.dataset.ready = '';
      }
      icon.style.transform = `rotate(${(pull / THRESHOLD) * 180}deg)`;
    } else if (dy < 0) {
      removeIndicator();
      pulling = false;
    }
  }, { passive: true });

  document.addEventListener('touchend', async () => {
    if (!pulling || refreshing) { pulling = false; return; }
    pulling = false;
    if (!indicator || indicator.dataset.ready !== '1') { removeIndicator(); return; }

    refreshing = true;
    const icon = indicator.querySelector('.ptr-icon');
    icon.textContent = 'progress_activity';
    icon.style.transform = '';
    icon.style.animation = 'spin .8s linear infinite';
    indicator.style.top = '16px';

    try { await onRefresh(); } catch {}

    icon.style.animation = '';
    refreshing = false;
    removeIndicator();
  });
}
