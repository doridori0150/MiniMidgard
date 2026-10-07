// World map panel: illustrated continent with zone pins, a zone card, and monster cards.
import { useState } from 'preact/hooks';
import { useGame } from './game.ts';
import { HeroCanvas, MobCanvas, ElChip, Win, fmt, nameClass, usePainter } from './widgets.tsx';
import { useRef } from 'preact/hooks';
import { ZONES, regions, regionOf, type ZoneDef, type ZoneRole } from '../game/data/zones.ts';
import { MONSTERS, type MonsterDef } from '../game/data/monsters.ts';
import { ITEMS } from '../game/data/items.ts';
import { ELEMENTS, ELEMENT_KO, RACE_KO, SIZE_KO, elementMod } from '../game/data/elements.ts';
import { drawWorldMap } from '../render/worldmap.ts';
import { itemIconURL } from '../render/icons.ts';
import { audio } from '../audio/audio.ts';
import { zoneKnown, gateLines, gateReady, openGate, canEnter } from '../game/state.ts';

type Fit = { label: string; cls: string };
export function zoneFit(z: ZoneDef, avgLv: number): Fit {
  if (z.id === 'town') return { label: '휴식', cls: 'rest' };
  if (avgLv < z.lv[0] - 2) return { label: '위험', cls: 'danger' };
  if (avgLv > z.lv[1] + 4) return { label: '쉬움', cls: 'easy' };
  return { label: '적정', cls: 'good' };
}

const THEME_ICON: Record<string, string> = { town: '🏰', meadow: '🌼', forest: '🌲', cave: '💀', desert: '🌵', snow: '❄️' };

