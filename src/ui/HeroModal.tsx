// The companion popup: tap a portrait on the left rail → this hero's state, quick links to stats / skills / gear,
// role and tactics, party order, and the party's shared orders — the party settings live here instead of a tab.
import { useGame } from './game.ts';
import { Bar, HeroCanvas } from './widgets.tsx';
import { CLASSES } from '../game/data/classes.ts';
import { expNext, jobExpNext } from '../game/exp.ts';
import { HeroTactics, PartyOps, moveHero, roleLabel } from './panels/Party.tsx';
import type { PanelId } from './game.ts';
import type { Hero } from '../game/types.ts';
import { PRESET_NAMES, loadPreset, presetsOf, savePreset } from '../game/explore-actions.ts';

/** 빌드 프리셋 (EXPLORATION.md §7): skill slots, tactics, gear and ammo — stats and skill points stay as they are */
function Presets(props: { h: Hero }) {
  const g = useGame();
  const h = props.h;
  const list = presetsOf(h);
  return (
    <div class="presets-b">
      {PRESET_NAMES.map((name, i) => (
        <div class="row pb-row">
          <b>{list[i]?.name ?? name}</b>
          <span class="small muted">{list[i] ? `스킬 ${list[i]!.skillSlots.filter(Boolean).length}칸 · 장비 ${Object.keys(list[i]!.equip).length}개` : '비어 있음'}</span>
          <span class="sp1" />
          <button class="btn sm" onClick={() => { savePreset(h, i, list[i]?.name ?? name); g.toast(`${name} 프리셋에 저장`, 'good'); g.commit('click'); }}>저장</button>
          <button class="btn sm pri" disabled={!list[i]} onClick={() => {
            const notes = loadPreset(g.s, h, i);
            g.toast(notes.length ? `${name} 불러옴 — ${notes.join(' / ')}` : `${name} 프리셋을 불러왔습니다`, notes.length ? 'bad' : 'good');
            g.commit('confirm');
          }}>불러오기</button>
        </div>
      ))}
      <div class="small muted">스킬 칸 · 전술 · 장비 · 화살을 저장합니다. 스탯과 스킬 포인트는 그대로입니다.</div>
    </div>
  );
}

export function HeroModal(props: { id: number }) {
  const g = useGame();
  const s = g.s;
  const i = s.heroes.findIndex((h) => h.id === props.id);
  const h = s.heroes[i];
  if (!h) return null;
  const u = g.world.heroes.find((x) => x.hero.id === h.id);
  const cls = CLASSES[h.cls];
  const role = roleLabel(g, h);
  const go = (p: PanelId) => { g.sel = i; g.setModal(null); if (g.panel !== p) g.openPanel(p); };
  return (
    <div class="modal hero-modal">
      <div class="win-title"><span>{h.name}</span><span class="sp" /><button class="x" aria-label="닫기" onClick={() => g.popModal()}>×</button></div>
      <div class="win-body">
        <div class="hm-head">
          <span class="hm-face"><HeroCanvas hero={h} zoom={1.25} anchor={4} /></span>
          <div class="hm-info">
            <div class="hm-nm"><b>{h.name}</b>{i === 0 && <i class="lead">리더</i>}<i class="role" style={{ background: role.color }}>{role.name}</i></div>
            <div class="small"><span style={{ color: cls.color }}>{cls.name}</span> · Lv {h.baseLv} · Job {h.jobLv}</div>
            {u && <Bar kind="hp" v={u.hp} max={u.d.maxHp} />}
            {u && <Bar kind="sp" v={u.sp} max={u.d.maxSp} />}
            <div class="hm-exp">
              {(() => {
                const bn = expNext(h.baseLv), jn = jobExpNext(cls.tier, h.jobLv, cls.jobMax);
                const pct = (a: number, b: number) => (Number.isFinite(b) ? `${Math.min(100, (a / b) * 100).toFixed(1)}%` : 'MAX');
                return <>
                  <Bar kind="ex" v={h.baseExp} max={bn} label={`EXP ${pct(h.baseExp, bn)}`} />
                  <Bar kind="jx" v={h.jobExp} max={jn} label={`JOB ${pct(h.jobExp, jn)}`} />
                </>;
              })()}
            </div>
            {u?.doing && <div class="pmem-doing">지금: {u.doing}</div>}
          </div>
        </div>
        <div class="hm-links">
          <button class="btn" onClick={() => go('status')}>스탯{h.statPts > 0 && <i class="hm-pts">+{h.statPts}</i>}</button>
          <button class="btn" onClick={() => go('skills')}>스킬{h.skillPts > 0 && <i class="hm-pts">{h.skillPts}</i>}</button>
          <button class="btn" onClick={() => go('equip')}>장비</button>
        </div>
        <div class="sec">전투 설정</div>
        <HeroTactics h={h} />
        <div class="sec">빌드 프리셋</div>
        <Presets h={h} />
        {s.heroes.length > 1 && (
          <>
            <div class="sec">파티 순서</div>
            <div class="row">
              <span class="small muted">{i === 0 ? '맨 앞 = 리더: 사냥터를 돌며 몹을 끌어옵니다' : `${i + 1}번째`}</span>
              <span class="sp1" />
              <button class="btn sm" disabled={i === 0} onClick={() => moveHero(g, i, -1)}>▲ 앞으로</button>
              <button class="btn sm" disabled={i === s.heroes.length - 1} onClick={() => moveHero(g, i, 1)}>▼ 뒤로</button>
            </div>
          </>
        )}
        <div class="sec">파티 작전 (모두에게 적용)</div>
        <PartyOps />
        {s.heroes.length < s.partySlots && <button class="btn pri block" style={{ marginTop: '8px' }} onClick={() => g.setModal({ kind: 'recruit' })}>+ 새 동료 영입</button>}
        {s.partySlots >= 3 && <button class="btn block" style={{ marginTop: '8px' }} onClick={() => g.pushModal({ kind: 'roster' })}>동료 명단 ({s.bench?.length ?? 0}명 대기)</button>}
      </div>
    </div>
  );
}
