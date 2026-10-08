import type { ClassId, EquipInst, EquipSlot, GameState, Hero, HeroRole, Look, StatKey, CostumeSlot, QuickSlot, Tactics, PartyOrders } from './types.ts';
import { STAT_KEYS, QUICK_SLOTS } from './types.ts';
import { CLASSES, FIRST_JOBS, SECOND_JOB_OF, SECOND_JOB_LV, lineage } from './data/classes.ts';
import { SKILLS } from './data/skills.ts';
import { ITEMS } from './data/items.ts';
import { ZONES, openers, type ZoneDef, type GateNeed } from './data/zones.ts';
import { MONSTERS } from './data/monsters.ts';
import { buildOf } from './data/builds.ts'; // also registers the build identity items and their drops
import { awakenCost, nextStarId } from './data/cardstars.ts'; // also registers the ★2/★3 card forms
import { START_STAT_POINTS, statCost } from './exp.ts';
import { ARMOR_SAFE, WEAPON_SAFE, partyPerks } from './stats.ts';

export const SAVE_KEY = 'minimidgard.save.v1';

export function defaultQuick(): QuickSlot[] {
  const q: QuickSlot[] = [];
  for (let i = 0; i < QUICK_SLOTS; i++) q.push({ id: null, auto: true, pct: 40 });
  q[0] = { id: 'u_red', auto: true, pct: 40 };
  return q;
}

/** register a consumable in a quick slot; if it is already in another slot the two swap */
export function setQuick(s: GameState, i: number, id: string | null) {
  const from = id ? s.quick.findIndex((q) => q.id === id) : -1;
  if (from >= 0 && from !== i) {
    const a = s.quick[i], b = s.quick[from];
    s.quick[i] = b; s.quick[from] = a;
    return;
  }
  s.quick[i] = { ...s.quick[i], id };
  if (id && ITEMS[id]?.heal?.sp && !ITEMS[id]?.heal?.hp) s.quick[i].pct = Math.min(s.quick[i].pct, 30);
}

/** what a quick-slot item reacts to */
export function quickTrigger(id: string): 'hp' | 'sp' | 'buff' | 'none' {
  const d = ITEMS[id];
  if (!d) return 'none';
  if (d.buff) return 'buff';
  if (d.heal?.hp) return 'hp';
  if (d.heal?.sp) return 'sp';
  return 'none';
}

/** class-role defaults for 행동 요령 */
export function defaultTactics(cls: ClassId): Tactics {
  switch (lineage(cls).at(-2) ?? cls) { // 1st-job root: knight → swordsman
    case 'swordsman': return { target: 'protect', position: 'auto', skills: 'normal', chase: 'normal', role: 'auto' };
    case 'mage': return { target: 'assist', position: 'auto', skills: 'normal', chase: 'tight', role: 'auto' };
    case 'archer': return { target: 'assist', position: 'auto', skills: 'normal', chase: 'normal', role: 'auto' };
    case 'acolyte': return { target: 'assist', position: 'auto', skills: 'conserve', chase: 'tight', role: 'auto' };
    case 'thief': return { target: 'weakest', position: 'auto', skills: 'aggressive', chase: 'normal', role: 'auto' };
    case 'merchant': return { target: 'assist', position: 'auto', skills: 'normal', chase: 'normal', role: 'auto' };
  }
  return { target: 'assist', position: 'auto', skills: 'normal', chase: 'normal', role: 'auto' };
}

/** roles a class can play, its natural one first. Acolytes: support healer, battle priest (melee) or exorcist (holy caster) */
export function roleOptions(cls: ClassId): HeroRole[] {
  switch (lineage(cls).at(-2) ?? cls) {
    case 'swordsman': return ['tank', 'melee'];
    case 'mage': return ['caster'];
    case 'archer': return ['ranged'];
    case 'acolyte': return ['healer', 'melee', 'caster'];
    case 'thief': return ['melee', 'tank'];
    case 'merchant': return ['melee', 'tank'];
  }
  return ['melee'];
}

/** what 'auto' means for this hero: the natural role, except an acolyte with more STR than INT fights as a battle priest */
export function autoRole(h: Hero): HeroRole {
  if ((lineage(h.cls).at(-2) ?? h.cls) === 'acolyte' && h.stats.str > h.stats.int) return 'melee';
  return roleOptions(h.cls)[0];
}

export function heroRole(h: Hero): HeroRole {
  const r = h.tactics?.role;
  return r && r !== 'auto' && roleOptions(h.cls).includes(r) ? r : autoRole(h);
}

export function defaultOrders(): PartyOrders {
  return { pull: 3, rest: 20 };
}

