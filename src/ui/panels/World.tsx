import { useState } from 'preact/hooks';
import { useGame, useBackHandler, type TownView } from '../game.ts';
import { ShopView } from '../Shop.tsx';
import { SECOND_JOB_LV } from '../../game/data/classes.ts';
import { ElChip, HeroTabs, ItemSlot, LookCanvas, MobCanvas, Win, fmt, nameClass, HeroCanvas } from '../widgets.tsx';
import { ZONES } from '../../game/data/zones.ts';
import { MONSTERS } from '../../game/data/monsters.ts';
import { RACE_KO, SIZE_KO } from '../../game/data/elements.ts';
import { ITEMS, SHOPS } from '../../game/data/items.ts';
import { CLASSES } from '../../game/data/classes.ts';
import { NPC_LOOKS } from '../../render/field.ts';
import { itemIconURL } from '../../render/icons.ts';
import { audio } from '../../audio/audio.ts';
import {
  buy, buyPrice, canEquip, canJobChange, equippedBy, itemName, refine, refineInfo, sellEquip, sellPrice, sellStack,
  HAIR_COLORS, HAIR_STYLES, SKIN_TONES, DYE_COUNT, wipeSave, nextJobs, refineInfoFor,
} from '../../game/state.ts';
import { partyPerks } from '../../game/stats.ts';

// ───────── town
const NPCS: { id: TownView; npc: string; name: string; who: string; sub: string; roof: string; icon: string }[] = [
  { id: 'tool', npc: 'tool', name: '도구 상점', who: '펨', sub: '포션 · 물약 · 정련석 · 화살', roof: '#4aa060', icon: '🧪' },
  { id: 'weapon', npc: 'weapon', name: '무기 상점', who: '그란', sub: '단검부터 카타르까지', roof: '#c8503a', icon: '⚔️' },
  { id: 'armor', npc: 'armor', name: '방어구 상점', who: '엘라', sub: '갑옷 · 방패 · 2차 직업 장비', roof: '#3a6ab0', icon: '🛡️' },
  { id: 'refine', npc: 'refine', name: '정련소', who: '바르크', sub: '+10까지 강화 · 운명의 망치', roof: '#6a5a8a', icon: '⚒️' },
  { id: 'stylist', npc: 'stylist', name: '미용실 · 의상실', who: '루루', sub: '헤어 · 염색 · 외형 아이템', roof: '#e07aa0', icon: '💇' },
  { id: 'job', npc: 'job', name: '전직 교관', who: '레온', sub: '1차 · 2차 전직', roof: '#c8a040', icon: '📜' },
];

