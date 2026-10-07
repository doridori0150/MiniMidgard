// Procedural item / skill icons (cached canvases + data URLs for the DOM UI).
import { ITEMS } from '../game/data/items.ts';
import { SKILLS } from '../game/data/skills.ts';
import { MONSTERS } from '../game/data/monsters.ts';
import { drawWeapon, drawHeadgear } from './hero.ts';
import { drawMob, mobHeight } from './monster.ts';
import { shade } from './color.ts';
import type { WeaponType } from '../game/types.ts';

const SIZE = 32;
const K = 2;
const cache = new Map<string, HTMLCanvasElement>();
const urlCache = new Map<string, string>();

function mk(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = SIZE * K; c.height = SIZE * K;
  const ctx = c.getContext('2d')!;
  ctx.scale(K, K);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  return [c, ctx];
}

function fillLine(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, line: string, w = 1.2) {
  ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = w; ctx.stroke();
}

function vgrad(ctx: CanvasRenderingContext2D, y0: number, y1: number, c: string) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, shade(c, 0.35)); g.addColorStop(1, shade(c, -0.25));
  return g;
}

function drawItemGlyph(ctx: CanvasRenderingContext2D, glyph: string, color: string) {
  const c = color;
  if (glyph.startsWith('hat:')) {
    const look = glyph.slice(4);
    ctx.save();
    // headgear lives around y=-20..-70 in hero space; fit into the icon
    const mid = ['glasses', 'sunglasses', 'eyepatch', 'blush', 'goggles'].includes(look);
    const low = ['pipe', 'mask', 'rose', 'scarf'].includes(look);
    if (mid) { ctx.translate(14, 48); ctx.scale(0.95, 0.95); }
    else if (low) { ctx.translate(12, 42); ctx.scale(0.95, 0.95); }
    else { ctx.translate(16, 16 + 50 * 0.7); ctx.scale(0.7, 0.7); }
    if (mid || low) {
      // ghost head for context
      ctx.fillStyle = 'rgba(255,230,210,0.35)';
      ctx.beginPath(); ctx.ellipse(0.5, -34, 12, 11, 0, 0, Math.PI * 2); ctx.fill();
    }
    drawHeadgear(ctx, look, 0, '#000');
    ctx.restore();
    return;
  }
  if (glyph.startsWith('card:')) {
    drawCardMini(ctx, glyph.slice(5));
    return;
  }
  const W: WeaponType[] = ['dagger', 'sword', 'sword2h', 'staff', 'bow', 'mace', 'axe', 'spear', 'katar'];
  if (W.includes(glyph as WeaponType)) {
    ctx.save();
    ctx.translate(glyph === 'bow' ? 15 : 9, glyph === 'bow' ? 16 : 25);
    if (glyph !== 'bow') ctx.rotate(-Math.PI * 0.75);
    else ctx.rotate(Math.PI / 4);
    const scale = glyph === 'sword2h' ? 0.95 : glyph === 'dagger' ? 1.35 : glyph === 'staff' ? 0.9 : glyph === 'spear' ? 0.66 : glyph === 'katar' ? 1.2 : 1.05;
    ctx.scale(scale, scale);
    if (glyph !== 'bow') ctx.translate(0, -2);
    drawWeapon(ctx, glyph as WeaponType, c === '#cfd6e0' ? undefined : c, 0, 0);
    ctx.restore();
    return;
  }
  switch (glyph) {
    case 'armor': case 'robe': {
      ctx.beginPath();
      ctx.moveTo(9, 6); ctx.lineTo(13, 8); ctx.quadraticCurveTo(16, 10, 19, 8); ctx.lineTo(23, 6); ctx.lineTo(28, 11); ctx.lineTo(24, 15); ctx.lineTo(23, glyph === 'robe' ? 28 : 25);
      ctx.lineTo(9, glyph === 'robe' ? 28 : 25); ctx.lineTo(8, 15); ctx.lineTo(4, 11); ctx.closePath();
      fillLine(ctx, vgrad(ctx, 6, 28, c), shade(c, -0.55));
      ctx.strokeStyle = shade(c, -0.3); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(16, 10); ctx.lineTo(16, glyph === 'robe' ? 27 : 24); ctx.stroke();
      break;
    }
    case 'shield': {
      ctx.beginPath(); ctx.moveTo(16, 4); ctx.quadraticCurveTo(24, 6, 27, 7); ctx.quadraticCurveTo(27, 22, 16, 29); ctx.quadraticCurveTo(5, 22, 5, 7); ctx.quadraticCurveTo(8, 6, 16, 4);
      fillLine(ctx, vgrad(ctx, 4, 29, c), shade(c, -0.55), 1.4);
      ctx.beginPath(); ctx.arc(16, 15, 4, 0, Math.PI * 2); fillLine(ctx, '#d8dee8', '#5a6070');
      break;
    }
    case 'cape': {
      ctx.beginPath(); ctx.moveTo(11, 5); ctx.lineTo(21, 5); ctx.quadraticCurveTo(26, 18, 27, 28); ctx.quadraticCurveTo(16, 25, 5, 28); ctx.quadraticCurveTo(6, 18, 11, 5);
      fillLine(ctx, vgrad(ctx, 5, 28, c), shade(c, -0.55));
      ctx.fillStyle = '#e0c060'; ctx.beginPath(); ctx.arc(16, 7, 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'shoes': {
      ctx.beginPath(); ctx.moveTo(8, 8); ctx.lineTo(15, 8); ctx.lineTo(15, 19); ctx.quadraticCurveTo(26, 19, 27, 24); ctx.lineTo(27, 26); ctx.lineTo(7, 26); ctx.closePath();
      fillLine(ctx, vgrad(ctx, 8, 26, c), shade(c, -0.55));
      ctx.fillStyle = shade(c, -0.45); ctx.fillRect(7, 24, 20, 2);
      break;
    }
    case 'ring': case 'earring': case 'rosary': case 'necklace': case 'brooch': case 'clip': case 'glove': {
      if (glyph === 'clip') {
        ctx.strokeStyle = '#8a90a0'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(12, 26); ctx.lineTo(12, 9); ctx.arc(16, 9, 4, Math.PI, 0); ctx.lineTo(20, 22); ctx.arc(17, 22, 3, 0, Math.PI); ctx.lineTo(14, 12); ctx.stroke();
        ctx.strokeStyle = '#e8ecf4'; ctx.lineWidth = 1; ctx.stroke();
      } else if (glyph === 'glove') {
        ctx.beginPath(); ctx.moveTo(9, 27); ctx.lineTo(9, 14); ctx.lineTo(10, 7); ctx.lineTo(12.5, 7); ctx.lineTo(13, 13); ctx.lineTo(14, 5); ctx.lineTo(16.5, 5); ctx.lineTo(17, 13); ctx.lineTo(18, 6); ctx.lineTo(20.5, 6.5); ctx.lineTo(21, 15); ctx.lineTo(25, 12); ctx.lineTo(26, 15); ctx.lineTo(22, 22); ctx.lineTo(22, 27); ctx.closePath();
        fillLine(ctx, vgrad(ctx, 5, 27, c), shade(c, -0.55));
      } else if (glyph === 'necklace' || glyph === 'rosary') {
        ctx.strokeStyle = glyph === 'rosary' ? '#8a6a3a' : '#d8b050'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(16, 11, 9, 0.2, Math.PI - 0.2); ctx.stroke();
        if (glyph === 'rosary') { ctx.fillStyle = '#e0d0a0'; ctx.fillRect(15, 19, 2, 9); ctx.fillRect(12.5, 21.5, 7, 2); }
        else { ctx.beginPath(); ctx.moveTo(16, 18); ctx.lineTo(20, 22); ctx.lineTo(16, 27); ctx.lineTo(12, 22); ctx.closePath(); fillLine(ctx, c, shade(c, -0.5)); }
      } else {
        ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(16, 19, 8, 6, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(16, 12, 4, 0, Math.PI * 2); fillLine(ctx, c, shade(c, -0.5));
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(15, 11, 1.2, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'arrow': {
      ctx.fillStyle = '#7a4a28'; ctx.beginPath(); ctx.roundRect(8, 10, 10, 18, 2); ctx.fill(); ctx.strokeStyle = '#3a2010'; ctx.lineWidth = 1; ctx.stroke();
      for (const [x, r] of [[11, -0.2], [14, 0], [17, 0.25]] as const) {
        ctx.save(); ctx.translate(x, 11); ctx.rotate(r);
        ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -8); ctx.stroke();
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-2, -7); ctx.lineTo(0, -11); ctx.lineTo(2, -7); ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 'potion': {
      ctx.beginPath(); ctx.moveTo(13, 7); ctx.lineTo(19, 7); ctx.lineTo(19, 12); ctx.quadraticCurveTo(26, 15, 25, 21); ctx.quadraticCurveTo(24, 28, 16, 28); ctx.quadraticCurveTo(8, 28, 7, 21); ctx.quadraticCurveTo(6, 15, 13, 12); ctx.closePath();
      fillLine(ctx, 'rgba(230,240,255,0.5)', '#5a6070');
      ctx.save(); ctx.clip();
      ctx.fillStyle = vgrad(ctx, 15, 28, c); ctx.fillRect(0, 16, 32, 16);
      ctx.restore();
      ctx.fillStyle = '#a07040'; ctx.fillRect(12.5, 4, 7, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(11.5, 19, 1.4, 3, 0.3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'flask': {
      ctx.beginPath(); ctx.moveTo(13, 5); ctx.lineTo(19, 5); ctx.lineTo(19, 13); ctx.lineTo(26, 25); ctx.quadraticCurveTo(27, 28, 23, 28); ctx.lineTo(9, 28); ctx.quadraticCurveTo(5, 28, 6, 25); ctx.lineTo(13, 13); ctx.closePath();
      fillLine(ctx, 'rgba(230,240,255,0.5)', '#5a6070');
      ctx.save(); ctx.clip(); ctx.fillStyle = vgrad(ctx, 17, 28, c); ctx.fillRect(0, 17, 32, 12); ctx.restore();
      ctx.fillStyle = '#a07040'; ctx.fillRect(12, 3, 8, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(12, 23, 1.4, 0, Math.PI * 2); ctx.arc(17, 20.5, 1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffe680'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(24, 7); ctx.lineTo(24, 11); ctx.moveTo(22, 9); ctx.lineTo(26, 9); ctx.stroke();
      break;
    }
    case 'scroll': {
      ctx.beginPath(); ctx.roundRect(8, 6, 16, 21, 2); fillLine(ctx, '#f4e8c8', '#8a6a3a');
      ctx.fillStyle = '#c8a060'; ctx.beginPath(); ctx.ellipse(16, 6, 9, 2.6, 0, 0, Math.PI * 2); ctx.ellipse(16, 27, 9, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(16, 16.5, 5, 0, Math.PI * 2); fillLine(ctx, c, shade(c, -0.5), 1);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(14.5, 15, 1.4, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'apple': {
      ctx.beginPath(); ctx.arc(13, 18, 8, 0, Math.PI * 2); ctx.arc(19, 18, 8, 0, Math.PI * 2); fillLine(ctx, vgrad(ctx, 10, 26, c), shade(c, -0.55));
      ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(16, 11); ctx.lineTo(17, 5); ctx.stroke();
      ctx.fillStyle = '#5aa040'; ctx.beginPath(); ctx.ellipse(21, 7, 4, 2, -0.4, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'meat': {
      ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.arc(7, 24, 3, 0, Math.PI * 2); ctx.arc(5, 21, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f4ecd8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(7, 22); ctx.lineTo(13, 17); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(19, 13, 9, 7, -0.6, 0, Math.PI * 2); fillLine(ctx, vgrad(ctx, 6, 20, c), shade(c, -0.55));
      break;
    }
    case 'honey': case 'royal': {
      ctx.beginPath(); ctx.moveTo(9, 11); ctx.lineTo(23, 11); ctx.lineTo(24, 26); ctx.quadraticCurveTo(16, 29, 8, 26); ctx.closePath();
      fillLine(ctx, vgrad(ctx, 11, 28, c), '#7a5020');
      ctx.fillStyle = '#e8d8b0'; ctx.fillRect(8, 7, 16, 5); ctx.strokeStyle = '#7a5020'; ctx.lineWidth = 1; ctx.strokeRect(8, 7, 16, 5);
      break;
    }
    case 'ore': case 'gem': {
      ctx.beginPath(); ctx.moveTo(16, 4); ctx.lineTo(26, 12); ctx.lineTo(23, 26); ctx.lineTo(9, 26); ctx.lineTo(6, 12); ctx.closePath();
      fillLine(ctx, vgrad(ctx, 4, 26, c), shade(c, -0.6));
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(6, 12); ctx.lineTo(16, 15); ctx.lineTo(26, 12); ctx.moveTo(16, 15); ctx.lineTo(16, 26); ctx.stroke();
      if (glyph === 'gem') { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(12, 11, 1.6, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'jelly': case 'drop': {
      ctx.beginPath(); ctx.moveTo(16, 4); ctx.bezierCurveTo(19, 11, 26, 15, 25, 21); ctx.bezierCurveTo(24, 28, 8, 28, 7, 21); ctx.bezierCurveTo(6, 15, 13, 11, 16, 4);
      fillLine(ctx, vgrad(ctx, 4, 28, c), shade(c, -0.55));
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(12, 18, 2, 3.4, 0.3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'fur': case 'cloth': case 'leather': case 'bandage': case 'batwing': {
      ctx.beginPath();
      if (glyph === 'batwing') { ctx.moveTo(4, 12); ctx.quadraticCurveTo(14, 4, 28, 10); ctx.quadraticCurveTo(24, 16, 26, 22); ctx.quadraticCurveTo(20, 18, 18, 24); ctx.quadraticCurveTo(13, 19, 10, 24); ctx.quadraticCurveTo(8, 17, 4, 12); }
      else if (glyph === 'bandage') { ctx.ellipse(16, 17, 10, 8, 0, 0, Math.PI * 2); }
      else { ctx.moveTo(6, 10); ctx.quadraticCurveTo(16, 4, 26, 9); ctx.quadraticCurveTo(28, 18, 25, 26); ctx.quadraticCurveTo(16, 29, 7, 25); ctx.quadraticCurveTo(4, 17, 6, 10); }
      fillLine(ctx, vgrad(ctx, 5, 28, c), shade(c, -0.5));
      if (glyph === 'bandage') { ctx.beginPath(); ctx.ellipse(16, 17, 4, 3, 0, 0, Math.PI * 2); fillLine(ctx, shade(c, -0.2), shade(c, -0.5)); }
      if (glyph === 'fur') { ctx.strokeStyle = shade(c, -0.25); ctx.lineWidth = 1; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(9 + i * 3.6, 12); ctx.lineTo(10 + i * 3.6, 22); ctx.stroke(); } }
      break;
    }
    case 'horn': case 'stinger': case 'claw': {
      ctx.beginPath(); ctx.moveTo(8, 26); ctx.quadraticCurveTo(14, 14, 26, 5); ctx.quadraticCurveTo(22, 18, 16, 28); ctx.closePath();
      fillLine(ctx, vgrad(ctx, 5, 28, c), shade(c, -0.55));
      break;
    }
    case 'shell': case 'spore': case 'petal': case 'leaf': case 'root': case 'bone': {
      if (glyph === 'bone') {
        ctx.strokeStyle = shade(c, -0.5); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(8, 24); ctx.lineTo(24, 8); ctx.stroke();
        ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.stroke();
        for (const [x, y] of [[6, 22], [10, 26], [22, 6], [26, 10]]) { ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); fillLine(ctx, c, shade(c, -0.5), 1); }
      } else if (glyph === 'root') {
        ctx.strokeStyle = shade(c, -0.4); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(16, 4); ctx.quadraticCurveTo(12, 14, 16, 18); ctx.quadraticCurveTo(20, 24, 12, 28); ctx.moveTo(16, 18); ctx.quadraticCurveTo(22, 20, 25, 27); ctx.stroke();
        ctx.strokeStyle = c; ctx.lineWidth = 1.8; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.ellipse(16, 17, glyph === 'petal' ? 6 : 10, glyph === 'petal' ? 11 : 8, glyph === 'leaf' ? 0.7 : 0.2, 0, Math.PI * 2);
        fillLine(ctx, vgrad(ctx, 6, 28, c), shade(c, -0.5));
        if (glyph === 'spore') { ctx.fillStyle = '#fff4e0'; for (const [x, y] of [[12, 14], [19, 13], [16, 20]]) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill(); } }
        if (glyph === 'shell') { ctx.strokeStyle = shade(c, -0.35); ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(16, 25, 5 + i * 3.5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); } }
      }
      break;
    }
    default: {
      ctx.beginPath(); ctx.arc(16, 16, 9, 0, Math.PI * 2); fillLine(ctx, vgrad(ctx, 7, 25, c), shade(c, -0.5));
    }
  }
}

function drawCardMini(ctx: CanvasRenderingContext2D, mob: string) {
  const m = MONSTERS[mob];
  ctx.save();
  ctx.beginPath(); ctx.roundRect(6, 2, 20, 28, 2.5);
  const boss = !!m?.boss;
  fillLine(ctx, boss ? '#fff4c8' : '#f8f4ea', boss ? '#b08020' : '#9a8a68', 1.2);
  ctx.beginPath(); ctx.rect(8.5, 5, 15, 15);
  ctx.fillStyle = boss ? '#ffe8a0' : '#d8e8f4'; ctx.fill();
  if (m) {
    ctx.save(); ctx.beginPath(); ctx.rect(8.5, 5, 15, 15); ctx.clip();
    const h = mobHeight(m.sprite);
    const sc = 12 / Math.max(18, h);
    ctx.translate(16, 19);
    ctx.scale(sc, sc);
    drawMob(ctx, m.sprite, m.palette, { state: 'idle', t: 300, facing: 1, hurt: 0, frozen: false, spawn: 1, dead: 0 }, 1);
    ctx.restore();
  }
  ctx.fillStyle = boss ? '#c89020' : '#8a7a58';
  ctx.fillRect(9, 22.5, 14, 1.4); ctx.fillRect(9, 25.5, 10, 1.4);
  ctx.restore();
}

/** large card illustration for detail popups */
export function drawCardArt(canvas: HTMLCanvasElement, mob: string) {
  const m = MONSTERS[mob];
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 140, h = canvas.clientHeight || 196;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const boss = !!m?.boss;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, boss ? '#fff2c0' : '#fbf7ee'); g.addColorStop(1, boss ? '#f0d080' : '#e8dcc4');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(1, 1, w - 2, h - 2, 8); ctx.fill();
  ctx.strokeStyle = boss ? '#b08020' : '#9a8a68'; ctx.lineWidth = 2; ctx.stroke();
  const ax = 10, ay = 10, aw = w - 20, ah = h * 0.62;
  const bg = ctx.createRadialGradient(w / 2, ay + ah * 0.55, 4, w / 2, ay + ah * 0.55, aw);
  bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, boss ? '#f0c060' : '#9fc8e8');
  ctx.fillStyle = bg; ctx.fillRect(ax, ay, aw, ah);
  ctx.strokeStyle = boss ? '#c89020' : '#8a7a58'; ctx.lineWidth = 1; ctx.strokeRect(ax, ay, aw, ah);
  if (m) {
    ctx.save(); ctx.beginPath(); ctx.rect(ax, ay, aw, ah); ctx.clip();
    const mh = mobHeight(m.sprite);
    const sc = (ah * 0.7) / Math.max(20, mh);
    ctx.translate(w / 2, ay + ah - 10);
    ctx.scale(sc, sc);
    drawMob(ctx, m.sprite, m.palette, { state: 'idle', t: 500, facing: 1, hurt: 0, frozen: false, spawn: 1, dead: 0 }, 1);
    ctx.restore();
  }
  ctx.fillStyle = '#3a2e20';
  ctx.font = "bold 12px 'Galmuri11', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText(m ? m.name : '?', w / 2, ay + ah + 20);
  ctx.font = "9px 'Galmuri9', sans-serif";
  ctx.fillStyle = '#7a6a50';
  ctx.fillText('CARD', w / 2, h - 12);
}

export function itemIcon(id: string): HTMLCanvasElement | null {
  const hit = cache.get(id);
  if (hit) return hit;
  const d = ITEMS[id];
  if (!d) return null;
  const [c, ctx] = mk();
  drawItemGlyph(ctx, d.icon.glyph, d.icon.color ?? '#c9b08a');
  cache.set(id, c);
  return c;
}

export function itemIconURL(id: string): string {
  const hit = urlCache.get('i' + id);
  if (hit) return hit;
  const c = itemIcon(id);
  const u = c ? c.toDataURL() : '';
  urlCache.set('i' + id, u);
  return u;
}

function drawSkillGlyph(ctx: CanvasRenderingContext2D, glyph: string) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(20,20,40,0.85)';
  ctx.lineWidth = 1.4;
  const path = (f: () => void) => { ctx.beginPath(); f(); ctx.stroke(); ctx.fill(); };
  switch (glyph) {
    case 'book': path(() => { ctx.rect(8, 8, 16, 17); }); ctx.fillStyle = '#8a5a34'; ctx.fillRect(8, 8, 3, 17); break;
    case 'cross': path(() => { ctx.rect(13, 6, 6, 20); }); path(() => { ctx.rect(7, 12, 18, 6); }); break;
    case 'heart': path(() => { ctx.moveTo(16, 26); ctx.bezierCurveTo(4, 17, 6, 7, 16, 11); ctx.bezierCurveTo(26, 7, 28, 17, 16, 26); }); break;
    case 'burst': path(() => { for (let i = 0; i < 16; i++) { const r = i % 2 ? 5 : 12; const a = i / 16 * Math.PI * 2; ctx.lineTo(16 + Math.cos(a) * r, 16 + Math.sin(a) * r); } ctx.closePath(); }); break;
    case 'flame': case 'fireball': path(() => { ctx.moveTo(16, 4); ctx.quadraticCurveTo(26, 14, 23, 22); ctx.quadraticCurveTo(20, 28, 16, 28); ctx.quadraticCurveTo(9, 28, 9, 21); ctx.quadraticCurveTo(9, 15, 14, 12); ctx.quadraticCurveTo(14, 18, 17, 19); ctx.quadraticCurveTo(19, 11, 16, 4); }); break;
    case 'ice': case 'snow': path(() => { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.moveTo(16, 16); ctx.lineTo(16 + Math.cos(a) * 11, 16 + Math.sin(a) * 11); } }); ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.moveTo(16, 16); ctx.lineTo(16 + Math.cos(a) * 10, 16 + Math.sin(a) * 10); } ctx.stroke(); break;
    case 'bolt': case 'storm': path(() => { ctx.moveTo(18, 4); ctx.lineTo(9, 18); ctx.lineTo(15, 18); ctx.lineTo(12, 28); ctx.lineTo(23, 13); ctx.lineTo(17, 13); ctx.closePath(); }); break;
    case 'spirit': path(() => { ctx.arc(16, 14, 8, Math.PI, 0); ctx.lineTo(24, 26); ctx.lineTo(20, 23); ctx.lineTo(16, 26); ctx.lineTo(12, 23); ctx.lineTo(8, 26); ctx.closePath(); }); break;
    case 'shout': path(() => { ctx.rect(14, 5, 5, 15); }); path(() => { ctx.arc(16.5, 25, 2.8, 0, Math.PI * 2); }); break;
    case 'shield': path(() => { ctx.moveTo(16, 5); ctx.lineTo(26, 8); ctx.quadraticCurveTo(26, 21, 16, 28); ctx.quadraticCurveTo(6, 21, 6, 8); ctx.closePath(); }); break;
    case 'drop': path(() => { ctx.moveTo(16, 4); ctx.bezierCurveTo(19, 11, 25, 15, 24, 21); ctx.bezierCurveTo(23, 28, 9, 28, 8, 21); ctx.bezierCurveTo(7, 15, 13, 11, 16, 4); }); break;
    case 'eye': case 'eye2': path(() => { ctx.moveTo(4, 16); ctx.quadraticCurveTo(16, 4, 28, 16); ctx.quadraticCurveTo(16, 28, 4, 16); }); ctx.fillStyle = '#2a2a44'; ctx.beginPath(); ctx.arc(16, 16, 4.4, 0, Math.PI * 2); ctx.fill(); break;
    case 'focus': ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(16, 16, 9, 0, Math.PI * 2); ctx.moveTo(16, 3); ctx.lineTo(16, 10); ctx.moveTo(16, 22); ctx.lineTo(16, 29); ctx.moveTo(3, 16); ctx.lineTo(10, 16); ctx.moveTo(22, 16); ctx.lineTo(29, 16); ctx.stroke(); break;
    case 'arrows': case 'rain': {
      ctx.lineWidth = 2.4; ctx.strokeStyle = '#fff';
      const n = glyph === 'rain' ? 4 : 2;
      for (let i = 0; i < n; i++) { const x = 8 + i * (16 / n) + 2; ctx.beginPath(); if (glyph === 'rain') { ctx.moveTo(x + 4, 5); ctx.lineTo(x - 2, 25); } else { ctx.moveTo(5, 10 + i * 10); ctx.lineTo(25, 10 + i * 10); } ctx.stroke(); }
      break;
    }
    case 'wing': path(() => { ctx.moveTo(7, 24); ctx.bezierCurveTo(8, 10, 20, 4, 27, 6); ctx.quadraticCurveTo(22, 12, 24, 14); ctx.quadraticCurveTo(18, 16, 20, 19); ctx.quadraticCurveTo(13, 20, 7, 24); }); break;
    case 'boot': path(() => { ctx.moveTo(10, 5); ctx.lineTo(17, 5); ctx.lineTo(17, 18); ctx.quadraticCurveTo(26, 18, 27, 25); ctx.lineTo(9, 25); ctx.closePath(); }); break;
    case 'halo': ctx.lineWidth = 3.4; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.ellipse(16, 12, 10, 4, 0, 0, Math.PI * 2); ctx.stroke(); path(() => { ctx.arc(16, 22, 5, 0, Math.PI * 2); }); break;
    case 'sun': path(() => { for (let i = 0; i < 24; i++) { const r = i % 2 ? 7 : 12; const a = i / 24 * Math.PI * 2; ctx.lineTo(16 + Math.cos(a) * r, 16 + Math.sin(a) * r); } ctx.closePath(); }); break;
    case 'mace': path(() => { ctx.arc(20, 11, 6, 0, Math.PI * 2); }); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(17, 14); ctx.lineTo(7, 26); ctx.stroke(); break;
    case 'sword': case 'sword2': case 'dagger2': {
      ctx.save(); ctx.translate(16, 16); ctx.rotate(Math.PI / 4);
      path(() => { ctx.moveTo(-2, -13); ctx.lineTo(2, -13); ctx.lineTo(2, 5); ctx.lineTo(0, 8); ctx.lineTo(-2, 5); ctx.closePath(); });
      ctx.fillStyle = '#e0b850'; ctx.fillRect(-6, 5, 12, 2.4); ctx.fillRect(-1.2, 7, 2.4, 6);
      ctx.restore();
      if (glyph === 'dagger2') { ctx.save(); ctx.translate(16, 16); ctx.rotate(-Math.PI / 4); ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(20,20,40,0.85)'; ctx.beginPath(); ctx.moveTo(-2, -12); ctx.lineTo(2, -12); ctx.lineTo(0, 4); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore(); }
      break;
    }
    case 'spear': {
      ctx.save(); ctx.translate(16, 16); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(20,20,40,0.85)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.rect(-1.2, -4, 2.4, 18); ctx.stroke(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(3.4, -5); ctx.lineTo(-3.4, -5); ctx.closePath(); ctx.stroke(); ctx.fill();
      ctx.restore();
      break;
    }
    case 'bird': path(() => { ctx.moveTo(4, 18); ctx.quadraticCurveTo(10, 8, 16, 14); ctx.quadraticCurveTo(22, 6, 28, 10); ctx.quadraticCurveTo(22, 14, 20, 20); ctx.quadraticCurveTo(16, 24, 12, 20); ctx.quadraticCurveTo(8, 22, 4, 18); }); ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.moveTo(26, 10); ctx.lineTo(30, 11); ctx.lineTo(26, 12.5); ctx.fill(); break;
    case 'hammer': path(() => { ctx.rect(7, 6, 18, 9); }); path(() => { ctx.rect(14, 15, 4, 12); }); break;
    case 'claw': ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; for (const o of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(10 + o, 6); ctx.quadraticCurveTo(18 + o, 14, 14 + o, 27); ctx.stroke(); } break;
    case 'wind': ctx.lineWidth = 2.6; ctx.strokeStyle = '#fff'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(5, 9 + i * 7); ctx.quadraticCurveTo(20, 6 + i * 7, 22, 11 + i * 7); ctx.quadraticCurveTo(24, 16 + i * 7, 19, 15 + i * 7); ctx.stroke(); } break;
    case 'hand': path(() => { ctx.moveTo(9, 27); ctx.lineTo(9, 13); ctx.lineTo(11, 7); ctx.lineTo(13, 13); ctx.lineTo(14, 5); ctx.lineTo(16.5, 13); ctx.lineTo(18, 6); ctx.lineTo(20, 14); ctx.lineTo(25, 12); ctx.lineTo(22, 22); ctx.lineTo(21, 27); ctx.closePath(); }); break;
    case 'poison': path(() => { ctx.arc(16, 18, 9, 0, Math.PI * 2); }); ctx.fillStyle = '#7a3aa0'; for (const [x, y] of [[13, 16], [19, 20], [17, 13]]) { ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); } break;
    case 'sand': ctx.fillStyle = '#fff'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(8 + (i * 7) % 18, 8 + (i * 5) % 18, 1.6 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill(); } break;
    case 'tag': path(() => { ctx.moveTo(6, 16); ctx.lineTo(14, 6); ctx.lineTo(26, 6); ctx.lineTo(26, 26); ctx.lineTo(14, 26); ctx.closePath(); }); ctx.fillStyle = '#4a8a4a'; ctx.beginPath(); ctx.arc(12, 16, 2, 0, Math.PI * 2); ctx.fill(); break;
    case 'coin': case 'coins': path(() => { ctx.ellipse(16, 16, 10, 10, 0, 0, Math.PI * 2); }); ctx.fillStyle = '#c89020'; ctx.font = "bold 12px sans-serif"; ctx.textAlign = 'center'; ctx.fillText('Z', 16, 20.5); break;
    case 'cart': case 'cart2': path(() => { ctx.moveTo(5, 9); ctx.lineTo(27, 9); ctx.lineTo(24, 21); ctx.lineTo(8, 21); ctx.closePath(); }); ctx.fillStyle = '#fff'; for (const x of [11, 21]) { ctx.beginPath(); ctx.arc(x, 25, 3, 0, Math.PI * 2); ctx.stroke(); ctx.fill(); } break;
    default: path(() => { ctx.arc(16, 16, 8, 0, Math.PI * 2); });
  }
}

export function skillIconURL(id: string): string {
  const hit = urlCache.get('s' + id);
  if (hit) return hit;
  const sk = SKILLS[id];
  const [c, ctx] = mk();
  const col = sk?.icon.color ?? '#8090b0';
  ctx.beginPath(); ctx.roundRect(1, 1, 30, 30, 6);
  const g = ctx.createLinearGradient(0, 0, 0, 32);
  g.addColorStop(0, shade(col, 0.1)); g.addColorStop(1, shade(col, -0.45));
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = shade(col, -0.6); ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.roundRect(3, 3, 26, 11, 4); ctx.fill();
  if (sk) drawSkillGlyph(ctx, sk.icon.glyph);
  const u = c.toDataURL();
  urlCache.set('s' + id, u);
  return u;
}