export function newHero(s: GameState, name: string, look: Look): Hero {
  return {
    id: s.nextHeroId++,
    name, cls: 'novice', look,
    baseLv: 1, baseExp: 0, jobLv: 1, jobExp: 0,
    stats: { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 },
    statPts: START_STAT_POINTS,
    skills: { first_aid: 1 }, skillPts: 0,
    equip: {},
    auto: { skills: {}, hpPotPct: 40, spPotPct: 0, healPct: 70 },
    tactics: defaultTactics('novice'),
  };
}

/** town + every beginner field that is open from the start (content v0.4: one per first-job home region) */
export function startZones(): string[] {
  return ['town', ...ZONES.filter((z) => z.start).map((z) => z.id)];
}

export function newGame(name: string, look: Look): GameState {
  const s: GameState = {
    v: 1, created: Date.now(), lastSave: Date.now(),
    heroes: [], partySlots: 1, active: 0,
    zeny: 500, stacks: { u_red: 30 }, equips: [], nextUid: 1, nextHeroId: 1,
    zone: 'meadow', unlocked: startZones(), progress: {}, book: {},
    settings: { bgm: 0.5, sfx: 0.8, muted: false, autoSellEtc: false, autoBoss: false, showDamage: true, lowFx: false },
    totals: { kills: 0, cards: 0, refines: 0, breaks: 0, deaths: 0, playMs: 0 },
    rate: { zone: 'meadow', kills: 0, ms: 0, exp: 0, jexp: 0, zeny: 0, deaths: 0 },
    tutorial: {},
    quick: defaultQuick(),
    orders: defaultOrders(),
  };
  const h = newHero(s, name, look);
  s.heroes.push(h);
  // starter kit
  const knife = addEquip(s, 'w_knife');
  const shirt = addEquip(s, 'a_cotton');
  h.equip.weapon = knife.uid;
  h.equip.armor = shirt.uid;
  for (const z of ZONES) s.progress[z.id] = { kills: 0, bossGauge: 0, mvpGauge: 0, bossKills: 0, mvpKills: 0 };
  return s;
}

/** set while a loaded save is being swapped in, so the running game can't write its old state over it */
let frozen = false;
export function save(s: GameState) {
  if (frozen) return;
  s.lastSave = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* storage full or blocked */ }
}

// ───────── 세이브 저장 / 불러오기 (move a save between browsers and devices)
const CODE_PREFIX = 'MMSAVE1:';
export const SAVE_BACKUP_KEY = 'minimidgard.save.backup';
/** the current save as a portable code (base64 of the JSON, so it survives chat apps and notes) */
export function saveCode(s: GameState): string {
  const json = JSON.stringify(s);
  return CODE_PREFIX + btoa(unescape(encodeURIComponent(json)));
}
/** accepts a save code or raw save JSON; returns the save JSON text or an error */
export function readSaveText(text: string): { json: string } | { error: string } {
  let t = text.trim();
  try {
    if (t.startsWith(CODE_PREFIX)) t = decodeURIComponent(escape(atob(t.slice(CODE_PREFIX.length).replace(/\s+/g, ''))));
    const s = JSON.parse(t) as Partial<GameState>;
    if (s.v !== 1 || !Array.isArray(s.heroes) || !s.heroes.length) return { error: '미니 미드가르 세이브가 아닙니다.' };
    return { json: t };
  } catch {
    return { error: '세이브를 읽을 수 없습니다. 코드나 파일이 잘렸는지 확인하세요.' };
  }
}
/** swap a save in (the current one is kept as a backup). In a running game pass `freeze` and reload right after,
 *  so the old state can't be written back over it */
export function installSave(json: string, freeze = true) {
  try {
    const cur = localStorage.getItem(SAVE_KEY);
    if (cur) localStorage.setItem(SAVE_BACKUP_KEY, cur);
    localStorage.setItem(SAVE_KEY, json);
  } catch { /* storage blocked */ }
  if (freeze) frozen = true;
}

export function load(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    if (s.v !== 1) return null;
    for (const z of ZONES) s.progress[z.id] ??= { kills: 0, bossGauge: 0, mvpGauge: 0, bossKills: 0, mvpKills: 0 };
    s.settings.autoBoss ??= false;
    s.orders ??= defaultOrders();
    // content v0.4: every home region's beginner field is open from the start (old saves keep whatever they had, forest too)
    for (const id of startZones()) if (!s.unlocked.includes(id)) s.unlocked.push(id);
    // content v0.3/v0.4 added maps behind bosses: open any map whose gate-keeper boss (any of its openers) this save already beat
    for (const z of ZONES) {
      if (z.gate || s.unlocked.includes(z.id)) continue;
      if (openers(z).some((o) => (s.progress[o]?.bossKills ?? 0) > 0)) s.unlocked.push(z.id);
    }
    for (const h of s.heroes) { h.tactics ??= defaultTactics(h.cls); h.tactics.role ??= 'auto'; }
    if (!s.quick) {
      // migrate the old per-hero potion sliders into quick slots
      const a = s.heroes[0]?.auto;
      s.quick = defaultQuick();
      s.quick[0].pct = a?.hpPotPct || 40;
      s.quick[0].auto = (a?.hpPotPct ?? 40) > 0;
      if ((a?.spPotPct ?? 0) > 0) s.quick[1] = { id: 'u_blue', auto: true, pct: a!.spPotPct };
    }
    return s;
  } catch {
    return null;
  }
}

