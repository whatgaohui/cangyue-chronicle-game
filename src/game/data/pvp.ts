// 苍月纪元 - PVP系统 (PvP System)
// PK Mode, Red Name, Guild, Party definitions

// ============================================================
// 1. PK Mode System (PK模式)
// ============================================================

/**
 * PK modes available to players.
 *
 * 和平 (peace):   Cannot attack any player
 * 组队 (team):    Can attack enemy team members
 * 行会 (guild):   Can attack enemy guild members
 * 善恶 (goodEvil): Can only attack red/gray name players, no PK value gained
 * 全体 (all):     Can attack everyone, killing white-name players adds PK value
 */
export type PKMode = 'peace' | 'team' | 'guild' | 'goodEvil' | 'all';

/** PK mode display names (Chinese) */
export const PK_MODE_NAMES: Record<PKMode, string> = {
  peace: '和平',
  team: '组队',
  guild: '行会',
  goodEvil: '善恶',
  all: '全体',
};

/** PK mode descriptions */
export const PK_MODE_DESCRIPTIONS: Record<PKMode, string> = {
  peace: '无法攻击任何玩家',
  team: '可攻击非本队成员',
  guild: '可攻击非本行会成员',
  goodEvil: '仅可攻击红名/灰名玩家，不增加PK值',
  all: '可攻击所有玩家，击杀白名玩家增加PK值',
};

/** All available PK modes in order */
export const PK_MODES: PKMode[] = ['peace', 'team', 'guild', 'goodEvil', 'all'];

/** Default PK mode when a player logs in */
export const DEFAULT_PK_MODE: PKMode = 'goodEvil';

// ============================================================
// 2. Red Name System (红名系统)
// ============================================================

/** PK value threshold at which a player becomes red-named */
export const RED_NAME_THRESHOLD = 200;

/** PK value added when killing a white-name player in 'all' mode */
export const PK_VALUE_PER_KILL = 100;

/** Duration of gray name status in milliseconds (5 minutes) */
export const GRAY_NAME_DURATION = 5 * 60 * 1000; // 300,000ms

/** Whether natural PK value decay is enabled (per design: no natural decay) */
export const PK_NATURAL_DECAY_ENABLED = false;

/** PK value decay rate per minute (0 = no decay) */
export const PK_NATURAL_DECAY_RATE = 0;

/**
 * PK cleansing items: each item reduces PK value by a specified amount.
 * These are the only way to reduce PK value (no natural decay).
 */
export interface PKCleansingItem {
  itemId: string;
  name: string;
  pkValueReduction: number;
}

/** Items that can reduce PK value */
export const PK_CLEANSING_ITEMS: PKCleansingItem[] = [
  { itemId: 'pkCleanseSmall', name: '清心丹', pkValueReduction: 50 },
  { itemId: 'pkCleanseMedium', name: '化怨符', pkValueReduction: 150 },
  { itemId: 'pkCleanseLarge', name: '赎罪令', pkValueReduction: 300 },
];

// ============================================================
// 3. Red Name Penalties (红名惩罚)
// ============================================================

/**
 * Penalties applied to red-name players.
 * All values are multipliers (1.0 = no change).
 */
export interface RedNamePenalties {
  /** City guards will attack red-name players on sight */
  guardsAttack: boolean;
  /** Whether trading is forbidden */
  tradeForbidden: boolean;
  /** Repair price multiplier (e.g., 2.0 = double price) */
  repairPriceMultiplier: number;
  /** Shop purchase price multiplier */
  shopPriceMultiplier: number;
  /** Death drop probability multiplier (e.g., 3.0 = triple drop chance) */
  deathDropProbabilityMultiplier: number;
}

/** Penalties applied when a player is red-named */
export const RED_NAME_PENALTIES: RedNamePenalties = {
  guardsAttack: true,
  tradeForbidden: true,
  repairPriceMultiplier: 2.0,
  shopPriceMultiplier: 2.0,
  deathDropProbabilityMultiplier: 3.0,
};

// ============================================================
// 4. PK State Interface
// ============================================================

/**
 * Runtime PK state for a player.
 */
export interface PKState {
  /** Current PK mode */
  mode: PKMode;
  /** Current PK value (0 = clean, >= 200 = red name) */
  pkValue: number;
  /** Whether the player currently has gray name status */
  isGrayName: boolean;
  /** Timestamp when gray name status expires (0 = not gray) */
  grayNameExpiry: number;
  /** Whether the player is red-named (PK value >= threshold) */
  isRedName: boolean;
}

