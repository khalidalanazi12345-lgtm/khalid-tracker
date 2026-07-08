# ⏸ PRODUCTION RESUME — Dr. Melaxin, paused 2026-07-07

**Status:** PAUSED mid image-generation. Khalid is tired; will continue later (same session may stay open, but this file is the source of truth for a fresh session too). Resume by reading this file top-to-bottom.

## Where we are
- **Flow project (the day's ONE project):** `DrMelaxin 2026-07-07` · id `4e4f889d-d799-4ccb-ab3d-8590dc028d21`
  · URL https://labs.google/fx/tools/flow/project/4e4f889d-d799-4ccb-ab3d-8590dc028d21
  → route every remaining asset with `NV_PROJECT="existing:DrMelaxin 2026-07-07"` (NEVER new:).
- **DONE:** Image #1 (V1 Hook — neck) generated (4 variations) and **Khalid favorited ONE** of them in Flow. Verified good (left woman head up, crepey saggy neck; right woman points at neck; Ulta).
- **NEXT:** Image #2 (V1 Body). Then #3–#8, one at a time — generate → Khalid favorites → next.

## Engine prereqs (must be up before generating)
- Chrome debug: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9222 --user-data-dir="$HOME/.nanabanana-chrome"` (already signed into Flow via that profile).
- Node: `$HOME/.node-runtime/bin/node` (plain `node` is NOT on PATH; run.sh finds it itself).
- Engine: `~/nano-veo-engine` — `./run.sh` with `NV_*` env vars. Status check: `"$HOME/.node-runtime/bin/node" status.js`. Live screenshot helper written: `~/nano-veo-engine/_shot.js` → writes `/tmp/flow-now.png` (Read it to SEE the project).
- Monitoring note: `status.js` sometimes reads a stale tab (reported resultTiles=1 while a batch was generating). To confirm a batch, use `_shot.js` and Read `/tmp/flow-now.png`.

## THE 8-IMAGE ORDER (generate one at a time; Khalid favorites each, then next)
Ref bank: `~/Desktop/Dr. Melaxin Production/Reference Images/{Hook,Body}` · products in `Product Images/dr.melaxin bundle photos/`.
Person (Miha) selfie: `Reference Images/Body/body-images/Ulta employee Miha selfie (Dr Melaxin poster).jpeg`.
Preview refs: #1 = `Hook/hook-images/Ulta — undereye symptoms left, flawless right, pointing.jpeg` · #2 = `Hook/hook-images/Woman_pointing_at_dark_spots_202606250856.jpeg`.

1. ✅ **V1 Hook (neck)** — ref #2 — "Remake this image exactly, but the woman on the left tilts her head up showing a loose, crepey, saggy neck, and the woman on the right points at her neck." (DONE, favorited)
2. ⏭ **V1 Body** — Miha selfie + **Calcium Intense Cream**, Ulta aisle — "Make the woman in the first image hold this product in the second image, in a completely different skincare aisle in Ulta."
3. **V2 Hook 1** — ref #2 — "Remake this image exactly, keep the left woman's dark spots visible and the woman on the right pointing at them."
4. **V2 Hook 2** — ref #2 — "Remake this image exactly, but the woman on the right turns her palms up like she's explaining."
5. **V2 Body** — Miha selfie + **Picotonic Shot**, Ulta aisle — same body prompt (store Ulta).
6. ⭐ **V3 Hook 1 (SEPHORA ANCHOR — do first of V3)** — ref #1 — "Remake this image exactly, but the woman on the left has heavy forehead wrinkles and smile lines all over her face, the woman on the right points generally at her face without touching it, change the store to Sephora, and the woman on the right wears a Sephora employee uniform."
7. **V3 Hook 2** — ref = the FAVORITED #6 — "Remake this image exactly, but the woman on the right turns her palms up like she's explaining." (uniform inherits from #6)
8. **V3 Body** — Miha selfie + FAVORITED #6 (for the Sephora uniform) + **Calcium Volume Multi Balm** — "Remake this image exactly, but change the store to Sephora and change her uniform to the Sephora employee uniform in the second image provided." (OPEN FLAG: confirm whether she also holds the Multi-Balm in this same image, add product as extra ref.)

## Stores
V1 = Ulta · V2 = Ulta · V3 = Sephora (V3 person must wear Sephora uniform, consistent across #6/#7/#8 — that's why #6 is the anchor).

## Engine command templates
- Hook: `cd ~/nano-veo-engine && NV_MODE=hook NV_REF="<abs ref>" NV_IMAGE_COUNT=4 NV_PROMPT="…" NV_PROJECT="existing:DrMelaxin 2026-07-07" NV_DEBUG=1 ./run.sh`
- Body: `NV_MODE=body NV_STORE="Ulta" NV_REF="<Miha selfie>" NV_PRODUCT_FOLDER="<single-hero-product folder>" NV_PROMPT="…" NV_PROJECT="existing:DrMelaxin 2026-07-07" ./run.sh`
  - ⚠️ **RESUME TODO:** body mode loops over a product FOLDER. We want ONLY the single hero product per video (Calcium Intense Cream / Picotonic Shot / Multi-Balm), NOT all 6 in the bundle folder. Before firing #2, resolve how to pass a SINGLE product image (check `nano-veo`/`run.js` for a single-product / paste-image / subset option, e.g. a one-file folder or `NV_PRODUCT`).

## After all images: clips
27 clips total, Veo 3.1 Fast, 40 cr each = ~1,080 credits. Two-person hook frames → "the woman on the right says …"; one-person body frames → "make her say …". Full plan + clip prompts are in the chat transcript and follow the `production-plan` skill format. Do NOT start clips until images are favorited/downloaded.

## Reference
- Skill: `~/Desktop/skills/.claude/skills/production-plan/SKILL.md` (approved format + locked prompt rules).
- Grill capture: `~/Desktop/skills/brainstorms/2026-07-07-production-plan-process.md`.
