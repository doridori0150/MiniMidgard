import type { Bonus, ClassId, ItemDef, WeaponType } from '../types.ts';

export const ITEMS: Record<string, ItemDef> = {};
function add(d: ItemDef) { ITEMS[d.id] = d; }

const ALL: ClassId[] = ['novice', 'swordsman', 'mage', 'archer', 'acolyte', 'thief', 'merchant'];
const NO_ACO: ClassId[] = ['novice', 'swordsman', 'mage', 'archer', 'thief', 'merchant'];
const WEAPON_JOBS: Record<WeaponType, ClassId[]> = {
  none: ALL,
  dagger: NO_ACO,
  sword: ['novice', 'swordsman', 'thief', 'merchant'],
  sword2h: ['swordsman'],
  spear: ['swordsman'],
  katar: ['assassin'],
  staff: ['novice', 'mage', 'acolyte'],
  bow: ['archer', 'thief'],
  mace: ['novice', 'swordsman', 'acolyte', 'merchant'],
  axe: ['novice', 'swordsman', 'merchant'],
};

function weapon(id: string, name: string, wtype: WeaponType, wlv: 1 | 2 | 3 | 4, atk: number, price: number, o: Partial<ItemDef> = {}) {
  add({
    id, name, kind: 'equip', loc: 'weapon', wtype, wlv, atk, price, slots: 0, reqLv: 1,
    jobs: WEAPON_JOBS[wtype], icon: { glyph: wtype, color: o.icon?.color ?? '#cfd6e0' },
    desc: o.desc ?? '', look: o.look ?? wtype, twoHand: wtype === 'bow' || wtype === 'sword2h' || o.twoHand, ...o,
  });
}
function armor(id: string, name: string, loc: ItemDef['loc'], def: number, price: number, o: Partial<ItemDef> = {}) {
  const glyph = loc === 'armor' ? 'armor' : loc === 'shield' ? 'shield' : loc === 'garment' ? 'cape' : loc === 'shoes' ? 'shoes' : 'ring';
  add({ id, name, kind: 'equip', loc, def, price, slots: 0, reqLv: 1, jobs: ALL, icon: { glyph, color: '#c9b08a' }, desc: '', ...o });
}
function head(id: string, name: string, loc: 'headTop' | 'headMid' | 'headLow', look: string, def: number, price: number, o: Partial<ItemDef> = {}) {
  add({ id, name, kind: 'equip', loc, def, price, slots: 0, reqLv: 1, jobs: ALL, look, icon: { glyph: 'hat:' + look }, desc: '', ...o });
}
function use(id: string, name: string, price: number, heal: ItemDef['heal'], glyph: string, color: string, desc: string) {
  add({ id, name, kind: 'use', price, heal, icon: { glyph, color }, desc });
}
function etc(id: string, name: string, price: number, glyph: string, color: string, desc: string, rarity?: ItemDef['rarity']) {
  add({ id, name, kind: 'etc', price: id.startsWith('r_') ? price : price * 2, icon: { glyph, color }, desc, rarity });
}
function card(mob: string, name: string, cardLoc: ItemDef['cardLoc'], prefix: string, bonus: Bonus, desc: string, rarity: ItemDef['rarity'] = 'rare') {
  add({ id: 'c_' + mob, name: name + ' 카드', kind: 'card', price: 20, cardLoc, prefix, bonus, icon: { glyph: 'card:' + mob }, desc, rarity });
}
function ammo(id: string, name: string, el: ItemDef['element'], atk: number, price: number, color: string, desc: string) {
  add({ id, name, kind: 'ammo', loc: 'ammo', element: el, atk, price, jobs: ['archer', 'thief'], icon: { glyph: 'arrow', color }, desc });
}

// ── 단검
weapon('w_knife', '나이프', 'dagger', 1, 17, 50, { desc: '날이 짧은 칼. 초보자의 친구.' });
weapon('w_cutter', '커터', 'dagger', 1, 30, 1250, { desc: '잘 드는 단검.' });
weapon('w_gauche', '방패단검', 'dagger', 1, 43, 2400, { desc: '막기에도 쓰는 묵직한 단검.' });
weapon('w_stiletto', '스틸레토', 'dagger', 2, 47, 8000, { reqLv: 12, desc: '찌르기에 특화된 가는 단검.' });
weapon('w_gladius', '글라디우스', 'dagger', 3, 70, 22000, { reqLv: 24, desc: '검투사의 단검.' });
weapon('w_damascus', '물결무늬 단검', 'dagger', 4, 118, 60000, { reqLv: 36, bonus: { crit: 5 }, icon: { glyph: 'dagger', color: '#a8e0ff' }, desc: '물결무늬가 새겨진 명검. 크리티컬 +5' });
// ── 한손검
weapon('w_sword', '검', 'sword', 1, 25, 100, { desc: '평범한 한손검.' });
weapon('w_falchion', '팔시온', 'sword', 1, 49, 1500, { reqLv: 2, desc: '휘어진 외날검.' });
weapon('w_blade', '블레이드', 'sword', 1, 53, 2900, { reqLv: 2, desc: '잘 벼려진 칼날.' });
weapon('w_saber', '세이버', 'sword', 2, 70, 9000, { reqLv: 14, desc: '기병의 검.' });
weapon('w_tsurugi', '쌍날검', 'sword', 3, 130, 50000, { reqLv: 30, bonus: { crit: 3 }, icon: { glyph: 'sword', color: '#ffe0a0' }, desc: '양날이 서 있는 고대의 검. 크리티컬 +3' });
// ── 양손검
weapon('w_katana', '카타나', 'sword2h', 1, 60, 2000, { reqLv: 4, desc: '날렵한 양손검.' });
weapon('w_bastard', '바스타드 소드', 'sword2h', 2, 115, 12000, { reqLv: 18, desc: '한 손 반 길이의 대검.' });
weapon('w_claymore', '클레이모어', 'sword2h', 3, 180, 60000, { reqLv: 33, icon: { glyph: 'sword2h', color: '#ffd6a0' }, desc: '거인의 대검.' });
// ── 지팡이
weapon('w_rod', '롯드', 'staff', 1, 15, 50, { matkPct: 15, desc: '마력이 깃든 가는 막대. MATK +15%' });
weapon('w_wand', '완드', 'staff', 1, 25, 1500, { matkPct: 15, bonus: { int: 1 }, desc: 'MATK +15%, INT +1' });
weapon('w_staff', '스태프', 'staff', 2, 40, 8000, { matkPct: 15, bonus: { int: 2 }, reqLv: 12, desc: 'MATK +15%, INT +2' });
weapon('w_arcwand', '아크 완드', 'staff', 3, 60, 25000, { matkPct: 15, bonus: { int: 3 }, reqLv: 24, desc: 'MATK +15%, INT +3' });
weapon('w_sage', '현자의 지팡이', 'staff', 4, 90, 80000, { matkPct: 20, bonus: { int: 5, castPct: 5 }, reqLv: 40, icon: { glyph: 'staff', color: '#d0b0ff' }, desc: 'MATK +20%, INT +5, 시전 -5%' });
// ── 활
weapon('w_bow', '활', 'bow', 1, 15, 400, { desc: '사냥용 짧은 활.' });
weapon('w_composite', '컴포지트 보우', 'bow', 1, 29, 2500, { desc: '여러 재료를 겹쳐 만든 활.' });
weapon('w_greatbow', '그레이트 보우', 'bow', 2, 50, 10000, { reqLv: 18, desc: '큰 활.' });
weapon('w_crossbow', '크로스보우', 'bow', 2, 65, 15000, { reqLv: 18, desc: '기계식 활.' });
weapon('w_gakkung', '각궁', 'bow', 3, 90, 40000, { reqLv: 30, bonus: { dex: 1 }, icon: { glyph: 'bow', color: '#ffc080' }, desc: '뿔로 만든 명궁. DEX +1' });
// ── 둔기
weapon('w_club', '클럽', 'mace', 1, 23, 60, { desc: '몽둥이.' });
weapon('w_mace', '메이스', 'mace', 1, 37, 1500, { desc: '쇠뭉치가 달린 둔기.' });
weapon('w_smasher', '스매셔', 'mace', 2, 54, 9000, { reqLv: 14, desc: '머리를 노리는 둔기.' });
weapon('w_morning', '모닝스타', 'mace', 3, 110, 45000, { reqLv: 30, icon: { glyph: 'mace', color: '#ffd080' }, desc: '가시 철퇴.' });
// ── 도끼
weapon('w_axe', '도끼', 'axe', 1, 38, 500, { desc: '나무꾼의 도끼.' });
weapon('w_battleaxe', '배틀 액스', 'axe', 1, 80, 5400, { reqLv: 3, desc: '전투용 도끼.' });
weapon('w_hammer', '대형 해머', 'axe', 2, 120, 30000, { reqLv: 24, twoHand: true, desc: '양손으로 휘두르는 해머.' });
weapon('w_buster', '버스터', 'axe', 3, 155, 70000, { reqLv: 30, twoHand: true, icon: { glyph: 'axe', color: '#ffb080' }, desc: '모든 것을 부수는 양손 도끼.' });

