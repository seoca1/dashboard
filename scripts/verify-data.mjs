#!/usr/bin/env node
/**
 * Verify dashboard-stats.json integrity.
 *
 * Checks:
 *   - File exists
 *   - Valid JSON
 *   - Required sections present (wetRun, typingLanguage, fiction, meta)
 *   - At least N non-null fields (sanity check that aggregation didn't silently fail)
 *   - Schema version matches expected
 *
 * Exits 0 if all checks pass, 1 otherwise.
 * Intended for CI sanity check (run after `build:data`).
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATS_PATH = resolve(__dirname, '..', 'public', 'data', 'dashboard-stats.json');
const EXPECTED_SCHEMA_VERSION = 1;
const MIN_NON_NULL_FIELDS = 8; // of total ~14 fields

let failures = 0;

function fail(msg) {
  console.error(`✗ ${msg}`);
  failures++;
}

function pass(msg) {
  console.log(`✓ ${msg}`);
}

/* ---------- checks ---------- */

if (!existsSync(STATS_PATH)) {
  fail(`Stats file missing: ${STATS_PATH}`);
  process.exit(1);
}
pass(`Stats file exists: ${STATS_PATH}`);

let stats;
try {
  stats = JSON.parse(readFileSync(STATS_PATH, 'utf-8'));
  pass('Valid JSON');
} catch (e) {
  fail(`JSON parse error: ${e.message}`);
  process.exit(1);
}

// Required sections
const requiredSections = ['wetRun', 'typingLanguage', 'fiction', 'meta'];
for (const section of requiredSections) {
  if (stats[section] == null || typeof stats[section] !== 'object') {
    fail(`Missing or invalid section: ${section}`);
  } else {
    pass(`Section present: ${section}`);
  }
}

// Schema version
if (stats.meta?.schemaVersion !== EXPECTED_SCHEMA_VERSION) {
  fail(`Schema version mismatch: expected ${EXPECTED_SCHEMA_VERSION}, got ${stats.meta?.schemaVersion}`);
} else {
  pass(`Schema version: ${EXPECTED_SCHEMA_VERSION}`);
}

// generatedAt
if (typeof stats.generatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(stats.generatedAt)) {
  fail(`generatedAt invalid: ${stats.generatedAt}`);
} else {
  pass(`generatedAt: ${stats.generatedAt}`);
}

// Count non-null fields
let nonNullCount = 0;
const allFields = [];
function countFields(obj, prefix) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v != null && typeof v !== 'object') {
      nonNullCount++;
      allFields.push(`${path}=${v}`);
    } else if (v != null && typeof v === 'object') {
      countFields(v, path);
    }
  }
}
countFields(stats, '');
console.log(`\n  Field summary (${nonNullCount} non-null):`);
for (const f of allFields) console.log(`    ${f}`);

if (nonNullCount < MIN_NON_NULL_FIELDS) {
  fail(`Only ${nonNullCount} non-null fields (expected ≥ ${MIN_NON_NULL_FIELDS}) — aggregation may have silently failed`);
} else {
  pass(`Non-null field count: ${nonNullCount} ≥ ${MIN_NON_NULL_FIELDS}`);
}

/* ---------- result ---------- */

if (failures > 0) {
  console.error(`\n✗ ${failures} check(s) failed`);
  process.exit(1);
}
console.log(`\n✓ All checks passed`);