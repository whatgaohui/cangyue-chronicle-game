// 苍月纪元 - 装备觉醒系统 (Equipment Awakening System)
// 仅神话(红色)装备可觉醒，随机解锁职业专属技能词条，可多次觉醒

import type { ItemRarity } from './items';
import type { CharacterClass } from '../store/gameStore';

// ============================================================================
// 觉醒配置
// ============================================================================

/** 可觉醒的最低品质 */
export const AWAKENING_MIN_RARITY: ItemRarity = 'mythic';

/** 最大觉醒次数 */
export const MAX_AWAKENING_COUNT = 3;

/** 觉醒材料物品ID */
export const AWAKENING_MATERIAL_ITEM_ID = 'awakening_crystal';

/** 觉醒材料名称 */
export const AWAKENING_MATERIAL_NAME = '觉醒晶石';

// ============================================================================
// 觉醒词条定义
// ============================================================================

export interface AwakeningAffix {
  id: string;
  name: string;
  classReq: CharacterClass | 'all';
  description: string;
  stat: string;
  value: number;
  weight: number;
}

/** 职业专属觉醒词条池 */
export const AWAKENING_AFFIX_POOL: AwakeningAffix[] = [
  // === 战士专属 ===
  { id: 'awa_war_atk', name: '战神之力', classReq: 'warrior', description: '攻击力+8%', stat: 'attackPercent', value: 8, weight: 25 },
  { id: 'awa_war_crit', name: '嗜血本能', classReq: 'warrior', description: '暴击率+5%', stat: 'critRate', value: 5, weight: 20 },
  { id: 'awa_war_def', name: '钢铁意志', classReq: 'warrior', description: '防御力+10%', stat: 'defensePercent', value: 10, weight: 20 },
  { id: 'awa_war_hp', name: '不灭战魂', classReq: 'warrior', description: '生命值+15%', stat: 'hpPercent', value: 15, weight: 15 },
  { id: 'awa_war_dmg', name: '破甲斩击', classReq: 'warrior', description: '无视防御+5%', stat: 'ignoreDef', value: 5, weight: 10 },

  // === 法师专属 ===
  { id: 'awa_mage_atk', name: '元素亲和', classReq: 'mage', description: '攻击力+8%', stat: 'attackPercent', value: 8, weight: 25 },
  { id: 'awa_mage_mp', name: '法力涌泉', classReq: 'mage', description: '魔法值+20%', stat: 'mpPercent', value: 20, weight: 20 },
  { id: 'awa_mage_crit', name: '灵能爆发', classReq: 'mage', description: '暴击率+5%', stat: 'critRate', value: 5, weight: 20 },
  { id: 'awa_mage_cd', name: '奥术迅捷', classReq: 'mage', description: '冷却缩减+8%', stat: 'cooldownReduction', value: 8, weight: 15 },
  { id: 'awa_mage_dmg', name: '毁灭之力', classReq: 'mage', description: '技能伤害+10%', stat: 'skillDamage', value: 10, weight: 10 },

  // === 道士专属 ===
  { id: 'awa_tao_heal', name: '天恩庇佑', classReq: 'taoist', description: '治疗效果+15%', stat: 'healBonus', value: 15, weight: 25 },
  { id: 'awa_tao_atk', name: '道法自然', classReq: 'taoist', description: '攻击力+6%', stat: 'attackPercent', value: 6, weight: 20 },
  { id: 'awa_tao_def', name: '金光护体', classReq: 'taoist', description: '防御力+8%', stat: 'defensePercent', value: 8, weight: 20 },
  { id: 'awa_tao_summon', name: '灵兽强化', classReq: 'taoist', description: '召唤物伤害+20%', stat: 'summonDamage', value: 20, weight: 15 },
  { id: 'awa_tao_mp', name: '太极心法', classReq: 'taoist', description: '魔法值+15%', stat: 'mpPercent', value: 15, weight: 10 },

  // === 通用 ===
  { id: 'awa_all_luck', name: '天命所归', classReq: 'all', description: '幸运+3', stat: 'luck', value: 3, weight: 5 },
  { id: 'awa_all_hp', name: '生命涌动', classReq: 'all', description: '生命值+10%', stat: 'hpPercent', value: 10, weight: 8 },
];

// ============================================================================
// 核心函数
// ============================================================================

/**
 * 检查品质是否可觉醒
 */
export function canAwaken(rarity: ItemRarity): boolean {
  return rarity === AWAKENING_MIN_RARITY;
}

/**
 * 计算觉醒所需金币
 * @param awakenCount 已觉醒次数
 */
export function getAwakeningGoldCost(awakenCount: number): number {
  return 50000 * (awakenCount + 1);
}

/**
 * 计算觉醒所需材料数量
 * @param awakenCount 已觉醒次数
 */
export function getAwakeningMaterialCost(awakenCount: number): number {
  return 3 * (awakenCount + 1);
}

/**
 * 获取职业可用的觉醒词条池
 */
export function getAwakeningPoolForClass(charClass: CharacterClass): AwakeningAffix[] {
  return AWAKENING_AFFIX_POOL.filter(a => a.classReq === charClass || a.classReq === 'all');
}

/**
 * 随机抽取一条觉醒词条
 * @param charClass 角色职业
 * @param existingAffixIds 已有的觉醒词条ID（避免重复）
 */
export function rollAwakeningAffix(charClass: CharacterClass, existingAffixIds: string[]): AwakeningAffix | null {
  const pool = getAwakeningPoolForClass(charClass).filter(a => !existingAffixIds.includes(a.id));
  if (pool.length === 0) return null;

  const totalWeight = pool.reduce((sum, a) => sum + a.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const affix of pool) {
    roll -= affix.weight;
    if (roll <= 0) return affix;
  }

  return pool[pool.length - 1];
}
