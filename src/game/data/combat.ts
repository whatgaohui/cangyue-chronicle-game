// 苍月纪元 - 战斗公式系统 (Combat Formula System)
// Complete damage calculation, hit/dodge, luck/curse/crit, class restraint, and newbie protection

import type { CharacterClass } from './classes';

// ============================================================
// TypeScript Interfaces
// ============================================================

export interface CombatStats {
  level: number;
  attackPower: number;
  magicPower: number;
  taoistPower: number;
  physicalDefense: number;
  magicDefense: number;
  accuracy: number;
  agility: number;
  luck: number;
  curse: number;
  critRate: number;
  critDamage: number;
  resilience: number;
  physicalResistance: number;
  magicResistance: number;
  ignoreDefenseRatio: number;
  ignoreMagicDefenseRatio: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
}

export interface DamageResult {
  damage: number;
  isCrit: boolean;
  isHit: boolean;
  isMinDamage: boolean;
  isMaxDamage: boolean;
  element?: 'fire' | 'ice' | 'lightning';
  damageType: 'physical' | 'magic' | 'taoist';
}

export interface CritResult {
  isCrit: boolean;
  multiplier: number;
}

export interface LuckyDamageResult {
  useMaxDamage: boolean;
  useMinDamage: boolean;
}

// ============================================================
// Constants
// ============================================================

/** Base crit rate before equipment bonuses */
const BASE_CRIT_RATE = 0.05;

/** Maximum crit rate achievable with equipment */
const MAX_CRIT_RATE = 0.20;

/** Base crit damage multiplier (150%) */
const BASE_CRIT_DAMAGE = 1.5;

/** Maximum crit damage multiplier achievable (200%) */
const MAX_CRIT_DAMAGE = 2.0;

/** Maximum luck from weapon (+7) + necklace (+3) */
const MAX_LUCK = 9;

/** Hit rate base percentage */
const HIT_RATE_BASE = 0.80;

/** Hit rate maximum cap */
const HIT_RATE_MAX = 0.95;

/** Hit rate minimum floor */
const HIT_RATE_MIN = 0.10;

/** Coefficient for (accuracy - agility) scaling in hit formula */
const HIT_DIFF_COEFFICIENT = 0.02;

/** Class restraint damage bonus (10%) */
const CLASS_RESTRAINT_BONUS = 0.10;

/** Newbie protection: max defender level */
const NEWBIE_MAX_LEVEL = 35;

/** Newbie protection: min attacker level that triggers protection */
const NEWBIE_ATTACKER_MIN_LEVEL = 40;

/** Damage random range minimum */
const RANDOM_RANGE_MIN = 0.95;

/** Damage random range maximum */
const RANDOM_RANGE_MAX = 1.05;

// ============================================================
// Utility Functions
// ============================================================

/**
 * Returns a random float between min and max (inclusive).
 */
function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Clamps a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================
// Hit / Dodge Formula
// ============================================================

/**
 * Calculate hit rate based on accuracy and agility difference.
 *
 * Formula:
 *   hitRate = 80% + (accuracy - agility) × coefficient
 *   hitRate capped at 95% max, 10% min
 *
 * @param attackerAccuracy  Attacker's accuracy stat
 * @param defenderAgility   Defender's agility stat
 * @returns Whether the attack hits (true) or is dodged (false)
 */
export function calculateHitResult(attackerAccuracy: number, defenderAgility: number): boolean {
  const rawHitRate = HIT_RATE_BASE + (attackerAccuracy - defenderAgility) * HIT_DIFF_COEFFICIENT;
  const hitRate = clamp(rawHitRate, HIT_RATE_MIN, HIT_RATE_MAX);
  return Math.random() < hitRate;
}

/**
 * Get the actual hit rate percentage (for display purposes).
 */
