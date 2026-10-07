# RO 원작 감성 × 방치형 장르 리서치 — 미니 미드가르 v0.3 방향

> 작성 2026-10-07 · 대상 코드 v0.2 (`a6c3586`) · 원칙: **둘이 충돌하면 RO 원작 느낌이 이긴다.**
> 출처 표기: `[S#]` = 7장 Sources 번호. ✔ = 이번 조사에서 원문 확인, ◇ = 널리 알려진 사실이지만 이번에 원문 재확인 못 함(구현 전 재확인 권장).

---

## 0. 한 줄 요약

RO의 재미는 "**어느 맵에서 무엇을 잡아 무엇을 얻을지 내가 고른다**"는 데 있다. 지금 미니 미드가르는 전투·상성·외형은 RO답지만, **맵이 레벨 사다리 1줄**이고 **잡템의 쓸모가 판매뿐**이며 **희귀 출현·장신구 사냥** 같은 "찾아가는 맛"이 비어 있다. 방치형 장르에서는 *오프라인 귀환 순간, 일일 목표, 루팅 필터, 수집 단계* 같은 **세션 설계**만 빌리고, 전투력 숫자·가챠·스테이지 번호식 진행은 빌리지 않는다.

---

## 1. RO 원작 핵심 재미 요소

### 1.1 맵 — "지역 = 필드 여러 장 + 던전 여러 층"

- **구조** ◇: 한 도시 주변에 필드가 10여 장(예: 수도 주변 필드 00~11번), 근처에 던전이 3~5층(예: 숲 마을 동굴 1~5층). 같은 레벨대에 **대안 맵이 2~3개**씩 있어서 "오늘은 저기"를 고를 수 있었다.
- **MVP는 던전 최하층/특정 필드에 산다** ✔: 예) 숲 마을 동굴 **5층**의 여우 MVP, 사막 피라미드 **지하 2층**의 미라 왕, 하수도 **4층**의 황금 벌레 MVP. 리스폰은 처치 후 고정 시간(1~12시간) **+ 0~10분 변동**, 죽으면 **묘비**에 처치 시각과 MVP 획득자 이름이 남는다 [S2].
- **미니보스** ✔: MVP가 아닌 보스 판정 몬스터가 **10분~2시간 주기로 소수 스폰**(천사/악마/유령 변종 말랑 계열, 각종 정예). 맵을 도는 동안 "**어? 떴다!**" 하는 순간을 만든다 [S1].
- **맵마다 '가는 이유'가 다르다** ◇: 경험치 맵(밀도 높고 잡기 쉬움) / 돈 맵(비싼 잡템·장비 드랍) / 광석 맵(정련석 원석) / 카드·퀘템 맵(특정 몬스터 카드, 모자 재료). 같은 레벨이어도 목적에 따라 갈린다.
- **선공/비선공 비율**이 맵 난이도를 정한다 ◇: 초반 필드는 대부분 비선공, 던전 깊이 갈수록 선공·무리(몹 몰이) 위험이 커진다.
- **분위기**: 맵마다 BGM·배경이 달라 "그 맵의 기억"이 남는다(한국 커뮤니티 추억글 단골 소재) ◇.

### 1.2 루팅 문화 — 드랍 테이블과 잡템

- **드랍 표**: 몹당 약 8칸 + 카드 1칸 ◇. 잡템(흔함) → 소비템 → 장비(드묾) → 카드(0.01%) 계단.
- **잡템은 판매만이 아니다** ✔: 1차 전직 시험부터 잡템을 요구한다 — 마법사 전직은 젤리·솜털·우유 조합으로 "용액" 제출, 궁수 전직은 나무 종류별 점수 25점 채우기 [S4][S5]. 모자 퀘스트도 잡템 수십~수백 개 + 희귀 재료 1~2개 구조 ◇. → **"이 잡템 필요해서 저 맵 간다"**는 동기가 생긴다.
- **슬롯 장비** ◇: 같은 이름이 무슬롯/슬롯 두 버전으로 존재(예: 나이프[3], 방패단검[4] 계열). 슬롯 버전 드랍이 곧 "득템".
- **정련석** ◇: 무기 레벨별 정련석(1→하급, 2→중급, 3·4→상급)과 방어구용 정련석, **원석 5개 → 정제 1개**. 원석을 주는 특정 몬스터 맵이 "광석 맵"이 됨.
- **득템 연출** ◇: 카드 줍는 순간의 효과, 파티원·길드 채팅의 "ㅊㅋ", 노점 시세 확인. 싱글에서도 **방송·기록**으로 일부 재현 가능.

### 1.3 카드 — 엔드게임 사냥감

- **0.01% 드랍**, MVP 카드는 그보다 낮음 ◇. 카드 1장이 장비보다 비싸다.
- **효과 유형** ◇ (구조만 참고, 이름은 쓰지 않음):
  - 무기: 특정 **종족/크기/속성에 +20%** (인간형 +20%가 대표), ATK 고정치, 상태이상 부여, 공속 +%.
  - 갑옷: 최대 HP, STR+ATK, **갑옷 속성 변경**(불·물·땅·바람·염 — 맵별로 갈아 끼움).
  - 방패: 특정 종족 피해 −30% 계열.
  - 걸치기: 무속성 −50%/다른 속성 +50% 같은 **트레이드오프** 카드.
  - 장신구: STR/DEX/AGI +2~3, **시전 끊김 방지**, **스킬 부여(텔레포트 Lv1, 힐 Lv1, 하이딩)**.
- **카드 = 빌드 정체성**: "슬롯 4개 무기에 같은 종족 카드 4장" 같은 꿈이 장기 목표. 카드 콤보(세트)는 원작 후기 패치에 추가된 요소 ◇.
- **이름 접두/접미어**: 카드를 꽂으면 장비 이름이 바뀐다 — 미니 미드가르는 이미 구현("행운의 +7 나이프 [3]").

### 1.4 장신구·머리 장비 — "찾아가는 맛"

- **장신구 7종 계열**(클립·로자리·장갑·반지·귀걸이·브로치·목걸이)이 **무슬롯 vs [1]** 두 버전 ◇. [1]이 귀해서 "그 장신구 드랍하는 몬스터"를 찾아 사냥.
- **장신구 전용 카드**가 스탯 +2~3·스킬 부여 → 장신구 두 칸이 **빌드 마무리** 역할 ◇.
- **머리 장비**: 상/중/하단 3칸 + 외형 표시 → 캐릭터 정체성. **모자 퀘스트**(잡템 조합)로 얻는 모자가 "고생의 증거"이자 자랑거리 ◇.

### 1.5 경제

- NPC 고정 판매가(상인 할인·바가지 스킬) + **플레이어 노점**(수도 거리 노점가) ◇.
- 최대 제니 소모처 = **정련**(실패 시 장비 소멸) ◇. 싱글이면 "노점"은 **NPC 노점으로 모사**하는 게 현실적.

