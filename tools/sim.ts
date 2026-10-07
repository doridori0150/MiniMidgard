// Headless balance sim: plays the idle loop with a simple "reasonable player" policy.
// usage: npm run sim -- [minutes=60] [party=swordsman,acolyte,mage] [seed=1] [flags]
//   flags (comma separated): gear  = equip drops/shop upgrades, compound cards, safe-refine, buy better potions
//                            quiet = summary only, solo = never recruit party members
// Map choice (multi-map regions): go for unkilled field bosses that unlock something, try each new map once,
// then hunt the map with the best measured EXP/h (wipes penalised), spending ~30 of every 120 minutes on the
// best loot / ore / secret map. Sealed maps open through a local copy of the gate rules (sim clock starts 09:00).
import { World } from '../src/game/world.ts';
import { newGame, defaultLook, autoDistribute, learnSkill, jobChange, canJobChange, nextJobs, buy, addEquip, equip, newHero, equipAmmo, sellStack, canEquip, sellEquip, equippedBy, compound, cardFits, refine, refineInfo, removeStack } from '../src/game/state.ts';
import { ZONES, type ZoneDef, type GateNeed } from '../src/game/data/zones.ts';
import { MONSTERS, type MonsterDef } from '../src/game/data/monsters.ts';
import { CLASSES, SECOND_JOB_OF } from '../src/game/data/classes.ts';
import { SKILLS } from '../src/game/data/skills.ts';
import { ITEMS, SHOPS } from '../src/game/data/items.ts';
import { computeDerived, ARMOR_SAFE, WEAPON_SAFE } from '../src/game/stats.ts';
import { elementMod, sizeMod } from '../src/game/data/elements.ts';
import type { ClassId, Hero, GameState, EquipSlot, EquipInst } from '../src/game/types.ts';

const minutes = Number(process.argv[2] ?? 60);
const party = (process.argv[3] ?? 'swordsman,acolyte,mage').split(',') as ClassId[];
let seed = Number(process.argv[4] ?? 1);
const flags = new Set((process.argv[5] ?? '').split(',').filter(Boolean));
const GEARUP = flags.has('gear');
const QUIET = flags.has('quiet');
const SOLO = flags.has('solo');
const rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

const SKILL_PLAN: Partial<Record<ClassId, string[]>> = {
  novice: ['basic'],
  swordsman: ['bash', 'bash', 'bash', 'bash', 'bash', 'sword_mastery', 'sword_mastery', 'sword_mastery', 'provoke', 'magnum_break', 'hp_recovery'],
  mage: ['fire_bolt', 'cold_bolt', 'lightning_bolt', 'soul_strike', 'fire_bolt', 'cold_bolt', 'lightning_bolt', 'fire_ball', 'sp_recovery'],
  archer: ['owls_eye', 'owls_eye', 'owls_eye', 'double_strafe', 'double_strafe', 'double_strafe', 'double_strafe', 'double_strafe', 'vultures_eye', 'improve_conc', 'arrow_shower'],
  acolyte: ['heal', 'heal', 'heal', 'divine_protection', 'divine_protection', 'divine_protection', 'increase_agi', 'divine_protection', 'divine_protection', 'blessing', 'heal', 'angelus', 'holy_light', 'demon_bane'],
  thief: ['double_attack', 'improve_dodge', 'double_attack', 'improve_dodge', 'double_attack', 'envenom', 'steal'],
  merchant: ['discount', 'overcharge', 'mammonite', 'pushcart', 'mammonite', 'cart_revolution', 'overcharge'],
  knight: ['twohand_quicken', 'bowling_bash', 'bowling_bash', 'auto_counter', 'bowling_bash', 'twohand_quicken'],
  wizard: ['jupitel', 'jupitel', 'jupitel', 'storm_gust', 'spell_mastery', 'lord_vermilion', 'meteor', 'mystic_amp'],
  hunter: ['falcon_eyes', 'blitz_beat', 'blitz_beat', 'blitz_beat', 'steel_crow', 'beast_bane', 'ankle_snare', 'claymore_trap'],
  priest: ['kyrie', 'kyrie', 'impositio', 'magnificat', 'resurrection', 'magnus', 'gloria'],
  assassin: ['katar_mastery', 'katar_mastery', 'katar_mastery', 'katar_mastery', 'sonic_blow', 'enchant_poison', 'grimtooth', 'shadow_step'],
  blacksmith: ['adrenaline', 'over_thrust', 'weaponry_research', 'weapon_perfection', 'hammer_fall'],
};
const GEAR: Partial<Record<ClassId, string[]>> = {
  novice: [],
  swordsman: ['w_blade', 's_guard'],
  mage: ['w_wand'],
  archer: ['w_composite', 'am_arrow'],
  acolyte: ['w_mace', 's_guard'],
  thief: ['w_gauche', 's_guard'],
  merchant: ['w_battleaxe'],
  knight: ['w_bastard'],
  wizard: ['w_arcwand'],
  hunter: ['w_greatbow'],
  priest: ['w_smasher'],
  assassin: ['w_katar'],
  blacksmith: ['w_hammer'],
};