export function wipeSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}

// ───────── inventory
export function addEquip(s: GameState, id: string, slots?: number): EquipInst {
  const d = ITEMS[id];
  const n = slots ?? d.slots ?? 0;
  const inst: EquipInst = { uid: s.nextUid++, id, refine: 0, slots: n, cards: Array(n).fill(null) };
  s.equips.push(inst);
  return inst;
}

export function addItem(s: GameState, id: string, qty = 1, slots?: number): EquipInst | undefined {
  const d = ITEMS[id];
  if (d.kind === 'equip') {
    let last: EquipInst | undefined;
    for (let i = 0; i < qty; i++) last = addEquip(s, id, slots);
    return last;
  }
  s.stacks[id] = (s.stacks[id] ?? 0) + qty;
  return undefined;
}

export function removeStack(s: GameState, id: string, qty = 1): boolean {
  const have = s.stacks[id] ?? 0;
  if (have < qty) return false;
  if (have === qty) delete s.stacks[id];
  else s.stacks[id] = have - qty;
  return true;
}

/** everyone recruited: the party out hunting and the bench */
export function allHeroes(s: GameState): Hero[] { return s.bench?.length ? [...s.heroes, ...s.bench] : s.heroes; }

export function equippedBy(s: GameState, uid: number): Hero | undefined {
  return allHeroes(s).find((h) => Object.values(h.equip).includes(uid));
}

// ───────── 동료 명단 (ENDGAME.md §2)
/** bench seats: one more every 10 levels from Lv 30 (the highest hero), up to 6 */
export function benchSlots(s: GameState): number {
  const top = Math.max(0, ...allHeroes(s).map((h) => h.baseLv));
  return Math.max(0, Math.min(6, Math.floor((top - 20) / 10)));
}
/** room for a new recruit: a free party seat, or a free bench seat once the party is full */
export function rosterRoom(s: GameState): 'party' | 'bench' | null {
  if (s.heroes.length < s.partySlots) return 'party';
  if ((s.bench?.length ?? 0) < benchSlots(s)) return 'bench';
  return null;
}
/** send a benched hero out; with a full party they swap places with `outIdx` */
export function sendOut(s: GameState, benchIdx: number, outIdx?: number): string | null {
  const bench = (s.bench ??= []);
  const h = bench[benchIdx];
  if (!h) return '없는 동료';
  if (s.heroes.length < s.partySlots) { bench.splice(benchIdx, 1); s.heroes.push(h); return null; }
  if (outIdx === undefined || !s.heroes[outIdx]) return '교체할 동료를 고르세요.';
  const out = s.heroes[outIdx];
  s.heroes[outIdx] = h;
  bench[benchIdx] = out;
  return null;
}
/** take a party member to the bench (the party keeps at least one) */
export function sendToBench(s: GameState, idx: number): string | null {
  if (s.heroes.length <= 1) return '파티에는 최소 한 명이 있어야 해요.';
  if ((s.bench?.length ?? 0) >= benchSlots(s)) return '명단에 빈자리가 없어요.';
  const [h] = s.heroes.splice(idx, 1);
  (s.bench ??= []).push(h);
  return null;
}

export function itemName(inst: EquipInst): string {
  const d = ITEMS[inst.id];
  const prefixes = inst.cards.filter(Boolean).map((c) => ITEMS[c!].prefix);
  const counts = new Map<string, number>();
  for (const p of prefixes) if (p) counts.set(p, (counts.get(p) ?? 0) + 1);
  const pre = [...counts].map(([p, n]) => (n > 1 ? ['', '', '더블 ', '트리플 ', '쿼드 '][n] + p : p)).join(' ');
  return `${inst.refine > 0 ? '+' + inst.refine + ' ' : ''}${pre ? pre + ' ' : ''}${d.name}${inst.slots > 0 ? ` [${inst.slots}]` : ''}`;
}

/** classes whose gear this hero may wear (a 2nd job keeps its 1st job's gear) */
function gearClasses(h: Hero): ClassId[] {
  const c = CLASSES[h.cls];
  return c.from ? [h.cls, c.from] : [h.cls];
}

