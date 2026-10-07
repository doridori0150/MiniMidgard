import { useEffect, useRef, useState } from 'preact/hooks';
import { useGame, type Modal } from './game.ts';
import { CardArt, HeroTabs, ItemSlot, LookCanvas, fmt, nameClass, dur } from './widgets.tsx';
import { ITEMS } from '../game/data/items.ts';
import { CLASSES, FIRST_JOBS } from '../game/data/classes.ts';
import { MONSTERS } from '../game/data/monsters.ts';
import { zone } from '../game/data/zones.ts';
import type { ClassId, CostumeSlot, Look } from '../game/types.ts';
import {
  addEquip, canEquip, cardFits, compound, defaultLook, equip, equippedBy, itemName, jobChange, newHero, removeStack, nextJobs,
  sellEquip, sellPrice, sellStack, setCostume, unequipUid, refineInfo, HAIR_COLORS, HAIR_STYLES, equipAmmo, buy, setQuick,
} from '../game/state.ts';
import { heroLookDraw } from '../render/field.ts';
import { itemIconURL } from '../render/icons.ts';
import { bonusLines, itemTypeLine, jobsLine } from './format.ts';
import { audio } from '../audio/audio.ts';
import { QuickSetupModal } from './QuickBar.tsx';
import { HeroModal } from './HeroModal.tsx';
import { MobModal } from './WorldMap.tsx';
import { BuyModal, SellModal } from './Shop.tsx';
import { skillIconURL } from '../render/icons.ts';
import { RACE_KO } from '../game/data/elements.ts';
import { skillsOf } from '../game/data/skills.ts';