export function getHitRate(attackerAccuracy: number, defenderAgility: number): number {
  const rawHitRate = HIT_RATE_BASE + (attackerAccuracy - defenderAgility) * HIT_DIFF_COEFFICIENT;
  return clamp(rawHitRate, HIT_RATE_MIN, HIT_RATE_MAX);
}

// ============================================================
// Critical Hit Formula
// ============================================================

/**
 * Determine if an attack is a critical hit and the damage multiplier.
 *
 * Rules:
 *   - Base crit rate: 5%, equipment can boost to max 20%
 *   - Base crit damage: 150%, equipment can boost to max 200%
 *   - Target resilience reduces incoming crit chance
 *   - Crit damage multiplier is independently determined by critDamage stat
 *
 * @param critRate         Attacker's total crit rate (including equipment)
 * @param targetResilience Defender's resilience stat
 * @param critDamage       Attacker's total crit damage multiplier (e.g., 1.5 for 150%)
 * @returns CritResult with isCrit flag and multiplier
 */
export function calculateCrit(critRate: number, targetResilience: number, critDamage: number = BASE_CRIT_DAMAGE): CritResult {
  // Clamp crit rate: base 5% minimum, max 20%
  const effectiveCritRate = clamp(critRate, BASE_CRIT_RATE, MAX_CRIT_RATE);

  // Resilience reduces crit chance (subtractive)
  const finalCritRate = Math.max(0, effectiveCritRate - targetResilience);

  const isCrit = Math.random() < finalCritRate;

  // Crit damage uses the critDamage stat directly (independent of crit rate)
  const multiplier = isCrit ? clamp(critDamage, BASE_CRIT_DAMAGE, MAX_CRIT_DAMAGE) : 1.0;

  return { isCrit, multiplier };
}

// ============================================================
// Luck / Curse / Damage Range
// ============================================================

/**
 * Calculate luck-based damage modifiers.
 *
 * Rules:
 *   - Luck cap: weapon +7, necklace +3, total +9
 *   - At luck 9, always deal maximum damage
 *   - Curse: killing white-name players adds curse
 *   - Higher curse = easier to deal minimum damage + higher drop chance for victim
 *
 * @param luck   Attacker's luck stat (0-9)
 * @param curse  Attacker's curse stat
 * @returns LuckyDamageResult indicating if max/min damage should be forced
 */
export function calculateLuckyDamage(luck: number, curse: number): LuckyDamageResult {
  // Clamp luck to maximum of 9
  const effectiveLuck = clamp(luck, 0, MAX_LUCK);

  // At luck 9, always deal maximum damage
  if (effectiveLuck >= MAX_LUCK) {
    return { useMaxDamage: true, useMinDamage: false };
  }

  // Higher curse increases chance of dealing minimum damage
  // Each point of curse adds a 5% chance to force min damage
  const curseMinChance = curse * 0.05;
  if (curse > 0 && Math.random() < curseMinChance) {
    return { useMaxDamage: false, useMinDamage: true };
  }

  // Luck increases chance of dealing max damage (but not guaranteed)
  // Each point of luck adds ~10% chance for max damage
  const luckMaxChance = effectiveLuck * 0.10;
  if (effectiveLuck > 0 && Math.random() < luckMaxChance) {
    return { useMaxDamage: true, useMinDamage: false };
  }

  return { useMaxDamage: false, useMinDamage: false };
}

// ============================================================
// Class Restraint Bonus
// ============================================================

/**
 * Get the damage bonus from class restraint relationships.
 *
 * Rules:
 *   - Warrior (战士) beats Taoist (道士): +10% damage
 *   - Taoist (道士) beats Mage (法师): +10% damage
 *   - Mage (法师) beats Warrior (战士): +10% damage
 *
 * @param attackerClass  The attacker's class
 * @param defenderClass  The defender's class
 * @returns Damage bonus multiplier (1.0 for no bonus, 1.1 for restraint bonus)
 */
