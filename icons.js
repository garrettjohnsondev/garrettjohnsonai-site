// Original interface artwork. One 24px grid, 1.65px strokes, rounded ends.
// Never substitute emoji, font glyphs, or an external icon font.
const artwork = {
  arrow: '<path d="M5 19 19 5M6 5h13v13"/>',
  arrowRight: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  arrowLeft: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  layers: '<path d="m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  route: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M9 6h8a3 3 0 0 1 0 6H7a3 3 0 0 0 0 6h8"/>',
  branch: '<circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 12h3a4 4 0 0 0 4-4V5h3m-7 7a4 4 0 0 1 4 4v3h3"/>',
  checklist: '<path d="m3 6 2 2 3-4m3 2h10M3 12h5m3 0h10M3 18h5m3 0h10"/>',
  person: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2H4Z"/>',
  gate: '<path d="M5 21V4h14v17M9 21V8h6v13M2 21h20M12 8v13"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-14 4h3m4 0h3m-10 4h3"/>',
  inspect: '<circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 6 6M7 10h6m-6-3h4"/>',
  refresh: '<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
  cloud: '<path d="M7 18H6a4 4 0 0 1-.5-8A6.5 6.5 0 0 1 18 8.5a4.8 4.8 0 0 1 0 9.5h-1M12 21V12m-3 3 3-3 3 3"/>',
  book: '<path d="M12 6c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v15"/>',
  note: '<path d="M5 3h14v14l-4 4H5V3Zm10 18v-4h4M8 7h8M8 11h8M8 15h4"/>',
  arrowDown: '<path d="M12 4v16m-6-6 6 6 6-6"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  question: '<path d="M8 8a4 4 0 0 1 8 0c0 3-4 3-4 6"/><circle cx="12" cy="19" r=".8" fill="currentColor" stroke="none"/>',
  flag: '<path d="M6 21V3m0 1h12l-3 4 3 4H6"/>',
  foundation: '<rect x="4" y="14" width="7" height="7" rx="1"/><rect x="13" y="14" width="7" height="7" rx="1"/><rect x="8.5" y="3" width="7" height="7" rx="1"/>',
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12l9 3 9-3m-9 1v4"/>',
  target: '<circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="4"/><path d="m11 13 9-9m-4 0h4v4"/>',
  document: '<path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8m-8 4h6"/>',
  reply: '<path d="M4 4h16v12H9l-5 4V4Zm4 4h8m-8 4h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  alert: '<path d="m12 3 10 18H2L12 3Zm0 6v5"/><circle cx="12" cy="17.5" r=".8" fill="currentColor" stroke="none"/>',
};

const drawing = name => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${artwork[name] || artwork.arrow}</svg>`;

export function icon(name) {
  return drawing(name).replace('<svg ', `<svg class="icon icon-${name}" aria-hidden="true" focusable="false" `);
}

// CSS-generated link and list markers use exactly the same drawings.
export function installIconStyles() {
  for (const name of ['arrow', 'arrowLeft', 'check', 'chevron']) {
    document.documentElement.style.setProperty(`--icon-${name}`, `url("data:image/svg+xml,${encodeURIComponent(drawing(name))}")`);
  }
}