/**
 * Create a default PK state for a new player.
 */
export function createDefaultPKState(): PKState {
  return {
    mode: DEFAULT_PK_MODE,
    pkValue: 0,
    isGrayName: false,
    grayNameExpiry: 0,
    isRedName: false,
  };
}

/**
 * Check if a player can attack another player given their PK states and relationships.
 *
 * @param attacker      Attacker's PK state
 * @param target        Target's PK state
 * @param sameParty     Whether attacker and target are in the same party
 * @param sameGuild     Whether attacker and target are in the same guild
 * @returns Whether the attack is allowed under PK rules
 */
export function canAttackPlayer(
  attacker: PKState,
  target: PKState,
  sameParty: boolean,
  sameGuild: boolean,
): boolean {
  switch (attacker.mode) {
    case 'peace':
      // Cannot attack any player
      return false;

    case 'team':
      // Can attack non-party members
      return !sameParty;

    case 'guild':
      // Can attack non-guild members
      return !sameGuild;

    case 'goodEvil':
      // Can only attack red/gray name players
      return target.isRedName || target.isGrayName;

    case 'all':
      // Can attack everyone (except same party/guild if in those modes)
      return true;

    default:
      return false;
  }
}

/**
 * Calculate PK value change after killing a player.
 *
 * @param attackerMode     Attacker's PK mode
 * @param targetIsRedName  Whether the victim is red-named
 * @param targetIsGrayName Whether the victim is gray-named
 * @returns PK value change (positive = added PK value, 0 = no change)
 */
export function calculatePKValueChange(
  attackerMode: PKMode,
  targetIsRedName: boolean,
  targetIsGrayName: boolean,
): number {
  // goodEvil mode never adds PK value
  if (attackerMode === 'goodEvil') {
    return 0;
  }

  // Killing red/gray name players never adds PK value
  if (targetIsRedName || targetIsGrayName) {
    return 0;
  }

  // Killing white-name players in 'all' mode adds PK value
  if (attackerMode === 'all') {
    return PK_VALUE_PER_KILL;
  }

  // Other modes: killing white-name players also adds PK value
  // (team/guild mode kills of non-enemy players)
  return PK_VALUE_PER_KILL;
}

/**
 * Update PK state after killing another player.
 *
 * @param state           Current PK state
 * @param targetIsRedName Whether the victim is red-named
 * @param targetIsGrayName Whether the victim is gray-named
 * @returns Updated PK state
 */
export function updatePKStateAfterKill(
  state: PKState,
  targetIsRedName: boolean,
  targetIsGrayName: boolean,
): PKState {
  const pkGain = calculatePKValueChange(state.mode, targetIsRedName, targetIsGrayName);
  const newPkValue = state.pkValue + pkGain;
  const isWhiteNameVictim = !targetIsRedName && !targetIsGrayName;
  const now = Date.now();

  return {
    ...state,
    pkValue: newPkValue,
    isRedName: newPkValue >= RED_NAME_THRESHOLD,
    // Attacking a white-name player triggers gray name
    isGrayName: isWhiteNameVictim ? true : state.isGrayName,
    grayNameExpiry: isWhiteNameVictim ? now + GRAY_NAME_DURATION : state.grayNameExpiry,
  };
}

/**
 * Check and update gray name expiry.
 *
 * @param state Current PK state
 * @returns Updated PK state with expired gray name cleared
 */
export function tickGrayNameExpiry(state: PKState): PKState {
  const now = Date.now();
  if (state.isGrayName && state.grayNameExpiry > 0 && now >= state.grayNameExpiry) {
    return {
      ...state,
      isGrayName: false,
      grayNameExpiry: 0,
    };
  }
  return state;
}

/**
 * Apply PK cleansing item to reduce PK value.
 *
 * @param state   Current PK state
 * @param itemId  Cleansing item ID
 * @returns Updated PK state (or same state if item not found)
 */
export function applyPKCleansingItem(state: PKState, itemId: string): PKState {
  const item = PK_CLEANSING_ITEMS.find((i) => i.itemId === itemId);
  if (!item) return state;

  const newPkValue = Math.max(0, state.pkValue - item.pkValueReduction);
  return {
    ...state,
    pkValue: newPkValue,
    isRedName: newPkValue >= RED_NAME_THRESHOLD,
  };
}

