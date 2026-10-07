// Builds (docs/design/BUILD_TREE.md): named ways to grow each class line — a stat axis, the mechanic it leans on, the
// identity item that switches it on and the weakness that becomes the next thing to farm. The first batch of identity
// items lives here too (with where they drop), so build content grows in one place.
import type { ClassId, ItemDef, StatKey } from '../types.ts';
import { ITEMS } from './items.ts';
import { MONSTERS, type Drop } from './monsters.ts';

export interface BuildDef {
  id: string;
  /** the first job this build grows from (its 2nd job follows) */
  line: Exclude<ClassId, 'novice'>;
  name: string;
  /** one line: what it does */
  pitch: string;
  /** stat ratio for 추천 분배 */
  weights: Partial<Record<StatKey, number>>;
  /** skills it leans on (display) */
  skills: string[];
  /** identity items / cards (ids; may name items that are not in the game yet) */
  items: string[];
  /** the weakness → what patches it (display) */
  weak: string;
}

export const BUILDS: BuildDef[] = [
  // ── 검사 → 기사
  { id: 'kn_crit', line: 'swordsman', name: '광월 크리 기사', pitch: 'DEX를 버리고 크리로 명중을 해결한다. 크리는 회피를 무시한다', weights: { agi: 9, str: 8, luk: 6 }, skills: ['twohand_quicken', 'twohand_mastery'], items: ['w_bloodmoon', 'x_purify'], weak: '요도의 저주 → 정화의 부적 · HP가 낮다 → HP 카드 · 보스는 크리를 덜 맞는다' },
  { id: 'kn_agi', line: 'swordsman', name: '질풍 양손검', pitch: '공속과 회피로 한 마리씩 빠르게', weights: { agi: 8, str: 8, dex: 4, vit: 2 }, skills: ['twohand_quicken', 'bash'], items: [], weak: '세 마리 이상에 둘러싸이면 회피가 무너진다 → 작전 "한 마리씩"' },
  { id: 'kn_vit', line: 'swordsman', name: '철벽 창기사', pitch: '꿰뚫기의 명중 보너스로 명중을 메우는 단단한 창', weights: { str: 8, vit: 7, dex: 5, int: 2 }, skills: ['pierce', 'spear_mastery'], items: [], weak: '느리다 → 공속 물약 · 종족 → 방패 카드' },
  { id: 'kn_bowl', line: 'swordsman', name: '회전 몰이 기사', pitch: '몰아서 회전 강타로 한꺼번에', weights: { str: 8, vit: 6, agi: 4, dex: 4 }, skills: ['bowling_bash', 'magnum_break', 'endure'], items: ['x_whirlglove'], weak: 'SP가 모자란다 → SP 카드 · 받는 피해 → 흡혈' },
  { id: 'kn_counter', line: 'swordsman', name: '반격 수호기사', pitch: '맞으면 크리 반격. 파티의 방패', weights: { vit: 9, dex: 5, str: 5 }, skills: ['auto_counter', 'provoke'], items: [], weak: '딜이 약하다 → 반격 크리 피해 · 마법 → MDEF' },
  { id: 'kn_ele', line: 'swordsman', name: '속성검 기사', pitch: '지방마다 상성에 맞는 속성 무기로 정면 돌파', weights: { str: 8, dex: 6, vit: 3 }, skills: ['bash', 'magnum_break'], items: [], weak: '무기 여러 자루의 정련 부담' },
  { id: 'kn_spell', line: 'swordsman', name: '마검 기사', pitch: '평타에 마법이 따라 나간다 (INT/STR)', weights: { str: 6, int: 5, dex: 5 }, skills: ['magnum_break', 'bash'], items: ['w_spellhilt'], weak: '물리·마법으로 장비가 갈린다 — 연구거리' },
  // ── 마법사 → 위저드
  { id: 'wz_intdex', line: 'mage', name: '인덱 학자', pitch: '볼트 한 방, DEX로 시전 단축', weights: { int: 9, dex: 8, vit: 1 }, skills: ['fire_bolt', 'cold_bolt', 'lightning_bolt', 'jupitel'], items: ['w_sagestaff', 'x_manaspring'], weak: '맞으면 시전이 끊긴다 · HP가 낮다' },
  { id: 'wz_storm', line: 'mage', name: '폭풍 술사', pitch: '탱커가 모아 주면 광역기로 쓸어 담는다', weights: { int: 9, dex: 7, vit: 3 }, skills: ['storm_gust', 'lord_vermilion', 'thunderstorm'], items: ['x_manaspring'], weak: 'SP · 파티 의존' },
  { id: 'wz_freeze', line: 'mage', name: '빙뢰 연쇄', pitch: '얼려서 물속성으로 바꾼 뒤 번개 200%', weights: { int: 9, dex: 7 }, skills: ['frost_diver', 'lightning_bolt', 'jupitel'], items: [], weak: '불사는 얼지 않는다' },
  { id: 'wz_vit', line: 'mage', name: '인바탈 술사', pitch: '느리지만 죽지 않는 솔로', weights: { int: 9, vit: 6, dex: 4 }, skills: ['fire_bolt', 'soul_strike'], items: [], weak: '느리다 → 시전 단축 장비' },
  { id: 'wz_soul', line: 'mage', name: '영혼 연사', pitch: '영혼 타격으로 염·불사를 사냥', weights: { int: 8, dex: 6, agi: 3 }, skills: ['soul_strike'], items: [], weak: '염·불사가 아니면 약하다' },
  { id: 'wz_elem', line: 'mage', name: '원소 학자', pitch: '상대 약점 속성으로 볼트를 갈아 낀다', weights: { int: 8, dex: 8 }, skills: ['fire_bolt', 'cold_bolt', 'lightning_bolt'], items: [], weak: '장비가 흩어진다 → 세트 수집' },
  // ── 궁수 → 헌터
  { id: 'hu_dex', line: 'archer', name: '명궁', pitch: 'DEX로 명중·피해를 한 번에. 화살 속성 교체', weights: { dex: 9, agi: 8, luk: 1 }, skills: ['double_strafe', 'owls_eye', 'vultures_eye'], items: ['w_huntbow'], weak: 'HP·회피가 낮다 → 앵클 스네어 · 대형 → 크기 카드' },
  { id: 'hu_intblitz', line: 'archer', name: '매 한 방', pitch: 'INT·DEX로 블리츠 비트 한 방. 명중·방어 무시', weights: { dex: 9, int: 8, agi: 2 }, skills: ['blitz_beat', 'steel_crow', 'falcon_eyes'], items: ['x_falconglove'], weak: 'SP 소모 → SP 회복 장비' },
  { id: 'hu_fist', line: 'archer', name: '주먹 매', pitch: '활을 내려놓고 맨손 초고속 평타로 오토 블리츠를 쏟아낸다', weights: { agi: 10, luk: 9, dex: 3 }, skills: ['falcon_eyes', 'blitz_beat', 'steel_crow'], items: ['x_falconknuckle', 'x_falconbell'], weak: '맨손이라 근접에 노출 → 회피 · 블리츠 타수는 잡 레벨 제한' },
  { id: 'hu_mob', line: 'archer', name: '몰이 매', pitch: '모아 놓고 블리츠 범위로 녹인다 (VIT·공속·LUK)', weights: { vit: 6, agi: 8, luk: 6, dex: 2 }, skills: ['falcon_eyes', 'blitz_beat', 'ankle_snare'], items: ['x_falconbell'], weak: '몰이 피해 → VIT·HP 카드' },
  { id: 'hu_trap', line: 'archer', name: '덫꾼', pitch: 'DEX·INT 고정 피해 덫. 공속·활과 무관', weights: { dex: 8, int: 6, vit: 5 }, skills: ['claymore_trap', 'ankle_snare'], items: [], weak: '덫 재료 비용' },
  { id: 'hu_shower', line: 'archer', name: '화살비 사수', pitch: '화살비 넉백 광역', weights: { dex: 8, agi: 5, vit: 4 }, skills: ['arrow_shower', 'double_strafe'], items: [], weak: '넉백이 몹을 흩뜨린다' },
  { id: 'hu_snipe', line: 'archer', name: '저격수', pitch: 'DEX·LUK 원거리 크리 저격, 보스 사냥', weights: { dex: 10, luk: 5 }, skills: ['double_strafe', 'vultures_eye'], items: [], weak: '근접에 약하다' },
  // ── 성직자 → 프리스트
  { id: 'pr_support', line: 'acolyte', name: '수호 사제', pitch: '힐·키리에·마그니피캇 — 파티의 생명줄', weights: { int: 9, vit: 8, dex: 4 }, skills: ['heal', 'kyrie', 'magnificat', 'blessing'], items: [], weak: '혼자서는 느리다 → 파티' },
  { id: 'pr_battle', line: 'acolyte', name: '철퇴 사제', pitch: '축복·속도 증가 셀프 버프 + 둔기 평타', weights: { str: 7, agi: 8, dex: 5, vit: 2 }, skills: ['blessing', 'increase_agi', 'impositio'], items: [], weak: '물리 스킬이 없다 → 버프로 메운다' },
  { id: 'pr_crit', line: 'acolyte', name: '광휘 크리 사제', pitch: '영광송 LUK로 크리 필중', weights: { agi: 8, luk: 7, str: 5 }, skills: ['gloria', 'increase_agi', 'blessing'], items: [], weak: '영광송 SP · 크리 저항 몹' },
  { id: 'pr_exorcist', line: 'acolyte', name: '퇴마 사제', pitch: '대퇴마로 불사·악마를 광역 정화', weights: { int: 9, dex: 8 }, skills: ['magnus', 'holy_light'], items: [], weak: '불사·악마에게만 — 망령 던전이 최고 효율' },
  { id: 'pr_heal', line: 'acolyte', name: '힐 폭격 사제', pitch: '힐이 불사에게는 성 피해', weights: { int: 9, vit: 6 }, skills: ['heal'], items: [], weak: '불사가 아니면 무력' },
  { id: 'pr_wall', line: 'acolyte', name: '방패 사제', pitch: '키리에를 두르고 버티는 탱 사제', weights: { vit: 9, int: 5, dex: 4 }, skills: ['kyrie', 'heal', 'angelus'], items: [], weak: '딜이 없다 → 파티' },
  // ── 도둑 → 어새신
  { id: 'as_crit', line: 'thief', name: '치명 카타르', pitch: '카타르 크리 ×2. DEX 없이 크리로 명중', weights: { str: 8, agi: 8, luk: 5 }, skills: ['katar_mastery', 'double_attack'], items: ['w_fangkatar'], weak: '크리 저항 몹 · HP' },
  { id: 'as_sonic', line: 'thief', name: '음속 카타르', pitch: '음속 일격 한 방', weights: { str: 9, agi: 8, dex: 4 }, skills: ['sonic_blow', 'katar_mastery'], items: ['x_sonicband'], weak: '빗나갈 수 있다 → DEX·명중 장비' },
  { id: 'as_dagger', line: 'thief', name: '쌍단검', pitch: '단검 이중 공격 + 크기 카드', weights: { str: 9, agi: 8, dex: 5 }, skills: ['double_attack'], items: [], weak: '대형에 50% → 대형 카드 필수' },
  { id: 'as_dodge', line: 'thief', name: '그림자 회피', pitch: '맞지 않는 탐색꾼', weights: { agi: 10, str: 6, dex: 4 }, skills: ['improve_dodge', 'double_attack'], items: ['g_shadowcape'], weak: '둘러싸이면 회피가 무너진다 · 망토의 대가(성 피해)' },
  { id: 'as_poison', line: 'thief', name: '맹독술사', pitch: '독을 쌓아 녹인다', weights: { str: 6, agi: 7, dex: 6, luk: 3 }, skills: ['envenom', 'enchant_poison'], items: ['w_viperfang'], weak: '불사·무형은 독에 걸리지 않는다' },
  { id: 'as_grim', line: 'thief', name: '그림자 이빨', pitch: '은신 광역', weights: { str: 8, agi: 6, dex: 5, vit: 3 }, skills: ['grimtooth', 'shadow_step'], items: [], weak: 'SP · 몰이 피해' },
  { id: 'as_steal', line: 'thief', name: '훔치기 상인', pitch: 'DEX·LUK로 훔치기 — 드랍 경제', weights: { dex: 8, agi: 6, luk: 5 }, skills: ['steal', 'double_attack'], items: [], weak: '화력이 약하다 → 파티' },
  // ── 상인 → 블랙스미스
  { id: 'bs_battle', line: 'merchant', name: '전투 대장장이', pitch: '아드레날린·과신 도끼', weights: { str: 9, agi: 8, dex: 4 }, skills: ['adrenaline', 'over_thrust', 'weapon_perfection'], items: [], weak: '느린 공속 → 아드레날린 · 빗나감 → 무기 연구' },
  { id: 'bs_cart', line: 'merchant', name: '카트 몰이', pitch: '카트 회전 광역', weights: { str: 8, vit: 7, dex: 3 }, skills: ['cart_revolution', 'pushcart'], items: [], weak: '몰이 피해 → VIT' },
  { id: 'bs_zeny', line: 'merchant', name: '금화 강타', pitch: '돈을 벌어 돈으로 때린다', weights: { str: 9, dex: 5, luk: 4 }, skills: ['mammonite', 'overcharge'], items: ['x_greedpouch'], weak: '제니 소모 → 바가지·자동 판매' },
  { id: 'bs_hammer', line: 'merchant', name: '해머 제압', pitch: '광역 기절로 파티 보조', weights: { vit: 7, dex: 6, str: 5 }, skills: ['hammer_fall'], items: [], weak: '보스에게 안 통한다' },
  { id: 'bs_ore', line: 'merchant', name: '광석 사냥꾼', pitch: '광석을 캐서 정련 경제를 돌린다', weights: { str: 7, dex: 5, luk: 6 }, skills: ['ore_discovery', 'weaponry_research'], items: [], weak: '화력 → 무기 연구' },
];

