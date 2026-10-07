import type { Bonus, ItemDef } from '../game/types.ts';
import { ELEMENT_KO, RACE_KO, SIZE_KO, WEAPON_KO } from '../game/data/elements.ts';
import { CLASSES } from '../game/data/classes.ts';

const NAMES: Partial<Record<keyof Bonus, string>> = {
  str: 'STR', agi: 'AGI', vit: 'VIT', int: 'INT', dex: 'DEX', luk: 'LUK', allStats: '모든 스탯',
  atk: 'ATK', matk: 'MATK', def: 'DEF', mdef: 'MDEF', hit: '명중', flee: '회피', crit: '크리티컬', pdodge: '완전 회피',
  maxHp: '최대 HP', maxSp: '최대 SP', maxHpPct: '최대 HP%', maxSpPct: '최대 SP%', aspdPct: '공격 속도%', matkPct: 'MATK%',
  castPct: '시전 시간 감소%', moveSpd: '이동 속도%', hpRegen: 'HP 회복', spRegen: 'SP 회복', hpRegenPct: 'HP 회복%', spRegenPct: 'SP 회복%',
  healPct: '치유량%', potionPct: '포션 회복%', rangedPct: '원거리 피해%', critDmgPct: '크리 피해%', dmgReducePct: '받는 피해 감소%',
  lifeStealPct: 'HP 흡수%', dropPct: '드롭률%', zenyPct: '제니%', expPct: '경험치%', range: '사거리',
};

export function bonusLines(b: Bonus | undefined): string[] {
  if (!b) return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(b)) {
    if (v === undefined) continue;
    if (k === 'weaponElement') { out.push(`무기 ${ELEMENT_KO[v as keyof typeof ELEMENT_KO]}속성`); continue; }
    if (k === 'armorElement') { out.push(`갑옷 ${ELEMENT_KO[v as keyof typeof ELEMENT_KO]}속성`); continue; }
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
