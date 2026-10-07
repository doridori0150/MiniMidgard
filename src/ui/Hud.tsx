import { game, useGame, type PanelId } from './game.ts';
import { HeroCanvas, fmt } from './widgets.tsx';
import { CLASSES } from '../game/data/classes.ts';
import { canJobChange } from '../game/state.ts';
import { expNext } from '../game/exp.ts';
import { zone } from '../game/data/zones.ts';
import { insertableCards } from './panels/Cards.tsx';

export function Hud() {
  const g = useGame();
  const s = g.s;
  const z = zone(s.zone);
  return (
    <div class="hud">
      <button class="tb-zone" onClick={() => g.openPanel('map')} aria-label="사냥터 지도 열기">
        <b>{z.name}</b><small>{z.id === 'town' ? '휴식' : `Lv ${z.lv[0]}~${z.lv[1]}`}</small>
      </button>
      <span class="sp1" />
      <div class="zeny"><b>{fmt(s.zeny)}</b> z</div>
      <button class="tb-btn" onClick={() => g.openPanel('party')} aria-label="파티">
        <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="3.4" /><circle cx="16.5" cy="9" r="2.8" /><path d="M2.5 20c0-4 2.9-6.6 6.5-6.6s6.5 2.6 6.5 6.6z" /><path d="M16.2 13.4c3 0 5.3 2.2 5.3 5.6h-4.6c0-2.2-.7-4-2-5.3.4-.2.8-.3 1.3-.3z" /></svg>
      </button>
      <button class="tb-btn" onClick={() => g.openPanel('settings')} aria-label="설정">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.3 2h3.4l.5 2.6c.6.2 1.2.5 1.7.9l2.5-.9 1.7 2.9-2 1.8c.1.6.1 1.2 0 1.8l2 1.8-1.7 2.9-2.5-.9c-.5.4-1.1.7-1.7.9l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.2-.5-1.7-.9l-2.5.9-1.7-2.9 2-1.8c-.1-.6-.1-1.2 0-1.8l-2-1.8 1.7-2.9 2.5.9c.5-.4 1.1-.7 1.7-.9zM12 8.6a3.4 3.4 0 100 6.8 3.4 3.4 0 000-6.8z" transform="translate(0 1)" /></svg>
      </button>
    </div>
  );
}

/** party frames on the left edge of the field: portrait + bars; tap → stat window for that hero */
export function PartyRail() {
  const g = useGame();
  const s = g.s;
  const openStatus = (i: number) => {
    const same = g.panel === 'status' && g.sel === i;
    g.sel = i;
    if (same) g.openPanel(null);
    else if (g.panel === 'status') g.notify();
    else g.openPanel('status');
  };
  return (
    <div class="prail">
      {s.heroes.map((h, i) => {
        const u = g.world.heroes[i];
        const hp = u ? Math.max(0, u.hp / u.d.maxHp) : 1;
        const sp = u ? Math.max(0, u.sp / u.d.maxSp) : 1;
        const dead = u?.state === 'dead';
        const cls = CLASSES[h.cls];
        const jobReady = !canJobChange(h);
        return (
          <button key={h.id} class={'pf' + (g.panel && g.sel === i ? ' sel' : '') + (dead ? ' dead' : '')} style={{ '--cc': cls.color }}
            aria-label={`${h.name} 스탯 창 열기`} onClick={() => openStatus(i)}>
            <span class="pf-face"><HeroCanvas hero={h} face zoom={0.74} /><span class="pf-lv">{h.baseLv}</span></span>
            <span class="pf-body">
              <span class="pf-nm">{h.name}</span>
              <span class="pf-cl">{cls.name}<i>J{h.jobLv}</i></span>
              <span class={'pf-bar hp' + (hp < 0.3 ? ' low' : '')}><i style={{ width: hp * 100 + '%' }} /></span>
              <span class="pf-bar sp"><i style={{ width: sp * 100 + '%' }} /></span>
            </span>
            <span class="pf-ex"><i style={{ width: Math.min(100, h.baseExp / expNext(h.baseLv) * 100) + '%' }} /></span>
            {h.statPts > 0 ? <span class="pf-pts">+{h.statPts}</span> : jobReady ? <span class="pf-pts job">전직</span> : null}
            {dead && <span class="pf-dead">부활 대기</span>}
          </button>
        );
      })}
      {s.heroes.length < s.partySlots && <button class="pf-add" onClick={() => g.setModal({ kind: 'recruit' })}>+ 동료 영입</button>}
      {s.heroes.length >= s.partySlots && s.partySlots < 3 && <div class="pf-add lock">🔒 Lv {s.partySlots === 1 ? 10 : 22} 동료</div>}
    </div>
  );
}

const ICONS: Record<string, preact.JSX.Element> = {
  status: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7" r="4" /><path d="M4 21c0-5 3.6-8 8-8s8 3 8 8z" /></svg>,
  skills: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" /></svg>,
  equip: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 3l6.5.5-.5 6.5-9 9-3-3z" /><path d="M3 18l3 3 2-2-3-3z" /><path d="M7 14l3 3-1.5 1.5-3-3z" /></svg>,
  cards: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.2 3.6l9.6 1.7c.9.2 1.5 1 1.3 1.9l-2.3 12.9c-.2.9-1 1.5-1.9 1.3l-9.6-1.7c-.9-.2-1.5-1-1.3-1.9L6.3 4.9c.2-.9 1-1.5 1.9-1.3zm3.3 5.3l-1 2.8-2.9.4 2.2 1.9-.6 2.9 2.6-1.4 2.5 1.6-.4-2.9 2.3-1.8-2.9-.6z" /></svg>,
  bag: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 7V6a4 4 0 018 0v1h3l1 14H4L5 7zm2 0h4V6a2 2 0 00-4 0z" /></svg>,
  map: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2zm6 0v12l6 2V7z" /></svg>,
  town: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 7h-3v10h-5v-6h-2v6H6V10H3z" /></svg>,
};

export function Nav() {
  const g = useGame();
  const s = g.s;
  const skillPts = s.heroes.reduce((a, h) => a + h.skillPts, 0);
  const job = s.heroes.some((h) => !canJobChange(h));
  const cardsReady = insertableCards(s);
  const items: [PanelId, string, preact.JSX.Element | null][] = [
    ['skills', '스킬', job ? <span class="badge glow">전직</span> : skillPts ? <span class="badge">{skillPts}</span> : null],
    ['equip', '장비', null],
    ['cards', '카드', cardsReady ? <span class="badge glow">{cardsReady}</span> : null],
    ['bag', '가방', null],
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
