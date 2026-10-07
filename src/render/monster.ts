// Code-drawn monsters. Origin = feet, facing right. `s` = monster scale.
import { shade, rgba } from './color.ts';
import { drawJellyBody } from './hero.ts';

export interface MobPose { state: string; t: number; facing: 1 | -1; hurt: number; frozen: boolean; spawn: number; dead: number }

function blob(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, line: string, lw = 1.2) {
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = line; ctx.stroke();
}
function eye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color = '#1e1418') {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + r * 0.25, y - r * 0.35, r * 0.35, 0, Math.PI * 2); ctx.fill();
}

/** height of the sprite in local units (for HP bars / numbers) */
export function mobHeight(sprite: string): number {
  switch (sprite) {
    case 'jelly': return 22;
    case 'bunny': return 30;
    case 'worm': return 18;
    case 'mushroom': return 28;
    case 'wolf': return 30;
    case 'bee': return 40;
    case 'flower': return 40;
    case 'skeleton': case 'skeleton_archer': case 'zombie': return 46;
    case 'skeleton_knight': return 54;
    case 'bat': return 44;
    case 'wisp': return 42;
    case 'treant': return 58;
    case 'scorpion': return 24;
    case 'golem': return 50;
    case 'yeti': return 52;
    case 'wraith': return 62;
  }
  return 30;
}

