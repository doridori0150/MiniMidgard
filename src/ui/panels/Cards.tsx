import { useRef, useState } from 'preact/hooks';
import { useGame } from '../game.ts';
import { CardArt, HeroTabs, Win, nameClass } from '../widgets.tsx';
import { ITEMS } from '../../game/data/items.ts';
import { MONSTERS } from '../../game/data/monsters.ts';
import { ZONES } from '../../game/data/zones.ts';
import { cardFits, compound, equippedBy, itemName } from '../../game/state.ts';
import { addBonus } from '../../game/stats.ts';
import { itemIconURL } from '../../render/icons.ts';
import { bonusLines } from '../format.ts';
import type { Bonus, CardLoc, EquipInst, EquipSlot, GameState } from '../../game/types.ts';

const SLOT_ROWS: [EquipSlot, string][] = [
  ['weapon', '무기'], ['shield', '방패'], ['armor', '갑옷'], ['garment', '걸치기'], ['shoes', '신발'],
  ['acc1', '액세서리'], ['acc2', '액세서리'], ['headTop', '머리 상'], ['headMid', '머리 중'], ['headLow', '머리 하'],
];
const LOC_KO: Record<CardLoc, string> = { weapon: '무기', armor: '갑옷', shield: '방패', garment: '걸치기', shoes: '신발', acc: '액세서리', head: '머리' };
const LOC_ORDER: CardLoc[] = ['weapon', 'armor', 'shield', 'garment', 'shoes', 'acc', 'head'];

const ownedCards = (s: GameState) => Object.keys(s.stacks).filter((id) => (s.stacks[id] ?? 0) > 0 && ITEMS[id]?.kind === 'card');

/** cards in the bag that fit an empty slot of some owned equipment (drives the nav badge) */
export function insertableCards(s: GameState): number {
  const open = s.equips.filter((e) => e.cards.includes(null));
  if (!open.length) return 0;
  return ownedCards(s).filter((c) => open.some((e) => cardFits(c, e))).length;
}

function cardRate(mobId: string): number {
  return MONSTERS[mobId]?.drops.find((d) => d.id === 'c_' + mobId)?.rate ?? 0;
}

function pct(r: number) {
  const p = r * 100;
  return (p >= 1 ? p.toFixed(0) : p >= 0.1 ? p.toFixed(1) : p.toFixed(2)) + '%';
}

