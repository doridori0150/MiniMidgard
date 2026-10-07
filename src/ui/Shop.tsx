// Card-style shops (buy / sell) and the buy / sell modals.
import { useState } from 'preact/hooks';
import { useGame } from './game.ts';
import { HeroTabs, LookCanvas, fmt, nameClass } from './widgets.tsx';
import { ITEMS, SHOPS } from '../game/data/items.ts';
import type { ItemDef, EquipInst, Hero } from '../game/types.ts';
import { buy, buyPrice, canEquip, equip, equippedBy, itemName, sellEquip, sellPrice, sellStack, sellAllEtc, addEquip, slotsFor, equipAmmo, quickTrigger, isKeepItem } from '../game/state.ts';
import { findEquip, partyPerks } from '../game/stats.ts';
import { NPC_LOOKS } from '../render/field.ts';
import { itemIconURL } from '../render/icons.ts';
import { bonusLines, itemTypeLine, jobsLine } from './format.ts';
import { WEAPON_KO } from '../game/data/elements.ts';
import { audio } from '../audio/audio.ts';

export type ShopId = 'tool' | 'weapon' | 'armor' | 'costume';

const CATS: Record<ShopId, { id: string; label: string; test: (d: ItemDef) => boolean }[]> = {
  weapon: [
    { id: 'all', label: '전체', test: () => true },
    ...(['dagger', 'sword', 'sword2h', 'spear', 'staff', 'bow', 'mace', 'axe', 'katar'] as const).map((w) => ({ id: w, label: WEAPON_KO[w], test: (d: ItemDef) => d.wtype === w })),
  ],
  armor: [
    { id: 'all', label: '전체', test: () => true },
    { id: 'armor', label: '갑옷', test: (d) => d.loc === 'armor' },
    { id: 'shield', label: '방패', test: (d) => d.loc === 'shield' },
    { id: 'garment', label: '걸치기', test: (d) => d.loc === 'garment' },
    { id: 'shoes', label: '신발', test: (d) => d.loc === 'shoes' },
    { id: 'acc', label: '액세서리', test: (d) => d.loc === 'acc' },
    { id: 'head', label: '머리', test: (d) => !!d.loc?.startsWith('head') },
  ],
  tool: [
    { id: 'all', label: '전체', test: () => true },
    { id: 'heal', label: '회복', test: (d) => !!d.heal },
    { id: 'buff', label: '버프', test: (d) => !!d.buff },
    { id: 'refine', label: '정련석', test: (d) => d.id.startsWith('r_') },
    { id: 'ammo', label: '화살', test: (d) => d.kind === 'ammo' },
  ],
  costume: [{ id: 'all', label: '전체', test: () => true }],
};

const NPC_OF: Record<ShopId, { npc: string; name: string; line: string }> = {
  tool: { npc: 'tool', name: '도구상인 펨', line: '포션은 넉넉히! 사냥은 길어요~' },
  weapon: { npc: 'weapon', name: '무기상인 그란', line: '좋은 무기는 좋은 사냥을 부르지.' },
  armor: { npc: 'armor', name: '방어구상인 엘라', line: '튼튼하게 입어야 오래 버텨요.' },
  costume: { npc: 'stylist', name: '미용사 루루', line: '외형은 의상 칸에 넣으면 돼요!' },
};

/** the item currently worn in the slot this item would go to */
export function currentFor(s: import('../game/types.ts').GameState, h: Hero, d: ItemDef): EquipInst | undefined {
  if (d.kind !== 'equip') return undefined;
  const slots = slotsFor(d.id);
  for (const sl of slots) { const e = findEquip(s, h.equip[sl]); if (e) return e; }
  return undefined;
}

function mainStat(d: ItemDef): string {
  if (d.kind === 'use') return d.heal?.hp ? `HP ${d.heal.hp[0]}~${d.heal.hp[1]}${d.heal.sp ? ` · SP ${d.heal.sp[0]}~` : ''}` : d.heal?.sp ? `SP ${d.heal.sp[0]}~${d.heal.sp[1]}` : d.buff ? `${d.buff.name} ${Math.round(d.buff.dur / 60000)}분` : '';
  if (d.kind === 'ammo') return `ATK ${d.atk}`;
  if (d.kind === 'etc') return d.desc;
  const parts: string[] = [];
  if (d.loc === 'weapon') parts.push(`ATK ${d.atk}`);
  if (d.matkPct) parts.push(`MATK+${d.matkPct}%`);
  if (d.loc !== 'weapon' && d.def) parts.push(`DEF ${d.def}`);
  if (d.mdef) parts.push(`MDEF ${d.mdef}`);
  const b = bonusLines(d.bonus)[0];
  if (b && parts.length < 2) parts.push(b);
  return parts.join(' · ');
}