export function canEquip(h: Hero, id: string): string | null {
  const d = ITEMS[id];
  if (d.jobs && !gearClasses(h).some((c) => d.jobs!.includes(c))) return `${CLASSES[h.cls].name}은(는) 장착할 수 없습니다.`;
  if (d.reqLv && h.baseLv < d.reqLv) return `레벨 ${d.reqLv} 이상 필요합니다.`;
  if (d.loc === 'weapon' && d.wtype && !CLASSES[h.cls].weapons.includes(d.wtype)) return '이 직업이 다룰 수 없는 무기입니다.';
  return null;
}

export function slotsFor(id: string): EquipSlot[] {
  const d = ITEMS[id];
  if (d.loc === 'acc') return ['acc1', 'acc2'];
  return d.loc ? [d.loc as EquipSlot] : [];
}

export function equip(s: GameState, h: Hero, uid: number, prefer?: EquipSlot): string | null {
  const inst = s.equips.find((e) => e.uid === uid);
  if (!inst) return '아이템이 없습니다.';
  const d = ITEMS[inst.id];
  const err = canEquip(h, inst.id);
  if (err) return err;
  const other = equippedBy(s, uid);
  if (other) unequipUid(s, other, uid);
  let slot: EquipSlot;
  if (d.loc === 'acc') slot = prefer === 'acc2' || (h.equip.acc1 !== undefined && h.equip.acc2 === undefined) ? 'acc2' : 'acc1';
  else slot = d.loc as EquipSlot;
  const occupy: EquipSlot[] = [slot, ...((d.alsoHead ?? []) as EquipSlot[])];
  if (d.twoHand) occupy.push('shield');
  for (const sl of occupy) {
    const cur = h.equip[sl];
    if (cur !== undefined) unequipUid(s, h, cur);
  }
  if (slot === 'shield') {
    const w = h.equip.weapon !== undefined ? s.equips.find((e) => e.uid === h.equip.weapon) : undefined;
    if (w && ITEMS[w.id].twoHand) unequipUid(s, h, w.uid);
  }
  for (const sl of occupy) h.equip[sl] = uid;
  return null;
}

export function unequipUid(s: GameState, h: Hero, uid: number) {
  for (const k of Object.keys(h.equip) as EquipSlot[]) if (h.equip[k] === uid) delete h.equip[k];
}

export function equipAmmo(s: GameState, h: Hero, id: string | undefined): string | null {
  if (id === undefined) { delete h.ammo; return null; }
  const err = canEquip(h, id);
  if (err) return err;
  if (!((s.stacks[id] ?? 0) > 0)) return '화살통이 없습니다.';
  h.ammo = id;
  return null;
}

// ───────── costume
export function setCostume(s: GameState, h: Hero, slot: CostumeSlot, uid: number | undefined) {
  if (uid === undefined) { delete h.look.costume[slot]; return; }
  for (const o of s.heroes) for (const k of Object.keys(o.look.costume) as CostumeSlot[]) if (o.look.costume[k] === uid) delete o.look.costume[k];
  h.look.costume[slot] = uid;
}

// ───────── stats & skills
export function raiseStat(h: Hero, k: StatKey, times = 1): number {
  let n = 0;
  for (let i = 0; i < times; i++) {
    const c = statCost(h.stats[k]);
    if (h.stats[k] >= 99 || h.statPts < c) break;
    h.statPts -= c;
    h.stats[k]++;
    n++;
  }
  return n;
}

export function skillReqMet(h: Hero, id: string): boolean {
  const sk = SKILLS[id];
  if (!sk.req) return true;
  return Object.entries(sk.req).every(([r, lv]) => (h.skills[r] ?? 0) >= lv);
}

export function canLearn(h: Hero, id: string): boolean {
  const sk = SKILLS[id];
  if (!sk) return false;
  const cur = h.skills[id] ?? 0;
  if (cur >= sk.maxLv || h.skillPts <= 0) return false;
  if (!lineage(h.cls).includes(sk.cls) || sk.cls === 'novice' && h.cls !== 'novice') return false;
  return skillReqMet(h, id);
}

export function learnSkill(h: Hero, id: string): boolean {
  if (!canLearn(h, id)) return false;
  h.skills[id] = (h.skills[id] ?? 0) + 1;
  h.skillPts--;
  const sk = SKILLS[id];
  if (sk.auto !== 'none' && h.auto.skills[id] === undefined) h.auto.skills[id] = true;
  return true;
}

/** classes this hero can change into next */
export function nextJobs(h: Hero): ClassId[] {
  if (h.cls === 'novice') return FIRST_JOBS;
  return SECOND_JOB_OF[h.cls] ?? [];
}

