// Real-time hunt simulation for one zone. DOM-free: renderer and UI read `events`, `logs` and unit state.
import type { Element, GameState, Hero, HeroRole, Proc, StatusKind, Tactics, WeaponType } from './types.ts';
import { computeDerived, partyPerks, skillOn, type ActiveBuff, type Derived } from './stats.ts';
import { elementMod, sizeMod, ELEMENT_KO } from './data/elements.ts';
import { SKILLS, CELL, type SkillDef, type FixedCtx, type StatusKind as SkStatus } from './data/skills.ts';
import { MONSTERS, type MonsterDef, type MobSkill } from './data/monsters.ts';
import { ITEMS, CARD_SKILLS, SHOPS } from './data/items.ts';
import { zone as zoneDef, ZONES, openers, isExpedition, type ZoneDef, type DangerDef } from './data/zones.ts';
import { CLASSES, lineage } from './data/classes.ts';
import { expNext } from './exp.ts';
import { applyGrade, rollGrade, gradeOf, GRADE_KO, type Grade } from './gear.ts';
import { addItem, removeStack, sellStack, itemName, applyExp, quickTrigger, defaultTactics, heroRole, gateDiscoverable, gateReady, openGate, zoneKnown, inHours, isKeepItem, buy } from './state.ts';
import {
  AFFIXES, AFFIX_IDS, ESSENCE, MECHS, RIFT_MAX, RIFT_MS, clearAdvance, ensurePlan, essenceForClear, essenceForElite, firstClearReward,
  fmtClock, makeRiftGear, progressOf, recordParty, riftMods, riftMonster, riftSave, riftUnlocked, riftWeek, riftZone, ruleName,
  type EliteAffix, type GuardianMech, type LootSource, type RiftMods, type RiftRole,
} from './rift.ts';
import type { RiftPlan } from './types.ts';

export type DmgKind = 'normal' | 'crit' | 'taken' | 'heal' | 'sp' | 'miss' | 'lucky' | 'total' | 'zero' | 'absorb';

export type FxEvent =
  | { t: 'dmg'; uid: number; n: number; kind: DmgKind; i?: number }
  | { t: 'hit'; uid: number; style: 'slash' | 'blunt' | 'pierce' | 'magic' | 'claw'; element: Element; crit?: boolean }
  | { t: 'skill'; fx: string; from: number; to?: number; x: number; y: number; lv: number; radius?: number; hits?: number; element?: Element }
  | { t: 'cast'; uid: number; dur: number; element: Element; name: string }
  | { t: 'castEnd'; uid: number }
  | { t: 'shot'; from: number; to: number; kind: 'arrow' | 'bone' | 'shadow' | 'falcon'; dur: number; element: Element }
  | { t: 'drop'; gid: number }
  | { t: 'pickup'; gid: number; to: number; id: string; name: string; zeny: number }
  | { t: 'levelup'; uid: number; job: boolean }
  | { t: 'die'; uid: number }
  | { t: 'spawn'; uid: number }
  | { t: 'announce'; text: string; kind: 'boss' | 'mvp' | 'card' | 'info' | 'wipe' | 'unlock' | 'danger' | 'rift' }
  | { t: 'sound'; key: string }
  | { t: 'telegraph'; x: number; y: number; r: number; dur: number; color: string }
  | { t: 'shake'; power: number }
  | { t: 'buff'; uid: number; name: string }
  | { t: 'status'; uid: number; text: string; color: string }
  | { t: 'heal'; uid: number };

export interface LogLine { id: number; text: string; color: string; t: number }

type UnitState = 'idle' | 'ready' | 'walk' | 'attack' | 'cast' | 'sit' | 'dead' | 'hurt' | 'spawn';

export type PartyRole = HeroRole;
export type Position = 'front' | 'mid' | 'back';
/** how far (px) from the leader a follower may chase, per tactics.chase */
const CHASE_R = { tight: 170, normal: 270, free: Infinity } as const;

export interface CastInfo { sk: SkillDef; lv: number; target: number | null; x: number; y: number; start: number; end: number }

export interface HeroUnit {
  kind: 'hero';
  uid: number;
  hero: Hero;
  x: number; y: number;
  facing: 1 | -1;
  hp: number; sp: number;
  d: Derived;
  dAt: number;
  state: UnitState;
  stateT: number;
  lockUntil: number;
  atkReady: number;
  target: number | null;
  cast: CastInfo | null;
  buffs: ActiveBuff[];
  cds: Record<string, number>;
  deadUntil: number;
  hpTickAt: number;
  spTickAt: number;
  potAt: number;
  poisonUntil: number;
  poisonNext: number;
  hurtAt: number;
  sitting: boolean;
  /** next target re-evaluation */
  thinkAt: number;
  /** stepping away from a melee mob (back line) until / not again before */
  kiteUntil: number;
  /** a melee damage dealer that dropped low steps behind the tank until it's patched up */
  backOff: boolean;
  /** what this hero decided to do this tick and why, in words (set at each decision point; shown in the UI) */
  doing: string;
  kiteNext: number;
  /** 반격 stance until (auto counter) */
  counterUntil: number;
  /** 해독 지연: poison doesn't bite until then */
  slowPoisonUntil: number;
  /** next SP drain while hidden (hiding / cloaking) */
  hideDrainAt: number;
  /** poison react: envenom counters left */
  prCounters: number;
  /** throttle for out-of-fight utilities (aqua benedicta, find stone, teleport) */
  utilAt: number;
  // ── build signature skills (SKILLS_META.md)
  /** 질풍 보법: dodged — the next non-critical blow is stronger until then */
  gale: number;
  /** 맨주먹 연타: bare-handed swings at double speed until then */
  flurryUntil: number;
  /** 원소 공명: the element of the last attack spell and the resonance (0–3) */
  lastEl: Element | null;
  reso: number;
  /** 성역의 오라: next SP drain */
  auraAt: number;
}

/** a placed skill effect on the field (fire wall, sanctuary, traps…): world state, drawn by the renderer every frame */
export interface GroundFx {
  id: number;
  sk: SkillDef;
  lv: number;
  owner: number;
  x: number; y: number;
  /** radius (circle) or half-length (line) */
  r: number;
  /** line: unit direction along the wall */
  ax: number; ay: number;
  line: boolean;
  born: number;
  until: number;
  next: number;
  every: number;
  charges: number;
  /** per-monster hit counts (storm gust) */
  hits: Record<number, number>;
  /** a trap: armed from then on; done = went off */
  armAt: number;
  done: boolean;
  /** talkie box text */
  text?: string;
}

export interface MobUnit {
  kind: 'mob';
  uid: number;
  m: MonsterDef;
  x: number; y: number;
  facing: 1 | -1;
  hp: number; maxHp: number;
  state: UnitState;
  stateT: number;
  lockUntil: number;
  atkReady: number;
  target: number | null;
  home: { x: number; y: number };
  dest: { x: number; y: number } | null;
  wanderAt: number;
  frozenUntil: number;
  stunUntil: number;
  poisonUntil: number; poisonNext: number; poisonDmg: number;
  blindUntil: number;
  provokeUntil: number; provokeBy: number; provokeDef: number; provokeAtk: number;
  stolen: boolean;
  skillCd: number[];
  summoned: boolean;
  deadAt: number;
  hurtAt: number;
  dmgBy: Record<number, number>;
  charge: { tx: number; ty: number; until: number; target: number; mult: number } | null;
  /** M10: a roaming danger monster — how long it roams before leaving, and the hours it is awake (null = ordinary mob) */
  danger: { stay: number; hours?: { from: number; to: number }; def?: DangerDef } | null;
  bornAt: number;
  /** last time a hero did real damage to it (danger monsters leave or lose interest when nobody fights them) */
  dmgAt: number;
  /** when it locked on to its current target */
  chaseSince: number;
  /** a danger monster that gave up a chase ignores the party until then */
  boredUntil: number;
  /** left the map (fades out instead of collapsing; no rewards) */
  vanish: boolean;
  /** 균열: an elite pack member (its affix; the leader is the big one) */
  elite: { affix: EliteAffix; leader: boolean } | null;
  /** 균열: share of the progress bar this kill fills (%) */
  prog: number;
  // ── RO skill statuses (SKILLS_RO.md)
  stoneUntil: number; sleepUntil: number; silenceUntil: number; snareUntil: number;
  /** 속도 감소: AGI −n and −25% speed until */
  agiDown: number; agiDownUntil: number;
  /** 늪: −% AGI/DEX and −50% speed while standing in it */
  quag: number; quagUntil: number;
  /** 성호: DEF −% until death */
  crucis: number;
  /** 영원의 율법: the next damage doubles; lexUntil = the hits of one skill all double */
  lex: boolean; lexUntil: number;
  /** freeze / stone survive damage until then (the rest of the skill that froze or hit it) */
  breakHold: number;
  /** a hiding monster: unseen until then; next hide not before */
  hiddenUntil: number; hideNext: number;
  /** 맹독 누적 (SKILLS_META.md): poison layers, each one bites harder */
  poisonStacks: number;
}

/** a rift run in progress (rift.ts): the clock, the progress bar, the guardian and its mechanic */
export interface RiftRun {
  plan: RiftPlan;
  zone: ZoneDef;
  mods: RiftMods;
  /** the hunting map the party came from: offline time (the game closed mid-run) goes there */
  back: string;
  start: number;
  end: number;
  progress: number;
  phase: 'run' | 'guardian' | 'done' | 'fail';
  guardian: number | null;
  /** world time the run ended (the rift closes a few seconds later) */
  endedAt: number;
  eliteAt: number;
  kills: number;
  elites: number;
  essence: number;
  loot: string[];
  /** guardian mechanic state */
  burstAt: number;
  enraged: boolean;
  barrier: { until: number; adds: number[] } | null;
  barrierSteps: number[];
  toxicAt: number;
  result?: { ok: boolean; adv: number; ms: number; first: boolean; record: boolean; why: string };
}

/** M10: a treasure chest lying on an expedition map; the party walks over and opens it */
export interface FieldChest {
  id: number;
  x: number; y: number;
  born: number;
  /** being opened: the lid rattles until then (0 = closed) */
  openAt: number;
  openBy: number;
  /** opened as a real chest at this time (it lingers open for a moment, then goes) */
  opened: number;
}

export interface GroundItem {
  gid: number;
  id: string;
  slots?: number;
  x: number; y: number;
  fromX: number; fromY: number;
  born: number;
  pickAt: number;
  rarity: string;
  picked: boolean;
  /** already credited to the save when it dropped; the pickup is presentation only */
  got: { name: string; zeny: number };
}

export type Unit = HeroUnit | MobUnit;

const STEP = 50;
/** when a swing / melee skill / bow release lands, in ms after the action starts (poses are timed to these) */
export const MELEE_CONTACT = 140;
/** heroes are drawn facing left or right only (the Dungeon & Fighter rule), so they line up beside targets: vertical part of a stand-off line kept */
const SIDE_BIAS = 0.35;
export const SKILL_CONTACT = 130;
export const BOW_RELEASE = 120;
const HP_TICK = 3000;
const SP_TICK = 4000;
const REVIVE_MS = 15000;
const CORPSE_MS = 1100;
const SPAWN_MS = 600;
// M10 danger monsters: how close one may come before the party runs (200, then keep running until 300 away), how long
// it chases without being fought before it loses interest, and how long it then ignores the party
const RUN_NEAR = 200, RUN_CLEAR = 300, CHASE_MS = 9000, BORED_MS = 12000;
/** the bolts 고속 영창 speeds up (SKILLS_META.md) */
const QUICK_BOLTS = new Set(['fire_bolt', 'cold_bolt', 'lightning_bolt']);


function clamp(v: number, a: number, b: number) { return v < a ? a : v > b ? b : v; }
/** the unit if it is a monster */
function tm0(u: Unit | undefined): MobUnit | undefined { return u?.kind === 'mob' ? u : undefined; }
function dist(a: { x: number; y: number }, b: { x: number; y: number }) { return Math.hypot(a.x - b.x, a.y - b.y); }

export class World {
  s: GameState;
  zone: ZoneDef;
  time = 0;
  heroes: HeroUnit[] = [];
  mobs: MobUnit[] = [];
  ground: GroundItem[] = [];
  events: FxEvent[] = [];
  logs: LogLine[] = [];
  fx = true;
  rng: () => number;
  version = 0;
  wipeUntil = 0;
  focus: number | null = null;
  private uidSeq = 1;
  private gidSeq = 1;
  private logSeq = 1;
  private spawnAt = 0;
  private acc = 0;
  private timers: { at: number; fn: () => void }[] = [];
  /** called when something persistent changed (level, item, zeny) */
  onPersist: () => void = () => {};
  /** UI notices like job-change ready */
  notices: { kind: string; heroId: number; text: string }[] = [];
  /** the world moved the party by itself (e.g. a night-only path faded at dawn) */
  onTravel: (id: string) => void = () => {};
  private gateAt = 0;
  /** wall clock for time-of-day paths (tools/sim.ts swaps in its simulated clock) */
  clock: () => Date = () => new Date();
  /** when a night-only path closes under the party's feet */
  private fadeAt = 0;
  /** M10 expedition maps: chests on the field, when the next danger monster / chest may appear, the party's run */
  chests: FieldChest[] = [];
  private dangerAt = Infinity;
  private chestAt = Infinity;
  /** 피하기: the leader runs for this spot, away from danger monster `from`; everyone follows */
  run: { from: number; x: number; y: number; until: number; at: number } | null = null;
  /** counters for tools (expedition-check) */
  dangerStats = { spawns: 0, kills: 0, left: 0, traps: 0, chests: 0, evadeMs: 0, runs: 0 };
  /** 균열: the run in progress (null = an ordinary map) */
  rift: RiftRun | null = null;
  /** a rift run just ended (tools listen; the UI reads world.rift.result) */
  onRiftEnd: (r: RiftRun) => void = () => {};
  /** placed skill effects (fire wall, safety wall, sanctuary, traps, quagmire, ice wall, storm gust, magnus…) */
  grounds: GroundFx[] = [];
  private gfxSeq = 1;
  /** party teleport / warp throttle */
  private teleAt = 0;
  private warpAt = 0;

  constructor(s: GameState, rng: () => number = Math.random) {
    this.s = s;
    this.rng = rng;
    this.zone = zoneDef(s.zone);
    this.syncParty();
    this.armExpedition();
  }

  // ───────────────────────────── setup
  syncParty() {
    const keep = new Map(this.heroes.map((h) => [h.hero.id, h]));
    const sx = this.zone.w * 0.5, sy = this.zone.h * 0.55;
    this.heroes = this.s.heroes.map((hero, i) => {
      const old = keep.get(hero.id);
      if (old) { old.hero = hero; this.refresh(old); return old; }
      const d = computeDerived(this.s, hero);
      return {
        kind: 'hero', uid: this.uidSeq++, hero, x: sx - i * 26, y: sy + (i % 2 ? 22 : -10), facing: 1,
        hp: d.maxHp, sp: d.maxSp, d, dAt: 0, state: 'idle', stateT: 0, lockUntil: 0, atkReady: 0,
        target: null, cast: null, buffs: [], cds: {}, deadUntil: 0, hpTickAt: HP_TICK, spTickAt: SP_TICK, potAt: 0,
        poisonUntil: 0, poisonNext: 0, hurtAt: -9999, sitting: false, thinkAt: 0, kiteUntil: 0, kiteNext: 0, backOff: false, doing: '',
        counterUntil: 0, slowPoisonUntil: 0, hideDrainAt: 0, prCounters: 0, utilAt: 0,
        gale: 0, flurryUntil: 0, lastEl: null, reso: 0, auraAt: 0,
      } satisfies HeroUnit;
    });
  }

  refresh(h: HeroUnit) {
    h.buffs = h.buffs.filter((b) => b.until > this.time);
    h.d = computeDerived(this.s, h.hero, h.buffs, this.time);
    h.dAt = this.time;
    h.hp = Math.min(h.hp, h.d.maxHp);
    h.sp = Math.min(h.sp, h.d.maxSp);
  }

  setZone(id: string) {
    // travelling anywhere while a rift is open walks out of it (the run is given up)
    if (this.rift) { this.rift = null; this.wipeUntil = 0; this.log('균열을 떠났습니다.', '#d0a0ff'); }
    this.s.zone = id;
    this.zone = zoneDef(id);
    if (id !== 'town') this.s.lastHunt = id;
    this.mobs = [];
    this.ground = [];
    this.grounds = [];
    this.timers = [];
    this.focus = null;
    const sx = this.zone.w * 0.5, sy = this.zone.h * 0.55;
    this.heroes.forEach((h, i) => {
      h.x = sx - i * 26; h.y = sy + (i % 2 ? 22 : -10);
      h.target = null; h.cast = null; h.state = h.state === 'dead' ? 'dead' : 'idle'; h.sitting = false; h.counterUntil = 0;
    });
    this.spawnAt = this.time + 400;
    this.armExpedition();
    if (this.s.rate.zone !== id) this.s.rate = { zone: id, kills: 0, ms: 0, exp: 0, jexp: 0, zeny: 0, deaths: 0 };
    this.log(`${this.zone.name}에 도착했습니다.`, '#9fe0ff');
    this.version++;
  }

  log(text: string, color = '#e8e4d8') {
    this.logs.push({ id: this.logSeq++, text, color, t: this.time });
    if (this.logs.length > 80) this.logs.splice(0, this.logs.length - 80);
  }

  emit(e: FxEvent) { if (this.fx) this.events.push(e); }
  sound(key: string) { if (this.fx) this.events.push({ t: 'sound', key }); }
  after(ms: number, fn: () => void) { this.timers.push({ at: this.time + ms, fn }); }

  unit(uid: number | null): Unit | undefined {
    if (uid === null) return undefined;
    return this.heroes.find((h) => h.uid === uid) ?? this.mobs.find((m) => m.uid === uid);
  }
  mob(uid: number | null): MobUnit | undefined {
    if (uid === null) return undefined;
    return this.mobs.find((m) => m.uid === uid);
  }
  heroUnit(uid: number | null): HeroUnit | undefined {
    if (uid === null) return undefined;
    return this.heroes.find((h) => h.uid === uid);
  }
  alive(u: Unit | undefined): boolean { return !!u && u.state !== 'dead' && u.state !== 'spawn' && u.hp > 0; }
  aliveHeroes() { return this.heroes.filter((h) => h.state !== 'dead'); }
  leader(): HeroUnit | undefined { return this.aliveHeroes()[0]; }
  center() {
    const a = this.aliveHeroes();
    const list = a.length ? a : this.heroes;
    let x = 0, y = 0;
    for (const h of list) { x += h.x; y += h.y; }
    return { x: x / list.length, y: y / list.length };
  }

  // ───────────────────────────── main loop
  /** sim time plus the not-yet-stepped remainder: smooth 60 fps animation clocks */
  get renderTime() { return this.time + this.acc; }

  advance(ms: number) {
    this.acc += Math.min(ms, 5000);
    while (this.acc >= STEP) {
      this.step(STEP);
      this.acc -= STEP;
    }
  }

  step(dt: number) {
    this.time += dt;
    // the hunt rate (offline rewards) belongs to the hunting map, never to the rift
    if (this.zone.id !== 'town' && !this.rift) {
      this.s.rate.ms += dt;
      if (this.s.rate.ms > 30 * 60 * 1000) {
        const r = this.s.rate;
        r.ms /= 2; r.kills /= 2; r.exp /= 2; r.jexp /= 2; r.deaths /= 2;
      }
    }
    this.s.totals.playMs += dt;
    // timers
    if (this.timers.length) {
      const due = this.timers.filter((t) => t.at <= this.time);
      if (due.length) {
        this.timers = this.timers.filter((t) => t.at > this.time);
        for (const t of due) t.fn();
      }
    }
    if (this.rift) this.riftTick(dt);
    if (this.wipeUntil) {
      if (this.time >= this.wipeUntil) this.recoverWipe();
      return;
    }
    this.gateTick();
    this.spawnTick();
    this.expeditionTick();
    this.autoItems();
    this.partyScan();
    if (this.run) this.dangerStats.evadeMs += dt;
    for (const h of this.heroes) this.heroTick(h, dt);
    for (const m of this.mobs) this.mobTick(m, dt);
    this.separate();
    this.fxTick();
    this.groundTick();
    // bosses get a longer collapse so their fall can be read
    this.mobs = this.mobs.filter((m) => !(m.state === 'dead' && this.time - m.deadAt > (m.m.boss ? 1800 : CORPSE_MS)));
  }

  // ───────────────────────────── sealed & hidden maps
  /** every few seconds: rumours of hidden maps, seals that can open, night paths that fade */
  private gateTick() {
    if (this.time < this.gateAt) return;
    this.gateAt = this.time + 3000;
    const s = this.s;
    for (const z of ZONES) {
      const g = z.gate;
      if (!g || s.unlocked.includes(z.id)) continue;
      if (!zoneKnown(s, z)) {
        if (!gateDiscoverable(s, z)) continue;
        (s.discovered ??= []).push(z.id);
        this.emit({ t: 'announce', text: '어딘가에 숨겨진 길이 있다는 소문…', kind: 'unlock' });
        this.log(`[소문] ${g.hint}`, '#d8b8ff');
        this.sound('joblevel');
        this.onPersist();
      }
      if (!gateReady(s, z)) continue;
      if (g.need.some((n) => n.kind === 'item' && n.consume)) {
        // offerings are made by hand on the world map, once
        if (!s.tutorial['gate:' + z.id]) {
          s.tutorial['gate:' + z.id] = true;
          this.emit({ t: 'announce', text: `「${z.name}」의 봉인을 풀 수 있다`, kind: 'unlock' });
          this.log(`「${z.name}」: 바칠 것이 모두 모였다. 월드 맵에서 봉인을 풀 수 있다.`, '#d8b8ff');
          this.onPersist();
        }
        continue;
      }
      openGate(s, z);
      this.emit({ t: 'announce', text: `「${z.name}」의 길이 열렸다!`, kind: 'unlock' });
      this.log(g.openText ?? `숨겨진 장소 「${z.name}」로 가는 길이 열렸다.`, '#d8b8ff');
      this.sound('levelup');
      this.onPersist();
    }
    // a night-only path fades at dawn: leave once the fight is over
    const hz = this.zone.gate?.need.find((n) => n.kind === 'hours');
    if (!hz || hz.kind !== 'hours' || inHours(hz, this.clock())) { this.fadeAt = 0; return; }
    if (!this.fadeAt) {
      this.fadeAt = this.time + 20000;
      this.log(`주위가 밝아온다. 「${this.zone.name}」의 길이 흐려지기 시작했다…`, '#d8b8ff');
    }
    if (!this.pc.engaged.length || this.time >= this.fadeAt) {
      this.fadeAt = 0;
      const back = this.zone.unlockBy && s.unlocked.includes(this.zone.unlockBy) ? this.zone.unlockBy : 'town';
      this.log(`날이 바뀌자 「${this.zone.name}」로 이어진 길이 흐려졌다…`, '#d8b8ff');
      this.setZone(back);
      this.onTravel(back);
      this.onPersist();
    }
  }

  // ───────────────────────────── spawning
  private spawnTick() {
    const z = this.zone;
    if (this.rift) { this.riftSpawnTick(); return; }
    if (!z.mobs.length) return;
    const normal = this.mobs.filter((m) => !m.summoned && !m.m.boss && !m.danger && m.state !== 'dead').length;
    if (normal < z.maxMobs && this.time >= this.spawnAt) {
      this.spawnAt = this.time + 900 + this.rng() * 1400;
      // per-type quotas keep the mix stable even when the party skips some monsters
      const total = z.mobs.reduce((a, b) => a + b.w, 0);
      const open = z.mobs.filter((e) => {
        const quota = Math.max(1, Math.round(z.maxMobs * e.w / total));
        return this.mobs.filter((m) => m.m.id === e.id && !m.summoned && m.state !== 'dead').length < quota;
      });
      const pool = open.length ? open : z.mobs;
      const ptotal = pool.reduce((a, b) => a + b.w, 0);
      let r = this.rng() * ptotal;
      let pick = pool[0].id;
      for (const e of pool) { r -= e.w; if (r <= 0) { pick = e.id; break; } }
      this.spawnMob(pick, false);
    }
    if (this.s.settings.autoBoss && this.time >= this.bossRetryAt) {
      const r = this.bossReady();
      if (r.mvp) this.summonBoss('mvp');
      else if (r.boss) this.summonBoss('boss');
    }
  }

  /** which bosses can be summoned right now */
  bossReady(): { boss: boolean; mvp: boolean } {
    const z = this.zone;
    const prog = this.s.progress[z.id];
    const free = !this.wipeUntil && !this.mobs.some((m) => m.m.boss && m.state !== 'dead');
    return {
      boss: free && !!z.boss && prog.bossGauge >= z.bossGauge,
      mvp: free && !!z.mvp && prog.mvpGauge >= z.mvpGauge,
    };
  }

  summonBoss(kind: 'boss' | 'mvp'): boolean {
    const z = this.zone;
    const r = this.bossReady();
    const prog = this.s.progress[z.id];
    if (kind === 'mvp' && r.mvp) { prog.mvpGauge = 0; this.spawnBoss(z.mvp!); return true; }
    if (kind === 'boss' && r.boss) { prog.bossGauge = 0; this.spawnBoss(z.boss!); return true; }
    return false;
  }

  private spawnBoss(id: string) {
    const m = MONSTERS[id];
    const c = this.center();
    const ang = this.rng() * Math.PI * 2;
    const u = this.spawnMob(id, false, c.x + Math.cos(ang) * 200, c.y + Math.sin(ang) * 140);
    u.target = this.leader()?.uid ?? null;
    if (m.boss === 'mvp') {
      this.emit({ t: 'announce', text: `MVP 「${m.name}」 출현!`, kind: 'mvp' });
      this.log(`[MVP] ${m.name}이(가) 나타났습니다!`, '#ffcc4a');
    } else {
      this.emit({ t: 'announce', text: `필드 보스 「${m.name}」 출현!`, kind: 'boss' });
      this.log(`[보스] ${m.name}이(가) 나타났습니다!`, '#ff9a6a');
    }
    this.sound('boss');
    this.emit({ t: 'shake', power: 6 });
  }

  /** `def`: a per-unit copy (the rift's scaled monsters); inside a rift, summons are scaled as the guardian's adds */
  spawnMob(id: string, summoned: boolean, x?: number, y?: number, def?: MonsterDef): MobUnit {
    const m = def ?? (this.rift && summoned ? riftMonster(MONSTERS[id], this.rift.plan, 'add') : MONSTERS[id]);
    const z = this.zone;
    let px = x ?? 0, py = y ?? 0;
    if (x === undefined) {
      const c = this.center();
      for (let i = 0; i < 12; i++) {
        px = 50 + this.rng() * (z.w - 100);
        py = 90 + this.rng() * (z.h - 140);
        if (Math.hypot(px - c.x, py - c.y) > 170) break;
      }
    }
    px = clamp(px, 40, z.w - 40);
    py = clamp(py, 80, z.h - 40);
    const u: MobUnit = {
      kind: 'mob', uid: this.uidSeq++, m, x: px, y: py, facing: this.rng() < 0.5 ? 1 : -1,
      hp: m.hp, maxHp: m.hp, state: 'spawn', stateT: this.time, lockUntil: this.time + SPAWN_MS, atkReady: 0,
      target: null, home: { x: px, y: py }, dest: null, wanderAt: this.time + 800 + this.rng() * 2000,
      frozenUntil: 0, stunUntil: 0, poisonUntil: 0, poisonNext: 0, poisonDmg: 0, blindUntil: 0,
      provokeUntil: 0, provokeBy: 0, provokeDef: 0, provokeAtk: 0, stolen: false,
      skillCd: (m.skills ?? []).map((sk) => this.time + sk.cd * (0.4 + this.rng() * 0.4)),
      summoned, deadAt: 0, hurtAt: -9999, dmgBy: {}, charge: null,
      danger: m.danger ? { stay: 60000 } : null, bornAt: this.time, dmgAt: -99999, chaseSince: 0, boredUntil: 0, vanish: false,
      elite: null, prog: 0,
      stoneUntil: 0, sleepUntil: 0, silenceUntil: 0, snareUntil: 0, agiDown: 0, agiDownUntil: 0, quag: 0, quagUntil: 0,
      crucis: 0, lex: false, lexUntil: 0, breakHold: 0, hiddenUntil: 0, hideNext: this.time + 4000, poisonStacks: 0,
    };
    this.mobs.push(u);
    this.emit({ t: 'spawn', uid: u.uid });
    return u;
  }

  // ───────────────────────────── expedition maps (M10): danger monsters & treasure chests
  /** fight (맞서기) or keep away (피하기, the default) */
  avoidDanger(): boolean { return (this.s.orders?.danger ?? 'avoid') !== 'fight'; }
  /** a danger monster the party keeps away from right now (the player tapping it overrides the order) */
  shunned(m: MobUnit): boolean { return !!m.danger && m.uid !== this.focus && this.avoidDanger(); }

  /** new map: first danger monster and first chest after a while */
  private armExpedition() {
    this.chests = [];
    this.run = null;
    const d = this.zone.danger?.[0];
    this.dangerAt = d ? this.time + d.every * (0.4 + this.rng() * 0.6) : Infinity;
    this.chestAt = this.zone.chest ? this.time + this.zone.chest.every * (0.25 + this.rng() * 0.5) : Infinity;
  }

  private expeditionTick() {
    const z = this.zone;
    if (!z.danger && !z.chest) return;
    if (this.wipeUntil) return;
    // a danger monster appears now and then, one at a time (a woken trap chest counts)
    if (z.danger?.length && this.time >= this.dangerAt && !this.mobs.some((m) => m.danger && m.state !== 'dead')) {
      const now = this.clock();
      const awake = z.danger.filter((d) => !d.hours || inHours(d.hours, now));
      if (awake.length) this.spawnDanger(awake[Math.floor(this.rng() * awake.length)]);
      else this.dangerAt = this.time + 30000;
    }
    // danger monsters leave when nobody fights them for long, or when their hours end
    for (const m of this.mobs) {
      if (!m.danger || !this.alive(m)) continue;
      const age = this.time - m.bornAt;
      const fought = this.time - m.dmgAt < 20000;
      const h = m.danger.hours;
      if (h && !inHours(h, this.clock())) this.dangerLeave(m, `날이 밝자 ${m.m.name}이(가) 모습을 감췄다.`);
      else if (age > m.danger.stay && !fought) this.dangerLeave(m, `${m.m.name}이(가) 어둠 속으로 사라졌다.`);
      else if (age > Math.max(m.danger.stay * 4, 300000)) this.dangerLeave(m, `${m.m.name}이(가) 싸움에 흥미를 잃고 사라졌다.`);
    }
    // treasure chests
    if (z.chest && !this.chests.some((c) => !c.opened) && this.time >= this.chestAt) this.spawnChest();
    if (this.chests.length) this.chests = this.chests.filter((c) => !c.opened || this.time - c.opened < 1600);
  }

  /** a random spot far from the party (and from `avoid` points) */
  private farPoint(minD: number, avoid: { x: number; y: number }[] = [], avoidR = 0) {
    const z = this.zone, c = this.center();
    let best = { x: z.w / 2, y: z.h / 2 }, bs = -Infinity;
    for (let i = 0; i < 20; i++) {
      const p = { x: 70 + this.rng() * (z.w - 140), y: 110 + this.rng() * (z.h - 170) };
      const d = dist(p, c);
      if (avoid.some((a) => dist(a, p) < avoidR)) continue;
      if (d >= minD) return p;
      if (d > bs) { bs = d; best = p; }
    }
    return best;
  }

  private spawnDanger(def: DangerDef) {
    const p = this.farPoint(400);
    const u = this.spawnMob(def.id, false, p.x, p.y);
    u.danger = { stay: def.stay, hours: def.hours, def };
    this.dangerAt = Infinity; // the next one is timed from when this one goes
    this.dangerStats.spawns++;
    this.emit({ t: 'announce', text: `⚠ ${u.m.name} 출현!`, kind: 'danger' });
    this.log(`[위험] ${u.m.name}(Lv ${u.m.lv})이(가) 나타났다! ${this.avoidDanger() ? '작전: 피하기 — 마주치면 반대편으로 물러납니다.' : '작전: 맞서기'}`, '#ff6a6a');
    this.sound('boss');
    this.emit({ t: 'shake', power: 3 });
  }

  /** a danger monster left (or fell): time the next one */
  private dangerGone(m: MobUnit) {
    const def = m.danger?.def;
    if (def && this.zone.danger?.includes(def)) this.dangerAt = this.time + def.every * (0.6 + this.rng() * 0.8);
    else if (this.dangerAt === Infinity && this.zone.danger?.length) this.dangerAt = this.time + this.zone.danger[0].every * (0.6 + this.rng() * 0.8);
    if (this.run?.from === m.uid) this.run = null;
  }

  private dangerLeave(m: MobUnit, text: string) {
    m.vanish = true;
    m.target = null;
    m.charge = null;
    this.setState(m, 'dead');
    m.deadAt = this.time;
    if (this.focus === m.uid) this.focus = null;
    for (const h of this.heroes) if (h.target === m.uid) h.target = null;
    this.emit({ t: 'status', uid: m.uid, text: '…', color: '#c8b8e0' });
    this.log(text, '#d8b8ff');
    this.dangerStats.left++;
    this.dangerGone(m);
  }