// ── 창 (검사·기사)
weapon('w_javelin', '자벨린', 'spear', 1, 28, 150, { desc: '던지기에도 좋은 가벼운 창.' });
weapon('w_spear', '스피어', 'spear', 1, 44, 1700, { desc: '기본적인 창.' });
weapon('w_pike', '파이크', 'spear', 2, 85, 12000, { reqLv: 24, desc: '자루가 긴 보병용 창.' });
weapon('w_partizan', '파르티잔', 'spear', 3, 160, 60000, { reqLv: 40, twoHand: true, desc: '날이 넓은 양손 창.' });
weapon('w_lance', '랜스', 'spear', 4, 210, 150000, { reqLv: 55, twoHand: true, bonus: { str: 2 }, icon: { glyph: 'spear', color: '#ffe0a0' }, desc: '기사의 상징인 기병창. STR +2' });
// ── 카타르 (어새신, 양손)
weapon('w_katar', '카타르', 'katar', 2, 110, 30000, { reqLv: 40, twoHand: true, desc: '주먹에 끼우는 칼날. 크리티컬 확률 2배.' });
weapon('w_jamadhar', '자마다르', 'katar', 2, 100, 40000, { reqLv: 40, twoHand: true, bonus: { crit: 3 }, desc: '가벼운 카타르. 크리티컬 +3' });
weapon('w_jur', '쥬르', 'katar', 3, 125, 70000, { reqLv: 45, twoHand: true, icon: { glyph: 'katar', color: '#d0e0ff' }, desc: '세 갈래 칼날의 카타르.' });
weapon('w_bloodfang', '피의 송곳니', 'katar', 4, 165, 250000, { reqLv: 60, twoHand: true, bonus: { crit: 8, lifeStealPct: 2 }, icon: { glyph: 'katar', color: '#ff7070' }, desc: '피를 머금은 카타르. 크리티컬 +8, HP 흡수 2%', rarity: 'mvp' });
// ── 고레벨 무기 (사막·설원 드롭)
weapon('w_sunblade', '태양의 검', 'sword', 4, 150, 200000, { reqLv: 55, element: 'holy', bonus: { int: 2 }, icon: { glyph: 'sword', color: '#fff3a0' }, desc: '성속성이 깃든 검. INT +2', rarity: 'epic' });
weapon('w_flamberge', '플랑베르주', 'sword2h', 4, 210, 220000, { reqLv: 55, element: 'fire', icon: { glyph: 'sword2h', color: '#ff9060' }, desc: '불꽃처럼 물결치는 대검. 불속성', rarity: 'epic' });
weapon('w_frostrod', '서리 지팡이', 'staff', 4, 70, 200000, { matkPct: 25, bonus: { int: 4, dex: 2 }, reqLv: 55, icon: { glyph: 'staff', color: '#9fe8ff' }, desc: 'MATK +25%, INT +4, DEX +2', rarity: 'epic' });
weapon('w_huntbow', '사냥꾼의 장궁', 'bow', 3, 120, 90000, { reqLv: 45, bonus: { dex: 2 }, icon: { glyph: 'bow', color: '#a0e080' }, desc: '먼 거리까지 닿는 장궁. DEX +2' });
weapon('w_goldmace', '황금 철퇴', 'mace', 4, 160, 180000, { reqLv: 55, bonus: { luk: 3 }, icon: { glyph: 'mace', color: '#ffd24a' }, desc: '파라오의 무덤에서 나온 철퇴. LUK +3', rarity: 'epic' });
weapon('w_titanaxe', '거인의 도끼', 'axe', 4, 220, 220000, { reqLv: 55, twoHand: true, bonus: { str: 3 }, icon: { glyph: 'axe', color: '#c0e0ff' }, desc: '설인왕이 휘두르던 도끼. STR +3', rarity: 'epic' });
// ── 사냥으로만 얻는 무기 (v0.3 지역 확장)
weapon('w_harpoon', '작살', 'spear', 2, 72, 9000, { reqLv: 18, bonus: { raceDmg: { fish: 15 } }, icon: { glyph: 'spear', color: '#9fd0e0' }, desc: '수로 장어를 잡던 작살. 어패형 몬스터에게 주는 피해 +15%' });
weapon('w_runeblade', '룬 블레이드', 'sword', 3, 145, 70000, { reqLv: 40, bonus: { hit: 5 }, icon: { glyph: 'sword', color: '#c8a8ff' }, desc: '광맥의 룬이 새겨진 검. HIT +5', rarity: 'rare' });
weapon('w_crystalwand', '수정 지팡이', 'staff', 3, 55, 60000, { matkPct: 18, bonus: { int: 3, dex: 1 }, reqLv: 38, icon: { glyph: 'staff', color: '#e0a8ff' }, desc: 'MATK +18%, INT +3, DEX +1', rarity: 'rare' });
weapon('w_frostbrand', '서리 칼날', 'sword', 4, 170, 220000, { reqLv: 62, bonus: { eleDmg: { water: 15 } }, icon: { glyph: 'sword', color: '#bfefff' }, desc: '얼음을 아는 칼날. 물속성 몬스터에게 주는 피해 +15%', rarity: 'epic' });
weapon('w_glacierblade', '빙하 대검', 'sword2h', 4, 245, 260000, { reqLv: 68, bonus: { str: 2, sizeDmg: { large: 10 } }, icon: { glyph: 'sword2h', color: '#9fd8ff' }, desc: '빙하를 깎아 만든 대검. STR +2, 대형 몬스터에게 주는 피해 +10%', rarity: 'epic' });
weapon('w_icekatar', '빙결 카타르', 'katar', 4, 175, 260000, { reqLv: 66, twoHand: true, bonus: { crit: 4, eleDmg: { water: 10 } }, icon: { glyph: 'katar', color: '#a8e8ff' }, desc: '크리티컬 +4, 물속성 몬스터에게 주는 피해 +10%', rarity: 'epic' });
weapon('w_icefang', '서리 송곳니', 'dagger', 4, 130, 200000, { reqLv: 64, bonus: { crit: 5, agi: 2 }, icon: { glyph: 'dagger', color: '#d8f4ff' }, desc: '빙령의 송곳니를 갈아 만든 단검. 크리티컬 +5, AGI +2', rarity: 'epic' });
weapon('w_stormbow', '폭풍의 활', 'bow', 4, 150, 240000, { reqLv: 64, element: 'wind', bonus: { dex: 2 }, icon: { glyph: 'bow', color: '#c8f0ff' }, desc: '눈보라를 품은 활. 바람속성, DEX +2 (속성 화살이 우선)', rarity: 'epic' });
weapon('w_aurorabow', '오로라 장궁', 'bow', 4, 165, 320000, { reqLv: 72, bonus: { dex: 3, crit: 3 }, icon: { glyph: 'bow', color: '#a0ffd8' }, desc: '밤하늘의 빛을 꼬아 만든 시위. DEX +3, 크리티컬 +3', rarity: 'epic' });
weapon('w_starmace', '별의 철퇴', 'mace', 4, 175, 300000, { reqLv: 72, element: 'holy', bonus: { int: 2 }, icon: { glyph: 'mace', color: '#fff0a0' }, desc: '호수에 떨어진 별을 박은 철퇴. 성속성, INT +2', rarity: 'epic' });