const LINE_OF: Record<ClassId, BuildDef['line'] | null> = {
  novice: null, swordsman: 'swordsman', knight: 'swordsman', mage: 'mage', wizard: 'mage', archer: 'archer', hunter: 'archer',
  acolyte: 'acolyte', priest: 'acolyte', thief: 'thief', assassin: 'thief', merchant: 'merchant', blacksmith: 'merchant',
};
export function buildsFor(cls: ClassId): BuildDef[] {
  const line = LINE_OF[cls];
  return line ? BUILDS.filter((b) => b.line === line) : [];
}
export function buildOf(cls: ClassId, id: string | undefined): BuildDef | undefined {
  return id ? buildsFor(cls).find((b) => b.id === id) : undefined;
}

// ───────────────────────── identity items, batch 1 (BUILD_TREE.md §3)
const ALL: ClassId[] = ['novice', 'swordsman', 'mage', 'archer', 'acolyte', 'thief', 'merchant'];
function add(d: Omit<ItemDef, 'kind'> & { kind?: ItemDef['kind'] }) {
  ITEMS[d.id] = { kind: 'equip', slots: 0, reqLv: 1, jobs: ALL, rarity: 'epic', ...d } as ItemDef;
}
add({ id: 'w_bloodmoon', name: '핏빛 달 요도', loc: 'weapon', wtype: 'sword2h', wlv: 3, atk: 150, twoHand: true, reqLv: 36, price: 90000, jobs: ['swordsman'], look: 'sword2h',
  bonus: { crit: 30, aspdPct: 8, selfCurse: 1 }, icon: { glyph: 'sword2h', color: '#ff6a7a' },
  desc: '달이 붉은 밤에 벼린 요도. 베는 자의 운까지 베어 먹는다.\n크리티컬 +30, 공격 속도 +8%\n평타 시 1% 확률로 자신에게 저주(10초 LUK 0·이동 −30%)\n빌드: 광월 크리 기사' });
