// 목표 핀 UI: a slim line under the EXP strip with the first target, and the target list — where each item drops,
// the party's odds against that monster, kills since pinning against the expected number, and a way to go there.
import { useGame } from './game.ts';
import { ITEMS } from '../game/data/items.ts';
import { MONSTERS, type MonsterDef } from '../game/data/monsters.ts';
import { computeDerived } from '../game/stats.ts';
import { canEnter } from '../game/state.ts';
import { sourcesOf, targetKills, targets, unpinTarget, suggestTargets, pinTarget } from '../game/targets.ts';
import { itemIconURL } from '../render/icons.ts';
import { pct } from './BuildModal.tsx';
import { fmt } from './widgets.tsx';

export function TargetStrip() {
  const g = useGame();
  const list = targets(g.s);
  if (!list.length) return null;
  const t = list[0];
  const src = sourcesOf(t.id)[0];
  const kills = targetKills(g.s, t);
  return (
    <button class="tstrip" onClick={() => g.setModal({ kind: 'targets' })} aria-label="목표 보기">
      <span class="ts-pin">🎯</span>
      <img src={itemIconURL(t.id)} alt="" />
      <b>{ITEMS[t.id].name}</b>
      {src && <small>{MONSTERS[src.mob].name} {pct(src.rate)} · 처치 {fmt(kills)}{src.rate > 0 ? ` / 약 ${fmt(Math.round(1 / src.rate))}` : ''}</small>}
      {list.length > 1 && <i class="ts-more">+{list.length - 1}</i>}
    </button>
  );
}

/** how the party fares against a monster (RO formulas; crits count as hits) */
function odds(g: ReturnType<typeof useGame>, m: MonsterDef) {
  let hit = 0, dodge = 0;
  g.s.heroes.forEach((h, i) => {
    const d = g.world.heroes[i]?.d ?? computeDerived(g.s, h);
    const base = Math.max(5, Math.min(100, 80 + d.hit - (m.lv + m.agi)));
    const crit = Math.max(0, d.crit - m.luk * 0.2) * (1 - (m.critRes ?? (m.boss === 'mvp' ? 0.5 : m.boss ? 0.25 : 0)));
    hit = Math.max(hit, Math.min(100, base + (100 - base) * crit / 100));
    dodge = Math.max(dodge, 100 - Math.max(5, Math.min(95, 80 + m.lv + m.dex - d.flee)));
  });
  return { hit: Math.round(hit), dodge: Math.round(dodge) };
}

export function TargetsModal() {
  const g = useGame();
  const s = g.s;
  const list = targets(s);
  const ideas = suggestTargets(s, g.s.heroes[0]).filter((id) => !list.some((t) => t.id === id));
  return (
    <div class="modal targets-modal">
      <div class="win-title"><span>🎯 목표</span><span class="sp" /><button class="x" aria-label="닫기" onClick={() => g.popModal()}>×</button></div>
      <div class="win-body">
        {list.length === 0 && <div class="hint">아이템 정보·빌드 화면에서 '🎯 목표로'를 누르면 여기서 어디서 나오는지, 얼마나 잡았는지 볼 수 있어요. (최대 3개)</div>}
        {list.map((t) => {
          const srcs = sourcesOf(t.id).slice(0, 3);
          const kills = targetKills(s, t);
          return (
            <div class="tg-card">
              <div class="tg-head">
                <img src={itemIconURL(t.id)} alt="" />
                <div><b>{ITEMS[t.id].name}</b><small>{ITEMS[t.id].desc.split('\n').slice(1, 2).join('') || ITEMS[t.id].desc.split('\n')[0]}</small></div>
                <button class="btn sm" onClick={() => { unpinTarget(s, t.id); g.commit('click'); }}>해제</button>
              </div>
              <div class="tg-prog">처치 <b>{fmt(kills)}</b>{srcs[0] ? <> · 기대값 약 {fmt(Math.round(1 / srcs[0].rate))}마리</> : null}</div>
              {srcs.map((x) => {
                const m = MONSTERS[x.mob];
                const o = odds(g, m);
                const z = x.zones.find((zz) => !canEnter(s, zz)) ?? x.zones[0];
                const open = z && !canEnter(s, z);
                return (
                  <div class="tg-src">
                    <div class="tg-mob"><b>{m.name}</b> <span class="muted">Lv {m.lv}{m.boss ? (m.boss === 'mvp' ? ' · MVP' : ' · 보스') : ''}</span> <i>{pct(x.rate)}</i></div>
                    <div class="tg-meta">
                      <span class={o.hit >= 85 ? 'good' : o.hit >= 65 ? 'ok' : 'bad'}>명중 {o.hit}%</span>
                      <span class={o.dodge >= 50 ? 'good' : o.dodge >= 20 ? 'ok' : 'bad'}>회피 {o.dodge}%</span>
                      <span>{z ? z.name : '알 수 없는 곳'}</span>
                      {z && (open
                        ? (s.zone === z.id ? <span class="tg-here">사냥 중</span> : <button class="btn sm gold" onClick={() => { g.setModal(null); g.travel(z.id); }}>이동</button>)
                        : <span class="muted">{canEnter(s, z)}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        {ideas.length > 0 && list.length < 3 && (
          <>
            <div class="sec">추천 목표 (빌드)</div>
            {ideas.map((id) => (
              <div class="tg-idea">
                <img src={itemIconURL(id)} alt="" /><b>{ITEMS[id].name}</b><span class="sp1" />
                <button class="btn sm pri" onClick={() => { const e = pinTarget(s, id); if (e) g.toast(e, 'bad'); else g.commit('confirm'); }}>🎯 목표로</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
