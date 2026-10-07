# 탐험·신비 리서치 — 방치형 RO에 "숨겨진 장소"를 심는 법

> 작성 2026-10-07 · 대상 코드: `ZoneGate`/`GateNeed`(`src/game/data/zones.ts`), `needMet`·`gateDiscoverable`·`gateReady`·`openGate`·`canEnter`·`gateLines`(`src/game/state.ts`), `gateTick`(`src/game/world.ts`), `MapPanel`(`src/ui/WorldMap.tsx`), `applyOffline`(`src/game/offline.ts`)
> 요청: "싱글 게임이니까 조금은 신비로움이 있으면 좋겠어. 탐험/탐사의 감성? … 특정 던전 가려면 조건이 필요하다거나."
> 표기: `[R#]` RO 원작 · `[K#]` 한국 게임 · `[D#]` 싱글 게임 설계 · `[I#]` 방치/증분 게임 (8장). ✔ = 이번에 원문·위키 원본·소스 코드로 확인, ◇ = 검색 요약·통념 수준(구현 전 재확인 권장).

---

## 0. 한 줄 요약

방치형의 신비는 **"자리를 비운 사이 세계가 무언가를 흘려 두고, 돌아온 플레이어에게 '이게 뭐지?'를 건네는 것"**이다. 순서는 RO 원작과 같다: **소문(문을 먼저 보여준다) → 단서(주운 물건이 말한다) → 조건(대부분 사냥으로 저절로 찬다) → 발견 순간(연출 + 일지 기록) → 보상(대안 사냥터·외형·로어·카드)**. 이미 들어간 `ZoneGate`는 이 뼈대의 70%를 갖췄다. 빠진 것은 **상태에 반응하는 소문**, **로어가 담긴 단서 아이템**, **빈 페이지가 있는 탐험 일지**, 그리고 **오프라인 중의 발견을 귀환 화면에서 터뜨리는 처리**다. 원칙은 하나: **답은 반드시 게임 안에 두 번 이상 적혀 있어야 한다**(위키를 열게 만들면 실패).

---

## 1. RO 원작 사례

| 장소·요소 | 어떻게 들어가나 | 신비 장치 | 출처 |
|---|---|---|---|
| **움발라 언어** | 원주민 NPC는 "모험가가 할 줄 모르는 우탄어"로 말한다. 촌장의 언어 퀘스트(◇ 가면을 쓰고 가서 기름종이 10·매끄러운 종이 5·새 깃털 1·오징어 먹물 1 제출)를 마치면 이해 가능 | **지식(언어) 게이트**. 배운 뒤 '부부싸움' NPC 대화를 이해하게 되지만, **그때부터는 이그드라실 잎/열매를 더 못 받는다** → "몰랐을 때만 얻는 것" | [R1]✔ [R2]✔ [R3]◇ |
| **니플헤임** | 움발라 던전 → 위그드라실 나무 → 필드 1장을 걸어서. 또는 움발라 **번지점프에 '실패'하면** 도착 | 로어: "나무 끝에 엄청난 보물이 있다"는 소문을 듣고 들어간 자들이 **돌아오지 않았다**, 생존자는 "다 죽었어… 추워…"만 반복. 마을 안에도 몬스터가 돌고, 마을에서 죽으면 경험치를 잃는다 | [R4]✔ [R5]✔ |
| **어비스 레이크** | 휴겔 필드 5의 **기둥에 용의 송곳니·비늘·꼬리 각 1개를 바치면** 섬 동굴로 가는 포털이 **30초** 열림 | 세계관과 붙은 제물(용의 몸 → 용의 호수). 바치지 않고 **'먹기'를 고르면 HP 10% 잃는** 개그 선택지. 한 명이 기둥에 남아 동료를 보내 주는 협동 | [R6]✔ |
| **거북섬** | 알베르타 여관 오른쪽 방의 **'거북 할아버지'에게 "어떻게 가요?"**를 물어야 그 뒤로 선원이 10,000z에 태워 줌 | 숨은 NPC와의 대화 한 줄이 열쇠. 레벨·아이템 조건 없음 | [R7]✔ |
| **바이오 연구소** | Lv60. 리히타르젠 빈민가 경비병에게 **계속 말을 걸면** 통과 → 전직 연구원 '피시본'에게 젤로피 20개 → 미로(`/where`와 시계 방향 단서) → 그림 뒤의 숫자 → 통에 코드 입력 → 연구소 출입증 → 실험관으로 하강 | **비밀 통로의 교과서**: 끈질긴 대화, 내부자 정보, 미로, 숫자 퍼즐, 출입증 | [R8]✔ |
| **타나토스 탑 상층** | 2층 안내원 앞에 **5명 이상 모여야** 3층 문이 열림, 3층 룬 장치를 **Lv4 무기로 비틀어** 빨간 열쇠, 색 열쇠 4종, 유령 소환에 파편 4종(고통·비참·절망·증오) | 다단계 열쇠 사슬 + 파티 규모 조건 | [R9]✔ |
| **발할라(전생)** | 2차 직업 Base 99/Job 50, 세이지 성에서 1,285,000z, 소지품·제니 0으로 비운 채 **'이미르의 책'을 읽으면** 무작위 포털 미로 → '이미르의 심장' → 발할라의 발키리 | "책을 읽으면 다른 세계로" — 조건이 의식(儀式)이 됨 | [R10]◇ |
| **신 아이템 봉인** | 서버에서 신 아이템이 하나 만들어져야 열리고, **100명이 완료하면 닫힘**. 50명이 완료해야 다음 봉인이 열림 | 서버 공동 진행 게이트 → 싱글에서는 '누적 처치 수 봉인'으로 번역 가능 | [R11]✔ |
| **오크 영웅 투구** | 오크 마을 집 안의 **움직이지 않는 오크 전사**가 젤로피 10,000개 → 증서 수천 장을 요구 | 숨은 NPC + 터무니없는 수량 = 전설이 됨(우리는 수량을 따라 하지 않는다) | [R12]◇ |
| **소문 문화 (2002)** | 게임메카 연재 "라그나로크의 7대 미스테리"(2002-08-23): 빵만 파는 선물 상인, 사라진 공간이동 직원, 모든 마을 창고 직원이 똑같은 이유… 유저가 **세계의 이상한 점에 소문을 붙여 놀았다** | 공식 콘텐츠가 아니라 '의심할 거리'가 신비를 만든다 | [R13]✔ |
| (한국 참고) **마비노기 던전** | 여신상 제단에 **아이템을 떨어뜨리면** 그 아이템 코드가 던전 구조·몬스터를 정한다. 같은 아이템이면 같은 던전, 통행증은 난이도·몬스터를 바꿈, **화요일**엔 요일 효과로 구조가 달라짐 | "무엇을 바칠까"가 곧 탐험. 요일 순환 | [K1]✔ |

