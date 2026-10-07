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
