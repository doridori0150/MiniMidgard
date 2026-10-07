// Mobile-RPG style consumable quick bar (bottom-center of the field) + its setup modal.
import { useRef, useState } from 'preact/hooks';
import { useGame } from './game.ts';
import { ITEMS } from '../game/data/items.ts';
import { quickTrigger, setQuick } from '../game/state.ts';
import { itemIconURL } from '../render/icons.ts';
import { audio } from '../audio/audio.ts';
import { fmt } from './widgets.tsx';

function mmss(ms: number) {
  const t = Math.ceil(ms / 1000);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

function condLabel(id: string, pct: number) {
  const t = quickTrigger(id);
  if (t === 'hp') return { text: `HP${pct}%`, cls: 'hp' };
  if (t === 'sp') return { text: `SP${pct}%`, cls: 'sp' };
  if (t === 'buff') return { text: '유지', cls: 'buff' };
  return { text: '', cls: '' };
}

function QSlot(props: { i: number }) {
  const g = useGame();
  const { i } = props;
  const q = g.s.quick[i];
  const timer = useRef<number | null>(null);
  const long = useRef(false);
  if (!q.id) {
    return (
      <button class="qs empty" aria-label={`퀵슬롯 ${i + 1} 등록`} onClick={() => { audio.play('open'); g.setModal({ kind: 'quick', slot: i }); }}>
        <span class="plus">+</span>
      </button>
    );
  }
  const id = q.id;
  const have = g.s.stacks[id] ?? 0;
  const d = ITEMS[id];
  const trig = quickTrigger(id);
  const left = d.buff ? g.world.buffLeft(d.buff.id) : 0;
  const buffOn = left > 0;
  const running = q.auto && have > 0;
  const used = g.world.quickUsed[i];
  const recent = used !== undefined && g.world.time - used < 650;
  const cond = condLabel(id, q.pct);
  const down = () => {
    long.current = false;
    timer.current = window.setTimeout(() => {
      long.current = true;
      audio.play('open');
      g.setModal({ kind: 'quick', slot: i });
    }, 450);
  };
  // a tap switches this slot's auto use on/off (items are only ever used automatically); long-press = setup
  const up = () => {
    if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; }
    if (long.current) return;
    q.auto = !q.auto;
    g.toast(`${d.name} 자동 사용 ${q.auto ? '켬' : '끔'}`, q.auto ? 'good' : 'info');
    g.commit('click');
  };
  const cancel = () => { if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; } };
  const cls = ['qs', running && !(trig === 'buff' && buffOn) ? 'run' : '', q.auto ? '' : 'off', buffOn ? 'buffing' : '', have <= 0 ? 'out' : '', recent ? 'hot' : ''].join(' ');
  return (
    <button class={cls} style={buffOn ? { '--p': (left / d.buff!.dur) * 100 } as Record<string, number> : undefined}
      role="switch" aria-checked={q.auto} aria-label={`${d.name} ${have}개, 자동 사용 ${q.auto ? '켬' : '끔'}`}
      onPointerDown={down} onPointerUp={up} onPointerLeave={cancel} onPointerCancel={cancel} onContextMenu={(e) => e.preventDefault()}
      // Enter / Space / assistive "click" (no pointer, detail 0) toggle through the same path as a tap
      onClick={(e) => { if (e.detail === 0) { long.current = false; up(); } }}>
      <span class="ring" />
      <span class="inner">
        <img src={itemIconURL(id)} alt="" draggable={false} />
        <span class="cnt">{have > 999 ? '999+' : have}</span>
      </span>
      <span class={'auto' + (q.auto ? '' : ' off')} aria-hidden="true">{q.auto ? 'AUTO' : 'OFF'}</span>
      <span class={'cap ' + (buffOn ? 'buff on' : cond.cls)}>{buffOn ? mmss(left) : cond.text}</span>
      {used !== undefined && <span key={used} class="pop" />}
    </button>
  );
}

export function QuickBar() {
  const g = useGame();
  return (
    <div class="qbar" role="toolbar" aria-label="소비 아이템 퀵슬롯">
      {g.s.quick.map((_, i) => <QSlot i={i} key={i} />)}
      <button class="qedit" aria-label="퀵슬롯 설정" onClick={() => { audio.play('open'); g.setModal({ kind: 'quick', slot: 0 }); }}>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm8.9 2.1l-2-.3a7 7 0 00-.8-1.9l1.2-1.6-1.9-1.9-1.6 1.2a7 7 0 00-1.9-.8l-.3-2h-2.7l-.3 2a7 7 0 00-1.9.8L7 4.9 5.1 6.8l1.2 1.6a7 7 0 00-.8 1.9l-2 .3v2.7l2 .3c.2.7.4 1.3.8 1.9l-1.2 1.6 1.9 1.9 1.6-1.2c.6.4 1.2.6 1.9.8l.3 2h2.7l.3-2c.7-.2 1.3-.4 1.9-.8l1.6 1.2 1.9-1.9-1.2-1.6c.4-.6.6-1.2.8-1.9l2-.3z" /></svg>
      </button>
    </div>
  );
}