add({ id: 'x_purify', name: '정화의 부적', loc: 'acc', def: 0, reqLv: 30, price: 30000, bonus: { statusRes: { curse: 100 }, luk: 1 },
  icon: { glyph: 'necklace', color: '#c8e8ff' }, desc: '망령이 꺼리는 은실로 엮은 부적.\n저주에 걸리지 않는다, LUK +1\n짝: 핏빛 달 요도' });
add({ id: 'x_falconglove', name: '매사냥꾼의 가죽 장갑', loc: 'acc', def: 0, reqLv: 24, price: 26000, slots: 1, bonus: { skillDmg: { blitz_beat: 20 }, blitzHits: 1 },
  icon: { glyph: 'glove', color: '#c89060' }, desc: '매가 앉아도 찢어지지 않는 두꺼운 장갑.\n블리츠 비트 피해 +20%, 블리츠 타수 +1\n빌드: 매 한 방' });
add({ id: 'x_falconknuckle', name: '매잡이 너클', loc: 'acc', def: 0, reqLv: 12, price: 14000, bonus: { unarmedAspdPct: 10, autoBlitzPct: 3 },
  icon: { glyph: 'hand', color: '#e0b070' }, desc: '맨주먹 사냥꾼의 손등 보호대. 무기를 들면 소용없다.\n맨손일 때 공격 속도 +10%, 오토 블리츠 확률 +3%\n빌드: 주먹 매' });
