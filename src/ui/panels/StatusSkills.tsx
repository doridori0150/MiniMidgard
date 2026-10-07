import { useRef, useState } from 'preact/hooks';
import { useGame } from '../game.ts';
import { Bar, ElChip, HeroCanvas, HeroTabs, Win, fmt } from '../widgets.tsx';
import { STAT_KEYS, type StatKey } from '../../game/types.ts';
import { STAT_HELP, STAT_KO, ELEMENT_KO } from '../../game/data/elements.ts';
import { CLASSES, lineage, SECOND_JOB_LV } from '../../game/data/classes.ts';
import { SKILLS, skillsOf } from '../../game/data/skills.ts';
import { raiseStat, autoDistribute, canLearn, learnSkill, canJobChange, skillReqMet, nextJobs } from '../../game/state.ts';
import { computeDerived } from '../../game/stats.ts';
import { expNext, jobExpNext, statCost } from '../../game/exp.ts';
import { skillIconURL } from '../../render/icons.ts';

const STAT_META: Record<StatKey, { ko: string; color: string }> = {
  str: { ko: '힘', color: '#e0603a' },
  agi: { ko: '민첩', color: '#2fa865' },
  vit: { ko: '체력', color: '#d0882a' },
  int: { ko: '지능', color: '#8a5ad0' },
  dex: { ko: '솜씨', color: '#2f86d0' },
  luk: { ko: '운', color: '#d0508f' },
};

type D = ReturnType<typeof computeDerived>;
/** what one more point in `k` would change, biggest effects first */
function preview(cur: D, next: D): string {
  const out: [string, number, number][] = [];
  const add = (label: string, a: number, b: number, dec = 0) => {
    const v = +(b - a).toFixed(dec);
    if (Math.abs(v) >= (dec ? 0.05 : 1)) out.push([label, v, dec]);
  };
  add('ATK', cur.statusAtk, next.statusAtk);
  add('MATK', (cur.matkMin + cur.matkMax) / 2, (next.matkMin + next.matkMax) / 2);
  add('최대HP', cur.maxHp, next.maxHp);
  add('최대SP', cur.maxSp, next.maxSp);
  add('ASPD', cur.aspd, next.aspd, 1);
  add('HIT', cur.hit, next.hit);
  add('FLEE', cur.flee, next.flee);
  add('CRIT', cur.crit, next.crit, 1);
  add('DEF', cur.vitDef, next.vitDef);
  add('MDEF', cur.intMdef, next.intMdef);
  add('시전속도', -cur.castMul * 100, -next.castMul * 100, 1);
  return out.slice(0, 3).map(([l, v, dec]) => `${l} ${v > 0 ? '+' : ''}${dec ? v.toFixed(dec) : v}${l === '시전속도' ? '%' : ''}`).join(' · ');
}

function StatLine(props: { k: StatKey; base: number; plus: number; pts: number; step: number; prev: string; bump: { text: string; n: number } | null; onUp: () => void; onHelp: () => void }) {
  const cost = statCost(props.base);
  const m = STAT_META[props.k];
  const can = props.pts >= cost && props.base < 99;
  return (
    <div class={'stat-line' + (can ? '' : ' dim')}>
      <button class="stat-key" style={{ '--c': m.color } as Record<string, string>} onClick={props.onHelp}>
        <b>{STAT_KO[props.k]}</b><small>{m.ko}</small>
      </button>
      <div class="stat-mid">
        <div class={'stat-val' + (props.bump ? ' bump' : '')} key={props.bump?.n}>{props.base}{props.plus ? <em>+{props.plus}</em> : null}</div>
        {props.bump && <div class="stat-got" key={'g' + props.bump.n}>✓ {props.bump.text}</div>}
        <div class="stat-prev">{props.prev ? <>▶ {props.prev}</> : <span class="muted">—</span>}</div>
      </div>
      <div class="stat-cost"><small>필요</small><b>{cost}</b></div>
      <button class="stat-btn" disabled={!can} aria-label={`${STAT_KO[props.k]} ${props.step} 올리기`} onClick={props.onUp}>+</button>
    </div>
  );
}

