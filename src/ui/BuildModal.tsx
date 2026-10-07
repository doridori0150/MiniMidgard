// 빌드 고르기: the named builds of this hero's class line (docs/design/BUILD_TREE.md). Picking one makes 추천 분배
// follow its stat axis; each card shows the skills it leans on, its identity items and where they drop, and the
// weakness that becomes the next thing to farm.
import { useGame } from './game.ts';
import { buildsFor, type BuildDef } from '../game/data/builds.ts';
import { ITEMS } from '../game/data/items.ts';
import { MONSTERS } from '../game/data/monsters.ts';
import { SKILLS } from '../game/data/skills.ts';
import { CLASSES } from '../game/data/classes.ts';
import { STAT_KO } from '../game/data/elements.ts';
import type { StatKey } from '../game/types.ts';
import { itemIconURL } from '../render/icons.ts';
import { isTarget, pinTarget, sourcesOf, unpinTarget } from '../game/targets.ts';

export const pct = (r: number) => (r >= 0.01 ? `${Math.round(r * 100)}%` : `${(r * 100).toFixed(r >= 0.001 ? 2 : 3)}%`);

/** 🎯 목표로 / 해제 toggle for any item that drops somewhere */
export function PinButton(props: { id: string; wide?: boolean }) {
  const g = useGame();
  const on = isTarget(g.s, props.id);
  return (
    <button class={'pin-btn' + (on ? ' on' : '') + (props.wide ? ' btn' : '')} aria-pressed={on} onClick={(e) => {
      e.stopPropagation();
      if (on) { unpinTarget(g.s, props.id); g.commit('click'); return; }
      const err = pinTarget(g.s, props.id);
      if (err) { g.toast(err, 'bad'); return; }
      g.toast(`🎯 목표: ${ITEMS[props.id].name}`, 'good'); g.commit('confirm');
    }}>{on ? '🎯 목표 해제' : '🎯 목표로'}</button>
  );
}

function BuildCard(props: { b: BuildDef; on: boolean; pick: () => void }) {
  const { b, on } = props;
  const stats = (Object.entries(b.weights) as [StatKey, number][]).sort((x, y) => y[1] - x[1]);
  const items = b.items.filter((id) => ITEMS[id]);
  return (
    <div class={'bd-card' + (on ? ' on' : '')}>
      <div class="bd-head"><b>{b.name}</b>{on && <i class="bd-on">선택됨</i>}</div>
      <div class="bd-pitch">{b.pitch}</div>
      <div class="bd-stats">{stats.map(([k, w]) => <span class="bd-stat"><b>{STAT_KO[k]}</b><i style={{ width: w * 6 + 'px' }} /></span>)}</div>
      {b.skills.length > 0 && <div class="bd-line"><span>핵심 스킬</span>{b.skills.map((id) => SKILLS[id]?.name).filter(Boolean).join(' · ')}</div>}
      {items.map((id) => {
        const src = sourcesOf(id)[0];
        return (
          <div class="bd-item">
            <img src={itemIconURL(id)} alt="" />
            <div><b>{ITEMS[id].name}</b><small>{src ? `${MONSTERS[src.mob].name} ${pct(src.rate)}${src.zones.length ? ` · ${src.zones[0].name}` : ''}` : '아직 얻을 곳이 없다'}</small></div>
            {src && <PinButton id={id} />}
          </div>
        );
      })}
      <div class="bd-line weak"><span>약점</span>{b.weak}</div>
      <button class={'btn sm ' + (on ? '' : 'pri')} disabled={on} onClick={props.pick}>{on ? '이 빌드로 키우는 중' : '이 빌드로'}</button>
    </div>
  );
}

export function BuildModal(props: { heroId: number }) {
  const g = useGame();
  const h = g.s.heroes.find((x) => x.id === props.heroId);
  if (!h) return null;
  const list = buildsFor(h.cls);
  const pick = (id: string | undefined) => { h.build = id; g.commit('confirm'); g.toast(id ? `${h.name}: ${list.find((b) => b.id === id)?.name} 빌드` : `${h.name}: 기본 추천 분배`, 'good'); };
  return (
    <div class="modal build-modal">
      <div class="win-title"><span>빌드 — {h.name}</span><span class="sp" /><button class="x" aria-label="닫기" onClick={() => g.popModal()}>×</button></div>
      <div class="win-body">
        {list.length === 0 ? (
          <div class="hint">초보자는 1차 전직 후에 빌드를 고를 수 있어요. 직업마다 6~7가지 빌드가 있습니다.</div>
        ) : (
          <>
            <div class="small muted" style={{ margin: '0 2px 8px' }}>{CLASSES[h.cls].name} 계열 빌드 {list.length}가지. 고르면 '추천 분배'가 그 빌드의 스탯 비율을 따릅니다. 장비와 카드를 바꾸면 언제든 다른 빌드로 갈 수 있어요.</div>
            {list.map((b) => <BuildCard b={b} on={h.build === b.id} pick={() => pick(b.id)} />)}
            {h.build && <button class="btn sm" style={{ marginTop: '4px' }} onClick={() => pick(undefined)}>빌드 해제 (기본 추천)</button>}
          </>
        )}
      </div>
    </div>
  );
}