  /** M10: per-step thinking of a danger monster — give up a chase nobody fights back, then roam away for a while */
  private dangerThink(m: MobUnit) {
    if (m.target === null) return;
    const t = this.heroUnit(m.target);
    const far = !t || dist(t, m) > 340;
    const unfought = this.time - m.dmgAt > 6000;
    if (far || (unfought && this.time - m.chaseSince > CHASE_MS)) {
      m.target = null;
      m.provokeUntil = 0;
      m.boredUntil = this.time + BORED_MS;
      // wander off to the side away from the party
      const c = this.center();
      const dx = m.x - c.x, dy = m.y - c.y, d = Math.hypot(dx, dy) || 1;
      m.dest = { x: clamp(m.x + dx / d * 260, 50, this.zone.w - 50), y: clamp(m.y + dy / d * 200, 90, this.zone.h - 50) };
      m.wanderAt = this.time + 5000;
      this.emit({ t: 'status', uid: m.uid, text: '…흥미를 잃었다', color: '#c8b8e0' });
    }
  }

  private spawnChest() {
    const p = this.farPoint(170, this.mobs.filter((m) => m.danger && this.alive(m)), 260);
    this.chests.push({ id: this.gidSeq++, x: p.x, y: p.y, born: this.time, openAt: 0, openBy: 0, opened: 0 });
    this.chestAt = Infinity; // the next one is timed from when this one is opened
    this.dangerStats.chests++;
    this.log('어딘가에 보물 상자가 놓여 있다…', '#ffe080');
  }

  /** the closed chest the leader should go for (none near a danger monster the party avoids) */
  private chestFor(h: HeroUnit): FieldChest | undefined {
    if (!this.chests.length) return undefined;
    let best: FieldChest | undefined; let bd = Infinity;
    for (const c of this.chests) {
      if (c.opened || (c.openAt && c.openBy !== h.uid)) continue;
      if (this.pc.dangers.some((m) => dist(m, c) < 240)) continue;
      const d = dist(h, c);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  /** walk to the chest and open it (a short rattle, then loot — or a trap) */
  private goChest(h: HeroUnit, c: FieldChest, dt: number) {
    if (c.openAt) { h.doing = '보물 상자 여는 중'; this.setState(h, 'cast'); return; }
    if (dist(h, c) > 24) {
      h.doing = '보물 상자로';
      this.moveTo(h, c.x - 12, c.y + 2, h.d.moveSpd, dt, 3);
      return;
    }
    c.openAt = this.time + 900;
    c.openBy = h.uid;
    h.facing = c.x >= h.x ? 1 : -1;
    h.lockUntil = this.time + 950;
    this.setState(h, 'cast');
    h.doing = '보물 상자 여는 중';
    this.emit({ t: 'status', uid: h.uid, text: '덜컥…', color: '#ffe8a0' });
    this.sound('click');
    this.after(900, () => this.openChest(c));
  }

  private openChest(c: FieldChest) {
    const cd = this.zone.chest;
    if (!cd || !this.chests.includes(c) || c.opened) return;
    const opener = this.heroUnit(c.openBy) ?? this.leader();
    this.chestAt = this.time + cd.every * (0.6 + this.rng() * 0.8);
    if (this.rng() < cd.trapRate) {
      // a trap: the chest grows teeth
      this.chests = this.chests.filter((x) => x !== c);
      const u = this.spawnMob(cd.trap, false, c.x, c.y);
      u.lockUntil = this.time + 350;
      if (opener && opener.state !== 'dead') { u.target = opener.uid; u.chaseSince = this.time; }
      this.dangerStats.traps++;
      this.emit({ t: 'announce', text: `⚠ 함정! ${u.m.name} 출현!`, kind: 'danger' });
      this.log(`[함정] 보물 상자가 아니었다! ${u.m.name}(Lv ${u.m.lv})이(가) 이빨을 드러냈다.`, '#ff6a6a');
      this.sound('boss');
      this.emit({ t: 'shake', power: 6 });
      return;
    }
    c.opened = this.time;
    let n = 0;
    const got: string[] = [];
    for (const d of cd.drops) {
      if (this.rng() >= d.rate) continue;
      const g = this.dropAt(c.x, c.y - 6, d.id, d.slots, n++);
      if (ITEMS[d.id].kind !== 'etc' || ITEMS[d.id].rarity) got.push(g.got.name);
    }
    const zeny = cd.zeny[0] + Math.floor(this.rng() * (cd.zeny[1] - cd.zeny[0] + 1));
    this.s.zeny += zeny;
    this.s.rate.zeny += zeny;
    if (opener) this.emit({ t: 'pickup', gid: -1, to: opener.uid, id: '', name: '', zeny });
    this.log(`보물 상자를 열었다! ${zeny.toLocaleString()}z${got.length ? ' · ' + got.join(', ') : ''}`, '#ffe080');
    this.sound('drop');
    this.onPersist();
  }

  // ───────────────────────────── 균열 (rift.ts, docs/design/ENDGAME.md §3)
  /** start the planned run (s.rift.next, else a fresh plan for the wanted tier); null = in, otherwise why not */
  startRift(): string | null {
    const s = this.s;
    if (!riftUnlocked(s)) return '2차 직업 · Lv 60 동료가 있어야 균열이 열립니다.';
    if (!s.heroes.length) return '출전할 동료가 없습니다.';
    const rs = riftSave(s);
    const plan = ensurePlan(s, this.rng, riftWeek(this.clock()));
    rs.next = undefined;
    rs.runs++;
    // the hunting map behind the rift: offline time goes there if the game closes mid-run
    const back = this.rift?.back ?? (this.zone.id !== 'town' ? this.zone.id : s.lastHunt ?? 'town');
    const zone = riftZone(plan);
    this.zone = zone;
    s.zone = back; // the save never points into a rift
    this.mobs = []; this.ground = []; this.grounds = []; this.timers = []; this.focus = null; this.chests = []; this.run = null;
    this.dangerAt = Infinity; this.chestAt = Infinity; this.wipeUntil = 0; this.fadeAt = 0;
    this.rift = {
      plan, zone, mods: riftMods(plan), back, start: this.time, end: this.time + RIFT_MS, progress: 0, phase: 'run', guardian: null,
      endedAt: 0, eliteAt: this.time + 15000 + this.rng() * 12000, kills: 0, elites: 0, essence: 0, loot: [],
      burstAt: 0, enraged: false, barrier: null, barrierSteps: [0.7, 0.35], toxicAt: this.time + 2000,
    };
    this.restParty();
    this.spawnAt = this.time + 300;
    for (let i = 0; i < Math.round(zone.maxMobs * 0.6); i++) this.spawnRiftMob();
    const rules = plan.rules.map((id) => ruleName(plan, id)).join(' · ');
    this.emit({ t: 'announce', text: `균열 ${plan.tier}단계 입장`, kind: 'rift' });
    this.log(`[균열] ${plan.tier}단계 — 규칙: ${rules}. 10분 안에 진행 바를 채우고 수호자를 쓰러뜨리세요.`, '#d0a0ff');
    this.sound('boss');
    this.version++;
    this.onPersist();
    return null;
  }

  /** leave the rift for town (a run in progress counts as given up) */
  leaveRift() {
    const r = this.rift;
    if (!r) return;
    if (r.phase === 'run' || r.phase === 'guardian') this.riftEnd(false, '포기');
    this.setZone('town');
    this.onTravel('town');
    this.onPersist();
  }

  /** the game was away for long (the machine slept): no rift survives that — back to its hunting map, no result */
  dropRift() {
    const r = this.rift;
    if (!r) return;
    this.setZone(r.back);
    this.onTravel(r.back);
  }

  /** everyone up, healed and together in the middle of the map */
  private restParty() {
    const sx = this.zone.w * 0.5, sy = this.zone.h * 0.55;
    this.heroes.forEach((h, i) => {
      h.state = 'idle'; h.stateT = this.time; h.deadUntil = 0;
      h.hp = h.d.maxHp; h.sp = h.d.maxSp;
      h.x = sx - i * 26; h.y = sy + (i % 2 ? 22 : -10);
      h.target = null; h.cast = null; h.sitting = false; h.poisonUntil = 0;
    });
  }

  /** a spot between `min` and `max` from the party, inside the map */
  private ringPoint(min: number, max: number) {
    const z = this.zone, c = this.center();
    for (let i = 0; i < 16; i++) {
      const a = this.rng() * Math.PI * 2, d = min + this.rng() * (max - min);
      const p = { x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d * 0.8 };
      if (p.x > 50 && p.x < z.w - 50 && p.y > 100 && p.y < z.h - 50) return p;
    }
    return { x: 50 + this.rng() * (z.w - 100), y: 100 + this.rng() * (z.h - 150) };
  }

  private spawnRiftMob() {
    const r = this.rift!;
    const id = r.plan.pool[Math.floor(this.rng() * r.plan.pool.length)];
    const p = this.ringPoint(220, 520);
    const u = this.spawnMob(id, false, p.x, p.y, riftMonster(MONSTERS[id], r.plan, 'normal'));
    u.prog = progressOf(r.plan, 'normal');
  }

  private riftSpawnTick() {
    const r = this.rift!;
    if (r.phase !== 'run' || this.wipeUntil) return;
    const live = this.mobs.filter((m) => !m.summoned && !m.elite && m.state !== 'dead').length;
    if (live < r.zone.maxMobs && this.time >= this.spawnAt) {
      this.spawnAt = this.time + 300 + this.rng() * 500;
      this.spawnRiftMob();
    }
    if (this.time >= r.eliteAt && !this.mobs.some((m) => m.elite && this.alive(m))) {
      r.eliteAt = Infinity; // timed again once this pack is gone
      this.spawnElitePack();
    }
  }

  /** an elite pack: a big leader and three of its kind, all with the same affix */
  private spawnElitePack() {
    const r = this.rift!;
    const id = r.plan.pool[Math.floor(this.rng() * r.plan.pool.length)];
    const affix = AFFIX_IDS[Math.floor(this.rng() * AFFIX_IDS.length)];
    const p = this.ringPoint(280, 460);
    const role = (x: RiftRole) => riftMonster(MONSTERS[id], r.plan, x, affix);
    const lead = this.spawnMob(id, false, p.x, p.y, role('leader'));
    lead.elite = { affix, leader: true }; lead.prog = progressOf(r.plan, 'leader');
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const u = this.spawnMob(id, false, p.x + Math.cos(a) * 42, p.y + Math.sin(a) * 30, role('minion'));
      u.elite = { affix, leader: false }; u.prog = progressOf(r.plan, 'minion');
    }
    this.emit({ t: 'announce', text: `◆ 정예 「${AFFIXES[affix].name}」 ${lead.m.name}`, kind: 'info' });
    this.log(`[균열] 정예 무리 — ${AFFIXES[affix].name} ${lead.m.name} (${AFFIXES[affix].text})`, '#80c8ff');
  }

  private spawnGuardian() {
    const r = this.rift!;
    r.phase = 'guardian';
    const base = MONSTERS[r.plan.guardian];
    const c = this.center(), a = this.rng() * Math.PI * 2;
    const u = this.spawnMob(base.id, false, c.x + Math.cos(a) * 190, c.y + Math.sin(a) * 130, riftMonster(base, r.plan, 'guardian'));
    u.target = this.leader()?.uid ?? null; u.chaseSince = this.time;
    r.guardian = u.uid;
    r.burstAt = this.time + 9000;
    const mech = MECHS[r.plan.mech as GuardianMech];
    this.emit({ t: 'announce', text: `균열 수호자 「${u.m.name}」 출현!`, kind: 'mvp' });
    this.log(`[균열] 진행 바가 가득 찼다! 수호자 ${u.m.name} — ${mech.name}: ${mech.text}`, '#d0a0ff');
    this.sound('boss');
    this.emit({ t: 'shake', power: 6 });
  }

  /** the guardian's rift mechanic (per step while it stands) */
  private guardianTick(m: MobUnit) {
    const r = this.rift!;
    if (r.phase !== 'guardian' || !this.alive(m)) return;
    const mech = r.plan.mech as GuardianMech;
    const ratio = m.hp / m.maxHp;
    if (mech === 'burst' && this.time >= r.burstAt) {
      r.burstAt = this.time + 14000;
      const R = 130;
      this.emit({ t: 'telegraph', x: m.x, y: m.y, r: R, dur: 1200, color: '#b060ff' });
      this.emit({ t: 'status', uid: m.uid, text: '균열 폭발!', color: '#e0b0ff' });
      this.after(1200, () => {
        if (!this.rift || !this.alive(m)) return;
        this.emit({ t: 'skill', fx: 'darkslam', from: m.uid, x: m.x, y: m.y, lv: 1, radius: R });
        this.emit({ t: 'shake', power: 5 });
        this.sound('hit_heavy');
        for (const h of this.heroes) if (h.state !== 'dead' && dist(h, m) <= R) this.mobHit(m, h, 2.2, 'shadow', true, true);
      });
    }
    if (mech === 'enrage' && !r.enraged && ratio < 0.3) {
      r.enraged = true;
      // the guardian's def is its own copy: it can be changed in place
      m.m.atk = [Math.round(m.m.atk[0] * 1.6), Math.round(m.m.atk[1] * 1.6)];
      m.m.delay = Math.round(m.m.delay * 0.6);
      m.m.speed *= 1.3;
      this.emit({ t: 'status', uid: m.uid, text: '광폭화!', color: '#ff6a6a' });
      this.emit({ t: 'shake', power: 4 });
      this.log(`[균열] ${m.m.name}이(가) 광폭해졌다!`, '#ff8a8a');
      this.sound('boss');
    }
    if (mech === 'barrier') {
      if (r.barrier && (this.time >= r.barrier.until || !r.barrier.adds.some((u) => this.alive(this.mob(u))))) {
        r.barrier = null;
        this.emit({ t: 'status', uid: m.uid, text: '수호막 해제', color: '#d0c0ff' });
      }
      const step = r.barrierSteps[0];
      if (!r.barrier && step !== undefined && ratio < step) {
        r.barrierSteps.shift();
        const adds: number[] = [];
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          const u = this.spawnMob(r.plan.pool[i % r.plan.pool.length], true, m.x + Math.cos(a) * 70, m.y + Math.sin(a) * 50);
          u.target = this.leader()?.uid ?? null; u.chaseSince = this.time;
          adds.push(u.uid);
        }
        r.barrier = { until: this.time + 25000, adds };
        this.emit({ t: 'status', uid: m.uid, text: '수호막!', color: '#c0a0ff' });
        this.emit({ t: 'skill', fx: 'summon', from: m.uid, x: m.x, y: m.y, lv: 1 });
        this.log(`[균열] ${m.m.name}이(가) 수호막을 둘렀다 — 하수인을 먼저 쓰러뜨리세요.`, '#c8b0ff');
        this.sound('boss');
      }
    }
  }

  /** a rift kill: the progress bar, elite rewards, the odd piece of gear, the guardian's fall */
  private riftKill(t: MobUnit) {
    const r = this.rift!;
    if (r.phase === 'done' || r.phase === 'fail') return;
    if (t.uid === r.guardian) { this.riftClear(t); return; }
    if (t.summoned) return;
    r.kills++;
    if (r.phase === 'run' && t.prog > 0) {
      r.progress = Math.min(100, r.progress + t.prog);
      if (r.progress >= 100) this.spawnGuardian();
    }
    if (t.elite) {
      if (t.elite.affix === 'exploding') this.eliteBlast(t);
      if (t.elite.leader) {
        r.elites++;
        this.giveEssence(t.x, t.y, essenceForElite(r.plan.tier, this.rng));
        this.riftGear(t.x, t.y, 'elite', 1);
      } else if (this.rng() < 0.08) this.riftGear(t.x, t.y, 'elite', 1);
      if (!this.mobs.some((m) => m !== t && m.elite && this.alive(m))) r.eliteAt = this.time + 30000 + this.rng() * 25000;
    } else if (this.rng() < 0.006) this.riftGear(t.x, t.y, 'trash', 1);
  }

  /** 정예 「폭발」: a second after it falls, the spot bursts */
  private eliteBlast(m: MobUnit) {
    const x = m.x, y = m.y, R = 80;
    this.emit({ t: 'telegraph', x, y, r: R, dur: 1000, color: '#ff8040' });
    this.after(1000, () => {
      if (!this.rift) return;
      this.emit({ t: 'skill', fx: 'slam', from: m.uid, x, y, lv: 1, radius: R });
      this.sound('hit_heavy');
      for (const h of this.heroes) if (h.state !== 'dead' && Math.hypot(h.x - x, h.y - y) <= R) this.mobHit(m, h, 1.6, 'fire', false, true, true);
    });
  }

  private giveEssence(x: number, y: number, n: number) {
    if (n <= 0) return;
    addItem(this.s, ESSENCE, n);
    if (this.rift) this.rift.essence += n;
    this.dropAt(x, y, ESSENCE, undefined, 0, undefined, { name: `균열 정수 ×${n}`, zeny: 0 });
  }

  /** rift gear (rift.ts makeRiftGear): straight into the bag, thrown on the ground for the show */
  private riftGear(x: number, y: number, src: LootSource, n: number, force?: Grade) {
    const r = this.rift;
    if (!r) return;
    for (let i = 0; i < n; i++) {
      const inst = makeRiftGear(this.s, r.plan.tier, src, this.rng, force);
      if (!inst) continue;
      const g = gradeOf(inst);
      const name = `${GRADE_KO[g]} · ${itemName(inst)}`;
      r.loot.push(g);
      this.dropAt(x, y, inst.id, inst.slots, i + 1, undefined, { name, zeny: 0 });
      if (g === 'ancient' || g === 'primal') this.emit({ t: 'announce', text: `${GRADE_KO[g]} 장비 — ${itemName(inst)}`, kind: 'rift' });
    }
    this.onPersist();
  }

  private riftClear(g: MobUnit) {
    const r = this.rift!, s = this.s, rs = riftSave(s), tier = r.plan.tier;
    const ms = this.time - r.start;
    const adv = clearAdvance(r.end - this.time);
    rs.clears++;
    rs.open = Math.min(RIFT_MAX, Math.max(rs.open, tier + adv));
    rs.pick = rs.open;
    const first = !rs.firsts.includes(tier);
    const newBest = tier > rs.best;
    if (newBest || (tier === rs.best && ms < (rs.bestMs ?? Infinity))) {
      rs.best = tier; rs.bestMs = ms; rs.bestAt = this.clock().getTime(); rs.bestParty = recordParty(s);
    }
    this.giveEssence(g.x, g.y, essenceForClear(tier));
    this.riftGear(g.x, g.y, 'guardian', Math.min(5, 2 + Math.floor(tier / 20)));
    if (first) {
      rs.firsts.push(tier);
      const fc = firstClearReward(tier);
      s.zeny += fc.zeny;
      this.giveEssence(g.x, g.y, fc.essence);
      if (fc.gear) this.riftGear(g.x, g.y, 'guardian', 1, fc.gear);
      this.log(`[첫 정복] ${tier}단계 — ${fc.zeny.toLocaleString()}z · 균열 정수 ${fc.essence}${fc.gear ? ` · ${GRADE_KO[fc.gear]} 장비` : ''}`, '#ffe080');
    }
    this.emit({ t: 'announce', text: `균열 ${tier}단계 정복! ${fmtClock(ms)} · +${adv}단계`, kind: 'rift' });
    if (newBest) this.emit({ t: 'announce', text: `최고 기록 ${tier}단계!`, kind: 'rift' });
    this.log(`[균열] ${tier}단계 정복 (${fmtClock(ms)}) — ${tier + adv > tier ? `${Math.min(RIFT_MAX, tier + adv)}단계까지 열림` : ''}${newBest ? ' · 최고 기록!' : ''}`, '#ffd84a');
    this.sound('mvp');
    this.riftEnd(true, '수호자 처치', adv, first, newBest);
  }

  private riftFail(why: string) {
    const r = this.rift!;
    this.emit({ t: 'announce', text: `균열 ${r.plan.tier}단계 실패 — ${why}`, kind: 'rift' });
    this.log(`[균열] ${r.plan.tier}단계 실패 — ${why}. 다음 판은 같은 단계에서 다시 도전합니다.`, '#ff9a8a');
    this.sound('player_die');
    this.riftEnd(false, why);
  }

  private riftEnd(ok: boolean, why: string, adv = 0, first = false, record = false) {
    const r = this.rift!;
    r.phase = ok ? 'done' : 'fail';
    r.endedAt = this.time;
    r.barrier = null;
    const ms = this.time - r.start;
    r.result = { ok, adv, ms, first, record, why };
    const rs = riftSave(this.s);
    rs.last = { tier: r.plan.tier, ok, ms, adv, why };
    // the rift closes: whatever is still standing fades away
    for (const m of this.mobs) if (m.state !== 'dead') { m.vanish = true; m.target = null; m.charge = null; this.setState(m, 'dead'); m.deadAt = this.time; }
    for (const h of this.heroes) { h.target = null; h.cast = null; }
    this.focus = null;
    // roll the next run now: the entry screen shows its rules, auto-retry takes it
    ensurePlan(this.s, this.rng, riftWeek(this.clock()));
    this.onRiftEnd(r);
    this.onPersist();
  }

  private riftWipe() {
    this.wipeUntil = this.time + 3500;
    this.s.totals.deaths++;
    this.emit({ t: 'announce', text: '파티 전멸... 균열이 닫힙니다', kind: 'wipe' });
    this.log('파티가 전멸했습니다. (균열에서는 경험치를 잃지 않습니다)', '#ff6060');
    const r = this.rift!;
    if (r.phase === 'run' || r.phase === 'guardian') this.riftFail('파티 전멸');
    this.onPersist();
  }

  /** per step: the clock, 맹독 안개, and after a run the pause before the next one (auto-retry) or town */
  private riftTick(_dt: number) {
    const r = this.rift!;
    if (r.phase === 'run' || r.phase === 'guardian') {
      if (this.time >= r.end) { this.riftFail('시간 초과'); return; }
      if (r.mods.toxic > 0 && this.time >= r.toxicAt) {
        r.toxicAt = this.time + 2000;
        for (const h of this.heroes) {
          if (h.state === 'dead') continue;
          const n = Math.min(h.hp - 1, Math.max(1, Math.floor(h.d.maxHp * r.mods.toxic / 100)));
          if (n > 0) { h.hp -= n; this.emit({ t: 'dmg', uid: h.uid, n, kind: 'taken' }); }
        }
      }
      return;
    }
    if (this.wipeUntil || this.time - r.endedAt < 6000) return;
    if (riftSave(this.s).auto !== 'off' && riftUnlocked(this.s)) { this.startRift(); return; }
    this.leaveRift();
  }

  // ───────────────────────────── heroes
  private setState(u: Unit, st: UnitState) {
    if (u.state !== st) { u.state = st; u.stateT = this.time; }
  }

  private heroTick(h: HeroUnit, dt: number) {
    if (this.time - h.dAt > 250) this.refresh(h);
    if (h.state === 'dead') {
      h.doing = '쓰러짐';
      if (this.time >= h.deadUntil && this.aliveHeroes().length > 0) this.revive(h, 0.3);
      return;
    }
    this.regen(h);
    if (h.poisonUntil > this.time && this.time >= h.poisonNext) {
      h.poisonNext = this.time + 1000;
      // 해독 지연: the poison stays but doesn't bite
      if (h.slowPoisonUntil <= this.time) {
        const dmg = Math.max(1, Math.floor(h.d.maxHp * 0.015));
        this.damageHero(h, dmg, null, true);
        if ((h.state as string) === 'dead') return;
      }
    }
    this.selfEffects(h);

    // 피하기: a danger monster right on top of a caster breaks the cast — get away first
    if (h.cast && this.run) {
      const m = this.mob(this.run.from);
      if (m && dist(m, h) < 170) { h.cast = null; this.emit({ t: 'castEnd', uid: h.uid }); this.setState(h, 'idle'); }
    }
    if (h.cast) {
      const ct = this.unit(h.cast.target);
      h.doing = h.cast.sk.name + (ct?.kind === 'hero' && ct !== h ? ` → ${ct.hero.name}` : ct?.kind === 'mob' ? ` → ${ct.m.name}` : '') + ' 시전';
      if (this.time >= h.cast.end) this.releaseCast(h);
      else {
        const t = this.unit(h.cast.target);
        const k = h.cast.sk.kind;
        if (h.cast.target !== null && !this.alive(t) && k !== 'aoe' && k !== 'revive' && k !== 'ground' && k !== 'trap') {
          h.cast = null;
          this.emit({ t: 'castEnd', uid: h.uid });
          this.setState(h, 'idle');
        }
      }
      return;
    }
    if (this.time < h.lockUntil) return;
    if (h.state === 'attack' || h.state === 'hurt') this.setState(h, 'idle');

    if (this.zone.id === 'town') {
      if (h.sitting) {
        if (h.hp < h.d.maxHp || h.sp < h.d.maxSp) return;
        h.sitting = false; this.setState(h, 'idle');
      }
      if (h.hp < h.d.maxHp || h.sp < h.d.maxSp) { h.sitting = true; this.setState(h, 'sit'); h.doing = '마을에서 휴식'; return; }
      h.doing = '마을';
      this.idleFollow(h, dt);
      return;
    }

    // hiding / playing dead: lie low until patched up (potions still work), then come out
    if (this.tryLieLow(h)) return;
    // 피하기: a danger monster closing in — run for the far side of the map, together
    if (this.tryEvade(h, dt)) return;
    // support: revive, heal, cures, protective walls & buffs first
    if (this.trySupport(h)) return;
    // party rest (orders.rest) and casters sitting for SP
    if (this.tryRest(h)) return;
    // hiding to shake off a crowd, reveals, out-of-fight chores (holy water, stones)
    if (this.tryUtility(h)) return;

    // targeting: player focus > tactics (re-thought twice a second so the party regroups on the shared target)
    let t = this.mob(h.target);
    if (!this.targetable(t)) { h.target = null; t = undefined; }
    if (this.focus !== null) {
      const f = this.mob(this.focus);
      if (this.targetable(f)) { t = f; h.target = f!.uid; } else if (!this.alive(f)) this.focus = null;
    }
    if (this.focus === null && (!t || this.time >= h.thinkAt)) {
      h.thinkAt = this.time + 450 + this.rng() * 150;
      t = this.chooseTarget(h);
      h.target = t?.uid ?? null;
    }
    if (!t) { this.idleFollow(h, dt); return; }

    // tank provoke, auto counter stance, crowd control & debuffs
    if (this.tryProvoke(h)) { h.doing = '도발'; return; }
    if (this.tryStance(h, t)) return;
    if (this.tryCc(h, t)) return;

    // offensive skill or normal attack from this hero's position (front / mid / back)
    const act = this.chooseSkill(h, t);
    const range = act ? this.skillRange(h, act.sk, act.lv) : h.d.range;
    const saving = !act && this.tactics(h).skills === 'conserve' && h.sp < h.d.maxSp * 0.5 && this.enabledSkills(h, ['attack', 'aoe']).length > 0;
    h.doing = t.m.name + (act ? (act.sk.kind === 'heal' ? ' — 힐로 공격' : ' — ' + act.sk.name) : saving ? ' 공격 (SP 절약)' : ' 공격');
    if (this.position(h, t, range, dt)) return;
    h.facing = t.x >= h.x ? 1 : -1;
    if (act) { this.startSkill(h, act.sk, act.lv, t); return; }
    // hiding: no normal attacks (cloaking may swing, which ends it)
    if (this.heroHidden(h) && !this.hasBuff(h, 'cloak')) { this.setState(h, 'ready'); return; }
    if (this.time >= h.atkReady) this.normalAttack(h, t);
    else this.setState(h, 'ready');
  }

  // ───────────────────────────── party brain
  private pc: { engaged: MobUnit[]; target: MobUnit | undefined; dangers: MobUnit[] } = { engaged: [], target: undefined, dangers: [] };

  /** once per step: the mobs the party is fighting and the shared (assist) target */
  private partyScan() {
    const ids = new Set(this.heroes.map((h) => h.uid));
    const lead = this.leader();
    // 피하기: danger monsters are never part of the fight — they are what the party keeps away from
    const dangers = this.mobs.filter((m) => this.alive(m) && this.shunned(m));
    const engaged = this.mobs.filter((m) => this.targetable(m) && !this.shunned(m) && ((m.target !== null && ids.has(m.target))
      || (Object.keys(m.dmgBy).length > 0 && !!lead && dist(m, lead) < 320)));
    let target: MobUnit | undefined;
    const f = this.mob(this.focus);
    if (f && this.targetable(f)) target = f;
    if (!target && lead) { const lt = this.mob(lead.target); if (lt && this.targetable(lt)) target = lt; }
    if (!target) {
      const tank = this.aliveHeroes().find((h) => this.roleOf(h) === 'tank');
      const tt = tank && this.mob(tank.target);
      if (tt && this.targetable(tt)) target = tt;
    }
    if (!target && lead && engaged.length) target = engaged.reduce((a, b) => (dist(a, lead) <= dist(b, lead) ? a : b));
    this.pc = { engaged, target, dangers };
    this.updateRun(dangers);
  }

  /** 피하기: start / keep / end the party's run from a danger monster that comes close or chases one of us */
  private updateRun(dangers: MobUnit[]) {
    const lead = this.leader();
    if (!dangers.length || !lead || this.zone.id === 'town') { this.run = null; return; }
    const live = this.aliveHeroes();
    let threat: MobUnit | undefined; let td = Infinity;
    for (const m of dangers) {
      let near = Infinity;
      for (const h of live) near = Math.min(near, dist(h, m));
      const chasing = m.target !== null && !!this.heroUnit(m.target);
      // once running, keep going until it is well behind (hysteresis)
      if ((near < (this.run ? RUN_CLEAR : RUN_NEAR) || (chasing && near < 360)) && near < td) { td = near; threat = m; }
    }
    if (!threat) {
      if (this.run && this.time >= this.run.until) this.run = null;
      return;
    }
    // 순간이동 Lv2: right on top of us — blink away instead of running
    if (td < 150 && this.tryTeleportAway(threat)) return;
    const fresh = !this.run;
    const cur = this.run;
    if (!cur || cur.from !== threat.uid || this.time >= cur.at || dist(lead, cur) < 30) {
      // re-plan now and then — but keep heading for the same spot unless another is clearly better (no zig-zag)
      const p = this.farSpot(lead, threat);
      const keep = cur && cur.from === threat.uid && dist(lead, cur) >= 30 && this.spotScore(cur, lead, threat) > this.spotScore(p, lead, threat) - 150;
      this.run = keep ? { ...cur!, until: this.time + 2500, at: this.time + 1500 } : { from: threat.uid, x: p.x, y: p.y, until: this.time + 2500, at: this.time + 1500 };
    } else cur.until = this.time + 2500;
    if (fresh) {
      this.dangerStats.runs++;
      this.log(`${threat.m.name}을(를) 피해 반대편으로 물러납니다.`, '#ffb0a0');
      for (const h of this.heroes) if (h.target !== null) h.target = null;
    }
  }