/** the 캐릭터 tab holds both growth views: stats and skills, one switch at the top (badges show what is waiting) */
function GrowTabs() {
  const g = useGame();
  const h = g.hero;
  const on = g.panel;
  const job = !canJobChange(h);
  return (
    <div class="seg grow-tabs" role="tablist" aria-label="캐릭터">
      <button role="tab" aria-selected={on === 'status'} class={on === 'status' ? 'on' : ''} onClick={() => g.openSub('grow', 'status')}>
        스탯{h.statPts > 0 && <i class="gt-badge">+{h.statPts}</i>}
      </button>
      <button role="tab" aria-selected={on === 'skills'} class={on === 'skills' ? 'on' : ''} onClick={() => g.openSub('grow', 'skills')}>
        스킬{job ? <i class="gt-badge job">전직</i> : h.skillPts > 0 && <i class="gt-badge">{h.skillPts}</i>}
      </button>
    </div>
  );
}

export function StatusPanel() {
  const g = useGame();
  const h = g.hero;
  const u = g.heroUnit();
  const d = u?.d ?? computeDerived(g.s, h);
  const [help, setHelp] = useState<StatKey | null>(null);
  const [step, setStep] = useState(1);
  // the stat just raised flashes and shows what it bought, so the press reads as a result
  const [bump, setBump] = useState<{ k: StatKey; text: string; n: number } | null>(null);
  const cls = CLASSES[h.cls];
  const jNext = jobExpNext(cls.tier, h.jobLv, cls.jobMax);
  const atkA = d.statusAtk, atkB = d.watk + d.refineAtk + d.ammoAtk + d.bonusAtk;
  const aps = 1000 / d.delay;
  const buffs = u?.buffs ?? [];
  const base = computeDerived(g.s, h, buffs, g.world.time);
  // preview what the selected step (+1/+5/+10) would actually buy with the points on hand
  const prevOf = (k: StatKey) => {
    const copy = { ...h, stats: { ...h.stats } };
    const n = raiseStat(copy, k, step);
    // short on points: still show what the next point buys, so the player knows what they are saving for
    if (!n) { if (h.stats[k] >= 99) return ''; copy.stats[k]++; }
    const nx = computeDerived(g.s, copy, buffs, g.world.time);
    return (step > 1 ? `+${n}: ` : '') + preview(base, nx);
  };
  const hpNow = Math.floor(u?.hp ?? d.maxHp), spNow = Math.floor(u?.sp ?? d.maxSp);
  const tile = (label: string, value: preact.ComponentChildren, sub?: string) => (
    <div class="dv"><span>{label}</span><b>{value}</b>{sub && <small>{sub}</small>}</div>
  );
  return (
    <Win title={`캐릭터 — ${h.name}`} onClose={() => g.openPanel(null)}>
      <div class="win-body st">
        <HeroTabs sel={g.sel} onSel={(i) => { g.sel = i; g.notify(); }} />
        <GrowTabs />
        <div class="st-head">
          <div class="st-portrait"><HeroCanvas hero={h} zoom={1.45} anchor={6} /></div>
          <div class="st-id">
            <div class="st-name">{h.name}</div>
            <div class="row" style={{ gap: '5px' }}>
              <span class="st-cls" style={{ background: cls.color }}>{cls.name}</span>
              <span class="st-lv">Lv <b>{h.baseLv}</b></span>
              <span class="st-lv jl">Job <b>{h.jobLv}</b></span>
            </div>
            <div class="st-role">{cls.role}</div>
          </div>
        </div>
        <div class="st-bars">
          <Bar kind="hp" v={hpNow} max={d.maxHp} label={`HP  ${fmt(hpNow)} / ${fmt(d.maxHp)}`} />
          <Bar kind="sp" v={spNow} max={d.maxSp} label={`SP  ${fmt(spNow)} / ${fmt(d.maxSp)}`} />
          <div class="row" style={{ gap: '6px' }}>
            <div class="sp1"><Bar kind="ex" v={h.baseExp} max={expNext(h.baseLv)} label={`EXP ${(h.baseExp / expNext(h.baseLv) * 100).toFixed(1)}%`} /></div>
            <div class="sp1"><Bar kind="jx" v={isFinite(jNext) ? h.jobExp : 1} max={isFinite(jNext) ? jNext : 1} label={isFinite(jNext) ? `JOB ${(h.jobExp / jNext * 100).toFixed(1)}%` : 'JOB MAX'} /></div>
          </div>
        </div>

        <div class={'pts-banner' + (h.statPts > 0 ? ' has' : '')}>
          <div>
            <small>남은 스탯 포인트</small>
            <b>{h.statPts}</b>
          </div>
          <span class="sp1" />
          <div class="seg step">
            {[1, 5, 10].map((n) => <button class={step === n ? 'on' : ''} onClick={() => setStep(n)}>+{n}</button>)}
          </div>
          <button class="btn sm gold" disabled={h.statPts <= 0} onClick={() => { autoDistribute(h); g.commit('confirm'); }}>추천 분배</button>
        </div>

        <div class="stat-list">
          {STAT_KEYS.map((k) => (
            <StatLine k={k} base={h.stats[k]} plus={d.plus[k]} pts={h.statPts} step={step} prev={prevOf(k)}
              bump={bump?.k === k ? bump : null}
              onUp={() => {
                const before = computeDerived(g.s, h, buffs, g.world.time);
                const n = raiseStat(h, k, step);
                if (!n) return;
                const after = computeDerived(g.s, h, buffs, g.world.time);
                setBump({ k, text: preview(before, after), n: (bump?.k === k ? bump.n : 0) + 1 });
                g.commit('joblevel');
              }} onHelp={() => setHelp(help === k ? null : k)} />
          ))}
        </div>
        {help ? <div class="hint st-help"><b>{STAT_KO[help]} ({STAT_META[help].ko})</b> — {STAT_HELP[help]}</div>
          : <div class="st-tip">{cls.name} 추천: {cls.hint}</div>}

        <div class="st-sec">공격</div>
        <div class="dv-grid">
          {tile('ATK', <>{atkA}<i> + {atkB}</i></>, '스탯 + 장비')}
          {tile('MATK', `${d.matkMin}~${d.matkMax}`)}
          {tile('HIT', d.hit)}
          {tile('CRIT', d.crit.toFixed(1))}
          {tile('ASPD', d.aspd.toFixed(1), `초당 ${aps.toFixed(2)}회`)}
          {tile('무기 속성', <ElChip el={d.weaponElement} />, `${ELEMENT_KO[d.weaponElement]}속성 공격`)}
        </div>
        <div class="st-sec">방어</div>
        <div class="dv-grid">
          {tile('DEF', <>{d.def}<i> + {d.vitDef}</i></>, '장비 + VIT')}
          {tile('MDEF', <>{d.mdef}<i> + {d.intMdef}</i></>)}
          {tile('FLEE', d.flee, `완전회피 ${Math.floor(d.pdodge)}`)}
          {tile('갑옷 속성', <ElChip el={d.armorElement} />)}
        </div>
        <div class="st-sec">회복</div>
        <div class="dv-grid two">
          {tile('HP 회복', Math.floor(d.hpRegen), '3초마다 · 앉으면 2배')}
          {tile('SP 회복', Math.floor(d.spRegen), '4초마다 · 앉으면 2배')}
        </div>
      </div>
    </Win>
  );
}