export function canJobChange(h: Hero): string | null {
  const tier = CLASSES[h.cls].tier;
  if (tier === 2) return '최종 직업입니다. (전승·3차 직업은 다음 업데이트!)';
  if (tier === 0) {
    if (h.jobLv < 10) return '직업 레벨 10이 필요합니다.';
    if ((h.skills.basic ?? 0) < 9) return '기본기 9레벨이 필요합니다.';
    return null;
  }
  if (h.jobLv < SECOND_JOB_LV) return `2차 전직: 직업 레벨 ${SECOND_JOB_LV}이 필요합니다. (현재 ${h.jobLv})`;
  return null;
}

export function jobChange(s: GameState, h: Hero, cls: ClassId): string | null {
  const err = canJobChange(h);
  if (err) return err;
  if (!nextJobs(h).includes(cls)) return '그 직업으로는 전직할 수 없습니다.';
  const wasNovice = h.cls === 'novice';
  // tactics the player never touched follow the new class role
  if (JSON.stringify(h.tactics) === JSON.stringify(defaultTactics(h.cls))) h.tactics = defaultTactics(cls);
  h.cls = cls;
  h.jobLv = 1;
  h.jobExp = 0;
  if (wasNovice) h.skillPts = 0; // leftover 1st-job points carry into the 2nd job
  // unequip gear the new class can't use
  for (const [slot, uid] of Object.entries(h.equip) as [EquipSlot, number][]) {
    const inst = s.equips.find((e) => e.uid === uid);
    if (inst && !canEquip(h, inst.id)) continue;
    delete h.equip[slot];
  }
  return null;
}

/** RO-style quick distribution helper used by "추천" buttons */
export const BUILD_PRESETS: Record<ClassId, Partial<Record<StatKey, number>>> = {
  novice: { str: 4, agi: 3, vit: 2, dex: 2 },
  swordsman: { str: 4, vit: 3, agi: 2, dex: 2 },
  mage: { int: 5, dex: 3, vit: 1 },
  archer: { dex: 5, agi: 3, luk: 1 },
  acolyte: { int: 4, vit: 3, dex: 2 },
  thief: { agi: 5, str: 3, dex: 1, luk: 1 },
  merchant: { str: 4, dex: 3, vit: 2, luk: 1 },
  knight: { str: 5, vit: 4, dex: 2, agi: 2 },
  wizard: { int: 6, dex: 4, vit: 1 },
  hunter: { dex: 6, agi: 3, luk: 2, int: 1 },
  priest: { int: 5, vit: 3, dex: 3 },
  assassin: { agi: 5, str: 4, luk: 2, dex: 1 },
  blacksmith: { str: 5, dex: 3, vit: 3, luk: 1 },
};

export function autoDistribute(h: Hero) {
  const w = buildOf(h.cls, h.build)?.weights ?? BUILD_PRESETS[h.cls];
  const keys = STAT_KEYS.filter((k) => (w[k] ?? 0) > 0);
  let guard = 0;
  while (h.statPts > 0 && guard++ < 500) {
    // pick the stat furthest below its target ratio
    const sum = keys.reduce((a, k) => a + h.stats[k], 0);
    const wsum = keys.reduce((a, k) => a + (w[k] ?? 0), 0);
    let best: StatKey | null = null;
    let bestGap = -Infinity;
    for (const k of keys) {
      const gap = (w[k]! / wsum) * (sum + 1) - h.stats[k];
      if (statCost(h.stats[k]) <= h.statPts && h.stats[k] < 99 && gap > bestGap) { bestGap = gap; best = k; }
    }
    if (!best) break;
    raiseStat(h, best);
  }
}

// ───────── shop
export function buyPrice(s: GameState, id: string): number {
  const p = ITEMS[id].price;
  return Math.max(1, Math.floor(p * (1 - partyPerks(s).discount / 100)));
}

export function sellPrice(s: GameState, id: string, refine = 0): number {
  const d = ITEMS[id];
  const base = d.kind === 'card' ? ({ rare: 800, epic: 3000, mvp: 10000 } as Record<string, number>)[d.rarity ?? 'rare'] ?? 800 : Math.floor(d.price / 2);
  return Math.floor(base * (1 + partyPerks(s).overcharge / 100)) + refine * 50;
}

export function buy(s: GameState, id: string, qty = 1): string | null {
  const cost = buyPrice(s, id) * qty;
  if (s.zeny < cost) return '제니가 부족합니다.';
  s.zeny -= cost;
  addItem(s, id, qty);
  return null;
}

export function sellStack(s: GameState, id: string, qty: number): number {
  const have = s.stacks[id] ?? 0;
  const n = Math.min(have, qty);
  if (n <= 0) return 0;
  removeStack(s, id, n);
  const z = sellPrice(s, id) * n;
  s.zeny += z;
  return z;
}

