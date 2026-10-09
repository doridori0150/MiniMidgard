import { useState } from 'preact/hooks';
import { useGame, useBackHandler, type TownView } from '../game.ts';
import { ShopView } from '../Shop.tsx';
import { SECOND_JOB_LV } from '../../game/data/classes.ts';
import { ElChip, FeaturePicker, HeroTabs, ItemSlot, LookCanvas, MobCanvas, Win, fmt, nameClass, HeroCanvas } from '../widgets.tsx';
import { ZONES } from '../../game/data/zones.ts';
import { MONSTERS } from '../../game/data/monsters.ts';
import { RACE_KO, SIZE_KO } from '../../game/data/elements.ts';
import { ITEMS, SHOPS } from '../../game/data/items.ts';
import { CLASSES } from '../../game/data/classes.ts';
import { setWholeEnabled, wholeCharacters } from '../../render/whole.ts';
import { NPC_LOOKS } from '../../render/field.ts';
import { itemIconURL } from '../../render/icons.ts';
import { audio } from '../../audio/audio.ts';
import {
  buy, buyPrice, canEquip, canJobChange, equippedBy, itemName, refine, refineInfo, sellEquip, sellPrice, sellStack,
  HAIR_COLORS, HAIR_STYLES, SKIN_TONES, DYE_COUNT, wipeSave, nextJobs, refineInfoFor, save, saveCode, readSaveText, installSave,
} from '../../game/state.ts';
import { partyPerks } from '../../game/stats.ts';
import { requestNotify } from '../notify.ts';
import { RiftView } from '../Rift.tsx';
import { riftSave, riftUnlocked } from '../../game/rift.ts';

// ───────── town
const NPCS: { id: TownView; npc: string; name: string; who: string; sub: string; roof: string; icon: string }[] = [
  { id: 'tool', npc: 'tool', name: '도구 상점', who: '펨', sub: '포션 · 물약 · 정련석 · 화살', roof: '#4aa060', icon: '🧪' },
  { id: 'weapon', npc: 'weapon', name: '무기 상점', who: '그란', sub: '단검부터 카타르까지', roof: '#c8503a', icon: '⚔️' },
  { id: 'armor', npc: 'armor', name: '방어구 상점', who: '엘라', sub: '갑옷 · 방패 · 2차 직업 장비', roof: '#3a6ab0', icon: '🛡️' },
  { id: 'refine', npc: 'refine', name: '정련소', who: '바르크', sub: '+10까지 강화 · 운명의 망치', roof: '#6a5a8a', icon: '⚒️' },
  { id: 'stylist', npc: 'stylist', name: '미용실 · 의상실', who: '루루', sub: '헤어 · 염색 · 외형 아이템', roof: '#e07aa0', icon: '💇' },
  { id: 'job', npc: 'job', name: '전직 교관', who: '레온', sub: '1차 · 2차 전직', roof: '#c8a040', icon: '📜' },
  { id: 'rift', npc: 'rift', name: '균열 관리인', who: '시엘', sub: '끝없는 균열 · 2차 직업 Lv 60', roof: '#5a3a9a', icon: '🌀' },
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
          <FeaturePicker look={L} onPick={(k, v) => change(() => { L[k] = v; })} />
          <div class="field-row" style={{ marginTop: '6px' }}><label>성별</label><div class="seg"><button class={L.gender === 'f' ? 'on' : ''} onClick={() => L.gender !== 'f' && change(() => { L.gender = 'f'; })}>여</button><button class={L.gender === 'm' ? 'on' : ''} onClick={() => L.gender !== 'm' && change(() => { L.gender = 'm'; })}>남</button></div></div>
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
  const titles: Record<TownView, string> = { menu: '마을 서비스', tool: '도구 상점', weapon: '무기 상점', armor: '방어구 상점', costume: '의상실', refine: '정련소', stylist: '미용실·의상실', job: '전직 교관', rift: '균열' };
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
                const rift = n.id === 'rift' && riftUnlocked(g.s);
                return (
                  <button class={'tcard' + (jobReady || (rift && !g.s.rift?.runs) ? ' glow' : '') + (n.id === 'rift' ? ' wide' : '') + (n.id === 'rift' && !rift ? ' dim' : '')} style={{ '--roof': n.roof } as Record<string, string>} onClick={() => { g.town = n.id; g.notify(); audio.play('open'); }}>
                    <span class="tc-roof" />
                    <span class="tc-ic">{n.icon}</span>
                    <LookCanvas look={NPC_LOOKS[n.npc]} zoom={1.25} anchor={2} class="tc-npc" />
                    <span class="tc-text"><b>{n.name}</b><small>{n.who} · {n.sub}</small></span>
                    {jobReady && <span class="tc-badge">전직 가능!</span>}
                    {n.id === 'rift' && (rift ? <span class="tc-badge rift">{g.s.rift?.runs ? `최고 ${riftSave(g.s).best}단계` : '열림!'}</span> : <span class="tc-badge lock">🔒</span>)}
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
        {v === 'rift' && <RiftView />}
      </div>
    </Win>
  );
}

