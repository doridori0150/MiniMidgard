// Types for the copied asset-kit timeline functions (asset-kit-timeline.js, timeline@1). Only what the game uses.
export type Ms = number;
export type EventTimes = Record<string, number | number[]>;
export type Keys = [number, number | number[], string?][] | number | number[];
export interface Clip {
  at?: number | string | { event: string; index?: number; offset?: number };
  dur?: number;
  repeat?: { event: string; offset?: number };
  ranges?: string[];
  reduced?: 'skip' | 'static' | 'keep';
  flash?: boolean;
  optional?: boolean;
  onInterrupt?: 'cut' | 'finish' | 'fade';
  mirror?: 'caster' | 'none';
  keys?: Record<string, Keys>;
  portrait?: { keys?: Record<string, Keys> };
  [k: string]: unknown;
}
export interface Track { id?: string; type: string; label?: string; optional?: boolean; onInterrupt?: 'cut' | 'finish' | 'fade'; clips: Clip[] }
export interface Timeline {
  kit?: number; format: string; id: string; game?: string; subject?: string; action?: string; title?: string;
  tier?: 'basic' | 'skill' | 'signature' | 'ultimate'; exclusive?: string[]; fps?: number;
  events?: EventTimes; ranges?: Record<string, { from?: unknown; to?: unknown; events?: EventTimes }>;
  stage?: { ref: [number, number]; fit?: 'contain' | 'cover'; portrait?: { ref: [number, number] } };
  assets?: Record<string, { file: string; pivot?: [number, number]; pixelated?: boolean }>;
  tracks: Track[];
  /** 미니 미드가르: the skill ids that start this timeline */
  skills?: string[];
  /** 미니 미드가르: 'replace' hides the game's own fx for this skill while the timeline runs (it fires them itself); default 'keep' */
  gameFx?: 'keep' | 'replace';
}
export interface Opts { range?: string; events?: EventTimes; reduced?: boolean; flashOff?: boolean; portrait?: boolean; drop?: string[] }
export interface Active { track: Track; clip: Clip; start: Ms; index: number; local: Ms; p: number; props: Record<string, number | number[]> }
export interface Crossed { track: Track; clip: Clip; start: Ms; index: number }
export const FORMAT: string;
export const TRACK_TYPES: string[];
export const TIERS: string[];
export const TIER_DROP: Record<string, string[]>;
export function ease(name: string | undefined, x: number): number;
export function resolveAt(at: Clip['at'], events?: EventTimes): number;
export function startsOf(clip: Clip, events?: EventTimes): { start: Ms; index: number }[];
export function interruptMode(track: Track, clip: Clip): 'cut' | 'finish' | 'fade';
export function sampleKeys(keys: Keys, local: Ms): number | number[] | undefined;
export function eventsOf(tl: Timeline, actual?: EventTimes, range?: string): EventTimes;
export function duration(tl: Timeline, events?: EventTimes): Ms;
export function activeClips(tl: Timeline, ms: Ms, opts?: Opts): Active[];
export function crossed(tl: Timeline, prevMs: Ms, ms: Ms, opts?: Opts, types?: string[]): Crossed[];
export function validateTimeline(tl: unknown): string[];
