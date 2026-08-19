/**
 * <hero-section> — title + ASCII art + last-updated badge
 *
 * ASCII art copied verbatim from old Game/dashboard/index.html lines 157-165
 * to preserve visual continuity. Last-updated timestamp from stats.generatedAt.
 */

import { fmtDate } from '../data/loader';

export function renderHero(generatedAt: string | null): string {
  return `
    <section class="hero" aria-label="Dashboard header">
      <h1>
        <span class="accent-r">🌆 Wet Run</span>
        <span class="separator">·</span>
        <span class="accent-t">⌨ Typing Language</span>
      </h1>
      <div class="tag">Projects Hub — Game/ Dashboard · 깁슨 스프롤 + 다국어 타이핑</div>
      <pre class="ascii" aria-hidden="true">
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ░  ◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢  ░
  ░  ░▒▓█ Two projects, one workspace. Built in Sprawl.   ▓▒░  ░
  ░  ░▒▓█ The sky was the color of TV, tuned to a dead    ▓▒░  ░
  ░  ░▒▓█ channel. But the words typed back, in 4 tongues. ▓▒░  ░
  ░  ░▒▓█   — inspired by William Gibson, 1984            ▓▒░  ░
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
      </pre>
      <div class="last-updated">Last updated: <code>${fmtDate(generatedAt)}</code></div>
    </section>
  `;
}