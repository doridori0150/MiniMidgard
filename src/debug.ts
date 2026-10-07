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
 */
export async function qaBoot(): Promise<boolean> {
  const q = new URLSearchParams(location.search);
  if (!q.has('qa')) return false;
  const st = await import('./game/state.ts');
  const { SKILLS } = await import('./game/data/skills.ts');
  const { ZONES } = await import('./game/data/zones.ts');
  const party = (q.get('party') ?? 'novice,swordsman,mage').split(',');
  const lv = Number(q.get('lv') ?? 24);
  const s = st.newGame('쿠키', st.defaultLook('f'));
  s.heroes = []; s.partySlots = 3; s.zeny = 50000; s.stacks.u_red = 99;
  const names = ['쿠키', '마루', '보리'];
  party.forEach((cls, i) => {
    const h = st.newHero(s, names[i] ?? 'QA', st.defaultLook(i === 1 ? 'm' : 'f'));
    h.cls = cls as never; h.baseLv = lv; h.jobLv = cls === 'novice' ? 9 : 20; h.statPts = 48 + lv * 5; st.autoDistribute(h);
    h.skillPts = 30;
    for (let k = 0; k < 60; k++) { if (!Object.values(SKILLS).find((x) => x.cls === cls && st.learnSkill(h, x.id))) break; }
    h.tactics = st.defaultTactics(h.cls);
    s.heroes.push(h);
  });
  // open everything up to the party's level so the world map shows a realistic mid-game state
  for (const z of ZONES) if (!z.gate && z.lv[0] <= lv + 4 && !s.unlocked.includes(z.id)) s.unlocked.push(z.id);
  s.zone = q.get('zone') ?? 'meadow';
  game.qa = true;
  game.begin(s, true);
  const panel = q.get('panel');
  if (panel) game.panel = panel as never;
  return true;
}
