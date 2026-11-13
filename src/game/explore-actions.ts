// 탐험 actions that move items or heroes (docs/design/EXPLORATION.md): opening a found chest, the bench expedition,
// build presets. The pure rules (cells, shrines, story, account bonus) are in explore.ts.
import type { BuildPreset, EquipSlot, GameState, Hero } from './types.ts';
import { ZONES, type ZoneDef } from './data/zones.ts';
import { MONSTERS } from './data/monsters.ts';
import { ITEMS } from './data/items.ts';
import { EXPLORE_CELLS, type PoiDef } from './data/explore.ts';
import { addItem, equip, equipAmmo, setSlot, slotsOf, unequipUid } from './state.ts';
import { isExplored, poiDone, poiState, stepOn } from './explore.ts';
import { SLOT_COUNT } from './data/skills.ts';

const ZONE: Record<string, ZoneDef> = Object.fromEntries(ZONES.map((z) => [z.id, z]));

/** a found chest opens on the spot (once) */
export function openChest(s: GameState, p: PoiDef): { items: Record<string, number>; zeny: number } | null {
  if (p.kind !== 'chest' || !p.chest || poiDone(s, p.id)) return null;
  poiState(s).done.push(p.id);
  for (const [id, n] of Object.entries(p.chest.items)) addItem(s, id, n);
  s.zeny += p.chest.zeny;
  return p.chest;
}

// ── 벤치 탐험대 (§6)
/** ms one bench hero needs per new cell; a hero below the map's level takes twice as long */
export const EXPEDITION_CELL_MS = 4 * 60_000;
export const EXPEDITION_MAX = 3;

export function expeditionHeroes(s: GameState): Hero[] {
  const e = s.expedition;
  if (!e) return [];
  return (s.bench ?? []).filter((h) => e.heroes.includes(h.id));
}

export function sendExpedition(s: GameState, zone: string, heroIds: number[]): string | null {
  const z = ZONE[zone];
  if (!z || zone === 'town') return '탐험할 수 없는 곳입니다.';
  if (!s.unlocked.includes(zone)) return '아직 열리지 않은 맵입니다.';
  const ids = heroIds.filter((id) => (s.bench ?? []).some((h) => h.id === id)).slice(0, EXPEDITION_MAX);
  if (!ids.length) return '벤치에서 보낼 동료를 고르세요.';
  if (s.expedition) recallExpedition(s);
  s.expedition = { zone, heroes: ids, since: Date.now(), acc: 0, carry: {} };
  return null;
}

/** bring the expedition home: what it carried goes into the bag */
export function recallExpedition(s: GameState): Record<string, number> {
  const e = s.expedition;
  if (!e) return {};
  for (const [id, n] of Object.entries(e.carry)) addItem(s, id, n);
  delete s.expedition;
  return e.carry;
}

/** time passes for the expedition (hunt tick or offline): new cells, revealed points, a few etc items */
export function expeditionTick(s: GameState, ms: number, rng: () => number): PoiDef[] {
  const e = s.expedition;
  if (!e) return [];
  const z = ZONE[e.zone];
  const team = expeditionHeroes(s);
  if (!z || !team.length) { delete s.expedition; return []; }
  const left = [...Array(EXPLORE_CELLS).keys()].filter((c) => !isExplored(s, z.id, c));
  if (!left.length) return [];
  const speed = team.reduce((a, h) => a + (h.baseLv >= z.lv[0] ? 1 : 0.5), 0);
  e.acc += ms * speed;
  const found: PoiDef[] = [];
  const etc = z.mobs.flatMap((m) => MONSTERS[m.id]?.drops.filter((d) => ITEMS[d.id]?.kind === 'etc').map((d) => d.id) ?? []);
  while (e.acc >= EXPEDITION_CELL_MS && left.length) {
    e.acc -= EXPEDITION_CELL_MS;
    const cell = left.splice(Math.floor(rng() * left.length), 1)[0];
    found.push(...stepOn(s, z, cell));
    if (etc.length) { const id = etc[Math.floor(rng() * etc.length)]; e.carry[id] = (e.carry[id] ?? 0) + 1 + Math.floor(rng() * 2); }
  }
  if (!left.length) e.acc = 0;
  return found;
}

// ── 빌드 프리셋 (§7)
export const PRESET_NAMES = ['필드', '균열', '보스'];

export function presetsOf(h: Hero): (BuildPreset | null)[] {
  return PRESET_NAMES.map((_, i) => h.presets?.[i] ?? null);
}

export function savePreset(h: Hero, i: number, name = PRESET_NAMES[i]) {
  const list = presetsOf(h);
  list[i] = { name, skillSlots: [...slotsOf(h)], tactics: structuredClone(h.tactics), equip: { ...h.equip }, ammo: h.ammo };
  h.presets = list;
}

/** put a preset back on: returns lines about what could not be restored */
export function loadPreset(s: GameState, h: Hero, i: number): string[] {
  const p = h.presets?.[i];
  if (!p) return ['저장된 프리셋이 없습니다.'];
  const notes: string[] = [];
  // gear: take off what the preset doesn't list, then put its pieces on (from another hero if need be)
  const want = new Set(Object.values(p.equip));
  for (const uid of Object.values(h.equip)) if (uid !== undefined && !want.has(uid)) unequipUid(s, h, uid);
  for (const [slot, uid] of Object.entries(p.equip) as [EquipSlot, number][]) {
    if (h.equip[slot] === uid) continue;
    const inst = s.equips.find((e) => e.uid === uid);
    if (!inst) { notes.push(`${slot} 장비가 더 이상 없습니다(판매·재련 실패).`); continue; }
    const err = equip(s, h, uid, slot);
    if (err) notes.push(`${ITEMS[inst.id].name}: ${err}`);
  }
  if (p.ammo !== h.ammo) {
    if (!p.ammo || (s.stacks[p.ammo] ?? 0) > 0) equipAmmo(s, h, p.ammo);
    else notes.push(`${ITEMS[p.ammo]?.name ?? p.ammo}이(가) 가방에 없습니다.`);
  }
  for (let k = 0; k < SLOT_COUNT; k++) {
    const id = p.skillSlots[k] ?? null;
    const err = setSlot(h, k, id);
    if (err && id) notes.push(err);
  }
  h.tactics = structuredClone(p.tactics);
  return notes;
}