### 1.1 RO 문법 — 우리가 가져갈 것

1. **열쇠는 대개 잡템과 대화다.** 특수 열쇠보다 "용의 비늘·젤로피를 바친다", "할아버지에게 묻는다"가 많다 → 우리 잡템에 두 번째 쓸모가 생긴다.
2. **조건이 세계관과 붙어 있다.** 용의 몸 → 용의 호수, 이미르의 책 → 발할라, 전직 연구원 → 연구소. 이유가 있으니 추론할 수 있다.
3. **우회로·실패 루트가 있다.** 번지점프 실패로 저승에 간다. 실험이 손해가 아니라 이야기가 된다.
4. **비밀은 익숙한 곳 바로 옆에 숨는다.** 여관 옆방, 빈민가 골목, 필드의 기둥.
5. **정보는 사람들 사이에서 퍼졌다.** 싱글에는 그 '사람들'이 없으니 **게임 안의 소문**이 대신해야 한다.

---

## 2. 탐험·신비 설계 원칙 12

**P1. 자물쇠를 먼저, 열쇠는 나중에.**
사례: Ron Gilbert는 "잠긴 문을 보기 전에 열쇠를 주는 것"을 거꾸로 된 퍼즐이라 불렀다 [D14]. 엘든 링의 임프 석상 안개문은 열쇠가 없어도 눈에 띈다 [D7]. 거북섬은 "어떻게 가요?"를 물어야 열린다 [R7].
왜 통하나: 목표가 먼저 생기면 그 뒤로 줍는 잡템마다 "혹시 이거?"가 된다.
우리: 봉인 맵(`hidden` 없음)은 🔮 핀으로 먼저 보여 준다. 숨은 맵도 소문을 들었다면 **이름 없는 흐린 '?' 핀**을 띄운다(지금은 `zoneKnown`이 false면 핀 자체가 없음).

**P2. 지식 열쇠와 물건 열쇠를 섞는다.**
사례: 아우터 와일즈는 능력 업그레이드 없이 **발견한 지식**으로 나아가고 [D1], 튜닉은 흩어진 설명서 페이지로 [D2], RO 움발라는 언어로 [R1]. 물건 열쇠: 다크 소울의 '기묘한 인형'은 지니고만 있으면 그림 속 세계로 데려간다 [D9], 어비스 레이크는 용의 몸 세 조각 [R6].
왜: 물건만이면 수집 목록, 지식만이면 방치형에선 쓸 사람이 자리에 없다.
우리: 지식 = **어디서·언제·누구와·무엇을 바칠지 고르는 일**. 처치 수·드롭은 방치가 채우고, 선택은 플레이어가 한다.

**P3. 단서는 아이템 설명 안에.**
사례: 다크 소울은 아이템 설명이 곧 이야기 본문이다 [D9]. 멜버 아이들은 던전을 처음 깨면 로어북을 주고, 로어 페이지에서 언제든 다시 읽게 한다 [I5]. 니플헤임의 "나무 끝의 보물" 로어 [R4].
왜: 줍는 순간이 읽는 순간이 된다. 방치 중에 쌓인 단서는 돌아왔을 때 '읽을거리'가 된다.

**P4. 반쪽씩 나눠 숨긴다.**
사례: 엘든 링 하리그트리 비밀 메달은 왼쪽(성 꼭대기)·오른쪽(NPC 퀘스트)을 합쳐야 거대 승강기가 움직여 세계의 큰 구역이 열린다 [D6]. 젤다 이상한 모자의 키노스톤 맞추기는 숨은 통로·상자를 드러낸다 [D11]. 레드 데드 리뎀션 2의 보물 지도는 지형 스케치뿐이라 풍경을 알아봐야 한다 [D12].
왜: 첫 조각은 질문, 두 번째 조각은 '딸깍'.

**P5. 소문은 세계 상태에 반응한다.**
사례: 쿠키 클리커 뉴스 티커는 **보유한 건물별 문장 풀**에서 뽑고, 할머니가 50명을 넘으면 '위협하는 할머니' 문장이 섞인다 [I1]. 모로윈드의 '최근 소문'은 화자가 있는 장소와 퀘스트 진행에 따라 다르다 [D15]. 시간의 오카리나 가십 스톤은 진실의 가면을 쓰면 힌트를 준다 [D10].
왜: "세계가 나를 알아본다"는 느낌 + 다음 목표를 은근히 가리킨다.
우리: 소문마다 `when: GateNeed[]`(기존 `needMet` 재사용).

**P6. 비밀에 층을 둔다.**
사례: 애니멀 웰은 ① 모두를 위한 층 ② 샛길을 찾는 사람의 층 ③ 커뮤니티 협력의 층으로 나눴다 [D4]. 튜닉은 필수 메커니즘은 읽을 수 있게, 부가 기술은 암호처럼 남겼다 [D2]. 쿠키 클리커 '그림자 업적'은 "불공정하거나 어려운 업적이라 우유(보너스)를 주지 않는다" [I1].
우리: L1 **봉인 맵**(체크리스트 공개) / L2 **숨은 맵**(소문·단서만) / L3 **비밀 보스·장난**(보상 작게, 몰라도 손해 없음).

**P7. 공정함 = 답이 게임 안에 두 번 적혀 있다.**
사례: Gilbert는 '임의 퍼즐'(시행착오로만 풀리는 것)을 금지하고 '의도에 보상하라'고 했다 [D14]. 반례: 렐름 그라인더 비밀 트로피는 조건이 거의 안 적혀 있는데 영구 보너스를 줘서 위키가 필수가 됐다 [I8]. 캔디 박스 2 리뷰 "위키 없이는 며칠 헤맨다" [I9]. AFK 아레나 '시간의 봉우리'는 층마다 공략 글이 따로 있다 [I11].
우리: 모든 조건은 **소문 / 단서 설명 / 체크리스트 / 점술가** 중 **두 곳 이상**에서 추론 가능해야 한다.

