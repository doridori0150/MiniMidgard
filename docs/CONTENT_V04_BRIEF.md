# 콘텐츠 v0.4 — 직업별 고향과 초보존, 사냥터 약 2배

## 요약 (사람용)
- 사용자 요청: "맵도 라그나로크 참고해서 크게 좀 만들어줘. 초보존이 되게 많잖아. 직업별로. 그 정도까지는 안 되더라도 한 2배 정도?"
- 방향:
  - RO처럼 **1차 직업마다 고향 지방**이 있고, 그 주변에 초보 사냥터가 여럿 있다.
  - 초보 필드(Lv 1~15) 여섯 곳은 **처음부터 열려 있어** 어디서 시작할지 고를 수 있다.
  - 사냥터를 24곳에서 약 49곳으로 늘린다.
- 새 지방은 셋이다.
  - **안개 호수 지방**: 마법사의 고향.
  - **푸른 항구 지방**: 상인의 고향.
  - **하늘 유적 지방**: Lv 80~99 끝판.
- 기존 지방에도 사냥터를 더한다.
  - 햇살 평원(검사·성직자): +2
  - 속삭이는 숲(궁수): +2
  - 작열하는 사막(도둑): +3
  - 잿빛 광산: +1
  - 얼어붙은 설원: +1
- 숨겨진 장소를 2곳 더한다.
- 이름·외형은 모두 오리지널이다. RO 이름(포링, 프론테라, 페이욘 등)은 쓰지 않는다.
- 화면 구조는 바꾸지 않는다. 세계 지도에 지방과 핀이 늘고, 지방 카드에 "○○의 고향" 한 줄만 더한다.

---

## REQUEST (for the content agent)

Read `docs/CONTENT.md` first. Its design rules (section 1), drop-table shape, card rules, gate authoring rules and element homework all still apply. This brief only adds maps on top of them.

### Goal
The game should feel like RO's world: every first job has a home region with **several beginner fields around it**, so early play offers real choice of where to hunt. The world grows from **24 hunting maps to about 49**.

### The new map list
The structure below is decided. Inside it, the details are yours: monsters, exact levels within ±2, specialties, boss names, flavour text and map pins. All Korean names below are suggestions; keep them original.

| Region | Home of | New maps (id · name · Lv · kind · role · opens) |
|---|---|---|
| 햇살 평원 지방 | 검사 · 성직자 | `wheatfield` 황금 밀밭 · 4–14 · field · exp · **open from the start**<br>`abbeyyard` 수도원 묘지 · 14–24 · field · exp · opens with the meadow boss. A low-level undead/ghost field, the acolyte's homework. |
| 속삭이는 숲 지방 | 궁수 | `woodedge` 숲 어귀 · 2–12 · field · exp · **open from the start**, with a field boss<br>`mushvale` 버섯 골짜기 · 9–19 · field · loot · opens with the woodedge boss<br>Change `forest` to open with the woodedge boss (`unlockBy: 'woodedge'`). |
| **안개 호수 지방** (new) | 마법사 | `lakeshore` 호숫가 풀밭 · 1–12 · field · exp · **open from the start**, boss<br>`mistmarsh` 안개 늪 · 10–20 · field · loot<br>`magetower1` 마도탑 1층 · 18–28 · dungeon · exp, floor boss<br>`magetower2` 마도탑 2층 · 26–36 · dungeon · loot, floor boss<br>`magetower3` 마도탑 꼭대기 · 34–44 · dungeon · MVP |
| 작열하는 사막 지방 | 도둑 | `dunes` 모래 언덕 변두리 · 3–13 · field · exp · **open from the start**, boss<br>`thiefden` 도적 소굴 · 13–24 · dungeon · exp/zeny, boss<br>`redcanyon` 붉은 바위 협곡 · 30–42 · field · loot |
| **푸른 항구 지방** (new) | 상인 | `beach` 파도 해변 · 1–12 · field · exp · **open from the start**, boss<br>`lighthouse` 등대 곶 · 10–20 · field · loot<br>`wreck` 난파선 · 18–28 · dungeon · exp/zeny, boss<br>`coralcave` 산호 동굴 · 28–38 · dungeon · loot, boss<br>`abyss` 산호 동굴 심층 · 36–46 · dungeon · MVP |
| 잿빛 광산 지방 | — | `ironridge` 철광 능선 · 34–44 · field · exp |
| 얼어붙은 설원 지방 | — | `pinetrail` 침엽수 눈길 · 52–62 · field · exp. It bridges the desert and the snow. |
| **하늘 유적 지방** (new) | — | `cloudstair` 구름 계단 · 80–90 · field · exp<br>`windtemple` 바람의 신전 · 84–94 · dungeon · exp/loot, boss<br>`skygarden` 하늘 정원 · 88–98 · field · loot<br>`sanctum` 천공 성소 · 92–99 · dungeon · MVP<br>The region opens after the snow end-game, through a boss or MVP you choose. |
| Secrets (+2) | — | One in 푸른 항구 (e.g. a pirate treasure island: clue item pieces, then a boss).<br>One in 안개 호수 (e.g. a mirror lake). Use a mechanism **different** from the five existing secrets.<br>Follow the gate authoring rules. |

