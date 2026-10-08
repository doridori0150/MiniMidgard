import { useState } from 'preact/hooks';
import { useGame, useViewState, useBackHandler } from '../game.ts';
import { HeroCanvas, HeroTabs, ItemSlot, Win, fmt, nameClass } from '../widgets.tsx';
import type { CostumeSlot, EquipInst, EquipSlot, Hero } from '../../game/types.ts';
import { offhandOk } from '../../game/stats.ts';
import { ITEMS } from '../../game/data/items.ts';
import { canEquip, equip, equippedBy, itemName, unequipUid, equipAmmo, setCostume, sellAllEtc } from '../../game/state.ts';
import { itemIconURL } from '../../render/icons.ts';
import { CLASSES } from '../../game/data/classes.ts';

const LEFT: [EquipSlot, string][] = [['headTop', '머리 상단'], ['headMid', '머리 중단'], ['headLow', '머리 하단'], ['armor', '갑옷'], ['garment', '걸치기']];
const RIGHT: [EquipSlot, string][] = [['weapon', '무기'], ['shield', '방패'], ['shoes', '신발'], ['acc1', '액세서리'], ['acc2', '액세서리']];
const COSTUME: [CostumeSlot, string][] = [['headTop', '의상 상단'], ['headMid', '의상 중단'], ['headLow', '의상 하단'], ['garment', '의상 걸치기']];

function slotAccepts(slot: EquipSlot, id: string, h?: Hero) {
  const d = ITEMS[id];
  if (d.kind !== 'equip') return false;
  if (slot === 'acc1' || slot === 'acc2') return d.loc === 'acc';
  // 이도류: an assassin's left hand takes a dagger, one-hand sword or axe
  if (slot === 'shield' && h && d.loc === 'weapon') return offhandOk(h, d.wtype, d.twoHand);
  return d.loc === slot;
}

