// 균열 (docs/design/ENDGAME.md §3, src/game/rift.ts): the entry screen behind the town's 균열 관리인, the compact rift
// gauge in the field's gauge column, and the result card when a run ends. Layout stays as it is: the entry screen is a
// town view, the gauge takes the place of the boss gauges while inside.
import { useGame } from './game.ts';
import { HeroCanvas, fmt } from './widgets.tsx';
import { CLASSES } from '../game/data/classes.ts';
import { MONSTERS } from '../game/data/monsters.ts';
import { buildOf, matchups } from '../game/data/builds.ts';
import { GRADE_KO, type Grade } from '../game/gear.ts';
import {
  AFFIXES, MECHS, RIFT_UNLOCK_LV, RULES, applyLineup, desiredTier, ensurePlan, essence, firstClearReward, fmtClock, heroFit, heroProfile,
  recommendLineup, riftLevel, riftSave, riftUnlocked, riftWeek, ruleName, type GuardianMech, type RiftRuleId,
} from '../game/rift.ts';
import { allHeroes } from '../game/state.ts';
import type { Hero, RiftPlan } from '../game/types.ts';

function FitBadge(props: { v: number }) {
  const v = props.v;
  return <span class={'rf-fit ' + (v > 0 ? 'good' : v < 0 ? 'bad' : '')}>{v > 0 ? `상성 +${v}` : v < 0 ? `상성 ${v}` : '상성 ±0'}</span>;
}

function HeroLine(props: { h: Hero; plan: RiftPlan }) {
  const { h, plan } = props;
  const { p, own } = heroProfile(h);
  const mu = matchups(p);
  const b = buildOf(h.cls, h.build);
  return (
    <div class="ro-row rf-hero">
      <span class="ro-face"><HeroCanvas hero={h} face zoom={0.7} /></span>
      <div class="ro-mid">
        <div><b>{h.name}</b> <span class="small" style={{ color: CLASSES[h.cls].color }}>{CLASSES[h.cls].name}</span> <span class="small muted">Lv {h.baseLv}</span> <FitBadge v={heroFit(h, plan.rules)} /></div>
        <div class="small muted">{b ? b.name : '빌드 없음'}{!own ? ' (직업 기본으로 판단)' : ''}</div>
        {(mu.strong.length > 0 || mu.weak.length > 0) && (
          <div class="bd-mu">{mu.strong.slice(0, 3).map((x) => <span class="mu good">강 · {x}</span>)}{mu.weak.slice(0, 2).map((x) => <span class="mu bad">약 · {x}</span>)}</div>
        )}
      </div>
    </div>
  );
}

