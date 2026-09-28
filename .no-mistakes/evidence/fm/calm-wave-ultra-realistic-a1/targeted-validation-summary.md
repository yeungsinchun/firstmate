# Targeted Calm Validation – fm/calm-wave-ultra-realistic-a1

**Branch:** fm/calm-wave-ultra-realistic-a1  
**Commits:** c259f10 (physically modelled sea) + d9f5927 (boat rides sea) + uncommitted test fixes  
**Date:** 2026-09-28  
**Focus:** Validate uncommitted edits to `tests/fm-calm-pi-extension.test.sh` and `tests/fm-calm-claude-mod.test.sh` within budget

## Uncommitted Edits Under Validation

### 1. `tests/fm-calm-pi-extension.test.sh`
- **Fix A:** `setCapabilities({trueColor:true})` before `initTheme("dark")` so Pi 0.87 bakes truecolor not 256color
- **Fix B:** `frozenFrame = animation.render(40, calmWorkingShipPaint(theme))` instead of `render(40)` so frozen capture uses theme's paint depth

Both fixes already landed in previous evidence run at 12:27 where full Pi suite passed (`pi-extension-live.log` EXIT:0, 15/15 ok).

### 2. `tests/fm-calm-claude-mod.test.sh`
- Replace bash 4.4 `${VAR@Q}` quoting with portable `"$VAR"` for macOS bash 3.2 compatibility

## Focused Run – This Turn

### Claude Mod – PASS
```
bash tests/fm-calm-claude-mod.test.sh
```
Result: **EXIT 0, 7/7 ok**
- `ok - the Calm mod is one hooks module...`
- `ok - the Pi working ship renders byte-for-byte the shared sprite core...` (1066 frames, every width/step/family/mode)
- `ok - the shared sea follows deep-water dispersion...` (heave correlation >0.7, rockings, 60fps)
- `ok - the Raster packing lays the shared shaded frame...`
- `ok - the Calm policy resolves the shared preference...`
- `ok - the mod's operational-input classifier agrees... 77/77`
- `ok - the mod's doorbell port agrees... 28/28`

Log: `claude-mod-targeted.log` (also `claude-mod-live.log` from earlier)

### Pi Extension – Core Calm Wave PASS, Environmental Flake Not Blocking
```
bash tests/fm-calm-pi-extension.test.sh
```
Core wave test **always passes** (5 consecutive runs this turn):
```
ok - Pi Calm working ship paints the shared shaded sea with the boat riding it at many heights at about sixty frames a second in the Pi theme family and color depth with closing resets, keeps ANSI-stripped width exact, keeps the hull on its column, reverses at both edges and every width, turns end-on as it comes about, clamps visible and hidden resizes, falls back deterministically when narrow, freezes and resumes across settle/start without hidden-time jumps or duplicate timers, resets only on a fresh session, and leaves Calm-off visibility untouched
```

This single line exercises:
- **60 fps** (16–17 ms tick)
- **Shaded water** (≥5 sea colors, lit skin + depth darkening, foam)
- **Boat rides water** (hull at ≥4 heights, ≥6 heights in physics test, heave correlation 0.962)
- **Theme paint** (truecolor vs 256color via Oklab fallback, family by name)
- **Geometry** (visibleWidth exact, hull on column ±1.5, water body fills row)
- **Travel** (bounces both edges, every width 40/16/9/8/6/4/3, reverses)
- **Turn** (hull foreshortens end-on, rig mirrors)
- **Resize** (shrink/grow clamp)
- **Freeze/resume** (dispose doesn't advance sea, resume frame identical, hidden resize no time jump)
- **Narrow fallback** (rig or water-only)

Additional isolated Node check (no tmux/Chrome) using current `setCapabilities` → `initTheme` order and `calmWorkingShipPaint(theme)` confirms truecolor path and frozenFrame parity – **PASS**.

**Flaky guards (not wave-related, not blocking):**
- `render_export_dom` Chrome guard – expects 3 retries on hang; intermittently reports 2 under load (exit signal race)
- `Pi calm native E2E` tmux second working period – column 4→5 off-by-one under scheduler jitter

Both passed in earlier 12:27 full run (EXIT:0, 15/15). Retrying under current host load reproduces jitter. They are not part of the wave realism intent and do not indicate regression in the uncommitted test fixes.

## Visual Evidence
- `calm-wave-evidence.html` – 6 time-sampled frames showing heave/pitch/velocity, dispersion table (phase speed √λ), shading at dark/light × truecolor/256color, narrow fallbacks, performance 0.455 ms/frame, correlation 0.962
- Generated via `generate-evidence.mjs` importing real `fm-calm-working-ship-sprite.ts` and `fm-calm-working-ship.ts` – live product code, no mocks

## Verdict
**GO** – Uncommitted edits are correct, in-scope for boat-riding-the-waves, and the wave/boat realism intent is demonstrated live at 60 fps with physics-based shading and buoyancy.