// ── 갑옷
armor('a_cotton', '면 셔츠', 'armor', 1, 10, { desc: '얇은 면 셔츠.' });
armor('a_jacket', '가죽 재킷', 'armor', 2, 200, { desc: '질긴 가죽 상의.' });
armor('a_adventure', '모험가 슈트', 'armor', 3, 1000, { desc: '모험가 협회 지급품.' });
armor('a_wooden', '나무 갑옷', 'armor', 4, 5000, { reqLv: 10, desc: '나무판을 덧댄 갑옷.' });
armor('a_mantle', '맨틀', 'armor', 4, 7000, { reqLv: 10, desc: '두꺼운 망토형 상의.' });
armor('a_silk', '실크 로브', 'armor', 3, 8000, { mdef: 10, jobs: ['mage', 'acolyte'], reqLv: 12, icon: { glyph: 'robe', color: '#b090e0' }, desc: '마력이 잘 흐르는 비단 로브. MDEF +10' });
armor('a_tights', '타이츠', 'armor', 3, 8000, { bonus: { dex: 1 }, jobs: ['archer'], reqLv: 12, icon: { glyph: 'armor', color: '#8fd080' }, desc: '궁수용 몸에 붙는 옷. DEX +1' });
armor('a_thief', '도적 의복', 'armor', 4, 9000, { bonus: { agi: 1 }, jobs: ['thief'], reqLv: 12, icon: { glyph: 'armor', color: '#9080b0' }, desc: '움직임이 가벼운 옷. AGI +1' });
armor('a_saint', '성의', 'armor', 5, 20000, { mdef: 5, jobs: ['acolyte'], reqLv: 20, icon: { glyph: 'robe', color: '#f0f0ff' }, desc: '축복받은 성직자의 옷. MDEF +5' });
armor('a_chain', '체인 메일', 'armor', 8, 25000, { jobs: ['swordsman', 'merchant'], reqLv: 20, icon: { glyph: 'armor', color: '#b0c0d0' }, desc: '쇠고리를 엮은 갑옷.' });
armor('a_plate', '플레이트 아머', 'armor', 10, 80000, { jobs: ['swordsman'], reqLv: 40, icon: { glyph: 'armor', color: '#d0e0f0' }, desc: '기사의 판금 갑옷.' });
armor('a_knight', '기사의 판금갑옷', 'armor', 12, 90000, { jobs: ['knight'], reqLv: 45, bonus: { vit: 1 }, icon: { glyph: 'armor', color: '#b8c8f0' }, desc: '기사단 정식 갑옷. VIT +1' });
armor('a_wizard', '마도사의 로브', 'armor', 5, 80000, { mdef: 15, jobs: ['wizard'], reqLv: 45, bonus: { int: 2 }, icon: { glyph: 'robe', color: '#7a5ad8' }, desc: 'INT +2, MDEF +15' });
armor('a_hunter', '사냥꾼의 가죽옷', 'armor', 7, 80000, { jobs: ['hunter'], reqLv: 45, bonus: { dex: 2 }, icon: { glyph: 'armor', color: '#6ab060' }, desc: 'DEX +2' });
armor('a_priest', '사제복', 'armor', 6, 80000, { mdef: 10, jobs: ['priest'], reqLv: 45, bonus: { int: 1, vit: 1 }, icon: { glyph: 'robe', color: '#fff4e0' }, desc: 'INT +1, VIT +1, MDEF +10' });
armor('a_assassin', '그림자 의복', 'armor', 6, 80000, { jobs: ['assassin'], reqLv: 45, bonus: { agi: 2, flee: 5 }, icon: { glyph: 'armor', color: '#5a3a7a' }, desc: 'AGI +2, FLEE +5' });
armor('a_smith', '장인의 앞치마', 'armor', 8, 80000, { jobs: ['blacksmith'], reqLv: 45, bonus: { str: 2 }, icon: { glyph: 'armor', color: '#c08a50' }, desc: 'STR +2' });
armor('a_bearhide', '곰가죽 갑옷', 'armor', 6, 22000, { reqLv: 26, bonus: { maxHp: 150 }, icon: { glyph: 'armor', color: '#a07040' }, desc: '꿀곰의 두툼한 가죽. 누구나 입을 수 있다. 최대 HP +150' });
// ── 방패
const SHIELD_JOBS: ClassId[] = ['novice', 'swordsman', 'acolyte', 'thief', 'merchant'];
armor('s_guard', '가드', 'shield', 3, 500, { jobs: SHIELD_JOBS, desc: '작은 원형 방패.' });
armor('s_buckler', '버클러', 'shield', 4, 14000, { jobs: ['swordsman', 'acolyte', 'thief', 'merchant'], reqLv: 14, desc: '팔에 차는 둥근 방패.' });
armor('s_shield', '실드', 'shield', 6, 50000, { jobs: ['swordsman', 'merchant'], reqLv: 30, desc: '튼튼한 철제 방패.' });
armor('s_crabshield', '게딱지 방패', 'shield', 5, 40000, { jobs: SHIELD_JOBS, reqLv: 40, bonus: { eleRes: { water: 10 } }, icon: { glyph: 'shield', color: '#ff8a6a' }, desc: '오아시스 게의 등껍질. 받는 물속성 피해 -10%' });
armor('s_mirror', '거울 방패', 'shield', 7, 90000, { jobs: SHIELD_JOBS, reqLv: 60, mdef: 8, icon: { glyph: 'shield', color: '#d8f0ff' }, desc: '얼음처럼 맑은 방패. MDEF +8', rarity: 'rare' });
// ── 걸치기
armor('g_hood', '후드', 'garment', 1, 120, { desc: '머리까지 덮는 천.' });
armor('g_muffler', '머플러', 'garment', 2, 5000, { reqLv: 8, desc: '따뜻한 목도리.' });
armor('g_manteau', '망토', 'garment', 4, 30000, { reqLv: 20, desc: '모험가의 망토.' });
armor('g_feather', '깃털 망토', 'garment', 5, 60000, { reqLv: 45, bonus: { agi: 1 }, icon: { glyph: 'cape', color: '#e8f0ff' }, desc: '바람처럼 가벼운 망토. AGI +1' });
armor('g_moonveil', '달빛 베일', 'garment', 3, 30000, { reqLv: 26, mdef: 5, bonus: { flee: 4 }, icon: { glyph: 'cape', color: '#c8c8ff' }, desc: '달빛을 짜서 만든 베일. FLEE +4, MDEF +5', rarity: 'rare' });
armor('g_ragcape', '넝마 망토', 'garment', 2, 25000, { reqLv: 35, bonus: { flee: 7 }, icon: { glyph: 'cape', color: '#7a7a8a' }, desc: '갱도 망령이 걸치던 넝마. 가볍게 흩날린다. FLEE +7' });
// ── 신발
armor('f_sandals', '샌들', 'shoes', 1, 400, { desc: '가벼운 샌들.' });
armor('f_shoes', '신발', 'shoes', 2, 3500, { reqLv: 8, desc: '튼튼한 가죽 신발.' });
armor('f_boots', '부츠', 'shoes', 4, 20000, { reqLv: 24, desc: '무릎까지 오는 장화.' });
armor('f_greaves', '그리브', 'shoes', 5, 60000, { reqLv: 45, bonus: { maxHpPct: 3 }, icon: { glyph: 'shoes', color: '#b0c0d8' }, desc: '강철 정강이 받이. 최대 HP +3%' });
// ── 액세서리
armor('x_clip', '클립', 'acc', 0, 1200, { slots: 1, bonus: { maxSp: 10 }, icon: { glyph: 'clip', color: '#d0d0e0' }, desc: '카드를 꽂기 좋은 클립. SP +10' });
armor('x_ring', '용사의 반지', 'acc', 0, 30000, { bonus: { str: 2 }, icon: { glyph: 'ring', color: '#ff8080' }, desc: 'STR +2' });
armor('x_brooch', '브로치', 'acc', 0, 30000, { bonus: { agi: 2 }, icon: { glyph: 'brooch', color: '#80e0b0' }, desc: 'AGI +2' });
armor('x_necklace', '목걸이', 'acc', 0, 30000, { bonus: { vit: 2 }, icon: { glyph: 'necklace', color: '#e0c080' }, desc: 'VIT +2' });
armor('x_earring', '귀걸이', 'acc', 0, 30000, { bonus: { int: 2 }, icon: { glyph: 'earring', color: '#a0b0ff' }, desc: 'INT +2' });
armor('x_glove', '장갑', 'acc', 0, 30000, { bonus: { dex: 2 }, icon: { glyph: 'glove', color: '#e0b080' }, desc: 'DEX +2' });
armor('x_rosary', '로자리', 'acc', 0, 30000, { bonus: { luk: 2, mdef: 3 }, icon: { glyph: 'rosary', color: '#f0e0a0' }, desc: 'LUK +2, MDEF +3' });
// 맵 특산 장신구 — 같은 이름의 [1] 슬롯 변종이 더 드물게 떨어진다
armor('x_clover', '네잎클로버', 'acc', 0, 16000, { bonus: { luk: 1, crit: 3 }, icon: { glyph: 'brooch', color: '#6ad06a' }, desc: '네잎 언덕에서만 자라는 행운. LUK +1, 크리티컬 +3', rarity: 'rare' });
armor('x_bell', '은방울', 'acc', 0, 30000, { bonus: { agi: 1, flee: 6 }, icon: { glyph: 'earring', color: '#e0e8ff' }, desc: '달밤에만 울리는 방울. AGI +1, FLEE +6', rarity: 'rare' });
armor('x_minerglove', '광부의 장갑', 'acc', 0, 40000, { bonus: { str: 1, dex: 1, atk: 5 }, icon: { glyph: 'glove', color: '#c8a070' }, desc: '봉인된 광맥에서 나온 낡은 장갑. STR +1, DEX +1, ATK +5', rarity: 'rare' });
armor('x_scarab', '스카라베 부적', 'acc', 0, 40000, { bonus: { vit: 1, def: 2, mdef: 2 }, icon: { glyph: 'brooch', color: '#ffd24a' }, desc: '피라미드의 황금 풍뎅이 부적. VIT +1, DEF +2, MDEF +2', rarity: 'rare' });
armor('x_jellyring', '말랑 반지', 'acc', 0, 35000, { bonus: { maxHpPct: 5, hpRegenPct: 15 }, icon: { glyph: 'ring', color: '#ff9ac8' }, desc: '말랑하게 늘어나는 반지. 최대 HP +5%, HP 회복 +15%', rarity: 'rare' });
armor('x_starring', '별빛 반지', 'acc', 0, 120000, { bonus: { allStats: 1, maxSpPct: 5 }, icon: { glyph: 'ring', color: '#fff0a0' }, desc: '호수에 잠든 별빛이 깃든 반지. 모든 스탯 +1, 최대 SP +5%', rarity: 'epic' });

