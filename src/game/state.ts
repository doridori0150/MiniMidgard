import type { ClassId, EquipInst, EquipSlot, GameState, Hero, HeroRole, Look, StatKey, CostumeSlot, QuickSlot, Tactics, PartyOrders } from './types.ts';
import { STAT_KEYS, QUICK_SLOTS } from './types.ts';
import { CLASSES, FIRST_JOBS, SECOND_JOB_OF, SECOND_JOB_LV, lineage } from './data/classes.ts';
import { SKILLS, SLOT_COUNT, slotable, type SkillDef } from './data/skills.ts';
import { ITEMS } from './data/items.ts';
import { ZONES, openers, type ZoneDef, type GateNeed } from './data/zones.ts';
import { MONSTERS } from './data/monsters.ts';
import { buildOf } from './data/builds.ts'; // also registers the build identity items and their drops
import { awakenCost, nextStarId } from './data/cardstars.ts'; // also registers the ★2/★3 card forms
import { START_STAT_POINTS, statCost } from './exp.ts';
import { ARMOR_SAFE, WEAPON_SAFE, partyPerks, offhandOk } from './stats.ts';

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
    skillSlots: ['first_aid', ...Array(SLOT_COUNT - 1).fill(null)],
    equip: {},
    auto: { hpPotPct: 40, spPotPct: 0, healPct: 70 },
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
    skillsV: 2,
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
    // SKILLS_RO.md stage 1: classic RO trees (max levels, prerequisites, quest skills) and skill slots
    if ((s.skillsV ?? 1) < 2) {
      let refunded = 0;
      for (const h of allHeroes(s)) refunded += migrateSkills(h);
      s.skillsV = 2;
      s.notice = `스킬이 원작(클래식) 스킬 트리로 바뀌었습니다. ${refunded ? `바뀌거나 사라진 스킬의 포인트 ${refunded}점을 돌려드렸어요. ` : ''}자동 사냥은 이제 스킬 슬롯 6칸에 넣은 스킬만 씁니다 (캐릭터 → 스킬).`;
    }
    for (const h of allHeroes(s)) if (!Array.isArray(h.skillSlots)) { h.skillSlots = Array(SLOT_COUNT).fill(null); autoFillSlots(h); }
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

/** 화살 제작 (archer quest skill): etc items whittled into an elemental quiver */
export const ARROW_RECIPES: { from: string; n: number; to: string }[] = [
  { from: 'e_glowdust', n: 6, to: 'am_fire' },
  { from: 'e_wetjelly', n: 10, to: 'am_crystal' },
  { from: 'e_icecore', n: 3, to: 'am_crystal' },
  { from: 'e_pebble', n: 4, to: 'am_stone' },
  { from: 'e_rockskin', n: 4, to: 'am_stone' },
  { from: 'e_fluff', n: 12, to: 'am_wind' },
  { from: 'e_galecore', n: 2, to: 'am_wind' },
  { from: 'e_dew', n: 6, to: 'am_silver' },
];
export function craftArrow(s: GameState, h: Hero, i: number): string | null {
  const r = ARROW_RECIPES[i];
  if (!r) return '없는 제작법입니다.';
  if (!((h.skills.arrow_craft ?? 0) > 0)) return '화살 제작을 배우지 않았습니다.';
  if (!removeStack(s, r.from, r.n)) return `${ITEMS[r.from].name} ${r.n}개가 필요합니다.`;
  addItem(s, r.to, 1);
  return null;
}

/** 감정: free with an appraising merchant in the party, else one 돋보기 */
export function appraise(s: GameState, uid: number): string | null {
  const inst = s.equips.find((e) => e.uid === uid);
  if (!inst?.unid) return '감정할 것이 없습니다.';
  if (!partyPerks(s).appraise && !removeStack(s, 'k_lens')) return '돋보기가 없습니다 (도구 상점). 파티에 감정을 익힌 상인이 있으면 공짜입니다.';
  delete inst.unid;
  return null;
}

