// Dev-only hooks for QA in a hidden browser pane (rAF is frozen there).
import { game } from './ui/game.ts';

let fake = 0;
const base = () => Math.max(performance.now(), game.renderer?.now ?? 0);
export function installDebug() {
  const w = window as unknown as Record<string, unknown>;
  w.__game = game;
  /** advance the sim by `ms` and render `frames` frames, spreading synthetic time */
  w.__step = (ms: number, frames = 1) => {
    if (!game.started) return 'not started';
    const per = ms / frames;
    for (let f = 0; f < frames; f++) {
      game.world.advance(per);
      fake += per;
      fake = 0;
      game.renderer?.frame(base() + per);
    }
    game.notify();
    return { time: game.world.time, mobs: game.world.mobs.length, kills: game.s.totals.kills, lv: game.s.heroes.map((h) => h.baseLv + '/' + h.jobLv) };
  };
}

/**
 * Dev QA boot: /?qa&party=novice,swordsman,mage&lv=24&zone=meadow&panel=map — starts a throwaway game
 * (saving disabled) so headless screenshots can show real screens without touching the player's save.
 * &builds=kn_crit,,wz_storm gives those heroes a build: its card's skills (signature skills first) are learned first and
 * fill the slots (SKILLS_META.md); without it, signature skills stay unlearned.
 */
