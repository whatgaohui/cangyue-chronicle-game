// 苍月纪元 - 战斗计算模块 (Combat Calculation Module)
// 纯函数战斗计算引擎，实现设计文档中的完整伤害公式

// ============================================================================
// TypeScript 接口定义
// ============================================================================

/** 物理伤害计算配置 */
export interface PhysicalDamageConfig {
  attackerAttack: number;          // 攻击方攻击力
  attackerLevel: number;           // 攻击方等级
  skillMultiplier: number;         // 技能倍率
  targetPhysicalDefense: number;   // 目标物理防御
  ignoreDefensePercent: number;    // 无视防御百分比（0-1）
  damageBonus: number;             // 额外伤害加成倍率（1.0=无加成）
  physicalResistance: number;      // 目标物理抗性（0-1）
  luckValue: number;               // 攻击方幸运值（0-9）
  isLucky: boolean;                // 幸运9=始终最大伤害
  baseCritRate: number;            // 基础暴击率
  baseCritDamage: number;          // 基础暴击伤害倍率
  critRateBonus: number;           // 装备/技能暴击率加成
  critDamageBonus: number;         // 装备/技能暴击伤害加成
  accuracy: number;                // 攻击方准确
  targetAgility: number;           // 目标敏捷
}

/** 魔法/道术伤害计算配置 */
export interface MagicDamageConfig {
  skillBaseDamage: number;         // 技能基础伤害
  magicAttribute: number;          // 魔法属性（智力或道术力）
  skillMultiplier: number;         // 技能倍率
  targetMagicDefense: number;      // 目标魔法防御
  ignoreMagicDefensePercent: number; // 无视魔防百分比（0-1）
  magicResistance: number;         // 目标魔法抗性（0-1）
  element?: 'fire' | 'ice' | 'lightning'; // 元素类型
  elementStacks?: number;          // 元素共鸣层数（法师专属）
  isLucky: boolean;                // 幸运9=始终最大伤害
  baseCritRate: number;            // 基础暴击率
  baseCritDamage: number;          // 基础暴击伤害倍率
  critRateBonus: number;           // 装备/技能暴击率加成
  critDamageBonus: number;         // 装备/技能暴击伤害加成
}

/** 伤害计算结果 */
export interface DamageCalcResult {
  damage: number;           // 最终伤害（整数）
  isCrit: boolean;          // 是否暴击
  isLuckyHit: boolean;      // 是否幸运9最大伤害
  hit: boolean;             // 是否命中（物理专用，魔法始终返回true）
}

/** 魔法伤害计算结果（isCrit为number以兼容旧接口） */
export interface MagicDamageCalcResult {
  damage: number;           // 最终伤害（整数）
  isCrit: number;           // 兼容旧接口：0=非暴击, 1=暴击
  isLuckyHit: boolean;      // 是否幸运9最大伤害
}

// ============================================================================
// 常量定义
// ============================================================================

/** 命中率基准值 */
const HIT_RATE_BASE = 0.80;

/** 命中率上限 */
const HIT_RATE_MAX = 0.95;

/** 命中率下限 */
const HIT_RATE_MIN = 0.10;

/** (准确-敏捷)系数 */
const HIT_DIFF_COEFFICIENT = 0.02;

/** 幸运9阈值 */
const LUCK_NINE_THRESHOLD = 9;

/** 最大暴击率（装备加成后） */
const MAX_CRIT_RATE = 0.20;

/** 基础暴击率 */
const BASE_CRIT_RATE = 0.05;

/** 最大暴击伤害倍率 */
const MAX_CRIT_DAMAGE = 2.0;

/** 基础暴击伤害倍率 */
const BASE_CRIT_DAMAGE = 1.5;

/** 伤害浮动下限（95%） */
const RANDOM_RANGE_MIN = 0.95;

/** 伤害浮动上限（105%） */
const RANDOM_RANGE_MAX = 1.05;

/** 每层元素共鸣伤害加成 */
const ELEMENT_STACK_BONUS = 0.08;

// ============================================================================
// 工具函数
// ============================================================================

/** 将值限制在[min, max]范围内 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 返回[min, max)范围内的随机数 */
function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ============================================================================
// 命中率计算
// ============================================================================

