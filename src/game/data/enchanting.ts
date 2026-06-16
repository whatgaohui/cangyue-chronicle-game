// 苍月纪元 - 强化系统 (Enchanting System)
// +0 到 +15 强化系统，含破碎/保护/转移机制

// ============================================================================
// 强化配置
// ============================================================================

/** 强化结果类型 */
export type EnchantResultType = 'success' | 'downgrade' | 'reset' | 'destroy' | 'protected';

/** 单次强化结果 */
export interface EnchantResult {
  success: boolean;              // 是否成功
  resultType: EnchantResultType; // 结果类型
  newLevel: number;              // 新的强化等级
  message: string;               // 结果描述
}

/** 强化等级段配置 */
export interface EnchantLevelRange {
  min: number;
  max: number;
  successRate: number;           // 成功率（0-1）
  failureRule: 'downgrade_1' | 'reset_to_zero' | 'destroy'; // 失败规则
}

/** 强化转移结果 */
export interface EnchantTransferResult {
  success: boolean;
  message: string;
}

// ============================================================================
// 强化配置常量
// ============================================================================

export const ENCHANT_CONFIG = {
  /** 最大强化等级 */
  maxLevel: 15,

  /** 强化材料名称 */
  material: '黑铁矿石',

  /** 材料物品ID */
  materialItemId: 'blackIron',

  /** 每次强化消耗材料数量 */
  materialCost: 1,

  /** 每次强化消耗金币 */
  goldCost: 1000,

  /** 强化等级段配置 */
  levelRanges: [
    { min: 1, max: 7, successRate: 0.95, failureRule: 'downgrade_1' as const },
    { min: 8, max: 10, successRate: 0.70, failureRule: 'reset_to_zero' as const },
    { min: 11, max: 12, successRate: 0.40, failureRule: 'destroy' as const },
    { min: 13, max: 14, successRate: 0.20, failureRule: 'destroy' as const },
    { min: 15, max: 15, successRate: 0.10, failureRule: 'destroy' as const },
  ],

  /** 强化转移费用 */
  transferCost: {
    material: 10,   // 黑铁矿石 × 10
    gold: 50000,    // 金币 50000
  },

  /** 保护符（防止装备破碎的道具） */
  protectItemId: 'soulCrystal',

  /** 保护符描述 */
  protectItemName: '灵魂晶石',

  /** 每级强化属性加成百分比 */
  statBonusPerLevel: 0.05, // +1 = +5%基础属性

  /** 强化等级显示颜色 */
  levelColors: {
    '0': '#9CA3AF',   // 灰色
    '1': '#ffffff',   // 白色
    '2': '#ffffff',   // 白色
    '3': '#00ff00',   // 绿色
    '4': '#00ff00',   // 绿色
    '5': '#00ff00',   // 绿色
    '6': '#00ff00',   // 绿色
    '7': '#00ff00',   // 绿色
    '8': '#0088ff',   // 蓝色
    '9': '#0088ff',   // 蓝色
    '10': '#0088ff',  // 蓝色
    '11': '#aa00ff',  // 紫色
    '12': '#aa00ff',  // 紫色
    '13': '#ff8800',  // 橙色
    '14': '#ff8800',  // 橙色
    '15': '#ff0000',  // 红色
  } as Record<string, string>,
};

// ============================================================================
// 强化等级段
// ============================================================================

/** 所有等级段 */
export const ENCHANT_LEVEL_RANGES: EnchantLevelRange[] = ENCHANT_CONFIG.levelRanges;

// ============================================================================
// 核心函数
// ============================================================================

/**
 * 获取当前强化等级对应成功率
 *
 * 成功率分档:
 *   +1 ~ +7:  95%
 *   +8 ~ +10: 70%
 *   +11 ~ +12: 40%
 *   +13 ~ +14: 20%
 *   +15:       10%
 *
 * @param currentLevel  当前强化等级（0-14，尝试升到currentLevel+1）
 * @returns 成功率（0-1）
 */
export function getEnchantSuccessRateV2(currentLevel: number): number {
  // 已满级，不可强化
  if (currentLevel >= ENCHANT_CONFIG.maxLevel) return 0;

  const targetLevel = currentLevel + 1;
  for (const range of ENCHANT_CONFIG.levelRanges) {
    if (targetLevel >= range.min && targetLevel <= range.max) {
      return range.successRate;
    }
  }
  // 默认最低概率
  return 0.10;
}

/**
 * 获取当前强化等级对应的失败规则
 *
 * 失败规则分档:
 *   +1 ~ +7:  降1级 (downgrade_1)
 *   +8 ~ +10: 归零 (reset_to_zero)
 *   +11 ~ +15: 装备破碎 (destroy)
 *
 * @param currentLevel  当前强化等级
 * @returns 失败规则
 */
export function getEnchantFailureRule(currentLevel: number): 'downgrade_1' | 'reset_to_zero' | 'destroy' {
  const targetLevel = currentLevel + 1;
  for (const range of ENCHANT_CONFIG.levelRanges) {
    if (targetLevel >= range.min && targetLevel <= range.max) {
      return range.failureRule;
    }
  }
  return 'destroy';
}

/**
 * 获取强化到下一级所需的金币
 *
 * @param currentLevel  当前强化等级
 * @returns 所需金币数量
 */
export function getEnchantGoldCost(currentLevel: number): number {
  if (currentLevel >= ENCHANT_CONFIG.maxLevel) return 0;
  // 基础费用随等级递增: 1000 × (level + 1)
  return Math.floor(ENCHANT_CONFIG.goldCost * (1 + currentLevel * 0.5));
}