export function itemName(inst: EquipInst): string {
  const d = ITEMS[inst.id];
  const prefixes = inst.cards.filter(Boolean).map((c) => ITEMS[c!].prefix);
  const counts = new Map<string, number>();
  for (const p of prefixes) if (p) counts.set(p, (counts.get(p) ?? 0) + 1);
  const pre = [...counts].map(([p, n]) => (n > 1 ? ['', '', '더블 ', '트리플 ', '쿼드 '][n] + p : p)).join(' ');
  return `${inst.unid ? '(미감정) ' : ''}${inst.refine > 0 ? '+' + inst.refine + ' ' : ''}${pre ? pre + ' ' : ''}${d.name}${inst.slots > 0 ? ` [${inst.slots}]` : ''}`;
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
  if (inst.unid) return '감정하지 않은 장비입니다. (상인의 감정 · 돋보기)';
  const err = canEquip(h, inst.id);
  if (err) return err;
  const other = equippedBy(s, uid);
  if (other) unequipUid(s, other, uid);
  let slot: EquipSlot;
  if (d.loc === 'acc') slot = prefer === 'acc2' || (h.equip.acc1 !== undefined && h.equip.acc2 === undefined) ? 'acc2' : 'acc1';
  else if (d.loc === 'weapon' && prefer === 'shield' && offhandOk(h, d.wtype, d.twoHand)) slot = 'shield'; // 이도류: the left hand
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
  if (cur >= sk.maxLv) return false;
  if (sk.quest) return false; // quest skills: learnQuest
  if (h.skillPts <= 0) return false;
  if (!lineage(h.cls).includes(sk.cls) || sk.cls === 'novice' && h.cls !== 'novice') return false;
  return skillReqMet(h, id);
}

/** why a quest skill can't be taken right now (null = it can) */
export function questBlock(s: GameState, h: Hero, id: string): string | null {
  const sk = SKILLS[id];
  if (!sk?.quest) return '퀘스트 스킬이 아닙니다.';
  if ((h.skills[id] ?? 0) >= sk.maxLv) return '이미 배웠습니다.';
  if (!lineage(h.cls).includes(sk.cls) || sk.cls === 'novice' && h.cls !== 'novice') return '이 직업의 퀘스트가 아닙니다.';
  if (!skillReqMet(h, id)) return '선행 스킬이 필요합니다.';
  // the job level counts in the skill's own job; a later job has done it already
  if (h.cls === sk.cls && h.jobLv < sk.quest.job) return `직업 레벨 ${sk.quest.job} 필요 (지금 ${h.jobLv})`;
  if (s.zeny < sk.quest.zeny) return `퀘스트 비용 ${sk.quest.zeny.toLocaleString()}z가 모자랍니다.`;
  return null;
}

/** finish an RO quest skill: no skill point, the job level and a fee */
export function learnQuest(s: GameState, h: Hero, id: string): string | null {
  const err = questBlock(s, h, id);
  if (err) return err;
  s.zeny -= SKILLS[id].quest!.zeny;
  h.skills[id] = 1;
  fillSlot(h, id);
  return null;
}

export function learnSkill(h: Hero, id: string): boolean {
  if (!canLearn(h, id)) return false;
  h.skills[id] = (h.skills[id] ?? 0) + 1;
  h.skillPts--;
  if (h.skills[id] === 1) fillSlot(h, id);
  return true;
}

/** tools / QA: learn `id` up to `lv`, prerequisites first, while points last (quest skills are simply granted) */
export function learnPath(h: Hero, id: string, lv = SKILLS[id]?.maxLv ?? 1): boolean {
  const sk = SKILLS[id];
  if (!sk || !lineage(h.cls).includes(sk.cls) || (sk.cls === 'novice' && h.cls !== 'novice')) return false;
  for (const [r, rl] of Object.entries(sk.req ?? {})) if (!learnPath(h, r, rl)) return false;
  if (sk.quest) { if (!((h.skills[id] ?? 0) > 0)) { h.skills[id] = 1; fillSlot(h, id); } return true; }
  while ((h.skills[id] ?? 0) < Math.min(lv, sk.maxLv) && learnSkill(h, id)) { /* one level at a time */ }
  return (h.skills[id] ?? 0) >= Math.min(lv, sk.maxLv);
}