// ── 머리 (상/중/하단) — 외형에 그대로 보입니다
head('h_flower', '꽃 머리핀', 'headTop', 'flower', 0, 400, { mdef: 1, desc: '들꽃 머리핀. MDEF +1' });
head('h_ribbon', '리본', 'headTop', 'ribbon', 1, 1200, { mdef: 3, desc: '커다란 리본. MDEF +3' });
head('h_cap', '캡', 'headTop', 'cap', 2, 2000, { desc: '챙이 있는 모자.' });
head('h_bandana', '반다나', 'headTop', 'bandana', 1, 1000, { desc: '머리에 묶는 천.' });
head('h_wizard', '마법사 모자', 'headTop', 'witch', 1, 8000, { mdef: 5, bonus: { int: 1 }, jobs: ['mage'], desc: '뾰족한 마법사 모자. INT +1, MDEF +5' });
head('h_helm', '헬름', 'headTop', 'helm', 4, 30000, { jobs: ['swordsman', 'merchant'], reqLv: 24, desc: '쇠 투구.' });
head('h_bunny', '토끼 머리띠', 'headTop', 'bunny', 2, 15000, { mdef: 5, bonus: { luk: 1 }, desc: '뿔토끼 대장이 아끼던 머리띠. LUK +1, MDEF +5', rarity: 'rare' });
head('h_cat', '고양이 머리띠', 'headTop', 'cat', 2, 15000, { mdef: 5, bonus: { agi: 1 }, desc: '쫑긋한 고양이 귀. AGI +1, MDEF +5', rarity: 'rare' });
head('h_mushroom', '버섯 모자', 'headTop', 'mushroom', 2, 6000, { bonus: { vit: 1 }, desc: '폭신한 버섯 갓. VIT +1' });
head('h_jelly', '말랑 모자', 'headTop', 'jellyhat', 1, 50000, { bonus: { luk: 2 }, desc: '머리 위에서 말랑이가 졸고 있다. LUK +2', rarity: 'epic' });
head('h_apple', '머리 위의 사과', 'headTop', 'apple', 1, 20000, { bonus: { dex: 3 }, desc: '명사수의 상징. DEX +3', rarity: 'rare' });
head('h_tiara', '티아라', 'headTop', 'tiara', 2, 40000, { mdef: 3, bonus: { int: 2 }, desc: '보석 박힌 관. INT +2, MDEF +3', rarity: 'rare' });
head('h_bonehelm', '뼈 투구', 'headTop', 'bonehelm', 6, 60000, { reqLv: 35, alsoHead: ['headMid'], desc: '해골 기사의 투구. 상단+중단을 차지', rarity: 'epic' });
head('h_crown', '말랑 왕관', 'headTop', 'crown', 3, 120000, { bonus: { int: 2, luk: 2 }, mdef: 5, desc: '말랑 대왕의 왕관. INT +2, LUK +2', rarity: 'mvp' });
head('h_angel', '천사날개 머리띠', 'headTop', 'angel', 2, 150000, { bonus: { allStats: 1 }, mdef: 3, desc: '하얀 날개가 달린 머리띠. 모든 스탯 +1', rarity: 'mvp' });
head('h_horns', '망령의 뿔', 'headTop', 'horns', 4, 200000, { bonus: { str: 2, int: 2 }, desc: '망령 군주의 뿔. STR +2, INT +2', rarity: 'mvp' });
head('m_glasses', '안경', 'headMid', 'glasses', 0, 4000, { desc: '동그란 안경.' });
head('m_sunglasses', '선글라스', 'headMid', 'sunglasses', 0, 8000, { desc: '멋쟁이 필수품.' });
head('m_goggles', '고글', 'headMid', 'goggles', 2, 12000, { desc: '이마에 거는 고글.' });
head('m_eyepatch', '안대', 'headMid', 'eyepatch', 0, 9000, { desc: '해적풍 안대.' });
head('m_blush', '홍조', 'headMid', 'blush', 0, 6000, { desc: '수줍은 볼터치.' });
head('l_pipe', '파이프', 'headLow', 'pipe', 0, 5000, { desc: '멋으로 무는 파이프.' });
head('l_mask', '마스크', 'headLow', 'mask', 1, 6000, { desc: '입을 가리는 마스크.' });
head('l_rose', '장미 한 송이', 'headLow', 'rose', 0, 8000, { bonus: { luk: 1 }, desc: '입에 문 장미. LUK +1' });
head('l_scarf', '목도리', 'headLow', 'scarf', 1, 4000, { desc: '목에 감는 목도리.' });
// 맵 특산 머리 장비 — 사냥해서만 얻는다 (외형 그대로 보임)
head('h_leaf', '풀잎', 'headTop', 'leaf', 1, 3000, { bonus: { hpRegenPct: 15 }, desc: '머리 위에서 새싹이 살랑살랑. 네잎 언덕의 새싹 정령이 가끔 떨군다. HP 회복 +15%', rarity: 'rare' });
head('m_hairpin', '별 머리핀', 'headMid', 'hairpin', 0, 6000, { bonus: { dex: 1, luk: 1 }, desc: '무당벌레가 모아 둔 반짝이 머리핀. 다른 머리 장비와 함께 꽂힌다. DEX +1, LUK +1', rarity: 'rare' });
head('m_moonpin', '달빛 머리핀', 'headMid', 'hairpin', 0, 30000, { mdef: 2, bonus: { agi: 1, luk: 2 }, desc: '달토끼가 떨어뜨린 은빛 머리핀. AGI +1, LUK +2, MDEF +2', rarity: 'epic' });
head('m_minergog', '광부 고글', 'headMid', 'goggles', 1, 12000, { bonus: { dex: 1, hit: 3 }, desc: '흙먼지 속에서도 잘 보이는 고글. DEX +1, HIT +3' });
head('m_jellyblush', '말랑 홍조', 'headMid', 'blush', 0, 12000, { bonus: { luk: 1, maxHpPct: 3 }, desc: '무지개 말랑처럼 볼이 발그레. LUK +1, 최대 HP +3%', rarity: 'rare' });
head('m_oasisglass', '오아시스 선글라스', 'headMid', 'sunglasses', 0, 15000, { bonus: { flee: 2, eleRes: { fire: 5 } }, desc: '신기루를 꿰뚫어 보는 선글라스. FLEE +2, 받는 불속성 피해 -5%' });
head('m_piratepatch', '해적 안대', 'headMid', 'eyepatch', 0, 15000, { bonus: { str: 1, dex: 1 }, desc: '오아시스 게가 어디선가 주워 온 안대. STR +1, DEX +1' });
head('l_bandmask', '붕대 마스크', 'headLow', 'mask', 1, 12000, { bonus: { raceRes: { undead: 5 } }, desc: '미라 붕대를 감아 만든 마스크. 불사형에게 받는 피해 -5%' });
head('l_foremanpipe', '십장의 곰방대', 'headLow', 'pipe', 0, 20000, { bonus: { str: 1, vit: 1 }, desc: '해골 십장이 물고 있던 곰방대. STR +1, VIT +1', rarity: 'rare' });
head('l_snowscarf', '눈꽃 목도리', 'headLow', 'scarf', 1, 15000, { bonus: { eleRes: { water: 5 } }, desc: '눈토끼 털로 짠 목도리. 받는 물속성 피해 -5%' });
head('h_moonbunny', '달토끼 머리띠', 'headTop', 'bunny', 2, 40000, { mdef: 5, bonus: { luk: 2, agi: 1 }, desc: '월광 여우가 지키던 하얀 귀. LUK +2, AGI +1, MDEF +5', rarity: 'epic' });
head('h_sunwing', '태양 날개 머리띠', 'headTop', 'angel', 2, 150000, { mdef: 3, bonus: { str: 2, int: 2, eleRes: { fire: 10 } }, desc: '모래에 묻힌 신전의 신관이 쓰던 금빛 날개. STR +2, INT +2, 받는 불속성 피해 -10%', rarity: 'mvp' });
head('h_aurora', '오로라 티아라', 'headTop', 'tiara', 2, 200000, { mdef: 6, bonus: { int: 3, maxSpPct: 10 }, desc: '별이 잠든 호수의 빛을 담은 관. INT +3, 최대 SP +10%, MDEF +6', rarity: 'mvp' });

// ── 화살통
ammo('am_arrow', '화살통', 'neutral', 25, 100, '#c9b08a', '평범한 화살 다발. (무속성)');
ammo('am_fire', '불화살통', 'fire', 30, 1500, '#ff7040', '불붙은 화살. (불속성)');
ammo('am_crystal', '수정 화살통', 'water', 30, 1500, '#60b0ff', '얼음 수정 화살. (물속성)');
ammo('am_stone', '돌 화살통', 'earth', 30, 1500, '#c09050', '돌촉 화살. (땅속성)');
ammo('am_wind', '바람 화살통', 'wind', 30, 1500, '#90e070', '바람을 가르는 화살. (바람속성)');
ammo('am_silver', '은화살통', 'holy', 30, 3000, '#f0f0ff', '축복받은 은 화살. (성속성)');

// ── 소비
use('u_red', '빨간 포션', 50, { hp: [45, 65] }, 'potion', '#ff4a4a', 'HP 45~65 회복');
use('u_orange', '주황 포션', 200, { hp: [105, 145] }, 'potion', '#ff9a3a', 'HP 105~145 회복');
use('u_yellow', '노란 포션', 550, { hp: [175, 235] }, 'potion', '#ffd84a', 'HP 175~235 회복');
use('u_white', '하얀 포션', 1200, { hp: [325, 405] }, 'potion', '#f4f4f4', 'HP 325~405 회복');
use('u_blue', '파란 포션', 2500, { sp: [40, 60] }, 'potion', '#4a7aff', 'SP 40~60 회복');
use('u_apple', '사과', 15, { hp: [16, 22] }, 'apple', '#ff5050', 'HP 16~22 회복');
use('u_meat', '고기', 60, { hp: [70, 100] }, 'meat', '#d08060', 'HP 70~100 회복');
use('u_honey', '꿀', 300, { hp: [70, 100], sp: [20, 40] }, 'honey', '#ffc040', 'HP 70~100, SP 20~40 회복');
add({ id: 'u_conc', name: '집중 물약', kind: 'use', price: 800, icon: { glyph: 'flask', color: '#ff9a3a' }, desc: '3분간 파티 전원의 공격 속도 +10%', buff: { id: 'pot_aspd', name: '집중', dur: 180_000, bonus: { aspdPct: 10 } } });
add({ id: 'u_awake', name: '각성 물약', kind: 'use', price: 2200, icon: { glyph: 'flask', color: '#5ad0ff' }, desc: '3분간 파티 전원의 공격 속도 +15% (집중 물약과 중복 불가)', buff: { id: 'pot_aspd', name: '각성', dur: 180_000, bonus: { aspdPct: 15 } } });
for (const [el, ko, color] of [['fire', '불', '#ff6a3d'], ['water', '물', '#4aa8ff'], ['earth', '땅', '#c09050'], ['wind', '바람', '#7bd96a']] as const) {
  add({ id: 'u_conv_' + el, name: `${ko}의 주문서`, kind: 'use', price: 1500, icon: { glyph: 'scroll', color }, desc: `5분간 파티 전원의 무기에 ${ko}속성 부여 (다른 주문서와 중복 불가)`, buff: { id: 'endow', name: `${ko}속성`, dur: 300_000, bonus: { weaponElement: el } } });
}
use('u_royal', '로열 젤리', 3000, { hp: [325, 405], sp: [40, 60] }, 'royal', '#fff0a0', 'HP 325~405, SP 40~60 회복');
use('u_berry', '산딸기', 30, { hp: [30, 45] }, 'apple', '#e0405a', '숲길에 열린 새콤한 산딸기. HP 30~45 회복');
use('u_cactus', '선인장 즙', 400, { hp: [90, 130], sp: [10, 20] }, 'potion', '#8ad06a', '선인장 병정에게서 짜낸 즙. HP 90~130, SP 10~20 회복');
use('u_moonmochi', '달떡', 1500, { hp: [220, 280], sp: [25, 35] }, 'honey', '#f4f0ff', '달토끼가 빚은 하얀 떡. HP 220~280, SP 25~35 회복');