**P8. 실패와 우회도 발견이 된다.**
사례: 니플헤임은 번지점프 '실패'로도 간다 [R4][R5]. 어비스 레이크의 '먹기' 선택지 [R6]. 움발라 언어를 배우기 전에만 받는 이그드라실 잎 [R2].
우리: 엉뚱한 제물에도 반응 문장을 준다(손해는 없거나 아주 작게). "몰랐을 때만" 얻는 작은 기념품.

**P9. 발견 순간을 연출하고, 남긴다.**
사례: 젤다 야생의 숨결은 삼각형 지형이 너머를 가려 "저 뒤에 뭐가 있지?"를 만들고, 탑에 오르면 지도의 큰 구역이 드러난다 [D13]. 엘든 링 지도 조각 [D8]. RO MVP 묘비.
우리: 보라색 컷인(이미 `announce kind:'unlock'`) + 지도 핀이 떠오르는 애니메이션 + **탐험 일지 페이지가 채워짐**.

**P10. 지도는 '채워지는 것'이다.**
사례: 할로우 나이트는 지도 제작자에게 지역 지도를 사고, 깃펜이 있어야, 벤치에서 쉬어야 지도가 갱신된다 [D5]. 어 다크 룸은 안개 낀 세계 지도에서 랜드마크를 찾아 나간다 [I2].
왜: 빈칸 자체가 질문이다. 우리: 지방 단위 안개 + "탐사율 3/5".

**P11. 절제와 점진 공개.**
사례: 어 다크 룸은 한 줄의 문장과 버튼 하나로 시작해 마을·세계·반전 결말까지 단계적으로 펼친다 [I2]. 유니버설 페이퍼클립은 사업 → 연산 → 우주로 판이 커진다 [I3]. 쿠키 클리커의 'One mind' 업그레이드에는 "할머니들이 동요하고 있다. 부추기지 마라"라는 경고가 붙고, 사면 할머니 종말이 시작된다 [I1].
왜: **시스템 자체가 비밀**이 된다. 우리: '탐험 일지' 탭·점술가 NPC는 **첫 소문을 들은 순간** 처음 나타난다.

**P12. 조건에는 이유가 있어야 한다.**
사례: Gilbert의 '연결 없는 사건' 금지(관련 없는 일로 진행을 잠그지 마라) [D14]. 용의 몸 → 용의 호수 [R6], 전직 연구원 → 연구소 [R8].
왜: 이유가 있으면 추론할 수 있고(공정), 기억에 남는다. 우리: 망자의 서고 = 성수, 달 오솔길 = 밤과 늑대.

---

## 3. 방치형에서 신비를 유지하는 법

### 3.1 방치·증분 게임 사례

| 게임 | 신비 장치 | 방치와 맞물리는 지점 | 우리에게 |
|---|---|---|---|
| Cookie Clicker [I1]✔ | 상태 반응 뉴스 티커, 'One mind' 경고 → 할머니 종말, 그림자 업적(보너스 없음) | 자리를 비운 사이 바뀐 상태가 티커 문장으로 드러남 | 소문 엔진, 보상 없는 L3 장난 |
| A Dark Room [I2]✔ | 한 줄 시작, 단계적 해금, 안개 지도·랜드마크, 반전 결말 | 낯선 이의 방문 같은 사건이 '돌아와 보니' 일어나 있음 | 점진 공개, 지방 안개 |
| Universal Paperclips [I3]✔ | 단계마다 새 시스템, 숫자로 쓴 이야기 | 판이 바뀌는 순간 자체가 발견 | 2차 전직·새 지방에서 UI도 한 칸씩 열기 |
| Kittens Game [I10]◇ | "고양이 숲의 새끼고양이" 한 줄에서 자원·기술이 하나씩 드러남 | 정체 구간마다 새 축 | 절제된 시작 |
| Melvor Idle [I5]✔ | 슬레이어 구역은 **입장 장비 착용 + 지역 디버프**, 던전 첫 클리어 → **로어북**, Into the Mist 5회 → 펫·다음 구역 해금 | 조건이 전부 방치 진행으로 채워지고, 사람은 '준비'만 결정 | 조건 설계의 모범, 로어 보상 |
| Legends of Idleon [I6]✔ | **"수상한 덤불"에 땅콩을 떨어뜨리면** 생물이 나타나 비밀 직업 퀘스트 시작(땅콩 총 1,651개) | 바치는 재료는 방치로 모음 | '그 장소에 떨어뜨리기'. 단, 수량은 따라 하지 않음 |
| NGU Idle [I7]◇ | 숨은 아이템(열쇠 등)이 새 기능을 엶, 보스 대사 속 글자를 쳐야 나오는 숨은 보스 | 드롭이 곧 해금 | 단서 아이템 = 해금 |
| Antimatter Dimensions [I4]◇ | 비밀 업적(뉴스 티커 클릭 등) | 보상 거의 없음 → 강박 없음 | L3 장난 층 |
| Realm Grinder [I8]◇ | 비밀 트로피 조건 비공개 + **영구 보너스** | 위키 필수 → 반례 | 숨은 것에 파워 필수품 금지 |

### 3.2 자리를 비운 플레이어를 위한 규칙 8

