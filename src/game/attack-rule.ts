// 평타 재생 규칙 (공방 검토 세션 권고안, 2026-10-10 채택 — 필드 적용은 사용자 한마디 뒤):
// 그린 평타를 공속 배율로 재생하고, 피해는 그림의 접촉 장이 시작될 때 들어갑니다.
// 배율 = 기준 간격 600 ms(aspd 170) ÷ 공격 간격. 느린 영웅은 1에서 멈추고(남는 시간은 전투 대기), 빠른 영웅은 2.5배(간격 240 ms)에서
// 멈춥니다. 그보다 짧은 간격은 다음 평타가 회수 장을 자릅니다. 스킬은 이 규칙을 쓰지 않습니다(SKILL_CONTACT).

/** the attack interval at which a drawn swing plays at its drawn pace */
export const ATTACK_BASE_DELAY = 600;
/** the fastest playback: the wind-up still shows 4–5 screen frames */
export const ATTACK_MAX_RATE = 2.5;
export const attackRateFor = (delay: number) => Math.min(ATTACK_MAX_RATE, Math.max(1, ATTACK_BASE_DELAY / Math.max(1, delay)));
/** stats.ts: delay = (200 − aspd) × 20 ms, at least 200 ms */
export const delayOfAspd = (aspd: number) => Math.max(200, (200 - aspd) * 20);

interface Anim { durations: number[]; duration: number; hitFrame?: number }
interface PixelChars { characters: Record<string, { animations?: Record<string, Anim> }>; animations: Record<string, Anim> }
/** a pixel character's drawn swing: ms from its start to the contact frame, and its whole length (null without a hitFrame) */
export function drawnSwing(M: PixelChars, id: string): { contact: number; duration: number } | null {
  const a = (M.characters[id]?.animations ?? M.animations).attack;
  if (!a || a.hitFrame == null) return null;
  return { contact: a.durations.slice(0, a.hitFrame).reduce((x, y) => x + y, 0), duration: a.duration };
}
