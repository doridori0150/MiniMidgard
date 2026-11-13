// 탐험 · 석등 · 이야기 (docs/design/EXPLORATION.md) — the pure state rules. No imports from state.ts, so the save /
// price code can read the account bonus without an import cycle; item-moving actions live in explore-actions.ts.
import type { Bonus, GameState } from './types.ts';
import { ZONES, type ZoneDef } from './data/zones.ts';
import { ARC, EXPLORE_CELLS, EXPLORE_COLS, EXPLORE_ROWS, POI_BY_ZONE, POIS, STORY_ARCS, type PoiDef, type StoryArc } from './data/explore.ts';

const ZONE: Record<string, ZoneDef> = Object.fromEntries(ZONES.map((z) => [z.id, z]));

export function poiState(s: GameState) {
  return (s.poi ??= { found: [], done: [], charge: {}, unread: [] });
}

/** the exploration cell a field point falls in */
export function cellAt(z: ZoneDef, x: number, y: number): number {
  const c = Math.min(EXPLORE_COLS - 1, Math.max(0, Math.floor((x / z.w) * EXPLORE_COLS)));
  const r = Math.min(EXPLORE_ROWS - 1, Math.max(0, Math.floor((y / z.h) * EXPLORE_ROWS)));
  return r * EXPLORE_COLS + c;
}
export function cellCenter(z: ZoneDef, cell: number): [number, number] {
  const c = cell % EXPLORE_COLS, r = Math.floor(cell / EXPLORE_COLS);
  return [((c + 0.5) / EXPLORE_COLS) * z.w, ((r + 0.5) / EXPLORE_ROWS) * z.h];
}
const bits = (n: number) => { let k = 0; for (let v = n >>> 0; v; v &= v - 1) k++; return k; };
export const isExplored = (s: GameState, zone: string, cell: number) => (((s.explore?.[zone] ?? 0) >>> cell) & 1) === 1;
export const explorePct = (s: GameState, zone: string) => Math.round((bits(s.explore?.[zone] ?? 0) / EXPLORE_CELLS) * 100);
/** maps where exploring means something: fields and dungeons (not the town) */
export const explorable = (z: ZoneDef) => z.id !== 'town';

/** someone stood in this cell: mark it and return the points of interest it revealed */
export function stepOn(s: GameState, z: ZoneDef, cell: number): PoiDef[] {
  const m = (s.explore ??= {});
  const bit = 1 << cell;
  if (((m[z.id] ?? 0) & bit) === 0) m[z.id] = (m[z.id] ?? 0) | bit;
  return revealPois(s, z.id);
}

/** reveal every point whose cell has been stood in once the map is explored far enough */
export function revealPois(s: GameState, zone: string): PoiDef[] {
  const list = POI_BY_ZONE[zone];
  if (!list) return [];
  const st = poiState(s), pct = explorePct(s, zone), out: PoiDef[] = [];
  for (const p of list) {
    if (st.found.includes(p.id) || pct < p.at || !isExplored(s, zone, p.cell)) continue;
    st.found.push(p.id);
    if (p.kind === 'lore' && p.lore) st.unread.push(p.lore);
    out.push(p);
  }
  return out;
}

export const poiFound = (s: GameState, id: string) => !!s.poi?.found.includes(id);
export const poiDone = (s: GameState, id: string) => !!s.poi?.done.includes(id);

// ── 석등
/** shrines on maps with a field boss light from that boss; the others charge with kills on their map */
export function shrineNeedsBoss(p: PoiDef): string | undefined {
  return p.charge ? undefined : ZONE[p.zone]?.boss;
}
/** a kill on `zone` (boss = it was the map's field boss): returns the shrines that just lit */
export function chargeShrines(s: GameState, zone: string, boss: boolean): PoiDef[] {
  const out: PoiDef[] = [];
  for (const p of POI_BY_ZONE[zone] ?? []) {
    if (p.kind !== 'shrine' || !poiFound(s, p.id) || poiDone(s, p.id)) continue;
    const st = poiState(s);
    if (shrineNeedsBoss(p)) {
      if (!boss && !(s.progress[zone]?.bossKills > 0)) continue;
    } else {
      st.charge[p.id] = (st.charge[p.id] ?? 0) + 1;
      if (st.charge[p.id] < (p.charge ?? 0)) continue;
    }
    st.done.push(p.id);
    out.push(p);
  }
  return out;
}
/** a just-found shrine whose map boss already fell lights at once */
export function lightIfBossDown(s: GameState, p: PoiDef): boolean {
  if (p.kind !== 'shrine' || poiDone(s, p.id) || !shrineNeedsBoss(p) || !(s.progress[p.zone]?.bossKills > 0)) return false;
  poiState(s).done.push(p.id);
  return true;
}
export const litShrines = (s: GameState) => POIS.filter((p) => p.kind === 'shrine' && poiDone(s, p.id));

/** the whole account's bonus from lit shrines and finished region shrine sets */
export function accountBonus(s: GameState): Bonus & { expPct: number; dropPct: number; zenyPct: number } {
  const b = { expPct: 0, dropPct: 0, zenyPct: 0, maxHpPct: 0, maxSpPct: 0 };
  const lit = litShrines(s);
  for (const p of lit) {
    if (p.shrine === 'exp') b.expPct += 1;
    if (p.shrine === 'drop') b.dropPct += 1;
    if (p.shrine === 'zeny') b.zenyPct += 1;
    if (p.shrine === 'hp') b.maxHpPct += 1;
    if (p.shrine === 'sp') b.maxSpPct += 1;
  }
  for (const arc of STORY_ARCS) if (regionShrinesLit(s, arc.region)) b.expPct += arc.setExp;
  return b;
}
export function regionShrines(region: string): PoiDef[] {
  return POIS.filter((p) => p.kind === 'shrine' && ZONE[p.zone]?.region === region);
}
export function regionShrinesLit(s: GameState, region: string): boolean {
  const all = regionShrines(region);
  return all.length > 0 && all.every((p) => poiDone(s, p.id));
}

// ── 이야기
export const fragmentFound = (s: GameState, frag: string) => POIS.some((p) => p.lore === frag && poiFound(s, p.id));
export const arcFound = (s: GameState, arc: StoryArc) => arc.fragments.filter((f) => fragmentFound(s, f.id)).length;
export const arcComplete = (s: GameState, arcId: string) => !!ARC[arcId] && arcFound(s, ARC[arcId]) === ARC[arcId].fragments.length;
export const arcEnded = (s: GameState, arcId: string) => poiDone(s, 'end:' + arcId);
/** the hidden boss fell: the story ends (once) */
export function endArcByBoss(s: GameState, mob: string): StoryArc | null {
  const arc = STORY_ARCS.find((a) => a.boss === mob);
  if (!arc || arcEnded(s, arc.id)) return null;
  const st = poiState(s);
  st.done.push('end:' + arc.id);
  st.unread.push('end:' + arc.id);
  return arc;
}
/** ended stories change their region (StoryArc.effect): a bonus while hunting on its maps, a danger monster that stops coming */
export const endedArcs = (s: GameState) => STORY_ARCS.filter((a) => arcEnded(s, a.id));
export const storyZoneBonus = (s: GameState, zone: string): Bonus[] => endedArcs(s).filter((a) => a.effect.zones.includes(zone)).map((a) => a.effect.bonus);
export const quietDanger = (s: GameState, mob: string) => endedArcs(s).some((a) => a.effect.quiet === mob);
/** 가라앉은 수도원의 종 (the P1 story) has ended */
export const dawnBell = (s: GameState) => arcEnded(s, 'bell');
