# Game/dashboard — Unified Projects Hub

> Single-page dashboard for the `Game/` workspace — links to **Wet Run** and **LingoType** dashboards with live stats aggregated from both projects + Fiction wiki.

## What it is

A modern, data-driven replacement for the legacy 15KB single-file prototype at `Game/dashboard/index.html`. Built with Vite + TypeScript + vanilla CSS, the dashboard:

- Fetches live stats from `public/data/dashboard-stats.json` (committed to repo)
- Renders cyberpunk-themed cards for both projects
- Shows Fiction Wiki cross-project integration status (live, from `Fiction/decisions/README.md`)
- Provides quick-links to all sub-dashboards
- Supports dark / light / system theme (toggleable, persisted in localStorage)
- Is fully accessible (skip link, ARIA, keyboard nav, reduced-motion)
- Builds to a 12KB static `dist/` ready for GitHub Pages

## Quick start

```bash
cd Game/dashboard

# 1. Aggregate live stats from both projects
npm run build:data

# 2. (optional) Verify data integrity
npm run verify:data

# 3. Dev server (port 5174)
npm run dev

# 4. Production build → dist/
npm run build
```

## Data sources

The aggregator (`scripts/aggregate-stats.mjs`) reads:

| Project | File | Field |
|---------|------|-------|
| Wet Run | `Game/wet_run/prototype/tests/**/test_*.py` (recursive) | tests (count) |
| | `Game/wet_run/design/systems/stage_structure.json` | stages |
| | `Game/wet_run/design/story/prologue_data.json` + `event_dialogues.json` + `prototype/data/scenes/` | storyLines |
| | `Game/wet_run/design/story/event_dialogues.json` | npcs |
| | `Game/wet_run/dashboard/data/missions/missions.json` | missions |
| Typing | `Game/lingotype/dashboard/data/overview.json` | languages, corpus, stages, coverage |
| Fiction | `Fiction/decisions/README.md` | totalAdrs, acceptedAdrs, supersededAdrs, lastSync |
| | `Fiction/wiki/**/*.md` (excl. index, log) | pages |

**Robustness**: All aggregations are safe — missing files → `null` field, build continues (exit 0). This means the dashboard always builds, even if a source is temporarily unavailable.

## Output schema (``public/data/dashboard-stats.json`)

```json
{
  "generatedAt": "2026-08-19T...",
  "wetRun": {
    "tests": 5088, "stages": 14, "storyLines": 387, "npcs": 5, "missions": 47
  },
  "typingLanguage": {
    "languages": 4, "corpus": 577, "stages": 140, "coverage": 41.7
  },
  "fiction": {
    "pages": 476, "totalAdrs": 19, "acceptedAdrs": 17, "supersededAdrs": 2, "lastSync": "2026-08-16"
  },
  "meta": { "version": "2.0.0", "schemaVersion": 1 }
}
```

## Architecture

```
Game/dashboard/
├── package.json              # Vite + TS + Node scripts
├── tsconfig.json             # strict TS
├── vite.config.ts            # static build
├── index.html                # shell with skip link + theme toggle
├── public/
│   ├── favicon.svg
│   └── data/
│       └── dashboard-stats.json   # generated, committed
├── scripts/
│   ├── aggregate-stats.mjs   # Node script, 13 source files → stats.json
│   └── verify-data.mjs       # CI sanity check
└── src/
    ├── main.ts               # async wire (load → render)
    ├── data/
    │   ├── types.ts          # DashboardStats interfaces
    │   └── loader.ts         # fetch + validate + format helpers
    ├── components/
    │   ├── hero.ts           # ASCII banner + last-updated
    │   ├── project-card.ts   # reusable card
    │   ├── stat-grid.ts      # combined overview
    │   ├── cross-project.ts  # Fiction integration
    │   └── quick-links.ts    # navigation footer
    ├── utils/
    │   └── theme.ts          # dark/light/system toggle (localStorage)
    └── styles/
        ├── reset.css         # minimal reset
        ├── theme.css         # cyberpunk + light tokens
        ├── layout.css        # responsive 720px breakpoint
        └── components.css    # all visual styles
```

## Deployment

GitHub Actions: `.github/workflows/game-dashboard.yml` (workspace root, NOT nested). Path filter avoids collision with existing `dashboard-build.yml`.

Path filter:
```yaml
paths:
  - 'Game/dashboard/**'
  - '.github/workflows/game-dashboard.yml'
```

URL (when deployed to seoca1.github.io root): `https://seoca1.github.io/Projects/Game/dashboard/dist/`

## Workspace compliance

- ✅ CJK script separation (per workspace `AGENTS.md §7`)
- ✅ Fiction wiki untouched (per `AGENTS.md §3` + `Game/wet_run/AGENTS.md §4.1`)
- ✅ wet_run world reference via Fiction wiki (Primary source)
- ✅ Linked projects: Wet Run + LingoType + Fiction
- ✅ Lint clean: TS strict 0 errors, build succeeds

## License

MIT (same as parent projects).