add({ id: 'x_falconbell', name: '행운의 매 방울', loc: 'acc', def: 0, reqLv: 28, price: 32000, slots: 1, bonus: { autoBlitzPct: 5, blitzRadius: 20, luk: 2 },
  icon: { glyph: 'brooch', color: '#ffd84a' }, desc: '달밤에 울리면 매가 더 크게 원을 그린다.\n오토 블리츠 확률 +5%, 블리츠 범위 +20, LUK +2\n빌드: 주먹 매 · 몰이 매' });
add({ id: 'w_fangkatar', name: '송곳니 카타르', loc: 'weapon', wtype: 'katar', wlv: 3, atk: 135, twoHand: true, slots: 3, reqLv: 44, price: 70000, jobs: ['thief'], look: 'katar',
  icon: { glyph: 'katar', color: '#e8d8b0' }, desc: '사막 자칼의 송곳니를 박아 넣은 카타르. 카드를 셋 품는다.\n빌드: 치명 카타르' });
add({ id: 'x_greedpouch', name: '탐욕의 금화 주머니', loc: 'acc', def: 0, reqLv: 18, price: 40000, bonus: { skillDmg: { mammonite: 30 }, zenyCostPct: 50 },
  icon: { glyph: 'coins', color: '#ffd040' }, desc: '던질수록 무거워지는 이상한 주머니.\n금화 강타 피해 +30%, 금화 강타 제니 소모 +50%\n빌드: 금화 강타' });
