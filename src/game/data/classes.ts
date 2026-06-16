// 传奇职业定义 - Character Class Definitions (扩展版)
// 包含职业专属机制数据

// ============================================================================
// 职业类型
// ============================================================================
export type CharacterClass = 'warrior' | 'mage' | 'taoist';

// ============================================================================
// 职业机制类型
// ============================================================================
export type ClassMechanicType = 'warSoul' | 'elementResonance' | 'daoHeart';

// ============================================================================
// 职业机制定义接口
// ============================================================================
export interface ClassMechanism {
  /** 机制类型 */
  type: ClassMechanicType;
  /** 机制中文名 */
  nameZh: string;
  /** 机制描述 */
  description: string;

  // ===== 战士 - 战魂系统 =====
  /** 每次造成伤害获得战魂值（战士） */
  warSoulGainOnDamage?: number;
  /** 每次受到伤害获得战魂值（战士） */
  warSoulGainOnHit?: number;
  /** 战魂最大值（战士） */
  warSoulMaxValue?: number;
  /** 战魂爆发持续时长（毫秒）（战士） */
  warSoulBurstDuration?: number;
  /** 战魂爆发攻速加成倍率（战士） */
  warSoulBurstAtkSpeedBonus?: number;
  /** 战魂爆发生命偷取比例（战士） */
  warSoulBurstVampirism?: number;
  /** 战魂爆发每秒消耗值（战士） */
  warSoulBurstCostPerSecond?: number;

  // ===== 法师 - 元素共鸣 =====
  /** 可用元素类型（法师） */
  elementTypes?: ('fire' | 'ice' | 'lightning')[];
  /** 每层共鸣伤害加成（法师） */
  elementStackDamageBonus?: number;
  /** 共鸣层数持续时间（毫秒）（法师） */
  elementStackDuration?: number;
  /** 最大共鸣层数（法师） */
  elementMaxStacks?: number;
  /** 切换元素是否重置层数（法师） */
  elementResetOnSwitch?: boolean;

  // ===== 道士 - 道心通明 =====
  /** 道心触发概率（道士） */
  daoHeartTriggerChance?: number;
  /** 道心增益效果倍率（道士） */
  daoHeartBuffMultiplier?: number;
  /** 道心增益持续时长（毫秒）（道士） */
  daoHeartDuration?: number;
  /** 道心适用的技能类型（道士） */
  daoHeartAppliesToSkillTypes?: string[];
}

// ============================================================================
// 职业克制关系
// ============================================================================
export interface ClassRestraint {
  attacker: CharacterClass;
  defender: CharacterClass;
  damageBonus: number; // 伤害加成比例（0.10 = +10%）
}

// ============================================================================
// 职业定义接口（扩展版）
// ============================================================================
export interface ClassDefinition {
  id: CharacterClass;
  name: string;
  description: string;
  baseHP: number;
  baseMP: number;
  hpPerLevel: number;
  mpPerLevel: number;
  baseAttack: number;
  baseDefense: number;
  baseMagic: number;
  baseSpeed: number;
  attackRange: number;
  color: string;
  spriteColor: string;
  icon: string;

  // --- 新增字段：属性成长 ---
  /** 每级攻击成长 */
  attackPerLevel: number;
  /** 每级防御成长 */
  defensePerLevel: number;
  /** 每级魔法成长 */
  magicPerLevel: number;
  /** 基础准确 */
  baseAccuracy: number;
  /** 每级准确成长 */
  accuracyPerLevel: number;
  /** 基础敏捷 */
  baseAgility: number;
  /** 每级敏捷成长 */
  agilityPerLevel: number;

  // --- 新增字段：职业机制 ---
  /** 职业专属机制数据 */
  mechanism: ClassMechanism;
}

// ============================================================================
// 职业机制数据定义
// ============================================================================

/** 战士 - 战魂系统 */
const WARRIOR_MECHANISM: ClassMechanism = {
  type: 'warSoul',
  nameZh: '战魂系统',
  description: '战斗中积累战魂值，释放"战魂爆发"临时提升攻击速度与生命偷取',
  warSoulGainOnDamage: 5,
  warSoulGainOnHit: 8,
  warSoulMaxValue: 100,
  warSoulBurstDuration: 8000,
  warSoulBurstAtkSpeedBonus: 1.5,
  warSoulBurstVampirism: 0.15,
  warSoulBurstCostPerSecond: 15,
};

/** 法师 - 元素共鸣 */
const MAGE_MECHANISM: ClassMechanism = {
  type: 'elementResonance',
  nameZh: '元素共鸣',
  description: '连续使用相同元素法术叠加伤害加成，切换元素时重置叠加层数',
  elementTypes: ['fire', 'ice', 'lightning'],
  elementStackDamageBonus: 0.08,
  elementStackDuration: 5000,
  elementMaxStacks: 5,
  elementResetOnSwitch: true,
};

/** 道士 - 道心通明 */
const TAOIST_MECHANISM: ClassMechanism = {
  type: 'daoHeart',
  nameZh: '道心通明',
  description: '普通攻击有概率触发"道心"状态，下一次治疗或辅助技能效果翻倍',
  daoHeartTriggerChance: 0.15,
  daoHeartBuffMultiplier: 2.0,
  daoHeartDuration: 10000,
  daoHeartAppliesToSkillTypes: ['singleHeal', 'rangeHeal', 'teamBuff', 'stealth', 'burstBuff'],
};

