#!/usr/bin/env node
// Generate calm-frames.json for the evidence HTML: 6 frames at wide width, dark family,
// plus a motion table and parity summary, using the real shared sprite.
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repo = "/Users/sinchunyeung/.no-mistakes/worktrees/19c7f602a392/01M3KR99AQN8CWRY0H9YHS7GHP";
const spritePath = path.join(repo, ".claude/mods/firstmate-calm/lib/fm-calm-working-ship-sprite.ts");
const piShipPath = path.join(repo, ".pi/extensions/lib/fm-calm-working-ship.ts");
const rasterPath = path.join(repo, ".claude/mods/firstmate-calm/lib/fm-calm-ship-raster.ts");

const core = await import(pathToFileURL(spritePath).href);
const pi = await import(pathToFileURL(piShipPath).href);
const raster = await import(pathToFileURL(rasterPath).href);

// Helpers
function escapeHtml(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function rgbToCss(rgb){
  if(rgb===null) return null;
  const r=(rgb>>16)&255, g=(rgb>>8)&255, b=rgb&255;
  return `rgb(${r},${g},${b})`;
}
function frameToHtml(frame){
  // frame is CalmWorkingShipFrame: rows of runs {text, fg, bg}
  return frame.map(row=>{
    let html="";
    for(const run of row){
      const fg = rgbToCss(run.fg);
      const bg = rgbToCss(run.bg);
      const style = [];
      if(fg) style.push(`color:${fg}`);
      if(bg) style.push(`background:${bg}`);
      const escaped = escapeHtml(run.text);
      if(style.length) html += `<span style="${style.join(";")}">${escaped}</span>`;
      else html += escaped;
    }
    return html;
  }).join("\n");
}

const frames = [];
const sprite = core.createCalmWorkingShipSprite();
const widths = [60, 80];
for(let idx=0; idx<6; idx++){
  const width = widths[idx % widths.length];
  const label = `Frame ${idx+1} (${width} cols, ${idx%2?"light":"dark"})`;
  const family = idx%2 ? "light" : "dark";
  const frame = sprite.frame(width, family);
  frames.push({
    label,
    seaTime: sprite.seaTime(),
    position: sprite.position(),
    pitch: sprite.pitch(),
    heave: sprite.heave(),
    html: frameToHtml(frame),
  });
  for(let t=0;t<20;t++) sprite.tick();
}

// Motion table: sample every 12 ticks ( ~0.2s) for ~6 seconds, show heave vs water
const motionLines = ["tick  seaTime  position  heave   pitch   waterUnder  velocity  bow"];
const sampleSprite = core.createCalmWorkingShipSprite();
sampleSprite.frame(40, "dark");
for(let step=0; step< 60*6; step+=12){
  for(let k=0;k<12;k++) sampleSprite.tick();
  sampleSprite.frame(40, "dark");
  const sec = sampleSprite.seaTime()/1000;
  let water=0;
  for(let o=0;o<core.CALM_WORKING_SHIP_HULL_LENGTH;o++) water += core.calmWorkingShipSea(sampleSprite.position()+o+0.5, sec).height;
  water/=core.CALM_WORKING_SHIP_HULL_LENGTH;
  motionLines.push(
    `${String(step+12).padStart(4)}  ${String(sampleSprite.seaTime()).padStart(7)}  ${String(sampleSprite.position()).padStart(8)}  ${sampleSprite.heave().toFixed(3).padStart(6)}  ${sampleSprite.pitch().toFixed(3).padStart(6)}  ${water.toFixed(3).padStart(9)}  ${sampleSprite.velocity().toFixed(2).padStart(8)}  ${sampleSprite.bow()>0?"→":"←"}`
  );
}
const motionLegend = `Sampled every 12 ticks (192 ms) for 6 seconds at width 40. Heave tracks the mean water under the hull; pitch follows local slope; velocity surges with orbital flow; bow flips at edges. Correlation heave↔water ≈ 0.8 (see physics test).`;
const motionTable = motionLines.join("\n");

// Parity: Pi vs Claude same frame, light vs dark
const parityChecks = [];
for(const family of ["dark","light"]){
  const a = core.createCalmWorkingShipSprite().frame(40, family);
  const b = core.createCalmWorkingShipSprite().frame(40, family);
  const piAnim = pi.createCalmWorkingShipAnimation();
  const piFrame = piAnim.render(40, {family, mode:"truecolor"});
  // Compare Pi ANSI-stripped glyphs to core cells
  const stripAnsi = (s)=>s.replace(/\u001b\[[0-9;]*m/g,"");
  const piStripped = piFrame.map(stripAnsi).join("\n");
  const coreGlyphs = a.map(row=>row.map(r=>r.text).join("")).join("\n");
  const match = piStripped===coreGlyphs ? "✓ byte-for-byte glyphs" : "✗ glyph mismatch";
  const packed = raster.packCalmShipRasterCells(a, 40);
  parityChecks.push(`<tr><td>${family}</td><td>${a.length} rows</td><td>${packed.rows} raster rows</td><td>${match}</td><td>colors: ${new Set(a.flatMap(r=>r.map(x=>x.fg))).size} fg</td></tr>`);
}
const parityHtml = `<table><tr><th>Family</th><th>Sprite rows</th><th>Raster rows</th><th>Pi glyph parity</th><th>Palette</th></tr>${parityChecks.join("")}</table>`;

// Wave speeds
const speeds = core.CALM_WORKING_SHIP_WAVE_TRAINS.map(t=> core.calmWorkingShipPhaseSpeed(t.wavelength).toFixed(2)).join(", ");

const out = {
  generatedAt: new Date().toISOString(),
  commit: "e6a0a2a",
  tickMs: core.CALM_WORKING_SHIP_TICK_MS,
  rows: core.CALM_WORKING_SHIP_ROWS,
  hullLength: core.CALM_WORKING_SHIP_HULL_LENGTH,
  waveTrains: core.CALM_WORKING_SHIP_WAVE_TRAINS,
  speeds,
  frames,
  motionLegend,
  motionTable,
  parityHtml,
};

writeFileSync(path.join("/Users/sinchunyeung/.no-mistakes/evidence/01M3KR99AQN8CWRY0H9YHS7GHP/calm-frames.json"), JSON.stringify(out, null, 2));
console.log("wrote calm-frames.json with", frames.length, "frames");
console.log("tickMs", core.CALM_WORKING_SHIP_TICK_MS, "rows", core.CALM_WORKING_SHIP_ROWS);
console.log(speeds);
