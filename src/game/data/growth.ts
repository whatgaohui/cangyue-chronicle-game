// 苍月纪元 - 角色成长系统 (Character Growth System)
// Level-experience table, Internal Martial Arts (内功), Reincarnation (转生),
// Newbie Protection, System Unlocks, and Helper Functions

// ============================================================
// 1. Level-Experience Table (1-60)
// ============================================================

/**
 * Cumulative XP milestones from the design document.
 * Index = level, value = cumulative XP needed to reach that level.
 *
 * Key milestones (in 万 = 10k units):
 *   Lv 1:  0万        Lv25:  200万       Lv30:  800万
 *   Lv35:  3,000万    Lv40:  12,000万    Lv45:  35,000万
 *   Lv50:  100,000万  Lv60:  500,000万
 *
 * XP values are stored as absolute numbers (not in 万).
 */
const XP_MILESTONES: Record<number, number> = {
  1: 0,
  25: 2_000_000,         // 200万
  30: 8_000_000,         // 800万
  35: 30_000_000,        // 3000万
  40: 120_000_000,       // 12000万
  45: 350_000_000,       // 35000万
  50: 1_000_000_000,     // 100000万
  60: 5_000_000_000,     // 500000万
};

/**
 * Build the full 60-entry XP table using exponential interpolation
 * between design-specified milestones.
 *
 * Between two milestones (lv1, xp1) and (lv2, xp2):
 *   xp(lv) = xp1 * (xp2 / xp1) ^ ((lv - lv1) / (lv2 - lv1))
 *
 * This guarantees:
 *   - The curve passes exactly through every milestone
 *   - Growth between milestones is smooth and exponential
 *   - No sudden jumps or discontinuities
 */
function buildExperienceTable(): number[] {
  const table: number[] = new Array(61); // index 0 unused, 1-60
  const milestoneLevels = Object.keys(XP_MILESTONES)
    .map(Number)
    .sort((a, b) => a - b);

  for (let i = 0; i < milestoneLevels.length - 1; i++) {
    const lv1 = milestoneLevels[i];
    const lv2 = milestoneLevels[i + 1];
    const xp1 = XP_MILESTONES[lv1];
    const xp2 = XP_MILESTONES[lv2];
    const span = lv2 - lv1;

    // Handle the special case where xp1 = 0 (level 1)
    // Use a simpler interpolation: distribute XP evenly between milestones
    // with a slight exponential curve for natural feeling
    if (xp1 === 0) {
      for (let lv = lv1; lv <= lv2; lv++) {
        if (lv === lv1) {
          table[lv] = 0;
        } else {
          // Quadratic interpolation from 0 to xp2
          const t = (lv - lv1) / span;
          table[lv] = Math.floor(xp2 * t * t);
        }
      }
    } else {
      const ratio = xp2 / xp1;
      for (let lv = lv1; lv <= lv2; lv++) {
        if (lv === lv1) {
          table[lv] = xp1;
        } else {
          const t = (lv - lv1) / span;
          table[lv] = Math.floor(xp1 * Math.pow(ratio, t));
        }
      }
    }
  }

  // Level 0 is not used; fill with 0
  table[0] = 0;

  return table;
}

/**
 * LEVEL_EXPERIENCE_TABLE[level] = cumulative XP required to reach that level.
 * Index 0 is unused (always 0). Valid indices: 1-60.
 *
 * Example: LEVEL_EXPERIENCE_TABLE[40] = 120,000,000
 */
export const LEVEL_EXPERIENCE_TABLE: number[] = buildExperienceTable();

/** Maximum character level */
export const MAX_LEVEL = 60;

// ============================================================
// 2. Internal Martial Arts (内功) System
// ============================================================

/**
 * Represents one level of the Internal Martial Arts (内功) system.
 *
 * Neigong is an independent second HP bar that absorbs damage first,
 * provides fixed damage reduction and damage increase passives.
 * Upgraded by consuming 内功丹 (internalPill).
 * Unlocks at level 40. No experience decay, no level suppression.
 */
