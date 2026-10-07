// Party AI check: plays fixed scenarios (party × level × map) and reports how each class actually behaves —
// kill speed, deaths, where its time goes (fighting / casting / walking / sitting / waiting), damage dealt and taken,
// spacing from the target and the leader, and which skills it fired.
// usage: npm run party-check -- [minutes=6] [seed=1] [scenario …]
//   scenario: lv@zone:cls,cls,cls   e.g. 30@cave:swordsman,acolyte,mage
//   cls may carry a build and a role: acolyte+str (STR build), acolyte@caster (role override), mage@caster
//   no scenarios = the default matrix (classic party, archer party, solo of each first job, acolyte builds in a crypt)
import { World } from '../src/game/world.ts';
import { newGame, defaultLook, autoDistribute, learnSkill, addEquip, equip, newHero, defaultTactics, heroRole } from '../src/game/state.ts';
import { SKILLS } from '../src/game/data/skills.ts';
import type { ClassId, HeroRole } from '../src/game/types.ts';

const minutes = Number(process.argv[2] ?? 6);
const seed0 = Number(process.argv[3] ?? 1);
const DEFAULT = [
  '30@cave:swordsman,acolyte,mage',          // classic party in an undead cave (heal burns the undead)
  '30@cave:swordsman,acolyte+str,mage',      // battle priest (auto role from STR > INT)
  '30@cave:swordsman,acolyte@caster,mage',   // exorcist role
  '30@cave:archer,thief,merchant',           // no healer, no tank
  '30@grove:swordsman,acolyte,mage',
  '30@grove:archer,thief,merchant',
  '20@forest:swordsman', '20@forest:mage', '20@forest:archer', '20@forest:acolyte', '20@forest:thief', '20@forest:merchant',
  '40@cave:acolyte', '40@cave:acolyte@caster',
];
const scenarios = process.argv.slice(4).length ? process.argv.slice(4) : DEFAULT;
const GEAR: Partial<Record<ClassId, string[]>> = {
  swordsman: ['w_blade', 's_guard'], mage: ['w_wand'], archer: ['w_composite'], acolyte: ['w_mace'],
  thief: ['w_gauche'], merchant: ['w_battleaxe'], novice: ['w_knife'],
};
const STATES = ['attack', 'cast', 'walk', 'sit', 'ready', 'idle', 'dead'] as const;

