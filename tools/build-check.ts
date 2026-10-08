// Build check: plays each build (docs/design/BUILD_TREE.md, data/builds.ts) solo with its identity items and reports
// whether its mechanic actually shows up (crits, falcon dives, procs, curses, misses) and how it compares on kill speed
// and deaths. usage: npm run build-check -- [minutes=10] [seed=1] [scenario …]
//   scenario: lv@zone:cls#build[+item,item][-][&cls#build…]   '-' = no weapon (bare hands), '&' = party mates
//   e.g. 50@desert:hunter#hu_fist-   48@cave:priest#pr_support&knight#kn_vit
//
// Signature skills (docs/design/SKILLS_META.md): npm run build-check -- sig [minutes=8] [seeds=3] [build | build<other …]
//   every build with and without its own signature skill(s) — same seeds, its own gear and slots, in the build's fair
//   zones (48@cave is undead-heavy, so non-undead builds also play the desert) — and cross pairs `x<y` (build x takes
//   build y's signature skills) that should gain little. Kills/h is the yardstick; builds whose signature isn't about
//   kill speed also show what it is about (damage taken, zeny, a party).
import { World } from '../src/game/world.ts';
import { newGame, defaultLook, autoDistribute, learnPath, autoFillSlots, addEquip, equip, newHero, defaultTactics } from '../src/game/state.ts';
import { SKILLS, signatureSkills } from '../src/game/data/skills.ts';
import { ITEMS } from '../src/game/data/items.ts';
import { buildOf, BUILDS } from '../src/game/data/builds.ts';
import type { ClassId, GameState, Hero } from '../src/game/types.ts';

const SECOND: Record<string, ClassId> = { swordsman: 'knight', mage: 'wizard', archer: 'hunter', acolyte: 'priest', thief: 'assassin', merchant: 'blacksmith' };
const WEAPON: Partial<Record<ClassId, string>> = { knight: 'w_claymore', wizard: 'w_staff', hunter: 'w_composite', priest: 'w_mace', assassin: 'w_jamadhar', blacksmith: 'w_battleaxe' };
/** the shop kit of a Lv 45+ second job (signature comparison only): with nothing but a weapon, deaths swamped the numbers */
const ARMOR: Partial<Record<ClassId, string>> = { knight: 'a_knight', wizard: 'a_wizard', hunter: 'a_hunter', priest: 'a_priest', assassin: 'a_assassin', blacksmith: 'a_smith' };
const SPEAR_BUILDS = new Set(['kn_vit']);
const DUAL_BUILDS = new Set(['as_dagger']);
const BARE = new Set(['hu_fist']);

/** how a build's signature skills are handled: 'base' = as the build card says (signature included), 'without' = never
 *  learned, 'with' = the 'without' allocation plus the signature skill(s) maxed on top, `take` = another build's ones */
interface SigOpts { mode: 'base' | 'without' | 'with'; take?: string[] }
interface Metrics {
  kills: number; deaths: number; dps: number; crit: number; miss: number; falcon: number; procs: number; curses: number; spent: number;
  taken: number; zeny: number; steals: number; casts: Record<string, number>; partyKills: number;
}

