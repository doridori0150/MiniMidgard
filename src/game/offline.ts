import type { GameState } from './types.ts';
import { zone } from './data/zones.ts';
import { MONSTERS } from './data/monsters.ts';
import { ITEMS } from './data/items.ts';
import { addItem, applyExp, sellStack, isKeepItem, inHours } from './state.ts';
import { partyPerks } from './stats.ts';

export const OFFLINE_CAP_MS = 12 * 3600 * 1000;
export const OFFLINE_EFF = 0.6;

export interface OfflineReport {
  ms: number;
  zone: string;
  kills: number;
  exp: number;
  items: Record<string, number>;
  equips: string[];
  cards: string[];
  zeny: number;
  levels: { name: string; base: number; job: number }[];
  /** a night-only map closed while away: the party walked back here */
  faded?: { from: string; to: string };
}

function poisson(lambda: number, rng: () => number): number {
  if (lambda <= 0) return 0;
  if (lambda > 40) return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * gauss(rng)));
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= rng(); } while (p > L);
  return k - 1;
}
function gauss(rng: () => number) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-9, rng()))) * Math.cos(2 * Math.PI * rng());
}

/** ms from `start` until a local-clock window [from, to) closes; 0 if it is closed at `start` */
function msUntilClose(h: { from: number; to: number }, start: Date): number {
  if (!inHours(h, start)) return 0;
  const end = new Date(start);
  end.setHours(h.to % 24, 0, 0, 0);
  if (end <= start) end.setDate(end.getDate() + 1);
  return end.getTime() - start.getTime();
}

export function applyOffline(s: GameState, elapsed: number, rng: () => number = Math.random): OfflineReport | null {
  const ms = Math.min(OFFLINE_CAP_MS, elapsed);
  if (ms < 60_000) return null;
  // a night-only path stays open only until dawn: hunt there until it closes, then back on the previous map
  const z = zone(s.zone);
  const h = z.gate?.need.find((n) => n.kind === 'hours');
  if (h && h.kind === 'hours') {
    const open = msUntilClose(h, new Date(Date.now() - elapsed));
    if (open < ms) {
      const first = open >= 60_000 ? huntOffline(s, open, rng) : null;
      const back = z.unlockBy && s.unlocked.includes(z.unlockBy) ? z.unlockBy : 'town';
      s.zone = back;
      const second = huntOffline(s, ms - open, rng);
      const r = merge(first, second);
      if (r) r.faded = { from: z.id, to: back };
      return r ?? { ms, zone: back, kills: 0, exp: 0, items: {}, equips: [], cards: [], zeny: 0, levels: [], faded: { from: z.id, to: back } };
    }
  }
  return huntOffline(s, ms, rng);
}

function merge(a: OfflineReport | null, b: OfflineReport | null): OfflineReport | null {
  if (!a || !b) return a ?? b;
  const items = { ...a.items };
  for (const [id, n] of Object.entries(b.items)) items[id] = (items[id] ?? 0) + n;
  const levels = [...a.levels];
  for (const l of b.levels) {
    const x = levels.find((y) => y.name === l.name);
    if (x) { x.base += l.base; x.job += l.job; } else levels.push({ ...l });
  }
  return { ms: a.ms + b.ms, zone: a.zone, kills: a.kills + b.kills, exp: a.exp + b.exp, items, equips: [...a.equips, ...b.equips], cards: [...a.cards, ...b.cards], zeny: a.zeny + b.zeny, levels };
}

function huntOffline(s: GameState, ms: number, rng: () => number): OfflineReport | null {
  const z = zone(s.zone);
  if (!z.mobs.length) return null;
  const r = s.rate;
  // kills per ms, measured live; fall back to a cautious guess on fresh saves
  let kpm = r.zone === z.id && r.ms > 60_000 ? r.kills / r.ms : 1 / 9000;
  // frequent wipes mean the zone is too hard: be stingy
  if (r.zone === z.id && r.ms > 60_000 && r.deaths / (r.ms / 600_000) > 1) kpm *= 0.4;
  const kills = Math.floor(kpm * ms * OFFLINE_EFF);
  if (kills <= 0) return null;
  const report: OfflineReport = { ms, zone: z.id, kills, exp: 0, items: {}, equips: [], cards: [], zeny: 0, levels: [] };
  const total = z.mobs.reduce((a, b) => a + b.w, 0);
  const etcMul = 1 + partyPerks(s).dropPct / 100;
  let baseExp = 0, jobExp = 0;
  const prog = s.progress[z.id];
  for (const e of z.mobs) {
    const m = MONSTERS[e.id];
    const c = Math.round(kills * e.w / total);
    if (c <= 0) continue;
    baseExp += m.exp * c;
    jobExp += m.jexp * c;
    const book = (s.book[m.id] ??= { kills: 0 });
    book.kills += c;
    for (const d of m.drops) {
      const def = ITEMS[d.id];
      const rate = d.rate * (def.kind === 'etc' || def.kind === 'use' ? etcMul : 1);
      let n = poisson(c * rate, rng);
      if (!n) continue;
      if (def.kind === 'equip') {
        n = Math.min(n, 20);
        for (let i = 0; i < n; i++) { addItem(s, d.id, 1, d.slots); report.equips.push(d.id); }
      } else {
        if (def.kind === 'card') { for (let i = 0; i < n; i++) report.cards.push(d.id); book.card = true; s.totals.cards += n; }
        if (def.kind === 'etc' && s.settings.autoSellEtc && !isKeepItem(d.id)) {
          addItem(s, d.id, n);
          report.zeny += sellStack(s, d.id, n);
        } else {
          addItem(s, d.id, n);
          report.items[d.id] = (report.items[d.id] ?? 0) + n;
        }
      }
    }
  }
  s.totals.kills += kills;
  prog.kills += kills;
  if (z.boss) prog.bossGauge = Math.min(z.bossGauge, prog.bossGauge + kills);
  if (z.mvp) prog.mvpGauge = Math.min(z.mvpGauge, prog.mvpGauge + kills);
  report.exp = Math.round(baseExp);
  const n = s.heroes.length;
  const bonus = 1 + 0.15 * (n - 1);
  const maxLv = Math.max(...s.heroes.map((h) => h.baseLv));
  for (const h of s.heroes) {
    const catchup = h.baseLv < maxLv - 5 ? 2.5 : 1;
    const up = applyExp(h, baseExp * bonus / n * catchup, jobExp * bonus / n * catchup);
    if (up.base || up.job) report.levels.push({ name: h.name, base: up.base, job: up.job });
  }
  return report;
}
