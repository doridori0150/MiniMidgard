// Headless balance sim: plays the idle loop with a simple "reasonable player" policy.
// usage: npm run sim -- [minutes=60] [party=swordsman,acolyte,mage] [seed=1]
import { World } from '../src/game/world.ts';
import { newGame, defaultLook, autoDistribute, learnSkill, jobChange, canJobChange, nextJobs, buy, addEquip, equip, newHero, equipAmmo, sellAllEtc } from '../src/game/state.ts';
import { ZONES } from '../src/game/data/zones.ts';
import { MONSTERS } from '../src/game/data/monsters.ts';
import { CLASSES } from '../src/game/data/classes.ts';
import { SKILLS } from '../src/game/data/skills.ts';
import type { ClassId, Hero, GameState } from '../src/game/types.ts';

const minutes = Number(process.argv[2] ?? 60);
const party = (process.argv[3] ?? 'swordsman,acolyte,mage').split(',') as ClassId[];
let seed = Number(process.argv[4] ?? 1);
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

function manage(s: GameState, w: World, wantCls: ClassId[]) {
  for (let i = 0; i < s.heroes.length; i++) {
    const h = s.heroes[i];
    autoDistribute(h);
    spendSkills(h);
    if (!canJobChange(h)) {
      const next = h.cls === 'novice' ? (wantCls[i] ?? 'swordsman') : nextJobs(h)[0];
      if (!next) continue;
      jobChange(s, h, next);
      for (const g of GEAR[h.cls] ?? []) {
        if (g.startsWith('am_')) { buy(s, g); equipAmmo(s, h, g); continue; }
        const inst = addEquip(s, g);
        equip(s, h, inst.uid);
      }
      w.syncParty();
    }
  }
  while (s.heroes.length < s.partySlots) {
    s.heroes.push(newHero(s, 'Ally' + s.heroes.length, defaultLook()));
    const h = s.heroes[s.heroes.length - 1];
    const k = addEquip(s, 'w_knife'); equip(s, h, k.uid);
    w.syncParty();
  }
  const minLv = Math.min(...s.heroes.map((h) => h.baseLv));
  const ready = w.bossReady();
  const z = ZONES.find((z) => z.id === s.zone)!;
  if (w.time < w.bossRetryAt) { /* recently wiped by a boss */ }
  else if (ready.mvp && minLv >= MONSTERS[z.mvp!].lv - 2) w.summonBoss('mvp');
  else if (ready.boss && minLv >= MONSTERS[z.boss!].lv - 3) w.summonBoss('boss');
  if ((s.stacks.u_red ?? 0) < 30 && s.zeny > 3000) buy(s, 'u_red', 30);
  if (s.zeny < 5000) sellAllEtc(s);
  // move up a zone when ready
  const best = [...ZONES].reverse().find((z) => z.id !== 'town' && s.unlocked.includes(z.id) && minLv >= z.lv[0] + 2);
  if (best && best.id !== s.zone) w.setZone(best.id);
}

const s = newGame('Hero', defaultLook());
const w = new World(s, rng);
w.fx = false;
const t0 = performance.now();
let lastKills = 0;
for (let min = 1; min <= minutes; min++) {
  for (let sec = 0; sec < 60; sec++) {
    w.advance(1000);
    if (sec % 10 === 0) manage(s, w, party);
  }
  if (min % 5 === 0 || min === minutes) {
    const kills = s.totals.kills - lastKills; lastKills = s.totals.kills;
    const heroes = s.heroes.map((h) => `${CLASSES[h.cls].name} ${h.baseLv}/${h.jobLv}`).join(', ');
    console.log(`${String(min).padStart(4)}m  ${s.zone.padEnd(7)} kills/5m ${String(kills).padStart(4)}  deaths ${s.totals.deaths}  zeny ${s.zeny}  cards ${s.totals.cards}  | ${heroes}`);
  }
}
console.log(`sim ${minutes}m in ${((performance.now() - t0) / 1000).toFixed(1)}s; equips ${s.equips.length}; boss kills`, Object.fromEntries(Object.entries(s.progress).map(([k, v]) => [k, `${v.bossKills}/${v.mvpKills}`])));
