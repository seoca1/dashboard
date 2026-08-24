/**
 * <cross-project-status> — Fiction Wiki integration section
 *
 * Replaces the hardcoded Phase 73-83 block in the old prototype with live data
 * from the aggregator (pages, totalAdrs, acceptedAdrs, supersededAdrs, lastSync).
 *
 * Phase 190 (ADR-0049): adds verification_framework sub-stats rendering —
 * modes_total, curations_total, dimensions, amendments_total, spraw_coverage_pct,
 * bridge_coverage_pct, wiki_pages_created, tools_total.
 */

export interface VerificationFrameworkStats {
  modes_total: string;
  curations_total: string;
  dimensions: string;
  amendments_total: string;
  amendments_project_total: string;
  spraw_coverage_pct: string;
  bridge_coverage_pct: string;
  wiki_pages_created: string;
  tools_total: string;
}

export interface CrossProjectStatusProps {
  pages: string;
  totalAdrs: string;
  acceptedAdrs: string;
  supersededAdrs: string;
  lastSync: string;
  verificationFramework: VerificationFrameworkStats;
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

  const vfItems = [
    { label: 'VF Modes', value: props.verificationFramework.modes_total, sub: 'verification modes (Phase 135-188)' },
    { label: 'Curations', value: props.verificationFramework.curations_total, sub: 'wiki curation phases' },
    { label: 'Dimensions', value: props.verificationFramework.dimensions, sub: 'rubric dimensions' },
    { label: 'VF Amendments', value: props.verificationFramework.amendments_total, sub: 'Phase 135-188 amendments' },
    { label: 'Sprawl Cov.', value: props.verificationFramework.spraw_coverage_pct + '%', sub: 'Sprawl wiki char page coverage' },
    { label: 'Bridge Cov.', value: props.verificationFramework.bridge_coverage_pct + '%', sub: 'Bridge wiki char page coverage' },
    { label: 'Wiki Pages', value: props.verificationFramework.wiki_pages_created, sub: 'Phase 159/160/168/185' },
    { label: 'Tools', value: props.verificationFramework.tools_total, sub: 'svd_*.py + others' },
  ];

  const vfItemsHtml = vfItems.map(item => `
    <div class="item roguelike">
      <div class="label">${escapeHtml(item.label)}</div>
      <div class="value">${escapeHtml(item.value)}</div>
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
    <h3>🔬 Fiction Verification Framework (Phase 135-188, ADR-0049)</h3>
    <div class="stats-panel">
      <div class="stats-row">${vfItemsHtml}</div>
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