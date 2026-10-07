import { useEffect, useRef, useState } from 'preact/hooks';
import { game, useGame, type MainTab } from './game.ts';
import { HeroCanvas, fmt, heroReady } from './widgets.tsx';
import { CLASSES } from '../game/data/classes.ts';
import { canJobChange } from '../game/state.ts';
import { expNext } from '../game/exp.ts';
import { zone } from '../game/data/zones.ts';
import { insertableCards } from './panels/Cards.tsx';

export function Hud() {
  const g = useGame();
  const s = g.s;
  const z = zone(s.zone);
  // the wallet reacts when zeny comes in (auto-sold loot, sales, quests)
  const prev = useRef(s.zeny);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (s.zeny > prev.current) setPulse((p) => p + 1);
    prev.current = s.zeny;
  });
  return (
    <div class="hud">
      <button class="tb-zone" onClick={() => g.openPage('explore', 'map')} aria-label="사냥터 지도 열기">
        <b>{z.name}</b><small>{z.id === 'town' ? '휴식' : `Lv ${z.lv[0]}~${z.lv[1]}`}</small>
      </button>
      <span class="sp1" />
      <div class={'zeny' + (pulse ? ' up' : '')} key={pulse}><b>{fmt(s.zeny)}</b> z</div>
      <button class={'tb-btn' + (g.page === 'settings' ? ' on' : '')} onClick={() => (g.page === 'settings' ? g.closeSettings() : g.openPage('settings'))} aria-label="설정" aria-pressed={g.page === 'settings'}>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.3 2h3.4l.5 2.6c.6.2 1.2.5 1.7.9l2.5-.9 1.7 2.9-2 1.8c.1.6.1 1.2 0 1.8l2 1.8-1.7 2.9-2.5-.9c-.5.4-1.1.7-1.7.9l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.2-.5-1.7-.9l-2.5.9-1.7-2.9 2-1.8c-.1-.6-.1-1.2 0-1.8l-2-1.8 1.7-2.9 2.5.9c.5-.4 1.1-.7 1.7-.9zM12 8.6a3.4 3.4 0 100 6.8 3.4 3.4 0 000-6.8z" transform="translate(0 1)" /></svg>
      </button>
    </div>
  );
}

/** party frames on the left edge of the field: portrait + bars; tap → stat window for that hero */
/** chip glyph + colour per buff (colour matches the aura each one draws on the field) */
const BUFF_CHIP: Record<string, [string, string]> = {
  blessing: ['축', '#ffd84a'], agi_up: ['속', '#7ee0f0'], angelus: ['천', '#9fd0ff'], kyrie: ['막', '#9fe0ff'], endure: ['인', '#ffcf60'],
  conc: ['집', '#90ff90'], magnum: ['폭', '#ff7a4a'], quicken: ['가', '#ffd84a'], amp: ['증', '#d080ff'], magnificat: ['찬', '#80b0ff'],
  gloria: ['광', '#ffe080'], impositio: ['손', '#ffd0a0'], edp: ['독', '#b060e0'], adrenaline: ['아', '#ff6a3a'], perfection: ['완', '#e8e8e8'],
  overthrust: ['과', '#ff7070'],
};