function RefineView() {
  const g = useGame();
  const s = g.s;
  const [sel, setSel] = useState<number | null>(null);
  const [anim, setAnim] = useState<'' | 'hit' | 'ok' | 'fail'>('');
  const [msg, setMsg] = useState('');
  const list = s.equips.filter((e) => refineInfo(e));
  const inst = sel !== null ? s.equips.find((e) => e.uid === sel) : undefined;
  const info = inst ? refineInfoFor(s, inst) : null;
  const go = () => {
    if (!inst || !info || anim === 'hit') return;
    const doRefine = () => {
      setAnim('hit'); setMsg('');
      audio.play('refine_hit');
      setTimeout(() => audio.play('refine_hit'), 200);
      setTimeout(() => audio.play('refine_hit'), 400);
      setTimeout(() => {
        const name = itemName(inst);
        const r = refine(s, inst.uid);
        if (r.ok) { setAnim('ok'); setMsg(`성공! ${itemName(inst)}`); audio.play('refine_ok'); if (r.level >= 7) g.announce(`+${r.level} 정련 성공!`, 'card'); }
        else if (r.broke) { setAnim('fail'); setMsg(`${name}이(가) 부서졌습니다...`); audio.play('refine_fail'); setSel(null); g.announce('정련 실패... 장비 소멸', 'wipe'); }
        else { setAnim(''); setMsg(r.error); audio.play('error'); }
        g.commit();
      }, 650);
    };
    if (info.chance < 100) g.setModal({ kind: 'confirm', danger: true, text: `안전 정련 한계(+${info.safe})를 넘었습니다.\n성공 확률 ${info.chance}% — 실패하면 장비와 꽂힌 카드가 사라집니다!\n정련할까요?`, ok: doRefine });
    else doRefine();
  };
  return (
    <>
      <div class={'anvil ' + anim}>
        {inst ? <img class="big" src={itemIconURL(inst.id)} /> : <div class="big" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>⚒</div>}
        <div>{inst ? itemName(inst) : '정련할 장비를 고르세요'}</div>
        {info && !info.max && (
          <div class="small" style={{ textAlign: 'center', lineHeight: 1.6 }}>
            +{inst!.refine} → +{inst!.refine + 1} · 성공 확률 <b style={{ color: info.chance < 100 ? '#ff8a8a' : '#a0ffa0' }}>{info.chance}%</b><br />
            재료: {ITEMS[info.mat].name} ({fmt(s.stacks[info.mat] ?? 0)}개 보유) · 수수료 {fmt(info.fee)}z<br />
            안전 정련 +{info.safe}까지
          </div>
        )}
        {msg && <div class="res" style={{ color: anim === 'fail' ? '#ff8a8a' : anim === 'ok' ? '#ffe880' : '#fff' }}>{msg}</div>}
        {info && !info.max && <button class="btn gold" disabled={anim === 'hit' || (s.stacks[info.mat] ?? 0) < 1 || s.zeny < info.fee} onClick={go}>정련하기</button>}
        {info?.max && <div>최대 정련 단계입니다.</div>}
      </div>
      <div class="sec">장비 선택</div>
      {list.map((e) => {
        const who = equippedBy(s, e.uid);
        return (
          <div class="li" key={e.uid} style={sel === e.uid ? { borderColor: '#4e6ab4', background: '#eef3ff' } : undefined} onClick={() => { setSel(e.uid); setAnim(''); setMsg(''); }}>
            <img src={itemIconURL(e.id)} />
            <div class="mid"><div class={'nm ' + nameClass(e.id)}>{itemName(e)}</div><div class="small muted">{who ? `${who.name} 장착 중` : '가방'}</div></div>
          </div>
        );
      })}
      <div class="hint" style={{ marginTop: '8px' }}>무기 Lv1은 +7, Lv2는 +6, Lv3은 +5, Lv4와 방어구는 +4까지 안전합니다. 그 이상은 실패 시 장비가 소멸합니다. 정련석은 도구 상점·몬스터 드롭으로 구하세요.</div>
    </>
  );
}

function StylistView() {
  const g = useGame();
  const s = g.s;
  const h = g.hero;
  const COST = 200;
  const change = (f: () => void) => {
    if (s.zeny < COST) { g.toast('제니가 부족합니다.', 'bad'); return; }
    s.zeny -= COST; f(); g.commit('confirm');
  };
  const L = h.look;
  return (
    <>
      <HeroTabs sel={g.sel} onSel={(i) => { g.sel = i; g.notify(); }} />
      <div class="row" style={{ alignItems: 'flex-start' }}>
        <HeroCanvas hero={h} zoom={2} anchor={8} class="" />
        <div style={{ flex: 1 }}>
          <div class="small muted" style={{ marginBottom: '6px' }}>변경 1회 {COST}z</div>
          <div class="field-row"><label>헤어</label><div class="stepper"><button class="btn xs" onClick={() => change(() => { L.hair = (L.hair + HAIR_STYLES - 1) % HAIR_STYLES; })}>◀</button><span>{L.hair + 1} / {HAIR_STYLES}</span><button class="btn xs" onClick={() => change(() => { L.hair = (L.hair + 1) % HAIR_STYLES; })}>▶</button></div></div>
          <div class="field-row" style={{ marginTop: '6px' }}><label>옷 염색</label><div class="stepper"><button class="btn xs" onClick={() => change(() => { L.dye = (L.dye + DYE_COUNT - 1) % DYE_COUNT; })}>◀</button><span>{L.dye + 1} / {DYE_COUNT}</span><button class="btn xs" onClick={() => change(() => { L.dye = (L.dye + 1) % DYE_COUNT; })}>▶</button></div></div>
          <div class="field-row" style={{ marginTop: '6px' }}><label>얼굴형</label><div class="seg"><button class={L.gender === 'f' ? 'on' : ''} onClick={() => L.gender !== 'f' && change(() => { L.gender = 'f'; })}>A</button><button class={L.gender === 'm' ? 'on' : ''} onClick={() => L.gender !== 'm' && change(() => { L.gender = 'm'; })}>B</button></div></div>
        </div>
      </div>
      <div class="sec">머리 색</div>
      <div class="swatches">{HAIR_COLORS.map((c, i) => <button class={'swatch' + (L.hairColor === i ? ' on' : '')} style={{ background: c }} onClick={() => L.hairColor !== i && change(() => { L.hairColor = i; })} />)}</div>
      <div class="sec">피부</div>
      <div class="swatches">{SKIN_TONES.map((c, i) => <button class={'swatch' + (L.skin === i ? ' on' : '')} style={{ background: c }} onClick={() => L.skin !== i && change(() => { L.skin = i; })} />)}</div>
      <div class="sec">의상실 (외형 아이템)</div>
      <ShopView shop="costume" noHeader />
      <div class="hint" style={{ marginTop: '6px' }}>산 머리장비는 [장비 → 의상] 탭에 넣으면 능력치와 상관없이 외형으로 보여요.</div>
    </>
  );
}

