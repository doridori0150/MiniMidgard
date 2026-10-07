// 목표 핀 (BUILD_TREE.md §6.2): up to three items the player is chasing. Each pin knows where the item drops,
// how many of its source monsters were killed since it was pinned, and notices when one more of it is owned.
import type { GameState, Hero } from './types.ts';
import { ITEMS } from './data/items.ts';
import { MONSTERS } from './data/monsters.ts';
import { ZONES, type ZoneDef } from './data/zones.ts';
import { buildOf } from './data/builds.ts';

export type Target = NonNullable<GameState['targets']>[number];
export const MAX_TARGETS = 3;

/** monsters that drop the item, best rate first, with the maps they live on */
export function sourcesOf(id: string): { mob: string; rate: number; zones: ZoneDef[] }[] {
  const out: { mob: string; rate: number; zones: ZoneDef[] }[] = [];
  for (const m of Object.values(MONSTERS)) {
    const d = m.drops.find((x) => x.id === id);
    if (!d) continue;
    out.push({ mob: m.id, rate: d.rate, zones: ZONES.filter((z) => z.mobs.some((x) => x.id === m.id) || z.boss === m.id || z.mvp === m.id) });
  }
  return out.sort((a, b) => b.rate - a.rate);
}

export function ownedCount(s: GameState, id: string): number {
  return (s.stacks[id] ?? 0) + s.equips.filter((e) => e.id === id).length;
}
function sourceKills(s: GameState, id: string): number {
  return sourcesOf(id).reduce((a, x) => a + (s.book[x.mob]?.kills ?? 0), 0);
}

export function targets(s: GameState): Target[] { return (s.targets ??= []); }
export function isTarget(s: GameState, id: string) { return targets(s).some((t) => t.id === id); }
export function pinTarget(s: GameState, id: string): string | null {
  const list = targets(s);
  if (list.some((t) => t.id === id)) return null;
  if (list.length >= MAX_TARGETS) return `목표는 ${MAX_TARGETS}개까지예요. 하나를 해제하세요.`;
  if (!ITEMS[id]) return '알 수 없는 아이템';
  list.push({ id, since: Date.now(), have0: ownedCount(s, id), kills0: sourceKills(s, id) });
  return null;
}
export function unpinTarget(s: GameState, id: string) { s.targets = targets(s).filter((t) => t.id !== id); }

/** kills of the item's source monsters since it was pinned */
export function targetKills(s: GameState, t: Target) { return Math.max(0, sourceKills(s, t.id) - t.kills0); }

/** pins whose item has been obtained since pinning; they are removed */
export function takeAchieved(s: GameState): string[] {
  const list = targets(s);
  const done = list.filter((t) => ownedCount(s, t.id) > t.have0).map((t) => t.id);
  if (done.length) s.targets = list.filter((t) => !done.includes(t.id));
  return done;
}

/** what to chase next: the hero's build items not owned or pinned yet (then any build's) */
export function suggestTargets(s: GameState, h: Hero): string[] {
  const own = (id: string) => ownedCount(s, id) > 0 || isTarget(s, id);
  const fromBuild = (buildOf(h.cls, h.build)?.items ?? []).filter((id) => ITEMS[id] && !own(id) && sourcesOf(id).length);
  return fromBuild.slice(0, 3);
}
