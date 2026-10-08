import type { ClassId, StatKey, WeaponType } from '../types.ts';

export interface ClassDef {
  id: ClassId;
  name: string;
  tier: 0 | 1 | 2;
  /** previous class for 2nd jobs */
  from?: ClassId;
  jobMax: number;
  hpA: number;
  hpB: number;
  spB: number;
  weapons: WeaponType[];
  aspd: Partial<Record<WeaponType, number>>;
  skills: string[];
  /** stat gained every 3 job levels, cycling */
  jobBonus: StatKey[];
  color: string;
  role: string;
  desc: string;
  hint: string;
  ranged?: boolean;
}

export const CLASSES = {
  novice: {
    id: 'novice', name: '초보자', tier: 0, jobMax: 10, hpA: 0, hpB: 9, spB: 1,
    weapons: ['none', 'dagger', 'sword', 'staff', 'mace', 'axe'],
    aspd: { none: 156, dagger: 150, sword: 145, staff: 145, mace: 140, axe: 140 },
    skills: ['basic', 'first_aid', 'play_dead'],
    jobBonus: ['str', 'agi', 'vit', 'dex'],
    color: '#c9a36b', role: '시작', desc: '모든 모험가의 출발점. 직업 레벨 10과 기본기 9를 달성하면 1차 전직할 수 있습니다.',
    hint: '기본기에 스킬 포인트 9를 모두 투자하세요.',
  },
  swordsman: {
    id: 'swordsman', name: '검사', tier: 1, jobMax: 50, hpA: 0.7, hpB: 5, spB: 2,
    weapons: ['none', 'dagger', 'sword', 'sword2h', 'spear', 'mace', 'axe'],
    aspd: { none: 160, dagger: 155, sword: 152, sword2h: 150, spear: 147, mace: 146, axe: 146 },
    skills: ['sword_mastery', 'twohand_mastery', 'hp_recovery', 'bash', 'magnum_break', 'provoke', 'endure', 'moving_hp', 'fatal_blow', 'auto_berserk'],
    jobBonus: ['str', 'vit', 'str', 'dex', 'vit', 'luk'],
    color: '#5b86c9', role: '탱커 · 근접 딜러', desc: '높은 HP와 방어력. 도발로 적을 끌어모아 파티를 지킵니다.',
    hint: 'STR·VIT 위주. AGI를 섞으면 공격 속도가, DEX를 섞으면 명중이 안정됩니다.',
  },
  mage: {
    id: 'mage', name: '마법사', tier: 1, jobMax: 50, hpA: 0.3, hpB: 5, spB: 6,
    weapons: ['none', 'dagger', 'staff'],
    aspd: { none: 156, dagger: 150, staff: 150 },
    skills: ['sp_recovery', 'napalm_beat', 'soul_strike', 'safety_wall', 'fire_bolt', 'cold_bolt', 'lightning_bolt', 'frost_diver', 'stone_curse', 'fire_ball', 'fire_wall', 'sight', 'thunderstorm', 'energy_coat'],
    jobBonus: ['int', 'dex', 'int', 'agi', 'dex', 'luk'],
    color: '#9b6bd6', role: '원거리 마법 딜러', desc: '속성 마법으로 약점을 찌릅니다. 냉동 → 번개 연계는 마법사의 기본기.',
    hint: 'INT·DEX 위주. DEX는 시전 시간을 줄여 줍니다. 적의 속성을 보고 볼트를 고르세요.',
    ranged: true,
  },
  archer: {
    id: 'archer', name: '궁수', tier: 1, jobMax: 50, hpA: 0.5, hpB: 5, spB: 2,
    weapons: ['none', 'dagger', 'bow'],
    aspd: { none: 156, dagger: 150, bow: 148 },
    skills: ['owls_eye', 'vultures_eye', 'improve_conc', 'double_strafe', 'arrow_shower', 'arrow_craft', 'arrow_repel'],
    jobBonus: ['dex', 'agi', 'dex', 'str', 'luk', 'dex'],
    color: '#5fae5a', role: '원거리 물리 딜러', desc: '활은 DEX가 공격력. 화살 속성을 바꿔 상성을 공략합니다.',
    hint: 'DEX·AGI 위주. 화살통에 속성 화살을 장착하는 것을 잊지 마세요.',
    ranged: true,
  },
  acolyte: {
    id: 'acolyte', name: '성직자', tier: 1, jobMax: 50, hpA: 0.4, hpB: 5, spB: 5,
    weapons: ['none', 'mace', 'staff'],
    aspd: { none: 160, mace: 150, staff: 150 },
    skills: ['divine_protection', 'demon_bane', 'ruwach', 'teleport', 'warp_portal', 'pneuma', 'heal', 'increase_agi', 'decrease_agi', 'aqua_benedicta', 'signum_crucis', 'angelus', 'blessing', 'cure', 'holy_light', 'holy_strike'],
    jobBonus: ['int', 'vit', 'dex', 'int', 'luk', 'agi'],
    color: '#e6c25c', role: '힐러 · 버퍼', desc: '힐과 축복으로 파티를 지탱합니다. 불사·악마에게는 성스러운 힘이 무기.',
    hint: 'INT·VIT 위주. 힐량은 (레벨+INT)에 비례합니다.',
  },
  thief: {
    id: 'thief', name: '도둑', tier: 1, jobMax: 50, hpA: 0.5, hpB: 5, spB: 2,
    weapons: ['none', 'dagger', 'sword', 'bow'],
    aspd: { none: 160, dagger: 157, sword: 146, bow: 140 },
    skills: ['double_attack', 'improve_dodge', 'steal', 'hiding', 'envenom', 'detoxify', 'sand_attack', 'back_slide', 'find_stone', 'throw_stone'],
    jobBonus: ['agi', 'str', 'agi', 'dex', 'luk', 'agi'],
    color: '#7d6a9c', role: '회피 · 연타 딜러', desc: '높은 회피와 이중 공격. 훔치기로 전리품을 더 챙깁니다.',
    hint: 'AGI·STR 위주. 단검의 이중 공격은 크리티컬과 궁합이 좋습니다.',
  },
  merchant: {
    id: 'merchant', name: '상인', tier: 1, jobMax: 50, hpA: 0.6, hpB: 5, spB: 3,
    weapons: ['none', 'dagger', 'sword', 'mace', 'axe'],
    aspd: { none: 160, dagger: 150, sword: 148, mace: 148, axe: 150 },
    skills: ['enlarge_weight', 'discount', 'overcharge', 'pushcart', 'item_appraisal', 'vending', 'mammonite', 'cart_revolution', 'change_cart', 'loud_exclamation'],
    jobBonus: ['str', 'vit', 'dex', 'str', 'luk', 'int'],
    color: '#e08a3c', role: '경제 · 근접 딜러', desc: '할인과 바가지로 제니를 불리고, 금화 강타로 돈을 대미지로 바꿉니다.',
    hint: 'STR·DEX·VIT. 파티에 있으면 판매 수익이 크게 늘어납니다.',
  },
} as Record<ClassId, ClassDef>;