/**
 * 获取强化到下一级所需材料数量
 *
 * @param currentLevel  当前强化等级
 * @returns 所需材料数量
 */
export function getEnchantMaterialCost(currentLevel: number): number {
  if (currentLevel >= ENCHANT_CONFIG.maxLevel) return 0;
  // 基础1个，+8以上需要2个，+11以上需要3个
  if (currentLevel >= 10) return 3;
  if (currentLevel >= 7) return 2;
  return 1;
}

/**
 * 执行一次强化
 *
 * 流程:
 *   1. 检查是否已满级
 *   2. 根据等级段获取成功率
 *   3. 随机判定成功/失败
 *   4. 根据失败规则处理结果
 *   5. 如有保护符，破碎改为降级
 *
 * @param currentLevel  当前强化等级（0-14）
 * @param hasProtection 是否使用保护符
 * @returns 强化结果
 */
export function performEnchant(currentLevel: number, hasProtection: boolean = false): EnchantResult {
  // 已满级
  if (currentLevel >= ENCHANT_CONFIG.maxLevel) {
    return {
      success: false,
      resultType: 'protected',
      newLevel: currentLevel,
      message: '装备已达最高强化等级',
    };
  }

  // 获取成功率
  const successRate = getEnchantSuccessRateV2(currentLevel);
  const isSuccessful = Math.random() < successRate;

  if (isSuccessful) {
    return {
      success: true,
      resultType: 'success',
      newLevel: currentLevel + 1,
      message: `强化成功！${currentLevel} → ${currentLevel + 1}`,
    };
  }

  // 失败处理
  const failureRule = getEnchantFailureRule(currentLevel);

  switch (failureRule) {
    case 'downgrade_1': {
      const newLevel = Math.max(0, currentLevel - 1);
      return {
        success: false,
        resultType: 'downgrade',
        newLevel,
        message: `强化失败！${currentLevel} → ${newLevel}（降1级）`,
      };
    }

    case 'reset_to_zero': {
      return {
        success: false,
        resultType: 'reset',
        newLevel: 0,
        message: `强化失败！${currentLevel} → 0（归零）`,
      };
    }

    case 'destroy': {
      // 有保护符时，破碎改为降3级
      if (hasProtection) {
        const newLevel = Math.max(0, currentLevel - 3);
        return {
          success: false,
          resultType: 'protected',
          newLevel,
          message: `强化失败！保护符生效，${currentLevel} → ${newLevel}（免于破碎）`,
        };
      }

      return {
        success: false,
        resultType: 'destroy',
        newLevel: 0,
        message: `强化失败！装备已破碎！`,
      };
    }

    default:
      return {
        success: false,
        resultType: 'reset',
        newLevel: 0,
        message: '强化失败！',
      };
  }
}

/**
 * 计算强化等级对属性的加成倍率
 *
 * 每级 +5% 基础属性
 * 例如: +10 = 1.5倍基础属性
 *
 * @param enchantLevel  强化等级（0-15）
 * @returns 属性加成倍率（1.0 = 无加成）
 */
export function getEnchantStatMultiplier(enchantLevel: number): number {
  return 1 + enchantLevel * ENCHANT_CONFIG.statBonusPerLevel;
}

/**
 * 获取强化等级的显示颜色
 *
 * @param enchantLevel  强化等级
 * @returns 颜色字符串
 */
export function getEnchantLevelColor(enchantLevel: number): string {
  const key = String(Math.min(enchantLevel, 15));
  return ENCHANT_CONFIG.levelColors[key] || '#9CA3AF';
}

/**
 * 获取强化等级的中文显示名
 *
 * @param enchantLevel  强化等级
 * @returns 显示名（如 "+0", "+15 (完美)"）
 */
export function getEnchantLevelName(enchantLevel: number): string {
  if (enchantLevel >= 15) return `+${enchantLevel} (完美)`;
  if (enchantLevel >= 13) return `+${enchantLevel} (极品)`;
  if (enchantLevel >= 11) return `+${enchantLevel} (优秀)`;
  if (enchantLevel >= 8) return `+${enchantLevel} (精良)`;
  return `+${enchantLevel}`;
}

/**
 * 检查是否可以执行强化转移
 *
 * 转移规则: 将A装备的强化等级转移到B装备
 *   - 需要黑铁矿石 × 10
 *   - 需要金币 50000
 *   - 转移后A装备强化归零
 *   - B装备获得A装备的强化等级
 *
 * @param sourceLevel  源装备强化等级
 * @returns 转移结果
 */
export function performEnchantTransfer(sourceLevel: number): EnchantTransferResult {
  if (sourceLevel <= 0) {
    return { success: false, message: '源装备强化等级必须大于0' };
  }

  return {
    success: true,
    message: `成功转移 +${sourceLevel} 强化等级`,
  };
}

// ============================================================================
// 向后兼容 - 旧强化系统接口
// ============================================================================

/** @deprecated 使用 getEnchantSuccessRateV2 替代 */
export const ENCHANT_SUCCESS_RATES: Record<number, number> = {
  0: 1.0,
  1: 0.8,
  2: 0.6,
  3: 0.4,
  4: 0.2,
};

/** @deprecated 使用 ENCHANT_CONFIG.maxLevel 替代 */
export const MAX_ENCHANT_LEVEL = 5;

/**
 * @deprecated 使用 getEnchantSuccessRateV2 替代
 * 获取旧版强化成功率（+0到+5）
 */
export function getEnchantSuccessRate(currentLevel: number): number {
  return ENCHANT_SUCCESS_RATES[currentLevel] ?? 0.1;
}