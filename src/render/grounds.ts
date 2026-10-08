// Placed skill effects (world.grounds): fire wall, safety wall, pneuma, sanctuary, magnus, storm gust, quagmire,
// venom dust, ice wall, traps, talkie boxes. Same look as the rest of the field: flat colours, one hard shadow tone,
// a thick dark-brown outline. Everything is drawn from world state each frame (no events needed).
import type { GroundFx } from '../game/world.ts';
import { CELL } from '../game/data/skills.ts';
import { rgba } from './color.ts';

const INK = '#2e1c12';

function outline(ctx: CanvasRenderingContext2D, fill: string, w = 1.8) {
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.stroke();
}

/** fade in over 200 ms, out over the last 400 ms */
function lifeAlpha(g: GroundFx, t: number) {
  const a = Math.min(1, (t - g.born) / 200);
  const b = g.until === Infinity ? 1 : Math.min(1, (g.until - t) / 400);
  return Math.max(0, Math.min(a, b));
}

const TRAP_COL: Record<string, string> = {
  skid_trap: '#cfe0ff', land_mine: '#b08850', ankle_snare: '#8ac060', shockwave_trap: '#a090ff', sandman: '#c8b0ff',
  flasher: '#ffe860', freezing_trap: '#90e0ff', blast_mine: '#90e090', claymore_trap: '#ff7040', fire_pillar: '#ff4a20',
};

