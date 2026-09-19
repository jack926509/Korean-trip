export function normalize(value = '') {
  return value.toLocaleLowerCase('zh-Hant').replace(/\s+/g, '');
}

export function matchesCard(card, { query = '', filter = '' } = {}) {
  const queryMatch = !normalize(query) || normalize(card.search).includes(normalize(query));
  const filterMatch = !filter || card.filters.includes(filter);
  return queryMatch && filterMatch;
}

function setupFilters() {
  for (const scope of document.querySelectorAll('[data-filter-scope]')) {
    const search = scope.querySelector('[data-search]');
    const select = scope.querySelector('[data-filter]');
    const cards = [...scope.querySelectorAll('[data-card]')];
    const empty = scope.querySelector('[data-empty]');
    const count = scope.querySelector('[data-result-count]');
    const apply = () => {
      let shown = 0;
      for (const card of cards) {
        const visible = matchesCard(
          { search: card.dataset.searchText || '', filters: (card.dataset.filters || '').split('|') },
          { query: search?.value || '', filter: select?.value || '' }
        );
        card.hidden = !visible;
        if (visible) shown += 1;
      }
      if (empty) empty.hidden = shown !== 0;
      if (count) count.textContent = `顯示 ${shown} 筆`;
    };
    search?.addEventListener('input', apply);
    select?.addEventListener('change', apply);
    for (const clear of scope.querySelectorAll('[data-clear]')) clear.addEventListener('click', () => {
      if (search) search.value = '';
      if (select) select.value = '';
      apply();
      search?.focus();
    });
    apply();
  }
}

function setupDays() {
  const tabs = [...document.querySelectorAll('[data-day-tab]')];
  const panels = [...document.querySelectorAll('[data-day-panel]')];
  if (!tabs.length) return;
  const activate = (id) => {
    if (!tabs.some((tab) => tab.dataset.dayTab === id)) id = tabs[0].dataset.dayTab;
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
  setupFilters();
  setupDays();
}
