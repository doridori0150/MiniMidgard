// Real-time hunt simulation for one zone. DOM-free: renderer and UI read `events`, `logs` and unit state.
import type { Element, GameState, Hero, HeroRole, Proc, StatusKind, Tactics } from './types.ts';
import { computeDerived, partyPerks, type ActiveBuff, type Derived } from './stats.ts';
import { elementMod, sizeMod, ELEMENT_KO } from './data/elements.ts';
import { SKILLS, type SkillDef, type FixedCtx } from './data/skills.ts';
import { MONSTERS, type MonsterDef, type MobSkill } from './data/monsters.ts';
import { ITEMS, CARD_SKILLS } from './data/items.ts';
import { zone as zoneDef, ZONES, openers, isExpedition, type ZoneDef, type DangerDef } from './data/zones.ts';
import { CLASSES, lineage } from './data/classes.ts';
import { expNext } from './exp.ts';
import { applyGrade, rollGrade } from './gear.ts';
import { addItem, removeStack, sellStack, itemName, applyExp, quickTrigger, defaultTactics, heroRole, gateDiscoverable, gateReady, openGate, zoneKnown, inHours, isKeepItem } from './state.ts';

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
  | { t: 'announce'; text: string; kind: 'boss' | 'mvp' | 'card' | 'info' | 'wipe' | 'unlock' | 'danger' }
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


