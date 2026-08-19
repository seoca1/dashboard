/**
 * <stat-grid> — combined overview section
 *
 * Shows 5 stats: 2 from Wet Run, 2 from Typing Language, 1 meta (last sync).
 * Replaces hardcoded stats with live data from dashboard-stats.json.
 */

export interface StatGridProps {
  wetRunTests: string;
  wetRunStoryLines: string;
  typingLanguages: string;
  typingCorpus: string;
  lastSync: string;
  lastSyncSub: string;
}

export function renderStatGrid(props: StatGridProps): string {
  const items = [
    { label: 'Wet Run Tests', value: props.wetRunTests, sub: 'passing', cls: 'roguelike' },
    { label: 'Wet Run Story Lines', value: props.wetRunStoryLines, sub: 'dialogues', cls: 'roguelike' },
    { label: 'Typing Languages', value: props.typingLanguages, sub: 'supported', cls: 'typing' },
    { label: 'Typing Corpus', value: props.typingCorpus, sub: 'words/phrases', cls: 'typing' },
    { label: 'Last sync', value: props.lastSync, sub: props.lastSyncSub, cls: '', small: true },
  ];

  const itemsHtml = items.map(item => `
    <div class="item ${item.cls}">
      <div class="label">${escapeHtml(item.label)}</div>
      <div class="value"${item.small ? ' style="font-size: 14px; color: var(--text-secondary);"' : ''}>${escapeHtml(item.value)}</div>
      <div class="sub">${escapeHtml(item.sub)}</div>
    </div>
  `).join('');

  return `
    <h2>📈 Combined Overview (통합 통계)</h2>
    <div class="stats-panel">
      <div class="stats-row">${itemsHtml}</div>
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