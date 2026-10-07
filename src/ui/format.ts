import type { Bonus, ItemDef, Proc } from '../game/types.ts';
import { SKILLS } from '../game/data/skills.ts';
import { ELEMENT_KO, RACE_KO, SIZE_KO, WEAPON_KO } from '../game/data/elements.ts';
import { CLASSES } from '../game/data/classes.ts';

const NAMES: Partial<Record<keyof Bonus, string>> = {
  str: 'STR', agi: 'AGI', vit: 'VIT', int: 'INT', dex: 'DEX', luk: 'LUK', allStats: '모든 스탯',
  atk: 'ATK', matk: 'MATK', def: 'DEF', mdef: 'MDEF', hit: '명중', flee: '회피', crit: '크리티컬', pdodge: '완전 회피',
  maxHp: '최대 HP', maxSp: '최대 SP', maxHpPct: '최대 HP%', maxSpPct: '최대 SP%', aspdPct: '공격 속도%', matkPct: 'MATK%',
  castPct: '시전 시간 감소%', moveSpd: '이동 속도%', hpRegen: 'HP 회복', spRegen: 'SP 회복', hpRegenPct: 'HP 회복%', spRegenPct: 'SP 회복%',
  healPct: '치유량%', potionPct: '포션 회복%', rangedPct: '원거리 피해%', critDmgPct: '크리 피해%', dmgReducePct: '받는 피해 감소%',
  lifeStealPct: 'HP 흡수%', dropPct: '드롭률%', zenyPct: '제니%', expPct: '경험치%', range: '사거리',
  atkPct: '물리 피해%', selfCurse: '평타 시 자신 저주 확률%', autoBlitzPct: '오토 블리츠 확률%', blitzHits: '블리츠 타수',
  blitzRadius: '블리츠 범위', unarmedAspdPct: '맨손 공격 속도%', zenyCostPct: '스킬 제니 소모%',
};
const STATUS_KO: Record<string, string> = { stun: '기절', freeze: '빙결', poison: '중독', blind: '실명', curse: '저주' };

export function bonusLines(b: Bonus | undefined): string[] {
  if (!b) return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(b)) {
    if (v === undefined) continue;
    if (k === 'weaponElement') { out.push(`무기 ${ELEMENT_KO[v as keyof typeof ELEMENT_KO]}속성`); continue; }
    if (k === 'armorElement') { out.push(`갑옷 ${ELEMENT_KO[v as keyof typeof ELEMENT_KO]}속성`); continue; }
    if (k === 'ignoreSize') { out.push('무기 크기 보정 무시'); continue; }
    if (k === 'procs') {
      for (const p of v as Proc[]) {
        const on = p.on === 'attack' ? '평타 시' : p.on === 'crit' ? '크리티컬 시' : '피격 시';
        if (p.cast) out.push(`${on} ${p.chance}% 확률로 ${SKILLS[p.cast.skill]?.name ?? p.cast.skill} Lv ${p.cast.lv} 자동 시전`);
        if (p.status) out.push(`${on} ${p.chance}% 확률로 ${STATUS_KO[p.status.kind]}`);
        if (p.healPct) out.push(`${on} ${p.chance}% 확률로 HP ${p.healPct}% 회복`);
      }
      continue;
    }
    if (k === 'skillDmg') { for (const [kk, vv] of Object.entries(v as Record<string, number>)) out.push(`${SKILLS[kk]?.name ?? kk} 피해 +${vv}%`); continue; }
    if (k === 'statusRes') { for (const [kk, vv] of Object.entries(v as Record<string, number>)) out.push(vv >= 100 ? `${STATUS_KO[kk]} 무효` : `${STATUS_KO[kk]} 저항 +${vv}%`); continue; }
    if (typeof v === 'object') {
      for (const [kk, vv] of Object.entries(v as Record<string, number>)) {
        if (k === 'raceDmg') out.push(`${RACE_KO[kk as keyof typeof RACE_KO]}형에게 피해 +${vv}%`);
        if (k === 'sizeDmg') out.push(`${SIZE_KO[kk as keyof typeof SIZE_KO]}에게 피해 +${vv}%`);
        if (k === 'eleDmg') out.push(`${ELEMENT_KO[kk as keyof typeof ELEMENT_KO]}속성에게 피해 +${vv}%`);
        if (k === 'raceRes') out.push(`${RACE_KO[kk as keyof typeof RACE_KO]}형에게 받는 피해 -${vv}%`);
        if (k === 'eleRes') out.push(`${ELEMENT_KO[kk as keyof typeof ELEMENT_KO]}속성 받는 피해 ${(vv as number) >= 0 ? '-' : '+'}${Math.abs(vv as number)}%`);
      }
      continue;
    }
    const name = NAMES[k as keyof Bonus] ?? k;
    const n = v as number;
    out.push(`${name.replace('%', '')} ${n >= 0 ? '+' : ''}${n}${name.endsWith('%') ? '%' : ''}`);
  }
  return out;
}

export function itemTypeLine(d: ItemDef): string {
  switch (d.kind) {
    case 'use': return '소비 아이템';
    case 'etc': return d.id.startsWith('r_') ? '정련 재료' : '잡템';
    case 'card': return `카드 · ${({ weapon: '무기', armor: '갑옷', shield: '방패', garment: '걸치기', shoes: '신발', head: '머리', acc: '액세서리' } as const)[d.cardLoc!]}`;
    case 'ammo': return '화살통';
  }
  if (d.loc === 'weapon') return `${WEAPON_KO[d.wtype ?? 'none']}${d.twoHand ? ' (양손)' : ''} · 무기 Lv${d.wlv}`;
  const L: Record<string, string> = { headTop: '머리 상단', headMid: '머리 중단', headLow: '머리 하단', armor: '갑옷', shield: '방패', garment: '걸치기', shoes: '신발', acc: '액세서리' };
  return L[d.loc!] ?? '장비';
}

export function jobsLine(d: ItemDef): string {
  if (!d.jobs || d.jobs.length >= 7) return '모든 직업';
  return d.jobs.filter((j) => j !== 'novice').map((j) => CLASSES[j].name).join(' · ') + (d.jobs.includes('novice') ? ' · 초보자' : '');
}