// ───────── 2nd jobs (job Lv 40+ of the 1st job)
Object.assign(CLASSES, {
  knight: {
    id: 'knight', name: '기사', tier: 2, from: 'swordsman', jobMax: 50, hpA: 1.5, hpB: 5, spB: 3,
    weapons: ['none', 'dagger', 'sword', 'sword2h', 'spear', 'mace', 'axe'],
    aspd: { none: 162, dagger: 157, sword: 155, sword2h: 154, spear: 151, mace: 150, axe: 148 },
    skills: ['spear_mastery', 'pierce', 'spear_stab', 'spear_boomerang', 'brandish', 'twohand_quicken', 'auto_counter', 'bowling_bash', 'riding', 'cavalier_mastery', 'charge_attack'],
    jobBonus: ['str', 'vit', 'dex', 'str', 'agi', 'vit'],
    color: '#3f6fd0', role: '전위 탱커 · 근접 딜러',
    desc: '창과 양손검의 달인. 높은 HP로 앞을 막고, 회전 강타로 몰려든 적을 쓸어버립니다.',
    hint: 'STR·VIT 위주. 양손검이면 양손검 가속, 창이면 꿰뚫기(대형에게 3연타)를 노려보세요.',
  },
  wizard: {
    id: 'wizard', name: '위저드', tier: 2, from: 'mage', jobMax: 50, hpA: 0.55, hpB: 5, spB: 9,
    weapons: ['none', 'dagger', 'staff'],
    aspd: { none: 158, dagger: 152, staff: 152 },
    skills: ['fire_pillar', 'sightrasher', 'meteor', 'jupitel', 'lord_vermilion', 'water_ball', 'ice_wall', 'frost_nova', 'storm_gust', 'earth_spike', 'heavens_drive', 'quagmire', 'sense', 'sight_blaster', 'spell_mastery', 'mystic_amp'],
    jobBonus: ['int', 'dex', 'int', 'dex', 'agi', 'int'],
    color: '#6a4ad0', role: '광역 마법 딜러',
    desc: '하늘에서 유성을 떨어뜨리고, 눈보라로 무리를 얼려버리는 광역 마법의 정점.',
    hint: 'INT·DEX 극대화. 폭풍한설로 얼린 뒤 번개 계열로 마무리하면 상성 보너스가 큽니다.',
    ranged: true,
  },
  hunter: {
    id: 'hunter', name: '헌터', tier: 2, from: 'archer', jobMax: 50, hpA: 0.85, hpB: 5, spB: 3,
    weapons: ['none', 'dagger', 'bow'],
    aspd: { none: 158, dagger: 152, bow: 152 },
    skills: ['beast_bane', 'falcon_eyes', 'blitz_beat', 'steel_crow', 'detect', 'skid_trap', 'land_mine', 'ankle_snare', 'shockwave_trap', 'sandman', 'flasher', 'freezing_trap', 'blast_mine', 'claymore_trap', 'remove_trap', 'spring_trap', 'talkie_box', 'phantasmic'],
    jobBonus: ['dex', 'agi', 'luk', 'dex', 'int', 'dex'],
    color: '#3a9a4a', role: '원거리 딜러 · 매 조련',
    desc: '매와 함께 사냥합니다. 평타마다 매가 날아들어 추가 공격(오토 블리츠)을 하고, 덫으로 적을 묶습니다.',
    hint: 'DEX·AGI, 매를 키우려면 LUK·INT. 오토 블리츠 확률은 LUK에 비례합니다.',
    ranged: true,
  },
  priest: {
    id: 'priest', name: '프리스트', tier: 2, from: 'acolyte', jobMax: 50, hpA: 0.75, hpB: 5, spB: 8,
    weapons: ['none', 'mace', 'staff'],
    aspd: { none: 162, mace: 153, staff: 153 },
    skills: ['pr_sp_recovery', 'mace_mastery', 'impositio', 'suffragium', 'aspersio', 'sacrament', 'sanctuary', 'slow_poison', 'status_recovery', 'kyrie', 'magnificat', 'gloria', 'lex_divina', 'turn_undead', 'lex_aeterna', 'magnus', 'resurrection', 'pr_safety_wall', 'redemptio'],
    jobBonus: ['int', 'vit', 'luk', 'int', 'dex', 'vit'],
    color: '#e0b040', role: '힐러 · 버퍼 · 퇴마',
    desc: '수호의 장막과 부활로 파티를 지키고, 대퇴마로 불사·악마를 정화합니다.',
    hint: 'INT·VIT·DEX. 영혼의 찬가가 파티 SP 회복을 두 배로 올려줍니다.',
  },
  assassin: {
    id: 'assassin', name: '어새신', tier: 2, from: 'thief', jobMax: 50, hpA: 1.1, hpB: 5, spB: 3,
    weapons: ['none', 'dagger', 'katar', 'sword'],
    aspd: { none: 162, dagger: 158, katar: 157, sword: 148 },
    skills: ['katar_mastery', 'right_hand', 'left_hand', 'cloaking', 'sonic_blow', 'grimtooth', 'enchant_poison', 'poison_react', 'venom_dust', 'venom_splasher', 'sonic_accel', 'venom_knife', 'shadow_step'],
    jobBonus: ['agi', 'str', 'agi', 'dex', 'luk', 'agi'],
    color: '#6a3a8a', role: '폭딜 · 크리티컬 · 회피',
    desc: '카타르를 쥐면 크리티컬 확률이 두 배. 음속 연격 8연타로 순식간에 적을 베어냅니다.',
    hint: 'AGI·STR, 크리 빌드면 LUK. 카타르는 양손 무기라 방패를 못 듭니다.',
  },
  blacksmith: {
    id: 'blacksmith', name: '블랙스미스', tier: 2, from: 'merchant', jobMax: 50, hpA: 0.9, hpB: 5, spB: 4,
    weapons: ['none', 'dagger', 'sword', 'mace', 'axe'],
    aspd: { none: 162, dagger: 152, sword: 150, mace: 151, axe: 153 },
    skills: ['weaponry_research', 'adrenaline', 'weapon_perfection', 'over_thrust', 'hammer_fall', 'refine_mastery', 'ore_discovery'],
    jobBonus: ['str', 'dex', 'vit', 'luk', 'str', 'dex'],
    color: '#c06a2a', role: '파티 버퍼 · 정련 장인',
    desc: '파티 전원의 공격 속도와 공격력을 끌어올리는 버퍼. 정련 성공률까지 올려주는 장인입니다.',
    hint: 'STR·DEX·VIT. 파티에 있으면 아드레날린·과신으로 딜러들이 강해집니다.',
  },
} satisfies Partial<Record<ClassId, ClassDef>>);