/** positive = better than what the hero wears now */
export function upgradeScore(s: import('../game/types.ts').GameState, h: Hero, d: ItemDef): number | null {
  if (d.kind !== 'equip' || canEquip(h, d.id)) return null;
  const cur = currentFor(s, h, d);
  if (!cur) return null;
  const c = ITEMS[cur.id];
  if (d.loc === 'weapon') return (d.atk ?? 0) + (d.matkPct ?? 0) * 3 - ((c.atk ?? 0) + cur.refine * 3 + (c.matkPct ?? 0) * 3);
  return (d.def ?? 0) + (d.mdef ?? 0) * 0.3 - ((c.def ?? 0) + cur.refine + (c.mdef ?? 0) * 0.3);
}

type ShopLayout = 'list' | 'grid';
const LAYOUT_KEY = 'minimidgard.shopLayout';
function loadLayout(): ShopLayout {
  try { return localStorage.getItem(LAYOUT_KEY) === 'grid' ? 'grid' : 'list'; } catch { return 'list'; }
}

function fitText(d: ItemDef, h: Hero, err: string | null) {
  if (d.kind === 'equip' || d.kind === 'ammo') return err ? (d.reqLv && h.baseLv < d.reqLv ? `Lv ${d.reqLv} 필요` : '장착 불가') : '장착 가능';
  if (d.kind === 'use') return quickTrigger(d.id) === 'buff' ? '파티 버프' : '회복';
  return '재료';
}

function quickBuy(g: ReturnType<typeof useGame>, d: ItemDef, n: number) {
  const e = buy(g.s, d.id, n);
  if (e) { g.toast(e, 'bad'); audio.play('error'); return; }
  g.toast(`${d.name}${n > 1 ? ` ×${n}` : ''} 구매 (-${fmt(buyPrice(g.s, d.id) * n)}z)`, 'good');
  g.commit('zeny');
}

/** buy one and put it straight on the selected hero */
function quickBuyEquip(g: ReturnType<typeof useGame>, d: ItemDef, h: Hero) {
  const e = buy(g.s, d.id, 1);
  if (e) { g.toast(e, 'bad'); audio.play('error'); return; }
  if (d.kind === 'ammo') equipAmmo(g.s, h, d.id);
  else {
    const r = equip(g.s, h, g.s.equips[g.s.equips.length - 1].uid);
    if (r) { g.toast(r, 'bad'); g.commit('zeny'); return; }
  }
  g.toast(`${h.name}: ${d.name} 장착!`, 'good');
  g.commit('zeny');
}

/** one-line row: tap the row for details, tap the button to buy right away */
function ShopRow(props: { d: ItemDef; h: Hero; onOpen: () => void }) {
  const g = useGame();
  const { d, h } = props;
  const price = buyPrice(g.s, d.id);
  const err = d.kind === 'equip' || d.kind === 'ammo' ? canEquip(h, d.id) : null;
  const up = upgradeScore(g.s, h, d);
  const have = d.kind !== 'equip' ? g.s.stacks[d.id] ?? 0 : g.s.equips.filter((e) => e.id === d.id).length;
  const stack = d.kind === 'use';
  return (
    <div class={'srow ' + (d.kind === 'equip' ? 'eq-' + (d.loc ?? '') : d.kind) + (err ? ' cant' : '')} onClick={props.onOpen}>
      <span class="sr-icon"><img src={itemIconURL(d.id)} alt="" /></span>
      <div class="sr-mid">
        <div class="sr-name">
          <b class={nameClass(d.id)}>{d.name}</b>
          {up !== null && up > 0 && <i class="sr-up">추천▲</i>}
          {have > 0 && <i class="sr-have">보유 {have}</i>}
        </div>
        <div class="sr-stat">{mainStat(d)}</div>
        <span class={'sr-fit ' + (err ? 'no' : 'ok')}>{fitText(d, h, err)}</span>
      </div>
      <div class="sr-right" onClick={(e) => e.stopPropagation()}>
        <span class={'sr-price' + (g.s.zeny >= price ? '' : ' poor')}>{fmt(price)}z</span>
        <div class="sr-btns">
          {(d.kind === 'equip' || d.kind === 'ammo') && !err && <button class="btn sm gold" disabled={g.s.zeny < price} onClick={() => quickBuyEquip(g, d, h)}>장착</button>}
          <button class="btn sm pri" disabled={g.s.zeny < price} onClick={() => quickBuy(g, d, 1)}>구매</button>
          {stack && <button class="btn sm" disabled={g.s.zeny < price * 10} onClick={() => quickBuy(g, d, 10)}>×10</button>}
        </div>
      </div>
    </div>
  );
}

