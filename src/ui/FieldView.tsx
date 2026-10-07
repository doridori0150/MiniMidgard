import { useEffect, useRef, useState } from 'preact/hooks';
import { game, useGame } from './game.ts';
import { MONSTERS } from '../game/data/monsters.ts';
import { QuickBar } from './QuickBar.tsx';
import { PartyRail } from './Hud.tsx';

function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (!c) return;
      const w = game.world;
      const z = w.zone;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cw = c.clientWidth, ch = c.clientHeight;
      if (c.width !== cw * dpr) { c.width = cw * dpr; c.height = ch * dpr; }
      const ctx = c.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      const sx = (cw - 6) / z.w, sy = (ch - 6) / z.h;
      ctx.fillStyle = z.theme === 'cave' ? 'rgba(90,70,80,0.5)' : z.theme === 'forest' ? 'rgba(60,110,50,0.5)' : z.theme === 'town' ? 'rgba(180,170,150,0.5)' : 'rgba(110,170,80,0.5)';
      ctx.fillRect(3, 3, z.w * sx, z.h * sy);
      for (const m of w.mobs) {
        if (m.state === 'dead') continue;
        if (m.m.boss) { ctx.fillStyle = m.m.boss === 'mvp' ? '#ffd040' : '#ff8040'; ctx.beginPath(); ctx.arc(3 + m.x * sx, 3 + m.y * sy, 3.2, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.fillStyle = m.m.aggressive ? '#ff5a5a' : '#ffb0b0'; ctx.fillRect(2 + m.x * sx, 2 + m.y * sy, 2, 2); }
      }
      for (const h of w.heroes) {
        ctx.fillStyle = h.state === 'dead' ? '#888' : '#ffffff';
        ctx.strokeStyle = '#2a4aa0'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(3 + h.x * sx, 3 + h.y * sy, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }, 250);
    return () => clearInterval(id);
  }, []);
  return <canvas class="minimap" ref={ref} />;
}

function Gauges() {
  const g = useGame();
  const z = g.world.zone;
  if (!z.boss) return null;
  const p = g.s.progress[z.id];
  const ready = g.world.bossReady();
  const bossAlive = g.world.mobs.some((m) => m.m.boss && m.state !== 'dead');
  return (
    <div class="gauges">
      <div class="gauge boss">
        보스 {p.bossGauge}/{z.bossGauge}
        <div class="mini-bar"><i style={{ width: p.bossGauge / z.bossGauge * 100 + '%' }} /></div>
        {ready.boss && <button onClick={() => { g.world.summonBoss('boss'); g.notify(); }}>{MONSTERS[z.boss].name} 소환</button>}
      </div>
      {z.mvp && <div class="gauge mvp">
        MVP {p.mvpGauge}/{z.mvpGauge}
        <div class="mini-bar"><i style={{ width: p.mvpGauge / z.mvpGauge * 100 + '%' }} /></div>
        {ready.mvp && <button onClick={() => { g.world.summonBoss('mvp'); g.notify(); }}>MVP 소환</button>}
      </div>}
      {bossAlive && <div class="gauge" style={{ color: '#ffb0a0' }}>보스 전투 중!</div>}
    </div>
  );
}

function Chat() {
  const g = useGame();
  const [open, setOpen] = useState(false);
  const lines = g.world.logs.slice(open ? -40 : -6);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; });
  return (
    <>
      <div class={'chat' + (open ? ' open' : '')} ref={ref} onClick={() => open && setOpen(false)}>
        {lines.map((l) => <div key={l.id} style={{ color: l.color }}>{l.text}</div>)}
      </div>
      {!open && <button class="chat-toggle" aria-label="로그 펼치기" onClick={() => setOpen(true)} />}
    </>
  );
}

export function FieldView() {
  const g = useGame();
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    game.attachCanvas(ref.current);
    const ro = new ResizeObserver(() => game.renderer?.resize());
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  // keep the party visible above an open panel
  useEffect(() => {
    const r = game.renderer;
    if (!r || !wrap.current) return;
    const fieldH = wrap.current.clientHeight;
    const appH = wrap.current.parentElement!.clientHeight;
    const sheet = appH * (g.panel === 'equip' || g.panel === 'town' || g.panel === 'map' || g.panel === 'cards' ? 0.78 : 0.6);
    r.insetBottom = g.panel ? Math.max(0, Math.min(fieldH - 90, sheet)) : 84; // keep the party above the quick bar
  }, [g.panel]);
  return (
    <div class="field" ref={wrap}>
      <canvas class="main" ref={ref} />
      <PartyRail />
      <Minimap />
      <Gauges />
      <Chat />
      <QuickBar />
      <div class="announce-wrap">
        {g.announces.map((a) => <div key={a.id} class={'announce ' + a.kind}>{a.text}</div>)}
      </div>
      {g.world.wipeUntil > 0 && <div class="wipe-veil">파티 전멸... 재정비 중</div>}
    </div>
  );
}