export interface NeigongLevel {
  level: number;
  pillsRequired: number;   // cumulative pills consumed to reach this level
  maxNeigongHP: number;     // second HP bar value (absorbs damage first)
  damageReduction: number;  // fixed damage reduction percentage (0-1)
  damageIncrease: number;   // fixed damage increase percentage (0-1)
}

/**
 * Build the neigong level table (1-50).
 *
 * Design principles:
 *   - Pill cost grows exponentially: roughly 1.12x per level
 *   - Neigong HP grows linearly: 100 per level
 *   - Damage reduction grows slowly: starts at 1%, caps around 25%
 *   - Damage increase grows slowly: starts at 0.5%, caps around 15%
 */
function buildNeigongLevels(): NeigongLevel[] {
  const levels: NeigongLevel[] = [];
  let cumulativePills = 0;

  for (let lv = 1; lv <= 50; lv++) {
    // Pills needed for this specific level (exponential growth)
    const pillsForThisLevel = Math.ceil(Math.pow(lv, 1.5));
    cumulativePills += pillsForThisLevel;

    levels.push({
      level: lv,
      pillsRequired: cumulativePills,
      maxNeigongHP: 100 + (lv - 1) * 100,                   // 100, 200, 300, ... 5000
      damageReduction: Math.min(0.25, 0.01 + (lv - 1) * 0.005), // 1% → ~25.5% (capped at 25%)
      damageIncrease: Math.min(0.15, 0.005 + (lv - 1) * 0.003), // 0.5% → ~15% (capped at 15%)
    });
  }

  return levels;
}

/**
 * NEIGONG_LEVELS[0] = level 1, NEIGONG_LEVELS[49] = level 50.
 * Index = level - 1.
 */
export const NEIGONG_LEVELS: NeigongLevel[] = buildNeigongLevels();

/** Level at which the Neigong system unlocks */
export const NEIGONG_UNLOCK_LEVEL = 40;

/** Maximum Neigong level */
export const MAX_NEIGONG_LEVEL = 50;

// ============================================================
// 3. Reincarnation (转生) System
// ============================================================

/**
 * Represents one reincarnation tier.
 *
 * Reincarnation unlocks at level 60 (max level).
 * Level resets to 1, all enhancements and equipment stats preserved.
 * Grants permanent attribute points per reincarnation.
 * Maximum 9 reincarnations.
 */
export interface ReincarnationLevel {
  reincarnation: number;        // 1-9
  attributePointsGranted: number;  // permanent stat points awarded
  unlocksEquipment: string[];     // equipment IDs unlocked at this tier
  unlocksMaps: string[];          // map IDs unlocked at this tier
  unlocksSkill?: string;          // ultimate skill ID unlocked
  xpMultiplier: number;           // XP gain multiplier after this reincarnation
}

/**
 * Full reincarnation progression table.
 *
 * Each tier grants more attribute points, unlocks exclusive content,
 * and provides an increasing XP multiplier to speed re-leveling.
 */
