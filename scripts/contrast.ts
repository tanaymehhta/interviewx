// WCAG AA contrast check for both themes. Run: node scripts/contrast.ts
// Reads the tokens from app/globals.css so it cannot drift from the app.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const tokens = (block: string) => Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));
const light = tokens(css.match(/^html\{[\s\S]*?\}/m)![0]);
const dark = { ...light, ...tokens(css.match(/\[data-theme="dark"\]\{[\s\S]*?\}/)![0]) };

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [text, background, minimum]. 4.5 for body text, 3 for large serif numerals and headings.
const PAIRS: [string, string, number][] = [
  ['stone', 'paper', 4.5], ['stone', 'ivory', 4.5], ['ink', 'paper', 4.5], ['ink', 'ivory', 4.5],
  ['on-olive', 'olive', 4.5], ['olive', 'paper', 4.5], ['garnet', 'paper', 4.5], ['garnet', 'ivory', 4.5],
  ['ink', 'gold-soft', 4.5], ['paper', 'garnet', 4.5], ['paper', 'ink', 4.5], ['stone', 'gold-soft', 4.5],
];
// Gold is a fill behind ink text only in the light theme (keep marks); dark uses gold-soft there.
let failed = ratio(light.ink, light.gold) < 4.5 ? 1 : 0;
for (const [name, t] of [['light', light], ['dark', dark]] as const) {
  for (const [fg, bg, min] of PAIRS) {
    const r = ratio(t[fg], t[bg]);
    if (r < min) failed++;
    console.log(`${r < min ? 'FAIL' : 'ok  '} ${name.padEnd(5)} ${fg} on ${bg}: ${r.toFixed(2)} (min ${min})`);
  }
}
process.exit(failed ? 1 : 0);
