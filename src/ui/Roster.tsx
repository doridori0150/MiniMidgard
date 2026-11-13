// 동료 명단 (ENDGAME.md §2): who is out hunting (3 seats) and who waits on the bench (training at a quarter share).
// Swap a benched hero in for someone, or send someone to rest; the matchup chips of each hero's build help pick.
import { useState } from 'preact/hooks';
import { useGame } from './game.ts';
import { CLASSES } from '../game/data/classes.ts';
import { buildOf, matchups, PROFILES } from '../game/data/builds.ts';
import { benchSlots, rosterRoom, sendOut, sendToBench } from '../game/state.ts';
import type { Hero } from '../game/types.ts';
import { HeroCanvas } from './widgets.tsx';
import { ZONES, zone as zoneDef } from '../game/data/zones.ts';
import { ITEMS } from '../game/data/items.ts';
import { explorePct } from '../game/explore.ts';
import { EXPEDITION_MAX, expeditionHeroes, recallExpedition, sendExpedition } from '../game/explore-actions.ts';

/** 벤치 탐험대 (EXPLORATION.md §6): send up to three benched heroes to walk a map while the party hunts elsewhere */
function ExpeditionBox() {
  const g = useGame();
  const s = g.s;
  const bench = s.bench ?? [];
  const e = s.expedition;
  const maps = ZONES.filter((z) => z.id !== 'town' && s.unlocked.includes(z.id));
  const [pick, setPick] = useState<number[]>([]);
  const [zid, setZid] = useState<string>(maps.find((z) => explorePct(s, z.id) < 100)?.id ?? maps[0]?.id ?? '');
  if (!bench.length && !e) return null;
  if (e) {
    const team = expeditionHeroes(s);
    const carry = Object.entries(e.carry);
    return (
      <div class="exp-box">
        <div class="sec">탐험대 · {zoneDef(e.zone).name}</div>
        <div class="small">{team.map((h) => h.name).join(', ')} · 탐험도 {explorePct(s, e.zone)}%{carry.length ? ` · 짐 ${carry.reduce((a, [, n]) => a + n, 0)}개` : ''}</div>
        <div class="small muted">싸우지 않고 맵을 걸으며 이야기 흔적 · 석등 · 보물을 찾습니다. 맵 레벨보다 낮은 동료는 절반 속도입니다.</div>
        <button class="btn sm" style={{ marginTop: '6px' }} onClick={() => {
          const got = recallExpedition(s);
          const list = Object.entries(got).map(([id, n]) => `${ITEMS[id]?.name ?? id} ×${n}`).join(', ');
          g.toast(list ? `탐험대 귀환: ${list}` : '탐험대가 돌아왔습니다.', 'good');
          g.commit('confirm');
        }}>불러들이기</button>
      </div>
    );
  }
  const toggle = (id: number) => setPick((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < EXPEDITION_MAX ? [...p, id] : p));
  return (
    <div class="exp-box">
      <div class="sec">탐험대 보내기 <small>명단에서 {EXPEDITION_MAX}명까지</small></div>
      <div class="exp-pick">{bench.map((h) => <button class={'btn xs' + (pick.includes(h.id) ? ' gold' : '')} onClick={() => toggle(h.id)}>{h.name} Lv {h.baseLv}</button>)}</div>
      <select class="exp-zone" value={zid} onChange={(ev) => setZid((ev.target as HTMLSelectElement).value)}>
        {maps.map((z) => <option value={z.id}>{z.name} (Lv {z.lv[0]}~{z.lv[1]}) · 탐험도 {explorePct(s, z.id)}%</option>)}
      </select>
      <button class="btn sm pri" disabled={!pick.length || !zid} onClick={() => {
        const err = sendExpedition(s, zid, pick);
        if (err) { g.toast(err, 'bad'); return; }
        setPick([]);
        g.toast(`탐험대 출발: ${zoneDef(zid).name}`, 'good');
        g.commit('confirm');
      }}>보내기</button>
    </div>
  );
}

function Row(props: { h: Hero; children?: preact.ComponentChildren }) {
  const { h } = props;
  const b = buildOf(h.cls, h.build);
  const mu = matchups(b ? PROFILES[b.id] : undefined);
  return (
    <div class="ro-row">
      <span class="ro-face"><HeroCanvas hero={h} face zoom={0.7} /></span>
      <div class="ro-mid">
        <div><b>{h.name}</b> <span class="small" style={{ color: CLASSES[h.cls].color }}>{CLASSES[h.cls].name}</span> <span class="small muted">Lv {h.baseLv} · J{h.jobLv}</span></div>
        <div class="small muted">{b ? b.name : '빌드 없음'}</div>
        {(mu.strong.length > 0 || mu.weak.length > 0) && (
          <div class="bd-mu">{mu.strong.slice(0, 3).map((x) => <span class="mu good">강 · {x}</span>)}{mu.weak.slice(0, 2).map((x) => <span class="mu bad">약 · {x}</span>)}</div>
        )}
      </div>
      <div class="ro-act">{props.children}</div>
    </div>
  );
}

export function RosterModal() {
  const g = useGame();
  const s = g.s;
  const bench = s.bench ?? [];
  const seats = benchSlots(s);
  // a benched hero picked to go out, waiting for whom to replace
  const [pick, setPick] = useState<number | null>(null);
  const out = (bi: number, oi?: number) => {
    const e = sendOut(s, bi, oi);
    if (e) { g.toast(e, 'bad'); return; }
    setPick(null);
    g.commit('confirm');
  };
  return (
    <div class="modal roster-modal">
      <div class="win-title"><span>동료 명단</span><span class="sp" /><button class="x" aria-label="닫기" onClick={() => g.popModal()}>×</button></div>
      <div class="win-body">
        <div class="sec">출전 {s.heroes.length}/{s.partySlots}</div>
        {s.heroes.map((h, i) => (
          <Row h={h}>
            {pick !== null
              ? <button class="btn sm gold" onClick={() => out(pick, i)}>이 자리로</button>
              : s.heroes.length > 1 && bench.length < seats && <button class="btn sm" onClick={() => { const e = sendToBench(s, i); if (e) g.toast(e, 'bad'); else g.commit('click'); }}>명단으로</button>}
          </Row>
        ))}
        <div class="sec">명단 {bench.length}/{seats}</div>
        {seats === 0 && <div class="hint">Lv 30부터 10레벨마다 명단 자리가 하나씩 늘어나요(최대 6). 명단의 동료는 파티가 얻는 경험치의 25%를 받으며 훈련합니다.</div>}
        {bench.map((h, i) => (
          <Row h={h}>
            {pick === i
              ? <button class="btn sm" onClick={() => setPick(null)}>취소</button>
              : <button class="btn sm pri" onClick={() => (s.heroes.length < s.partySlots ? out(i) : setPick(i))}>출전</button>}
          </Row>
        ))}
        {pick !== null && <div class="hint">위의 출전 동료 중 교체할 자리를 고르세요.</div>}
        <ExpeditionBox />
        {rosterRoom(s) && <button class="btn pri block" style={{ marginTop: '8px' }} onClick={() => g.pushModal({ kind: 'recruit' })}>+ 새 동료 영입 ({rosterRoom(s) === 'party' ? '바로 출전' : '명단으로'})</button>}
        <div class="small muted" style={{ marginTop: '8px' }}>상대에 맞춰 3명을 고르세요. 빌드마다 강한 상대·약한 상대가 다릅니다.</div>
      </div>
    </div>
  );
}
