// Expedition check (M10, docs/design/BUILD_TREE.md §5.1): plays a party on an expedition map with the danger order
// 피하기 (avoid, the default) and 맞서기 (fight) and reports how the danger monster and the chests actually play out —
// spawns, runs, kills, time spent running, the longest stretch without a kill (a stalemate shows up there), wipes —
// and how long the map's target items take: drops seen, and the expected hours from the measured kill rates.
// usage: npm run expedition-check -- [minutes=60] [seed=1] [scenario …]
//   scenario: lv@zone:cls,cls,cls[@night][!fight|!avoid]   e.g. 45@castlejail:knight,priest,wizard!fight
//   no order suffix = run both orders; @night = the world clock starts at 21:00 (else 12:00)
import { World, type MobUnit } from '../src/game/world.ts';
import { newGame, defaultLook, autoDistribute, learnPath, autoFillSlots, addEquip, equip, newHero, defaultTactics } from '../src/game/state.ts';
import { SKILLS } from '../src/game/data/skills.ts';
import { MONSTERS } from '../src/game/data/monsters.ts';
import { ITEMS } from '../src/game/data/items.ts';
import { ZONES } from '../src/game/data/zones.ts';
import { CLASSES, lineage } from '../src/game/data/classes.ts';
import type { ClassId } from '../src/game/types.ts';

const minutes = Number(process.argv[2] ?? 60);
const seed0 = Number(process.argv[3] ?? 1);
const DEFAULT = [
  '24@warehouse:swordsman,acolyte,archer',
  '40@warehouse:swordsman,acolyte,archer',
  '28@sunkenabbey:swordsman,acolyte,mage@night',
  '40@castlejail:swordsman,acolyte,mage',
  '55@castlejail:knight,priest,wizard',
];
const GEAR: Partial<Record<ClassId, string[]>> = {
  swordsman: ['w_blade', 's_guard'], mage: ['w_wand'], archer: ['w_composite'], acolyte: ['w_mace', 's_guard'],
  thief: ['w_gauche', 's_guard'], merchant: ['w_battleaxe'], novice: ['w_knife'],
  knight: ['w_claymore'], wizard: ['w_staff'], hunter: ['w_composite'], priest: ['w_mace', 's_guard'], assassin: ['w_jamadhar'], blacksmith: ['w_battleaxe'],
};
const ARMOR = ['a_adventure', 'f_shoes', 'g_hood'];

const args = process.argv.slice(4);
const runs: string[] = [];
for (const sc of args.length ? args : DEFAULT) runs.push(...(/![a-z]+$/.test(sc) ? [sc] : [sc + '!avoid', sc + '!fight']));

