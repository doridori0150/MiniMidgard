// The management page shell (UX debate phase A, docs/ux/codex_r2.md §4): one title row, one hero selector and one
// row of inner tabs for every page; the panels below render their body only (Win in page mode).
import { useEffect, useRef } from 'preact/hooks';
import { useGame, SUBTABS, type MainTab } from './game.ts';
import { HeroSelector, PageCtx, skillReady, statReady } from './widgets.tsx';
import { StatusPanel, SkillsPanel } from './panels/StatusSkills.tsx';
import { EquipPanel, BagPanel } from './panels/EquipBag.tsx';
import { TownPanel, SettingsPanel } from './panels/World.tsx';
import { PartyPanel } from './panels/Party.tsx';
import { MapPanel } from './WorldMap.tsx';
import { CardPanel, insertableCards } from './panels/Cards.tsx';

const TITLE: Record<MainTab, string> = { party: '파티', grow: '성장', gear: '장비', cards: '카드', explore: '탐험', settings: '설정' };

/** pages/tabs that edit one hero show the selector; shared ones (party orders, bag, card book, map, town) don't */
export function wantsHero(page: MainTab, sub: string) {
  if (page === 'grow') return true;
  if (page === 'gear') return sub !== 'bag';
  if (page === 'cards') return sub === 'slots';
  if (page === 'party') return sub === 'members';
  return false;
}

export function ManagePage() {
  const g = useGame();
  const page = g.page!;
  const sub = g.sub[page];
  const heroRow = wantsHero(page, sub) && g.s.heroes.length > 0;
  // scroll position per page / tab / hero, restored on return (first visit starts at the top)
  const key = `${page}/${sub}/${heroRow ? g.selId : ''}`;
  const main = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // the page's one scroller (title line + body scroll together); offsets live in the game's session view state
    const el = main.current?.querySelector<HTMLElement>('.page-win');
    if (!el) return;
    el.scrollTop = (g.view.get('scroll:' + key) as number | undefined) ?? 0;
    const save = () => g.view.set('scroll:' + key, el.scrollTop);
    el.addEventListener('scroll', save, { passive: true });
    return () => el.removeEventListener('scroll', save);
  }, [key]);

  const tabBadge = (p: MainTab, id: string) => {
    // each inner tab only lights for what it can actually do
    if (p === 'grow' && id === 'status' && g.hero && statReady(g.hero)) return <i class="sub-dot" />;
    if (p === 'grow' && id === 'skills' && g.hero && skillReady(g.hero)) return <i class="sub-dot" />;
    if (p === 'cards' && id === 'slots' && g.s.totals.cards > (g.s.cardSeen ?? 0) && insertableCards(g.s) > 0) return <i class="sub-dot" />;
    return null;
  };

  let body: preact.JSX.Element | null = null;
  switch (page) {
    case 'grow': body = sub === 'skills' ? <SkillsPanel /> : <StatusPanel />; break;
    case 'gear': body = sub === 'bag' ? <BagPanel /> : <EquipPanel view={sub === 'costume' ? 'costume' : 'equip'} />; break;
    case 'cards': body = <CardPanel view={sub === 'book' ? 'book' : 'slots'} />; break;
    case 'explore': body = sub === 'town' ? <TownPanel /> : <MapPanel />; break;
    case 'party': body = <PartyPanel view={sub === 'members' ? 'members' : 'ops'} />; break;
    case 'settings': body = <SettingsPanel />; break;
  }
  return (
    <section class="page" aria-label={TITLE[page]}>
      <div class="page-title">
        <h2>{TITLE[page]}</h2>
        <span class="sp1" />
        <button class="page-x" aria-label={page === 'settings' ? '설정 닫기' : '사냥으로 돌아가기'} onClick={() => (page === 'settings' ? g.closeSettings() : g.goHunt())}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      {heroRow && <HeroSelector sel={g.sel} onSel={(i) => { g.sel = i; g.notify(); }} />}
      {SUBTABS[page].length > 1 && (
        <div class="subnav" role="tablist" aria-label={`${TITLE[page]} 하위 메뉴`} onKeyDown={(e) => {
          const tabs = SUBTABS[page], i = tabs.findIndex(([id]) => id === sub);
          const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          const n = (i + d + tabs.length) % tabs.length;
          g.openSub(page, tabs[n][0]);
          setTimeout(() => document.getElementById(`tab-${page}-${tabs[n][0]}`)?.focus(), 0); // after the re-render
        }}>
          {SUBTABS[page].map(([id, label]) => (
            <button role="tab" id={`tab-${page}-${id}`} aria-selected={sub === id} aria-controls="page-panel" tabIndex={sub === id ? 0 : -1}
              class={sub === id ? 'on' : ''} onClick={() => g.openSub(page, id)}>{label}{tabBadge(page, id)}</button>
          ))}
        </div>
      )}
      <PageCtx.Provider value={{ heroRow }}>
        {/* remount per hero so a half-made choice (gear pick, card pick) never carries over to someone else */}
        <div class="page-main" id="page-panel" role={SUBTABS[page].length > 1 ? 'tabpanel' : undefined}
          aria-labelledby={SUBTABS[page].length > 1 ? `tab-${page}-${sub}` : undefined} ref={main} key={page + sub + (heroRow ? g.selId : '')}>{body}</div>
      </PageCtx.Provider>
    </section>
  );
}