### 1.6 직업 정체성·파티

- 직업마다 **상징 스킬 1~2개**가 플레이를 정의(기사 회전 강타, 위저드 폭풍한설, 헌터 매, 프리스트 힐·부활, 어새신 음속 연격, 블랙스미스 아드레날린) — 미니 미드가르 이미 반영.
- **파티 동기** ◇: 경험치 균등분배(레벨차 제한), 프리스트 버프, 탱커가 몹 몰이 → 던전 깊은 층·MVP는 파티 필수.
- 싱글 모사 포인트: **역할 분담 AI**와 **작전 지시**(3장).

### 1.7 빌드 연구 문화

- 스탯 빌드 이름이 곧 정체성 ◇: AGI 기사/VIT 기사, 크리 어새신(카타르 크리 2배), INT·DEX 위저드, 풀서포트/배틀 프리스트, 매 헌터(LUK·INT).
- **속성 스위칭** ◇: 불사 던전엔 성/불 무기, 물 몬스터엔 바람 무기, 맵에 맞춰 갑옷 속성 카드 교체.
- 커뮤니티 DB(드랍률·몬스터 속성 표)·스탯 계산기를 보며 연구 → 게임 안에서 **정보를 점진 공개**하면 그 맛을 재현할 수 있다.

### 1.8 RO 감성 설계 원칙 (싱글·방치형으로 옮길 때)

1. **맵 선택은 목적 선택**이어야 한다(EXP / 제니 / 광석 / 카드 / 재료).
2. 같은 레벨대에 **최소 2개 맵**.
3. **MVP는 깊은 곳에**, 필드 보스는 필드에.
4. **랜덤 희귀 출현**이 사냥 중 긴장감을 만든다(게이지만으로는 예측 가능해 설렘이 약함).
5. **잡템은 무언가의 재료**여야 한다(모자·전직·의뢰).
6. 슬롯 수가 다른 **같은 이름 장비**로 "득템" 단계를 만든다.
7. 카드는 **트레이드오프·상황 특화**일수록 연구거리가 된다.
8. 장신구는 **빌드의 마무리**: 슬롯 버전 + 전용 카드.
9. 외형은 **고생의 증거**(제작 모자, MVP 모자).
10. 정보는 **사냥할수록 열린다**(도감 처치 단계).
11. 득템은 **방송·기록**으로 남긴다(싱글의 사회성 대체).
12. 파티는 **역할 + 작전**으로 굴러간다.

### 1.9 검증된 원작 수치 ✔ (원작 리서치 에이전트, 출처 [R1]~[R12])

- **맵 수**: 프론테라 필드 12장, 게펜 15장, 페이욘 11장, 모로크 사막 20장 [R1]. 던전 층: 페이욘 동굴 5층, 지하수로 1~4층, 게펜 탑 1~4층, 스핑크스 1~5층, 피라미드 1~4층+지하, 글래스트헤임 15구역+ [R2].
- **레벨 사다리(고전 기사)**: 지하수로 13~30 → 페이욘 동굴 15~30 → 페이욘 숲 21~40("몰이 경험치 최고") → 지하수로 3층 31~40 → 바이란 1~2층 41~50("득템 좋음, 바람 무기") → 오크 던전 51~70("불 무기") → 피라미드 71+ [R3]. **같은 레벨대에 경험치 맵과 득템 맵이 따로 있고, 맵마다 속성 숙제가 다르다.**
- **드롭 테이블 모양**: 고정 7칸 + 카드 1칸. 포링: 젤로피 70%, 빈 병 15%, 사과 10%, 끈적한 점액 4%, **나이프[4] 1%**, 덜 익은 사과 0.2%, 카드 0.01% [R4]. 초보 몹도 4슬롯 무기를 떨군다.
- **파밍 명소의 이유**: 엘더 윌로우 = 엘루 원석 0.4% + 우든 메일[1] 0.3%, 오크 전사 = 오리데온 원석 0.4% + 액스[3] 1%, 레이드릭 = 엘루 1.06% + 카타나[3] 1% [R4]. MVP 바포메트는 엘루 54%·오리데온 42%·엠펠리움 5% [R4].
- **정련**: 무기 Lv1~4 안전 +7/+6/+5/+4, 방어구 +4, 실패 시 카드째 소멸, 원석 5개 = 정련 광석 1개, 수수료 50~20,000z [R5].
- **카드**: 대부분 0.01%, 무기만 슬롯 최대 4, 나머지 1 [R6]. **카드 하나가 규칙 하나를 바꾸고, 대가가 붙는 것이 많다**(스플래시+HIT−10, 고스트 갑옷+HP 회복−25%, 무속성 −50% 대신 타속성 +50%, 시전 불끊김+시전 +25%). **같은 분류(종족·크기·속성) % 보너스는 더하고, 분류끼리는 곱한다** → "더블 블러디 본드"가 "트리플 블러디"보다 강하다 [R7].
- **장신구 카드가 스킬을 준다**(텔레포트·하이딩·힐 Lv1(+SP 25%)·해독) [R6].
- **모자는 유일하게 외형이 바뀌는 부위**라 정체성이었다. 제작 재료가 거대하다: 삿갓 = 나무뿌리 120개 + 10,000z, 데빌치 모자 = 작은 악마뿔 600개 + 그리폰 발톱 40개 [R8].
- **경제**: NPC 매입 50%, 오버차지 +24%, 노점은 카트 필수 [R9].
- **MVP 리젠**: 1시간(월야화·황금도둑벌레) ~ 24시간(오크 히어로), MVP 아이템은 최다 딜러 인벤토리로 직행 [R10].
- **향수**: 2002년 8월 상용화, 국내 동접 3만, 직업별 시간당 효율이 10배 넘게 차이 났다, 98→99 레벨에 40~50시간 [R11]. 2002년 일기: "뭉치면 살고 흩어지면 죽는다"(오크 던전 파티) [R12].

[R1] https://ratemyserver.net/worldmap.php · [R2] https://ratemyserver.net/dungeonmap.php?re_mob=0 · [R3] https://irowiki.org/classic/Leveling_Spots · [R4] https://ratemyserver.net/index.php?page=mob_db (1002·1033·1023·1163·1039) · [R5] https://irowiki.org/classic/Upgrade · [R6] https://irowiki.org/classic/Card_Reference · [R7] https://irowiki.org/classic/Element , https://irowiki.org/classic/Size · [R8] https://irowiki.org/wiki/Headgear_Ingredients · [R9] https://irowiki.org/classic/Overcharge , https://irowiki.org/classic/Vending · [R10] https://irowiki.org/classic/MVP · [R11] https://namu.wiki/w/%EB%9D%BC%EA%B7%B8%EB%82%98%EB%A1%9C%ED%81%AC%20%EC%98%A8%EB%9D%BC%EC%9D%B8 · [R12] https://www.gamemeca.com/view.php?gid=125641