function ItemModal(props: { uid?: number; id?: string; heroIdx?: number }) {
  const g = useGame();
  const s = g.s;
  // the equip target is remembered by hero id, so a reorder behind the detail can't swap who gets the item
  const [heroId, setHeroId] = useState(g.s.heroes[props.heroIdx ?? g.sel]?.id ?? g.selId);
  const heroIdx = Math.max(0, g.s.heroes.findIndex((x) => x.id === heroId));
  const setHeroIdx = (i: number) => setHeroId(g.s.heroes[i]?.id ?? heroId);
  const [cardPick, setCardPick] = useState(false);
  const inst = props.uid !== undefined ? s.equips.find((e) => e.uid === props.uid) : undefined;
  const id = inst?.id ?? props.id!;
  const d = ITEMS[id];
  if (!d) return null;
  const close = () => g.popModal();
  const h = s.heroes[Math.min(heroIdx, s.heroes.length - 1)];
  const owner = inst ? equippedBy(s, inst.uid) : undefined;
  const have = d.kind !== 'equip' ? s.stacks[id] ?? 0 : 0;
  const lines = bonusLines(d.bonus);
  const ri = inst ? refineInfo(inst) : null;
  const fittingCards = inst && inst.cards.includes(null) ? Object.keys(s.stacks).filter((c) => (s.stacks[c] ?? 0) > 0 && ITEMS[c].kind === 'card' && cardFits(c, inst)) : [];
  const fittingEquips = d.kind === 'card' ? s.equips.filter((e) => e.cards.includes(null) && cardFits(id, e)) : [];
  const isCostumable = inst && (d.loc === 'headTop' || d.loc === 'headMid' || d.loc === 'headLow' || d.loc === 'garment');
  const dropsFrom = Object.values(MONSTERS).filter((m) => m.drops.some((x) => x.id === id));

  return (
    <div class="modal">
      <div class="win-title"><span>아이템 정보</span><span class="sp" /><button class="x" onClick={close}>×</button></div>
      <div class="win-body">
        <div class="item-head">
          <div class="ic"><img src={itemIconURL(id)} /></div>
          <div>
            <div class={'item-name ' + nameClass(id)}>{inst ? itemName(inst) : d.name}</div>
            <div class="small muted">{itemTypeLine(d)}{have ? ` · 보유 ${fmt(have)}개` : ''}{owner ? ` · ${owner.name} 장착 중` : ''}</div>
          </div>
        </div>
        {d.kind === 'card' && <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}><CardArt id={id} /></div>}
        <div class="kv">
          {d.atk !== undefined && d.kind === 'equip' && <><span>공격력</span><span>{d.atk}{inst && inst.refine ? ` (+${inst.refine} 정련)` : ''}</span></>}
          {d.matkPct && <><span>마법 공격</span><span>+{d.matkPct}%</span></>}
          {d.def !== undefined && d.kind === 'equip' && d.loc !== 'weapon' && <><span>방어력</span><span>{d.def}{inst && inst.refine ? ` (+${inst.refine})` : ''}</span></>}
          {d.mdef && <><span>마법 방어</span><span>{d.mdef}</span></>}
          {d.wlv && <><span>무기 레벨</span><span>{d.wlv}</span></>}
          {d.element && d.element !== 'neutral' && <><span>속성</span><span>{d.element}</span></>}
          {d.reqLv && d.reqLv > 1 && <><span>요구 레벨</span><span>{d.reqLv}</span></>}
          {(d.kind === 'equip' || d.kind === 'ammo') && <><span>장착</span><span>{jobsLine(d)}</span></>}
          {d.kind === 'ammo' && <><span>화살 공격력</span><span>{d.atk}</span></>}
          {ri && <><span>정련</span><span>{inst!.refine}/10 (안전 +{ri.safe})</span></>}
          <span>판매가</span><span>{fmt(sellPrice(s, id, inst?.refine ?? 0))}z</span>
        </div>
        {lines.length > 0 && d.kind !== 'card' && <div class="desc" style={{ color: '#2a5ab0' }}>{lines.join('\n')}</div>}
        <div class="desc">{d.desc}</div>
        {inst && inst.slots > 0 && (
          <div class="cards-row">
            {inst.cards.map((c) => c
              ? <span class="cardslot"><img src={itemIconURL(c)} />{ITEMS[c].name}<span class="small muted">{bonusLines(ITEMS[c].bonus).join(', ')}</span></span>
              : <span class="cardslot empty">빈 슬롯</span>)}
          </div>
        )}
        {cardPick && (
          <div class="box" style={{ marginTop: '8px' }}>
            {(inst ? fittingCards : []).map((c) => (
              <div class="li" onClick={() => g.pushModal({ kind: 'confirm', text: `${ITEMS[c].name}을(를) 꽂을까요?\n한 번 꽂으면 뺄 수 없습니다.`, ok: () => { const e = compound(s, inst!.uid, c); if (e) g.toast(e, 'bad'); else { g.toast(`카드 장착! ${itemName(inst!)}`, 'card'); g.commit('refine_ok'); } } })}>
                <img src={itemIconURL(c)} /><div class="mid"><div class="nm">{ITEMS[c].name}</div><div class="small muted">{bonusLines(ITEMS[c].bonus).join(', ')}</div></div><span class="small">×{s.stacks[c]}</span>
              </div>
            ))}
            {d.kind === 'card' && fittingEquips.map((e) => (
              <div class="li" onClick={() => g.pushModal({ kind: 'confirm', text: `${itemName(e)}에 ${d.name}을(를) 꽂을까요?\n한 번 꽂으면 뺄 수 없습니다.`, ok: () => { const er = compound(s, e.uid, id); if (er) g.toast(er, 'bad'); else { g.toast(`카드 장착! ${itemName(e)}`, 'card'); g.commit('refine_ok'); } } })}>
                <img src={itemIconURL(e.id)} /><div class="mid"><div class={'nm ' + nameClass(e.id)}>{itemName(e)}</div><div class="small muted">{equippedBy(s, e.uid)?.name ?? '가방'}</div></div>
              </div>
            ))}
            {((inst && fittingCards.length === 0) || (d.kind === 'card' && fittingEquips.length === 0)) && <div class="muted small">{d.kind === 'card' ? '이 카드를 꽂을 수 있는 빈 슬롯 장비가 없습니다.' : '꽂을 수 있는 카드가 없습니다.'}</div>}
          </div>
        )}
        {dropsFrom.length > 0 && !inst && <div class="small muted" style={{ marginTop: '8px' }}>획득처: {dropsFrom.map((m) => `${m.name}(${(m.drops.find((x) => x.id === id)!.rate * 100).toFixed(m.drops.find((x) => x.id === id)!.rate < 0.01 ? 2 : 0)}%)`).join(', ')}</div>}
        {(inst && !owner && d.kind === 'equip') || d.kind === 'ammo' ? <div style={{ marginTop: '8px' }}><HeroTabs sel={heroIdx} onSel={setHeroIdx} /></div> : null}
      </div>
      <div class="foot">
        {inst && !owner && <button class="btn pri" disabled={!!canEquip(h, id)} onClick={() => { const e = equip(s, h, inst.uid); if (e) g.toast(e, 'bad'); else { g.commit('equip'); close(); } }}>{canEquip(h, id) ? '장착 불가' : `${h.name} 장착`}</button>}
        {inst && owner && <button class="btn" onClick={() => { unequipUid(s, owner, inst.uid); g.commit('equip'); close(); }}>해제</button>}
        {d.kind === 'ammo' && have > 0 && <button class="btn pri" disabled={!!canEquip(h, id)} onClick={() => { const e = equipAmmo(s, h, id); if (e) g.toast(e, 'bad'); else { g.commit('equip'); close(); } }}>{h.name} 화살통 장착</button>}
        {inst && inst.cards.includes(null) && <button class="btn gold" onClick={() => setCardPick(!cardPick)}>카드 꽂기</button>}
        {d.kind === 'card' && have > 0 && <button class="btn gold" onClick={() => setCardPick(!cardPick)}>장비에 꽂기</button>}
        {isCostumable && <button class="btn" onClick={() => { setCostume(s, h, d.loc as CostumeSlot, inst!.uid); g.toast(`${h.name}의 의상으로 표시합니다`, 'good'); g.commit('equip'); close(); }}>의상으로</button>}
        {d.kind === 'use' && have > 0 && <button class="btn gold" onClick={() => {
          let i = s.quick.findIndex((x) => x.id === id);
          if (i < 0) i = s.quick.findIndex((x) => !x.id);
          if (i < 0) i = s.quick.length - 1;
          setQuick(s, i, id);
          g.commit('equip');
          g.setModal({ kind: 'quick', slot: i });
        }}>{s.quick.some((x) => x.id === id) ? '퀵슬롯 설정' : '퀵슬롯 등록'}</button>}
        {d.kind === 'use' && have > 0 && !d.buff && <button class="btn pri" onClick={() => {
          const u = g.heroUnit(heroIdx);
          if (!u || u.state === 'dead') return;
          removeStack(s, id);
          const he = d.heal!;
          if (he.hp) g.world.healHero(u, Math.floor((he.hp[0] + he.hp[1]) / 2), true);
          if (he.sp) u.sp = Math.min(u.d.maxSp, u.sp + Math.floor((he.sp[0] + he.sp[1]) / 2));
          g.commit('potion');
        }}>{h.name}에게 사용</button>}
        {inst && !owner && <button class="btn" onClick={() => g.pushModal({ kind: 'confirm', danger: true, closeAll: true, text: `${itemName(inst)}을(를) ${fmt(sellPrice(s, id, inst.refine))}z에 판매할까요?`, ok: () => { const z = sellEquip(s, inst.uid); if (z) g.toast(`+${fmt(z)} 제니`, 'good'); g.commit('zeny'); } })}>판매</button>}
        {have > 0 && d.kind !== 'ammo' && <button class="btn" onClick={() => { sellStack(s, id, 1); g.commit('zeny'); if (!(s.stacks[id] > 0)) close(); }}>1개 판매</button>}
        {!inst && !have && d.kind === 'equip' && d.price > 0 && false && <button class="btn">-</button>}
      </div>
    </div>
  );
}

