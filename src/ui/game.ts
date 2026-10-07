// Game controller: owns state + world + renderer, runs the loop, and lets Preact subscribe.
import { useEffect, useState } from 'preact/hooks';
import type { GameState } from '../game/types.ts';
import { World } from '../game/world.ts';
import { save, load } from '../game/state.ts';
import { applyOffline, type OfflineReport } from '../game/offline.ts';
import { FieldRenderer } from '../render/field.ts';
import { audio } from '../audio/audio.ts';
import { zone } from '../game/data/zones.ts';

export type PanelId = 'status' | 'skills' | 'equip' | 'cards' | 'bag' | 'map' | 'town' | 'party' | 'settings';
/** bottom-nav pages (UX debate phase A, docs/ux/codex_r2.md §4): hunting is page null */
export type MainTab = 'party' | 'grow' | 'gear' | 'cards' | 'explore' | 'settings';
export const SUBTABS: Record<MainTab, [string, string][]> = {
  party: [['ops', '작전'], ['members', '파티원']],
  grow: [['status', '스탯'], ['skills', '스킬']],
  gear: [['equip', '착용'], ['costume', '의상'], ['bag', '가방']],
  cards: [['slots', '슬롯 관리'], ['book', '카드 도감']],
  explore: [['map', '지도'], ['town', '마을 서비스']],
  settings: [],
};
/** legacy panel ids → page + sub tab, so every existing openPanel() call lands in the new layout */
const PANEL_TO: Record<PanelId, [MainTab, string]> = {
  status: ['grow', 'status'], skills: ['grow', 'skills'], equip: ['gear', 'equip'], bag: ['gear', 'bag'], cards: ['cards', 'slots'],
  map: ['explore', 'map'], town: ['explore', 'town'], party: ['party', 'ops'], settings: ['settings', ''],
};
const UI_KEY = 'minimidgard.ui.v1';
interface UiPrefs { bandClosed: { general: boolean; party: boolean } }
export type TownView = 'menu' | 'tool' | 'weapon' | 'armor' | 'costume' | 'refine' | 'stylist' | 'job';

export interface Toast { id: number; text: string; kind: 'info' | 'good' | 'bad' | 'card' | 'level' }
export interface Announce { id: number; text: string; kind: string; t: number }

export type Modal =
  | { kind: 'item'; uid?: number; id?: string; heroIdx?: number }
  | { kind: 'offline'; report: OfflineReport }
  | { kind: 'job'; heroIdx: number }
  | { kind: 'confirm'; text: string; ok: () => void; danger?: boolean; /** the parent detail stops making sense afterwards (e.g. sold) */ closeAll?: boolean }
  | { kind: 'recruit' }
  | { kind: 'credits' }
  | { kind: 'card'; id: string }
  | { kind: 'quick'; slot: number }
  | { kind: 'mob'; id: string }
  | { kind: 'buy'; id: string }
  | { kind: 'sell'; id?: string; uid?: number };

class Game {
  s!: GameState;
  world!: World;
  renderer: FieldRenderer | null = null;
  started = false;
  /** the open management page (null = hunting) and the last inner tab of each */
  page: MainTab | null = null;
  sub: Record<MainTab, string> = { party: 'ops', grow: 'status', gear: 'equip', cards: 'slots', explore: 'map', settings: '' };
  /** where settings was opened from, to return there */
  private beforeSettings: MainTab | null = null;
  town: TownView = 'menu';
  /** the selected hero, by id so reordering the party keeps the same hero (g.sel stays an index view of it) */
  selId = -1;
  ui: UiPrefs = { bandClosed: { general: false, party: false } };
  /** dev QA session (?qa): never touches the real save */
  qa = false;
  /** detail stack: the top is shown; push for drill-down (item → monster → drop), pop to go back */
  modals: Modal[] = [];
  get modal(): Modal | null { return this.modals[this.modals.length - 1] ?? null; }
  set modal(m: Modal | null) { this.modals = m ? [m] : []; }
  toasts: Toast[] = [];
  announces: Announce[] = [];
  version = 0;
  private subs = new Set<() => void>();
  private seq = 1;
  private raf = 0;
  private lastT = 0;
  private lastNotify = 0;
  private lastSave = 0;
  private dirty = false;
  bossMusic = false;

  hasSave() { return load() !== null; }