// ============================================================
// 5. Guild System (行会系统)
// ============================================================

/** Item required to create a guild (号角 = horn) */
export const GUILD_CREATION_HORN_ITEM = 'omaHorn';

/** Gold cost to create a guild */
export const GUILD_CREATION_GOLD_COST = 1_000_000;

/** Initial maximum number of guild members */
export const GUILD_MAX_MEMBERS_BASE = 50;

/** Maximum possible guild members after upgrades */
export const GUILD_MAX_MEMBERS_MAX = 200;

/** Members added per guild level upgrade */
export const GUILD_MEMBERS_PER_LEVEL = 10;

/** Maximum guild level */
export const GUILD_MAX_LEVEL = 15;

/** Gold cost to upgrade guild per level */
export const GUILD_UPGRADE_COST_PER_LEVEL = 500_000;

/** Guild permission levels */
export type GuildPermission = 'member' | 'elite' | 'officer' | 'viceLeader' | 'leader';

/** Guild permission display names */
export const GUILD_PERMISSION_NAMES: Record<GuildPermission, string> = {
  member: '成员',
  elite: '精英',
  officer: '长老',
  viceLeader: '副会长',
  leader: '会长',
};

/** Guild permission hierarchy (higher index = higher permission) */
export const GUILD_PERMISSION_HIERARCHY: GuildPermission[] = [
  'member',
  'elite',
  'officer',
  'viceLeader',
  'leader',
];

/**
 * Check if permission A is >= permission B.
 */
export function hasPermissionLevel(a: GuildPermission, b: GuildPermission): boolean {
  return GUILD_PERMISSION_HIERARCHY.indexOf(a) >= GUILD_PERMISSION_HIERARCHY.indexOf(b);
}

/** Minimum permission to withdraw rare items from guild warehouse */
export const GUILD_WAREHOUSE_RARE_WITHDRAW_PERMISSION: GuildPermission = 'officer';

/**
 * Guild warehouse log entry.
 */
export interface GuildWarehouseLog {
  playerId: string;
  playerName: string;
  action: 'deposit' | 'withdraw';
  itemId: string;
  itemName: string;
  quantity: number;
  timestamp: number;
}

/**
 * Guild warehouse item.
 */
export interface GuildWarehouseItem {
  itemId: string;
  quantity: number;
  depositedBy: string;
  depositedAt: number;
  /** Whether this item is classified as rare (restricted withdrawal) */
  isRare: boolean;
}

/**
 * Guild skill definition.
 */
export interface GuildSkill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  effect: {
    type: 'statBonus' | 'xpBonus' | 'goldBonus' | 'dropRate';
    value: number; // per skill level
  };
  upgradeCost: number; // guild funds per level
}

/** Predefined guild skills */
export const GUILD_SKILLS: GuildSkill[] = [
  {
    id: 'guildSkill_attack',
    name: '战意',
    description: '提升行会成员攻击力',
    level: 1,
    maxLevel: 10,
    effect: { type: 'statBonus', value: 5 },
    upgradeCost: 100_000,
  },
  {
    id: 'guildSkill_defense',
    name: '铁壁',
    description: '提升行会成员防御力',
    level: 1,
    maxLevel: 10,
    effect: { type: 'statBonus', value: 5 },
    upgradeCost: 100_000,
  },
  {
    id: 'guildSkill_xp',
    name: '悟道',
    description: '提升行会成员经验获取',
    level: 1,
    maxLevel: 10,
    effect: { type: 'xpBonus', value: 0.02 },
    upgradeCost: 150_000,
  },
  {
    id: 'guildSkill_gold',
    name: '聚财',
    description: '提升行会成员金币获取',
    level: 1,
    maxLevel: 10,
    effect: { type: 'goldBonus', value: 0.02 },
    upgradeCost: 150_000,
  },
  {
    id: 'guildSkill_drop',
    name: '寻宝',
    description: '提升行会成员物品掉落率',
    level: 1,
    maxLevel: 5,
    effect: { type: 'dropRate', value: 0.01 },
    upgradeCost: 200_000,
  },
];

/**
 * Guild definition.
 */
export interface GuildDefinition {
  id: string;
  name: string;
  level: number;
  maxMembers: number;
  funds: number;
  memberIds: string[];
  warehouse: GuildWarehouseItem[];
  warehouseLogs: GuildWarehouseLog[];
  skills: Record<string, number>; // skill id → current level
  createdAt: number;
}