function clamp(v: number, a: number, b: number) { return v < a ? a : v > b ? b : v; }
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
    this.s.zone = id;
    this.zone = zoneDef(id);
    this.mobs = [];
    this.ground = [];
    this.timers = [];
    this.focus = null;
    const sx = this.zone.w * 0.5, sy = this.zone.h * 0.55;
    this.heroes.forEach((h, i) => {
      h.x = sx - i * 26; h.y = sy + (i % 2 ? 22 : -10);
      h.target = null; h.cast = null; h.state = h.state === 'dead' ? 'dead' : 'idle'; h.sitting = false;
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
    if (this.zone.id !== 'town') {
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

  spawnMob(id: string, summoned: boolean, x?: number, y?: number): MobUnit {
    const m = MONSTERS[id];
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
      const dmg = Math.max(1, Math.floor(h.d.maxHp * 0.015));
      this.damageHero(h, dmg, null, true);
      if ((h.state as string) === 'dead') return;
    }

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
        if (h.cast.target !== null && !this.alive(t) && h.cast.sk.kind !== 'aoe' && h.cast.sk.kind !== 'revive') {
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

    // 피하기: a danger monster closing in — run for the far side of the map, together
    if (this.tryEvade(h, dt)) return;
    // support: revive, heal & buffs first
    if (this.trySupport(h)) return;
    // party rest (orders.rest) and casters sitting for SP
    if (this.tryRest(h)) return;

    // targeting: player focus > tactics (re-thought twice a second so the party regroups on the shared target)
    let t = this.mob(h.target);
    if (!this.alive(t)) { h.target = null; t = undefined; }
    if (this.focus !== null) {
      const f = this.mob(this.focus);
      if (this.alive(f)) { t = f; h.target = f!.uid; } else this.focus = null;
    }
    if (this.focus === null && (!t || this.time >= h.thinkAt)) {
      h.thinkAt = this.time + 450 + this.rng() * 150;
      t = this.chooseTarget(h);
      h.target = t?.uid ?? null;
    }
    if (!t) { this.idleFollow(h, dt); return; }

    // tank provoke, crowd control
    if (this.tryProvoke(h)) { h.doing = '도발'; return; }
    if (this.tryCc(h, t)) return;

    // offensive skill or normal attack from this hero's position (front / mid / back)
    const act = this.chooseSkill(h, t);
    const range = act ? this.skillRange(h, act.sk) : h.d.range;
    const saving = !act && this.tactics(h).skills === 'conserve' && h.sp < h.d.maxSp * 0.5 && this.enabledSkills(h, ['attack', 'aoe']).length > 0;
    h.doing = t.m.name + (act ? (act.sk.kind === 'heal' ? ' — 힐로 공격' : ' — ' + act.sk.name) : saving ? ' 공격 (SP 절약)' : ' 공격');
    if (this.position(h, t, range, dt)) return;
    h.facing = t.x >= h.x ? 1 : -1;
    if (act) { this.startSkill(h, act.sk, act.lv, t); return; }
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
    const engaged = this.mobs.filter((m) => this.alive(m) && !this.shunned(m) && ((m.target !== null && ids.has(m.target))
      || (Object.keys(m.dmgBy).length > 0 && !!lead && dist(m, lead) < 320)));
    let target: MobUnit | undefined;
    const f = this.mob(this.focus);
    if (f && this.alive(f)) target = f;
    if (!target && lead) { const lt = this.mob(lead.target); if (lt && this.alive(lt)) target = lt; }
    if (!target) {
      const tank = this.aliveHeroes().find((h) => this.roleOf(h) === 'tank');
      const tt = tank && this.mob(tank.target);
      if (tt && this.alive(tt)) target = tt;
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
      case 'boss': pick = this.mobs.find((m) => this.alive(m) && !!m.m.boss && dist(m, anchor) <= Math.max(R, 420)); break;
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
      if (!this.alive(m) || this.pc.engaged.includes(m)) continue;
      if (m.danger) { if (this.shunned(m)) continue; } // 맞서기: hunted like a boss, whatever its level
      else if (!m.m.boss && m.m.lv > avgLv + 3) continue;
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
        h.kiteUntil = this.time + 600;
        h.kiteNext = this.time + 2600;
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
        h.kiteUntil = this.time + 550;
        h.kiteNext = this.time + 2200;
        return true;
      }
    }

    if (pos === 'front' || (melee && !front)) {
      if (edge > reach) { this.moveTo(h, t.x, t.y, h.d.moveSpd, dt, reach * 0.85); return true; }
      // melee damage dealers take the far side of the target when the tank already holds it
      if (this.roleOf(h) === 'melee' && front && this.roleOf(front) === 'tank' && front.target === t.uid && dist(front, t) < 70) {
        const fx = t.x - front.x, fy = t.y - front.y, fd = Math.hypot(fx, fy) || 1;
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
    return Object.entries(h.hero.skills).some(([id, lv]) => lv > 0 && SKILLS[id]?.sp && SKILLS[id].auto !== 'none' && h.hero.auto.skills[id] !== false && id !== 'first_aid');
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

  /** ankle snare & co: whatever is chasing the back line first, else a dangerous target */
  private tryCc(h: HeroUnit, t: MobUnit): boolean {
    for (const { sk, lv } of this.enabledSkills(h, ['cc'])) {
      if (!this.canPay(h, sk, lv)) continue;
      const free = (m: MobUnit) => !m.m.boss && m.stunUntil <= this.time && m.frozenUntil <= this.time && dist(h, m) <= (sk.range ?? 180);
      const chaser = this.pc.engaged.find((m) => {
        if (!free(m)) return false;
        const v = this.heroUnit(m.target);
        return !!v && (v === h || this.posOf(v) !== 'front');
      });
      const pick = chaser ?? (free(t) && (t.m.aggressive || t.target !== null) ? t : undefined);
      if (!pick) continue;
      h.facing = pick.x >= h.x ? 1 : -1;
      h.doing = `${pick.m.name} — ${sk.name}`;
      this.startSkill(h, sk, lv, pick);
      return true;
    }
    return false;
  }

  private skillRange(h: HeroUnit, sk: SkillDef) {
    if (sk.kind === 'selfAoe') return (sk.radius ?? 60) * 0.6;
    if (sk.range) return sk.range;
    return h.d.range;
  }

  private canAfford(h: HeroUnit, sk: SkillDef, lv: number) {
    if (sk.sp && h.sp < sk.sp(lv)) return false;
    if (sk.hpCost && h.hp <= sk.hpCost(lv) + 5) return false;
    if (sk.zeny && this.s.zeny < this.zenyCost(h, sk, lv)) return false;
    return true;
  }

  /** M12: a skill's damage % with the hero's per-skill gear bonuses */
  private skMult(h: HeroUnit, sk: SkillDef, lv: number) {
    return (sk.mult ? sk.mult(lv) : 100) * (1 + (h.d.b.skillDmg?.[sk.id] ?? 0) / 100);
  }
  private zenyCost(h: HeroUnit, sk: SkillDef, lv: number) {
    return Math.round(sk.zeny!(lv) * (1 + (h.d.b.zenyCostPct ?? 0) / 100));
  }

  private canPay(h: HeroUnit, sk: SkillDef, lv: number) {
    if (!this.canAfford(h, sk, lv)) return false;
    if ((h.cds[sk.id] ?? 0) > this.time) return false;
    if (sk.weapon && !sk.weapon.includes(h.d.wtype)) return false;
    return true;
  }

  private enabledSkills(h: HeroUnit, roles: string[]) {
    const out: { sk: SkillDef; lv: number }[] = [];
    const levels = { ...h.hero.skills };
    // skills granted by equipped accessory cards (e.g. a heal Lv1 card) — the hero's own level wins
    for (const uid of Object.values(h.hero.equip)) {
      const inst = this.s.equips.find((e) => e.uid === uid);
      for (const c of inst?.cards ?? []) {
        const g = c ? CARD_SKILLS[c] : undefined;
        if (g && (levels[g.skill] ?? 0) < g.lv) levels[g.skill] = g.lv;
      }
    }
    for (const [id, lv] of Object.entries(levels)) {
      const sk = SKILLS[id];
      if (!sk || lv <= 0 || !roles.includes(sk.auto)) continue;
      if (h.hero.auto.skills[id] === false) continue;
      out.push({ sk, lv });
    }
    return out;
  }

  private trySupport(h: HeroUnit): boolean {
    // resurrection beats everything else
    for (const { sk, lv } of this.enabledSkills(h, ['revive'])) {
      if (!this.canPay(h, sk, lv)) continue;
      const dead = this.heroes.find((x) => x.state === 'dead' && x !== h && dist(x, h) < 300);
      if (dead) { h.doing = `${sk.name} → ${dead.hero.name}`; this.startSkill(h, sk, lv, dead); return true; }
    }
    // heal
    for (const { sk, lv } of this.enabledSkills(h, ['heal'])) {
      if (!this.canPay(h, sk, lv)) continue;
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
    // buffs (only when not being chased hard)
    const pressed = this.mobs.some((m) => m.target === h.uid && this.alive(m) && dist(m, h) < 40);
    if (pressed && h.hp < h.d.maxHp * 0.5) return false;
    for (const { sk, lv } of this.enabledSkills(h, ['buff'])) {
      if (!this.canPay(h, sk, lv) || !sk.buff) continue;
      const targets = sk.kind === 'selfBuff' ? [h] : this.aliveHeroes();
      const need = targets.some((a) => {
        const b = a.buffs.find((x) => x.id === sk.buff!.id);
        return !b || b.until - this.time < 4000;
      });
      if (need) { h.doing = sk.name; this.startSkill(h, sk, lv, sk.kind === 'selfBuff' ? h : null); return true; }
    }
    return false;
  }

  private tryProvoke(h: HeroUnit): boolean {
    const lv = h.hero.skills.provoke ?? 0;
    if (!lv || h.hero.auto.skills.provoke === false || this.roleOf(h) !== 'tank') return false;
    const sk = SKILLS.provoke;
    if (!this.canPay(h, sk, lv)) return false;
    const loose = this.mobs.find((m) => this.alive(m) && !this.shunned(m) && m.target !== null && m.target !== h.uid && this.heroUnit(m.target) && dist(m, h) < 180 && m.provokeUntil < this.time);
    if (!loose) return false;
    h.facing = loose.x >= h.x ? 1 : -1;
    this.startSkill(h, sk, lv, loose);
    return true;
  }

  private chooseSkill(h: HeroUnit, t: MobUnit): { sk: SkillDef; lv: number } | null {
    const tac = this.tactics(h).skills;
    // conserve: offensive skills only while SP ≥ 50% (heals/buffs/CC are separate)
    if (tac === 'conserve' && h.sp < h.d.maxSp * 0.5) return null;
    const list = this.enabledSkills(h, ['attack', 'aoe']).filter(({ sk, lv }) => this.canPay(h, sk, lv));
    // heal sears the undead (RO): offered as an attack while the target is undead-element
    if (this.mobElement(t) === 'undead') {
      for (const e of this.enabledSkills(h, ['heal'])) if (e.sk.kind === 'heal' && this.canPay(h, e.sk, e.lv)) list.push(e);
    }
    if (!list.length) return null;
    // don't waste skills on nearly-dead targets
    const est = this.estimateNormal(h, t);
    if (t.hp <= est * 1.1 && !t.m.boss && tac !== 'aggressive') return null;
    // casters save area spells for real packs unless told to go all out
    const minAoe = tac === 'aggressive' ? 2 : this.roleOf(h) === 'caster' ? 3 : 2;
    let best: { sk: SkillDef; lv: number } | null = null; let bv = 0;
    for (const e of list) {
      const { sk, lv } = e;
      let v: number;
      if (sk.kind === 'aoe' || sk.kind === 'selfAoe') {
        const cx = sk.kind === 'selfAoe' ? h.x : t.x, cy = sk.kind === 'selfAoe' ? h.y : t.y;
        const n = this.mobs.filter((m) => this.alive(m) && !this.shunned(m) && Math.hypot(m.x - cx, m.y - cy) < (sk.radius ?? 60)).length;
        if (n < minAoe) continue;
        v = this.estimateSkill(h, t, sk, lv) * n;
      } else {
        v = this.estimateSkill(h, t, sk, lv);
      }
      // weigh by sp efficiency so mages don't burn their pool on overkill
      if (v > bv) { bv = v; best = e; }
    }
    if (best && bv < est * 1.15 && !h.d.ranged && !CLASSES[h.hero.cls].ranged && tac !== 'aggressive') return null;
    return best;
  }

  private estimateNormal(h: HeroUnit, t: MobUnit) {
    const d = h.d;
    const el = elementMod(d.weaponElement, this.mobElement(t));
    const avg = d.statusAtk + d.watk * 0.9 * sizeMod(d.wtype, t.m.size) + d.ammoAtk + d.bonusAtk;
    return Math.max(1, avg * el * (100 - t.m.def) / 100 + d.refineAtk);
  }

  private healAmount(h: HeroUnit, lv: number) {
    return Math.floor((h.hero.baseLv + h.d.total.int) / 8) * (4 + lv * 8) * (1 + (h.d.b.healPct ?? 0) / 100);
  }
  /** heal on an undead-element mob: half the heal as holy damage, by element, ignoring MDEF (RO) */
  private healDamage(h: HeroUnit, t: MobUnit, lv: number) {
    return Math.floor(this.healAmount(h, lv) * elementMod('holy', this.mobElement(t)) / 2);
  }

  private estimateSkill(h: HeroUnit, t: MobUnit, sk: SkillDef, lv: number) {
    if (sk.kind === 'heal') return this.healDamage(h, t, lv);
    const hits = sk.bySize ? (t.m.size === 'small' ? 1 : t.m.size === 'medium' ? 2 : 3) : sk.hits ? sk.hits(lv) : 1;
    if (sk.fixed) return sk.fixed(lv, this.fixedCtx(h)) * hits * elementMod(sk.element ?? 'neutral', this.mobElement(t));
    const mult = (this.skMult(h, sk, lv)) / 100;
    const el = sk.element ?? h.d.weaponElement;
    const em = elementMod(el, this.mobElement(t));
    if (sk.magic) {
      const avg = (h.d.matkMin + h.d.matkMax) / 2;
      let v = avg * mult * hits * em * (100 - t.m.mdef) / 100;
      if (sk.id === 'soul_strike' && t.m.race === 'undead') v *= 1 + lv * 0.05;
      return v;
    }
    const d = h.d;
    const avg = d.statusAtk + d.watk * 0.9 * sizeMod(d.wtype, t.m.size) + d.ammoAtk + d.bonusAtk;
    return Math.max(1, avg * mult * hits * em * (100 - t.m.def) / 100);
  }

  private mobElement(m: MobUnit): Element { return m.frozenUntil > this.time ? 'water' : m.m.element; }

  // ───────────────────────────── actions
  private normalAttack(h: HeroUnit, t: MobUnit) {
    const d = h.d;
    this.setState(h, 'attack');
    h.atkReady = this.time + d.delay;
    h.lockUntil = this.time + Math.min(320, d.delay * 0.8);
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
        });
      });
      return;
    }
    this.sound('swing');
    this.after(MELEE_CONTACT, () => {
      const r = this.resolvePhys(h, t, 100, d.weaponElement, 0, true, d.wtype === 'mace' || d.wtype === 'staff' || d.wtype === 'none' ? 'blunt' : 'slash');
      this.afterNormalHit(h, t, r); // M3: a bare-handed falconer's fists call the falcon too
      // double attack
      const da = h.hero.skills.double_attack ?? 0;
      if (r && da && d.wtype === 'dagger' && this.rng() < da * 0.05 && this.alive(t)) {
        this.after(110, () => this.resolvePhys(h, t, 100, d.weaponElement, 0, false, 'slash', 1));
      }
    });
  }

  /** after any normal attack: the falcon, item procs (M5) and a cursed weapon's price (M6) */
  private afterNormalHit(h: HeroUnit, t: MobUnit, hit: boolean) {
    if (!hit) return;
    const b = h.d.b;
    this.autoBlitz(h, t);
    if (b.procs) for (const p of b.procs) if ((p.on === 'attack' || (p.on === 'crit' && this.lastCrit)) && this.rng() * 100 < p.chance) this.runProc(h, t, p);
    if (b.selfCurse && this.rng() * 100 < b.selfCurse) this.curseHero(h);
  }

  /** hunter falcon proc on normal attacks, any weapon or none (chance LUK/3 + falcon_eyes% + gear) */
  private autoBlitz(h: HeroUnit, t: MobUnit) {
    const eyes = h.hero.skills.falcon_eyes ?? 0, blitz = h.hero.skills.blitz_beat ?? 0;
    if (!eyes || !blitz || !this.alive(t)) return;
    if (this.rng() * 100 >= h.d.total.luk / 3 + eyes + (h.d.b.autoBlitzPct ?? 0)) return;
    const sk = SKILLS.blitz_beat;
    const hits = Math.min(blitz, Math.floor((h.hero.jobLv + 9) / 10)) + (h.d.b.blitzHits ?? 0);
    this.falconStrike(h, t, sk, blitz, hits);
  }

  /** M5: one item/card effect */
  private runProc(h: HeroUnit, t: MobUnit | null, p: Proc) {
    if (p.healPct) this.healHero(h, Math.floor(h.d.maxHp * p.healPct / 100), true);
    if (p.status && t && this.alive(t) && !t.m.boss) this.inflict(t, p.status.kind, p.status.dur);
    if (p.cast) {
      const sk = SKILLS[p.cast.skill];
      if (!sk) return;
      const self = sk.kind === 'heal' || sk.kind === 'buff' || sk.kind === 'selfBuff';
      const target: HeroUnit | MobUnit | null = self ? h : t;
      if (!target || (target.kind === 'mob' && !this.alive(target))) return;
      this.releaseCast(h, { sk, lv: p.cast.lv, target: target.uid, x: target.x, y: target.y, start: this.time, end: this.time }, true);
    }
  }

  /** a status from gear (no skill roll: the proc already rolled) */
  private inflict(t: MobUnit, kind: Exclude<StatusKind, 'curse'>, dur: number) {
    if (kind === 'stun') { t.stunUntil = this.time + dur; this.emit({ t: 'status', uid: t.uid, text: '기절!', color: '#ffe080' }); }
    else if (kind === 'freeze') { if (t.m.element === 'undead') return; t.frozenUntil = this.time + dur; this.emit({ t: 'status', uid: t.uid, text: '빙결!', color: '#9fe8ff' }); }
    else if (kind === 'blind') { t.blindUntil = this.time + dur; this.emit({ t: 'status', uid: t.uid, text: '실명', color: '#d8c080' }); }
    else if (t.m.element !== 'undead' && t.m.race !== 'formless') {
      t.poisonUntil = this.time + dur; t.poisonNext = this.time + 1000;
      t.poisonDmg = Math.max(2, Math.floor(t.maxHp * 0.015));
      this.emit({ t: 'status', uid: t.uid, text: '중독', color: '#c080ff' });
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
    return { dex: h.d.total.dex, int: h.d.total.int, luk: h.d.total.luk, baseLv: h.hero.baseLv, skills: h.hero.skills };
  }

  private falconStrike(h: HeroUnit, t: MobUnit, sk: SkillDef, lv: number, hits: number) {
    const fly = Math.max(160, dist(h, t) / 0.7);
    this.emit({ t: 'shot', from: h.uid, to: t.uid, kind: 'falcon', dur: fly, element: 'neutral' });
    this.emit({ t: 'status', uid: h.uid, text: '블리츠 비트!', color: '#ffd080' });
    let total = 0;
    const per = (sk.fixed!(lv, this.fixedCtx(h)) + (h.hero.skills.steel_crow ?? 0) * 12) * (1 + (h.d.b.skillDmg?.blitz_beat ?? 0) / 100);
    // M4: the falcon's dive hits everything around the target (RO's 3×3)
    const r = 60 + (h.d.b.blitzRadius ?? 0);
    for (let i = 0; i < hits; i++) {
      this.after(fly + i * 120, () => {
        if (!this.alive(t)) return;
        const cx = t.x, cy = t.y;
        total += this.dealFixed(h, t, per, 'neutral', i, 'claw');
        for (const m of this.mobs) if (m !== t && this.alive(m) && !this.shunned(m) && Math.hypot(m.x - cx, m.y - cy) <= r) this.dealFixed(h, m, per, 'neutral', i, 'claw');
        if (i === hits - 1 && hits > 1 && total > 0) this.emit({ t: 'dmg', uid: t.uid, n: total, kind: 'total' });
      });
    }
  }

  /** fixed damage: ignores DEF and FLEE, still respects element */
  private dealFixed(h: HeroUnit, t: MobUnit, base: number, el: Element, idx: number, style: 'claw' | 'magic' = 'magic'): number {
    if (!this.alive(t)) return 0;
    const em = elementMod(el, this.mobElement(t));
    const n = em <= 0 ? 0 : Math.max(1, Math.floor(base * em * (0.9 + this.rng() * 0.2)));
    this.dealToMob(h, t, n, 'normal', idx);
    this.emit({ t: 'hit', uid: t.uid, style, element: el });
    return n;
  }

  private applyStatus(t: MobUnit, sk: SkillDef, lv: number) {
    if (!sk.status || !this.alive(t) || t.m.boss) return;
    const st = sk.status(lv);
    if (this.rng() * 100 >= st.chance) return;
    if (st.kind === 'stun') { t.stunUntil = this.time + st.dur; this.emit({ t: 'status', uid: t.uid, text: sk.id === 'ankle_snare' ? '속박!' : '기절!', color: '#ffe080' }); }
    else if (st.kind === 'freeze') { if (t.m.element === 'undead') return; t.frozenUntil = this.time + st.dur; this.emit({ t: 'status', uid: t.uid, text: '빙결!', color: '#9fe8ff' }); }
    else { t.blindUntil = this.time + st.dur; this.emit({ t: 'status', uid: t.uid, text: '실명', color: '#d8c080' }); }
  }

  /** whether the last resolvePhys was a critical (crit procs) */
  private lastCrit = false;

  /** returns true when it hit */
  private resolvePhys(h: HeroUnit, t: MobUnit, mult: number, el: Element, hitBonus: number, canCrit: boolean, style: 'slash' | 'blunt' | 'pierce' | 'claw', idx = 0, flat = 0): boolean {
    if (!this.alive(t) || h.state === 'dead') return false;
    const d = h.d;
    const mobFlee = t.m.lv + t.m.agi;
    const critRes = t.m.critRes ?? (t.m.boss === 'mvp' ? 0.5 : t.m.boss ? 0.25 : 0);
    const critChance = canCrit ? Math.max(0, d.crit - t.m.luk * 0.2) * (1 - critRes) : 0;
    const crit = this.rng() * 100 < critChance;
    this.lastCrit = crit;
    const frozen = t.frozenUntil > this.time;
    if (!crit && !frozen) {
      const rate = clamp(80 + d.hit - mobFlee, 5, 100) + hitBonus; // RO: enough HIT is a sure hit
      if (this.rng() * 100 >= rate) {
        this.emit({ t: 'dmg', uid: t.uid, n: 0, kind: 'miss', i: idx });
        this.sound('miss');
        this.aggro(t, h);
        return false;
      }
    }
    const wmax = d.watk;
    const wmin = Math.min(wmax, Math.floor(d.total.dex * (0.8 + 0.2 * Math.max(1, d.wlv))));
    const wroll = crit ? wmax : wmin + Math.floor(this.rng() * (wmax - wmin + 1));
    const b = d.b;
    let dmg = d.statusAtk + Math.floor(wroll * (b.ignoreSize ? 1 : sizeMod(d.wtype, t.m.size))) + d.ammoAtk + d.bonusAtk;
    dmg = dmg * mult / 100;
    dmg *= 1 + (b.atkPct ?? 0) / 100;
    const mel = this.mobElement(t);
    dmg *= 1 + (b.raceDmg?.[t.m.race] ?? 0) / 100;
    dmg *= 1 + (b.sizeDmg?.[t.m.size] ?? 0) / 100;
    dmg *= 1 + (b.eleDmg?.[mel] ?? 0) / 100;
    if (d.ranged) dmg *= 1 + (b.rangedPct ?? 0) / 100;
    if (t.m.boss) dmg *= 1;
    const em = elementMod(el, mel);
    dmg *= em;
    if (h.buffs.some((x) => x.id === 'magnum' && x.until > this.time)) dmg *= 1 + 0.2 * elementMod('fire', mel);
    if (crit) {
      dmg *= 1.4 * (1 + (b.critDmgPct ?? 0) / 100);
    } else {
      let hard = t.m.def;
      if (t.provokeUntil > this.time) hard *= 1 - t.provokeDef;
      if (frozen) hard *= 0.5;
      dmg = dmg * (100 - hard) / 100 - Math.floor(t.m.lv / 2 + this.rng() * t.m.lv / 4);
    }
    dmg += (d.refineAtk + (d.overRefine ? Math.floor(this.rng() * d.overRefine) : 0)) * em + flat * em;
    let n = Math.floor(dmg);
    if (em <= 0) n = 0; else n = Math.max(1, n);
    this.dealToMob(h, t, n, crit ? 'crit' : 'normal', idx);
    this.emit({ t: 'hit', uid: t.uid, style, element: el, crit });
    this.sound(crit ? 'crit' : style === 'pierce' ? 'arrow_hit' : style === 'blunt' ? 'hit_heavy' : 'hit');
    if (b.lifeStealPct && n > 0) this.healHero(h, Math.floor(n * b.lifeStealPct / 100), false);
    // steal
    const st = h.hero.skills.steal ?? 0;
    if (st && !t.stolen && !t.m.boss && !t.summoned && this.rng() * 100 < st * 1.2) this.trySteal(h, t);
    return true;
  }

  private resolveMagic(h: HeroUnit, t: MobUnit, mult: number, el: Element, idx = 0, sk?: SkillDef, lv = 1): number {
    if (!this.alive(t)) return 0;
    const d = h.d;
    const roll = d.matkMin + this.rng() * (d.matkMax - d.matkMin + 1);
    let dmg = roll * mult / 100;
    const mel = this.mobElement(t);
    const em = elementMod(el, mel);
    dmg *= em;
    dmg *= 1 + (d.b.raceDmg?.[t.m.race] ?? 0) / 100;
    if (sk?.id === 'soul_strike' && t.m.race === 'undead') dmg *= 1 + lv * 0.05;
    if (sk?.vsUndead && (t.m.race === 'undead' || t.m.race === 'demon')) dmg *= sk.vsUndead;
    const mdef = t.m.mdef * (t.frozenUntil > this.time ? 1.25 : 1);
    dmg = dmg * (100 - Math.min(90, mdef)) / 100 - Math.floor(t.m.lv / 3);
    let n = Math.floor(dmg);
    if (em <= 0) n = 0; else n = Math.max(1, n);
    this.dealToMob(h, t, n, 'normal', idx);
    this.emit({ t: 'hit', uid: t.uid, style: 'magic', element: el });
    return n;
  }

  private dealToMob(h: HeroUnit, t: MobUnit, n: number, kind: DmgKind, idx: number) {
    this.emit({ t: 'dmg', uid: t.uid, n, kind: n === 0 ? 'zero' : kind, i: idx });
    t.hurtAt = this.time;
    t.dmgBy[h.uid] = (t.dmgBy[h.uid] ?? 0) + n;
    this.aggro(t, h);
    if (n <= 0) return;
    t.dmgAt = this.time;
    t.hp -= n;
    if (t.hp <= 0) this.killMob(t, h);
  }

  private aggro(t: MobUnit, h: HeroUnit) {
    if (t.provokeUntil > this.time) return;
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
    const castBase = sk.cast ? sk.cast(lv) : 0;
    const cast = castBase * h.d.castMul;
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
      if (!this.canAfford(h, sk, lv)) {
        this.setState(h, 'idle');
        return;
      }
      if (sk.sp) h.sp -= sk.sp(lv);
      if (sk.hpCost) h.hp -= sk.hpCost(lv);
      if (sk.zeny) { this.s.zeny -= this.zenyCost(h, sk, lv); this.onPersist(); }
      if (sk.cd) h.cds[sk.id] = this.time + sk.cd(lv);
      const delay = sk.delay ? sk.delay(lv) : 300;
      h.lockUntil = this.time + delay;
      h.atkReady = Math.max(h.atkReady, this.time + Math.min(delay, h.d.delay));
      this.setState(h, sk.magic || sk.kind === 'heal' || sk.kind === 'buff' || sk.kind === 'selfBuff' ? 'cast' : 'attack');
      this.stateHold(h, Math.min(delay, 450));
    }
    this.emit({ t: 'status', uid: h.uid, text: sk.name + '!', color: '#fff6c0' });
    const tu = this.unit(c.target);
    const tm = tu?.kind === 'mob' ? tu : undefined;
    const el: Element = sk.element ?? h.d.weaponElement;

    switch (sk.kind) {
      case 'melee': {
        if (!tm || !this.alive(tm)) return;
        // the skill's impact effect bursts when the weapon arrives, not when the swing starts
        this.after(SKILL_CONTACT - 20, () => { if (this.alive(tm)) this.emit({ t: 'skill', fx: sk.fx, from: h.uid, to: tm.uid, x: tm.x, y: tm.y, lv, element: el }); });
        const mhits = sk.bySize ? (tm.m.size === 'small' ? 1 : tm.m.size === 'medium' ? 2 : 3) : sk.hits ? sk.hits(lv) : 1;
        if (mhits > 1) {
          let total = 0;
          for (let i = 0; i < mhits; i++) {
            this.after(SKILL_CONTACT + i * (sk.id === 'sonic_blow' ? 70 : 120), () => {
              const before = tm.hp;
              this.resolvePhys(h, tm, this.skMult(h, sk, lv), el, sk.hitBonus ? sk.hitBonus(lv) : 0, false, sk.id === 'pierce' ? 'pierce' : 'slash', i);
              total += Math.max(0, before - Math.max(0, tm.hp));
              if (i === mhits - 1 && total > 0) {
                this.emit({ t: 'dmg', uid: tm.uid, n: total, kind: 'total' });
                // the flurry's weight lands with its total, once
                if (sk.id === 'sonic_blow') this.emit({ t: 'shake', power: 1.5 });
              }
            });
          }
          return;
        }
        this.after(SKILL_CONTACT, () => {
          const flat = sk.id === 'envenom' ? lv * 15 : 0;
          const hit = this.resolvePhys(h, tm, this.skMult(h, sk, lv), el, sk.hitBonus ? sk.hitBonus(lv) : 0, false, 'slash', 0, flat);
          if (!hit || !this.alive(tm)) return;
          this.applyStatus(tm, sk, lv);
          if (sk.id === 'envenom' && this.rng() * 100 < 10 + lv * 4 && !tm.m.boss && tm.m.element !== 'undead') {
            tm.poisonUntil = this.time + 10000; tm.poisonNext = this.time + 1000;
            tm.poisonDmg = Math.max(2, Math.floor(tm.maxHp * 0.015));
            this.emit({ t: 'status', uid: tm.uid, text: '중독', color: '#c080ff' });
          }
          if (sk.id === 'sand_attack' && this.rng() * 100 < 15 + lv * 5 && !tm.m.boss) {
            tm.blindUntil = this.time + 8000;
            this.emit({ t: 'status', uid: tm.uid, text: '실명', color: '#d8c080' });
          }
        });
        if (sk.id === 'mammonite') this.sound('coin_skill');
        return;
      }
      case 'ranged': {
        if (!tm) return;
        const hits = sk.hits ? sk.hits(lv) : 1;
        const fly = Math.max(100, dist(h, tm) / 0.9);
        this.after(BOW_RELEASE, () => this.sound('arrow'));
        let total = 0;
        for (let i = 0; i < hits; i++) {
          this.after(BOW_RELEASE + i * 110, () => this.emit({ t: 'shot', from: h.uid, to: tm.uid, kind: 'arrow', dur: fly, element: el }));
          this.after(BOW_RELEASE + i * 110 + fly, () => {
            const before = tm.hp;
            this.resolvePhys(h, tm, this.skMult(h, sk, lv), el, 0, false, 'pierce', i);
            total += Math.max(0, before - Math.max(0, tm.hp));
            if (i === hits - 1 && total > 0 && hits > 1) this.emit({ t: 'dmg', uid: tm.uid, n: total, kind: 'total' });
          });
        }
        return;
      }
      case 'bolt': {
        if (!tm) return;
        const hits = sk.hits ? sk.hits(lv) : 1;
        if (sk.fixed) { this.falconStrike(h, tm, sk, lv, hits); this.sound('arrow'); return; }
        this.emit({ t: 'skill', fx: sk.fx, from: h.uid, to: tm.uid, x: tm.x, y: tm.y, lv, hits, element: el });
        this.sound(sk.fx === 'firebolt' ? 'fire' : sk.fx === 'coldbolt' || sk.fx === 'frost' ? 'ice' : sk.fx === 'lightning' ? 'thunder' : sk.fx === 'holy' ? 'heal' : 'cast');
        let total = 0;
        for (let i = 0; i < hits; i++) {
          this.after(160 + i * 150, () => {
            const n = this.resolveMagic(h, tm, this.skMult(h, sk, lv), el, i, sk, lv);
            total += n;
            if (n > 0) this.applyStatus(tm, sk, lv);
            if (i === hits - 1 && hits > 1 && total > 0) this.emit({ t: 'dmg', uid: tm.uid, n: total, kind: 'total' });
            if (sk.id === 'frost_diver' && this.alive(tm) && !tm.m.boss && tm.m.element !== 'undead' && this.rng() * 100 < 35 + lv * 3) {
              tm.frozenUntil = this.time + lv * 1500;
              this.emit({ t: 'status', uid: tm.uid, text: '빙결!', color: '#9fe8ff' });
            }
          });
        }
        return;
      }
      case 'aoe':
      case 'selfAoe': {
        const cx = sk.kind === 'selfAoe' ? h.x : (tm ? tm.x : c.x);
        const cy = sk.kind === 'selfAoe' ? h.y : (tm ? tm.y : c.y);
        const r = sk.radius ?? 60;
        const hits = sk.hits ? sk.hits(lv) : 1;
        this.emit({ t: 'skill', fx: sk.fx, from: h.uid, to: tm?.uid, x: cx, y: cy, lv, radius: r, hits, element: el });
        this.sound(el === 'fire' ? 'fire' : el === 'wind' ? 'thunder' : el === 'water' ? 'ice' : el === 'holy' ? 'heal' : sk.fx === 'shower' ? 'arrow' : 'hit_heavy');
        if (sk.kind === 'selfAoe' || sk.fx === 'hammer' || sk.fx === 'bowling') this.emit({ t: 'shake', power: 2 });
        for (let i = 0; i < hits; i++) {
          this.after(150 + i * 180, () => {
            for (const m of this.mobs) {
              if (!this.alive(m) || Math.hypot(m.x - cx, m.y - cy) > r || this.shunned(m)) continue;
              if (sk.fixed) this.dealFixed(h, m, sk.fixed(lv, this.fixedCtx(h)), el, i);
              else if (sk.magic) this.resolveMagic(h, m, this.skMult(h, sk, lv), el, i, sk, lv);
              else this.resolvePhys(h, m, this.skMult(h, sk, lv), el, 20, false, sk.fx === 'shower' ? 'pierce' : 'blunt', i);
              this.applyStatus(m, sk, lv);
            }
          });
        }
        if (sk.buff) this.applyBuff(h, sk, lv);
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
        const targets = sk.kind === 'selfBuff' || !sk.buff?.party ? [h] : this.aliveHeroes();
        for (const a of targets) {
          this.applyBuff(a, sk, lv);
          this.emit({ t: 'skill', fx: sk.fx, from: h.uid, to: a.uid, x: a.x, y: a.y, lv });
        }
        this.sound('buff');
        return;
      }
      case 'revive': {
        const dead = tu?.kind === 'hero' ? tu : undefined;
        if (!dead || dead.state !== 'dead') return;
        this.revive(dead, (sk.revivePct ? sk.revivePct(lv) : 30) / 100);
        this.sound('levelup');
        this.emit({ t: 'status', uid: dead.uid, text: '부활!', color: '#fff3a0' });
        return;
      }
      case 'debuff': {
        if (!tm) return;
        if (sk.id !== 'provoke') {
          this.emit({ t: 'skill', fx: sk.fx, from: h.uid, to: tm.uid, x: tm.x, y: tm.y, lv, radius: 30 });
          this.sound('buff');
          this.applyStatus(tm, sk, lv);
          return;
        }
        this.emit({ t: 'skill', fx: sk.fx, from: h.uid, to: tm.uid, x: tm.x, y: tm.y, lv, radius: 110 });
        this.sound('buff');
        for (const m of this.mobs) {
          if (!this.alive(m) || dist(m, tm) > 110 || this.shunned(m)) continue;
          m.provokeUntil = this.time + 30000;
          m.provokeBy = h.uid;
          m.provokeDef = (5 + lv * 5) / 100;
          m.provokeAtk = (2 + lv * 3) / 100;
          m.target = h.uid;
          this.emit({ t: 'status', uid: m.uid, text: '!', color: '#ff6060' });
        }
        return;
      }
    }
  }

  private stateHold(h: HeroUnit, ms: number) {
    h.lockUntil = Math.max(h.lockUntil, this.time + ms);
  }

  private applyBuff(a: HeroUnit, sk: SkillDef, lv: number) {
    const bs = sk.buff!;
    a.buffs = a.buffs.filter((b) => b.id !== bs.id);
    const shield = bs.shieldPct ? Math.floor(a.d.maxHp * bs.shieldPct(lv) / 100) : undefined;
    a.buffs.push({ id: bs.id, name: bs.name, lv, until: this.time + bs.dur(lv), bonus: bs.bonus(lv), statPct: bs.statPct?.(lv), shield, shieldMax: shield });
    this.refresh(a);
    this.emit({ t: 'buff', uid: a.uid, name: bs.name });
  }

  healHero(h: HeroUnit, n: number, show: boolean) {
    if (h.state === 'dead' || n <= 0) return;
    const before = h.hp;
    h.hp = Math.min(h.d.maxHp, h.hp + n);
    if (show) this.emit({ t: 'dmg', uid: h.uid, n: Math.max(n, h.hp - before), kind: 'heal' });
  }

  private regen(h: HeroUnit) {
    const town = this.zone.id === 'town';
    const mul = town ? 6 : h.sitting ? 2 : 1;
    if (this.time >= h.hpTickAt) {
      h.hpTickAt = this.time + HP_TICK / (h.sitting || town ? 2 : 1);
      if (h.poisonUntil < this.time && h.hp < h.d.maxHp) h.hp = Math.min(h.d.maxHp, h.hp + Math.floor(h.d.hpRegen * mul));
    }
    if (this.time >= h.spTickAt) {
      h.spTickAt = this.time + SP_TICK / (h.sitting || town ? 2 : 1);
      if (h.sp < h.d.maxSp) h.sp = Math.min(h.d.maxSp, h.sp + Math.floor(h.d.spRegen * mul));
    }
  }

  /** quick-slot auto use: lower trigger % first so emergency potions win */
  private autoItems() {
    if (this.zone.id === 'town') return;
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
    const mul = he.hp ? (1 + (h.d.b.potionPct ?? 0) / 100) * (1 + h.d.total.vit * 2 / 100) : 1 + (h.d.total.int * 2) / 100;
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
      if (sh.shield! <= 0) { h.buffs = h.buffs.filter((b) => b !== sh); this.emit({ t: 'status', uid: h.uid, text: '보호막 파괴', color: '#bfe8ff' }); }
      // a block reads as a block: sky-blue absorbed amount, and no hurt flash when nothing got through
      if (absorbed > 0) this.emit({ t: 'dmg', uid: h.uid, n: absorbed, kind: 'absorb' });
      if (n <= 0) return;
    }
    h.hp -= n;
    h.hurtAt = this.time;
    this.emit({ t: 'dmg', uid: h.uid, n, kind: 'taken' });
    if (!dot) {
      if (h.cast && h.cast.sk.magic && this.rng() < 0.15) {
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
    if (m.poisonUntil > this.time && this.time >= m.poisonNext) {
      m.poisonNext = this.time + 1000;
      const n = Math.min(m.poisonDmg, m.hp - 1);
      if (n > 0) { m.hp -= n; this.emit({ t: 'dmg', uid: m.uid, n, kind: 'normal' }); }
    }
    if (m.frozenUntil > this.time || m.stunUntil > this.time) return;
    if (m.charge) { this.chargeTick(m, dt); return; }
    if (this.time < m.lockUntil) return;
    if (m.state === 'attack' || m.state === 'hurt' || m.state === 'cast') this.setState(m, 'idle');

    // target
    if (m.provokeUntil > this.time) {
      const p = this.heroUnit(m.provokeBy);
      if (p && p.state !== 'dead') m.target = p.uid;
    }
    if (m.danger) this.dangerThink(m);
    let t = this.heroUnit(m.target);
    if (!t || t.state === 'dead') { m.target = null; t = undefined; }
    if (!t && m.m.aggressive && !(m.danger && m.boredUntil > this.time)) {
      const range = m.m.boss ? 320 : m.danger ? 160 : 130;
      let bd = range;
      for (const h of this.heroes) {
        if (h.state === 'dead') continue;
        const d = dist(h, m);
        if (d < bd) { bd = d; t = h; }
      }
      if (t) { m.target = t.uid; m.chaseSince = this.time; if (!m.m.boss) this.emit({ t: 'status', uid: m.uid, text: '!', color: m.danger ? '#ff2030' : '#ff6060' }); }
    }

    if (m.m.skills && t && this.mobSkill(m, t)) return;

    if (!t) { this.wander(m, dt); return; }
    const d = dist(m, t) - 8;
    if (d > m.m.range) {
      if (m.m.immobile) { m.target = null; return; }
      // stop at body contact (never inside the hero's collision ring, or the crowd shoves the hero around)
      const contact = this.bodyR(m) + this.bodyR(t) + 5;
      this.moveTo(m, t.x, t.y, m.m.speed, dt, Math.min(Math.max(m.m.range * 0.8, contact), m.m.range + 6));
      return;
    }
    m.facing = t.x >= m.x ? 1 : -1;
    if (this.time < m.atkReady) { if (m.state === 'walk') this.setState(m, 'idle'); return; }
    this.mobAttack(m, t);
  }

  private wander(m: MobUnit, dt: number) {
    if (m.m.immobile) { this.setState(m, 'idle'); return; }
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
      if (this.moveTo(m, m.dest.x, m.dest.y, m.m.speed * 0.5, dt, 3)) m.dest = null;
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

  private mobHit(m: MobUnit, t: HeroUnit, mult: number, el: Element, magic: boolean, sure = false) {
    if (m.state === 'dead' || t.state === 'dead') return;
    const d = t.d;
    if (!magic && !sure) {
      if (this.rng() * 100 < d.pdodge) {
        this.emit({ t: 'dmg', uid: t.uid, n: 0, kind: 'lucky' });
        return;
      }
      const crowd = this.mobs.reduce((a, x) => a + (x.state !== 'dead' && x.target === t.uid && dist(x, t) <= x.m.range + 40 ? 1 : 0), 0);
      const flee = d.flee * Math.max(0, 1 - 0.1 * Math.max(0, crowd - 2));
      let rate = clamp(80 + m.m.lv + m.m.dex - flee, 5, 95);
      if (m.blindUntil > this.time) rate -= 25;
      if (this.rng() * 100 >= rate) {
        this.emit({ t: 'dmg', uid: t.uid, n: 0, kind: 'miss' });
        this.sound('miss');
        return;
      }
    }
    let dmg = (m.m.atk[0] + this.rng() * (m.m.atk[1] - m.m.atk[0])) * mult;
    if (m.provokeUntil > this.time) dmg *= 1 + m.provokeAtk;
    dmg *= elementMod(el, d.armorElement);
    if (magic) dmg = dmg * (100 - d.mdef) / 100 - d.intMdef;
    else dmg = dmg * (100 - d.def) / 100 - (d.vitDef + this.rng() * d.total.vit * 0.3);
    dmg *= 1 - (d.b.raceRes?.[m.m.race] ?? 0) / 100;
    dmg *= 1 - (d.b.eleRes?.[el] ?? 0) / 100;
    dmg *= 1 - (d.b.dmgReducePct ?? 0) / 100;
    const n = Math.max(1, Math.floor(dmg));
    this.emit({ t: 'hit', uid: t.uid, style: 'claw', element: el });
    const ac = t.hero.skills.auto_counter ?? 0;
    if (ac && !magic && m.m.range < 60 && !this.shunned(m) && this.rng() * 100 < ac * 6) {
      this.emit({ t: 'status', uid: t.uid, text: '반격!', color: '#ffb0a0' });
      this.after(80, () => this.resolvePhys(t, m, 100, t.d.weaponElement, 100, true, 'slash'));
    }
    if (el === 'poison' && !magic && this.rng() * 100 < 8 * (1 - (d.b.statusRes?.poison ?? 0) / 100)) {
      t.poisonUntil = this.time + 8000; t.poisonNext = this.time + 1000;
      this.emit({ t: 'status', uid: t.uid, text: '중독', color: '#c080ff' });
    }
    if (d.b.procs) for (const p of d.b.procs) if (p.on === 'hit' && this.rng() * 100 < p.chance) this.runProc(t, m, p);
    this.damageHero(t, n, m);
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
    s.rate.kills++;
    const book = (s.book[m.id] ??= { kills: 0 });
    book.kills++;
    if (!t.summoned) {
      const prog = s.progress[z.id];
      prog.kills++;
      if (!m.boss) {
        if (z.boss) prog.bossGauge = Math.min(z.bossGauge, prog.bossGauge + 1);
        if (z.mvp) prog.mvpGauge = Math.min(z.mvpGauge, prog.mvpGauge + 1);
      }
      this.rollDrops(t, killer);
    }
    if (m.boss) {
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
      }
    }
    void killer;
  }

  /** credit a drop and show it flying out of (x, y); n = its place in the pile */
  /** `from`: the monster that dropped it (gear grade and item level roll from it; chests roll plain) */
  private dropAt(x: number, y: number, id: string, slots: number | undefined, n: number, from?: MonsterDef): GroundItem {
    const def = ITEMS[id];
    const a = (n * 2.1) + this.rng();
    const gx = x + Math.cos(a) * (14 + (n + 1) * 6);
    const gy = y + Math.sin(a) * (9 + (n + 1) * 4);
    const rarity = def.kind === 'card' ? (def.rarity ?? 'rare') : def.rarity ?? (def.kind === 'equip' ? 'rare' : 'common');
    // the real reward is credited right away (safe against travel / closing the app); the ground item is the show
    const g: GroundItem = {
      gid: this.gidSeq++, id, slots, x: clamp(gx, 20, this.zone.w - 20), y: clamp(gy, 70, this.zone.h - 20),
      fromX: x, fromY: y, born: this.time, pickAt: this.time + 900 + (n + 1) * 120 + (def.kind === 'card' ? 900 : 0), rarity, picked: false,
      got: this.grant(id, slots, from),
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
    this.s.rate.exp += base;
    this.s.rate.jexp += job;
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
    for (const u of all) {
      u.x = clamp(u.x, 24, this.zone.w - 24);
      u.y = clamp(u.y, 70, this.zone.h - 24);
    }
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