function JobView() {
  const g = useGame();
  return (
    <>
      <div class="job-ladder">
        <span>초보자</span><i>Job 10</i><span>1차 직업</span><i>Job {SECOND_JOB_LV}</i><span class="gold">2차 직업</span>
      </div>
      {g.s.heroes.map((h, i) => {
        const err = canJobChange(h);
        const nexts = nextJobs(h);
        const cls = CLASSES[h.cls];
        const pct = cls.tier === 1 ? Math.min(100, h.jobLv / SECOND_JOB_LV * 100) : cls.tier === 0 ? Math.min(100, h.jobLv * 10) : 100;
        return (
          <div class={'jcard' + (!err ? ' ready' : '')} key={h.id}>
            <HeroCanvas hero={h} zoom={1.2} anchor={4} />
            <div class="sp1">
              <div class="nm"><b>{h.name}</b> <span style={{ color: cls.color }}>{cls.name}</span> <span class="small muted">Job {h.jobLv}</span></div>
              {nexts.length > 0 && <div class="small">다음: {nexts.map((n) => <b style={{ color: CLASSES[n].color }}>{CLASSES[n].name} </b>)}</div>}
              <div class="mini-bar ex" style={{ marginTop: '4px' }}><i style={{ width: pct + '%' }} /></div>
              <div class="small muted" style={{ marginTop: '2px' }}>{err ?? '지금 전직할 수 있습니다!'}</div>
            </div>
            <button class="btn gold" disabled={!!err} onClick={() => g.setModal({ kind: 'job', heroIdx: i })}>전직</button>
          </div>
        );
      })}
      <div class="hint" style={{ marginTop: '8px' }}>2차 직업: 기사 · 위저드 · 헌터 · 프리스트 · 어새신 · 블랙스미스. 1차 직업 스킬과 남은 포인트는 그대로 이어집니다.</div>
    </>
  );
}

export function TownPanel() {
  const g = useGame();
  const v = g.town;
  useBackHandler(v !== 'menu', () => { g.town = 'menu'; });
  const titles: Record<TownView, string> = { menu: '마을 서비스', tool: '도구 상점', weapon: '무기 상점', armor: '방어구 상점', costume: '의상실', refine: '정련소', stylist: '미용실·의상실', job: '전직 교관' };
  return (
    <Win title={titles[v]} onClose={() => g.openPanel(null)} right={<>{v !== 'menu' && <button class="x" style={{ width: 'auto', padding: '0 6px' }} onClick={() => { g.town = 'menu'; g.notify(); }}>◀ 목록</button>}<span class="small" style={{ color: '#ffe8a0' }}>{fmt(g.s.zeny)}z</span></>}>
      <div class="win-body">
        {v === 'menu' && (
          <>
            <div class="town-banner">
              <b>미드가르 성</b><span>모험가의 쉼터 · 사냥 중에도 원격 이용</span>
            </div>
            <div class="tcards">
              {NPCS.map((n) => {
                const jobReady = n.id === 'job' && g.s.heroes.some((h) => !canJobChange(h));
                return (
                  <button class={'tcard' + (jobReady ? ' glow' : '')} style={{ '--roof': n.roof } as Record<string, string>} onClick={() => { g.town = n.id; g.notify(); audio.play('open'); }}>
                    <span class="tc-roof" />
                    <span class="tc-ic">{n.icon}</span>
                    <LookCanvas look={NPC_LOOKS[n.npc]} zoom={1.25} anchor={2} class="tc-npc" />
                    <span class="tc-text"><b>{n.name}</b><small>{n.who} · {n.sub}</small></span>
                    {jobReady && <span class="tc-badge">전직 가능!</span>}
                  </button>
                );
              })}
            </div>
            <div class="hint" style={{ marginTop: '8px' }}>사냥 중에도 마을 서비스는 원격으로 이용할 수 있어요. 파티를 쉬게 하려면 [사냥터 → 미드가르 성]으로 이동하세요.</div>
          </>
        )}
        {(v === 'tool' || v === 'weapon' || v === 'armor' || v === 'costume') && <ShopView shop={v} />}
        {v === 'refine' && <RefineView />}
        {v === 'stylist' && <StylistView />}
        {v === 'job' && <JobView />}
      </div>
    </Win>
  );
}