/** flat ground layer (under units): everything but the ice wall's blocks and the talkie box */
export function drawGround(ctx: CanvasRenderingContext2D, g: GroundFx, t: number) {
  const a = lifeAlpha(g, t);
  if (a <= 0) return;
  const id = g.sk.id;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  switch (id) {
    case 'safety_wall': case 'pr_safety_wall': {
      // a pink crystal ring with a short translucent pillar; pips = blocks left
      ctx.beginPath(); ctx.ellipse(g.x, g.y, g.r, g.r * 0.45, 0, 0, Math.PI * 2);
      outline(ctx, rgba('#ff9ad8', 0.55));
      ctx.fillStyle = rgba('#ffc0e8', 0.22 + Math.sin(t / 260) * 0.05);
      ctx.fillRect(g.x - g.r * 0.8, g.y - 40, g.r * 1.6, 40);
      ctx.strokeStyle = rgba('#ff70c0', 0.8); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(g.x - g.r * 0.8, g.y); ctx.lineTo(g.x - g.r * 0.8, g.y - 40); ctx.moveTo(g.x + g.r * 0.8, g.y); ctx.lineTo(g.x + g.r * 0.8, g.y - 40); ctx.stroke();
      const n = Math.min(11, g.charges);
      for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(g.x - (n - 1) * 2.5 + i * 5, g.y - 44, 1.8, 0, Math.PI * 2); outline(ctx, '#ff9ad8', 0.8); }
      break;
    }
    case 'pneuma': {
      // a ring of flat white cloud puffs
      for (let i = 0; i < 8; i++) {
        const an = i / 8 * Math.PI * 2 + t / 2400;
        ctx.beginPath(); ctx.arc(g.x + Math.cos(an) * g.r * 0.85, g.y + Math.sin(an) * g.r * 0.4 - 4, 9, 0, Math.PI * 2);
        outline(ctx, rgba('#f4f8ff', 0.8), 1.4);
      }
      ctx.beginPath(); ctx.ellipse(g.x, g.y, g.r * 0.7, g.r * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgba('#e8f0ff', 0.35); ctx.fill();
      break;
    }
    case 'sanctuary': {
      // a green 5×5 diamond with crosses; light rises on each pulse
      const r = g.r, k = 0.5;
      ctx.beginPath(); ctx.moveTo(g.x, g.y - r * k); ctx.lineTo(g.x + r, g.y); ctx.lineTo(g.x, g.y + r * k); ctx.lineTo(g.x - r, g.y); ctx.closePath();
      outline(ctx, rgba('#7cf09a', 0.35), 2);
      ctx.fillStyle = rgba('#e8ffe8', 0.85);
      for (const [dx, dy] of [[0, 0], [-r * 0.45, 0], [r * 0.45, 0], [0, -r * 0.22], [0, r * 0.22]]) {
        ctx.fillRect(g.x + dx - 1.2, g.y + dy - 5, 2.4, 10); ctx.fillRect(g.x + dx - 4, g.y + dy - 1.2, 8, 2.4);
      }
      const pulse = 1 - ((t - g.born) % 1000) / 1000;
      ctx.globalAlpha = a * pulse * 0.5;
      ctx.fillStyle = rgba('#b0ffc0', 0.6); ctx.fillRect(g.x - r * 0.6, g.y - 50, r * 1.2, 50);
      break;
    }
    case 'magnus': {
      // a golden cross carved into the ground, inside a holy ring
      ctx.beginPath(); ctx.ellipse(g.x, g.y, g.r, g.r * 0.45, 0, 0, Math.PI * 2);
      outline(ctx, rgba('#fff3a0', 0.18), 2);
      ctx.beginPath();
      const w = 7, L = g.r * 0.85;
      ctx.rect(g.x - w, g.y - L * 0.45, w * 2, L * 0.9); ctx.rect(g.x - L * 0.6, g.y - w * 0.6, L * 1.2, w * 1.2);
      ctx.fillStyle = rgba('#ffe680', 0.55); ctx.fill();
      ctx.strokeStyle = rgba(INK, 0.6); ctx.lineWidth = 1.2; ctx.stroke();
      break;
    }
    case 'storm_gust': {
      // a pale blue whirl with snowflakes blown around it
      ctx.beginPath(); ctx.ellipse(g.x, g.y, g.r, g.r * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgba('#d8f0ff', 0.3); ctx.fill();
      ctx.strokeStyle = rgba('#9fe8ff', 0.9); ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const s0 = t / 300 + i * 2.1;
        ctx.beginPath(); ctx.ellipse(g.x, g.y - 8, g.r * (0.4 + i * 0.25), g.r * (0.16 + i * 0.1), 0, s0, s0 + 1.6); ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 18; i++) {
        const an = i * 2.4 + t / 260, rr = (i * 37 % 100) / 100 * g.r;
        const x = g.x + Math.cos(an) * rr, y = g.y - 10 + Math.sin(an) * rr * 0.45 - ((t / 9 + i * 13) % 30);
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
      break;
    }
    case 'quagmire': {
      ctx.beginPath(); ctx.ellipse(g.x, g.y, g.r, g.r * 0.45, 0, 0, Math.PI * 2);
      outline(ctx, rgba('#7a5a30', 0.62), 2);
      for (let i = 0; i < 6; i++) {
        const ph = ((t / 700) + i * 0.37) % 1, an = i * 1.9;
        ctx.globalAlpha = a * (1 - ph);
        ctx.beginPath(); ctx.arc(g.x + Math.cos(an) * g.r * 0.55, g.y + Math.sin(an) * g.r * 0.22, 2 + ph * 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#4a3418'; ctx.lineWidth = 1.4; ctx.stroke();
      }
      break;
    }
    case 'venom_dust': {
      ctx.beginPath(); ctx.ellipse(g.x, g.y, g.r, g.r * 0.45, 0, 0, Math.PI * 2);
      outline(ctx, rgba('#9a50d0', 0.5), 1.6);
      for (let i = 0; i < 5; i++) {
        const ph = ((t / 900) + i * 0.29) % 1, an = i * 2.3;
        ctx.globalAlpha = a * (1 - ph) * 0.9;
        ctx.beginPath(); ctx.arc(g.x + Math.cos(an) * g.r * 0.5, g.y - ph * 22 + Math.sin(an) * g.r * 0.2, 2.5 + ph * 3, 0, Math.PI * 2);
        ctx.fillStyle = '#c080ff'; ctx.fill();
      }
      break;
    }
    case 'fire_wall': {
      // three flat flame tongues along the wall, flickering
      for (let i = -1; i <= 1; i++) {
        const x = g.x + g.ax * i * CELL, y = g.y + g.ay * i * CELL;
        const fl = Math.sin(t / 90 + i * 1.7) * 3;
        const hgt = 30 + fl;
        ctx.beginPath();
        ctx.moveTo(x - 10, y); ctx.quadraticCurveTo(x - 12, y - hgt * 0.5, x - 2, y - hgt); ctx.quadraticCurveTo(x + 2, y - hgt * 0.55, x + 6, y - hgt * 0.72);
        ctx.quadraticCurveTo(x + 13, y - hgt * 0.35, x + 10, y); ctx.closePath();
        outline(ctx, '#ff7a2a', 1.8);
        ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.quadraticCurveTo(x - 6, y - hgt * 0.35, x, y - hgt * 0.6); ctx.quadraticCurveTo(x + 6, y - hgt * 0.3, x + 5, y); ctx.closePath();
        ctx.fillStyle = '#ffd84a'; ctx.fill();
      }
      break;
    }
    case 'talkie_box': break;
    case 'ice_wall': {
      // shadows only (the blocks themselves are y-sorted with the units)
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(g.x + g.ax * i * CELL, g.y + g.ay * i * CELL, 12, 4, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(20,40,60,0.3)'; ctx.fill(); }
      break;
    }
    default: {
      if (g.sk.kind !== 'trap') break;
      // a trap: a small flat disc with its colour and teeth (armed = a slow blink)
      const col = TRAP_COL[id] ?? '#b08850';
      const armed = t >= g.armAt;
      if (id === 'fire_pillar') {
        ctx.beginPath(); ctx.ellipse(g.x, g.y, 14, 6, 0, 0, Math.PI * 2);
        outline(ctx, rgba(col, 0.45), 1.6);
        ctx.strokeStyle = rgba('#ffd84a', 0.8); ctx.lineWidth = 1.2;
        ctx.beginPath(); for (let i = 0; i < 5; i++) { const an = i / 5 * Math.PI * 2 + t / 900; ctx.lineTo(g.x + Math.cos(an) * 11, g.y + Math.sin(an) * 4.5); } ctx.closePath(); ctx.stroke();
        break;
      }
      ctx.beginPath(); ctx.ellipse(g.x, g.y, 10, 4.5, 0, 0, Math.PI * 2);
      outline(ctx, '#6a5038', 1.6);
      ctx.beginPath(); ctx.ellipse(g.x, g.y - 1, 6.5, 2.8, 0, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(g.x + Math.cos(an) * 8, g.y + Math.sin(an) * 3.5); ctx.lineTo(g.x + Math.cos(an) * 11, g.y + Math.sin(an) * 4.8 - 2); ctx.stroke(); }
      if (armed && Math.sin(t / 220 + g.id) > 0.6) { ctx.beginPath(); ctx.arc(g.x, g.y - 2, 1.6, 0, Math.PI * 2); ctx.fillStyle = '#ff4030'; ctx.fill(); }
    }
  }
  ctx.restore();
}

/** one ice block of a wall, drawn in the y-sorted pass so units go behind / in front of it */
export function drawIceBlock(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, seed: number) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.lineJoin = 'round';
  const h = 30 + (seed % 3) * 4;
  ctx.beginPath();
  ctx.moveTo(x - 11, y); ctx.lineTo(x - 12, y - h * 0.65); ctx.lineTo(x - 4, y - h); ctx.lineTo(x + 7, y - h * 0.85); ctx.lineTo(x + 12, y - h * 0.4); ctx.lineTo(x + 10, y);
  ctx.closePath();
  outline(ctx, '#bfefff', 2);
  ctx.beginPath(); ctx.moveTo(x - 4, y - h); ctx.lineTo(x - 2, y - 4); ctx.lineTo(x - 11, y - h * 0.62); ctx.closePath();
  ctx.fillStyle = '#e8fbff'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 7, y - h * 0.85); ctx.lineTo(x + 2, y - 3); ctx.lineTo(x + 10, y); ctx.lineTo(x + 12, y - h * 0.4); ctx.closePath();
  ctx.fillStyle = '#8ccde8'; ctx.fill();
  ctx.restore();
}

/** a talkie box with its speech bubble */
export function drawTalkie(ctx: CanvasRenderingContext2D, g: GroundFx, t: number) {
  const a = lifeAlpha(g, t);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.beginPath(); ctx.rect(g.x - 7, g.y - 10, 14, 10); outline(ctx, '#d8a860', 1.6);
  ctx.fillStyle = INK; ctx.fillRect(g.x - 3, g.y - 7, 6, 2);
  const text = g.text ?? '';
  ctx.font = "bold 10px 'Galmuri11', sans-serif";
  const w = Math.max(30, ctx.measureText(text).width + 12);
  const by = g.y - 34 - Math.sin(Math.min(1, (t - g.born) / 250) * Math.PI / 2) * 4;
  ctx.beginPath(); ctx.roundRect(g.x - w / 2, by - 9, w, 18, 6); outline(ctx, '#fffbe8', 1.6);
  ctx.beginPath(); ctx.moveTo(g.x - 4, by + 9); ctx.lineTo(g.x, by + 15); ctx.lineTo(g.x + 4, by + 9); ctx.fillStyle = '#fffbe8'; ctx.fill();
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, g.x, by);
  ctx.restore();
}

