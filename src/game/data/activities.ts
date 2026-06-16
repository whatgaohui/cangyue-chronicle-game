// 苍月纪元 - 活动系统 (Activity System)
// Quest definitions, Daily/Weekly tasks, Timed Activities, Activity Points, Milestone tasks

// ============================================================
// 1. Quest Types & Interfaces
// ============================================================

/**
 * Quest type classification.
 * - main: Main storyline quest (chapters 1-35)
 * - daily: Resets daily at 0:00
 * - weekly: Resets weekly on Monday 0:00
 * - milestone: One-time achievement-triggered quest
 */
export type QuestType = 'main' | 'daily' | 'weekly' | 'milestone';

/**
 * Quest objective step definition.
 */
export interface QuestObjective {
  /** Unique step ID within the quest */
  id: string;
  /** Objective type */
  type: 'kill' | 'collect' | 'talk' | 'explore' | 'craft' | 'reachLevel' | 'participate';
  /** Target identifier (monster ID, item ID, NPC ID, map ID, etc.) */
  target: string;
  /** Required count to complete */
  requiredCount: number;
  /** Chinese description of this objective */
  description: string;
}

/**
 * Quest reward definition.
 */
export interface QuestReward {
  /** Reward type */
  type: 'xp' | 'gold' | 'boundGold' | 'ingot' | 'gloryPoints' | 'item' | 'activityPoints';
  /** Amount (for currency/XP rewards) */
  amount?: number;
  /** Item ID (for item rewards) */
  itemId?: string;
  /** Item quantity (for item rewards) */
  itemQuantity?: number;
}

/**
 * Quest definition with full metadata.
 */
export interface QuestDefinition {
  /** Unique quest identifier */
  id: string;
  /** Chinese quest name */
  name: string;
  /** Quest type */
  type: QuestType;
  /** Minimum level required to accept this quest */
  levelRequired: number;
  /** Quest objectives (all must be completed) */
  objectives: QuestObjective[];
  /** Rewards granted upon completion */
  rewards: QuestReward[];
  /** Reset rule (for daily/weekly quests) */
  resetRule: 'daily' | 'weekly' | 'none';
  /** Maximum times this quest can be completed per reset period */
  maxCompletionsPerReset: number;
  /** Number of rounds (for multi-round quests like 除魔任务) */
  roundsPerReset: number;
  /** Chinese description of the quest */
  description: string;
  /** Quest chain: ID of the next quest in sequence (if any) */
  chainNext?: string;
  /** Whether party progress is shared for kill objectives */
  partyProgressShared: boolean;
  /** Whether this quest requires guild membership */
  requiresGuild: boolean;
  /** Whether this quest must be completed in a guild party */
  requiresGuildParty: boolean;
}

// ============================================================
// 2. Activity Schedule Interface
// ============================================================

/**
 * Schedule for a timed activity.
 */
export interface ActivitySchedule {
  /** Reset frequency */
  type: 'daily' | 'weekly' | 'monthly';
  /** Days of the week (0=Sunday, 1=Monday, ... 6=Saturday). Only for weekly/monthly. */
  dayOfWeek?: number[];
  /** Week of the month (only for monthly, e.g., [1] = first week, [3] = third week) */
  weekOfMonth?: number[];
  /** Start hour (0-23) */
  startHour: number;
  /** Start minute (0-59) */
  startMinute: number;
  /** End hour (0-23) */
  endHour: number;
  /** End minute (0-59) */
  endMinute: number;
}

/**
 * Timed activity definition.
 */
export interface TimedActivity {
  /** Unique activity identifier */
  id: string;
  /** Chinese activity name */
  name: string;
  /** Activity schedule */
  schedule: ActivitySchedule;
  /** Chinese description */
  description: string;
  /** Whether this activity guarantees a minimum reward for participation */
  guaranteesReward: boolean;
  /** Participation criteria description */
  participationCriteria: string;
  /** Rewards for participation (guaranteed minimum) */
  participationRewards: QuestReward[];
  /** Whether the activity has no-ownership drops (free loot) */
  noOwnershipDrops: boolean;
  /** Whether PvP is allowed in this activity */
  pvpAllowed: boolean;
}

// ============================================================
// 3. Activity Point System (活跃度积分)
// ============================================================

/** Activity point tier thresholds (30/60/100) */
export const ACTIVITY_POINT_TIERS: number[] = [30, 60, 100];

/**
 * Activity point tier reward definition.
 */
export interface ActivityPointTierReward {
  /** Point threshold for this tier */
  threshold: number;
  /** Rewards granted when this tier is reached */
  rewards: QuestReward[];
}

