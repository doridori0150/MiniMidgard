import { useState } from 'preact/hooks';
import { useGame } from '../game.ts';
import { HeroCanvas, Win } from '../widgets.tsx';
import { CLASSES, lineage } from '../../game/data/classes.ts';
import { autoRole, defaultOrders, defaultTactics, roleOptions } from '../../game/state.ts';
import type { PartyRole } from '../../game/world.ts';
import type { ClassId, Hero, HeroRole, PartyOrders, Tactics } from '../../game/types.ts';

const ROLE: Record<PartyRole, [string, string]> = {
  tank: ['탱커', '#4e7ad0'], melee: ['근접 딜러', '#c05a3a'], ranged: ['원거리', '#3f9a4a'], caster: ['마법', '#8a5ad0'], healer: ['힐러', '#c8962a'],
};
const AUTO_POS: Record<PartyRole, string> = { tank: '전열', melee: '전열', ranged: '중열', caster: '후열', healer: '전열↔중열' };
/** acolytes play three very different builds, so their roles get their own names */
const ACO_ROLE: Partial<Record<HeroRole, [string, string]>> = {
  healer: ['지원', '힐·버프가 먼저. 모두 건강하면 앞에서 거들고, 누가 다치면 뒤로 빠져 회복에 집중합니다.'],
  melee: ['전투', '전열에서 둔기로 싸웁니다. 힐은 위급할 때(HP 45% 이하)만 씁니다. STR형 성직자의 자동 역할.'],
  caster: ['퇴마', '후열에서 성스러운 빛·대퇴마로 공격하고, 불사형에게는 힐로 공격합니다. 회복도 맡습니다.'],
};
const ROLE_DESC: Record<HeroRole, string> = {
  tank: '적을 붙잡고 맞아 줍니다. 도발로 동료를 노리는 적을 끌어옵니다.',
  melee: '전열에서 싸웁니다. 탱커가 적을 잡고 있으면 적의 뒤쪽으로 돌아 칩니다.',
  ranged: '중열에서 쏩니다. 혼자일 땐 붙은 적에게서 한 걸음씩 물러나며 싸웁니다.',
  caster: '후열에서 마법을 씁니다. 혼자일 땐 붙은 적에게서 물러나며 싸웁니다.',
  healer: '힐·버프 담당. 동료가 다치면 뒤로 빠져 회복합니다.',
};
const isAco = (cls: ClassId) => lineage(cls).at(-2) === 'acolyte';
const roleName = (cls: ClassId, r: HeroRole) => (isAco(cls) ? ACO_ROLE[r]?.[0] : undefined) ?? ROLE[r][0];
const roleDesc = (cls: ClassId, r: HeroRole) => (isAco(cls) ? ACO_ROLE[r]?.[1] : undefined) ?? ROLE_DESC[r];

type Opt<K extends string> = [K, string, string];
const TARGET: Opt<Tactics['target']>[] = [
  ['assist', '협공', '리더·탱커가 치는 적을 같이 칩니다. 파티가 한 몸처럼 움직여요.'],
  ['protect', '보호', '아군을 때리는 적부터. 후열·체력이 낮은 동료를 노리는 적이 우선입니다.'],
  ['nearest', '근처', '가장 가까운 적. 각자 흩어져 사냥해 효율은 높지만 위험해요.'],
  ['weakest', '마무리', '체력이 가장 적은 적을 끝냅니다. 크리·연타 딜러에게 좋아요.'],
  ['boss', '보스', '보스·MVP가 있으면 무조건 보스. 없으면 협공합니다.'],
];
const POSITION: Opt<Tactics['position']>[] = [
  ['auto', '자동', '직업에 맞게 섭니다.'],
  ['front', '전열', '적에게 붙어 싸웁니다.'],
  ['mid', '중열', '전열 뒤 약 100px. 근접 무기라면 전열 뒤에서 대기합니다.'],
  ['back', '후열', '최대 사거리에서 전열 뒤에 숨습니다. 적이 붙으면 전열 쪽으로 빠집니다.'],
];
const SKILLS: Opt<Tactics['skills']>[] = [
  ['aggressive', '적극', 'SP를 아끼지 않고 공격 스킬을 씁니다. 광역기도 2마리부터.'],
  ['normal', '보통', '평타보다 확실히 나을 때 스킬을 씁니다.'],
  ['conserve', '절약', 'SP 50% 이상일 때만 공격 스킬. 힐·버프·부활 몫을 남겨 둡니다.'],
];
const CHASE: Opt<Tactics['chase']>[] = [
  ['tight', '리더 곁', '리더 주변 짧은 거리만 쫓습니다. 흩어지지 않아요.'],
  ['normal', '보통', '적당한 거리까지 쫓습니다.'],
  ['free', '자유', '멀리까지 쫓고, 직접 새 몹도 끌어옵니다.'],
];
const PULL: [number, string][] = [[1, '하나씩'], [2, '2'], [3, '3'], [5, '5'], [99, '무제한']];
const REST: [number, string][] = [[0, '안 쉼'], [10, '10%'], [20, '20%'], [35, '35%'], [50, '50%']];