/** the town view of 균열 관리인 시엘: record, this run's rules, the line-up and auto-retry */
export function RiftView() {
  const g = useGame();
  const s = g.s;
  if (!riftUnlocked(s)) {
    const best = allHeroes(s).slice().sort((a, b) => b.baseLv - a.baseLv)[0];
    return (
      <div class="rift-view">
        <div class="rift-head locked">
          <b>🌀 균열</b>
          <span>「균열 너머는 끝이 없어요. 2차 직업에 오른 Lv {RIFT_UNLOCK_LV} 이상의 동료가 있어야 버틸 수 있답니다.」</span>
        </div>
        <div class="box small">
          {allHeroes(s).map((h) => (
            <div class="row" style={{ gap: '6px', padding: '3px 0' }}>
              <b>{h.name}</b><span style={{ color: CLASSES[h.cls].color }}>{CLASSES[h.cls].name}</span><span class="sp1" />
              <span class={CLASSES[h.cls].tier === 2 ? 'good-t' : 'muted'}>{CLASSES[h.cls].tier === 2 ? '2차 직업 ✓' : '2차 직업 필요'}</span>
              <span class={h.baseLv >= RIFT_UNLOCK_LV ? 'good-t' : 'muted'}>Lv {h.baseLv}/{RIFT_UNLOCK_LV}</span>
            </div>
          ))}
        </div>
        <div class="hint" style={{ marginTop: '8px' }}>균열은 단계가 끝없이 올라가는 도전입니다. 단계마다 규칙이 붙고, 깊이 들어갈수록 고대·태초 장비가 나옵니다.{best ? ` 지금 가장 가까운 동료: ${best.name} Lv ${best.baseLv}` : ''}</div>
      </div>
    );
  }
  const rs = riftSave(s);
  const live = g.world.rift;
  const tier = desiredTier(rs);
  const plan = ensurePlan(s, Math.random, riftWeek(new Date()), tier);
  const fc = rs.firsts.includes(tier) ? null : firstClearReward(tier);
  const rec = recommendLineup(s, plan);
  const recSame = rec.every((h) => s.heroes.includes(h)) && rec.length === Math.min(3, s.heroes.length);
  const setTier = (t: number) => { rs.pick = Math.max(1, Math.min(rs.open, t)); rs.next = undefined; g.commit('click'); };
  const mech = MECHS[plan.mech as GuardianMech];
  const guardian = MONSTERS[plan.guardian];
  const running = !!live && (live.phase === 'run' || live.phase === 'guardian');
  return (
    <div class="rift-view">
      <div class="rift-head">
        <b>🌀 균열 · 최고 {rs.best}단계{rs.bestMs ? <small> ({fmtClock(rs.bestMs)})</small> : null}</b>
        <span>{rs.bestParty?.length ? `기록 파티: ${rs.bestParty.map((x) => `${x.name} ${CLASSES[x.cls].name} Lv ${x.lv}`).join(' · ')}` : '아직 정복 기록이 없어요. 1단계부터 시작합니다.'}</span>
        <span class="rh-stats">열린 단계 {rs.open} · 균열 정수 {fmt(essence(s))} · 도전 {rs.runs}회 · 정복 {rs.clears}회{rs.last ? ` · 지난 판 ${rs.last.tier}단계 ${rs.last.ok ? `정복 ${fmtClock(rs.last.ms)}` : `실패(${rs.last.why})`}` : ''}</span>
      </div>
      {live && (
        <div class="box rf-live">
          <b>{live.plan.tier}단계 {running ? `진행 중 — ${live.phase === 'guardian' ? '수호자 전투' : `진행 ${Math.floor(live.progress)}%`} · 남은 시간 ${fmtClock(live.end - g.world.time)}` : live.result?.ok ? '정복! 균열이 닫히는 중' : '실패 — 균열이 닫히는 중'}</b>
          <button class="btn sm danger" onClick={() => g.setModal({ kind: 'confirm', danger: true, text: running ? '균열에서 나갈까요?\n이번 판은 실패로 끝나고 마을로 돌아갑니다.' : '마을로 돌아갈까요?', ok: () => g.leaveRift() })}>나가기</button>
        </div>
      )}
      <div class="sec">도전 단계</div>
      <div class="rf-tier">
        {rs.auto === 'off' ? (
          <div class="stepper">
            <button class="btn xs" disabled={tier <= 1} onClick={() => setTier(tier - 1)} aria-label="한 단계 아래">◀</button>
            <b class="rf-tnum">{tier}단계</b>
            <button class="btn xs" disabled={tier >= rs.open} onClick={() => setTier(tier + 1)} aria-label="한 단계 위">▶</button>
            <button class="btn xs" disabled={tier >= rs.open} onClick={() => setTier(rs.open)}>최고</button>
          </div>
        ) : <b class="rf-tnum">{tier}단계 <small>(자동)</small></b>}
        <span class="small muted">몬스터 Lv {riftLevel(tier)} · HP ×{Math.pow(1.12, tier - 1).toFixed(1)} · ATK ×{Math.pow(1.08, tier - 1).toFixed(1)}</span>
      </div>
      {fc && <div class="small rf-first">첫 정복 보상: {fmt(fc.zeny)}z · 균열 정수 {fc.essence}{fc.gear ? ` · ${GRADE_KO[fc.gear]} 장비 1` : ''}</div>}
      <div class="sec">이번 균열의 규칙</div>
      <div class="rf-rules">
        {plan.rules.map((id) => {
          const r = RULES[id as RiftRuleId];
          return (
            <div class="rf-rule">
              <span class="rr-ic">{r.icon}</span>
              <div class="rr-mid">
                <div><b>{ruleName(plan, id)}</b> <span class="rr-axis">{r.axis}</span>{id === plan.fixed ? <span class="rr-fixed">{Math.floor(tier / 10) * 10}단계 고정 · 이번 주</span> : null}</div>
                <div class="small">{r.text}</div>
                <div class="bd-mu"><span class="mu good">강 · {r.good}</span><span class="mu bad">약 · {r.bad}</span></div>
              </div>
            </div>
          );
        })}
        <div class="rf-rule guardian">
          <span class="rr-ic">👁</span>
          <div class="rr-mid">
            <div><b>수호자 · {guardian.name}의 그림자</b> <span class="rr-axis">{mech.name}</span></div>
            <div class="small">{mech.text}</div>
            <div class="small muted">출현: {plan.pool.map((id) => MONSTERS[id].name).join(' · ')} · 정예 무리({Object.values(AFFIXES).map((a) => a.name).join('/')})</div>
          </div>
        </div>
      </div>
      <div class="sec">출전 {s.heroes.length}/3</div>
      {s.heroes.map((h) => <HeroLine h={h} plan={plan} />)}
      {allHeroes(s).length > s.heroes.length && (
        <div class="box rf-rec">
          <div class="small"><b>이번 규칙 추천 출전</b> — {rec.map((h) => `${h.name}(${CLASSES[h.cls].name}, ${heroFit(h, plan.rules) >= 0 ? '+' : ''}${heroFit(h, plan.rules)})`).join(' · ')}</div>
          <div class="row" style={{ gap: '6px', marginTop: '5px' }}>
            <button class="btn sm pri" disabled={recSame || running} onClick={() => { const e = applyLineup(s, rec.map((h) => h.id)); if (e) g.toast(e, 'bad'); else g.commit('confirm'); }}>{recSame ? '추천대로 출전 중' : '추천대로 바꾸기'}</button>
            <button class="btn sm" disabled={running} onClick={() => g.setModal({ kind: 'roster' })}>명단 열기</button>
          </div>
        </div>
      )}
      {allHeroes(s).length <= s.heroes.length && <div class="row" style={{ marginTop: '6px' }}><button class="btn sm" disabled={running} onClick={() => g.setModal({ kind: 'roster' })}>명단 열기</button><span class="small muted" style={{ marginLeft: '6px' }}>명단에 동료가 있으면 규칙에 맞춰 바꿔 낼 수 있어요.</span></div>}
      <div class="sec">자동 재도전</div>
      <div class="tseg rf-auto">
        {([['off', '끄기'], ['push', `최고 단계 도전 (${rs.open})`], ['farm', `한 단계 아래 파밍 (${Math.max(1, rs.best - 1)})`]] as const).map(([k, label]) => (
          <button class={rs.auto === k ? 'on' : ''} onClick={() => { rs.auto = k; rs.next = undefined; g.commit('click'); }}>{label}</button>
        ))}
      </div>
      <button class="btn gold block rf-go" disabled={running} onClick={() => g.enterRift()}>{running ? '균열 진행 중' : `균열 입장 · ${tier}단계`}</button>
      <div class="hint" style={{ marginTop: '8px' }}>
        10분 안에 처치로 진행 바를 채우면 수호자가 나옵니다(정예 무리는 많이 채워요). 6분 안에 정복하면 +3, 8분 안이면 +2단계가 열립니다.
        실패하면 다음 판은 같은 단계예요. 균열 장비는 단계가 높을수록 아이템 레벨이 오르고, 수호자에게서 고대 장비가 자주 나옵니다(태초는 70단계부터).
        균열 정수는 재련과 카드 각성에 씁니다. 오프라인 중에는 균열이 진행되지 않고, 마지막 사냥터에서 사냥한 것으로 칩니다.
      </div>
    </div>
  );
}