// ── 정련 재료
etc('r_phra', '하급 정련석', 200, 'ore', '#c8b098', '무기 레벨 1 정련에 사용합니다.');
etc('r_emver', '중급 정련석', 1000, 'ore', '#90b8d8', '무기 레벨 2 정련에 사용합니다.');
etc('r_ori', '별철', 5000, 'ore', '#b0a0ff', '무기 레벨 3·4 정련에 쓰는 귀한 금속.', 'rare');
etc('r_elu', '수호석', 5000, 'ore', '#80ffe0', '방어구 정련에 쓰는 신비한 돌.', 'rare');

// ── 잡템
etc('e_jelly', '젤리 조각', 6, 'jelly', '#ff9ab0', '말랑이에게서 떨어진 말랑한 조각.');
etc('e_sticky', '끈적한 점액', 14, 'drop', '#b0e070', '손에 달라붙는 점액.');
etc('e_fur', '토끼 털', 20, 'fur', '#f4f0e8', '보송보송한 털 뭉치.');
etc('e_horn', '작은 뿔', 40, 'horn', '#e8d8b0', '뿔토끼의 작은 뿔.');
etc('e_shell', '애벌레 껍질', 24, 'shell', '#a8d070', '단단해진 허물.');
etc('e_spore', '버섯 포자', 30, 'spore', '#e08070', '가루가 날린다.');
etc('e_toxin', '독 주머니', 60, 'drop', '#a060d0', '찰랑찰랑 독이 든 주머니.');
etc('e_stinger', '벌침', 90, 'stinger', '#ffd040', '아주 뾰족하다.');
etc('e_claw', '늑대 발톱', 110, 'claw', '#d8d0c0', '날카로운 발톱.');
etc('e_leather', '짐승 가죽', 70, 'leather', '#b08050', '무두질 전의 가죽.');
etc('e_root', '나무 뿌리', 60, 'root', '#a07850', '꿈틀대던 뿌리.');
etc('e_petal', '꽃잎', 50, 'petal', '#ff9ad0', '향기로운 꽃잎.');
etc('e_moss', '이끼', 80, 'leaf', '#70b060', '촉촉한 이끼 덩어리.');
etc('e_bone', '뼈 조각', 160, 'bone', '#f0ecd8', '오래된 뼈.');
etc('e_bandage', '낡은 붕대', 140, 'bandage', '#d8d0b0', '누렇게 바랜 붕대.');
etc('e_batwing', '박쥐 날개', 120, 'batwing', '#705870', '얇은 막으로 된 날개.');
etc('e_ectoplasm', '유령 천', 300, 'cloth', '#c8f0ff', '손에 잡히지 않을 듯한 천.');
etc('e_gem', '빛나는 보석', 4000, 'gem', '#ff60a0', '상점에 비싸게 팔 수 있다.', 'rare');
etc('e_kingjelly', '왕 젤리', 3000, 'jelly', '#ffd040', '대왕님의 귀한 젤리.', 'rare');
etc('e_silverfur', '은빛 털가죽', 6000, 'fur', '#e0e8ff', '은빛으로 빛나는 털가죽.', 'rare');
etc('e_branch', '고목 가지', 9000, 'root', '#90c070', '수백 년 묵은 가지.', 'rare');
etc('e_darkcrystal', '어둠의 결정', 12000, 'gem', '#8050c0', '망령의 힘이 서린 결정.', 'rare');

etc('e_sand', '모래 주머니', 180, 'drop', '#e0c890', '고운 모래가 가득하다.');
etc('e_stingtail', '전갈 꼬리', 260, 'stinger', '#d06a3a', '독침이 달린 꼬리.');
etc('e_fang', '자칼 이빨', 240, 'claw', '#f0e0c0', '날카로운 송곳니.');
etc('e_golemcore', '골렘의 핵', 420, 'gem', '#c09050', '골렘을 움직이던 돌.');
etc('e_snowflake', '눈꽃 결정', 300, 'gem', '#e0f4ff', '녹지 않는 눈꽃.');
etc('e_yetifur', '설인 털', 380, 'fur', '#f4f8ff', '따뜻한 흰 털.');
etc('e_icecore', '서리 핵', 520, 'gem', '#9fe0ff', '차가운 기운이 흘러나온다.');
etc('e_pharaohmask', '파라오의 가면', 20000, 'gem', '#ffd24a', '황금 가면 조각.', 'rare');
etc('e_frostheart', '서리 마녀의 심장', 30000, 'gem', '#bfefff', '얼어붙은 심장.', 'rare');

