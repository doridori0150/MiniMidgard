// Rift flow check (균열, src/game/rift.ts): the plumbing around a run, in a few seconds — the save keeps the hunting map
// while inside, the rift never feeds the hunt rate, auto-retry off returns to town, records and first clears, farm/push
// tiers, auto push chains runs, a guardian kill never counts as the real boss, and a long gap drops the rift so offline
// time goes to the hunting map. usage: npm run rift-flow
import { World } from '../src/game/world.ts';
import { newGame, defaultLook, autoDistribute, learnPath, autoFillSlots, addEquip, equip, newHero, defaultTactics, canEquip } from '../src/game/state.ts';
import { SKILLS } from '../src/game/data/skills.ts';
import { ITEMS } from '../src/game/data/items.ts';
import { lineage } from '../src/game/data/classes.ts';
import { riftSave, desiredTier, riftUnlocked } from '../src/game/rift.ts';
import { applyOffline } from '../src/game/offline.ts';
import type { ClassId } from '../src/game/types.ts';
let seed = 5;
const rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const KIT: Record<string, string[]> = { knight: ['w_lance', 'a_knight'], priest: ['w_goldmace', 'a_priest', 's_mirror'], wizard: ['w_frostrod', 'a_wizard'] };
const s = newGame('c', defaultLook('f')); s.heroes = []; s.partySlots = 3; s.stacks.u_white = 400; s.stacks.k_bluegem = 100; s.stacks.k_redgem = 100; s.stacks.k_trap = 300;
s.quick[0] = { id: 'u_white', auto: true, pct: 45 };
for (const cls of ['knight', 'priest', 'wizard'] as ClassId[]) {
  const h = newHero(s, cls, defaultLook()); h.cls = cls; h.baseLv = 62; h.jobLv = 30; h.statPts = 48 + 62 * 5; autoDistribute(h); h.skillPts = 75;
  for (let p = 0; p < 10; p++) for (const k of Object.values(SKILLS)) if (lineage(cls).includes(k.cls as ClassId) && h.skillPts > 0) learnPath(h, k.id, (h.skills[k.id] ?? 0) + 1);
  autoFillSlots(h);
  for (const id of [...KIT[cls], 'g_feather', 'f_greaves']) { if (canEquip(h, id)) continue; const e = addEquip(s, id); e.refine = ITEMS[id].loc === 'weapon' ? 5 : 4; equip(s, h, e.uid); }
  h.tactics = defaultTactics(cls); s.heroes.push(h);
}
s.unlocked.push('desert');
s.zone = 'desert';
const w = new World(s, rng); w.fx = false;
const ok = (c: boolean, t: string) => console.log(`${c ? 'PASS' : 'FAIL'}  ${t}`);
ok(riftUnlocked(s), 'unlocked with a Lv 62 2nd-job party');
const rs = riftSave(s);
rs.auto = 'off'; rs.pick = 1;
const killsBefore = JSON.stringify(s.book);
w.startRift();
ok(!!w.rift && s.zone === 'desert' && w.zone.id.startsWith('rift:'), `in the rift, the save keeps the hunting map (${s.zone})`);
const saved = JSON.parse(JSON.stringify(s));
ok(saved.zone === 'desert', 'a save made mid-run points at the hunting map');
const r0 = s.rate.ms;
let guardianId = '';
for (let i = 0; i < 700 && w.rift && (w.rift.phase === 'run' || w.rift.phase === 'guardian'); i++) { w.advance(1000); if (w.rift?.guardian) guardianId = w.mobs.find((m) => m.uid === w.rift!.guardian)?.m.id ?? guardianId; }
ok(s.rate.ms === r0, 'the rift never feeds the hunt rate of the hunting map');
const res = w.rift?.result;
ok(!!res, `run ended: ${res?.ok ? 'clear' : 'fail'} ${res?.why} in ${Math.round((res?.ms ?? 0) / 1000)}s`);
if (guardianId) ok(!JSON.parse(killsBefore)[guardianId] && !(s.book[guardianId]?.kills), `guardian (${guardianId}) kill not in the bestiary`);
for (let i = 0; i < 10; i++) w.advance(1000);
ok(!w.rift && w.zone.id === 'town' && s.zone === 'town', `auto off → back in town (${w.zone.id})`);
ok(rs.open >= 2 && rs.best >= 1 && rs.firsts.includes(1) && (s.stacks.q_riftessence ?? 0) > 0, `record best ${rs.best}, open ${rs.open}, essence ${s.stacks.q_riftessence}`);
rs.auto = 'farm';
ok(desiredTier(rs) === Math.max(1, rs.best - 1), `farm tier = ${desiredTier(rs)}`);
rs.auto = 'push';
ok(desiredTier(rs) === rs.open, `push tier = ${desiredTier(rs)}`);
// auto push continues by itself
w.setZone('desert');
w.startRift();
const first = w.rift!.plan.seed;
for (let i = 0; i < 700 && w.rift && w.rift.plan.seed === first; i++) w.advance(1000);
ok(!!w.rift && w.rift.plan.seed !== first, `auto push started the next run (tier ${w.rift?.plan.tier})`);
// a long gap: the rift is dropped, offline goes to the hunting map
w.dropRift();
ok(!w.rift && s.zone === 'desert', 'dropRift → back on the hunting map');
s.rate = { zone: 'desert', kills: 600, ms: 3600000, exp: 1e6, jexp: 5e5, zeny: 0, deaths: 0 };
const rep = applyOffline(s, 3600000, rng);
ok(!!rep && rep.zone === 'desert' && rep.kills > 0, `offline report on ${rep?.zone}: ${rep?.kills} kills`);
