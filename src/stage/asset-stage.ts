// asset-kit 에셋 무대 (asset-stage.html): the workshop's "게임 무대" tab. One pixel hero on a plain field, drawn by the game's own
// renderer (src/render/pixel.ts through rig.drawRigHero), plays the motion picked in the workshop with the game's timing: a skill
// motion through its skill (pose.skill, the wind-up fitted into SKILL_CONTACT), the attack over the swing the field uses, the cast
// with its lead-in. The player's save is never read or written.
// Protocol (asset-kit README "게임 저장소에 붙이기"):
// in  asset-stage:show {id, kind}, :play {id, action, loop, speed}, :options {loop, speed, attackTiming, attackRate, attackInterval}, :tuning (ignored), :film {req, id, action, speed, fps}
//     asset-stage:fx {req?, id?, skill? | hit? | base?, ramp?, element?, hits?, loop?, speed?} — hero + training dummy + an assembled effect
//       skill: a game skill id (the hero plays its skill motion, the skill's assembly lands on the dummy at contact)
//       hit: a hit style (slash · blunt · pierce · magic · claw; the hero swings its attack), base: one base effect (ramp: colour name)
//     asset-stage:assembly {req?, record? (pixel-heroes | pixel-heroes-96), id?, kind? (attack_candidate), rate? 1~2.5, interval? (ms; rate by the rule, swings? times), hitstop?, knock?, hitFx?, element?, cycles?, dist?} — a candidate assembly@1 from the workshop record, played with event timing + hit
// out asset-stage:ready {heroes, tunables, defaults, actions, film, fx}, :subject {id, frameMs, cells}, :played {id, action}, :status {text},
//     :filmed {req, film | error}, :fxed {req, ok, error? | label, contactMs, durationMs, layers}; window.AssetStageFilm = {ready, record} (asset-kit tools/film.mjs)
// Effects are placed by the same code as the field (fxlib expandAssembly + drawFx), so the stage shows what the game draws.
import manifest from '../assets/pixel/manifest.json';
import type { ClassId, WeaponType } from '../game/types.ts';
import { BOW_RELEASE, MELEE_CONTACT, SKILL_CONTACT } from '../game/world.ts';
import type { HeroLookDraw, Pose } from '../render/hero.ts';
import { attackContact, attackEventMs, attackShowMs, pixelFrame, setAttackRate, setAttackTiming, setPixelEnabled } from '../render/pixel.ts';
import { drawRigHero, loadRig } from '../render/rig.ts';
import { setWholeEnabled } from '../render/whole.ts';
import { timelines } from '../render/timeline.ts';
import { validateTimeline, type Timeline } from '../render/vendor/asset-kit-timeline.js';
import { ASSEMBLY, FX_IDS, RAMPS, drawFx, expandAssembly, fxInfo, type FxInstance, type FxLayer } from '../render/fxlib.ts';
import { drawMob, mobHeight } from '../render/monster.ts';
import { SKILLS } from '../game/data/skills.ts';
import type { Element } from '../game/types.ts';
import { attackRateFor } from '../game/attack-rule.ts';

interface Anim { frames: string[]; durations: number[]; duration: number; loop: boolean; hitFrame?: number }
interface Char { class: string; gender: string; defaultWeapon?: string; animations?: Record<string, Anim>; skillMotions?: Record<string, string> }
const M = manifest as unknown as { canvas: { bodyHeight?: number }; animations: Record<string, Anim>; characters: Record<string, Char> };

const canvas = document.getElementById('stage') as HTMLCanvasElement;
const note = document.getElementById('note')!;
const ctx = canvas.getContext('2d')!;
const embedded = parent !== window;
const tell = (msg: Record<string, unknown>) => { if (embedded) parent.postMessage(msg, '*'); };
const say = (text: string) => { note.textContent = text; tell({ type: 'asset-stage:status', text }); };