export function getClassRestraintBonus(attackerClass: CharacterClass, defenderClass: CharacterClass): number {
  // Warrior beats Taoist
  if (attackerClass === 'warrior' && defenderClass === 'taoist') {
    return 1 + CLASS_RESTRAINT_BONUS;
  }

  // Taoist beats Mage
  if (attackerClass === 'taoist' && defenderClass === 'mage') {
    return 1 + CLASS_RESTRAINT_BONUS;
  }

  // Mage beats Warrior
  if (attackerClass === 'mage' && defenderClass === 'warrior') {
    return 1 + CLASS_RESTRAINT_BONUS;
  }

  // No restraint relationship
  return 1.0;
}

// ============================================================
// Newbie Protection
// ============================================================

/**
 * Check if an attack is allowed under newbie protection rules.
 *
 * Rules:
 *   - Players level ≤ 35 cannot be attacked by players level ≥ 40
 *   - If attacked, 3s invincibility + forced disengage
 *
 * @param attackerLevel  The attacker's level
 * @param defenderLevel  The defender's level
 * @returns true if the attack is allowed, false if blocked by newbie protection
 */
export function applyNewbieProtection(attackerLevel: number, defenderLevel: number): boolean {
  // If defender is a newbie (≤35) and attacker is high level (≥40), block the attack
  if (defenderLevel <= NEWBIE_MAX_LEVEL && attackerLevel >= NEWBIE_ATTACKER_MIN_LEVEL) {
    return false;
  }

  return true;
}

// ============================================================
// Level Suppression - Minimum Damage
// ============================================================

/**
 * Calculate the minimum damage floor based on attacker level.
 *
 * Rule: All damage minimum = attacker.level × 0.5
 *
 * @param attackerLevel  The attacker's level
 * @returns Minimum damage value
 */
export function getMinimumDamage(attackerLevel: number): number {
  return attackerLevel * 0.5;
}

// ============================================================
// Physical Damage Formula
// ============================================================

/**
 * Calculate physical damage from an attack.
 *
 * Formula:
 *   actualDamage = (attacker.attackPower × skillMultiplier × damageBonus) - target.physicalDefense × (1 - ignoreDefenseRatio)
 *   minimumDamage = attacker.level × 0.5
 *   finalDamage = actualDamage × (1 - physicalResistance) × hitResult × critMultiplier × randomRange(0.95, 1.05)
 *
 * @param attacker          Attacker's combat stats
 * @param defender          Defender's combat stats
 * @param skillMultiplier   Skill's damage multiplier (e.g., 1.5 for 150% skill)
 * @param damageBonus       Additional damage bonus multiplier (e.g., 1.0 for no bonus)
 * @param ignoreDefenseRatio  Percentage of defense to ignore (0.0 to 1.0)
 * @param attackerClass     Attacker's class (for restraint bonus)
 * @param defenderClass     Defender's class (for restraint bonus)
 * @returns DamageResult with all calculation details
 */