add({ id: 'x_sonicband', name: '음속의 손목 띠', loc: 'acc', def: 0, reqLv: 48, price: 45000, slots: 1, bonus: { skillDmg: { sonic_blow: 20 }, hit: 10 },
  icon: { glyph: 'clip', color: '#a0e0ff' }, desc: '바람을 가르는 손목 띠.\n음속 일격 피해 +20%, 명중 +10\n빌드: 음속 카타르' });
add({ id: 'w_spellhilt', name: '마력 깃든 칼자루', loc: 'weapon', wtype: 'sword', wlv: 2, atk: 85, slots: 1, reqLv: 28, price: 36000, jobs: ['novice', 'swordsman', 'thief', 'merchant'], look: 'sword',
  bonus: { int: 2, procs: [{ on: 'attack', chance: 15, cast: { skill: 'fire_bolt', lv: 3 } }] }, icon: { glyph: 'sword', color: '#d0a0ff' },
  desc: '고목 정령의 마력이 스민 칼자루.\nINT +2, 평타 시 15% 확률로 파이어 볼트 Lv 3 자동 시전\n빌드: 마검 기사' });
add({ id: 'g_shadowcape', name: '그림자 망토', loc: 'garment', def: 1, slots: 1, reqLv: 40, price: 50000, bonus: { flee: 20, eleRes: { holy: -50 } },
  icon: { glyph: 'cape', color: '#5a4a7a' }, desc: '망령 군주의 그림자를 잘라 만든 망토.\nFLEE +20, 받는 성속성 피해 +50%\n빌드: 그림자 회피' });
