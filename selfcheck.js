#!/usr/bin/env node
'use strict';
/* selfcheck.js — static self-audit of the tracker app. Catches the class of bug Khalid keeps hitting
   (update banner stuck on BUILD/version mismatch, dead onclick handlers, index/task-tracker drift,
   syntax errors) WITHOUT him having to notice. Run on demand (`node selfcheck.js`) or as a pre-deploy
   gate. Exit 0 = clean, 1 = ERRORS found (deploy should abort), 2 = couldn't run.
   Read-only: it never edits or ships anything. */
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const errors = [];   // block deploy
const warns = [];    // surface, don't block
const ok = [];

function read(f) { try { return fs.readFileSync(path.join(DIR, f), 'utf8'); } catch { return null; } }

const html = read('index.html');
const ttk = read('task-tracker.html');
const verRaw = read('version.json');

if (!html) { console.error('✗ index.html missing'); process.exit(2); }

// 1) index.html === task-tracker.html (the deploy copies tt→index; drift means the source is stale)
if (ttk == null) warns.push('task-tracker.html missing (deploy source)');
else if (html !== ttk) errors.push('index.html and task-tracker.html DIFFER — the deploy will clobber index.html edits. Sync them.');
else ok.push('index.html === task-tracker.html');

// 2) BUILD constant === version.json build (mismatch = update banner can never clear — the bug he hit)
const buildM = html.match(/const BUILD\s*=\s*["']([^"']+)["']/);
let ver = null; try { ver = verRaw ? JSON.parse(verRaw).build : null; } catch { warns.push('version.json is not valid JSON'); }
if (!buildM) errors.push('No `const BUILD="…"` found in index.html');
else if (ver == null) warns.push('version.json has no build field');
else if (buildM[1] !== ver) errors.push(`BUILD ("${buildM[1]}") !== version.json build ("${ver}") — update banner will be stuck. Bump BOTH to the same id.`);
else ok.push(`BUILD === version.json (${ver})`);

// 3) every onclick="fn(...)" / onpointerdown etc references a function that's defined in the file
const handlerRe = /\bon(?:click|change|input|pointerdown|submit)\s*=\s*["']\s*([a-zA-Z_$][\w$]*)\s*\(/g;
const defined = new Set();
// function declarations
for (const m of html.matchAll(/function\s+([a-zA-Z_$][\w$]*)\s*\(/g)) defined.add(m[1]);
// const/let/var name = (…)=>  or = function
for (const m of html.matchAll(/(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[a-zA-Z_$][\w$]*\s*=>)/g)) defined.add(m[1]);
// window.fn = …
for (const m of html.matchAll(/window\.([a-zA-Z_$][\w$]*)\s*=/g)) defined.add(m[1]);
const builtin = new Set(['alert','confirm','prompt','open','print','focus','blur','location','history',
  // JS keywords that can legally lead an inline handler (onclick="if(...)" etc.) — not functions
  'if','for','while','switch','return','var','let','const','function','new','delete','typeof','void','do','try','throw','await']);
const missing = new Set();
for (const m of html.matchAll(handlerRe)) { const fn = m[1]; if (!defined.has(fn) && !builtin.has(fn)) missing.add(fn); }
if (missing.size) errors.push(`onclick/handlers reference undefined function(s): ${[...missing].join(', ')}`);
else ok.push('all inline handlers resolve to defined functions');

// 4) JS syntax — compile the inline <script> with new Function (no execution)
try {
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n;\n');
  new Function(scripts); // throws on syntax error
  ok.push('inline JS parses (no syntax errors)');
} catch (e) { errors.push(`JS syntax error: ${e.message}`); }

// 5) localStorage key must stay stable (a rename silently wipes everyone's data — a HARD rule)
if (!/khalid_prod_tracker_v4/.test(html)) errors.push('localStorage key "khalid_prod_tracker_v4" not found — NEVER rename it (silent data loss).');
else ok.push('localStorage key intact (khalid_prod_tracker_v4)');

// ---- report ----
const line = '─'.repeat(48);
console.log(line + '\n  TRACKER SELF-CHECK\n' + line);
ok.forEach(s => console.log('  ✓ ' + s));
warns.forEach(s => console.log('  ⚠ ' + s));
errors.forEach(s => console.log('  ✗ ' + s));
console.log(line);
if (errors.length) { console.log(`  ${errors.length} ERROR(S) — do not deploy until fixed.`); process.exit(1); }
console.log(`  CLEAN${warns.length ? ` (${warns.length} warning${warns.length>1?'s':''})` : ''} — safe to deploy.`);
process.exit(0);