// ── 잡템 (v0.3) — 몬스터마다 고유 잡템 하나 (모자 장인 레시피 재료 후보)
// 햇살 평원
etc('e_milktooth', '꼬마 늑대의 젖니', 40, 'claw', '#fff4e0', '빠진 지 얼마 안 된 작은 이빨.');
etc('e_chiefhorn', '대장 토끼의 뿔', 800, 'horn', '#ffe0a0', '뿔토끼 대장의 반질반질한 뿔.', 'rare');
etc('e_spotshell', '점박이 등껍질', 25, 'shell', '#ff5a4a', '빨간 바탕에 까만 점.');
etc('e_sprout', '새싹', 20, 'leaf', '#9ae070', '아직 흙냄새가 나는 여린 새싹.');
etc('e_fluff', '민들레 솜털', 30, 'fur', '#fffbe8', '후 불면 멀리 날아간다.');
etc('e_rattail', '쥐꼬리', 30, 'root', '#c0a090', '가늘고 길다. 별로 만지고 싶지 않다.');
etc('e_leech', '끈끈한 빨판', 35, 'drop', '#6a8a6a', '아직도 무언가에 달라붙으려 한다.');
etc('e_coin', '녹슨 동전', 220, 'gem', '#d0b060', '동전벌레가 모아 둔 옛날 동전. 상점에서 꽤 쳐준다.');
etc('e_ratking', '쥐왕의 금니', 1500, 'claw', '#ffd040', '수로 쥐왕이 자랑하던 금니.', 'rare');
etc('e_wetjelly', '물먹은 젤리', 28, 'jelly', '#7ac8f0', '꾹 누르면 물이 배어 나온다.');
etc('e_eelskin', '장어 껍질', 60, 'leather', '#3a6a8a', '미끌미끌한 가죽.');
// 속삭이는 숲
etc('e_bigspore', '큰 버섯 갓', 45, 'spore', '#c8a0ff', '사람 머리만 한 보라색 갓.');
etc('e_glowdust', '반딧불 가루', 90, 'gem', '#e8ff70', '밤이 되면 은은하게 빛난다.');
etc('e_oldbark', '고목 껍질', 100, 'root', '#8a6a4a', '이끼가 낀 두꺼운 껍질.');
etc('e_honeypaw', '꿀 묻은 곰 발바닥', 120, 'leather', '#c08040', '달콤한 냄새가 가시지 않는다.');
etc('e_dew', '요정의 이슬', 110, 'drop', '#c8ffb0', '잎사귀 끝에 맺혀 떨어지지 않는 이슬.');
etc('e_beetlehorn', '사슴벌레 집게', 130, 'horn', '#5a3a2a', '번들거리는 커다란 집게.');
// 잿빛 광산
etc('e_pebble', '매끈한 조약돌', 120, 'gem', '#a8a8a0', '조약돌 골렘의 몸에서 떨어진 돌.');
etc('e_rockskin', '바위 껍질', 130, 'shell', '#9a8a7a', '바위 지렁이가 벗어 둔 허물.');
etc('e_heartstone', '거인의 심장석', 5000, 'gem', '#ffb040', '채석장 거인을 움직이던 돌. 아직 따뜻하다.', 'rare');
etc('e_pickaxe', '부러진 곡괭이', 150, 'bone', '#8a7a6a', '해골 광부가 끝까지 놓지 않던 곡괭이.');
etc('e_orejelly', '광석 젤리', 100, 'jelly', '#a0a8b8', '광석 가루가 섞여 묵직한 젤리.');
etc('e_whistle', '십장의 호루라기', 3000, 'bone', '#d07030', '불면 어디선가 해골 광부들이 일어선다.', 'rare');
etc('e_zombienail', '검은 손톱', 150, 'claw', '#5a7a4a', '좀비의 길고 검은 손톱.');
etc('e_arrowhead', '녹슨 화살촉', 170, 'stinger', '#a89878', '해골 궁수의 화살통에서 나온 화살촉.');
etc('e_knightcrest', '녹슨 기사 문장', 4000, 'gem', '#c03040', '해골 기사의 갑옷에 달려 있던 문장.', 'rare');
etc('e_bonefang', '해골 송곳니', 220, 'claw', '#e8e0c8', '사냥개의 턱뼈에 박혀 있던 송곳니.');
etc('e_chain', '망령의 사슬', 260, 'bone', '#9a8ad0', '아무것도 묶여 있지 않은데 무겁다.');
etc('e_vein', '광맥 수정', 300, 'gem', '#c8a8ff', '봉인된 광맥에서만 자라는 보랏빛 수정.');
etc('e_gemjelly', '보석 젤리', 260, 'jelly', '#ff8ad8', '보석이 박힌 단단한 젤리.');
etc('e_veincore', '광맥의 핵', 8000, 'gem', '#9a7ae0', '광맥의 수호자를 움직이던 보랏빛 핵.', 'rare');
// 작열하는 사막
etc('e_needle', '선인장 가시', 200, 'stinger', '#7ac85a', '끝이 아주 날카롭다.');
etc('e_crabshell', '게딱지', 220, 'shell', '#ff7a5a', '단단하고 붉은 등딱지.');
etc('e_mirage', '신기루 조각', 280, 'gem', '#ffe8a0', '손바닥 위에서 아지랑이처럼 일렁인다.');
etc('e_kingstinger', '전갈왕의 독침', 5000, 'stinger', '#ffb040', '아직 독이 마르지 않았다.', 'rare');
etc('e_scarab', '황금 풍뎅이 껍질', 300, 'shell', '#ffd24a', '진짜 금처럼 반짝인다.');
etc('e_tombseal', '무덤의 인장', 300, 'gem', '#e0d0a0', '파수꾼이 지키던 봉인 조각.');
etc('e_sacredcloth', '신관의 붕대', 8000, 'bandage', '#ffd040', '금실로 기도문을 수놓은 붕대.', 'rare');
etc('e_blackfur', '검은 갈기', 320, 'fur', '#2a2a3a', '무덤 자칼의 윤기 나는 갈기.');
etc('e_cursedcloth', '저주받은 붕대', 330, 'bandage', '#7a3a8a', '만지면 손끝이 저릿하다.');
etc('e_lionmane', '모래사자 갈기', 350, 'fur', '#e0b060', '모래바람 냄새가 난다.');
etc('e_sandsoul', '모래 영혼', 380, 'cloth', '#c8a060', '병 속에 넣어도 스르르 빠져나간다.');
etc('e_cobrafang', '코브라 독니', 360, 'claw', '#ffd24a', '독이 맺힌 황금빛 이빨.');
etc('e_sundisk', '태양 원반', 15000, 'gem', '#fff0a0', '신전 제단에 놓여 있던 금빛 원반.', 'rare');
// 얼어붙은 설원
etc('e_frostfang', '서리 송곳니', 320, 'claw', '#c8e0f8', '입김이 얼어붙은 송곳니.');
etc('e_glacier', '빙하 조각', 560, 'gem', '#bfe4ff', '천 년 동안 녹지 않은 얼음.');
etc('e_kingfur', '군주의 흰 갈기', 6000, 'fur', '#ffffff', '설원의 군주가 두르던 갈기.', 'rare');
etc('e_snowfur', '눈토끼 털', 320, 'fur', '#f4faff', '눈처럼 희고 따뜻하다.');
etc('e_frostscale', '서리 비늘', 380, 'shell', '#a0d8ff', '얼음처럼 차가운 비늘.');
etc('e_galecore', '눈보라 결정', 400, 'gem', '#e8f0ff', '쥐면 손 안에서 바람이 분다.');
etc('e_frostwing', '서리 날개', 360, 'batwing', '#a8c8f0', '얇은 얼음 막으로 된 날개.');
etc('e_trollhide', '트롤 가죽', 420, 'leather', '#6a8aa8', '두껍고 질기며 차갑다.');
etc('e_wyrmheart', '비룡의 심장', 20000, 'gem', '#c8f0ff', '아직도 차갑게 고동친다.', 'rare');
etc('e_frostemblem', '얼어붙은 문장', 480, 'gem', '#6a9ad0', '얼음 속 기사단의 문장.');
etc('e_sigh', '빙령의 한숨', 500, 'cloth', '#bfefff', '병에 담긴 차가운 한숨.');
// 숨겨진 장소
etc('e_rainbow', '무지갯빛 젤리', 150, 'jelly', '#ffa8e0', '보는 각도마다 색이 바뀐다.');
etc('e_halo', '작은 천사 고리', 420, 'gem', '#fffbe8', '날개 말랑의 머리 위에 떠 있던 고리.');
etc('e_devhorn', '작은 악마 뿔', 420, 'horn', '#4a3a6a', '뿔 말랑의 앙증맞은 뿔.');
etc('e_queenjelly', '여왕의 젤리', 6000, 'jelly', '#ff9ac8', '말랑 여왕의 향기로운 젤리.', 'rare');
etc('e_moonfur', '달토끼 털', 200, 'fur', '#e8e8ff', '달빛 아래에서만 은빛으로 빛난다.');
etc('e_mothdust', '밤나방 인분', 220, 'drop', '#c8b8e0', '반짝이는 보랏빛 가루.');
etc('e_foxflame', '푸른 여우불', 260, 'gem', '#a0b8ff', '병 속에서 꺼지지 않고 흔들린다.');
etc('e_moontail', '월광 꼬리', 6000, 'fur', '#f4f4ff', '월광 여우의 꼬리털. 밤이면 길을 비춘다.', 'rare');
etc('e_stardust', '별가루', 450, 'gem', '#fff8c0', '호수 바닥에 가라앉아 있던 별빛.');
etc('e_aurora', '오로라 조각', 520, 'cloth', '#80ffd0', '하늘에서 떨어진 빛의 커튼 한 자락.');
etc('e_lakepearl', '호수의 진주', 30000, 'gem', '#e0f0ff', '별이 잠든 호수의 파수꾼이 품고 있던 진주.', 'rare');

// ── 단서·열쇠 (숨겨진 장소) — 자동 판매되지 않는다
etc('q_rainbowdrop', '무지갯빛 물방울', 10, 'drop', '#ffa8e0', '말랑이 몸속에서 나온 무지갯빛 방울. 수로 밑바닥 쪽으로 기울며 흔들린다. 거기 사는 커다란 말랑이 무언가를 알고 있는 걸까?', 'rare');
etc('q_moonfur', '달빛 묻은 늑대털', 10, 'fur', '#e0e8ff', '달빛을 받으면 희미하게 숲 북쪽을 가리킨다. 늑대왕이 지키던 길은 하나가 아니었다. 밤이 깊을 때 다시 보자.', 'rare');
etc('q_runeshard', '룬 문양 조각', 10, 'gem', '#c8a8ff', '해골 광부들이 주워 모으던 돌 조각. 광산 1층 막다른 갱도의 석문에 난 홈과 모양이 꼭 맞는다. 홈은 다섯 개였다.', 'rare');
etc('q_mapscrap', '낡은 지도 조각', 10, 'scroll', '#e0c890', '모래바람에 날려 온 양피지 귀퉁이. 사막 한가운데 X 표시와 집게발 그림이 있다. 네 조각을 맞추면 길이 보일 것 같다.', 'rare');

// ── 카드 (몬스터 하나에 카드 하나)
// 슬롯별 규칙: 무기 = 종족·크기·속성 % / ATK / 크리 / 속성 부여, 갑옷 = HP·VIT·갑옷 속성, 방패 = 종족 피해 감소,
// 걸치기 = 속성 저항·FLEE·무속성 감소, 신발 = AGI·HP·SP, 액세서리 = 스탯·회복·스킬, 머리 = INT·DEX 등.
// 같은 분류(종족끼리, 크기끼리…)는 더하고 분류끼리는 곱한다 → 종족+크기 섞어 꽂기가 같은 카드 겹치기보다 세다.
// 속성 갑옷 표기: 받는 피해 배율은 elements.ts 표 그대로.