/**
 * Calculate max members for a given guild level.
 *
 * Formula: base + (level - 1) * increment, capped at max.
 */
export function getGuildMaxMembers(guildLevel: number): number {
  return Math.min(
    GUILD_MAX_MEMBERS_MAX,
    GUILD_MAX_MEMBERS_BASE + (guildLevel - 1) * GUILD_MEMBERS_PER_LEVEL,
  );
}

/**
 * Calculate upgrade cost for a guild level.
 */
export function getGuildUpgradeCost(guildLevel: number): number {
  return GUILD_UPGRADE_COST_PER_LEVEL * guildLevel;
}

/**
 * Create a new guild definition.
 */
export function createGuildDefinition(id: string, name: string, leaderId: string): GuildDefinition {
  return {
    id,
    name,
    level: 1,
    maxMembers: GUILD_MAX_MEMBERS_BASE,
    funds: 0,
    memberIds: [leaderId],
    warehouse: [],
    warehouseLogs: [],
    skills: {},
    createdAt: Date.now(),
  };
}

// ============================================================
// 6. Party System (组队系统)
// ============================================================

/** Maximum party members */
export const PARTY_MAX_MEMBERS = 5;

/** Item drop protection duration within party (milliseconds) */
export const PARTY_DROP_PROTECTION_MS = 3000;

/** Party loot modes */
export type PartyLootMode = 'free' | 'roundRobin' | 'leaderAssign';

/** Party loot mode display names */
export const PARTY_LOOT_MODE_NAMES: Record<PartyLootMode, string> = {
  free: '自由拾取',
  roundRobin: '轮流分配',
  leaderAssign: '队长分配',
};

/** Party loot mode descriptions */
export const PARTY_LOOT_MODE_DESCRIPTIONS: Record<PartyLootMode, string> = {
  free: '物品掉落后可自由拾取，队伍内3秒保护',
  roundRobin: '物品按顺序分配给队伍成员',
  leaderAssign: '所有物品由队长分配',
};

/**
 * XP bonus configuration for party play.
 * Larger level gap = more XP bonus for lower-level members.
 */
export interface PartyXPBonusConfig {
  /** Minimum level difference to trigger bonus */
  minLevelGap: number;
  /** XP bonus per level of difference (e.g., 0.05 = 5% per level gap) */
  bonusPerLevel: number;
  /** Maximum XP bonus cap (e.g., 0.50 = 50% max bonus) */
  maxBonus: number;
}

/** Party XP bonus rules */
export const PARTY_XP_BONUS_CONFIG: PartyXPBonusConfig = {
  minLevelGap: 3,
  bonusPerLevel: 0.05,
  maxBonus: 0.50,
};

/**
 * Calculate XP bonus multiplier for a lower-level party member.
 *
 * @param memberLevel  The lower-level member's level
 * @param highestLevel The highest-level member in the party
 * @returns XP bonus multiplier (e.g., 1.3 = 30% bonus)
 */
export function calculatePartyXPBonus(memberLevel: number, highestLevel: number): number {
  const levelGap = highestLevel - memberLevel;
  if (levelGap < PARTY_XP_BONUS_CONFIG.minLevelGap) {
    return 1.0; // No bonus for small gaps
  }
  const bonus = Math.min(
    PARTY_XP_BONUS_CONFIG.maxBonus,
    (levelGap - PARTY_XP_BONUS_CONFIG.minLevelGap + 1) * PARTY_XP_BONUS_CONFIG.bonusPerLevel,
  );
  return 1.0 + bonus;
}

/**
 * Party definition.
 */
export interface PartyDefinition {
  leaderId: string;
  memberIds: string[]; // max PARTY_MAX_MEMBERS
  lootMode: PartyLootMode;
  /** Index for round-robin assignment (incremented on each drop) */
  roundRobinIndex: number;
}

/**
 * Create a new party definition.
 */
export function createPartyDefinition(leaderId: string): PartyDefinition {
  return {
    leaderId,
    memberIds: [leaderId],
    lootMode: 'free',
    roundRobinIndex: 0,
  };
}

/**
 * Check if a party can add another member.
 */
export function canAddPartyMember(party: PartyDefinition): boolean {
  return party.memberIds.length < PARTY_MAX_MEMBERS;
}