for (const sc of scenarios) {
  const [head, list] = sc.split(':');
  const [lvS, zone] = head.split('@');
  const lv = Number(lvS);
  let seed = seed0;
  const rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const s = newGame('check', defaultLook('f'));
  s.heroes = []; s.partySlots = 3; s.stacks.u_red = 60; s.zeny = 200000;
  const specs = list.split(',');
  specs.forEach((spec, i) => {
    const m = spec.match(/^([a-z]+)(\+str)?(?:@([a-z]+))?$/)!;
    const cls = m[1] as ClassId;
    const h = newHero(s, `${cls}${i}`, defaultLook(i % 2 ? 'm' : 'f'));
    h.cls = cls; h.baseLv = lv; h.jobLv = cls === 'novice' ? 9 : 30; h.statPts = 48 + lv * 5; autoDistribute(h);
    if (m[2]) [h.stats.str, h.stats.int] = [h.stats.int, h.stats.str]; // same points, spent on STR instead of INT
    // like a real player: max the main attack / heal skills first, then spread the rest one level per pass
    h.skillPts = 40;
    const main = (x: { auto: string }) => x.auto === 'attack' || x.auto === 'aoe' || x.auto === 'heal' || x.auto === 'revive';
    for (const tier of [true, false]) for (let pass = 0; pass < 10 && h.skillPts > 0; pass++) {
      for (const x of Object.values(SKILLS)) if (x.cls === cls && main(x) === tier && h.skillPts > 0) learnSkill(h, x.id);
    }
    for (const id of GEAR[cls] ?? []) { const inst = addEquip(s, id); equip(s, h, inst.uid); }
    h.tactics = { ...defaultTactics(cls), role: (m[3] as HeroRole | undefined) ?? 'auto' };
    s.heroes.push(h);
  });
  s.zone = zone;
  if (!s.unlocked.includes(zone)) s.unlocked.push(zone);
  const w = new World(s, rng);

  // instrument the world: who dealt / took what, which skills fired, heals that burned the undead
  const W = w as unknown as Record<string, (...a: unknown[]) => unknown>;
  const dealt: Record<number, number> = {}, taken: Record<number, number> = {}, casts: Record<number, Record<string, number>> = {};
  let healBurns = 0;
  const wrap = (name: string, before: (...a: any[]) => void) => { const f = W[name]; W[name] = function (this: unknown, ...a: unknown[]) { before(...a); return f.apply(this, a); }; };
  wrap('dealToMob', (h, _t, n) => { dealt[h.uid] = (dealt[h.uid] ?? 0) + n; });
  wrap('damageHero', (h, n) => { taken[h.uid] = (taken[h.uid] ?? 0) + n; });
  wrap('startSkill', (h, sk, _lv, t) => { (casts[h.uid] ??= {})[sk.id] = (casts[h.uid][sk.id] ?? 0) + 1; if (sk.kind === 'heal' && t?.kind === 'mob') healBurns++; });

  const time: Record<number, Record<string, number>> = {};
  const gapT: Record<number, [number, number]> = {}, gapL: Record<number, [number, number]> = {};
  const STEP = 100, total = minutes * 60000;
  for (let ms = 0; ms < total; ms += STEP) {
    w.advance(STEP);
    const lead = w.heroes[0];
    for (const h of w.heroes) {
      const st = h.state === 'hurt' ? 'ready' : h.state === 'spawn' ? 'idle' : h.state;
      (time[h.uid] ??= {})[st] = (time[h.uid][st] ?? 0) + STEP;
      const t = w.mob(h.target);
      if (t && h.state !== 'dead') { const g = (gapT[h.uid] ??= [0, 0]); g[0] += Math.hypot(t.x - h.x, t.y - h.y); g[1]++; }
      if (h !== lead && h.state !== 'dead') { const g = (gapL[h.uid] ??= [0, 0]); g[0] += Math.hypot(lead.x - h.x, lead.y - h.y); g[1]++; }
    }
  }
  // a wipe sends the party to an easier map: count only the scenario map's kills, and say so
  const here = s.progress[zone]?.kills ?? 0;
  const moved = s.zone !== zone ? ` · 전멸 후 ${s.zone}로 후퇴(거기서 ${s.totals.kills - here}마리)` : '';
  console.log(`\n■ ${sc}  — ${minutes}분: 처치 ${here} (${(here / minutes).toFixed(1)}/분), 사망 ${s.totals.deaths}${healBurns ? `, 힐 공격 ${healBurns}회` : ''}${moved}`);
  for (const h of w.heroes) {
    const tm = time[h.uid] ?? {};
    const share = STATES.map((k) => [k, Math.round((tm[k] ?? 0) / total * 100)] as const).filter(([, v]) => v > 0).map(([k, v]) => `${k} ${v}%`).join(' ');
    const avg = (g?: [number, number]) => (g && g[1] ? Math.round(g[0] / g[1]) : '-');
    const sk = Object.entries(casts[h.uid] ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => `${SKILLS[id]?.name ?? id}×${n}`).join(', ');
    console.log(`  ${h.hero.name.padEnd(12)} ${heroRole(h.hero).padEnd(6)} 딜 ${String(dealt[h.uid] ?? 0).padStart(7)} 피해 ${String(taken[h.uid] ?? 0).padStart(6)}  대상거리 ${String(avg(gapT[h.uid])).padStart(3)} 리더거리 ${String(avg(gapL[h.uid])).padStart(3)}  | ${share}${sk ? `  | ${sk}` : ''}`);
  }
}