// ============================================================================
// 职业定义（完整版）
// ============================================================================

export const CLASS_DEFINITIONS: Record<CharacterClass, ClassDefinition> = {
  warrior: {
    id: 'warrior',
    name: '战士',
    description: '近战物理攻击职业，拥有强大的生命力和防御力，擅长近身搏斗。战魂系统让战士越战越勇。',
    baseHP: 150,
    baseMP: 30,
    hpPerLevel: 18,
    mpPerLevel: 3,
    baseAttack: 12,
    baseDefense: 8,
    baseMagic: 2,
    baseSpeed: 3.5,
    attackRange: 48,
    color: '#e74c3c',
    spriteColor: '#c0392b',
    icon: '⚔️',
    // 属性成长
    attackPerLevel: 2.5,
    defensePerLevel: 1.8,
    magicPerLevel: 0.3,
    baseAccuracy: 5,
    accuracyPerLevel: 0.8,
    baseAgility: 2,
    agilityPerLevel: 0.5,
    // 职业机制
    mechanism: WARRIOR_MECHANISM,
  },
  mage: {
    id: 'mage',
    name: '法师',
    description: '远程魔法攻击职业，拥有强大的魔法伤害，但生命值较低。元素共鸣让法师法术威力层层递进。',
    baseHP: 80,
    baseMP: 120,
    hpPerLevel: 8,
    mpPerLevel: 15,
    baseAttack: 4,
    baseDefense: 3,
    baseMagic: 16,
    baseSpeed: 3.2,
    attackRange: 200,
    color: '#3498db',
    spriteColor: '#2980b9',
    icon: '🔮',
    // 属性成长
    attackPerLevel: 0.8,
    defensePerLevel: 0.6,
    magicPerLevel: 2.8,
    baseAccuracy: 3,
    accuracyPerLevel: 0.5,
    baseAgility: 2,
    agilityPerLevel: 0.5,
    // 职业机制
    mechanism: MAGE_MECHANISM,
  },
  taoist: {
    id: 'taoist',
    name: '道士',
    description: '辅助型职业，可治愈队友、施毒降敌，还能召唤骷髅助战。道心通明让辅助效果更加强大。',
    baseHP: 110,
    baseMP: 80,
    hpPerLevel: 12,
    mpPerLevel: 10,
    baseAttack: 7,
    baseDefense: 5,
    baseMagic: 10,
    baseSpeed: 3.3,
    attackRange: 160,
    color: '#f39c12',
    spriteColor: '#e67e22',
    icon: '☯️',
    // 属性成长
    attackPerLevel: 1.5,
    defensePerLevel: 1.2,
    magicPerLevel: 2.0,
    baseAccuracy: 4,
    accuracyPerLevel: 0.6,
    baseAgility: 3,
    agilityPerLevel: 0.6,
    // 职业机制
    mechanism: TAOIST_MECHANISM,
  },
};

// ============================================================================
// 职业克制关系数据
// ============================================================================

/**
 * 职业克制关系:
 *   战士 → 道士: +10%伤害（物理克道术）
 *   道士 → 法师: +10%伤害（道术克魔法）
 *   法师 → 战士: +10%伤害（魔法克物理）
 */
export const CLASS_RESTRAINTS: ClassRestraint[] = [
  { attacker: 'warrior', defender: 'taoist', damageBonus: 0.10 },
  { attacker: 'taoist', defender: 'mage', damageBonus: 0.10 },
  { attacker: 'mage', defender: 'warrior', damageBonus: 0.10 },
];

/**
 * 获取职业克制伤害加成
 *
 * @param attackerClass  攻击方职业
 * @param defenderClass  防御方职业
 * @returns 伤害加成倍率（1.0 = 无加成, 1.1 = +10%）
 */
export function getClassRestraintBonus(attackerClass: CharacterClass, defenderClass: CharacterClass): number {
  const restraint = CLASS_RESTRAINTS.find(
    r => r.attacker === attackerClass && r.defender === defenderClass
  );
  return restraint ? 1 + restraint.damageBonus : 1.0;
}

/**
 * 获取职业的克制目标
 *
 * @param classType  职业
 * @returns 被克制的职业
 */
export function getClassRestraintTarget(classType: CharacterClass): CharacterClass {
  const restraint = CLASS_RESTRAINTS.find(r => r.attacker === classType);
  return restraint ? restraint.defender : classType;
}

/**
 * 获取克制某职业的职业
 *
 * @param classType  职业
 * @returns 克制该职业的攻击方职业
 */
export function getClassCounteredBy(classType: CharacterClass): CharacterClass {
  const restraint = CLASS_RESTRAINTS.find(r => r.defender === classType);
  return restraint ? restraint.attacker : classType;
}

/**
 * 获取职业机制数据
 *
 * @param classType  职业
 * @returns 职业机制数据
 */
export function getClassMechanismData(classType: CharacterClass): ClassMechanism {
  return CLASS_DEFINITIONS[classType].mechanism;
}