function spendSkills(h: Hero) {
  const plan = SKILL_PLAN[h.cls] ?? [];
  let guard = 0;
  while (h.skillPts > 0 && guard++ < 100) {
    let done = false;
    for (const id of plan) if (learnSkill(h, id)) { done = true; break; }
    if (!done) {
      // fall back: any learnable skill of the class
      const any = Object.values(SKILLS).find((s) => s.cls === h.cls && learnSkill(h, s.id));
      if (!any) break;
    }
  }
}

// ───────── gear policy (flag "gear"): a crude but class-aware power score
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
function zoneMix(): { m: MonsterDef; w: number }[] {
  const z = ZONES.find((z) => z.id === s.zone)!;
  return z.mobs.map((e) => ({ m: MONSTERS[e.id], w: e.w }));
}
const TANK = new Set<ClassId>(['swordsman', 'knight', 'novice']);
function power(st: GameState, h: Hero): number {
  const d = computeDerived(st, h);
  const mix = zoneMix();
  const wsum = mix.reduce((a, e) => a + e.w, 0) || 1;
  const magic = h.cls === 'mage' || h.cls === 'wizard';
  const healer = h.cls === 'acolyte' || h.cls === 'priest';
  let off = 0, ehpMul = 0;
  for (const { m, w } of mix) {
    const b = d.b;
    let dmg: number;
    if (magic) {
      dmg = (d.matkMin + d.matkMax) / 2 * (1 + (b.raceDmg?.[m.race] ?? 0) / 100) * (100 - Math.min(90, m.mdef)) / 100;
    } else {
      const base = d.statusAtk + d.watk * (b.ignoreSize ? 1 : sizeMod(d.wtype, m.size)) * 0.85 + d.ammoAtk + d.bonusAtk;
      const mult = (1 + (b.atkPct ?? 0) / 100) * (1 + (b.raceDmg?.[m.race] ?? 0) / 100) * (1 + (b.sizeDmg?.[m.size] ?? 0) / 100)
        * (1 + (b.eleDmg?.[m.element] ?? 0) / 100) * (d.ranged ? 1 + (b.rangedPct ?? 0) / 100 : 1) * elementMod(d.weaponElement, m.element);
      const hit = clamp(80 + d.hit - (m.lv + m.agi), 5, 95) / 100;
      const crit = clamp((d.crit - m.luk * 0.2) / 100, 0, 1);
      const norm = base * mult * (100 - m.def) / 100 + d.refineAtk;
      dmg = norm * hit * (1 - crit) + base * mult * 1.4 * (1 + (b.critDmgPct ?? 0) / 100) * crit;
      dmg *= 1000 / d.delay;
    }
    off += dmg * w / wsum;
    const mobHit = clamp(80 + m.lv + m.dex - d.flee, 5, 95) / 100;
    const el = m.atkElement ?? 'neutral';
    const taken = Math.max(0.05, mobHit * (1 - (d.pdodge / 100))) * (100 - d.def) / 100 * elementMod(el, d.armorElement)
      * (1 - (b.raceRes?.[m.race] ?? 0) / 100) * (1 - (b.eleRes?.[el] ?? 0) / 100) * (1 - (b.dmgReducePct ?? 0) / 100);
    ehpMul += Math.max(0.03, taken) * w / wsum;
  }
  if (magic) off *= 1 + Math.min(1, d.maxSp / 600) * 0.3;
  if (healer) off = off * 0.4 + (d.total.int + h.baseLv) * 6 * (1 + (d.b.healPct ?? 0) / 100);
  const ehp = (d.maxHp + d.total.vit * 4) / ehpMul;
  return off * Math.pow(ehp, TANK.has(h.cls) ? 0.6 : 0.35);
}