export async function qaBoot(q = new URLSearchParams(location.search)): Promise<boolean> {
  if (!q.has('qa')) return false;
  const st = await import('./game/state.ts');
  const { SKILLS } = await import('./game/data/skills.ts');
  const { ZONES } = await import('./game/data/zones.ts');
  const { lineage, CLASSES } = await import('./game/data/classes.ts');
  const party = (q.get('party') ?? 'novice,swordsman,mage').split(',');
  const lv = Number(q.get('lv') ?? 24);
  const s = st.newGame('쿠키', st.defaultLook('f'));
  s.heroes = []; s.partySlots = 3; s.zeny = 50000; s.stacks.u_red = 99;
  // skill catalysts so gem / trap skills can be seen working
  s.stacks.k_bluegem = 30; s.stacks.k_redgem = 30; s.stacks.k_trap = 60; s.stacks.k_holywater = 10;
  const names = ['쿠키', '마루', '보리'];
  const builds = (q.get('builds') ?? '').split(',');
  const { buildOf } = await import('./game/data/builds.ts');
  party.forEach((cls, i) => {
    const h = st.newHero(s, names[i] ?? 'QA', st.defaultLook(i === 1 ? 'm' : 'f'));
    h.cls = cls as never; h.baseLv = lv; h.jobLv = cls === 'novice' ? 9 : 20;
    const b = buildOf(h.cls, builds[i] || undefined);
    if (b) h.build = b.id;
    h.statPts = 48 + lv * 5; st.autoDistribute(h);
    // like a player: the job line's main attack / heal skills first (prerequisites on the way), then the rest
    const line = lineage(h.cls);
    const tierOf = CLASSES[h.cls as keyof typeof CLASSES].tier as number;
    h.skillPts = tierOf === 2 ? 80 : tierOf === 1 ? 40 : 9;
    for (const id of b?.skills ?? []) st.learnPath(h, id);
    const main = (x: { auto: string }) => x.auto === 'attack' || x.auto === 'aoe' || x.auto === 'heal' || x.auto === 'revive';
    for (const tier of [true, false]) for (let pass = 0; pass < 10 && h.skillPts > 0; pass++) {
      for (const x of Object.values(SKILLS)) if (line.includes(x.cls) && x.cls !== 'novice' === (h.cls !== 'novice') && !x.quest && !x.extra && !x.build && main(x) === tier && h.skillPts > 0) st.learnPath(h, x.id, (h.skills[x.id] ?? 0) + 1);
    }
    if (h.cls === 'novice') st.learnPath(h, 'basic', 9);
    h.tactics = st.defaultTactics(h.cls);
    st.autoFillSlots(h, b?.skills ?? []);
    // a QA hero holds its line's usual weapon like a real one (pixel heroes are drawn gripping it); &bare keeps them empty-handed
    if (!q.has('bare')) {
      const WEAPON: Record<string, string> = { novice: 'w_knife', swordsman: 'w_sword', knight: 'w_sword', mage: 'w_rod', wizard: 'w_rod', archer: 'w_bow', hunter: 'w_bow', acolyte: 'w_club', priest: 'w_club', thief: 'w_knife', assassin: 'w_katar', merchant: 'w_axe', blacksmith: 'w_axe' };
      const item = WEAPON[h.cls];
      const inst = item ? st.addItem(s, item) : null;
      if (inst) st.equip(s, h, inst.uid);
      if (item === 'w_bow') { s.stacks.am_arrow = (s.stacks.am_arrow ?? 0) + 999; st.equipAmmo?.(s, h, 'am_arrow'); }
    }
    s.heroes.push(h);
  });
  // open everything up to the party's level so the world map shows a realistic mid-game state
  for (const z of ZONES) if (!z.gate && z.lv[0] <= lv + 4 && !s.unlocked.includes(z.id)) s.unlocked.push(z.id);
  s.zone = q.get('zone') ?? 'meadow';
  if (q.get('art') === 'a') s.settings.heroArt = 'rig'; // &art=a: assembled heroes, &art=c: pixel heroes (A/B/C check)
  if (q.get('art') === 'c') s.settings.heroArt = 'pixel';
  if (q.get('art') === 'd') s.settings.heroArt = 'pixel2';
  if (q.get('bg') === 'hd') s.settings.bgArt = 'hd'; // &bg=hd: layered 2.5D field kit
  game.qa = true;
  game.begin(s, true);
  // ?panel=<legacy id> or ?page=<tab>&sub=<inner tab>, ?sel=<hero index>, ?band=closed
  const panel = q.get('panel');
  if (panel) game.openPanel(panel as never);
  const page = q.get('page');
  if (page) game.openPage(page as never, q.get('sub') ?? undefined);
  if (q.has('sel')) game.sel = Number(q.get('sel'));
  if (q.get('band') === 'closed') game.ui.bandClosed = { general: true, party: true };
  const shop = q.get('town'); if (shop) game.openTown(shop as never);
  const buy = q.get('buy'); if (buy) game.setModal({ kind: 'buy', id: buy });
  // 균열: ?rift=<open tier> unlocks it at that tier (the QA party needs a 2nd job and Lv 60 — or it is lifted to that),
  // &riftauto=push|farm, &riftgo enters at once
  if (q.has('rift')) {
    const rift = await import('./game/rift.ts');
    if (!rift.riftUnlocked(s)) { const h = s.heroes[0]; if (h.cls === 'novice' || !['knight', 'wizard', 'hunter', 'priest', 'assassin', 'blacksmith'].includes(h.cls)) h.cls = 'knight'; h.baseLv = Math.max(h.baseLv, 60); }
    const rs = rift.riftSave(s);
    rs.open = Math.max(1, Number(q.get('rift')) || 1); rs.best = Math.max(0, rs.open - 1); rs.pick = rs.open;
    const auto = q.get('riftauto'); if (auto === 'push' || auto === 'farm') rs.auto = auto;
    game.world.syncParty();
    if (q.has('riftgo')) game.enterRift();
  }
  if (q.has('hero')) game.setModal({ kind: 'hero', id: s.heroes[Number(q.get('hero'))]?.id ?? s.heroes[0].id });
  return true;
}

/**
 * 스킬 시연 (공개판에서도 열림): ?demo=<스킬 id>[&party=priest,knight][&every=2400][&zone=meadow][&lv=60]
 * 버리는 게임(저장 안 함)을 띄우고, 그 스킬 계열의 2차 직업 영웅이 조용한 필드에서 몇 초마다 그 스킬을 씁니다. 몸 동작·이펙트·소리를
 * 휴대폰에서 바로 확인하는 주소입니다(예: ?demo=blessing). 다른 영웅과 몬스터는 움직이지 않게 묶어 둡니다.
 */