/** Rewards for each activity point tier */
export const ACTIVITY_POINT_TIER_REWARDS: ActivityPointTierReward[] = [
  {
    threshold: 30,
    rewards: [
      { type: 'gold', amount: 5000 },
      { type: 'boundGold', amount: 2000 },
      { type: 'item', itemId: 'smallHealPot', itemQuantity: 5 },
    ],
  },
  {
    threshold: 60,
    rewards: [
      { type: 'gold', amount: 15000 },
      { type: 'boundGold', amount: 5000 },
      { type: 'item', itemId: 'largeHealPot', itemQuantity: 5 },
      { type: 'item', itemId: 'treasureMapFragment', itemQuantity: 1 },
    ],
  },
  {
    threshold: 100,
    rewards: [
      { type: 'gold', amount: 50000 },
      { type: 'boundGold', amount: 15000 },
      { type: 'ingot', amount: 100 },
      { type: 'item', itemId: 'treasureMapFragment', itemQuantity: 2 },
      { type: 'item', itemId: 'rareMaterialBox', itemQuantity: 1 },
    ],
  },
];

/** Activity points awarded per daily quest completion */
export const ACTIVITY_POINTS_PER_DAILY = 10;

/** Activity points awarded per weekly quest completion */
export const ACTIVITY_POINTS_PER_WEEKLY = 20;

/** Daily reset hour (0:00 = midnight) */
export const DAILY_RESET_HOUR = 0;

/** Weekly reset day (Monday = 1) */
export const WEEKLY_RESET_DAY = 1; // Monday

// ============================================================
// 4. Main Quest Definitions (主线任务 1-35)
// ============================================================

/**
 * Main quest phases:
 * Phase 1 (1-15): Tutorial - movement, attack, pickup, class selection, newbie items
 * Phase 2 (16-30): Skill guides, equipment/trading basics, transition equipment rewards
 * Phase 3 (31-35): Guild, PK, BOSS rules tutorial. Ends at 35.
 *
 * After level 35: no continuous main quests, only one-time exploration guides.
 */
