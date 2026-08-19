#!/usr/bin/env node
/**
 * Aggregate stats from source JSONs across all projects.
 *
 * Reads:
 *   - Game/wet_run/design/systems/stage_structure.json
 *   - Game/wet_run/design/story/prologue_data.json
 *   - Game/wet_run/design/story/event_dialogues.json
 *   - Game/wet_run/dashboard/data/missions/missions.json
 *   - Game/wet_run/prototype/tests/test_*.py (counts test fns)
 *   - Game/typing_language/dashboard/data/overview.json
 *   - Fiction/decisions/README.md
 *   - Fiction/wiki/*.md (page count)
 *
 * Writes:
 *   - public/data/dashboard-stats.json (committed to repo)
 *
 * Behavior:
 *   - Missing source file → field = null, build continues (exit 0)
 *   - Malformed JSON → log warning, field = null, build continues
 *   - Designed to be safe in CI: never blocks build
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..'); // workspace root
const OUT_PATH = resolve(__dirname, '..', 'public', 'data', 'dashboard-stats.json');

const SCHEMA_VERSION = 1;
const DASHBOARD_VERSION = '2.0.0';

/* ---------- helpers ---------- */

function log(level, msg) {
  const stamp = new Date().toISOString();
  console.log(`[${stamp}] [${level}] ${msg}`);
}

function readJson(path) {
  try {
    if (!existsSync(path)) {
      log('WARN', `Missing file: ${path}`);
      return null;
    }
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    log('WARN', `Failed to parse ${path}: ${e.message}`);
    return null;
  }
}

function safeCount(obj, ...keys) {
  if (obj == null) return null;
  let cur = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return null;
    cur = cur[k];
  }
  if (typeof cur === 'number') return cur;
  if (Array.isArray(cur)) return cur.length;
  if (typeof cur === 'object' && cur !== null) return Object.keys(cur).length;
  return null;
}

function sumArray(obj, ...path) {
  if (obj == null) return null;
  let arr = obj;
  for (let i = 0; i < path.length; i++) {
    if (arr == null || typeof arr !== 'object') return null;
    arr = arr[path[i]];
  }
  if (!Array.isArray(arr)) return null;
  let total = 0;
  for (const item of arr) {
    if (item == null) continue;
    if (typeof item.lines === 'number') {
      total += item.lines;
    } else if (Array.isArray(item.lines)) {
      total += item.lines.length;
    }
  }
  return total;
}

function countTestFunctions(prototypeDir) {
  const testsDir = join(prototypeDir, 'tests');
  if (!existsSync(testsDir)) {
    log('WARN', `Tests dir missing: ${testsDir}`);
    return null;
  }
  try {
    // Recursive scan — tests live in tests/unit/, tests/integration/, etc.
    const files = [];
    function walk(dir) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === '__pycache__') continue;
          walk(full);
        } else if (entry.name.startsWith('test_') && entry.name.endsWith('.py')) {
          files.push(full);
        }
      }
    }
    walk(testsDir);
    let total = 0;
    for (const f of files) {
      const content = readFileSync(f, 'utf-8');
      const matches = content.match(/^\s*def test_/gm);
      if (matches) total += matches.length;
    }
    return total;
  } catch (e) {
    log('WARN', `Failed to count test functions: ${e.message}`);
    return null;
  }
}

function countLinesInScenes(scenesDir) {
  if (!existsSync(scenesDir)) return null;
  try {
    const files = [];
    function walk(dir) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.json')) files.push(full);
      }
    }
    walk(scenesDir);
    let total = 0;
    for (const f of files) {
      try {
        const data = JSON.parse(readFileSync(f, 'utf-8'));
        // Various line containers: top-level "lines", "dialogue", or nested in "beats[].lines"
        if (Array.isArray(data.lines)) total += data.lines.length;
        else if (Array.isArray(data.dialogue)) total += data.dialogue.length;
        else if (Array.isArray(data.beats)) {
          for (const b of data.beats) {
            if (Array.isArray(b?.lines)) total += b.lines.length;
          }
        }
      } catch { /* skip malformed */ }
    }
    return total;
  } catch (e) {
    log('WARN', `Failed to count scene lines: ${e.message}`);
    return null;
  }
}