const heroes = Object.keys(M.characters);
const table = (id: string) => M.characters[id].animations ?? M.animations;
/** the game weapon each pixel weapon layer stands for (pixel.ts WEAPON, reversed) */
const GAME_WEAPON: Record<string, WeaponType> = { sword: 'sword', spear: 'spear', staff: 'staff', bow: 'bow', mace: 'mace', dagger: 'dagger', katar: 'katar', axe: 'axe' };
const look = (id: string): HeroLookDraw => {
  const c = M.characters[id];
  const w = new URLSearchParams(location.search).get('weapon') ?? c.defaultWeapon ?? 'none';
  return { cls: c.class as ClassId, gender: c.gender === 'male' ? 'm' : 'f', hair: 0, hairColor: 3, skin: 0, dye: 0, wtype: GAME_WEAPON[w] ?? 'none', refine: 0, shield: false };
};
/** the swing the field gives a hero's attack (field.ts drawHeroUnit): the hit lands at MELEE_CONTACT, a bow releases at BOW_RELEASE */
const swing = (w: WeaponType) => (w === 'bow' ? BOW_RELEASE / 0.6 : w === 'spear' ? MELEE_CONTACT / 0.47 : MELEE_CONTACT / 0.5);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** how a motion plays in the game: the pose at time t, how long it runs, and when its contact lands */
interface Plan { kind: string; pose: (t: number) => Pose; durationMs: number; contactMs: number | null; contactCell: number | null }
function plan(id: string, kind: string): Plan {
  const L = look(id), tb = table(id), c = M.characters[id];
  const a = tb[kind] ?? tb.idle;
  const hit = a.hitFrame != null ? sum(a.durations.slice(0, a.hitFrame)) : null;
  if (kind.startsWith('skill_')) {
    // through a skill that uses this motion, so the stage shows the game's own fitting of the wind-up into SKILL_CONTACT
    const skill = Object.entries(c.skillMotions ?? {}).find(([, v]) => v === kind)?.[0];
    if (skill) {
      return {
        kind, pose: (t) => ({ state: 'attack', t: 0, dur: swing(L.wtype), facing: 1, since: t, skill, skillT: t }),
        durationMs: hit ? SKILL_CONTACT + a.duration - hit : a.duration, contactMs: hit ? SKILL_CONTACT : null, contactCell: a.hitFrame ?? null,
      };
    }
    return { kind, pose: (t) => ({ state: 'idle', t, facing: 1, anim: kind }), durationMs: a.duration, contactMs: hit, contactCell: a.hitFrame ?? null };
  }
  if (kind === 'attack') {
    const d = swing(L.wtype), ev = attackEventMs(L), show = ev != null ? attackShowMs(L, d) : Math.max(d, attackShowMs(L, d));
    return { kind, pose: (t) => ({ state: 'attack', t: Math.min(t, show - 1), dur: d, facing: 1, since: t }), durationMs: show, contactMs: ev ?? d * attackContact(L.wtype), contactCell: a.hitFrame ?? null };
  }
  if (kind === 'cast' || kind === 'cast_start') {
    const lead = tb.cast_start?.duration ?? 0;
    return { kind: 'cast', pose: (t) => ({ state: 'cast', t, facing: 1, since: t }), durationMs: lead + (tb.cast?.duration ?? 600) * 2, contactMs: null, contactCell: null };
  }
  if (kind === 'dead') return { kind, pose: (t) => ({ state: 'dead', t, facing: 1 }), durationMs: a.duration + 600, contactMs: null, contactCell: null };
  if (kind === 'hurt' || kind === 'sit') return { kind, pose: (t) => ({ state: kind, t, facing: 1 }), durationMs: Math.max(a.duration, 400), contactMs: null, contactCell: null };
  return { kind, pose: (t) => ({ state: kind === 'walk' ? 'walk' : 'idle', t, facing: 1 }), durationMs: a.duration * (a.loop ? 2 : 1), contactMs: null, contactCell: null };
}

// ── drawing: field units → CSS px chosen so the standing hero is about 40% of the stage height; feet at 72% down
let cssW = 0, cssH = 0, dpr = 1;
function resize() {
  dpr = Math.max(1, devicePixelRatio || 1); cssW = canvas.clientWidth; cssH = canvas.clientHeight;
  canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
}
const unitScale = () => Math.max(1, (cssH * 0.4) / 76);
const foot = () => [cssW / 2, cssH * 0.72] as const;
function paint(g: CanvasRenderingContext2D, pose: Pose, id: string, ground: boolean, sc: FxScene | null = null, t = 0) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, cssW, cssH);
  const [fx, fy] = foot(), s = unitScale(), hx = sc ? sc.heroX : 0;
  if (ground) {
    const sky = g.createLinearGradient(0, 0, 0, cssH);
    sky.addColorStop(0, '#3d5a45'); sky.addColorStop(0.72, '#5f7f4f'); sky.addColorStop(0.721, '#6f8f58'); sky.addColorStop(1, '#4f6b3f');
    g.fillStyle = sky; g.fillRect(0, 0, cssW, cssH);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(fx + hx * s, fy, 14 * s, 4 * s, 0, 0, Math.PI * 2); g.fill();
  }
  g.save(); g.translate(fx, fy); g.scale(s, s);
  if (sc) drawFxLayer(g, sc, 'ground', t);
  g.save(); g.translate(hx, 0); if (sc?.hero) sc.hero(g, t); else drawRigHero(g, look(id), pose); g.restore();
  if (sc) {
    const since = t - lastContact(sc, t), hit = sc.knockPx && since >= 0 && since < 160;
    const push = hit ? sc.knockPx! * Math.sin(Math.PI * Math.min(1, since / 160)) : 0;
    g.save(); g.translate(sc.dummyX + push, 0); drawMob(g, DUMMY.sprite, DUMMY.palette, { state: 'idle', t: 0, facing: -1, hurt: hit ? 1 - since / 160 : 0, frozen: false, spawn: 1, dead: 0 }, 1, false, ground); g.restore();
    drawFxLayer(g, sc, 'top', t);
  }
  g.restore();
}

