/**
 * <quick-links> — navigation footer with grid of buttons
 *
 * Replaces the old "Quick Links" panel. Links resolve relative to the hub
 * at Game/dashboard/dist/, so paths use `../wet_run/dashboard/` etc.
 */

export interface QuickLink {
  label: string;
  href: string;
}

export function renderQuickLinks(): string {
  const wetRunLinks: QuickLink[] = [
    { label: '🌆 Wet Run Submenu', href: '../wet_run/dashboard/index.html' },
    { label: '📖 Stories', href: '../wet_run/dashboard/stories-browse.html' },
    { label: '⏱ Stages', href: '../wet_run/dashboard/stages.html' },
    { label: '⚔ Combat', href: '../wet_run/dashboard/combat.html' },
    { label: '🌐 Cyberspace', href: '../wet_run/dashboard/cyberspace.html' },
    { label: '🎮 Play', href: '../wet_run/dashboard/play.html' },
    { label: '👤 Player', href: '../wet_run/dashboard/player.html' },
    { label: '⚙ Settings', href: '../wet_run/dashboard/settings.html' },
  ];

  const typingLinks: QuickLink[] = [
    { label: '⌨ Typing Dashboard', href: '../lingotype/dashboard/index.html' },
    { label: '📊 Data Overview', href: '../lingotype/dashboard/data/overview.json' },
    { label: '📚 Languages', href: '../lingotype/wiki/languages/' },
    { label: '🗺 ROADMAP', href: '../lingotype/ROADMAP.md' },
    { label: '🤖 Typing AGENTS', href: '../lingotype/AGENTS.md' },
  ];

  const fictionLinks: QuickLink[] = [
    { label: '📚 Fiction Wiki', href: '../../../Fiction/wiki/' },
    { label: '📋 Fiction ADRs', href: '../../../Fiction/decisions/README.md' },
    { label: '🗺 Wet Run ROADMAP', href: '../wet_run/ROADMAP.md' },
    { label: '🤖 Wet Run AGENTS', href: '../wet_run/AGENTS.md' },
  ];

  const renderRow = (links: QuickLink[]) =>
    links.map(l => `<a class="quick-link" href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`).join('');

  return `
    <div class="links-section">
      <h2>🔗 Wet Run Quick Links</h2>
      <div class="links-row">${renderRow(wetRunLinks)}</div>

      <h2>🔗 LingoType Quick Links</h2>
      <div class="links-row">${renderRow(typingLinks)}</div>

      <h2>🔗 Cross-Project References</h2>
      <div class="links-row">${renderRow(fictionLinks)}</div>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}