function parseFictionReadme(path) {
  try {
    if (!existsSync(path)) {
      log('WARN', `Missing Fiction README: ${path}`);
      return { totalAdrs: null, acceptedAdrs: null, supersededAdrs: null, lastSync: null };
    }
    const text = readFileSync(path, 'utf-8');
    // Header: "**총 ADR 수**: 19 (17 Accepted, 2 Superseded — ADR-0010, ADR-0011)"
    // Note: ** markdown bold wrapping — "총 ADR 수" then **: then digits
    const adrMatch = text.match(/총 ADR 수\*\*:\s*(\d+)\s*\((\d+)\s*Accepted,\s*(\d+)\s*Superseded/i);
    const syncMatch = text.match(/최종 갱신\*\*:\s*(\d{4}-\d{2}-\d{2})/);
    return {
      totalAdrs: adrMatch ? parseInt(adrMatch[1], 10) : null,
      acceptedAdrs: adrMatch ? parseInt(adrMatch[2], 10) : null,
      supersededAdrs: adrMatch ? parseInt(adrMatch[3], 10) : null,
      lastSync: syncMatch ? syncMatch[1] : null,
    };
  } catch (e) {
    log('WARN', `Failed to parse Fiction README: ${e.message}`);
    return { totalAdrs: null, acceptedAdrs: null, supersededAdrs: null, lastSync: null };
  }
}

function countFictionPages(wikiDir) {
  if (!existsSync(wikiDir)) {
    log('WARN', `Missing Fiction wiki dir: ${wikiDir}`);
    return null;
  }
  try {
    const result = execSync(
      `find "${wikiDir}" -name '*.md' ! -name 'index.md' ! -name 'log.md' | wc -l`,
      { encoding: 'utf-8' }
    );
    return parseInt(result.trim(), 10);
  } catch (e) {
    log('WARN', `Failed to count Fiction pages: ${e.message}`);
    return null;
  }
}

/* ---------- aggregation ---------- */

function aggregateWetRun() {
  const stageStructure = readJson(join(ROOT, 'Game/wet_run/design/systems/stage_structure.json'));
  const prologue = readJson(join(ROOT, 'Game/wet_run/design/story/prologue_data.json'));
  const dialogues = readJson(join(ROOT, 'Game/wet_run/design/story/event_dialogues.json'));
  const missions = readJson(join(ROOT, 'Game/wet_run/dashboard/data/missions/missions.json'));
  const prototypeDir = join(ROOT, 'Game/wet_run/prototype');
  const scenesDir = join(prototypeDir, 'data', 'scenes');

  // Story lines: prologue scenes + prologue endings + event dialogues + all scene JSONs
  let storyLines = 0;
  let storyLinesSet = false;
  if (prologue?.scenes && Array.isArray(prologue.scenes)) {
    for (const scene of prologue.scenes) {
      if (Array.isArray(scene?.lines)) {
        storyLines += scene.lines.length;
        storyLinesSet = true;
      }
    }
  }
  if (prologue?.endings && typeof prologue.endings === 'object') {
    for (const endingArr of Object.values(prologue.endings)) {
      if (Array.isArray(endingArr)) {
        for (const ending of endingArr) {
          if (Array.isArray(ending?.lines)) {
            storyLines += ending.lines.length;
            storyLinesSet = true;
          }
        }
      }
    }
  }
  if (dialogues?.dialogues && typeof dialogues.dialogues === 'object') {
    for (const d of Object.values(dialogues.dialogues)) {
      if (Array.isArray(d?.lines)) {
        storyLines += d.lines.length;
        storyLinesSet = true;
      }
    }
  }
  // Also scan all scene files in prototype/data/scenes/ (covers GN mode, character arcs)
  const sceneLines = countLinesInScenes(scenesDir);
  if (sceneLines != null) {
    storyLines += sceneLines;
    storyLinesSet = true;
  }

  return {
    tests: countTestFunctions(prototypeDir),
    stages: safeCount(stageStructure, 'stages'),
    storyLines: storyLinesSet ? storyLines : null,
    npcs: safeCount(dialogues, 'npcs'),
    missions: missions && typeof missions === 'object' ? Object.keys(missions).length : null,
  };
}

function aggregateTyping() {
  const overview = readJson(join(ROOT, 'Game/typing_language/dashboard/data/overview.json'));
  if (!overview) {
    return { languages: null, corpus: null, stages: null, coverage: null };
  }
  const langs = Array.isArray(overview.languages) ? overview.languages : [];
  const corpus = langs.reduce((s, l) => s + (l.stats?.corpus_total ?? 0), 0);
  const stages = langs.reduce((s, l) => s + (l.stats?.stages ?? 0), 0);
  const coverageVals = langs
    .map(l => l.stats?.coverage_percent)
    .filter(v => typeof v === 'number');
  const coverage = coverageVals.length > 0
    ? Math.round((coverageVals.reduce((s, v) => s + v, 0) / coverageVals.length) * 10) / 10
    : null;
  return {
    languages: langs.length || null,
    corpus: corpus || null,
    stages: stages || null,
    coverage,
  };
}

function aggregateFiction() {
  const readmePath = join(ROOT, 'Fiction/decisions/README.md');
  const wikiDir = join(ROOT, 'Fiction/wiki');
  const { totalAdrs, acceptedAdrs, supersededAdrs, lastSync } = parseFictionReadme(readmePath);
  const pages = countFictionPages(wikiDir);
  return {
    pages,
    totalAdrs,
    acceptedAdrs,
    supersededAdrs,
    lastSync,
  };
}

/* ---------- main ---------- */

function main() {
  log('INFO', 'Aggregating dashboard stats…');

  const stats = {
    generatedAt: new Date().toISOString(),
    wetRun: aggregateWetRun(),
    typingLanguage: aggregateTyping(),
    fiction: aggregateFiction(),
    meta: {
      version: DASHBOARD_VERSION,
      schemaVersion: SCHEMA_VERSION,
    },
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(stats, null, 2) + '\n', 'utf-8');
  log('INFO', `Wrote ${OUT_PATH}`);

  // Summary
  const w = stats.wetRun;
  const t = stats.typingLanguage;
  const f = stats.fiction;
  console.log('\n--- Dashboard Stats Summary ---');
  console.log(`Wet Run:        tests=${w.tests} stages=${w.stages} storyLines=${w.storyLines} npcs=${w.npcs} missions=${w.missions}`);
  console.log(`Typing:         languages=${t.languages} corpus=${t.corpus} stages=${t.stages} coverage=${t.coverage}%`);
  console.log(`Fiction:        pages=${f.pages} totalAdrs=${f.totalAdrs} accepted=${f.acceptedAdrs} superseded=${f.supersededAdrs} lastSync=${f.lastSync}`);
  console.log(`Generated:      ${stats.generatedAt}`);
}

main();