export const MAIN_QUESTS: QuestDefinition[] = [
  // ==========================================
  // Phase 1: Tutorial (1-15)
  // ==========================================
  {
    id: 'main_tutorial_move',
    name: '初入苍月',
    type: 'main',
    levelRequired: 1,
    objectives: [
      { id: 'obj1', type: 'explore', target: 'biqiVillage', requiredCount: 1, description: '到达比奇村' },
      { id: 'obj2', type: 'talk', target: 'villageChief', requiredCount: 1, description: '与村长对话' },
    ],
    rewards: [
      { type: 'xp', amount: 100 },
      { type: 'gold', amount: 50 },
      { type: 'item', itemId: 'newbieSword', itemQuantity: 1 },
    ],
    resetRule: 'none',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '欢迎来到苍月大陆！先与村长对话，了解这个世界的规则。',
    chainNext: 'main_tutorial_attack',
    partyProgressShared: false,
    requiresGuild: false,
    requiresGuildParty: false,
  },
  {
    id: 'main_tutorial_attack',
    name: '战斗入门',
    type: 'main',
    levelRequired: 2,
    objectives: [
      { id: 'obj1', type: 'kill', target: 'chicken', requiredCount: 3, description: '消灭3只野鸡' },
      { id: 'obj2', type: 'kill', target: 'deer', requiredCount: 2, description: '猎杀2只鹿' },
    ],
    rewards: [
      { type: 'xp', amount: 200 },
      { type: 'gold', amount: 100 },
      { type: 'item', itemId: 'smallHealPot', itemQuantity: 3 },
    ],
    resetRule: 'none',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '学习如何攻击怪物和拾取战利品。',
    chainNext: 'main_tutorial_class',
    partyProgressShared: false,
    requiresGuild: false,
    requiresGuildParty: false,
  },
  {
    id: 'main_tutorial_class',
    name: '职业选择',
    type: 'main',
    levelRequired: 5,
    objectives: [
      { id: 'obj1', type: 'talk', target: 'classTrainer', requiredCount: 1, description: '与职业导师对话' },
      { id: 'obj2', type: 'kill', target: 'scarecrow', requiredCount: 5, description: '消灭5个稻草人' },
    ],
    rewards: [
      { type: 'xp', amount: 500 },
      { type: 'gold', amount: 200 },
      { type: 'item', itemId: 'classStarterPack', itemQuantity: 1 },
    ],
    resetRule: 'none',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '选择你的职业道路，获取新手装备包。',
    chainNext: 'main_tutorial_equipment',
    partyProgressShared: false,
    requiresGuild: false,
    requiresGuildParty: false,
  },
  {
    id: 'main_tutorial_equipment',
    name: '装备穿戴',
    type: 'main',
    levelRequired: 7,
    objectives: [
      { id: 'obj1', type: 'kill', target: 'orc', requiredCount: 5, description: '消灭5个半兽人' },
      { id: 'obj2', type: 'collect', target: 'leather', requiredCount: 2, description: '收集2个皮革' },
    ],
    rewards: [
      { type: 'xp', amount: 800 },
      { type: 'gold', amount: 300 },
      { type: 'item', itemId: 'bronzeArmor', itemQuantity: 1 },
    ],
    resetRule: 'none',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '学习如何穿戴和使用装备，击败半兽人获取材料。',
    chainNext: 'main_tutorial_pickup',
    partyProgressShared: false,
    requiresGuild: false,
    requiresGuildParty: false,
  },
  {
    id: 'main_tutorial_pickup',
    name: '拾取之道',
    type: 'main',
    levelRequired: 10,
    objectives: [
      { id: 'obj1', type: 'kill', target: 'snake', requiredCount: 8, description: '消灭8条毒蛇' },
      { id: 'obj2', type: 'collect', target: 'snakeFang', requiredCount: 3, description: '收集3个蛇牙' },
    ],
    rewards: [
      { type: 'xp', amount: 1200 },
      { type: 'gold', amount: 500 },
      { type: 'item', itemId: 'ironSword', itemQuantity: 1 },
    ],
    resetRule: 'none',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '学习自动拾取和手动拾取的区别。',
    chainNext: 'main_tutorial_newbieItems',
    partyProgressShared: false,
    requiresGuild: false,
    requiresGuildParty: false,
  },
  {
    id: 'main_tutorial_newbieItems',
    name: '新手礼包',
    type: 'main',
    levelRequired: 12,
    objectives: [
      { id: 'obj1', type: 'talk', target: 'villageChief', requiredCount: 1, description: '与村长对话' },
      { id: 'obj2', type: 'reachLevel', target: 'level', requiredCount: 12, description: '达到12级' },
    ],
    rewards: [
      { type: 'xp', amount: 1500 },
      { type: 'gold', amount: 500 },
      { type: 'item', itemId: 'newbieGiftBox', itemQuantity: 1 },
      { type: 'item', itemId: 'smallHealPot', itemQuantity: 10 },
    ],
    resetRule: 'none',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '村长为你准备了新手礼包，助你在苍月大陆成长。',
    chainNext: 'main_phase2_skills',
    partyProgressShared: false,
    requiresGuild: false,
    requiresGuildParty: false,
  },

  // ==========================================
  // Phase 2: Skill & Equipment Guides (16-30)
  // ==========================================
  {
    id: 'main_phase2_skills',
    name: '技能修炼',
    type: 'main',
    levelRequired: 16,
    objectives: [
      { id: 'obj1', type: 'kill', target: 'skeleton', requiredCount: 10, description: '消灭10个骷髅' },
      { id: 'obj2', type: 'talk', target: 'skillMaster', requiredCount: 1, description: '与技能导师对话' },
    ],
    rewards: [
      { type: 'xp', amount: 3000 },
      { type: 'gold', amount: 1000 },
      { type: 'item', itemId: 'skillBookMid', itemQuantity: 1 },
    ],
    resetRule: 'none',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '学习更多技能，提升你的战斗能力。',
    chainNext: 'main_phase2_equipment',
    partyProgressShared: false,
    requiresGuild: false,
    requiresGuildParty: false,
  },
  {
    id: 'main_phase2_equipment',
    name: '装备与交易',
    type: 'main',
    levelRequired: 20,
    objectives: [
      { id: 'obj1', type: 'craft', target: 'any', requiredCount: 1, description: '合成任意物品' },
      { id: 'obj2', type: 'talk', target: 'blacksmith', requiredCount: 1, description: '与铁匠对话' },
      { id: 'obj3', type: 'kill', target: 'pigDemon', requiredCount: 5, description: '消灭5只猪妖' },
    ],
    rewards: [
      { type: 'xp', amount: 5000 },
      { type: 'gold', amount: 2000 },
      { type: 'item', itemId: 'transitionWeapon', itemQuantity: 1 },
      { type: 'item', itemId: 'transitionArmor', itemQuantity: 1 },
    ],
    resetRule: 'none',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '学习装备强化、交易和合成的基础知识。获得过渡装备奖励。',
    chainNext: 'main_phase2_enhancement',
    partyProgressShared: false,
    requiresGuild: false,
    requiresGuildParty: false,
  },
  {
    id: 'main_phase2_enhancement',
    name: '强化之路',
    type: 'main',
    levelRequired: 24,
    objectives: [
      { id: 'obj1', type: 'craft', target: 'enchant3', requiredCount: 1, description: '将装备强化到+3' },
      { id: 'obj2', type: 'kill', target: 'zumaGuard', requiredCount: 5, description: '消灭5个祖玛卫士' },
    ],
    rewards: [
      { type: 'xp', amount: 8000 },
      { type: 'gold', amount: 3000 },
      { type: 'item', itemId: 'enhanceStone', itemQuantity: 5 },
    ],
    resetRule: 'none',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '学习装备强化系统，将装备强化到+3。',
    chainNext: 'main_phase3_guild',
    partyProgressShared: false,
    requiresGuild: false,
    requiresGuildParty: false,
  },

  // ==========================================
  // Phase 3: Guild, PK, BOSS (31-35)
  // ==========================================
  {
    id: 'main_phase3_guild',
    name: '行会之道',
    type: 'main',
    levelRequired: 31,
    objectives: [
      { id: 'obj1', type: 'talk', target: 'guildManager', requiredCount: 1, description: '与行会管理员对话' },
      { id: 'obj2', type: 'explore', target: 'guildHall', requiredCount: 1, description: '参观行会大厅' },
    ],
    rewards: [
      { type: 'xp', amount: 10000 },
      { type: 'gold', amount: 5000 },
      { type: 'activityPoints', amount: 10 },
    ],
    resetRule: 'none',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '了解行会系统，加入或创建行会。',
    chainNext: 'main_phase3_pk',
    partyProgressShared: false,
    requiresGuild: false,
    requiresGuildParty: false,
  },
  {
    id: 'main_phase3_pk',
    name: '善恶法则',
    type: 'main',
    levelRequired: 33,
    objectives: [
      { id: 'obj1', type: 'talk', target: 'pkGuide', requiredCount: 1, description: '与PK导师对话' },
      { id: 'obj2', type: 'explore', target: 'arena', requiredCount: 1, description: '进入竞技场' },
      { id: 'obj3', type: 'kill', target: 'phantom', requiredCount: 3, description: '消灭3个幻影战士' },
    ],
    rewards: [
      { type: 'xp', amount: 12000 },
      { type: 'gold', amount: 5000 },
      { type: 'activityPoints', amount: 10 },
    ],
    resetRule: 'none',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '了解PK模式、红名系统和善恶规则。',
    chainNext: 'main_phase3_boss',
    partyProgressShared: false,
    requiresGuild: false,
    requiresGuildParty: false,
  },
  {
    id: 'main_phase3_boss',
    name: 'BOSS猎杀',
    type: 'main',
    levelRequired: 35,
    objectives: [
      { id: 'obj1', type: 'kill', target: 'worldBoss', requiredCount: 1, description: '参与击杀世界BOSS' },
      { id: 'obj2', type: 'talk', target: 'villageChief', requiredCount: 1, description: '与村长对话' },
    ],
    rewards: [
      { type: 'xp', amount: 20000 },
      { type: 'gold', amount: 10000 },
      { type: 'item', itemId: 'bossSlayerTitle', itemQuantity: 1 },
      { type: 'activityPoints', amount: 20 },
    ],
    resetRule: 'none',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '了解BOSS机制、归属权和参与奖励。这是主线任务的最终章。',
    partyProgressShared: false,
    requiresGuild: false,
    requiresGuildParty: false,
  },
];