// ───────── 스킬 슬롯: the auto AI uses only the active skills in these 6 slots (left first = attack priority)
function slotsOf(h: Hero): (string | null)[] {
  if (!Array.isArray(h.skillSlots)) h.skillSlots = [];
  while (h.skillSlots.length < SLOT_COUNT) h.skillSlots.push(null);
  if (h.skillSlots.length > SLOT_COUNT) h.skillSlots.length = SLOT_COUNT;
  return h.skillSlots;
}
export function isSlotted(h: Hero, id: string): boolean { return slotsOf(h).includes(id); }
/** a freshly learned active skill takes the first empty slot */
export function fillSlot(h: Hero, id: string) {
  if (!slotable(SKILLS[id]) || isSlotted(h, id)) return;
  const sl = slotsOf(h);
  const i = sl.indexOf(null);
  if (i >= 0) sl[i] = id;
}
/** put a learned active skill in slot i (it leaves any other slot — the two swap), or clear slot i */
export function setSlot(h: Hero, i: number, id: string | null): string | null {
  const sl = slotsOf(h);
  if (i < 0 || i >= SLOT_COUNT) return '없는 슬롯입니다.';
  if (id !== null) {
    if (!slotable(SKILLS[id])) return '패시브는 슬롯 없이 늘 적용됩니다.';
    if (!((h.skills[id] ?? 0) > 0)) return '배우지 않은 스킬입니다.';
    const j = sl.indexOf(id);
    if (j >= 0) sl[j] = sl[i];
  }
  sl[i] = id;
  return null;
}
/** slot a skill into the first free slot, or take it out */
export function toggleSlot(h: Hero, id: string): string | null {
  const sl = slotsOf(h);
  const j = sl.indexOf(id);
  if (j >= 0) { sl[j] = null; return null; }
  const i = sl.indexOf(null);
  if (i < 0) return '슬롯 6칸이 모두 찼습니다. 슬롯을 눌러 비우거나 바꾸세요.';
  return setSlot(h, i, id);
}

/** how much the AI wants a skill in a slot: heals for healers, the strongest attacks, then buffs, control, utilities */
function slotScore(h: Hero, sk: SkillDef, lv: number): number {
  const role = heroRole(h);
  const base: Record<string, number> = {
    heal: role === 'healer' ? 90 : 55, revive: 80, attack: 60, aoe: 58, buff: 44, tank: role === 'tank' ? (sk.kind === 'stance' ? 36 : 70) : 18, cc: 30, support: 16, none: 0,
  };
  let v = (base[sk.auto] ?? 0) + CLASSES[sk.cls].tier * 6 + lv;
  // among attacks, the one that hits harder at its level first (a Lv 5 bolt over a splash of napalm beat)
  if (sk.auto === 'attack' || sk.auto === 'aoe') {
    const hits = sk.hits ? sk.hits(lv) : 1;
    v += Math.min(25, (sk.fixed ? 300 : sk.mult ? sk.mult(lv) : 100) * hits / 40);
  }
  if (sk.id === 'first_aid' && h.cls !== 'novice') v -= 60;
  if (sk.extra) v -= 2;
  return v;
}
/** refill all 6 slots best-first from the learned active skills (`prefer`: these first, e.g. a build's skills) */
export function autoFillSlots(h: Hero, prefer: string[] = [], only?: (id: string) => boolean) {
  // (first aid's 5 HP is only worth a slot for a novice)
  const learned = Object.entries(h.skills).filter(([id, lv]) => lv > 0 && slotable(SKILLS[id]) && (!only || only(id)) && (id !== 'first_aid' || h.cls === 'novice'));
  learned.sort((a, b) => {
    const pa = prefer.indexOf(a[0]), pb = prefer.indexOf(b[0]);
    if (pa >= 0 || pb >= 0) return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb);
    return slotScore(h, SKILLS[b[0]], b[1]) - slotScore(h, SKILLS[a[0]], a[1]);
  });
  const sl = slotsOf(h);
  for (let i = 0; i < SLOT_COUNT; i++) sl[i] = learned[i]?.[0] ?? null;
}

