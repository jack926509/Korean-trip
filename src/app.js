export function resolveDayId(ids, requestedId) {
  return ids.includes(requestedId) ? requestedId : ids[0];
}

function setupDays() {
  const tabs = [...document.querySelectorAll('[data-day-tab]')];
  const panels = [...document.querySelectorAll('[data-day-panel]')];
  if (!tabs.length) return;
  const activate = (id) => {
    id = resolveDayId(tabs.map((tab) => tab.dataset.dayTab), id);
    for (const tab of tabs) {
      const active = tab.dataset.dayTab === id;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    for (const panel of panels) panel.hidden = panel.dataset.dayPanel !== id;
  };
  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener('click', () => activate(tab.dataset.dayTab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const step = event.key === 'ArrowRight' ? 1 : -1;
      const target = tabs[(index + step + tabs.length) % tabs.length];
      activate(target.dataset.dayTab);
      target.focus();
    });
  }
  activate(new URLSearchParams(location.search).get('day') || tabs[0].dataset.dayTab);
}

if (typeof document !== 'undefined') {
  setupDays();
}