console.log(`expedition check: ${minutes} min per run, seed ${seed0}`);
for (const sc of runs) {
  const m = sc.match(/^(\d+)@([a-z0-9]+):([a-z,]+)(@night)?!(avoid|fight)$/);
  if (!m) throw new Error('bad scenario ' + sc);
  const lv = Number(m[1]), zoneId = m[2], classes = m[3].split(',') as ClassId[], night = !!m[4], order = m[5] as 'avoid' | 'fight';
  const z = ZONES.find((x) => x.id === zoneId);
  if (!z) throw new Error('unknown zone ' + zoneId);
  let seed = seed0;
  const rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const s = newGame('check', defaultLook('f'));
  s.heroes = []; s.partySlots = 3; s.stacks.u_red = 300; s.stacks.u_orange = 200; s.stacks.u_yellow = 100; s.zeny = 500000;
  s.quick[0] = { id: lv < 30 ? 'u_orange' : 'u_yellow', auto: true, pct: 45 };
  classes.forEach((cls, i) => {
    const h = newHero(s, `${cls}${i}`, defaultLook(i % 2 ? 'm' : 'f'));
    h.cls = cls; h.baseLv = lv; h.jobLv = CLASSES[cls].tier === 2 ? 25 : 40; h.statPts = 48 + lv * 5; autoDistribute(h);
    // like party-check: the main attack / heal skills first, then one level per pass, through the whole lineage
    h.skillPts = CLASSES[cls].tier === 2 ? 70 : 45;
    const main = (x: { auto: string }) => x.auto === 'attack' || x.auto === 'aoe' || x.auto === 'heal' || x.auto === 'revive';
    const line = lineage(cls);
    for (const tier of [true, false]) for (let pass = 0; pass < 10 && h.skillPts > 0; pass++) {
      for (const x of Object.values(SKILLS)) if (line.includes(x.cls as ClassId) && main(x) === tier && h.skillPts > 0) learnPath(h, x.id, (h.skills[x.id] ?? 0) + 1);
    }
    for (const id of [...(GEAR[cls] ?? []), ...ARMOR]) { if (!ITEMS[id]) continue; const inst = addEquip(s, id); equip(s, h, inst.uid); }
    h.tactics = { ...defaultTactics(cls), role: 'auto' };
    autoFillSlots(h);
    s.heroes.push(h);
  });
  s.zone = zoneId;
  if (!s.unlocked.includes(zoneId)) s.unlocked.push(zoneId);
  s.orders = { ...s.orders, danger: order };
  const w = new World(s, rng);
  w.fx = false;
  const startHour = night ? 21 : 12;
  w.clock = () => { const min = startHour * 60 + Math.floor(w.time / 60000); return new Date(2026, 0, 1 + Math.floor(min / 1440), Math.floor(min / 60) % 24, min % 60); };
  w.setZone(zoneId);

  const targets = [...new Set([...(z.specialty ?? []), ...(z.danger ?? []).map((d) => d.id), z.chest?.trap].filter(Boolean) as string[])]
    .filter((id) => ITEMS[id]?.kind === 'equip');
  const firstAt: Record<string, number> = {};
  const kills: Record<string, number> = {};
  const W = w as unknown as Record<string, (...a: unknown[]) => unknown>;
  const killMob = W.killMob;
  W.killMob = function (this: unknown, t: unknown, killer: unknown) { const mu = t as MobUnit; kills[mu.m.id] = (kills[mu.m.id] ?? 0) + 1; return killMob.call(this, t, killer); };
  let lastKill = 0, longestDry = 0, maxDangerLife = 0, dangerFrames = 0, contact = 0;
  const STEP = 100, total = minutes * 60000;
  let k0 = s.totals.kills;
  for (let ms = 0; ms < total; ms += STEP) {
    w.advance(STEP);
    if (s.totals.kills !== k0) { k0 = s.totals.kills; longestDry = Math.max(longestDry, w.time - lastKill); lastKill = w.time; }
    for (const mu of w.mobs) {
      if (!mu.danger || mu.state === 'dead') continue;
      dangerFrames++;
      maxDangerLife = Math.max(maxDangerLife, w.time - mu.bornAt);
      if (mu.target !== null) contact++;
    }
    for (const id of targets) if (firstAt[id] === undefined && s.equips.some((e) => e.id === id)) firstAt[id] = w.time / 60000;
    if (s.zone !== zoneId) break; // a wipe retreat left the map
  }
  longestDry = Math.max(longestDry, w.time - lastKill);
  const hrs = w.time / 3600000;
  const ds = w.dangerStats;
  const here = s.progress[zoneId]?.kills ?? 0;
  console.log(`\n■ ${sc}  — ${Math.round(w.time / 60000)}분${s.zone !== zoneId ? ` (전멸 후 ${s.zone}로 후퇴)` : ''}: 처치 ${here} (${Math.round(here / hrs)}/h), 전멸 ${s.totals.deaths}, 가장 긴 무처치 ${Math.round(longestDry / 1000)}초`);
  console.log(`  위험 몹: 출현 ${ds.spawns} · 처치 ${ds.kills} · 떠남 ${ds.left} · 함정 상자 ${ds.traps}/${ds.chests}상자 · 도주 ${ds.runs}회, 도주 시간 ${Math.round(ds.evadeMs / w.time * 100)}% · 최장 체류 ${Math.round(maxDangerLife / 1000)}초 · 위험 몹이 누군가를 쫓은 시간 ${Math.round(contact * STEP / 1000)}초 / 맵에 있던 시간 ${Math.round(dangerFrames * STEP / 1000)}초`);
  for (const id of targets) {
    // expected hours to the first one: measured kills per hour of each source × its rate (+ chests opened per hour)
    let perH = 0;
    for (const [mob, n] of Object.entries(kills)) { const d = MONSTERS[mob].drops.find((x) => x.id === id); if (d) perH += n / hrs * d.rate; }
    const cd = z.chest?.drops.find((x) => x.id === id);
    if (cd) perH += (ds.chests - ds.traps) / hrs * cd.rate;
    const have = s.equips.filter((e) => e.id === id).length;
    console.log(`  ${ITEMS[id].name}: ${have}개${firstAt[id] !== undefined ? ` (첫 ${firstAt[id].toFixed(0)}분)` : ''} · 기대 ${perH > 0 ? (1 / perH).toFixed(1) + '시간에 1개' : '얻을 길 없음'}`);
  }
  const lvs = s.heroes.map((h) => `${CLASSES[h.cls].name} ${h.baseLv}`).join(', ');
  console.log(`  파티: ${lvs} · 처치 ${Object.entries(kills).sort((a, b) => b[1] - a[1]).map(([id, n]) => `${MONSTERS[id].name} ${n}`).join(', ')}`);
}
