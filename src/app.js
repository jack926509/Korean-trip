/** 網址帶的 day 參數只接受實際存在的日期，否則回到第一天。 */
export function resolveDayId(ids, requestedId) {
  return ids.includes(requestedId) ? requestedId : ids[0];
}

function setupDays() {
  const tabs = [...document.querySelectorAll('[data-day-tab]')];
  const panels = [...document.querySelectorAll('[data-day-panel]')];
  if (!tabs.length) return;

  const ids = tabs.map((tab) => tab.dataset.dayTab);

  const activate = (requestedId, { updateUrl = false } = {}) => {
    const id = resolveDayId(ids, requestedId);
    for (const tab of tabs) {
      const active = tab.dataset.dayTab === id;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      // 手機頁籤是橫向捲動的，切換後把目前這天帶進畫面。
      if (active && tab.scrollIntoView) tab.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
    for (const panel of panels) panel.hidden = panel.dataset.dayPanel !== id;

    // 重新整理或分享網址時仍停在同一天。
    if (updateUrl && window.history?.replaceState) {
      const url = new URL(location.href);
      url.searchParams.set('day', id);
      history.replaceState(null, '', url);
    }
  };

  const move = (fromIndex, step) => {
    const target = tabs[(fromIndex + step + tabs.length) % tabs.length];
    activate(target.dataset.dayTab, { updateUrl: true });
    target.focus();
  };

  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener('click', () => activate(tab.dataset.dayTab, { updateUrl: true }));
    tab.addEventListener('keydown', (event) => {
      const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
      if (step) {
        event.preventDefault();
        move(index, step);
        return;
      }
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        const target = event.key === 'Home' ? tabs[0] : tabs[tabs.length - 1];
        activate(target.dataset.dayTab, { updateUrl: true });
        target.focus();
      }
    });
  }

  activate(new URLSearchParams(location.search).get('day') || ids[0]);
}

if (typeof document !== 'undefined') {
  setupDays();
}