export function sellEquip(s: GameState, uid: number): number {
  if (equippedBy(s, uid)) return 0;
  const i = s.equips.findIndex((e) => e.uid === uid);
  if (i < 0) return 0;
  const inst = s.equips[i];
  for (const h of allHeroes(s)) for (const k of Object.keys(h.look.costume) as CostumeSlot[]) if (h.look.costume[k] === uid) return 0;
  s.equips.splice(i, 1);
  let z = sellPrice(s, inst.id, inst.refine);
  for (const c of inst.cards) if (c) z += sellPrice(s, c);
  s.zeny += z;
  return z;
}

/** etc items that are never auto-sold: ores, anything rare, and every clue / key / offering a sealed map asks for */
let gateItems: Set<string> | null = null;
export function isKeepItem(id: string): boolean {
  if (!gateItems) {
    gateItems = new Set();
    for (const z of ZONES) {
      if (z.gate?.clue) gateItems.add(z.gate.clue);
      for (const n of z.gate?.need ?? []) if (n.kind === 'item') gateItems.add(n.id);
    }
  }
  return id.startsWith('r_') || !!ITEMS[id]?.rarity || gateItems.has(id);
}

export function sellAllEtc(s: GameState): { count: number; zeny: number } {
  let count = 0, zeny = 0;
  for (const [id, n] of Object.entries(s.stacks)) {
    const d = ITEMS[id];
    if (d.kind !== 'etc' || isKeepItem(id)) continue;
    count += n;
    zeny += sellStack(s, id, n);
  }
  return { count, zeny };
}

// ───────── refine
export interface RefineInfo { mat: string; fee: number; safe: number; chance: number; max: boolean }

export const REFINE_CHANCE_WEAPON: number[][] = [
  // index = target refine level (1..10)
  [100, 100, 100, 100, 100, 100, 100, 100, 60, 40, 19],
  [100, 100, 100, 100, 100, 100, 100, 60, 40, 20, 19],
  [100, 100, 100, 100, 100, 100, 60, 50, 20, 20, 19],
  [100, 100, 100, 100, 100, 60, 40, 40, 20, 20, 9],
];
export const REFINE_CHANCE_ARMOR = [100, 100, 100, 100, 100, 60, 40, 40, 20, 20, 9];

export function refineInfo(inst: EquipInst): RefineInfo | null {
  const d = ITEMS[inst.id];
  if (d.kind !== 'equip' || d.loc === 'acc') return null;
  const target = inst.refine + 1;
  if (d.loc === 'weapon') {
    const wlv = d.wlv ?? 1;
    const mat = wlv === 1 ? 'r_phra' : wlv === 2 ? 'r_emver' : 'r_ori';
    const fee = [50, 200, 5000, 10000][wlv - 1];
    return { mat, fee, safe: WEAPON_SAFE[wlv - 1], chance: target > 10 ? 0 : REFINE_CHANCE_WEAPON[wlv - 1][target], max: target > 10 };
  }
  return { mat: 'r_elu', fee: 2000, safe: ARMOR_SAFE, chance: target > 10 ? 0 : REFINE_CHANCE_ARMOR[target], max: target > 10 };
}

/** refine info including the party's blacksmith bonus */
export function refineInfoFor(s: GameState, inst: EquipInst): RefineInfo | null {
  const info = refineInfo(inst);
  if (!info || info.max || info.chance >= 100) return info;
  return { ...info, chance: Math.min(100, info.chance + partyPerks(s).refineBonus) };
}

export type RefineResult = { ok: true; level: number } | { ok: false; broke: true; name: string } | { ok: false; broke: false; error: string };

export function refine(s: GameState, uid: number, rng = Math.random): RefineResult {
  const inst = s.equips.find((e) => e.uid === uid);
  if (!inst) return { ok: false, broke: false, error: '아이템이 없습니다.' };
  const info = refineInfoFor(s, inst);
  if (!info) return { ok: false, broke: false, error: '정련할 수 없는 아이템입니다.' };
  if (info.max) return { ok: false, broke: false, error: '더 이상 정련할 수 없습니다.' };
  if ((s.stacks[info.mat] ?? 0) < 1) return { ok: false, broke: false, error: `${ITEMS[info.mat].name}이(가) 필요합니다.` };
  if (s.zeny < info.fee) return { ok: false, broke: false, error: '제니가 부족합니다.' };
  removeStack(s, info.mat);
  s.zeny -= info.fee;
  s.totals.refines++;
  if (rng() * 100 < info.chance) {
    inst.refine++;
    return { ok: true, level: inst.refine };
  }
  const name = itemName(inst);
  for (const h of allHeroes(s)) {
    unequipUid(s, h, inst.uid);
    for (const k of Object.keys(h.look.costume) as CostumeSlot[]) if (h.look.costume[k] === inst.uid) delete h.look.costume[k];
  }
  s.equips = s.equips.filter((e) => e.uid !== uid);
  s.totals.breaks++;
  return { ok: false, broke: true, name };
}