export function drawMob(ctx: CanvasRenderingContext2D, sprite: string, pal: string[], p: MobPose, s: number, crown = false) {
  const t = p.t;
  const moving = p.state === 'walk';
  const attacking = p.state === 'attack';
  const casting = p.state === 'cast';
  ctx.save();
  // shadow
  const flying = sprite === 'bee' || sprite === 'bat' || sprite === 'wisp' || sprite === 'wraith';
  ctx.fillStyle = 'rgba(20,20,30,0.26)';
  const shw = (sprite === 'wolf' || sprite === 'scorpion' ? 16 : sprite === 'treant' || sprite === 'golem' || sprite === 'yeti' ? 19 : sprite === 'worm' ? 13 : 11) * s;
  ctx.beginPath(); ctx.ellipse(0, 0, shw * (flying ? 0.7 : 1), 3.6 * s * (flying ? 0.7 : 1), 0, 0, Math.PI * 2); ctx.fill();

  if (p.dead > 0) {
    ctx.globalAlpha *= Math.max(0, 1 - p.dead);
    if (sprite === 'jelly') ctx.scale(1 + p.dead * 0.8, Math.max(0.05, 1 - p.dead));
    else { ctx.translate(0, p.dead * 4); ctx.rotate(p.facing * p.dead * 0.6); }
  }
  if (p.spawn < 1) {
    ctx.globalAlpha *= p.spawn;
    ctx.scale(0.6 + 0.4 * p.spawn, 0.6 + 0.4 * p.spawn);
  }
  ctx.scale(p.facing * s, s);
  if (p.hurt > 0) ctx.translate(-p.hurt * 3, 0);

  switch (sprite) {
    case 'jelly': {
      const hop = moving ? (t / 520) % 1 : 0;
      const air = moving ? Math.sin(hop * Math.PI) : 0;
      let sx = 1, sy = 1;
      if (moving) { if (hop < 0.12) { sx = 1.18; sy = 0.82; } else { sx = 1 - air * 0.08; sy = 1 + air * 0.12; } }
      else { const w = Math.sin(t / 260) * 0.04; sx = 1 + w; sy = 1 - w; }
      if (attacking) { const a = Math.min(1, t / 380); const k = Math.sin(a * Math.PI); sx = 1 - k * 0.2; sy = 1 + k * 0.25; ctx.translate(k * 8, -k * 6); }
      if (casting) { sx = 1.15 + Math.sin(t / 60) * 0.05; sy = 0.85; }
      ctx.translate(0, -air * 14);
      ctx.scale(sx, sy);
      drawJellyBody(ctx, pal, 1, t);
      if (pal[0] === '#8fd46a') {
        // moss tufts
        ctx.fillStyle = '#3e7a2e';
        for (const [x, y] of [[-6, -17], [2, -19.5], [8, -15]]) { ctx.beginPath(); ctx.ellipse(x, y, 3, 1.6, 0.3, 0, Math.PI * 2); ctx.fill(); }
      }
      if (pal[0] === '#ffd36a' || crown) {
        ctx.beginPath(); ctx.moveTo(-6, -18); ctx.lineTo(-7, -26); ctx.lineTo(-3, -22); ctx.lineTo(0, -28); ctx.lineTo(3, -22); ctx.lineTo(7, -26); ctx.lineTo(6, -18); ctx.closePath();
        blob(ctx, '#ffd84a', '#8a5a10', 0.9);
        ctx.fillStyle = '#ff4060'; ctx.beginPath(); ctx.arc(0, -21, 1.2, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'bunny': {
      const hop = moving ? (t / 380) % 1 : 0;
      const air = moving ? Math.sin(hop * Math.PI) : 0;
      ctx.translate(0, -air * 9);
      if (attacking) { const k = Math.sin(Math.min(1, t / 360) * Math.PI); ctx.translate(k * 9, -k * 3); ctx.rotate(k * 0.2); }
      const [main, dark, inner] = pal;
      // ears
      const ew = Math.sin(t / 300) * 0.1;
      for (const [x, r] of [[-3, -0.35 + ew], [3, -0.05 - ew]] as const) {
        ctx.save(); ctx.translate(x, -20); ctx.rotate(r);
        ctx.beginPath(); ctx.ellipse(0, -8, 3.2, 8.5, 0, 0, Math.PI * 2); blob(ctx, main, shade(dark, -0.35), 1);
        ctx.fillStyle = inner; ctx.beginPath(); ctx.ellipse(0, -7.5, 1.5, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      // body
      ctx.beginPath(); ctx.ellipse(0, -9.5, 11, 9.5, 0, 0, Math.PI * 2);
      const g = ctx.createLinearGradient(0, -19, 0, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, dark);
      blob(ctx, g, shade(dark, -0.4), 1.1);
      // tail
      ctx.beginPath(); ctx.arc(-10.5, -7, 3, 0, Math.PI * 2); blob(ctx, '#ffffff', shade(dark, -0.3), 0.9);
      // horn
      ctx.beginPath(); ctx.moveTo(4, -17); ctx.lineTo(7, -25); ctx.lineTo(8, -16.5); ctx.closePath(); blob(ctx, '#f4e0b0', '#8a6a3a', 0.9);
      eye(ctx, 6, -11, 1.8);
      ctx.fillStyle = '#ff8aa0'; ctx.beginPath(); ctx.arc(10.2, -8.4, 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,140,160,0.35)'; ctx.beginPath(); ctx.ellipse(7, -7, 2, 1.1, 0, 0, Math.PI * 2); ctx.fill();
      // feet
      ctx.fillStyle = main; ctx.strokeStyle = shade(dark, -0.4); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(-4, -1.2, 4, 2, 0, 0, Math.PI * 2); ctx.ellipse(5, -1.2, 3.4, 1.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      break;
    }
    case 'worm': {
      const [main, dark, belly] = pal;
      const segs = 5;
      const ph = t / (moving ? 140 : 400);
      for (let i = segs - 1; i >= 0; i--) {
        const x = -i * 5.6 + 6;
        const y = -6 - Math.max(0, Math.sin(ph - i * 0.9)) * (moving ? 4 : 1.2);
        const r = i === 0 ? 7 : 6 - i * 0.35;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, r);
        g.addColorStop(0, belly); g.addColorStop(0.5, main); g.addColorStop(1, dark);
        blob(ctx, g, shade(dark, -0.4), 1);
        if (i > 0) { ctx.fillStyle = shade(dark, -0.15); ctx.beginPath(); ctx.arc(x, y + r - 1, 1.2, 0, Math.PI * 2); ctx.fill(); }
      }
      const hy = -6 - Math.max(0, Math.sin(ph)) * (moving ? 4 : 1.2) + (attacking ? -Math.sin(Math.min(1, t / 380) * Math.PI) * 6 : 0);
      eye(ctx, 9, hy - 1.5, 1.5);
      ctx.strokeStyle = shade(dark, -0.4); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(6, hy - 6); ctx.quadraticCurveTo(7, hy - 11, 10, hy - 12); ctx.moveTo(9, hy - 6); ctx.quadraticCurveTo(12, hy - 10, 14, hy - 10); ctx.stroke();
      ctx.fillStyle = '#ff8a5a'; ctx.beginPath(); ctx.arc(10, hy - 12, 1.2, 0, Math.PI * 2); ctx.arc(14, hy - 10, 1.2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'mushroom': {
      const [cap, stem, spot] = pal;
      const step = moving ? Math.sin(t / 110) : 0;
      if (attacking) { const k = Math.sin(Math.min(1, t / 380) * Math.PI); ctx.translate(k * 6, 0); ctx.rotate(k * 0.25); }
      ctx.rotate(step * 0.08);
      // feet
      ctx.fillStyle = '#c8a888'; ctx.strokeStyle = '#6a4a3a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(-3.6, -1.5 - Math.max(0, step) * 2, 2.8, 1.8, 0, 0, Math.PI * 2); ctx.ellipse(3.6, -1.5 - Math.max(0, -step) * 2, 2.8, 1.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // stem
      ctx.beginPath(); ctx.roundRect(-6.5, -15, 13, 13.5, 4); blob(ctx, stem, shade(stem, -0.45), 1.1);
      eye(ctx, 1, -9, 1.5); eye(ctx, 5, -9, 1.5);
      ctx.strokeStyle = '#6a3a3a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(3, -6.4, 1.4, 0.2, Math.PI - 0.2); ctx.stroke();
      // cap
      ctx.beginPath(); ctx.moveTo(-13, -13); ctx.bezierCurveTo(-13, -30, 13, -30, 13, -13); ctx.quadraticCurveTo(0, -9, -13, -13);
      const g = ctx.createLinearGradient(0, -28, 0, -11); g.addColorStop(0, shade(cap, 0.25)); g.addColorStop(1, shade(cap, -0.2));
      blob(ctx, g, shade(cap, -0.5), 1.2);
      ctx.fillStyle = spot;
      for (const [x, y, r] of [[-6, -20, 2.4], [2, -24, 2.1], [7, -17, 1.8], [-1, -17, 1.3], [-9, -15, 1.2]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'wolf': {
      const [main, dark, light] = pal;
      const run = moving ? t / 90 : 0;
      const breathe = Math.sin(t / 300) * 0.4;
      let lunge = 0;
      if (attacking) lunge = Math.sin(Math.min(1, t / 380) * Math.PI);
      ctx.translate(lunge * 8, -lunge * 3);
      const legs = [[-9, 0], [-5, Math.PI], [6, Math.PI * 0.5], [10, Math.PI * 1.5]];
      ctx.strokeStyle = shade(dark, -0.3); ctx.lineCap = 'round';
      for (const [x, ph] of legs) {
        const sw = moving ? Math.sin(run + ph) * 4 : 0;
        ctx.lineWidth = 4.2; ctx.strokeStyle = shade(dark, -0.4);
        ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x + sw, -1); ctx.stroke();
        ctx.lineWidth = 2.8; ctx.strokeStyle = dark;
        ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x + sw, -1); ctx.stroke();
      }
      // tail
      const tw = Math.sin(t / 140) * (moving ? 0.4 : 0.15);
      ctx.save(); ctx.translate(-14, -15); ctx.rotate(-0.6 + tw);
      ctx.beginPath(); ctx.ellipse(-5, 0, 7, 3.2, 0, 0, Math.PI * 2); blob(ctx, main, shade(dark, -0.4), 1);
      ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(-10, 0, 2.4, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // body
      ctx.beginPath(); ctx.ellipse(0, -14 + breathe, 14.5, 7.5, 0, 0, Math.PI * 2);
      const g = ctx.createLinearGradient(0, -22, 0, -6); g.addColorStop(0, shade(main, 0.15)); g.addColorStop(1, dark);
      blob(ctx, g, shade(dark, -0.45), 1.2);
      ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(3, -9.5, 8, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      // head
      ctx.save(); ctx.translate(13, -19 + breathe); ctx.rotate(attacking ? 0.25 * lunge : 0);
      ctx.beginPath(); ctx.ellipse(0, 0, 7, 6, 0, 0, Math.PI * 2); blob(ctx, main, shade(dark, -0.45), 1.1);
      ctx.beginPath(); ctx.moveTo(4, -2); ctx.quadraticCurveTo(12, -1, 12, 2); ctx.quadraticCurveTo(8, 5, 3, 4); ctx.closePath(); blob(ctx, light, shade(dark, -0.4), 1);
      ctx.fillStyle = '#1e1418'; ctx.beginPath(); ctx.arc(11.6, 1, 1.2, 0, Math.PI * 2); ctx.fill();
      for (const x of [-3, 1.5]) { ctx.beginPath(); ctx.moveTo(x - 2.4, -4); ctx.lineTo(x, -11); ctx.lineTo(x + 2.4, -4); ctx.closePath(); blob(ctx, main, shade(dark, -0.45), 1); }
      ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.ellipse(3.4, -1.6, 1.6, 1.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e1418'; ctx.beginPath(); ctx.arc(3.8, -1.6, 0.7, 0, Math.PI * 2); ctx.fill();
      if (attacking) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(6, 3.6); ctx.lineTo(7, 6); ctx.lineTo(8, 3.8); ctx.fill(); }
      ctx.restore();
      if (pal[0] === '#dfe6f4') {
        // mane for the silver king
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(5 + i * 1.6, -21 + i * 1.6, 4, 2.2, -0.6, 0, Math.PI * 2); ctx.fill(); }
      }
      break;
    }
    case 'bee': {
      const [y1, blk, wing] = pal;
      const hov = Math.sin(t / 160) * 2.4;
      ctx.translate(0, -24 + hov);
      if (attacking) { const k = Math.sin(Math.min(1, t / 380) * Math.PI); ctx.translate(k * 9, k * 6); ctx.rotate(k * 0.5); }
      // wings
      const f = Math.sin(t / 22) * 0.5;
      ctx.save(); ctx.globalAlpha *= 0.75;
      for (const [x, r] of [[-2, -0.6 - f], [2, -0.2 + f]] as const) {
        ctx.save(); ctx.translate(x, -6); ctx.rotate(r);
        ctx.beginPath(); ctx.ellipse(0, -6, 4, 7, 0, 0, Math.PI * 2); blob(ctx, rgba(wing, 0.8), '#a0c0d8', 0.8);
        ctx.restore();
      }
      ctx.restore();
      // body
      ctx.beginPath(); ctx.ellipse(-2, 0, 9, 6.5, 0, 0, Math.PI * 2); blob(ctx, y1, shade(blk, 0.1), 1.1);
      ctx.save(); ctx.clip();
      ctx.fillStyle = blk; for (const x of [-7, -2.4]) ctx.fillRect(x, -8, 2.6, 16);
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(-10.6, -1); ctx.lineTo(-15, 1); ctx.lineTo(-10.4, 2); ctx.closePath(); blob(ctx, '#3a2a1a', '#1a1008', 0.8);
      // head
      ctx.beginPath(); ctx.arc(7.6, -1.6, 5, 0, Math.PI * 2); blob(ctx, blk, '#100804', 1);
      ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(9.6, -2.6, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = blk; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(8, -6); ctx.quadraticCurveTo(9, -10, 12, -10); ctx.stroke();
      break;
    }
    case 'flower': {
      const [petal, leaf, center] = pal;
      const sway = Math.sin(t / 420) * 0.08;
      // leaves at base
      for (const [x, r] of [[-7, -0.9], [7, 0.9], [-3, -0.4], [4, 0.5]] as const) {
        ctx.save(); ctx.translate(x * 0.4, -1); ctx.rotate(r);
        ctx.beginPath(); ctx.ellipse(0, -6, 3.2, 8, 0, 0, Math.PI * 2); blob(ctx, leaf, shade(leaf, -0.45), 1);
        ctx.restore();
      }
      // vines when attacking
      if (attacking) {
        const k = Math.sin(Math.min(1, t / 380) * Math.PI);
        ctx.strokeStyle = shade(leaf, -0.2); ctx.lineWidth = 2.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(3, -10); ctx.quadraticCurveTo(18 * k + 6, -24, 34 * k + 6, -8 + 4 * k); ctx.stroke();
      }
      ctx.save(); ctx.rotate(sway);
      ctx.strokeStyle = shade(leaf, -0.3); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -4); ctx.quadraticCurveTo(-2, -16, 0, -26); ctx.stroke();
      ctx.translate(0, -29);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + t / 2000;
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * 7, Math.sin(a) * 6, 5, 3.6, a, 0, Math.PI * 2); blob(ctx, petal, shade(petal, -0.4), 1);
      }
      ctx.beginPath(); ctx.arc(0, 0, 6.2, 0, Math.PI * 2); blob(ctx, center, shade(center, -0.45), 1);
      eye(ctx, -1.8, -1, 1.2); eye(ctx, 2.6, -1, 1.2);
      ctx.strokeStyle = '#6a3a1a'; ctx.lineWidth = 0.9; ctx.beginPath();
      if (attacking) ctx.ellipse(0.4, 2.6, 1.6, 1.2, 0, 0, Math.PI * 2); else ctx.arc(0.4, 1.6, 1.4, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'skeleton':
    case 'skeleton_archer':
    case 'skeleton_knight':
    case 'zombie': {
      const zombie = sprite === 'zombie';
      const knight = sprite === 'skeleton_knight';
      const bone = zombie ? pal[0] : pal[0];
      const line = shade(zombie ? pal[1] : '#8a8270', -0.35);
      const walk = moving ? t / (zombie ? 220 : 130) : 0;
      const bob = moving ? -Math.abs(Math.sin(walk)) * 1.5 : Math.sin(t / 400) * 0.6;
      ctx.translate(0, bob);
      if (zombie) ctx.rotate(0.12 + Math.sin(t / 500) * 0.05);
      let swing = 0;
      if (attacking) swing = Math.sin(Math.min(1, t / 380) * Math.PI);
      // legs
      ctx.lineCap = 'round';
      for (const ph of [0, Math.PI]) {
        const sw = moving ? Math.sin(walk + ph) * 3 : 0;
        ctx.strokeStyle = line; ctx.lineWidth = zombie ? 4.6 : 3.2;
        ctx.beginPath(); ctx.moveTo(ph ? 2 : -2, -14); ctx.lineTo((ph ? 2 : -2) + sw, -1); ctx.stroke();
        ctx.strokeStyle = zombie ? pal[2] : bone; ctx.lineWidth = zombie ? 3.4 : 2;
        ctx.beginPath(); ctx.moveTo(ph ? 2 : -2, -14); ctx.lineTo((ph ? 2 : -2) + sw, -1); ctx.stroke();
      }
      // cape for knight
      if (knight) {
        ctx.beginPath(); ctx.moveTo(-5, -30); ctx.quadraticCurveTo(-13 - Math.sin(t / 300) * 2, -16, -11, -2); ctx.lineTo(1, -4); ctx.lineTo(4, -30); ctx.closePath();
        blob(ctx, pal[2], shade(pal[2], -0.5), 1);
      }
      // torso
      if (zombie) {
        ctx.beginPath(); ctx.roundRect(-6, -30, 12, 17, 3); blob(ctx, pal[2], shade(pal[2], -0.5), 1.1);
        ctx.strokeStyle = shade(pal[2], -0.3); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-5, -20); ctx.lineTo(-1, -17); ctx.lineTo(3, -22); ctx.stroke();
      } else if (knight) {
        ctx.beginPath(); ctx.roundRect(-7, -32, 14, 18, 4); blob(ctx, pal[1], shade(pal[1], -0.5), 1.2);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4, -29); ctx.lineTo(3, -29); ctx.stroke();
      } else {
        ctx.strokeStyle = line; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -14); ctx.stroke();
        ctx.strokeStyle = bone; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -14); ctx.stroke();
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = line; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(0, -27 + i * 4, 6 - i * 0.6, 1.6, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = bone; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(0, -27 + i * 4, 6 - i * 0.6, 1.6, 0, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.beginPath(); ctx.ellipse(0, -14, 5, 2.4, 0, 0, Math.PI * 2); blob(ctx, bone, line, 1);
      }
      // head
      ctx.save(); ctx.translate(1, -38);
      if (zombie) {
        ctx.beginPath(); ctx.ellipse(0, 0, 8, 8.4, 0, 0, Math.PI * 2); blob(ctx, pal[0], shade(pal[1], -0.4), 1.1);
        ctx.fillStyle = '#fffbe0'; ctx.beginPath(); ctx.arc(4, -1, 2.2, 0, Math.PI * 2); ctx.arc(-1, -1, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c03030'; ctx.beginPath(); ctx.arc(4.4, -1, 0.9, 0, Math.PI * 2); ctx.arc(-0.8, -1, 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(6, 3.4); ctx.stroke();
        ctx.fillStyle = '#e8e0c0'; ctx.beginPath(); ctx.ellipse(-3, -5, 4.6, 2.6, 0.3, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.ellipse(0, 0, 7.6, 7.8, 0, 0, Math.PI * 2); blob(ctx, bone, line, 1.1);
        ctx.beginPath(); ctx.roundRect(-2, 4, 9, 4, 1.5); blob(ctx, bone, line, 1);
        ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.ellipse(4, 0, 2.4, 2.8, 0, 0, Math.PI * 2); ctx.ellipse(-1.6, 0, 2, 2.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = knight ? '#ff3a4a' : '#ffb040';
        ctx.beginPath(); ctx.arc(4, 0.4, 0.9, 0, Math.PI * 2); ctx.arc(-1.4, 0.4, 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = line; ctx.lineWidth = 0.6; for (const x of [0, 2, 4]) { ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, 8); ctx.stroke(); }
        if (knight) {
          ctx.beginPath(); ctx.moveTo(-8.5, 1); ctx.bezierCurveTo(-9, -12, 9, -12, 8.5, 1); ctx.lineTo(6, -2); ctx.lineTo(-6, -2); ctx.closePath(); blob(ctx, pal[1], shade(pal[1], -0.5), 1.1);
          ctx.fillStyle = pal[2]; ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(-10, -18, -16, -9 + Math.sin(t / 250)); ctx.quadraticCurveTo(-8, -12, 0, -6); ctx.fill();
        }
      }
      ctx.restore();
      // arms + weapon
      const shoulderY = -28;
      const armAng = zombie ? (moving ? 80 + Math.sin(walk) * 6 : 75) : attacking ? -150 + swing * 230 : 25 + (moving ? Math.sin(walk) * 15 : 0);
      const ax = 3 + Math.sin(armAng * Math.PI / 180) * 10, ay = shoulderY + Math.cos(armAng * Math.PI / 180) * 10;
      ctx.strokeStyle = line; ctx.lineWidth = zombie ? 4.4 : 3; ctx.beginPath(); ctx.moveTo(3, shoulderY); ctx.lineTo(ax, ay); ctx.stroke();
      ctx.strokeStyle = zombie ? pal[0] : bone; ctx.lineWidth = zombie ? 3.2 : 1.8; ctx.beginPath(); ctx.moveTo(3, shoulderY); ctx.lineTo(ax, ay); ctx.stroke();
      if (!zombie) {
        ctx.save(); ctx.translate(ax, ay);
        if (sprite === 'skeleton_archer') {
          ctx.rotate(0);
          ctx.strokeStyle = '#4a3a20'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(6, 0, 0, 12); ctx.stroke();
          ctx.strokeStyle = '#d0d0c0'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(attacking ? -6 * swing : 0, 0); ctx.lineTo(0, 12); ctx.stroke();
        } else {
          const ang = attacking ? 205 - swing * 130 : 160;
          ctx.rotate(-ang * Math.PI / 180);
          const L = knight ? 26 : 16;
          ctx.fillStyle = '#5a3e2a'; ctx.fillRect(-1.2, -4, 2.4, 5);
          ctx.fillStyle = '#8a7a50'; ctx.fillRect(-3.5, 0.5, 7, 1.6);
          ctx.beginPath(); ctx.moveTo(-2.2, 2); ctx.lineTo(2.2, 2); ctx.lineTo(2, L); ctx.lineTo(0, L + 3); ctx.lineTo(-2, L); ctx.closePath();
          blob(ctx, knight ? '#c8d0e0' : '#a89878', '#3a3020', 0.9);
        }
        ctx.restore();
      }
      if (zombie) { ctx.fillStyle = pal[0]; ctx.beginPath(); ctx.arc(ax, ay, 2.4, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'bat': {
      const [body, dark, eyeC] = pal;
      const hov = Math.sin(t / 180) * 3;
      ctx.translate(0, -28 + hov);
      if (attacking) { const k = Math.sin(Math.min(1, t / 380) * Math.PI); ctx.translate(k * 10, k * 10); }
      const f = Math.sin(t / 55);
      for (const s2 of [-1, 1]) {
        ctx.save(); ctx.scale(s2, 1); ctx.rotate(f * 0.5);
        ctx.beginPath(); ctx.moveTo(2, -2); ctx.quadraticCurveTo(10, -14, 20, -8); ctx.quadraticCurveTo(17, -3, 18, 2); ctx.quadraticCurveTo(13, -1, 11, 3); ctx.quadraticCurveTo(7, 0, 2, 3); ctx.closePath();
        blob(ctx, dark, '#140a1a', 1);
        ctx.restore();
      }
      ctx.beginPath(); ctx.ellipse(0, 0, 6.4, 7, 0, 0, Math.PI * 2); blob(ctx, body, '#140a1a', 1.1);
      for (const x of [-3.4, 3.4]) { ctx.beginPath(); ctx.moveTo(x - 2, -5); ctx.lineTo(x, -11); ctx.lineTo(x + 2, -5); ctx.closePath(); blob(ctx, body, '#140a1a', 0.9); }
      ctx.fillStyle = eyeC; ctx.beginPath(); ctx.arc(-2.2, -1, 1.5, 0, Math.PI * 2); ctx.arc(2.8, -1, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-1.4, 3); ctx.lineTo(-0.8, 5.4); ctx.lineTo(-0.2, 3); ctx.moveTo(1, 3); ctx.lineTo(1.6, 5.4); ctx.lineTo(2.2, 3); ctx.fill();
      break;
    }
    case 'wisp': {
      const [c1, c2, core] = pal;
      const hov = Math.sin(t / 300) * 3;
      ctx.translate(0, -26 + hov);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
      g.addColorStop(0, rgba(c1, 0.55)); g.addColorStop(1, rgba(c2, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(-9, 2);
      ctx.bezierCurveTo(-10, -12, -2, -16, 2 + Math.sin(t / 120) * 2, -20);
      ctx.bezierCurveTo(4, -12, 10, -10, 9, 2);
      for (let i = 0; i < 4; i++) {
        const x = 9 - (i + 1) * 4.5;
        ctx.quadraticCurveTo(x + 2.2, 8 + Math.sin(t / 150 + i) * 2, x, 3);
      }
      ctx.closePath();
      ctx.globalAlpha *= 0.88;
      blob(ctx, c1, shade(c2, -0.2), 1);
      ctx.globalAlpha /= 0.88;
      ctx.fillStyle = core; ctx.beginPath(); ctx.ellipse(1, -4, 3.6, 4.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a3040'; ctx.beginPath(); ctx.ellipse(-1.6, -4, 1.1, 1.8, 0, 0, Math.PI * 2); ctx.ellipse(3.4, -4, 1.1, 1.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(1, 0, 1.6, attacking ? 1.8 : 0.8, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'treant': {
      const [bark, leaf, glow] = pal;
      const sway = Math.sin(t / 700) * 0.04;
      const stomp = moving ? Math.abs(Math.sin(t / 260)) * 2 : 0;
      ctx.translate(0, -stomp);
      // roots / feet
      ctx.fillStyle = shade(bark, -0.2); ctx.strokeStyle = shade(bark, -0.55); ctx.lineWidth = 1.2;
      for (const x of [-9, -2, 6]) { ctx.beginPath(); ctx.ellipse(x, -2, 5, 3, x * 0.03, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      ctx.rotate(sway);
      // trunk
      ctx.beginPath(); ctx.moveTo(-12, -2); ctx.quadraticCurveTo(-14, -26, -9, -38); ctx.lineTo(9, -38); ctx.quadraticCurveTo(14, -26, 12, -2); ctx.closePath();
      const g = ctx.createLinearGradient(-12, 0, 12, 0); g.addColorStop(0, shade(bark, -0.3)); g.addColorStop(0.6, bark); g.addColorStop(1, shade(bark, -0.15));
      blob(ctx, g, shade(bark, -0.6), 1.3);
      ctx.strokeStyle = shade(bark, -0.4); ctx.lineWidth = 1;
      for (const x of [-7, -2, 4, 8]) { ctx.beginPath(); ctx.moveTo(x, -4); ctx.quadraticCurveTo(x + 2, -18, x - 1, -34); ctx.stroke(); }
      // face
      ctx.fillStyle = '#1a1008'; ctx.beginPath(); ctx.ellipse(-3, -24, 2.4, 3, 0, 0, Math.PI * 2); ctx.ellipse(5, -24, 2.4, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(-3, -24, 1.1, 0, Math.PI * 2); ctx.arc(5, -24, 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1008'; ctx.beginPath(); ctx.ellipse(1, -15, 4, casting || attacking ? 3.4 : 1.6, 0, 0, Math.PI * 2); ctx.fill();
      // branch arms
      const armA = attacking ? Math.sin(Math.min(1, t / 380) * Math.PI) : 0;
      ctx.strokeStyle = shade(bark, -0.5); ctx.lineWidth = 4.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(9, -28); ctx.quadraticCurveTo(18, -26 + armA * 10, 20 + armA * 6, -16 + armA * 12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-9, -28); ctx.quadraticCurveTo(-18, -30, -20, -22); ctx.stroke();
      ctx.strokeStyle = bark; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(9, -28); ctx.quadraticCurveTo(18, -26 + armA * 10, 20 + armA * 6, -16 + armA * 12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-9, -28); ctx.quadraticCurveTo(-18, -30, -20, -22); ctx.stroke();
      // canopy
      for (const [x, y, r] of [[-10, -42, 10], [9, -43, 10], [0, -50, 12], [-3, -40, 9], [6, -38, 8]]) {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        const lg = ctx.createRadialGradient(x - 3, y - 4, 1, x, y, r);
        lg.addColorStop(0, shade(leaf, 0.3)); lg.addColorStop(1, shade(leaf, -0.25));
        blob(ctx, lg, shade(leaf, -0.5), 1);
      }
      ctx.fillStyle = rgba(glow, 0.8);
      for (let i = 0; i < 5; i++) { const a = t / 900 + i * 1.3; ctx.beginPath(); ctx.arc(Math.cos(a) * 12, -46 + Math.sin(a * 1.3) * 6, 1.1, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'scorpion': {
      const [main, dark, light] = pal;
      const walk = moving ? t / 70 : 0;
      const k = attacking ? Math.sin(Math.min(1, t / 380) * Math.PI) : 0;
      // legs
      ctx.strokeStyle = shade(dark, -0.2); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const x = -7 + i * 4.4, sw = Math.sin(walk + i * 1.7) * 2;
        ctx.beginPath(); ctx.moveTo(x, -6); ctx.lineTo(x - 3 + sw, -1); ctx.lineTo(x - 4 + sw, 0); ctx.stroke();
      }
      // tail arching over the back
      ctx.lineWidth = 3.6; ctx.strokeStyle = shade(dark, -0.3);
      const tx = -10, ty = -9;
      const seg = [[tx, ty], [tx - 4, ty - 7], [tx - 2, ty - 15], [tx + 5 + k * 10, ty - 18 + k * 8]];
      ctx.beginPath(); ctx.moveTo(seg[0][0], seg[0][1]); for (const [x, y] of seg.slice(1)) ctx.lineTo(x, y); ctx.stroke();
      ctx.lineWidth = 2.4; ctx.strokeStyle = main;
      ctx.beginPath(); ctx.moveTo(seg[0][0], seg[0][1]); for (const [x, y] of seg.slice(1)) ctx.lineTo(x, y); ctx.stroke();
      for (const [x, y] of seg.slice(1)) { ctx.beginPath(); ctx.arc(x, y, 2.1, 0, Math.PI * 2); blob(ctx, main, shade(dark, -0.4), 0.8); }
      const [sx, sy] = seg[3];
      ctx.beginPath(); ctx.moveTo(sx, sy - 2); ctx.quadraticCurveTo(sx + 6, sy - 1, sx + 5, sy + 4); ctx.lineTo(sx + 1, sy + 1); ctx.closePath(); blob(ctx, light, shade(dark, -0.4), 0.8);
      // body
      ctx.beginPath(); ctx.ellipse(-1, -7, 10, 5, 0, 0, Math.PI * 2);
      const g = ctx.createLinearGradient(0, -12, 0, -2); g.addColorStop(0, shade(main, 0.25)); g.addColorStop(1, dark);
      blob(ctx, g, shade(dark, -0.45), 1.1);
      ctx.strokeStyle = shade(dark, -0.2); ctx.lineWidth = 0.8;
      for (const x of [-6, -2, 2]) { ctx.beginPath(); ctx.moveTo(x, -11.5); ctx.lineTo(x + 1, -2.5); ctx.stroke(); }
      // claws
      for (const [dy, ph] of [[-9, 0], [-5, 1]] as const) {
        const reach = 6 + (attacking ? k * 6 : Math.sin(t / 300 + ph) * 1);
        ctx.strokeStyle = shade(dark, -0.3); ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(7, dy); ctx.lineTo(7 + reach, dy - 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(10 + reach, dy - 2.6, 3.6, 2.4, 0.2, 0, Math.PI * 2); blob(ctx, main, shade(dark, -0.45), 0.9);
        ctx.fillStyle = shade(dark, -0.3); ctx.beginPath(); ctx.moveTo(11 + reach, dy - 2.6); ctx.lineTo(14.4 + reach, dy - 1); ctx.lineTo(11 + reach, dy - 1); ctx.fill();
      }
      eye(ctx, 6.4, -9.6, 1.1); eye(ctx, 8.4, -9.4, 1);
      break;
    }
    case 'golem': {
      const [main, dark, glow] = pal;
      const stomp = moving ? Math.abs(Math.sin(t / 240)) * 2 : 0;
      const k = attacking ? Math.sin(Math.min(1, t / 380) * Math.PI) : 0;
      ctx.translate(0, -stomp);
      const rock = (x: number, y: number, w: number, h: number, r = 3) => {
        ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
        const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, shade(main, 0.25)); g.addColorStop(1, shade(dark, -0.1));
        blob(ctx, g, shade(dark, -0.5), 1.1);
      };
      rock(-11, -14, 9, 13, 3); rock(2, -14, 9, 13, 3);
      rock(-14, -38, 28, 26, 6);
      ctx.strokeStyle = shade(dark, -0.3); ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-8, -34); ctx.lineTo(-3, -28); ctx.lineTo(-6, -20); ctx.moveTo(6, -36); ctx.lineTo(9, -26); ctx.stroke();
      // head
      rock(-7, -48, 16, 12, 4);
      ctx.fillStyle = rgba(glow.startsWith('#') ? glow : '#ffe0a0', 0.95);
      ctx.beginPath(); ctx.ellipse(-1.6, -42, 1.8, 1.4, 0, 0, Math.PI * 2); ctx.ellipse(4.6, -42, 1.8, 1.4, 0, 0, Math.PI * 2); ctx.fill();
      // glowing core
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const cg = ctx.createRadialGradient(1, -26, 0, 1, -26, 7); cg.addColorStop(0, rgba(glow.startsWith('#') ? glow : '#ffe0a0', 0.9)); cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg; ctx.fillRect(-6, -33, 14, 14); ctx.restore();
      // fists
      const fy = -24 + k * 10;
      rock(-21, fy - 6 - (attacking ? 0 : Math.sin(t / 400)), 9, 10, 3);
      rock(13 + k * 6, fy - 8 - k * 6, 10, 11, 3);
      break;
    }
    case 'yeti': {
      const [fur, shadowC, face] = pal;
      const walk = moving ? t / 160 : 0;
      const bob = moving ? -Math.abs(Math.sin(walk)) * 2 : Math.sin(t / 500) * 0.8;
      const k = attacking ? Math.sin(Math.min(1, t / 380) * Math.PI) : 0;
      ctx.translate(0, bob);
      // legs
      for (const [x, ph] of [[-6, 0], [5, Math.PI]] as const) {
        const sw = moving ? Math.sin(walk + ph) * 2.5 : 0;
        ctx.beginPath(); ctx.ellipse(x + sw, -6, 5, 7, 0, 0, Math.PI * 2); blob(ctx, fur, shade(shadowC, -0.4), 1);
      }
      // body
      ctx.beginPath(); ctx.ellipse(0, -24, 15, 17, 0, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(-4, -30, 2, 0, -24, 18); g.addColorStop(0, '#ffffff'); g.addColorStop(1, shadowC);
      blob(ctx, g, shade(shadowC, -0.45), 1.2);
      // fur tufts
      ctx.fillStyle = '#ffffff';
      for (const [x, y] of [[-10, -36], [-4, -40], [3, -40], [9, -36], [-13, -24], [13, -26]]) { ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill(); }
      // face
      ctx.beginPath(); ctx.ellipse(4, -30, 7, 6, 0, 0, Math.PI * 2); blob(ctx, face, shade(face, -0.45), 1);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(1.6, -32, 1.6, 0, Math.PI * 2); ctx.arc(6.6, -32, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10141e'; ctx.beginPath(); ctx.arc(2, -31.8, 0.8, 0, Math.PI * 2); ctx.arc(7, -31.8, 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10141e'; ctx.beginPath(); ctx.ellipse(4.4, -27, 2.8, attacking ? 2.2 : 1, 0, 0, Math.PI * 2); ctx.fill();
      if (attacking) { ctx.fillStyle = '#fff'; ctx.fillRect(2.6, -28.2, 1, 1.4); ctx.fillRect(5.4, -28.2, 1, 1.4); }
      // arms
      const ang = attacking ? -0.8 + k * 2.2 : 0.3 + Math.sin(t / 500) * 0.1;
      ctx.save(); ctx.translate(11, -30); ctx.rotate(ang);
      ctx.beginPath(); ctx.ellipse(0, 9, 4.6, 10, 0, 0, Math.PI * 2); blob(ctx, fur, shade(shadowC, -0.4), 1);
      ctx.restore();
      ctx.save(); ctx.translate(-12, -30); ctx.rotate(0.25);
      ctx.beginPath(); ctx.ellipse(0, 9, 4.4, 9.6, 0, 0, Math.PI * 2); blob(ctx, fur, shade(shadowC, -0.4), 1);
      ctx.restore();
      if (pal[0] === '#ffffff') {
        // the lord wears an ice crown
        ctx.fillStyle = '#bfefff'; ctx.strokeStyle = '#4a8ac0'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(-6, -39); ctx.lineTo(-5, -47); ctx.lineTo(-1, -42); ctx.lineTo(2, -49); ctx.lineTo(5, -42); ctx.lineTo(9, -47); ctx.lineTo(10, -39); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      break;
    }
    case 'wraith': {
      const [robe, aura, eyes] = pal;
      const hov = Math.sin(t / 420) * 3;
      ctx.translate(0, -30 + hov);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, -6, 4, 0, -6, 34);
      g.addColorStop(0, rgba(aura, 0.45)); g.addColorStop(1, rgba(aura, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -6, 34, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // robe
      ctx.beginPath();
      ctx.moveTo(-8, -22);
      ctx.bezierCurveTo(-14, -6, -16, 10, -14, 22);
      for (let i = 0; i < 5; i++) ctx.quadraticCurveTo(-11 + i * 6, 16 + Math.sin(t / 140 + i) * 4, -8 + i * 6, 22);
      ctx.bezierCurveTo(14, 8, 12, -8, 9, -22);
      ctx.closePath();
      const rg = ctx.createLinearGradient(0, -26, 0, 24); rg.addColorStop(0, shade(robe, 0.15)); rg.addColorStop(1, shade(robe, -0.5));
      blob(ctx, rg, '#0a0414', 1.2);
      // hood
      ctx.beginPath(); ctx.moveTo(-10, -18); ctx.bezierCurveTo(-12, -34, 2, -40, 10, -30); ctx.bezierCurveTo(13, -24, 11, -16, 8, -14); ctx.quadraticCurveTo(0, -12, -10, -18);
      blob(ctx, robe, '#0a0414', 1.2);
      ctx.fillStyle = '#05020a'; ctx.beginPath(); ctx.ellipse(2.4, -22, 6, 6.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = eyes; ctx.beginPath(); ctx.ellipse(0.4, -23, 1.4, 1, 0, 0, Math.PI * 2); ctx.ellipse(5, -23, 1.4, 1, 0, 0, Math.PI * 2); ctx.fill();
      // claws
      const k = attacking || casting ? Math.sin(Math.min(1, t / 380) * Math.PI) : 0;
      ctx.strokeStyle = '#d8d0e8'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      for (const [sx, sy] of [[10, -8], [-10, -6]] as const) {
        const ex = sx + (sx > 0 ? 6 + k * 8 : -5), ey = sy - k * 8;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        for (const d of [-2, 0, 2]) { ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + (sx > 0 ? 3 : -3), ey + d); ctx.stroke(); }
      }
      break;
    }
  }
  ctx.restore();

  if (p.frozen) {
    ctx.save();
    const h = mobHeight(sprite) * s;
    ctx.fillStyle = 'rgba(170,225,255,0.45)';
    ctx.strokeStyle = 'rgba(230,250,255,0.9)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-12 * s, 0); ctx.lineTo(-14 * s, -h * 0.6); ctx.lineTo(-6 * s, -h - 4); ctx.lineTo(8 * s, -h - 2); ctx.lineTo(14 * s, -h * 0.5); ctx.lineTo(11 * s, 0); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.moveTo(-8 * s, -h * 0.7); ctx.lineTo(-3 * s, -h * 0.4); ctx.stroke();
    ctx.restore();
  }
}