/**
 * 计算命中率
 *
 * 公式: hitRate = 80% + (准确 - 敏捷) × 0.02
 * 限制范围: [10%, 95%]
 *
 * @param accuracy   攻击方准确值
 * @param targetAgility  目标敏捷值
 * @returns 命中率百分比（0.10 ~ 0.95）
 */
export function calculateHitRate(accuracy: number, targetAgility: number): number {
  const rawHitRate = HIT_RATE_BASE + (accuracy - targetAgility) * HIT_DIFF_COEFFICIENT;
  return clamp(rawHitRate, HIT_RATE_MIN, HIT_RATE_MAX);
}

// ============================================================================
// 幸运9判定
// ============================================================================

/**
 * 判断是否达到幸运9（始终造成最大伤害）
 *
 * 幸运值来源: 武器(+0~+7) + 项链(+0~+3)，最大+9
 * 达到+9时，所有攻击取最大伤害值
 *
 * @param luckValue  幸运值（0-9）
 * @returns true=幸运9激活
 */
export function isLuckyNine(luckValue: number): boolean {
  return luckValue >= LUCK_NINE_THRESHOLD;
}

// ============================================================================
// 暴击计算（内部函数）
// ============================================================================

/**
 * 计算暴击结果
 *
 * 规则:
 *   - 基础暴击率: 5%，装备可提升到最大20%
 *   - 基础暴击伤害: 150%，可提升到最大200%
 *   - 暴击伤害独立于暴击率，直接使用critDamage数值
 *
 * @param baseCritRate     基础暴击率
 * @param critRateBonus    额外暴击率加成
 * @param baseCritDamage   基础暴击伤害倍率
 * @param critDamageBonus  额外暴击伤害加成
 * @returns { isCrit: boolean, multiplier: number }
 */
function calculateCritResult(
  baseCritRate: number,
  critRateBonus: number,
  baseCritDamage: number,
  critDamageBonus: number,
): { isCrit: boolean; multiplier: number } {
  // 最终暴击率限制在5%-20%
  const effectiveCritRate = clamp(baseCritRate + critRateBonus, BASE_CRIT_RATE, MAX_CRIT_RATE);
  const isCrit = Math.random() < effectiveCritRate;

  if (!isCrit) {
    return { isCrit: false, multiplier: 1.0 };
  }

  // 暴击伤害：基础值+加成，限制在150%-200%
  const effectiveCritDamage = clamp(baseCritDamage + critDamageBonus, BASE_CRIT_DAMAGE, MAX_CRIT_DAMAGE);
  return { isCrit: true, multiplier: effectiveCritDamage };
}

// ============================================================================
// 物理伤害计算
// ============================================================================

/**
 * 计算物理伤害
 *
 * 公式流程:
 *   ① 命中判定: hitRate = 80% + (准确 - 敏捷) × 0.02, clamp [10%, 95%]
 *   ② 伤害计算: actual = (ATK × 倍率 × 加成) - DEF × (1 - 无视防御%)
 *   ③ 保底: floor = level × 0.5
 *   ④ 抗性: actual × (1 - 物理抗性)
 *   ⑤ 暴击: × 暴击倍率
 *   ⑥ 浮动: × randomRange(0.95, 1.05)，幸运9则取最大值
 *   ⑦ 最终: max(final, floor)，取整
 *
 * @param config  物理伤害配置
 * @returns 伤害计算结果
 */