/** one-tap 작전 presets (DQ-style): orders + per-hero tactics */
const PRESETS: { id: string; name: string; desc: string; orders: PartyOrders; tac: (h: Hero) => Tactics }[] = [
  { id: 'balance', name: '균형', desc: '직업별 추천 요령', orders: defaultOrders(), tac: (h) => ({ ...defaultTactics(h.cls), role: h.tactics.role ?? 'auto' }) },
  { id: 'focus', name: '집중 공격', desc: '한 마리씩 협공', orders: { pull: 1, rest: 20 }, tac: (h) => ({ ...defaultTactics(h.cls), role: h.tactics.role ?? 'auto', target: 'assist', chase: 'tight' }) },
  { id: 'farm', name: '각자 사냥', desc: '흩어져 빠르게', orders: { pull: 5, rest: 10 }, tac: (h) => ({ ...defaultTactics(h.cls), role: h.tactics.role ?? 'auto', target: 'nearest', chase: 'free', skills: 'aggressive' }) },
  { id: 'safe', name: '안전 제일', desc: '보호·자주 휴식', orders: { pull: 1, rest: 50 }, tac: (h) => ({ ...defaultTactics(h.cls), role: h.tactics.role ?? 'auto', target: 'protect', chase: 'tight', skills: 'conserve' }) },
];

const same = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b);

function Seg<K extends string | number>(props: { opts: [K, string][]; value: K; onPick: (k: K) => void }) {
  return (
    <div class="tseg">
      {props.opts.map(([k, label]) => (
        <button class={props.value === k ? 'on' : ''} onClick={() => props.onPick(k)}>{label}</button>
      ))}
    </div>
  );
}