export function calculatePhysicalDamage(
  attacker: CombatStats,
  defender: CombatStats,
  skillMultiplier: number = 1.0,
  damageBonus: number = 1.0,
  ignoreDefenseRatio: number = 0,
  attackerClass?: CharacterClass,
  defenderClass?: CharacterClass,
): DamageResult {
  // Step 1: Check hit/dodge
  const isHit = calculateHitResult(attacker.accuracy, defender.agility);
  if (!isHit) {
    return {
      damage: 0,
      isCrit: false,
      isHit: false,
      isMinDamage: false,
      isMaxDamage: false,
      damageType: 'physical',
    };
  }

  // Step 2: Calculate base actual damage
  const grossDamage = attacker.attackPower * skillMultiplier * damageBonus;
  const defenseReduction = defender.physicalDefense * (1 - ignoreDefenseRatio);
  let actualDamage = grossDamage - defenseReduction;

  // Step 3: Apply minimum damage floor (level suppression)
  const minimumDamage = getMinimumDamage(attacker.level);
  let isMinDamage = false;
  if (actualDamage < minimumDamage) {
    actualDamage = minimumDamage;
    isMinDamage = true;
  }

  // Step 4: Apply physical resistance
  let finalDamage = actualDamage * (1 - defender.physicalResistance);

  // Step 5: Check crit
  const critResult = calculateCrit(attacker.critRate, defender.resilience, attacker.critDamage);
  finalDamage *= critResult.multiplier;

  // Step 6: Apply luck/curse damage modifications
  const luckyResult = calculateLuckyDamage(attacker.luck, attacker.curse);
  let isMaxDamage = false;
  if (luckyResult.useMaxDamage) {
    // At max luck, use the maximum possible roll
    finalDamage = actualDamage * (1 - defender.physicalResistance) * critResult.multiplier * RANDOM_RANGE_MAX;
    isMaxDamage = true;
  } else if (luckyResult.useMinDamage) {
    // Curse forces minimum damage roll
    finalDamage = actualDamage * (1 - defender.physicalResistance) * critResult.multiplier * RANDOM_RANGE_MIN;
    isMinDamage = true;
  } else {
    // Step 7: Apply random range (0.95 to 1.05)
    finalDamage *= randomRange(RANDOM_RANGE_MIN, RANDOM_RANGE_MAX);
  }

  // Step 8: Apply class restraint bonus
  if (attackerClass && defenderClass) {
    finalDamage *= getClassRestraintBonus(attackerClass, defenderClass);
  }

  // Step 9: Ensure final damage doesn't go below minimum
  if (finalDamage < minimumDamage) {
    finalDamage = minimumDamage;
    isMinDamage = true;
  }

  // Round to integer
  finalDamage = Math.floor(Math.max(0, finalDamage));

  return {
    damage: finalDamage,
    isCrit: critResult.isCrit,
    isHit: true,
    isMinDamage,
    isMaxDamage,
    damageType: 'physical',
  };
}

// ============================================================
// Magic / Taoist Damage Formula
// ============================================================

/**
 * Calculate magic or taoist damage from a skill.
 *
 * Formula:
 *   actualDamage = (skillBaseDamage + magicOrTaoistPower × skillMultiplier) - target.magicDefense × (1 - ignoreMagicDefenseRatio)
 *   finalDamage = actualDamage × (1 - magicResistance) × elementCoefficient × hitResult × critMultiplier
 *
 * Note: Magic/Taoist damage does NOT have the randomRange(0.95, 1.05) that physical has,
 * per the design document specification.
 *
 * @param attacker                 Attacker's combat stats
 * @param defender                 Defender's combat stats
 * @param skillBaseDamage          Skill's fixed base damage
 * @param skillMultiplier          Skill's power scaling multiplier
 * @param elementCoeff             Elemental coefficient (1.0 for neutral)
 * @param ignoreMagicDefenseRatio  Percentage of magic defense to ignore (0.0 to 1.0)
 * @param damageType               'magic' or 'taoist'
 * @param element                  Elemental type of the skill
 * @param attackerClass            Attacker's class (for restraint bonus)
 * @param defenderClass            Defender's class (for restraint bonus)
 * @returns DamageResult with all calculation details
 */