function OfflineModal(props: { report: import('../game/offline.ts').OfflineReport }) {
  const g = useGame();
  const r = props.report;
  const items = Object.entries(r.items).sort((a, b) => ITEMS[b[0]].price - ITEMS[a[0]].price);
  return (
    <div class="modal">
      <div class="win-title"><span>자리를 비운 동안</span><span class="sp" /></div>
      <div class="win-body">
        <div style={{ fontSize: '13px' }}><b>{dur(r.ms)}</b> 동안 {zone(r.zone).name}에서 사냥했습니다.</div>
        {r.faded && <div class="small" style={{ color: '#6a4aa8', marginTop: '4px' }}>날이 밝아 「{zone(r.faded.from).name}」의 길이 흐려졌고, 파티는 「{zone(r.faded.to).name}」(으)로 돌아왔습니다.</div>}
        <div class="kv">
          <span>처치</span><span>{fmt(r.kills)}마리</span>
          <span>획득 경험치</span><span>{fmt(r.exp)}</span>
          {r.zeny > 0 && <><span>잡템 판매</span><span>+{fmt(r.zeny)}z</span></>}
        </div>
        {r.levels.map((l) => <div class="small" style={{ color: '#2a6ae0', marginTop: '4px' }}>{l.name}: {l.base ? `레벨 +${l.base} ` : ''}{l.job ? `직업 레벨 +${l.job}` : ''}</div>)}
        {r.cards.length > 0 && <div class="hint" style={{ marginTop: '8px' }}>🎴 카드 획득! {r.cards.map((c) => ITEMS[c].name).join(', ')}</div>}
        {r.equips.length > 0 && <div class="small" style={{ marginTop: '6px', color: '#3a7ac0' }}>장비: {r.equips.map((e) => ITEMS[e].name).join(', ')}</div>}
        <div class="offline-items">{items.map(([id, n]) => <ItemSlot id={id} qty={n} />)}</div>
        <div class="small muted" style={{ marginTop: '8px' }}>오프라인 보상은 최근 사냥 속도의 60%로 계산됩니다 (최대 12시간).</div>
      </div>
      <div class="foot"><button class="btn pri" onClick={() => { g.setModal(null); audio.play('confirm'); }}>확인</button></div>
    </div>
  );
}