/** compact 3-column tile (tap = details/buy) */
function ShopTile(props: { d: ItemDef; h: Hero; onOpen: () => void }) {
  const g = useGame();
  const { d, h } = props;
  const price = buyPrice(g.s, d.id);
  const err = d.kind === 'equip' || d.kind === 'ammo' ? canEquip(h, d.id) : null;
  const up = upgradeScore(g.s, h, d);
  return (
    <button class={'stile ' + (d.kind === 'equip' ? 'eq-' + (d.loc ?? '') : d.kind) + (err ? ' cant' : '')} onClick={props.onOpen}>
      {up !== null && up > 0 && <span class="st-up">▲</span>}
      <span class="st-icon"><img src={itemIconURL(d.id)} alt="" /></span>
      <span class={'st-name ' + nameClass(d.id)}>{d.name}</span>
      <span class="st-stat">{mainStat(d)}</span>
      <span class={'st-price' + (g.s.zeny >= price ? '' : ' poor')}>{fmt(price)}z</span>
    </button>
  );
}

export function ShopView(props: { shop: ShopId; noHeader?: boolean }) {
  const g = useGame();
  const s = g.s;
  const h = g.hero;
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [cat, setCat] = useState('all');
  const [layout, setLayoutState] = useState<ShopLayout>(loadLayout);
  const setLayout = (l: ShopLayout) => { setLayoutState(l); try { localStorage.setItem(LAYOUT_KEY, l); } catch { /* ignore */ } };
  const shop = SHOPS[props.shop];
  const cats = CATS[props.shop];
  const test = cats.find((c) => c.id === cat)?.test ?? (() => true);
  const items = shop.items.map((id) => ITEMS[id]).filter(test);
  const perks = partyPerks(s);
  const npc = NPC_OF[props.shop];
  const usedCats = cats.filter((c) => c.id === 'all' || shop.items.some((id) => c.test(ITEMS[id])));
  return (
    <div class="shop">
      {!props.noHeader && (
        <div class="shop-head">
          <LookCanvas look={NPC_LOOKS[npc.npc]} face class="shop-npc" />
          <div class="shop-bubble"><b>{npc.name}</b> <span>{npc.line}</span></div>
        </div>
      )}
      <div class="row" style={{ margin: '6px 0' }}>
        <div class="seg"><button class={mode === 'buy' ? 'on' : ''} onClick={() => setMode('buy')}>구매</button><button class={mode === 'sell' ? 'on' : ''} onClick={() => setMode('sell')}>판매</button></div>
        {(perks.discount > 0 || perks.overcharge > 0) && <span class="perk">{mode === 'buy' ? (perks.discount ? `할인 -${perks.discount}%` : '') : (perks.overcharge ? `바가지 +${perks.overcharge}%` : '')}</span>}
        <span class="sp1" />
        <div class="seg view" role="group" aria-label="보기 방식">
          <button class={layout === 'list' ? 'on' : ''} aria-label="목록으로 보기" onClick={() => setLayout('list')}>☰</button>
          <button class={layout === 'grid' ? 'on' : ''} aria-label="카드로 보기" onClick={() => setLayout('grid')}>▦</button>
        </div>
      </div>
      {mode === 'buy' && (
        <>
          <HeroTabs sel={g.sel} onSel={(i) => { g.sel = i; g.notify(); }} />
          {usedCats.length > 2 && (
            <div class="cat-chips">
              {usedCats.map((c) => <button class={cat === c.id ? 'on' : ''} onClick={() => { setCat(c.id); audio.play('click'); }}>{c.label}</button>)}
            </div>
          )}
          {layout === 'list' ? (
            <div class="srows">
              {items.map((d) => <ShopRow d={d} h={h} onOpen={() => { audio.play('open'); g.setModal({ kind: 'buy', id: d.id }); }} />)}
            </div>
          ) : (
            <div class="stiles">
              {items.map((d) => <ShopTile d={d} h={h} onOpen={() => { audio.play('open'); g.setModal({ kind: 'buy', id: d.id }); }} />)}
            </div>
          )}
        </>
      )}
      {mode === 'sell' && <SellGrid layout={layout} />}
    </div>
  );
}