export function calculateMagicDamage(
  attacker: CombatStats,
  defender: CombatStats,
  skillBaseDamage: number,
  skillMultiplier: number = 1.0,
  elementCoeff: number = 1.0,
  ignoreMagicDefenseRatio: number = 0,
  damageType: 'magic' | 'taoist' = 'magic',
  element?: 'fire' | 'ice' | 'lightning',
  attackerClass?: CharacterClass,
  defenderClass?: CharacterClass,
): DamageResult {
  // Step 1: Check hit/dodge
  const isHit = calculateHitResult(attacker.accuracy, defender.agility);
  if (!isHit) {
    return {
      damage: 0,
      isCrit: false,
      isHit: false,
      isMinDamage: false,
      isMaxDamage: false,
      element,
      damageType,
    };
  }

  // Step 2: Determine which power stat to use
  const powerStat = damageType === 'magic' ? attacker.magicPower : attacker.taoistPower;

  // Step 3: Calculate base actual damage
  const grossDamage = skillBaseDamage + powerStat * skillMultiplier;
  const defenseReduction = defender.magicDefense * (1 - ignoreMagicDefenseRatio);
  let actualDamage = grossDamage - defenseReduction;

  // Step 4: Apply minimum damage floor (level suppression)
  const minimumDamage = getMinimumDamage(attacker.level);
  let isMinDamage = false;
  if (actualDamage < minimumDamage) {
    actualDamage = minimumDamage;
    isMinDamage = true;
  }

  // Step 5: Apply magic resistance
  let finalDamage = actualDamage * (1 - defender.magicResistance);

  // Step 6: Apply element coefficient
  finalDamage *= elementCoeff;

  // Step 7: Check crit
  const critResult = calculateCrit(attacker.critRate, defender.resilience, attacker.critDamage);
  finalDamage *= critResult.multiplier;

  // Step 8: Apply luck/curse damage modifications
  const luckyResult = calculateLuckyDamage(attacker.luck, attacker.curse);
  let isMaxDamage = false;
  if (luckyResult.useMaxDamage) {
    // At max luck, recalculate without random variance (maximum potential)
    finalDamage = actualDamage * (1 - defender.magicResistance) * elementCoeff * critResult.multiplier;
    isMaxDamage = true;
  } else if (luckyResult.useMinDamage) {
    // Curse forces minimum damage - reduce by 5%
    finalDamage = actualDamage * (1 - defender.magicResistance) * elementCoeff * critResult.multiplier * 0.95;
    isMinDamage = true;
  }

  // Step 9: Apply class restraint bonus
  if (attackerClass && defenderClass) {
    finalDamage *= getClassRestraintBonus(attackerClass, defenderClass);
  }

  // Step 10: Ensure final damage doesn't go below minimum
  if (finalDamage < minimumDamage) {
    finalDamage = minimumDamage;
    isMinDamage = true;
  }

  // Round to integer
  finalDamage = Math.floor(Math.max(0, finalDamage));

  return {
    damage: finalDamage,
    isCrit: critResult.isCrit,
    isHit: true,
    isMinDamage,
    isMaxDamage,
    element,
    damageType,
  };
}

// ============================================================
// Convenience: Create Default Combat Stats
// ============================================================

/**
 * Create a default CombatStats object with all values initialized to sensible defaults.
 * Useful for creating new characters or testing.
 */
export function createDefaultCombatStats(overrides: Partial<CombatStats> = {}): CombatStats {
  return {
    level: 1,
    attackPower: 0,
    magicPower: 0,
    taoistPower: 0,
    physicalDefense: 0,
    magicDefense: 0,
    accuracy: 0,
    agility: 0,
    luck: 0,
    curse: 0,
    critRate: BASE_CRIT_RATE,
    critDamage: BASE_CRIT_DAMAGE,
    resilience: 0,
    physicalResistance: 0,
    magicResistance: 0,
    ignoreDefenseRatio: 0,
    ignoreMagicDefenseRatio: 0,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    ...overrides,
  };
}

// ============================================================
// Export Constants (for external modules)
// ============================================================

export {
  BASE_CRIT_RATE,
  MAX_CRIT_RATE,
  BASE_CRIT_DAMAGE,
  MAX_CRIT_DAMAGE,
  MAX_LUCK,
  HIT_RATE_BASE,
  HIT_RATE_MAX,
  HIT_RATE_MIN,
  HIT_DIFF_COEFFICIENT,
  CLASS_RESTRAINT_BONUS,
  NEWBIE_MAX_LEVEL,
  NEWBIE_ATTACKER_MIN_LEVEL,
  RANDOM_RANGE_MIN,
  RANDOM_RANGE_MAX,
};
