// Game controller: owns state + world + renderer, runs the loop, and lets Preact subscribe.
import { useEffect, useState } from 'preact/hooks';
import type { GameState } from '../game/types.ts';
import { World } from '../game/world.ts';
import { save, load } from '../game/state.ts';
import { applyOffline, type OfflineReport } from '../game/offline.ts';
import { FieldRenderer } from '../render/field.ts';
import { audio } from '../audio/audio.ts';
import { zone } from '../game/data/zones.ts';

export type PanelId = 'status' | 'skills' | 'equip' | 'bag' | 'map' | 'town' | 'party' | 'settings';
export type TownView = 'menu' | 'tool' | 'weapon' | 'armor' | 'costume' | 'refine' | 'stylist' | 'job';

export interface Toast { id: number; text: string; kind: 'info' | 'good' | 'bad' | 'card' | 'level' }
export interface Announce { id: number; text: string; kind: string; t: number }

export type Modal =
  | { kind: 'item'; uid?: number; id?: string; heroIdx?: number }
  | { kind: 'offline'; report: OfflineReport }
  | { kind: 'job'; heroIdx: number }
  | { kind: 'confirm'; text: string; ok: () => void; danger?: boolean }
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
  panel: PanelId | null = null;
  town: TownView = 'menu';
  sel = 0;
  modal: Modal | null = null;
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
    this.world.setZone(s.zone);
    this.started = true;
    audio.setVolumes(s.settings.sfx, s.settings.bgm, s.settings.muted);
    audio.playBgm(zone(s.zone).bgm);
    save(s);
    this.lastSave = performance.now();
    this.loop(performance.now());
    document.addEventListener('visibilitychange', () => this.onVisibility());
    window.addEventListener('pagehide', () => save(this.s));
    this.notify();
  }

  attachCanvas(c: HTMLCanvasElement) {
    this.renderer = new FieldRenderer(c, this.world);
    this.renderer.onSound = (k) => audio.play(k);
    this.renderer.onAnnounce = (text, kind) => this.announce(text, kind);
    this.renderer.onNpc = (npc) => this.openTown(npc === 'job' ? 'job' : npc === 'stylist' ? 'stylist' : npc as TownView);
    this.renderer.lowFx = this.s.settings.lowFx;
    this.renderer.showDamage = this.s.settings.showDamage;
    this.renderer.resize();
  }

  private onVisibility() {
    if (document.hidden) {
      save(this.s);
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
      save(this.s);
      this.lastT = 0;
      if (!this.raf) this.loop(performance.now());
      this.notify();
    }
  }

  private loop = (t: number) => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = this.lastT ? t - this.lastT : 16;
    this.lastT = t;
    this.world.advance(Math.min(dt, 1000));
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
    if (t - this.lastSave > 10_000) { this.lastSave = t; save(this.s); this.dirty = false; }
  };

  subscribe(f: () => void) { this.subs.add(f); return () => { this.subs.delete(f); }; }
  notify() { this.version++; for (const f of this.subs) f(); }

  /** call after any state mutation from the UI */
  commit(sound?: string) {
    this.world.syncParty();
    if (this.renderer) this.renderer.stateVersion++;
    if (sound) audio.play(sound);
    this.dirty = true;
    save(this.s);
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

  openPanel(p: PanelId | null) {
    if (this.panel === p) p = null;
    audio.play(p ? 'open' : 'close');
    this.panel = p;
    if (p === 'town') this.town = 'menu';
    this.notify();
  }

  openTown(v: TownView) {
    this.panel = 'town';
    this.town = v;
    audio.play('open');
    this.notify();
  }

  setModal(m: Modal | null) { this.modal = m; this.notify(); }

  travel(id: string) {
    this.world.setZone(id);
    this.bossMusic = false;
    audio.playBgm(zone(id).bgm);
    this.announce(zone(id).name, 'zone');
    this.commit('confirm');
  }

  get hero() { return this.s.heroes[Math.min(this.sel, this.s.heroes.length - 1)]; }
  heroUnit(idx = this.sel) { return this.world.heroes[idx]; }
}

export const game = new Game();

export function useGame() {
  const [, set] = useState(0);
  useEffect(() => game.subscribe(() => set((v) => v + 1)), []);
  return game;
}