function occupySlots(h: Hero, inst: EquipInst, prefer?: EquipSlot): Partial<Record<EquipSlot, number>> {
  const d = ITEMS[inst.id];
  const eq = { ...h.equip };
  for (const k of Object.keys(eq) as EquipSlot[]) if (eq[k] === inst.uid) delete eq[k];
  const slot: EquipSlot = d.loc === 'acc' ? (prefer ?? 'acc1') : d.loc as EquipSlot;
  const occ: EquipSlot[] = [slot, ...((d.alsoHead ?? []) as EquipSlot[])];
  if (d.twoHand) occ.push('shield');
  for (const sl of occ) { const cur = eq[sl]; if (cur !== undefined) for (const k of Object.keys(eq) as EquipSlot[]) if (eq[k] === cur) delete eq[k]; }
  if (slot === 'shield' && eq.weapon !== undefined) {
    const w = s.equips.find((e) => e.uid === eq.weapon);
    if (w && ITEMS[w.id].twoHand) delete eq.weapon;
  }
  for (const sl of occ) eq[sl] = inst.uid;
  return eq;
}

function futureClasses(c: ClassId): ClassId[] {
  const out = [c, ...(SECOND_JOB_OF[c] ?? [])];
  if (c === 'novice') return ['novice', ...party, ...party.flatMap((p) => SECOND_JOB_OF[p] ?? [])];
  return out;
}

function gearUp(st: GameState, w: World) {
  let changed = false;
  for (const h of st.heroes) {
    let cur = power(st, h);
    for (let pass = 0; pass < 4; pass++) {
      let best: { uid: number; prefer?: EquipSlot; p: number } | null = null;
      for (const inst of st.equips) {
        if (equippedBy(st, inst.uid) || canEquip(h, inst.id)) continue;
        const d = ITEMS[inst.id];
        for (const prefer of d.loc === 'acc' ? (['acc1', 'acc2'] as EquipSlot[]) : [undefined]) {
          const p = power(st, { ...h, equip: occupySlots(h, inst, prefer) });
          if (p > cur * 1.01 && (!best || p > best.p)) best = { uid: inst.uid, prefer, p };
        }
      }
      if (!best) break;
      equip(st, h, best.uid, best.prefer);
      cur = best.p;
      changed = true;
    }
    // cards
    for (const [cid, n] of Object.entries(st.stacks)) {
      if (!cid.startsWith('c_') || n <= 0) continue;
      for (const uid of new Set(Object.values(h.equip))) {
        const inst = st.equips.find((e) => e.uid === uid)!;
        const free = inst.cards.indexOf(null);
        if (free < 0 || !cardFits(cid, inst)) continue;
        inst.cards[free] = cid;
        const p = power(st, h);
        inst.cards[free] = null;
        if (p > cur * 1.002) { compound(st, uid, cid); cur = p; changed = true; break; }
      }
    }
  }
  // sell what nobody can use now or later
  for (const inst of [...st.equips]) {
    if (equippedBy(st, inst.uid) || inst.cards.some(Boolean)) continue;
    const d = ITEMS[inst.id];
    const later = st.heroes.some((h) => futureClasses(h.cls).some((c) => !d.jobs || d.jobs.includes(c)) && (d.reqLv ?? 1) > h.baseLv);
    if (!later) { const z = sellEquip(st, inst.uid); earned.sell += z; }
  }
  if (changed) w.syncParty();
}