export function SettingsPanel() {
  const g = useGame();
  const st = g.s.settings;
  const set = (f: () => void) => { f(); audio.setVolumes(st.sfx, st.bgm, st.muted); if (g.renderer) { g.renderer.lowFx = st.lowFx; g.renderer.showDamage = st.showDamage; } g.commit(); };
  // the whole 48px row is the switch: label + state text, not a lone 34×18 knob
  const Sw = (label: string, on: boolean, f: () => void) => (
    <button class="set-row" role="switch" aria-checked={on} onClick={() => set(f)}>
      <span>{label}</span><span class="sp1" /><small>{on ? '켬' : '끔'}</small><span class={'toggle' + (on ? ' on' : '')} aria-hidden="true" />
    </button>
  );
  const t = g.s.totals;
  return (
    <Win title="설정" onClose={() => g.openPanel(null)}>
      <div class="win-body">
        <div class="box">
          <div class="row"><span style={{ width: '70px' }}>배경음</span><input class="range" type="range" min={0} max={1} step={0.05} value={st.bgm} onInput={(e) => set(() => { st.bgm = +(e.target as HTMLInputElement).value; })} /></div>
          <div class="row"><span style={{ width: '70px' }}>효과음</span><input class="range" type="range" min={0} max={1} step={0.05} value={st.sfx} onInput={(e) => set(() => { st.sfx = +(e.target as HTMLInputElement).value; })} /></div>
          {Sw('음소거', st.muted, () => { st.muted = !st.muted; })}
        </div>
        <div class="box">
          {Sw('대미지 숫자 표시', st.showDamage, () => { st.showDamage = !st.showDamage; })}
          {Sw('이펙트 간소화 (저사양)', st.lowFx, () => { st.lowFx = !st.lowFx; })}
          {Sw('도트 모드 (레트로 픽셀)', !!st.pixel, () => { st.pixel = !st.pixel; if (g.renderer) { g.renderer.pixelMode = !!st.pixel; g.renderer.resize(); } })}
          {Sw('잡템 자동 판매', st.autoSellEtc, () => { st.autoSellEtc = !st.autoSellEtc; })}
          {Sw('보스·MVP 자동 소환', st.autoBoss, () => { st.autoBoss = !st.autoBoss; })}
        </div>
        <div class="sec">기록</div>
        <div class="derived">
          <div><span>총 처치</span><span>{fmt(t.kills)}</span></div>
          <div><span>카드 획득</span><span>{fmt(t.cards)}</span></div>
          <div><span>정련 시도</span><span>{fmt(t.refines)}</span></div>
          <div><span>장비 소멸</span><span>{fmt(t.breaks)}</span></div>
          <div><span>전멸</span><span>{fmt(t.deaths)}</span></div>
          <div><span>플레이</span><span>{Math.floor(t.playMs / 3600000)}시간 {Math.floor(t.playMs / 60000) % 60}분</span></div>
        </div>
        <div class="row" style={{ marginTop: '10px' }}>
          <button class="btn sm" onClick={() => g.setModal({ kind: 'credits' })}>크레딧</button>
          <span class="sp1" />
          <button class="btn sm danger" onClick={() => g.setModal({ kind: 'confirm', danger: true, text: '모든 진행 상황을 지우고 처음부터 시작할까요?\n되돌릴 수 없습니다.', ok: () => { wipeSave(); location.reload(); } })}>데이터 초기화</button>
        </div>
        <div class="small muted" style={{ marginTop: '8px' }}>미니 미드가르 v0.1 · 자동 저장됨 (이 브라우저에 저장)</div>
      </div>
    </Win>
  );
}

export { ItemSlot };