// ── effects on the stage: the hero on the left, a training dummy (the field's jelly) in front, an assembly from src/assets/fx/assembly.json
const DUMMY = { sprite: 'jelly', palette: ['#ffb3c7', '#ff7aa0', '#fff0f4'] };
interface FxScene { label: string; heroX: number; dummyX: number; selfPoint: boolean; contactMs: number; durationMs: number; insts: FxInstance[]; motion: Plan | null;
  /** a candidate drawn from the workshop record (assembly@1) instead of the game's frames: draws the hero at real time t */
  hero?: (g: CanvasRenderingContext2D, t: number) => void;
  /** the dummy is pushed back this many px after the contact, and flashes */
  knockPx?: number;
  /** repeated swings (평타 연속): every contact gets the hit effects and the knock; contactMs is the first */
  contacts?: number[] }
let scene: FxScene | null = null;
/** asset-stage:options {attackInterval}: the attack interval (ms) the assembly scene repeats its swing at; 0 = one swing */
let attackInterval = 0;
const lastContact = (sc: FxScene, t: number) => (sc.contacts ?? [sc.contactMs]).reduce((a, c) => (c <= t ? c : a), sc.contactMs);
function drawFxLayer(g: CanvasRenderingContext2D, sc: FxScene, layer: 'ground' | 'top', t: number) {
  const dh = mobHeight(DUMMY.sprite);
  for (const c0 of sc.contacts ?? [sc.contactMs]) for (const f of sc.insts) {
    if (f.layer !== layer) continue;
    const age = t - c0 - f.delay;
    if (age < 0 || age > f.dur) continue;
    const onHero = f.at === 'caster' || (f.at === 'point' && sc.selfPoint);
    const x = onHero ? sc.heroX : sc.dummyX, h = onHero ? 48 : f.at === 'point' ? 0 : dh;
    drawFx(g, f.play, x + f.dx, (f.on === 'body' ? -h * 0.5 : 0) + f.dy, age);
  }
}
// ── 조립 후보 재생 (assembly@1): 공방 기록의 키포즈 + 조립표를 게임과 같은 층 순서(뒷머리 → 뒤 무기 → 몸 → 앞 무기·덮개 → 앞머리)로
// 그리고, 접촉 칸에 명중 조립·히트스톱·허수아비 밀림을 함께 재생합니다. 시간은 event 방식(그림 시간 ÷ 공속 배율).
interface PoseLayers { body?: HTMLImageElement; back?: HTMLImageElement; front?: HTMLImageElement; weapon?: HTMLImageElement; weaponZ?: string; grip?: HTMLImageElement }
const recordUrl = (name = 'pixel-heroes') => `../asset-records/${name}/manifest.json`;
const imgCache = new Map<string, Promise<HTMLImageElement>>();
const loadImg = (rel: string) => { let p = imgCache.get(rel); if (!p) { p = new Promise((ok, bad) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => bad(new Error('그림을 못 읽음: ' + rel)); im.src = '../' + rel; }); imgCache.set(rel, p); } return p; };
async function assemblyScene(m: Record<string, any>): Promise<FxScene | string> {
  const url = recordUrl(m.record);
  const rec = await fetch(url, { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
  if (!rec) return '공방 기록을 못 읽었습니다: ' + url;
  const id = m.id ?? 'assassin_male_p2', kind = m.kind ?? 'attack_candidate';
  const sheet = rec.sheets.find((x: any) => x.id === id && x.kind === kind);
  if (!sheet?.assembly) return `조립표가 없습니다: ${id} · ${kind}`;
  const A = sheet.assembly as { poses: string; hitFrame?: number; frames: { pose: number | string; ms: number; dx?: number; dy?: number }[] };
  const [pid, pkind] = A.poses.split('#');
  const ps = rec.sheets.find((x: any) => x.id === pid && x.kind === pkind);
  if (!ps) return '키포즈 시트가 없습니다: ' + A.poses;
  const weapon = ps.overlayDefaults?.weapon;
  const [ox, oy] = ps.frames[0]?.pivot ?? [64, 112], k = (ps.canvas?.[0] ?? 128) / 128;
  const layersOf = async (f: any): Promise<PoseLayers> => {
    const ov = f.overlays ?? {}, wv = weapon ? ov['weapon:' + weapon] : null;
    const get = (r?: string) => (r ? loadImg(r).catch(() => undefined) : Promise.resolve(undefined));
    return { body: await get(f.file), back: await get(ov.hair_back), front: await get(ov.hair_front), weapon: await get(typeof wv === 'string' ? wv : wv?.file), weaponZ: typeof wv === 'object' ? wv?.z : 'front', grip: await get(ov.grip) };
  };
  const poses: PoseLayers[] = await Promise.all(ps.frames.map(layersOf));
  // the record's own approved idle (48 px: the game idle sheet; 96 px: the chosen design) before and after the motion
  const idleSheet = rec.sheets.find((x: any) => x.id === id && x.kind === 'idle' && !x.candidate);
  const idlePose = idleSheet?.frames?.[0] ? await layersOf(idleSheet.frames[0]) : null;
  const looped = A.hitFrame == null, cycles = looped ? Number(m.cycles) || 2 : 1;
  // 평타 연속 (attack-rule.ts): with an attack interval the rate follows the rule and the swing repeats `swings` times at that
  // interval — the approved idle fills the gap of a slow hero, the next swing cuts the recovery of a fast one
  const interval = looped ? 0 : Number(m.interval ?? attackInterval) || 0, swings = interval ? Math.max(1, Number(m.swings) || 3) : 1;
  const rate = Math.min(2.5, Math.max(1, Number(m.rate) || (interval ? attackRateFor(interval) : 1))), hs = looped ? 0 : m.hitstop ?? sheet.hit?.hitstopMs ?? 70;
  const starts: number[] = []; let acc = 0; for (const f of A.frames) { starts.push(acc); acc += f.ms; }
  const total = acc, contactAnim = looped ? total * cycles : starts[A.hitFrame!] ?? 0, c = looped ? 0 : contactAnim / rate;
  // real ms → drawn ms: rate-scaled, frozen for the hitstop at the contact
  const animAt = (t: number) => (t < c ? t : t < c + hs ? c : t - hs) * rate;
  const drawPose = (g: CanvasRenderingContext2D, P: PoseLayers, dx: number, dy: number, alpha = 1) => {
    g.save(); g.globalAlpha *= alpha; g.imageSmoothingEnabled = false; g.translate(-ox + dx, -oy + dy);
    const put = (im?: HTMLImageElement) => { if (im) g.drawImage(im, 0, 0); };
    put(P.back); if (P.weaponZ === 'behind') put(P.weapon); put(P.body); if (P.weaponZ !== 'behind') { put(P.weapon); put(P.grip); } put(P.front);
    g.restore();
  };
  const endMs = looped ? (total * cycles) / rate : c + hs + (total - contactAnim) / rate;
  const hero = (g: CanvasRenderingContext2D, at: number) => {
    const t = interval ? at - Math.min(swings - 1, Math.max(0, Math.floor(at / interval))) * interval : at;
    // before and after the motion (and between swings): the approved idle, so the step from idle into it (and back) can be judged
    if (at < 0 || t >= endMs) { if (idlePose) drawPose(g, idlePose, 0, 0); else drawRigHero(g, look(id), { state: 'idle', t: 0, facing: 1 }); return; }
    const a = looped ? (t * rate) % total : Math.max(0, Math.min(total - 1, animAt(t)));
    let i = A.frames.length - 1; for (let k = 0; k < A.frames.length; k++) if (a < starts[k] + A.frames[k].ms) { i = k; break; }
    const F = A.frames[i];
    if (typeof F.pose === 'number') { drawPose(g, poses[F.pose], F.dx ?? 0, F.dy ?? 0); return; }
    // a missing in-between (between:a>b): both neighbours half-transparent, like the workshop's onion skin
    const mm = /between:(\d+)>(\d+)/.exec(F.pose); if (!mm) return;
    const fa = A.frames.find((x) => x.pose === Number(mm[1])), fb = A.frames.find((x) => x.pose === Number(mm[2]));
    drawPose(g, poses[Number(mm[1])], fa?.dx ?? 0, fa?.dy ?? 0, 0.5); drawPose(g, poses[Number(mm[2])], fb?.dx ?? 0, fb?.dy ?? 0, 0.5);
  };
  const style = m.hitStyle ?? sheet.hit?.style ?? 'slash';
  const layers: FxLayer[] = [...(ASSEMBLY.hits[style] ?? []), ...((sheet.hit?.fx ?? []).includes('impact') ? [{ fx: 'impact', ramp: '$hit', scale: 0.6 } as FxLayer] : [])];
  const insts = looped || m.hitFx === false ? [] : expandAssembly(layers, { element: (m.element ?? 'neutral') as Element, sourceRight: false });
  // the dummy just past the farthest katar tip of the motion (a 96 px hero reaches twice as far)
  const reach = Math.max(0, ...A.frames.map((f) => (typeof f.pose === 'number' ? (ps.frames[f.pose]?.anchors?.tip?.point?.[0] ?? ox) - ox + (f.dx ?? 0) : 0)));
  const dist = m.dist ?? Math.max(56 * k, reach + 14);
  if (M.characters[id]) show(id);
  const contacts = Array.from({ length: swings }, (_, j) => c + j * interval), last = contacts[swings - 1];
  return {
    label: `${id} · ${kind} · ×${+rate.toFixed(2)}${interval ? ` · 간격 ${interval}ms ×${swings}` : ''}${hs ? ` · 히트스톱 ${hs}ms` : ''}`, heroX: -dist / 2, dummyX: dist / 2, selfPoint: false,
    contactMs: c, contacts: swings > 1 ? contacts : undefined, durationMs: Math.max((swings - 1) * interval + endMs, ...insts.map((f) => last + f.delay + f.dur)), insts, motion: null, hero, knockPx: looped ? 0 : m.knock ?? sheet.hit?.knockPx ?? 3,
  };
}

/** builds the scene for an asset-stage:fx message; a string is an error to report */
function fxScene(m: Record<string, any>): FxScene | string {
  const element = (m.element ?? 'neutral') as Element;
  let layers: FxLayer[] | undefined, label: string, motion: Plan | null = null, dist = 56, hits = Number(m.hits) || 1, radius: number | undefined, selfPoint = false;
  if (m.skill) {
    const sk = SKILLS[m.skill];
    if (!sk) return '알 수 없는 스킬: ' + m.skill;
    layers = ASSEMBLY.skills[sk.fx];
    if (!layers) return `${sk.name}(${sk.fx})은 조립 데이터가 없습니다(예전 코드 이펙트)`;
    const owner = m.id && M.characters[m.id] ? m.id : heroes.find((h) => M.characters[h].skillMotions?.[m.skill]) ?? state.id;
    show(owner);
    const anim = M.characters[owner].skillMotions?.[m.skill];
    motion = anim ? plan(owner, anim) : null;
    dist = sk.kind === 'melee' ? 56 : 120; hits = Number(m.hits) || sk.hits?.(sk.maxLv) || 1; radius = sk.radius;
    selfPoint = /self/i.test(String(sk.kind));
    label = `${sk.name} · ${sk.fx}`;
    return finish(layers, label, motion, dist, hits, radius, selfPoint, (m.element ?? sk.element ?? 'neutral') as Element);
  }
  if (m.hit) {
    layers = ASSEMBLY.hits[m.hit];
    if (!layers) return '알 수 없는 명중 종류: ' + m.hit;
    if (m.id && M.characters[m.id]) show(m.id);
    motion = plan(state.id, 'attack');
    if (m.hit === 'pierce' && look(state.id).wtype === 'bow') dist = 120;
    return finish(layers, `평타 명중 · ${m.hit}`, motion, dist, 1, undefined, false, element);
  }
  if (m.base) {
    if (!fxInfo(m.base)) return '알 수 없는 기본 이펙트: ' + m.base;
    return finish([{ fx: m.base, ramp: m.ramp ?? 'steel', scale: Number(m.scale) || undefined }], `기본 이펙트 · ${m.base} · ${m.ramp ?? 'steel'}`, null, 56, 1, undefined, false, element);
  }
  return 'skill · hit · base 가운데 하나가 필요합니다';
}
function finish(layers: FxLayer[], label: string, motion: Plan | null, dist: number, hits: number, radius: number | undefined, selfPoint: boolean, element: Element): FxScene {
  const insts = expandAssembly(layers, { element, hits, radius, sourceRight: false });
  const contactMs = motion?.contactMs ?? 0;
  const end = Math.max(motion?.durationMs ?? 0, ...insts.map((f) => contactMs + f.delay + f.dur));
  return { label, heroX: -dist / 2, dummyX: dist / 2, selfPoint, contactMs, durationMs: end, insts, motion };
}

// ── playback
const state = { id: heroes[0], kind: 'idle', action: '', loop: true, speed: 1, start: 0, token: 0, plan: null as Plan | null };
function show(id: string, kind?: string) {
  if (!M.characters[id]) { say('알 수 없는 영웅: ' + id); return false; }
  if (state.id !== id) { state.id = id; state.plan = null; }
  if (kind) state.kind = kind;
  const tb = table(id);
  tell({ type: 'asset-stage:subject', id, frameMs: Object.fromEntries(Object.entries(tb).map(([k, a]) => [k, a.durations])), cells: Object.fromEntries(Object.entries(tb).map(([k, a]) => [k, a.frames])) });
  say(`${id} · ${state.kind} 준비됨`);
  return true;
}
function play(action: string) {
  scene = null;
  const kind = action === 'selected' ? state.kind : action;
  state.action = action; state.plan = plan(state.id, kind); state.start = performance.now(); state.token++;
  say(`${state.id} · ${kind} 재생${state.plan.contactMs != null ? ` (접촉 ${Math.round(state.plan.contactMs)}ms)` : ''}`);
  tell({ type: 'asset-stage:played', id: state.id, action });
}
let lastPaint = 0;
function frame(now: number) {
  requestAnimationFrame(frame);
  // idle (nothing playing) or hidden: the idle breathing changes every ~200 ms, so a few repaints a second are enough (laptop heat)
  if (document.hidden || (!state.plan && !scene && now - lastPaint < 100)) return;
  lastPaint = now;
  if (scene) {
    const t = (now - state.start) * state.speed;
    if (t > scene.durationMs + 600) { if (state.loop) state.start = now; else { paint(ctx, { state: 'idle', t: now, facing: 1 }, state.id, true, scene, -1e9); return; } }
    const mp = scene.motion;
    paint(ctx, mp && t < mp.durationMs ? mp.pose(t) : { state: 'idle', t: now, facing: 1 }, state.id, true, scene, t);
    return;
  }
  const p = state.plan;
  let pose: Pose = { state: 'idle', t: now, facing: 1 };
  if (p) {
    const t = (now - state.start) * state.speed;
    if (t < p.durationMs) pose = p.pose(t);
    else if (state.loop && t > p.durationMs + 600) state.start = now; // a short rest in idle, then again
    else if (!state.loop && t >= p.durationMs) state.plan = null;
  }
  paint(ctx, pose, state.id, true);
}

// ── 촬영 (asset-kit film): the motion painted frame by frame at even times, with the cell drawn and crops of the stage and of the hero alone
async function film({ id = state.id, action = 'selected', speed = 1, fps = 60, before = 120, after = 160, width = 200 }: { id?: string; action?: string; speed?: number; fps?: number; before?: number; after?: number; width?: number } = {}) {
  if (action === 'fx') return filmFx({ fps, before, after, width });
  if (!show(id)) throw new Error('알 수 없는 영웅: ' + id);
  const kind = action === 'selected' ? state.kind : action;
  const p = plan(id, kind), L = look(id), sp = Math.min(2, Math.max(0.25, Number(speed) || 1)), dt = 1000 / fps;
  const anim = table(id)[p.kind] ?? table(id).idle;
  const main = document.createElement('canvas'), solo = document.createElement('canvas');
  for (const c of [main, solo]) { c.width = canvas.width; c.height = canvas.height; }
  const mg = main.getContext('2d')!, sg = solo.getContext('2d')!;
  const s = unitScale(), h = 76 * s * (M.canvas.bodyHeight ?? 48) / 62, [fx, fy] = foot();
  const box = { x: fx - h * 1.4, y: fy - h * 1.55, w: h * 2.8, h: h * 1.75 }; // wide enough for smears and long weapons
  const ow = width, oh = Math.round(width * box.h / box.w);
  const grab = (src: HTMLCanvasElement) => { const o = document.createElement('canvas'); o.width = ow; o.height = oh; o.getContext('2d')!.drawImage(src, box.x * dpr, box.y * dpr, box.w * dpr, box.h * dpr, 0, 0, ow, oh); return o.toDataURL('image/png'); };
  const total = p.durationMs / sp, frames = [];
  for (let k = -Math.ceil(before / dt); k <= Math.ceil((total + after) / dt); k++) {
    const t = k * dt, act = t >= 0 && t < total, at = t * sp;
    const pose = act ? p.pose(at) : { state: 'idle', t: 0, facing: 1 as const };
    paint(mg, pose, id, true); paint(sg, pose, id, false);
    const pf = act ? pixelFrame(L, pose) : null;
    frames.push({ t: Math.round(t * 10) / 10, phase: act ? 'act' : 'idle', age: act ? Math.round(t) : null, cell: pf && pf.anim === p.kind ? pf.index : null, motion: null, crop: grab(main), solo: grab(solo) });
  }
  return {
    kit: 1, game: 'Mini Midgard', subject: id, name: id, action: p.kind, art: 'pixel frames (src/assets/pixel)', speed: sp, fps, frameMs: +dt.toFixed(3),
    durationMs: Math.round(total), contactMs: p.contactMs == null ? null : Math.round(p.contactMs / sp * 10) / 10, contactCell: p.contactCell,
    cellNames: anim.frames, cells: anim.frames.length, crop: { width: ow, height: oh, bodyPx: Math.round(h * ow / box.w), scale: +(ow / box.w).toFixed(4), follow: false }, frames,
  };
}

/** 촬영 of the effect scene: the whole stage (hero, dummy, effects) at even times, cropped wide enough for both units */
async function filmFx({ fps = 60, before = 120, after = 160, width = 260 }: { fps?: number; before?: number; after?: number; width?: number }) {
  const sc = scene;
  if (!sc) throw new Error('이펙트 장면이 없습니다(asset-stage:fx 먼저)');
  const main = document.createElement('canvas'); main.width = canvas.width; main.height = canvas.height;
  const mg = main.getContext('2d')!, s = unitScale(), [fx, fy] = foot(), dt = 1000 / fps;
  const box = { x: fx + (sc.heroX - 70) * s, y: fy - 110 * s, w: (sc.dummyX - sc.heroX + 140) * s, h: 130 * s };
  const ow = width, oh = Math.round(width * box.h / box.w);
  const frames = [];
  for (let k = -Math.ceil(before / dt); k <= Math.ceil((sc.durationMs + after) / dt); k++) {
    const t = k * dt, mp = sc.motion;
    paint(mg, mp && t >= 0 && t < mp.durationMs ? mp.pose(t) : { state: 'idle', t: 0, facing: 1 }, state.id, true, sc, t);
    const o = document.createElement('canvas'); o.width = ow; o.height = oh;
    o.getContext('2d')!.drawImage(main, box.x * dpr, box.y * dpr, box.w * dpr, box.h * dpr, 0, 0, ow, oh);
    frames.push({ t: Math.round(t * 10) / 10, phase: t >= 0 && t < sc.durationMs ? 'act' : 'idle', age: t >= 0 ? Math.round(t) : null, cell: null, motion: null, crop: o.toDataURL('image/png'), solo: null });
  }
  return { kit: 1, game: 'Mini Midgard', subject: state.id, name: sc.label, action: 'fx', speed: 1, fps, frameMs: +dt.toFixed(3), durationMs: Math.round(sc.durationMs), contactMs: Math.round(sc.contactMs), contactCell: null, cellNames: [], cells: 0, crop: { width: ow, height: oh, bodyPx: Math.round(48 * s * ow / box.w), scale: +(ow / box.w).toFixed(4), follow: false }, frames };
}

addEventListener('message', (ev) => {
  if ((ev.data || {}).type === 'asset-stage:assembly') {
    const m = ev.data as Record<string, any>, src = ev.source as Window | null;
    assemblyScene(m).then((r) => {
      if (typeof r === 'string') { say(r); src?.postMessage({ type: 'asset-stage:assembled', req: m.req, ok: false, error: r }, '*'); return; }
      if (m.loop !== undefined) state.loop = !!m.loop;
      scene = r; state.plan = null; state.start = performance.now(); state.token++;
      say(`${r.label} 재생 (접촉 ${Math.round(r.contactMs)}ms, 전체 ${Math.round(r.durationMs)}ms)`);
      src?.postMessage({ type: 'asset-stage:assembled', req: m.req, ok: true, label: r.label, contactMs: Math.round(r.contactMs), durationMs: Math.round(r.durationMs) }, '*');
    });
    return;
  }
  if ((ev.data || {}).type === 'asset-stage:fx') {
    const m = ev.data as Record<string, any>, src = ev.source as Window | null;
    const r = fxScene(m);
    if (typeof r === 'string') { say(r); src?.postMessage({ type: 'asset-stage:fxed', req: m.req, ok: false, error: r }, '*'); return; }
    if (m.loop !== undefined) state.loop = !!m.loop;
    if (m.speed) state.speed = Math.min(2, Math.max(0.25, Number(m.speed) || 1));
    scene = r; state.plan = null; state.start = performance.now(); state.token++;
    say(`${r.label} 재생 (접촉 ${Math.round(r.contactMs)}ms, 기본 이펙트 ${r.insts.length}개)`);
    src?.postMessage({ type: 'asset-stage:fxed', req: m.req, ok: true, label: r.label, contactMs: Math.round(r.contactMs), durationMs: Math.round(r.durationMs), layers: r.insts.map((f) => ({ fx: f.play.id, ramp: f.play.ramp, at: f.at, on: f.on, delayMs: Math.round(r.contactMs + f.delay), durMs: Math.round(f.dur), layer: f.layer })) }, '*');
    return;
  }
  const m = (ev.data || {}) as Record<string, any>;
  if (m.type === 'asset-stage:show' && m.id) show(m.id, m.kind);
  if (m.type === 'asset-stage:play') {
    if (m.loop !== undefined) state.loop = !!m.loop;
    if (m.speed) state.speed = Math.min(2, Math.max(0.25, Number(m.speed) || 1));
    if (!m.id || show(m.id)) play(m.action || 'selected');
  }
  if (m.type === 'asset-stage:options') {
    // 평타 타이밍 기준본/후보: 'uniform' = 지금 게임(그림 전체를 한 배율로), 'contact' = 후보(접촉 앞만 맞추고 타격 뒤는 그림 시간대로)
    // 'event' = 공속 배율 후보(그림 시간 × 1/배율, 피해는 접촉 장 시작): attackRate 1·1.5·2·2.5 …
    // attackInterval (ms): the rule picks the rate (attack-rule.ts) and the assembly scene repeats the swing at that interval
    if (m.attackInterval != null) {
      attackInterval = Math.max(0, Number(m.attackInterval) || 0);
      if (attackInterval) { setAttackTiming('event'); setAttackRate(attackRateFor(attackInterval)); }
      say(attackInterval ? `평타 간격 ${attackInterval}ms → 배율 ×${+attackRateFor(attackInterval).toFixed(2)} (조립 재생은 3번 연속)` : '평타 간격 끔(한 번 재생)');
    }
    if (m.attackRate != null) setAttackRate(Number(m.attackRate));
    if (m.attackTiming === 'uniform' || m.attackTiming === 'contact' || m.attackTiming === 'event' || m.attackRate != null) {
      if (m.attackTiming) setAttackTiming(m.attackTiming);
      state.plan = state.plan ? plan(state.id, state.plan.kind) : null;
      say(`평타 타이밍: ${m.attackTiming === 'event' ? `공속 배율 ×${m.attackRate ?? 1}` : m.attackTiming === 'contact' ? '후보(타격 뒤 그림 시간대로)' : m.attackTiming === 'uniform' ? '기준본(지금 게임)' : `배율 ×${m.attackRate}`}`);
    }
    if (m.loop !== undefined) state.loop = !!m.loop;
    if (m.speed) state.speed = Math.min(2, Math.max(0.25, Number(m.speed) || 1));
  }
  // timeline@1 (asset-kit 타임라인): checked with the shared validator; this bare stage plays the timeline's body motion only —
  // its effects, camera and cut-ins play on the field (game URL ?demo=<skill id>)
  if (m.type === 'asset-stage:timeline' && ev.source) {
    const src = ev.source as Window;
    const tl = (m.timeline as Timeline | undefined) ?? timelines().find((t) => t.id === m.id);
    const errors = tl ? validateTimeline(tl) : ['타임라인을 찾지 못했습니다: ' + (m.id ?? '')];
    if (tl && !errors.length) {
      const motion = tl.tracks.find((t) => t.type === 'motion')?.clips[0] as { anim?: string } | undefined;
      if (tl.subject && M.characters[tl.subject]) show(tl.subject, motion?.anim ?? state.kind);
      if (motion?.anim) play('selected');
    }
    src.postMessage({ type: 'asset-stage:timelined', req: m.req, ok: !errors.length, ...(errors.length ? { errors } : { event: 'motion', note: '무대는 몸 동작만 재생합니다. 이펙트·카메라·컷인은 게임 ?demo=<스킬 id>에서' }) }, '*');
  }
  if (m.type === 'asset-stage:film' && ev.source) {
    const src = ev.source as Window;
    film(m).then((f) => src.postMessage({ type: 'asset-stage:filmed', req: m.req, film: f }, '*'), (e) => src.postMessage({ type: 'asset-stage:filmed', req: m.req, error: String(e?.message ?? e) }, '*'));
  }
});

const AssetStageFilm = { ready: false, record: film };
Object.assign(window, { AssetStageFilm, MiniMidgardStage: { state, plan, film, show, play, assembly: async (m: Record<string, any>) => { const r = await assemblyScene(m); if (typeof r !== 'string') { scene = r; state.plan = null; state.start = performance.now(); } return typeof r === 'string' ? r : r.label; }, fx: (m: Record<string, any>) => { const r = fxScene(m); if (typeof r !== 'string') { scene = r; state.plan = null; state.start = performance.now(); } return typeof r === 'string' ? r : r.label; } } });

(async () => {
  resize(); addEventListener('resize', resize);
  setWholeEnabled(true); setPixelEnabled(true, 'p2');
  await loadRig();
  const q = new URLSearchParams(location.search);
  show(q.get('hero') ?? heroes[0], q.get('kind') ?? 'idle');
  requestAnimationFrame(frame);
  AssetStageFilm.ready = true;
  const actions = [
    { id: 'selected', label: '고른 동작 재생' }, { id: 'attack', label: '평타' }, { id: 'cast', label: '시전' },
    { id: 'walk', label: '걷기' }, { id: 'hurt', label: '피격' }, { id: 'dead', label: '쓰러짐' },
  ];
  const fxSkills = Object.values(SKILLS).filter((sk) => ASSEMBLY.skills[sk.fx]).map((sk) => ({ id: sk.id, name: sk.name, fx: sk.fx, hero: heroes.find((h) => M.characters[h].skillMotions?.[sk.id]) ?? null }));
  tell({ type: 'asset-stage:ready', heroes, tunables: {}, defaults: {}, actions, film: ['selected', 'attack', 'cast', 'walk', 'fx'], timelines: timelines().map((t) => ({ id: t.id, skills: t.skills, subject: t.subject })),
    fx: { base: FX_IDS, ramps: Object.keys(RAMPS), hits: Object.keys(ASSEMBLY.hits), skills: fxSkills },
    // A/B switches the workshop can offer: asset-stage:options {attackTiming}
    options: {
      attackTiming: { values: ['uniform', 'contact', 'event'], labels: ['기준본(지금 게임)', '후보(타격 뒤 그림 시간대로)', '공속 배율(그림 시간 ÷ 배율, 피해 = 접촉 장)'], default: 'uniform' },
      attackRate: { values: [1, 1.5, 2, 2.5], labels: ['×1 (기준 간격)', '×1.5', '×2', '×2.5 (최대)'], default: 1, appliesTo: 'event' },
      // the adopted rule (attack-rule.ts): pick an attack interval, the rate follows; the assembly scene swings 3 times at it
      attackInterval: { values: [0, 860, 600, 480, 360, 240], labels: ['끔 (한 번)', '0.86초 · 초반 (×1, 쉬는 틈)', '0.6초 · 기준 (×1)', '0.48초 (×1.25)', '0.36초 · 공속 버프 (×1.67)', '0.24초 · 최대 (×2.5)'], default: 0, appliesTo: 'event' },
    } });
  show(state.id);
})().catch((e) => say('무대를 열지 못했습니다: ' + (e?.message ?? e)));
