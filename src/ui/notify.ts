// Desktop play: the big moments (level ups, a job change ready, cards, slotted/rare gear, MVP kills, a wipe, a new map,
// a danger monster on an expedition map)
// become one system notification while the player is in another window or tab, and a count in the tab title.
// game.ts feeds it the sim's events every frame (or every background tick) before anything consumes them.
import type { FxEvent, World } from '../game/world.ts';
import { ITEMS } from '../game/data/items.ts';

const BASE_TITLE = typeof document !== 'undefined' ? document.title : '';

export function notifySupported() { return typeof Notification !== 'undefined'; }
export function notifyAllowed() { return notifySupported() && Notification.permission === 'granted'; }
/** ask the browser for permission (must run from a click); resolves to whether notifications may show */
export async function requestNotify(): Promise<boolean> {
  if (!notifySupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

export class Notifier {
  private lines: string[] = [];
  private unseen = 0;
  private lastFlush = 0;

  /** the player is looking elsewhere: another tab, another app or a minimised window */
  away() { return document.hidden || !document.hasFocus(); }

  /** read (not consume) a batch of sim events and notices */
  watch(w: World, events: FxEvent[], notices: { kind: string; text: string }[]) {
    if (!this.away()) return;
    const name = (uid: number) => w.heroes.find((h) => h.uid === uid)?.hero.name ?? '';
    for (const e of events) {
      if (e.t === 'levelup') {
        const h = w.heroes.find((x) => x.uid === e.uid)?.hero;
        if (h) this.lines.push(e.job ? `${h.name} 잡 레벨 ${h.jobLv}` : `${h.name} 레벨 ${h.baseLv} 달성!`);
      } else if (e.t === 'announce') {
        if (e.kind === 'card') this.lines.push(`카드 — ${e.text}`);
        else if (e.kind === 'mvp' && e.text.startsWith('MVP!')) this.lines.push(`${e.text} — MVP 처치`);
        else if (e.kind === 'wipe' && e.text.startsWith('파티 전멸')) this.lines.push('파티 전멸… 재정비 중');
        else if (e.kind === 'unlock' && (e.text.includes('열렸다') || e.text.includes('개방'))) this.lines.push(e.text);
        else if (e.kind === 'danger') this.lines.push(e.text); // M10: a danger monster appeared / woke / fell
      } else if (e.t === 'pickup' && e.id) {
        const d = ITEMS[e.id];
        if (d?.kind === 'equip' && (d.rarity || e.name.includes('['))) this.lines.push(`득템 — ${e.name}${name(e.to) ? ` (${name(e.to)})` : ''}`);
      }
    }
    for (const n of notices) if (n.kind === 'job') this.lines.push(n.text);
  }

  /** at most one notification every few seconds, with everything since the last one */
  flush(enabled: boolean, now: number) {
    if (!this.lines.length || now - this.lastFlush < 3000) return;
    this.lastFlush = now;
    const lines = this.lines.splice(0);
    if (!this.away()) return;
    this.unseen += lines.length;
    document.title = `(${this.unseen}) ${BASE_TITLE}`;
    if (!enabled || !notifyAllowed()) return;
    const title = lines.length === 1 ? lines[0] : `${lines[0]} 외 ${lines.length - 1}건`;
    try {
      const n = new Notification(title, { body: lines.length > 1 ? lines.slice(1, 6).join('\n') : '미니 미드가르', tag: 'minimidgard', silent: false });
      n.onclick = () => { window.focus(); n.close(); };
    } catch { /* some browsers only allow notifications from a service worker */ }
  }

  /** back in the game: clear the title count */
  seen() {
    if (!this.unseen) return;
    this.unseen = 0;
    document.title = BASE_TITLE;
  }
}