export async function demoBoot(): Promise<boolean> {
  const q = new URLSearchParams(location.search);
  const id = q.get('demo');
  if (!id) return false;
  const { SKILLS } = await import('./game/data/skills.ts');
  const { CLASSES, lineage } = await import('./game/data/classes.ts');
  const sk = SKILLS[id];
  if (!sk) { alert('모르는 스킬: ' + id); return false; }
  // the 2nd job of the skill's line (its own art and skill motions), and a knight to receive buffs
  const second = (Object.keys(CLASSES) as (keyof typeof CLASSES)[]).find((c) => CLASSES[c].tier === 2 && c !== 'blacksmith' && lineage(c).includes(sk.cls)) ?? sk.cls;
  await qaBoot(new URLSearchParams({ qa: '', party: q.get('party') ?? `${second},knight`, lv: q.get('lv') ?? '60', zone: q.get('zone') ?? 'meadow', art: 'd', bg: q.get('bg') ?? 'hd', band: 'closed' }));
  const w = game.world, lvMax = sk.maxLv;
  // long casts (meteor 3 s) need the cast and its after-cast delay to finish before the next one
  const busyMs = (sk.cast ? sk.cast(lvMax) : 0) + (sk.delay ? sk.delay(lvMax) : 300);
  const every = Math.max(800, Number(q.get('every')) || Math.max(2400, busyMs + 900));
  const who = (w.heroes.find((h) => lineage(h.hero.cls).includes(sk.cls)) ?? w.heroes[0]).hero;
  who.skills[id] = Math.max(who.skills[id] ?? 0, sk.maxLv);
  // syncParty rebuilds the field units, so the caster is looked up by its hero each time
  const unitOf = () => w.heroes.find((h) => h.hero === who)!;
  // each hero in the gender its pixel art is drawn in (a knight is a she, a hunter a he), standing apart so both read
  const { pixelCharacters } = await import('./render/pixel.ts');
  const { LINE } = await import('./render/whole.ts');
  const drawn = pixelCharacters();
  for (const h of game.s.heroes) { const g = drawn.find((c) => c.cls === h.cls) ?? drawn.find((c) => c.cls === LINE[h.cls]); if (g) h.look.gender = g.gender as 'm' | 'f'; }
  w.syncParty();
  game.notify();
  const self = ['selfBuff', 'selfAoe', 'stance'].includes(sk.kind);
  const ally = ['buff', 'heal', 'cure', 'revive'].includes(sk.kind);
  let dummy: (typeof w.mobs)[number] | null = null;
  const hold = (ms: number) => {
    // keep the field calm: no other monsters, nobody acts on their own between casts
    w.mobs = w.mobs.filter((m) => m === dummy);
    for (const h of w.heroes) { h.target = null; h.lockUntil = Math.max(h.lockUntil, w.time + ms); h.sitting = false; }
    // the others wait a step behind the caster (the side away from the dummy) so they never cover it
    const c = unitOf(); w.heroes.forEach((h, i) => { if (h !== c) { h.x = c.x - 64 * i; h.y = c.y - 6; h.facing = 1; } });
    // the training dummy stays put in front of the caster: a step away for melee skills, further for spells and arrows
    if (dummy) { dummy.hp = dummy.maxHp = 1e9; dummy.lockUntil = w.time + ms; dummy.atkReady = w.time + ms; dummy.x = c.x + (sk.kind === 'melee' ? 56 : 120); dummy.y = c.y; dummy.dest = null; }
  };
  const cast = () => {
    const caster = unitOf();
    const other = w.heroes.find((h) => h !== caster);
    let target: Parameters<typeof w.startSkill>[3] = self ? caster : ally ? other ?? caster : null;
    if (!self && !ally) {
      if (!dummy || !w.mobs.includes(dummy)) { const mob = w.zone.mobs[0]?.id; dummy = mob ? w.spawnMob(mob, false, caster.x + (sk.kind === 'melee' ? 56 : 120), caster.y) : null; }
      target = dummy;
    }
    caster.sp = caster.d.maxSp;
    w.startSkill(caster, sk, caster.hero.skills[id] ?? 1, target);
  };
  setInterval(() => hold(400), 250);
  setTimeout(() => { cast(); setInterval(cast, every); }, 1200);
  return true;
}