// 무기 — 종족
card('sporelet', '꼬마버섯', 'weapon', '제초의', { raceDmg: { plant: 20 } }, '식물형 몬스터에게 주는 피해 +20%\n[무기]');
card('wolf', '회색 늑대', 'weapon', '사냥꾼의', { raceDmg: { brute: 20 } }, '동물형 몬스터에게 주는 피해 +20%\n[무기]');
card('scorpion', '사막 전갈', 'weapon', '전갈의', { raceDmg: { insect: 20 } }, '곤충형 몬스터에게 주는 피해 +20%\n[무기]');
card('pebble', '조약돌 골렘', 'weapon', '바위깨는', { raceDmg: { formless: 20 } }, '무형 몬스터에게 주는 피해 +20%\n[무기]');
card('skelminer', '해골 광부', 'weapon', '망자 사냥의', { raceDmg: { undead: 20 } }, '불사형 몬스터에게 주는 피해 +20%\n[무기]');
card('anubis', '무덤 자칼', 'weapon', '퇴마의', { raceDmg: { demon: 20 } }, '악마형 몬스터에게 주는 피해 +20%\n[무기]');
card('eel', '수로 장어', 'weapon', '작살잡이의', { raceDmg: { fish: 20 }, eleDmg: { water: 10 } }, '어패형 몬스터에게 주는 피해 +20%\n물속성 몬스터에게 주는 피해 +10%\n[무기]');
card('iceworm', '서리 지룡', 'weapon', '용사냥의', { raceDmg: { dragon: 25 }, atk: 5 }, '용족 몬스터에게 주는 피해 +25%, ATK +5\n[무기]');
card('sandlion', '모래사자', 'weapon', '사자왕의', { raceDmg: { brute: 15 }, sizeDmg: { large: 10 } }, '동물형 몬스터에게 주는 피해 +15%\n대형 몬스터에게 주는 피해 +10%\n[무기]');
// 무기 — 크기
card('rat', '수로 쥐', 'weapon', '갉아먹는', { sizeDmg: { small: 15 }, atk: 5 }, '소형 몬스터에게 주는 피해 +15%, ATK +5\n[무기]');
card('skeleton', '해골 병사', 'weapon', '해골의', { sizeDmg: { medium: 15 }, atk: 5 }, '중형 몬스터에게 주는 피해 +15%, ATK +5\n[무기]');
card('boneknight', '해골 기사', 'weapon', '기사의', { sizeDmg: { large: 20 }, atk: 10 }, '대형 몬스터에게 주는 피해 +20%, ATK +10\n[무기]', 'epic');
card('veinguard', '광맥의 수호자', 'weapon', '광맥의', { ignoreSize: 1 }, '무기 크기 보정을 무시한다\n(단검으로 대형도 100%)\n[무기]', 'epic');
// 무기 — 속성 상대
card('coinbug', '동전벌레', 'weapon', '반짝이는', { eleDmg: { earth: 20 } }, '땅속성 몬스터에게 주는 피해 +20%\n[무기]');
card('blizzard', '눈보라 정령', 'weapon', '눈보라의', { eleDmg: { water: 20 } }, '물속성 몬스터에게 주는 피해 +20%\n[무기]');
// 무기 — 속성 부여 (불리한 상대도 생긴다)
card('toxjelly', '독말랑', 'weapon', '맹독의', { weaponElement: 'poison', atk: 5 }, '무기에 독속성 부여, ATK +5\n(땅·불·바람에 강함, 불사·암흑에 약함)\n[무기]');
card('firefly', '반딧불이', 'weapon', '불붙은', { weaponElement: 'fire', atk: 5 }, '무기에 불속성 부여, ATK +5\n(땅·불사에 강함, 물·불에 약함)\n[무기]');
card('frostwolf', '서리 늑대', 'weapon', '서리의', { weaponElement: 'water', atk: 5 }, '무기에 물속성 부여, ATK +5\n(불에 강함, 물·바람에 약함)\n[무기]');
card('dryad', '나무 요정', 'weapon', '바람의', { weaponElement: 'wind', atk: 5 }, '무기에 바람속성 부여, ATK +5\n(물에 매우 강함, 땅·바람에 약함)\n[무기]');
card('rockworm', '바위 지렁이', 'weapon', '대지의', { weaponElement: 'earth', atk: 5 }, '무기에 땅속성 부여, ATK +5\n(바람에 강함, 땅·불에 약함)\n[무기]');
card('devjelly', '뿔 말랑', 'weapon', '악마의', { weaponElement: 'shadow', atk: 5 }, '무기에 암흑속성 부여, ATK +5\n(성에 강함, 불사·암흑·독에 매우 약함)\n[무기]');
// 무기 — 그 밖
card('stingbee', '꿀벌 병정', 'weapon', '날카로운', { crit: 9 }, '크리티컬 +9\n[무기]');
card('bonehound', '해골 사냥개', 'weapon', '급소의', { crit: 4, critDmgPct: 15 }, '크리티컬 +4, 크리티컬 피해 +15%\n[무기]');
card('beetle', '사슴벌레', 'weapon', '집게의', { atk: 15 }, 'ATK +15\n[무기]');
card('cactus', '선인장 병정', 'weapon', '가시 돋친', { atk: 22, dmgReducePct: -6 }, 'ATK +22\n대신 받는 피해 +6%\n[무기]');
card('fangbat', '송곳니 박쥐', 'weapon', '흡혈의', { lifeStealPct: 3 }, '물리 피해의 3%만큼 HP 흡수\n[무기]');
card('scorpking', '전갈왕', 'weapon', '사막왕의', { atkPct: 10, crit: 5 }, '물리 피해 +10%, 크리티컬 +5\n[무기]', 'epic');
card('frostwitch', '서리 마녀', 'weapon', '서리마녀의', { matkPct: 20, castPct: 5 }, 'MATK +20%, 시전 시간 -5%\n[무기]', 'mvp');

// 갑옷
card('jelly', '말랑', 'armor', '행운의', { luk: 2, pdodge: 1 }, 'LUK +2, 완전 회피 +1\n[갑옷]');
card('wriggle', '애벌레', 'armor', '튼튼한', { vit: 1, maxHp: 200 }, 'VIT +1, 최대 HP +200\n[갑옷]');
card('stump', '그루터기', 'armor', '뿌리 깊은', { maxHpPct: 10, moveSpd: -5 }, '최대 HP +10%\n대신 이동 속도 -5%\n[갑옷]');
card('shambler', '좀비', 'armor', '끈질긴', { maxHpPct: 8, hpRegenPct: 20 }, '최대 HP +8%, HP 회복 +20%\n[갑옷]');
card('crystalgolem', '수정 골렘', 'armor', '수정의', { def: 4, mdef: 4 }, 'DEF +4, MDEF +4\n[갑옷]');
card('scarab', '황금 풍뎅이', 'armor', '황금 껍질의', { vit: 2, def: 2 }, 'VIT +2, DEF +2\n[갑옷]');
card('sandjelly', '모래 말랑', 'armor', '모래의', { eleRes: { fire: 25 }, vit: 1 }, '받는 불속성 피해 -25%, VIT +1\n[갑옷]');
card('frosttroll', '얼음 트롤', 'armor', '트롤의', { maxHpPct: 12, hpRegenPct: 30, aspdPct: -5 }, '최대 HP +12%, HP 회복 +30%\n대신 공격 속도 -5%\n[갑옷]');
card('quarrygolem', '채석장 거인', 'armor', '거인의', { def: 3, maxHpPct: 10, moveSpd: -10 }, 'DEF +3, 최대 HP +10%\n대신 이동 속도 -10%\n[갑옷]', 'epic');
card('lakeguardian', '호수의 파수꾼', 'armor', '수호자의', { maxHpPct: 15, dmgReducePct: 8 }, '최대 HP +15%, 받는 피해 -8%\n[갑옷]', 'epic');
// 갑옷 — 속성 변경 (맵마다 갈아 끼우는 카드)
card('shroom', '큰버섯', 'armor', '흙의', { armorElement: 'earth', vit: 1 }, '갑옷을 땅속성으로, VIT +1\n(땅 피해 75%↓·바람 50%↓, 불 50%↑)\n[갑옷]');
card('yeti', '설인', 'armor', '설인의', { armorElement: 'water', vit: 2 }, '갑옷을 물속성으로, VIT +2\n(물 피해 75%↓·불 50%↓, 바람 75%↑)\n[갑옷]');
card('cobra', '황금 코브라', 'armor', '독사의', { armorElement: 'poison', agi: 1 }, '갑옷을 독속성으로, AGI +1\n(독 피해 무효·암흑 50%↓)\n[갑옷]');
card('cursedmummy', '저주받은 미라', 'armor', '저주받은', { armorElement: 'undead', int: 1 }, '갑옷을 불사속성으로, INT +1\n(암흑 75%↓·독 50%↓, 불 25%↑·성 50%↑)\n[갑옷]');
card('angeljelly', '날개 말랑', 'armor', '천사의', { armorElement: 'holy', maxHpPct: 5 }, '갑옷을 성속성으로, 최대 HP +5%\n(속성 공격 25%↓·성 무효, 암흑 25%↑)\n[갑옷]');
card('foxfire', '여우불', 'armor', '여우불의', { armorElement: 'ghost', hpRegenPct: -25 }, '갑옷을 염속성으로\n(무속성 피해 75%↓, 염 25%↑)\n대신 HP 회복 -25%\n[갑옷]', 'epic');

// 방패 — 종족 피해 감소
card('sprout', '새싹 정령', 'shield', '새싹의', { raceRes: { plant: 30 } }, '식물형에게 받는 피해 -30%\n[방패]');
card('ladybug', '무당벌레', 'shield', '점박이', { raceRes: { insect: 30 } }, '곤충형에게 받는 피해 -30%\n[방패]');
card('bear', '꿀곰', 'shield', '곰가죽', { raceRes: { brute: 30 } }, '동물형에게 받는 피해 -30%\n[방패]');
card('sandgolem', '모래 골렘', 'shield', '바위의', { raceRes: { formless: 30 }, def: 1 }, '무형에게 받는 피해 -30%, DEF +1\n[방패]');
card('mummy', '미라', 'shield', '붕대의', { raceRes: { undead: 30 } }, '불사형에게 받는 피해 -30%\n[방패]');
card('tombguard', '무덤 파수꾼', 'shield', '파수꾼의', { raceRes: { demon: 30 } }, '악마형에게 받는 피해 -30%\n[방패]');
card('crab', '오아시스 게', 'shield', '게딱지의', { eleRes: { water: 20 }, def: 1 }, '받는 물속성 피해 -20%, DEF +1\n[방패]');
card('icegolem', '빙결 골렘', 'shield', '빙벽의', { maxHpPct: 8, def: 2 }, '최대 HP +8%, DEF +2\n[방패]');
card('treant', '고목 정령', 'shield', '고목의', { dmgReducePct: 10, maxHpPct: 10 }, '받는 피해 -10%, 최대 HP +10%\n[방패]', 'mvp');