  begin(s: GameState, fresh: boolean) {
    this.s = s;
    if (!fresh) {
      const away = Date.now() - s.lastSave;
      const rep = applyOffline(s, away);
      if (rep) this.modal = { kind: 'offline', report: rep };
    }
    this.world = new World(s);
    this.world.onPersist = () => { this.dirty = true; };
    this.world.onTravel = (id) => { this.bossMusic = false; audio.playBgm(zone(id).bgm); this.announce(zone(id).name, 'zone'); this.notify(); };
    this.world.setZone(s.zone);
    this.started = true;
    if (!s.heroes.some((h) => h.id === this.selId)) this.selId = s.heroes[0]?.id ?? -1;
    this.loadUi();
    audio.setVolumes(s.settings.sfx, s.settings.bgm, s.settings.muted);
    audio.playBgm(zone(s.zone).bgm);
    save(s);
    this.lastSave = performance.now();
    this.loop(performance.now());
    document.addEventListener('visibilitychange', () => this.onVisibility());
    // Escape and the browser/Android back button step back: detail → settings → page → hunting
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.back()) e.preventDefault(); });
    window.addEventListener('popstate', () => {
      if (this.ignorePop) { this.ignorePop = false; return; }
      const had = this.page !== null;
      if (this.back(true) && had && this.page !== null) history.pushState({ mm: 'page' }, '');
    });
    window.addEventListener('pagehide', () => { if (!this.qa) save(this.s); });
    this.notify();
  }

  attachCanvas(c: HTMLCanvasElement) {
    this.renderer = new FieldRenderer(c, this.world);
    this.renderer.onSound = (k) => audio.play(k);
    this.renderer.onAnnounce = (text, kind) => this.announce(text, kind);
    this.renderer.onNpc = (npc) => this.openTown(npc === 'job' ? 'job' : npc === 'stylist' ? 'stylist' : npc as TownView);
    this.renderer.lowFx = this.s.settings.lowFx;
    this.renderer.pixelMode = !!this.s.settings.pixel;
    this.renderer.showDamage = this.s.settings.showDamage;
    this.renderer.resize();
  }

  private onVisibility() {
    if (document.hidden) {
      if (!this.qa) save(this.s);
      audio.pauseAll(true);
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    } else {
      audio.pauseAll(false);
      const away = Date.now() - this.s.lastSave;
      if (away > 60_000) {
        const rep = applyOffline(this.s, away);
        if (rep) { this.modal = { kind: 'offline', report: rep }; this.world.syncParty(); this.renderer && (this.renderer.stateVersion++); }
      }
      if (!this.qa) save(this.s);
      this.lastT = 0;
      if (!this.raf) this.loop(performance.now());
      this.notify();
    }
  }

  private loop = (t: number) => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = this.lastT ? t - this.lastT : 16;
    this.lastT = t;
    // climax hit-stop: hold the sim for a beat (the frame still renders; no catch-up afterwards)
    if (!this.renderer || t >= this.renderer.hitstopUntil) this.world.advance(Math.min(dt, 1000));
    // boss music
    const bossOn = this.world.mobs.some((m) => m.m.boss && m.state !== 'dead');
    if (bossOn !== this.bossMusic) { this.bossMusic = bossOn; audio.playBgm(bossOn ? 'boss' : this.world.zone.bgm); }
    if (this.renderer) this.renderer.frame(t);
    // notices from the sim
    if (this.world.notices.length) {
      for (const n of this.world.notices.splice(0)) this.toast(n.text, n.kind === 'job' ? 'level' : 'good');
      this.dirty = true;
    }
    if (t - this.lastNotify > 180) { this.lastNotify = t; this.notify(); }
    if (t - this.lastSave > 10_000) { this.lastSave = t; if (!this.qa) save(this.s); this.dirty = false; }
  };

  subscribe(f: () => void) { this.subs.add(f); return () => { this.subs.delete(f); }; }
  notify() { this.version++; for (const f of this.subs) f(); }

  /** call after any state mutation from the UI */
  commit(sound?: string) {
    this.world.syncParty();
    if (this.renderer) this.renderer.stateVersion++;
    if (sound) audio.play(sound);
    this.dirty = true;
    if (!this.qa) save(this.s);
    this.notify();
  }

  toast(text: string, kind: Toast['kind'] = 'info') {
    const id = this.seq++;
    this.toasts.push({ id, text, kind });
    if (this.toasts.length > 4) this.toasts.shift();
    setTimeout(() => { this.toasts = this.toasts.filter((x) => x.id !== id); this.notify(); }, kind === 'card' ? 4200 : 2600);
    this.notify();
  }

  announce(text: string, kind: string) {
    const id = this.seq++;
    this.announces.push({ id, text, kind, t: performance.now() });
    if (this.announces.length > 3) this.announces.shift();
    setTimeout(() => { this.announces = this.announces.filter((x) => x.id !== id); this.notify(); }, kind === 'mvp' || kind === 'card' ? 3600 : 2800);
    this.notify();
  }

  /** the legacy panel id of what is on screen (null while hunting) */
  get panel(): PanelId | null {
    const p = this.page;
    if (!p) return null;
    const sub = this.sub[p];
    switch (p) {
      case 'grow': return sub === 'skills' ? 'skills' : 'status';
      case 'gear': return sub === 'bag' ? 'bag' : 'equip';
      case 'cards': return 'cards';
      case 'explore': return sub === 'town' ? 'town' : 'map';
      case 'party': return 'party';
      case 'settings': return 'settings';
    }
  }

  private ignorePop = false;
  /** one step back; true if something was closed */
  back(fromHistory = false): boolean {
    const m = this.modal;
    if (m) { if (m.kind === 'offline') return false; this.popModal(); return true; }
    if (this.page === 'settings') { this.closeSettings(); return true; }
    if (this.page) { this.page = null; audio.play('close'); if (!fromHistory) this.leaveHistory(); this.notify(); return true; }
    return false;
  }
  private leaveHistory() { if (history.state?.mm === 'page') { this.ignorePop = true; history.back(); } }

  /** open a page (and inner tab). Re-selecting the open page never closes it; null returns to hunting */
  openPage(p: MainTab | null, sub?: string) {
    if (p === 'settings' && this.page !== 'settings') this.beforeSettings = this.page;
    if (!this.page && p) history.pushState({ mm: 'page' }, '');
    else if (this.page && !p) this.leaveHistory();
    const changed = p !== this.page;
    this.page = p;
    if (p && sub !== undefined) this.sub[p] = sub;
    if (p === 'explore' && sub === 'town') this.town = 'menu';
    if (changed) audio.play(p ? 'open' : 'close');
    this.notify();
  }
  openSub(p: MainTab, sub: string) { this.sub[p] = sub; if (p === 'explore' && sub === 'town') this.town = 'menu'; audio.play('click'); this.notify(); }
  closeSettings() { this.openPage(this.beforeSettings); }
  goHunt() { this.openPage(null); }

  /** legacy adapter: every old openPanel(id) call lands on the matching page/tab; null = back to hunting */
  openPanel(p: PanelId | null) {
    if (!p) { this.goHunt(); return; }
    const [page, sub] = PANEL_TO[p];
    this.openPage(page, page === 'settings' ? undefined : sub);
  }

  openTown(v: TownView) {
    this.page = 'explore';
    this.sub.explore = 'town';
    this.town = v;
    audio.play('open');
    this.notify();
  }

  /** replace the whole detail stack (null closes every detail) */
  setModal(m: Modal | null) { this.modal = m; this.notify(); }
  /** drill into a detail from another one; popModal returns to it */
  pushModal(m: Modal) { this.modals.push(m); this.notify(); }
  popModal() { this.modals.pop(); this.notify(); }

  // ── UI preferences (not part of the save; QA sessions keep them in memory only)
  loadUi() {
    if (this.qa) return;
    try { const v = JSON.parse(localStorage.getItem(UI_KEY) ?? 'null'); if (v?.bandClosed) this.ui = { bandClosed: { general: !!v.bandClosed.general, party: !!v.bandClosed.party } }; } catch { /* storage blocked: keep defaults */ }
  }
  bandClosed() { return this.ui.bandClosed[this.page === 'party' ? 'party' : 'general']; }
  toggleBand() {
    const k = this.page === 'party' ? 'party' : 'general';
    this.ui.bandClosed[k] = !this.ui.bandClosed[k];
    if (!this.qa) { try { localStorage.setItem(UI_KEY, JSON.stringify(this.ui)); } catch { /* ignore */ } }
    audio.play('click');
    this.notify();
  }

  travel(id: string) {
    this.world.setZone(id);
    this.bossMusic = false;
    audio.playBgm(zone(id).bgm);
    this.announce(zone(id).name, 'zone');
    this.commit('confirm');
  }

  get sel() { const i = this.s.heroes.findIndex((h) => h.id === this.selId); return i < 0 ? 0 : i; }
  set sel(i: number) { this.selId = this.s.heroes[Math.max(0, Math.min(i, this.s.heroes.length - 1))]?.id ?? -1; }
  get hero() { return this.s.heroes[this.sel]; }
  heroUnit(idx = this.sel) { return this.world.heroes[idx]; }
}

export const game = new Game();

export function useGame() {
  const [, set] = useState(0);
  useEffect(() => game.subscribe(() => set((v) => v + 1)), []);
  return game;
}