/** the field's gauge column while inside: tier, clock, progress (or the guardian's HP), the rules and a way out */
export function RiftGauge() {
  const g = useGame();
  const r = g.world.rift;
  if (!r) return null;
  const left = r.end - g.world.time;
  const guard = r.guardian !== null ? g.world.mobs.find((m) => m.uid === r.guardian) : undefined;
  const live = r.phase === 'run' || r.phase === 'guardian';
  const bar = r.phase === 'guardian' && guard ? Math.max(0, guard.hp / guard.maxHp) * 100 : r.progress;
  return (
    <div class={'gauge rift' + (r.phase === 'guardian' ? ' guard' : '')}>
      <div class="rg-top"><b>균열 {r.plan.tier}</b><span class={'rg-clock' + (live && left < 60000 ? ' low' : '')}>{live ? fmtClock(left) : r.result?.ok ? '정복' : '실패'}</span></div>
      <div class="mini-bar"><i style={{ width: bar + '%' }} /></div>
      <div class="rg-sub">{r.phase === 'guardian' ? `수호자${r.barrier ? ' · 수호막' : ''}` : live ? `진행 ${Math.floor(r.progress)}%` : `처치 ${r.kills}`}</div>
      <div class="rg-rules">{r.plan.rules.map((id) => <span title={ruleName(r.plan, id) + ' — ' + RULES[id as RiftRuleId].text}>{RULES[id as RiftRuleId].icon}</span>)}</div>
      <button onClick={() => g.openTown('rift')}>정보</button>
    </div>
  );
}

/** a run's end, over the field until the rift closes */
export function RiftResult() {
  const g = useGame();
  const r = g.world.rift;
  if (!r?.result || g.world.wipeUntil) return null;
  const res = r.result;
  const by: Partial<Record<Grade, number>> = {};
  for (const x of r.loot) by[x as Grade] = (by[x as Grade] ?? 0) + 1;
  const auto = riftSave(g.s).auto;
  const wait = Math.max(0, Math.ceil((6000 - (g.world.time - r.endedAt)) / 1000));
  return (
    <div class={'rift-result' + (res.ok ? ' ok' : ' fail')}>
      <b>{res.ok ? `균열 ${r.plan.tier}단계 정복!` : `균열 ${r.plan.tier}단계 실패`}</b>
      <span>{res.ok ? `${fmtClock(res.ms)} · +${res.adv}단계 (${riftSave(g.s).open}단계까지 열림)${res.record ? ' · 최고 기록!' : ''}${res.first ? ' · 첫 정복' : ''}` : res.why}</span>
      <span class="small">처치 {r.kills} · 정예 {r.elites} · 정수 +{r.essence}{(['primal', 'ancient', 'legend', 'rare', 'magic'] as Grade[]).filter((k) => by[k]).map((k) => ` · ${GRADE_KO[k]} ${by[k]}`).join('')}</span>
      <span class="small muted">{auto === 'off' ? `${wait}초 뒤 마을로 돌아갑니다` : `${wait}초 뒤 다음 균열 (${auto === 'push' ? '최고 단계 도전' : '한 단계 아래 파밍'})`}</span>
    </div>
  );
}