export function SkillsPanel() {
  const g = useGame();
  const h = g.hero;
  const [open, setOpen] = useState<string | null>(null);
  const cls = CLASSES[h.cls];
  const groups = lineage(h.cls);
  const list = groups.flatMap((c) => skillsOf(c));
  const canLearnTier = (c: string) => c !== 'novice' || h.cls === 'novice';
  const jobErr = canJobChange(h);
  const reqText = (id: string) => {
    const sk = SKILLS[id];
    if (!sk.req) return '';
    return Object.entries(sk.req).map(([r, lv]) => `${SKILLS[r].name} ${h.skills[r] ?? 0}/${lv}`).join(', ');
  };
  return (
    <Win title={`캐릭터 — ${h.name}`} onClose={() => g.openPanel(null)} right={<span class="small">포인트 <b style={{ color: '#ffe880' }}>{h.skillPts}</b></span>}>
      <div class="win-body">
        <HeroTabs sel={g.sel} onSel={(i) => { g.sel = i; g.notify(); }} />
        <GrowTabs />
        {nextJobs(h).length > 0 && (
          <div class={jobErr ? 'hint' : 'box'} style={{ marginBottom: '8px' }}>
            {jobErr ? <><b>{h.cls === 'novice' ? '1차 전직' : `2차 전직(${nextJobs(h).map((j) => CLASSES[j].name).join('/')})`}</b> — {h.cls === 'novice' ? `직업 레벨 10 · 기본기 9 (지금 Job ${h.jobLv}, 기본기 ${h.skills.basic ?? 0})` : `직업 레벨 ${SECOND_JOB_LV} 필요 (지금 ${h.jobLv})`}</> : (
              <div class="row"><b>전직할 수 있습니다!</b><span class="sp1" /><button class="btn gold" onClick={() => g.setModal({ kind: 'job', heroIdx: g.sel })}>전직하기</button></div>
            )}
          </div>
        )}
        <div class="small muted" style={{ margin: '0 2px 6px' }}>스킬 포인트 <b>{h.skillPts}</b>{h.skillPts === 0 ? ' — 직업 레벨이 오를 때마다 1점씩 얻습니다.' : ''}</div>
        {list.map((sk, idx) => {
          const lv = h.skills[sk.id] ?? 0;
          const header = idx === 0 || list[idx - 1].cls !== sk.cls ? (
            <div class="sk-group" style={{ '--c': CLASSES[sk.cls].color } as Record<string, string>}>
              <b>{CLASSES[sk.cls].name}</b><small>{CLASSES[sk.cls].tier === 2 ? '2차 직업' : CLASSES[sk.cls].tier === 1 ? '1차 직업' : '기본'}</small>
            </div>
          ) : null;
          const can = canLearn(h, sk.id);
          const locked = !skillReqMet(h, sk.id) && lv === 0;
          const isActive = sk.kind !== 'passive';
          const auto = h.auto.skills[sk.id] !== false;
          return (
            <>{header}<div class={'skill' + (locked ? ' locked' : '')} key={sk.id}>
              {/* the icon + name is one button that opens the details (reachable by keyboard, separate from learn/auto) */}
              <button class="sk-mid" aria-expanded={open === sk.id} onClick={() => setOpen(open === sk.id ? null : sk.id)}>
              <img src={skillIconURL(sk.id)} alt="" />
              <div class="mid">
                <div class="nm"><b>{sk.name}</b><span class="lv">Lv {lv}/{sk.maxLv}</span>{!isActive && <span class="chip">패시브</span>}{sk.cls === 'novice' && h.cls !== 'novice' && <span class="chip">초보자</span>}</div>
                {locked && <div class="small" style={{ color: '#c05050' }}>필요: {reqText(sk.id)}</div>}
                {open === sk.id && <div class="desc">{sk.desc(Math.max(1, lv))}{lv < sk.maxLv && lv > 0 ? `\n\n▶ 다음 레벨: ${sk.desc(lv + 1).split('\n')[0]}` : ''}</div>}
              </div>
              </button>
              {isActive && lv > 0 && sk.auto !== 'none' && (
                <button class="sk-auto" role="switch" aria-checked={auto} aria-label={`${sk.name} 자동 사용`} onClick={() => { h.auto.skills[sk.id] = !auto; g.commit('click'); }}>
                  <span class={'toggle' + (auto ? ' on' : '')} /><small>{auto ? '자동' : '수동'}</small>
                </button>
              )}
              {/* one readable state per row (codex_r2 §4-7): MAX › 학습 종료 › 선행 필요 › 포인트 부족 › 배우기 */}
              {lv >= sk.maxLv ? <span class="sk-state max">MAX</span>
                : !canLearnTier(sk.cls) ? <span class="sk-state">학습 종료</span>
                : locked ? <span class="sk-state">선행 필요</span>
                : h.skillPts <= 0 ? <span class="sk-state">포인트 부족</span>
                : <button class="sk-learn" disabled={!can} aria-label={`${sk.name} 배우기`} onClick={() => { if (canLearn(h, sk.id) && learnSkill(h, sk.id)) g.commit('confirm'); }}>+1</button>}
            </div></>
          );
        })}
        <div class="sec">자동 사냥 설정</div>
        <div class="box">
          {(h.skills.heal ?? 0) > 0 && <div class="row"><span style={{ width: '96px' }}>힐 기준 HP</span><input class="range" type="range" min={20} max={95} step={5} value={h.auto.healPct} onInput={(e) => { h.auto.healPct = +(e.target as HTMLInputElement).value; g.commit(); }} /><span style={{ width: '34px', textAlign: 'right' }}>{h.auto.healPct}%</span></div>}
          <div class="row" style={{ marginTop: (h.skills.heal ?? 0) > 0 ? '6px' : 0 }}>
            <span class="small muted" style={{ whiteSpace: 'normal' }}>포션·물약 자동 사용은 사냥 화면 하단 퀵슬롯에서 설정합니다.</span><span class="sp1" />
            <button class="btn sm" onClick={() => g.setModal({ kind: 'quick', slot: 0 })}>퀵슬롯 설정</button>
          </div>
        </div>
        <div class="small muted" style={{ marginTop: '6px' }}>{cls.desc}</div>
      </div>
    </Win>
  );
}