---

## 2. 방치형 장르 비교표 ✔ (출처 [G1]~[G24], 장르 리서치 에이전트 결과로 교체)

> 날짜 정정: **메이플 키우기**는 2025-11-06 국내 출시(에이블게임즈). Gravity의 RO 방치형은 여러 개다 — Midgard Heroes: Ragnarok Idle(북미 2024-10, 영웅 수집형), **라그나로크 아이들 어드벤처 Plus**(글로벌 2025-02, 국내 2025-08-28), **라그나로크: 백투 글로리**(2025-04, 오프라인 자동 탐험 48시간). 영어권 실사용 리뷰는 적어 앱스토어 리뷰·기사 위주.

| 타이틀 | 핵심 루프 | 세션 | 과금 없이도 도는 훅 | RO 감성 싱글에 빌릴 것 | RO 감성을 흐리는 것 |
|---|---|---|---|---|---|
| 라그 아이들 어드벤처 Plus / Midgard Heroes | 3인 파티(탱·딜·서폿, 직업 자유 변경)로 스테이지 진행, 무기·갑옷·반지·투구 카드 슬롯, 정련 +5 | 하루 여러 번, 시간 개방 콘텐츠 | **카드 도감 등록**, 스테이지↑ = 오프라인 수입↑, 펫·낚시·하우징 | 3인 역할 파티, 카드 도감 보너스, 원작 몬스터·마을 | 카드가 **가챠·"5장 합성"**에서 나옴(원작은 몬스터 드롭), 자동 전투 $15 유료, PvP·길드 |
| 메이플 키우기 | 원작 지역 순회 자동 사냥(헤네시스→페리온), 레벨마다 **수동 스탯 분배**, Lv5 전직 | 상시 켜두기(온라인≫오프라인) | 보스 패턴 연습 던전, 일일 골드·강화·스탯 던전, 전투력 개방 맵 | 수동 스탯, 지역별 진행, 보스 패턴 던전 | 온라인 효율 편중(폰 발열), 숨은 스탯 상한·무공지 수정 → 전액 환불 사태 |
| Ulala | 4인 파티 맵 방치, **맵 끝 보스 = 장비 체크** | 체크인 + 보스 도전 | 조합 보너스(Team Halo), 펫 포획, 요리 | **맵 보스가 다음 지역 관문**(= 필드 보스·MVP), 조합 보너스 | 멀티 필수, 유료 빠른 전투 |
| 버섯커 키우기 | 처치 → 램프 → 장착 또는 **자동 판매(EXP 환원)** | 충전기 꽂고 장시간 | **등급 기준 자동 판매**(Lv16 해금) | 기준선 자동 판매, 모든 드롭이 쓸모 | 슬롯머신 RNG, 11개 병렬 시스템 |
| AFK 아레나 / 저니 | 스테이지 + AFK 상자 | 하루 몇 번 수령 | 기본 12시간 상한, 하루 1회 무료 "2시간 즉시" | 눈에 보이는 상자, 하루 1회 즉시 보상 | 유료 상한 연장, 영웅 합성 |
| **Melvor Idle** (무과금) | 행동 선택 → 스킬 EXP + 아이템별 숙련 + 숙련 풀 | 놓고 가기, **24시간 오프라인을 틱 단위로 정확히 시뮬** | 아이템·몬스터·펫·숙련 **완성 로그**(100% 달성 2~4%), 풀 10/25/50/95% 보너스, 행동별 랜덤 펫 | **몬스터 로그**, 구간 보너스, 정직한 오프라인 | **가방이 가득 차면 행동 정지**(방치 시간 낭비), 긴 그라인드 |
| **Legends of Idleon** | 다캐릭 맵 방치, **모든 몬스터가 자기 카드 드롭** | 장시간 + 체크인 | 카드 별 0~6단계, **미보유 카드 드롭 보정**, 맵별 카드 세트 보너스, **처치 수 포털** | **몬스터별 카드 단계·지역 세트 보너스·처치 수 관문** | 위키 의존, 미니게임 과다, 유료 슬롯 |
| NGU / Firestone / Idle Slayer | 다층 시스템 / 타이머 원정 / 러너+액티브 | — | 점진 해금 / 장기 타이머 / 가끔의 액티브 보너스 | 환생(= 전생)·장기 원정·MVP 상자 같은 선택적 액티브 | 숫자 인플레, 시스템 과다 |

**Idleon 카드 참고 수치** — 일반 카드 별 단계 1/32/96/160/512/… 장, 보스 카드는 1/2/5/8/24…장. 세트 등급은 별 가중(무별 1점 … 6점) → "지역의 모든 몬스터를 잡을 이유". 맵 포털은 처치 수(초반 ~4.5천).

**공통 불만 (피할 것)** ✔
- 이벤트·자동 진행 유료화, 시간 개방, 작은 글씨 [G1] · "방치형인데 할 게 너무 많음", "버튼이 작고 잘 안 눌림" [G2]
- 키우기 장르의 무거워짐(일일 출석 압박, 수십 캐릭 육성) [G3]
- **온라인 ≫ 오프라인 효율** → 폰을 켜두게 만들어 발열 [G4][G5]
- **숨은 상한·무공지 패치**(메이플 키우기 공속 66.76% 상한 → 전액 환불) [G6][G7]
- 위키 없이는 이해 불가한 시스템 [G8] · **가방이 차서 오프라인 진행이 멈춤** [G9] · 100% 후 번아웃 [G10]
- "방치형"인데 매일 손으로 할 일 [G11] · **절대 안 꺼지는 빨간 점**(행동 필요/정보 알림 혼용 → 무시 학습) [G12][G13]

**우리가 빌릴 패턴**
1. **귀환 화면 = 축하 순간**(Kongregate GDC): 존별 처치·EXP·카드·MVP·자동 판매 내역, 하이라이트 먼저 [G14].
2. **오프라인 12~24시간, 온라인과 같은 효율**, 유료 연장 없음(현재 우리는 60%·12시간 → 재검토) [G15][G16].
3. **등급 기준 자동 판매 + 가방이 차도 사냥은 안 멈춤**(넘치면 자동 판매) [G17][G9].
4. **수집 보너스**: 몬스터별 카드 단계·지역 세트(Idleon), 완성 로그(Melvor), 카드 도감. 단, **카드는 몬스터 드롭**이라는 원작 규칙 유지. 카드 사이 공백은 **처치 수 도감**으로 확정 진척을 준다 [G18][G19].
5. **처치 수·숙련 구간 관문**, **맵 보스 = 관문**(Ulala) [G20][G21].
6. **▲ 비교 화살표·초록/빨강 수치 차이**, 상한·체감 감소는 **공개** [G22].
7. **빨간 점 규율**: 한 번 눌러 해결되는 "행동 필요"에만 점, 정보성은 따로 [G12].
8. 인벤토리 노동 축소: 캐릭터별 "최적 장비 자동 장착" [G23].