export function calculatePhysicalDamage(config: PhysicalDamageConfig): DamageCalcResult {
  const {
    attackerAttack,
    attackerLevel,
    skillMultiplier,
    targetPhysicalDefense,
    ignoreDefensePercent,
    damageBonus,
    physicalResistance,
    luckValue,
    isLucky,
    baseCritRate,
    baseCritDamage,
    critRateBonus,
    critDamageBonus,
    accuracy,
    targetAgility,
  } = config;

  // ① 命中判定
  const hitRate = calculateHitRate(accuracy, targetAgility);
  if (Math.random() > hitRate) {
    return { damage: 0, isCrit: false, isLuckyHit: false, hit: false };
  }

  // ② 伤害计算: (ATK × 倍率 × 加成) - DEF × (1 - 无视防御%)
  const grossDamage = attackerAttack * skillMultiplier * damageBonus;
  const effectiveDefense = targetPhysicalDefense * (1 - ignoreDefensePercent);
  let actualDamage = grossDamage - effectiveDefense;

  // ③ 保底: level × 0.5
  const minimumDamage = Math.max(1, attackerLevel * 0.5);
  if (actualDamage < minimumDamage) {
    actualDamage = minimumDamage;
  }

  // ④ 抗性
  let finalDamage = actualDamage * (1 - physicalResistance);

  // ⑤ 暴击
  const critResult = calculateCritResult(baseCritRate, critRateBonus, baseCritDamage, critDamageBonus);
  finalDamage *= critResult.multiplier;

  // ⑥ 浮动: 幸运9 = 始终最大值（×1.05），否则 ±5% 随机
  const isLuckyHit = isLucky || isLuckyNine(luckValue);
  if (isLuckyHit) {
    finalDamage *= RANDOM_RANGE_MAX;
  } else {
    finalDamage *= randomRange(RANDOM_RANGE_MIN, RANDOM_RANGE_MAX);
  }

  // ⑦ 最终保底 + 取整
  finalDamage = Math.floor(Math.max(minimumDamage, finalDamage));

  return {
    damage: finalDamage,
    isCrit: critResult.isCrit,
    isLuckyHit,
    hit: true,
  };
}

// ============================================================================
// 魔法/道术伤害计算
// ============================================================================

/**
 * 计算魔法/道术伤害
 *
 * 公式流程:
 *   ① (可选)命中判定: 同物理公式
 *   ② 伤害计算: actual = (基础 + 属性 × 倍率) - 魔防 × (1 - 无视魔防%)
 *   ③ 保底: floor = level × 0.5 (使用攻击方等级近似)
 *   ④ 抗性: actual × (1 - 魔法抗性)
 *   ⑤ 元素系数: × (1 + elementStacks × 0.08)
 *   ⑥ 暴击: × 暴击倍率
 *   ⑦ 幸运9: 取最大值
 *   ⑧ 最终: max(final, floor)，取整
 *
 * @param config  魔法伤害配置
 * @returns 魔法伤害计算结果
 */
export function calculateMagicDamage(config: MagicDamageConfig): MagicDamageCalcResult {
  const {
    skillBaseDamage,
    magicAttribute,
    skillMultiplier,
    targetMagicDefense,
    ignoreMagicDefensePercent,
    magicResistance,
    element,
    elementStacks = 0,
    isLucky,
    baseCritRate,
    baseCritDamage,
    critRateBonus,
    critDamageBonus,
  } = config;

  // ② 伤害计算: (基础 + 属性 × 倍率) - 魔防 × (1 - 无视魔防%)
  const grossDamage = skillBaseDamage + magicAttribute * skillMultiplier;
  const effectiveDefense = targetMagicDefense * (1 - ignoreMagicDefensePercent);
  let actualDamage = grossDamage - effectiveDefense;

  // ③ 保底（魔法技能无明确等级保底，使用固定最低值1）
  const minimumDamage = 1;
  if (actualDamage < minimumDamage) {
    actualDamage = minimumDamage;
  }

  // ④ 抗性
  let finalDamage = actualDamage * (1 - magicResistance);

  // ⑤ 元素系数（法师元素共鸣叠加）
  if (element && elementStacks > 0) {
    const elementCoeff = 1 + elementStacks * ELEMENT_STACK_BONUS;
    finalDamage *= elementCoeff;
  }

  // ⑥ 暴击
  const critResult = calculateCritResult(baseCritRate, critRateBonus, baseCritDamage, critDamageBonus);
  finalDamage *= critResult.multiplier;

  // ⑦ 幸运9 = 最大伤害
  const isLuckyHit = isLucky;

  // ⑧ 最终取整
  finalDamage = Math.floor(Math.max(minimumDamage, finalDamage));

  return {
    damage: finalDamage,
    isCrit: critResult.isCrit ? 1 : 0,
    isLuckyHit,
  };
}

// ============================================================================
// 天气战斗修正
// ============================================================================

export type WeatherType = 'clear' | 'rain' | 'sandstorm' | 'snow' | 'thunder';