function shopUp(st: GameState, w: World) {
  const shopItems = [...SHOPS.weapon.items, ...SHOPS.armor.items];
  for (const h of st.heroes) {
    const cur = power(st, h);
    let best: { id: string; p: number; price: number } | null = null;
    for (const id of shopItems) {
      const d = ITEMS[id];
      if (d.kind !== 'equip' || canEquip(h, id) || d.price > st.zeny * 0.5) continue;
      const fake: EquipInst = { uid: -999, id, refine: 0, slots: d.slots ?? 0, cards: Array(d.slots ?? 0).fill(null) };
      st.equips.push(fake);
      const p = power(st, { ...h, equip: occupySlots(h, fake) });
      st.equips.pop();
      const gain = p / cur - 1;
      if (gain > 0.04 && (!best || p > best.p)) best = { id, p, price: d.price };
    }
    if (best && !buy(st, best.id)) {
      spent.shop += best.price;
      const inst = st.equips[st.equips.length - 1];
      bought.add(inst.uid);
      equip(st, h, inst.uid);
      w.syncParty();
    }
  }
  // safe refines
  for (const h of st.heroes) {
    for (const uid of new Set(Object.values(h.equip))) {
      const inst = st.equips.find((e) => e.uid === uid)!;
      for (let g = 0; g < 10; g++) {
        const info = refineInfo(inst);
        if (!info || info.max) break;
        const safe = ITEMS[inst.id].loc === 'weapon' ? WEAPON_SAFE[(ITEMS[inst.id].wlv ?? 1) - 1] : ARMOR_SAFE;
        if (inst.refine >= safe) break;
        if ((st.stacks[info.mat] ?? 0) < 1) {
          if (info.mat === 'r_phra' || info.mat === 'r_emver') { if (st.zeny > ITEMS[info.mat].price * 4) { buy(st, info.mat); spent.shop += ITEMS[info.mat].price; } else break; }
          else break;
        }
        if (st.zeny < info.fee * 3) break;
        spent.refine += info.fee;
        refine(st, uid, rng);
      }
    }
  }
}

function bestPotion(lv: number) { return lv < 22 ? 'u_red' : lv < 40 ? 'u_orange' : lv < 60 ? 'u_yellow' : 'u_white'; }

function manage(s: GameState, w: World, wantCls: ClassId[]) {
  for (let i = 0; i < s.heroes.length; i++) {
    const h = s.heroes[i];
    autoDistribute(h);
    spendSkills(h);
    if (!canJobChange(h)) {
      const next = h.cls === 'novice' ? (wantCls[i] ?? 'swordsman') : nextJobs(h)[0];
      if (!next) continue;
      jobChange(s, h, next);
      mile(`${h.name} → ${CLASSES[h.cls].name} (Lv ${h.baseLv})`);
      if (CLASSES[h.cls].tier === 2) secondJobAt.push(curMin);
      for (const g of GEAR[h.cls] ?? []) {
        if (g.startsWith('am_')) { buy(s, g); equipAmmo(s, h, g); continue; }
        const inst = addEquip(s, g);
        bought.add(inst.uid);
        equip(s, h, inst.uid);
      }
      w.syncParty();
    }
  }
  while (!SOLO && s.heroes.length < s.partySlots) {
    s.heroes.push(newHero(s, 'Ally' + s.heroes.length, defaultLook()));
    const h = s.heroes[s.heroes.length - 1];
    const k = addEquip(s, 'w_knife'); bought.add(k.uid); equip(s, h, k.uid);
    w.syncParty();
    mile(`party slot ${s.heroes.length}`);
  }
  const minLv = Math.min(...s.heroes.map((h) => h.baseLv));
  const ready = w.bossReady();
  const z = ZONES.find((z) => z.id === s.zone)!;
  const backedOff = (id?: string) => !!id && minLv < waitLv(id);
  if (w.time < w.bossRetryAt) { /* recently wiped by a boss */ }
  else if (ready.mvp && minLv >= MONSTERS[z.mvp!].lv - 2 && !backedOff(z.mvp)) w.summonBoss('mvp');
  else if (ready.boss && minLv >= MONSTERS[z.boss!].lv - 3 && !backedOff(z.boss)) w.summonBoss('boss');
  const pot = GEARUP ? bestPotion(minLv) : 'u_red';
  if (GEARUP && s.quick[0].id !== pot) s.quick[0] = { ...s.quick[0], id: pot };
  if ((s.stacks[pot] ?? 0) < 30 && s.zeny > 3000 + 30 * ITEMS[pot].price) { buy(s, pot, 30); spent.pots += 30 * ITEMS[pot].price; }
  if (s.zeny < 5000 || GEARUP) earned.etc += sellEtc(s);
  gateCheck();
  chooseZone(minLv);
}

