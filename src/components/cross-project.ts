/**
 * <cross-project-status> — Fiction Wiki integration section
 *
 * Replaces the hardcoded Phase 73-83 block in the old prototype with live data
 * from the aggregator (pages, totalAdrs, acceptedAdrs, supersededAdrs, lastSync).
 */

export interface CrossProjectStatusProps {
  pages: string;
  totalAdrs: string;
  acceptedAdrs: string;
  supersededAdrs: string;
  lastSync: string;
}

export function renderCrossProjectStatus(props: CrossProjectStatusProps): string {
  const items = [
    { label: 'Wiki Pages', value: props.pages, sub: 'Fiction/wiki (excl. index, log)' },
    { label: 'Total ADRs', value: props.totalAdrs, sub: 'Architecture Decision Records' },
    { label: 'Accepted', value: props.acceptedAdrs, sub: 'Active ADRs' },
    { label: 'Superseded', value: props.supersededAdrs, sub: 'Historical ADRs' },
    { label: 'Last Sync', value: props.lastSync, sub: 'Fiction → wet_run wiki propagation' },
  ];

  const itemsHtml = items.map(item => `
    <div class="item roguelike">
      <div class="label">${escapeHtml(item.label)}</div>
      <div class="value"${item.label === 'Last Sync' ? ' style="font-size: 14px; color: var(--text-secondary);"' : ''}>${escapeHtml(item.value)}</div>
      <div class="sub">${escapeHtml(item.sub)}</div>
    </div>
  `).join('');

  return `
    <h2>📚 Fiction Wiki Cross-Project Status</h2>
    <div class="stats-panel">
      <div class="stats-row">${itemsHtml}</div>
      <div class="integration-note">
        <strong>Cross-project integration:</strong> roguelike_sprawl wiki updated by Fiction wiki —
        world pages (cyberspace, factions, glossary, sprawl_universe) reflect latest Fiction state.
        Game mission mapping unchanged. Fiction wiki (upstream) untouched per workspace
        <code>AGENTS.md §3</code> + <code>Game/wet_run/AGENTS.md §4.1</code>.
      </div>
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