1. **발견은 미뤄 두었다가, 돌아왔을 때 터뜨린다.** 오프라인 중 단서를 줍거나 조건이 차면 귀환 보고서 맨 위 **'수상한 일'** 칸에 먼저 보여 준다(Kongregate: 돌아올 때마다 축하의 순간 [I12]). 비밀 보스는 오프라인에서 처치 처리하지 않고 **귀환 후 1분 안 출현을 예약**한다 — 발견을 플레이어가 직접 본다.
2. **조건의 대부분은 방치로 차고, 손은 '결정' 한 번.** 처치·드롭·레벨은 자동, "어디서 사냥할지 / 무엇을 바칠지 / 누구를 데려갈지"만 플레이어 몫(멜버 슬레이어 구역 [I5]).
3. **시간 창은 넓게, 자주, 미리.** Gilbert: "실시간은 나쁜 드라마" [D14]. `hours`는 **최소 4~6시간**, 하루 1~2번. 순환형(마비노기 요일 [K1])은 "놓쳐도 다음 주기". 어비스 레이크의 30초 포털은 MMO 파티라 가능했던 것 — 우리는 금지.
4. **영원히 놓치는 것 금지.** Gilbert의 "주우라는 걸 깜빡했다" 규칙 [D14]. 방랑 포털·신기루는 다시 온다고 일지에 명시.
5. **진척은 보이게, 정체는 숨긴다.** 지금 `gateLines`가 만난 적 없는 몬스터 이름을 "???"로 두는 것이 정확히 이 패턴이다. 수량(212/300)은 공개, 이름·장소는 만난 뒤.
6. **빨간 점은 '할 일'에만.** "바칠 준비 완료"에만 점, 새 소문은 일지 안 '새' 표시만(이전 문서 [G12]).
7. **숨은 보상은 '옆으로'.** 대안 사냥터·외형·로어·카드 1종. 메인 성장 곡선의 필수품을 숨기지 않는다(렐름 그라인더 반례 [I8], 쿠키 클리커 그림자 업적 [I1]).
8. **안전망은 게임 안에서 판다.** 마을 점술가가 제니를 받고 3단 힌트(모호 → 구체 → 체크리스트 원문)를 준다. 위키를 여는 대신 게임 안에서 '사는' 힌트.

### 3.3 배치 밀도 (권장)

- **첫 비밀은 시작 60~90분 안**(햇살 평원): 예) 뿔토끼를 많이 잡으면 '토끼굴' 소문 → 작은 숨은 맵. 시스템을 가르치는 용도. 일지 탭도 이때 처음 나타남.
- **지방마다**: 봉인 맵 1(보이는 자물쇠) + 숨은 맵 0~1 + 비밀 보스 1 + 소문 6~8줄.
- **동시에 열려 있는 수수께끼는 2~3개**(Gilbert "선택지를 줘라" [D14]). 5개를 넘으면 목록 노동이 된다.

---

## 4. 우리 게임용 메커니즘 메뉴 (영향 ÷ 노력 순)

영향 ★★★ 큼 / ★★ 중 / ★ 작음 · 노력 S(하루 안) / M(며칠) / L(시스템 신설)

