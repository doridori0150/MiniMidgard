import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { Element, EquipInst, Hero } from '../game/types.ts';
import { inked } from '../render/ink.ts';
import { drawHero, type HeroLookDraw } from '../render/hero.ts';
import { drawMob, mobHeight } from '../render/monster.ts';
import { itemIconURL, drawCardArt } from '../render/icons.ts';
import { heroLookDraw } from '../render/field.ts';
import { ELEMENT_COLOR, ELEMENT_KO } from '../game/data/elements.ts';
import { ITEMS } from '../game/data/items.ts';
import { MONSTERS } from '../game/data/monsters.ts';
import { CLASSES } from '../game/data/classes.ts';
import { itemName } from '../game/state.ts';
import { game } from './game.ts';

// one shared animation ticker for all small canvases
const painters = new Set<(t: number) => void>();
let ticking = false;
function tick(t: number) {
  for (const p of painters) p(t);
  if (painters.size) requestAnimationFrame(tick); else ticking = false;
}
export function usePainter(fn: (t: number) => void, deps: unknown[]) {
  useEffect(() => {
    painters.add(fn);
    if (!ticking) { ticking = true; requestAnimationFrame(tick); }
    return () => { painters.delete(fn); };
  }, deps);
}

function prep(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  const w = c.clientWidth, h = c.clientHeight;
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  const ctx = c.getContext('2d')!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, c.width, c.height);
  return ctx;
}

export function LookCanvas(props: { look: HeroLookDraw; state?: string; class?: string; zoom?: number; anchor?: number; face?: boolean; animate?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const lookRef = useRef(props.look);
  lookRef.current = props.look;
  const draw = (t: number) => {
    const c = ref.current;
    if (!c || !c.clientWidth) return;
    const ctx = prep(c);
    const dpr = c.width / c.clientWidth;
    const h = c.clientHeight;
    const s = (props.zoom ?? h / 70) * dpr;
    if (props.face) {
      ctx.setTransform(s, 0, 0, s, c.width / 2, c.height + 16 * s);
    } else {
      ctx.setTransform(s, 0, 0, s, c.width / 2, c.height - (props.anchor ?? 5) * dpr);
    }
    const pose = { state: props.state ?? 'idle', t, facing: 1 as const };
    if (!props.face) {
      ctx.fillStyle = 'rgba(20,30,20,0.28)';
      ctx.beginPath(); ctx.ellipse(0, 0, 11, 3.8, 0, 0, Math.PI * 2); ctx.fill();
    }
    inked(ctx, 120, 120, 60, 106, 1.25, (c) => drawHero(c, lookRef.current, pose, { shadow: false }));
  };
  if (props.animate === false) {
    useEffect(() => { draw(800); });
  } else {
    usePainter(draw, [props.state, props.zoom, props.face]);
  }
  return <canvas ref={ref} class={props.class} />;
}

export function HeroCanvas(props: { hero: Hero; state?: string; class?: string; zoom?: number; face?: boolean; anchor?: number; animate?: boolean }) {
  const look = heroLookDraw(game.s, props.hero);
  return <LookCanvas look={look} state={props.state} class={props.class} zoom={props.zoom} face={props.face} anchor={props.anchor} animate={props.animate} />;
}

export function MobCanvas(props: { id: string; class?: string; animate?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = (t: number) => {
    const c = ref.current;
    if (!c || !c.clientWidth) return;
    const m = MONSTERS[props.id];
    const ctx = prep(c);
    const dpr = c.width / c.clientWidth;
    const h = mobHeight(m.sprite);
    const s = Math.min(c.clientHeight * 0.78 / h, c.clientWidth * 0.8 / 30) * dpr;
    ctx.setTransform(s, 0, 0, s, c.width / 2, c.height - 4 * dpr);
    drawMob(ctx, m.sprite, m.palette, { state: 'idle', t, facing: 1, hurt: 0, frozen: false, spawn: 1, dead: 0 }, 1);
  };
  if (props.animate === false) useEffect(() => { draw(600); }, [props.id]);
  else usePainter(draw, [props.id]);
  return <canvas ref={ref} class={props.class} />;
}

export function CardArt(props: { id: string; w?: number; h?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (ref.current) drawCardArt(ref.current, props.id.replace('c_', '')); }, [props.id]);
  return <canvas ref={ref} style={{ width: (props.w ?? 140) + 'px', height: (props.h ?? 196) + 'px' }} />;
}

export function Win(props: { title: string; onClose?: () => void; children: ComponentChildren; right?: ComponentChildren }) {
  return (
    <div class="win">
      <div class="win-title">
        <span>{props.title}</span>
        <span class="sp" />
        {props.right}
        {props.onClose && <button class="x" onClick={props.onClose}>×</button>}
      </div>
      {props.children}
    </div>
  );
}

export function Bar(props: { kind: 'hp' | 'sp' | 'ex' | 'jx'; v: number; max: number; label?: string }) {
  const r = props.max > 0 && isFinite(props.max) ? Math.max(0, Math.min(1, props.v / props.max)) : 1;
  return <div class={'bar ' + props.kind}><i style={{ width: r * 100 + '%' }} /><b>{props.label ?? `${Math.floor(props.v)} / ${props.max}`}</b></div>;
}

export function ElChip(props: { el: Element }) {
  return <span class="chip el" style={{ background: ELEMENT_COLOR[props.el] }}>{ELEMENT_KO[props.el]}</span>;
}

export function rarityOf(id: string): string {
  const d = ITEMS[id];
  if (d.kind === 'card') return 'card';
  return d.rarity ?? 'common';
}

export function nameClass(id: string) {
  const r = ITEMS[id].rarity;
  return r === 'rare' ? 'name-rare' : r === 'epic' ? 'name-epic' : r === 'mvp' ? 'name-mvp' : '';
}

export function ItemSlot(props: { id: string; inst?: EquipInst; qty?: number; equipped?: boolean; onClick?: () => void }) {
  const { id, inst } = props;
  const r = rarityOf(id);
  return (
    <button class={'slot ' + r} onClick={props.onClick} title={inst ? itemName(inst) : ITEMS[id].name}>
      <img src={itemIconURL(id)} alt="" draggable={false} />
      {inst && inst.refine > 0 && <span class="r">+{inst.refine}</span>}
      {props.equipped && <span class="eq">E</span>}
      {inst && inst.slots > 0 && <span class="dots">{inst.cards.map((c) => <i class={c ? 'f' : ''} />)}</span>}
      {props.qty !== undefined && props.qty > 1 && <span class="q">{props.qty > 999 ? '999+' : props.qty}</span>}
    </button>
  );
}

export function HeroTabs(props: { sel: number; onSel: (i: number) => void }) {
  const s = game.s;
  if (s.heroes.length < 2) return null;
  return (
    <div class="hero-tabs">
      {s.heroes.map((h, i) => (
        <button class={i === props.sel ? 'on' : ''} onClick={() => props.onSel(i)}>
          <span style={{ color: CLASSES[h.cls].color }}>●</span><span>{h.name}</span>
        </button>
      ))}
    </div>
  );
}

export function fmt(n: number): string {
  return Math.floor(n).toLocaleString('ko-KR');
}

export function dur(ms: number): string {
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}분`;
  return `${Math.floor(m / 60)}시간 ${m % 60}분`;
}
