// 이야기 창 (docs/design/EXPLORATION.md §3): the region stories, piece by piece as the party finds them on the maps.
import { useEffect } from 'preact/hooks';
import { useGame } from './game.ts';
import { zone } from '../game/data/zones.ts';
import { STORY_ARCS, POIS } from '../game/data/explore.ts';
import { arcComplete, arcEnded, arcFound, fragmentFound, poiState } from '../game/explore.ts';

export function StoryModal(props: { arc?: string }) {
  const g = useGame();
  const s = g.s;
  // opening the window reads what was new
  useEffect(() => { const st = poiState(s); if (st.unread.length) { st.unread = []; g.commit(); } }, []);
  const arcs = props.arc ? STORY_ARCS.filter((a) => a.id === props.arc) : STORY_ARCS;
  return (
    <div class="modal story-modal">
      <div class="win-title"><span>이야기</span><span class="sp" /><button class="x" aria-label="닫기" onClick={() => g.popModal()}>×</button></div>
      <div class="win-body">
        {arcs.map((arc) => {
          const found = arcFound(s, arc), done = arcComplete(s, arc.id), ended = arcEnded(s, arc.id);
          return (
            <div class="story-arc">
              <div class="sec">{arc.region} · 「{arc.title}」 <small>{found}/{arc.fragments.length}{ended ? ' · 완결' : ''}</small></div>
              {arc.fragments.map((f, i) => {
                const ok = fragmentFound(s, f.id);
                const where = zone(f.zone).name;
                return ok ? (
                  <div class="story-frag">
                    <div class="sf-head"><b>{i + 1}. {f.title}</b><small>{where}</small></div>
                    {f.text.map((p) => <p>{p}</p>)}
                  </div>
                ) : (
                  <div class="story-frag unk"><div class="sf-head"><b>{i + 1}. ???</b><small>{where} 어딘가</small></div></div>
                );
              })}
              {done && !ended && <div class="hint">조각을 모두 모았다. 「{zone(arc.hidden).name}」(으)로 가는 길이 열렸다.</div>}
              {ended && (
                <div class="story-frag end">
                  <div class="sf-head"><b>맺음 · {arc.ending.title}</b></div>
                  {arc.ending.text.map((p) => <p>{p}</p>)}
                </div>
              )}
            </div>
          );
        })}
        <div class="small muted" style={{ marginTop: '8px' }}>조각은 맵을 탐험하면 드러납니다(탐험도와 그 자리를 밟았는지). 파티 명령의 「탐험」을 켜거나 명단의 동료를 탐험대로 보내세요.</div>
      </div>
    </div>
  );
}

/** how many story pieces are waiting to be read (for a nav badge) */
export const unreadStories = (s: import('../game/types.ts').GameState) => s.poi?.unread.length ?? 0;
/** lore points found on a map (for the map card) */
export const zoneLore = (zoneId: string) => POIS.filter((p) => p.zone === zoneId && p.kind === 'lore');