  /** the far side of the map from a danger monster, without running past it */
  private farSpot(lead: HeroUnit, m: MobUnit) {
    const z = this.zone, inX = 70, inY = 100;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const fx = inX + (z.w - 2 * inX) * i / 5, fy = inY + (z.h - inY - 50) * i / 5;
      pts.push({ x: fx, y: inY }, { x: fx, y: z.h - 50 }, { x: inX, y: fy }, { x: z.w - inX, y: fy });
    }
    let best = pts[0], bs = -Infinity;
    for (const p of pts) {
      const sc = this.spotScore(p, lead, m);
      if (sc > bs) { bs = sc; best = p; }
    }
    return best;
  }

  /** how good a spot is to run to: far from the danger, not too far to go, and the way there doesn't pass it */
  private spotScore(p: { x: number; y: number }, lead: HeroUnit, m: MobUnit) {
    const sx = p.x - lead.x, sy = p.y - lead.y, L2 = sx * sx + sy * sy || 1;
    const k = clamp(((m.x - lead.x) * sx + (m.y - lead.y) * sy) / L2, 0, 1);
    const pass = Math.hypot(lead.x + sx * k - m.x, lead.y + sy * k - m.y);
    return dist(p, m) - 0.35 * dist(p, lead) - (pass < 120 && k > 0.05 ? 900 : 0);
  }

  /** while the party runs (피하기): everyone heads for the leader's safe spot; healers patch people up when it is safe */
  private tryEvade(h: HeroUnit, dt: number): boolean {
    const run = this.run;
    if (!run) return false;
    const m = this.mob(run.from);
    h.target = null;
    if (h.sitting) { h.sitting = false; this.setState(h, 'idle'); }
    if (m && dist(h, m) > 260 && this.trySupport(h)) return true;
    const lead = this.leader();
    const i = this.heroes.indexOf(h);
    const ox = h === lead ? 0 : (i % 2 ? 1 : -1) * 24, oy = h === lead ? 0 : (i % 2 ? 16 : -12);
    h.doing = `${m?.m.name ?? '위험 몹'} 피하는 중`;
    this.moveTo(h, clamp(run.x + ox, 24, this.zone.w - 24), clamp(run.y + oy, 70, this.zone.h - 24), h.d.moveSpd, dt, 8);
    if (dist(h, { x: run.x + ox, y: run.y + oy }) <= 9) this.setState(h, 'ready');
    return true;
  }

  tactics(h: HeroUnit): Tactics { return h.hero.tactics ?? defaultTactics(h.hero.cls); }

  /** the role from the hero's tactics (auto = class role; STR acolytes fight as battle priests) */
  roleOf(h: HeroUnit): PartyRole {
    const r = heroRole(h.hero);
    return r === 'ranged' && !h.d.ranged ? 'melee' : r; // a bare-handed falconer (M3) fights up close
  }

  posOf(h: HeroUnit): Position {
    const p = this.tactics(h).position;
    if (p !== 'auto') return p;
    const role = this.roleOf(h);
    if (role === 'melee') {
      // below 40% HP a melee damage dealer lets the tank hold and steps back until healed past 65%
      const tank = this.heroes.some((a) => a !== h && a.state !== 'dead' && !a.sitting && this.roleOf(a) === 'tank');
      const r = h.hp / h.d.maxHp;
      h.backOff = tank && (h.backOff ? r < 0.65 : r < 0.4);
      if (h.backOff) return 'mid';
    }
    switch (role) {
      case 'caster': return 'back';
      case 'ranged': return 'mid';
      case 'healer': {
        // healers join the melee while everyone is healthy and hang back in heal range otherwise
        const hurt = this.heroes.some((a) => a.state !== 'dead' && a.hp / a.d.maxHp * 100 < h.hero.auto.healPct + 10);
        const chased = this.mobs.some((m) => m.target === h.uid && this.alive(m));
        return hurt || chased ? 'mid' : 'front';
      }
    }
    return 'front';
  }

  private chooseTarget(h: HeroUnit): MobUnit | undefined {
    const tac = this.tactics(h);
    const lead = this.leader();
    const isLead = !lead || lead === h;
    const anchor = isLead ? h : lead!;
    const R = isLead ? 340 : CHASE_R[tac.chase];
    // a treasure chest on the field (expedition map): the leader walks over to open it once nothing is fighting us
    if (isLead && !this.pc.engaged.length && this.chestFor(h)) return undefined;
    const reach = (m: MobUnit) => m.target === h.uid || dist(m, anchor) <= R;
    const eng = this.pc.engaged.filter(reach);
    const cur = this.mob(h.target);
    const nearest = (list: MobUnit[]) => {
      let best: MobUnit | undefined; let bs = Infinity;
      for (const m of list) { const sc = dist(m, h) - (m === cur ? 30 : 0); if (sc < bs) { bs = sc; best = m; } }
      return best;
    };
    let pick: MobUnit | undefined;
    switch (tac.target) {
      case 'protect': {
        // whatever is hitting a party member — the back line and the most hurt first
        let bs = Infinity;
        for (const m of eng) {
          const v = this.heroUnit(m.target);
          if (!v || v.state === 'dead') continue;
          let sc = dist(m, h) + v.hp / v.d.maxHp * 120 - (m === cur ? 30 : 0);
          if (v !== h && this.posOf(v) !== 'front') sc -= 160;
          if (sc < bs) { bs = sc; pick = m; }
        }
        break;
      }
      case 'weakest': {
        let bs = Infinity;
        for (const m of eng) { const sc = m.hp / m.maxHp * 300 + dist(m, h) * 0.5; if (sc < bs) { bs = sc; pick = m; } }
        break;
      }
      case 'nearest': pick = nearest(eng); break;
      case 'boss': pick = this.mobs.find((m) => this.targetable(m) && !!m.m.boss && dist(m, anchor) <= Math.max(R, 420)); break;
    }
    let shared = this.pc.target && reach(this.pc.target) ? this.pc.target : undefined;
    // joining late on a target that is about to drop? take the next engaged mob instead of overkilling
    if (shared && shared !== cur && eng.length > 1 && shared.hp < this.estimateNormal(h, shared) * 1.5) {
      shared = nearest(eng.filter((m) => m !== shared)) ?? shared;
    }
    pick ??= shared ?? nearest(eng);
    // the leader (and free roamers) may tag a fresh mob while fewer than `pull` are engaged
    const mayPull = this.pc.engaged.length < Math.max(1, this.s.orders?.pull ?? 3)
      && (isLead || tac.chase === 'free' || tac.target === 'nearest');
    if (mayPull && (!pick || (isLead && pick !== cur && !this.alive(cur)))) {
      const fresh = this.pullCandidate(h, isLead ? (pick ? 170 : 300) : Math.min(R, 300));
      if (fresh && (!pick || dist(fresh, h) + 60 < dist(pick, h))) pick = fresh;
    }
    return pick;
  }

  /** nearest mob nobody fights yet, skipping ones well above the party level (and, 피하기, anything near a danger monster) */
  private pullCandidate(h: HeroUnit, radius: number): MobUnit | undefined {
    const avgLv = this.heroes.reduce((a, x) => a + x.hero.baseLv, 0) / this.heroes.length;
    let best: MobUnit | undefined; let bd = radius;
    for (const m of this.mobs) {
      if (!this.targetable(m) || this.pc.engaged.includes(m)) continue;
      if (m.danger) { if (this.shunned(m)) continue; } // 맞서기: hunted like a boss, whatever its level
      else if (!m.m.boss && m.m.lv > avgLv + 3 && !this.rift) continue; // the rift is cleared whatever the level
      if (this.pc.dangers.length && this.pc.dangers.some((d) => dist(d, m) < 230)) continue;
      const d = dist(m, h);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  /** the nearest living front-liner other than h (whoever is meant to take the hits) */
  private frontLiner(h: HeroUnit): HeroUnit | undefined {
    let best: HeroUnit | undefined; let bd = Infinity;
    for (const x of this.heroes) {
      if (x === h || x.state === 'dead' || x.sitting || this.posOf(x) !== 'front') continue;
      const d = dist(x, h);
      if (d < bd) { bd = d; best = x; }
    }
    return best;
  }

  /** a spot `want` px from the target on the side of the front line, fanned out per hero */
  private standSpot(h: HeroUnit, t: MobUnit, front: HeroUnit | undefined, want: number) {
    const ref = front ?? this.center();
    let dx = ref.x - t.x, dy = ref.y - t.y;
    let d = Math.hypot(dx, dy);
    if (d < 1) { dx = h.x - t.x; dy = h.y - t.y; d = Math.hypot(dx, dy) || 1; }
    // side-view rule (heroes are drawn facing left or right only): flatten the line so the spot is beside the target, not above it
    dy *= SIDE_BIAS;
    if (Math.abs(dx) < 1) dx = h.x >= t.x ? 1 : -1;
    d = Math.hypot(dx, dy);
    dx /= d; dy /= d;
    const i = this.heroes.indexOf(h);
    const side = (i % 2 ? 1 : -1) * 26;
    return {
      x: clamp(t.x + dx * want - dy * side, 24, this.zone.w - 24),
      y: clamp(t.y + dy * want * 0.8 + dx * side * 0.8, 70, this.zone.h - 24),
    };
  }

  /** move into this hero's place for the fight; true while it is moving instead of acting */
  private position(h: HeroUnit, t: MobUnit, reach: number, dt: number): boolean {
    const pos = this.posOf(h);
    const front = this.frontLiner(h);
    const edge = dist(h, t) - this.bodyR(t);
    const melee = reach < 60;

    // back line: step away from a melee mob on you and bring it to the front-liner
    if (pos !== 'front' && front) {
      if (this.time < h.kiteUntil) {
        h.doing = '전열 뒤로 빠지는 중';
        const D = { x: front.x + (front.x - t.x) * 0.4, y: front.y + (front.y - t.y) * 0.4 };
        const chaser = this.mobs.find((m) => m.target === h.uid && this.alive(m));
        const away = chaser ? { x: h.x + (h.x - chaser.x), y: h.y + (h.y - chaser.y) } : D;
        this.moveTo(h, (D.x + away.x) / 2, (D.y + away.y) / 2, h.d.moveSpd * 1.1, dt, 4);
        return true;
      }
      const onMe = this.mobs.find((m) => this.alive(m) && m.target === h.uid && m.m.range < 60 && dist(m, h) < this.bodyR(m) + 30);
      if (onMe && this.time >= h.kiteNext && front.hp > front.d.maxHp * 0.3) {
        h.kiteNext = this.time + 2600;
        if (this.tryBackSlide(h)) return true; // 뒤로 구르기 instead of walking
        h.kiteUntil = this.time + 600;
        return true;
      }
    }

    // alone without a front line, archers and casters step back from a melee mob between shots instead of trading blows
    if (pos !== 'front' && !front && !melee) {
      const chaser = this.mobs.find((m) => this.alive(m) && m.target === h.uid && m.m.range < 60 && dist(m, h) < this.bodyR(m) + 34);
      if (this.time < h.kiteUntil && chaser) {
        h.doing = '거리 두기';
        const dx = h.x - chaser.x, dy = h.y - chaser.y, d = Math.hypot(dx, dy) || 1;
        this.moveTo(h, clamp(h.x + dx / d * 90, 24, this.zone.w - 24), clamp(h.y + dy / d * 90, 70, this.zone.h - 24), h.d.moveSpd * 1.1, dt, 4);
        return true;
      }
      if (chaser && this.time >= h.kiteNext) {
        h.kiteNext = this.time + 2200;
        if (this.tryBackSlide(h)) return true;
        h.kiteUntil = this.time + 550;
        return true;
      }
    }

    if (pos === 'front' || (melee && !front)) {
      if (melee) {
        // side-view rule: come in from the left or right of the target and fight level with it
        const side = Math.sign(h.x - t.x) || -h.facing || -1;
        const slot = { x: clamp(t.x + side * (this.bodyR(t) + reach * 0.6), 24, this.zone.w - 24), y: t.y };
        if (edge > reach) { this.moveTo(h, slot.x, slot.y, h.d.moveSpd, dt, 4); return true; }
      } else if (edge > reach) { this.moveTo(h, t.x, t.y, h.d.moveSpd, dt, reach * 0.85); return true; }
      // melee damage dealers take the far side of the target when the tank already holds it
      if (this.roleOf(h) === 'melee' && front && this.roleOf(front) === 'tank' && front.target === t.uid && dist(front, t) < 70) {
        const fx = t.x - front.x, fy = (t.y - front.y) * SIDE_BIAS, fd = Math.hypot(fx, fy) || 1;
        const off = this.bodyR(t) + 14;
        const D = { x: t.x + fx / fd * off, y: t.y + fy / fd * off * 0.8 };
        // already swinging: only walk round when well off the flank, so small shoves don't keep it shuffling
        if (dist(h, D) > (edge <= reach ? 30 : 12)) { this.moveTo(h, D.x, D.y, h.d.moveSpd, dt, 4); return true; }
      }
      return false;
    }

    if (melee) {
      // a melee weapon can't reach from the back line: hold a spot behind the front-liner (in heal range)
      const D = this.standSpot(h, t, front, dist(front!, t) + (pos === 'mid' ? 45 : 85));
      h.doing = h.backOff ? '체력 회복 대기 (후퇴)' : '전열 뒤에서 대기';
      if (dist(h, D) > 16) { this.moveTo(h, D.x, D.y, h.d.moveSpd, dt, 6); return true; }
      this.setState(h, 'ready');
      h.facing = t.x >= h.x ? 1 : -1;
      return true;
    }

    // ranged / casters: stand on the line from the target through the front-liner at a comfortable distance
    const want = Math.min(reach * 0.9, pos === 'mid' ? 115 : 165);
    if (edge > reach || (front && edge < want * 0.5)) {
      const D = this.standSpot(h, t, front, want + this.bodyR(t));
      if (dist(h, D) > 10) { this.moveTo(h, D.x, D.y, h.d.moveSpd, dt, 6); return edge > reach || dist(h, D) > 40; }
    }
    return false;
  }

  /** party rest after fights (orders.rest) and casters sitting for SP; true while sitting */
  private tryRest(h: HeroUnit): boolean {
    const threat = this.pc.engaged.some((m) => dist(m, h) < 240) || this.pc.dangers.some((m) => dist(m, h) < 380);
    const rest = this.s.orders?.rest ?? 20;
    if (h.sitting) {
      const onMe = this.mobs.some((m) => this.alive(m) && m.target === h.uid);
      // a caster sitting for SP stays down while the front line handles things; everyone else gets up for a fight
      const casterOk = this.usesSp(h) && h.sp < h.d.maxSp * 0.5 && !!this.frontLiner(h);
      if (onMe || (threat && !casterOk) || this.restDone()) { h.sitting = false; this.setState(h, 'idle'); return false; }
      h.doing = this.pc.engaged.length ? 'SP 회복 (앉음)' : '파티 휴식';
      return true;
    }
    if (this.pc.engaged.length) {
      // mid-fight: a caster or healer out of SP sits behind the front line if nothing is on it
      const front = this.frontLiner(h);
      if (this.usesSp(h) && h.sp < h.d.maxSp * 0.12 && front && !this.mobs.some((m) => this.alive(m) && m.target === h.uid && dist(m, h) < 180)) {
        h.sitting = true; h.target = null; this.setState(h, 'sit'); h.doing = 'SP 회복 (앉음)';
        return true;
      }
      return false;
    }
    if (rest > 0 && this.heroes.some((a) => a.state !== 'dead' && (a.hp / a.d.maxHp * 100 < rest || (this.usesSp(a) && a.sp / a.d.maxSp * 100 < rest)))) {
      h.sitting = true; h.target = null; this.setState(h, 'sit'); h.doing = '파티 휴식';
      return true;
    }
    return false;
  }

  private restDone() {
    return this.heroes.every((a) => a.state === 'dead' || (a.hp >= a.d.maxHp * 0.8 && (!this.usesSp(a) || a.sp >= a.d.maxSp * 0.55)));
  }

  /** casters and healers rest for SP; everyone else falls back to normal attacks */
  private usesSp(h: HeroUnit) {
    const role = this.roleOf(h);
    if (role !== 'caster' && role !== 'healer') return false;
    return (h.hero.skillSlots ?? []).some((id) => !!id && (h.hero.skills[id] ?? 0) > 0 && !!SKILLS[id]?.sp && id !== 'first_aid');
  }

  private bodyR(u: Unit) { return u.kind === 'mob' ? 8 * u.m.scale : 11; }

  private idleFollow(h: HeroUnit, dt: number) {
    const lead = this.leader();
    const resting = this.heroes.some((x) => x.sitting && x.state !== 'dead');
    if (!lead) return;
    if (lead === h) {
      if (resting || this.zone.id === 'town') { this.setState(h, 'idle'); if (resting) h.doing = '휴식하는 동료 기다림'; return; }
      // a treasure chest first (expedition maps), then explore toward the nearest huntable mob
      const chest = this.chestFor(h);
      if (chest) { this.goChest(h, chest, dt); return; }
      const best = this.pullCandidate(h, Infinity);
      // 순간이동: nothing worth hunting nearby — the party blinks next to a monster elsewhere on the map
      if ((!best || dist(best, h) > 380) && this.tryTeleport(best)) return;
      h.doing = best ? '사냥감 찾는 중' : '대기';
      if (best) this.moveTo(h, best.x, best.y, h.d.moveSpd * 0.85, dt, 60);
      else this.setState(h, 'idle');
      return;
    }
    h.doing = '리더 따라가는 중';
    // formation behind the leader by position: front beside, mid behind, back further behind
    const i = this.heroes.indexOf(h);
    const pos = this.posOf(h);
    const back = pos === 'front' ? 24 : pos === 'mid' ? 48 : 72;
    const ox = -lead.facing * back;
    const oy = (i % 2 ? 20 : -16);
    this.moveTo(h, lead.x + ox, lead.y + oy, Math.max(h.d.moveSpd, lead.d.moveSpd), dt, 8);
  }

  private moveTo(u: Unit, tx: number, ty: number, spd: number, dt: number, stop: number) {
    const dx = tx - u.x, dy = ty - u.y;
    const d = Math.hypot(dx, dy);
    if (d <= stop) { if (u.state === 'walk') this.setState(u, 'idle'); return true; }
    const step = Math.min(d - stop, spd * dt / 1000);
    u.x += dx / d * step;
    u.y += dy / d * step;
    u.x = clamp(u.x, 24, this.zone.w - 24);
    u.y = clamp(u.y, 70, this.zone.h - 24);
    if (Math.abs(dx) > 2) u.facing = dx > 0 ? 1 : -1;
    this.setState(u, 'walk');
    return false;
  }

  // ───────────────────────────── skill helpers (docs/design/SKILLS_RO.md)
  hasBuff(h: HeroUnit, id: string) { return h.buffs.some((b) => b.id === id && b.until > this.time); }
  /** hiding, cloaking or playing dead */
  heroHidden(h: HeroUnit) { return h.buffs.some((b) => (b.id === 'hiding' || b.id === 'cloak' || b.id === 'playdead') && b.until > this.time); }
  /** can this monster see the hero? insects, demons and bosses sniff out hiders; only bosses see through playing dead */
  sees(m: MobUnit, h: HeroUnit) {
    if (!this.heroHidden(h)) return true;
    if (m.m.boss) return true;
    if (this.hasBuff(h, 'playdead')) return false;
    return m.m.race === 'insect' || m.m.race === 'demon';
  }
  /** alive and not hiding (a hiding monster can't be picked or hit until it shows itself or is revealed) */
  targetable(m: MobUnit | undefined): m is MobUnit { return !!m && this.alive(m) && m.hiddenUntil <= this.time; }
  private unhide(h: HeroUnit) {
    if (!h.buffs.some((b) => b.id === 'hiding' || b.id === 'cloak' || b.id === 'playdead')) return;
    h.buffs = h.buffs.filter((b) => b.id !== 'hiding' && b.id !== 'cloak' && b.id !== 'playdead');
    this.refresh(h);
    this.emit({ t: 'status', uid: h.uid, text: '모습을 드러냄', color: '#d0c8e8' });
  }
  /** monsters that can't see a hidden hero drop it */
  private lose(h: HeroUnit) { for (const m of this.mobs) if (m.target === h.uid && !this.sees(m, h)) { m.target = null; m.provokeUntil = 0; } }

  /** per step: auto berserk, the SP that hiding eats, sight blaster, reveals around sight / ruwach / detect */
  private selfEffects(h: HeroUnit) {
    if (skillOn(h.hero, 'auto_berserk')) {
      const low = h.hp < h.d.maxHp * 0.25, on = this.hasBuff(h, 'berserk');
      if (low && !on) {
        h.buffs.push({ id: 'berserk', name: '자동 광폭', lv: 1, until: this.time + 3_600_000, bonus: { atkPct: 32, vitDefPct: -55 } });
        this.refresh(h);
        this.emit({ t: 'status', uid: h.uid, text: '광폭!', color: '#ff5050' });
      } else if (!low && on) { h.buffs = h.buffs.filter((b) => b.id !== 'berserk'); this.refresh(h); }
    }
    const hide = h.buffs.find((b) => (b.id === 'hiding' || b.id === 'cloak') && b.until > this.time);
    if (hide && this.time >= h.hideDrainAt) {
      const first = h.hideDrainAt === 0;
      h.hideDrainAt = this.time + (hide.id === 'hiding' ? (4 + hide.lv) * 1000 : [500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000][hide.lv - 1]);
      if (!first) { h.sp -= 1; if (h.sp <= 0) { h.sp = 0; this.unhide(h); } }
    } else if (!hide) h.hideDrainAt = 0;
    if (this.hasBuff(h, 'sblast')) {
      const near = this.mobs.find((m) => this.targetable(m) && !this.shunned(m) && dist(m, h) < 2 * CELL + this.bodyR(m));
      if (near) {
        h.buffs = h.buffs.filter((b) => b.id !== 'sblast');
        this.emit({ t: 'skill', fx: 'magnum', from: h.uid, x: near.x, y: near.y, lv: 1, radius: 40, element: 'fire' });
        this.sound('fire');
        for (const m of this.mobs) {
          if (!this.targetable(m) || this.shunned(m) || dist(m, near) > 1.5 * CELL + this.bodyR(m)) continue;
          this.resolveMagic(h, m, 100, 'fire', 0, SKILLS.sight_blaster, 1);
          this.knock(m, h.x, h.y, 3);
        }
      }
    }
    // 성역의 오라: a lasting aura that eats 2 SP every 3 s
    if (this.hasBuff(h, 'saura') && this.time >= h.auraAt) {
      const first = h.auraAt === 0;
      h.auraAt = this.time + 3000;
      if (!first) { h.sp -= 2; if (h.sp <= 0) { h.sp = 0; h.buffs = h.buffs.filter((b) => b.id !== 'saura'); } }
    } else if (!this.hasBuff(h, 'saura')) h.auraAt = 0;
    for (const b of h.buffs) {
      if (b.until <= this.time || (b.id !== 'sight' && b.id !== 'ruwach' && b.id !== 'detect')) continue;
      this.revealAround(h, SKILLS[b.id === 'sight' ? 'sight' : b.id === 'ruwach' ? 'ruwach' : 'detect'], b.lv);
    }
  }

  /** hiding monsters near the hero show themselves (성광 burns them with holy light) */
  private revealAround(h: HeroUnit, sk: SkillDef, lv: number) {
    const r = sk.reveal?.(lv) ?? 60;
    for (const m of this.mobs) {
      if (!this.alive(m) || m.hiddenUntil <= this.time || dist(m, h) > r + this.bodyR(m)) continue;
      m.hiddenUntil = 0;
      m.hideNext = this.time + 12000;
      this.emit({ t: 'status', uid: m.uid, text: '발견!', color: '#ffe080' });
      if (sk.id === 'ruwach') this.resolveMagic(h, m, 145, 'holy', 0, sk, 1);
    }
  }

  /** hiding / playing dead: stay down (potions still heal) until patched up and nobody is looking */
  private tryLieLow(h: HeroUnit): boolean {
    const b = h.buffs.find((x) => (x.id === 'hiding' || x.id === 'playdead') && x.until > this.time);
    if (!b) return false;
    this.lose(h);
    h.target = null;
    const r = h.hp / h.d.maxHp;
    const onMe = this.mobs.some((m) => this.alive(m) && m.target === h.uid);
    if (!onMe && (r >= 0.6 || (r >= 0.4 && !this.pc.engaged.length))) { this.unhide(h); return false; }
    h.doing = b.id === 'playdead' ? '죽은 척' : '숨어서 회복 대기';
    this.setState(h, b.id === 'playdead' ? 'sit' : 'ready');
    return true;
  }

  /** escapes (hiding, play dead), cloaking for grimtooth, reveals, and the chores between fights */
  private tryUtility(h: HeroUnit): boolean {
    const list = this.enabledSkills(h, ['support']);
    if (!list.length) return false;
    const onMe = this.mobs.filter((m) => this.alive(m) && m.target === h.uid && dist(m, h) < 90);
    const engagedNear = this.pc.engaged.some((m) => dist(m, h) < 240);
    for (const { sk, lv } of list) {
      if (!this.canPay(h, sk, lv) || !this.usable(h, sk)) continue;
      const go = (target: Unit | null) => { h.doing = sk.name; this.startSkill(h, sk, lv, target); return true; };
      switch (sk.id) {
        case 'play_dead': if (onMe.length && h.hp < h.d.maxHp * 0.25) return go(h); break;
        case 'hiding': if (onMe.length && h.hp < h.d.maxHp * 0.3 && this.roleOf(h) !== 'tank' && !this.heroHidden(h)) return go(h); break;
        case 'cloaking': {
          if (this.heroHidden(h)) break;
          const grim = (h.hero.skillSlots ?? []).includes('grimtooth') && h.d.wtype === 'katar';
          if ((grim && engagedNear && h.sp > h.d.maxSp * 0.25) || (onMe.length && h.hp < h.d.maxHp * 0.3 && this.roleOf(h) !== 'tank')) return go(h);
          break;
        }
        case 'sight': case 'ruwach': case 'detect': {
          if (this.hasBuff(h, sk.id === 'sight' ? 'sight' : sk.id)) break;
          const r = (sk.reveal?.(lv) ?? 60) + 40;
          const hidden = this.mobs.some((m) => this.alive(m) && m.hiddenUntil > this.time && dist(m, h) < r);
          // keep the flames up in a fight when sightrasher is slotted (it needs them)
          const forRasher = sk.id === 'sight' && (h.hero.skillSlots ?? []).includes('sightrasher') && this.pc.engaged.length >= 2;
          if (hidden || forRasher) return go(h);
          break;
        }
        case 'aqua_benedicta': if (!engagedNear && this.time >= h.utilAt && (this.s.stacks.k_holywater ?? 0) < 10) { h.utilAt = this.time + 1200; return go(h); } break;
        case 'find_stone': if (!engagedNear && this.time >= h.utilAt && (this.s.stacks.k_stone ?? 0) < 5) { h.utilAt = this.time + 1200; return go(h); } break;
        // also used by position() when a melee monster corners a back-liner; here: a hurt fighter rolls out of a crowd
        case 'back_slide': if (onMe.length >= 2 && h.hp < h.d.maxHp * 0.3 && this.roleOf(h) !== 'tank') return go(null); break;
      }
    }
    return false;
  }

  /** 반격: brace just before a melee monster swings (tanks, or against bosses / elites, or when hurt) */
  private tryStance(h: HeroUnit, t?: MobUnit): boolean {
    const e = this.enabledSkills(h, ['tank']).find((x) => x.sk.kind === 'stance');
    // (a priority buff waiting for its SP comes first — a stance costs SP too — and the main attack keeps the SP it needs)
    if (!e || !this.canPay(h, e.sk, e.lv) || h.d.ranged || this.buffPending(h)) return false;
    if (h.sp - this.spCost(h, e.sk, e.lv) < this.reserveSp(h, t)) return false;
    const win = e.lv * 400;
    const threat = this.mobs.find((m) => {
      if (!this.alive(m) || m.target !== h.uid || m.m.range >= 60 || dist(m, h) > m.m.range + this.bodyR(m) + 16) return false;
      if (m.stunUntil > this.time || m.frozenUntil > this.time || m.stoneUntil > this.time || m.sleepUntil > this.time) return false;
      // only worth standing still for: a boss / elite / danger monster, a hurt knight, or (a tank) a blow that really hurts
      const big = (m.m.atk[0] + m.m.atk[1]) / 2 > h.d.maxHp * 0.07;
      if (!(m.m.boss || m.danger || m.elite || h.hp < h.d.maxHp * 0.5 || (this.roleOf(h) === 'tank' && big))) return false;
      const lands = m.atkReady + 220 - this.time;
      return lands > 60 && lands < win - 40;
    });
    if (!threat) return false;
    h.facing = threat.x >= h.x ? 1 : -1;
    h.doing = `${threat.m.name} — ${e.sk.name} 자세`;
    this.startSkill(h, e.sk, e.lv, threat);
    return true;
  }

  /** crowd control & debuffs, each with its own trigger (SKILLS_RO.md §0.7) */
  private tryCc(h: HeroUnit, t: MobUnit): boolean {
    if (this.buffPending(h)) return false;
    const keep = this.reserveSp(h, t);
    for (const { sk, lv } of this.enabledSkills(h, ['cc'])) {
      if (sk.sp && h.sp - this.spCost(h, sk, lv) < keep) continue; // the main skill's SP
      if (!this.canPay(h, sk, lv) || !this.usable(h, sk)) continue;
      const pick = this.ccTarget(h, t, sk, lv);
      if (!pick) continue;
      h.facing = pick.x >= h.x ? 1 : -1;
      h.doing = `${pick.m.name} — ${sk.name}`;
      this.startSkill(h, sk, lv, pick);
      return true;
    }
    return false;
  }

  private ccTarget(h: HeroUnit, t: MobUnit, sk: SkillDef, lv: number): MobUnit | undefined {
    const R = this.skillRange(h, sk, lv);
    const inR = (m: MobUnit) => dist(h, m) - this.bodyR(m) <= R;
    const free = (m: MobUnit) => this.targetable(m) && !this.shunned(m) && m.stunUntil <= this.time && m.frozenUntil <= this.time
      && m.stoneUntil <= this.time && m.sleepUntil <= this.time && m.snareUntil <= this.time;
    const eng = this.pc.engaged.filter((m) => this.targetable(m) && !this.shunned(m));
    // whatever is chasing the back line (me too, when I stand back) in melee
    const chaser = () => eng.find((m) => {
      if (!free(m) || m.m.boss || m.m.range >= 4 * CELL) return false;
      const v = this.heroUnit(m.target);
      // (alone, with nobody in front to hand it to, a monster on me is just the fight)
      return !!v && this.posOf(v) !== 'front' && (v !== h || !!this.frontLiner(h));
    });
    const near = (m: MobUnit, r: number) => eng.filter((x) => x !== m && dist(x, m) < r);
    const ownNear = (m: MobUnit, r: number) => this.grounds.some((g) => !g.done && g.owner === h.uid && g.sk.id === sk.id && dist(g, m) < r);
    switch (sk.id) {
      case 'ankle_snare': case 'skid_trap': case 'stone_curse': case 'fire_wall': case 'ice_wall': {
        const c = chaser();
        if (c && inR(c) && !ownNear(c, 40)) {
          const v = this.heroUnit(c.target);
          // a wall needs room between the monster and its prey
          if ((sk.id === 'fire_wall' || sk.id === 'ice_wall') && v && dist(c, v) < 26) return undefined;
          return c;
        }
        if (sk.id === 'ankle_snare' && free(t) && !t.m.boss && (t.m.aggressive || t.target !== null) && inR(t) && !ownNear(t, 40)) return t;
        return undefined;
      }
      case 'decrease_agi': {
        const c = chaser();
        if (c && c.agiDownUntil <= this.time && inR(c)) return c;
        // quick = the party's best hitter still misses it a lot
        const bestHit = Math.max(...this.aliveHeroes().map((a) => a.d.hit));
        const quick = (m: MobUnit) => m.m.lv + m.m.agi > bestHit + 15;
        if (free(t) && !t.m.boss && t.agiDownUntil <= this.time && inR(t) && (t.danger || t.elite || quick(t))) return t;
        return undefined;
      }
      case 'signum_crucis': {
        const ud = this.mobs.filter((m) => this.targetable(m) && !this.shunned(m) && m.crucis === 0 && dist(m, h) < (sk.radius ?? 320)
          && (this.mobElement(m) === 'undead' || m.m.race === 'demon' || m.m.race === 'undead'));
        return ud.length >= 2 || ud.some((m) => m.m.boss || m.danger) ? t : undefined;
      }
      case 'lex_divina': return eng.find((m) => free(m) && !m.m.boss && !!m.m.skills?.length && m.silenceUntil <= this.time && inR(m));
      case 'lex_aeterna': {
        if (!free(t) || t.lex || !inR(t)) return undefined;
        // only with SP left for the attack it doubles (else it eats the SP of that attack)
        const follow = this.enabledSkills(h, ['attack', 'aoe']).find((e) => !!e.sk.sp);
        if (follow && h.sp < this.spCost(h, sk, lv) + this.spCost(h, follow.sk, follow.lv)) return undefined;
        // worth a turn on the big ones: bosses, elites, danger monsters, or a monster the party's best hitter needs many swings for
        const best = Math.max(...this.aliveHeroes().map((a) => this.estimateNormal(a, t)));
        return t.m.boss || t.danger || t.elite || t.hp > best * 15 ? t : undefined;
      }
      case 'quagmire': {
        const m = eng.find((x) => !x.m.boss && x.quagUntil <= this.time && near(x, 60).length >= 1 && inR(x));
        return m && !ownNear(m, 50) ? m : undefined;
      }
      case 'frost_nova': return this.mobs.filter((m) => this.targetable(m) && m.target === h.uid && m.m.range < 60 && dist(m, h) < 50 && m.frozenUntil <= this.time).length >= 2 ? t : undefined;
      case 'arrow_repel': return this.mobs.find((m) => this.targetable(m) && !m.m.boss && m.target === h.uid && m.m.range < 60 && dist(m, h) < 60);
      case 'shockwave_trap': return t.m.skills?.length && inR(t) && !ownNear(t, 50) ? t : undefined;
      case 'sandman': case 'flasher': {
        const m = eng.find((x) => free(x) && !x.m.boss && near(x, 50).length >= 1 && inR(x));
        return m && !ownNear(m, 50) ? m : undefined;
      }
    }
    // other debuffs with a status (ankle-snare style): the back line's chaser first, else a dangerous target
    if (!sk.status) return undefined;
    const c = chaser();
    if (c && inR(c)) return c;
    return free(t) && !t.m.boss && (t.m.aggressive || t.target !== null) && inR(t) ? t : undefined;
  }

  private skillRange(h: HeroUnit, sk: SkillDef, lv = 1) {
    if (sk.id === 'spear_boomerang') return (1 + lv * 2) * CELL;
    if (sk.id === 'grimtooth') return (2 + lv) * CELL;
    if (sk.id === 'spear_stab') return 3 * CELL;
    if (sk.kind === 'selfAoe') return (sk.radius ?? 60) * 0.6;
    if (sk.range) return sk.range;
    return h.d.range;
  }

  /** the radius a skill's area covers (ground effects use their spec); 폭풍의 눈 / 질주 카트 widen the caster's */
  private areaR(sk: SkillDef, lv: number, h?: HeroUnit) {
    if (sk.id === 'brandish') return (Math.min(4, Math.ceil(lv / 3)) + 1) * CELL * 0.9;
    const r = sk.ground ? sk.ground.r(lv) : sk.radius ?? 60;
    return r * (h ? this.areaMul(h, sk) : 1);
  }
  private areaMul(h: HeroUnit, sk: SkillDef) {
    const eye = this.sig(h, 'storm_eye'), cart = this.sig(h, 'cart_rush');
    if (eye && sk.magic && (sk.kind === 'aoe' || sk.kind === 'selfAoe' || sk.kind === 'ground') && sk.auto === 'aoe') return 1 + eye * 0.06;
    if (cart && sk.id === 'cart_revolution') return 1 + cart * 0.1;
    return 1;
  }

  // ───────────────────────────── build signature skills (docs/design/SKILLS_META.md)
  /** a learned signature skill's level (0 = not learned) */
  private sig(h: HeroUnit, id: string) { return h.hero.skills[id] ?? 0; }
  /** packs: 소용돌이 베기 (bowling bash), 질주 카트 (cart revolution), 폭풍의 눈 (area spells) — more damage per extra target */
  private crowdMul(h: HeroUnit, sk: SkillDef, n: number) {
    if (n < 2) return 1;
    if (sk.id === 'bowling_bash') { const w = this.sig(h, 'whirl_cut'); return 1 + w * 0.06 * Math.min(4, n - 1); }
    if (sk.id === 'cart_revolution') { const c = this.sig(h, 'cart_rush'); return 1 + c * 0.08 * Math.min(5, n - 1); }
    const eye = this.sig(h, 'storm_eye');
    if (eye && sk.magic && n > 2) return 1 + Math.min(0.2, eye * 0.02 * (n - 2));
    return 1;
  }
  /** 원소 공명: an attack spell of another element than the last one raises the resonance (to 3), the same one breaks it */
  private resonate(h: HeroUnit, sk: SkillDef, el: Element) {
    const lv = this.sig(h, 'elem_resonance');
    if (!lv || !sk.magic || (sk.auto !== 'attack' && sk.auto !== 'aoe')) return 1;
    h.reso = h.lastEl && h.lastEl !== el ? Math.min(3, h.reso + 1) : 0;
    h.lastEl = el;
    if (h.reso > 0) this.emit({ t: 'status', uid: h.uid, text: `공명 ${h.reso}`, color: '#a0e0ff' });
    return 1 + lv * 0.04 * h.reso;
  }
  /** 속성 전환: the element (fire / water / earth / wind) that hurts this monster most, if it beats `cur` */
  private weakEl(t: MobUnit, cur: Element): Element {
    const me = this.mobElement(t);
    let best = cur, bm = elementMod(cur, me);
    for (const e of ['fire', 'water', 'earth', 'wind'] as Element[]) { const v = elementMod(e, me); if (v > bm) { bm = v; best = e; } }
    return best;
  }
  /** 성역의 오라: the damage cut a priest's aura gives this hero (the strongest one in reach) */
  private auraCut(a: HeroUnit) {
    let cut = 0;
    for (const p of this.heroes) {
      if (p.state === 'dead' || !this.hasBuff(p, 'saura') || dist(p, a) > 220) continue;
      cut = Math.max(cut, this.sig(p, 'sanct_aura') * 0.03);
    }
    return cut;
  }
  /** 질풍 보법 · 그림자 분신: what a dodge sets off */
  private onDodge(t: HeroUnit, m: MobUnit) {
    if (this.sig(t, 'gale_step') && t.d.wtype === 'sword2h') t.gale = this.time + 3000;
    const sc = this.sig(t, 'shadow_clone');
    if (sc && !t.d.ranged && m.m.range < 60 && !this.shunned(m) && this.rng() < sc * 0.08) {
      this.emit({ t: 'status', uid: t.uid, text: '그림자 분신!', color: '#b0a0e0' });
      this.after(90, () => { if (this.alive(m) && t.state !== 'dead') this.resolvePhys(t, m, 100, t.d.weaponElement, 0, true, 'slash'); });
    }
  }
  /** 매의 일격: one big single-target dive (a blitz hit × 2–4.5, fixed damage, no splash) */
  private falconDive(h: HeroUnit, t: MobUnit, sk: SkillDef, lv: number) {
    const fly = Math.max(160, dist(h, t) / 0.8);
    this.emit({ t: 'shot', from: h.uid, to: t.uid, kind: 'falcon', dur: fly, element: 'neutral' });
    this.sound('arrow');
    const sd = h.d.b.skillDmg ?? {};
    const per = sk.fixed!(lv, this.fixedCtx(h)) * (1 + ((sd.blitz_beat ?? 0) + (sd.falcon_strike ?? 0)) / 100);
    this.lexPacket(t, fly + 200);
    this.after(fly, () => {
      if (!this.alive(t)) return;
      this.emit({ t: 'skill', fx: 'falconstrike', from: h.uid, to: t.uid, x: t.x, y: t.y, lv });
      this.emit({ t: 'shake', power: 2.5 });
      this.sound('crit');
      this.dealFixed(h, t, per, 'neutral', 0, 'claw', 'crit');
    });
  }
  /** extra bolts: 고속 영창 Lv 5 (+1 fire / cold / lightning bolt), 영혼 폭주 (+1 soul strike per 2 levels on ghosts and undead) */
  private extraBolts(h: HeroUnit, sk: SkillDef, t: MobUnit) {
    if (QUICK_BOLTS.has(sk.id)) return this.sig(h, 'quick_chant') >= 5 ? 1 : 0;
    if (sk.id === 'soul_strike') {
      const me = this.mobElement(t);
      return (me === 'ghost' || me === 'undead' || t.m.race === 'undead') && this.sig(h, 'soul_surge') >= 3 ? 1 : 0;
    }
    return 0;
  }
  /** the weapon itself is poison-element (독사의 송곳니), not just enchanted */
  private poisonBlade(h: HeroUnit) {
    const uid = h.hero.equip.weapon;
    const inst = uid === undefined ? undefined : this.s.equips.find((e) => e.uid === uid);
    return !!inst && ITEMS[inst.id]?.element === 'poison';
  }
  /** catalysts — 퇴마의 서약 Lv 5 frees magnus of its blue gemstone */
  private catalystFor(h: HeroUnit, sk: SkillDef, lv: number) {
    const c = sk.catalyst;
    if (!c || (c.from && lv < c.from)) return null;
    if (sk.id === 'magnus' && this.sig(h, 'exorcist_vow') >= 5) return null;
    return c;
  }

  private canAfford(h: HeroUnit, sk: SkillDef, lv: number, t?: MobUnit) {
    if (sk.sp && h.sp < this.spCost(h, sk, lv, t)) return false;
    if (sk.hpCost && h.hp <= sk.hpCost(lv) + 5) return false;
    if (sk.zeny && this.s.zeny < this.zenyCost(h, sk, lv)) return false;
    const c = this.catalystFor(h, sk, lv);
    if (c && (this.s.stacks[c.id] ?? 0) < c.n) return false;
    return true;
  }

  /** M12: a skill's damage % with the hero's per-skill gear bonuses */
  private skMult(h: HeroUnit, sk: SkillDef, lv: number) {
    // 균열 결계 also halves 금화 강타 (the build tree counts it as fixed damage)
    const ward = sk.id === 'mammonite' || sk.id === 'gold_storm' ? this.rift?.mods.fixedMul ?? 1 : 1;
    let m = sk.mult ? sk.mult(lv) : 100;
    if (sk.id === 'moon_slash') m += h.d.total.luk * 3; // (15×Lv + LUK×3)%: a crit knight's swing, weak without LUK
    // 황금 폭풍: the area version of the 금화 강타 the hero knows — as strong as its level
    if (sk.id === 'gold_storm') m = SKILLS.mammonite.mult!(Math.max(1, h.hero.skills.mammonite ?? 1)) * (1 + lv * 0.04);
    if (sk.id === 'cart_revolution') m += (h.hero.skills.enlarge_weight ?? 0) * 10; // the cart's weight
    return m * (1 + (h.d.b.skillDmg?.[sk.id] ?? 0) / 100) * ward;
  }
  /** SP a cast costs (영혼 폭주 makes soul strike cheaper, 빙뢰 공명 lightning at a frozen target) */
  private spCost(h: HeroUnit, sk: SkillDef, lv: number, t?: MobUnit) {
    const n = sk.sp!(lv);
    if (sk.id === 'soul_strike') return Math.ceil(n * (1 - this.sig(h, 'soul_surge') * 0.02));
    if (sk.id === 'pierce' && this.hasBuff(h, 'ironstance')) return n - 1; // 철벽 자세
    if (sk.id === 'arrow_shower') return n - this.sig(h, 'storm_arrows'); // 폭우의 화살
    if (sk.id === 'grimtooth') return Math.max(1, n - Math.floor(this.sig(h, 'dark_hunt') / 2)); // 어둠 사냥
    if (t && sk.element === 'wind' && sk.magic && t.frozenUntil > this.time) return Math.ceil(n * (1 - this.sig(h, 'frost_thunder') * 0.08));
    return n;
  }
  private zenyCost(h: HeroUnit, sk: SkillDef, lv: number) {
    // 황금 폭풍 costs twice the hero's 금화 강타
    if (sk.id === 'gold_storm') return Math.round(SKILLS.mammonite.zeny!(Math.max(1, h.hero.skills.mammonite ?? 1)) * 2 * (1 + (h.d.b.zenyCostPct ?? 0) / 100));
    return Math.round(sk.zeny!(lv) * (1 + (h.d.b.zenyCostPct ?? 0) / 100));
  }

  private canPay(h: HeroUnit, sk: SkillDef, lv: number) {
    if (!this.canAfford(h, sk, lv)) return false;
    if ((h.cds[sk.id] ?? 0) > this.time) return false;
    if (sk.weapon && !sk.weapon.includes(h.d.wtype)) return false;
    return true;
  }

  /** a skill's own condition: hidden (grimtooth), mounted (brandish), Sight up (sightrasher) */
  private usable(h: HeroUnit, sk: SkillDef) {
    if (sk.needs === 'hidden') return this.heroHidden(h) && !this.hasBuff(h, 'playdead');
    if (sk.needs === 'mounted') return h.d.mounted;
    if (sk.needs === 'sight') return this.hasBuff(h, 'sight');
    // hiding / playing dead: nothing but grimtooth (cloaking may still fight)
    if (this.heroHidden(h) && !this.hasBuff(h, 'cloak') && sk.kind !== 'selfBuff') return false;
    return true;
  }

  /** the slotted active skills of these roles, slot order = priority (card-granted skills need no slot) */
  private enabledSkills(h: HeroUnit, roles: string[]) {
    const out: { sk: SkillDef; lv: number }[] = [];
    const seen = new Set<string>();
    for (const id of h.hero.skillSlots ?? []) {
      if (!id || seen.has(id)) continue;
      const sk = SKILLS[id], lv = h.hero.skills[id] ?? 0;
      if (!sk || lv <= 0 || !roles.includes(sk.auto)) continue;
      out.push({ sk, lv });
      seen.add(id);
    }
    // skills granted by equipped cards (e.g. a heal Lv1 card) are gear effects: always on, after the slotted ones
    for (const uid of Object.values(h.hero.equip)) {
      const inst = this.s.equips.find((e) => e.uid === uid);
      for (const c of inst?.cards ?? []) {
        const g = c ? CARD_SKILLS[c] : undefined;
        if (!g || seen.has(g.skill) || !roles.includes(SKILLS[g.skill]?.auto)) continue;
        out.push({ sk: SKILLS[g.skill], lv: g.lv });
        seen.add(g.skill);
      }
    }
    return out;
  }

  private trySupport(h: HeroUnit): boolean {
    // resurrection (and redemptio) beat everything else
    for (const { sk, lv } of this.enabledSkills(h, ['revive'])) {
      if (!this.canPay(h, sk, lv)) continue;
      const dead = this.heroes.filter((x) => x.state === 'dead' && x !== h && dist(x, h) < 300);
      if (sk.id === 'redemptio') {
        if (dead.length >= 2 || (dead.length >= 1 && this.heroes.length === 2 && h.hp < h.d.maxHp * 0.5)) { h.doing = sk.name; this.startSkill(h, sk, lv, h); return true; }
        continue;
      }
      if (dead[0]) { h.doing = `${sk.name} → ${dead[0].hero.name}`; this.startSkill(h, sk, lv, dead[0]); return true; }
    }
    // heal (성역 for a hurt group)
    for (const { sk, lv } of this.enabledSkills(h, ['heal'])) {
      if (!this.canPay(h, sk, lv)) continue;
      if (sk.kind === 'ground') {
        if (this.grounds.some((g) => !g.done && g.owner === h.uid && g.sk.id === sk.id)) continue;
        const hurt = this.aliveHeroes().filter((a) => a.hp / a.d.maxHp * 100 < h.hero.auto.healPct);
        if (hurt.length < 2) continue;
        const worst = hurt.reduce((a, b) => (a.hp / a.d.maxHp <= b.hp / b.d.maxHp ? a : b));
        if (hurt.filter((a) => dist(a, worst) < 70).length < 2 || dist(worst, h) > 230) continue;
        h.doing = `${sk.name} → ${worst.hero.name}`;
        this.startSkill(h, sk, lv, worst);
        return true;
      }
      // first aid's 5 HP only matters to a fresh novice; past that it just eats a turn
      if (sk.id === 'first_aid' && 5 < h.d.maxHp * 0.05) continue;
      // battle priests and tanks keep swinging and heal in an emergency (themselves a bit earlier); healers and
      // exorcists use the set threshold
      const role = this.roleOf(h);
      const fighter = role === 'melee' || role === 'tank';
      const amt = sk.kind === 'heal' ? this.healAmount(h, lv) : 5;
      let best: HeroUnit | undefined; let br = 1;
      const pool = sk.id === 'first_aid' ? [h] : this.aliveHeroes();
      for (const a of pool) {
        const r = a.hp / a.d.maxHp;
        const pct = sk.id === 'first_aid' ? 50 : fighter ? (a === h ? Math.min(h.hero.auto.healPct, 60) : Math.min(h.hero.auto.healPct, 45)) : h.hero.auto.healPct;
        // don't spend SP topping up a scratch: wait until most of a heal would land, unless it's an emergency
        const worth = r < 0.35 || a.d.maxHp - a.hp >= amt * 0.6;
        if (r * 100 < pct && worth && r < br && dist(a, h) < 260) { br = r; best = a; }
      }
      if (best) { h.doing = best === h ? `${sk.name} (자신)` : `${sk.name} → ${best.hero.name}`; this.startSkill(h, sk, lv, best); return true; }
    }
    // cures and protective walls (safety wall, pneuma)
    if (this.tryCure(h)) return true;
    if (this.tryWard(h)) return true;
    // buffs (only when not being chased hard)
    const pressed = this.mobs.some((m) => m.target === h.uid && this.alive(m) && dist(m, h) < 40);
    if (pressed && h.hp < h.d.maxHp * 0.5) return false;
    const pending = this.buffPending(h);
    // buffs slotted after the main attack leave it the SP it needs
    const ht = this.mob(h.target);
    const keep = this.reserveSp(h, ht && this.targetable(ht) ? ht : undefined);
    const slots = h.hero.skillSlots ?? [];
    const mainAt = keep ? slots.indexOf(this.enabledSkills(h, ['attack', 'aoe'])[0]?.sk.id ?? '') : -1;
    for (const { sk, lv } of this.enabledSkills(h, ['buff'])) {
      if (!sk.buff || !this.usable(h, sk)) continue;
      if (keep && mainAt >= 0 && sk.sp && (slots.indexOf(sk.id) < 0 || slots.indexOf(sk.id) > mainAt) && h.sp - this.spCost(h, sk, lv) < keep) continue;
      // a self buff ahead in the slots is waiting for its SP: the buffs after it don't take that SP
      if (!this.canPay(h, sk, lv)) { if (pending && !sk.buff.party && !sk.buff.ally && this.buffShort(h, sk, lv)) break; continue; }
      const bid = sk.buff.id;
      const lacks = (a: HeroUnit) => {
        const b = a.buffs.find((x) => x.id === bid);
        return !b || b.until - this.time < 4000 || (b.shieldMax !== undefined && !((b.shield ?? 0) > 0)) || (bid === 'blessing' && this.hasBuff(a, 'curse'));
      };
      if (sk.buff.ally) {
        const pick = this.allyFor(h, sk, lacks);
        if (pick) { h.doing = pick === h ? sk.name : `${sk.name} → ${pick.hero.name}`; this.startSkill(h, sk, lv, pick); return true; }
        continue;
      }
      if (!this.buffWanted(h, sk)) continue;
      const targets = sk.kind === 'selfBuff' || !sk.buff.party ? [h] : this.aliveHeroes();
      if (targets.some(lacks)) { h.doing = sk.name; this.startSkill(h, sk, lv, sk.kind === 'selfBuff' ? h : null); return true; }
    }
    return false;
  }

  /** who gets a single-target ("friend") buff: kyrie on whoever is being hit, impositio / aspersio on the weapon users… */
  private allyFor(h: HeroUnit, sk: SkillDef, lacks: (a: HeroUnit) => boolean): HeroUnit | undefined {
    let list = this.aliveHeroes().filter((a) => dist(a, h) < 260 && lacks(a));
    const physical = (a: HeroUnit) => { const r = this.roleOf(a); return r === 'tank' || r === 'melee' || r === 'ranged'; };
    switch (sk.id) {
      case 'kyrie': list = list.filter((a) => this.roleOf(a) === 'tank' || this.mobs.some((m) => this.alive(m) && m.target === a.uid)); break;
      case 'impositio': list = list.filter(physical); break;
      case 'aspersio': if (!this.holyHelps()) return undefined; list = list.filter((a) => physical(a) && (a.d.weaponElement !== 'holy' || a.buffs.some((b) => b.id === 'aspersio'))); break;
      case 'suffragium': list = list.filter((a) => a !== h && this.roleOf(a) === 'caster'); break;
    }
    const score = (a: HeroUnit) => (sk.id === 'blessing' && this.hasBuff(a, 'curse') ? -1000 : 0) + (this.roleOf(a) === 'tank' ? -50 : 0) + dist(a, h) * 0.1;
    return list.sort((a, b) => score(a) - score(b))[0];
  }

  /** the monsters here are weak to holy (undead, shadow…): worth a holy weapon */
  private holyHelps(): boolean {
    const els = this.pc.engaged.length ? this.pc.engaged.map((m) => this.mobElement(m)) : this.zone.mobs.map((e) => MONSTERS[e.id].element);
    return els.length > 0 && els.filter((e) => elementMod('holy', e) > 1).length / els.length >= 0.5;
  }

  /** a self buff slotted ahead of the main attack (the player put it first) is down and SP is short of it: save up
   *  (attacks, stances, control and the buffs after it wait — heals and revives don't) */
  private buffPending(h: HeroUnit): boolean {
    for (const id of h.hero.skillSlots ?? []) {
      const sk = id ? SKILLS[id] : undefined, lv = id ? h.hero.skills[id] ?? 0 : 0;
      if (!sk || lv <= 0) continue;
      if (sk.auto === 'attack' || sk.auto === 'aoe') return false; // only buffs before the first attack
      // (a self buff, or a one-target buff that isn't meant for an ally: 맹독 부여 on the assassin's own blade)
      if (sk.auto === 'buff' && (sk.kind === 'selfBuff' || (sk.kind === 'buff' && !sk.buff?.party && !sk.buff?.ally)) && this.buffShort(h, sk, lv)) return true;
    }
    return false;
  }
  /** this self buff is down (or about to drop), wanted now, and only SP keeps it from going up */
  private buffShort(h: HeroUnit, sk: SkillDef, lv: number): boolean {
    // (barriers are spent by being hit — waiting for one under fire would stall everything)
    // (nor auras and calls that are about the party or the pack, not this hero's own strength)
    if (!sk.buff?.dur || !sk.sp || sk.buff.shieldPct || sk.buff.id === 'mbarrier' || sk.buff.id === 'saura' || sk.buff.id === 'whistle') return false;
    const cost = this.spCost(h, sk, lv);
    if (h.sp >= cost || cost > h.d.maxSp * 0.6 || (h.cds[sk.id] ?? 0) > this.time || (sk.weapon && !sk.weapon.includes(h.d.wtype))) return false;
    const b = h.buffs.find((x) => x.id === sk.buff!.id);
    return (!b || b.until - this.time < 4000) && this.buffWanted(h, sk);
  }

  /** party / self buffs that only make sense in some fights */
  private buffWanted(h: HeroUnit, sk: SkillDef): boolean {
    switch (sk.id) {
      case 'sacrament': {
        const eng = this.pc.engaged;
        if (!eng.length) return false;
        const mod = (arm: Element) => eng.reduce((a, m) => a + elementMod(m.m.atkElement ?? 'neutral', arm), 0) / eng.length;
        return mod('holy') < mod(h.d.armorElement) * 0.9;
      }
      case 'poison_react': return this.mobs.some((m) => this.alive(m) && m.target === h.uid && m.m.range < 60);
      case 'sight_blaster': return this.pc.engaged.length > 0 || this.roleOf(h) === 'caster';
      // signature buffs (SKILLS_META.md)
      case 'element_shift': return this.pc.engaged.length > 0;
      // the barrier is paid from the SP the spells need: only from a full-ish pool, when something is on the wizard or it is hurt
      case 'mana_barrier': return h.sp > h.d.maxSp * 0.5 && (h.hp < h.d.maxHp * 0.85 || this.mobs.some((m) => this.alive(m) && m.target === h.uid && dist(m, h) < m.m.range + 60));
      case 'sanct_aura': return this.pc.engaged.length > 0 || this.aliveHeroes().length > 1;
      case 'drover_whistle': {
        // 몰이: worth a whistle when at least two monsters around would come over (and we can take them)
        if (h.hp < h.d.maxHp * 0.45 || !this.pc.engaged.length) return false;
        const loose = this.mobs.filter((m) => this.targetable(m) && !this.shunned(m) && m.target !== h.uid && !m.m.boss && dist(m, h) < (sk.radius ?? 200)).length;
        return loose >= 2;
      }
    }
    return true;
  }

  /** 치료 · 해독 · 해독 지연 · 상태 회복 */
  private tryCure(h: HeroUnit): boolean {
    for (const { sk, lv } of this.enabledSkills(h, ['support'])) {
      if (sk.kind !== 'cure' || !this.canPay(h, sk, lv)) continue;
      const need = (a: HeroUnit) => sk.id === 'cure' ? this.hasBuff(a, 'blind')
        : sk.id === 'detoxify' ? a.poisonUntil > this.time
        : sk.id === 'slow_poison' ? a.poisonUntil > this.time + 2000 && a.slowPoisonUntil <= this.time
        : sk.id === 'status_recovery' ? this.hasBuff(a, 'curse') || this.hasBuff(a, 'blind') : false;
      const a = this.aliveHeroes().find((x) => need(x) && dist(x, h) < 260);
      if (a) { h.doing = `${sk.name} → ${a.hero.name}`; this.startSkill(h, sk, lv, a); return true; }
    }
    return false;
  }

  /** 수호벽 under a hero in melee trouble, 장막 under one being shot */
  private tryWard(h: HeroUnit): boolean {
    for (const { sk, lv } of this.enabledSkills(h, ['support'])) {
      if (sk.kind !== 'ground' || !this.canPay(h, sk, lv)) continue;
      const melee = sk.id !== 'pneuma';
      const victim = this.aliveHeroes().find((a) => dist(a, h) < 230 && !this.inWard(a, melee) && (!melee || a.hp < a.d.maxHp * 0.75 || this.posOf(a) !== 'front')
        && this.mobs.some((m) => this.alive(m) && m.target === a.uid && (melee
          ? m.m.range < 4 * CELL && dist(m, a) < m.m.range + this.bodyR(m) + 20
          : m.m.range >= 4 * CELL && dist(m, a) < m.m.range + 40)));
      if (!victim) continue;
      h.doing = `${sk.name} → ${victim.hero.name}`;
      this.startSkill(h, sk, lv, victim);
      return true;
    }
    return false;
  }
  /** standing in a safety wall (melee) or pneuma (ranged)? */
  inWard(a: { x: number; y: number }, melee: boolean): GroundFx | undefined {
    return this.grounds.find((g) => !g.done && (melee ? g.sk.id === 'safety_wall' || g.sk.id === 'pr_safety_wall' : g.sk.id === 'pneuma') && Math.hypot(g.x - a.x, g.y - a.y) <= g.r + 6);
  }

  private tryProvoke(h: HeroUnit): boolean {
    const e = this.enabledSkills(h, ['tank']).find((x) => x.sk.id === 'provoke');
    if (!e || this.roleOf(h) !== 'tank') return false;
    const { sk, lv } = e;
    if (!this.canPay(h, sk, lv)) return false;
    const loose = this.mobs.find((m) => this.targetable(m) && !this.shunned(m) && m.target !== null && m.target !== h.uid && this.heroUnit(m.target) && dist(m, h) < 180 && m.provokeUntil < this.time);
    if (!loose) return false;
    h.facing = loose.x >= h.x ? 1 : -1;
    this.startSkill(h, sk, lv, loose);
    return true;
  }

  /** an area skill (by kind, or a damaging ground / trap) */
  private isArea(sk: SkillDef) {
    // napalm beat & co (role attack) are aimed at one target and splash; only aoe-role skills wait for a pack
    return sk.auto === 'aoe' && (sk.kind === 'aoe' || sk.kind === 'selfAoe' || sk.kind === 'ground' || sk.kind === 'trap');
  }
  /** how many monsters an area skill aimed at t would catch */
  private countArea(h: HeroUnit, t: MobUnit, sk: SkillDef, lv: number) {
    const self = sk.kind === 'selfAoe';
    const cx = self ? h.x : t.x, cy = self ? h.y : t.y, r = this.areaR(sk, lv, h);
    let n = 0;
    for (const m of this.mobs) {
      if (!this.alive(m) || this.shunned(m) || (m.hiddenUntil > this.time && !sk.reveal)) continue;
      if (sk.undeadOnly && !this.unholy(m)) continue;
      if (sk.id === 'venom_dust' && !this.poisonable(m)) continue;
      if (sk.id === 'spear_stab') { if (this.segDist(m, h.x, h.y, t.x + (t.x - h.x) * 0.3, t.y + (t.y - h.y) * 0.3) <= 20 + this.bodyR(m)) n++; continue; }
      if (Math.hypot(m.x - cx, m.y - cy) <= r + this.bodyR(m) * 0.5) n++;
    }
    return n;
  }
  /** undead element or demon race: what magnus and sanctuary burn */
  unholy(m: MobUnit) { return this.mobElement(m) === 'undead' || m.m.element === 'undead' || m.m.race === 'demon'; }
  private poisonable(m: MobUnit) { return !m.m.boss && m.m.element !== 'undead' && m.m.race !== 'formless' && m.poisonUntil <= this.time; }

  /** skill-specific conditions before the AI picks an attack */
  private skillFits(h: HeroUnit, t: MobUnit, sk: SkillDef, lv: number): boolean {
    const ownNear = (r: number) => this.grounds.some((g) => !g.done && g.owner === h.uid && g.sk.id === sk.id && dist(g, t) < r);
    switch (sk.id) {
      case 'turn_undead': return this.mobElement(t) === 'undead';
      case 'charge_attack': return dist(h, t) > 3 * CELL + this.bodyR(t);
      case 'venom_splasher': return t.poisonUntil > this.time && t.hp < t.maxHp * 0.75 && !t.m.boss;
      case 'throw_stone': return !t.m.boss || t.hp > 50;
      // 빙결: never on ice (the bolt would shatter it — that's for lightning); on what can't freeze only as the last resort
      case 'frost_diver':
        if (t.frozenUntil > this.time) return false;
        if (t.m.boss || t.m.element === 'undead') return !this.enabledSkills(h, ['attack']).some((e) => e.sk.id !== 'frost_diver' && !!e.sk.magic);
        return true;
    }
    if (sk.kind === 'ground' || sk.kind === 'trap') return !ownNear(sk.kind === 'trap' ? 30 : this.areaR(sk, lv, h) * 0.6);
    return true;
  }

  private chooseSkill(h: HeroUnit, t: MobUnit): { sk: SkillDef; lv: number } | null {
    const tac = this.tactics(h).skills;
    // conserve: offensive skills only while SP ≥ 50% (heals/buffs/CC are separate)
    if (tac === 'conserve' && h.sp < h.d.maxSp * 0.5) return null;
    // heal sears the undead (RO): offered as an attack (at its slot's place) while the target is undead-element
    const undead = this.mobElement(t) === 'undead';
    let list = this.enabledSkills(h, ['attack', 'aoe', 'heal'])
      .filter(({ sk, lv }) => (sk.auto !== 'heal' || (undead && sk.kind === 'heal')) && this.canPay(h, sk, lv) && this.usable(h, sk));
    if (!list.length) return null;
    // a spell the target resists goes after the slotted ones it doesn't (stable: slot order otherwise); 원소 공명 (wz_elem)
    // also puts another element than the last spell first
    {
      const me = this.mobElement(t), reso = this.sig(h, 'elem_resonance') > 0;
      const key = ({ sk }: { sk: SkillDef }) => {
        if (!sk.magic || !sk.element) return 0;
        return (elementMod(sk.element, me) < 1 ? 4 : 0) + (reso && sk.element === h.lastEl ? 2 : 0);
      };
      list = list.map((e, i) => ({ e, i })).sort((a, b) => key(a.e) - key(b.e) || a.i - b.i).map((x) => x.e);
    }
    const est = this.estimateNormal(h, t);
    // don't waste single-target skills on nearly-dead targets
    const nearlyDead = t.hp <= est * 1.1 && !t.m.boss && tac !== 'aggressive';
    // casters save area spells for real packs unless told to go all out
    const minAoe = tac === 'aggressive' ? 2 : this.roleOf(h) === 'caster' ? 3 : 2;
    const weakOk = h.d.ranged || CLASSES[h.hero.cls].ranged || tac === 'aggressive';
    const areaOk = (sk: SkillDef, lv: number) => this.areaOk(h, t, sk, lv);
    // the first slotted attack is the build's main skill: its SP is kept for it (normal attacks meanwhile)
    const pending = this.buffPending(h);
    const hold = this.mainHold(h, t);
    const keep = this.reserveSp(h, t);
    const mainId = this.enabledSkills(h, ['attack', 'aoe'])[0]?.sk.id;
    // 스킬 슬롯: the first slotted skill (left first) whose conditions hold
    for (const e of list) {
      const { sk, lv } = e;
      if (pending && sk.sp) continue;
      if (sk.sp && sk.id !== mainId && h.sp - this.spCost(h, sk, lv, t) < keep) continue;
      if (hold === 'pack' && sk.sp && !this.isArea(sk)) continue;
      if (!this.skillFits(h, t, sk, lv)) continue;
      if (this.isArea(sk)) {
        if (areaOk(sk, lv)) return e;
        // RO: bowling bash is a two-hit blow on its target as well, grimtooth a stab from hiding — worth it alone
        if (sk.id !== 'bowling_bash' && sk.id !== 'grimtooth') continue;
      }
      if (nearlyDead) continue;
      if (sk.kind !== 'heal' && !weakOk && this.estimateSkill(h, t, sk, lv) < est * 1.15) continue;
      return e;
    }
    return null;
  }

  /** an area skill would catch enough here (casters wait for 3, everyone else for 2; grounds go on a lone boss) */
  private areaOk(h: HeroUnit, t: MobUnit, sk: SkillDef, lv: number) {
    const tac = this.tactics(h).skills;
    const minAoe = tac === 'aggressive' ? 2 : this.roleOf(h) === 'caster' ? 3 : 2;
    const n = this.countArea(h, t, sk, lv);
    const need = sk.undeadOnly ? Math.min(minAoe, 2) : minAoe;
    return n >= need || (n >= 1 && (t.m.boss || t.danger) && sk.kind === 'ground');
  }
  /**
   * The first slotted attack is the build's main skill: the SP it needs is kept for it (0 = nothing to keep). Cheaper
   * attacks, control, stances and the buffs slotted after it only spend what is above that — builds whose key skill costs
   * more than their cheap fillers kept starving it. Without a target only a single-target main skill keeps its SP.
   */
  private reserveSp(h: HeroUnit, t?: MobUnit): number {
    const main = this.enabledSkills(h, ['attack', 'aoe'])[0];
    if (!main?.sk.sp) return 0;
    const { sk, lv } = main, cost = this.spCost(h, sk, lv, t);
    if (cost > h.d.maxSp * 0.6 || (h.cds[sk.id] ?? 0) > this.time + 1000 || (sk.weapon && !sk.weapon.includes(h.d.wtype)) || !this.usable(h, sk)) return 0;
    const area = this.isArea(sk) && sk.id !== 'bowling_bash' && sk.id !== 'grimtooth';
    if (!t) return area ? 0 : cost;
    if (!this.skillFits(h, t, sk, lv)) return 0;
    if (area && !this.areaOk(h, t, sk, lv) && !this.packNear(h, sk)) return 0;
    return cost;
  }
  /** enough of a pack on the party, near this hero, for an area skill (even before it bunches up) */
  private packNear(h: HeroUnit, sk: SkillDef) {
    const tac = this.tactics(h).skills;
    const minAoe = tac === 'aggressive' ? 2 : this.roleOf(h) === 'caster' ? 3 : 2;
    return this.pc.engaged.filter((m) => dist(m, h) < 260).length >= (sk.undeadOnly ? 2 : minAoe);
  }
  /** 'pack': an area main skill with a pack on the party that hasn't bunched up yet — single-target skills wait for it */
  private mainHold(h: HeroUnit, t: MobUnit): 'sp' | 'pack' | null {
    const main = this.enabledSkills(h, ['attack', 'aoe'])[0];
    if (!main?.sk.sp) return null;
    const { sk, lv } = main, cost = this.spCost(h, sk, lv);
    if (cost > h.d.maxSp * 0.6 || (h.cds[sk.id] ?? 0) > this.time || (sk.weapon && !sk.weapon.includes(h.d.wtype)) || !this.usable(h, sk) || !this.skillFits(h, t, sk, lv)) return null;
    const area = this.isArea(sk) && sk.id !== 'bowling_bash' && sk.id !== 'grimtooth';
    if (!area) return h.sp < cost ? 'sp' : null;
    const pack = this.packNear(h, sk);
    const ok = this.areaOk(h, t, sk, lv);
    if (h.sp < cost) return ok || pack ? 'sp' : null;
    return !ok && pack ? 'pack' : null;
  }

  private estimateNormal(h: HeroUnit, t: MobUnit) {
    const d = h.d;
    const el = elementMod(d.weaponElement, this.mobElement(t));
    const avg = d.statusAtk + d.watk * 0.9 * this.sizeOf(h, d.wtype, t) + d.ammoAtk + d.bonusAtk;
    return Math.max(1, avg * el * (100 - t.m.def) / 100 + (d.refineAtk + d.masteryAtk + (d.b.raceAtk?.[t.m.race] ?? 0)) * el);
  }

  /** the weapon's size modifier — 무기 완벽화 ignores it, a mounted spear hits medium monsters fully */
  private sizeOf(h: HeroUnit, w: WeaponType, t: MobUnit) {
    if (h.d.b.ignoreSize) return 1;
    if (w === 'spear' && h.d.b.mountSpear && t.m.size === 'medium') return 1;
    return sizeMod(w, t.m.size);
  }

  private healAmount(h: HeroUnit, lv: number) {
    return Math.floor((h.hero.baseLv + h.d.total.int) / 8) * (4 + lv * 8) * (1 + (h.d.b.healPct ?? 0) / 100);
  }
  /** heal on an undead-element mob: half the heal as holy damage, by element, ignoring MDEF (RO) */
  private healDamage(h: HeroUnit, t: MobUnit, lv: number) {
    // 역류하는 생명 (pr_heal): the undead burn harder
    return Math.floor(this.healAmount(h, lv) * elementMod('holy', this.mobElement(t)) / 2 * (1 + this.sig(h, 'reverse_life') * 0.15));
  }

  private estimateSkill(h: HeroUnit, t: MobUnit, sk: SkillDef, lv: number) {
    if (sk.kind === 'heal') return this.healDamage(h, t, lv);
    if (sk.id === 'turn_undead') {
      const c = this.turnChance(h, t, lv);
      return c * t.hp + (1 - c) * (h.hero.baseLv + h.d.total.int + lv * 10) * elementMod('holy', this.mobElement(t));
    }
    const hits = sk.bySize ? (t.m.size === 'small' ? 1 : t.m.size === 'medium' ? 2 : 3) : sk.id === 'water_ball' ? this.waterBalls(lv) : sk.hits ? sk.hits(lv) : 1;
    if (sk.fixed) return sk.fixed(lv, this.fixedCtx(h)) * hits * elementMod(sk.element ?? 'neutral', this.mobElement(t));
    let mult = this.skMult(h, sk, lv) / 100;
    if (sk.id === 'charge_attack') mult = Math.min(5, 1 + Math.floor(dist(h, t) / (3 * CELL)));
    const el = sk.element ?? h.d.weaponElement;
    const em = elementMod(el, this.mobElement(t));
    if (sk.magic) {
      const avg = (h.d.matkMin + h.d.matkMax) / 2;
      let v = avg * mult * hits * em * (100 - t.m.mdef) / 100;
      if (sk.id === 'soul_strike' && this.mobElement(t) === 'undead') v *= 1 + lv * 0.05;
      return v;
    }
    const d = h.d;
    const avg = d.statusAtk + d.watk * 0.9 * this.sizeOf(h, d.wtype, t) + d.ammoAtk + d.bonusAtk;
    return Math.max(1, avg * mult * hits * em * (100 - t.m.def) / 100 + (d.masteryAtk + d.refineAtk) * hits * em);
  }

  private mobElement(m: MobUnit): Element { return m.frozenUntil > this.time ? 'water' : m.stoneUntil > this.time ? 'earth' : m.m.element; }

  /** 정화: kill chance (RO pre-re), 0..0.7 — bosses never */
  private turnChance(h: HeroUnit, t: MobUnit, lv: number) {
    if (t.m.boss || this.mobElement(t) !== 'undead') return 0;
    const c = (lv * 20 + h.d.total.luk + h.d.total.int + h.hero.baseLv + (1 - t.hp / t.maxHp) * 200) / 10;
    return Math.min(70, c) / 100;
  }
  /** 물의 구: RO needs water cells — full count on wet maps, a single ball elsewhere */
  private waterBalls(lv: number) { return this.wet() ? [1, 8, 8, 24, 24][lv - 1] : 1; }
  private wetCache: { id: string; v: boolean } | null = null;
  wet(): boolean {
    if (this.wetCache?.id !== this.zone.id) this.wetCache = { id: this.zone.id, v: /호수|해변|늪|수로|등대|난파|가라앉|산호|바다|항구|해저|폭포|강가|수도원|샘|빙하/.test(this.zone.name) };
    return this.wetCache.v;
  }

  /** distance from a point to the segment a→b */
  private segDist(p: { x: number; y: number }, ax: number, ay: number, bx: number, by: number) {
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    const k = clamp(((p.x - ax) * dx + (p.y - ay) * dy) / L2, 0, 1);
    return Math.hypot(ax + dx * k - p.x, ay + dy * k - p.y);
  }

  /** knock a monster back `cells` away from (fx, fy): bosses, immobile and danger monsters stand firm */
  knock(m: MobUnit, fx: number, fy: number, cells: number) {
    if (!this.alive(m) || m.m.boss || m.m.immobile || m.danger || cells <= 0) return;
    let dx = m.x - fx, dy = m.y - fy, d = Math.hypot(dx, dy);
    if (d < 1) { const a = this.rng() * Math.PI * 2; dx = Math.cos(a); dy = Math.sin(a); d = 1; }
    m.x = clamp(m.x + dx / d * cells * CELL, 40, this.zone.w - 40);
    m.y = clamp(m.y + dy / d * cells * CELL * 0.8, 80, this.zone.h - 40);
    m.charge = null; m.dest = null;
  }

  // ───────────────────────────── party utilities: teleport, warp portal
  /** 순간이동 Lv1: when nothing is in reach, the whole party blinks next to a monster elsewhere on the map */
  private tryTeleport(best: MobUnit | undefined): boolean {
    if (this.time < this.teleAt || this.rift) return false;
    const caster = this.aliveHeroes().find((x) => (x.hero.skillSlots ?? []).includes('teleport') && (x.hero.skills.teleport ?? 0) > 0 && !x.cast && this.time >= x.lockUntil
      && this.canPay(x, SKILLS.teleport, x.hero.skills.teleport));
    if (!caster) return false;
    const pool = this.mobs.filter((m) => this.targetable(m) && !this.shunned(m) && !this.pc.engaged.includes(m) && (!this.pc.dangers.length || !this.pc.dangers.some((d) => dist(d, m) < 260)));
    const dest = best ?? pool[Math.floor(this.rng() * pool.length)];
    if (!dest) return false;
    this.teleAt = this.time + 6000;
    caster.sp -= SKILLS.teleport.sp!(caster.hero.skills.teleport);
    this.partyBlink(dest.x + (this.rng() < 0.5 ? -1 : 1) * 110, dest.y + 20, `${caster.hero.name}: 순간이동!`);
    return true;
  }
  /** move the whole living party to (x, y) at once (teleport / warp effects at both ends) */
  private partyBlink(x: number, y: number, text: string) {
    x = clamp(x, 60, this.zone.w - 60); y = clamp(y, 100, this.zone.h - 50);
    this.heroes.forEach((h, i) => {
      if (h.state === 'dead') return;
      this.emit({ t: 'skill', fx: 'teleport', from: h.uid, x: h.x, y: h.y, lv: 1 });
      h.x = x - i * 20; h.y = y + (i % 2 ? 16 : -10);
      h.target = null; h.cast = null; h.sitting = false;
      this.emit({ t: 'skill', fx: 'teleport', from: h.uid, to: h.uid, x: h.x, y: h.y, lv: 1 });
    });
    for (const m of this.mobs) if (m.target !== null && this.heroUnit(m.target)) { m.target = null; m.provokeUntil = 0; }
    this.run = null;
    this.log(text, '#c0e0ff');
    this.sound('buff');
  }
  /** 순간이동 Lv2: a danger monster right on top of the party — blink away instead of running */
  private tryTeleportAway(threat: MobUnit): boolean {
    if (this.time < this.teleAt || this.rift) return false;
    const caster = this.aliveHeroes().find((x) => (x.hero.skillSlots ?? []).includes('teleport') && (x.hero.skills.teleport ?? 0) >= 2 && !x.cast
      && this.canPay(x, SKILLS.teleport, 2));
    if (!caster) return false;
    const lead = this.leader();
    if (!lead) return false;
    const p = this.farSpot(lead, threat);
    this.teleAt = this.time + 6000;
    caster.sp -= SKILLS.teleport.sp!(2);
    this.partyBlink(p.x, p.y, `${caster.hero.name}: ${threat.m.name}을(를) 순간이동으로 따돌렸다!`);
    return true;
  }
  /** 차원문: out of HP potions on a hunt → warp to town, restock the quick slots, (Lv 2+) warp back */
  private tryWarp() {
    if (this.time < this.warpAt || this.zone.id === 'town' || this.rift || this.wipeUntil) return;
    this.warpAt = this.time + 2000;
    const q = this.s.quick.filter((x) => x.id && x.auto && quickTrigger(x.id) === 'hp');
    if (!q.length || q.some((x) => (this.s.stacks[x.id!] ?? 0) > 0)) return;
    const caster = this.aliveHeroes().find((x) => (x.hero.skillSlots ?? []).includes('warp_portal') && (x.hero.skills.warp_portal ?? 0) > 0 && !x.cast
      && this.canPay(x, SKILLS.warp_portal, x.hero.skills.warp_portal));
    if (!caster) return;
    const lv = caster.hero.skills.warp_portal;
    caster.sp -= SKILLS.warp_portal.sp!(lv);
    removeStack(this.s, 'k_bluegem');
    const back = this.zone.id;
    this.emit({ t: 'skill', fx: 'warp', from: caster.uid, x: caster.x, y: caster.y, lv });
    this.log(`${caster.hero.name}: 차원문 — 물약을 채우러 마을로!`, '#a0c8ff');
    this.setZone('town');
    this.onTravel('town');
    // restock every auto quick-slot consumable the shops sell, up to 30
    const sold = new Set(Object.values(SHOPS).flatMap((x) => x.items));
    const bought: string[] = [];
    for (const slot of this.s.quick) {
      if (!slot.id || !slot.auto || !sold.has(slot.id)) continue;
      const want = 30 - (this.s.stacks[slot.id] ?? 0);
      let n = 0;
      for (let i = 0; i < want && !buy(this.s, slot.id, 1); i++) n++;
      if (n) bought.push(`${ITEMS[slot.id].name} ×${n}`);
    }
    if (bought.length) this.log(`마을에서 ${bought.join(', ')} 구입`, '#c8e8ff');
    this.onPersist();
    if (lv >= 2) this.after(2500, () => {
      if (this.zone.id !== 'town') return;
      this.log('차원문으로 기억해 둔 사냥터로 돌아갑니다.', '#a0c8ff');
      this.setZone(back);
      this.onTravel(back);
    });
  }

  // ───────────────────────────── actions
  private normalAttack(h: HeroUnit, t: MobUnit) {
    const d = h.d;
    // a cloaked assassin's swing gives it away
    if (this.hasBuff(h, 'cloak')) this.unhide(h);
    this.setState(h, 'attack');
    const delay = d.delay * (h.flurryUntil > this.time && d.wtype === 'none' ? 0.5 : 1); // 맨주먹 연타
    h.atkReady = this.time + delay;
    h.lockUntil = this.time + Math.min(320, delay * 0.8);
    if (d.ranged) {
      // draw → release (the arrow leaves on the release frame) → flight → hit
      this.after(BOW_RELEASE, () => {
        if (!this.alive(t)) return;
        const fly = Math.max(120, dist(h, t) / 0.75);
        this.emit({ t: 'shot', from: h.uid, to: t.uid, kind: 'arrow', dur: fly, element: d.weaponElement });
        this.sound('arrow');
        this.after(fly, () => {
          const hit = this.resolvePhys(h, t, 100, d.weaponElement, 0, true, 'pierce');
          this.afterNormalHit(h, t, hit);
          // 명궁의 호흡: the breath carries a free double strafe with the shot
          const br = this.sig(h, 'archer_breath'), ds = h.hero.skills.double_strafe ?? 0;
          if (hit && br && ds && this.alive(t) && this.rng() * 100 < br * 1.6) {
            this.emit({ t: 'status', uid: h.uid, text: '명궁의 호흡!', color: '#ffe08a' });
            this.releaseCast(h, { sk: SKILLS.double_strafe, lv: ds, target: t.uid, x: t.x, y: t.y, start: this.time, end: this.time }, true);
          }
        });
      });
      return;
    }
    this.sound('swing');
    this.after(MELEE_CONTACT, () => {
      // 이도류: each hand at its mastery %, the left one right after
      const lh = d.lh;
      const r = this.resolvePhys(h, t, lh ? lh.rpct : 100, d.weaponElement, 0, true, d.wtype === 'mace' || d.wtype === 'staff' || d.wtype === 'none' ? 'blunt' : 'slash');
      this.afterNormalHit(h, t, r); // M3: a bare-handed falconer's fists call the falcon too
      // 마력 부여: a magic strike follows the blade
      const edge = r && h.buffs.find((b) => b.id === 'manaedge' && b.until > this.time);
      if (edge) this.after(70, () => { if (this.alive(t)) this.resolveMagic(h, t, 30 + edge.lv * 12, d.weaponElement, 3); });
      // double attack
      const da = h.hero.skills.double_attack ?? 0;
      if (r && da && d.wtype === 'dagger' && this.rng() < da * 0.05 && this.alive(t)) {
        this.after(110, () => this.resolvePhys(h, t, lh ? lh.rpct : 100, d.weaponElement, 0, false, 'slash', 1));
      }
      if (lh) this.after(80, () => {
        const lr = this.resolvePhys(h, t, lh.pct, d.b.weaponElement ?? lh.element, 0, true, 'slash', 2, 0, { lh: true });
        // 쌍검무: the left dagger rolls its own double attack
        if (lr && da && lh.wtype === 'dagger' && this.sig(h, 'twin_dance') && this.rng() < da * 0.05 && this.alive(t)) {
          this.after(100, () => this.resolvePhys(h, t, lh.pct, d.b.weaponElement ?? lh.element, 0, false, 'slash', 3, 0, { lh: true }));
        }
      });
    });
  }

  /** after any normal attack: the falcon, item procs (M5) and a cursed weapon's price (M6) */
  private afterNormalHit(h: HeroUnit, t: MobUnit, hit: boolean) {
    if (!hit) return;
    const b = h.d.b;
    this.autoBlitz(h, t);
    if (b.procs) for (const p of b.procs) if ((p.on === 'attack' || (p.on === 'crit' && this.lastCrit)) && this.rng() * 100 < p.chance) this.runProc(h, t, p);
    if (b.selfCurse && this.rng() * 100 < b.selfCurse) this.curseHero(h);
    // 음속 연쇄: a katar swing sometimes breaks into a sonic blow by itself (free)
    const sc = this.sig(h, 'sonic_chain'), sb = h.hero.skills.sonic_blow ?? 0;
    if (sc && sb && h.d.wtype === 'katar' && this.alive(t) && this.rng() * 100 < sc * 0.4) {
      this.emit({ t: 'status', uid: h.uid, text: '음속 연쇄!', color: '#ff9ac0' });
      this.after(60, () => { if (this.alive(t) && h.state !== 'dead') this.releaseCast(h, { sk: SKILLS.sonic_blow, lv: sb, target: t.uid, x: t.x, y: t.y, start: this.time, end: this.time }, true); });
    }
    // 대도: a light hand takes zeny off the monster
    const gt = this.sig(h, 'grand_thief');
    if (gt && !t.summoned && this.rng() * 100 < gt) {
      const z = t.m.lv * (4 + Math.floor(this.rng() * 5));
      this.s.zeny += z;
      this.grandZeny += z;
      this.emit({ t: 'status', uid: h.uid, text: `+${z}z`, color: '#ffd860' });
    }
  }
  /** 대도: zeny snatched so far (tools) */
  grandZeny = 0;

  /** hunter falcon proc on normal attacks, any weapon or none: LUK×0.3% (RO) + gear */
  private autoBlitz(h: HeroUnit, t: MobUnit) {
    const eyes = h.hero.skills.falcon_eyes ?? 0, blitz = h.hero.skills.blitz_beat ?? 0;
    if (!eyes || !blitz || !this.alive(t)) return;
    if (this.rng() * 100 >= h.d.total.luk * 0.3 + (h.d.b.autoBlitzPct ?? 0)) return;
    const sk = SKILLS.blitz_beat;
    const hits = Math.min(blitz, Math.floor((h.hero.jobLv + 9) / 10)) + (h.d.b.blitzHits ?? 0);
    this.falconStrike(h, t, sk, blitz, hits, true);
    // 맨주먹 연타: the fists follow the falcon in at double speed
    const fl = this.sig(h, 'bare_flurry');
    if (fl && h.d.wtype === 'none') {
      h.flurryUntil = this.time + [400, 600, 800][fl - 1];
      h.atkReady = Math.min(h.atkReady, this.time + h.d.delay * 0.5);
    }
  }

  /** M5: one item/card effect */
  private runProc(h: HeroUnit, t: MobUnit | null, p: Proc) {
    if (p.healPct) this.healHero(h, Math.floor(h.d.maxHp * p.healPct / 100), true);
    // (맹독 부여's poison layers only on a blade that is poisonous itself — 맹독 누적 is the poison dagger's craft)
    if (p.status && t && this.alive(t) && !t.m.boss) this.setStatus(t, p.status.kind, p.status.dur, p.tag !== 'edp' || this.poisonBlade(h) ? h : undefined);
    if (p.cast) {
      const sk = SKILLS[p.cast.skill];
      if (!sk) return;
      const self = sk.kind === 'heal' || sk.kind === 'buff' || sk.kind === 'selfBuff';
      const target: HeroUnit | MobUnit | null = self ? h : t;
      if (!target || (target.kind === 'mob' && !this.alive(target))) return;
      this.releaseCast(h, { sk, lv: p.cast.lv, target: target.uid, x: target.x, y: target.y, start: this.time, end: this.time }, true);
    }
  }

  /** put a status on a monster (immunities by element and race; bosses are kept out by the callers) */
  private setStatus(t: MobUnit, kind: SkStatus | 'poison', dur: number, by?: HeroUnit) {
    if (!this.alive(t)) return;
    const until = this.time + dur;
    switch (kind) {
      case 'stun': t.stunUntil = Math.max(t.stunUntil, until); this.emit({ t: 'status', uid: t.uid, text: '기절!', color: '#ffe080' }); return;
      case 'freeze':
        if (t.m.element === 'undead') return;
        t.frozenUntil = Math.max(t.frozenUntil, until); t.breakHold = Math.max(t.breakHold, this.time + 60);
        this.emit({ t: 'status', uid: t.uid, text: '빙결!', color: '#9fe8ff' }); return;
      case 'stone':
        if (t.m.element === 'undead') return;
        t.stoneUntil = Math.max(t.stoneUntil, until); t.breakHold = Math.max(t.breakHold, this.time + 60);
        this.emit({ t: 'status', uid: t.uid, text: '석화!', color: '#c8c0a8' }); return;
      case 'sleep': t.sleepUntil = Math.max(t.sleepUntil, until); this.emit({ t: 'status', uid: t.uid, text: '수면', color: '#c0b0ff' }); return;
      case 'silence': t.silenceUntil = Math.max(t.silenceUntil, until); this.emit({ t: 'status', uid: t.uid, text: '침묵', color: '#c0c0ff' }); return;
      case 'blind': t.blindUntil = Math.max(t.blindUntil, until); this.emit({ t: 'status', uid: t.uid, text: '실명', color: '#d8c080' }); return;
      case 'poison': {
        if (t.m.element === 'undead' || t.m.race === 'formless') return;
        // 맹독 누적: poisoning a poisoned monster adds a layer (up to the skill level)
        const vs = by ? this.sig(by, 'venom_stack') : 0;
        const was = t.poisonUntil > this.time;
        t.poisonStacks = was && vs ? Math.min(vs, t.poisonStacks + 1) : was ? Math.max(1, t.poisonStacks) : 1;
        if (!was) t.poisonNext = this.time + 1000;
        t.poisonUntil = Math.max(t.poisonUntil, until);
        t.poisonDmg = Math.max(2, Math.floor(t.maxHp * 0.015));
        this.emit({ t: 'status', uid: t.uid, text: t.poisonStacks > 1 ? `맹독 ${t.poisonStacks}겹` : '중독', color: '#c080ff' });
      }
    }
  }

  /** M6: a cursed weapon bites back — 10 s of LUK 0 and slow feet, unless something wards it off (M7) */
  curseHero(h: HeroUnit) {
    if ((h.d.b.statusRes?.curse ?? 0) >= 100 || this.rng() * 100 < (h.d.b.statusRes?.curse ?? 0)) {
      this.emit({ t: 'status', uid: h.uid, text: '저주 무효', color: '#d0c0ff' });
      return;
    }
    h.buffs = h.buffs.filter((b) => b.id !== 'curse');
    h.buffs.push({ id: 'curse', name: '저주', lv: 1, until: this.time + 10000, bonus: { luk: -999, moveSpd: -30 } });
    this.refresh(h);
    this.emit({ t: 'status', uid: h.uid, text: '저주!', color: '#b070e0' });
  }

  /** M7: blinded by a hit — 8 s of HIT and FLEE −25% (RO), unless warded */
  blindHero(h: HeroUnit) {
    const res = h.d.b.statusRes?.blind ?? 0;
    if (res >= 100 || this.rng() * 100 < res) {
      this.emit({ t: 'status', uid: h.uid, text: '실명 무효', color: '#d0c0ff' });
      return;
    }
    h.buffs = h.buffs.filter((b) => b.id !== 'blind');
    this.refresh(h);
    h.buffs.push({ id: 'blind', name: '실명', lv: 1, until: this.time + 8000, bonus: { hit: -Math.round(h.d.hit * 0.25), flee: -Math.round(h.d.flee * 0.25) } });
    this.refresh(h);
    this.emit({ t: 'status', uid: h.uid, text: '실명!', color: '#a8a8b8' });
  }

  private fixedCtx(h: HeroUnit): FixedCtx {
    return { dex: h.d.total.dex, int: h.d.total.int, luk: h.d.total.luk, baseLv: h.hero.baseLv, skills: h.hero.skills, matk: (h.d.matkMin + h.d.matkMax) / 2 };
  }

  private falconStrike(h: HeroUnit, t: MobUnit, sk: SkillDef, lv: number, hits: number, auto = false) {
    // 매의 선회 (hu_mob): the falcon that dives with the fists circles wider and hits the pack harder
    const circle = auto ? this.sig(h, 'falcon_circle') : 0;
    const fly = Math.max(160, dist(h, t) / 0.7);
    this.emit({ t: 'shot', from: h.uid, to: t.uid, kind: 'falcon', dur: fly, element: 'neutral' });
    this.emit({ t: 'status', uid: h.uid, text: '블리츠 비트!', color: '#ffd080' });
    let total = 0;
    // (DEX/10 + INT/2 + steel crow×3 + 40) × 2 per hit (RO) — steel crow is inside the formula
    const per = sk.fixed!(lv, this.fixedCtx(h)) * (1 + (h.d.b.skillDmg?.blitz_beat ?? 0) / 100);
    // M4: the falcon's dive hits everything around the target (RO's 3×3)
    const r = 60 + (h.d.b.blitzRadius ?? 0) + circle * 15;
    for (let i = 0; i < hits; i++) {
      this.after(fly + i * 120, () => {
        if (!this.alive(t)) return;
        const cx = t.x, cy = t.y;
        total += this.dealFixed(h, t, per, 'neutral', i, 'claw');
        const splash = per * (1 + circle * 0.15);
        for (const m of this.mobs) if (m !== t && this.targetable(m) && !this.shunned(m) && Math.hypot(m.x - cx, m.y - cy) <= r) this.dealFixed(h, m, splash, 'neutral', i, 'claw');
        if (i === hits - 1 && hits > 1 && total > 0) this.emit({ t: 'dmg', uid: t.uid, n: total, kind: 'total' });
      });
    }
  }

  /** fixed damage: ignores DEF and FLEE, still respects element */
  private dealFixed(h: HeroUnit, t: MobUnit, base: number, el: Element, idx: number, style: 'claw' | 'magic' = 'magic', kind: DmgKind = 'normal'): number {
    if (!this.alive(t)) return 0;
    const em = elementMod(el, this.mobElement(t));
    const n = em <= 0 ? 0 : Math.max(1, Math.floor(base * em * (0.9 + this.rng() * 0.2) * (this.rift?.mods.fixedMul ?? 1)));
    this.dealToMob(h, t, n, kind, idx);
    this.emit({ t: 'hit', uid: t.uid, style, element: el });
    return n;
  }

  private applyStatus(t: MobUnit, sk: SkillDef, lv: number, h?: HeroUnit) {
    if (!sk.status || !this.alive(t)) return;
    const th = sk.id === 'hammer_fall' && h ? this.sig(h, 'thunder_hammer') : 0;
    if (t.m.boss) {
      // 천둥의 망치질: even a boss staggers for a moment
      if (th && this.rng() * 100 < sk.status(lv).chance) { t.stunUntil = Math.max(t.stunUntil, this.time + 500 + th * 100); this.emit({ t: 'status', uid: t.uid, text: '경직!', color: '#ffe45a' }); }
      return;
    }
    const st = sk.status(lv);
    if (this.rng() * 100 >= st.chance) return;
    if (th) { this.setStatus(t, 'stun', st.dur * (1 + th * 0.1)); return; }
    if (sk.id === 'ankle_snare') { t.stunUntil = this.time + st.dur; this.emit({ t: 'status', uid: t.uid, text: '속박!', color: '#ffe080' }); return; }
    this.setStatus(t, st.kind, st.dur);
  }

  /** 영원의 율법 on this target: every hit of the skill being released doubles */
  private lexPacket(t: MobUnit | undefined, span: number) {
    if (!t || !t.lex) return;
    t.lex = false;
    t.lexUntil = this.time + span;
    this.emit({ t: 'status', uid: t.uid, text: '율법 ×2', color: '#ff90b0' });
  }
  /** the rest of this skill lands while it is still frozen / stoned (RO: one skill is one damage packet) */
  private holdBreak(t: MobUnit | undefined, span: number) { if (t) t.breakHold = Math.max(t.breakHold, this.time + span); }

  /** whether the last resolvePhys was a critical (crit procs) */
  private lastCrit = false;

  /** returns true when it hit. o.lh = the off-hand weapon (이도류), forceCrit / ignoreDef (auto counter), sure (no FLEE roll),
   *  sureCrit (광월참: a critical unless a boss's crit resistance turns it), counter (역습의 맹세 crit damage) */
  private resolvePhys(h: HeroUnit, t: MobUnit, mult: number, el: Element, hitBonus: number, canCrit: boolean, style: 'slash' | 'blunt' | 'pierce' | 'claw', idx = 0, flat = 0,
    o: { lh?: boolean; forceCrit?: boolean; ignoreDef?: boolean; sure?: boolean; sureCrit?: boolean; counter?: boolean } = {}): boolean {
    if (!this.alive(t) || h.state === 'dead') return false;
    const d = h.d;
    const w = o.lh && d.lh ? d.lh : null;
    // 속성 전환: whatever the weapon carries turns into the target's weakness (the advantage at 50–70%)
    let shift = 0;
    if (this.hasBuff(h, 'eshift') && (el === d.weaponElement || (w && el === (d.b.weaponElement ?? w.element)))) {
      const to = this.weakEl(t, el);
      if (to !== el) { shift = 0.3 + 0.1 * this.sig(h, 'element_shift'); el = to; }
    }
    // 숨 고르기: the first shot at a target may crit (even a double strafe arrow)
    const steady = d.ranged ? this.sig(h, 'steady_breath') : 0;
    const first = steady > 0 && !(t.dmgBy[h.uid] > 0);
    if (first) canCrit = true;
    // 속도 감소 / 늪 lower the monster's AGI (its FLEE)
    const agi = Math.max(0, (t.m.agi - (t.agiDownUntil > this.time ? t.agiDown : 0)) * (1 - (t.quagUntil > this.time ? t.quag : 0)));
    const mobFlee = t.m.lv + agi;
    const critRes = t.m.critRes ?? (t.m.boss === 'mvp' ? 0.5 : t.m.boss ? 0.25 : 0);
    const critChance = canCrit ? Math.max(0, d.crit + (first ? steady * 10 : 0) - t.m.luk * 0.2) * (1 - critRes) : 0;
    const crit = !!o.forceCrit || (!!o.sureCrit && this.rng() >= critRes) || this.rng() * 100 < critChance;
    this.lastCrit = crit;
    const frozen = t.frozenUntil > this.time, stoned = t.stoneUntil > this.time;
    if (!crit && !frozen && !stoned && t.sleepUntil <= this.time && !o.sure) {
      const rate = clamp(80 + d.hit + (this.rift?.mods.heroHit ?? 0) - mobFlee, 5, 100) + hitBonus; // RO: enough HIT is a sure hit
      if (this.rng() * 100 >= rate) {
        this.emit({ t: 'dmg', uid: t.uid, n: 0, kind: 'miss', i: idx });
        this.sound('miss');
        this.aggro(t, h);
        return false;
      }
    }
    const wmax = w ? w.watk : d.watk;
    const wmin = Math.min(wmax, Math.floor(d.total.dex * (0.8 + 0.2 * Math.max(1, w ? w.wlv : d.wlv))));
    const wroll = crit ? wmax : wmin + Math.floor(this.rng() * (wmax - wmin + 1));
    const b = d.b;
    let dmg = d.statusAtk + Math.floor(wroll * this.sizeOf(h, w ? w.wtype : d.wtype, t)) + (w ? 0 : d.ammoAtk) + d.bonusAtk;
    dmg = dmg * mult / 100;
    dmg *= 1 + (b.atkPct ?? 0) / 100;
    // 질풍 보법: the blow right after a dodge (not a critical)
    if (!crit && h.gale > this.time) { dmg *= 1 + this.sig(h, 'gale_step') * 0.16; h.gale = 0; }
    // 숨 고르기: bosses from range · 천둥의 망치질: a stunned monster
    if (steady && t.m.boss) dmg *= 1 + steady * 0.05;
    if (t.stunUntil > this.time) dmg *= 1 + this.sig(h, 'thunder_hammer') * 0.05;
    const mel = this.mobElement(t);
    dmg *= 1 + (b.raceDmg?.[t.m.race] ?? 0) / 100;
    dmg *= 1 + (b.sizeDmg?.[t.m.size] ?? 0) / 100;
    dmg *= 1 + (b.eleDmg?.[mel] ?? 0) / 100;
    if (d.ranged) dmg *= 1 + (b.rangedPct ?? 0) / 100;
    let em = elementMod(el, mel);
    if (shift) em = 1 + (em - 1) * shift;
    dmg *= em;
    if (h.buffs.some((x) => x.id === 'magnum' && x.until > this.time)) dmg *= 1 + 0.2 * elementMod('fire', mel);
    if (crit) {
      dmg *= 1.4 * (1 + ((b.critDmgPct ?? 0) + (o.counter ? this.sig(h, 'counter_oath') * 5 : 0) + (first ? steady * 10 : 0)) / 100);
    } else if (!o.ignoreDef) {
      let hard = t.m.def;
      if (t.provokeUntil > this.time) hard *= 1 - t.provokeDef;
      if (frozen || stoned) hard *= 0.5;
      if (t.poisonUntil > this.time) hard *= 0.75; // RO: poison −25% DEF
      if (t.crucis) hard *= 1 - t.crucis;         // 성호
      dmg = dmg * (100 - hard) / 100 - Math.floor(t.m.lv / 2 + this.rng() * t.m.lv / 4);
    }
    // after DEF: refine, mastery (sword / spear / katar / mace mastery) and race flats (demon bane, beast bane)
    const refine = w ? w.refineAtk + (w.overRefine ? Math.floor(this.rng() * w.overRefine) : 0) : d.refineAtk + (d.overRefine ? Math.floor(this.rng() * d.overRefine) : 0);
    dmg += (refine + (w ? 0 : d.masteryAtk) + (b.raceAtk?.[t.m.race] ?? 0)) * em + flat * em;
    let n = Math.floor(dmg);
    if (em <= 0) n = 0; else n = Math.max(1, n);
    this.dealToMob(h, t, n, crit ? 'crit' : 'normal', idx);
    this.emit({ t: 'hit', uid: t.uid, style, element: el, crit });
    this.sound(crit ? 'crit' : style === 'pierce' ? 'arrow_hit' : style === 'blunt' ? 'hit_heavy' : 'hit');
    if (b.lifeStealPct && n > 0) this.healHero(h, Math.floor(n * b.lifeStealPct / 100), false);
    // steal
    const st = h.hero.skills.steal ?? 0;
    if (st && !t.stolen && !t.m.boss && !t.summoned && this.rng() * 100 < st * 1.2 + this.sig(h, 'grand_thief') * 2) this.trySteal(h, t);
    return true;
  }

  private resolveMagic(h: HeroUnit, t: MobUnit, mult: number, el: Element, idx = 0, sk?: SkillDef, lv = 1, chained = false): number {
    if (!this.alive(t)) return 0;
    const d = h.d;
    const roll = d.matkMin + this.rng() * (d.matkMax - d.matkMin + 1);
    let dmg = roll * mult / 100;
    // 빙뢰 공명: lightning through ice hits harder and jumps to another frozen monster nearby
    const ft = el === 'wind' && t.frozenUntil > this.time ? this.sig(h, 'frost_thunder') : 0;
    if (ft) dmg *= 1 + ft * 0.15;
    const mel = this.mobElement(t);
    const em = elementMod(el, mel);
    dmg *= em;
    dmg *= 1 + (d.b.raceDmg?.[t.m.race] ?? 0) / 100;
    if (sk?.id === 'soul_strike' && (mel === 'undead' || t.m.race === 'undead')) dmg *= 1 + lv * 0.05;
    if (sk?.vsUndead && (t.m.race === 'undead' || t.m.race === 'demon')) dmg *= sk.vsUndead;
    const mdef = t.m.mdef * (t.frozenUntil > this.time || t.stoneUntil > this.time ? 1.25 : 1);
    dmg = dmg * (100 - Math.min(90, mdef)) / 100 - Math.floor(t.m.lv / 3);
    let n = Math.floor(dmg);
    if (em <= 0) n = 0; else n = Math.max(1, n);
    this.dealToMob(h, t, n, 'normal', idx);
    this.emit({ t: 'hit', uid: t.uid, style: 'magic', element: el });
    if (ft && !chained) {
      const o2 = this.mobs.find((m) => m !== t && this.targetable(m) && !this.shunned(m) && m.frozenUntil > this.time && dist(m, t) < 5 * CELL);
      if (o2) {
        this.holdBreak(o2, 260);
        this.emit({ t: 'skill', fx: 'lightning', from: h.uid, to: o2.uid, x: o2.x, y: o2.y, lv: 1, hits: 1, element: 'wind' });
        this.resolveMagic(h, o2, mult, el, idx, sk, lv, true);
      }
    }
    // 균열 반사: part of the spell comes back at the caster (never more than 8% of max HP a hit)
    const rf = this.rift?.mods.reflect ?? 0;
    if (rf > 0 && n > 0 && h.state !== 'dead') {
      const back = Math.max(1, Math.floor(Math.min(n * rf, h.d.maxHp * 0.08)));
      this.emit({ t: 'status', uid: h.uid, text: '반사', color: '#d0a0ff' });
      this.damageHero(h, back, null, true);
    }
    return n;
  }

  private dealToMob(h: HeroUnit, t: MobUnit, n: number, kind: DmgKind, idx: number) {
    // 균열 수호막: the guardian shrugs off 90% while its adds stand
    if (n > 0 && this.rift?.barrier && t.uid === this.rift.guardian) n = Math.max(1, Math.floor(n * 0.1));
    // 영원의 율법: the next damage (every hit of one skill) doubles
    if (n > 0) {
      if (t.lexUntil > this.time) n *= 2;
      else if (t.lex) { t.lex = false; n *= 2; this.emit({ t: 'status', uid: t.uid, text: '율법 ×2', color: '#ff90b0' }); }
    }
    this.emit({ t: 'dmg', uid: t.uid, n, kind: n === 0 ? 'zero' : kind, i: idx });
    t.hurtAt = this.time;
    t.dmgBy[h.uid] = (t.dmgBy[h.uid] ?? 0) + n;
    this.aggro(t, h);
    if (n <= 0) return;
    // damage wakes a sleeper and (after the skill that froze or hit it) breaks ice and stone
    t.sleepUntil = 0;
    if (this.time > t.breakHold && (t.frozenUntil > this.time || t.stoneUntil > this.time)) { t.frozenUntil = 0; t.stoneUntil = 0; }
    t.dmgAt = this.time;
    t.hp -= n;
    if (t.hp <= 0) this.killMob(t, h);
  }

  private aggro(t: MobUnit, h: HeroUnit) {
    if (t.provokeUntil > this.time || !this.sees(t, h)) return;
    if (t.target === null || !this.alive(this.heroUnit(t.target))) { t.target = h.uid; t.chaseSince = this.time; }
  }

  private trySteal(h: HeroUnit, t: MobUnit) {
    const pool = t.m.drops.filter((d) => ITEMS[d.id].kind !== 'card' && d.rate < 1);
    if (!pool.length) return;
    t.stolen = true;
    const total = pool.reduce((a, d) => a + Math.sqrt(d.rate), 0);
    let r = this.rng() * total;
    for (const d of pool) {
      r -= Math.sqrt(d.rate);
      if (r <= 0) {
        const inst = addItem(this.s, d.id, 1, d.slots);
        const name = inst ? itemName(inst) : ITEMS[d.id].name;
        this.emit({ t: 'status', uid: h.uid, text: '훔치기!', color: '#ffd080' });
        this.log(`${h.hero.name}: 「${name}」을(를) 훔쳤습니다!`, '#ffd080');
        this.sound('pickup');
        this.onPersist();
        return;
      }
    }
  }

  startSkill(h: HeroUnit, sk: SkillDef, lv: number, target: Unit | null) {
    h.sitting = false;
    const qc = QUICK_BOLTS.has(sk.id) ? this.sig(h, 'quick_chant') : 0; // 고속 영창
    // 빙뢰 공명: lightning comes quicker at something already frozen
    const ft = sk.element === 'wind' && sk.magic && target?.kind === 'mob' && target.frozenUntil > this.time ? this.sig(h, 'frost_thunder') : 0;
    const vow = sk.id === 'magnus' ? this.sig(h, 'exorcist_vow') : 0; // 퇴마의 서약
    const castBase = (sk.cast ? sk.cast(lv) : 0) * (1 - qc * 0.07) * (1 - ft * 0.05) * (1 - vow * 0.08);
    const cast = castBase * h.d.castMul;
    // 기도: the next spell's cast is shorter, then it's spent
    if (castBase > 0 && this.hasBuff(h, 'suffragium')) { h.buffs = h.buffs.filter((b) => b.id !== 'suffragium'); this.refresh(h); }
    const tx = target ? target.x : h.x, ty = target ? target.y : h.y;
    if (target) h.facing = target.x >= h.x ? 1 : (target === h ? h.facing : -1);
    const info: CastInfo = { sk, lv, target: target ? target.uid : null, x: tx, y: ty, start: this.time, end: this.time + cast };
    if (cast > 60) {
      h.cast = info;
      this.setState(h, 'cast');
      this.emit({ t: 'cast', uid: h.uid, dur: cast, element: sk.element ?? 'neutral', name: sk.name });
      this.sound('cast');
    } else {
      h.cast = info;
      this.releaseCast(h);
    }
  }

  /** fire a skill. `free` = an item proc (M5): no cost, cooldown, cast animation or lock */
  private releaseCast(h: HeroUnit, info?: CastInfo, free = false) {
    const c = info ?? h.cast!;
    if (!info) { h.cast = null; this.emit({ t: 'castEnd', uid: h.uid }); }
    const { sk, lv } = c;
    if (!free) {
      const ct = tm0(this.unit(c.target));
      if (!this.canAfford(h, sk, lv, ct) || !this.usable(h, sk)) {
        this.setState(h, 'idle');
        return;
      }
      if (sk.sp) h.sp -= this.spCost(h, sk, lv, ct);
      if (sk.hpCost) h.hp -= sk.hpCost(lv);
      if (sk.zeny) { this.s.zeny -= this.zenyCost(h, sk, lv); this.onPersist(); }
      // catalysts (stone curse from Lv 6 only pays on success)
      const cat = this.catalystFor(h, sk, lv);
      if (cat && !(sk.id === 'stone_curse' && lv >= 6)) { removeStack(this.s, cat.id, cat.n); this.onPersist(); }
      if (sk.cd) h.cds[sk.id] = this.time + sk.cd(lv);
      // 빙뢰 공명: lightning at a frozen target recovers quicker too
      const ftm = tm0(this.unit(c.target));
      const fz = sk.element === 'wind' && sk.magic && ftm && ftm.frozenUntil > this.time ? this.sig(h, 'frost_thunder') : 0;
      const delay = (sk.delay ? sk.delay(lv) : 300) * (1 - fz * 0.05);
      h.lockUntil = this.time + delay;
      h.atkReady = Math.max(h.atkReady, this.time + Math.min(delay, h.d.delay));
      this.setState(h, sk.magic || sk.kind === 'heal' || sk.kind === 'buff' || sk.kind === 'selfBuff' || sk.kind === 'ground' || sk.kind === 'cure' ? 'cast' : 'attack');
      this.stateHold(h, Math.min(delay, 450));
    }
    // a cloaked assassin shows itself when it acts — except grimtooth (RO)
    if (sk.id !== 'grimtooth' && sk.id !== 'cloaking' && this.hasBuff(h, 'cloak')) this.unhide(h);
    this.emit({ t: 'status', uid: h.uid, text: sk.name + '!', color: '#fff6c0' });
    const tu = this.unit(c.target);
    const tm = tu?.kind === 'mob' ? tu : undefined;
    const el: Element = sk.element ?? h.d.weaponElement;

    switch (sk.kind) {
      case 'melee': {
        if (!tm || !this.alive(tm)) return;
        let mult = this.skMult(h, sk, lv);
        if (sk.id === 'charge_attack') {
          // 돌격: dash to the target; 3 cells of run-up add 100% each (to 500%)
          const d0 = dist(h, tm);
          mult = Math.min(500, 100 + 100 * Math.floor(d0 / (3 * CELL))) * (mult / 100);
          const dx = h.x - tm.x, dy = h.y - tm.y, dd = Math.hypot(dx, dy) || 1, off = this.bodyR(tm) + 14;
          this.emit({ t: 'skill', fx: 'teleport', from: h.uid, x: h.x, y: h.y, lv });
          h.x = clamp(tm.x + dx / dd * off, 24, this.zone.w - 24); h.y = clamp(tm.y + dy / dd * off, 70, this.zone.h - 24);
        }
        // the skill's impact effect bursts when the weapon arrives, not when the swing starts
        this.after(SKILL_CONTACT - 20, () => { if (this.alive(tm)) this.emit({ t: 'skill', fx: sk.fx, from: h.uid, to: tm.uid, x: tm.x, y: tm.y, lv, element: el }); });
        const mhits = sk.bySize ? (tm.m.size === 'small' ? 1 : tm.m.size === 'medium' ? 2 : 3) : sk.hits ? sk.hits(lv) : 1;
        const gap = sk.id === 'sonic_blow' ? 70 : 120;
        // 광월참: sure crits for the knight who gave up DEX (base DEX ≤ 10); anyone else swings three ordinary blows
        const moon = sk.id === 'moon_slash' && h.hero.stats.dex <= 10;
        // 음속 연쇄: sometimes the flurry goes again at once (free; never chains off a free one)
        const chain = sk.id === 'sonic_blow' && !free ? this.sig(h, 'sonic_chain') : 0;
        if (chain && this.rng() < chain * 0.08) {
          this.after(SKILL_CONTACT + mhits * gap + 140, () => {
            if (!this.alive(tm) || h.state === 'dead') return;
            this.emit({ t: 'status', uid: h.uid, text: '음속 연쇄!', color: '#ff9ac0' });
            this.releaseCast(h, { sk, lv, target: tm.uid, x: tm.x, y: tm.y, start: this.time, end: this.time }, true);
          });
        }
        this.lexPacket(tm, SKILL_CONTACT + mhits * gap + 100);
        this.holdBreak(tm, SKILL_CONTACT + mhits * gap + 100);
        const hb = (sk.hitBonus ? sk.hitBonus(lv) : 0) + (sk.id === 'sonic_blow' && h.hero.skills.sonic_accel ? 50 : 0);
        if (mhits > 1) {
          let total = 0;
          for (let i = 0; i < mhits; i++) {
            this.after(SKILL_CONTACT + i * gap, () => {
              const before = tm.hp;
              this.resolvePhys(h, tm, mult, el, hb, moon, sk.id === 'pierce' ? 'pierce' : 'slash', i, 0, moon ? { sureCrit: true } : {});
              total += Math.max(0, before - Math.max(0, tm.hp));
              if (i === mhits - 1) {
                if (total > 0) this.emit({ t: 'dmg', uid: tm.uid, n: total, kind: 'total' });
                // the flurry's weight lands with its total, once
                if (sk.id === 'sonic_blow') this.emit({ t: 'shake', power: 1.5 });
                if (total > 0) this.applyStatus(tm, sk, lv);
              }
            });
          }
          return;
        }
        this.after(SKILL_CONTACT, () => {
          const flat = sk.id === 'envenom' ? lv * 15 : 0;
          const hit = this.resolvePhys(h, tm, mult, el, hb, false, 'slash', 0, flat);
          if (!hit || !this.alive(tm)) return;
          this.applyStatus(tm, sk, lv);
          if (sk.id === 'envenom' && this.rng() * 100 < 10 + lv * 4 && !tm.m.boss) this.setStatus(tm, 'poison', 10000, h);
          // 급소 강타: bash Lv 6+ stuns, 5% × (bash − 5) × base level / 50
          if (sk.id === 'bash' && lv >= 6 && h.hero.skills.fatal_blow && !tm.m.boss && this.rng() * 100 < 5 * (lv - 5) * h.hero.baseLv / 50) this.setStatus(tm, 'stun', 3000);
          if (sk.knock) this.knock(tm, h.x, h.y, sk.knock(lv));
        });
        if (sk.id === 'mammonite') this.sound('coin_skill');
        // 마력 부여: a melee skill carries the magic strike as well (once per cast)
        const edge = h.buffs.find((b) => b.id === 'manaedge' && b.until > this.time);
        if (edge) this.after(SKILL_CONTACT + 90, () => { if (this.alive(tm)) this.resolveMagic(h, tm, 30 + edge.lv * 12, h.d.weaponElement, 3); });
        return;
      }
      case 'ranged': {
        if (!tm) return;
        const hits = sk.hits ? sk.hits(lv) : 1;
        const fly = Math.max(100, dist(h, tm) / 0.9);
        this.after(BOW_RELEASE, () => this.sound('arrow'));
        this.lexPacket(tm, BOW_RELEASE + hits * 110 + fly + 100);
        let total = 0;
        for (let i = 0; i < hits; i++) {
          this.after(BOW_RELEASE + i * 110, () => this.emit({ t: 'shot', from: h.uid, to: tm.uid, kind: sk.id === 'spear_boomerang' ? 'bone' : 'arrow', dur: fly, element: el }));
          this.after(BOW_RELEASE + i * 110 + fly, () => {
            const before = tm.hp;
            const hit = this.resolvePhys(h, tm, this.skMult(h, sk, lv), el, 0, false, 'pierce', i);
            total += Math.max(0, before - Math.max(0, tm.hp));
            if (i === hits - 1 && total > 0 && hits > 1) this.emit({ t: 'dmg', uid: tm.uid, n: total, kind: 'total' });
            if (!hit || !this.alive(tm)) return;
            if (sk.id === 'venom_knife' && !tm.m.boss && this.rng() < 0.6) this.setStatus(tm, 'poison', 10000, h);
            if (sk.knock && i === hits - 1) this.knock(tm, h.x, h.y, sk.knock(lv));
          });
        }
        return;
      }
      case 'bolt': {
        if (!tm) return;
        if (sk.id === 'turn_undead') { this.turnUndead(h, tm, lv); return; }
        if (sk.id === 'falcon_strike') { this.falconDive(h, tm, sk, lv); return; }
        const hits = (sk.id === 'water_ball' ? this.waterBalls(lv) : sk.hits ? sk.hits(lv) : 1) + this.extraBolts(h, sk, tm);
        if (sk.id === 'blitz_beat') { this.falconStrike(h, tm, sk, lv, hits); this.sound('arrow'); return; }
        if (sk.fixed) {
          // 돌 던지기: a thrown stone, fixed damage
          const fly = Math.max(120, dist(h, tm) / 0.8);
          this.emit({ t: 'shot', from: h.uid, to: tm.uid, kind: 'bone', dur: fly, element: 'neutral' });
          this.after(fly, () => { if (this.dealFixed(h, tm, sk.fixed!(lv, this.fixedCtx(h)), el, 0, 'magic') > 0) this.applyStatus(tm, sk, lv); });
          return;
        }
        const step = sk.id === 'water_ball' ? 70 : 150;
        const rm = this.resonate(h, sk, el); // 원소 공명
        this.emit({ t: 'skill', fx: sk.fx, from: h.uid, to: tm.uid, x: tm.x, y: tm.y, lv, hits, element: el });
        this.sound(sk.fx === 'firebolt' ? 'fire' : sk.fx === 'coldbolt' || sk.fx === 'frost' || sk.fx === 'waterball' ? 'ice' : sk.fx === 'lightning' ? 'thunder' : sk.fx === 'holy' ? 'heal' : 'cast');
        this.lexPacket(tm, 160 + hits * step + 100);
        this.holdBreak(tm, 160 + hits * step + 100);
        let total = 0;
        for (let i = 0; i < hits; i++) {
          this.after(160 + i * step, () => {
            const n = this.resolveMagic(h, tm, this.skMult(h, sk, lv) * rm, el, i, sk, lv);
            total += n;
            if (n > 0) this.applyStatus(tm, sk, lv);
            if (i === hits - 1 && hits > 1 && total > 0) this.emit({ t: 'dmg', uid: tm.uid, n: total, kind: 'total' });
            if (i === hits - 1 && sk.knock) this.knock(tm, h.x, h.y, sk.knock(lv));
            if (sk.id === 'frost_diver' && this.alive(tm) && !tm.m.boss && this.rng() * 100 < 35 + lv * 3) this.setStatus(tm, 'freeze', lv * 1500);
          });
        }
        return;
      }
      case 'aoe':
      case 'selfAoe': {
        if (sk.id === 'meteor') { this.meteorStorm(h, sk, lv, tm ? tm.x : c.x, tm ? tm.y : c.y); return; }
        const self = sk.kind === 'selfAoe';
        let cx = self ? h.x : (tm ? tm.x : c.x);
        let cy = self ? h.y : (tm ? tm.y : c.y);
        const r = this.areaR(sk, lv, h);
        const hits = sk.hits ? sk.hits(lv) : 1;
        if (sk.id === 'sightrasher') h.buffs = h.buffs.filter((b) => b.id !== 'sight'); // the fire spreads out and is gone
        // 창 찌르기: everything on the line to (and a bit past) the target
        const line = sk.id === 'spear_stab' && tm ? { ax: h.x, ay: h.y, bx: tm.x + (tm.x - h.x) * 0.3, by: tm.y + (tm.y - h.y) * 0.3 } : null;
        const inArea = (m: MobUnit) => line ? this.segDist(m, line.ax, line.ay, line.bx, line.by) <= 20 + this.bodyR(m) : Math.hypot(m.x - cx, m.y - cy) <= r + this.bodyR(m) * 0.5;
        this.emit({ t: 'skill', fx: sk.fx, from: h.uid, to: tm?.uid, x: cx, y: cy, lv, radius: r, hits, element: el });
        this.sound(el === 'fire' ? 'fire' : el === 'wind' ? 'thunder' : el === 'water' ? 'ice' : el === 'holy' ? 'heal' : sk.fx === 'shower' ? 'arrow' : 'hit_heavy');
        if (self || sk.fx === 'hammer' || sk.fx === 'bowling') this.emit({ t: 'shake', power: 2 });
        if (sk.reveal) for (const m of this.mobs) if (this.alive(m) && m.hiddenUntil > this.time && inArea(m)) { m.hiddenUntil = 0; m.hideNext = this.time + 12000; }
        // 소용돌이 베기: the swing drags what stands around the target into the whirl before it lands
        const wc = sk.id === 'bowling_bash' ? this.sig(h, 'whirl_cut') : 0;
        if (wc && tm) {
          for (const m of this.mobs) {
            if (m === tm || !this.targetable(m) || this.shunned(m) || m.m.boss || m.m.immobile || m.danger) continue;
            const dd = Math.hypot(m.x - tm.x, m.y - tm.y);
            if (dd <= r || dd > r + 30 + wc * 12) continue;
            const k = (r * 0.6) / dd;
            m.x = tm.x + (m.x - tm.x) * k; m.y = tm.y + (m.y - tm.y) * k; m.charge = null; m.dest = null;
          }
        }
        const span = 150 + hits * 180 + 100;
        for (const m of this.mobs) if (this.targetable(m) && inArea(m)) { this.lexPacket(m, span); this.holdBreak(m, span); }
        const rm = this.resonate(h, sk, el); // 원소 공명
        // 어둠 사냥: grimtooth from the shadows may crit
        const darkCrit = sk.id === 'grimtooth' && this.sig(h, 'dark_hunt') > 0 && this.heroHidden(h);
        const volley = (t0: number) => {
          for (let i = 0; i < hits; i++) {
            this.after(t0 + 150 + i * 180, () => {
              const list = this.mobs.filter((m) => this.targetable(m) && !this.shunned(m) && inArea(m));
              // 염 폭발: the blast is shared by all it hits · packs: 소용돌이 베기 / 질주 카트 / 폭풍의 눈
              const share = sk.split ? Math.max(1, list.length) : 1;
              const mul = this.skMult(h, sk, lv) / share * this.crowdMul(h, sk, list.length) * rm;
              // 소용돌이 베기: every extra monster swept up gives SP back (once per cast)
              if (i === 0 && t0 === 0 && sk.id === 'bowling_bash' && list.length > 1) h.sp = Math.min(h.d.maxSp, h.sp + this.sig(h, 'whirl_cut') * Math.min(4, list.length - 1));
              for (const m of list) {
                if (sk.id === 'frost_nova' && m.frozenUntil > this.time) continue; // already frozen: untouched
                if (sk.fixed) this.dealFixed(h, m, sk.fixed(lv, this.fixedCtx(h)), el, i);
                else if (sk.magic) this.resolveMagic(h, m, mul, el, i, sk, lv);
                else this.resolvePhys(h, m, mul, el, sk.hitBonus ? sk.hitBonus(lv) : 20, darkCrit, sk.fx === 'shower' ? 'pierce' : 'blunt', i);
                this.applyStatus(m, sk, lv, h);
                // (질주 카트: the cart drags what it hits along instead of scattering the pack)
                if (sk.knock && i === hits - 1 && !(sk.id === 'cart_revolution' && this.sig(h, 'cart_rush'))) this.knock(m, line ? h.x : self ? h.x : cx, line ? h.y : self ? h.y : cy, sk.knock(lv));
              }
            });
          }
        };
        volley(0);
        // 폭우의 화살 Lv 5: the sky opens a second time over the same spot
        if (sk.id === 'arrow_shower' && this.sig(h, 'storm_arrows') >= 5) {
          this.after(480, () => this.emit({ t: 'skill', fx: sk.fx, from: h.uid, x: cx, y: cy, lv, radius: r, hits, element: el }));
          volley(480);
        }
        if (sk.buff) this.applyBuff(h, sk, lv, h);
        return;
      }
      case 'heal': {
        if (tm) {
          // cast on an undead mob: the same light pillar, as holy damage
          this.emit({ t: 'skill', fx: 'heal', from: h.uid, to: tm.uid, x: tm.x, y: tm.y, lv });
          this.sound('heal');
          if (this.alive(tm)) {
            this.dealToMob(h, tm, Math.max(0, this.healDamage(h, tm, lv)), 'normal', 0);
            this.emit({ t: 'hit', uid: tm.uid, style: 'magic', element: 'holy' });
          }
          return;
        }
        const tgt = tu?.kind === 'hero' ? tu : h;
        const amt = this.healAmount(h, lv);
        this.emit({ t: 'skill', fx: 'heal', from: h.uid, to: tgt.uid, x: tgt.x, y: tgt.y, lv });
        this.sound('heal');
        this.healHero(tgt, Math.max(1, Math.floor(amt)), true);
        return;
      }
      case 'selfHeal': {
        this.emit({ t: 'skill', fx: 'heal', from: h.uid, to: h.uid, x: h.x, y: h.y, lv });
        this.sound('heal');
        this.healHero(h, 5, true);
        return;
      }
      case 'buff':
      case 'selfBuff': {
        const ally = tu?.kind === 'hero' && tu.state !== 'dead' ? tu : h;
        const targets = sk.kind === 'selfBuff' ? [h] : sk.buff?.party ? this.aliveHeroes() : sk.buff?.ally ? [ally] : [h];
        for (const a of targets) {
          if (sk.buff) this.applyBuff(a, sk, lv, h);
          if (sk.id === 'blessing' && a.buffs.some((b) => b.id === 'curse')) { a.buffs = a.buffs.filter((b) => b.id !== 'curse'); this.refresh(a); this.emit({ t: 'status', uid: a.uid, text: '저주 해제', color: '#ffe680' }); }
          this.emit({ t: 'skill', fx: sk.fx, from: h.uid, to: a.uid, x: a.x, y: a.y, lv });
        }
        if (sk.reveal) this.revealAround(h, sk, lv);
        if (sk.id === 'hiding' || sk.id === 'cloaking' || sk.id === 'play_dead') { h.hideDrainAt = 0; this.lose(h); h.target = null; }
        if (sk.id === 'poison_react') h.prCounters = [1, 1, 2, 2, 3, 3, 4, 4, 5, 6][lv - 1];
        // 몰이꾼의 호각: everything around comes running to the hunter
        if (sk.id === 'drover_whistle') {
          for (const m of this.mobs) {
            if (!this.targetable(m) || this.shunned(m) || m.m.boss || dist(m, h) > (sk.radius ?? 200) || !this.sees(m, h)) continue;
            m.target = h.uid; m.chaseSince = this.time;
            m.provokeUntil = this.time + 10000; m.provokeBy = h.uid; m.provokeDef = 0; m.provokeAtk = 0;
            this.emit({ t: 'status', uid: m.uid, text: '!', color: '#ffd84a' });
          }
          this.emit({ t: 'skill', fx: 'provoke', from: h.uid, to: h.uid, x: h.x, y: h.y, lv, radius: sk.radius ?? 200 });
        }
        this.sound('buff');
        return;
      }
      case 'revive': {
        if (sk.id === 'redemptio') {
          // 속죄: everyone who fell stands up at 50%, the priest pays with its own life
          const dead = this.heroes.filter((x) => x.state === 'dead' && x !== h);
          for (const x of dead) { this.revive(x, 0.5); this.emit({ t: 'status', uid: x.uid, text: '부활!', color: '#fff3a0' }); }
          this.sound('levelup');
          this.emit({ t: 'skill', fx: 'revive', from: h.uid, to: h.uid, x: h.x, y: h.y, lv });
          if (dead.length) { h.sp = 0; this.damageHero(h, h.hp, null, true); }
          return;
        }
        const dead = tu?.kind === 'hero' ? tu : undefined;
        if (!dead || dead.state !== 'dead') return;
        this.revive(dead, (sk.revivePct ? sk.revivePct(lv) : 30) / 100);
        this.sound('levelup');
        this.emit({ t: 'status', uid: dead.uid, text: '부활!', color: '#fff3a0' });
        return;
      }
      case 'debuff': { this.debuff(h, sk, lv, tm); return; }
      case 'ground':
      case 'trap': { this.placeGround(h, sk, lv, c); return; }
      case 'cure': {
        const a = tu?.kind === 'hero' ? tu : h;
        if (sk.id === 'cure' || sk.id === 'status_recovery') a.buffs = a.buffs.filter((b) => b.id !== 'blind' && (sk.id === 'cure' || b.id !== 'curse'));
        if (sk.id === 'detoxify') a.poisonUntil = 0;
        if (sk.id === 'slow_poison') a.slowPoisonUntil = this.time + lv * 10000;
        this.refresh(a);
        this.emit({ t: 'skill', fx: 'heal', from: h.uid, to: a.uid, x: a.x, y: a.y, lv });
        this.emit({ t: 'status', uid: a.uid, text: sk.name, color: '#c0ffd0' });
        this.sound('heal');
        return;
      }
      case 'utility': { this.utility(h, sk, lv); return; }
      case 'stance': {
        // 반격 자세: blocks the next melee blow and strikes back (mobHit)
        h.counterUntil = this.time + lv * 400;
        h.lockUntil = Math.max(h.lockUntil, h.counterUntil);
        this.setState(h, 'ready');
        this.emit({ t: 'skill', fx: 'counter', from: h.uid, to: h.uid, x: h.x, y: h.y, lv });
        return;
      }
    }
  }

  /** 정화: an undead monster may be wiped out at once; otherwise it takes a little holy damage (RO) */
  private turnUndead(h: HeroUnit, t: MobUnit, lv: number) {
    this.emit({ t: 'skill', fx: 'holy', from: h.uid, to: t.uid, x: t.x, y: t.y, lv, element: 'holy' });
    this.sound('heal');
    if (!this.alive(t) || this.mobElement(t) !== 'undead') { this.emit({ t: 'status', uid: t.uid, text: '효과 없음', color: '#c0c0c0' }); return; }
    if (this.rng() < this.turnChance(h, t, lv)) {
      this.emit({ t: 'status', uid: t.uid, text: '정화!', color: '#ffffff' });
      this.dealToMob(h, t, t.hp, 'crit', 0);
      return;
    }
    this.dealFixed(h, t, h.hero.baseLv + h.d.total.int + lv * 10, 'holy', 0);
  }

  /** 유성우: 2–7 meteors land around the target, each hitting its 7×7 1–5 times */
  private meteorStorm(h: HeroUnit, sk: SkillDef, lv: number, x: number, y: number) {
    const n = [2, 3, 3, 4, 4, 5, 5, 6, 6, 7][lv - 1], hits = sk.hits!(lv), R = 77 * this.areaMul(h, sk);
    const rm = this.resonate(h, sk, 'fire');
    this.sound('fire');
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2, rr = this.rng() * (sk.radius ?? 100) * 0.55;
      const mx = clamp(x + Math.cos(a) * rr, 30, this.zone.w - 30), my = clamp(y + Math.sin(a) * rr * 0.7, 80, this.zone.h - 30);
      this.after(i * 260, () => this.emit({ t: 'skill', fx: 'meteor', from: h.uid, x: mx, y: my, lv, radius: R * 0.8, hits: 1, element: 'fire' }));
      for (let j = 0; j < hits; j++) {
        this.after(i * 260 + 260 + j * 140, () => {
          const list = this.mobs.filter((m) => this.targetable(m) && !this.shunned(m) && Math.hypot(m.x - mx, m.y - my) <= R + this.bodyR(m) * 0.5);
          const mul = this.skMult(h, sk, lv) * this.crowdMul(h, sk, list.length) * rm;
          for (const m of list) {
            this.resolveMagic(h, m, mul, 'fire', j, sk, lv);
            this.applyStatus(m, sk, lv, h);
          }
        });
      }
    }
  }

  /** monster debuffs (provoke, decrease agi, signum crucis, lex divina / aeterna, stone curse, venom splasher…) */
  private debuff(h: HeroUnit, sk: SkillDef, lv: number, tm: MobUnit | undefined) {
    if (sk.id === 'signum_crucis') {
      this.emit({ t: 'skill', fx: sk.fx, from: h.uid, x: h.x, y: h.y, lv, radius: 120 });
      this.sound('heal');
      for (const m of this.mobs) {
        if (!this.targetable(m) || dist(m, h) > (sk.radius ?? 320) || !(this.unholy(m) || m.m.race === 'undead') || m.crucis) continue;
        if (this.rng() * 100 < 23 + lv * 4 + h.hero.baseLv - m.m.lv) { m.crucis = (10 + lv * 4) / 100; this.emit({ t: 'status', uid: m.uid, text: '성호', color: '#fff8c0' }); }
      }
      return;
    }
    if (!tm || !this.alive(tm)) return;
    if (sk.id === 'provoke') {
      this.emit({ t: 'skill', fx: sk.fx, from: h.uid, to: tm.uid, x: tm.x, y: tm.y, lv, radius: 110 });
      this.sound('buff');
      for (const m of this.mobs) {
        if (!this.targetable(m) || dist(m, tm) > 110 || this.shunned(m)) continue;
        // RO: undead and bosses shrug the weakening off — here they still turn to the knight
        const resist = !!m.m.boss || m.m.element === 'undead';
        m.provokeUntil = this.time + 30000;
        m.provokeBy = h.uid;
        m.provokeDef = resist ? 0 : (5 + lv * 5) / 100;
        m.provokeAtk = resist ? 0 : (2 + lv * 3) / 100;
        m.target = h.uid;
        this.emit({ t: 'status', uid: m.uid, text: '!', color: '#ff6060' });
      }
      return;
    }
    this.emit({ t: 'skill', fx: sk.fx, from: h.uid, to: tm.uid, x: tm.x, y: tm.y, lv, radius: 30 });
    this.sound('buff');
    switch (sk.id) {
      case 'decrease_agi': {
        const chance = 40 + lv * 2 + (h.hero.baseLv + h.d.total.int) / 5 - tm.m.mdef;
        if (tm.m.boss || this.rng() * 100 >= chance) { this.emit({ t: 'status', uid: tm.uid, text: '실패', color: '#c0c0c0' }); return; }
        tm.agiDown = 2 + lv; tm.agiDownUntil = this.time + (30 + lv * 10) * 1000;
        this.emit({ t: 'status', uid: tm.uid, text: '느려짐', color: '#a0b0c0' });
        return;
      }
      case 'lex_aeterna':
        if (tm.frozenUntil > this.time || tm.stoneUntil > this.time) return;
        tm.lex = true;
        this.emit({ t: 'status', uid: tm.uid, text: '영원의 율법', color: '#ff90b0' });
        return;
      case 'stone_curse': {
        const before = tm.stoneUntil;
        this.applyStatus(tm, sk, lv);
        if (lv >= 6 && tm.stoneUntil > before) { removeStack(this.s, 'k_redgem'); this.onPersist(); }
        return;
      }
      case 'venom_splasher': {
        // a poison bomb on a poisoned, weakened monster: it bursts a few seconds later around it (split, no FLEE roll)
        if (tm.m.boss || tm.poisonUntil <= this.time || tm.hp >= tm.maxHp * 0.75) return;
        this.emit({ t: 'status', uid: tm.uid, text: '독 폭탄!', color: '#e080ff' });
        const fuse = (4.5 + lv * 0.5) * 500;
        this.after(fuse, () => {
          const cx = tm.x, cy = tm.y;
          this.emit({ t: 'skill', fx: 'splasher', from: h.uid, x: cx, y: cy, lv, radius: sk.radius ?? 60, element: 'poison' });
          this.sound('hit_heavy');
          const list = this.mobs.filter((m) => this.targetable(m) && !this.shunned(m) && Math.hypot(m.x - cx, m.y - cy) <= (sk.radius ?? 60) + this.bodyR(m) * 0.5);
          for (const m of list) this.resolvePhys(h, m, this.skMult(h, sk, lv) / Math.max(1, list.length), 'poison', 0, false, 'blunt', 0, 0, { sure: true });
        });
        return;
      }
    }
    this.applyStatus(tm, sk, lv);
  }

  /** teleport (by hand), holy water, stones, back slide */
  private utility(h: HeroUnit, sk: SkillDef, lv: number) {
    switch (sk.id) {
      case 'aqua_benedicta': addItem(this.s, 'k_holywater', 1); this.emit({ t: 'skill', fx: 'heal', from: h.uid, to: h.uid, x: h.x, y: h.y, lv }); this.emit({ t: 'status', uid: h.uid, text: '성수 +1', color: '#d8f0ff' }); this.onPersist(); return;
      case 'find_stone': addItem(this.s, 'k_stone', 1); this.emit({ t: 'status', uid: h.uid, text: '돌 +1', color: '#c8c8c0' }); this.onPersist(); return;
      case 'teleport': this.tryTeleport(undefined); return;
      case 'back_slide': {
        const chaser = this.mobs.find((m) => this.alive(m) && m.target === h.uid) ?? this.mob(h.target);
        const fx = chaser ? chaser.x : h.x + h.facing * 10, fy = chaser ? chaser.y : h.y;
        const dx = h.x - fx, dy = h.y - fy, d = Math.hypot(dx, dy) || 1;
        this.emit({ t: 'skill', fx: 'backslide', from: h.uid, x: h.x, y: h.y, lv });
        h.x = clamp(h.x + dx / d * 5 * CELL, 24, this.zone.w - 24); h.y = clamp(h.y + dy / d * 5 * CELL * 0.8, 70, this.zone.h - 24);
        return;
      }
    }
  }

  private stateHold(h: HeroUnit, ms: number) {
    h.lockUntil = Math.max(h.lockUntil, this.time + ms);
  }

  private applyBuff(a: HeroUnit, sk: SkillDef, lv: number, caster?: HeroUnit) {
    const bs = sk.buff!;
    a.buffs = a.buffs.filter((b) => b.id !== bs.id);
    let shield = bs.shieldPct ? Math.floor(a.d.maxHp * bs.shieldPct(lv) / 100) : undefined;
    let hits = bs.shieldHits ? bs.shieldHits(lv) : bs.id === 'endure' ? 7 : undefined;
    let dur = bs.dur(lv);
    const bonus = bs.bonus(lv);
    // 성벽 (pr_wall): a thicker kyrie, longer and sturdier on the priest herself
    const wall = caster && bs.id === 'kyrie' ? this.sig(caster, 'bulwark') : 0;
    if (wall && shield !== undefined) {
      shield = Math.floor(shield * (1 + wall * 0.1));
      if (a === caster) { dur = Math.floor(dur * 1.5); if (hits !== undefined) hits += 2; }
    }
    // 마력 장벽 (wz_vit): a barrier of SP
    if (bs.id === 'mbarrier') shield = Math.floor(a.d.maxSp * lv * 0.08);
    // 광휘 (pr_crit): the gloria also sharpens crits
    const rad = caster && bs.id === 'gloria' ? this.sig(caster, 'radiance') : 0;
    if (rad) bonus.crit = (bonus.crit ?? 0) + rad * 2;
    a.buffs.push({ id: bs.id, name: bs.name, lv, until: this.time + dur, bonus, statPct: bs.statPct?.(lv), shield, shieldMax: shield, hits });
    this.refresh(a);
    this.emit({ t: 'buff', uid: a.uid, name: bs.name });
  }

  /** 뒤로 구르기: a back-liner with a melee monster on it rolls five cells away instead of walking */
  private tryBackSlide(h: HeroUnit): boolean {
    if (!(h.hero.skillSlots ?? []).includes('back_slide') || !(h.hero.skills.back_slide > 0)) return false;
    const sk = SKILLS.back_slide;
    if (!this.canPay(h, sk, 1)) return false;
    this.startSkill(h, sk, 1, null);
    return true;
  }

  // ───────────────────────────── ground effects (fire wall, safety wall, sanctuary, traps, quagmire, ice wall…)
  private placeGround(h: HeroUnit, sk: SkillDef, lv: number, c: CastInfo) {
    const spec = sk.ground!;
    const tu = this.unit(c.target);
    let x = tu ? tu.x : c.x, y = tu ? tu.y : c.y;
    let ax = 1, ay = 0;
    if (spec.where === 'between' && tu?.kind === 'mob') {
      // just in front of the monster, across its path to its prey
      const prey = this.heroUnit(tu.target) ?? h;
      const dx = prey.x - tu.x, dy = prey.y - tu.y, d = Math.hypot(dx, dy) || 1;
      const k = Math.min(0.5, (this.bodyR(tu) + 16) / d);
      x = tu.x + dx * k; y = tu.y + dy * k;
      ax = -dy / d; ay = dx / d;
    } else if (spec.where === 'self') { x = h.x; y = h.y; }
    // RO: the oldest goes when too many are out
    const mine = this.grounds.filter((g) => !g.done && g.owner === h.uid && g.sk.id === sk.id);
    if (sk.maxActive && mine.length >= sk.maxActive) this.endGround(mine[0], false);
    const g: GroundFx = {
      id: this.gfxSeq++, sk, lv, owner: h.uid, x: clamp(x, 30, this.zone.w - 30), y: clamp(y, 76, this.zone.h - 30), r: spec.r(lv) * this.areaMul(h, sk), ax, ay,
      line: spec.shape === 'line', born: this.time, until: this.time + spec.dur(lv),
      next: this.time + (sk.id === 'magnus' ? 300 : spec.every ?? 0), every: spec.every ?? 0, charges: spec.charges?.(lv) ?? Infinity,
      hits: {}, armAt: this.time + (sk.kind === 'trap' ? 250 : 0), done: false,
    };
    this.grounds.push(g);
    this.emit({ t: 'skill', fx: sk.kind === 'trap' ? 'trapset' : sk.fx, from: h.uid, x: g.x, y: g.y, lv, radius: g.r, element: sk.element ?? 'neutral' });
    this.sound(sk.kind === 'trap' ? 'click' : sk.element === 'fire' ? 'fire' : sk.element === 'water' ? 'ice' : sk.element === 'holy' ? 'heal' : 'buff');
  }

  /** a ground effect ends; an unsprung trap comes back with 덫 회수 */
  private endGround(g: GroundFx, fired: boolean) {
    if (g.done) return;
    g.done = true;
    const owner = this.heroUnit(g.owner);
    if (!fired && g.sk.kind === 'trap' && g.sk.id !== 'fire_pillar' && owner && (owner.hero.skills.remove_trap ?? 0) > 0 && g.sk.catalyst) addItem(this.s, g.sk.catalyst.id, g.sk.catalyst.n);
  }

  /** inside a ground effect? (lines: within a cell of the wall) */
  private inGround(g: GroundFx, p: { x: number; y: number }, pad: number) {
    if (g.line) return this.segDist(p, g.x - g.ax * g.r, g.y - g.ay * g.r, g.x + g.ax * g.r, g.y + g.ay * g.r) <= 12 + pad;
    return Math.hypot(p.x - g.x, p.y - g.y) <= g.r + pad;
  }

  /** per step: traps go off, walls burn, sanctuaries heal, the storm blows, the mud slows */
  private fxTick() {
    if (!this.grounds.length) return;
    for (const g of this.grounds) {
      if (g.done) continue;
      if (this.time >= g.until) {
        if (g.sk.id === 'blast_mine') this.detonate(g, null);
        this.endGround(g, false);
        continue;
      }
      const owner = this.heroUnit(g.owner) ?? this.leader();
      if (!owner) continue;
      if (g.sk.kind === 'trap') {
        if (this.time < g.armAt) continue;
        const trig = 14 + (owner.hero.skills.spring_trap ?? 0) * CELL * 0.5;
        const m = this.mobs.find((x) => this.targetable(x) && !this.shunned(x) && Math.hypot(x.x - g.x, x.y - g.y) <= trig + this.bodyR(x));
        if (m) this.detonate(g, m);
        continue;
      }
      if (!g.every || this.time < g.next) continue;
      g.next += g.every;
      this.groundPulse(g, owner);
    }
    this.grounds = this.grounds.filter((g) => !g.done);
  }

  private groundPulse(g: GroundFx, owner: HeroUnit) {
    const sk = g.sk, lv = g.lv;
    const inside = (m: MobUnit, pad = 0.5) => this.targetable(m) && !this.shunned(m) && this.inGround(g, m, this.bodyR(m) * pad);
    switch (sk.id) {
      case 'fire_wall':
        for (const m of this.mobs) {
          if (g.charges <= 0) break;
          if (!inside(m, 1)) continue;
          this.resolveMagic(owner, m, this.skMult(owner, sk, lv), 'fire', 0, sk, lv);
          // pushed back out the side it came from
          const side = Math.sign((m.x - g.x) * -g.ay + (m.y - g.y) * g.ax) || 1;
          this.knock(m, m.x + g.ay * side * 10, m.y - g.ax * side * 10, 2);
          g.charges--;
        }
        if (g.charges <= 0) this.endGround(g, true);
        return;
      case 'sanctuary': {
        const amt = [100, 200, 300, 400, 500, 600, 777, 777, 777, 777][lv - 1];
        for (const a of this.aliveHeroes()) {
          if (g.charges <= 0) break;
          if (!this.inGround(g, a, 0) || a.hp >= a.d.maxHp) continue;
          this.healHero(a, amt, true);
          g.charges--;
        }
        for (const m of this.mobs) {
          if (!inside(m) || !this.unholy(m)) continue;
          this.dealToMob(owner, m, Math.max(1, Math.floor(amt / 2 * elementMod('holy', this.mobElement(m)))), 'normal', 0);
          this.knock(m, g.x, g.y, 2);
        }
        if (g.charges <= 0) this.endGround(g, true);
        return;
      }
      case 'magnus':
        this.emit({ t: 'skill', fx: 'magnus', from: g.owner, x: g.x, y: g.y, lv, radius: g.r, hits: Math.min(6, lv), element: 'holy' });
        for (const m of this.mobs) if (inside(m) && this.unholy(m)) this.resolveMagic(owner, m, this.skMult(owner, sk, lv), 'holy', 0, sk, lv);
        return;
      case 'storm_gust': {
        g.charges--;
        const list = this.mobs.filter((m) => inside(m) && m.frozenUntil <= this.time); // frozen: the storm passes over it
        const mul = this.skMult(owner, sk, lv) * this.crowdMul(owner, sk, list.length); // 폭풍의 눈
        for (const m of list) {
          const n = (g.hits[m.uid] = (g.hits[m.uid] ?? 0) + 1);
          this.resolveMagic(owner, m, mul, 'water', n % 3, sk, lv);
          if (!this.alive(m)) continue;
          if (n >= 3 && m.m.boss !== 'mvp') this.setStatus(m, 'freeze', 4000);
          else this.knock(m, g.x, g.y, 2);
        }
        if (g.charges <= 0) this.endGround(g, true);
        return;
      }
      case 'quagmire':
        for (const m of this.mobs) if (inside(m) && !m.m.boss) { m.quag = lv * 0.1; m.quagUntil = this.time + 400; }
        return;
      case 'venom_dust': {
        // 맹독 누적: the mist thickens the poison on what already breathes it (a layer a second)
        const vs = this.sig(owner, 'venom_stack');
        for (const m of this.mobs) {
          if (!inside(m)) continue;
          if (this.poisonable(m)) this.setStatus(m, 'poison', 10000, owner);
          else if (vs && m.poisonUntil > this.time && m.poisonStacks < vs && (g.hits[m.uid] ?? 0) <= this.time) { g.hits[m.uid] = this.time + 1000; this.setStatus(m, 'poison', 10000, owner); }
        }
        return;
      }
    }
  }

  /** a trap goes off under `m` (or by itself: a blast mine running out) */
  private detonate(g: GroundFx, m: MobUnit | null) {
    const owner = this.heroUnit(g.owner) ?? this.leader();
    this.endGround(g, true);
    if (!owner) return;
    const sk = g.sk, lv = g.lv, el = sk.element ?? 'neutral';
    // 덫 연쇄: the blast sets off this hunter's other traps nearby, and traps hit harder
    const tc = sk.kind === 'trap' && sk.id !== 'fire_pillar' ? this.sig(owner, 'trap_chain') : 0;
    const tmul = 1 + tc * 0.15;
    if (tc) {
      const near = this.grounds.filter((x) => !x.done && x !== g && x.owner === g.owner && x.sk.kind === 'trap' && x.sk.id !== 'fire_pillar' && this.time >= x.armAt
        && Math.hypot(x.x - g.x, x.y - g.y) <= g.r + 4 * CELL);
      near.forEach((x, i) => this.after(120 + i * 90, () => {
        if (x.done) return;
        const vm = this.mobs.find((mm) => this.targetable(mm) && !this.shunned(mm) && Math.hypot(mm.x - x.x, mm.y - x.y) <= x.r + 30);
        this.detonate(x, vm ?? null);
      }));
    }
    const single = sk.id === 'land_mine' || sk.id === 'ankle_snare' || sk.id === 'skid_trap';
    const victims = single ? (m ? [m] : []) : this.mobs.filter((x) => this.targetable(x) && !this.shunned(x) && Math.hypot(x.x - g.x, x.y - g.y) <= g.r + this.bodyR(x) * 0.5);
    this.emit({ t: 'skill', fx: sk.id === 'fire_pillar' ? 'firepillar' : sk.id === 'ankle_snare' ? 'snare' : 'trapburst', from: owner.uid, to: m?.uid, x: g.x, y: g.y, lv, radius: Math.max(24, g.r), element: el });
    this.sound(sk.id === 'ankle_snare' || sk.id === 'skid_trap' ? 'click' : 'hit_heavy');
    const center = this.center();
    for (const v of victims) {
      switch (sk.id) {
        case 'skid_trap': if (v.m.race !== 'plant') this.knock(v, center.x, center.y, sk.knock!(lv)); break;
        case 'ankle_snare': {
          const dur = Math.min(20000, Math.max(3000, lv * 5 / Math.max(1, v.m.agi * 0.1) * 1000)) / (v.m.boss ? 5 : 1);
          v.snareUntil = this.time + dur;
          this.emit({ t: 'status', uid: v.uid, text: '속박!', color: '#ffe080' });
          break;
        }
        case 'shockwave_trap':
          (v.m.skills ?? []).forEach((ms, i) => { v.skillCd[i] = Math.max(v.skillCd[i], this.time) + ms.cd * (5 + lv * 15) / 100; });
          this.emit({ t: 'status', uid: v.uid, text: '기력 소진', color: '#a0a0ff' });
          break;
        case 'freezing_trap':
          this.resolvePhys(owner, v, this.skMult(owner, sk, lv) * tmul, 'water', 0, false, 'blunt', 0, 0, { sure: true });
          if (!v.m.boss) this.setStatus(v, 'freeze', lv * 3000);
          break;
        case 'fire_pillar': {
          const per = sk.fixed!(lv, this.fixedCtx(owner));
          for (let i = 0; i < sk.hits!(lv); i++) this.after(i * 110, () => this.dealFixed(owner, v, per, 'fire', i));
          break;
        }
        case 'flasher': if (v.m.race !== 'plant' && v.m.boss !== 'mvp') this.applyStatus(v, sk, lv); break;
        default:
          if (sk.fixed) this.dealFixed(owner, v, sk.fixed(lv, this.fixedCtx(owner)) * tmul, el, 0);
          this.applyStatus(v, sk, lv);
      }
    }
  }

  /** 말하는 상자: a hunter's box shouts where a card turned up */
  private talkie(x: number, y: number, text: string) {
    const h = this.heroes.find((x2) => skillOn(x2.hero, 'talkie_box'));
    if (!h) return;
    this.grounds.push({ id: this.gfxSeq++, sk: SKILLS.talkie_box, lv: 1, owner: h.uid, x, y, r: 10, ax: 1, ay: 0, line: false, born: this.time, until: this.time + 5000,
      next: Infinity, every: 0, charges: 0, hits: {}, armAt: Infinity, done: false, text });
  }

  healHero(h: HeroUnit, n: number, show: boolean) {
    if (h.state === 'dead' || n <= 0) return;
    if (this.rift) n = Math.max(1, Math.floor(n * this.rift.mods.healMul)); // 저주받은 땅
    const before = h.hp;
    h.hp = Math.min(h.d.maxHp, h.hp + n);
    if (show) this.emit({ t: 'dmg', uid: h.uid, n: Math.max(n, h.hp - before), kind: 'heal' });
  }

  private regen(h: HeroUnit) {
    const town = this.zone.id === 'town';
    const mul = town ? 6 : h.sitting ? 2 : 1;
    if (this.time >= h.hpTickAt) {
      h.hpTickAt = this.time + HP_TICK / (h.sitting || town ? 2 : 1);
      // RO: no natural HP recovery while walking — 이동 중 회복 keeps half of it; hiding stops it too
      const walk = h.state === 'walk' && !town ? ((h.hero.skills.moving_hp ?? 0) > 0 ? 0.5 : 0) : 1;
      const hid = this.hasBuff(h, 'hiding') || this.hasBuff(h, 'cloak') ? 0 : 1;
      if (h.poisonUntil < this.time && h.hp < h.d.maxHp) h.hp = Math.min(h.d.maxHp, h.hp + Math.floor(h.d.hpRegen * mul * walk * hid * (this.rift?.mods.healMul ?? 1)));
    }
    if (this.time >= h.spTickAt) {
      h.spTickAt = this.time + SP_TICK / (h.sitting || town ? 2 : 1);
      if (h.sp < h.d.maxSp) h.sp = Math.min(h.d.maxSp, h.sp + Math.floor(h.d.spRegen * mul));
    }
  }

  /** quick-slot auto use: lower trigger % first so emergency potions win */
  private autoItems() {
    if (this.zone.id === 'town') return;
    this.tryWarp();
    const q = this.s.quick;
    const order = q.map((_, i) => i)
      .filter((i) => q[i].id && q[i].auto && (this.s.stacks[q[i].id!] ?? 0) > 0)
      .sort((a, b) => q[a].pct - q[b].pct);
    const alive = this.aliveHeroes();
    if (!alive.length) return;
    for (const i of order) {
      const id = q[i].id!;
      const trig = quickTrigger(id);
      if (trig === 'buff') {
        const b = ITEMS[id].buff!;
        // keep buffs up while hunting, but not while the whole party is resting
        if (alive.every((h) => h.sitting)) continue;
        const need = alive.some((h) => { const x = h.buffs.find((bf) => bf.id === b.id); return !x || x.until - this.time < 1500; });
        if (need) this.useBuffItem(i, id);
        continue;
      }
      if (trig === 'none') continue;
      let best: HeroUnit | undefined; let br = 1;
      for (const h of alive) {
        if (this.time < h.potAt) continue;
        const r = trig === 'hp' ? h.hp / h.d.maxHp : h.sp / h.d.maxSp;
        if (r * 100 < q[i].pct && r < br) { br = r; best = h; }
      }
      if (best) this.drinkSlot(i, best, id);
    }
  }

  /** manual tap on a quick slot; returns an error message or null */
  useQuick(i: number): string | null {
    const slot = this.s.quick[i];
    if (!slot?.id) return '빈 슬롯입니다.';
    const id = slot.id;
    if (!((this.s.stacks[id] ?? 0) > 0)) return `${ITEMS[id].name}이(가) 없습니다.`;
    const alive = this.aliveHeroes();
    if (!alive.length) return '사용할 수 있는 동료가 없습니다.';
    const trig = quickTrigger(id);
    if (trig === 'buff') { this.useBuffItem(i, id); return null; }
    if (trig === 'none') return '사용할 수 없는 아이템입니다.';
    let best = alive[0]; let br = Infinity;
    for (const h of alive) { const r = trig === 'hp' ? h.hp / h.d.maxHp : h.sp / h.d.maxSp; if (r < br) { br = r; best = h; } }
    if (br >= 1) return trig === 'hp' ? '모두 HP가 가득 찼습니다.' : '모두 SP가 가득 찼습니다.';
    this.drinkSlot(i, best, id);
    return null;
  }

  /** world time of the last use per quick slot (UI pulses on change) */
  quickUsed: number[] = [];

  private drinkSlot(i: number, h: HeroUnit, id: string) {
    const he = ITEMS[id].heal!;
    // 무게 증가 (a merchant in the party): quick-slot potions heal a little more
    const mul = (he.hp ? (1 + (h.d.b.potionPct ?? 0) / 100) * (1 + h.d.total.vit * 2 / 100) : 1 + (h.d.total.int * 2) / 100) * (1 + partyPerks(this.s).potionPct / 100);
    this.drink(h, id, mul);
    this.quickUsed[i] = this.time;
  }

  private useBuffItem(i: number, id: string) {
    const d = ITEMS[id];
    const b = d.buff!;
    removeStack(this.s, id);
    for (const h of this.aliveHeroes()) {
      h.buffs = h.buffs.filter((x) => x.id !== b.id);
      h.buffs.push({ id: b.id, name: b.name, lv: 1, until: this.time + b.dur, bonus: b.bonus });
      this.refresh(h);
      this.emit({ t: 'skill', fx: b.bonus.weaponElement ? 'endure' : 'conc', from: h.uid, to: h.uid, x: h.x, y: h.y, lv: 1 });
    }
    const lead = this.leader();
    if (lead) this.emit({ t: 'status', uid: lead.uid, text: d.name + '!', color: '#fff6c0' });
    this.sound('buff');
    this.log(`${d.name} 사용 — ${b.name} ${Math.round(b.dur / 60000)}분`, '#c8e8ff');
    this.quickUsed[i] = this.time;
    this.onPersist();
  }

  /** remaining ms of a party item buff (looks at the first living hero) */
  buffLeft(buffId: string): number {
    for (const h of this.aliveHeroes()) {
      const b = h.buffs.find((x) => x.id === buffId);
      if (b) return Math.max(0, b.until - this.time);
    }
    return 0;
  }

  private drink(h: HeroUnit, id: string, mul: number) {
    removeStack(this.s, id);
    h.potAt = this.time + 650;
    const he = ITEMS[id].heal!;
    if (he.hp) this.healHero(h, Math.floor((he.hp[0] + this.rng() * (he.hp[1] - he.hp[0])) * mul), true);
    if (he.sp) {
      const n = Math.floor((he.sp[0] + this.rng() * (he.sp[1] - he.sp[0])) * mul);
      h.sp = Math.min(h.d.maxSp, h.sp + n);
      this.emit({ t: 'dmg', uid: h.uid, n, kind: 'sp' });
    }
    this.emit({ t: 'heal', uid: h.uid });
    this.sound('potion');
    this.onPersist();
  }

  private revive(h: HeroUnit, ratio: number) {
    h.state = 'idle';
    h.stateT = this.time;
    h.hp = Math.max(1, Math.floor(h.d.maxHp * ratio));
    h.sp = Math.max(h.sp, Math.floor(h.d.maxSp * ratio));
    const l = this.leader();
    if (l && l !== h) { h.x = l.x - 20; h.y = l.y + 10; }
    this.emit({ t: 'skill', fx: 'revive', from: h.uid, to: h.uid, x: h.x, y: h.y, lv: 1 });
    this.log(`${h.hero.name}이(가) 다시 일어났습니다.`, '#a0ffa0');
  }

  // ───────────────────────────── hero damage, death
  damageHero(h: HeroUnit, n: number, from: MobUnit | null, dot = false) {
    if (h.state === 'dead') return;
    const sh = !dot ? h.buffs.find((b) => b.shield && b.shield > 0 && b.until > this.time) : undefined;
    if (sh) {
      const absorbed = Math.min(n, sh.shield!);
      sh.shield! -= absorbed;
      n -= absorbed;
      // kyrie also breaks after its hit count (5 + lv/2)
      if (sh.hits !== undefined) sh.hits--;
      if (sh.shield! <= 0 || (sh.hits !== undefined && sh.hits <= 0)) { h.buffs = h.buffs.filter((b) => b !== sh); this.emit({ t: 'status', uid: h.uid, text: '보호막 파괴', color: '#bfe8ff' }); }
      // a block reads as a block: sky-blue absorbed amount, and no hurt flash when nothing got through
      if (absorbed > 0) this.emit({ t: 'dmg', uid: h.uid, n: absorbed, kind: 'absorb' });
      if (n <= 0) return;
    }
    h.hp -= n;
    h.hurtAt = this.time;
    this.emit({ t: 'dmg', uid: h.uid, n, kind: 'taken' });
    // 인내 holds for 7 monster hits
    const en = !dot && from ? h.buffs.find((b) => b.id === 'endure') : undefined;
    if (en && en.hits !== undefined && --en.hits <= 0) { h.buffs = h.buffs.filter((b) => b !== en); this.refresh(h); }
    if (!dot) {
      if (h.cast && h.cast.sk.magic && !en && this.rng() < 0.15) {
        // light interruption: push the cast back a little (RO flinch)
        h.cast.end += 150;
      }
      if (h.sitting) { h.sitting = false; this.setState(h, 'idle'); }
      this.sound('player_hurt');
    }
    if (h.hp <= 0) {
      h.hp = 0;
      h.cast = null;
      h.sitting = false;
      this.setState(h, 'dead');
      h.deadUntil = this.time + REVIVE_MS;
      h.buffs = [];
      this.emit({ t: 'die', uid: h.uid });
      this.sound('player_die');
      this.log(`${h.hero.name}이(가) 쓰러졌습니다...`, '#ff8080');
      for (const m of this.mobs) if (m.target === h.uid) m.target = null;
      if (this.aliveHeroes().length === 0) this.wipe();
      void from;
    }
  }

  private wipeTimes: number[] = [];
  /** auto-summon pauses after a boss wipes the party */
  bossRetryAt = 0;

  private wipe() {
    if (this.rift) { this.riftWipe(); return; }
    this.wipeUntil = this.time + 3500;
    this.wipeTimes = this.wipeTimes.filter((t) => this.time - t < 6 * 60_000);
    this.wipeTimes.push(this.time);
    for (const m of this.mobs) {
      if (m.m.boss && m.state !== 'dead') {
        this.log(`${m.m.name}이(가) 자리를 떠났습니다. 더 강해져서 다시 도전하세요. (게이지 유지)`, '#ffb080');
        const prog = this.s.progress[this.zone.id];
        if (m.m.boss === 'mvp') prog.mvpGauge = this.zone.mvpGauge; else prog.bossGauge = this.zone.bossGauge;
        m.state = 'dead'; m.deadAt = this.time - CORPSE_MS + 200;
        this.bossRetryAt = this.time + 5 * 60_000;
      }
    }
    for (const m of this.mobs) if (m.danger && m.state !== 'dead') this.dangerLeave(m, `${m.m.name}이(가) 쓰러진 파티를 두고 떠났다.`);
    this.run = null;
    this.mobs = this.mobs.filter((m) => !m.summoned);
    this.s.totals.deaths++;
    this.s.rate.deaths++;
    for (const h of this.heroes) {
      const loss = h.hero.cls === 'novice' ? 0 : Math.floor(expNext(h.hero.baseLv) * 0.01); // RO: novices lose nothing
      h.hero.baseExp = Math.max(0, h.hero.baseExp - loss);
    }
    this.emit({ t: 'announce', text: '파티 전멸... 경험치 1%를 잃었습니다', kind: 'wipe' });
    this.log('파티가 전멸했습니다. (경험치 -1%) 잠시 후 재정비합니다.', '#ff6060');
    this.onPersist();
  }

  private recoverWipe() {
    this.wipeUntil = 0;
    if (this.rift) { this.restParty(); return; }
    if (this.wipeTimes.length >= 3) {
      // fall back to the strongest easier map the party has open — same region first, never into a secret place
      const cur = this.zone;
      const easier = ZONES.filter((z) => z.id !== 'town' && z.id !== cur.id && !z.gate && !isExpedition(z) && this.s.unlocked.includes(z.id) && z.lv[0] < cur.lv[0])
        .sort((a, b) => (b.region === cur.region ? 1 : 0) - (a.region === cur.region ? 1 : 0) || b.lv[0] - a.lv[0]);
      const prev = easier[0];
      this.wipeTimes = [];
      if (prev) {
        this.log(`너무 위험합니다! 「${prev.name}」(으)로 후퇴합니다.`, '#ff9a6a');
        this.emit({ t: 'announce', text: `「${prev.name}」(으)로 후퇴`, kind: 'wipe' });
        this.heroes.forEach((h) => { h.state = 'idle'; h.hp = h.d.maxHp; h.sp = h.d.maxSp; });
        this.setZone(prev.id);
        this.onPersist();
        return;
      }
    }
    for (const m of this.mobs) {
      m.target = null; m.provokeUntil = 0;
      if (m.m.boss) { m.hp = m.maxHp; }
    }
    const sx = 80, sy = this.zone.h * 0.5;
    this.heroes.forEach((h, i) => {
      h.state = 'idle'; h.stateT = this.time;
      h.hp = h.d.maxHp; h.sp = h.d.maxSp;
      h.x = sx + i * 10; h.y = sy + i * 18;
      h.target = null; h.cast = null; h.sitting = false;
      h.poisonUntil = 0;
    });
    // nudge mobs away from the respawn point
    this.mobs = this.mobs.filter((m) => !(m.state !== 'dead' && Math.hypot(m.x - sx, m.y - sy) < 140 && !m.m.boss));
    this.log('재정비 완료. 다시 사냥을 시작합니다.', '#a0e0ff');
  }

  // ───────────────────────────── mobs
  private mobTick(m: MobUnit, dt: number) {
    if (m.state === 'dead') return;
    if (m.state === 'spawn') {
      if (this.time >= m.lockUntil) this.setState(m, 'idle');
      else return;
    }
    if (this.rift && m.uid === this.rift.guardian) this.guardianTick(m);
    if (m.poisonUntil > this.time && this.time >= m.poisonNext) {
      m.poisonNext = this.time + 1000;
      const n = Math.min(Math.floor(m.poisonDmg * (1 + 1.5 * Math.max(0, m.poisonStacks - 1)) * (this.rift?.mods.fixedMul ?? 1)), m.hp - 1);
      if (n > 0) { m.hp -= n; this.emit({ t: 'dmg', uid: m.uid, n, kind: 'normal' }); }
    }
    // 석화: the stone crumbles 1% of max HP every 5 s (not below 25%)
    if (m.stoneUntil > this.time && Math.floor(this.time / 5000) !== Math.floor((this.time - dt) / 5000) && m.hp > m.maxHp * 0.25) {
      const n = Math.floor(m.maxHp * 0.01);
      if (n > 0) { m.hp -= n; this.emit({ t: 'dmg', uid: m.uid, n, kind: 'normal' }); }
    }
    if (m.frozenUntil > this.time || m.stunUntil > this.time || m.stoneUntil > this.time || m.sleepUntil > this.time) return;
    if (m.charge) { this.chargeTick(m, dt); return; }
    if (this.time < m.lockUntil) return;
    if (m.state === 'attack' || m.state === 'hurt' || m.state === 'cast') this.setState(m, 'idle');
    // hiding monsters duck out of sight when hurt, then come back for an ambush
    if (m.m.hides) this.mobHide(m);
    if (m.hiddenUntil > this.time) { this.wander(m, dt); return; }

    // target
    if (m.provokeUntil > this.time) {
      const p = this.heroUnit(m.provokeBy);
      if (p && p.state !== 'dead') m.target = p.uid;
    }
    if (m.danger) this.dangerThink(m);
    let t = this.heroUnit(m.target);
    if (!t || t.state === 'dead' || !this.sees(m, t)) { m.target = null; t = undefined; }
    if (!t && m.m.aggressive && !(m.danger && m.boredUntil > this.time)) {
      const range = m.m.boss ? 320 : m.danger ? 160 : 130;
      let bd = range;
      for (const h of this.heroes) {
        if (h.state === 'dead' || !this.sees(m, h)) continue;
        const d = dist(h, m);
        if (d < bd) { bd = d; t = h; }
      }
      if (t) { m.target = t.uid; m.chaseSince = this.time; if (!m.m.boss) this.emit({ t: 'status', uid: m.uid, text: '!', color: m.danger ? '#ff2030' : '#ff6060' }); }
    }

    // 침묵: no monster skills
    if (m.m.skills && t && m.silenceUntil <= this.time && this.mobSkill(m, t)) return;

    if (!t) { this.wander(m, dt); return; }
    const d = dist(m, t) - 8;
    if (d > m.m.range) {
      // 앵클 스네어: held in place (it still swings at whatever is in reach)
      if (m.m.immobile || m.snareUntil > this.time) { if (m.m.immobile) m.target = null; else this.setState(m, 'idle'); return; }
      // stop at body contact (never inside the hero's collision ring, or the crowd shoves the hero around)
      const contact = this.bodyR(m) + this.bodyR(t) + 5;
      this.moveTo(m, t.x, t.y, this.mobSpeed(m), dt, Math.min(Math.max(m.m.range * 0.8, contact), m.m.range + 6));
      return;
    }
    m.facing = t.x >= m.x ? 1 : -1;
    if (this.time < m.atkReady) { if (m.state === 'walk') this.setState(m, 'idle'); return; }
    this.mobAttack(m, t);
  }

  /** walking speed with 속도 감소 (−25%) and 늪 (−50%) */
  private mobSpeed(m: MobUnit) {
    return m.m.speed * (m.agiDownUntil > this.time ? 0.75 : 1) * (m.quagUntil > this.time ? 0.5 : 1);
  }

  /** a hiding monster (data: hides) slips out of sight when hurt, for a few seconds */
  private mobHide(m: MobUnit) {
    if (m.hiddenUntil > this.time || this.time < m.hideNext || m.hp > m.maxHp * 0.75 || m.target === null) return;
    m.hiddenUntil = this.time + 5000;
    m.hideNext = this.time + 16000;
    m.target = null; m.provokeUntil = 0;
    for (const h of this.heroes) if (h.target === m.uid) h.target = null;
    const c = this.center(), dx = m.x - c.x, dy = m.y - c.y, d = Math.hypot(dx, dy) || 1;
    m.dest = { x: clamp(m.x + dx / d * 110, 40, this.zone.w - 40), y: clamp(m.y + dy / d * 80, 80, this.zone.h - 40) };
    m.wanderAt = this.time + 5000;
    this.emit({ t: 'status', uid: m.uid, text: '숨었다!', color: '#c8b8e0' });
  }

  private wander(m: MobUnit, dt: number) {
    if (m.m.immobile || m.snareUntil > this.time) { this.setState(m, 'idle'); return; }
    if (m.danger && this.time >= m.wanderAt) {
      // danger monsters roam the whole map
      m.wanderAt = this.time + 3000 + this.rng() * 3500;
      m.dest = this.rng() < 0.8 ? { x: 60 + this.rng() * (this.zone.w - 120), y: 100 + this.rng() * (this.zone.h - 150) } : null;
    }
    if (!m.danger && this.time >= m.wanderAt) {
      m.wanderAt = this.time + 2000 + this.rng() * 3500;
      if (this.rng() < 0.6) {
        m.dest = {
          x: clamp(m.home.x + (this.rng() - 0.5) * 160, 40, this.zone.w - 40),
          y: clamp(m.home.y + (this.rng() - 0.5) * 120, 80, this.zone.h - 40),
        };
      } else m.dest = null;
    }
    if (m.dest) {
      if (this.moveTo(m, m.dest.x, m.dest.y, this.mobSpeed(m) * 0.5, dt, 3)) m.dest = null;
    } else this.setState(m, 'idle');
  }

  private mobAttack(m: MobUnit, t: HeroUnit) {
    this.setState(m, 'attack');
    m.atkReady = this.time + m.m.delay;
    m.lockUntil = this.time + 380;
    if (m.m.range > 60) {
      const fly = Math.max(140, dist(m, t) / 0.6);
      this.emit({ t: 'shot', from: m.uid, to: t.uid, kind: m.m.sprite === 'flower' ? 'bone' : m.m.sprite.startsWith('book') ? 'shadow' : 'arrow', dur: fly, element: m.m.atkElement ?? 'neutral' });
      this.after(fly, () => this.mobHit(m, t, 1, m.m.atkElement ?? 'neutral', false));
    } else {
      this.after(220, () => this.mobHit(m, t, 1, m.m.atkElement ?? 'neutral', false));
    }
  }

  /** `posthumous`: the blow lands even though the monster just fell (정예 「폭발」) */
  private mobHit(m: MobUnit, t: HeroUnit, mult: number, el: Element, magic: boolean, sure = false, posthumous = false) {
    if ((m.state === 'dead' && !posthumous) || t.state === 'dead') return;
    const d = t.d;
    const melee = m.m.range < 4 * CELL;
    if (!magic && !sure) {
      // 수호벽 (melee, counts its blocks) / 장막 (ranged): the blow never lands
      const ward = this.inWard(t, melee);
      if (ward) {
        if (melee && --ward.charges <= 0) this.endGround(ward, true);
        this.emit({ t: 'status', uid: t.uid, text: melee ? '수호벽!' : '장막!', color: '#ff9ad8' });
        return;
      }
      // 반격: braced — block the swing and strike back with a critical that ignores DEF
      // (역습의 맹세: now and then even without the stance, and the struck monster turns on the knight)
      const oath = this.sig(t, 'counter_oath');
      const braced = t.counterUntil > this.time || (oath > 0 && !t.d.ranged && !t.cast && this.rng() * 100 < oath * 1.4);
      if (braced && m.m.range < 60 && !this.shunned(m)) {
        t.counterUntil = 0;
        t.lockUntil = Math.min(t.lockUntil, this.time + 120);
        this.emit({ t: 'status', uid: t.uid, text: '반격!', color: '#ffb0a0' });
        if (oath && !m.m.boss) { m.provokeUntil = Math.max(m.provokeUntil, this.time + 10000); m.provokeBy = t.uid; m.target = t.uid; }
        this.after(80, () => this.resolvePhys(t, m, 100, t.d.weaponElement, 0, true, 'slash', 0, 0, { forceCrit: true, ignoreDef: true, counter: true }));
        return;
      }
      if (this.rng() * 100 < d.pdodge) {
        this.emit({ t: 'dmg', uid: t.uid, n: 0, kind: 'lucky' });
        this.onDodge(t, m);
        return;
      }
      const crowd = this.mobs.reduce((a, x) => a + (x.state !== 'dead' && x.target === t.uid && dist(x, t) <= x.m.range + 40 ? 1 : 0), 0);
      const flee = d.flee * Math.max(0, 1 - 0.1 * (this.rift?.mods.crowdK ?? 1) * Math.max(0, crowd - 2)); // 균열 포위: ×2
      const dex = m.m.dex * (1 - (m.quagUntil > this.time ? m.quag : 0)); // 늪 dulls its aim
      let rate = clamp(80 + m.m.lv + dex - flee, 5, 95);
      if (m.blindUntil > this.time) rate -= 25;
      if (this.rng() * 100 >= rate) {
        this.emit({ t: 'dmg', uid: t.uid, n: 0, kind: 'miss' });
        this.sound('miss');
        this.onDodge(t, m);
        return;
      }
    }
    let dmg = (m.m.atk[0] + this.rng() * (m.m.atk[1] - m.m.atk[0])) * mult;
    if (m.provokeUntil > this.time) dmg *= 1 + m.provokeAtk;
    dmg *= elementMod(el, d.armorElement);
    if (magic) dmg = dmg * (100 - d.mdef) / 100 - d.intMdef;
    else dmg = dmg * (100 - d.def) / 100 - (d.vitDef + this.rng() * d.total.vit * 0.3 * (1 + (d.b.vitDefPct ?? 0) / 100));
    dmg *= 1 - (d.b.raceRes?.[m.m.race] ?? 0) / 100;
    dmg *= 1 - (d.b.eleRes?.[el] ?? 0) / 100;
    dmg *= 1 - (d.b.dmgReducePct ?? 0) / 100;
    dmg *= 1 - this.auraCut(t); // 성역의 오라
    dmg -= d.b.raceFlatRes?.[m.m.race] ?? 0; // 신의 가호, after DEF
    // 마력 갑주: SP soaks physical blows — the fuller the SP, the more (RO energy coat)
    if (!magic && this.hasBuff(t, 'ecoat') && t.sp > 0) {
      const r = t.sp / d.maxSp;
      const step = r > 0.8 ? 5 : r > 0.6 ? 4 : r > 0.4 ? 3 : r > 0.2 ? 2 : 1;
      dmg *= 1 - step * 6 / 100;
      t.sp = Math.max(0, t.sp - Math.ceil(d.maxSp * (0.5 + step * 0.5) / 100));
      if (t.sp <= 0) t.buffs = t.buffs.filter((b) => b.id !== 'ecoat');
    }
    const n = Math.max(1, Math.floor(dmg));
    this.emit({ t: 'hit', uid: t.uid, style: 'claw', element: el });
    // 독 반격: a poisonous melee blow is paid back in full; anything else may get an envenom in return
    if (!magic && m.m.range < 60 && this.hasBuff(t, 'preact') && !this.shunned(m)) {
      const pr = t.buffs.find((b) => b.id === 'preact')!;
      if ((m.m.atkElement ?? m.m.element) === 'poison') {
        t.buffs = t.buffs.filter((b) => b !== pr);
        this.emit({ t: 'status', uid: t.uid, text: '독 반격!', color: '#e070b0' });
        this.after(80, () => this.resolvePhys(t, m, 100 + pr.lv * 30, 'poison', 0, false, 'slash'));
      } else if (t.prCounters > 0 && this.rng() < 0.5) {
        if (--t.prCounters <= 0) t.buffs = t.buffs.filter((b) => b !== pr);
        const ev = SKILLS.envenom;
        this.after(80, () => this.releaseCast(t, { sk: ev, lv: Math.max(1, t.hero.skills.envenom ?? 1), target: m.uid, x: m.x, y: m.y, start: this.time, end: this.time }, true));
      }
    }
    if (el === 'poison' && !magic && this.rng() * 100 < 8 * (1 - (d.b.statusRes?.poison ?? 0) / 100)) {
      t.poisonUntil = this.time + 8000; t.poisonNext = this.time + 1000;
      this.emit({ t: 'status', uid: t.uid, text: '중독', color: '#c080ff' });
    }
    if (d.b.procs) for (const p of d.b.procs) if (p.on === 'hit' && this.rng() * 100 < p.chance) this.runProc(t, m, p);
    this.damageHero(t, n, m);
    // 균열 정예 「흡혈」: a quarter of the hit heals the monster
    if (m.elite?.affix === 'vampiric' && m.state !== 'dead') m.hp = Math.min(m.maxHp, m.hp + Math.floor(n * 0.25));
    // M7: the monster's own status on hit (핏빛 기사 = curse, 종 치는 유령 = blind)
    const oh = m.m.onHit;
    if (oh && (t.state as string) !== 'dead' && this.rng() * 100 < oh.chance) {
      if (oh.status === 'curse') this.curseHero(t); else this.blindHero(t);
    }
  }

  private mobSkill(m: MobUnit, t: HeroUnit): boolean {
    const skills = m.m.skills!;
    for (let i = 0; i < skills.length; i++) {
      const sk = skills[i];
      if (this.time < m.skillCd[i]) continue;
      if (sk.below !== undefined && m.hp / m.maxHp > sk.below) continue;
      if ((sk.kind === 'summon' || sk.kind === 'howl') && this.mobs.filter((x) => x.summoned && x.state !== 'dead').length >= 6) continue;
      if (sk.kind === 'charge' && dist(m, t) < 60) continue;
      m.skillCd[i] = this.time + sk.cd;
      this.doMobSkill(m, t, sk);
      return true;
    }
    return false;
  }

  private doMobSkill(m: MobUnit, t: HeroUnit, sk: MobSkill) {
    const el = sk.element ?? m.m.atkElement ?? m.m.element;
    switch (sk.kind) {
      case 'slam': {
        const r = sk.radius ?? 90;
        this.setState(m, 'cast');
        m.lockUntil = this.time + 1100;
        this.emit({ t: 'telegraph', x: m.x, y: m.y, r, dur: 900, color: el === 'shadow' ? '#a060ff' : '#ff5040' });
        this.after(900, () => {
          if (m.state === 'dead') return;
          this.setState(m, 'attack');
          this.emit({ t: 'skill', fx: el === 'shadow' ? 'darkslam' : 'slam', from: m.uid, x: m.x, y: m.y, lv: 1, radius: r });
          this.emit({ t: 'shake', power: 5 });
          this.sound('hit_heavy');
          for (const h of this.heroes) if (h.state !== 'dead' && dist(h, m) <= r) this.mobHit(m, h, sk.mult ?? 1.5, el === 'water' ? 'neutral' : el, el === 'shadow', true);
        });
        return;
      }
      case 'roots': {
        const r = sk.radius ?? 80;
        const tx = t.x, ty = t.y;
        this.setState(m, 'cast');
        m.lockUntil = this.time + 1000;
        this.emit({ t: 'telegraph', x: tx, y: ty, r, dur: 900, color: '#80c040' });
        this.after(900, () => {
          if (m.state === 'dead') return;
          this.emit({ t: 'skill', fx: 'roots', from: m.uid, x: tx, y: ty, lv: 1, radius: r });
          this.emit({ t: 'shake', power: 3 });
          this.sound('hit_heavy');
          for (const h of this.heroes) if (h.state !== 'dead' && Math.hypot(h.x - tx, h.y - ty) <= r) this.mobHit(m, h, sk.mult ?? 1.5, 'earth', false, true);
        });
        return;
      }
      case 'charge': {
        let far = t;
        for (const h of this.heroes) if (h.state !== 'dead' && dist(h, m) > dist(far, m) && dist(h, m) < 320) far = h;
        this.emit({ t: 'telegraph', x: far.x, y: far.y, r: 30, dur: 500, color: '#ffb040' });
        this.setState(m, 'cast');
        m.lockUntil = this.time + 500;
        this.after(500, () => {
          if (m.state === 'dead' || far.state === 'dead') return;
          m.charge = { tx: far.x, ty: far.y, until: this.time + 600, target: far.uid, mult: sk.mult ?? 1.5 };
          this.setState(m, 'walk');
        });
        return;
      }
      case 'summon':
      case 'howl': {
        this.setState(m, 'cast');
        m.lockUntil = this.time + 700;
        if (sk.kind === 'howl') this.emit({ t: 'status', uid: m.uid, text: '아우우우-!', color: '#e0e8ff' });
        this.emit({ t: 'skill', fx: 'summon', from: m.uid, x: m.x, y: m.y, lv: 1 });
        this.sound('boss');
        for (let i = 0; i < (sk.count ?? 2); i++) {
          const a = (i / (sk.count ?? 2)) * Math.PI * 2;
          const s = this.spawnMob(sk.summon!, true, m.x + Math.cos(a) * 50, m.y + Math.sin(a) * 36);
          s.target = t.uid;
        }
        return;
      }
      case 'heal': {
        const n = Math.floor(m.maxHp * 0.1);
        m.hp = Math.min(m.maxHp, m.hp + n);
        this.setState(m, 'cast');
        m.lockUntil = this.time + 600;
        this.emit({ t: 'dmg', uid: m.uid, n, kind: 'heal' });
        this.emit({ t: 'skill', fx: 'heal', from: m.uid, to: m.uid, x: m.x, y: m.y, lv: 3 });
        this.sound('heal');
        return;
      }
      case 'bolt': {
        this.setState(m, 'cast');
        m.lockUntil = this.time + 600;
        const fly = Math.max(200, dist(m, t) / 0.5);
        this.emit({ t: 'shot', from: m.uid, to: t.uid, kind: 'shadow', dur: fly, element: el });
        this.after(fly, () => this.mobHit(m, t, sk.mult ?? 1.3, el, true, true));
        return;
      }
    }
  }

  private chargeTick(m: MobUnit, dt: number) {
    const c = m.charge!;
    const arrived = this.moveTo(m, c.tx, c.ty, 420, dt, 14);
    if (arrived || this.time >= c.until) {
      m.charge = null;
      const t = this.heroUnit(c.target);
      if (t && t.state !== 'dead' && dist(t, m) < 50) {
        this.mobHit(m, t, c.mult, 'neutral', false);
        this.emit({ t: 'shake', power: 3 });
        const dx = t.x - m.x, dy = t.y - m.y, d = Math.hypot(dx, dy) || 1;
        t.x = clamp(t.x + dx / d * 30, 24, this.zone.w - 24);
        t.y = clamp(t.y + dy / d * 20, 70, this.zone.h - 24);
      }
      m.lockUntil = this.time + 400;
      this.setState(m, 'idle');
    }
  }

  // ───────────────────────────── kill & rewards
  private killMob(t: MobUnit, killer: HeroUnit) {
    t.hp = 0;
    this.setState(t, 'dead');
    t.deadAt = this.time;
    if (this.focus === t.uid) this.focus = null;
    this.emit({ t: 'die', uid: t.uid });
    this.sound(t.m.boss ? 'mob_hurt_big' : 'mob_die');
    for (const h of this.heroes) if (h.target === t.uid) h.target = null;
    const m = t.m;
    const s = this.s;
    const z = this.zone;
    const expMul = t.summoned ? 0.3 : 1;
    this.gainExp(m.exp * expMul, m.jexp * expMul);
    s.totals.kills++;
    if (!this.rift) s.rate.kills++;
    // a rift guardian is only a shadow of its boss: it never counts as beating the real one (sealed maps ask for those)
    const shadow = !!this.rift && this.rift.guardian === t.uid;
    const book = shadow ? { kills: 0 } : (s.book[m.id] ??= { kills: 0 });
    book.kills++;
    if (!t.summoned) {
      const prog = s.progress[z.id]; // (a rift map has no progress entry: its bar is world.rift)
      if (prog) {
        prog.kills++;
        if (!m.boss) {
          if (z.boss) prog.bossGauge = Math.min(z.bossGauge, prog.bossGauge + 1);
          if (z.mvp) prog.mvpGauge = Math.min(z.mvpGauge, prog.mvpGauge + 1);
        }
      }
      this.rollDrops(t, killer);
    }
    if (this.rift) this.riftKill(t);
    else if (m.boss) {
      const prog = s.progress[z.id];
      if (m.boss === 'mvp') {
        prog.mvpKills++;
        let top = killer; let td = -1;
        for (const h of this.heroes) { const v = t.dmgBy[h.uid] ?? 0; if (v > td) { td = v; top = h; } }
        this.emit({ t: 'announce', text: `MVP! ${top.hero.name}`, kind: 'mvp' });
        this.log(`[MVP] ${top.hero.name}님이 ${m.name}을(를) 쓰러뜨렸습니다!`, '#ffcc4a');
        this.sound('mvp');
        this.giveExpTo(top, m.exp * 0.5, 0);
      } else {
        prog.bossKills++;
        this.emit({ t: 'announce', text: `${m.name} 처치!`, kind: 'boss' });
        this.log(`[보스] ${m.name}을(를) 처치했습니다!`, '#ff9a6a');
        this.sound('levelup');
      }
      // unlocks
      for (const nz of ZONES) {
        if (openers(nz).includes(z.id) && !nz.gate && !s.unlocked.includes(nz.id) && m.boss === 'field') {
          s.unlocked.push(nz.id);
          this.emit({ t: 'announce', text: `새 사냥터 「${nz.name}」 개방!`, kind: 'unlock' });
          this.log(`새 사냥터 「${nz.name}」이(가) 열렸습니다.`, '#9fe0ff');
        }
      }
      // field bosses also ping the MVP gauge
      if (m.boss === 'field' && z.mvp) prog.mvpGauge = Math.min(z.mvpGauge, prog.mvpGauge + Math.floor(z.mvpGauge * 0.1));
    }
    if (t.danger) {
      this.dangerStats.kills++;
      this.emit({ t: 'announce', text: `⚠ ${m.name} 처치!`, kind: 'danger' });
      this.log(`[위험] ${m.name}을(를) 쓰러뜨렸다!${book.kills === 1 ? ' 도감에 이름과 드롭이 기록되었다.' : ''}`, '#ffb070');
      this.sound('levelup');
      this.dangerGone(t);
    }
    this.onPersist();
  }

  private unlockSlot(n: number) {
    this.s.partySlots = Math.max(this.s.partySlots, n);
    this.emit({ t: 'announce', text: `파티 슬롯 ${n} 개방! 새 동료를 영입하세요`, kind: 'unlock' });
    this.log(`파티 슬롯이 ${n}칸으로 늘었습니다. [파티] 메뉴에서 동료를 영입하세요.`, '#a0ffa0');
    this.notices.push({ kind: 'slot', heroId: 0, text: `파티 슬롯 ${n} 개방` });
  }

  private rollDrops(t: MobUnit, killer: HeroUnit) {
    const perks = partyPerks(this.s);
    // the party's best drop-rate gear (탐욕 상자 카드) adds to the pushcart perk
    let gear = 0;
    for (const h of this.heroes) gear = Math.max(gear, h.d.b.dropPct ?? 0);
    const etcMul = 1 + (perks.dropPct + gear) / 100;
    let n = 0;
    for (const d of t.m.drops) {
      const def = ITEMS[d.id];
      let rate = d.rate;
      if (def.kind === 'etc' || def.kind === 'use') rate *= etcMul;
      if (d.id.startsWith('r_')) rate *= 1 + perks.oreDrop / 100;
      if (this.rng() >= rate) continue;
      this.dropAt(t.x, t.y, d.id, d.slots, n++, t.m);
      if (def.kind === 'card') {
        this.s.totals.cards++;
        (this.s.book[t.m.id] ??= { kills: 0 }).card = true;
        this.talkie(t.x, t.y - 20, `${def.name}다!`);
      }
    }
    void killer;
  }

  /** credit a drop and show it flying out of (x, y); n = its place in the pile */
  /** `from`: the monster that dropped it (gear grade and item level roll from it; chests roll plain) */
  private dropAt(x: number, y: number, id: string, slots: number | undefined, n: number, from?: MonsterDef, got?: { name: string; zeny: number }): GroundItem {
    const def = ITEMS[id];
    const a = (n * 2.1) + this.rng();
    const gx = x + Math.cos(a) * (14 + (n + 1) * 6);
    const gy = y + Math.sin(a) * (9 + (n + 1) * 4);
    const rarity = def.kind === 'card' ? (def.rarity ?? 'rare') : def.rarity ?? (def.kind === 'equip' ? 'rare' : 'common');
    // the real reward is credited right away (safe against travel / closing the app); the ground item is the show
    const g: GroundItem = {
      gid: this.gidSeq++, id, slots, x: clamp(gx, 20, this.zone.w - 20), y: clamp(gy, 70, this.zone.h - 20),
      fromX: x, fromY: y, born: this.time, pickAt: this.time + 900 + (n + 1) * 120 + (def.kind === 'card' ? 900 : 0), rarity, picked: false,
      got: got ?? this.grant(id, slots, from),
    };
    this.ground.push(g);
    this.emit({ t: 'drop', gid: g.gid });
    // anticipation at the kill (light pillar + chime for a card); the banner comes when it reaches the hero
    if (def.kind === 'card') this.sound('card');
    else if (def.kind === 'equip' || def.rarity) this.sound('drop');
    return g;
  }

  private groundTick() {
    for (const g of this.ground) {
      if (g.picked || this.time < g.pickAt) continue;
      g.picked = true;
      let best: HeroUnit | undefined; let bd = Infinity;
      for (const h of this.heroes) { if (h.state === 'dead') continue; const d = dist(h, g); if (d < bd) { bd = d; best = h; } }
      this.emit({ t: 'pickup', gid: g.gid, to: best?.uid ?? 0, id: g.id, name: g.got.name, zeny: g.got.zeny });
      const def = ITEMS[g.id];
      const col = def.kind === 'card' ? '#ffcc4a' : def.kind === 'equip' ? '#7ec8ff' : def.rarity ? '#d79bff' : '#c8f0c8';
      if (!g.got.zeny && (def.kind !== 'etc' || def.rarity)) this.log(`「${g.got.name}」을(를) 획득했습니다.`, col);
      if (def.kind === 'card') this.emit({ t: 'announce', text: `${g.got.name} 획득!!`, kind: 'card' });
      this.sound('pickup');
    }
    this.ground = this.ground.filter((g) => !g.picked || this.time - g.pickAt < 600);
  }

  /** credit a drop to the save (inventory, or zeny when auto-sold) */
  private grant(id: string, slots?: number, from?: MonsterDef): { name: string; zeny: number } {
    const def = ITEMS[id];
    if (def.kind === 'equip' && from) {
      // gear grades (ENDGAME.md §4): the drop rolls a grade and options sized by the dropper's level
      const inst = addItem(this.s, id, 1, slots)!;
      applyGrade(inst, def, rollGrade(def, { boss: from.boss, legend: def.rarity === 'epic' || def.rarity === 'mvp' }, this.rng), from.lv, this.rng);
      // RO 미감정: 희귀 이상 drops come unidentified unless a merchant in the party appraises them on pickup
      const g = gradeOf(inst);
      if (g === 'rare' || g === 'legend') {
        if (partyPerks(this.s).appraise) this.log(`감정 — ${itemName(inst)}`, '#ffe0a0');
        else inst.unid = true;
      }
      this.onPersist();
      return { name: itemName(inst), zeny: 0 };
    }
    if (def.kind === 'etc' && this.s.settings.autoSellEtc && !isKeepItem(id)) {
      addItem(this.s, id, 1);
      const z = sellStack(this.s, id, 1);
      this.s.rate.zeny += z;
      return { name: def.name, zeny: z };
    }
    const inst = addItem(this.s, id, 1, slots);
    this.onPersist();
    return { name: inst ? itemName(inst) : def.name, zeny: 0 };
  }

  private gainExp(base: number, job: number) {
    const n = this.heroes.length;
    const bonus = 1 + 0.15 * (n - 1);
    const maxLv = Math.max(...this.heroes.map((h) => h.hero.baseLv));
    for (const h of this.heroes) {
      const catchup = h.hero.baseLv < maxLv - 5 ? 2.5 : 1;
      this.giveExpTo(h, base * bonus / n * catchup, job * bonus / n * catchup);
    }
    // the bench trains on a quarter share (ENDGAME.md §2), so swapping someone in doesn't start from nothing
    for (const hero of this.s.bench ?? []) {
      const before = hero.baseLv;
      applyExp(hero, base * bonus / n * 0.25, job * bonus / n * 0.25);
      if (hero.baseLv > before) this.log(`명단의 ${hero.name} 레벨 업! (Lv ${hero.baseLv})`, '#d8e8a0');
    }
    if (!this.rift) { this.s.rate.exp += base; this.s.rate.jexp += job; }
  }

  giveExpTo(h: HeroUnit, base: number, job: number) {
    const hero = h.hero;
    const up = applyExp(hero, base, job);
    if (up.base) {
      if (hero.baseLv >= 10 && this.s.partySlots < 2) this.unlockSlot(2);
      if (hero.baseLv >= 22 && this.s.partySlots < 3) this.unlockSlot(3);
      this.refresh(h);
      if (h.state !== 'dead') { h.hp = h.d.maxHp; h.sp = h.d.maxSp; }
      this.emit({ t: 'levelup', uid: h.uid, job: false });
      this.sound('levelup');
      this.log(`${hero.name} 레벨 업! (Lv ${hero.baseLv})`, '#ffe680');
    }
    if (up.job) {
      this.emit({ t: 'levelup', uid: h.uid, job: true });
      if (!up.base) this.sound('joblevel');
      this.log(`${hero.name} 직업 레벨 업! (Job ${hero.jobLv})`, '#a0e0ff');
      if (hero.cls === 'novice' && hero.jobLv >= 10) {
        this.notices.push({ kind: 'job', heroId: hero.id, text: `${hero.name} 전직 가능!` });
        this.log(`${hero.name}: 전직할 수 있습니다! 기본기 9를 찍고 [스킬] 창에서 전직하세요.`, '#ffcc4a');
      }
    }
  }

  // ───────────────────────────── misc
  private separate() {
    const all: Unit[] = [...this.heroes.filter((h) => h.state !== 'dead'), ...this.mobs.filter((m) => m.state !== 'dead' && !m.m.flying)];
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j];
        const ra = this.bodyR(a) + 2, rb = this.bodyR(b) + 2;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = ra + rb;
        if (d > 0.01 && d < min) {
          const push = (min - d) / 2;
          const ax = dx / d * push, ay = dy / d * push;
          // share of the overlap each side absorbs: bosses/immobile don't budge, and mobs never shove heroes (they slide around them)
          let wa = 1, wb = 1;
          if (a.kind === 'mob' && (a.m.immobile || a.m.boss)) wa = 0;
          else if (a.kind === 'hero' && b.kind === 'mob') wa = 0;
          if (b.kind === 'mob' && (b.m.immobile || b.m.boss)) wb = 0;
          else if (b.kind === 'hero' && a.kind === 'mob') wb = 0;
          if (wa + wb === 0) { if (a.kind === 'hero') wa = 1; else if (b.kind === 'hero') wb = 1; else continue; }
          const sum = wa + wb;
          a.x -= ax * 2 * wa / sum; a.y -= ay * 2 * wa / sum;
          b.x += ax * 2 * wb / sum; b.y += ay * 2 * wb / sum;
        }
      }
    }
    // 얼음 벽: five blocks of ice no monster walks through (they stall behind it until it melts)
    for (const g of this.grounds) {
      if (g.done || g.sk.id !== 'ice_wall') continue;
      for (const b of this.iceBlocks(g)) {
        for (const m of this.mobs) {
          if (m.state === 'dead' || m.m.flying) continue;
          const dx = m.x - b.x, dy = m.y - b.y, d = Math.hypot(dx, dy), min = 11 + this.bodyR(m);
          if (d < min) { const k = (min - d) / (d || 1); m.x += (d ? dx : 1) * k; m.y += (d ? dy : 0) * k; }
        }
      }
    }
    for (const u of all) {
      u.x = clamp(u.x, 24, this.zone.w - 24);
      u.y = clamp(u.y, 70, this.zone.h - 24);
    }
  }

  /** the five blocks of an ice wall */
  iceBlocks(g: GroundFx) {
    const out: { x: number; y: number }[] = [];
    for (let i = -2; i <= 2; i++) out.push({ x: g.x + g.ax * i * CELL, y: g.y + g.ay * i * CELL });
    return out;
  }

  /** make the whole party focus a mob (tap on field) */
  setFocus(uid: number | null) {
    const m = this.mob(uid);
    if (!m || !this.alive(m)) { this.focus = null; return; }
    this.focus = uid;
    for (const h of this.heroes) if (h.state !== 'dead' && !h.sitting) h.target = uid;
  }

  elementHint(): string {
    const counts = new Map<Element, number>();
    for (const e of this.zone.mobs) counts.set(MONSTERS[e.id].element, (counts.get(MONSTERS[e.id].element) ?? 0) + e.w);
    return [...counts].sort((a, b) => b[1] - a[1]).map(([e]) => ELEMENT_KO[e]).join('·');
  }
}