| # | 메커니즘 | 영향 | 노력 | 지금 모델로 되는 부분 | 새로 필요한 것 | 신비/좌절 메모 |
|---|---|---|---|---|---|---|
| 1 | **상태 반응 소문** (마을 소문판 + 필드 로그 `[소문]` + 지도 카드) | ★★★ | S | `needMet()` 재사용, `log('[소문] …')` 채널 있음 | `src/game/data/rumors.ts` `{id, who, text, when?: GateNeed[], points?: zoneId}`, `s.rumorsHeard`, `TownPanel` 카드 | 하루 새 소문 1~3개, 같은 말 반복은 OK(술집 감성) |
| 2 | **단서 아이템 + 로어 설명** | ★★★ | S | `gate.clue` 첫 획득 → 발견, `rarity` 잡템은 자동 판매 제외(`offline.ts`) | `items.ts`에 단서 6~10종(`kind:'etc', rarity:'rare'`), 드롭 줄, `OfflineReport.clues` | 설명 2~3문장, 6장 규칙 |
| 3 | **탐험 일지 (빈 페이지)** | ★★★ | S~M | `s.discovered`, `s.book`, `tutorial` 플래그 | `s.journal: Record<entryId, number>`, 일지 탭(첫 소문 때 등장), "발견 7/24", `ZoneGate.lore?: string[]` | 빈 페이지는 "??? (속삭이는 숲)"처럼 지방만 공개 |
| 4 | **반쪽 단서 맞추기** | ★★ | S | `need`에 item 두 줄 | `COMBINES: {a, b, out}[]` — 둘 다 모이면 자동 합성 + 효과음 | 반쪽은 서로 다른 몬스터에게 |
| 5 | **밤길 다듬기** | ★★ | S | `hours`, `canEnter`, 새벽 자동 퇴장(`gateTick`) | ① **오프라인 분할**(창 안 시간만 그 맵, 나머지는 `unlockBy` 맵) ② 창 ≥ 4h ③ '달빛 등불'(1시간 창 연장 소모품) ④ 남은 시간 표시 | 밤에 못 오는 사람 배려 |
| 6 | **점술가 3단 힌트** | ★★ | S | `gateLines()` 문장 재사용 | `s.hintTier[zoneId]`, 마을 NPC 카드, 단계별 제니 | 위키 대체 안전망 |
| 7 | **동행·장비 조건** | ★★ | S | `job` tier | `GateNeed` `party`·`equip` (아래 코드) | 3인 파티 정체성과 결합("기도할 줄 아는 동료") |
| 8 | **수집 문** (도감·카드) | ★★ | S | `card` 단건, `book` | `GateNeed` `cards`·`seen` | 카드 운 의존 → n은 1~2, 처치 수 대안 병기 |
| 9 | **조건부 비밀 보스** | ★★★ | M | 보스 소환·`announce`·드롭 | `ZoneDef.secrets?: {mob, need, chancePerMin, text}[]`, `spawnTick` 판정, 오프라인은 '기척' 예약 | 출현 조건은 소문·몹 설명에 반쯤만 |
| 10 | **방랑 포털·신기루 이벤트** | ★★★ | M | 희귀 출현(이전 문서 #2)과 같은 타이머 구조 | `s.events: {id, zone, until}[]`, `GateNeed` `event`, 필드 오브젝트, 오프라인 포아송 → 단서 지급 | "다시 온다"를 명시 |
| 11 | **월드맵 안개 + 소문 핀** | ★★ | M | `zoneKnown`, 핀 클래스 `secret`/`sealed` | 핀 4단계(미지 → 소문 → 발견 → 개방), `drawWorldMap` 지방 안개, 지방 탐사율 | 소문 핀은 위치만 대략(흐린 원) |
| 12 | **고대 문자 해독** (지식 게이트) | ★★ | M | — | `s.flags`, `GateNeed` `flag`, 텍스트의 `〔…〕` 구간을 해독 전엔 뒤섞인 기호로 렌더 | 해독 뒤 옛 단서를 다시 읽는 '아하'(튜닉 [D2], 움발라 [R1]) |
| 13 | **제물 선택·실패 반응** | ★ | S | `openGate`의 consume | 제단에서 '다른 것 바치기' → 반응 문장 표, "몰랐을 때만" 작은 기념품 | 손해 없음 또는 아주 작게 |
| 14 | **요일·계절** | ★ | S | `hours` 패턴 | `GateNeed` `weekday` | 주 1회 이상 열리게, 남용 금지 |
| 15 | 날씨 | ★ | L | — | 날씨 상태·연출·오프라인 반영 | **보류**. 대신 2시간 단위 '지방 분위기'(안개 낀 숲)를 #10 이벤트로 |

### 4.1 신규 `GateNeed` 제안 (모두 `needMet`·`gateLines`에 case 1개씩)

```ts
  /** 동행: 이 직업(또는 그 상위 직업) 영웅이 파티에 있다 — 체크리스트엔 "기도할 줄 아는 동료"처럼 */
  | { kind: 'party'; cls: ClassId[]; label?: string }
  /** 누군가 이 장비를 착용 중 (움발라의 '가면을 쓰고 가기') */
  | { kind: 'equip'; id: string }
  /** 이 몬스터들 중 n종의 카드를 찾았다 / n종을 만났다(도감) */
  | { kind: 'cards'; mobs: string[]; n: number }
  | { kind: 'seen'; mobs: string[]; n: number }
  /** 이야기 플래그: 해독, NPC 대화, 책 읽기 — s.flags[id] */
  | { kind: 'flag'; id: string }
  /** 방랑 이벤트가 그 맵에 떠 있는 동안만 — s.events */
  | { kind: 'event'; id: string }
  /** 그 맵에 누적 N분 머묾 ("오래 머무는 자에게만 보인다") — 맵별 체류 시간 누적 필요(이전 문서 #6 zoneStats) */
  | { kind: 'stay'; zone: string; min: number }
  /** 요일 (0 = 일요일) */
  | { kind: 'weekday'; days: number[] };
```
`ZoneDef`에는 `secrets?`(비밀 보스), `ZoneGate`에는 `lore?: string[]`(일지 페이지 본문)만 추가하면 된다.

### 4.2 현재 구현에서 손볼 점

- **오프라인 × 밤길**: `applyOffline`은 `s.zone`만 본다 → 새벽 2시에 밤길 맵에서 접속을 끊으면 12시간 내내 그 맵에서 사냥된다. 창 안 시간만 그 맵, 나머지는 `unlockBy` 맵(또는 마을)으로 나눠 계산.
- **오프라인 중 발견**: `gateTick`은 접속 후 3초 안에 처리하므로 기능상 문제는 없지만, 연출이 귀환 모달 뒤로 묻힌다 → `applyOffline` 전후로 `gateDiscoverable`/`gateReady`를 비교해 `OfflineReport.discoveries`에 담고 귀환 모달 첫 칸에 표시.
- **`need` 순서가 설계 도구**: `gateDiscoverable`은 "단서 아이템 또는 hours가 아닌 첫 조건"이 채워지면 맵을 드러낸다. 즉 **첫 줄 = 발견 트리거**. 데이터 작성 규칙으로 주석에 명시.
- **발견 문장**: 지금은 모든 숨은 맵이 같은 "어딘가에 숨겨진 길이 있다는 소문…"을 띄운다 → `gate.hint`의 짧은 버전(`gate.whisper?`)을 쓰면 장소마다 첫인상이 달라진다.
- **체크리스트 점진 공개**: 지금은 발견 즉시 모든 줄이 보인다. L2 숨은 맵은 "채워진 줄 + 다음 1줄"만 보여 주고 나머지는 "· · ·"로 두면 추론할 거리가 남는다.

---

## 5. 예시 비밀 장소 3개 (원작 느낌, 오리지널 이름)

### 5.1 달그림자 오솔길 — 속삭이는 숲 · 밤 · Lv 26~34
**장치**: 소문 → 로어 단서 → 숨은 맵(`hidden`) → 시간 창(`hours`)
- **소문** (숲 개방 후 마을 소문판, 화자 '나무꾼'): "밤이 되면 숲의 늑대들이 한쪽으로만 운다더군. 달이 높을 때 말이야."
- **단서** `q_moonfur` '달빛 묻은 늑대털' (회색 늑대 0.4%, 은빛 늑대왕 25%): "달빛을 받으면 희미하게 북쪽을 가리킨다. 늑대왕이 지키던 길은 하나가 아니었다."
- **조건**
```ts
gate: { hidden: true, clue: 'q_moonfur',
  hint: '늑대 울음이 그치는 곳, 달이 높을 때만 길이 보인다고 한다.',
  need: [ { kind: 'boss', mob: 'silverfang' }, { kind: 'kills', mob: 'wolf', n: 300 },
          { kind: 'hours', from: 20, to: 2 } ],
  openText: '늑대털이 은빛으로 타오르더니, 나무 사이로 좁은 길이 드러났다.' }
```
- **발견 순간**: 털을 줍는 순간 지도에 흐린 달 핀 + `[소문]` 로그. 조건이 다 찬 뒤 20시 이후 숲에 있으면 "늑대 울음이 한 방향으로 모인다…" → 3초 뒤 보라색 컷인 → 일지 페이지 "달그림자 오솔길" 채워짐.
- **보상**: 밤 전용 맵(달빛 늑대·달꽃 만드라 = 팔레트 변형), 희귀 변종 '그림자 여우'(카드: 밤에 FLEE+), 모자 재료 '달빛 갈기'.
- **방치 처리**: 창 6시간(20~2시). 오프라인은 창 안 시간만 이 맵. 밤에 못 오는 사람용 '달빛 등불'(늑대털 5 + 제니, 낮에 1시간 길을 붙잡음).
- **안전망(점술가)**: 1단 "숲, 그리고 밤." → 2단 "늑대왕을 이긴 자가 달 아래 숲을 걷거라." → 3단 체크리스트 원문.

### 5.2 묘지기의 서고 — 망자의 동굴 아래 · 던전 · Lv 40~48
**장치**: 반쪽 단서 → 합성 → 제물(`consume`) → 동행 조건(신규 `party`) → 로어 보상
- **소문** (화자 '술 취한 성직자'): "동굴 해골들이 누군가의 이름을 부른다더라. 성수 냄새는 질색하면서 말이지."
- **단서**: `q_note_a` '찢어진 수첩 (앞장)' (해골 0.3%) — "셋째 횃불 아래 문. 열쇠는 뼈 기사가 쥐고 있다." / `q_note_b` '찢어진 수첩 (뒷장)' (해골 궁수 0.3%) — "이름들이 잠들려면 성수 세 병, 그리고 기도할 줄 아는 자." → 둘 다 모이면 자동 합성 `q_keeper_note` '묘지기의 수첩'.
- **조건**
```ts
gate: { hidden: true, clue: 'q_keeper_note',
  hint: '해골들이 부르는 이름이 적힌 책이 동굴 아래 어딘가 잠들어 있다.',
  need: [ { kind: 'item', id: 'q_keeper_note', qty: 1 }, { kind: 'boss', mob: 'boneknight' },
          { kind: 'item', id: 'u_holywater', qty: 3, consume: true },
          { kind: 'party', cls: ['acolyte', 'priest'], label: '기도할 줄 아는 동료' } ],
  openText: '성수가 바닥 틈으로 스며들자 벽에 새겨진 이름들이 하나씩 꺼졌다. 아래로 이어진 계단이 보인다.',
  lore: ['수첩 1쪽…', '수첩 2쪽…', '수첩 3쪽…'] }
```
- **발견 순간**: 반쪽이 맞춰질 때 종이 맞추는 효과음 + "두 장이 꼭 맞는다." 바치기 버튼 → 컷인 → 계단.
- **보상**: `kind:'dungeon'` 어두운 `tint` 맵. 로어 3쪽(묘지기가 왜 이름을 새겼는지). 고유 카드(유령 묘지기). 이전 문서 #11 '동굴 다층화'의 **숨은 층**으로 쓰기 좋다.
- **방치 처리**: 반쪽은 오프라인에서도 드롭 → 귀환 보고 맨 위 "찢어진 종이를 주웠다 (앞장)". 성수는 마을 상점 소모품(신규).
- **실패 반응**: 성수 대신 유령 천을 바치면 "천이 바람도 없이 펄럭이다 잠잠해졌다." (소모 없음)

### 5.3 거꾸로 선 오아시스 — 작열하는 사막 · Lv 55~64
**장치**: 방랑 이벤트(신기루) → 단서 누적 → 제물 + 수집 문(`cards`) → 비밀 보스
- **소문** (화자 '낙타 상인'): "모래폭풍이 지나간 뒤엔 가끔 하늘에 물가가 비친다더라. 다가가면 사라지지."
- **이벤트**: 사막에서 40~90분마다 '신기루'가 10분간 뜬다(필드에 아지랑이). 그동안 사냥하면 `q_mirage_sand` '신기루 모래' 1줌. 오프라인은 기대값 × 0.6 포아송 → 귀환 보고 "자리를 비운 사이 신기루를 2번 보았다."
- **단서 설명**: "손바닥 위에서 물처럼 흐른다. 다섯 줌이면 무언가 비칠 것 같다."
- **조건**
```ts
gate: { hidden: true, clue: 'q_mirage_sand',
  hint: '모래가 물처럼 흐르는 날, 거꾸로 비친 물가가 나타난다고 한다.',
  need: [ { kind: 'item', id: 'q_mirage_sand', qty: 5, consume: true },
          { kind: 'cards', mobs: ['sandjelly', 'scorpion', 'jackal', 'mummy', 'sandgolem'], n: 1 },
          { kind: 'level', lv: 55 } ],
  openText: '모래를 흩뿌리자 하늘의 물가가 뒤집혀 땅에 내려앉았다.' }
```
- **비밀 보스**: 오아시스에서 12~14시, 파티 전원 생존 중 분당 2% → '그림자 없는 자'. 소문은 반만 말한다: "한낮인데 그림자가 하나 모자란 날이 있대."
- **보상**: 사막 한가운데 **물속성 몬스터** 맵(속성 숙제 반전 — 바람 무기를 챙겨 와야 함), 장신구 [1] 드롭, 보스 카드.
- **안전망**: 일지에 "신기루 목격 3회 — 다시 올 것이다". 카드 조건은 5종 중 1장(운 부담 최소).

---

## 6. 힌트 문장 작성 가이드

### 6.1 힌트 사다리 — 같은 비밀을 네 번, 점점 또렷하게

| 단계 | 어디서 | 얼마나 말하나 | 예 (달그림자 오솔길) |
|---|---|---|---|
| 소문 | 소문판·필드 로그·지도 카드 | 장소 + 분위기, 조건 0~1개 | "밤이 되면 숲의 늑대들이 한쪽으로만 운다더군." |
| 단서 설명 | 아이템 설명·일지 | 조건 1~2개를 이야기 말로 | "달빛을 받으면 북쪽을 가리킨다. 늑대왕이 지키던 길은 하나가 아니었다." |
| 체크리스트 | 지도 카드(`gateLines`) | 정확한 수치, 못 만난 이름은 ??? | "은빛 늑대왕 처치 ✓ · 회색 늑대 212/300 · 오후 8시 ~ 오전 2시에만 열림" |
| 점술가 | 마을(유료) | 막혔을 때 사는 답 | "늑대왕을 이긴 자가 달 아래 숲을 걷거라." |

### 6.2 규칙 8

1. **'어디 / 무엇이 이상한가 / 무엇을 해 볼까' 중 두 개만.** 셋 다 말하면 지시문, 하나면 그냥 분위기.
2. **게임 안에 있는 명사를 쓴다**(맵 이름, 몬스터 특징). 만나지 않은 몬스터는 이름 대신 특징: "은빛 갈기의 늑대 대장".
3. **숫자·시각은 감각어로**: "달이 높을 때"(≈20~2시), "수백 마리". 정확한 값은 체크리스트 몫.
4. **전언체로 화자를 세운다**: "~라더라", "~다고 하던데", "~였지". 화자가 곧 신뢰도다 — 상인(정확), 술꾼(과장), 꼬마(엉뚱하지만 핵심 하나), 고서(옛말, 정확).
5. **핵심은 거짓말하지 않는다.** 헛소문은 '허풍선이' 화자에게만 주고, 일지에 "확인되지 않은 소문"으로 표시.
6. **조건과 세계의 이유를 묶는다**: 망자 → 성수, 늑대 → 달, 신기루 → 모래. 이유가 곧 힌트다.
7. **모바일 한 줄 30~40자, 두 문장 이내.** 말줄임표는 소문 하나에 한 번까지.
8. **'모르는 사람' 테스트**: 맵 목록만 보고 3분 안에 후보를 1~2곳으로 좁힐 수 있나? 0곳이면 너무 어렵고, 정답이 바로 나오면 소문이 아니라 단서 단계로 옮긴다.

### 6.3 나쁜 예 → 고친 예

| 나쁜 예 | 문제 | 고친 예 |
|---|---|---|
| "숨겨진 장소가 있다." | 정보 0 | "동굴 해골들이 누군가의 이름을 부른다더라." |
| "회색 늑대 300마리를 잡고 밤 8시에 숲에 가라." | 지시문, 발견의 기쁨 0 | "밤이 되면 숲의 늑대들이 한쪽으로만 운다더군." |
| "고대의 힘이 깨어날 때 운명의 문이 열린다." | 게임 명사가 없어 추론 불가 | "모래가 물처럼 흐르는 날, 거꾸로 비친 물가가 나타난다고 한다." |
| "LUK 77인 자만이 볼 수 있다." | 숨은 수치 = 위키 의존 | "운이 지독히 좋은 자에게만 보인다더라." + 체크리스트에 수치 |
| "정오에 셋 다 살아 있으면 보스가 나온다." | 비밀 보스 조건을 소문에서 다 말함 | "한낮인데 그림자가 하나 모자란 날이 있대." |

### 6.4 화자 풀 (소문판용)

나무꾼 · 낙타 상인 · 술 취한 성직자 · 견습 기사 · 꼬마 · 창고지기 · 은퇴한 모험가 · 고서(古書) 한 구절. 템플릿: **"[화자] {장소}의 {존재}가 {이상한 행동}한다더라. {감각적 때}에 말이야."**

---

## 7. 정리 — 먼저 할 것

1. **#1 소문 + #2 단서 아이템 + #3 일지**를 한 묶음으로(S×3): `ZoneGate`가 이미 있어 데이터만 쓰면 바로 "신비"가 체감된다.
2. 첫 콘텐츠로 **5.1 달그림자 오솔길**(기존 `GateNeed`만으로 가능) + 평원의 작은 튜토리얼 비밀 1개.
3. **#5 밤길 오프라인 분할**은 버그성 이점 방지라 함께 처리.
4. 그다음 #4 반쪽 단서·#7 동행 조건으로 **5.2 묘지기의 서고**, 이어서 #9·#10으로 **5.3 거꾸로 선 오아시스**.

---

## 8. Sources

**RO 원작**
- [R1] ✔ iRO Wiki — Umbala (원주민은 "모험가가 할 줄 모르는 우탄어"로 말함, 언어 퀘스트): https://irowiki.org/wiki/Umbala
- [R2] ✔ iRO Wiki — Domestic Dispute (언어를 배우면 이그드라실 잎/열매를 더 못 받음): https://irowiki.org/wiki/Domestic_Dispute
- [R3] ◇ Umbala quests guide (가면·기름종이·오징어 먹물 등 재료, 검색 요약만 확인): https://www.tapatalk.com/groups/ilounge/umbala-quests-guide-t9.html
- [R4] ✔ iRO Wiki (classic) — Nifflheim (경로, 번지점프, 보물 소문 로어, 마을 사망 시 EXP 손실): https://irowiki.org/classic/Nifflheim
- [R5] ✔ 나무위키 — 니플헤임 (위그드라실 경유 또는 움발라 번지점프 실패): https://namu.wiki/w/%EB%8B%88%ED%94%8C%ED%97%A4%EC%9E%84
- [R6] ✔ iRO Wiki (classic) — Abyss Lake Entrance Guide (용의 송곳니·비늘·꼬리, 30초 포털, '먹기' 선택지): https://irowiki.org/classic/Abyss_Lake_Entrance_Guide
- [R7] ✔ iRO Wiki (classic) — Turtle Island Entrance Quest: https://irowiki.org/classic/Turtle_Island_Entrance_Quest
- [R8] ✔ iRO Wiki (classic) — Biolabs Entrance Quest: https://irowiki.org/classic/Biolabs_Entrance_Quest
- [R9] ✔ iRO Wiki (classic) — Thanatos Tower Quest: https://irowiki.org/classic/Thanatos_Tower_Quest
- [R10] ◇ iRO Wiki — Rebirth Walkthrough (검색 요약): https://irowiki.org/wiki/Rebirth_Walkthrough
- [R11] ✔ iRO Wiki — Seal of Sleipnir (서버 공동 봉인, 100명 완료 시 닫힘): https://irowiki.org/wiki/Seal_of_Sleipnir
- [R12] ◇ iRO Wiki — Headgear Quests (오크 영웅 투구, 검색 요약): https://irowiki.org/wiki/Headgear_Quests
- [R13] ✔ 게임메카 — 온라인 기행 21화 "라그나로크의 7대 미스테리" (2002-08-23): https://www.gamemeca.com/view.php?gid=125647

**한국 게임**
- [K1] ✔ 나무위키 — 마비노기/던전 (제단에 아이템을 떨어뜨려 입장, 통행증, 화요일 요일 효과): https://namu.wiki/w/%EB%A7%88%EB%B9%84%EB%85%B8%EA%B8%B0/%EB%8D%98%EC%A0%84

**싱글 게임 설계**
- [D1] ✔ GDC 2020 "Curiosity-Driven Exploration: The Design of Outer Wilds" (Alex Beachum, Loan Verneau): https://gdconf.com/article/attend-gdc-and-learn-how-outer-wilds-nailed-curiosity-driven-game-design/ · ◇ 우주선 로그 '소문 모드' 설명은 검색 요약
- [D2] ✔ Game Developer — How TUNIC weaves wondrous worlds inspired by inscrutable NES manuals: https://www.gamedeveloper.com/road-to-igf-2023/how-tunic-weaves-wondrous-unknowable-worlds-inspired-by-inscrutable-nes-manuals · ◇ Wireframe "Tunic and the art of keeping a secret": https://wireframe.raspberrypi.com/articles/wireframe-cover-star-tunic-and-the-art-of-keeping-a-secret
- [D3] ◇ (D2 보조) Red Bull — Tunic 개발자 인터뷰: https://www.redbull.com/int-en/tunic-video-game-developer-interview
- [D4] ◇ Animal Well 비밀 3층 구조 (Billy Basso): https://www.gamefile.news/p/indie-developer-has-a-plan-to-keep , https://www.nintendolife.com/features/best-of-2024-i-avoided-almost-all-the-existing-tropes-peeling-back-the-layers-of-animal-well
- [D5] ◇ Hollow Knight Wiki — Map and Quill (지도 구매, 깃펜, 벤치에서 갱신): https://hollowknight.wiki/w/Map_and_Quill_(Hollow_Knight)
- [D6] ◇ Elden Ring — Haligtree Secret Medallion: https://eldenring.wiki.fextralife.com/Haligtree+Secret+Medallion
- [D7] ◇ Elden Ring — Stonesword Key (임프 석상 안개문, 1회용): https://www.ggrecon.com/guides/elden-ring-stonesword-key/
- [D8] ◇ Elden Ring — Map Fragments: https://www.windowscentral.com/elden-ring-all-map-fragment-locations
- [D9] ◇ Dark Souls — Peculiar Doll / Painted World: https://gamesradar.com/dark-souls-walkthrough/20 , https://giantbomb.com/wiki/Characters/Crossbreed_Priscilla
- [D10] ◇ Zelda Wiki — Mask of Truth / Gossip Stones: https://zeldawiki.wiki/wiki/Mask_of_Truth
- [D11] ◇ Zelda Wiki — Kinstone Fusion: https://zeldawiki.wiki/wiki/Kinstone_Fusion
- [D12] ◇ RDR2 보물 지도(지형 스케치): https://guides4gamers.com/red-dead-redemption-2/pois/treasures/
- [D13] ◇ 80.lv — The Design Secrets of Breath of the Wild (GDC 2017, 삼각형 법칙·탑): https://80.lv/articles/the-design-secrets-of-breath-of-the-wild/
- [D14] ✔ Ron Gilbert — Why Adventure Games Suck (1989): https://grumpygamer.com/why_adventure_games_suck/
- [D15] ◇ UESP — Morrowind: Generic Dialogue L ("Latest Rumors"가 장소·퀘스트에 따라 달라짐): https://en.uesp.net/wiki/Morrowind:Generic_Dialogue_L
- [D16] ◇ 참고: 지식 게이트 정의 — Thinky Games "Metroidbrainia": https://thinkygames.com/features/metroidbrainia-an-in-depth-exploration-of-knowledge-gated-games/ , "Against Metroidbrainia": https://azhdarchid.bearblog.dev/against-metroidbrainia-a-landscape-of-knowledge-games/

**방치·증분 게임**
- [I1] ✔ Cookie Clicker 소스 `main.js` (뉴스 티커: 보유 건물별 문장, 할머니 50+ '위협' 문장 / 'One mind' 경고와 `elderWrath` 시작 / 그림자 업적 "unfair or difficult… do not give milk"): https://orteil.dashnet.org/cookieclicker/main.js
- [I2] ✔ Wikipedia — A Dark Room: https://en.wikipedia.org/wiki/A_Dark_Room
- [I3] ✔ IF50 — 2017: Universal Paperclips: https://if50.substack.com/p/2017-universal-paperclips
- [I4] ◇ Antimatter Dimensions 비밀 업적 가이드: https://gameplay.tips/guides/antimatter-dimensions-secret-achievement-guide.html
- [I5] ✔ Melvor Idle Wiki (API로 원문) — Slayer Areas(입장 장비·지역 효과), Lore(던전 클리어 시 로어북), Into the Mist(5회 → 펫·다음 구역), Impending Darkness Event: https://wiki.melvoridle.com/w/Slayer_Areas , https://wiki.melvoridle.com/w/Lore , https://wiki.melvoridle.com/w/Into_the_Mist , https://wiki.melvoridle.com/w/Impending_Darkness_Event
- [I6] ✔ IdleOn Wiki (API로 원문) — Secrets (수상한 덤불·땅콩·비밀 직업 Journeyman): https://idleon.wiki/wiki/Secrets
- [I7] ◇ NGU Idle 숨은 아이템·숨은 보스 (검색 요약, 커뮤니티 위키)
- [I8] ◇ Realm Grinder 비밀 트로피: https://gamertweak.com/secret-trophies-realm-grinder/ , https://www.pcgamer.com/realm-grinder-guide/
- [I9] ◇ Candy Box 2 리뷰("위키 없으면 막힘"): https://setsideb.com/?p=5808
- [I10] ◇ Kittens Game: https://thenextweb.com/news/i-can-haz-resources , https://metafilter.com/142228/The-incremental-to-surpass-all-incrementals
- [I11] ◇ AFK Arena Peaks of Time 공략들: https://afk.guide/secrets-of-the-forest-map/
- [I12] ◇ GDC 2015 Anthony Pecorella "Idle Games: The Mechanics and Monetization of Self-Playing Games": https://gdcvault.com/play/1022065/Idle-Games-The-Mechanics-and · 요약: https://www.gamedeveloper.com/design/the-rise-of-games-you-mostly-don-t-play
- 이전 문서 참조: `docs/research/RO_IDLE_RESEARCH.md` [G12](빨간 점), 5장 #2 희귀 변종·#6 맵별 실측(zoneStats)·#11 던전 다층화

> 미확인 메모: 원작 RO의 낮/밤 시스템, 루티(장난감 공장)의 초기 이벤트 한정 개방 여부, 시계탑 열쇠 아이템의 정확한 용도는 이번 조사에서 원문을 찾지 못해 본문에서 뺐다.