// 걸치기 — 속성 저항·회피
card('puffball', '민들레 홀씨', 'garment', '솜털의', { eleRes: { wind: 20 }, flee: 3 }, '받는 바람속성 피해 -20%, FLEE +3\n[걸치기]');
card('drownjelly', '물먹은 말랑', 'garment', '물먹은', { eleRes: { water: 25 } }, '받는 물속성 피해 -25%\n[걸치기]');
card('icewisp', '얼음 정령', 'garment', '빙결의', { eleRes: { water: 30 }, flee: 5 }, '받는 물속성 피해 -30%, FLEE +5\n[걸치기]');
card('sandwraith', '모래 망령', 'garment', '모래 망령의', { eleRes: { shadow: 30 }, flee: 5 }, '받는 암흑속성 피해 -30%, FLEE +5\n[걸치기]');
card('mossjelly', '이끼 말랑', 'garment', '숨은', { flee: 10 }, 'FLEE +10\n[걸치기]');
card('mirage', '신기루 정령', 'garment', '신기루의', { flee: 12, eleRes: { wind: 10 } }, 'FLEE +12, 받는 바람속성 피해 -10%\n[걸치기]');
card('wisp', '유령등불', 'garment', '유령의', { flee: 18, eleRes: { ghost: -50 } }, 'FLEE +18\n대신 받는 염속성 피해 +50%\n[걸치기]');
card('phantom', '갱도 망령', 'garment', '망령의', { eleRes: { neutral: 20 } }, '받는 무속성 피해 -20%\n[걸치기]');
card('aurora', '오로라 정령', 'garment', '오로라의', { eleRes: { water: 10, earth: 10, fire: 10, wind: 10, poison: 10, holy: 10, shadow: 10, ghost: 10 }, mdef: 5 }, '무속성을 뺀 모든 속성 피해 -10%, MDEF +5\n[걸치기]');
card('mummylord', '붕대 대신관', 'garment', '대신관의', { raceRes: { undead: 15, demon: 15 }, maxHpPct: 5 }, '불사형·악마형에게 받는 피해 -15%\n최대 HP +5%\n[걸치기]', 'epic');
card('frostwyrm', '서리 비룡', 'garment', '비룡의', { eleRes: { water: 20, earth: 20, fire: 20, wind: 20 } }, '받는 물·땅·불·바람 피해 -20%\n[걸치기]', 'epic');
card('jellyking', '말랑 대왕', 'garment', '대왕의', { allStats: 2, dmgReducePct: 5 }, '모든 스탯 +2, 받는 피해 -5%\n[걸치기]', 'mvp');

// 신발
card('pup', '꼬마 늑대', 'shoes', '날쌘', { agi: 1, maxHpPct: 5 }, 'AGI +1, 최대 HP +5%\n[신발]');
card('orejelly', '광석 말랑', 'shoes', '광석의', { maxHpPct: 5, maxSpPct: 10 }, '최대 HP +5%, 최대 SP +10%\n[신발]');
card('jackal', '사막 자칼', 'shoes', '모래바람의', { agi: 2, flee: 3 }, 'AGI +2, FLEE +3\n[신발]');
card('snowbun', '눈토끼', 'shoes', '눈길의', { agi: 1, maxHpPct: 10 }, 'AGI +1, 최대 HP +10%\n[신발]');
card('icebat', '서리 박쥐', 'shoes', '서리 날개의', { agi: 3, moveSpd: 5 }, 'AGI +3, 이동 속도 +5%\n[신발]');
card('bunchief', '뿔토끼 대장', 'shoes', '질주하는', { agi: 2, flee: 5, moveSpd: 10 }, 'AGI +2, FLEE +5, 이동 속도 +10%\n[신발]', 'epic');

// 액세서리
card('leech', '수로 거머리', 'acc', '들러붙는', { vit: 1, hpRegenPct: 15 }, 'VIT +1, HP 회복 +15%\n[액세서리]');
card('rainbowjelly', '무지개 말랑', 'acc', '무지개', { luk: 2, pdodge: 2 }, 'LUK +2, 완전 회피 +2\n[액세서리]');
card('bonearcher', '해골 궁수', 'acc', '명사수의', { dex: 3, rangedPct: 5 }, 'DEX +3, 원거리 피해 +5%\n[액세서리]');
card('gemjelly', '보석 말랑', 'acc', '보석의', { luk: 3, crit: 2 }, 'LUK +3, 크리티컬 +2\n[액세서리]');
card('snowjelly', '눈 말랑', 'acc', '눈송이', { int: 1, dex: 1, maxSpPct: 5 }, 'INT +1, DEX +1, 최대 SP +5%\n[액세서리]');
card('starjelly', '별빛 말랑', 'acc', '별빛의', { allStats: 1 }, '모든 스탯 +1\n[액세서리]');
card('moonbun', '달토끼', 'acc', '달토끼의', { healPct: 10, maxSpPct: -10 }, '힐 Lv1을 쓸 수 있다 (힐 회복량 +10%)\n대신 최대 SP -10%\n[액세서리]');
card('ratking', '수로 쥐왕', 'acc', '쥐왕의', { dex: 2, agi: 2 }, 'DEX +2, AGI +2\n[액세서리]', 'epic');
card('silverfang', '은빛 늑대왕', 'acc', '늑대왕의', { str: 3, crit: 3 }, 'STR +3, 크리티컬 +3\n[액세서리]', 'epic');
card('jellyqueen', '말랑 여왕', 'acc', '여왕의', { luk: 2, maxHpPct: -5 }, '블레싱 Lv1을 쓸 수 있다, LUK +2\n대신 최대 HP -5%\n[액세서리]', 'epic');
card('moonfox', '월광 여우', 'acc', '월광의', { crit: 7, luk: 3 }, '크리티컬 +7, LUK +3\n[액세서리]', 'epic');
card('foreman', '해골 십장', 'acc', '십장의', { str: 2, dex: 2 }, 'STR +2, DEX +2\n[액세서리]', 'epic');
card('yetiking', '설원의 군주', 'acc', '군주의', { str: 4, vit: 2 }, 'STR +4, VIT +2\n[액세서리]', 'epic');

// 머리
card('hornbun', '뿔토끼', 'head', '재빠른', { agi: 1, flee: 3 }, 'AGI +1, FLEE +3\n[머리]');
card('mandra', '맨드라 꽃', 'head', '현명한', { int: 2, maxSp: 30 }, 'INT +2, 최대 SP +30\n[머리]');
card('nightmoth', '밤나방', 'head', '밤눈의', { dex: 2, hit: 5 }, 'DEX +2, HIT +5\n[머리]');
card('icewraith', '빙령', 'head', '빙령의', { int: 3, mdef: 5 }, 'INT +3, MDEF +5\n[머리]');
card('frostknight', '얼어붙은 기사', 'head', '서리 투구의', { vit: 2, def: 2, maxHpPct: 5 }, 'VIT +2, DEF +2, 최대 HP +5%\n[머리]');
card('sunpriest', '태양의 신관', 'head', '태양 신관의', { healPct: 20, int: 2 }, '힐 회복량 +20%, INT +2\n[머리]', 'epic');
card('wraith', '망령 군주', 'head', '망령왕의', { matkPct: 10, castPct: 10, raceDmg: { undead: 10 } }, 'MATK +10%, 시전 시간 -10%\n불사형에게 주는 피해 +10%\n[머리]', 'mvp');
card('pharaoh', '모래의 파라오', 'head', '파라오의', { aspdPct: 10, int: 3 }, '공격 속도 +10%, INT +3\n[머리]', 'mvp');

/** accessory cards that teach a skill (needs engine support: world.ts enabledSkills should add these while the card is equipped) */
export const CARD_SKILLS: Record<string, { skill: string; lv: number }> = {
  c_moonbun: { skill: 'heal', lv: 1 },
  c_jellyqueen: { skill: 'blessing', lv: 1 },
};

export function item(id: string): ItemDef {
  const d = ITEMS[id];
  if (!d) throw new Error('unknown item ' + id);
  return d;
}

export const RARITY_COLOR: Record<string, string> = {
  common: '#e8e4d8', rare: '#7ec8ff', epic: '#d79bff', mvp: '#ffcc4a',
};

/** shop inventories (town NPCs) */
export const SHOPS: Record<string, { name: string; npc: string; items: string[] }> = {
  tool: { name: '도구 상점', npc: 'tool', items: ['u_red', 'u_orange', 'u_yellow', 'u_white', 'u_blue', 'u_conc', 'u_awake', 'u_conv_fire', 'u_conv_water', 'u_conv_earth', 'u_conv_wind', 'r_phra', 'r_emver', 'am_arrow', 'am_fire', 'am_crystal', 'am_stone', 'am_wind', 'am_silver'] },
  weapon: { name: '무기 상점', npc: 'weapon', items: ['w_knife', 'w_cutter', 'w_gauche', 'w_stiletto', 'w_sword', 'w_falchion', 'w_blade', 'w_saber', 'w_katana', 'w_bastard', 'w_rod', 'w_wand', 'w_staff', 'w_bow', 'w_composite', 'w_greatbow', 'w_club', 'w_mace', 'w_smasher', 'w_axe', 'w_battleaxe', 'w_javelin', 'w_spear', 'w_pike', 'w_partizan', 'w_katar', 'w_huntbow'] },
  armor: { name: '방어구 상점', npc: 'armor', items: ['a_cotton', 'a_jacket', 'a_adventure', 'a_wooden', 'a_mantle', 'a_silk', 'a_tights', 'a_thief', 'a_chain', 'a_knight', 'a_wizard', 'a_hunter', 'a_priest', 'a_assassin', 'a_smith', 's_guard', 's_buckler', 'g_hood', 'g_muffler', 'g_feather', 'f_sandals', 'f_shoes', 'f_greaves', 'x_clip', 'h_flower', 'h_ribbon', 'h_cap', 'h_bandana'] },
  costume: { name: '의상실', npc: 'stylist', items: ['m_glasses', 'm_sunglasses', 'm_goggles', 'm_eyepatch', 'm_blush', 'l_pipe', 'l_mask', 'l_rose', 'l_scarf', 'h_wizard'] },
};
