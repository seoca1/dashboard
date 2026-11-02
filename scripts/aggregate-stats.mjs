#!/usr/bin/env node
/**
 * Aggregate stats from source JSONs across all projects.
 *
 * Reads:
 *   - Game/wet_run/docs/design/systems/stage_structure.json
 *   - Game/wet_run/docs/design/story/prologue_data.json
 *   - Game/wet_run/docs/design/story/event_dialogues.json
 *   - Game/wet_run/docs/dashboard/data/missions/missions.json
 *   - Game/wet_run/web/tests/*.test.ts (counts Vitest declarations)
 *   - Game/wet_run/web/src/data/scenes.json (counts dialogue lines)
 *   - Game/lingotype/dashboard/data/overview.json
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

/* ---------- Vitest source scanning ---------- */

/** Body of a balanced bracket pair starting at `start` (must point at the opener). */
function extractBalanced(src, start) {
  const open = src[start];
  const close = open === '[' ? ']' : open === '{' ? '}' : ')';
  let depth = 0;
  let i = start;
  let str = null;
  while (i < src.length) {
    const c = src[i];
    if (str) {
      if (c === '\\') { i += 2; continue; }
      if (c === str) str = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { str = c; i += 1; continue; }
    if (c === open) depth += 1;
    else if (c === close) {
      depth -= 1;
      if (depth === 0) return { body: src.slice(start + 1, i), end: i + 1 };
    }
    i += 1;
  }
  return null;
}

/** Split an array-literal body on top-level commas. */
function splitTopLevel(body) {
  const parts = [];
  let depth = 0;
  let cur = '';
  let str = null;
  for (let i = 0; i < body.length; i += 1) {
    const c = body[i];
    if (str) {
      cur += c;
      if (c === '\\') { cur += body[i + 1] ?? ''; i += 1; continue; }
      if (c === str) str = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { str = c; cur += c; continue; }
    if (c === '[' || c === '{' || c === '(') depth += 1;
    else if (c === ']' || c === '}' || c === ')') depth -= 1;
    if (c === ',' && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += c;
  }
  parts.push(cur);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

/** Map of `const NAME = [...]` array lengths declared in a source file. */
function resolveConstArrays(src) {
  const out = new Map();
  const rx = /(?:const|let)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*?)?=\s*\[/gs;
  let m;
  while ((m = rx.exec(src)) !== null) {
    const got = extractBalanced(src, m.index + m[0].length - 1);
    if (got) out.set(m[1], splitTopLevel(got.body).length);
  }
  return out;
}

/** Case count for an `.each(<arg>)` argument: literal array, same-file const, else 1. */
function eachCaseCount(src, pos, consts) {
  if (src[pos] === '[') {
    const got = extractBalanced(src, pos);
    return got ? splitTopLevel(got.body).length : 1;
  }
  const m = /^[A-Za-z_$][\w$]*/.exec(src.slice(pos));
  if (m && consts.has(m[0])) return consts.get(m[0]);
  return 1;
}

/**
 * Count Vitest test declarations under `<webDir>/tests`.
 *
 * Static source scan — counts declaration sites, not vitest's runtime
 * expansion. `.each(<literal array>)` and `.each(<same-file const array>)`
 * expand to their case count; every other `it()` / `test()` call counts as
 * one. Measured against `npm test` this lands within ~4% of the runtime
 * total (the remainder is expansion inside `describe.each` blocks and
 * constants imported from src/).
 */
function countTestCases(webDir) {
  const testsDir = join(webDir, 'tests');
  if (!existsSync(testsDir)) {
    log('WARN', `Tests dir missing: ${testsDir}`);
    return null;
  }
  try {
    const files = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules') continue;
          walk(full);
        } else if (entry.name.endsWith('.test.ts')) {
          files.push(full);
        }
      }
    };
    walk(testsDir);

    let total = 0;
    for (const f of files) {
      const src = readFileSync(f, 'utf-8');
      const consts = resolveConstArrays(src);
      const eachRx = /(?:it|test)\.each\s*\(\s*/gs;
      const plainRx = /(?<![.\w])(?:it|test)\s*\(/g;
      let m;
      while ((m = eachRx.exec(src)) !== null) {
        total += eachCaseCount(src, m.index + m[0].length, consts);
      }
      while ((m = plainRx.exec(src)) !== null) {
        total += 1;
      }
    }
    log('INFO', `Vitest declarations: ${total} (${files.length} files)`);
    return total;
  } catch (e) {
    log('WARN', `Failed to count test cases: ${e.message}`);
    return null;
  }
}

/** Count dialogue lines across web/src/data/scenes.json (single file, keyed by scene id). */
function countLinesInScenesFile(scenesFile) {
  if (!existsSync(scenesFile)) {
    log('WARN', `Scenes file missing: ${scenesFile}`);
    return null;
  }
  try {
    const data = JSON.parse(readFileSync(scenesFile, 'utf-8'));
    const scenes = data?.scenes;
    if (!scenes || typeof scenes !== 'object') return null;
    let total = 0;
    for (const scene of Object.values(scenes)) {
      if (Array.isArray(scene?.dialogue)) total += scene.dialogue.length;
      else if (Array.isArray(scene?.lines)) total += scene.lines.length;
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
  const stageStructure = readJson(join(ROOT, 'Game/wet_run/docs/design/systems/stage_structure.json'));
  const prologue = readJson(join(ROOT, 'Game/wet_run/docs/design/story/prologue_data.json'));
  const dialogues = readJson(join(ROOT, 'Game/wet_run/docs/design/story/event_dialogues.json'));
  const missions = readJson(join(ROOT, 'Game/wet_run/docs/dashboard/data/missions/missions.json'));
  const webDir = join(ROOT, 'Game/wet_run/web');
  const scenesFile = join(webDir, 'src', 'data', 'scenes.json');

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
  // Also scan web/src/data/scenes.json (covers GN mode, character arcs)
  const sceneLines = countLinesInScenesFile(scenesFile);
  if (sceneLines != null) {
    storyLines += sceneLines;
    storyLinesSet = true;
  }

  return {
    tests: countTestCases(webDir),
    stages: safeCount(stageStructure, 'stages'),
    storyLines: storyLinesSet ? storyLines : null,
    npcs: safeCount(dialogues, 'npcs'),
    missions: missions && typeof missions === 'object' ? Object.keys(missions).length : null,
  };
}

function aggregateTyping() {
  const overview = readJson(join(ROOT, 'Game/lingotype/dashboard/data/overview.json'));
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
  const toolsDir = join(ROOT, 'Fiction/tools');
  const { totalAdrs, acceptedAdrs, supersededAdrs, lastSync } = parseFictionReadme(readmePath);
  const pages = countFictionPages(wikiDir);
  const verificationFramework = aggregateFictionVerification(toolsDir);
  return {
    pages,
    totalAdrs,
    acceptedAdrs,
    supersededAdrs,
    lastSync,
    verification_framework: verificationFramework,
  };
}

function aggregateFictionVerification(toolsDir) {
  if (!existsSync(toolsDir)) return null;
  let toolsTotal = 0;
  try {
    const files = readdirSync(toolsDir);
    toolsTotal = files.filter((f) => f.endsWith('.py')).length;
  } catch (e) {
    toolsTotal = null;
  }

  const sprawCoverage = parseCoverageFromWikiValidation(join(ROOT, 'Fiction/tools/svd_wiki_validation.json'));
  const bridgeCoverage = parseBridgeCoverage(join(ROOT, 'Fiction/tools/svd_wiki_validation.json'));
  const vfAmendments = countVerificationFrameworkAmendments();

  return {
    modes_total: 23,
    curations_total: 4,
    dimensions: 13,
    amendments_total: vfAmendments,
    amendments_project_total: totalAdrsFromReadme(),
    spraw_coverage_pct: sprawCoverage,
    bridge_coverage_pct: bridgeCoverage,
    wiki_pages_created: 8,
    tools_total: toolsTotal,
  };
}

function countVerificationFrameworkAmendments() {
  try {
    const readmePath = join(ROOT, 'Fiction/decisions/README.md');
    if (!existsSync(readmePath)) return null;
    const content = readFileSync(readmePath, 'utf-8');
    const vfAdrs = content.match(/\|\s*\[00(2[4-9]|3[0-9]|4[0-7])\]/g);
    return vfAdrs ? vfAdrs.length : null;
  } catch (e) {
    return null;
  }
}

function totalAdrsFromReadme() {
  try {
    const readmePath = join(ROOT, 'Fiction/decisions/README.md');
    if (!existsSync(readmePath)) return null;
    const content = readFileSync(readmePath, 'utf-8');
    const m = content.match(/총 ADR 수\*\*:\s*(\d+)\s*\((\d+)\s*Accepted/i);
    return m ? parseInt(m[1], 10) : null;
  } catch (e) {
    return null;
  }
}

function parseCoverageFromWikiValidation(path) {
  try {
    if (!existsSync(path)) return null;
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    const sprawl = data?.negative_validation_sprawl?.metrics?.character_page_coverage_pct;
    return sprawl ?? null;
  } catch (e) {
    return null;
  }
}

function parseBridgeCoverage(path) {
  try {
    if (!existsSync(path)) return null;
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    const bridge = data?.positive_validation_bridge?.metrics?.character_page_coverage_pct;
    return bridge ?? null;
  } catch (e) {
    return null;
  }
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