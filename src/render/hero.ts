// Code-drawn SD (2.5 heads tall) adventurers, layered paper-doll style so every headgear,
// weapon and hair option shows on the character. Origin = feet, facing right (+x).
import type { ClassId, WeaponType } from '../game/types.ts';
import { shade, rgba } from './color.ts';
import { glow as inkGlow } from './ink.ts';
import { HAIR_COLORS, SKIN_TONES } from '../game/state.ts';

export interface HeroLookDraw {
  cls: ClassId;
  gender: 'm' | 'f';
  hair: number;
  hairColor: number;
  skin: number;
  dye: number;
  headTop?: string;
  headMid?: string;
  headLow?: string;
  wtype: WeaponType;
  weaponColor?: string;
  refine: number;
  shield: boolean;
  garment?: string;
  ammoColor?: string;
  /** painted-sprite face features picked in character creation (index into each gender's types) */
  eyes?: number; brows?: number; nose?: number; mouth?: number;
  /** hunters carry a falcon unless it is out hunting */
  noFalcon?: boolean;
}

export function drawFalcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, flying = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const flap = flying ? Math.sin(t / 45) : 0;
  // tail
  ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.moveTo(-3, 2); ctx.lineTo(-7, 6); ctx.lineTo(-4, 6.5); ctx.lineTo(-1, 3); ctx.fill();
  // body
  ctx.beginPath(); ctx.ellipse(0, 0, 4.4, 3.4, -0.3, 0, Math.PI * 2); blob(ctx, '#8a5a32', '#3a2010', 0.8);
  ctx.fillStyle = '#f4ead8'; ctx.beginPath(); ctx.ellipse(1.6, 1, 2.2, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  // wing
  ctx.save(); ctx.translate(-0.6, -0.8); ctx.rotate(flying ? -0.9 + flap * 0.9 : 0.25);
  ctx.beginPath(); ctx.ellipse(-1.6, 0, 4.4, 2, 0, 0, Math.PI * 2); blob(ctx, '#6a4224', '#3a2010', 0.8);
  ctx.restore();
  // head
  ctx.beginPath(); ctx.arc(3.2, -2.6, 2.4, 0, Math.PI * 2); blob(ctx, '#8a5a32', '#3a2010', 0.8);
  ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.moveTo(5.2, -3); ctx.lineTo(7, -2.2); ctx.lineTo(5.2, -1.6); ctx.fill();
  ctx.fillStyle = '#1a1010'; ctx.beginPath(); ctx.arc(3.8, -3, 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export interface Pose {
  state: string;
  t: number;
  dur?: number;
  facing: 1 | -1;
  /** ms since the unit entered this state (loops such as cast keep `t` on the shared clock) */
  since?: number;
  /** a skill being released (its id) and ms since release: sprites with a motion for it play that instead */
  skill?: string;
  skillT?: number;
}

interface Outfit { main: string; second: string; pants: string; shoes: string; trim: string; robe?: boolean; skirt?: boolean }

const OUTFITS: Record<ClassId, Outfit[]> = {
  novice: [
    { main: '#c08a52', second: '#f2ead8', pants: '#7a5a3e', shoes: '#5a3e2a', trim: '#e8c070' },
    { main: '#7aa06a', second: '#f2ead8', pants: '#5a5a4a', shoes: '#4a3a2a', trim: '#e8d890' },
    { main: '#c06a6a', second: '#f4ece0', pants: '#5a4a5a', shoes: '#3e2e2e', trim: '#f0c0a0' },
    { main: '#6a7ac0', second: '#f0f0f0', pants: '#4a4a5a', shoes: '#3a3040', trim: '#c0d0ff' },
  ],
  swordsman: [
    { main: '#5f86c4', second: '#c84a4a', pants: '#56596a', shoes: '#6a4a32', trim: '#d8dde8' },
    { main: '#8a8f9c', second: '#3a6ac0', pants: '#4a4a5a', shoes: '#4a3a2a', trim: '#f0e0a0' },
    { main: '#b84848', second: '#2e2e3a', pants: '#3e3e48', shoes: '#3a2a22', trim: '#e8c060' },
    { main: '#4f9a6a', second: '#e0c060', pants: '#4a5048', shoes: '#4a3a2a', trim: '#f0f0e0' },
  ],
  mage: [
    { main: '#8a5ac8', second: '#f0d070', pants: '#4a3a6a', shoes: '#3a2a4a', trim: '#f4e090', robe: true },
    { main: '#3a5aa8', second: '#e0e8ff', pants: '#2a3a6a', shoes: '#2a2a4a', trim: '#a0c8ff', robe: true },
    { main: '#a84a6a', second: '#ffd0e0', pants: '#5a2a3a', shoes: '#3a1a2a', trim: '#ffb0c8', robe: true },
    { main: '#3a3a4a', second: '#c070ff', pants: '#2a2a32', shoes: '#1a1a22', trim: '#d0a0ff', robe: true },
  ],
  archer: [
    { main: '#5aa05a', second: '#e8d8a8', pants: '#6a5038', shoes: '#5a3e28', trim: '#c8a060' },
    { main: '#c09048', second: '#f0e8d0', pants: '#5a4a3a', shoes: '#4a3424', trim: '#7ab060' },
    { main: '#4a7ab0', second: '#f0f0e0', pants: '#4a4a52', shoes: '#3a3030', trim: '#e0c070' },
    { main: '#b05a7a', second: '#f8e8f0', pants: '#5a3e4a', shoes: '#3e2a32', trim: '#f0d080' },
  ],
  acolyte: [
    { main: '#f4f2ec', second: '#3a6ab0', pants: '#e0dcd0', shoes: '#6a5040', trim: '#e8c050', robe: true },
    { main: '#f4f2ec', second: '#b03a4a', pants: '#e0dcd0', shoes: '#5a3a30', trim: '#e8c050', robe: true },
    { main: '#2e2e3e', second: '#e8c050', pants: '#24242e', shoes: '#1e1e24', trim: '#f0e0a0', robe: true },
    { main: '#e8f0ff', second: '#6aa0d8', pants: '#d0dcf0', shoes: '#4a5a7a', trim: '#ffffff', robe: true },
  ],
  thief: [
    { main: '#4a3e5a', second: '#8a5ab0', pants: '#2e2a36', shoes: '#22202a', trim: '#c0a0e0' },
    { main: '#3a4a3a', second: '#6aa070', pants: '#2a302a', shoes: '#1e221e', trim: '#a0d0a0' },
    { main: '#5a3030', second: '#d06050', pants: '#2e2222', shoes: '#201818', trim: '#f0a090' },
    { main: '#2a2a2a', second: '#d0d0d0', pants: '#1e1e1e', shoes: '#141414', trim: '#ffffff' },
  ],
  merchant: [
    { main: '#e08a3c', second: '#f4ead4', pants: '#6a4a32', shoes: '#4a3424', trim: '#7a5a3a' },
    { main: '#5a8ac0', second: '#f4ead4', pants: '#4a4a5a', shoes: '#3a2e2a', trim: '#e0c070' },
    { main: '#6aa04a', second: '#f4ead4', pants: '#5a4a32', shoes: '#3e3020', trim: '#c09050' },
    { main: '#c04a6a', second: '#f8eaf0', pants: '#5a3a44', shoes: '#3a2430', trim: '#f0c0a0' },
  ],
  knight: [
    { main: '#4a6ab8', second: '#c03a3a', pants: '#4a4a5a', shoes: '#5a4030', trim: '#e0c060' },
    { main: '#8a8f9c', second: '#2a5ab0', pants: '#3e4250', shoes: '#4a3a2a', trim: '#f0e0a0' },
    { main: '#2e2e3e', second: '#c0a040', pants: '#24242e', shoes: '#3a2a22', trim: '#e8c060' },
    { main: '#c8d0e0', second: '#6a3ab0', pants: '#5a6070', shoes: '#4a4a5a', trim: '#ffe080' },
  ],
  wizard: [
    { main: '#3a3a8a', second: '#f0c040', pants: '#2a2a5a', shoes: '#2a2a3a', trim: '#c0a0ff', robe: true },
    { main: '#8a2a4a', second: '#ffd0a0', pants: '#5a1a2a', shoes: '#3a1a2a', trim: '#ffb0c0', robe: true },
    { main: '#1e5a6a', second: '#a0ffe0', pants: '#123a44', shoes: '#10282e', trim: '#80e0ff', robe: true },
    { main: '#2a2a2a', second: '#ff6060', pants: '#1a1a1a', shoes: '#141414', trim: '#ff9090', robe: true },
  ],
  hunter: [
    { main: '#3a7a3a', second: '#c8a070', pants: '#5a4030', shoes: '#4a3020', trim: '#e0d080' },
    { main: '#7a5a3a', second: '#e0d0a0', pants: '#4a3a2a', shoes: '#3a2a1a', trim: '#90c060' },
    { main: '#3a5a8a', second: '#f0e0b0', pants: '#3a3a4a', shoes: '#2a2a30', trim: '#e0c070' },
    { main: '#8a3a3a', second: '#f0d0a0', pants: '#4a2e2e', shoes: '#2e1e1e', trim: '#ffd080' },
  ],
  priest: [
    { main: '#f4f2ec', second: '#a02a3a', pants: '#e0dcd0', shoes: '#6a5040', trim: '#e8c050', robe: true },
    { main: '#f4f2ec', second: '#2a4aa0', pants: '#e0dcd0', shoes: '#4a4a6a', trim: '#e8c050', robe: true },
    { main: '#2a2a3a', second: '#e8c050', pants: '#1e1e28', shoes: '#141418', trim: '#f0e0a0', robe: true },
    { main: '#e8f0ff', second: '#6a3ab0', pants: '#d0dcf0', shoes: '#4a3a6a', trim: '#ffffff', robe: true },
  ],
  assassin: [
    { main: '#3a2a4a', second: '#a02040', pants: '#2a2030', shoes: '#1a1420', trim: '#c0a0e0' },
    { main: '#2a3a2a', second: '#40a060', pants: '#1e2a1e', shoes: '#141c14', trim: '#a0e0b0' },
    { main: '#1e1e1e', second: '#e0e0e0', pants: '#141414', shoes: '#0e0e0e', trim: '#ffffff' },
    { main: '#4a2a2a', second: '#ffb040', pants: '#2e1a1a', shoes: '#1e1010', trim: '#ffd080' },
  ],
  blacksmith: [
    { main: '#6a4a32', second: '#e8d8b8', pants: '#4a3a2a', shoes: '#3a2a1e', trim: '#d08a3a' },
    { main: '#4a5a6a', second: '#f0e0c0', pants: '#3a4048', shoes: '#2a2e34', trim: '#e0a050' },
    { main: '#7a3a2a', second: '#f0d8b0', pants: '#4a2a20', shoes: '#2e1a14', trim: '#ffc060' },
    { main: '#3a3a3a', second: '#ffd080', pants: '#2a2a2a', shoes: '#1a1a1a', trim: '#ffb040' },
  ],
};

export function outfit(cls: ClassId, dye: number): Outfit {
  const list = OUTFITS[cls];
  return list[dye % list.length];
}

const DEG = Math.PI / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

export interface ArmPose { front: number; back: number; weapon: number; lean: number; bob: number; legA: number; legB: number; lift: number }

export function computePose(p: Pose, wtype: WeaponType): ArmPose {
  const t = p.t / 1000;
  const out: ArmPose = { front: 22, back: -12, weapon: 160, lean: 0, bob: Math.sin(t * Math.PI * 2 * 0.9) * 0.6, legA: 0, legB: 0, lift: 0 };
  if (wtype === 'bow') { out.front = 80; out.weapon = 180; }
  if (wtype === 'staff') { out.weapon = 172; }
  if (wtype === 'spear') { out.front = 30; out.weapon = 168; }
  if (wtype === 'katar') { out.front = 55; out.weapon = 95; }
  switch (p.state) {
    case 'walk': {
      const ph = t * Math.PI * 2 * 2.3;
      out.bob = -Math.abs(Math.sin(ph)) * 1.7;
      out.legA = Math.sin(ph) * 3.2;
      out.legB = -Math.sin(ph) * 3.2;
      out.lift = Math.cos(ph);
      out.front += Math.sin(ph) * 14;
      out.back -= Math.sin(ph) * 16;
      out.weapon += Math.sin(ph) * 6;
      out.lean = 4;
      break;
    }
    case 'attack': {
      const a = Math.min(1, p.t / (p.dur ?? 320));
      if (wtype === 'bow') {
        out.front = 88;
        out.back = a < 0.6 ? lerp(40, 92, ease(a / 0.6)) : lerp(92, 40, ease((a - 0.6) / 0.4));
        out.weapon = 180;
        out.lean = a < 0.6 ? -3 : 0;
      } else if (wtype === 'spear') {
        // overhand thrust
        if (a < 0.3) { out.front = lerp(30, -20, ease(a / 0.3)); out.weapon = lerp(168, 120, a / 0.3); out.lean = -4; }
        else if (a < 0.5) { out.front = lerp(-20, 95, ease((a - 0.3) / 0.2)); out.weapon = lerp(120, 92, (a - 0.3) / 0.2); out.lean = 10; }
        else { out.front = lerp(95, 30, ease((a - 0.5) / 0.5)); out.weapon = lerp(92, 168, ease((a - 0.5) / 0.5)); out.lean = lerp(10, 0, (a - 0.5) / 0.5); }
      } else if (wtype === 'katar') {
        if (a < 0.3) { out.front = lerp(55, 10, ease(a / 0.3)); out.weapon = lerp(95, 80, a / 0.3); }
        else if (a < 0.55) { out.front = lerp(10, 100, ease((a - 0.3) / 0.25)); out.weapon = lerp(80, 92, (a - 0.3) / 0.25); }
        else { out.front = lerp(100, 55, ease((a - 0.55) / 0.45)); out.weapon = 95; }
        out.back = a > 0.3 && a < 0.7 ? 70 : -12;
        out.lean = a > 0.3 && a < 0.7 ? 9 : 0;
      } else if (wtype === 'dagger' || wtype === 'none') {
        if (a < 0.3) { out.front = lerp(22, -30, ease(a / 0.3)); out.weapon = lerp(160, 110, a / 0.3); }
        else if (a < 0.55) { out.front = lerp(-30, 100, ease((a - 0.3) / 0.25)); out.weapon = lerp(110, 95, (a - 0.3) / 0.25); }
        else { out.front = lerp(100, 22, ease((a - 0.55) / 0.45)); out.weapon = lerp(95, 160, (a - 0.55) / 0.45); }
        out.lean = a > 0.3 && a < 0.7 ? 8 : 0;
      } else {
        if (a < 0.35) { out.front = lerp(22, -150, ease(a / 0.35)); out.weapon = lerp(160, 205, a / 0.35); out.lean = -5 * (a / 0.35); }
        else if (a < 0.55) { out.front = lerp(-150, -280, ease((a - 0.35) / 0.2)); out.weapon = lerp(205, 75, (a - 0.35) / 0.2); out.lean = 10; }
        else { out.front = lerp(-280, -338, ease((a - 0.55) / 0.45)); out.weapon = lerp(75, 160, ease((a - 0.55) / 0.45)); out.lean = lerp(10, 0, (a - 0.55) / 0.45); }
      }
      break;
    }
    case 'ready': {
      // combat stance between swings: weapon levelled at the enemy, knees bent, quick breathing
      const ph = t * Math.PI * 2 * 1.5;
      out.bob = Math.sin(ph) * 0.8 + 0.6;
      out.lean = 5;
      out.legA = -1.4; out.legB = 1.6;
      if (wtype === 'bow') { out.front = 86; out.back = 46 + Math.sin(ph) * 3; out.weapon = 180; }
      else if (wtype === 'staff') { out.front = 62 + Math.sin(ph) * 3; out.weapon = 138; out.back = 4; }
      else if (wtype === 'spear') { out.front = 64; out.weapon = 112; out.back = 30; }
      else if (wtype === 'katar') { out.front = 78; out.weapon = 90; out.back = 58; }
      else { out.front = 56 + Math.sin(ph) * 4; out.weapon = 124 + Math.sin(ph) * 3; out.back = 14; }
      break;
    }
    case 'cast': {
      const w = Math.sin(t * 8) * 4;
      out.front = 150 + w;
      out.back = 200 - w;
      out.weapon = 182;
      out.lean = -4;
      out.bob = Math.sin(t * 6) * 0.8 - 1;
      break;
    }
    case 'sit': {
      out.front = 50; out.back = 30; out.weapon = 110; out.bob = 6; out.lean = 0;
      break;
    }
    case 'hurt': {
      out.lean = -10; out.front = 0; out.back = -30;
      break;
    }
  }
  return out;
}

function limb(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, w: number, color: string, line: string) {
  const ex = x + Math.sin(ang * DEG) * len, ey = y + Math.cos(ang * DEG) * len;
  ctx.lineCap = 'round';
  ctx.strokeStyle = line;
  ctx.lineWidth = w + 1.6;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  return [ex, ey] as const;
}

function blob(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, line: string, lw = 1.2) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = line;
  ctx.stroke();
}

// ───────── weapons (grip at origin, pointing +y when ang=0; we rotate so blade points along "weapon" angle)
export function drawWeapon(ctx: CanvasRenderingContext2D, wtype: WeaponType, color: string | undefined, refine: number, t: number) {
  const metal = color ?? '#d8dee8';
  const glow = refine >= 7;
  if (glow) {
    inkGlow(ctx, (c) => {
      const g = c.createRadialGradient(0, 14, 0, 0, 14, 16);
      const a = 0.25 + 0.15 * Math.sin(t / 180);
      g.addColorStop(0, refine >= 10 ? `rgba(255,120,220,${a})` : `rgba(140,200,255,${a})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(-16, -2, 32, 34);
    });
  }
  ctx.lineJoin = 'round';
  switch (wtype) {
    case 'dagger': {
      ctx.fillStyle = '#6a4a32'; ctx.fillRect(-1.3, -3, 2.6, 4);
      ctx.fillStyle = '#c8a050'; ctx.fillRect(-3.2, 0.5, 6.4, 1.6);
      ctx.beginPath(); ctx.moveTo(-1.8, 2); ctx.lineTo(1.8, 2); ctx.lineTo(0, 13); ctx.closePath();
      blob(ctx, metal, shade(metal.startsWith('#') ? metal : '#d8dee8', -0.5), 0.9);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-0.4, 3); ctx.lineTo(-0.2, 10); ctx.stroke();
      break;
    }
    case 'sword':
    case 'sword2h': {
      const L = wtype === 'sword2h' ? 26 : 19;
      const W = wtype === 'sword2h' ? 2.8 : 2.2;
      ctx.fillStyle = '#5a3e2a'; ctx.fillRect(-1.3, -5, 2.6, 6);
      ctx.fillStyle = '#e0b850'; ctx.beginPath(); ctx.arc(0, -5.5, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c8a050'; ctx.fillRect(-4.5, 0.5, 9, 2);
      ctx.beginPath(); ctx.moveTo(-W, 2.5); ctx.lineTo(W, 2.5); ctx.lineTo(W, L - 3); ctx.lineTo(0, L + 1); ctx.lineTo(-W, L - 3); ctx.closePath();
      blob(ctx, metal, '#4a5060', 0.9);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-0.6, 4); ctx.lineTo(-0.6, L - 3); ctx.stroke();
      break;
    }
    case 'staff': {
      ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 22); ctx.stroke();
      ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 22); ctx.stroke();
      const orb = color && color !== '#cfd6e0' ? color : '#7ad0ff';
      ctx.beginPath(); ctx.arc(0, 24, 3.6, 0, Math.PI * 2);
      blob(ctx, orb, shade(orb.startsWith('#') ? orb : '#7ad0ff', -0.45), 0.9);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(-1, 23, 1.1, 0, Math.PI * 2); ctx.fill();
      inkGlow(ctx, (c) => {
        const g = c.createRadialGradient(0, 24, 0, 0, 24, 9);
        g.addColorStop(0, rgba(orb.startsWith('#') ? orb : '#7ad0ff', 0.45 + 0.2 * Math.sin(t / 200))); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.fillRect(-9, 15, 18, 18);
      });
      ctx.strokeStyle = '#e0b850'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 24, 5, Math.PI * 0.15, Math.PI * 0.85, true); ctx.stroke();
      break;
    }
    case 'bow': {
      ctx.strokeStyle = '#3a2414'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(7, 0, 0, 14); ctx.stroke();
      ctx.strokeStyle = color && color !== '#cfd6e0' ? color : '#a06a3a'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(7, 0, 0, 14); ctx.stroke();
      ctx.strokeStyle = 'rgba(240,240,230,0.9)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(-1, 0); ctx.lineTo(0, 14); ctx.stroke();
      break;
    }
    case 'mace': {
      ctx.fillStyle = '#5a3e2a'; ctx.fillRect(-1.2, -4, 2.4, 16);
      ctx.beginPath(); ctx.arc(0, 15, 4.6, 0, Math.PI * 2);
      blob(ctx, metal, '#4a5060', 1);
      ctx.fillStyle = shade('#d8dee8', -0.2);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 4, 15 + Math.sin(a) * 4); ctx.lineTo(Math.cos(a) * 7, 15 + Math.sin(a) * 7); ctx.lineTo(Math.cos(a + 0.4) * 4, 15 + Math.sin(a + 0.4) * 4); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(-1.4, 13.6, 1.3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'spear': {
      ctx.strokeStyle = '#3a2414'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 28); ctx.stroke();
      ctx.strokeStyle = '#9a6a3a'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 28); ctx.stroke();
      ctx.fillStyle = '#c8a050'; ctx.fillRect(-2.2, 26.5, 4.4, 2);
      ctx.beginPath(); ctx.moveTo(0, 28); ctx.quadraticCurveTo(3.6, 33, 0, 41); ctx.quadraticCurveTo(-3.6, 33, 0, 28); ctx.closePath();
      blob(ctx, metal, '#4a5060', 0.9);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-0.6, 30); ctx.lineTo(-0.4, 38); ctx.stroke();
      ctx.fillStyle = '#c03a3a'; ctx.beginPath(); ctx.moveTo(-1, 26); ctx.lineTo(-4 + Math.sin(t / 200), 22); ctx.lineTo(1, 25); ctx.fill();
      break;
    }
    case 'katar': {
      ctx.fillStyle = '#4a3a50'; ctx.fillRect(-3.4, -3, 1.6, 7); ctx.fillRect(1.8, -3, 1.6, 7);
      ctx.fillStyle = '#c8a050'; ctx.fillRect(-3.4, -1.2, 6.8, 1.4); ctx.fillRect(-3.6, 3.6, 7.2, 1.6);
      ctx.beginPath(); ctx.moveTo(-3, 5); ctx.lineTo(3, 5); ctx.lineTo(0.4, 22); ctx.lineTo(-0.4, 22); ctx.closePath();
      blob(ctx, metal, '#4a5060', 0.9);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-1, 7); ctx.lineTo(-0.2, 19); ctx.stroke();
      break;
    }
    case 'axe': {
      ctx.fillStyle = '#6a4a2e'; ctx.fillRect(-1.3, -5, 2.6, 22);
      ctx.beginPath(); ctx.moveTo(0, 10); ctx.quadraticCurveTo(10, 8, 10, 15); ctx.quadraticCurveTo(10, 22, 0, 19); ctx.closePath();
      blob(ctx, metal, '#4a5060', 1);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(9, 11); ctx.lineTo(9, 19); ctx.stroke();
      break;
    }
  }
}

// ───────── hair
function hairBack(ctx: CanvasRenderingContext2D, style: number, c: string, line: string, gender: 'm' | 'f', t: number) {
  ctx.beginPath();
  switch (style) {
    case 1: // bob
      ctx.ellipse(-1, -33, 14.2, 13.5, 0, 0, Math.PI * 2);
      break;
    case 2: { // long
      ctx.moveTo(-12, -40); ctx.quadraticCurveTo(-17, -20, -13, -8); ctx.quadraticCurveTo(-4, -6, 6, -10); ctx.quadraticCurveTo(10, -24, 10, -40); ctx.closePath();
      break;
    }
    case 3: { // twin tails
      const sw = Math.sin(t / 300) * 1.5;
      for (const sx of [-1, 1]) {
        const bx = sx < 0 ? -12 : 9;
        ctx.moveTo(bx, -42); ctx.quadraticCurveTo(bx + sx * 9 + sw, -30, bx + sx * 5 + sw, -14); ctx.quadraticCurveTo(bx + sx * 2, -18, bx - sx * 1, -38); ctx.closePath();
      }
      ctx.moveTo(0, 0);
      ctx.ellipse(-1, -36, 13, 11.5, 0, 0, Math.PI * 2);
      break;
    }
    case 4: { // ponytail
      const sw = Math.sin(t / 280) * 1.6;
      ctx.moveTo(-10, -44); ctx.quadraticCurveTo(-22 + sw, -38, -19 + sw, -20); ctx.quadraticCurveTo(-15, -26, -9, -36); ctx.closePath();
      ctx.moveTo(0, 0);
      ctx.ellipse(-1, -36, 13, 11.5, 0, 0, Math.PI * 2);
      break;
    }
    case 6:
      ctx.moveTo(-12, -42); ctx.quadraticCurveTo(-16, -26, -12, -20); ctx.lineTo(4, -22); ctx.quadraticCurveTo(10, -30, 10, -42); ctx.closePath();
      break;
    case 7: // bun
      ctx.arc(-4, -48, 5.6, 0, Math.PI * 2);
      ctx.moveTo(0, 0);
      ctx.ellipse(-1, -36, 13, 11.5, 0, 0, Math.PI * 2);
      break;
    default:
      ctx.ellipse(-1, -36, 13, 11.5, 0, 0, Math.PI * 2);
  }
  blob(ctx, c, line, 1.2);
  void gender;
}

function hairFront(ctx: CanvasRenderingContext2D, style: number, c: string, line: string, hi: string) {
  ctx.beginPath();
  // crown cap
  ctx.moveTo(-13.6, -33);
  ctx.bezierCurveTo(-14.5, -50, 13, -52, 13.4, -35);
  switch (style) {
    case 0: // spiky
      ctx.lineTo(11.5, -32); ctx.lineTo(8.8, -40); ctx.lineTo(6.2, -36.4); ctx.lineTo(3.2, -41); ctx.lineTo(0.2, -36.8); ctx.lineTo(-2.8, -41); ctx.lineTo(-6, -37.4); ctx.lineTo(-9, -40); ctx.lineTo(-12.2, -31.5);
      break;
    case 1: // bob straight cut
      ctx.lineTo(13.6, -24); ctx.lineTo(10.6, -24); ctx.lineTo(10.2, -37.6); ctx.lineTo(-2, -37.8); ctx.lineTo(-4, -39.4); ctx.lineTo(-12, -37); ctx.lineTo(-14, -24);
      break;
    case 2: // long, side swept
      ctx.lineTo(12.6, -26); ctx.lineTo(10.4, -31); ctx.quadraticCurveTo(5.4, -36.4, 2, -40.6); ctx.quadraticCurveTo(-4, -36.2, -11, -37.4); ctx.lineTo(-13.8, -26);
      break;
    case 3: case 4: case 7: // neat bangs
      ctx.lineTo(12, -31); ctx.lineTo(9.6, -38.4); ctx.lineTo(7, -35.8); ctx.lineTo(4, -39.4); ctx.lineTo(1, -36.2); ctx.lineTo(-2.5, -39.4); ctx.lineTo(-6, -36.4); ctx.lineTo(-10, -38.6); ctx.lineTo(-13, -31);
      break;
    case 5: // fluffy messy
      ctx.lineTo(15, -30); ctx.lineTo(11.2, -32); ctx.lineTo(10, -39); ctx.lineTo(6.4, -35.8); ctx.lineTo(4, -40.4); ctx.lineTo(0.2, -36.6); ctx.lineTo(-3, -41); ctx.lineTo(-7, -36.8); ctx.lineTo(-10, -39.4); ctx.lineTo(-15, -29);
      break;
    case 6: // long bang covering
      ctx.lineTo(12.4, -28); ctx.quadraticCurveTo(10, -30, 9, -34); ctx.quadraticCurveTo(2, -31, -2, -27); ctx.lineTo(-5, -34); ctx.lineTo(-10, -33); ctx.lineTo(-13.6, -27);
      break;
  }
  ctx.closePath();
  blob(ctx, c, line, 1.2);
  // shine
  ctx.strokeStyle = hi;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-1, -43, 5.6, Math.PI * 1.12, Math.PI * 1.42);
  ctx.stroke();
  if (style === 0) {
    // crown spikes
    ctx.beginPath();
    ctx.moveTo(-8, -46); ctx.lineTo(-10, -52); ctx.lineTo(-3, -48.5); ctx.lineTo(0, -54); ctx.lineTo(4, -48.5); ctx.lineTo(10, -50); ctx.lineTo(9, -44);
    ctx.closePath();
    blob(ctx, c, line, 1.1);
  }
  if (style === 5) {
    ctx.beginPath(); ctx.arc(-11, -42, 4.2, 0, Math.PI * 2); ctx.arc(10, -43, 4, 0, Math.PI * 2);
    blob(ctx, c, line, 1);
  }
  if (style === 3) {
    // hair ties
    ctx.fillStyle = '#ff6a8a';
    ctx.beginPath(); ctx.arc(-12, -41, 1.8, 0, Math.PI * 2); ctx.arc(10, -41, 1.8, 0, Math.PI * 2); ctx.fill();
  }
}

// ───────── face
function face(ctx: CanvasRenderingContext2D, gender: 'm' | 'f', state: string, t: number, eyeHidden: boolean) {
  // blink only on continuous clocks; action poses restart t at 0 and would blink on every swing
  const blink = (state === 'idle' || state === 'ready' || state === 'walk') && (Math.floor(t / 100) % 38) === 0;
  const ey = -32;
  if (state === 'dead') {
    ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 1.1;
    for (const ex of [6.5, -0.5]) {
      ctx.beginPath(); ctx.moveTo(ex - 1.6, ey - 1.6); ctx.lineTo(ex + 1.6, ey + 1.6); ctx.moveTo(ex + 1.6, ey - 1.6); ctx.lineTo(ex - 1.6, ey + 1.6); ctx.stroke();
    }
    return;
  }
  const sitting = state === 'sit';
  for (const [ex, w] of [[6.6, 2.4], [-0.6, 1.9]] as const) {
    if (eyeHidden && ex < 0) continue;
    if (blink || (sitting && Math.floor(t / 1600) % 3 === 0)) {
      ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(ex - w, ey + 0.5); ctx.quadraticCurveTo(ex, ey + 1.8, ex + w, ey + 0.5); ctx.stroke();
      continue;
    }
    // tall dark-navy ovals with a bright lower iris and one highlight (cartoon, not glossy anime)
    const h = gender === 'f' ? 3.5 : 3.2;
    ctx.fillStyle = '#1c2448';
    ctx.beginPath(); ctx.ellipse(ex, ey, w * 0.92, h, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = gender === 'f' ? '#3d78e0' : '#2f66c8';
    ctx.beginPath(); ctx.ellipse(ex, ey + h * 0.38, w * 0.62, h * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(ex + w * 0.28, ey - h * 0.38, 0.8, 1.05, 0, 0, Math.PI * 2); ctx.fill();
    if (gender === 'f') {
      ctx.strokeStyle = '#1c2448'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ex - w - 0.2, ey - h + 0.9); ctx.lineTo(ex + w + 0.7, ey - h + 0.1); ctx.stroke();
    }
  }
  // mouth
  ctx.strokeStyle = '#8a4a4a'; ctx.lineWidth = 0.9;
  ctx.beginPath();
  if (state === 'hurt') { ctx.ellipse(5, -26.6, 1.3, 1.1, 0, 0, Math.PI * 2); ctx.stroke(); }
  else if (state === 'attack' || state === 'cast') { ctx.moveTo(3.6, -27); ctx.quadraticCurveTo(5, -25.4, 6.4, -27); ctx.stroke(); }
  else { ctx.moveTo(4, -26.8); ctx.quadraticCurveTo(5, -26, 6, -26.8); ctx.stroke(); }
  // blush
  ctx.fillStyle = 'rgba(255,120,130,0.18)';
  ctx.beginPath(); ctx.ellipse(8.8, -28.6, 2.1, 1.1, 0, 0, Math.PI * 2); ctx.ellipse(-2.8, -28.6, 1.6, 1, 0, 0, Math.PI * 2); ctx.fill();
}

/** angled brows drawn over the fringe (manga convention) — they carry the expression */
function brows(ctx: CanvasRenderingContext2D, gender: 'm' | 'f', state: string, eyeHidden: boolean, line: string) {
  if (state === 'dead' || state === 'sit') return;
  const by = -36.4;
  const tense = state === 'attack' || state === 'cast' || state === 'ready' || state === 'hurt';
  ctx.strokeStyle = line; ctx.lineCap = 'round';
  ctx.lineWidth = gender === 'm' ? 1.5 : 1.1;
  // inner ends dip toward the nose: determined; a little more when fighting
  const dip = (gender === 'm' ? 1.3 : 0.7) + (tense ? 0.6 : 0);
  ctx.beginPath();
  ctx.moveTo(4.4, by + dip); ctx.lineTo(9.4, by - 0.4);
  if (!eyeHidden) { ctx.moveTo(1.6, by + dip); ctx.lineTo(-2.6, by - 0.2); }
  ctx.stroke();
}

// ───────── headgears (drawn in head space; head center ~ (0.5,-35))
export function drawHeadgear(ctx: CanvasRenderingContext2D, look: string, t: number, hairColor: string) {
  ctx.lineJoin = 'round';
  switch (look) {
    case 'hairpin': {
      // two crossed hair clips with a little star gem, pinned at the side of the fringe
      ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(5.5, -47.5); ctx.lineTo(11.5, -43.5); ctx.moveTo(6, -43); ctx.lineTo(11, -48); ctx.stroke();
      ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(5.5, -47.5); ctx.lineTo(11.5, -43.5); ctx.moveTo(6, -43); ctx.lineTo(11, -48); ctx.stroke();
      ctx.fillStyle = '#ff6a8a'; ctx.strokeStyle = '#7a1a3a'; ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 1.1 : 2.4; ctx.lineTo(8.5 + Math.cos(a) * r, -45.6 + Math.sin(a) * r); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
    case 'leaf': {
      // a sprout growing out of the crown, swaying
      const sway = Math.sin(t / 420) * 0.12;
      ctx.save(); ctx.translate(1, -53.5); ctx.rotate(sway);
      ctx.strokeStyle = '#2f6a1e'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(0.5, -2, 0, -4.5); ctx.stroke();
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(0, -4.2);
        ctx.quadraticCurveTo(s * 3, -9, s * 7.5, -7); ctx.quadraticCurveTo(s * 4, -3.6, 0, -4.2);
        blob(ctx, s < 0 ? '#7ccf4a' : '#5fb83a', '#2f6a1e', 0.8);
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(s * 1, -4.8); ctx.quadraticCurveTo(s * 3.5, -6.6, s * 6, -6.8); ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'flower': {
      const cx = 9, cy = -45;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 + 0.3; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * 2.6, cy + Math.sin(a) * 2.6, 2.2, 1.6, a, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#e0c8d0'; ctx.lineWidth = 0.5; ctx.stroke();
      ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.arc(cx, cy, 1.5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'ribbon': {
      const c = '#ff5a7a';
      ctx.save(); ctx.translate(-2, -48);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-12, -8, -14, 6, 0, 1); ctx.closePath(); blob(ctx, c, shade(c, -0.4), 1);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(12, -9, 15, 6, 0, 1); ctx.closePath(); blob(ctx, c, shade(c, -0.4), 1);
      ctx.beginPath(); ctx.arc(0, 0.5, 2.4, 0, Math.PI * 2); blob(ctx, shade(c, -0.15), shade(c, -0.45), 1);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-6, -2, 2.4, 1.2, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      break;
    }
    case 'cap': {
      const c = '#3a6ad8';
      ctx.beginPath(); ctx.moveTo(-14, -40); ctx.bezierCurveTo(-14, -55, 13, -55, 13.5, -41); ctx.closePath(); blob(ctx, c, shade(c, -0.45), 1.1);
      ctx.beginPath(); ctx.moveTo(6, -42); ctx.quadraticCurveTo(20, -43, 21, -39); ctx.quadraticCurveTo(12, -38, 5, -40); ctx.closePath(); blob(ctx, shade(c, -0.15), shade(c, -0.5), 1);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-1, -48, 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'bandana': {
      const c = '#d84a4a';
      ctx.beginPath(); ctx.moveTo(-14, -38); ctx.bezierCurveTo(-14, -54, 13.5, -54, 13.8, -38); ctx.quadraticCurveTo(0, -42, -14, -38); blob(ctx, c, shade(c, -0.45), 1.1);
      ctx.fillStyle = '#fff';
      for (const [x, y] of [[-6, -46], [2, -48], [8, -43], [-9, -41]]) { ctx.beginPath(); ctx.arc(x, y, 0.9, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(-13, -39); ctx.lineTo(-20, -35 + Math.sin(t / 200)); ctx.lineTo(-18, -41); ctx.closePath(); blob(ctx, c, shade(c, -0.45), 1);
      break;
    }
    case 'witch': {
      const c = '#5a3a8a';
      ctx.beginPath(); ctx.ellipse(0, -43, 19, 4.2, -0.05, 0, Math.PI * 2); blob(ctx, c, shade(c, -0.5), 1.1);
      ctx.beginPath(); ctx.moveTo(-10, -44); ctx.quadraticCurveTo(-4, -60, -8, -70 + Math.sin(t / 400)); ctx.quadraticCurveTo(4, -62, 10, -44); ctx.closePath(); blob(ctx, c, shade(c, -0.5), 1.1);
      ctx.fillStyle = '#f0c040'; ctx.fillRect(-10, -47, 20, 2.6);
      ctx.fillStyle = '#ffe080'; ctx.beginPath(); ctx.arc(3, -54, 1.4, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'helm': {
      const c = '#b8c4d4';
      ctx.beginPath(); ctx.moveTo(-15, -33); ctx.bezierCurveTo(-16, -56, 15, -56, 14.5, -33); ctx.lineTo(11, -33); ctx.lineTo(10, -38); ctx.lineTo(-11, -38); ctx.lineTo(-12, -32); ctx.closePath(); blob(ctx, c, '#4a5468', 1.2);
      ctx.fillStyle = '#d84a4a'; ctx.beginPath(); ctx.moveTo(-2, -53); ctx.quadraticCurveTo(-12, -62, -18, -52 + Math.sin(t / 250)); ctx.quadraticCurveTo(-10, -56, -2, -50); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(-1, -42, 9, Math.PI * 1.15, Math.PI * 1.5); ctx.stroke();
      break;
    }
    case 'bunny': {
      const tw = Math.sin(t / 500) * 0.08;
      for (const [x, r] of [[-5, -0.18], [5, 0.2]] as const) {
        ctx.save(); ctx.translate(x, -45); ctx.rotate(r + tw);
        ctx.beginPath(); ctx.ellipse(0, -9, 3.6, 10, 0, 0, Math.PI * 2); blob(ctx, '#ffffff', '#b8b0b8', 1);
        ctx.fillStyle = '#ffb0c8'; ctx.beginPath(); ctx.ellipse(0, -8.5, 1.8, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, -36, 13.4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      break;
    }
    case 'cat': {
      for (const [x, s] of [[-8, -1], [8, 1]] as const) {
        ctx.beginPath(); ctx.moveTo(x - 5, -44); ctx.lineTo(x + s * 2, -55); ctx.lineTo(x + 5, -45); ctx.closePath(); blob(ctx, '#3a3a44', '#1a1a22', 1);
        ctx.fillStyle = '#ffb0c8'; ctx.beginPath(); ctx.moveTo(x - 2.6, -45); ctx.lineTo(x + s * 1.4, -51.5); ctx.lineTo(x + 2.6, -45.5); ctx.fill();
      }
      ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -36, 13.4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      break;
    }
    case 'mushroom': {
      ctx.beginPath(); ctx.moveTo(-17, -41); ctx.bezierCurveTo(-16, -62, 16, -62, 17, -41); ctx.quadraticCurveTo(0, -37, -17, -41); blob(ctx, '#e04a3a', '#7a2018', 1.2);
      ctx.fillStyle = '#fff4e8';
      for (const [x, y, r] of [[-8, -48, 2.6], [3, -53, 2.2], [9, -45, 2], [-1, -45, 1.6]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'jellyhat': {
      const sq = 1 + Math.sin(t / 380) * 0.05;
      ctx.save(); ctx.translate(0, -47); ctx.scale(1 / sq, sq);
      drawJellyBody(ctx, ['#ffb3c7', '#ff7aa0', '#fff0f4'], 0.72, t, true);
      ctx.restore();
      break;
    }
    case 'apple': {
      ctx.beginPath(); ctx.arc(-3, -52, 5.4, 0, Math.PI * 2); ctx.arc(2, -52, 5.4, 0, Math.PI * 2); blob(ctx, '#e83a3a', '#7a1414', 1.1);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-4, -54, 1.6, 2.4, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -56); ctx.lineTo(1, -60); ctx.stroke();
      ctx.fillStyle = '#5aa040'; ctx.beginPath(); ctx.ellipse(3.6, -59, 3, 1.4, -0.4, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'tiara': {
      ctx.beginPath(); ctx.moveTo(-11, -44); ctx.lineTo(-7, -49); ctx.lineTo(-3, -46); ctx.lineTo(0, -52); ctx.lineTo(3, -46); ctx.lineTo(7, -49); ctx.lineTo(11, -44); ctx.quadraticCurveTo(0, -46, -11, -44);
      blob(ctx, '#f0d070', '#8a6a20', 1);
      ctx.fillStyle = '#ff4a8a'; ctx.beginPath(); ctx.arc(0, -48, 1.7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4ac8ff'; ctx.beginPath(); ctx.arc(-6, -46.6, 1.1, 0, Math.PI * 2); ctx.arc(6, -46.6, 1.1, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'bonehelm': {
      ctx.beginPath(); ctx.moveTo(-15, -30); ctx.bezierCurveTo(-17, -58, 16, -58, 15, -30); ctx.lineTo(10, -28); ctx.lineTo(10, -36); ctx.lineTo(-11, -36); ctx.lineTo(-11, -28); ctx.closePath(); blob(ctx, '#ece6d0', '#6a6050', 1.2);
      ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.ellipse(-3, -42, 3, 3.6, 0, 0, Math.PI * 2); ctx.ellipse(6, -42, 3, 3.6, 0, 0, Math.PI * 2); ctx.fill();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 12, -48); ctx.quadraticCurveTo(s * 22, -54, s * 21, -64); ctx.quadraticCurveTo(s * 17, -55, s * 9, -52); blob(ctx, '#ece6d0', '#6a6050', 1); }
      break;
    }
    case 'crown': {
      ctx.beginPath(); ctx.moveTo(-10, -45); ctx.lineTo(-11, -56); ctx.lineTo(-5, -51); ctx.lineTo(0, -59); ctx.lineTo(5, -51); ctx.lineTo(11, -56); ctx.lineTo(10, -45); ctx.closePath();
      blob(ctx, '#ffd040', '#8a5a10', 1.2);
      ctx.fillStyle = '#ff4060'; ctx.beginPath(); ctx.arc(0, -49, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#40a0ff'; ctx.beginPath(); ctx.arc(-6, -48, 1.3, 0, Math.PI * 2); ctx.arc(6, -48, 1.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(-9, -47, 3, 1);
      break;
    }
    case 'angel': {
      const f = Math.sin(t / 260) * 0.12;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(s * 13, -40); ctx.scale(s, 1); ctx.rotate(-0.3 + f);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(6, -14, 16, -12, 17, -6); ctx.quadraticCurveTo(12, -4, 14, 0); ctx.quadraticCurveTo(9, 0, 10, 3); ctx.quadraticCurveTo(5, 2, 0, 3); ctx.closePath();
        blob(ctx, '#ffffff', '#a8b8d0', 1);
        ctx.restore();
      }
      break;
    }
    case 'horns': {
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 7, -46); ctx.quadraticCurveTo(s * 18, -50, s * 17, -63); ctx.quadraticCurveTo(s * 13, -54, s * 3, -49); ctx.closePath();
        blob(ctx, '#4a2a5a', '#1a0a22', 1.1);
        ctx.strokeStyle = 'rgba(255,120,200,0.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(s * 9, -49); ctx.quadraticCurveTo(s * 15, -52, s * 15.5, -58); ctx.stroke();
      }
      break;
    }
    case 'glasses': {
      ctx.strokeStyle = '#3a3030'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(6.6, -32, 3.4, 0, Math.PI * 2); ctx.moveTo(1.8, -32); ctx.arc(-0.8, -32, 2.6, 0, Math.PI * 2); ctx.moveTo(3.2, -32.5); ctx.lineTo(4, -32.5); ctx.stroke();
      ctx.fillStyle = 'rgba(200,230,255,0.25)'; ctx.beginPath(); ctx.arc(6.6, -32, 3.2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'sunglasses': {
      ctx.fillStyle = '#1a1a22';
      ctx.beginPath(); ctx.ellipse(6.8, -31.6, 3.6, 2.6, 0, 0, Math.PI * 2); ctx.ellipse(-0.8, -31.6, 2.8, 2.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(2, -33, 2, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(5.5, -33, 2, 0.9);
      break;
    }
    case 'goggles': {
      ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -38, 13.6, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      for (const x of [-4, 5]) { ctx.beginPath(); ctx.arc(x, -44, 3.6, 0, Math.PI * 2); blob(ctx, '#7ad0ff', '#4a3a2a', 1.6); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x - 1, -45, 1, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'eyepatch': {
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-12, -38); ctx.lineTo(11, -30); ctx.stroke();
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(6.8, -32, 3.6, 3.2, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'blush': {
      ctx.fillStyle = 'rgba(255,90,110,0.55)';
      ctx.beginPath(); ctx.ellipse(9, -28.4, 2.6, 1.4, 0, 0, Math.PI * 2); ctx.ellipse(-3, -28.4, 2, 1.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(220,60,80,0.6)'; ctx.lineWidth = 0.6;
      for (const x of [8, 9.5, 11]) { ctx.beginPath(); ctx.moveTo(x - 0.6, -27.6); ctx.lineTo(x + 0.4, -29.2); ctx.stroke(); }
      break;
    }
    case 'pipe': {
      ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(5, -26.4); ctx.lineTo(11, -24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, -22); ctx.lineTo(10.4, -27); ctx.lineTo(13.4, -27); ctx.lineTo(13, -22); ctx.closePath(); blob(ctx, '#7a4a28', '#3a2010', 0.8);
      const puff = (t / 1200) % 1;
      ctx.fillStyle = `rgba(230,230,240,${0.5 * (1 - puff)})`; ctx.beginPath(); ctx.arc(12 + puff * 4, -29 - puff * 9, 1.4 + puff * 2.4, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'mask': {
      ctx.beginPath(); ctx.moveTo(-3, -29.6); ctx.quadraticCurveTo(5, -31, 12, -29); ctx.quadraticCurveTo(11, -22, 4, -22); ctx.quadraticCurveTo(-2, -23, -3, -29.6); blob(ctx, '#f0f0f4', '#9098a8', 1);
      ctx.strokeStyle = '#c8d0dc'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(0, -27); ctx.lineTo(10, -27); ctx.moveTo(0, -25); ctx.lineTo(10, -25); ctx.stroke();
      break;
    }
    case 'rose': {
      ctx.strokeStyle = '#3a8a3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(3, -26.6); ctx.lineTo(13, -29); ctx.stroke();
      ctx.beginPath(); ctx.arc(14, -29.4, 2.6, 0, Math.PI * 2); blob(ctx, '#e02a4a', '#6a0a1a', 0.8);
      ctx.strokeStyle = '#8a0a2a'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(14, -29.4, 1.2, 0, Math.PI * 1.5); ctx.stroke();
      break;
    }
    case 'scarf': {
      ctx.beginPath(); ctx.moveTo(-7, -24.5); ctx.quadraticCurveTo(1, -21, 9, -24.5); ctx.lineTo(9, -21); ctx.quadraticCurveTo(1, -17.5, -7, -21); ctx.closePath(); blob(ctx, '#e04a4a', '#7a1a1a', 1);
      ctx.beginPath(); ctx.moveTo(-6, -22); ctx.lineTo(-12 + Math.sin(t / 220) * 1.5, -13); ctx.lineTo(-8, -12.5); ctx.lineTo(-3, -21); ctx.closePath(); blob(ctx, '#e04a4a', '#7a1a1a', 1);
      break;
    }
  }
  void hairColor;
}

// shared with the jelly-hat
export function drawJellyBody(ctx: CanvasRenderingContext2D, pal: string[], s: number, t: number, sleepy = false) {
  const [main, dark] = pal;
  const shadeTone = shade(main, -0.16);
  const line = shade(dark, -0.45);
  // little feet
  ctx.fillStyle = shadeTone; ctx.strokeStyle = line; ctx.lineWidth = 1;
  for (const fx of [-7.4, 7.4]) { ctx.beginPath(); ctx.ellipse(fx * s, -0.6 * s, 3.6 * s, 2.2 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  // body with a curled tip on top
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-13 * s, -1 * s);
    ctx.bezierCurveTo(-15 * s, -10 * s, -9 * s, -19 * s, 0, -19 * s);
    ctx.quadraticCurveTo(2.6 * s, -19.2 * s, 3.6 * s, -21.4 * s);
    ctx.quadraticCurveTo(5.8 * s, -25.2 * s, 8.4 * s, -23.6 * s);
    ctx.quadraticCurveTo(5.6 * s, -23.4 * s, 5.8 * s, -19.4 * s);
    ctx.bezierCurveTo(12 * s, -17 * s, 15 * s, -9 * s, 13 * s, -1 * s);
    ctx.quadraticCurveTo(0, 1.8 * s, -13 * s, -1 * s);
    ctx.closePath();
  };
  body(); ctx.fillStyle = main; ctx.fill();
  // one hard shadow tone along the bottom
  ctx.save(); body(); ctx.clip();
  ctx.fillStyle = shadeTone; ctx.beginPath(); ctx.ellipse(1 * s, 2 * s, 17 * s, 7.4 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  body(); ctx.strokeStyle = line; ctx.lineWidth = 1.1; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.ellipse(-6 * s, -13.4 * s, 2.6 * s, 1.5 * s, -0.6, 0, Math.PI * 2); ctx.fill();
  // face: dot eyes and a small mouth
  ctx.fillStyle = '#2a1a22';
  if (sleepy) {
    ctx.strokeStyle = '#2a1a22'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-4.6 * s, -9 * s); ctx.lineTo(-1.8 * s, -9 * s); ctx.moveTo(3.4 * s, -9 * s); ctx.lineTo(6.2 * s, -9 * s); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.ellipse(-3 * s, -9.2 * s, 1.15 * s, 1.75 * s, 0, 0, Math.PI * 2); ctx.ellipse(4.8 * s, -9.2 * s, 1.15 * s, 1.75 * s, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = '#5a2232'; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0.2 * s, -5.6 * s); ctx.quadraticCurveTo(0.9 * s, -4.9 * s, 1.6 * s, -5.6 * s); ctx.stroke();
  ctx.fillStyle = 'rgba(255,110,140,0.3)';
  ctx.beginPath(); ctx.ellipse(-6.4 * s, -6 * s, 1.7 * s, 0.9 * s, 0, 0, Math.PI * 2); ctx.ellipse(8 * s, -6 * s, 1.7 * s, 0.9 * s, 0, 0, Math.PI * 2); ctx.fill();
  void t;
}

// ───────── torso by class
function torso(ctx: CanvasRenderingContext2D, cls: ClassId, o: Outfit, skin: string, t: number, sit: boolean) {
  const line = shade(o.main, -0.5);
  // robe skirt for casters
  if (o.robe) {
    ctx.beginPath();
    ctx.moveTo(-7, -18); ctx.lineTo(7.5, -18);
    ctx.quadraticCurveTo(10, sit ? -6 : -3, 10.5, sit ? -5 : -1.2);
    ctx.quadraticCurveTo(0, sit ? -3 : 0.8, -9.5, sit ? -5 : -1.2);
    ctx.quadraticCurveTo(-9, -8, -7, -18);
    ctx.closePath();
    blob(ctx, o.main, line);
    ctx.strokeStyle = o.trim; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-9.2, sit ? -5.6 : -2); ctx.quadraticCurveTo(0, sit ? -3.8 : 0, 10.2, sit ? -5.6 : -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1, -16); ctx.lineTo(1, sit ? -4 : -0.5); ctx.stroke();
  }
  // upper body
  ctx.beginPath();
  ctx.moveTo(-6.6, -23.5);
  ctx.quadraticCurveTo(0.5, -25, 7.2, -23.5);
  ctx.lineTo(7.8, -12);
  ctx.quadraticCurveTo(0.5, -10.6, -7, -12);
  ctx.closePath();
  blob(ctx, o.main, line);
  // shading on back side
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.moveTo(-6.6, -23.5); ctx.lineTo(-3, -23.8); ctx.lineTo(-3.4, -11.2); ctx.lineTo(-7, -12); ctx.closePath(); ctx.fill();

  switch (cls) {
    case 'novice': {
      ctx.fillStyle = o.second;
      ctx.beginPath(); ctx.moveTo(-1.5, -24); ctx.lineTo(4.5, -24); ctx.lineTo(2, -16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(o.main, -0.35); ctx.fillRect(-7, -14.6, 14.8, 2.2);
      ctx.fillStyle = '#e8c070'; ctx.fillRect(0.4, -14.6, 2.4, 2.2);
      break;
    }
    case 'swordsman': {
      ctx.fillStyle = o.second;
      ctx.beginPath(); ctx.moveTo(-6.4, -14); ctx.lineTo(7.6, -14); ctx.lineTo(7.8, -10.5); ctx.lineTo(-7, -10.5); ctx.closePath(); ctx.fill();
      // chest plate
      ctx.beginPath(); ctx.moveTo(-4, -23); ctx.quadraticCurveTo(1, -24.5, 6.6, -23); ctx.lineTo(6, -15.5); ctx.quadraticCurveTo(1, -14, -4, -15.5); ctx.closePath();
      blob(ctx, o.trim, '#5a6070', 1);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-2, -21.5); ctx.lineTo(3, -22); ctx.stroke();
      // shoulder pad
      ctx.beginPath(); ctx.ellipse(4, -22.6, 4.6, 3, 0.2, Math.PI, Math.PI * 2.05); blob(ctx, o.trim, '#5a6070', 1);
      break;
    }
    case 'mage': {
      ctx.beginPath(); ctx.moveTo(-8, -23); ctx.quadraticCurveTo(1, -27.5, 9, -23); ctx.lineTo(6.5, -19); ctx.quadraticCurveTo(1, -22, -5.5, -19); ctx.closePath();
      blob(ctx, o.second, shade(o.second, -0.5), 1);
      ctx.fillStyle = '#ff5a6a'; ctx.beginPath(); ctx.arc(1, -21.5, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(o.main, -0.3); ctx.fillRect(-7, -14.4, 14.8, 1.8);
      break;
    }
    case 'archer': {
      // quiver strap + belt
      ctx.strokeStyle = '#6a4428'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(6, -23.5); ctx.lineTo(-6, -13); ctx.stroke();
      ctx.fillStyle = '#6a4428'; ctx.fillRect(-7, -14.2, 14.8, 2);
      ctx.fillStyle = o.second; ctx.beginPath(); ctx.moveTo(-2, -24.4); ctx.lineTo(4.5, -24.4); ctx.lineTo(1.2, -20); ctx.closePath(); ctx.fill();
      break;
    }
    case 'acolyte': {
      ctx.fillStyle = o.second;
      ctx.beginPath(); ctx.moveTo(-7, -23.2); ctx.quadraticCurveTo(1, -26, 8, -23.2); ctx.lineTo(6, -18); ctx.quadraticCurveTo(1, -20.5, -4.6, -18); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = o.trim; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(1, -19.5); ctx.lineTo(1, -14.6); ctx.moveTo(-1, -17.6); ctx.lineTo(3, -17.6); ctx.stroke();
      ctx.fillStyle = shade(o.second, -0.1); ctx.fillRect(-7, -13.4, 14.8, 1.6);
      break;
    }
    case 'thief': {
      ctx.fillStyle = o.second;
      ctx.beginPath(); ctx.moveTo(-7.5, -24.2); ctx.quadraticCurveTo(1, -21.2, 9, -24.2); ctx.lineTo(8, -21); ctx.quadraticCurveTo(1, -18.5, -6.5, -21); ctx.closePath(); ctx.fill();
      // scarf tail
      ctx.beginPath(); ctx.moveTo(-6, -22.5); ctx.lineTo(-13 + Math.sin(t / 160) * 2, -17); ctx.lineTo(-10, -15.5 + Math.sin(t / 160)); ctx.lineTo(-4, -21); ctx.closePath(); blob(ctx, o.second, shade(o.second, -0.5), 0.9);
      ctx.fillStyle = '#5a4030'; ctx.fillRect(-7, -14.2, 14.8, 1.8);
      ctx.fillStyle = '#8a6a48'; ctx.fillRect(3.8, -14.8, 3, 3);
      break;
    }
    case 'merchant': {
      ctx.fillStyle = o.second;
      ctx.beginPath(); ctx.moveTo(-3, -21); ctx.lineTo(6.6, -21); ctx.lineTo(7.4, -10.5); ctx.lineTo(-3.4, -10.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shade(o.second, -0.4); ctx.lineWidth = 0.7; ctx.stroke();
      ctx.fillStyle = shade(o.second, -0.2); ctx.fillRect(-0.5, -17, 5, 3);
      ctx.strokeStyle = o.trim; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-6, -23.6); ctx.lineTo(7, -13.5); ctx.stroke();
      break;
    }
    case 'knight': {
      // full breastplate with a gold cross, double pauldrons
      ctx.beginPath(); ctx.moveTo(-6, -23.6); ctx.quadraticCurveTo(1, -25.4, 7.6, -23.6); ctx.lineTo(7.4, -13.6); ctx.quadraticCurveTo(1, -12, -5.6, -13.6); ctx.closePath();
      const g = ctx.createLinearGradient(-6, -24, 8, -13); g.addColorStop(0, shade(o.main, 0.35)); g.addColorStop(1, shade(o.main, -0.2));
      blob(ctx, g, shade(o.main, -0.55), 1);
      ctx.strokeStyle = o.trim; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(1.6, -22); ctx.lineTo(1.6, -15.5); ctx.moveTo(-0.6, -19.6); ctx.lineTo(3.8, -19.6); ctx.stroke();
      ctx.fillStyle = shade(o.main, -0.4); ctx.fillRect(-7, -13.4, 14.8, 2.4);
      ctx.fillStyle = o.trim; ctx.fillRect(0, -13.4, 3, 2.4);
      for (const [x, r] of [[5, 0.25], [-4.6, -0.2]] as const) {
        ctx.beginPath(); ctx.ellipse(x, -22.4, 4.8, 3.2, r, Math.PI * 0.95, Math.PI * 2.08); blob(ctx, shade(o.main, 0.15), shade(o.main, -0.55), 1);
        ctx.strokeStyle = o.trim; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.ellipse(x, -22.4, 4.8, 3.2, r, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      }
      break;
    }
    case 'wizard': {
      // stand-up collar and a gem
      ctx.beginPath(); ctx.moveTo(-8.5, -22); ctx.lineTo(-10, -30); ctx.quadraticCurveTo(1, -26, 11, -30.5); ctx.lineTo(9, -22); ctx.quadraticCurveTo(1, -25, -8.5, -22);
      blob(ctx, o.second, shade(o.second, -0.5), 1);
      ctx.fillStyle = shade(o.main, -0.25); ctx.beginPath(); ctx.moveTo(-6, -23); ctx.lineTo(-7.6, -28); ctx.quadraticCurveTo(1, -25, 9, -28.6); ctx.lineTo(7.6, -23); ctx.closePath(); ctx.fill();
      ctx.fillStyle = o.trim; ctx.beginPath(); ctx.moveTo(1.4, -21.4); ctx.lineTo(3.4, -18.6); ctx.lineTo(1.4, -15.8); ctx.lineTo(-0.6, -18.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(0.6, -19.8, 1, 1);
      ctx.fillStyle = shade(o.main, -0.35); ctx.fillRect(-7, -14.4, 14.8, 1.8);
      break;
    }
    case 'hunter': {
      ctx.fillStyle = o.second;
      ctx.beginPath(); ctx.moveTo(-6.4, -23); ctx.lineTo(-1, -23.4); ctx.lineTo(1.2, -15); ctx.lineTo(-6.8, -12.4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(3.4, -23.4); ctx.lineTo(7.4, -23); ctx.lineTo(7.8, -12.4); ctx.lineTo(1.2, -15); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shade(o.second, -0.45); ctx.lineWidth = 0.7; ctx.stroke();
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(-7, -14, 14.8, 2);
      ctx.fillStyle = '#7a5030'; ctx.fillRect(4, -14.6, 3.2, 3.6);
      ctx.strokeStyle = '#6a4428'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(6, -23.5); ctx.lineTo(-6, -13); ctx.stroke();
      break;
    }
    case 'priest': {
      // crossed stole with gold cross
      ctx.fillStyle = o.second;
      ctx.beginPath(); ctx.moveTo(-3.4, -24); ctx.lineTo(-1, -24); ctx.lineTo(-1.6, -1); ctx.lineTo(-4.4, -1.4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(3.8, -24); ctx.lineTo(6.2, -24); ctx.lineTo(6.8, -1.4); ctx.lineTo(4, -1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = o.trim;
      ctx.fillRect(-3.2, -4.4, 2.2, 0.8); ctx.fillRect(4.2, -4.4, 2.2, 0.8);
      ctx.fillRect(0.9, -21, 1.4, 6); ctx.fillRect(-0.6, -19.2, 4.4, 1.4);
      ctx.fillStyle = shade(o.main, -0.08); ctx.beginPath(); ctx.ellipse(1.2, -23.2, 7, 2.2, 0, 0, Math.PI); ctx.fill();
      break;
    }
    case 'assassin': {
      ctx.fillStyle = shade(o.main, 0.15);
      ctx.beginPath(); ctx.moveTo(-1.5, -24); ctx.lineTo(4, -24); ctx.lineTo(1.2, -13); ctx.closePath(); ctx.fill();
      // long twin scarf tails
      const w = Math.sin(t / 140);
      for (const k of [0, 1]) {
        ctx.beginPath(); ctx.moveTo(-5, -23 + k * 1.5); ctx.quadraticCurveTo(-14 - k * 2, -20 + w * 2, -18 - k * 3, -12 + k * 3 + w * 2.5);
        ctx.lineTo(-15 - k * 3, -11 + k * 3 + w * 2); ctx.quadraticCurveTo(-11, -18, -3, -21 + k * 1.5); ctx.closePath();
        blob(ctx, o.second, shade(o.second, -0.5), 0.8);
      }
      ctx.beginPath(); ctx.moveTo(-7.5, -24.6); ctx.quadraticCurveTo(1, -21.4, 9.4, -24.6); ctx.lineTo(8.4, -21.6); ctx.quadraticCurveTo(1, -18.8, -6.6, -21.6); ctx.closePath();
      blob(ctx, o.second, shade(o.second, -0.5), 0.8);
      for (const x of [6, -4.6]) { ctx.beginPath(); ctx.moveTo(x - 3, -22); ctx.lineTo(x, -27); ctx.lineTo(x + 3, -22); ctx.closePath(); blob(ctx, '#8a8a9a', '#2a2a34', 0.8); }
      ctx.fillStyle = '#2a1a2a'; ctx.fillRect(-7, -14.2, 14.8, 1.8);
      break;
    }
    case 'blacksmith': {
      ctx.fillStyle = o.second;
      ctx.beginPath(); ctx.moveTo(-1.5, -24.4); ctx.lineTo(4.5, -24.4); ctx.lineTo(4.2, -18); ctx.lineTo(-1.2, -18); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shade(o.main, -0.4); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-3.4, -24); ctx.lineTo(-3, -12); ctx.moveTo(6.4, -24); ctx.lineTo(6, -12); ctx.stroke();
      ctx.fillStyle = shade(o.main, -0.3); ctx.fillRect(-7, -14.6, 14.8, 2.4);
      ctx.fillStyle = o.trim; ctx.fillRect(-1, -14.6, 3, 2.4);
      // hammer on the belt
      ctx.fillStyle = '#6a6a74'; ctx.fillRect(-7.6, -14.8, 3.6, 2.6); ctx.fillStyle = '#8a5a34'; ctx.fillRect(-6.3, -12.4, 1.2, 4.4);
      break;
    }
  }
  // neck
  ctx.fillStyle = skin;
  ctx.fillRect(-1.2, -25.6, 4.4, 2.6);
}

export function drawHero(ctx: CanvasRenderingContext2D, L: HeroLookDraw, pose: Pose, opts: { alpha?: number; flash?: number; shadow?: boolean } = {}) {
  const t = pose.t;
  const state = pose.state;
  const P = computePose(pose, L.wtype);
  const o = outfit(L.cls, L.dye);
  const skin = SKIN_TONES[L.skin % SKIN_TONES.length];
  const skinLine = shade(skin.startsWith('#') ? skin : '#ffe3cf', -0.35);
  const hc = HAIR_COLORS[L.hairColor % HAIR_COLORS.length];
  const hLine = shade(hc, -0.45);
  const hHi = shade(hc, 0.35);

  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
  // shadow
  if (opts.shadow !== false) {
    ctx.fillStyle = 'rgba(20,30,20,0.28)';
    ctx.beginPath(); ctx.ellipse(0, 0, state === 'dead' ? 17 : 11, 3.8, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.scale(pose.facing, 1);
  if (state === 'dead') {
    ctx.translate(-2, -4);
    ctx.rotate(-Math.PI / 2 + 0.05);
    ctx.translate(0, 18);
  }
  ctx.translate(0, P.bob);
  ctx.rotate(P.lean * DEG);
  const sit = state === 'sit';

  // garment (cape) behind; some 2nd jobs wear a class cape
  const classCape = L.cls === 'knight' ? o.second : L.cls === 'wizard' ? shade(o.main, -0.3) : L.cls === 'priest' ? o.second : undefined;
  const cape = L.garment ?? classCape;
  if (cape) {
    const sway = Math.sin(t / 260) * 1.5 + (state === 'walk' ? 3 : 0);
    ctx.beginPath();
    ctx.moveTo(-5, -23);
    ctx.quadraticCurveTo(-12 - sway, -12, -10 - sway * 1.4, sit ? -6 : 0);
    ctx.lineTo(2 - sway, sit ? -5 : -1);
    ctx.quadraticCurveTo(4, -12, 5, -23);
    ctx.closePath();
    blob(ctx, cape, shade(cape.startsWith('#') ? cape : '#6a4a6a', -0.5));
  }
  // archer quiver on back
  if (L.cls === 'archer' || L.ammoColor) {
    ctx.save(); ctx.translate(-6, -19); ctx.rotate(-0.5);
    ctx.fillStyle = '#7a4a28'; ctx.fillRect(-2.6, -6, 5.2, 13); ctx.strokeStyle = '#3a2010'; ctx.lineWidth = 0.8; ctx.strokeRect(-2.6, -6, 5.2, 13);
    ctx.fillStyle = L.ammoColor ?? '#e8e0d0';
    for (const x of [-1.5, 0, 1.5]) { ctx.beginPath(); ctx.moveTo(x - 1, -6); ctx.lineTo(x, -10); ctx.lineTo(x + 1, -6); ctx.fill(); }
    ctx.restore();
  }
  // back arm
  limb(ctx, -4.2, -21, P.back, 8.5, 3.6, o.robe ? o.main : o.main, shade(o.main, -0.5));
  if (L.cls === 'hunter' && state !== 'dead' && !L.noFalcon) drawFalcon(ctx, -12, -24 - Math.abs(Math.sin(t / 900)) * 0.6, 0.9, t);
  // back hair (behind head and body)
  hairBack(ctx, L.hair, hc, hLine, L.gender, t);
  // legs
  if (!o.robe || sit) {
    if (sit) {
      ctx.beginPath(); ctx.ellipse(-1, -5.2, 8.4, 3.2, 0, 0, Math.PI * 2); blob(ctx, o.pants, shade(o.pants, -0.5));
      ctx.beginPath(); ctx.ellipse(7, -3.2, 3.2, 2, 0, 0, Math.PI * 2); ctx.ellipse(-8.4, -3.2, 3, 2, 0, 0, Math.PI * 2); blob(ctx, o.shoes, shade(o.shoes, -0.5));
    } else {
      for (const [dx, ph] of [[-2.6 + P.legB, -1], [2.8 + P.legA, 1]] as const) {
        const lift = state === 'walk' ? Math.max(0, P.lift * ph) * 1.6 : 0;
        ctx.fillStyle = o.pants; ctx.strokeStyle = shade(o.pants, -0.5); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(dx - 2.4, -12.5, 4.8, 10.5 - lift, 1.5); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(dx + 0.8, -1.6 - lift, 3.4, 2.1, 0, 0, Math.PI * 2); blob(ctx, o.shoes, shade(o.shoes, -0.5), 1);
      }
    }
  } else {
    // feet peeking under robe
    for (const dx of [-3 + P.legB * 0.6, 3.4 + P.legA * 0.6]) {
      ctx.beginPath(); ctx.ellipse(dx + 0.8, -0.8, 3, 1.8, 0, 0, Math.PI * 2); blob(ctx, o.shoes, shade(o.shoes, -0.5), 1);
    }
  }
  torso(ctx, L.cls, o, skin, t, sit);
  if (L.shield) {
    ctx.beginPath(); ctx.ellipse(-6.4, -16, 4.6, 6, 0, 0, Math.PI * 2); blob(ctx, '#b0884a', '#4a3018', 1.1);
    ctx.beginPath(); ctx.ellipse(-6.4, -16, 2.6, 3.6, 0, 0, Math.PI * 2); blob(ctx, '#d8dee8', '#5a6070', 0.8);
  }
  // head
  ctx.beginPath();
  ctx.moveTo(-12.4, -36);
  ctx.bezierCurveTo(-12.6, -48, 13.4, -49, 13.2, -36);
  ctx.bezierCurveTo(13.2, -29, 10, -24.4, 4.4, -24);
  ctx.bezierCurveTo(-3.6, -23.6, -12.2, -27, -12.4, -36);
  ctx.closePath();
  blob(ctx, skin, skinLine, 1.1);
  face(ctx, L.gender, state, t, L.hair === 6);
  if (L.cls === 'assassin' && !L.headLow) {
    ctx.beginPath(); ctx.moveTo(-3.6, -29.4); ctx.quadraticCurveTo(5, -31, 12.6, -28.8); ctx.quadraticCurveTo(11.4, -23.4, 4.6, -23.2); ctx.quadraticCurveTo(-2.6, -24, -3.6, -29.4);
    blob(ctx, o.second, shade(o.second, -0.5), 0.9);
  }
  // headgear: low under hair, mid, then front hair, then top
  if (L.headLow) drawHeadgear(ctx, L.headLow, t, hc);
  hairFront(ctx, L.hair, hc, hLine, hHi);
  brows(ctx, L.gender, state, L.hair === 6, shade(hc, -0.6));
  if (L.headMid) drawHeadgear(ctx, L.headMid, t, hc);
  if (L.headTop) drawHeadgear(ctx, L.headTop, t, hc);

  // front arm + weapon
  const [hx, hy] = limb(ctx, 3.8, -21, P.front, 8.6, 3.8, o.main, shade(o.main, -0.5));
  if (L.wtype !== 'none' && state !== 'dead') {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(-P.weapon * DEG);
    drawWeapon(ctx, L.wtype, L.weaponColor, L.refine, t);
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(hx, hy, 2.2, 0, Math.PI * 2); blob(ctx, skin, skinLine, 0.9);

  if (opts.flash && opts.flash > 0) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(255,80,80,${opts.flash * 0.55})`;
    ctx.fillRect(-30, -70, 60, 75);
  }
  ctx.restore();
}

/** convenience: draw a still portrait (UI) centered in a canvas */
export function heroPortrait(canvas: HTMLCanvasElement, L: HeroLookDraw, opts: { t?: number; state?: string; scale?: number; facing?: 1 | -1 } = {}) {
  const ctx = canvas.getContext('2d')!;
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
  if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const s = (opts.scale ?? h / 72) * dpr;
  ctx.setTransform(s, 0, 0, s, canvas.width / 2, canvas.height - 6 * dpr);
  drawHero(ctx, L, { state: opts.state ?? 'idle', t: opts.t ?? 0, facing: opts.facing ?? 1 });
}
