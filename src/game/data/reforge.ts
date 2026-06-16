// 苍月纪元 - 装备重铸系统 (Equipment Reforging System)
// 紫色(稀有)及以上装备可重铸，消耗重铸石+金币，重置随机词条但保留品质/基础属性

import type { ItemRarity } from './items';

// ============================================================================
// 重铸配置
// ============================================================================

/** 可重铸的最低品质 */
export const REFORGE_MIN_RARITY: ItemRarity[] = ['epic', 'legendary', 'mythic'];

/** 重铸石物品ID */
export const REFORGE_STONE_ITEM_ID = 'reforge_stone';

/** 品质对应的重铸费用倍率 */
export const REFORGE_RARITY_MULTIPLIER: Record<ItemRarity, number> = {
  common: 0,
  uncommon: 0,
  rare: 0,
  epic: 1.0,
  legendary: 2.0,
  mythic: 3.0,
};

/** 品质对应的随机词条数量范围 */
export const REFORGE_AFFIX_COUNT: Record<ItemRarity, [number, number]> = {
  common: [0, 0],
  uncommon: [1, 1],
  rare: [1, 2],
  epic: [2, 3],
  legendary: [2, 3],
  mythic: [3, 4],
};

// ============================================================================
// 随机词条定义
// ============================================================================

export interface ReforgeAffix {
  id: string;
  name: string;
  stat: string;       // 对应stats中的key
  minRoll: number;     // 最小值
  maxRoll: number;     // 最大值
  weight: number;      // 权重(越高越容易出)
}

/** 所有可能的重铸词条池 */
export const REFORGE_AFFIX_POOL: ReforgeAffix[] = [
  // 攻击类
  { id: 'ra_atk1', name: '锋利', stat: 'attack', minRoll: 3, maxRoll: 15, weight: 20 },
  { id: 'ra_atk2', name: '破甲', stat: 'attack', minRoll: 8, maxRoll: 25, weight: 10 },
  // 防御类
  { id: 'ra_def1', name: '坚韧', stat: 'defense', minRoll: 2, maxRoll: 12, weight: 20 },
  { id: 'ra_def2', name: '铁壁', stat: 'defense', minRoll: 5, maxRoll: 18, weight: 10 },
  // 生命类
  { id: 'ra_hp1', name: '活力', stat: 'hp', minRoll: 10, maxRoll: 80, weight: 18 },
  { id: 'ra_hp2', name: '强韧', stat: 'hp', minRoll: 30, maxRoll: 150, weight: 8 },
  // 魔法类
  { id: 'ra_mp1', name: '灵力', stat: 'mp', minRoll: 5, maxRoll: 50, weight: 15 },
  // 命中类
  { id: 'ra_acc1', name: '精准', stat: 'accuracy', minRoll: 2, maxRoll: 10, weight: 12 },
  // 敏捷类
  { id: 'ra_agi1', name: '轻灵', stat: 'agility', minRoll: 1, maxRoll: 6, weight: 12 },
  // 暴击类
  { id: 'ra_crit1', name: '致命', stat: 'critRate', minRoll: 1, maxRoll: 5, weight: 10 },
  { id: 'ra_crit2', name: '暴虐', stat: 'critDamage', minRoll: 3, maxRoll: 15, weight: 8 },
  // 幸运类
  { id: 'ra_luck1', name: '幸运', stat: 'luck', minRoll: 1, maxRoll: 3, weight: 5 },
];

// ============================================================================
// 核心函数
// ============================================================================

/**
 * 检查品质是否可重铸
 */
export function canReforge(rarity: ItemRarity): boolean {
  return REFORGE_MIN_RARITY.includes(rarity);
}

/**
 * 计算重铸所需金币
 * @param itemLevel 物品需求等级
 * @param rarity 物品品质
 */
export function getReforgeGoldCost(itemLevel: number, rarity: ItemRarity): number {
  const base = 5000;
  const levelScale = itemLevel * 200;
  const rarityMult = REFORGE_RARITY_MULTIPLIER[rarity] || 1;
  return Math.floor((base + levelScale) * rarityMult);
}

/**
 * 计算重铸所需重铸石数量
 * @param rarity 物品品质
 */
export function getReforgeStoneCost(rarity: ItemRarity): number {
  switch (rarity) {
    case 'epic': return 2;
    case 'legendary': return 5;
    case 'mythic': return 10;
    default: return 0;
  }
}

/**
 * 随机生成重铸词条
 * @param rarity 物品品质
 * @returns 生成的词条列表
 */
export function rollReforgeAffixes(rarity: ItemRarity): { affixId: string; stat: string; value: number }[] {
  const [minCount, maxCount] = REFORGE_AFFIX_COUNT[rarity] || [0, 0];
  if (minCount === 0 && maxCount === 0) return [];

  const count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
  const result: { affixId: string; stat: string; value: number }[] = [];
  const usedAffixIds = new Set<string>();

  // 加权随机选择
  const totalWeight = REFORGE_AFFIX_POOL.reduce((sum, a) => sum + a.weight, 0);

  for (let i = 0; i < count; i++) {
    let roll = Math.random() * totalWeight;
    let chosen: ReforgeAffix | null = null;

    for (const affix of REFORGE_AFFIX_POOL) {
      if (usedAffixIds.has(affix.id)) continue;
      roll -= affix.weight;
      if (roll <= 0) {
        chosen = affix;
        break;
      }
    }

    // 后备：选第一个未用的
    if (!chosen) {
      chosen = REFORGE_AFFIX_POOL.find(a => !usedAffixIds.has(a.id)) || null;
    }

    if (chosen) {
      usedAffixIds.add(chosen.id);
      const value = chosen.minRoll + Math.floor(Math.random() * (chosen.maxRoll - chosen.minRoll + 1));
      result.push({ affixId: chosen.id, stat: chosen.stat, value });
    }
  }

  return result;
}

/**
 * 将词条列表转换为属性加成统计
 */
export function affixesToStats(affixes: { stat: string; value: number }[]): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const a of affixes) {
    stats[a.stat] = (stats[a.stat] || 0) + a.value;
  }
  return stats;
}
