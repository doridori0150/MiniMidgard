import { game, useGame, type PanelId } from './game.ts';
import { HeroCanvas, fmt } from './widgets.tsx';
import { CLASSES } from '../game/data/classes.ts';
import { canJobChange } from '../game/state.ts';
import { expNext } from '../game/exp.ts';

export function Hud() {
  const g = useGame();
  const s = g.s;
  const slots = [0, 1, 2];
  return (
    <div class="hud">
      {slots.map((i) => {
        const h = s.heroes[i];
        if (!h) {
          if (i < s.partySlots) return <div class="pm add" onClick={() => g.setModal({ kind: 'recruit' })}><b>+ 동료 영입</b><span class="small">슬롯 개방됨</span></div>;
          return <div class="pm add lock"><span class="small">🔒 {i === 1 ? 'Lv 10' : 'Lv 22'}</span><span class="small">파티 슬롯</span></div>;
        }
        const u = g.world.heroes[i];
        const hp = u ? u.hp / u.d.maxHp : 1;
        const sp = u ? u.sp / u.d.maxSp : 1;
        const alert = h.statPts > 0 || h.skillPts > 0 || !canJobChange(h);
        return (
          <div class={'pm' + (g.sel === i ? ' sel' : '') + (u?.state === 'dead' ? ' dead' : '')} onClick={() => { g.sel = i; g.notify(); }}>
            <HeroCanvas hero={h} face class="" />
            <div class="info">
              <div class="nm">{h.name}</div>
              <div class="cl"><span style={{ color: CLASSES[h.cls].color }}>{CLASSES[h.cls].name}</span> Lv{h.baseLv}·J{h.jobLv}</div>
              <div class={'mini-bar hp' + (hp < 0.3 ? ' low' : '')}><i style={{ width: hp * 100 + '%' }} /></div>
              <div class="mini-bar sp"><i style={{ width: sp * 100 + '%' }} /></div>
              <div class="mini-bar ex"><i style={{ width: Math.min(100, h.baseExp / expNext(h.baseLv) * 100) + '%' }} /></div>
            </div>
            {alert && <span class="dot" />}
          </div>
        );
      })}
      <div class="hud-side">
        <div class="zeny"><b>{fmt(s.zeny)}</b> z</div>
        <button class="icon-btn" onClick={() => g.openPanel('party')}>파티</button>
        <button class="icon-btn" onClick={() => g.openPanel('settings')}>설정</button>
      </div>
    </div>
  );
}

const ICONS: Record<string, preact.JSX.Element> = {
  status: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7" r="4" /><path d="M4 21c0-5 3.6-8 8-8s8 3 8 8z" /></svg>,
  skills: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" /></svg>,
  equip: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 3l6.5.5-.5 6.5-9 9-3-3z" /><path d="M3 18l3 3 2-2-3-3z" /><path d="M7 14l3 3-1.5 1.5-3-3z" /></svg>,
  bag: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 7V6a4 4 0 018 0v1h3l1 14H4L5 7zm2 0h4V6a2 2 0 00-4 0z" /></svg>,
  map: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2zm6 0v12l6 2V7z" /></svg>,
  town: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 7h-3v10h-5v-6h-2v6H6V10H3z" /></svg>,
};

export function Nav() {
  const g = useGame();
  const s = g.s;
  const statPts = s.heroes.some((h) => h.statPts > 0);
  const skillPts = s.heroes.reduce((a, h) => a + h.skillPts, 0);
  const job = s.heroes.some((h) => !canJobChange(h));
  const newCards = s.stacks && Object.keys(s.stacks).some((k) => k.startsWith('c_'));
  const items: [PanelId, string, preact.JSX.Element | null][] = [
    ['status', '상태', statPts ? <span class="badge">!</span> : null],
    ['skills', '스킬', job ? <span class="badge glow">전직</span> : skillPts ? <span class="badge">{skillPts}</span> : null],
    ['equip', '장비', null],
    ['bag', '가방', newCards ? <span class="badge glow">C</span> : null],
    ['map', '사냥터', null],
    ['town', '마을', null],
  ];
  return (
    <div class="nav">
      {items.map(([id, label, badge]) => (
        <button class={g.panel === id ? 'on' : ''} onClick={() => game.openPanel(id)}>
          {ICONS[id]}
          <span>{label}</span>
          {badge}
        </button>
      ))}
    </div>
  );
}