// ============================================================
// 5. Daily Quest Definitions (日常任务)
// ============================================================

/**
 * Daily quest design principles:
 * - No punishment for missing, no lost rewards, no stamina limit
 * - Daily reset at 0:00
 *
 * | Task                  | Reset          | Logic                                           |
 * |-----------------------|----------------|--------------------------------------------------|
 * | 除魔任务 (Demon Slaying) | Daily 1x, 10 rounds | Kill specified monsters, party progress shared |
 * | 矿洞采掘 (Mine Excavation) | Daily 1x       | Mine materials in specified mine, PvP allowed  |
 * | 行会日常 (Guild Daily)   | Daily 2        | Must complete in guild party                     |
 * | 赏金猎人 (Bounty Hunter) | Daily 3        | Kill random elite monsters                       |
 */
export const DAILY_QUESTS: QuestDefinition[] = [
  {
    id: 'daily_demonSlaying',
    name: '除魔任务',
    type: 'daily',
    levelRequired: 20,
    objectives: [
      { id: 'obj1', type: 'kill', target: 'demonSlayTarget', requiredCount: 10, description: '消灭指定怪物' },
    ],
    rewards: [
      { type: 'xp', amount: 5000 },
      { type: 'gold', amount: 2000 },
      { type: 'boundGold', amount: 1000 },
      { type: 'activityPoints', amount: 10 },
    ],
    resetRule: 'daily',
    maxCompletionsPerReset: 1,
    roundsPerReset: 10,
    description: '每日除魔任务，共10轮，击杀指定怪物即可完成。组队进度共享。',
    partyProgressShared: true,
    requiresGuild: false,
    requiresGuildParty: false,
  },
  {
    id: 'daily_mineExcavation',
    name: '矿洞采掘',
    type: 'daily',
    levelRequired: 25,
    objectives: [
      { id: 'obj1', type: 'collect', target: 'mineOre', requiredCount: 10, description: '采集矿石' },
      { id: 'obj2', type: 'explore', target: 'designatedMine', requiredCount: 1, description: '进入指定矿洞' },
    ],
    rewards: [
      { type: 'xp', amount: 3000 },
      { type: 'gold', amount: 1500 },
      { type: 'item', itemId: 'mineMaterialBox', itemQuantity: 1 },
      { type: 'activityPoints', amount: 10 },
    ],
    resetRule: 'daily',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '在指定矿洞中采集材料。注意：矿洞内允许PvP！',
    partyProgressShared: true,
    requiresGuild: false,
    requiresGuildParty: false,
  },
  {
    id: 'daily_guildDaily',
    name: '行会日常',
    type: 'daily',
    levelRequired: 27,
    objectives: [
      { id: 'obj1', type: 'kill', target: 'guildTarget', requiredCount: 15, description: '消灭行会任务怪物' },
      { id: 'obj2', type: 'collect', target: 'guildMaterial', requiredCount: 3, description: '收集行会物资' },
    ],
    rewards: [
      { type: 'xp', amount: 6000 },
      { type: 'gold', amount: 3000 },
      { type: 'gloryPoints', amount: 50 },
      { type: 'activityPoints', amount: 10 },
    ],
    resetRule: 'daily',
    maxCompletionsPerReset: 2,
    roundsPerReset: 1,
    description: '行会日常任务，必须以行会队伍完成，奖励荣耀积分。',
    partyProgressShared: true,
    requiresGuild: true,
    requiresGuildParty: true,
  },
  {
    id: 'daily_bountyHunter',
    name: '赏金猎人',
    type: 'daily',
    levelRequired: 30,
    objectives: [
      { id: 'obj1', type: 'kill', target: 'eliteMonster', requiredCount: 1, description: '击杀随机精英怪物' },
    ],
    rewards: [
      { type: 'xp', amount: 8000 },
      { type: 'gold', amount: 5000 },
      { type: 'item', itemId: 'bountyChest', itemQuantity: 1 },
      { type: 'activityPoints', amount: 10 },
    ],
    resetRule: 'daily',
    maxCompletionsPerReset: 3,
    roundsPerReset: 1,
    description: '每日赏金猎人任务，击杀随机出现的精英怪物，每日可完成3次。',
    partyProgressShared: true,
    requiresGuild: false,
    requiresGuildParty: false,
  },
];