/** a merchant's pushcart behind its owner (카트 교체: the flowered one) */
export function drawCart(ctx: CanvasRenderingContext2D, x: number, y: number, facing: 1 | -1, fancy: boolean, t: number, walking: boolean) {
  ctx.save();
  ctx.translate(x - facing * 26, y);
  ctx.lineJoin = 'round';
  const bob = walking ? Math.sin(t / 90) * 0.8 : 0;
  ctx.fillStyle = 'rgba(20,30,20,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, 15, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  // handle toward the owner
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(facing * 10, -12 + bob); ctx.lineTo(facing * 20, -16 + bob); ctx.stroke();
  ctx.strokeStyle = '#a07040'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.beginPath(); ctx.rect(-13, -20 + bob, 26, 12); outline(ctx, fancy ? '#ffb0d8' : '#b07a40', 2);
  ctx.fillStyle = fancy ? '#ff7ab8' : '#8a5a28'; ctx.fillRect(-13, -12 + bob, 26, 4);
  if (fancy) for (const fx of [-7, 0, 7]) { ctx.beginPath(); ctx.arc(fx, -16 + bob, 2.2, 0, Math.PI * 2); ctx.fillStyle = '#fff4a0'; ctx.fill(); }
  for (const wx of [-8, 8]) {
    ctx.beginPath(); ctx.arc(wx, -4, 4.2, 0, Math.PI * 2); outline(ctx, '#d8c090', 1.6);
    ctx.beginPath(); ctx.arc(wx, -4, 1.2, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
  }
  ctx.restore();
}