// ───────── cards
export function cardFits(cardId: string, inst: EquipInst): boolean {
  const c = ITEMS[cardId];
  const d = ITEMS[inst.id];
  if (c.kind !== 'card' || d.kind !== 'equip') return false;
  switch (c.cardLoc) {
    case 'weapon': return d.loc === 'weapon';
    case 'armor': return d.loc === 'armor';
    case 'shield': return d.loc === 'shield';
    case 'garment': return d.loc === 'garment';
    case 'shoes': return d.loc === 'shoes';
    case 'acc': return d.loc === 'acc';
    case 'head': return d.loc === 'headTop' || d.loc === 'headMid' || d.loc === 'headLow';
  }
  return false;
}

export function compound(s: GameState, uid: number, cardId: string): string | null {
  const inst = s.equips.find((e) => e.uid === uid);
  if (!inst) return '아이템이 없습니다.';
  if (!cardFits(cardId, inst)) return '이 장비에는 꽂을 수 없는 카드입니다.';
  const slot = inst.cards.indexOf(null);
  if (slot < 0) return '빈 슬롯이 없습니다.';
  if (!removeStack(s, cardId)) return '카드가 없습니다.';
  inst.cards[slot] = cardId;
  return null;
}

export const HAIR_STYLES = 8;
export const HAIR_COLORS = ['#3a2a24', '#8a4a2a', '#e8c070', '#f4f0e8', '#d84a4a', '#4a6ad8', '#6ac46a', '#c46ad8', '#ff9ac0', '#2a2a3a'];
export const SKIN_TONES = ['#ffe3cf', '#f6d2b4', '#e8b896', '#c8926a'];
export const DYE_COUNT = 4;

export function defaultLook(gender: 'm' | 'f' = 'f'): Look {
  return { gender, hair: gender === 'f' ? 1 : 0, hairColor: 1, skin: 0, dye: 0, costume: {} };
}

// ───────── progression
import { expNext, jobExpNext, statPointsFor } from './exp.ts';

export function applyExp(hero: Hero, base: number, job: number): { base: number; job: number } {
  let bu = 0, ju = 0;
  hero.baseExp += Math.round(base);
  while (hero.baseLv < 99 && hero.baseExp >= expNext(hero.baseLv)) {
    hero.baseExp -= expNext(hero.baseLv);
    hero.baseLv++;
    hero.statPts += statPointsFor(hero.baseLv);
    bu++;
  }
  const cls = CLASSES[hero.cls];
  if (hero.jobLv < cls.jobMax) {
    hero.jobExp += Math.round(job);
    while (hero.jobLv < cls.jobMax && hero.jobExp >= jobExpNext(cls.tier, hero.jobLv, cls.jobMax)) {
      hero.jobExp -= jobExpNext(cls.tier, hero.jobLv, cls.jobMax);
      hero.jobLv++;
      hero.skillPts++;
      ju++;
    }
    if (hero.jobLv >= cls.jobMax) hero.jobExp = 0;
  }
  return { base: bu, job: ju };
}

/** 테스트 도구: exactly the EXP for n more base or job levels (so stat/skill points and unlocks run as in play) */
export function expForLevels(h: Hero, n: number, kind: 'base' | 'job'): number {
  let total = 0;
  if (kind === 'base') {
    let lv = h.baseLv, cur = h.baseExp;
    for (let i = 0; i < n && lv < 99; i++, lv++) { total += expNext(lv) - cur; cur = 0; }
  } else {
    const cls = CLASSES[h.cls];
    let lv = h.jobLv, cur = h.jobExp;
    for (let i = 0; i < n && lv < cls.jobMax; i++, lv++) { total += jobExpNext(cls.tier, lv, cls.jobMax) - cur; cur = 0; }
  }
  return total;
}

// ───────── sealed & hidden maps (ZoneDef.gate)
export function inHours(n: { from: number; to: number }, now = new Date()): boolean {
  const h = now.getHours();
  return n.from <= n.to ? h >= n.from && h < n.to : h >= n.from || h < n.to;
}