[G1] https://apps.apple.com/us/app/ragnarok-idle-adventure-plus/id6478286640?see-all=reviews ·
[G2] https://apps.apple.com/kr/app/%EB%9D%BC%EA%B7%B8%EB%82%98%EB%A1%9C%ED%81%AC-%EC%95%84%EC%9D%B4%EB%93%A4-%EC%96%B4%EB%93%9C%EB%B2%A4%EC%B2%98-plus/id6747020932 ·
[G3] https://v.daum.net/v/20260727160707467 ·
[G4] https://www.bluestacks.com/ko/blog/game-guides/maplestory-idle-rpg/mpsir-tips-tricks-ko.html ·
[G5] https://www.inews24.com/view/1912291 ·
[G6] https://sports.khan.co.kr/article/202601291127003 ·
[G7] https://www.ddaily.co.kr/page/view/2026012820254456548 ·
[G8] https://vaporlens.app/app/1476970/idle_on.md ·
[G9] https://commonsensegamer.com/melvor-idle-tips-guide/ ·
[G10] https://vaporlens.app/app/1267910/melvor_idle.md ·
[G11] https://vaporlens.app/app/4195600/afk_journey ·
[G12] https://www.dolfy.ai/blog/notification-badge-problem-red-dot-mobile-apps ·
[G13] https://www.braze.com/resources/articles/beware-red-dot-badging ·
[G14] https://www.gamedeveloper.com/design/the-rise-of-games-you-mostly-don-t-play ·
[G15] https://gamerempire.net/afk-arena-guide-tips-tricks-strategy/ ·
[G16] https://news.bizwatch.co.kr/article/mobile/2025/04/17/0027 ·
[G17] https://www.deconstructoroffun.com/blog/2024/4/15/the-magic-of-legend-of-mushroom ·
[G18] https://idleon.wiki/wiki/Cards ·
[G19] https://steamcommunity.com/stats/1267910/achievements ·
[G20] https://steamcommunity.com/app/1476970/discussions/0/5503948370881708368 ·
[G21] https://butwhytho.net/2019/10/review-ulala-idle-adventures ·
[G22] https://caprog.itch.io/emoji-battle-clicker/devlog/1029688/inventory-ui-improvements-equipment-quality-of-life-improvements ·
[G23] http://www.pocketgamer.biz/game-analysis-the-evolution-of-idle-rpg-systems/ ·
[G24] https://www.companionlink.com/blog/2026/06/maplestory-idle-review-does-it-capture-the-magic-of-the-original-franchise/

---

## 3. 파티 AI·작전 프리셋 패턴

### 3.1 참고 사례 ✔ (출처 [P1]~[P10])

| 사례 | 구조 | 플레이어가 실제로 쓰는 것 |
|---|---|---|
| RO 호문클루스·용병 AI | 공식 기본 AI는 "전부 공격 or 아무것도 안 함"으로 극단적 → iRO 유저 대부분이 커스텀 AI(AzzyAI) 사용 [P1] | 가이드가 다루는 건 3개뿐: **수동 모드(명령 전엔 공격 안 함) / 공격성 높음 / 알·식물 무시**. AzzyAI 노브: 교전 HP% `AggroHP`, 공격 스킬용 SP 예약 `AttackSkillReserveSP`, 이동 반경 `MoveBounds`, 도주 HP `FleeHP`, 주인 구조 `RescueOwnerLowHP`, 주인 타깃 협공 `FriendAttack`, N마리 이상이면 광역 `AutoMobCount`, **몬스터별 전술(무시/공격 저·중·고/반격만/저격/탱킹)** [P2] — 100개 넘는 변수라 GUI 설정기를 씀 |
| FF12 갬빗 | [대상 조건 → 행동] 위에서부터 첫 일치 실행 | "아군 HP < 70% → 케알"(맨 위), "리더의 타깃 → 공격"(맨 아래). 비판: 공격해야 할 때 힐함, 타깃 선택 불만, 조건 구매 게이트. 조디악 에이지에서 **갬빗 세트 3개 전환** 추가 [P3] |
| 드래곤 퀘스트 작전 | DQ4~6은 파티 전체 1개, **DQ7부터 캐릭터별**. 한국어 공식(DQ3 HD-2D): **전력을 다하자 / 요령껏 싸우자 / 회복에 힘쓰자 / MP를 아끼자 / 판단에 맡기자 / 명령을 들어라** [P4] | 기본 '요령껏(バッチリ)'을 켜 두고 **보스·긴 던전**에서만 바꿈. '이것저것(いろいろ)'은 "비효율·비실용" 평가, 'MP 아끼자'는 **위급할 때 힐까지 안 해서** 불만 [P5]. 커뮤니티 한국어 명칭 "목숨을 소중히"가 널리 기억됨 [P6] |
| FF13 패러다임 / 드래곤 에이지 | 역할 조합 프리셋을 원탭 전환 / 역할 프리셋 + 행동(공격적·기본·원거리·신중) | 직접 규칙을 쓰기보다 **역할 기본값을 받아들임** [P7] |
| 페르소나 4~ | 자유 행동 / 전력 공격 / SP 절약 / 회복·지원 / 직접 명령 | P3의 AI는 "빈사 적에게 상태이상 쓰기" 같은 턴 낭비로 악명 [P8] |
| 한국 모바일 MMO | MIR4: 자동 전투 범위, **파티장 중심 전투, 파티 타깃 공유**, 피격 시 반격, 스킬 빈도. 오딘: 전투 범위·물약·자동 귀환 [P9] | **범위·물약%·타깃 공유**가 핵심. AFK Journey는 전투 전 **타깃 우선순위 선을 표시** [P10] |

**정리**
- 사람들이 이해하는 축은 **4개뿐**: 누구를 때리나(타깃) / 자원을 얼마나 쓰나(SP) / 얼마나 멀리 가나(추격 반경) / 언제 쉬나(휴식 임계치). → 우리 필드 구성(`Tactics` + `PartyOrders`)과 정확히 일치. 좋은 설계.
- 가장 많이 만지는 숫자는 **회복 임계치**(갬빗 HP<70%, AzzyAI `HealOwnerHP`, 모바일 물약%). 거의 모든 게임에 **"리더 타깃 협공"**이 있다.
- 헷갈리는 것: 조건-행동 문법, 우선순위 순서, 효과가 안 보이는 모호한 이름("이것저것"), 힐까지 막는 절약 모드, 아무도 안 때려서 고장 난 것처럼 보이는 수동/추종 모드. → **프리셋을 기본, 세부는 접어둔다.**

### 3.2 제안 프리셋 (이름·의미·매핑)

표기: 타깃 / 위치 / 스킬 / 추격. `역할기본` = `defaultTactics(cls)` 값 유지.