export const FIRST_JOBS: ClassId[] = ['swordsman', 'mage', 'archer', 'acolyte', 'thief', 'merchant'];
export const SECOND_JOB_OF: Partial<Record<ClassId, ClassId[]>> = {
  swordsman: ['knight'], mage: ['wizard'], archer: ['hunter'], acolyte: ['priest'], thief: ['assassin'], merchant: ['blacksmith'],
};
export const SECOND_JOB_LV = 40;

/** class + every class it came from (2nd → 1st → novice) */
export function lineage(cls: ClassId): ClassId[] {
  const out: ClassId[] = [cls];
  let c = CLASSES[cls];
  while (c.from) { out.push(c.from); c = CLASSES[c.from]; }
  if (cls !== 'novice') out.push('novice');
  return out;
}

export function jobBonusStats(cls: ClassId, jobLv: number): Record<StatKey, number> {
  const out: Record<StatKey, number> = { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 };
  const def = CLASSES[cls];
  // 2nd jobs keep the full 1st-job bonus so changing class never feels like a downgrade
  if (def.from) {
    const base = jobBonusStats(def.from, CLASSES[def.from].jobMax);
    for (const k of Object.keys(base) as StatKey[]) out[k] += base[k];
  }
  const seq = def.jobBonus;
  const n = Math.floor(jobLv / (def.tier === 2 ? 2 : 3));
  for (let i = 0; i < n; i++) out[seq[i % seq.length]]++;
  return out;
}