export function needMet(s: GameState, n: GateNeed, now = new Date()): boolean {
  switch (n.kind) {
    case 'item': return (s.stacks[n.id] ?? 0) >= n.qty;
    case 'kills': return (s.book[n.mob]?.kills ?? 0) >= n.n;
    case 'boss': return (s.book[n.mob]?.kills ?? 0) > 0;
    case 'card': return !!s.book[n.mob]?.card;
    case 'level': return Math.max(...s.heroes.map((h) => h.baseLv)) >= n.lv;
    case 'job': return s.heroes.some((h) => CLASSES[h.cls].tier >= n.tier);
    case 'equip': return s.heroes.some((h) => Object.values(h.equip).some((uid) => s.equips.find((e) => e.uid === uid)?.id === n.id));
    case 'hours': return inHours(n, now);
  }
}

/** on the world map at all? hidden maps appear once discovered */
export function zoneKnown(s: GameState, z: ZoneDef): boolean {
  return !z.gate?.hidden || s.unlocked.includes(z.id) || !!s.discovered?.includes(z.id);
}

/** a hidden map reveals itself when its clue item turns up or its first condition is met */
export function gateDiscoverable(s: GameState, z: ZoneDef): boolean {
  const g = z.gate;
  if (!g) return true;
  if (g.clue && (s.stacks[g.clue] ?? 0) > 0) return true;
  const first = g.need.find((n) => n.kind !== 'hours');
  return !!first && needMet(s, first);
}

/** every condition except the clock holds → the seal can be broken */
export function gateReady(s: GameState, z: ZoneDef): boolean {
  return !!z.gate && z.gate.need.every((n) => n.kind === 'hours' || needMet(s, n));
}

/** break the seal for good, offering the `consume` items */
export function openGate(s: GameState, z: ZoneDef): string | null {
  if (s.unlocked.includes(z.id)) return null;
  if (!gateReady(s, z)) return '아직 조건이 부족합니다.';
  for (const n of z.gate!.need) if (n.kind === 'item' && n.consume) removeStack(s, n.id, n.qty);
  s.unlocked.push(z.id);
  return null;
}

export function hoursText(n: { from: number; to: number }): string {
  const f = (h: number) => (h % 24 === 0 ? '자정' : h === 12 ? '정오' : h < 12 ? `오전 ${h}시` : `오후 ${h - 12}시`);
  return `${f(n.from)} ~ ${f(n.to)}`;
}

/** can the party go there right now? null = yes, otherwise the reason */
export function canEnter(s: GameState, z: ZoneDef, now = new Date()): string | null {
  if (!s.unlocked.includes(z.id)) return z.gate ? '봉인되어 있다.' : '아직 길이 열리지 않았다.';
  const h = z.gate?.need.find((n) => n.kind === 'hours');
  if (h && h.kind === 'hours' && !inHours(h, now)) return `${hoursText(h)}에만 길이 보인다.`;
  return null;
}

/** checklist for the map card; names of things never met stay "???" */
export function gateLines(s: GameState, z: ZoneDef, now = new Date()): { text: string; ok: boolean }[] {
  return (z.gate?.need ?? []).map((n) => {
    const ok = needMet(s, n, now);
    const seen = (mob: string) => !!s.book[mob];
    switch (n.kind) {
      case 'item': {
        const have = Math.min(n.qty, s.stacks[n.id] ?? 0);
        return { ok, text: `${ITEMS[n.id].name} ${have}/${n.qty}${n.consume ? ' — 바치면 사라진다' : ''}` };
      }
      case 'kills': return { ok, text: `${seen(n.mob) ? MONSTERS[n.mob].name : '???'} ${Math.min(n.n, s.book[n.mob]?.kills ?? 0)}/${n.n}마리 처치` };
      case 'boss': return { ok, text: `${seen(n.mob) ? MONSTERS[n.mob].name : '이름 모를 강적'} 처치` };
      case 'card': return { ok, text: `${seen(n.mob) ? MONSTERS[n.mob].name : '???'} 카드 발견` };
      case 'level': return { ok, text: `파티 최고 레벨 ${n.lv} 이상` };
      case 'job': return { ok, text: n.tier === 2 ? '2차 전직한 동료' : '전직한 동료' };
      case 'equip': return { ok, text: `${ITEMS[n.id].name}을(를) 몸에 지닌 동료` };
      case 'hours': return { ok, text: `${hoursText(n)}에만 열림` };
    }
  });
}

/** card awakening (ENDGAME.md §5): three of a card + zeny → one of the next star */
export function awakenCard(s: GameState, id: string): string | null {
  const next = nextStarId(id);
  if (!next) return '이미 최고 각성입니다.';
  if ((s.stacks[id] ?? 0) < 3) return '같은 카드가 3장 필요합니다.';
  const cost = awakenCost(id);
  if (s.zeny < cost) return `제니가 부족합니다. (${cost.toLocaleString()}z)`;
  s.zeny -= cost;
  removeStack(s, id, 3);
  s.stacks[next] = (s.stacks[next] ?? 0) + 1;
  return null;
}