function makeHero(s: GameState, cls: ClassId, buildId: string, lv: number, bare: boolean, extra: string[], o: SigOpts): Hero {
  const h = newHero(s, buildId, defaultLook('f'));
  h.cls = cls; h.baseLv = lv; h.jobLv = 30; h.build = buildId; h.statPts = 48 + lv * 5; autoDistribute(h);
  const b = buildOf(cls, buildId);
  const own = new Set(signatureSkills(buildId).map((x) => x.id));
  const core = (b?.skills ?? []).filter((id) => o.mode === 'base' || !own.has(id));
  // the build's own skills first (maxed, prerequisites on the way), then the job's attack skills, then the rest
  h.skillPts = 60;
  for (const id of core) learnPath(h, id);
  for (const tier of [true, false]) for (let pass = 0; pass < 10 && h.skillPts > 0; pass++) {
    for (const x of Object.values(SKILLS)) {
      if (x.cls === cls && !x.quest && !x.build && (x.auto === 'attack' || x.auto === 'aoe') === tier && h.skillPts > 0) learnPath(h, x.id, (h.skills[x.id] ?? 0) + 1);
    }
  }
  // both: the prerequisites of the signature skill(s) being compared (a cross pair's too — so it is the signature's own
  // effect that is measured, not that of a prerequisite like 아드레날린 러쉬); 'with': the skill(s) on top
  const sigs = o.mode === 'base' ? [] : (o.take ?? [...own]);
  if (o.mode !== 'base') h.skillPts += 40;
  for (const id of sigs) for (const [r, rl] of Object.entries(SKILLS[id].req ?? {})) if (!sigs.includes(r)) learnPath(h, r, rl);
  const add = o.mode === 'with' ? sigs : [];
  for (const id of add) learnPath(h, id);
  // 스킬 슬롯: the build's skills first (a taken signature active leads), then the best of the rest — in the signature
  // comparison only the attacks on the build card (its own slots: no stray land mines), buffs / control as they fit
  if (o.mode === 'base') autoFillSlots(h, core);
  else {
    const card = new Set([...core, ...add]);
    autoFillSlots(h, [...add, ...core], (id) => card.has(id) || (SKILLS[id].auto !== 'attack' && SKILLS[id].auto !== 'aoe'));
  }
  const gear = [...(b?.items ?? []), ...extra].filter((id) => ITEMS[id]);
  if (o.mode !== 'base') for (const id of [ARMOR[cls], 'g_feather', 'f_greaves']) if (id && !gear.some((g) => ITEMS[g].loc === ITEMS[id].loc)) gear.push(id);
  const hasWeapon = gear.some((id) => ITEMS[id].loc === 'weapon');
  if (!bare && !hasWeapon) gear.unshift(SPEAR_BUILDS.has(buildId) ? 'w_pike' : DUAL_BUILDS.has(buildId) ? 'w_damascus' : WEAPON[cls] ?? 'w_knife');
  for (const id of gear) { const inst = addEquip(s, id); const e = equip(s, h, inst.uid); if (e && o.mode === 'base') console.log(`  (${id}: ${e})`); }
  // 이도류: a second dagger in the left hand
  if (DUAL_BUILDS.has(buildId)) { const off = addEquip(s, 'w_damascus'); const e = equip(s, h, off.uid, 'shield'); if (e && o.mode === 'base') console.log(`  (off-hand: ${e})`); }
  if (cls === 'hunter' && !bare) { s.stacks.am_arrow = 1; h.ammo = 'am_arrow'; }
  h.tactics = { ...defaultTactics(cls), role: 'auto', ...TACTICS[buildId] };
  return h;
}

/** how a build is played (tactics): the holy casters stand back and use their spells beyond half SP */
const TACTICS: Record<string, Partial<Hero['tactics']>> = { pr_heal: { role: 'caster', skills: 'normal' }, pr_exorcist: { role: 'caster', skills: 'normal' } };
/** 몰이 builds are played gathering packs: every 12 s whatever idles within 240 px comes at the hero (a player dragging a
 *  train; with and without alike) — their signature is about how many they catch. 몰이 매 brings its own (the whistle). */
const TRAIN = new Set(['kn_bowl', 'bs_cart', 'bs_zeny', 'wz_storm', 'hu_shower', 'pr_exorcist']);