export const REINCARNATION_LEVELS: ReincarnationLevel[] = [
  {
    reincarnation: 1,
    attributePointsGranted: 10,
    unlocksEquipment: ['reinc1_weapon', 'reinc1_armor'],
    unlocksMaps: ['reinc1_secretCave'],
    unlocksSkill: undefined, // No ultimate skill at tier 1
    xpMultiplier: 1.2,
  },
  {
    reincarnation: 2,
    attributePointsGranted: 15,
    unlocksEquipment: ['reinc2_weapon', 'reinc2_armor', 'reinc2_helmet'],
    unlocksMaps: ['reinc2_frozenAbyss'],
    unlocksSkill: undefined,
    xpMultiplier: 1.4,
  },
  {
    reincarnation: 3,
    attributePointsGranted: 20,
    unlocksEquipment: ['reinc3_weapon', 'reinc3_armor', 'reinc3_necklace'],
    unlocksMaps: ['reinc3_flameDomain'],
    unlocksSkill: undefined,
    xpMultiplier: 1.6,
  },
  {
    reincarnation: 4,
    attributePointsGranted: 25,
    unlocksEquipment: ['reinc4_weapon', 'reinc4_armor', 'reinc4_belt'],
    unlocksMaps: ['reinc4_shadowRealm'],
    unlocksSkill: undefined,
    xpMultiplier: 1.8,
  },
  {
    reincarnation: 5,
    attributePointsGranted: 30,
    unlocksEquipment: ['reinc5_weapon', 'reinc5_armor', 'reinc5_ring'],
    unlocksMaps: ['reinc5_demonSanctum'],
    unlocksSkill: undefined, // Tier 5: still no ultimate
    xpMultiplier: 2.0,
  },
  {
    reincarnation: 6,
    attributePointsGranted: 35,
    unlocksEquipment: ['reinc6_fullSet'],
    unlocksMaps: ['reinc6_celestialRuins'],
    unlocksSkill: 'heavenSlash',       // Warrior ultimate: 开天斩
    xpMultiplier: 2.3,
  },
  {
    reincarnation: 7,
    attributePointsGranted: 40,
    unlocksEquipment: ['reinc7_fullSet'],
    unlocksMaps: ['reinc7_abyssGate'],
    unlocksSkill: 'destroyHeavenFire',  // Mage ultimate: 灭天火
    xpMultiplier: 2.6,
  },
  {
    reincarnation: 8,
    attributePointsGranted: 50,
    unlocksEquipment: ['reinc8_fullSet'],
    unlocksMaps: ['reinc8_moonPalace'],
    unlocksSkill: 'wujiQi',            // Taoist ultimate: 无极真气
    xpMultiplier: 3.0,
  },
  {
    reincarnation: 9,
    attributePointsGranted: 60,
    unlocksEquipment: ['reinc9_supremeSet'],
    unlocksMaps: ['reinc9_chaosOrigin'],
    unlocksSkill: 'moonSpiritSummon',  // Final ultimate: 唤月灵 (all classes)
    xpMultiplier: 3.5,
  },
];

/** Maximum number of reincarnations */
export const MAX_REINCARNATION = 9;

/** Level required to attempt reincarnation */
export const REINCARNATION_REQUIRED_LEVEL = 60;

// ============================================================
// 4. Newbie Protection Rules
// ============================================================

/** Players at or below this level are protected from high-level attackers */
export const NEWBIE_PROTECTION_LEVEL = 35;

/** Attackers at or above this level cannot attack protected newbies */
export const NEWBIE_PROTECTION_ATTACKER_LEVEL = 40;

/** Duration of invincibility (ms) when a newbie is illegally attacked */
export const NEWBIE_INVINCIBILITY_DURATION = 3000; // 3 seconds

/**
 * Calculate the minimum damage that must be dealt regardless of defense.
 * Formula: attackerLevel × 0.5
 */
export const MINIMUM_DAMAGE_FORMULA = (attackerLevel: number): number => attackerLevel * 0.5;

// ============================================================
// 5. System Unlock Schedule
// ============================================================

/**
 * Describes a game system that unlocks at a specific character level.
 */
export interface SystemUnlock {
  level: number;
  systemName: string;
  description: string;
}

/**
 * Complete system unlock schedule for levels 1-60.
 * Ordered by level ascending.
 */
