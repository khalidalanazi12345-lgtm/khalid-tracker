# ✅ CLIP PRODUCTION — Dr. Melaxin (redo done 2026-07-16)

**Project:** Flow `DrMelaxin 2026-07-07` · id `4e4f889d-d799-4ccb-ab3d-8590dc028d21`.
**Engine:** `~/nano-veo-engine`. Node = `$HOME/.node-runtime/bin/node`. Chrome debug on :9222 **MUST launch with `--disable-extensions`**.

## 2026-07-16 — REDO run + download COMPLETE
- Regenerated 20 clips (18 body w/ stronger `[EYES & EXPRESSION]` block for steady eye contact + no eyebrow micro-expressions; V2-HC1 + V3-HC1 hooks w/ "woman on the left stays silent" + V3-HC1 comma→period; V3-BC2 dropped "0.5%"; V3-BC1 dropped "everyone's mom has this"). Orchestrator: `orchestrate_clips_v2.js` (REDONAMES excludes V2-HC2/V3-HC2 = the good bridge hooks).
- Downloaded via **`dl_fav_api_0716.js`** (Flow projectInitialData API — the DOM-hover `dl_fav_clips.js` is DEAD for the current grid+detail UI). Classifier = current plan (V1 neck / V2 dark spots / V3 wrinkles).
- 41 favorites had duplicate takes across sessions → `organize_0716.js` kept NEWEST take per clip; extras in `~/Desktop/_flow-clips-0716/_extra-takes/`.
- Old **June-plan** stale clips (B12/EyePatch/Medicube/BeautyOfJoseon/COSRX/LaRoche…) were polluting `Clips/` → moved to `~/Desktop/_flow-clips-0716/_stale-oldplan/`.
- Trimmed (`tools/clip-trim.js --threshold -27 --min-silence 0.3 --buffer 0.3`; clips barely have a tail — speech fills the 8s, ~0.3s trims). Filed:
  - `dr.melaxin 1/Clips/` = 8 (hook1, GoPure, StriVectin, CrepeErase, Medix, CalciumIntense, CalciumIntense-b, CTA)
  - `dr.melaxin 2/Clips/` = 9 (hook1, hook2, GoodMolecules, TheOrdinary, Anua, Murad, Picotonic, Picotonic-b, CTA)
  - `dr.melaxin 3/Clips/` = 9 (hook1, hook2, Olay, TheOrdinaryRetinol, RoC, PaulasChoice, MultiBalm, MultiBalm-b, CTA)
  - Raw originals in each `Clips/_raw-untrimmed/`. **CTA is one shared clip copied into all 3.**

## Still to verify / open
- Spot-check the **newest-take pick** on V1 body clips (they had the most dupes) — if any looks wrong, the other takes are in `_extra-takes/`.
- Fine-trim in CapCut if any tail still feels long (speech runs to ~7.4–7.6s).
- Housekeeping: `_flow-clips-0716/_stale-oldplan/` + `_extra-takes/` deletable once he's happy. Stray Flow project `1929e3ca-...` still to delete. Patch engine `NV_MODE=clip` offline.