// ───────── sealed / hidden maps: a local copy of the gate rules (state.ts owns the real ones)
const START_HOUR = 9;
const clockHour = () => (START_HOUR + Math.floor(curMin / 60)) % 24;
const discovered = new Set<string>();
const gateItems = new Set(ZONES.flatMap((z) => [z.gate?.clue, ...(z.gate?.need ?? []).map((n) => (n.kind === 'item' ? n.id : undefined))]).filter(Boolean) as string[]);
function inWindow(n: { from: number; to: number }) { const h = clockHour(); return n.from <= n.to ? h >= n.from && h < n.to : h >= n.from || h < n.to; }
function needOk(n: GateNeed): boolean {
  switch (n.kind) {
    case 'item': return (s.stacks[n.id] ?? 0) >= n.qty;
    case 'kills': return (s.book[n.mob]?.kills ?? 0) >= n.n;
    case 'boss': return (s.book[n.mob]?.kills ?? 0) > 0;
    case 'card': return !!s.book[n.mob]?.card;
    case 'level': return Math.max(...s.heroes.map((h) => h.baseLv)) >= n.lv;
    case 'job': return s.heroes.some((h) => CLASSES[h.cls].tier >= n.tier);
    case 'hours': return inWindow(n);
  }
}
function gateCheck() {
  for (const z of ZONES) {
    const g = z.gate;
    if (!g || s.unlocked.includes(z.id)) continue;
    const first = g.need.find((n) => n.kind !== 'hours');
    if (!discovered.has(z.id) && (!g.hidden || (g.clue && (s.stacks[g.clue] ?? 0) > 0) || (first && needOk(first)))) {
      discovered.add(z.id);
      if (g.hidden) mile(`discovered 「${z.name}」`);
    }
    if (discovered.has(z.id) && g.need.every((n) => n.kind === 'hours' || needOk(n))) {
      for (const n of g.need) if (n.kind === 'item' && n.consume) removeStack(s, n.id, n.qty);
      s.unlocked.push(z.id);
      mile(`opened 「${z.name}」`);
    }
  }
}
function canEnterNow(z: ZoneDef) {
  if (z.id === 'town' || !s.unlocked.includes(z.id)) return false;
  const h = z.gate?.need.find((n) => n.kind === 'hours');
  return !h || h.kind !== 'hours' || inWindow(h);
}
/** etc items are sold except ores and anything a gate asks for (mirrors state.ts isKeepItem, but boss trophies are sold) */
function sellEtc(st: GameState): number {
  let z = 0;
  for (const [id, n] of Object.entries(st.stacks)) if (ITEMS[id].kind === 'etc' && !id.startsWith('r_') && !gateItems.has(id)) z += sellStack(st, id, n);
  return z;
}