function MapCanvas(props: { unlocked: Set<string> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const last = useRef(0);
  usePainter((t) => {
    if (!ref.current || t - last.current < 80) return;
    last.current = t;
    drawWorldMap(ref.current, props.unlocked, t);
  }, [props.unlocked.size]);
  return <canvas ref={ref} class="wm-canvas" />;
}

export function weakness(m: MonsterDef) {
  const atk = ELEMENTS.filter((e) => e !== 'neutral' || m.element === 'ghost');
  const scored = atk.map((e) => ({ e, v: Math.round(elementMod(e, m.element) * 100) }));
  const weak = scored.filter((x) => x.v > 100).sort((a, b) => b.v - a.v);
  const resist = scored.filter((x) => x.v < 100).sort((a, b) => a.v - b.v);
  const neutral = Math.round(elementMod('neutral', m.element) * 100);
  return { weak, resist, neutral };
}

function MobCard(props: { id: string; onOpen: () => void }) {
  const g = useGame();
  const m = MONSTERS[props.id];
  const book = g.s.book[m.id];
  const w = weakness(m);
  return (
    <button class={'mcard' + (m.boss === 'mvp' ? ' mvp' : m.boss ? ' boss' : '')} onClick={props.onOpen}>
      {m.boss && <span class="mtag">{m.boss === 'mvp' ? 'MVP' : 'BOSS'}</span>}
      <MobCanvas id={m.id} animate={false} />
      <b class="mname">{m.name}</b>
      <span class="mlv">Lv {m.lv}</span>
      <span class="mchips"><ElChip el={m.element} />{m.aggressive && <span class="chip agg">선공</span>}</span>
      {w.weak[0] && <span class="mweak">약점 {ELEMENT_KO[w.weak[0].e]}</span>}
      {book?.card && <span class="mcardgot">🎴</span>}
    </button>
  );
}

const ROLE_KO: Record<ZoneRole, string> = { exp: '경험치', loot: '득템', ore: '광석', zeny: '제니', mvp: 'MVP' };

export function MapPanel() {
  const g = useGame();
  const s = g.s;
  const RG = regions();
  const unlocked = new Set(s.unlocked);
  const avg = s.heroes.reduce((a, h) => a + h.baseLv, 0) / s.heroes.length;
  const [selR, setSelR] = useState<string>(regionOf(s.zone)?.id ?? RG[0].id);
  // null = the region's map list; a zone id = that map's detail
  const [sel, setSel] = useState<string | null>(null);
  const r = RG.find((x) => x.id === selR) ?? RG[0];
  const known = r.zones.filter((z) => zoneKnown(s, z));
  const undiscovered = r.zones.length - known.length;
  const z = sel ? ZONES.find((x) => x.id === sel) : undefined;
  const lvSpan = (zs: ZoneDef[]) => zs.length ? `Lv ${Math.min(...zs.map((x) => x.lv[0]))}~${Math.max(...zs.map((x) => x.lv[1]))}` : '';
  return (
    <Win title="월드 맵" onClose={() => g.openPanel(null)} right={<span class="small" style={{ color: '#dfe8ff' }}>파티 평균 Lv {Math.round(avg)}</span>}>
      <div class="wm">
        <div class="wm-map">
          <MapCanvas unlocked={unlocked} />
          {RG.map((rr) => {
            const open = rr.zones.some((zz) => unlocked.has(zz.id));
            const here = rr.zones.some((zz) => zz.id === s.zone);
            const town = rr.zones[0].id === 'town';
            const kz = rr.zones.filter((zz) => zoneKnown(s, zz) && zz.id !== 'town');
            const f = kz.length ? zoneFit(kz.reduce((best, zz) => (Math.abs((zz.lv[0] + zz.lv[1]) / 2 - avg) < Math.abs((best.lv[0] + best.lv[1]) / 2 - avg) ? zz : best)), avg) : null;
            const bossReady = rr.zones.some((zz) => {
              const pr = s.progress[zz.id];
              return unlocked.has(zz.id) && pr && ((zz.boss && zz.bossGauge > 0 && pr.bossGauge >= zz.bossGauge) || (zz.mvp && zz.mvpGauge > 0 && pr.mvpGauge >= zz.mvpGauge));
            });
            const sealedReady = rr.zones.some((zz) => !unlocked.has(zz.id) && zz.gate && zoneKnown(s, zz) && gateReady(s, zz));
            return (
              <button class={'pin ' + rr.theme + (open ? '' : ' locked') + (selR === rr.id ? ' sel' : '') + (here ? ' here' : '')}
                style={{ left: rr.x + '%', top: rr.y + '%' }}
                onClick={() => { setSelR(rr.id); setSel(null); audio.play('click'); }}>
                {here && <span class="pin-hero"><HeroCanvas hero={s.heroes[0]} face /></span>}
                <span class="pin-dot">{open ? THEME_ICON[rr.theme] : '🔒'}</span>
                <span class="pin-label">
                  <b>{rr.name.replace(/ 지방$/, '')}</b>
                  <span class="pin-lv">{town ? '마을' : lvSpan(kz)}{open && f && <i class={'fit ' + f.cls}>{f.label}</i>}</span>
                </span>
                {bossReady && <span class="pin-boss">👑</span>}
                {sealedReady && <span class="pin-boss" style={{ left: '-6px', right: 'auto' }}>🔮</span>}
              </button>
            );
          })}
          <div class="wm-legend"><i class="fit good">적정</i><i class="fit danger">위험</i><i class="fit easy">쉬움</i></div>
        </div>

        {!z ? (
          <div class={'zcard ' + r.theme}>
            <div class="zc-head">
              <span class="zc-icon">{THEME_ICON[r.theme]}</span>
              <div class="sp1">
                <div class="zc-name">{r.name}</div>
                <div class="zc-sub">{r.zones[0].id === 'town' ? '안전 지대' : `${lvSpan(known)} · 개방 ${known.filter((x) => unlocked.has(x.id)).length}/${known.length}`}</div>
              </div>
            </div>
            <div class="zc-body">
              <div class="mrows">
                {known.map((zz) => {
                  const lk = !unlocked.has(zz.id);
                  const sealed = lk && !!zz.gate;
                  const here = s.zone === zz.id;
                  const f = zoneFit(zz, avg);
                  return (
                    <button key={zz.id} class={'mrow' + (here ? ' here' : '') + (lk ? ' locked' : '') + (sealed ? ' sealed' : '') + (zz.gate ? ' secret' : '')} onClick={() => { setSel(zz.id); audio.play('click'); }}>
                      <span class="mr-kind">{zz.id === 'town' ? '🏰' : sealed ? '🔮' : lk ? '🔒' : zz.kind === 'dungeon' ? '⛏️' : '🌿'}</span>
                      <span class="mr-main">
                        <b>{zz.name}</b>
                        <small>{zz.id === 'town' ? '휴식 · 상점 · 정련' : `Lv ${zz.lv[0]}~${zz.lv[1]}`}{(zz.role ?? []).map((ro) => <i class={'mr-role ' + ro}>{ROLE_KO[ro]}</i>)}</small>
                      </span>
                      <span class="mr-state">{here ? <i class="zc-here">현재</i> : sealed ? <i class="mr-seal">봉인</i> : lk ? null : zz.id !== 'town' && <i class={'fit ' + f.cls}>{f.label}</i>}</span>
                    </button>
                  );
                })}
                {undiscovered > 0 && <div class="mrow-unknown">이 지방 어딘가에 아직 발견하지 못한 장소가 {undiscovered}곳 있다는 소문…</div>}
              </div>
            </div>
          </div>
        ) : (() => {
          const locked = !unlocked.has(z.id);
          const sealed = locked && !!z.gate;
          const blocked = locked ? null : canEnter(s, z);
          const here = s.zone === z.id;
          const fit = zoneFit(z, avg);
          const p = s.progress[z.id];
          const mobs = [...z.mobs.map((e) => e.id), ...(z.boss ? [z.boss] : []), ...(z.mvp ? [z.mvp] : [])];
          return (
            <div class={'zcard ' + z.theme + (locked ? ' locked' : '')}>
              <div class="zc-head">
                <button class="btn xs" onClick={() => setSel(null)} aria-label="지방 목록으로">‹</button>
                <span class="zc-icon">{sealed ? '🔮' : locked ? '🔒' : THEME_ICON[z.theme]}</span>
                <div class="sp1">
                  <div class="zc-name">{z.name}</div>
                  <div class="zc-sub">{z.id === 'town' ? '안전 지대' : `권장 Lv ${z.lv[0]} ~ ${z.lv[1]}`}{!locked && z.id !== 'town' && <i class={'fit ' + fit.cls}>{fit.label}</i>}</div>
                </div>
                {here ? <span class="zc-here">현재 위치</span>
                  : locked ? null
                  : <button class="btn gold zc-go" disabled={!!blocked} onClick={() => { g.travel(z.id); g.openPanel(null); }}>이동</button>}
              </div>
              <div class="zc-body">
                {z.gate && (locked || blocked) ? (
                  <div class="zc-gate">
                    <div class="zc-rumor">“{z.gate.hint}”</div>
                    {(() => {
                      // conditions surface one at a time: everything met so far, plus the next one
                      const lines = gateLines(s, z);
                      const next = lines.findIndex((l) => !l.ok);
                      const shown = next < 0 ? lines : lines.slice(0, next + 1);
                      const unknown = lines.length - shown.length;
                      return (
                        <ul class="zc-needs">
                          {shown.map((l) => <li class={l.ok ? 'ok' : ''}><i>{l.ok ? '✓' : '·'}</i>{l.text}</li>)}
                          {unknown > 0 && <li class="unk"><i>?</i>아직 알 수 없는 조건 {unknown}개</li>}
                        </ul>
                      );
                    })()}
                    {locked && gateReady(s, z) && z.gate.need.some((n) => n.kind === 'item' && n.consume) && (
                      <button class="btn gold block" onClick={() => {
                        g.setModal({ kind: 'confirm', text: `${z.name}의 봉인에 물건을 바칠까요?\n바친 물건은 돌아오지 않습니다.`, ok: () => {
                          const e = openGate(s, z);
                          if (e) { g.toast(e, 'bad'); return; }
                          g.toast(`「${z.name}」의 봉인이 풀렸다!`, 'level');
                          g.announce(`「${z.name}」 개방`, 'unlock');
                          g.commit('levelup');
                        } });
                      }}>봉인에 바치기</button>
                    )}
                    {!locked && blocked && <div class="small muted">{blocked}</div>}
                  </div>
                ) : (
                  <div class="zc-desc">{locked ? `🔒 ${ZONES.find((x) => x.id === z.unlockBy)?.name}의 필드 보스를 처치하면 길이 열립니다.` : z.desc}</div>
                )}
                {!locked && z.specialty && z.specialty.length > 0 && (
                  <div class="zc-spec"><span>특산</span>{z.specialty.filter((id) => ITEMS[id]).map((id) => <button class="spec" onClick={() => g.setModal({ kind: 'item', id })}><img src={itemIconURL(id)} alt="" />{ITEMS[id].name}</button>)}</div>
                )}
                {!locked && ((z.boss && z.bossGauge > 0) || (z.mvp && z.mvpGauge > 0)) && (
                  <div class="zc-gauges">
                    {z.boss && z.bossGauge > 0 && <div><span>보스 게이지</span><div class="mini-bar"><i style={{ width: p.bossGauge / z.bossGauge * 100 + '%', background: 'linear-gradient(#ffb090,#ff6a3a)' }} /></div><small>{p.bossGauge}/{z.bossGauge} · 처치 {p.bossKills}</small></div>}
                    {z.mvp && z.mvpGauge > 0 && <div><span>MVP 게이지</span><div class="mini-bar"><i style={{ width: p.mvpGauge / z.mvpGauge * 100 + '%', background: 'linear-gradient(#fff0a0,#ffb020)' }} /></div><small>{p.mvpGauge}/{z.mvpGauge} · 처치 {p.mvpKills}</small></div>}
                  </div>
                )}
                {mobs.length > 0 && !sealed && (
                  <>
                    <div class="zc-sec">출현 몬스터 <small>누르면 상세 정보</small></div>
                    <div class="mcards">
                      {mobs.map((id) => <MobCard id={id} onOpen={() => g.setModal({ kind: 'mob', id })} />)}
                    </div>
                  </>
                )}
                {z.id === 'town' && <div class="hint">마을에서는 HP·SP가 빠르게 회복됩니다. 상점·정련·미용·전직은 하단 [마을] 탭에서 언제든 이용할 수 있어요.</div>}
              </div>
            </div>
          );
        })()}
      </div>
    </Win>
  );
}

export function MobModal(props: { id: string }) {
  const g = useGame();
  const m = MONSTERS[props.id];
  const book = g.s.book[m.id];
  const w = weakness(m);
  const zone = ZONES.find((z) => z.mobs.some((e) => e.id === m.id) || z.boss === m.id || z.mvp === m.id);
  return (
    <div class="modal">
      <div class="win-title"><span>몬스터 정보</span><span class="sp" /><button class="x" onClick={() => g.setModal(null)}>×</button></div>
      <div class="win-body">
        <div class={'mob-hero ' + (zone?.theme ?? '')}>
          <MobCanvas id={m.id} class="mob-big" />
          <div class="mob-title">
            {m.boss && <span class={'mtag inline ' + (m.boss === 'mvp' ? 'mvp' : 'boss')}>{m.boss === 'mvp' ? 'MVP' : '필드 보스'}</span>}
            <b>{m.name}</b>
            <span>Lv {m.lv} · {zone?.name}</span>
          </div>
        </div>
        <div class="row wrap" style={{ gap: '4px', marginTop: '8px' }}>
          <ElChip el={m.element} /><span class="chip">{RACE_KO[m.race]}형</span><span class="chip">{SIZE_KO[m.size]}</span>
          {m.aggressive ? <span class="chip agg">선공</span> : <span class="chip">비선공</span>}
          {m.range > 60 && <span class="chip">원거리</span>}
          {m.immobile && <span class="chip">이동 불가</span>}
        </div>
        <div class="dv-grid" style={{ marginTop: '8px' }}>
          <div class="dv"><span>HP</span><b>{fmt(m.hp)}</b></div>
          <div class="dv"><span>ATK</span><b>{m.atk[0]}~{m.atk[1]}</b></div>
          <div class="dv"><span>DEF / MDEF</span><b>{m.def} / {m.mdef}</b></div>
          <div class="dv"><span>필요 HIT</span><b>{m.lv + m.agi + 15}</b><small>95% 명중 기준</small></div>
          <div class="dv"><span>필요 FLEE</span><b>{m.lv + m.dex + 75}</b><small>95% 회피 기준</small></div>
          <div class="dv"><span>경험치</span><b>{fmt(m.exp)}</b><small>Job {fmt(m.jexp)}</small></div>
        </div>
        <div class="weak-box">
          <div><b class="good">약점</b> {w.weak.length ? w.weak.map((x) => <span class="wchip"><ElChip el={x.e} /> {x.v}%</span>) : <span class="muted">없음</span>}</div>
          <div><b class="bad">내성</b> {w.resist.length ? w.resist.map((x) => <span class="wchip"><ElChip el={x.e} /> {x.v}%</span>) : <span class="muted">없음</span>}{w.neutral !== 100 && <span class="wchip"><ElChip el="neutral" /> {w.neutral}%</span>}</div>
        </div>
        <div class="desc">{m.desc}</div>
        <div class="zc-sec">드롭 아이템</div>
        <div class="drop-cards">
          {m.drops.map((d) => {
            const it = ITEMS[d.id];
            return (
              <button class={'dcard ' + (it.kind === 'card' ? 'card' : it.rarity ?? (it.kind === 'equip' ? 'rare' : ''))} onClick={() => g.setModal({ kind: 'item', id: d.id })}>
                <img src={itemIconURL(d.id)} alt="" />
                <span class={'dname ' + nameClass(d.id)}>{it.name}{d.slots ? ` [${d.slots}]` : ''}</span>
                <span class="drate">{d.rate >= 0.01 ? (d.rate * 100).toFixed(0) : (d.rate * 100).toFixed(2)}%</span>
              </button>
            );
          })}
        </div>
        <div class="small muted" style={{ marginTop: '8px' }}>처치 {fmt(book?.kills ?? 0)}마리{book?.card ? ' · 카드 획득함 🎴' : ''}</div>
      </div>
    </div>
  );
}