// ============================================================
// 6. Weekly Quest Definitions (周常任务)
// ============================================================

/**
 * | Task                   | Reset          | Logic                                              |
 * |------------------------|----------------|-----------------------------------------------------|
 * | 悬赏跑环 (Bounty Chain)  | Weekly 1x, 20 rounds | Difficulty scales, final round gives aoyi remnants |
 * | BOSS狩猎 (BOSS Hunt)    | Weekly 1x      | Kill specified elite + boss                          |
 * | 藏宝图 (Treasure Map)   | Exchange 3/week | Exchange with activity points                        |
 */
export const WEEKLY_QUESTS: QuestDefinition[] = [
  {
    id: 'weekly_bountyChain',
    name: '悬赏跑环',
    type: 'weekly',
    levelRequired: 30,
    objectives: [
      { id: 'obj1', type: 'kill', target: 'bountyChainTarget', requiredCount: 1, description: '完成悬赏目标' },
    ],
    rewards: [
      { type: 'xp', amount: 15000 },
      { type: 'gold', amount: 10000 },
      { type: 'boundGold', amount: 5000 },
      { type: 'item', itemId: 'aoyiRemnant', itemQuantity: 1 },
      { type: 'activityPoints', amount: 20 },
    ],
    resetRule: 'weekly',
    maxCompletionsPerReset: 1,
    roundsPerReset: 20,
    description: '每周悬赏跑环，共20轮，难度递增。最后一轮奖励奥义残片。',
    partyProgressShared: true,
    requiresGuild: false,
    requiresGuildParty: false,
  },
  {
    id: 'weekly_bossHunt',
    name: 'BOSS狩猎',
    type: 'weekly',
    levelRequired: 35,
    objectives: [
      { id: 'obj1', type: 'kill', target: 'weeklyElite', requiredCount: 3, description: '击杀指定精英怪物' },
      { id: 'obj2', type: 'kill', target: 'weeklyBoss', requiredCount: 1, description: '击杀指定BOSS' },
    ],
    rewards: [
      { type: 'xp', amount: 25000 },
      { type: 'gold', amount: 15000 },
      { type: 'gloryPoints', amount: 100 },
      { type: 'item', itemId: 'bossChest', itemQuantity: 1 },
      { type: 'activityPoints', amount: 20 },
    ],
    resetRule: 'weekly',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '每周BOSS狩猎任务，击杀指定精英和BOSS获取丰厚奖励。',
    partyProgressShared: true,
    requiresGuild: false,
    requiresGuildParty: false,
  },
  {
    id: 'weekly_treasureMap',
    name: '藏宝图',
    type: 'weekly',
    levelRequired: 30,
    objectives: [
      { id: 'obj1', type: 'explore', target: 'treasureLocation', requiredCount: 1, description: '前往藏宝图指定地点' },
      { id: 'obj2', type: 'collect', target: 'treasureLoot', requiredCount: 1, description: '获取宝藏' },
    ],
    rewards: [
      { type: 'xp', amount: 10000 },
      { type: 'gold', amount: 8000 },
      { type: 'item', itemId: 'treasureChest', itemQuantity: 1 },
      { type: 'activityPoints', amount: 20 },
    ],
    resetRule: 'weekly',
    maxCompletionsPerReset: 3,
    roundsPerReset: 1,
    description: '每周可用活跃度积分兑换3张藏宝图，前往指定地点挖掘宝藏。',
    partyProgressShared: false,
    requiresGuild: false,
    requiresGuildParty: false,
  },
];

// ============================================================
// 7. Milestone One-Time Quests (里程碑一次性任务)
// ============================================================

/**
 * | Task                              | Trigger                        |
 * |-----------------------------------|--------------------------------|
 * | 内功启灵 (Neigong Initiation)       | Level 40 trigger               |
 * | 转生渡劫 (Reincarnation Tribulation) | Level 60 trigger               |
 * | 沙城征途 (Siege Journey)            | First siege participation      |
 */