// ───────── map choice
const zoneScore: Record<string, number> = {}; // measured EXP/h (EMA over visits), wipes penalised
let visit = { zone: '', min: 0, exp: 0, deaths: 0 };
let nextPick = 0;
const bossFail: Record<string, number> = {}; // boss id → min party level at the last failed attempt
const bossFails: Record<string, number> = {}; // boss id → failed attempts
/** after n failed attempts wait 2n more levels before trying that boss again */
const waitLv = (id: string) => (bossFail[id] ?? -99) + 2 * (bossFails[id] ?? 1);
const wipeRate = (id: string) => { const z = zoneStat[id]; return z && z.min > 20 ? z.deaths / (z.min / 60) : 0; };
function closeVisit() {
  if (visit.zone && visit.min >= 9.5) {
    const v = visit.exp / (visit.min / 60) / (1 + 0.5 * visit.deaths / (visit.min / 60));
    zoneScore[visit.zone] = zoneScore[visit.zone] === undefined ? v : zoneScore[visit.zone] * 0.4 + v * 0.6;
  } else if (visit.zone && visit.deaths >= 2) {
    zoneScore[visit.zone] = Math.min(zoneScore[visit.zone] ?? 0, 0); // chased out by wipes: explored, and bad
  }
}
/** the boss / MVP the party came to this map for; two wipes on the way count as a failed attempt */
let goal: { mob: string; wipes: number } | null = null;
function goTo(id: string, why: string) {
  const g = /^(boss|mvp) (\w+)$/.exec(why)?.[2];
  if (g !== goal?.mob) goal = g ? { mob: g, wipes: 0 } : null;
  if (id === s.zone) return;
  closeVisit();
  visit = { zone: id, min: 0, exp: 0, deaths: 0 };
  w.setZone(id);
  if (!QUIET) console.log(`${String(curMin).padStart(5)}m  → ${id} (${why})`);
}
function chooseZone(minLv: number) {
  const cur = ZONES.find((z) => z.id === s.zone)!;
  if (visit.zone !== s.zone) { closeVisit(); visit = { zone: s.zone, min: 0, exp: 0, deaths: 0 }; } // the world retreated after wipes
  if (w.mobs.some((m) => m.m.boss && m.state !== 'dead') && canEnterNow(cur)) return; // finish the boss fight
  if (curMin < nextPick && canEnterNow(cur)) return;
  nextPick = curMin + 10;
  const open = ZONES.filter(canEnterNow);
  // 1. progression: an unkilled field boss that opens new maps, once strong enough
  const prog = open.filter((z) => z.boss && s.progress[z.id].bossKills === 0 && minLv >= Math.max(z.lv[0], MONSTERS[z.boss].lv - 3)
    && minLv >= waitLv(z.boss) && ZONES.some((n) => n.unlockBy === z.id && !s.unlocked.includes(n.id)))
    .sort((a, b) => MONSTERS[a.boss!].lv - MONSTERS[b.boss!].lv)[0];
  if (prog) return goTo(prog.id, 'boss ' + prog.boss);
  // 2. first MVP kill once comfortably over its level
  // (a solo hero only tries an MVP when far over its level, and nobody camps a map that keeps wiping them)
  const mvp = open.filter((z) => z.mvp && s.progress[z.id].mvpKills === 0 && minLv >= MONSTERS[z.mvp].lv + (SOLO ? 10 : 1) && minLv >= waitLv(z.mvp) && wipeRate(z.id) < 2)
    .sort((a, b) => MONSTERS[a.mvp!].lv - MONSTERS[b.mvp!].lv)[0];
  if (mvp) return goTo(mvp.id, 'mvp ' + mvp.mvp);
  // 3. try every map we can handle once, highest first (a map opened late is still worth a look)
  const fresh = open.filter((z) => minLv >= z.lv[0] + 2 && zoneScore[z.id] === undefined && !(visit.zone === z.id && visit.min < 9.5))
    .sort((a, b) => b.lv[0] - a.lv[0])[0];
  if (fresh) return goTo(fresh.id, 'explore');
  // any map we out-level is fair game when the at-level ones keep wiping us
  const pool = open.filter((z) => minLv >= z.lv[0] + 2 && zoneScore[z.id] !== undefined);
  if (!pool.length) return;
  if (visit.min < 9.5 && pool.some((z) => z.id === s.zone)) return;
  // 4. best measured map; ~30 of every 120 minutes on the best loot / ore / secret map
  //    (a loot map has to be worth at least half the best map — nobody farms a map that keeps wiping them)
  const score = (z: ZoneDef) => zoneScore[z.id] ?? 0;
  const ranked = pool.sort((a, b) => score(b) - score(a));
  const isLoot = (z: ZoneDef) => !!z.gate || (z.role ?? []).some((r) => r === 'loot' || r === 'ore');
  const loot = curMin % 120 < 30 ? ranked.find((z) => isLoot(z) && score(z) >= score(ranked[0]) * 0.5) : undefined;
  goTo((loot ?? ranked[0]).id, loot ? 'loot' : 'exp');
}

