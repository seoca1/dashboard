/**
 * <project-card> — reusable card for project entries
 *
 * Renders icon + name + description + 4-stat grid + sub-dashboard links + arrow.
 * Visual style preserved from old Game/dashboard/index.html.
 */

export interface ProjectCardProps {
  slug: 'wet-run' | 'lingotype';
  icon: string;
  name: string;
  subtitle: string;
  description: string;
  accentClass: 'roguelike' | 'typing';
  href: string;
  stats: { label: string; value: string; sub: string }[];
  subDashboards: { label: string; href: string }[];
}

export function renderProjectCard(props: ProjectCardProps): string {
  const { slug, icon, name, subtitle, description, accentClass, href, stats, subDashboards } = props;
  const statsHtml = stats.map(s => `
    <div class="stat">
      <div class="label">${escapeHtml(s.label)}</div>
      <div class="value" data-stat="${slug}-${slug === 'wet-run' ? 'r' : 't'}-${escapeHtml(s.label.toLowerCase().replace(/\s+/g, '-'))}">${escapeHtml(s.value)}</div>
      <div class="sub">${escapeHtml(s.sub)}</div>
    </div>
  `).join('');

  const subHtml = subDashboards.map(d => `<a class="sub-tag" href="${escapeHtml(d.href)}">${escapeHtml(d.label)}</a>`).join('');

  return `
    <a class="project-card ${accentClass}" href="${escapeHtml(href)}" aria-label="Open ${escapeHtml(name)} dashboard">
      <div class="icon-row">
        <div class="icon" aria-hidden="true">${icon}</div>
        <div>
          <h3 class="project-name">${escapeHtml(name)}</h3>
          <div class="project-sub">${escapeHtml(subtitle)}</div>
        </div>
      </div>
      <div class="desc">${escapeHtml(description)}</div>
      <div class="stat-grid">${statsHtml}</div>
      <div class="sub-dashboards">${subHtml}</div>
      <div class="arrow" aria-hidden="true">→</div>
    </a>
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