function SellGrid(props: { layout: ShopLayout }) {
  const g = useGame();
  const s = g.s;
  const stacks = Object.entries(s.stacks).filter(([id, n]) => n > 0 && ITEMS[id] && ITEMS[id].kind !== 'ammo').sort((a, b) => ITEMS[a[0]].kind.localeCompare(ITEMS[b[0]].kind) || sellPrice(s, b[0]) - sellPrice(s, a[0]));
  const eqs = s.equips.filter((e) => !equippedBy(s, e.uid));
  const junk = stacks.filter(([id]) => ITEMS[id].kind === 'etc' && !isKeepItem(id));
  const junkZ = junk.reduce((a, [id, n]) => a + sellPrice(s, id) * n, 0);
  const precious = (id: string) => ITEMS[id].kind === 'card' || isKeepItem(id);
  const sellNow = (id: string, n: number) => { const z = sellStack(s, id, n); if (z) g.toast(`+${fmt(z)} 제니`, 'good'); g.commit('zeny'); };
  return (
    <>
      <div class="sell-bar">
        <div><b>잡템 {junk.reduce((a, [, n]) => a + n, 0)}개</b><small>정련석·보석·카드는 제외</small></div>
        <span class="sp1" />
        <button class="btn gold" disabled={junkZ === 0} onClick={() => { const r = sellAllEtc(s); g.toast(`잡템 ${r.count}개 판매 +${fmt(r.zeny)}z`, 'good'); g.commit('zeny'); }}>일괄 판매 {fmt(junkZ)}z</button>
      </div>
      {props.layout === 'grid' ? (
        <div class="stiles">
          {eqs.map((e) => (
            <button class={'stile eq-' + (ITEMS[e.id].loc ?? '')} onClick={() => g.setModal({ kind: 'sell', uid: e.uid })}>
              <span class="st-icon"><img src={itemIconURL(e.id)} alt="" /></span>
              <span class={'st-name ' + nameClass(e.id)}>{itemName(e)}</span>
              <span class="st-price sell">{fmt(sellPrice(s, e.id, e.refine))}z</span>
            </button>
          ))}
          {stacks.map(([id, n]) => (
            <button class={'stile ' + ITEMS[id].kind} onClick={() => g.setModal({ kind: 'sell', id })}>
              <span class="st-qty">×{fmt(n)}</span>
              <span class="st-icon"><img src={itemIconURL(id)} alt="" /></span>
              <span class={'st-name ' + nameClass(id)}>{ITEMS[id].name}</span>
              <span class="st-price sell">{fmt(sellPrice(s, id))}z</span>
            </button>
          ))}
        </div>
      ) : (
        <div class="srows">
          {eqs.map((e) => (
            <div class={'srow eq-' + (ITEMS[e.id].loc ?? '')} onClick={() => g.setModal({ kind: 'sell', uid: e.uid })}>
              <span class="sr-icon"><img src={itemIconURL(e.id)} alt="" /></span>
              <div class="sr-mid"><div class="sr-name"><b class={nameClass(e.id)}>{itemName(e)}</b></div><div class="sr-stat">{mainStat(ITEMS[e.id])}</div></div>
              <div class="sr-right" onClick={(ev) => ev.stopPropagation()}>
                <span class="sr-price">{fmt(sellPrice(s, e.id, e.refine))}z</span>
                <div class="sr-btns"><button class="btn sm gold" onClick={() => g.setModal({ kind: 'sell', uid: e.uid })}>판매</button></div>
              </div>
            </div>
          ))}
          {stacks.map(([id, n]) => (
            <div class={'srow ' + ITEMS[id].kind} onClick={() => g.setModal({ kind: 'sell', id })}>
              <span class="sr-icon"><img src={itemIconURL(id)} alt="" /></span>
              <div class="sr-mid"><div class="sr-name"><b class={nameClass(id)}>{ITEMS[id].name}</b><i class="sr-have">×{fmt(n)}</i></div><div class="sr-stat">개당 {fmt(sellPrice(s, id))}z</div></div>
              <div class="sr-right" onClick={(ev) => ev.stopPropagation()}>
                <span class="sr-price">{fmt(sellPrice(s, id) * n)}z</span>
                <div class="sr-btns">
                  <button class="btn sm" onClick={() => (precious(id) ? g.setModal({ kind: 'sell', id }) : sellNow(id, 1))}>1개</button>
                  <button class="btn sm gold" onClick={() => (precious(id) ? g.setModal({ kind: 'sell', id }) : sellNow(id, n))}>모두</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {eqs.length + stacks.length === 0 && <div class="hint">팔 물건이 없습니다.</div>}
    </>
  );
}

function Qty(props: { n: number; max: number; set: (n: number) => void }) {
  const { n, max } = props;
  return (
    <div class="qty">
      <button class="btn sm" disabled={n <= 1} onClick={() => props.set(Math.max(1, n - 1))}>−</button>
      <b>{n}</b>
      <button class="btn sm" disabled={n >= max} onClick={() => props.set(Math.min(max, n + 1))}>+</button>
      {[10, 50].map((k) => <button class="btn sm" disabled={max < 1} onClick={() => props.set(Math.max(1, Math.min(max, n + k)))}>+{k}</button>)}
      <button class="btn sm" disabled={max < 1} onClick={() => props.set(Math.max(1, max))}>최대</button>
    </div>
  );
}

export function BuyModal(props: { id: string }) {
  const g = useGame();
  const s = g.s;
  const d = ITEMS[props.id];
  const h = g.hero;
  const price = buyPrice(s, d.id);
  const stack = d.kind !== 'equip';
  const maxQ = Math.max(0, Math.min(999, Math.floor(s.zeny / price)));
  const [q, setQ] = useState(1);
  const err = d.kind === 'equip' || d.kind === 'ammo' ? canEquip(h, d.id) : null;
  const cur = currentFor(s, h, d);
  const lines = bonusLines(d.bonus);
  const cmp = cur && d.kind === 'equip' ? (() => {
    const c = ITEMS[cur.id];
    const key = d.loc === 'weapon' ? 'ATK' : 'DEF';
    const a = d.loc === 'weapon' ? (c.atk ?? 0) + cur.refine * 3 : (c.def ?? 0) + cur.refine;
    const b = d.loc === 'weapon' ? d.atk ?? 0 : d.def ?? 0;
    return { key, a, b, name: itemName(cur) };
  })() : null;
  const doBuy = (andEquip: boolean) => {
    const n = stack ? q : 1;
    const e = buy(s, d.id, n);
    if (e) { g.toast(e, 'bad'); audio.play('error'); return; }
    if (andEquip && d.kind === 'equip') {
      const inst = s.equips[s.equips.length - 1];
      const r = equip(s, h, inst.uid);
      if (r) g.toast(r, 'bad'); else g.toast(`${h.name}: ${d.name} 장착!`, 'good');
    } else if (andEquip && d.kind === 'ammo') {
      equipAmmo(s, h, d.id);
      g.toast(`${h.name}: ${d.name} 장착!`, 'good');
    } else g.toast(`${d.name}${n > 1 ? ` ×${n}` : ''} 구매 (-${fmt(price * n)}z)`, 'good');
    g.commit('zeny');
    g.setModal(null);
  };
  void addEquip;
  return (
    <div class="modal buy">
      <div class="win-title"><span>구매</span><span class="sp" /><button class="x" aria-label="닫기" onClick={() => g.popModal()}>×</button></div>
      <div class="win-body">
        <div class="buy-hero">
          <span class="bh-icon"><img src={itemIconURL(d.id)} alt="" /></span>
          <div>
            <div class={'item-name ' + nameClass(d.id)}>{d.name}</div>
            <div class="small muted">{itemTypeLine(d)}{d.reqLv && d.reqLv > 1 ? ` · Lv ${d.reqLv}` : ''}</div>
            <div class="bh-stat">{mainStat(d)}</div>
          </div>
        </div>
        {lines.length > 0 && <div class="desc" style={{ color: '#2a5ab0' }}>{lines.join('  ·  ')}</div>}
        <div class="desc">{d.desc}</div>
        {(d.kind === 'equip' || d.kind === 'ammo') && <div class="small muted" style={{ marginTop: '6px' }}>장착: {jobsLine(d)}</div>}
        {(d.kind === 'equip' || d.kind === 'ammo') && (
          <div class={'fit-box ' + (err ? 'no' : 'ok')}>
            <b>{h.name}</b> {err ? `— ${err}` : '— 장착할 수 있습니다'}
            {cmp && !err && (
              <div class="cmp">
                현재 <span>{cmp.name}</span> {cmp.key} {cmp.a} → <b>{cmp.b}</b>
                <i class={cmp.b > cmp.a ? 'upv' : cmp.b < cmp.a ? 'downv' : ''}>{cmp.b > cmp.a ? `▲${cmp.b - cmp.a}` : cmp.b < cmp.a ? `▼${cmp.a - cmp.b}` : '='}</i>
              </div>
            )}
          </div>
        )}
        {stack && <Qty n={q} max={Math.max(1, maxQ)} set={setQ} />}
        <div class="buy-total">합계 <b class={s.zeny >= price * (stack ? q : 1) ? '' : 'poor'}>{fmt(price * (stack ? q : 1))} z</b> <small>보유 {fmt(s.zeny)} z</small></div>
      </div>
      <div class="foot">
        <button class="btn" onClick={() => g.popModal()}>닫기</button>
        {(d.kind === 'equip' || d.kind === 'ammo') && !err && <button class="btn gold" disabled={s.zeny < price} onClick={() => doBuy(true)}>사서 바로 장착</button>}
        <button class="btn pri" disabled={s.zeny < price * (stack ? q : 1)} onClick={() => doBuy(false)}>구매</button>
      </div>
    </div>
  );
}

export function SellModal(props: { id?: string; uid?: number }) {
  const g = useGame();
  const s = g.s;
  const inst = props.uid !== undefined ? s.equips.find((e) => e.uid === props.uid) : undefined;
  const id = inst?.id ?? props.id!;
  const d = ITEMS[id];
  const have = inst ? 1 : s.stacks[id] ?? 0;
  const [q, setQ] = useState(Math.max(1, d.kind === 'etc' && !d.rarity ? have : 1));
  if (!d || have <= 0) return null;
  const unit = sellPrice(s, id, inst?.refine ?? 0);
  return (
    <div class="modal buy">
      <div class="win-title"><span>판매</span><span class="sp" /><button class="x" aria-label="닫기" onClick={() => g.popModal()}>×</button></div>
      <div class="win-body">
        <div class="buy-hero">
          <span class="bh-icon"><img src={itemIconURL(id)} alt="" /></span>
          <div>
            <div class={'item-name ' + nameClass(id)}>{inst ? itemName(inst) : d.name}</div>
            <div class="small muted">{itemTypeLine(d)} · 보유 {fmt(have)}</div>
          </div>
        </div>
        {(d.rarity || d.kind === 'card' || (inst && (inst.refine > 0 || inst.cards.some(Boolean)))) && <div class="hint" style={{ marginTop: '8px' }}>귀한 물건입니다. 정말 파시겠어요?</div>}
        {!inst && have > 1 && <Qty n={q} max={have} set={setQ} />}
        <div class="buy-total">받는 금액 <b>{fmt(unit * (inst ? 1 : q))} z</b></div>
      </div>
      <div class="foot">
        <button class="btn" onClick={() => g.popModal()}>닫기</button>
        <button class="btn gold" onClick={() => {
          const z = inst ? sellEquip(s, inst.uid) : sellStack(s, id, q);
          if (z) g.toast(`+${fmt(z)} 제니`, 'good'); else g.toast('팔 수 없는 상태입니다. (의상으로 쓰는 중?)', 'bad');
          g.commit('zeny');
          g.setModal(null);
        }}>판매</button>
      </div>
    </div>
  );
}
