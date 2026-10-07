// SFX through WebAudio buffers; BGM through <audio> elements routed into a gain node
// (so volume and crossfades also work on iOS where element.volume is read-only).

interface Manifest { sfx: Record<string, string>; bgm: Record<string, string>; gain: Record<string, number> }

const ALIAS: Record<string, string> = { swing: 'slash' };

class AudioSys {
  ctx: AudioContext | null = null;
  manifest: Manifest | null = null;
  buffers = new Map<string, AudioBuffer>();
  sfxGain: GainNode | null = null;
  bgmGain: GainNode | null = null;
  sfxVol = 0.8;
  bgmVol = 0.5;
  muted = false;
  private lastPlay = new Map<string, number>();
  private active = 0;
  private bgmEl: HTMLAudioElement | null = null;
  private bgmNode: { el: HTMLAudioElement; gain: GainNode } | null = null;
  private bgmKey = '';
  private wantBgm = '';
  private unlocked = false;

  async init() {
    try {
      const res = await fetch('audio/manifest.json');
      this.manifest = await res.json();
    } catch {
      this.manifest = { sfx: {}, bgm: {}, gain: {} };
    }
    const unlock = () => {
      this.unlock();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  private unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.connect(this.ctx.destination);
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.connect(this.ctx.destination);
    this.applyVolumes();
    void this.ctx.resume();
    void this.loadAll();
    if (this.wantBgm) this.playBgm(this.wantBgm, true);
  }

  private async loadAll() {
    if (!this.manifest || !this.ctx) return;
    await Promise.all(Object.entries(this.manifest.sfx).map(async ([k, url]) => {
      try {
        const buf = await (await fetch(url)).arrayBuffer();
        this.buffers.set(k, await this.ctx!.decodeAudioData(buf));
      } catch { /* missing file: stay silent */ }
    }));
  }

  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.sfxGain?.gain.setTargetAtTime(this.muted ? 0 : this.sfxVol, t, 0.05);
    this.bgmGain?.gain.setTargetAtTime(this.muted ? 0 : this.bgmVol * 0.55, t, 0.15);
  }

  setVolumes(sfx: number, bgm: number, muted: boolean) {
    this.sfxVol = sfx; this.bgmVol = bgm; this.muted = muted;
    this.applyVolumes();
  }

  play(key: string, opts: { rate?: number; vol?: number } = {}) {
    const k = ALIAS[key] ?? key;
    if (!this.ctx || this.muted || this.sfxVol <= 0) return;
    const buf = this.buffers.get(k);
    if (!buf) return;
    const now = performance.now();
    const minGap = k === 'hit' || k === 'slash' || k === 'arrow' || k === 'miss' ? 45 : k === 'pickup' || k === 'drop' ? 70 : 30;
    if (now - (this.lastPlay.get(k) ?? 0) < minGap) return;
    if (this.active > 14) return;
    this.lastPlay.set(k, now);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const varied = ['hit', 'hit_heavy', 'slash', 'arrow', 'arrow_hit', 'mob_die', 'pickup', 'miss', 'player_hurt'].includes(k);
    src.playbackRate.value = opts.rate ?? (varied ? 0.92 + Math.random() * 0.16 : 1);
    const g = this.ctx.createGain();
    g.gain.value = (this.manifest?.gain[k] ?? 0.7) * (opts.vol ?? 1);
    src.connect(g).connect(this.sfxGain!);
    this.active++;
    src.onended = () => { this.active--; };
    src.start();
  }

  playBgm(key: string, force = false) {
    this.wantBgm = key;
    if (!this.ctx || !this.manifest) return;
    if (this.bgmKey === key && !force) return;
    const url = this.manifest.bgm[key];
    if (!url) return;
    this.bgmKey = key;
    const old = this.bgmNode;
    const el = new Audio(url);
    el.loop = true;
    el.crossOrigin = 'anonymous';
    const node = this.ctx.createMediaElementSource(el);
    const gain = this.ctx.createGain();
    const bgmGain = (this.manifest.gain[key] ?? 1);
    gain.gain.value = 0;
    node.connect(gain).connect(this.bgmGain!);
    void el.play().catch(() => { /* autoplay blocked until next gesture */ });
    const t = this.ctx.currentTime;
    gain.gain.setTargetAtTime(bgmGain, t, 0.6);
    this.bgmNode = { el, gain };
    this.bgmEl = el;
    if (old) {
      old.gain.gain.setTargetAtTime(0, t, 0.4);
      setTimeout(() => { old.el.pause(); old.el.src = ''; }, 2500);
    }
  }

  pauseAll(paused: boolean) {
    if (!this.ctx) return;
    if (paused) { void this.ctx.suspend(); this.bgmEl?.pause(); }
    else { void this.ctx.resume(); void this.bgmEl?.play().catch(() => {}); }
  }
}

export const audio = new AudioSys();