const JOB_GIFTS: Record<ClassId, string[]> = {
  novice: [], swordsman: ['w_sword'], mage: ['w_rod'], archer: ['w_bow', 'am_arrow'], acolyte: ['w_club'], thief: ['w_cutter'], merchant: ['w_axe'],
  knight: ['w_spear', 'u_white'], wizard: ['u_blue', 'u_blue'], hunter: ['am_silver'], priest: ['u_blue', 'u_blue'], assassin: ['w_katar'], blacksmith: ['r_emver', 'r_emver'],
};

const WEAPON_OF: Partial<Record<ClassId, import('../game/types.ts').WeaponType>> = {
  swordsman: 'sword', mage: 'staff', archer: 'bow', acolyte: 'mace', thief: 'dagger', merchant: 'axe',
  knight: 'spear', wizard: 'staff', hunter: 'bow', priest: 'mace', assassin: 'katar', blacksmith: 'axe',
};

function JobModal(props: { heroIdx: number }) {
  const g = useGame();
  const h = g.s.heroes[props.heroIdx];
  const options = nextJobs(h);
  const [pick, setPick] = useState<ClassId>(options[0] ?? 'swordsman');
  const base = heroLookDraw(g.s, h);
  const c = CLASSES[pick];
  const second = c.tier === 2;
  const look = (j: ClassId) => ({ ...base, cls: j, wtype: WEAPON_OF[j] ?? base.wtype, shield: j === 'swordsman', refine: second ? 7 : 0 });
  const gifts = JOB_GIFTS[pick] ?? [];
  const confirm = () => {
    const err = jobChange(g.s, h, pick);
    if (err) { g.toast(err, 'bad'); return; }
    for (const gift of gifts) {
      const it = ITEMS[gift];
      if (it.kind === 'equip') { const inst = addEquip(g.s, gift); equip(g.s, h, inst.uid); continue; }
      g.s.stacks[gift] = (g.s.stacks[gift] ?? 0) + (it.kind === 'ammo' ? 1 : 5);
      if (it.kind === 'ammo') equipAmmo(g.s, h, gift);
    }
    g.setModal(null);
    g.commit('levelup');
    const u = g.world.heroes[props.heroIdx];
    if (u) { g.world.emit({ t: 'levelup', uid: u.uid, job: true }); g.world.emit({ t: 'status', uid: u.uid, text: `${c.name} 전직!`, color: '#ffe080' }); }
    g.announce(`${h.name}, ${c.name}(으)로 전직!`, 'mvp');
    g.toast('스킬 창에서 새 스킬을 배우세요. 스탯도 직업에 맞게!', 'level');
  };
  return (
    <div class="modal job-modal">
      <div class="win-title"><span>{second ? '2차 전직' : '1차 전직'} — {h.name}</span><span class="sp" /><button class="x" aria-label="닫기" onClick={() => g.popModal()}>×</button></div>
      <div class="win-body">
        {second ? (
          <div class="ascend">
            <div class="asc-side">
              <LookCanvas look={look(h.cls)} zoom={1.5} anchor={6} animate={false} />
              <span style={{ color: CLASSES[h.cls].color }}>{CLASSES[h.cls].name}</span>
            </div>
            <div class="asc-arrow">▶</div>
            <div class="asc-side new">
              <div class="asc-glow" />
              <LookCanvas look={look(pick)} zoom={1.9} anchor={6} />
              <b style={{ color: c.color }}>{c.name}</b>
            </div>
          </div>
        ) : (
          <div class="job-grid">
            {options.map((j) => (
              <div class={'job' + (pick === j ? ' on' : '')} onClick={() => { setPick(j); audio.play('click'); }}>
                <LookCanvas look={look(j)} zoom={1.1} anchor={4} animate={pick === j} />
                <b style={{ color: CLASSES[j].color }}>{CLASSES[j].name}</b>
                <small>{CLASSES[j].role}</small>
              </div>
            ))}
          </div>
        )}
        {second && options.length > 1 && (
          <div class="row" style={{ justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
            {options.map((j) => <button class={'btn sm' + (pick === j ? ' pri' : '')} onClick={() => setPick(j)}>{CLASSES[j].name}</button>)}
          </div>
        )}
        <div class="job-info">
          <div class="ji-role" style={{ background: c.color }}>{c.role}</div>
          <div class="ji-desc">{c.desc}</div>
          <div class="ji-hint">추천 스탯 — {c.hint}</div>
          <div class="ji-skills">
            {skillsOf(pick).map((sk) => <span class="ji-skill"><img src={skillIconURL(sk.id)} alt="" />{sk.name}</span>)}
          </div>
          {second && <div class="ji-note">1차 직업 스킬과 남은 스킬 포인트는 그대로 유지되고, 직업 보너스 스탯도 이어집니다. HP·SP 성장률이 크게 오릅니다.</div>}
          {gifts.length > 0 && <div class="ji-gift">🎁 전직 선물: {gifts.map((i) => ITEMS[i].name).join(', ')}</div>}
        </div>
      </div>
      <div class="foot">
        <button class="btn gold" onClick={confirm}>{c.name}(으)로 전직</button>
      </div>
    </div>
  );
}

function RecruitModal() {
  const g = useGame();
  const [name, setName] = useState('');
  const [look, setLook] = useState<Look>(() => ({ ...defaultLook(Math.random() < 0.5 ? 'f' : 'm'), hair: Math.floor(Math.random() * HAIR_STYLES), hairColor: Math.floor(Math.random() * HAIR_COLORS.length) }));
  const preview = { cls: 'novice' as ClassId, gender: look.gender, hair: look.hair, hairColor: look.hairColor, skin: look.skin, dye: look.dye, wtype: 'dagger' as const, refine: 0, shield: false };
  const ok = name.trim().length > 0;
  return (
    <div class="modal">
      <div class="win-title"><span>동료 영입</span><span class="sp" /><button class="x" aria-label="닫기" onClick={() => g.popModal()}>×</button></div>
      <div class="win-body">
        <div class="row" style={{ alignItems: 'flex-start' }}>
          <LookCanvas look={preview} zoom={1.9} anchor={6} class="" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input class="text-in" maxLength={10} placeholder="이름 (최대 10자)" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
            <div class="field-row"><label>헤어</label><div class="stepper"><button class="btn xs" onClick={() => setLook({ ...look, hair: (look.hair + HAIR_STYLES - 1) % HAIR_STYLES })}>◀</button><span>{look.hair + 1}</span><button class="btn xs" onClick={() => setLook({ ...look, hair: (look.hair + 1) % HAIR_STYLES })}>▶</button></div></div>
            <div class="field-row"><label>얼굴형</label><div class="seg"><button class={look.gender === 'f' ? 'on' : ''} onClick={() => setLook({ ...look, gender: 'f' })}>A</button><button class={look.gender === 'm' ? 'on' : ''} onClick={() => setLook({ ...look, gender: 'm' })}>B</button></div></div>
          </div>
        </div>
        <div class="swatches" style={{ marginTop: '8px' }}>{HAIR_COLORS.map((c, i) => <button class={'swatch' + (look.hairColor === i ? ' on' : '')} style={{ background: c }} onClick={() => setLook({ ...look, hairColor: i })} />)}</div>
        <div class="hint" style={{ marginTop: '8px' }}>새 동료는 초보자 Lv 1로 시작하지만, 파티 최고 레벨보다 5 이상 낮으면 경험치를 2.5배로 받아 금방 따라옵니다.</div>
      </div>
      <div class="foot"><button class="btn pri" disabled={!ok} onClick={() => {
        const s = g.s;
        const h = newHero(s, name.trim(), look);
        s.heroes.push(h);
        const k = addEquip(s, 'w_knife'); equip(s, h, k.uid);
        const c = addEquip(s, 'a_cotton'); equip(s, h, c.uid);
        g.sel = s.heroes.length - 1;
        g.setModal(null);
        g.commit('levelup');
        g.announce(`${h.name}이(가) 파티에 합류했습니다!`, 'unlock');
      }}>영입하기</button></div>
    </div>
  );
}

function ConfirmModal(props: { text: string; ok: () => void; danger?: boolean; closeAll?: boolean }) {
  const g = useGame();
  return (
    <div class="modal" style={{ maxWidth: '320px' }}>
      <div class="win-title"><span>확인</span></div>
      <div class="win-body"><div class="desc" style={{ marginTop: 0, fontSize: '12.5px' }}>{props.text}</div></div>
      <div class="foot">
        <button class="btn" onClick={() => { g.popModal(); audio.play('close'); }}>취소</button>
        <button class={'btn ' + (props.danger ? 'danger' : 'pri')} onClick={() => { if (props.closeAll) g.setModal(null); else g.popModal(); props.ok(); }}>확인</button>
      </div>
    </div>
  );
}

const CREDITS = `미니 미드가르 v0.1
고전 2D MMORPG에 대한 오마주로 만든 오리지널 방치형 RPG입니다. 등장하는 이름·그래픽·음악은 모두 새로 만들거나 자유 라이선스 에셋을 사용했습니다.

[음악]
"Waltz" by Peter Eastman (peastman) — https://opengameart.org/content/waltz — CC-BY 3.0 (https://creativecommons.org/licenses/by/3.0/). MP3로 변환, 끝 무음 제거, 음량 정규화.
그 외 BGM: cynicmusic, Juhani Junkala (SubspaceAudio), Cleyton Kauffman — CC0

[효과음] (모두 CC0)
Kenney (kenney.nl), artisticdude, rubberduck, StarNinjas, Vehicle (Jan Schupke), JaggedStone, LEGIT Audio, IgnasD, HaelDB, Someoneman, Spring Spring, Joth, Bobjt, fvcalderan, VishwaJai, Till Behrend, Fupi

[글꼴]
갈무리 (Galmuri) by Lee Minseo (quiple) — SIL Open Font License 1.1

자세한 출처는 docs/CREDITS.md를 참고하세요.`;

function ModalBody(props: { m: Modal }) {
  const g = useGame();
  const m = props.m;
  switch (m.kind) {
    case 'item': return <ItemModal uid={m.uid} id={m.id} heroIdx={m.heroIdx} />;
    case 'offline': return <OfflineModal report={m.report} />;
    case 'job': return <JobModal heroIdx={m.heroIdx} />;
    case 'recruit': return <RecruitModal />;
    case 'hero': return <HeroModal id={m.id} />;
    case 'quick': return <QuickSetupModal slot={m.slot} />;
    case 'mob': return <MobModal id={m.id} />;
    case 'buy': return <BuyModal id={m.id} />;
    case 'sell': return <SellModal id={m.id} uid={m.uid} />;
    case 'confirm': return <ConfirmModal text={m.text} ok={m.ok} danger={m.danger} closeAll={m.closeAll} />;
    case 'card': return null;
    case 'credits': return (
      <div class="modal">
        <div class="win-title"><span>크레딧</span><span class="sp" /><button class="x" aria-label="닫기" onClick={() => g.popModal()}>×</button></div>
        <div class="win-body"><div class="credits">{CREDITS}</div></div>
      </div>
    );
  }
}

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Modals() {
  const g = useGame();
  const stack = g.modals;
  const top = stack[stack.length - 1];
  const bg = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  // focus moves into the newest detail and goes back to whatever opened the first one when all are closed
  useEffect(() => {
    if (top && !trigger.current) trigger.current = document.activeElement as HTMLElement | null;
    if (!top) { trigger.current?.focus?.(); trigger.current = null; return; }
    const layer = bg.current?.querySelector<HTMLElement>('.modal-layer:not([hidden])');
    (layer?.querySelector<HTMLElement>(FOCUSABLE) ?? layer)?.focus?.();
  }, [stack.length, top]);
  if (!top) return null;
  // tapping outside steps back one detail (item → monster → drop returns to the monster); the offline report needs its button
  const close = () => { if (top.kind !== 'offline') g.popModal(); };
  // keep Tab inside the open detail (the rest of the app is inert while it is open)
  const trap = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const layer = bg.current?.querySelector<HTMLElement>('.modal-layer:not([hidden])');
    const els = [...(layer?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    if (!els.length) return;
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); els[els.length - 1].focus(); }
    else if (!e.shiftKey && i === els.length - 1) { e.preventDefault(); els[0].focus(); }
  };
  return (
    <div class="modal-bg" ref={bg} role="dialog" aria-modal="true" onKeyDown={trap} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      {stack.length > 1 && <button class="modal-back" onClick={() => g.popModal()} aria-label="이전 정보로">‹ 뒤로</button>}
      {/* parents stay mounted but hidden, so coming back keeps their picked hero, half-done choice and scroll */}
      {stack.map((m, i) => (
        <div class="modal-layer" key={`${i}:${m.kind}`} hidden={i !== stack.length - 1} tabIndex={-1}><ModalBody m={m} /></div>
      ))}
    </div>
  );
}
