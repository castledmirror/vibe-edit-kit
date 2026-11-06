// Layout gate. Renders stills across every scene and fails on clipped, overflowing, out-of-frame or
// too-small-for-a-phone text.  node qa/check.mjs <workdir>
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill} from '@remotion/renderer';
import path from 'path';
import {fileURLToPath} from 'url';
import os from 'os';
import fs from 'fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const work = path.resolve(process.argv[2]);
const spec = JSON.parse(fs.readFileSync(path.join(work, 'spec.json'), 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-'));
const inputProps = {...spec, qa: true};
const FRACTIONS = [0.3, 0.5, 0.7, 0.85, 0.97];
const span = (s) => [Math.round(s.start * spec.fps), Math.round(s.end * spec.fps)];
const frames = [...new Set(spec.scenes.flatMap((s) => {
  const [a, b] = span(s);
  return FRACTIONS.map((f) => Math.min(a + Math.round((b - a) * f), b - 1));
}))].sort((a, b) => a - b);

console.log('bundling…');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: work});
const composition = await selectComposition({serveUrl, id: 'QA', inputProps});
console.log(`checking ${frames.length} frames across ${spec.scenes.length} scenes`);

const sceneOf = (f) => spec.scenes.find((s) => { const [a, b] = span(s); return f >= a && f < b; })?.id ?? '—';
const all = [];
for (const frame of frames) {
  let report = null;
  await renderStill({
    composition, serveUrl, frame, inputProps, logLevel: 'error', output: path.join(tmp, `f${frame}.png`),
    onBrowserLog: (l) => { if (l.text.startsWith('QA_REPORT ')) report = JSON.parse(l.text.slice(10)); },
  });
  if (report === null) { console.log(`FAIL — no QA report for frame ${frame}`); process.exit(1); }
  for (const i of report.issues) all.push({frame, scene: sceneOf(frame), ...i});
}
fs.rmSync(tmp, {recursive: true, force: true});
if (!all.length) { console.log('PASS — nothing clipped, overflowing, out of frame or too small.'); process.exit(0); }
const groups = new Map();
for (const i of all) {
  const key = `${i.scene}|${i.type}|${i.text}`;
  if (!groups.has(key)) groups.set(key, {...i, n: 0});
  groups.get(key).n += 1;
}
console.log(`FAIL — ${groups.size} issue(s):`);
for (const g of groups.values()) console.log(`  [${g.scene}] ${g.type}${g.pt ? ` ${g.pt}pt` : ''}${g.by ? ` by ${Math.round(g.by)}px` : ''}: "${g.text}"`);
process.exit(1);