/** 세이브 저장 / 불러오기: move a save between browsers and devices (a file, or a code to paste anywhere) */
function SaveTools() {
  const g = useGame();
  const s = g.s;
  const stamp = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const fileSave = () => {
    save(s);
    const blob = new Blob([JSON.stringify(s)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `minimidgard-${s.heroes[0]?.name ?? 'save'}-${stamp()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    g.toast('세이브 파일을 저장했습니다.', 'good');
  };
  const copyCode = async () => {
    save(s);
    try { await navigator.clipboard.writeText(saveCode(s)); g.toast('세이브 코드를 복사했습니다. 다른 기기에서 \'코드로 불러오기\'에 붙여 넣으세요.', 'good'); }
    catch { g.toast('복사가 막혀 있어요. 파일로 저장을 써 주세요.', 'bad'); }
  };
  const apply = (text: string) => {
    const r = readSaveText(text);
    if ('error' in r) { g.toast(r.error, 'bad'); return; }
    const who = (JSON.parse(r.json) as { heroes: { name: string; baseLv: number }[] }).heroes.map((h) => `${h.name} Lv ${h.baseLv}`).join(', ');
    g.setModal({ kind: 'confirm', danger: true, text: `이 세이브로 바꿀까요?\n${who}\n\n지금 세이브는 백업으로 한 번 보관됩니다.`, ok: () => { installSave(r.json); location.reload(); } });
  };
  const fromFile = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json,text/plain';
    inp.onchange = () => { const f = inp.files?.[0]; if (f) void f.text().then(apply); };
    inp.click();
  };
  const fromCode = async () => {
    let text = '';
    try { text = await navigator.clipboard.readText(); } catch { /* clipboard read blocked: ask instead */ }
    if (!text || !text.trim().startsWith('MMSAVE1:')) text = prompt('세이브 코드를 붙여 넣으세요 (MMSAVE1:로 시작)') ?? '';
    if (text) apply(text);
  };
  return (
    <div class="box save-tools">
      <div class="sec" style={{ marginTop: 0 }}>세이브</div>
      <div class="tt-row"><b>저장</b>
        <button class="btn sm pri" onClick={fileSave}>파일로 저장</button>
        <button class="btn sm" onClick={copyCode}>코드 복사</button>
      </div>
      <div class="tt-row"><b>불러오기</b>
        <button class="btn sm" onClick={fromFile}>파일에서</button>
        <button class="btn sm" onClick={fromCode}>코드로</button>
      </div>
      <div class="small muted">세이브는 브라우저마다 따로 저장됩니다. 다른 기기로 옮길 때 파일이나 코드로 가져가세요. 불러오면 지금 세이브는 백업으로 한 번 보관됩니다.</div>
    </div>
  );
}

/** 테스트 도구: level / job level up, zeny — for trying builds and late content without the grind */
function TestTools() {
  const g = useGame();
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState(true);
  const s = g.s;
  const h = g.hero;
  const ids = all ? s.heroes.map((x) => x.id) : [h.id];
  const btn = (label: string, base: number, job: number) => (
    <button class="btn sm" onClick={() => { g.cheatLevels(ids, base, job); g.toast(`${all ? '파티 전체' : h.name}: ${label}`, 'level'); }}>{label}</button>
  );
  return (
    <div class="box test-tools">
      <button class="set-row" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>테스트 도구 (치트)</span><span class="sp1" /><small>{open ? '접기' : '펼치기'}</small>
      </button>
      {open && (
        <>
          <div class="row" style={{ gap: '6px', margin: '6px 0' }}>
            <div class="seg">
              <button class={all ? 'on' : ''} onClick={() => setAll(true)}>파티 전체</button>
              <button class={!all ? 'on' : ''} onClick={() => setAll(false)}>{h.name}만</button>
            </div>
          </div>
          {!all && <HeroTabs sel={g.sel} onSel={(i) => { g.sel = i; g.notify(); }} />}
          <div class="tt-row"><b>레벨</b>{btn('Lv +1', 1, 0)}{btn('Lv +5', 5, 0)}{btn('Lv +10', 10, 0)}</div>
          <div class="tt-row"><b>잡 레벨</b>{btn('Job +1', 0, 1)}{btn('Job +5', 0, 5)}{btn('Job 최대', 0, 99)}</div>
          <div class="tt-row"><b>제니</b>
            <button class="btn sm" onClick={() => { s.zeny += 1_000_000; g.commit('zeny'); }}>+100만 z</button>
          </div>
          <div class="small muted">스탯·스킬 포인트와 파티 슬롯은 실제 레벨업과 똑같이 들어옵니다. 초보자는 잡 10이 되면 '기본기' 9를 배운 뒤 전직하세요.</div>
        </>
      )}
    </div>
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
          {Sw('CRT 모니터 필터', st.crt !== false, () => { st.crt = st.crt === false; })}
          {Sw('저전력 모드 (30fps, 발열 감소)', !!st.powerSave, () => { st.powerSave = !st.powerSave; })}
          {Sw('도트 모드 (레트로 픽셀)', !!st.pixel, () => { st.pixel = !st.pixel; if (g.renderer) { g.renderer.pixelMode = !!st.pixel; g.renderer.resize(); } })}
          {Sw('캐릭터 그림 B: 통짜 스프라이트 (끄면 A: 조립형)', st.heroArt !== 'rig', () => { st.heroArt = st.heroArt === 'rig' ? undefined : 'rig'; setWholeEnabled(st.heroArt !== 'rig'); })}
          <div class="small muted" style={{ margin: '2px 0 6px' }}>
            B 그림이 있는 직업: {wholeCharacters().map((c) => `${CLASSES[c.cls as keyof typeof CLASSES]?.name ?? c.cls}(${c.gender === 'm' ? '남' : '여'})`).join(' · ')}. 2차 직업은 1차 그림을 입습니다. 나머지는 A로 그려집니다.
          </div>
          {Sw('잡템 자동 판매', st.autoSellEtc, () => { st.autoSellEtc = !st.autoSellEtc; })}
          {Sw('보스·MVP 자동 소환', st.autoBoss, () => { st.autoBoss = !st.autoBoss; })}
        </div>
        <div class="box">
          <button class="set-row" role="switch" aria-checked={!!st.notify} onClick={async () => {
            if (!st.notify) {
              const ok = await requestNotify();
              if (!ok) { g.toast('브라우저에서 알림이 막혀 있어요. 주소창의 사이트 설정에서 알림을 허용해 주세요.', 'bad'); return; }
            }
            set(() => { st.notify = !st.notify; });
          }}>
            <span>PC 알림 (레벨업·카드·득템)</span><span class="sp1" /><small>{st.notify ? '켬' : '끔'}</small><span class={'toggle' + (st.notify ? ' on' : '')} aria-hidden="true" />
          </button>
          <div class="small muted" style={{ marginTop: '4px' }}>다른 창에서 일하는 동안에도 사냥은 계속됩니다. 레벨업, 전직 가능, 카드, 슬롯 장비, MVP 처치, 전멸이 생기면 알림이 뜨고 탭 제목에 개수가 표시됩니다.</div>
        </div>
        <SaveTools />
        <TestTools />
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