/** skills that used to cost points and are RO quest skills now: the points come back, the skill stays (Lv 1) */
export const QUEST_PAID_BEFORE = ['sand_attack', 'holy_light', 'cart_revolution'];

/**
 * Save migration to the classic trees (SKILLS_RO.md): unknown skills and levels over the new max are refunded, former
 * paid skills that are quest skills now are refunded and kept, and a skill whose RO prerequisites aren't met first tries
 * to buy them from the hero's points (so a build survives), else it is refunded. The old per-skill auto toggles become
 * the 6 slots, best first. Returns the points refunded.
 */
export function migrateSkills(h: Hero): number {
  let refund = 0;
  for (const [id, lv] of Object.entries(h.skills)) {
    const sk = SKILLS[id];
    if (!sk) { refund += lv; delete h.skills[id]; continue; }
    if (QUEST_PAID_BEFORE.includes(id) && lv > 0) { refund += lv; h.skills[id] = 1; continue; }
    if (lv > sk.maxLv) { refund += lv - sk.maxLv; h.skills[id] = sk.maxLv; }
  }
  h.skillPts += refund;
  // points needed to bring `id` up to `lv` with its own prerequisites (Infinity if this class can't)
  const cost = (id: string, lv: number, seen: Set<string>): number => {
    const sk = SKILLS[id];
    if ((h.skills[id] ?? 0) >= lv) return 0;
    if (!sk || seen.has(id) || !lineage(h.cls).includes(sk.cls) || sk.quest || (sk.cls === 'novice' && h.cls !== 'novice')) return Infinity;
    seen.add(id);
    let c = lv - (h.skills[id] ?? 0);
    for (const [r, rl] of Object.entries(sk.req ?? {})) c += cost(r, rl, seen);
    return c;
  };
  const buy = (id: string, lv: number) => {
    for (const [r, rl] of Object.entries(SKILLS[id].req ?? {})) buy(r, rl);
    const have = h.skills[id] ?? 0;
    if (have < lv) { h.skillPts -= lv - have; h.skills[id] = lv; }
  };
  for (let changed = true, guard = 0; changed && guard < 60; guard++) {
    changed = false;
    for (const id of Object.keys(h.skills)) {
      const lv = h.skills[id];
      if (!(lv > 0) || skillReqMet(h, id)) continue;
      const reqs = Object.entries(SKILLS[id].req ?? {});
      const need = reqs.reduce((a, [r, rl]) => a + cost(r, rl, new Set()), 0);
      if (need <= h.skillPts) for (const [r, rl] of reqs) buy(r, rl);
      else {
        const paid = SKILLS[id].quest ? 0 : lv; // quest skills cost no points
        h.skillPts += paid; refund += paid;
        delete h.skills[id];
      }
      changed = true;
    }
  }
  // the old auto on/off toggles → slots: the active skills that were on, best first
  const was = h.auto.skills ?? {};
  h.skillSlots = Array(SLOT_COUNT).fill(null);
  autoFillSlots(h, [], (id) => was[id] !== false);
  delete h.auto.skills;
  return refund;
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
  const pk = partyPerks(s);
  return Math.floor(base * (1 + pk.overcharge / 100) * (d.kind === 'equip' ? 1 + pk.vending / 100 : 1)) + refine * 50;
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
  return id.startsWith('r_') || id.startsWith('k_') || !!ITEMS[id]?.rarity || gateItems.has(id);
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