export function QuickSetupModal(props: { slot: number }) {
  const g = useGame();
  const s = g.s;
  const [sel, setSel] = useState(props.slot);
  const q = s.quick[sel];
  const owned = Object.entries(s.stacks).filter(([id, n]) => n > 0 && ITEMS[id]?.kind === 'use').sort((a, b) => ITEMS[a[0]].price - ITEMS[b[0]].price);
  const trig = q.id ? quickTrigger(q.id) : 'none';
  const d = q.id ? ITEMS[q.id] : null;
  return (
    <div class="modal qmodal">
      <div class="win-title"><span>퀵슬롯 설정</span><span class="sp" /><button class="x" aria-label="닫기" onClick={() => g.popModal()}>×</button></div>
      <div class="win-body">
        <div class="qpick">
          {s.quick.map((x, i) => (
            <button class={'qp' + (i === sel ? ' on' : '')} onClick={() => { setSel(i); audio.play('click'); }}>
              {x.id ? <img src={itemIconURL(x.id)} alt="" /> : <span class="plus">+</span>}
              <span class="no">{i + 1}</span>
              {x.id && x.auto && <span class="dot" />}
            </button>
          ))}
        </div>
        {d && q.id ? (
          <div class="box qdetail">
            <div class="row">
              <img src={itemIconURL(q.id)} alt="" style={{ width: '32px', height: '32px' }} />
              <div class="sp1">
                <div><b>{d.name}</b> <span class="small muted">보유 {fmt(s.stacks[q.id] ?? 0)}개</span></div>
                <div class="small muted">{d.desc}</div>
              </div>
            </div>
            <button class="set-row" role="switch" aria-checked={q.auto} style={{ marginTop: '8px' }} onClick={() => { q.auto = !q.auto; g.commit('click'); }}>
              <span>자동 사용</span><span class="sp1" /><small>{q.auto ? '켬' : '끔'}</small><span class={'toggle' + (q.auto ? ' on' : '')} aria-hidden="true" />
            </button>
            {(trig === 'hp' || trig === 'sp') && (
              <div class="row" style={{ marginTop: '6px', opacity: q.auto ? 1 : 0.45 }}>
                <span style={{ whiteSpace: 'nowrap' }}>{trig === 'hp' ? 'HP' : 'SP'}가</span>
                <input class="range" type="range" min={10} max={90} step={5} value={q.pct} disabled={!q.auto}
                  onInput={(e) => { q.pct = +(e.target as HTMLInputElement).value; g.commit(); }} />
                <span style={{ whiteSpace: 'nowrap', width: '64px', textAlign: 'right' }}><b>{q.pct}%</b> 이하</span>
              </div>
            )}
            <div class="small muted" style={{ marginTop: '4px' }}>
              {trig === 'buff' ? '효과가 끝나면 자동으로 다시 사용해 파티 전원에게 효과를 유지합니다.'
                : `파티원 중 ${trig === 'hp' ? 'HP' : 'SP'}가 가장 낮은 동료에게 자동으로 먹입니다. 퍼센트가 낮은 슬롯이 우선이라, 비상용 고급 포션은 낮게 설정하세요.`}
            </div>
            <div class="row" style={{ marginTop: '8px' }}>
              <button class="btn sm" onClick={() => { setQuick(s, sel, null); g.commit('close'); }}>슬롯 비우기</button>
              <span class="sp1" />
              <button class="btn sm" onClick={() => { g.setModal(null); g.openTown('tool'); }}>도구 상점</button>
            </div>
          </div>
        ) : (
          <div class="hint">아래에서 {sel + 1}번 슬롯에 등록할 소비 아이템을 고르세요.</div>
        )}
        <div class="sec">가방의 소비 아이템</div>
        <div class="grid">
          {owned.map(([id, n]) => {
            const at = s.quick.findIndex((x) => x.id === id);
            return (
              <button class={'slot' + (q.id === id ? ' rare' : '')} onClick={() => { setQuick(s, sel, id); g.commit('equip'); }} title={ITEMS[id].name}>
                <img src={itemIconURL(id)} alt="" />
                <span class="q">{n > 999 ? '999+' : n}</span>
                {at >= 0 && <span class="eq">{at + 1}</span>}
              </button>
            );
          })}
          {owned.length === 0 && <div class="muted small">소비 아이템이 없습니다. 도구 상점에서 포션을 사세요.</div>}
        </div>
        <div class="small muted" style={{ marginTop: '8px' }}>퀵슬롯을 누를 때마다 그 슬롯의 자동 사용이 켜지고 꺼집니다(AUTO / OFF). 길게 누르면 이 설정 창이 열립니다.</div>
      </div>
    </div>
  );
}