function run(sc: string, minutes: number, seed0: number, o: SigOpts): Metrics {
  const [head, rest] = sc.split(':');
  const [lvS, zone] = head.split('@');
  const lv = Number(lvS);
  const members = rest.split('&');
  let seed = seed0;
  const rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const s = newGame('check', defaultLook('f'));
  s.heroes = []; s.partySlots = members.length; s.stacks.u_red = 200; s.stacks.u_orange = 100; s.zeny = 2_000_000;
  s.stacks.k_bluegem = 100; s.stacks.k_redgem = 100; s.stacks.k_trap = 400; s.stacks.k_holywater = 50;
  let tested: Hero | null = null;
  members.forEach((mem, i) => {
    const m = mem.match(/^([a-z]+)#([a-z_]+)((?:\+[a-z_]+)*)(-?)$/)!;
    const cls = m[1] as ClassId, buildId = m[2], extra = m[3] ? m[3].slice(1).split('+') : [], bare = m[4] === '-';
    // only the first hero's signature is toggled; party mates play their build card as is
    const hero = makeHero(s, cls, buildId, lv, bare, extra, i === 0 ? o : { mode: 'base' });
    if (i === 0) tested = hero;
    s.heroes.push(hero);
  });
  // in a party the mates lead (a tank in front, the tested caster / archer / support behind it)
  if (s.heroes.length > 1) s.heroes.push(s.heroes.shift()!);
  s.zone = zone;
  if (!s.unlocked.includes(zone)) s.unlocked.push(zone);
  // signature comparison: a Lv 48 hunting kit — white potions on auto at 45% (red ones made every melee build sit out
  // half the hour, so no damage signature could show)
  if (o.mode !== 'base') { s.stacks.u_white = 600; s.quick[0] = { id: 'u_white', auto: true, pct: 45 }; }
  const z0 = s.zeny;
  const w = new World(s, rng);
  w.fx = o.mode === 'base'; // effects are presentation only; the comparison runs without them

  const W = w as unknown as Record<string, (...a: unknown[]) => unknown> & { lastCrit: boolean; grandZeny: number };
  const me = w.heroes.find((x) => x.hero === tested)!;
  let dealt = 0, hits = 0, crits = 0, misses = 0, falcon = 0, procs = 0, curses = 0, deaths = 0, taken = 0, steals = 0, kills = 0, partyKills = 0;
  const wrap = (name: string, before: (...a: any[]) => unknown, after?: (r: unknown, pre: unknown) => void) => {
    const f = W[name]; W[name] = function (this: unknown, ...a: unknown[]) { const pre = before(...a); const r = f.apply(this, a); after?.(r, pre); return r; };
  };
  wrap('dealToMob', (h, _t, n) => { if (h === me) dealt += n as number; });
  wrap('resolvePhys', (h) => h === me, (r, mine) => { if (!mine) return; if (r) { hits++; if (W.lastCrit) crits++; } else misses++; });
  wrap('falconStrike', (h) => { if (h === me) falcon++; });
  wrap('runProc', (h) => { if (h === me) procs++; });
  wrap('curseHero', (h) => { if (h === me) curses++; });
  wrap('trySteal', (h) => { if (h === me) steals++; });
  // damage taken: this hero's, or the whole party's when mates play along (support signatures)
  wrap('damageHero', (h) => [h, (h as { hp: number }).hp], (_r, pre) => {
    const [h, hp] = pre as [{ hp: number }, number];
    if (h === me || members.length > 1) taken += Math.max(0, hp - h.hp);
  });
  wrap('killMob', (_t, killer) => { partyKills++; if (killer === me) kills++; });
  // a wipe never sends the party back to an easier map here (that would count another map's kills), and it doesn't refill
  // SP either (the respawn would otherwise turn every death into free SP for SP-bound builds — a defensive signature that
  // stops the deaths would look like a loss)
  if (o.mode !== 'base') {
    let spAt: number[] = [];
    wrap('wipe', () => { spAt = w.heroes.map((x) => x.sp); });
    wrap('recoverWipe', () => { (w as unknown as { wipeTimes: number[] }).wipeTimes = []; }, () => { w.heroes.forEach((x, i) => { x.sp = Math.min(x.sp, spAt[i] ?? x.sp); }); });
  }
  const casts: Record<string, number> = {};
  wrap('startSkill', (h, sk) => { if (h === me) casts[(sk as { name: string }).name] = (casts[(sk as { name: string }).name] ?? 0) + 1; });
  let wasDead = false;
  const train = o.mode !== 'base' && TRAIN.has(tested!.build ?? '');
  for (let ms = 0; ms < minutes * 60000; ms += 100) {
    w.advance(100);
    // the train comes at whoever leads (the tested hero alone, the tank in a party)
    const lead = w.leader();
    if (train && lead && ms % 12000 === 0) {
      for (const m of w.mobs) if (w.targetable(m) && m.target === null && !m.danger && Math.hypot(m.x - lead.x, m.y - lead.y) < 240) { m.target = lead.uid; m.chaseSince = w.time; }
    }
    if (!w.fx) w.events.length = 0;
    const dead = me.state === 'dead';
    if (dead && !wasDead) deaths++;
    wasDead = dead;
  }
  const hrs = minutes / 60;
  return {
    kills: kills / hrs, partyKills: partyKills / hrs, deaths, dps: dealt / (minutes * 60),
    crit: hits ? crits / hits * 100 : NaN, miss: hits + misses ? misses / (hits + misses) * 100 : NaN,
    falcon: falcon / hrs, procs: procs / hrs, curses: curses / hrs, spent: Math.max(0, z0 - s.zeny), taken: taken / (minutes * 60),
    zeny: W.grandZeny / hrs, steals: steals / hrs, casts,
  };
}

// ───────────────────────────── default: one line per scenario (unchanged report)
if (process.argv[2] !== 'sig') {
  const minutes = Number(process.argv[2] ?? 10);
  const seed0 = Number(process.argv[3] ?? 1);
  const args = process.argv.slice(4);
  const scenarios = args.length ? args : BUILDS.filter((b) => ['kn_crit', 'kn_agi', 'kn_vit', 'kn_bowl', 'hu_dex', 'hu_intblitz', 'hu_fist', 'hu_mob', 'hu_trap', 'as_crit', 'as_sonic', 'as_dagger', 'as_poison', 'bs_battle', 'bs_zeny', 'wz_intdex', 'wz_storm', 'pr_battle', 'pr_exorcist'].includes(b.id))
    .map((b) => `48@cave:${SECOND[b.line]}#${b.id}${BARE.has(b.id) ? '-' : ''}`);
  console.log(`build check: ${minutes} min solo, seed ${seed0}`);
  console.log('scenario                         kills/h  deaths  dmg/s   crit%  miss%  falcon/h  procs/h  curse/h  zeny spent');
  for (const sc of scenarios) {
    const r = run(sc, minutes, seed0, { mode: 'base' });
    const row = [
      sc.padEnd(32), String(Math.round(r.kills)).padStart(7), String(r.deaths).padStart(7), String(Math.round(r.dps)).padStart(6),
      (isNaN(r.crit) ? '-' : r.crit.toFixed(0)).padStart(7), (isNaN(r.miss) ? '-' : r.miss.toFixed(0)).padStart(6),
      String(Math.round(r.falcon)).padStart(9), String(Math.round(r.procs)).padStart(8), String(Math.round(r.curses)).padStart(8), String(r.spent).padStart(11),
    ];
    console.log(row.join(' ') + '  ' + Object.entries(r.casts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}×${v}`).join(' '));
  }
} else {
  // ───────────────────────────── sig: with / without each build's signature skill(s), and cross pairs
  const minutes = Number(process.argv[3] ?? 8);
  const nSeeds = Number(process.argv[4] ?? 3);
  const picks = process.argv.slice(5);
  /** where a build's signature should shine: the undead cave for holy / soul builds, the desert (earth / fire, no undead)
   *  for poison, freezing and element swapping, both for the rest. Party mates (`&`) for the support signatures. */
  const ZONES_OF: Record<string, string[]> = {
    wz_soul: ['cave', 'castlejail'], pr_exorcist: ['cave', 'castlejail'], pr_heal: ['cave', 'castlejail'], pr_turn: ['cave'],
    as_poison: ['ironridge'], wz_freeze: ['ironridge', 'desert'], kn_ele: ['ironridge', 'desert'], wz_elem: ['cave', 'desert'], wz_vit: ['cave', 'desert'],
    pr_support: ['cave', 'desert'], pr_wall: ['cave', 'desert'], bs_hammer: ['cave', 'desert'],
  };
  const MATES: Record<string, string> = { wz_storm: '&knight#kn_vit', pr_support: '&knight#kn_vit&wizard#wz_storm', bs_hammer: '&wizard#wz_storm' };
  /** party support builds: the yardstick is the party's kills (their own last hits mean little) */
  const SUPPORT = new Set(['pr_support', 'bs_hammer']);
  /** builds whose signature is not about kill speed: the column that tells */
  const SIDE: Record<string, (r: Metrics) => string> = {
    wz_vit: (r) => `taken ${r.taken.toFixed(1)}/s`, pr_wall: (r) => `taken ${r.taken.toFixed(1)}/s`, pr_support: (r) => `taken ${r.taken.toFixed(1)}/s`,
    kn_counter: (r) => `taken ${r.taken.toFixed(1)}/s`, kn_vit: (r) => `taken ${r.taken.toFixed(1)}/s`, as_steal: (r) => `snatched ${Math.round(r.zeny)}z/h, steals ${Math.round(r.steals)}/h`,
    hu_mob: (r) => `taken ${r.taken.toFixed(1)}/s`,
  };
  /** cross pairs `x<y`: build x takes build y's signature (it should gain little — the effect is conditional) */
  const CROSS = [
    'kn_agi<kn_crit', 'kn_crit<kn_agi', 'kn_vit<kn_bowl', 'kn_crit<kn_spell', 'kn_bowl<kn_vit',
    'wz_soul<wz_intdex', 'wz_intdex<wz_freeze', 'wz_storm<wz_soul', 'wz_intdex<wz_storm',
    'hu_dex<hu_fist', 'hu_intblitz<hu_mob', 'hu_fist<hu_dex', 'hu_snipe<hu_shower', 'hu_mob<hu_trap',
    'pr_battle<pr_exorcist', 'pr_exorcist<pr_battle', 'pr_crit<pr_heal',
    'as_sonic<as_crit', 'as_crit<as_dagger', 'as_dodge<as_poison', 'as_dagger<as_grim',
    'bs_zeny<bs_cart', 'bs_battle<bs_cart', 'bs_cart<bs_zeny',
  ];
  const builds = BUILDS.filter((b) => signatureSkills(b.id).length);
  const jobs = picks.length ? picks : [...builds.map((b) => b.id), ...CROSS];
  const scen = (id: string, zone: string) => {
    const b = BUILDS.find((x) => x.id === id)!;
    return `48@${zone}:${SECOND[b.line]}#${id}${BARE.has(id) ? '-' : ''}${MATES[id] ?? ''}`;
  };
  const avg = (sc: string, o: SigOpts) => {
    const acc: Metrics[] = [];
    for (let i = 0; i < nSeeds; i++) acc.push(run(sc, minutes, 1 + i * 7919, o));
    // SIGDBG=1: what the hero cast (first seed) and its numbers, to see why a signature does or doesn't show
    if (process.env.SIGDBG) console.log(`    ${o.mode}${o.take ? ' ' + o.take.join(',') : ''}: dps ${acc[0].dps.toFixed(0)} crit ${acc[0].crit.toFixed(0)}% miss ${acc[0].miss.toFixed(0)}% falcon/h ${acc[0].falcon.toFixed(0)} · ` + Object.entries(acc[0].casts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k}×${v}`).join(' '));
    const m = (k: keyof Metrics) => acc.reduce((a, x) => a + (x[k] as number), 0) / acc.length;
    return { ...acc[0], kills: m('kills'), partyKills: m('partyKills'), deaths: m('deaths'), dps: m('dps'), taken: m('taken'), zeny: m('zeny'), steals: m('steals'), crit: m('crit'), falcon: m('falcon') };
  };
  console.log(`signature check: ${minutes} min × ${nSeeds} seeds per row, Lv 48, kills/h of the build's hero (the party's for support builds)`);
  console.log('build            zone        without     with    delta   skills                           note');
  for (const job of jobs) {
    const [x, y] = job.split('<');
    const owner = y ?? x;
    const take = signatureSkills(owner).map((s) => s.id);
    if (!take.length) { console.log(`${job}: no signature skill`); continue; }
    for (const zone of ZONES_OF[x] ?? ['cave', 'ironridge']) {
      const sc = scen(x, zone);
      const a = avg(sc, { mode: 'without', take });
      const b = avg(sc, { mode: 'with', take });
      // support builds in a party are measured by the party's kills; everyone else by its own
      const k = (r: Metrics) => (SUPPORT.has(x) ? r.partyKills : r.kills);
      const d = k(a) > 0 ? (k(b) / k(a) - 1) * 100 : NaN;
      const side = SIDE[x] && !y ? `${SIDE[x](a)} → ${SIDE[x](b)}` : '';
      const dd = (a.deaths || b.deaths ? ` deaths ${a.deaths.toFixed(1)}→${b.deaths.toFixed(1)}` : '') + (MATES[x] && !SUPPORT.has(x) ? ` (party ${Math.round(a.partyKills)}→${Math.round(b.partyKills)}/h)` : '');
      console.log([
        (y ? `${x}<${y}` : x).padEnd(16), (zone + (MATES[x] ? '+party' : '') + (TRAIN.has(x) ? '+몰이' : '')).padEnd(11), String(Math.round(k(a))).padStart(8), String(Math.round(k(b))).padStart(8),
        ((d >= 0 ? '+' : '') + d.toFixed(1) + '%').padStart(8), '  ' + take.map((id) => SKILLS[id].name).join('·').padEnd(26), side + dd,
      ].join(' '));
    }
  }
}