export const SYSTEM_UNLOCKS: SystemUnlock[] = [
  { level: 1,  systemName: 'basicSkills',          description: '基础技能' },
  { level: 3,  systemName: 'inventory',             description: '背包系统' },
  { level: 5,  systemName: 'equipment',             description: '装备穿戴' },
  { level: 7,  systemName: 'secondSkill',           description: '第二技能解锁' },
  { level: 10, systemName: 'thirdSkill',            description: '第三技能解锁' },
  { level: 12, systemName: 'questSystem',           description: '任务系统' },
  { level: 15, systemName: 'enhancement',           description: '装备强化' },
  { level: 17, systemName: 'fourthSkill',           description: '第四技能解锁' },
  { level: 20, systemName: 'crafting',              description: '合成系统' },
  { level: 22, systemName: 'fifthSkill',            description: '第五技能解锁' },
  { level: 25, systemName: 'basicEquipment',        description: '基础装备全解锁' },
  { level: 25, systemName: 'pvp',                   description: 'PvP对战' },
  { level: 27, systemName: 'guildSystem',           description: '行会系统' },
  { level: 30, systemName: 'midTierSkills',         description: '中级技能' },
  { level: 30, systemName: 'treasureMap',           description: '藏宝图系统' },
  { level: 33, systemName: 'worldBoss',             description: '世界Boss' },
  { level: 35, systemName: 'classDefiningSkills',   description: '职业核心技能' },
  { level: 35, systemName: 'mainQuestEnd',          description: '主线任务完结' },
  { level: 37, systemName: 'setEquipment',          description: '套装系统' },
  { level: 40, systemName: 'neigong',               description: '内功系统' },
  { level: 40, systemName: 'highTierSkills',        description: '高级技能' },
  { level: 42, systemName: 'reforge',               description: '装备重铸' },
  { level: 45, systemName: 'highTierTreasureMap',   description: '高级藏宝图' },
  { level: 45, systemName: 'awakening',             description: '装备觉醒' },
  { level: 48, systemName: 'premiumEquipment',      description: '极品装备掉落' },
  { level: 50, systemName: 'reincarnationPrereq',   description: '转生前置条件' },
  { level: 50, systemName: 'eliteDungeon',          description: '精英副本' },
  { level: 55, systemName: 'mythicEquipment',       description: '神话装备掉落' },
  { level: 58, systemName: 'chaosRealm',            description: '混沌领域' },
  { level: 60, systemName: 'reincarnation',         description: '转生系统' },
];

// ============================================================
// 6. Helper Functions
// ============================================================

/**
 * Get the cumulative XP required to reach a given level.
 *
 * @param level Target level (1-60)
 * @returns Cumulative XP needed, or 0 for invalid levels
 */
export function getExperienceForLevel(level: number): number {
  if (level < 1 || level > MAX_LEVEL) return 0;
  return LEVEL_EXPERIENCE_TABLE[level];
}

/**
 * Determine what level a character is at based on their cumulative XP.
 *
 * Performs an inverse lookup on the XP table.
 * If XP exceeds the requirement for level 60, returns 60.
 *
 * @param xp Current cumulative experience points
 * @returns The character's level (1-60)
 */
export function getLevelFromExperience(xp: number): number {
  if (xp <= 0) return 1;

  // Binary search for efficiency
  let lo = 1;
  let hi = MAX_LEVEL;

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (LEVEL_EXPERIENCE_TABLE[mid] <= xp) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return lo;
}

/**
 * Get the Neigong level data for a given number of cumulative pills consumed.
 *
 * @param pills Total 内功丹 consumed
 * @returns The NeigongLevel achieved, or a level-0 default if no pills consumed
 */
export function getNeigongLevel(pills: number): NeigongLevel {
  if (pills <= 0) {
    return {
      level: 0,
      pillsRequired: 0,
      maxNeigongHP: 0,
      damageReduction: 0,
      damageIncrease: 0,
    };
  }

  // Find the highest level whose pillsRequired <= pills
  let result = NEIGONG_LEVELS[0];
  for (const nl of NEIGONG_LEVELS) {
    if (nl.pillsRequired <= pills) {
      result = nl;
    } else {
      break;
    }
  }

  return result;
}

/**
 * Get reincarnation data for a specific reincarnation tier.
 *
 * @param reincarnation Reincarnation number (1-9)
 * @returns The ReincarnationLevel data, or a default zero-tier if invalid
 */
export function getReincarnationData(reincarnation: number): ReincarnationLevel {
  if (reincarnation < 1 || reincarnation > MAX_REINCARNATION) {
    return {
      reincarnation: 0,
      attributePointsGranted: 0,
      unlocksEquipment: [],
      unlocksMaps: [],
      xpMultiplier: 1.0,
    };
  }

  return REINCARNATION_LEVELS[reincarnation - 1];
}

/**
 * Get all systems that unlock at a specific level.
 *
 * @param level The character level to check
 * @returns Array of SystemUnlock entries that unlock at this level (may be empty)
 */
export function getSystemsUnlockedAtLevel(level: number): SystemUnlock[] {
  return SYSTEM_UNLOCKS.filter((su) => su.level === level);
}
