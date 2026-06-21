# Production Session Review — 2026-06-21 (run-day-plan, live from chat)

First full live run of the 3-video pipeline driven entirely from chat. Lots shipped, lots learned, several real engine bugs found and fixed.

## ✅ What went well
- **Assets generated:** all 3 hook images (V1 Ulta-undereye, V2 neck, V3 dark-spots), V1 body (5 bundle products), V2 body (5 neck products incl. hero), V3 body P1. ~100+ images.
- **Self-check (`status.js`) earned its keep:** caught the hero (Calcium Intense Cream) silently aborting, and caught the Flow **throttle** — prevented shipping missing/half-done products and protected the account.
- **Auto-retry** recovered the flaky attaches that were failing on first try.
- **Live steering worked:** prompts adjusted on the fly (neck tilt, white-woman dark-spots, no-people, Medix proportion), all faithfully.
- **Codified the operating rules** into memory so they're permanent (see below).

## ⚠️ What went wrong / caused friction (and the fix)
1. **Reference image only in chat, not on disk** → wasted time hunting for it. **Fix/lesson:** confirm the ref file exists on disk before generating; a chat paste ≠ a file.
2. **New project per video** (wrong) → **fixed:** one project per day (`one-project-per-day`).
3. **`existing:`/`new:` bounced out to Flow home and re-entered** every move → **fixed:** use `NV_PROJECT=current`, just verify the tab (`stay-in-current-project`).
4. **Generic filenames `1.png`–`5.png` attach ambiguously** → hero (5.png) failed repeatedly → **fix:** unique descriptive copies; **TODO: rename all bundle products** to kill this for good.
5. **"Two-Miha" wrong attach** → root cause found: `attachOnce` fell back to clicking the **first** picker row when the product row wasn't matched (often the person ref). **FIXED:** never attach a non-matching row — re-search, else abort so the retry handles it.
6. **Preload ("upload all first") kept failing** — the standalone picker won't open in idle state. **FIXED:** rewrote `preloadLibrary` to reuse the proven attach path back-to-back (attach→clear per file), reliable.
7. **Window forced out of fullscreen + Dock covered the prompt bar** — `browser.js` resized to 1440×900 on every connect. **FIXED:** only resize when genuinely small; leave fullscreen/large windows alone.
8. **Completion-gate too slow** (~1–2 min/product) → **switched to fast mode** (~15–20s pace; approval is the gap).
9. **Too much live engine surgery while Khalid waited** → the biggest friction. **Lesson:** batch engine fixes OFFLINE (like now), never debug mid-production with him watching.
10. **Throttle after ~100+ images** → account-safety stop. **Lesson:** pace volume; consider a per-session image budget.

## 🔧 Hardening shipped this session (code)
- `NV_IMAGE_COUNT=4` default for hooks (1 batch, ask-first)
- `status.js` self-check (GENERATING/IDLE/FAILED/THROTTLED)
- `NV_PRELOAD` reliable back-to-back upload
- `browser.js` fullscreen-safe window sizing
- `attachOnce` no-wrong-row guard (kills two-Miha)
- auto-retry wrapper around attach failures
- engine project routing → `current`

## 📌 Recommendations / next builds
- **Rename bundle products** `1–5.png` → descriptive names (Pink B12 Serum / Picotonic Shot / Calcium Volume Eye Patch / Calcium Volume Multi Balm / Calcium Intense Cream).
- **Vision-based result self-check** (Khalid's idea): after a batch, glance at the result thumbnails and flag "this looks oversized/unrealistic/wrong" automatically.
- **Throttle budget:** cap images/hour or images/session to stay under Flow's limit; spread heavy days.
- **Pre-flight checklist** at run start: ref files on disk? single Flow tab? fullscreen ok? project = today's?
- **Verify the two fixes on the next live run** (preload + no-wrong-row) before trusting them fully.

## ▶️ Resume
V3 body P1 (Good Molecules) done. Resume P2 The Ordinary → P3 Anua → P4 Murad → P5 Picotonic hero after the ~2–3h throttle cooldown, then clips (need saved frames). State: `day-run.json`.