/** 天气对战斗的影响修正系数 */
export interface WeatherCombatModifiers {
  fireDamageMultiplier: number;     // 火系伤害倍率 (1.0=无变化)
  iceDamageMultiplier: number;      // 冰系伤害倍率
  lightningDamageMultiplier: number;// 雷系伤害倍率
  accuracyMultiplier: number;       // 命中率倍率
  movementSpeedMultiplier: number;  // 移动速度倍率
}

/**
 * 获取天气对战斗的影响修正
 *
 * Rain: fire -15%, ice +10%
 * Sandstorm: accuracy -10%
 * Snow: movement -20%, ice +15%
 * Thunder: lightning +20%
 * Clear: no modifiers
 */
export function getWeatherCombatModifiers(weather: WeatherType): WeatherCombatModifiers {
  switch (weather) {
    case 'rain':
      return {
        fireDamageMultiplier: 0.85,    // 火系伤害-15%
        iceDamageMultiplier: 1.10,     // 冰系伤害+10%
        lightningDamageMultiplier: 1.0,
        accuracyMultiplier: 1.0,
        movementSpeedMultiplier: 1.0,
      };
    case 'sandstorm':
      return {
        fireDamageMultiplier: 1.0,
        iceDamageMultiplier: 1.0,
        lightningDamageMultiplier: 1.0,
        accuracyMultiplier: 0.90,      // 命中率-10%
        movementSpeedMultiplier: 1.0,
      };
    case 'snow':
      return {
        fireDamageMultiplier: 1.0,
        iceDamageMultiplier: 1.15,     // 冰系伤害+15%
        lightningDamageMultiplier: 1.0,
        accuracyMultiplier: 1.0,
        movementSpeedMultiplier: 0.80, // 移动速度-20%
      };
    case 'thunder':
      return {
        fireDamageMultiplier: 1.0,
        iceDamageMultiplier: 1.0,
        lightningDamageMultiplier: 1.20, // 雷系伤害+20%
        accuracyMultiplier: 1.0,
        movementSpeedMultiplier: 1.0,
      };
    case 'clear':
    default:
      return {
        fireDamageMultiplier: 1.0,
        iceDamageMultiplier: 1.0,
        lightningDamageMultiplier: 1.0,
        accuracyMultiplier: 1.0,
        movementSpeedMultiplier: 1.0,
      };
  }
}

/**
 * 应用天气修正到物理伤害
 * 主要影响：沙暴降低命中率
 */
export function applyWeatherToPhysicalDamage(
  result: DamageCalcResult,
  weather: WeatherType
): DamageCalcResult {
  const modifiers = getWeatherCombatModifiers(weather);

  // 天气影响命中率的额外判定
  if (result.hit && modifiers.accuracyMultiplier < 1.0) {
    // 额外命中判定：如果已经命中，再按比例判定一次
    if (Math.random() > modifiers.accuracyMultiplier) {
      return { ...result, hit: false, damage: 0 };
    }
  }

  return result;
}

/**
 * 应用天气修正到魔法伤害
 * 主要影响：雨减火增冰，雪增冰，雷增雷
 */
export function applyWeatherToMagicDamage(
  result: MagicDamageCalcResult,
  weather: WeatherType,
  element?: 'fire' | 'ice' | 'lightning'
): MagicDamageCalcResult {
  const modifiers = getWeatherCombatModifiers(weather);
  let adjustedDamage = result.damage;

  if (element === 'fire') {
    adjustedDamage = Math.floor(adjustedDamage * modifiers.fireDamageMultiplier);
  } else if (element === 'ice') {
    adjustedDamage = Math.floor(adjustedDamage * modifiers.iceDamageMultiplier);
  } else if (element === 'lightning') {
    adjustedDamage = Math.floor(adjustedDamage * modifiers.lightningDamageMultiplier);
  }

  return { ...result, damage: Math.max(1, adjustedDamage) };
}

// ============================================================================
// 导出常量（供外部使用）
// ============================================================================

export {
  HIT_RATE_BASE,
  HIT_RATE_MAX,
  HIT_RATE_MIN,
  HIT_DIFF_COEFFICIENT,
  LUCK_NINE_THRESHOLD,
  MAX_CRIT_RATE,
  BASE_CRIT_RATE,
  MAX_CRIT_DAMAGE,
  BASE_CRIT_DAMAGE,
  RANDOM_RANGE_MIN,
  RANDOM_RANGE_MAX,
  ELEMENT_STACK_BONUS,
};