| 프리셋 (UI 이름) | 한 줄 설명 (UI 문구) | 탱커 (검사·기사) | 근접 딜 (도둑·어새신·상인·BS) | 원거리 (궁수·헌터) | 마법 (마법사·위저드) | 힐러 (성직자·프리스트) | 파티 작전 pull / rest |
|---|---|---|---|---|---|---|---|
| **다 같이 싸워** (기본) | 각자 역할대로 균형 있게 싸웁니다. | 역할기본 | 역할기본 | 역할기본 | 역할기본 | 역할기본 | 3 / 30 |
| **몰아쳐라** | SP 아끼지 말고 최대한 빨리 잡습니다. 위험해요! | nearest / front / aggressive / free | weakest / front / aggressive / free | nearest / mid / aggressive / normal | assist / mid / aggressive / normal | assist / back / normal / normal | 6 / 15 |
| **목숨이 먼저** | 무리하지 않고, 다치면 바로 쉽니다. | protect / front / normal / tight | assist / mid / normal / tight | assist / back / normal / tight | assist / back / conserve / tight | assist / back / normal / tight (힐 임계치 +15%p) | 2 / 60 |
| **SP 아껴** | 공격 스킬은 SP 절반 이상일 때만. 오래 사냥할 때. | protect / auto / conserve / normal | assist / auto / conserve / normal | assist / auto / conserve / normal | assist / auto / conserve / tight | assist / auto / conserve / tight | 3 / 40 |
| **보스를 노려라** | 보스가 보이면 모두 보스에게 집중합니다. | boss / front / aggressive / normal | boss / front / aggressive / normal | boss / mid / aggressive / normal | boss / mid / aggressive / normal | assist / back / normal / tight | 1 / 50 |
| **나를 지켜** | 리더 곁을 떠나지 않고 리더의 적부터 처리합니다. | protect / front / normal / tight | assist / front / normal / tight | assist / mid / normal / tight | assist / mid / normal / tight | assist / back / normal / tight | 2 / 40 |
| **오래 버티기** (방치용) | 자리를 비울 때 추천. 느리지만 전멸하지 않습니다. | protect / front / conserve / tight | assist / mid / conserve / tight | assist / back / conserve / tight | assist / back / conserve / tight | assist / back / normal / tight | 2 / 60 |

- **두 층 UI**: 파티 화면에서 *파티 프리셋 1탭* → 각 영웅 행 아래 *"세부 ▸"*를 펼치면 4개 세그먼트(타깃·위치·스킬·추격). 세부를 바꾸면 프리셋 칩이 "사용자 지정"으로 바뀜.
- `오래 버티기`는 **오프라인 효율**과 연결 가능: 오프라인 계산 시 전멸 패널티(`kpm *= 0.4`)를 이 프리셋에서 완화 → "자리 비울 땐 이것" 학습 유도.
- 원작 호문 AI의 "**이 몬스터는 무시**" 목록은 고급 옵션 후보(v0.4): 도감 몬스터 카드에서 *"무시"* 토글.
- **리서치에서 나온 주의점**: ① `SP 아껴`·`오래 버티기`는 **힐·부활을 절대 막지 않는다**(DQ 'MP를 아끼자' 불만; 현재 `types.ts` 주석의 의도와 동일). ② "이것저것" 같은 랜덤 프리셋은 만들지 않는다. ③ 프리셋 효과가 **눈에 보이게** — 필드에서 각 영웅의 현재 타깃에 작은 표식/선(AFK Journey 패턴). ④ 빈사 적에게 스킬 낭비 금지(현 `chooseSkill`의 `est*1.1` 컷 유지). ⑤ 사용자 지정 세트 2~3개 저장(조디악 에이지 갬빗 세트 3개와 같은 발상). ⑥ `목숨이 먼저`는 DQ 커뮤니티 명칭 "목숨을 소중히"에 대한 오마주이되 공식 명칭("회복에 힘쓰자")은 쓰지 않는다.

---

## 4. Mini Midgard 갭 분석 (v0.2 코드 기준)

| 축 | RO 원작 | 미니 미드가르 v0.2 (근거 코드) | 갭 / 위험 |
|---|---|---|---|
| 맵 구조 | 지역마다 필드 여러 장 + 던전 여러 층, 같은 레벨대 대안 맵 2~3개 | 지역 = 맵 1장, 5개가 일렬 (`zones.ts` `unlockBy` 체인) | **가장 큰 갭.** 레벨이 맞는 맵이 항상 1개 → 맵 선택이 없음 |
| 맵의 '이유' | EXP / 제니 / 광석 / 카드·재료 맵 분화 | 모든 맵이 EXP+드랍 균등, 정련석은 여기저기 소량 | 맵 선택이 레벨로만 결정 |
| 희귀 몬스터 | 미니보스(10분~2시간), MVP 고정 타이머 + 묘비 | 처치 수 게이지 → 보스/MVP 소환 (`world.ts` `spawnTick`·`bossReady`) | 랜덤 희귀 출현 없음 → "떴다!" 순간 부재 |
| 잡템 | 전직·모자·퀘스트 재료 | 판매 전용, `autoSellEtc` 토글 | **잡템 의미 = 제니뿐** → 루팅이 무의미 |
| 슬롯 장비 | [0]/[n] 이중 버전 | `Drop.slots` 지원, 무기·방어구에 활용 중 | 장신구는 클립[1](상점)만 슬롯 |
| 카드 | 종족·속성·크기, 트레이드오프, 스킬 부여 | 몹당 1장, 효과 다양 (`items.ts`) | 스킬 부여 카드·세트 없음, 도감 완성 보상 없음 |
| 장신구 | 7계열 × [0]/[1] + 전용 카드 | 7종 +2 스탯 고정 | **사용자 요청 핵심인 "장신구 찾아가는 맛"이 약함** |
| 머리 장비 | 모자 퀘스트 + 외형 자랑 | 페이퍼돌 외형 훌륭, 획득은 상점/드랍 | 제작 루프 없음 |
| 경제 | NPC + 노점 | NPC 상점 + 할인/바가지 + 정련 | 노점(시세) 감각 없음 |
| 파티 AI | 역할 분담 | `Tactics`·`PartyOrders` 타입·기본값·세이브 마이그레이션 완료 | **`world.ts`가 아직 안 읽음**(`pickTarget`은 도발 탱 타깃 고정, 휴식은 상수 35%/15%), UI 없음 |
| 빌드 연구 | 스탯 + 속성 교체 + 카드 조합 | 수동 스탯·프리셋, 속성 화살/주문서, 약점 칩 | 장비 세트 교체 없음, 맵별 효율 수치 없음 |
| 오프라인 | (없음) | 60%·12h·보고 모달 (`offline.ts`, `Modals.tsx`) | 득템 강조·다음 목표 제시 약함, 희귀 출현 미반영 |
| 전직 | 전직 시험 | 레벨 조건만 (`canJobChange`) | 추억 포인트 비어 있음(우선순위 낮음) |