export function PartyPanel(props: { view?: 'ops' | 'members' } = {}) {
  const g = useGame();
  const s = g.s;
  const [open, setOpen] = useState<number | null>(s.heroes.length === 1 ? 0 : null);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= s.heroes.length) return;
    const keep = g.selId;
    [s.heroes[i], s.heroes[j]] = [s.heroes[j], s.heroes[i]];
    g.world.syncParty();
    g.selId = keep; // the selection follows the hero, not the slot
    if (open === i) setOpen(j); else if (open === j) setOpen(i);
    g.commit('click');
  };
  const setOrders = (o: Partial<PartyOrders>) => { s.orders = { ...s.orders, ...o }; g.commit('click'); };
  const setTac = (h: Hero, t: Partial<Tactics>) => { h.tactics = { ...h.tactics, ...t }; g.commit('click'); };
  const active = PRESETS.find((p) => same(p.orders, s.orders) && s.heroes.every((h) => same(p.tac(h), h.tactics)));

  const info = (h: Hero) => {
    const u = g.world.heroes.find((x) => x.hero.id === h.id);
    const role = u ? g.world.roleOf(u) : 'melee';
    const tac = h.tactics;
    const line = `${TARGET.find((o) => o[0] === tac.target)![1]} · ${tac.position === 'auto' ? AUTO_POS[role] : POSITION.find((o) => o[0] === tac.position)![1]} · 스킬 ${SKILLS.find((o) => o[0] === tac.skills)![1]} · ${CHASE.find((o) => o[0] === tac.chase)![1]}`;
    return { u, role, tac, line, custom: !same(tac, defaultTactics(h.cls)) };
  };
  const ident = (h: Hero, i: number) => {
    const { u, role, line, custom } = info(h);
    return (
      <>
        <span class="pmem-face"><HeroCanvas hero={h} face zoom={0.74} animate={false} /></span>
        <span class="pmem-txt">
          <span class="pmem-nm"><b>{h.name}</b>{i === 0 && <i class="lead">리더</i>}<i class="role" style={{ background: ROLE[role][1] }}>{roleName(h.cls, role)}</i></span>
          <span class="pmem-sub"><span style={{ color: CLASSES[h.cls].color }}>{CLASSES[h.cls].name}</span> Lv {h.baseLv}</span>
          <span class="pmem-tac">{line}{custom && <i class="cust">사용자</i>}</span>
          {u?.doing && <span class="pmem-doing" aria-live="off">지금: {u.doing}</span>}
        </span>
      </>
    );
  };
  const editor = (h: Hero) => {
    const { role, tac, custom } = info(h);
    return (
      <div class="tac">
        {roleOptions(h.cls).length > 1 && (
          <div class="tac-row">
            <div class="tac-l">역할</div>
            <Seg opts={[['auto', `자동·${roleName(h.cls, autoRole(h))}`] as [string, string], ...roleOptions(h.cls).map((r) => [r, roleName(h.cls, r)] as [string, string])]}
              value={tac.role ?? 'auto'} onPick={(v) => setTac(h, { role: v as Tactics['role'] })} />
            <div class="tac-d">{roleDesc(h.cls, role)}{(tac.role ?? 'auto') === 'auto' && isAco(h.cls) ? ' (자동: STR이 INT보다 높으면 전투)' : ''}</div>
          </div>
        )}
        {([['공격 대상', TARGET, 'target'], ['위치', POSITION, 'position'], ['스킬 사용', SKILLS, 'skills'], ['추격 범위', CHASE, 'chase']] as const).map(([label, opts, key]) => {
          const cur = (opts as readonly Opt<string>[]).find((o) => o[0] === tac[key])!;
          return (
            <div class="tac-row">
              <div class="tac-l">{label}</div>
              <Seg opts={(opts as readonly Opt<string>[]).map((o) => [o[0], o[1]] as [string, string])} value={tac[key]} onPick={(v) => setTac(h, { [key]: v } as Partial<Tactics>)} />
              <div class="tac-d">{key === 'position' && tac.position === 'auto' ? `직업에 맞게: ${AUTO_POS[role]}` : cur[2]}</div>
            </div>
          );
        })}
        <div class="row" style={{ marginTop: '4px' }}>
          <span class="small muted">힐·포션 기준은 성장 › 스킬과 퀵슬롯에서 설정합니다.</span>
          <span class="sp1" />
          <button class="btn sm" disabled={!custom} onClick={() => { h.tactics = defaultTactics(h.cls); g.commit('click'); }}>직업 추천값</button>
        </div>
      </div>
    );
  };
  const ops = (
    <>
      <div class="pt-sec">작전</div>
      <div class="presets">
        {PRESETS.map((p) => (
          <button class={'preset' + (active?.id === p.id ? ' on' : '')} aria-pressed={active?.id === p.id} onClick={() => {
            s.orders = { ...p.orders };
            for (const h of s.heroes) h.tactics = p.tac(h);
            g.commit('click');
            g.toast(`작전: ${p.name}`, 'info');
          }}>
            <b>{p.name}</b><small>{p.desc}</small>
          </button>
        ))}
      </div>
      {!active && <div class="small muted" style={{ margin: '-2px 2px 6px' }}>지금은 사용자 작전입니다 (개별 설정이 프리셋과 다름).</div>}
      <div class="orders">
        <div class="ord-row">
          <span class="ord-l">동시 교전<small>리더가 끌어올 최대 몹 수</small></span>
          <Seg opts={PULL} value={s.orders.pull} onPick={(v) => setOrders({ pull: v })} />
        </div>
        <div class="ord-row">
          <span class="ord-l">휴식 기준<small>전투 후 HP·SP가 이 아래면 다 같이 휴식</small></span>
          <Seg opts={REST} value={s.orders.rest} onPick={(v) => setOrders({ rest: v })} />
        </div>
      </div>
    </>
  );
  const footer = (
    <>
      {s.heroes.length < s.partySlots && <button class="btn pri block" style={{ marginTop: '8px' }} onClick={() => g.setModal({ kind: 'recruit' })}>+ 새 동료 영입</button>}
      <div class="hint" style={{ marginTop: '8px' }}>
        파티 슬롯은 Lv 10, Lv 22에 열립니다. 경험치는 파티원끼리 나누고(인원당 +15%), 레벨이 낮은 동료는 2.5배로 따라옵니다.
        탱커를 맨 앞(리더)에 두면 몹을 끌어오고, 후열은 탱커 뒤에서 싸웁니다.
      </div>
    </>
  );

  // page shell: 작전 = shared orders + a summary row per member (tap to edit), 파티원 = the selected hero's tactics
  if (props.view === 'ops') return (
    <Win title="파티">
      <div class="win-body party-body">
        {ops}
        <div class="pt-sec">파티원 <span class="muted small">눌러서 역할·전술 편집</span></div>
        {s.heroes.map((h, i) => (
          <div class="pmem" key={h.id}>
            <div class="pmem-head">
              <button class="pmem-main" onClick={() => { g.sel = i; g.openSub('party', 'members'); }}>{ident(h, i)}<span class="pmem-chev">›</span></button>
            </div>
          </div>
        ))}
        {footer}
      </div>
    </Win>
  );
  if (props.view === 'members') {
    const h = g.hero, i = g.sel;
    return (
      <Win title="파티원">
        <div class="win-body party-body">
          <div class="pmem open">
            <div class="pmem-head"><div class="pmem-main static">{ident(h, i)}</div></div>
            <div class="pm-order">
              <span class="small muted">{i === 0 ? '맨 앞 = 리더: 사냥터를 돌며 몹을 끌어옵니다' : `파티 순서 ${i + 1}번째`}</span>
              <span class="sp1" />
              <button class="btn" aria-label={`${h.name} 앞으로`} disabled={i === 0} onClick={() => move(i, -1)}>▲ 앞으로</button>
              <button class="btn" aria-label={`${h.name} 뒤로`} disabled={i === s.heroes.length - 1} onClick={() => move(i, 1)}>▼ 뒤로</button>
            </div>
            {editor(h)}
          </div>
          {footer}
        </div>
      </Win>
    );
  }

  return (
    <Win title="파티" onClose={() => g.openPanel(null)}>
      <div class="win-body party-body">
        {ops}
        <div class="pt-sec">파티원 <span class="muted small">맨 위가 리더 — 사냥터를 돌며 몹을 끌어옵니다</span></div>
        {s.heroes.map((h, i) => {
          const isOpen = open === i;
          return (
            <div class={'pmem' + (isOpen ? ' open' : '')} key={h.id}>
              <div class="pmem-head">
                <button class="pmem-main" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>{ident(h, i)}<span class="pmem-chev">{isOpen ? '▲' : '▼'}</span></button>
                <div class="pmem-order">
                  <button class="btn xs" aria-label="위로" disabled={i === 0} onClick={() => move(i, -1)}>▲</button>
                  <button class="btn xs" aria-label="아래로" disabled={i === s.heroes.length - 1} onClick={() => move(i, 1)}>▼</button>
                </div>
              </div>
              {isOpen && editor(h)}
            </div>
          );
        })}
        {footer}
      </div>
    </Win>
  );
}