export const MILESTONE_QUESTS: QuestDefinition[] = [
  {
    id: 'milestone_neigongInitiation',
    name: '内功启灵',
    type: 'milestone',
    levelRequired: 40,
    objectives: [
      { id: 'obj1', type: 'talk', target: 'neigongMaster', requiredCount: 1, description: '与内功大师对话' },
      { id: 'obj2', type: 'collect', target: 'neigongPill', requiredCount: 1, description: '获取内功丹' },
      { id: 'obj3', type: 'craft', target: 'neigongRitual', requiredCount: 1, description: '完成内功启灵仪式' },
    ],
    rewards: [
      { type: 'xp', amount: 50000 },
      { type: 'gold', amount: 20000 },
      { type: 'item', itemId: 'neigongPill', itemQuantity: 5 },
      { type: 'item', itemId: 'neigongTitle', itemQuantity: 1 },
    ],
    resetRule: 'none',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '40级触发，开启内功修炼之路。内功为你提供第二条生命和伤害减免。',
    partyProgressShared: false,
    requiresGuild: false,
    requiresGuildParty: false,
  },
  {
    id: 'milestone_reincarnation',
    name: '转生渡劫',
    type: 'milestone',
    levelRequired: 60,
    objectives: [
      { id: 'obj1', type: 'talk', target: 'reincarnationSage', requiredCount: 1, description: '与渡劫仙人对话' },
      { id: 'obj2', type: 'collect', target: 'reincarnationStone', requiredCount: 1, description: '获取转生石' },
      { id: 'obj3', type: 'participate', target: 'tribulationRitual', requiredCount: 1, description: '完成渡劫仪式' },
    ],
    rewards: [
      { type: 'xp', amount: 0 }, // Level resets, no XP reward
      { type: 'gold', amount: 100000 },
      { type: 'item', itemId: 'reincarnationGift', itemQuantity: 1 },
      { type: 'item', itemId: 'reinc1_weapon', itemQuantity: 1 },
    ],
    resetRule: 'none',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '60级触发，踏上转生之路。等级重置为1，但保留强化和装备，获得永久属性点。',
    partyProgressShared: false,
    requiresGuild: false,
    requiresGuildParty: false,
  },
  {
    id: 'milestone_siegeJourney',
    name: '沙城征途',
    type: 'milestone',
    levelRequired: 35,
    objectives: [
      { id: 'obj1', type: 'participate', target: 'siegeWarfare', requiredCount: 1, description: '首次参与攻城战' },
      { id: 'obj2', type: 'explore', target: 'siegeCastle', requiredCount: 1, description: '进入沙城' },
    ],
    rewards: [
      { type: 'xp', amount: 30000 },
      { type: 'gloryPoints', amount: 200 },
      { type: 'item', itemId: 'siegeParticipantTitle', itemQuantity: 1 },
      { type: 'item', itemId: 'siegeChest', itemQuantity: 1 },
    ],
    resetRule: 'none',
    maxCompletionsPerReset: 1,
    roundsPerReset: 1,
    description: '首次参与攻城战触发。感受沙城的战火与荣耀！',
    partyProgressShared: false,
    requiresGuild: true,
    requiresGuildParty: false,
  },
];

// ============================================================
// 8. Timed Activities (定时活动)
// ============================================================

/**
 * All timed activities in the game.
 *
 * Participation Guarantee: All contested activities guarantee minimum reward
 * for participation (dealing damage or participating in scene actions).
 *
 * Daily:
 *   - Double XP: 19:00-20:00, stackable with XP vouchers
 *   - Public BOSS: 14:00, 18:00, no ownership, free loot
 *
 * Weekly:
 *   - Monster Siege: Tue/Thu 20:00-21:00, Biqi City, no ownership drops
 *   - Guild Escort: Mon/Wed/Fri 20:00-21:00, escort + rob mechanics
 *   - Underground Treasure: Sun 15:00-16:00, chest protection then free loot
 *   - Siege Warfare: Sat 20:00-22:00
 *
 * Monthly:
 *   - Tournament: 1st Sunday, 1v1 elimination
 *   - Cross-server Expedition: 3rd weekend
 */