export function EquipPanel(props: { view?: 'equip' | 'costume' } = {}) {
  const g = useGame();
  const h = g.hero;
  const s = g.s;
  const [ownTab, setTab] = useState<'equip' | 'costume'>('equip');
  const tab = props.view ?? ownTab; // on the page shell the inner tab row picks the view
  const [pick, setPick] = useState<string | null>(null);
  useBackHandler(!!pick, () => setPick(null));
  const instOf = (uid?: number) => (uid === undefined ? undefined : s.equips.find((e) => e.uid === uid));
  const cell = (slot: EquipSlot, label: string, right: boolean) => {
    const inst = instOf(h.equip[slot]);
    // a two-hander shows greyed in the shield slot; an assassin's off-hand weapon there is its own piece
    const covered = inst && (ITEMS[inst.id].loc !== slot && !(slot.startsWith('acc')) && !(slot === 'shield' && inst.uid !== h.equip.weapon));
    return (
      <button class={'eslot' + (right ? ' r' : '') + (pick === slot ? ' on' : '')} style={pick === slot ? { borderColor: '#4e6ab4', background: '#eef3ff' } : undefined} onClick={() => setPick(pick === slot ? null : slot)}>
        {inst ? <img src={itemIconURL(inst.id)} /> : <span class="ph" />}
        <div>
          <div class="t">{label}</div>
          <div class={'n ' + (inst ? nameClass(inst.id) : '')}>{inst ? (covered ? '(' + ITEMS[inst.id].name + ')' : itemName(inst)) : '—'}</div>
        </div>
      </button>
    );
  };
  const cosCell = (slot: CostumeSlot, label: string) => {
    const inst = instOf(h.look.costume[slot]);
    return (
      <button class="eslot" style={pick === 'c:' + slot ? { borderColor: '#4e6ab4', background: '#eef3ff' } : undefined} onClick={() => setPick(pick === 'c:' + slot ? null : 'c:' + slot)}>
        {inst ? <img src={itemIconURL(inst.id)} /> : <span class="ph" />}
        <div><div class="t">{label}</div><div class="n">{inst ? ITEMS[inst.id].name : '—'}</div></div>
      </button>
    );
  };

  let candidates: EquipInst[] = [];
  let current: EquipInst | undefined;
  if (pick && !pick.startsWith('c:') && pick !== 'ammo') {
    const slot = pick as EquipSlot;
    current = instOf(h.equip[slot]);
    candidates = s.equips.filter((e) => slotAccepts(slot, e.id, h) && e.uid !== current?.uid);
  } else if (pick?.startsWith('c:')) {
    const cs = pick.slice(2) as CostumeSlot;
    current = instOf(h.look.costume[cs]);
    candidates = s.equips.filter((e) => ITEMS[e.id].loc === cs && e.uid !== current?.uid);
  }
  const usesBow = CLASSES[h.cls].weapons.includes('bow');
  const quivers = Object.keys(s.stacks).filter((id) => ITEMS[id].kind === 'ammo');

  return (
    <Win title={`장비 — ${h.name}`} onClose={() => g.openPanel(null)}>
      {!props.view && (
        <div class="tabs">
          <button class={tab === 'equip' ? 'on' : ''} onClick={() => { setTab('equip'); setPick(null); }}>장비</button>
          <button class={tab === 'costume' ? 'on' : ''} onClick={() => { setTab('costume'); setPick(null); }}>의상 (외형)</button>
        </div>
      )}
      <div class="win-body">
        <HeroTabs sel={g.sel} onSel={(i) => { g.sel = i; setPick(null); g.notify(); }} />
        {tab === 'equip' ? (
          <div class="doll">
            <div class="col">{LEFT.map(([sl, l]) => cell(sl, l, false))}</div>
            <HeroCanvas hero={h} zoom={2.05} anchor={10} />
            <div class="col">{RIGHT.map(([sl, l]) => cell(sl, sl === 'shield' && h.cls === 'assassin' ? '방패 · 왼손' : l, true))}</div>
          </div>
        ) : (
          <div class="doll">
            <div class="col">{COSTUME.slice(0, 2).map(([sl, l]) => cosCell(sl, l))}</div>
            <HeroCanvas hero={h} zoom={2.05} anchor={10} />
            <div class="col">{COSTUME.slice(2).map(([sl, l]) => cosCell(sl, l))}</div>
          </div>
        )}
        {tab === 'equip' && usesBow && (
          <div class="row" style={{ marginTop: '6px' }}>
            <button class="eslot" style={{ flex: 1 }} onClick={() => setPick(pick === 'ammo' ? null : 'ammo')}>
              {h.ammo ? <img src={itemIconURL(h.ammo)} /> : <span class="ph" />}
              <div><div class="t">화살통 (활 공격 속성)</div><div class="n">{h.ammo ? ITEMS[h.ammo].name : '— 없음: 무속성 기본 화살'}</div></div>
            </button>
          </div>
        )}
        {tab === 'costume' && <div class="hint" style={{ marginTop: '6px' }}>의상 칸에 넣은 머리장비·걸치기는 능력치 없이 <b>외형만</b> 바뀝니다. 장착한 장비보다 우선해서 보여요.</div>}

        {pick === 'ammo' && (
          <div class="box" style={{ marginTop: '6px' }}>
            {quivers.length === 0 && <div class="muted">화살통이 없습니다. 마을 도구 상점에서 구입하세요.</div>}
            {quivers.map((id) => (
              <div class="li" onClick={() => { const e = equipAmmo(s, h, id); if (e) g.toast(e, 'bad'); else g.commit('equip'); }}>
                <img src={itemIconURL(id)} /><div class="mid"><div class="nm">{ITEMS[id].name}</div><div class="small muted">{ITEMS[id].desc}</div></div>
                {h.ammo === id && <span class="chip">장착 중</span>}
              </div>
            ))}
            {h.ammo && <button class="btn sm" style={{ marginTop: '4px' }} onClick={() => { equipAmmo(s, h, undefined); g.commit('click'); }}>화살통 해제</button>}
          </div>
        )}
        {pick && pick !== 'ammo' && (
          <div class="box" style={{ marginTop: '6px' }}>
            {current && (
              <div class="li">
                <img src={itemIconURL(current.id)} />
                <div class="mid"><div class={'nm ' + nameClass(current.id)}>{itemName(current)}</div><div class="small muted">장착 중</div></div>
                <button class="btn sm" onClick={() => g.setModal({ kind: 'item', uid: current!.uid, heroIdx: g.sel })}>정보</button>
                <button class="btn sm" onClick={() => {
                  if (pick.startsWith('c:')) setCostume(s, h, pick.slice(2) as CostumeSlot, undefined); else unequipUid(s, h, current!.uid);
                  g.commit('equip');
                }}>해제</button>
              </div>
            )}
            {candidates.length === 0 && <div class="muted small" style={{ padding: '6px' }}>가방에 맞는 장비가 없습니다.</div>}
            {candidates.map((e) => {
              const err = pick.startsWith('c:') ? null : canEquip(h, e.id);
              const who = equippedBy(s, e.uid);
              const d = ITEMS[e.id];
              return (
                <div class="li" key={e.uid}>
                  <img src={itemIconURL(e.id)} />
                  <div class="mid">
                    <div class={'nm ' + nameClass(e.id)}>{itemName(e)}</div>
                    <div class="small muted">{d.atk ? `ATK ${d.atk} ` : ''}{d.def ? `DEF ${d.def} ` : ''}{d.matkPct ? `MATK+${d.matkPct}% ` : ''}{err ? <span style={{ color: '#c04040' }}>{err}</span> : who ? `${who.name} 장착 중` : ''}</div>
                  </div>
                  <button class="btn sm" onClick={() => g.setModal({ kind: 'item', uid: e.uid, heroIdx: g.sel })}>정보</button>
                  <button class="btn sm pri" disabled={!!err} onClick={() => {
                    if (pick.startsWith('c:')) { setCostume(s, h, pick.slice(2) as CostumeSlot, e.uid); g.commit('equip'); return; }
                    const r = equip(s, h, e.uid, pick as EquipSlot);
                    if (r) g.toast(r, 'bad'); else g.commit('equip');
                  }}>{pick.startsWith('c:') ? '입기' : '장착'}</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Win>
  );
}

type BagTab = 'equip' | 'use' | 'etc' | 'card';

export function BagPanel() {
  const g = useGame();
  const s = g.s;
  const [tab, setTab] = useViewState<BagTab>('bag.tab', 'equip');
  const stacks = Object.entries(s.stacks).filter(([id, n]) => n > 0 && ITEMS[id]);
  const of = (k: string[]) => stacks.filter(([id]) => k.includes(ITEMS[id].kind)).sort((a, b) => ITEMS[a[0]].price - ITEMS[b[0]].price);
  const equips = [...s.equips].sort((a, b) => (equippedBy(s, b.uid) ? 1 : 0) - (equippedBy(s, a.uid) ? 1 : 0) || ITEMS[a.id].loc!.localeCompare(ITEMS[b.id].loc!) || (ITEMS[b.id].price - ITEMS[a.id].price));
  const etcValue = stacks.filter(([id]) => ITEMS[id].kind === 'etc' && !id.startsWith('r_')).reduce((a, [id, n]) => a + Math.floor(ITEMS[id].price / 2) * n, 0);
  const counts = { equip: s.equips.length, use: of(['use', 'ammo']).length, etc: of(['etc']).length, card: of(['card']).length };
  return (
    <Win title="가방 (파티 공용)" onClose={() => g.openPanel(null)} right={<span class="small" style={{ color: '#ffe8a0' }}>{fmt(s.zeny)} z</span>}>
      <div class="tabs">
        {([['equip', '장비'], ['use', '소비'], ['etc', '기타'], ['card', '카드']] as [BagTab, string][]).map(([k, l]) => (
          <button class={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l} <span class="small muted">{counts[k]}</span></button>
        ))}
      </div>
      <div class="win-body">
        {tab === 'equip' && (
          <div class="grid">
            {equips.map((e) => <ItemSlot id={e.id} inst={e} equipped={!!equippedBy(s, e.uid)} onClick={() => g.setModal({ kind: 'item', uid: e.uid })} />)}
            {equips.length === 0 && <div class="muted">장비가 없습니다.</div>}
          </div>
        )}
        {tab !== 'equip' && (
          <div class="grid">
            {of(tab === 'use' ? ['use', 'ammo'] : [tab]).map(([id, n]) => <ItemSlot id={id} qty={n} onClick={() => g.setModal({ kind: 'item', id })} />)}
          </div>
        )}
        {tab === 'etc' && (
          <div class="box" style={{ marginTop: '8px' }}>
            <div class="row">
              <span>잡템 일괄 판매</span><span class="sp1" />
              <button class="btn sm gold" disabled={etcValue === 0} onClick={() => { const r = sellAllEtc(s); g.toast(`잡템 ${r.count}개 판매: +${fmt(r.zeny)} 제니`, 'good'); g.commit('zeny'); }}>판매 (약 {fmt(etcValue)}z~)</button>
            </div>
            <button class="set-row" role="switch" aria-checked={s.settings.autoSellEtc} style={{ marginTop: '6px' }} onClick={() => { s.settings.autoSellEtc = !s.settings.autoSellEtc; g.commit('click'); }}>
              <span>줍는 즉시 잡템 자동 판매</span><span class="sp1" /><small>{s.settings.autoSellEtc ? '켬' : '끔'}</small><span class={'toggle' + (s.settings.autoSellEtc ? ' on' : '')} aria-hidden="true" />
            </button>
            <div class="small muted" style={{ marginTop: '4px' }}>정련석·보석처럼 귀한 것은 팔지 않습니다. 파티에 상인이 있으면 바가지로 더 비싸게 팔려요.</div>
          </div>
        )}
        {tab === 'card' && counts.card === 0 && <div class="hint">카드는 몬스터가 아주 낮은 확률(약 0.1%)로 떨어뜨립니다. 사냥터 도감에서 확률을 확인하세요!</div>}
        {tab === 'card' && counts.card > 0 && (
          // cards are managed in one place: the 카드 page's owned list and slot board
          <button class="btn pri block" style={{ marginTop: '8px' }} onClick={() => g.openPage('cards', 'slots')}>카드 관리에서 꽂기 ›</button>
        )}
      </div>
    </Win>
  );
}
