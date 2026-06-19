const ICONS = {
  book: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 8h12a4 4 0 0 1 4 4v30H10V8z"/><path d="M26 8h12v34H26"/><path d="M14 16h8M14 22h8"/></svg>`,
  star: `<svg viewBox="0 0 48 48" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M24 6l4.5 11.5L40 20l-9 8.5L34 42 24 35 14 42l3-13.5L8 20l11.5-2.5L24 6z"/></svg>`,
  learn: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="22" r="10"/><path d="M18 32c2 4 10 4 12 0"/><path d="M24 12V8M16 14l-3-3M32 14l3-3"/><path d="M14 38h20"/></svg>`,
  quiz: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="8"/><circle cx="24" cy="24" r="2" fill="currentColor"/></svg>`,
  bulb: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 8a12 12 0 0 0-4 23.2V36h8v-4.8A12 12 0 0 0 24 8z"/><path d="M18 40h12"/></svg>`,
  check: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="18"/><path d="M14 24l7 7 13-14"/></svg>`,
  cross: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="24" cy="24" r="18"/><path d="M18 18l12 12M30 18L18 30"/></svg>`,
  trophy: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 10h20v8a10 10 0 0 1-20 0V10z"/><path d="M14 14H8v2a6 6 0 0 0 6 6M34 14h6v2a6 6 0 0 1-6 6"/><path d="M18 38h12v4H18z"/><path d="M14 42h20"/></svg>`,
  sprout: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 42V22"/><path d="M24 28c-8-6-10-14-6-18s10 0 6 8"/><path d="M24 28c8-6 10-14 6-18s-10 0-6 8"/><path d="M12 42h24"/></svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`,
  shuffle: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M32 14h8v8M8 34l24-24M16 34H8v-8M40 14L16 38"/></svg>`,
  clock: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="26" r="14"/><path d="M24 18v10l6 4"/><path d="M18 8h12"/></svg>`,
  faceHappy: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="24" cy="24" r="18"/><circle cx="17" cy="21" r="2" fill="currentColor"/><circle cx="31" cy="21" r="2" fill="currentColor"/><path d="M16 30c3 5 13 5 16 0"/></svg>`,
  faceStar: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="26" r="16"/><circle cx="18" cy="24" r="2" fill="currentColor"/><circle cx="30" cy="24" r="2" fill="currentColor"/><path d="M17 32c3 4 11 4 14 0"/><path d="M24 6l2 5h5l-4 3 1.5 5L24 16l-4.5 3L21 14l-4-3h5L24 6z" fill="currentColor" stroke="none"/></svg>`,
  flame: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><path d="M24 42c8 0 14-8 14-18 0-10-8-14-14-22C18 10 10 14 10 24c0 10 6 18 14 18z" fill="currentColor" opacity=".2"/><path d="M24 42c6 0 10-6 10-14 0-6-4-10-10-16-6 6-10 10-10 16 0 8 4 14 10 14z"/></svg>`,
  spark: `<svg viewBox="0 0 48 48" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M24 4l3 10h10l-8 6 3 10-8-6-8 6 3-10-8-6h10L24 4z"/></svg>`,
  books: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M8 10h14v30H8zM26 10h14v30H26z"/><path d="M12 16h6M30 16h6"/></svg>`,
  medal: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><circle cx="24" cy="30" r="10"/><path d="M16 14l8 8M32 14l-8 8"/><path d="M14 6l6 12M34 6l-6 12"/></svg>`,
  target: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="8"/><circle cx="24" cy="24" r="2" fill="currentColor"/></svg>`,
  badgeCheck: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="8" y="8" width="32" height="32" rx="8"/><path d="M16 24l6 6 12-14"/></svg>`,
  sticker: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><path d="M24 6l14 8v16l-14 8-14-8V14L24 6z"/><circle cx="24" cy="24" r="6"/></svg>`,
  brain: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 14c-4 2-6 8-4 14 1 4 5 8 10 8s9-4 10-8c2-6 0-12-4-14-3-2-7-1-10 2-3-3-7-4-10-2z"/></svg>`,
  folder: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><path d="M6 14h14l4 4h18v22H6V14z"/></svg>`,
  homeScene: `<svg viewBox="0 0 120 100" fill="none" stroke="#2b2b2b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="20" y="30" width="50" height="55" rx="4" fill="#6ec6ff"/><path d="M28 30V22a8 8 0 0 1 16 0v8"/><line x1="35" y1="48" x2="55" y2="48"/><line x1="35" y1="58" x2="50" y2="58"/><line x1="35" y1="68" x2="55" y2="68"/><circle cx="82" cy="28" r="14" fill="#ffe566" stroke="#2b2b2b"/><path d="M76 24h2M86 24h2M82 30c-2 2-4 2-6 0" stroke-width="2"/><path d="M90 55c0 12-8 20-18 20S54 67 54 55" fill="#7ee08a"/><path d="M72 75v15M60 90h24"/></svg>`,
};

function icon(name, className = 'ico') {
  const svg = ICONS[name];
  if (!svg) return '';
  return `<span class="${className}" role="img" aria-hidden="true">${svg}</span>`;
}

function setIcon(el, name) {
  if (!el) return;
  el.innerHTML = ICONS[name] || '';
  el.classList.add('ico');
}