export function PartyRail() {
  const g = useGame();
  const s = g.s;
  const openStatus = (i: number) => {
    g.sel = i;
    g.openPage('grow', 'status');
  };
  return (
    <div class="prail">
      {s.heroes.map((h, i) => {
        const u = g.world.heroes[i];
        const hp = u ? Math.max(0, u.hp / u.d.maxHp) : 1;
        const sp = u ? Math.max(0, u.sp / u.d.maxSp) : 1;
        const dead = u?.state === 'dead';
        const cls = CLASSES[h.cls];
        const ready = heroReady(h);
        const buffs = u && !dead ? u.buffs.filter((b) => b.until > g.world.time) : [];
        const shield = u ? buffs.reduce((a, b) => a + (b.shield ?? 0), 0) / u.d.maxHp : 0;
        return (
          <button key={h.id} class={'pf' + (g.panel && g.sel === i ? ' sel' : '') + (dead ? ' dead' : '')} style={{ '--cc': cls.color }}
            aria-label={`${h.name} 스탯 창 열기`} onClick={() => openStatus(i)}>
            <span class="pf-face"><HeroCanvas hero={h} face zoom={0.74} /><span class="pf-lv">{h.baseLv}</span></span>
            <span class="pf-body">
              <span class="pf-nm"><span>{h.name}</span>
                {buffs.length > 0 && <span class="pf-buffs">{buffs.slice(0, 4).map((b) => (
                  <i key={b.id} class={b.until - g.world.time < 3000 ? 'end' : ''} style={{ '--bc': BUFF_CHIP[b.id]?.[1] ?? '#9fb4e6' }} title={b.name}>{BUFF_CHIP[b.id]?.[0] ?? b.name[0]}</i>
                ))}</span>}
              </span>
              <span class="pf-cl">{cls.name}<i>J{h.jobLv}</i></span>
              <span class={'pf-bar hp' + (hp < 0.3 ? ' low' : '')}><i style={{ width: hp * 100 + '%' }} />{shield > 0 && <b class="pf-shield" style={{ width: Math.min(100, shield * 100) + '%' }} />}</span>
              <span class="pf-bar sp"><i style={{ width: sp * 100 + '%' }} /></span>
            </span>
            <span class="pf-ex"><i style={{ width: Math.min(100, h.baseExp / expNext(h.baseLv) * 100) + '%' }} /></span>
            {ready === 'job' ? <span class="pf-pts job">전직</span> : ready ? <span class="pf-pts">{h.statPts > 0 ? `+${h.statPts}` : '스킬'}</span> : null}
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
  hunt: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 20l1-4 9.5-9.5 3 3L8 19z" /><path d="M15.5 5.5l2-2 3 3-2 2z" /><path d="M3 21l2-2 1 1-2 2z" /></svg>,
  party: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="3.4" /><circle cx="16.5" cy="9" r="2.8" /><path d="M2.5 20c0-4 2.9-6.6 6.5-6.6s6.5 2.6 6.5 6.6z" /><path d="M16.2 13.4c3 0 5.3 2.2 5.3 5.6h-4.6c0-2.2-.7-4-2-5.3.4-.2.8-.3 1.3-.3z" /></svg>,
  grow: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" /></svg>,
  gear: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 3l6.5.5-.5 6.5-9 9-3-3z" /><path d="M3 18l3 3 2-2-3-3z" /><path d="M7 14l3 3-1.5 1.5-3-3z" /></svg>,
  explore: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2zm6 0v12l6 2V7z" /></svg>,
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
  // badges only when there is something the player can actually do (codex_r2 §4-7)
  const ready = s.heroes.map((h) => heroReady(h));
  const grow = ready.includes('job') ? <span class="badge glow">전직</span> : ready.includes('grow') ? <span class="badge dot" /> : null;
  // red-dot discipline: only for cards found since the card tab was last opened, and only if one can go in a slot
  const cardsReady = s.totals.cards > (s.cardSeen ?? 0) && insertableCards(s) > 0;
  const items: [MainTab | null, string, preact.JSX.Element | null, string][] = [
    [null, '사냥', null, '사냥 화면'],
    ['party', '파티', null, '파티 작전'],
    ['grow', '성장', grow, ready.includes('job') ? '성장 (전직 가능)' : ready.includes('grow') ? '성장 (포인트 사용 가능)' : '성장'],
    ['gear', '장비', null, '장비와 가방'],
    ['cards', '카드', cardsReady ? <span class="badge dot" /> : null, cardsReady ? '카드 (꽂을 수 있는 새 카드)' : '카드'],
    ['explore', '탐험', null, '지도와 마을'],
  ];
  return (
    <nav class="nav">
      {items.map(([id, label, badge, aria]) => {
        const on = id === null ? g.page === null : g.page === id;
        return (
          <button class={on ? 'on' : ''} aria-current={on ? 'page' : undefined} aria-label={aria} onClick={() => g.openPage(id)}>
            {ICONS[id ?? 'hunt']}
            <span>{label}</span>
            {badge}
          </button>
        );
      })}
    </nav>
  );
}