---

## 5. 추천 Top 12 (영향 ÷ 노력 순)

### #1 행동 요령을 전투 엔진에 연결 + 원탭 작전 프리셋 — **M**
- **무엇**: 이미 있는 `Tactics`/`PartyOrders`를 `world.ts`가 실제로 읽게 하고, 3.2의 프리셋 7종 UI.
- **왜**: 데이터 모델·세이브까지 끝났는데 효과가 0. DQ·페르소나·모바일 MMO 모두 "원탭 프리셋 + 몇 개 슬라이더"가 실사용 패턴이고, 기본값을 켜 둔 채 보스·긴 던전에서만 바꾼다 [P3][P4][P5][P8][P9].
- **RO 느낌**: 파티 역할 분담 = 원작 파티 사냥의 핵심, 호문 AI 커스텀 문화(AzzyAI)의 축소판 [P1][P2].
- **구현**: `src/game/data/tactics.ts`(신규) `TACTIC_PRESETS: Record<PresetId, (role) => Tactics> & orders`. `world.ts`
  - `pickTarget(h)`: `switch (h.hero.tactics.target)` — assist(리더/탱 타깃), protect(`m.target`이 후열 영웅인 몹 우선), nearest, weakest(`hp/maxHp` 최소), boss(보스 → 없으면 assist).
  - 추격 반경: 현재 상수 `dc > 300` → `{tight:140, normal:240, free:340}[chase]`.
  - `chooseSkill`: `skills==='conserve' && sp < maxSp*0.5`면 attack/aoe 제외, aggressive면 `bv < est*1.15` 컷 완화.
  - `idleFollow`: position별 오프셋(front는 리더 앞, back은 뒤 2배 거리). 리더 탐색은 `engaged >= s.orders.pull`이면 정지.
  - 휴식: 상수 `0.35`/`0.15` → `s.orders.rest`.
  - `src/ui/panels/World.tsx` `PartyPanel`에 프리셋 칩 + "세부 ▸". `tools/sim.ts`에 프리셋 인자 추가해 전멸률·킬속도 비교.

### #2 희귀 변종 몬스터(미니보스) 랜덤 출현 — **S**
- **무엇**: 맵마다 1~2종 희귀 변종(예: 황금 말랑, 그림자 늑대, 수정 박쥐)이 **8~40분 랜덤 주기**로 1마리 출현. 보스 판정(도발·덫 면역), 고유 카드 + 슬롯 장신구 드랍.
- **왜**: 원작 미니보스는 10분~2시간 주기 소수 스폰 ✔ [S1]. 게이지형 보스는 예측 가능 → 설렘 부족.
- **RO 느낌**: 말랑 필드의 천사/악마/유령 변종이 주던 긴장감 그대로. 이름·외형은 오리지널.
- **구현**: `monsters.ts` 기존 `sprite` + 새 `palette`로 변형(아트 비용 거의 0), `boss: 'field'` 또는 신규 `rare: true`. `zones.ts` `rares?: { id: string; every: [number, number] }[]`. `ZoneProgress.rareAt`(세이브) → `world.ts` `spawnTick`에서 시각 도달 시 스폰 + `announce` kind `'rare'` + 미니맵 핑. `offline.ts`: `ms / 평균주기 × 0.6` 마리를 포아송으로 처치 처리.