add({ id: 'x_whirlglove', name: '회오리 장갑', loc: 'acc', def: 0, slots: 1, reqLv: 34, price: 34000, bonus: { skillDmg: { bowling_bash: 20 }, str: 1 },
  icon: { glyph: 'glove', color: '#a0b0c0' }, desc: '채석장 거인이 바위를 굴리던 장갑.\n회전 강타 피해 +20%, STR +1\n빌드: 회전 몰이 기사' });
add({ id: 'w_viperfang', name: '독사의 송곳니', loc: 'weapon', wtype: 'dagger', wlv: 3, atk: 92, slots: 2, reqLv: 30, price: 42000, jobs: ['novice', 'swordsman', 'mage', 'archer', 'thief', 'merchant'], look: 'dagger',
  bonus: { procs: [{ on: 'attack', chance: 20, status: { kind: 'poison', dur: 8000 } }] }, element: 'poison', icon: { glyph: 'dagger', color: '#a0e080' },
  desc: '황금 코브라의 송곳니를 그대로 쓴 단검. 독속성.\n평타 시 20% 확률로 중독\n빌드: 맹독술사' });
add({ id: 'x_manaspring', name: '마나 샘 반지', loc: 'acc', def: 0, slots: 1, reqLv: 10, price: 12000, bonus: { spRegenPct: 30, maxSpPct: 5 },
  icon: { glyph: 'ring', color: '#80c0ff' }, desc: '샘물이 마르지 않는 반지.\nSP 회복 +30%, 최대 SP +5%\n빌드: 인덱 학자 · 폭풍 술사' });
add({ id: 'w_sagestaff', name: '현자의 지팡이', loc: 'weapon', wtype: 'staff', wlv: 3, atk: 35, matkPct: 10, slots: 4, reqLv: 30, price: 60000, jobs: ['novice', 'mage', 'acolyte'], look: 'staff',
  icon: { glyph: 'staff', color: '#c0a0ff' }, desc: '네 개의 홈이 파인 오래된 지팡이. 카드를 넷 품는다.\nMATK +10%\n빌드: 인덱 학자' });

/** where batch-1 identity items drop: [monster, item, rate] (bosses higher, a rare regular source for farming) */
const DROPS: [string, string, number][] = [
  ['boneknight', 'w_bloodmoon', 0.03], ['wraith', 'w_bloodmoon', 0.08], ['phantom', 'w_bloodmoon', 0.0003],
  ['wisp', 'x_purify', 0.0025], ['phantom', 'x_purify', 0.003],
  ['silverfang', 'x_falconglove', 0.04], ['firefly', 'x_falconglove', 0.0008],
  ['bunchief', 'x_falconknuckle', 0.03], ['hornbun', 'x_falconknuckle', 0.0003], ['moonbun', 'x_falconknuckle', 0.0015],
  ['moonfox', 'x_falconbell', 0.06], ['nightmoth', 'x_falconbell', 0.001],
  ['scorpking', 'w_fangkatar', 0.05], ['jackal', 'w_fangkatar', 0.0012],
  ['ratking', 'x_greedpouch', 0.04], ['coinbug', 'x_greedpouch', 0.0006],
  ['mummylord', 'x_sonicband', 0.05], ['mummy', 'x_sonicband', 0.0012],
  ['treant', 'w_spellhilt', 0.1], ['dryad', 'w_spellhilt', 0.0015],
  ['wraith', 'g_shadowcape', 0.08], ['phantom', 'g_shadowcape', 0.0008],
  ['quarrygolem', 'x_whirlglove', 0.05], ['rockworm', 'x_whirlglove', 0.001],
  ['cobra', 'w_viperfang', 0.0015], ['toxjelly', 'w_viperfang', 0.0003],
  ['sprout', 'x_manaspring', 0.001], ['puffball', 'x_manaspring', 0.0008],
  ['treant', 'w_sagestaff', 0.06], ['mandra', 'w_sagestaff', 0.0005],
];
for (const [mob, id, rate] of DROPS) {
  const m = MONSTERS[mob];
  if (!m || !ITEMS[id] || m.drops.some((d) => d.id === id)) continue;
  m.drops.push({ id, rate } satisfies Drop);
}