export function CardPanel() {
  const g = useGame();
  const s = g.s;
  const h = g.hero;
  const [tab, setTab] = useState<'slots' | 'book'>('slots');
  const [filter, setFilter] = useState<CardLoc | 'all'>('all');
  const [pickCard, setPickCard] = useState<string | null>(null);
  const [pickEquip, setPickEquip] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const doCompound = (inst: EquipInst, card: string) => {
    g.setModal({
      kind: 'confirm', text: `${itemName(inst)}에\n${ITEMS[card].name}를 꽂을까요?\n\n한 번 꽂은 카드는 뺄 수 없습니다.`,
      ok: () => {
        const e = compound(s, inst.uid, card);
        if (e) { g.toast(e, 'bad'); return; }
        setPickCard(null); setPickEquip(null);
        g.toast(`카드 장착! ${itemName(inst)}`, 'card');
        g.commit('refine_ok');
      },
    });
  };

  // equipped gear of the selected hero (two-handed weapons / multi-slot headgear appear once)
  const seen = new Set<number>();
  const rows: { label: string; inst?: EquipInst }[] = [];
  for (const [slot, label] of SLOT_ROWS) {
    const uid = h.equip[slot];
    if (uid !== undefined && seen.has(uid)) continue;
    if (uid !== undefined) seen.add(uid);
    rows.push({ label, inst: uid === undefined ? undefined : s.equips.find((e) => e.uid === uid) });
  }
  const spare = s.equips.filter((e) => e.slots > 0 && !equippedBy(s, e.uid));

  const total: Bonus = {};
  let inserted = 0, empty = 0;
  for (const r of rows) for (const c of r.inst?.cards ?? []) { if (c) { addBonus(total, ITEMS[c].bonus); inserted++; } else empty++; }
  const totalLines = bonusLines(total);

  const owned = ownedCards(s).sort((a, b) => LOC_ORDER.indexOf(ITEMS[a].cardLoc!) - LOC_ORDER.indexOf(ITEMS[b].cardLoc!) || ITEMS[a].name.localeCompare(ITEMS[b].name));
  const pickInst = pickEquip !== null ? s.equips.find((e) => e.uid === pickEquip) : undefined;
  const list = owned.filter((c) => (pickInst ? cardFits(c, pickInst) : filter === 'all' || ITEMS[c].cardLoc === filter));

  const equipRow = (label: string, inst: EquipInst | undefined, key: string) => {
    const hot = (c: string | null) => c === null && !!inst && !!pickCard && cardFits(pickCard, inst);
    return (
      <div key={key} class={'cb-row' + (inst && pickEquip === inst.uid ? ' on' : '') + (!inst || inst.slots === 0 ? ' dim' : '')}>
        <span class="cb-lab">{label}</span>
        <button class="cb-item" disabled={!inst} onClick={() => inst && g.setModal({ kind: 'item', uid: inst.uid, heroIdx: g.sel })}>
          {inst ? <img src={itemIconURL(inst.id)} alt="" /> : <span class="cb-ph" />}
          <b class={inst ? nameClass(inst.id) : ''}>{inst ? itemName(inst) : '—'}</b>
        </button>
        <div class="cb-boxes">
          {inst && inst.slots === 0 && <span class="cb-none">슬롯 없음</span>}
          {inst?.cards.map((c, i) => c ? (
            <button key={i} class="cslot full" title={ITEMS[c].name} onClick={() => g.setModal({ kind: 'item', id: c })}><img src={itemIconURL(c)} alt={ITEMS[c].name} /></button>
          ) : (
            <button key={i} class={'cslot' + (hot(c) ? ' hot' : '') + (pickEquip === inst.uid ? ' on' : '')} aria-label="빈 카드 슬롯"
              onClick={() => {
                if (pickCard && cardFits(pickCard, inst)) { doCompound(inst, pickCard); return; }
                setPickCard(null);
                setPickEquip(pickEquip === inst.uid ? null : inst.uid);
                setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
              }}>+</button>
          ))}
        </div>
      </div>
    );
  };

  // collection book
  const bookZones = ZONES.filter((z) => z.mobs.length > 0);
  const bookIds = (zid: string) => {
    const z = ZONES.find((x) => x.id === zid)!;
    return [...z.mobs.map((m) => m.id), ...(z.boss ? [z.boss] : []), ...(z.mvp ? [z.mvp] : [])].filter((id) => ITEMS['c_' + id]);
  };
  const allBook = [...new Set(bookZones.flatMap((z) => bookIds(z.id)))];
  const found = allBook.filter((id) => s.book[id]?.card).length;

  return (
    <Win title="카드" onClose={() => g.openPanel(null)}>
      <div class="tabs">
        <button class={tab === 'slots' ? 'on' : ''} onClick={() => setTab('slots')}>슬롯 관리</button>
        <button class={tab === 'book' ? 'on' : ''} onClick={() => setTab('book')}>카드 도감 <small>{found}/{allBook.length}</small></button>
      </div>
      {tab === 'slots' ? (
        <div class="win-body cards-body" key="slots">
          <HeroTabs sel={g.sel} onSel={(i) => { g.sel = i; setPickEquip(null); g.notify(); }} />
          {(pickCard || pickInst) && (
            <div class="cb-pickbar">
              {pickCard
                ? <><img src={itemIconURL(pickCard)} alt="" /><span><b>{ITEMS[pickCard].name}</b> — 빛나는 빈 슬롯을 누르세요</span></>
                : <><img src={itemIconURL(pickInst!.id)} alt="" /><span><b>{itemName(pickInst!)}</b>에 꽂을 카드를 고르세요</span></>}
              <button class="btn xs" onClick={() => { setPickCard(null); setPickEquip(null); }}>취소</button>
            </div>
          )}
          <div class="cb-head" ref={boardRef}>
            <b>장착 장비</b><span class="muted small">카드 {inserted}장 · 빈 슬롯 {empty}칸</span>
          </div>
          <div class="cb-board">{rows.map((r, i) => equipRow(r.label, r.inst, 'e' + i))}</div>
          <div class="cb-total">
            <div class="cb-total-t">카드 효과 합계</div>
            {totalLines.length ? <div class="cb-chips">{totalLines.map((l) => <span class="chip">{l}</span>)}</div> : <div class="muted small">아직 꽂힌 카드가 없습니다. 카드는 몬스터가 드물게 떨어뜨립니다.</div>}
          </div>
          {spare.length > 0 && (
            <details class="cb-spare" open={!!pickCard && spare.some((e) => e.cards.includes(null) && cardFits(pickCard, e))}>
              <summary>가방 속 슬롯 장비 <span class="muted small">{spare.length}개</span></summary>
              <div class="cb-board">{spare.map((e) => equipRow(ITEMS[e.id].loc === 'acc' ? '액세서리' : LOC_KO[(ITEMS[e.id].loc?.startsWith('head') ? 'head' : ITEMS[e.id].loc) as CardLoc] ?? '장비', e, 's' + e.uid))}</div>
            </details>
          )}

          <div class="cb-head" ref={listRef}>
            <b>보유 카드</b><span class="muted small">{owned.reduce((a, c) => a + (s.stacks[c] ?? 0), 0)}장</span>
          </div>
          {!pickInst && (
            <div class="chips-scroll">
              {(['all', ...LOC_ORDER] as const).map((l) => (
                <button class={'fchip' + (filter === l ? ' on' : '')} onClick={() => setFilter(l)}>{l === 'all' ? '전체' : LOC_KO[l]}</button>
              ))}
            </div>
          )}
          <div class="crow-list">
            {list.length === 0 && <div class="muted small cb-empty">{pickInst ? '이 장비에 꽂을 수 있는 카드가 없습니다.' : owned.length ? '이 부위에 꽂는 카드가 없습니다.' : '보유한 카드가 없습니다. 사냥하다 보면 카드가 떨어져요!'}</div>}
            {list.map((c) => {
              const d = ITEMS[c];
              const fitsSomewhere = s.equips.some((e) => e.cards.includes(null) && cardFits(c, e));
              return (
                <div class={'crow' + (pickCard === c ? ' on' : '')} key={c}>
                  <button class="crow-main" onClick={() => g.setModal({ kind: 'item', id: c })}>
                    <img src={itemIconURL(c)} alt="" />
                    <span class="crow-txt">
                      <span class="crow-nm"><b class={nameClass(c)}>{d.name}</b>{(s.stacks[c] ?? 0) > 1 && <span class="crow-q">×{s.stacks[c]}</span>}</span>
                      <span class="crow-fx">{bonusLines(d.bonus).join(' · ') || d.desc}</span>
                    </span>
                    <span class="chip loc">{LOC_KO[d.cardLoc!]}</span>
                  </button>
                  <button class={'btn sm' + (fitsSomewhere ? ' gold' : '')} disabled={!fitsSomewhere}
                    onClick={() => {
                      if (pickInst && cardFits(c, pickInst)) { doCompound(pickInst, c); return; }
                      setPickEquip(null);
                      setPickCard(pickCard === c ? null : c);
                      setTimeout(() => boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
                    }}>{pickInst ? '꽂기' : pickCard === c ? '선택됨' : '꽂기'}</button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div class="win-body cards-body" key="book">
          <div class="book-prog">
            <div class="book-prog-t"><b>수집 {found}</b> / {allBook.length}</div>
            <div class="mini-bar ex"><i style={{ width: (allBook.length ? found / allBook.length * 100 : 0) + '%' }} /></div>
          </div>
          {bookZones.map((z) => {
            const ids = bookIds(z.id);
            const n = ids.filter((id) => s.book[id]?.card).length;
            return (
              <div class="book-zone" key={z.id}>
                <div class="cb-head"><b>{z.name}</b><span class="muted small">Lv {z.lv[0]}~{z.lv[1]} · {n}/{ids.length}</span></div>
                <div class="book-grid">
                  {ids.map((id) => {
                    const m = MONSTERS[id];
                    const got = !!s.book[id]?.card;
                    return (
                      <button key={id} class={'book-card' + (got ? '' : ' unk') + (m.boss ? ' ' + m.boss : '')}
                        onClick={() => g.setModal(got ? { kind: 'item', id: 'c_' + id } : { kind: 'mob', id })}>
                        {got ? <CardArt id={'c_' + id} w={64} h={90} /> : <span class="book-back">?</span>}
                        <span class="book-nm">{m.name}</span>
                        <span class="book-rate">{got ? LOC_KO[ITEMS['c_' + id].cardLoc!] : pct(cardRate(id))}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div class="hint">도감은 한 번이라도 얻은 카드를 기록합니다. 아직 못 얻은 카드는 몬스터 정보와 드롭률을 볼 수 있어요.</div>
        </div>
      )}
    </Win>
  );
}