export const TIMED_ACTIVITIES: TimedActivity[] = [
  // ==========================================
  // Daily Activities
  // ==========================================
  {
    id: 'timed_doubleXP',
    name: '双倍经验',
    schedule: {
      type: 'daily',
      startHour: 19,
      startMinute: 0,
      endHour: 20,
      endMinute: 0,
    },
    description: '每日19:00-20:00，全服双倍经验！可与经验卷轴叠加。',
    guaranteesReward: false,
    participationCriteria: '在线即可享受双倍经验加成',
    participationRewards: [],
    noOwnershipDrops: false,
    pvpAllowed: false,
  },
  {
    id: 'timed_publicBoss_14',
    name: '公共BOSS（下午场）',
    schedule: {
      type: 'daily',
      startHour: 14,
      startMinute: 0,
      endHour: 14,
      endMinute: 30,
    },
    description: '每日14:00，公共BOSS降临！无归属权，所有玩家可自由拾取掉落。',
    guaranteesReward: true,
    participationCriteria: '对BOSS造成伤害即可获得参与奖励',
    participationRewards: [
      { type: 'gold', amount: 1000 },
      { type: 'xp', amount: 2000 },
    ],
    noOwnershipDrops: true,
    pvpAllowed: false,
  },
  {
    id: 'timed_publicBoss_18',
    name: '公共BOSS（傍晚场）',
    schedule: {
      type: 'daily',
      startHour: 18,
      startMinute: 0,
      endHour: 18,
      endMinute: 30,
    },
    description: '每日18:00，公共BOSS降临！无归属权，所有玩家可自由拾取掉落。',
    guaranteesReward: true,
    participationCriteria: '对BOSS造成伤害即可获得参与奖励',
    participationRewards: [
      { type: 'gold', amount: 1000 },
      { type: 'xp', amount: 2000 },
    ],
    noOwnershipDrops: true,
    pvpAllowed: false,
  },

  // ==========================================
  // Weekly Activities
  // ==========================================
  {
    id: 'timed_monsterSiege',
    name: '怪物攻城',
    schedule: {
      type: 'weekly',
      dayOfWeek: [2, 4], // Tuesday, Thursday
      startHour: 20,
      startMinute: 0,
      endHour: 21,
      endMinute: 0,
    },
    description: '周二/周四 20:00-21:00，怪物大举进攻比奇城！击杀怪物掉落无归属，自由拾取。',
    guaranteesReward: true,
    participationCriteria: '在比奇城场景内击杀攻城怪物或参与防守',
    participationRewards: [
      { type: 'gold', amount: 5000 },
      { type: 'xp', amount: 10000 },
      { type: 'item', itemId: 'siegeChest', itemQuantity: 1 },
    ],
    noOwnershipDrops: true,
    pvpAllowed: false,
  },
  {
    id: 'timed_guildEscort',
    name: '行会押镖',
    schedule: {
      type: 'weekly',
      dayOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
      startHour: 20,
      startMinute: 0,
      endHour: 21,
      endMinute: 0,
    },
    description: '周一/三/五 20:00-21:00，行会押镖活动！护送镖车到达终点获得奖励，其他行会可劫镖。',
    guaranteesReward: true,
    participationCriteria: '参与押镖或劫镖行动',
    participationRewards: [
      { type: 'gold', amount: 3000 },
      { type: 'gloryPoints', amount: 50 },
      { type: 'xp', amount: 8000 },
    ],
    noOwnershipDrops: false,
    pvpAllowed: true,
  },
  {
    id: 'timed_undergroundTreasure',
    name: '地下寻宝',
    schedule: {
      type: 'weekly',
      dayOfWeek: [0], // Sunday
      startHour: 15,
      startMinute: 0,
      endHour: 16,
      endMinute: 0,
    },
    description: '周日 15:00-16:00，地下宝藏开启！宝箱初始有保护期，保护期结束后自由拾取。',
    guaranteesReward: true,
    participationCriteria: '在地下宝藏场景内参与开箱或战斗',
    participationRewards: [
      { type: 'gold', amount: 2000 },
      { type: 'xp', amount: 5000 },
    ],
    noOwnershipDrops: true, // After protection period
    pvpAllowed: true,
  },
  {
    id: 'timed_siegeWarfare',
    name: '攻城战',
    schedule: {
      type: 'weekly',
      dayOfWeek: [6], // Saturday
      startHour: 20,
      startMinute: 0,
      endHour: 22,
      endMinute: 0,
    },
    description: '周六 20:00-22:00，沙城攻城战！行会争夺沙城归属权，胜者获得沙城税收和荣耀。',
    guaranteesReward: true,
    participationCriteria: '参与攻城或守城战斗，对敌方造成伤害或完成场景目标',
    participationRewards: [
      { type: 'gloryPoints', amount: 100 },
      { type: 'gold', amount: 10000 },
      { type: 'item', itemId: 'siegeChest', itemQuantity: 1 },
    ],
    noOwnershipDrops: false,
    pvpAllowed: true,
  },

  // ==========================================
  // Monthly Activities
  // ==========================================
  {
    id: 'timed_tournament',
    name: '天下第一武道会',
    schedule: {
      type: 'monthly',
      dayOfWeek: [0], // Sunday
      weekOfMonth: [1], // 1st Sunday
      startHour: 20,
      startMinute: 0,
      endHour: 22,
      endMinute: 0,
    },
    description: '每月第一个周日 20:00-22:00，1v1淘汰制武道会！角逐天下第一的荣耀。',
    guaranteesReward: true,
    participationCriteria: '报名并参与至少一场对战',
    participationRewards: [
      { type: 'gloryPoints', amount: 150 },
      { type: 'gold', amount: 15000 },
      { type: 'item', itemId: 'tournamentChest', itemQuantity: 1 },
    ],
    noOwnershipDrops: false,
    pvpAllowed: true,
  },
  {
    id: 'timed_crossServerExpedition',
    name: '跨服远征',
    schedule: {
      type: 'monthly',
      dayOfWeek: [6, 0], // Saturday + Sunday (weekend)
      weekOfMonth: [3], // 3rd weekend
      startHour: 20,
      startMinute: 0,
      endHour: 22,
      endMinute: 0,
    },
    description: '每月第三个周末 20:00-22:00，跨服远征！与其他服务器的勇士一较高下。',
    guaranteesReward: true,
    participationCriteria: '报名并参与跨服远征战斗',
    participationRewards: [
      { type: 'gloryPoints', amount: 200 },
      { type: 'gold', amount: 20000 },
      { type: 'item', itemId: 'crossServerChest', itemQuantity: 1 },
    ],
    noOwnershipDrops: false,
    pvpAllowed: true,
  },
];

