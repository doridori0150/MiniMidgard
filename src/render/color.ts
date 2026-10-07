const cache = new Map<string, string>();

function parse(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

/** lighten (amt>0) or darken (amt<0) a hex color by a fraction 0..1 */
export function shade(hex: string, amt: number): string {
  const key = hex + amt;
  const hit = cache.get(key);
  if (hit) return hit;
  const [r, g, b] = parse(hex);
  const f = (c: number) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  const out = `rgb(${f(r)},${f(g)},${f(b)})`;
  cache.set(key, out);
  return out;
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = parse(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const f = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${f(r1, r2)}${f(g1, g2)}${f(b1, b2)}`;
}