**Opening rules:**
- The six beginner fields are open from the start: meadow, wheatfield, woodedge, lakeshore, dunes and beach.
- Everything else opens through local field bosses (`unlockBy`), like the existing chains. Each home region gets its own short ladder from Lv 1 to about Lv 40.
- The ladders should cross over into the existing mid regions, so a party from any home can reach quarry, desert and snow.
- **Save migration:** existing saves gain the five new start-open fields on load. Anything they already unlocked stays unlocked, including `forest`. Follow the existing migration pattern in `state.ts`.

### Monsters, cards and items
- **Monsters:**
  - New species as needed; roughly 40–50 is expected.
  - Beginner fields mix a few existing low monsters (말랑, 애벌레, 뿔토끼…) with regional variants, as RO reuses its low monsters across fields.
  - Every new monster gets exactly one card `c_<id>` and its own signature etc item, per CONTENT.md.
- **Drawing:**
  - Reuse the existing sprite kinds in `src/render/monster.ts` with new palettes (palette swaps are very RO).
  - Add a new sprite kind only where a region really needs one, e.g. a crab/fish for the harbour or a floating book for the mage tower. Keep that to about 4.
  - Draw new kinds in the same code style: thick dark ink contour, flat colours, one hard shadow tone. Check them in a screenshot.
- **Items:**
  - Each new map gets specialties, as now: headgear/costume, accessories with [1] variants, weapons with [n] slot variants.
  - Each home region should have something its class wants. Examples: the mage tower drops rods and INT gear; the harbour drops merchant axes and zeny-ish loot; the thief den drops daggers and katars.
  - Keep the economy sane: run the audit.
- **Field themes:**
  - Only the existing themes exist: meadow / forest / cave / town / desert / snow.
  - Use them with `tint`. For example: the beach is desert with a pale sand tint; the lake is meadow or forest with a misty blue-green tint; the sky ruins are snow or meadow with a pale gold or lavender tint.
  - Do not add new background art.

### World map and UI (keep the layout)
- **New regions:** give the three new regions spots on the world map with readable pins at a 360–390 px wide phone screen. Suggestions:
  - lake around [50, 36];
  - harbour bottom-left around [16, 86];
  - sky ruins top-right around [88, 12].
  - Move existing pins slightly only if needed for legibility.
- **Roads:** add `ROADS` and region colours in `src/render/worldmap.ts`.
- **Home line:** add a small per-region metadata table (e.g. `REGION_INFO` in zones.ts: name → `{ home?: string }`). Show one line "○○의 고향" on the region header/card in the map panel. No other UI restructuring: the user is sensitive to UI changes.
- **Recommendation:** if the game picks or recommends a map, make sure new players see the beginner fields. It is fine and RO-like that the default start stays `meadow`.

### Balance
- **Tools:** run `node --experimental-strip-types tools/audit.ts all` and `npm run sim`.
- **Heat:** sims must stay gentle on the user's Mac. Use the npm script (it runs at background QoS), short batches, a few seeds, never long full-speed loops.
- **Targets:**
  - 2nd job ≈ 13 h for a healer party;
  - content end ≈ 30 h through Lv 84;
  - the new 84–99 region extends past that, so report how long it takes.
  - Report before/after numbers.
- **Early choice:** a party should be able to level 1→15 in any of the six beginner fields at a similar pace (±25 % EXP/h). Measure it.

### Deliverables
1. Data in `src/game/data/zones.ts`, `monsters.ts`, `items.ts`, plus any renderer, world-map and migration code.
2. `docs/CONTENT.md` updated to v0.4: tables, unlock tree, secrets.
3. The audit passes; `npx tsc --noEmit -p .` and `npm run build` pass.
4. Screenshots:
   - the world map;
   - one new field per new region;
   - any new monster sprite kinds.
   - Use a throwaway headless browser with its own profile, booted with `?qa` (QA boots never save). **Never** use the user's in-app browser or its localStorage.
5. Commit on your branch with a clear message, in English, ending with the co-author line used in this repo's history. Do not push.
6. Finish with a short report: what was added (counts), sim numbers, and anything you were unsure about.

### Constraints
- Original names and designs only. No RO names, sprites or music.
- Do not touch the shop or panel layouts, hero rendering (`src/render/rig.ts`, `whole.ts`, `sprite.ts`), or `docs/art`.