### #3 모자 장인 NPC — 잡템에 쓸모 부여 — **S~M**
- **무엇**: 마을에 "모자 장인". 레시피 = 그 지역 잡템 다량 + 희귀 재료 1개 + 제니 → 머리 장비(외형 보임).
- **왜**: 원작은 전직·모자에 잡템을 소모 ✔ [S4][S5]. 지금은 잡템 = 제니라 `autoSellEtc`만 켜게 된다.
- **RO 느낌**: "그 모자 만들려고 저 맵 간다" + 외형 자랑. 페이퍼돌 외형 시스템을 이미 갖춰 효과가 바로 보임.
- **구현**: `items.ts` `RECIPES: { id; out; need: [itemId, n][]; zeny }[]` (예: 꽃 머리핀 ← 꽃잎 30 / 버섯 모자 ← 버섯 포자 150 + 이끼 20 / 고양이 머리띠 ← 은빛 털가죽 1 + 짐승 가죽 80 + 늑대 발톱 40). 새 `look` 4~6종 추가(`render/hero.ts`). `state.ts` `craft(s, rid)`. 자동 판매가 **레시피 재료는 미완성 레시피 수량만큼 보존**(#9와 연동). `World.tsx` `TownPanel` NPC 카드 + 재료 진척 바.

### #4 사냥 의뢰 게시판 — **S~M**
- **무엇**: 마을 게시판에 의뢰 3개("[몬스터] 150마리"). 보상: 몬스터 EXP × N + 레벨 × 100z + **의뢰 증표**. 증표 4개마다 보너스, 증표로 슬롯 장신구·정련석·모자 레시피 교환.
- **왜**: 원작에도 반복형 "150마리 처치" 의뢰(EXP = 몬스터 EXP × 150, 제니 = 레벨 × 100, 4회마다 증표) ✔ [S3]. 방치형의 일일 목표 역할을 **원작 문법**으로.
- **RO 느낌**: 맵 이동 이유를 하나 더 만듦(의뢰 몬스터가 다른 맵에 있음).
- **구현**: `types.ts` `GameState.bounties: { mob; need; have }[]`, `badges`. `world.ts` `killMob`에서 `have++`, `offline.ts` 맵별 처치 수 `c`로 반영. 완료 시 리롤, 하루 1회 무료 리롤. 보상 EXP는 시뮬로 조정(원작 ×150은 우리 경험치 곡선에 과다할 수 있음 → ×40~60부터).

### #5 장신구 [1] 변종 + 장신구 전용·스킬 부여 카드 — **S**
- **무엇**: 반지·장갑·귀걸이·브로치·목걸이·로자리의 **[1] 드랍 변종**(기존 드랍에 `slots: 1` 확률 분리), 장신구 카드 6~8장 추가: STR/DEX/AGI +3, **시전 끊김 방지**, **스킬 부여**(힐 Lv1 자동, 해독, 위급 시 순간이동=전투 이탈).
- **왜**: 사용자가 콕 집은 "액세서리 찾아가는 맛". 원작에서 장신구 카드는 빌드 마무리 ◇.
- **구현**: `monsters.ts` 드랍에 `{ id: 'x_ring', rate: 0.0003, slots: 1 }` 식 별도 줄. `types.ts` `Bonus.grantSkill?: { id: string; lv: number }` → `stats.ts` `computeDerived`가 `grantedSkills` 산출 → `world.ts` `enabledSkills`가 합산. 장신구 카드는 #2 희귀 변종에게 우선 배정.

### #6 사냥터 '특산' 태그 + 맵별 실측 효율 — **S**
- **무엇**: 지도 카드에 `EXP맵`/`제니맵`/`광석맵`/`카드맵`/`재료맵` 태그, 그리고 **내 파티 실측** EXP/시간·제니/시간·처치/분·전멸 횟수.
- **왜**: RO 유저는 "시간당 경험치"로 맵을 골랐다 ◇. 방치형의 전투력 숫자 대신 **맵 선택을 돕는 정보**.
- **구현**: `zones.ts` `tags`. `s.rate`는 현재 맵 1개만 → `GameState.zoneStats: Record<zid, {ms, kills, exp, zeny, deaths}>` 누적(`world.ts` 매 kill, `offline.ts` 미반영 or 별도). `WorldMap.tsx` 존 카드에 표시. 드랍 테이블 조정으로 맵 정체성 강화(예: 동굴=정련석↑, 사막=고가 잡템↑).

### #7 득템 방송 · 득템 기록 · MVP 묘비 — **S**
- **무엇**: 카드/슬롯 장비/MVP 모자 획득 시 노란 시스템 문구("[알림] ○○님이 ○○ 카드를 획득했습니다!"), "득템 기록" 탭(시각·맵·몬스터), MVP 처치 자리에 **묘비**(처치 시각·MVP 획득자).
- **왜**: 원작 MVP 묘비에는 처치 시각과 MVP 획득자 이름이 남는다 ✔ [S2]. 싱글에서 사회적 자랑을 **기록**으로 대체.
- **구현**: `GameState.trophies: {t, id, zone, mob, hero}[]`(최근 100). `world.ts` `rollDrops`/`killMob`에서 push. `ZoneProgress.mvpLast`. `render/field.ts` 묘비 스프라이트, `WorldMap.tsx`·가방 패널에 기록 탭.

### #8 몬스터 도감 처치 단계 + 지역 카드 완성 보상 — **S**
- **무엇**: 몬스터별 처치 수 단계 — 30마리: 드랍 목록 공개 / 300: 드랍률 공개 / 1000: "숙련 사냥꾼" 칭호 + 그 몬스터 대상 피해 +3%. 지역 카드 전부 모으면 지역 칭호 + 소액 영구 보너스.
- **왜**: Melvor의 완성 로그, Idleon의 중복 카드 단계가 "같은 맵을 더 잡을 이유" ◇ [S13][S14]. RO 커뮤니티 DB를 보던 연구 문화를 **게임 안 점진 공개**로.
- **RO 느낌 유지 조건**: 보너스는 **작게**(모두 합쳐 카드 1장 수준 이하). 카드의 주인공 자리를 뺏지 않는다.
- **구현**: `s.book[mob].kills` 이미 있음 → `WorldMap.tsx` `MobDetail`에서 단계별 표시, `stats.ts`에 `bookBonus(s)`.

### #9 루팅 필터 3단계 — **S**
- **무엇**: 잡템: 모두 줍기 / 레시피·의뢰 재료 빼고 판매 / 모두 판매. 장비: 슬롯 없는 하위 장비 자동 판매 on/off. 카드·슬롯 장비·희귀 등급은 **절대 자동 판매 안 함**.
- **왜**: 인벤토리 노동은 방치형 최다 불만 ◇. 지금 토글은 잡템 전체 on/off뿐.
- **구현**: `Settings.loot`. `world.ts` `groundTick`, `offline.ts` 동일 함수 공유(`state.ts` `autoSellRule(s, id, slots)`).

### #10 오프라인 귀환 화면 재구성 — **S**
- **무엇**: ① 카드·슬롯 장비·희귀 출현 처치(크게, 빛기둥) → ② 레벨업 → ③ 보스/MVP 게이지·의뢰 진척 → ④ 잡템·판매액(접기) → ⑤ "다음 추천"(예: "MVP 게이지 가득! 소환할까요?").
- **왜**: AFK 계열의 핵심은 "수령 순간" ◇. 지금 모달은 카드가 텍스트 한 줄.
- **구현**: `OfflineReport`에 `rares`, `bounty` 추가, `Modals.tsx` `OfflineModal` 재배치. 상한 12h·60% 유지(하루 2회 체크인 리듬에 적합).

### #11 던전 층 구조 → 지역 다맵화 — **M~L (가장 큰 장기 효과)**
- **무엇**: 지역마다 맵 2~3장. 파일럿: **망자의 동굴을 1~3층**으로(1층 30~36 박쥐·해골 / 2층 36~42 좀비·유령등불 / 3층 42~48 해골 궁수 + MVP 굴). 필드 보스는 1·2층, **MVP는 3층에만**.
- **왜**: 원작 MVP는 던전 최하층(동굴 5층, 피라미드 지하 2층, 하수도 4층) ✔ [S2]. 같은 레벨대 대안 맵이 없으면 "찾아가는 맛"이 성립하지 않음.
- **구현**: `zones.ts` `region`, `floor` 필드 + 층별 `ZoneDef`(기존 몹 재사용 + 팔레트 변형 2~3종). `WorldMap.tsx` 지역 핀 → 층 리스트 시트. 해금은 `unlockBy` 그대로(1층 보스 → 2층). 이후 숲(입구/깊은 숲), 사막(필드/피라미드 1~2층), 설원(필드/얼음 동굴)으로 확장. 시뮬로 13h/30h 페이싱 재검증.

### #12 노점 거리(NPC 모험가 노점) — **M**
- **무엇**: 6시간마다 바뀌는 NPC 노점 5~6개: 슬롯 장비·정련석·가끔 흔한 카드(NPC가의 30~50배), 그리고 **"삽니다" 노점**(특정 잡템을 상점가 2~3배에 구매).
- **왜**: 원작 노점가는 경제·추억의 중심 ◇. 싱글에서 시세 감각과 **제니 소모처**(정련 외)를 만든다.
- **RO 느낌 유지 조건**: MVP 카드·보스 카드는 절대 안 팜. 노점 카드는 "직접 뽑는 게 이득"인 가격.
- **구현**: `src/game/data/vendors.ts`(이름·성향 풀), `state.ts` `market: { seed; at; sold: string[] }` 시드 RNG 생성. `World.tsx` `TownPanel` 새 카드 "노점 거리".

> 보류: **전직 시험**(재료 제출형, M) — 추억 가치는 있으나 방치 흐름을 끊음. #3·#4가 잡템 쓸모를 먼저 채운 뒤 v0.4에 "선택형(건너뛰면 소액 제니)"으로.
> 비추천: 전투력(CP) 단일 숫자, 스테이지 번호 진행, 가챠 동료, 스태미나, 재화 3종 이상, 도감 보너스 인플레.

---

## 6. v0.3 범위 제안 (먼저 할 5개 + 여유 1개)

| 순서 | 항목 | 노력 | 이유 |
|---|---|---|---|
| 1 | **#1 작전 프리셋 + 엔진 연결** | M | 이미 반쯤 만들어진 기능. 파티 3인 체감 품질이 가장 크게 오름 |
| 2 | **#2 희귀 변종 출현** (5개 맵 × 1종) | S | 아트 비용 거의 0, "떴다!" 순간 즉시 생김 |
| 3 | **#5 장신구 [1] + 장신구 카드** (희귀 변종에게 배정) | S | 사용자 요청 "액세서리 찾아가는 맛" 직격, #2와 한 세트 |
| 4 | **#3 모자 장인** (레시피 6~8개) + **#9 루팅 필터** 재료 보호 | S~M | 잡템에 쓸모 → 루팅이 다시 의미를 가짐 |
| 5 | **#11 파일럿: 동굴 1~3층** | M | 맵 다양성의 첫 증명. MVP를 최하층으로 옮겨 원작 문법 확립 |
| (여유) | #7 득템 방송·기록 (#2·#5의 연출 마감) | S | 위 항목들이 만든 득템 순간을 기록으로 남김 |

v0.3.x 다음: #4 의뢰 게시판 → #6 특산 태그·실측 효율 → #10 귀환 화면 → #8 도감 단계 → #12 노점 거리 → 숲·사막·설원 다맵화.

**검증 방법**: `npm run sim`에 프리셋·희귀 스폰 반영 후 (a) 2차 전직 ≈13h / 콘텐츠 끝 ≈30h 페이싱 유지, (b) 희귀 변종 처치 ≈ 시간당 1~3회, (c) 장신구[1] 첫 획득 ≈ 3~6h, (d) 프리셋별 전멸률 `오래 버티기` < `기본` < `몰아쳐라`.

---

## 7. Sources

**이번 조사에서 원문 확인 ✔**
- [S1] iRO Wiki (classic) — Boss Protocol / Mini Boss 스폰 주기: https://irowiki.org/classic/Boss (현행판 https://irowiki.org/wiki/Boss)
- [S2] iRO Wiki — MVP (MVP 판정, 리스폰 변동 10분, 묘비, MVP 서식지 예): https://irowiki.org/wiki/MVP
- [S3] iRO Wiki — Bounty Board Quests (150마리, EXP×150, 레벨×100z, 4회마다 증표): https://irowiki.org/wiki/Bounty_Board_Quest
- [S4] iRO Wiki — Mage Job Change Guide (잡템 조합 제출): https://irowiki.org/wiki/Mage_Job_Change_Guide
- [S5] iRO Wiki — Archer Job Change Guide (나무 점수 25점): https://irowiki.org/classic/Archer_Job_Change_Guide
- [S6] iRO Wiki — Swordman Job Change Guide: https://irowiki.org/classic/Swordman_Job_Change_Guide
- [S7] iRO Wiki — Eden Group Leveling Quests / Gramps 주간 400마리 의뢰: https://irowiki.org/wiki/Eden_Group_Leveling_Quests , https://irowiki.org/wiki/Gramps_Turn-In_Monsters

**참고 (이번 세션에 원문 미열람 ◇ — 구현 전 재확인 권장)**
- [S8] iRO Wiki — Cards / Refinement / Headgear quests: https://irowiki.org/wiki/Cards , https://irowiki.org/wiki/Refinement , https://irowiki.org/wiki/Headgear_Quests
- [S9]~[S12] → 아래 파티 AI 출처 [P1]~[P10]으로 대체(원문 확인됨)
- [S13] Melvor Idle Wiki — Mastery / Completion Log: https://wiki.melvoridle.com/w/Mastery , https://wiki.melvoridle.com/w/Completion_Log
- [S14] Legends of Idleon Wiki — Cards: https://idleon.wiki/wiki/Cards
- [S15] RateMyServer (드랍률·몬스터 DB): https://ratemyserver.net/
- [S16] 나무위키 — 라그나로크 온라인: https://namu.wiki/w/라그나로크%20온라인
- [S17] AFK Arena Wiki — AFK Rewards: https://afk-arena.fandom.com/wiki/AFK_Rewards
- [S18] Firestone Idle RPG Wiki — Map Missions: https://firestone-idle-rpg.fandom.com/wiki/Map

**파티 AI 출처 (원문 확인 ✔)**
- [P1] iRO Wiki — Homunculus System / AI Customization: https://irowiki.org/wiki/Homunculus_System , https://irowiki.org/wiki/Guide:AI_Customization
- [P2] AzzyAI-RE 소스(H_Config.lua·Defaults.lua·Const_.lua): https://github.com/AoShinRO/AzzyAI-RE , https://deepwiki.com/AoShinRO/AzzyAI-RE
- [P3] FF12 갬빗: https://jegged.com/Games/Final-Fantasy-XII/Gambits/ , https://blog.playstation.com/archive/2020/04/24/final-fantasy-xii-the-zodiac-age-gets-new-update-on-ps4-today/ , https://www.rpgsite.net/review/2789-final-fantasy-xii-review
- [P4] DQ 작전 명칭·변천: https://wikiwiki.jp/dqdic3rd/%E3%80%90%E4%BD%9C%E6%88%A6%E3%80%91 , https://game8.jp/dq3/654246 , https://www.gamemeca.com/fam.php?rts=board&gcode=fam_travel&gid=1755862
- [P5] DQ11 작전 평가: https://kamigame.jp/%E3%83%89%E3%83%A9%E3%82%AF%E3%82%A811/%E6%94%BB%E7%95%A5%E3%82%AC%E3%82%A4%E3%83%89/%E4%BD%9C%E6%88%A6.html , https://steamcommunity.com/app/742120/discussions/0/3101263284818872093/
- [P6] 한국 커뮤니티 명칭: https://m.ruliweb.com/game/board/177170/read/3550791
- [P7] FF13 패러다임·드래곤 에이지 전술: https://jegged.com/Games/Final-Fantasy-XIII/Tips-and-Tricks/Advanced/Optimized-Party-Setup-Guide.html , https://steamcommunity.com/app/47810/discussions/0/154645214959530920
- [P8] 페르소나 전술: https://megatenwiki.com/wiki/Tactics , https://www.gamespot.com/shin-megami-tensei-persona-3/user-reviews/2200-294002/
- [P9] 모바일 MMO 자동 전투: https://cs.mir4global.com/post/26 , https://kakaogames.oqupie.com/portals/2952/articles/73465
- [P10] AFK Journey 진형·타깃 표시: https://primagames.com/gaming/best-team-formations-for-every-situation-in-afk-journey

> 메모: 3장(파티 AI)은 원문 확인을 거쳤다. 2장(방치형 신작 리뷰·불만)과 1장 일부(카드·모자 레시피 세부)는 장르/원작 일반론으로 작성했으며(◇), 구현 전 수치는 재확인할 것.
