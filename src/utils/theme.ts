/**
 * Theme toggle — persists preference in localStorage.
 *
 * Reads stored preference on init, applies theme attribute to <html>.
 * Cycles: dark → light → system → dark
 */

export type Theme = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'dashboard-theme';

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
  } catch { /* SSR or disabled */ }
  return 'system';
}

function applyTheme(theme: Theme): void {
  const html = document.documentElement;
  let effective: 'dark' | 'light' = 'dark';
  if (theme === 'system') {
    effective = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } else {
    effective = theme;
  }
  html.setAttribute('data-theme', effective);
  html.setAttribute('data-theme-pref', theme);
}

export function initTheme(): void {
  const theme = getStoredTheme();
  applyTheme(theme);

  // Listen for system theme changes if user chose 'system'
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (getStoredTheme() === 'system') applyTheme('system');
  });
}

export function cycleTheme(): Theme {
  const current = getStoredTheme();
  const next: Theme = current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark';
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch { /* ignore */ }
  applyTheme(next);
  return next;
}

export function renderThemeToggle(): string {
  return `
    <button class="theme-toggle" id="theme-toggle" type="button"
      aria-label="Toggle theme (dark/light/system)"
      title="Click to cycle theme">
      <span class="theme-icon" aria-hidden="true">◐</span>
    </button>
  `;
}

export function attachThemeToggle(): void {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    cycleTheme();
  });
}