// ============================================================
// 9. Quest Helper Functions
// ============================================================

/**
 * Get all quests available at a given level.
 */
export function getQuestsForLevel(level: number): QuestDefinition[] {
  return [
    ...MAIN_QUESTS,
    ...DAILY_QUESTS,
    ...WEEKLY_QUESTS,
    ...MILESTONE_QUESTS,
  ].filter((q) => q.levelRequired <= level);
}

/**
 * Get quests by type.
 */
export function getQuestsByType(type: QuestType): QuestDefinition[] {
  switch (type) {
    case 'main':
      return MAIN_QUESTS;
    case 'daily':
      return DAILY_QUESTS;
    case 'weekly':
      return WEEKLY_QUESTS;
    case 'milestone':
      return MILESTONE_QUESTS;
    default:
      return [];
  }
}

/**
 * Get a quest by its ID.
 */
export function getQuestById(id: string): QuestDefinition | undefined {
  const all = [...MAIN_QUESTS, ...DAILY_QUESTS, ...WEEKLY_QUESTS, ...MILESTONE_QUESTS];
  return all.find((q) => q.id === id);
}

/**
 * Get the main quest chain starting from a given quest ID.
 * Returns an ordered array of quests following the chain.
 */
export function getMainQuestChain(startId: string): QuestDefinition[] {
  const chain: QuestDefinition[] = [];
  let current = MAIN_QUESTS.find((q) => q.id === startId);

  while (current) {
    chain.push(current);
    if (!current.chainNext) break;
    current = MAIN_QUESTS.find((q) => q.id === current!.chainNext);
  }

  return chain;
}

/**
 * Get timed activities that are currently active.
 *
 * @param now Current timestamp (Date.now())
 * @returns Array of currently active timed activities
 */
export function getActiveTimedActivities(now: number): TimedActivity[] {
  const date = new Date(now);
  const currentDay = date.getDay(); // 0=Sunday
  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  // Get approximate week of month (1-indexed)
  const dayOfMonth = date.getDate();
  const weekOfMonth = Math.ceil(dayOfMonth / 7);

  return TIMED_ACTIVITIES.filter((activity) => {
    const { schedule } = activity;
    const activityStart = schedule.startHour * 60 + schedule.startMinute;
    const activityEnd = schedule.endHour * 60 + schedule.endMinute;

    // Check if current time is within the activity window
    if (currentTime < activityStart || currentTime >= activityEnd) {
      return false;
    }

    switch (schedule.type) {
      case 'daily':
        return true; // Every day

      case 'weekly':
        if (!schedule.dayOfWeek || !schedule.dayOfWeek.includes(currentDay)) {
          return false;
        }
        return true;

      case 'monthly':
        if (!schedule.dayOfWeek || !schedule.dayOfWeek.includes(currentDay)) {
          return false;
        }
        if (schedule.weekOfMonth && !schedule.weekOfMonth.includes(weekOfMonth)) {
          return false;
        }
        return true;

      default:
        return false;
    }
  });
}

/**
 * Calculate the activity point tier that a player has reached.
 *
 * @param points Current activity points
 * @returns The highest tier reached, or 0 if no tier reached
 */
export function getActivityPointTier(points: number): number {
  let tier = 0;
  for (const threshold of ACTIVITY_POINT_TIERS) {
    if (points >= threshold) {
      tier = threshold;
    } else {
      break;
    }
  }
  return tier;
}

/**
 * Get rewards for a specific activity point tier.
 *
 * @param tier Tier threshold (30, 60, or 100)
 * @returns Array of rewards for that tier, or empty array if tier not found
 */
export function getActivityPointTierRewards(tier: number): QuestReward[] {
  const tierReward = ACTIVITY_POINT_TIER_REWARDS.find((t) => t.threshold === tier);
  return tierReward ? tierReward.rewards : [];
}

/**
 * Check if a quest can be accepted by a player.
 *
 * @param quest       Quest definition
 * @param playerLevel Player's current level
 * @param inGuild     Whether the player is in a guild
 * @param inGuildParty Whether the player is in a guild party
 * @returns Whether the quest can be accepted
 */
export function canAcceptQuest(
  quest: QuestDefinition,
  playerLevel: number,
  inGuild: boolean,
  inGuildParty: boolean,
): boolean {
  if (playerLevel < quest.levelRequired) return false;
  if (quest.requiresGuild && !inGuild) return false;
  if (quest.requiresGuildParty && !inGuildParty) return false;
  return true;
}