// ───────── run + report
const s = newGame('Hero', defaultLook());
const w = new World(s, rng);
w.fx = false;
const t0 = performance.now();
let curMin = 0;
const miles: string[] = [];
const secondJobAt: number[] = [];
const bought = new Set<number>();
const spent = { shop: 0, refine: 0, pots: 0 };
const earned = { etc: 0, sell: 0 };
const zoneStat: Record<string, { first: number; minLv: number; min: number; kills: number; deaths: number }> = {};
const cardsFound: Record<string, number> = {};
const equipFound: Record<string, number> = {};
const zenyAt: string[] = [];
const cardsByZone: Record<string, number> = {};
const potByZone: Record<string, number> = {};
const POTS = ['u_red', 'u_orange', 'u_yellow', 'u_white'];
const expByZone: Record<string, number> = {};
function mile(t: string) { miles.push(`${String(curMin).padStart(5)}m  ${t}`); }
const expSum = () => Object.entries(s.book).reduce((a, [id, b]) => a + b.kills * (MONSTERS[id]?.exp ?? 0), 0);
let lastExp = 0;

let lastKills = 0;
let prevCards: Record<string, number> = {};
let seenUid = Math.max(0, ...s.equips.map((e) => e.uid));
let lastDeaths = 0;
let bossUp = new Set<string>();
const every = minutes > 400 ? 60 : minutes > 120 ? 15 : 5;
for (let min = 1; min <= minutes; min++) {
  curMin = min;
  for (let sec = 0; sec < 60; sec++) {
    const zid = s.zone;
    const k0 = s.progress[zid].kills;
    const p0 = POTS.reduce((a, id) => a + (s.stacks[id] ?? 0) * ITEMS[id].price, 0);
    w.advance(1000);
    const p1 = POTS.reduce((a, id) => a + (s.stacks[id] ?? 0) * ITEMS[id].price, 0);
    if (p1 < p0) potByZone[zid] = (potByZone[zid] ?? 0) + p0 - p1;
    const zs = (zoneStat[zid] ??= { first: min, minLv: Math.min(...s.heroes.map((h) => h.baseLv)), min: 0, kills: 0, deaths: 0 });
    zs.kills += s.progress[zid].kills - k0;
    zs.min += 1 / 60;
    if (s.totals.deaths !== lastDeaths) {
      zs.deaths += s.totals.deaths - lastDeaths;
      if (visit.zone === zid) visit.deaths += s.totals.deaths - lastDeaths;
      lastDeaths = s.totals.deaths;
      const lv = Math.min(...s.heroes.map((h) => h.baseLv));
      const zd = ZONES.find((z) => z.id === zid)!;
      for (const id of [zd.boss, zd.mvp]) if (id && bossUp.has(id)) { bossFail[id] = lv; bossFails[id] = (bossFails[id] ?? 0) + 1; mile(`lost to ${id} (Lv ${lv})`); }
      const gl = goal as { mob: string; wipes: number } | null; // (assigned inside goTo)
      if (gl && (zd.boss === gl.mob || zd.mvp === gl.mob) && !bossUp.has(gl.mob) && ++gl.wipes >= 2) {
        bossFail[gl.mob] = lv; bossFails[gl.mob] = (bossFails[gl.mob] ?? 0) + 1; goal = null; nextPick = 0;
      }
    }
    bossUp = new Set(w.mobs.filter((m) => m.m.boss && m.state !== 'dead').map((m) => m.m.id));
    if (sec % 10 === 0) {
      // new cards / equips
      for (const [id, n] of Object.entries(s.stacks)) {
        if (!id.startsWith('c_')) continue;
        const d = n - (prevCards[id] ?? 0);
        if (d > 0) { cardsFound[id] = (cardsFound[id] ?? 0) + d; cardsByZone[zid] = (cardsByZone[zid] ?? 0) + d; }
      }
      const e = expSum();
      expByZone[zid] = (expByZone[zid] ?? 0) + e - lastExp;
      if (visit.zone === zid) { visit.exp += e - lastExp; visit.min += 1 / 6; }
      lastExp = e;
      for (const e of s.equips) if (e.uid > seenUid) { seenUid = Math.max(seenUid, e.uid); if (!bought.has(e.uid)) equipFound[e.id + (e.slots ? `[${e.slots}]` : '')] = (equipFound[e.id + (e.slots ? `[${e.slots}]` : '')] ?? 0) + 1; }
      manage(s, w, party);
      if (GEARUP && sec === 0) gearUp(s, w);
      if (GEARUP && sec === 30 && min % 5 === 0) shopUp(s, w);
      prevCards = Object.fromEntries(Object.entries(s.stacks).filter(([id]) => id.startsWith('c_')));
      for (const e of s.equips) seenUid = Math.max(seenUid, e.uid);
    }
  }
  if (min % 60 === 0) zenyAt.push(`${min / 60}h:${Math.round(s.zeny / 1000)}k`);
  if (!QUIET && (min % every === 0 || min === minutes)) {
    const kills = s.totals.kills - lastKills; lastKills = s.totals.kills;
    const heroes = s.heroes.map((h) => `${CLASSES[h.cls].name} ${h.baseLv}/${h.jobLv}`).join(', ');
    console.log(`${String(min).padStart(5)}m  ${s.zone.padEnd(9)} kills ${String(kills).padStart(5)}  deaths ${s.totals.deaths}  zeny ${s.zeny}  cards ${s.totals.cards}  | ${heroes}`);
  }
}
console.log(`\n== sim ${minutes}m party=${party.join(',')} seed=${process.argv[4] ?? 1}${GEARUP ? ' +gear' : ''} (${((performance.now() - t0) / 1000).toFixed(1)}s)`);
console.log(`final: ${s.heroes.map((h) => `${CLASSES[h.cls].name} ${h.baseLv}/${h.jobLv}`).join(', ')}  deaths ${s.totals.deaths}  zeny ${s.zeny}  cards ${s.totals.cards}`);
console.log(`2nd job at: ${secondJobAt.map((m) => (m / 60).toFixed(1) + 'h').join(', ') || '-'}`);
console.log('milestones:\n' + miles.join('\n'));
console.log('zones (first@min minLv | hours kills kph wipes | boss/mvp kills | exp/h cards pots-z/h):');
for (const z of ZONES) {
  const zs = zoneStat[z.id];
  if (!zs) continue;
  const p = s.progress[z.id];
  console.log(`  ${z.id.padEnd(12)} @${String(zs.first).padStart(5)}m Lv${String(zs.minLv).padStart(3)} | ${(zs.min / 60).toFixed(1).padStart(5)}h ${String(zs.kills).padStart(6)} ${String(Math.round(zs.kills / Math.max(0.01, zs.min / 60))).padStart(5)}/h ${String(zs.deaths).padStart(3)}d | ${p.bossKills}/${p.mvpKills} | ${String(Math.round((expByZone[z.id] ?? 0) / Math.max(0.01, zs.min / 60))).padStart(8)} ${String(cardsByZone[z.id] ?? 0).padStart(3)} ${String(Math.round((potByZone[z.id] ?? 0) / Math.max(0.01, zs.min / 60))).padStart(6)}`);
}
console.log(`zeny: ${zenyAt.join(' ')}  | etc sold ${earned.etc}, equips sold ${earned.sell}, shop ${spent.shop}, refine ${spent.refine}, pots ${spent.pots}`);
console.log('cards: ' + Object.entries(cardsFound).map(([k, v]) => `${k}${v > 1 ? '×' + v : ''}`).join(' '));
console.log('equip drops: ' + Object.entries(equipFound).map(([k, v]) => `${k}${v > 1 ? '×' + v : ''}`).join(' '));
if (GEARUP) {
  for (const h of s.heroes) {
    const eq = [...new Set(Object.values(h.equip))].map((uid) => { const e = s.equips.find((x) => x.uid === uid)!; return `${e.refine ? '+' + e.refine : ''}${e.id}${e.cards.length ? '[' + e.cards.map((c) => c ?? '_').join(',') + ']' : ''}`; });
    console.log(`  ${CLASSES[h.cls].name}: ${eq.join(' ')}`);
  }
}
