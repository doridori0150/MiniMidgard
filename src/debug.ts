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
export async function qaBoot(): Promise<boolean> {
  const q = new URLSearchParams(location.search);
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
    s.heroes.push(h);
  });
  // open everything up to the party's level so the world map shows a realistic mid-game state
  for (const z of ZONES) if (!z.gate && z.lv[0] <= lv + 4 && !s.unlocked.includes(z.id)) s.unlocked.push(z.id);
  s.zone = q.get('zone') ?? 'meadow';
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
