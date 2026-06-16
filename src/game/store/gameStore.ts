// 苍月纪元 - 核心游戏状态管理 (Zustand Store)

import { create } from 'zustand';
import { MAP_DEFINITIONS, getMapTile, isTileWalkable, getMapSpawnPoint } from '../data/maps';
import type { MapDefinition } from '../data/maps';
import { MONSTER_DEFINITIONS, BOSS_DEFINITIONS, getMonsterDef, isBoss } from '../data/monsters';
import type { MonsterDef } from '../data/monsters';
import { NPC_DEFINITIONS, getNPCsForMap } from '../data/npcs';
import type { NPCDef } from '../data/npcs';
import { ITEM_DEFINITIONS, RARITY_COLORS, RARITY_NAMES, calculateActiveSetBonuses, SET_BONUSES } from '../data/items';
import type { ItemDef, ItemRarity } from '../data/items';
import { BOT_DEFINITIONS, getBotsForMap } from '../data/bots';
import { SKILL_DEFINITIONS } from '../data/skills';
import type { SkillDef, AoyiAffix } from '../data/skills';
import { getSkillLevel, getSkillLevelName, canUnlockAoyi, AOYI_MATERIAL_ITEM_ID, AOYI_MATERIAL_COST } from '../data/skills';
import type { EntityRenderInfo, DamageNumber, ParticleEffect, SkillEffect, WeatherType as RendererWeatherType, GroundItem as RendererGroundItem } from '../engine/renderer';
import { getSkillVisualType, getSkillColor, renderer } from '../engine/renderer';
import { soundManager } from '../engine/soundManager';
import { calculatePhysicalDamage, calculateMagicDamage, getWeatherCombatModifiers, applyWeatherToPhysicalDamage, applyWeatherToMagicDamage, type WeatherType as CombatWeatherType } from '../engine/combatCalc';
import { type CombatStats, type DamageResult, getClassRestraintBonus as getClassRestraintBonusCombat } from '../data/combat';
import { type CurrencyWallet, createDefaultWallet, addCurrency, deductCurrency, hasEnoughCurrency, CURRENCY_DEFINITIONS, calculateGoldSinkCost, getInflationAdjustedMonsterDrop, shouldActivateInflationControl } from '../data/economy';
import { performEnchant, getEnchantSuccessRateV2, getEnchantFailureRule, getEnchantGoldCost, getEnchantMaterialCost, getEnchantStatMultiplier, getEnchantLevelColor, getEnchantLevelName, ENCHANT_CONFIG, type EnchantResult } from '../data/enchanting';
import { canReforge as canReforgeCheck, getReforgeGoldCost, getReforgeStoneCost, rollReforgeAffixes, affixesToStats, REFORGE_STONE_ITEM_ID, REFORGE_AFFIX_POOL } from '../data/reforge';
import type { ReforgeAffix } from '../data/reforge';
import { canAwaken as canAwakenCheck, getAwakeningGoldCost, getAwakeningMaterialCost, rollAwakeningAffix, AWAKENING_MATERIAL_ITEM_ID, MAX_AWAKENING_COUNT } from '../data/awakening';
import type { AwakeningAffix } from '../data/awakening';
import { LEVEL_EXPERIENCE_TABLE, getExperienceForLevel, getLevelFromExperience, getNeigongLevel, getReincarnationData, NEIGONG_UNLOCK_LEVEL, MAX_LEVEL, MAX_REINCARNATION, SYSTEM_UNLOCKS, getSystemsUnlockedAtLevel } from '../data/growth';
import { type PKMode, type PKState, createDefaultPKState, canAttackPlayer, updatePKStateAfterKill, tickGrayNameExpiry, applyPKCleansingItem, PK_MODE_NAMES, PK_MODES, RED_NAME_THRESHOLD } from '../data/pvp';
import { type QuestDefinition, type QuestObjective, DAILY_QUESTS, WEEKLY_QUESTS, MAIN_QUESTS, MILESTONE_QUESTS, ACTIVITY_POINT_TIER_REWARDS, ACTIVITY_POINT_TIERS, ACTIVITY_POINTS_PER_DAILY, ACTIVITY_POINTS_PER_WEEKLY, TIMED_ACTIVITIES } from '../data/activities';
import { saveGame, loadGame, hasSaveData, autoSave, deleteSave, loadAllSaves, getCharacterList, saveCharacter, loadCharacter, deleteCharacter, generateCharacterId, canCreateCharacter, getMaxCharacters, type SaveData, type CharacterSlot, type MultiSaveData, type PlayerSaveData } from '../data/save';
import { CRAFTING_RECIPES, getAvailableRecipes, canCraftRecipe, type CraftingRecipe } from '../data/recipes';
import { CLASS_DEFINITIONS, type ClassDefinition, type ClassMechanism, getClassRestraintBonus, getClassMechanismData } from '../data/classes';

// === 类型定义 ===
export type CharacterClass = 'warrior' | 'mage' | 'taoist';
export type GamePhase = 'character_select' | 'playing' | 'dead';

export interface InventoryItem {
  id: string;
  itemId: string;
  count: number;
  // 小极品系统
  premiumBonus?: {
    tier: 'normal' | 'fine' | 'superior' | 'supreme'; // 凡品/上品/极品
    extraStats: Record<string, number>;  // 额外属性点
    luckBonus?: number;  // 项链幸运加成
    floatMultiplier?: number; // 基础属性浮动倍率
  };
  // 装备耐久
  currentDurability?: number;
  // 重铸词条
  reforgeAffixes?: { affixId: string; stat: string; value: number }[];
  // 觉醒词条
  awakenedAffixes?: string[]; // AwakeningAffix.id[]
  awakenCount?: number;
}

export interface Equipment {
  weapon?: InventoryItem;
  head?: InventoryItem;
  body?: InventoryItem;
  feet?: InventoryItem;
  necklace?: InventoryItem;
  ring1?: InventoryItem;
  ring2?: InventoryItem;
  bracelet1?: InventoryItem;
  bracelet2?: InventoryItem;
  belt?: InventoryItem;
  medal?: InventoryItem;
  jade?: InventoryItem;
}

export type EquipmentSlotType = keyof Equipment;

export interface ActiveSkill {
  id: string;
  cooldownEnd: number;
}

export interface MonsterInstance {
  id: string;
  defId: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  mp: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
  color: string;
  symbol: string;
  size: number;
  aggressive: boolean;
  attackRange: number;
  isBoss: boolean;
  isDead: boolean;
  lastAttackTime: number;
  targetId?: string;
  spawnX: number;
  spawnY: number;
  exp: number;
  gold: number;
  moveTimer: number;
  homeX: number;
  homeY: number;
}

export interface BotInstance {
  id: string;
  defId: string;
  name: string;
  x: number;
  y: number;
  level: number;
  class: CharacterClass;
  color: string;
  symbol: string;
  chatMessages: string[];
  movePattern: 'patrol' | 'wander' | 'stationary';
  patrolPoints: { x: number; y: number }[];
  currentPatrolIndex: number;
  moveTimer: number;
  chatTimer: number;
}

export interface SummonInstance {
  id: string;
  defId: string;  // 'skeleton' | 'beast' | 'moon_spirit'
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
  color: string;
  symbol: string;
  size: number;
  attackRange: number;
  targetId?: string;
  lastAttackTime: number;
  moveTimer: number;
  ownerType: 'player'; // could extend to 'bot' later
  summonType: 'skeleton' | 'beast' | 'moon_spirit';
  expiresAt: number; // timestamp when summon expires
}

export interface NPCInstance {
  id: string;
  defId: string;
  name: string;
  title: string;
  x: number;
  y: number;
  color: string;
  symbol: string;
  type: string;
  dialog: string[];
  shopItems?: { itemId: string; price: number }[];
  craftRecipes?: any[];
  teleportTargets?: { mapId: string; name: string; cost: number }[];
}

export interface DungeonInstance {
  id: string;
  mapId: string;
  name: string;
  timeLimit: number; // seconds
  startTime: number;
  monsters: MonsterInstance[];
  isCompleted: boolean;
  isFailed: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  type: 'system' | 'world' | 'local' | 'private' | 'boss_announce' | 'event_announce';
  timestamp: number;
  color: string;
  channel: 'system' | 'combat' | 'trade' | 'party' | 'all';
}

// === 地面掉落物品 ===
export interface GroundItem {
  id: string;
  x: number;
  y: number;
  itemId: string;
  name: string;
  rarity: string;
  timestamp: number;
}

// === 世界Boss定时刷新系统 ===
export interface WorldBossScheduleEntry {
  nextSpawn: number; // timestamp of next spawn
  isAlive: boolean;  // whether boss is currently alive on the map
  lastSpawnTime: number; // timestamp of last spawn
}

export interface BossBelongingInfo {
  ownerId: string;
  ownerName: string;
  lastHitTime: number;
  dropProtectionUntil: number; // 2 minutes after boss death
}

// === 活动点数系统 ===
export interface ActivityPointTierClaim {
  tier: number; // 30, 60, 100
  claimed: boolean;
}

// === 定时活动系统 ===
export interface TimedEventAnnouncement {
  id: string;
  message: string;
  time: number;
  type: 'boss' | 'event_start' | 'event_end';
}

export interface QuestState {
  id: string;
  name: string;
  description: string;
  type: 'kill' | 'collect' | 'talk';
  targetId: string;
  current: number;
  target: number;
  isComplete: boolean;
  reward: { exp: number; gold: number; items?: string[] };
}

export interface PlayerState {
  name: string;
  class: CharacterClass;
  level: number;
  exp: number;
  expToLevel: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  accuracy: number;
  agility: number;
  luck: number;
  critRate: number;
  critDamage: number;
  gold: number;
  x: number;
  y: number;
  mapId: string;
  isMoving: boolean;
  direction: number;
  speed: number; // tiles per second
}

// === 游戏状态接口 ===
export interface GameState {
  // 游戏阶段
  phase: GamePhase;

  // 玩家状态
  player: PlayerState;

  // 装备
  equipment: Equipment;

  // 背包
  inventory: InventoryItem[];
  maxInventorySize: number;

  // 技能
  skills: ActiveSkill[];
  skillBar: string[]; // 技能栏快捷键

  // 地图实体
  monsters: MonsterInstance[];
  npcs: NPCInstance[];
  bots: BotInstance[];

  // 召唤兽
  activeSummon: SummonInstance | null;

  // 副本
  activeDungeon: DungeonInstance | null;

  // 视觉效果
  damageNumbers: DamageNumber[];
  particles: ParticleEffect[];

  // 聊天
  chatMessages: ChatMessage[];

  // 地面掉落物品
  groundItems: GroundItem[];

  // 任务
  quests: QuestState[];

  // UI状态
  selectedTarget: { type: 'monster' | 'npc' | 'bot'; id: string } | null;
  showInventory: boolean;
  showCharacter: boolean;
  showSkills: boolean;
  showShop: boolean;
  showCraft: boolean;
  showDungeonPanel: boolean;
  showQuestLog: boolean;
  showMinimap: boolean;
  showDebugPanel: boolean;

  // NPC交互
  interactingNPC: NPCInstance | null;
  npcDialogIndex: number;

  // 游戏时间
  gameTick: number;
  lastUpdate: number;

  // 经济系统 - 4货币
  currency: CurrencyWallet;

  // 强化系统
  enchantLevels: Record<string, number>; // slot -> enchant level

  // 内功系统
  neigongLevel: number;
  neigongHP: number;
  maxNeigongHP: number;
  neigongPillsConsumed: number;

  // 转生系统
  reincarnation: number;
  reincarnationPoints: number;

  // PK系统
  pkState: PKState;

  // 职业机制
  warSoulValue: number;
  elementStacks: number;
  elementType: 'fire' | 'ice' | 'lightning' | 'none';
  daoHeartActive: boolean;
  daoHeartExpiry: number;

  // 音效
  soundEnabled: boolean;
  soundVolume: number;
  bgmEnabled: boolean;

  // 多角色存档
  activeCharacterId: string;

  // 日常活动
  activityPoints: number;
  dailyQuestResetTime: number;
  completedDailies: string[];
  completedWeeklies: string[];

  // 世界Boss定时刷新
  worldBossSchedule: Record<string, WorldBossScheduleEntry>;
  bossBelonging: Record<string, BossBelongingInfo>; // bossInstanceId → owner info

  // 活动点数详细追踪
  dailyCompleted: Record<string, boolean>; // questId → completed
  weeklyCompleted: Record<string, boolean>;
  activityPointRewardsClaimed: Record<number, boolean>; // tier → claimed (30/60/100)
  lastDailyReset: number; // timestamp of last daily reset
  lastWeeklyReset: number; // timestamp of last weekly reset

  // 每日签到系统
  lastLoginDate: string; // 'YYYY-MM-DD' format
  consecutiveLoginDays: number; // consecutive login days
  totalLoginDays: number; // total login days
  loginRewardClaimed: boolean; // whether today's reward has been claimed

  // 定时活动
  activeTimedEvents: string[]; // IDs of currently active events
  timedEventAnnouncements: TimedEventAnnouncement[];
  doubleExpActive: boolean; // 双倍经验是否激活

  // 活动面板
  showActivityPanel: boolean;
  showBossTimer: boolean;

  // 制作
  showCraftPanel: boolean;

  // 强化面板
  showEnchantPanel: boolean;

  // 技能熟练度
  skillProficiency: Record<string, number>; // skillId → 0-300

  // 奥义精修
  aoyiUnlocked: Record<string, string[]>; // skillId → list of unlocked aoyi affix IDs

  // 新UI面板
  showReforgePanel: boolean;
  showAwakenPanel: boolean;
  showAoyiPanel: boolean;
  showRepairPanel: boolean;

  // 天气系统
  currentWeather: RendererWeatherType;
  weatherChangeTimer: number; // ms countdown to next weather change

  // 技能视觉效果
  activeSkillEffects: SkillEffect[];

  // 自动攻击
  autoAttackEnabled: boolean;
  autoAttackTarget: string | null; // entity ID
  autoAttackCooldown: number; // ms until next auto-attack

  // GM调试模式
  gmMode: boolean;
  showGMPanel: boolean;

  // 攻略面板
  showGuidePanel: boolean;

  // 地图传送面板
  showTeleportPanel: boolean;

  // === Actions ===
  // 角色选择
  selectCharacter: (name: string, characterClass: CharacterClass) => void;

  // 召唤
  summonEntity: (skillId: string) => void;
  dismissSummon: () => void;
  tickSummon: (deltaTime: number, monsters: MonsterInstance[]) => void;

  // 移动
  movePlayer: (dx: number, dy: number) => void;
  moveToPosition: (x: number, y: number) => void;
  stopMovement: () => void;

  // 战斗
  attackTarget: () => void;
  useSkill: (skillId: string) => void;
  takeDamage: (amount: number, sourceId: string) => void;
  healPlayer: (amount: number) => void;

  // 物品
  useItem: (inventoryId: string) => void;
  useQuickPotion: (kind: 'hp' | 'mp') => boolean;
  equipItem: (inventoryId: string) => void;
  unequipItem: (slot: keyof Equipment) => void;
  sellItem: (inventoryId: string) => void;
  buyItem: (itemId: string, price: number) => void;

  // 地图
  changeMap: (mapId: string, spawnX?: number, spawnY?: number) => void;

  // NPC交互
  interactWithNPC: (npcId: string) => void;
  closeNPCDialog: () => void;
  nextDialog: () => void;

  // 副本
  enterDungeon: (dungeonMapId: string) => void;
  exitDungeon: () => void;

  // UI切换
  toggleInventory: () => void;
  toggleCharacter: () => void;
  toggleSkills: () => void;
  toggleShop: () => void;
  toggleCraft: () => void;
  toggleDungeonPanel: () => void;
  toggleQuestLog: () => void;
  toggleMinimap: () => void;
  toggleDebugPanel: () => void;

  // 选择目标
  selectTarget: (type: 'monster' | 'npc' | 'bot', id: string) => void;
  clearTarget: () => void;

  // 聊天
  sendChat: (message: string, channel?: 'system' | 'combat' | 'trade' | 'party' | 'all') => void;

  // 地面物品
  pickupGroundItem: (id: string) => void;
  tickGroundItems: () => void;

  // 游戏循环
  gameLoop: (deltaTime: number) => void;
  loadMapEntities: () => void;

  // 复活
  respawn: () => void;

  // 传送
  teleportToMap: (mapId: string, cost: number) => void;

  // 接受任务
  acceptQuest: (questId: string) => void;

  // 经济
  addCurrencyAction: (type: 'gold' | 'boundGold' | 'ingot' | 'gloryPoints', amount: number) => void;
  spendCurrency: (type: 'gold' | 'boundGold' | 'ingot' | 'gloryPoints', amount: number) => boolean;

  // 强化
  enchantEquipment: (slot: string, useProtection: boolean) => EnchantResult;

  // 内功
  consumeNeigongPill: () => void;

  // 转生
  attemptReincarnation: () => boolean;

  // PK
  setPKMode: (mode: PKMode) => void;
  usePKCleansingItem: (itemId: string) => void;

  // 职业机制
  activateWarSoul: () => void;

  // 音效
  toggleSound: () => void;
  toggleBGM: () => void;
  playSound: (name: string) => void;

  // 存档
  saveCurrentGame: () => void;
  loadSavedGame: (characterId: string) => boolean;

  // 制作
  craftItem: (recipeId: string) => boolean;
  toggleCraftPanel: () => void;

  // 强化面板
  toggleEnchantPanel: () => void;

  // 重铸
  reforgeEquipment: (inventoryItemId: string) => { success: boolean; cost: number; message: string };
  toggleReforgePanel: () => void;

  // 觉醒
  awakenEquipment: (inventoryItemId: string) => { success: boolean; cost: number; awakenedAffix?: string; message: string };
  toggleAwakenPanel: () => void;

  // 技能熟练度
  addSkillProficiency: (skillId: string, count: number) => void;

  // 奥义精修
  unlockAoyi: (skillId: string, affixId: string) => boolean;
  toggleAoyiPanel: () => void;

  // 世界Boss定时刷新
  checkWorldBossSpawn: () => void;
  claimBossBelonging: (bossInstanceId: string) => void;
  resetBossBelonging: (bossInstanceId: string) => void;

  // 活动点数
  completeDailyQuest: (questId: string) => void;
  completeWeeklyQuest: (questId: string) => void;
  claimActivityPointReward: (tier: number) => void;
  claimLoginReward: () => void;
  checkDailyLogin: () => void;
  checkActivityReset: () => void;
  addActivityPoints: (points: number) => void;

  // 定时活动
  checkTimedEvents: () => void;
  startTimedEvent: (eventId: string) => void;
  endTimedEvent: (eventId: string) => void;

  // 发送系统公告
  sendSystemAnnouncement: (message: string, type: 'boss_announce' | 'event_announce' | 'system') => void;

  // 活动面板
  toggleActivityPanel: () => void;
  toggleBossTimer: () => void;

  // 小极品生成（在掉落时调用）
  rollPremiumBonus: (itemId: string) => InventoryItem;

  // 装备耐久
  reduceDurability: (slot: keyof Equipment) => void;
  repairEquipment: (slot: keyof Equipment) => { success: boolean; cost: number };
  repairAllEquipment: () => { success: boolean; totalCost: number };
  toggleRepairPanel: () => void;

  // 天气系统
  updateWeather: () => void;

  // 技能视觉效果
  addSkillEffect: (effect: Omit<SkillEffect, 'id' | 'startTime'>) => void;

  // 自动攻击
  toggleAutoAttack: () => void;
  setAutoAttackTarget: (entityId: string | null) => void;

  // GM调试模式
  toggleGMMode: () => void;
  toggleGMPanel: () => void;
  gmSetMaxLevel: () => void;
  gmAddGold: (amount: number) => void;
  gmAddItem: (itemId: string, count: number) => void;
  gmAddExp: (amount: number) => void;
  gmFullHpMp: () => void;
  gmToggleInvincible: () => void;
  gmKillAllMonsters: () => void;

  // 退出到角色选择
  exitToCharacterSelect: () => void;

  // 攻略面板
  toggleGuidePanel: () => void;

  // 地图传送面板
  toggleTeleportPanel: () => void;
  teleportToMapDirect: (mapId: string) => void;

  // 全屏地图
  showFullMap: boolean;
  toggleFullMap: () => void;

  // 技能栏自定义
  setSkillBar: (index: number, skillId: string) => void;

  // UI位置存储
  uiPositions: Record<string, { x: number; y: number }>;
  resetUILayout: () => void;
}

// 生成唯一ID
let idCounter = 0;
function genId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${idCounter++}`;
}

// 经验等级表 - 使用growth.ts的经验表
function getExpToLevel(level: number): number {
  return getExperienceForLevel(level + 1) - getExperienceForLevel(level);
}

// 职业基础属性 - 使用classes.ts的CLASS_DEFINITIONS
function getClassBaseStats(classType: CharacterClass) {
  const def = CLASS_DEFINITIONS[classType];
  if (!def) return { hp: 100, mp: 50, attack: 5, defense: 3, accuracy: 3, agility: 2, critRate: 5, critDamage: 150 };
  return {
    hp: def.baseHP,
    mp: def.baseMP,
    attack: def.baseAttack,
    defense: def.baseDefense,
    accuracy: def.baseAccuracy,
    agility: def.baseAgility,
    critRate: 5, // base crit rate from combat.ts
    critDamage: 150, // base crit damage from combat.ts
  };
}

// 音效管理器 - 使用导入的单例实例
// soundManager is imported from '../engine/soundManager'

// 在地图上找到可行走的随机位置
function findWalkablePosition(mapId: string, centerX: number, centerY: number, radius: number): { x: number; y: number } {
  const mapDef = MAP_DEFINITIONS[mapId];
  if (!mapDef) return { x: Math.floor(centerX), y: Math.floor(centerY) };

  const cx = Math.floor(centerX);
  const cy = Math.floor(centerY);

  for (let attempt = 0; attempt < 50; attempt++) {
    const x = cx + Math.floor((Math.random() - 0.5) * radius * 2);
    const y = cy + Math.floor((Math.random() - 0.5) * radius * 2);
    if (x >= 0 && y >= 0 && x < mapDef.width && y < mapDef.height) {
      const tile = getMapTile(mapId, x, y);
      if (isTileWalkable(tile)) return { x, y };
    }
  }
  // 后备：返回中心位置（如果可行走）
  const centerTile = getMapTile(mapId, cx, cy);
  if (isTileWalkable(centerTile)) return { x: cx, y: cy };
  // 最后的后备：搜索附近的可行走位置
  for (let r = 1; r <= 20; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && y >= 0 && x < mapDef.width && y < mapDef.height) {
          const tile = getMapTile(mapId, x, y);
          if (isTileWalkable(tile)) return { x, y };
        }
      }
    }
  }
  return { x: cx, y: cy };
}

// 生成地图怪物
function spawnMonstersForMap(mapId: string, playerX?: number, playerY?: number): MonsterInstance[] {
  const mapDef = MAP_DEFINITIONS[mapId];
  if (!mapDef) return [];

  const monsters: MonsterInstance[] = [];

  // 怪物生成中心点 = 玩家位置（如果提供），否则地图出生点
  const spawnCenter = {
    x: playerX ?? Math.floor(mapDef.width / 2),
    y: playerY ?? Math.floor(mapDef.height / 2),
  };

  // 根据地图类型调整生成参数
  // 野外地图生成更多怪物、更大范围；副本地图更集中
  const isDungeon = mapDef.type === 'dungeon';

  // 近距离生成半径：确保玩家身边有怪
  const nearRadius = isDungeon ? 15 : 50;
  // 远距离生成半径：在更大范围分布
  const farRadius = isDungeon ? 30 : 100;
  // 每种怪物总数
  const monsterCount = isDungeon ? 15 : 30;
  // 近距离数量（确保玩家一进入就能看到怪）
  const nearCount = isDungeon ? 10 : 15;
  const farCount = monsterCount - nearCount;

  for (const monsterId of mapDef.monsterIds) {
    const def = MONSTER_DEFINITIONS[monsterId];
    if (!def) continue;

    const totalPerType = Math.ceil(monsterCount / mapDef.monsterIds.length);
    const nearPerType = Math.ceil(nearCount / mapDef.monsterIds.length);
    const farPerType = totalPerType - nearPerType;

    // 近距离怪物 - 在玩家周围密集生成
    for (let i = 0; i < nearPerType; i++) {
      const pos = findWalkablePosition(mapId, spawnCenter.x, spawnCenter.y, nearRadius);
      monsters.push(createMonsterInstance(def, pos, false));
    }

    // 远距离怪物（分散在更大范围）
    for (let i = 0; i < farPerType; i++) {
      const pos = findWalkablePosition(mapId, spawnCenter.x, spawnCenter.y, farRadius);
      monsters.push(createMonsterInstance(def, pos, false));
    }
  }

  // Boss - 在玩家附近但不至于太近生成
  if (mapDef.bossIds) {
    for (const bossId of mapDef.bossIds) {
      const def = BOSS_DEFINITIONS[bossId];
      if (!def) continue;

      const bossPos = findWalkablePosition(mapId, spawnCenter.x + 10, spawnCenter.y + 10, 15);
      monsters.push(createMonsterInstance(def, bossPos, true));
    }
  }

  return monsters;
}

// 创建怪物实例的辅助函数
function createMonsterInstance(def: MonsterDef, pos: { x: number; y: number }, isBoss: boolean): MonsterInstance {
  return {
    id: genId(isBoss ? 'boss' : 'mon'),
    defId: def.id,
    name: def.name,
    x: pos.x,
    y: pos.y,
    hp: def.hp,
    maxHp: def.hp,
    mp: def.mp,
    attack: def.attack,
    defense: def.defense,
    speed: def.speed,
    level: def.level,
    color: def.color,
    symbol: def.symbol,
    size: def.size,
    aggressive: def.aggressive,
    attackRange: def.attackRange,
    isBoss,
    isDead: false,
    lastAttackTime: 0,
    spawnX: pos.x,
    spawnY: pos.y,
    exp: def.exp,
    gold: def.gold,
    moveTimer: Math.random() * 3000,
    homeX: pos.x,
    homeY: pos.y,
  };
}

// 生成NPC
function spawnNPCsForMap(mapId: string): NPCInstance[] {
  const npcDefs = getNPCsForMap(mapId);
  return npcDefs.map(def => ({
    id: genId('npc'),
    defId: def.id,
    name: def.name,
    title: def.title,
    x: def.x,
    y: def.y,
    color: def.color,
    symbol: def.symbol,
    type: def.type,
    dialog: def.dialog,
    shopItems: def.shopItems,
    craftRecipes: def.craftRecipes,
    teleportTargets: def.teleportTargets,
  }));
}

// 生成假玩家
function spawnBotsForMap(mapId: string): BotInstance[] {
  const botDefs = getBotsForMap(mapId);
  return botDefs.map(def => ({
    id: genId('bot'),
    defId: def.id,
    name: def.name,
    x: def.x,
    y: def.y,
    level: def.level,
    class: def.class,
    color: def.color,
    symbol: def.symbol,
    chatMessages: def.chatMessages,
    movePattern: def.movePattern,
    patrolPoints: def.patrolPoints || [],
    currentPatrolIndex: 0,
    moveTimer: Math.random() * 5000,
    chatTimer: Math.random() * 30000 + 10000,
  }));
}

// === 世界Boss刷新时间计算 ===
// 沃玛教主: 每日12:00和20:00
// 祖玛教主: 周三、周六21:30
// 赤月恶魔: 周日22:00

interface BossSpawnRule {
  bossId: string;
  bossName: string;
  mapId: string;
  spawnX: number;
  spawnY: number;
  schedule: {
    type: 'daily' | 'weekly';
    hours: number[];       // hours of spawn (for daily)
    minutes?: number[];    // minutes of spawn (default 0)
    dayOfWeek?: number[];  // 0=Sunday for weekly
  };
}

const WORLD_BOSS_SPAWN_RULES: BossSpawnRule[] = [
  {
    bossId: 'woma_leader',
    bossName: '沃玛教主',
    mapId: 'dungeon_woma',
    spawnX: 60,
    spawnY: 60,
    schedule: { type: 'daily', hours: [12, 20], minutes: [0, 0] },
  },
  {
    bossId: 'zuma_cult_leader',
    bossName: '祖玛教主',
    mapId: 'dungeon_zuma',
    spawnX: 80,
    spawnY: 80,
    schedule: { type: 'weekly', hours: [21], minutes: [30], dayOfWeek: [3, 6] }, // Wednesday=3, Saturday=6
  },
  {
    bossId: 'red_moon_demon',
    bossName: '赤月恶魔',
    mapId: 'dungeon_chiyue',
    spawnX: 60,
    spawnY: 60,
    schedule: { type: 'weekly', hours: [22], minutes: [0], dayOfWeek: [0] }, // Sunday=0
  },
];

function getNextSpawnTime(rule: BossSpawnRule, fromTime: number): number {
  const rule_ = rule.schedule;

  if (rule_.type === 'daily') {
    // Find the next spawn time today or tomorrow
    const hours = rule_.hours;
    const minutes = rule_.minutes || hours.map(() => 0);
    for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
      const d = new Date(fromTime);
      d.setDate(d.getDate() + dayOffset);
      for (let i = 0; i < hours.length; i++) {
        const candidate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours[i], minutes[i] || 0, 0, 0);
        if (candidate.getTime() > fromTime) {
          return candidate.getTime();
        }
      }
    }
  } else if (rule_.type === 'weekly') {
    // Find the next spawn time this week or next week
    const days = rule_.dayOfWeek || [];
    const hours = rule_.hours;
    const minutes = rule_.minutes || hours.map(() => 0);
    for (let weekOffset = 0; weekOffset < 3; weekOffset++) {
      for (const day of days) {
        for (let i = 0; i < hours.length; i++) {
          const d = new Date(fromTime);
          d.setDate(d.getDate() + ((day - d.getDay() + 7) % 7) + weekOffset * 7);
          const candidate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours[i], minutes[i] || 0, 0, 0);
          if (candidate.getTime() > fromTime) {
            return candidate.getTime();
          }
        }
      }
    }
  }

  // Fallback: 24 hours from now
  return fromTime + 24 * 60 * 60 * 1000;
}

function initializeWorldBossSchedule(): Record<string, WorldBossScheduleEntry> {
  const now = Date.now();
  const schedule: Record<string, WorldBossScheduleEntry> = {};
  for (const rule of WORLD_BOSS_SPAWN_RULES) {
    schedule[rule.bossId] = {
      nextSpawn: getNextSpawnTime(rule, now),
      isAlive: false,
      lastSpawnTime: 0,
    };
  }
  return schedule;
}

// 初始任务
function getInitialQuests(): QuestState[] {
  return [
    {
      id: 'quest_1', name: '初入银杏', description: '击杀5只野鸡',
      type: 'kill', targetId: 'chicken', current: 0, target: 5, isComplete: false,
      reward: { exp: 50, gold: 20 },
    },
    {
      id: 'quest_2', name: '猎狼行动', description: '击杀3只野狼',
      type: 'kill', targetId: 'wild_wolf', current: 0, target: 3, isComplete: false,
      reward: { exp: 100, gold: 50 },
    },
    {
      id: 'quest_3', name: '骷髅清剿', description: '击杀5只骷髅兵',
      type: 'kill', targetId: 'skeleton', current: 0, target: 5, isComplete: false,
      reward: { exp: 200, gold: 100 },
    },
  ];
}

// === Zustand Store ===
export const useGameStore = create<GameState>((set, get) => ({
  // 初始状态
  phase: 'character_select',

  player: {
    name: '',
    class: 'warrior',
    level: 1,
    exp: 0,
    expToLevel: getExpToLevel(1),
    hp: 200,
    maxHp: 200,
    mp: 30,
    maxMp: 30,
    attack: 12,
    defense: 8,
    accuracy: 5,
    agility: 3,
    luck: 0,
    critRate: 5,
    critDamage: 150,
    gold: 100,
    x: 100,
    y: 100,
    mapId: 'yinxing_valley',
    isMoving: false,
    direction: 0,
    speed: 8, // tiles per second
  },

  equipment: {},
  inventory: [
    { id: genId('item'), itemId: 'wooden_sword', count: 1 },
    { id: genId('item'), itemId: 'cloth_armor', count: 1 },
    { id: genId('item'), itemId: 'cloth_boots', count: 1 },
    { id: genId('item'), itemId: 'cloth_belt', count: 1 },
    { id: genId('item'), itemId: 'wooden_bracelet', count: 1 },
    { id: genId('item'), itemId: 'hp_potion_small', count: 20 },
    { id: genId('item'), itemId: 'mp_potion_small', count: 10 },
  ],
  maxInventorySize: 40,

  skills: [{ id: 'normal_attack', cooldownEnd: 0 }],
  skillBar: ['normal_attack', '', '', '', '', '', '', ''],

  monsters: [],
  npcs: [],
  bots: [],

  activeSummon: null,

  activeDungeon: null,

  damageNumbers: [],
  particles: [],

  chatMessages: [
    { id: genId('chat'), sender: '系统', message: '欢迎来到苍月纪元！', type: 'system', timestamp: Date.now(), color: '#ffcc00', channel: 'system' },
  ],

  groundItems: [],

  quests: [],

  selectedTarget: null,
  showInventory: false,
  showCharacter: false,
  showSkills: false,
  showShop: false,
  showCraft: false,
  showDungeonPanel: false,
  showQuestLog: false,
  showMinimap: true,
  showDebugPanel: false,

  interactingNPC: null,
  npcDialogIndex: 0,

  gameTick: 0,
  lastUpdate: Date.now(),

  // 经济系统 - 4货币
  currency: { ...createDefaultWallet(), gold: 100 },

  // 强化系统
  enchantLevels: {},

  // 内功系统
  neigongLevel: 0,
  neigongHP: 0,
  maxNeigongHP: 0,
  neigongPillsConsumed: 0,

  // 转生系统
  reincarnation: 0,
  reincarnationPoints: 0,

  // PK系统
  pkState: createDefaultPKState(),

  // 职业机制
  warSoulValue: 0,
  elementStacks: 0,
  elementType: 'none' as const,
  daoHeartActive: false,
  daoHeartExpiry: 0,

  // 音效
  soundEnabled: true,
  soundVolume: 0.3,
  bgmEnabled: true,

  // 多角色存档
  activeCharacterId: '',

  // 日常活动
  activityPoints: 0,
  dailyQuestResetTime: 0,
  completedDailies: [],
  completedWeeklies: [],

  // 世界Boss定时刷新
  worldBossSchedule: {},
  bossBelonging: {},

  // 活动点数详细追踪
  dailyCompleted: {},
  weeklyCompleted: {},
  activityPointRewardsClaimed: {},
  lastDailyReset: 0,
  lastWeeklyReset: 0,

  // 每日签到系统
  lastLoginDate: '',
  consecutiveLoginDays: 0,
  totalLoginDays: 0,
  loginRewardClaimed: false,

  // 定时活动
  activeTimedEvents: [],
  timedEventAnnouncements: [],
  doubleExpActive: false,

  // 活动面板
  showActivityPanel: false,
  showBossTimer: false,

  // 制作
  showCraftPanel: false,

  // 强化面板
  showEnchantPanel: false,

  // 技能熟练度
  skillProficiency: {},

  // 奥义精修
  aoyiUnlocked: {},

  // 新UI面板
  showReforgePanel: false,
  showAwakenPanel: false,
  showAoyiPanel: false,
  showRepairPanel: false,
  showGMPanel: false,
  showGuidePanel: false,
  showTeleportPanel: false,
  showFullMap: false,
  gmMode: false,

  // 天气系统
  currentWeather: 'clear' as RendererWeatherType,
  weatherChangeTimer: 300000 + Math.random() * 300000, // 5-10 min in ms

  // 技能视觉效果
  activeSkillEffects: [],

  // 自动攻击
  autoAttackEnabled: false,
  autoAttackTarget: null,
  autoAttackCooldown: 0,

  // === Actions ===

  selectCharacter: (name, characterClass) => {
    const stats = getClassBaseStats(characterClass);
    const spawnPoint = getMapSpawnPoint('yinxing_valley');

    // 根据职业设置初始装备和技能
    let initialInventory: InventoryItem[] = [];
    let initialSkillBar: string[] = ['normal_attack', '', '', '', '', '', '', ''];

    switch (characterClass) {
      case 'warrior':
        initialInventory = [
          { id: genId('item'), itemId: 'wooden_sword', count: 1 },
          { id: genId('item'), itemId: 'cloth_armor', count: 1 },
          { id: genId('item'), itemId: 'cloth_boots', count: 1 },
          { id: genId('item'), itemId: 'cloth_belt', count: 1 },
          { id: genId('item'), itemId: 'wooden_bracelet', count: 1 },
          { id: genId('item'), itemId: 'hp_potion_small', count: 20 },
          { id: genId('item'), itemId: 'mp_potion_small', count: 10 },
        ];
        initialSkillBar = ['normal_attack', 'power_strike', '', '', '', '', '', ''];
        break;
      case 'mage':
        initialInventory = [
          { id: genId('item'), itemId: 'training_staff', count: 1 },
          { id: genId('item'), itemId: 'cloth_armor', count: 1 },
          { id: genId('item'), itemId: 'cloth_boots', count: 1 },
          { id: genId('item'), itemId: 'cloth_belt', count: 1 },
          { id: genId('item'), itemId: 'wooden_bracelet', count: 1 },
          { id: genId('item'), itemId: 'hp_potion_small', count: 15 },
          { id: genId('item'), itemId: 'mp_potion_small', count: 25 },
        ];
        initialSkillBar = ['normal_attack', 'small_fireball', '', '', '', '', '', ''];
        break;
      case 'taoist':
        initialInventory = [
          { id: genId('item'), itemId: 'training_staff', count: 1 },
          { id: genId('item'), itemId: 'cloth_armor', count: 1 },
          { id: genId('item'), itemId: 'cloth_boots', count: 1 },
          { id: genId('item'), itemId: 'cloth_belt', count: 1 },
          { id: genId('item'), itemId: 'wooden_bracelet', count: 1 },
          { id: genId('item'), itemId: 'hp_potion_small', count: 20 },
          { id: genId('item'), itemId: 'mp_potion_small', count: 15 },
        ];
        initialSkillBar = ['normal_attack', 'heal', '', '', '', '', '', ''];
        break;
    }

    const charId = generateCharacterId();

    set({
      phase: 'playing',
      player: {
        ...get().player,
        name,
        class: characterClass,
        hp: stats.hp,
        maxHp: stats.hp,
        mp: stats.mp,
        maxMp: stats.mp,
        attack: stats.attack,
        defense: stats.defense,
        accuracy: stats.accuracy,
        agility: stats.agility,
        critRate: stats.critRate,
        critDamage: stats.critDamage,
        x: spawnPoint.x,
        y: spawnPoint.y,
        mapId: 'yinxing_valley',
      },
      inventory: initialInventory,
      skillBar: initialSkillBar,
      quests: getInitialQuests(),
      currency: { ...createDefaultWallet(), gold: 100 },
      enchantLevels: {},
      skillProficiency: {},
      aoyiUnlocked: {},
      showReforgePanel: false,
      showAwakenPanel: false,
      showAoyiPanel: false,
      showRepairPanel: false,
      neigongLevel: 0,
      neigongHP: 0,
      maxNeigongHP: 0,
      neigongPillsConsumed: 0,
      reincarnation: 0,
      reincarnationPoints: 0,
      pkState: createDefaultPKState(),
      warSoulValue: 0,
      elementStacks: 0,
      elementType: 'none',
      daoHeartActive: false,
      daoHeartExpiry: 0,
      activeCharacterId: charId,
      activityPoints: 0,
      dailyQuestResetTime: Date.now() + 24 * 60 * 60 * 1000,
      completedDailies: [],
      completedWeeklies: [],
      activeSummon: null,
      worldBossSchedule: initializeWorldBossSchedule(),
      bossBelonging: {},
      dailyCompleted: {},
      weeklyCompleted: {},
      activityPointRewardsClaimed: {},
      lastDailyReset: Date.now(),
      lastWeeklyReset: Date.now(),
      lastLoginDate: '',
      consecutiveLoginDays: 0,
      totalLoginDays: 0,
      loginRewardClaimed: false,
      activeTimedEvents: [],
      timedEventAnnouncements: [],
      doubleExpActive: false,
      showActivityPanel: false,
      showBossTimer: false,
      // 重置天气
      currentWeather: 'clear' as RendererWeatherType,
      weatherChangeTimer: 300000 + Math.random() * 300000,
      activeSkillEffects: [],
      autoAttackEnabled: false,
      autoAttackTarget: null,
      autoAttackCooldown: 0,

      // GM调试模式
      gmMode: false,
      showGMPanel: false,

      // 攻略面板
      showGuidePanel: false,

      // 地图传送面板
      showTeleportPanel: false,
    });

    // 加载地图实体 - 直接在set之后调用
    // 使用queueMicrotask确保state已经更新
    queueMicrotask(() => get().loadMapEntities());

    // 系统消息
    get().sendChat(`欢迎，${name}！你选择了${characterClass === 'warrior' ? '战士' : characterClass === 'mage' ? '法师' : '道士'}职业。`, 'system');

    // 每日签到检查
    queueMicrotask(() => get().checkDailyLogin());
  },

  summonEntity: (skillId) => {
    const { player, activeSummon } = get();
    const skillDef = SKILL_DEFINITIONS[skillId];
    if (!skillDef) return;
    if (player.class !== 'taoist') {
      get().sendChat('只有道士可以召唤！', 'system');
      return;
    }

    // Determine summon type from skill
    let summonType: 'skeleton' | 'beast' | 'moon_spirit';
    if (skillId === 'summon_skeleton') {
      summonType = 'skeleton';
    } else if (skillId === 'summon_beast') {
      summonType = 'beast';
    } else if (skillId === 'moon_spirit') {
      summonType = 'moon_spirit';
    } else {
      return; // not a summon skill
    }

    // Dismiss existing summon
    if (activeSummon) {
      get().dismissSummon();
    }

    const now = Date.now();
    const level = player.level;
    const daoistPower = player.attack * 0.3 + (CLASS_DEFINITIONS.taoist?.baseMagic || 10);

    // Stats scale with player level and taoist power
    let summon: SummonInstance;
    const duration = skillDef.duration || 60000;

    switch (summonType) {
      case 'skeleton': {
        // Skeleton: melee, low HP, follows player, attacks nearby monsters
        // ~50% of player stats
        const hp = Math.floor(player.maxHp * 0.5 + level * 5);
        const atk = Math.floor(player.attack * 0.5 + daoistPower * 0.3);
        const def = Math.floor(player.defense * 0.4 + level * 0.5);
        summon = {
          id: genId('summon'),
          defId: 'skeleton',
          name: '骷髅战士',
          x: player.x + (Math.random() - 0.5) * 2,
          y: player.y + (Math.random() - 0.5) * 2,
          hp,
          maxHp: hp,
          attack: atk,
          defense: def,
          speed: 3.5,
          level: Math.max(1, level - 2),
          color: '#ccccaa',
          symbol: '💀',
          size: 12,
          attackRange: 1.5,
          lastAttackTime: 0,
          moveTimer: 0,
          ownerType: 'player',
          summonType: 'skeleton',
          expiresAt: now + duration,
        };
        break;
      }
      case 'beast': {
        // Beast: melee/ranged, high HP, fire breath attack
        // ~70% of player stats
        const hp = Math.floor(player.maxHp * 0.7 + level * 8);
        const atk = Math.floor(player.attack * 0.7 + daoistPower * 0.5);
        const def = Math.floor(player.defense * 0.6 + level * 0.8);
        summon = {
          id: genId('summon'),
          defId: 'beast',
          name: '神兽',
          x: player.x + (Math.random() - 0.5) * 2,
          y: player.y + (Math.random() - 0.5) * 2,
          hp,
          maxHp: hp,
          attack: atk,
          defense: def,
          speed: 3.0,
          level,
          color: '#ff8844',
          symbol: '🐉',
          size: 14,
          attackRange: 3.0,
          lastAttackTime: 0,
          moveTimer: 0,
          ownerType: 'player',
          summonType: 'beast',
          expiresAt: now + duration,
        };
        break;
      }
      case 'moon_spirit': {
        // Moon Spirit: ranged, fast attack speed, high damage
        // ~60% HP but higher damage and ranged
        const hp = Math.floor(player.maxHp * 0.6 + level * 6);
        const atk = Math.floor(player.attack * 0.8 + daoistPower * 0.7);
        const def = Math.floor(player.defense * 0.4 + level * 0.5);
        summon = {
          id: genId('summon'),
          defId: 'moon_spirit',
          name: '月灵',
          x: player.x + (Math.random() - 0.5) * 2,
          y: player.y + (Math.random() - 0.5) * 2,
          hp,
          maxHp: hp,
          attack: atk,
          defense: def,
          speed: 4.0,
          level,
          color: '#aaddff',
          symbol: '🌙',
          size: 10,
          attackRange: 5.0,
          lastAttackTime: 0,
          moveTimer: 0,
          ownerType: 'player',
          summonType: 'moon_spirit',
          expiresAt: now + duration,
        };
        break;
      }
    }

    set({ activeSummon: summon });
    get().sendChat(`召唤了${summon.name}！`, 'combat');
    get().playSound('heal');

    // Add spawn particle effect
    set(s => ({
      particles: [...s.particles, {
        id: genId('part'),
        x: summon.x,
        y: summon.y,
        type: 'skill' as const,
        color: summon.color,
        timestamp: now,
        duration: 800,
      }],
    }));
  },

  dismissSummon: () => {
    const { activeSummon } = get();
    if (!activeSummon) return;
    get().sendChat(`${activeSummon.name}已消失`, 'combat');
    set({ activeSummon: null });
  },

  tickSummon: (deltaTime, monsters) => {
    const { activeSummon, player } = get();
    if (!activeSummon) return;

    const now = Date.now();
    const updated = { ...activeSummon };

    // Check expiration
    if (now >= updated.expiresAt) {
      get().dismissSummon();
      return;
    }

    // Check if summon is dead
    if (updated.hp <= 0) {
      get().dismissSummon();
      return;
    }

    updated.moveTimer -= deltaTime;

    // Find target: nearest alive monster within 8 tiles
    if (!updated.targetId || !monsters.find(m => m.id === updated.targetId && !m.isDead)) {
      updated.targetId = undefined;
      const nearbyMonsters = monsters
        .filter(m => !m.isDead)
        .filter(m => {
          const dist = Math.sqrt((m.x - updated.x) ** 2 + (m.y - updated.y) ** 2);
          return dist < 8;
        })
        .sort((a, b) => {
          const da = Math.sqrt((a.x - updated.x) ** 2 + (a.y - updated.y) ** 2);
          const db = Math.sqrt((b.x - updated.x) ** 2 + (b.y - updated.y) ** 2);
          return da - db;
        });

      if (nearbyMonsters.length > 0) {
        updated.targetId = nearbyMonsters[0].id;
      }
    }

    // Movement logic
    if (updated.targetId) {
      const target = monsters.find(m => m.id === updated.targetId && !m.isDead);
      if (target) {
        const dx = target.x - updated.x;
        const dy = target.y - updated.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > updated.attackRange) {
          // Move toward target
          const moveStep = Math.min(updated.speed * 0.016, dist - updated.attackRange + 0.5);
          if (moveStep > 0) {
            const nx = updated.x + (dx / dist) * moveStep;
            const ny = updated.y + (dy / dist) * moveStep;
            const tile = getMapTile(player.mapId, Math.floor(nx), Math.floor(ny));
            if (isTileWalkable(tile)) {
              updated.x = nx;
              updated.y = ny;
            }
          }
        } else {
          // Attack target
          const attackCooldown = updated.summonType === 'moon_spirit' ? 800 : 
                                 updated.summonType === 'beast' ? 1500 : 1200;
          if (now - updated.lastAttackTime > attackCooldown) {
            updated.lastAttackTime = now;

            // Calculate damage
            let damage = Math.max(1, Math.floor(updated.attack * (0.9 + Math.random() * 0.2) - target.defense * 0.3));

            // Moon spirit gets bonus from being ranged
            if (updated.summonType === 'moon_spirit') {
              damage = Math.floor(damage * 1.2);
            }

            // Apply damage to monster
            const newHp = Math.max(0, target.hp - damage);
            const isDead = newHp <= 0;

            set(s => ({
              monsters: s.monsters.map(m =>
                m.id === target.id ? { ...m, hp: newHp, isDead } : m
              ),
              damageNumbers: [...s.damageNumbers, {
                id: genId('dmg'),
                x: target.x + (Math.random() - 0.5) * 0.5,
                y: target.y,
                value: damage,
                color: 'rgb(150, 200, 255)',
                timestamp: now,
                isCrit: false,
              }],
              particles: [...s.particles, {
                id: genId('part'),
                x: target.x,
                y: target.y,
                type: 'hit' as const,
                color: updated.color,
                timestamp: now,
                duration: 400,
              }],
            }));

            // If monster died from summon attack, trigger kill processing
            if (isDead) {
              setTimeout(() => get().attackTarget(), 0);
            }
          }
        }
      }
    } else {
      // No target: follow player
      const dx = player.x - updated.x;
      const dy = player.y - updated.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 2.5) {
        const moveStep = Math.min(updated.speed * 0.016, dist - 2);
        if (moveStep > 0) {
          const nx = updated.x + (dx / dist) * moveStep;
          const ny = updated.y + (dy / dist) * moveStep;
          const tile = getMapTile(player.mapId, Math.floor(nx), Math.floor(ny));
          if (isTileWalkable(tile)) {
            updated.x = nx;
            updated.y = ny;
          }
        }
      } else if (updated.moveTimer <= 0) {
        // Slight random wander when near player
        updated.moveTimer = 2000 + Math.random() * 3000;
        const angle = Math.random() * Math.PI * 2;
        const wanderDist = Math.random() * 1;
        const nx = updated.x + Math.cos(angle) * wanderDist;
        const ny = updated.y + Math.sin(angle) * wanderDist;
        const tile = getMapTile(player.mapId, Math.floor(nx), Math.floor(ny));
        if (isTileWalkable(tile)) {
          const distFromPlayer = Math.sqrt((nx - player.x) ** 2 + (ny - player.y) ** 2);
          if (distFromPlayer < 4) {
            updated.x = nx;
            updated.y = ny;
          }
        }
      }
    }

    // Summon can take damage from aggressive monsters nearby
    for (const monster of monsters) {
      if (monster.isDead || !monster.aggressive) continue;
      const dist = Math.sqrt((monster.x - updated.x) ** 2 + (monster.y - updated.y) ** 2);
      if (dist <= monster.attackRange + 0.5 && now - monster.lastAttackTime > 2000) {
        const summonDamage = Math.max(1, Math.floor(monster.attack * (0.8 + Math.random() * 0.2) - updated.defense * 0.4));
        updated.hp = Math.max(0, updated.hp - summonDamage);
        break; // Only one monster can hit per tick
      }
    }

    set({ activeSummon: updated });
  },

  movePlayer: (dx, dy) => {
    const { player } = get();
    const newX = player.x + dx;
    const newY = player.y + dy;

    // 边界检查
    const mapDef = MAP_DEFINITIONS[player.mapId];
    if (!mapDef) return;
    if (newX < 0 || newY < 0 || newX >= mapDef.width || newY >= mapDef.height) return;

    // 瓦片可走性检查
    const tile = getMapTile(player.mapId, Math.floor(newX), Math.floor(newY));
    if (!isTileWalkable(tile)) return;

    set({
      player: {
        ...player,
        x: newX,
        y: newY,
        isMoving: true,
        direction: Math.atan2(dy, dx),
      }
    });
  },

  moveToPosition: (x, y) => {
    const { player } = get();
    const dx = x - player.x;
    const dy = y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.1) return;

    const step = Math.min(player.speed * 0.016, dist); // 假设60fps
    const nx = player.x + (dx / dist) * step;
    const ny = player.y + (dy / dist) * step;

    const tile = getMapTile(player.mapId, Math.floor(nx), Math.floor(ny));
    if (isTileWalkable(tile)) {
      set({
        player: {
          ...player,
          x: nx,
          y: ny,
          isMoving: true,
          direction: Math.atan2(dy, dx),
        }
      });
    }
  },

  stopMovement: () => {
    set({ player: { ...get().player, isMoving: false } });
  },

  attackTarget: () => {
    const { player, selectedTarget, monsters } = get();
    if (!selectedTarget || selectedTarget.type !== 'monster') return;

    const monster = monsters.find(m => m.id === selectedTarget.id);
    if (!monster || monster.isDead) return;

    // 距离检查
    const dist = Math.sqrt((player.x - monster.x) ** 2 + (player.y - monster.y) ** 2);
    if (dist > 2) {
      get().sendChat('目标太远了！', 'combat');
      return;
    }

    // 使用战斗公式计算伤害
    const now = Date.now();
    const damageResult = calculatePhysicalDamage({
      attackerAttack: player.attack,
      attackerLevel: player.level,
      skillMultiplier: 1.0,
      targetPhysicalDefense: monster.defense,
      ignoreDefensePercent: 0,
      damageBonus: getClassRestraintBonus(player.class, 'warrior' as CharacterClass), // monster class approximation
      physicalResistance: 0,
      luckValue: player.luck,
      isLucky: player.luck >= 9,
      baseCritRate: 0.05,
      baseCritDamage: 1.5,
      critRateBonus: player.critRate / 100 - 0.05,
      critDamageBonus: player.critDamage / 100 - 1.5,
      accuracy: player.accuracy,
      targetAgility: monster.speed,
    });

    const damage = damageResult.damage;
    const isCrit = damageResult.isCrit;
    const isHit = damageResult.hit;

    // 播放攻击音效
    get().playSound('attack');

    if (!isHit) {
      // 闪避
      set({
        damageNumbers: [...get().damageNumbers, {
          id: genId('dmg'),
          x: monster.x + (Math.random() - 0.5) * 0.5,
          y: monster.y,
          value: 0,
          color: 'rgb(150, 150, 150)',
          timestamp: now,
          isCrit: false,
        }],
      });
      return;
    }

    // 播放命中音效
    get().playSound('hit');
    if (isCrit) get().playSound('crit');

    // 内功吸收伤害
    let remainingDamage = damage;
    const state = get();
    if (state.neigongHP > 0) {
      const neigongAbsorb = Math.min(state.neigongHP, Math.floor(remainingDamage * 0.3));
      remainingDamage -= neigongAbsorb;
      set({ neigongHP: state.neigongHP - neigongAbsorb });
    }

    // 应用伤害
    const newHp = Math.max(0, monster.hp - remainingDamage);
    const isDead = newHp <= 0;

    // Boss归属系统：首次攻击获得归属
    if (monster.isBoss) {
      const state = get();
      const existingBelonging = state.bossBelonging[monster.id];
      if (!existingBelonging) {
        // 首次攻击，获得归属
        get().claimBossBelonging(monster.id);
      } else {
        // 已有归属，更新最后攻击时间
        set({
          bossBelonging: {
            ...state.bossBelonging,
            [monster.id]: {
              ...existingBelonging,
              lastHitTime: now,
            },
          },
        });
      }
    }

    set({
      monsters: monsters.map(m =>
        m.id === monster.id ? { ...m, hp: newHp, isDead, lastAttackTime: now } : m
      ),
      damageNumbers: [...get().damageNumbers, {
        id: genId('dmg'),
        x: monster.x + (Math.random() - 0.5) * 0.5,
        y: monster.y,
        value: remainingDamage,
        color: isCrit ? 'rgb(255, 200, 0)' : 'rgb(255, 50, 50)',
        timestamp: now,
        isCrit,
      }],
      particles: [...get().particles, {
        id: genId('part'),
        x: monster.x,
        y: monster.y,
        type: 'hit',
        color: '#ffcc44',
        timestamp: now,
        duration: 500,
      }],
    });

    // 战士：积累战魂值
    const curState = get();
    if (curState.player.class === 'warrior') {
      const mechanism = getClassMechanismData('warrior');
      const newWarSoul = Math.min(
        mechanism.warSoulMaxValue || 100,
        curState.warSoulValue + (mechanism.warSoulGainOnDamage || 5)
      );
      set({ warSoulValue: newWarSoul });
    }

    // 道士：道心触发判定
    if (curState.player.class === 'taoist') {
      const mechanism = getClassMechanismData('taoist');
      if (!curState.daoHeartActive && Math.random() < (mechanism.daoHeartTriggerChance || 0.15)) {
        set({
          daoHeartActive: true,
          daoHeartExpiry: Date.now() + (mechanism.daoHeartDuration || 10000),
        });
        get().sendChat('道心通明！', 'combat');
      }
    }

    // 怪物死亡处理
    if (isDead) {
      // Boss归属：死亡时设置2分钟掉落保护
      if (monster.isBoss) {
        const state = get();
        const belonging = state.bossBelonging[monster.id];
        if (belonging) {
          set({
            bossBelonging: {
              ...state.bossBelonging,
              [monster.id]: {
                ...belonging,
                dropProtectionUntil: now + 2 * 60 * 1000, // 2 minutes
              },
            },
          });
          get().sendSystemAnnouncement(
            `🏆 ${monster.name}已被${belonging.ownerName}击杀！掉落归属2分钟`,
            'boss_announce'
          );
        }

        // 更新世界Boss日程表 - boss已死亡，计算下次刷新时间
        const bossSchedule = state.worldBossSchedule[monster.defId];
        if (bossSchedule) {
          const rule = WORLD_BOSS_SPAWN_RULES.find(r => r.bossId === monster.defId);
          if (rule) {
            set({
              worldBossSchedule: {
                ...state.worldBossSchedule,
                [monster.defId]: {
                  ...bossSchedule,
                  isAlive: false,
                  nextSpawn: getNextSpawnTime(rule, now),
                },
              },
            });
          }
        }
      }

      // 经验和金币
      let expGain = monster.exp;
      // 双倍经验活动
      if (get().doubleExpActive) {
        expGain = expGain * 2;
      }
      // 使用经济系统获取金币（含通胀控制）
      const goldGain = getInflationAdjustedMonsterDrop(monster.gold, false);
      const newExp = player.exp + expGain;
      const newGold = player.gold + goldGain;
      let levelUp = false;
      let finalLevel = player.level;
      let finalExp = newExp;
      let finalExpToLevel = player.expToLevel;

      // 检查升级
      while (finalExp >= finalExpToLevel && finalLevel < MAX_LEVEL) {
        finalExp -= finalExpToLevel;
        finalLevel++;
        finalExpToLevel = getExpToLevel(finalLevel);
        levelUp = true;
      }

      const levelBonus = levelUp ? (finalLevel - player.level) * 5 : 0;
      const stats = getClassBaseStats(player.class);

      if (levelUp) {
        get().playSound('levelup');
        get().sendChat(`恭喜！你升到了${finalLevel}级！`, 'system');
        set(state => ({
          particles: [...state.particles, {
            id: genId('part'),
            x: player.x,
            y: player.y,
            type: 'levelup',
            color: '#ffd700',
            timestamp: now,
            duration: 2000,
          }],
        }));

        // 检查系统解锁
        const unlocks = getSystemsUnlockedAtLevel(finalLevel);
        for (const unlock of unlocks) {
          get().sendChat(`系统解锁：${unlock.description}`, 'system');
        }
      }

      // 更新任务进度
      const updatedQuests = get().quests.map(q => {
        if (q.type === 'kill' && q.targetId === monster.defId && !q.isComplete) {
          const newCurrent = q.current + 1;
          if (newCurrent >= q.target) {
            get().sendChat(`任务完成：${q.name}！`, 'system');
            // Check if this is a daily or weekly quest and add activity points
            const dailyQuest = DAILY_QUESTS.find(dq => dq.id === q.id);
            const weeklyQuest = WEEKLY_QUESTS.find(wq => wq.id === q.id);
            if (dailyQuest) {
              get().completeDailyQuest(q.id);
            } else if (weeklyQuest) {
              get().completeWeeklyQuest(q.id);
            }
            return { ...q, current: newCurrent, isComplete: true };
          }
          return { ...q, current: newCurrent };
        }
        return q;
      });

      // 怪物掉落 - 使用怪物掉落表
      const dropItems: InventoryItem[] = [];
      const monsterDef = getMonsterDef(monster.defId);
      
      if (monsterDef) {
        // 基础掉落：使用怪物的drops表 - 大幅提升掉率
        if (monsterDef.drops && monsterDef.drops.length > 0) {
          for (const drop of monsterDef.drops) {
            // 幸运值影响爆率：每点luck增加1%爆率
            const luckBonus = (player.luck || 0) * 0.01;
            // 整体提升1.5倍掉率，让玩家更容易获得物品
            const finalRate = Math.min(0.95, drop.rate * 1.5 + luckBonus);
            
            if (Math.random() < finalRate) {
              const count = drop.minCount + Math.floor(Math.random() * (drop.maxCount - drop.minCount + 1));
              const itemDef = ITEM_DEFINITIONS[drop.itemId];
              if (itemDef) {
                dropItems.push({ id: genId('item'), itemId: drop.itemId, count });
              }
            }
          }
        }
        
        // 小惊喜机制：每只怪有较高概率掉落同等级装备（参考传奇体验）
        // 普通怪8%概率掉装备（原1%）
        if (!monster.isBoss && Math.random() < 0.08 + (player.luck || 0) * 0.005) {
          // 根据怪物等级随机掉落一个装备
          const surpriseDrops = Object.values(ITEM_DEFINITIONS).filter(item => 
            item.equipSlot && item.levelReq && Math.abs(item.levelReq - monsterDef.level) <= 5
          );
          if (surpriseDrops.length > 0) {
            const surprise = surpriseDrops[Math.floor(Math.random() * surpriseDrops.length)];
            dropItems.push({ id: genId('item'), itemId: surprise.id, count: 1 });
            get().sendChat(`✨ 小惊喜！掉落了 ${surprise.icon || ''}${surprise.name}！`, 'combat');
          }
        }
        
        // 额外金币掉落（85%概率掉一些金币）
        if (!monster.isBoss && Math.random() < 0.85) {
          // 已经在goldGain中处理，不重复
        }
        
        // Boss掉落 - 更好的掉落表
        if (monster.isBoss) {
          const belonging = get().bossBelonging[monster.id];
          const isPublicBoss = monster.name.startsWith('[全民]');
          const hasBelonging = belonging && belonging.ownerId === player.name;
          
          if (isPublicBoss || hasBelonging) {
            // Boss从drops表中掉落，爆率提升2倍
            if (monsterDef.drops) {
              for (const drop of monsterDef.drops) {
                const boostedRate = Math.min(0.98, drop.rate * 2 + (player.luck || 0) * 0.01);
                if (Math.random() < boostedRate) {
                  const count = drop.minCount + Math.floor(Math.random() * (drop.maxCount - drop.minCount + 1));
                  const itemDef = ITEM_DEFINITIONS[drop.itemId];
                  if (itemDef) {
                    dropItems.push({ id: genId('item'), itemId: drop.itemId, count });
                  }
                }
              }
            }
            
            // Boss额外惊喜：25%概率掉落高级装备（原5%）
            if (Math.random() < 0.25 + (player.luck || 0) * 0.01) {
              const bossLevel = monsterDef.level;
              const rareDrops = Object.values(ITEM_DEFINITIONS).filter(item =>
                item.equipSlot && item.rarity && 
                (item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary') &&
                item.levelReq && Math.abs(item.levelReq - bossLevel) <= 10
              );
              if (rareDrops.length > 0) {
                const rareDrop = rareDrops[Math.floor(Math.random() * rareDrops.length)];
                dropItems.push({ id: genId('item'), itemId: rareDrop.id, count: 1 });
                get().sendChat(`🌟 Boss惊喜！掉落了 ${rareDrop.icon || ''}${rareDrop.name}！`, 'combat');
              }
            }
          }
        }
        
        // 掉落反馈聊天
        if (dropItems.length > 0) {
          const dropNames = dropItems.map(di => {
            const id = ITEM_DEFINITIONS[di.itemId];
            return id ? `${id.icon || ''}${id.name}${di.count > 1 ? 'x' + di.count : ''}` : di.itemId;
          }).join(' ');
          get().sendChat(`📦 掉落: ${dropNames}`, 'combat');
        }
      }

      // 金币使用经济系统
      get().addCurrencyAction('gold', goldGain);
      get().playSound('coin');

      // Add drop items to ground instead of directly to inventory
      const newGroundItems: GroundItem[] = dropItems.map(di => {
        const itemDef = ITEM_DEFINITIONS[di.itemId];
        return {
          id: di.id,
          x: monster.x + (Math.random() - 0.5) * 1.5,
          y: monster.y + (Math.random() - 0.5) * 1.5,
          itemId: di.itemId,
          name: itemDef?.name || di.itemId,
          rarity: itemDef?.rarity || 'common',
          timestamp: now,
        };
      });

      set(state => ({
        player: {
          ...state.player,
          exp: finalExp,
          expToLevel: finalExpToLevel,
          level: finalLevel,
          attack: stats.attack + finalLevel * 2 + levelBonus,
          defense: stats.defense + finalLevel * 1 + levelBonus,
          maxHp: stats.hp + finalLevel * 15,
          maxMp: stats.mp + finalLevel * 5,
          hp: Math.min(state.player.hp + (levelUp ? 100 : 0), stats.hp + finalLevel * 15),
        },
        groundItems: [...state.groundItems, ...newGroundItems],
        quests: updatedQuests,
      }));

      // 死亡特效
      set(state => ({
        particles: [...state.particles, {
          id: genId('part'),
          x: monster.x,
          y: monster.y,
          type: 'death',
          color: monster.color,
          timestamp: now,
          duration: 1000,
        }],
      }));

      // 怪物重生（5秒后）- 在玩家附近重生
      setTimeout(() => {
        const state = get();
        const deadMonster = state.monsters.find(m => m.id === monster.id);
        if (deadMonster && deadMonster.isDead) {
          const def = getMonsterDef(deadMonster.defId);
          if (def) {
            // 在玩家附近随机位置重生
            const angle = Math.random() * Math.PI * 2;
            const dist = 8 + Math.random() * 15;
            const spawnX = Math.floor(state.player.x + Math.cos(angle) * dist);
            const spawnY = Math.floor(state.player.y + Math.sin(angle) * dist);
            const newPos = findWalkablePosition(state.player.mapId, spawnX, spawnY, 5);
            set({
              monsters: state.monsters.map(m =>
                m.id === monster.id ? {
                  ...m,
                  hp: def.hp,
                  mp: def.mp,
                  isDead: false,
                  x: newPos.x,
                  y: newPos.y,
                  homeX: newPos.x,
                  homeY: newPos.y,
                } : m
              ),
            });
          }
        }
      }, 5000);
    }
  },

  useSkill: (skillId) => {
    const { player, selectedTarget, monsters, skills } = get();
    const skillDef = SKILL_DEFINITIONS[skillId];
    if (!skillDef) return;

    // 冷却检查
    const now = Date.now();
    const activeSkill = skills.find(s => s.id === skillId);
    if (activeSkill && now < activeSkill.cooldownEnd) {
      get().sendChat('技能冷却中！', 'combat');
      return;
    }

    // 蓝量检查
    if (player.mp < skillDef.manaCost) {
      get().sendChat('蓝量不足！', 'combat');
      return;
    }

    // 扣蓝
    const newMp = player.mp - skillDef.manaCost;

    // 设置冷却
    const updatedSkills = [...skills];
    const existingIdx = updatedSkills.findIndex(s => s.id === skillId);
    if (existingIdx >= 0) {
      updatedSkills[existingIdx] = { id: skillId, cooldownEnd: now + skillDef.cooldown };
    } else {
      updatedSkills.push({ id: skillId, cooldownEnd: now + skillDef.cooldown });
    }

    set({
      player: { ...player, mp: newMp },
      skills: updatedSkills,
    });

    // 添加技能视觉效果
    const visualType = getSkillVisualType(skillId);
    const visualColor = getSkillColor(skillId);
    const targetEntity = selectedTarget?.type === 'monster'
      ? monsters.find(m => m.id === selectedTarget.id)
      : null;
    const targetX = targetEntity ? targetEntity.x : player.x;
    const targetY = targetEntity ? targetEntity.y : player.y;

    get().addSkillEffect({
      x: player.x,
      y: player.y,
      targetX,
      targetY,
      skillId,
      duration: visualType === 'ground' ? 3000 : visualType === 'buff' ? 1500 : visualType === 'summon' ? 2000 : 600,
      type: visualType,
      color: visualColor,
    });

    // 技能效果
    switch (skillDef.subType) {
      case 'attack': {
        if (!selectedTarget || selectedTarget.type !== 'monster') {
          // 没有目标就攻击最近的怪
          const nearest = monsters
            .filter(m => !m.isDead)
            .sort((a, b) => {
              const da = Math.sqrt((player.x - a.x) ** 2 + (player.y - a.y) ** 2);
              const db = Math.sqrt((player.x - b.x) ** 2 + (player.y - b.y) ** 2);
              return da - db;
            })[0];
          if (nearest) {
            set({ selectedTarget: { type: 'monster', id: nearest.id } });
          }
          break;
        }

        const monster = monsters.find(m => m.id === selectedTarget.id);
        if (!monster || monster.isDead) break;

        const dist = Math.sqrt((player.x - monster.x) ** 2 + (player.y - monster.y) ** 2);
        if (dist > skillDef.range + 1) {
          get().sendChat('目标太远了！', 'combat');
          break;
        }

        // 使用战斗公式计算技能伤害
        let damageResult;
        if (player.class === 'mage') {
          // 法师使用魔法伤害公式
          const elementMap: Record<string, 'fire' | 'ice' | 'lightning' | undefined> = {
            'small_fireball': 'fire',
            'fireball': 'fire',
            'lightning_bolt': 'lightning',
            'ice_blast': 'ice',
          };
          const element = elementMap[skillId];

          // 法师元素共鸣：更新元素层数
          const curState = get();
          if (element && element !== curState.elementType && curState.elementType !== 'none') {
            // 切换元素重置层数
            set({ elementStacks: 1, elementType: element });
          } else if (element) {
            const mechanism = getClassMechanismData('mage');
            const maxStacks = mechanism.elementMaxStacks || 5;
            set({
              elementStacks: Math.min(maxStacks, curState.elementStacks + 1),
              elementType: element,
            });
          }

          damageResult = calculateMagicDamage({
            skillBaseDamage: skillDef.damage || 0,
            magicAttribute: player.attack * 0.5 + (CLASS_DEFINITIONS.mage?.baseMagic || 16),
            skillMultiplier: skillDef.damageMultiplier || 1.0,
            targetMagicDefense: monster.defense * 0.5,
            ignoreMagicDefensePercent: 0,
            magicResistance: 0,
            element: element,
            elementStacks: get().elementStacks,
            isLucky: player.luck >= 9,
            baseCritRate: 0.05,
            baseCritDamage: 1.5,
            critRateBonus: player.critRate / 100 - 0.05,
            critDamageBonus: player.critDamage / 100 - 1.5,
          });

          // 播放技能音效
          if (element === 'fire') get().playSound('fireball');
          else if (element === 'lightning') get().playSound('lightning');
          else if (element === 'ice') get().playSound('poison');
          else get().playSound('attack');
        } else if (player.class === 'taoist') {
          // 道士使用道术伤害公式
          damageResult = calculateMagicDamage({
            skillBaseDamage: skillDef.damage || 0,
            magicAttribute: player.attack * 0.3 + (CLASS_DEFINITIONS.taoist?.baseMagic || 10),
            skillMultiplier: skillDef.damageMultiplier || 1.0,
            targetMagicDefense: monster.defense * 0.5,
            ignoreMagicDefensePercent: 0,
            magicResistance: 0,
            isLucky: player.luck >= 9,
            baseCritRate: 0.05,
            baseCritDamage: 1.5,
            critRateBonus: player.critRate / 100 - 0.05,
            critDamageBonus: player.critDamage / 100 - 1.5,
          });
          get().playSound('attack');
        } else {
          // 战士使用物理伤害公式
          damageResult = calculatePhysicalDamage({
            attackerAttack: player.attack,
            attackerLevel: player.level,
            skillMultiplier: skillDef.damageMultiplier || 1.0,
            targetPhysicalDefense: monster.defense,
            ignoreDefensePercent: 0,
            damageBonus: getClassRestraintBonus(player.class, 'warrior' as CharacterClass),
            physicalResistance: 0,
            luckValue: player.luck,
            isLucky: player.luck >= 9,
            baseCritRate: 0.05,
            baseCritDamage: 1.5,
            critRateBonus: player.critRate / 100 - 0.05,
            critDamageBonus: player.critDamage / 100 - 1.5,
            accuracy: player.accuracy,
            targetAgility: monster.speed,
          });
          get().playSound('attack');
        }

        const damage = damageResult.damage;
        const isCrit = 'isCrit' in damageResult ? (typeof damageResult.isCrit === 'boolean' ? damageResult.isCrit : damageResult.isCrit === 1) : false;

        if (isCrit) get().playSound('crit');
        get().playSound('hit');

        const newHp = Math.max(0, monster.hp - damage);
        const isDead = newHp <= 0;

        // Boss归属系统：技能攻击也触发归属
        if (monster.isBoss) {
          const curState = get();
          const existingBelonging = curState.bossBelonging[monster.id];
          if (!existingBelonging) {
            get().claimBossBelonging(monster.id);
          } else {
            set({
              bossBelonging: {
                ...curState.bossBelonging,
                [monster.id]: {
                  ...existingBelonging,
                  lastHitTime: now,
                },
              },
            });
          }
        }

        set(state => ({
          monsters: state.monsters.map(m =>
            m.id === monster.id ? { ...m, hp: newHp, isDead } : m
          ),
          damageNumbers: [...state.damageNumbers, {
            id: genId('dmg'),
            x: monster.x + (Math.random() - 0.5) * 0.5,
            y: monster.y,
            value: damage,
            color: isCrit ? 'rgb(255, 200, 0)' : 'rgb(255, 100, 50)',
            timestamp: now,
            isCrit,
          }],
          particles: [...state.particles, {
            id: genId('part'),
            x: monster.x,
            y: monster.y,
            type: 'skill',
            color: skillDef.color,
            timestamp: now,
            duration: 600,
          }],
        }));

        // 战士：积累战魂值
        if (get().player.class === 'warrior') {
          const mechanism = getClassMechanismData('warrior');
          const newWarSoul = Math.min(
            mechanism.warSoulMaxValue || 100,
            get().warSoulValue + (mechanism.warSoulGainOnDamage || 5)
          );
          set({ warSoulValue: newWarSoul });
        }

        // 如果怪物死了，复用attackTarget的死亡逻辑
        if (isDead) {
          // 触发一次普通攻击的处理
          setTimeout(() => get().attackTarget(), 0);
        }
        break;
      }

      case 'heal': {
        const healAmount = skillDef.damage || 30;
        let finalHealAmount = healAmount;

        // 道士：道心通明加成
        const curState = get();
        if (curState.daoHeartActive && curState.player.class === 'taoist') {
          const mechanism = getClassMechanismData('taoist');
          finalHealAmount = Math.floor(healAmount * (mechanism.daoHeartBuffMultiplier || 2.0));
          set({ daoHeartActive: false, daoHeartExpiry: 0 });
        }

        const newHp = Math.min(player.maxHp, player.hp + finalHealAmount);
        set({
          player: { ...get().player, hp: newHp, mp: get().player.mp },
          particles: [...get().particles, {
            id: genId('part'),
            x: player.x,
            y: player.y,
            type: 'heal',
            color: '#44ff44',
            timestamp: now,
            duration: 800,
          }],
          damageNumbers: [...get().damageNumbers, {
            id: genId('dmg'),
            x: player.x,
            y: player.y,
            value: finalHealAmount,
            color: 'rgb(50, 255, 50)',
            timestamp: now,
            isCrit: false,
          }],
        });
        get().playSound('heal');
        break;
      }

      case 'buff': {
        set({
          particles: [...get().particles, {
            id: genId('part'),
            x: player.x,
            y: player.y,
            type: 'skill',
            color: skillDef.color,
            timestamp: now,
            duration: 800,
          }],
        });
        get().sendChat(`使用了${skillDef.name}！`, 'combat');
        get().playSound('attack');
        break;
      }

      case 'summon': {
        get().summonEntity(skillId);
        break;
      }

      case 'debuff': {
        // Debuff skills like poison
        if (!selectedTarget || selectedTarget.type !== 'monster') {
          const nearest = monsters
            .filter(m => !m.isDead)
            .sort((a, b) => {
              const da = Math.sqrt((player.x - a.x) ** 2 + (player.y - a.y) ** 2);
              const db = Math.sqrt((player.x - b.x) ** 2 + (player.y - b.y) ** 2);
              return da - db;
            })[0];
          if (nearest) {
            set({ selectedTarget: { type: 'monster', id: nearest.id } });
          }
          break;
        }

        const monster = monsters.find(m => m.id === selectedTarget.id);
        if (!monster || monster.isDead) break;

        const dist = Math.sqrt((player.x - monster.x) ** 2 + (player.y - monster.y) ** 2);
        if (dist > skillDef.range + 1) {
          get().sendChat('目标太远了！', 'combat');
          break;
        }

        // Apply debuff damage
        const debuffDamage = Math.max(1, Math.floor((skillDef.damage || 10) * (1 + player.attack * 0.1)));
        const newHp = Math.max(0, monster.hp - debuffDamage);
        const isDead = newHp <= 0;

        set(s => ({
          monsters: s.monsters.map(m =>
            m.id === monster.id ? { ...m, hp: newHp, isDead } : m
          ),
          damageNumbers: [...s.damageNumbers, {
            id: genId('dmg'),
            x: monster.x,
            y: monster.y,
            value: debuffDamage,
            color: 'rgb(0, 200, 0)',
            timestamp: now,
            isCrit: false,
          }],
          particles: [...s.particles, {
            id: genId('part'),
            x: monster.x,
            y: monster.y,
            type: 'skill' as const,
            color: skillDef.color,
            timestamp: now,
            duration: 600,
          }],
        }));

        get().sendChat(`使用了${skillDef.name}！`, 'combat');
        get().playSound('poison');

        if (isDead) {
          setTimeout(() => get().attackTarget(), 0);
        }
        break;
      }
    }
  },

  takeDamage: (amount, sourceId) => {
    const { player } = get();
    const actualDamage = Math.max(1, Math.floor(amount - player.defense * 0.4));
    const newHp = Math.max(0, player.hp - actualDamage);

    set({
      player: { ...player, hp: newHp },
      damageNumbers: [...get().damageNumbers, {
        id: genId('dmg'),
        x: player.x + (Math.random() - 0.5) * 0.5,
        y: player.y,
        value: actualDamage,
        color: 'rgb(255, 80, 80)',
        timestamp: Date.now(),
        isCrit: false,
      }],
    });

    // 战士：受击积累战魂
    if (player.class === 'warrior') {
      const mechanism = getClassMechanismData('warrior');
      const newWarSoul = Math.min(
        mechanism.warSoulMaxValue || 100,
        get().warSoulValue + (mechanism.warSoulGainOnHit || 8)
      );
      set({ warSoulValue: newWarSoul });
    }

    if (newHp <= 0) {
      get().playSound('death');
      set({ phase: 'dead' });
      get().sendChat('你已死亡！', 'combat');
    }
  },

  healPlayer: (amount) => {
    const { player } = get();
    set({
      player: { ...player, hp: Math.min(player.maxHp, player.hp + amount) }
    });
  },

  useItem: (inventoryId) => {
    const { inventory, player } = get();
    const itemIdx = inventory.findIndex(i => i.id === inventoryId);
    if (itemIdx === -1) return;

    const item = inventory[itemIdx];
    const itemDef = ITEM_DEFINITIONS[item.itemId];
    if (!itemDef) return;

    if (itemDef.type === 'consumable') {
      // 消耗品
      switch (item.itemId) {
        case 'hp_potion_small':
          set({ player: { ...player, hp: Math.min(player.maxHp, player.hp + 50) } });
          get().sendChat('使用了小红药，恢复50点生命', 'combat');
          break;
        case 'hp_potion_medium':
          set({ player: { ...player, hp: Math.min(player.maxHp, player.hp + 150) } });
          get().sendChat('使用了中红药，恢复150点生命', 'combat');
          break;
        case 'hp_potion_large':
          set({ player: { ...player, hp: Math.min(player.maxHp, player.hp + 500) } });
          get().sendChat('使用了大红药，恢复500点生命', 'combat');
          break;
        case 'mp_potion_small':
          set({ player: { ...player, mp: Math.min(player.maxMp, player.mp + 30) } });
          get().sendChat('使用了小蓝药，恢复30点魔法', 'combat');
          break;
        case 'mp_potion_medium':
          set({ player: { ...player, mp: Math.min(player.maxMp, player.mp + 100) } });
          get().sendChat('使用了中蓝药，恢复100点魔法', 'combat');
          break;
        case 'mp_potion_large':
          set({ player: { ...player, mp: Math.min(player.maxMp, player.mp + 300) } });
          get().sendChat('使用了大蓝药，恢复300点魔法', 'combat');
          break;
        case 'teleport_scroll': {
          const spawn = getMapSpawnPoint(player.mapId);
          set({ player: { ...player, x: spawn.x, y: spawn.y } });
          get().sendChat('使用回城卷轴，传送回出生点', 'system');
          break;
        }
        default:
          get().sendChat(`使用了${itemDef.name}`, 'system');
      }

      get().playSound('pickup');

      // 减少数量
      const newInventory = [...inventory];
      if (item.count > 1) {
        newInventory[itemIdx] = { ...item, count: item.count - 1 };
      } else {
        newInventory.splice(itemIdx, 1);
      }
      set({ inventory: newInventory });
    }
  },

  useQuickPotion: (kind) => {
    // 智能使用最佳药水：优先使用最小的可恢复药水（避免浪费大红）
    const { inventory, player } = get();
    const potionOrder = kind === 'hp'
      ? ['hp_potion_small', 'hp_potion_medium', 'hp_potion_large']
      : ['mp_potion_small', 'mp_potion_medium', 'mp_potion_large'];

    // 找到背包中已有的最小档药水
    let foundItemId: string | null = null;
    let foundInvId: string | null = null;
    for (const pid of potionOrder) {
      const idx = inventory.findIndex(i => i.itemId === pid);
      if (idx >= 0) {
        foundItemId = pid;
        foundInvId = inventory[idx].id;
        break;
      }
    }

    if (!foundItemId || !foundInvId) {
      get().sendChat(kind === 'hp' ? '背包里没有红药了！' : '背包里没有蓝药了！', 'system');
      return false;
    }

    // 满血/满蓝时不使用
    if (kind === 'hp' && player.hp >= player.maxHp) {
      get().sendChat('生命已满，无需使用红药', 'system');
      return false;
    }
    if (kind === 'mp' && player.mp >= player.maxMp) {
      get().sendChat('魔法已满，无需使用蓝药', 'system');
      return false;
    }

    // 检查药水使用冷却（500ms），避免快速连击浪费
    const now = Date.now();
    const lastPotionTs = (get() as any)._lastPotionTs || 0;
    if (now - lastPotionTs < 400) return false;
    (get() as any)._lastPotionTs = now;

    // 调用 useItem 执行实际使用逻辑
    get().useItem(foundInvId);
    return true;
  },

  equipItem: (inventoryId) => {
    const { inventory, player, equipment } = get();
    const itemIdx = inventory.findIndex(i => i.id === inventoryId);
    if (itemIdx === -1) return;

    const item = inventory[itemIdx];
    const itemDef = ITEM_DEFINITIONS[item.itemId];
    if (!itemDef || !itemDef.equipSlot) return;

    // 等级检查
    if (itemDef.levelReq && player.level < itemDef.levelReq) {
      get().sendChat(`等级不足，需要${itemDef.levelReq}级！`, 'system');
      return;
    }

    // 职业检查
    if (itemDef.classReq && !itemDef.classReq.includes(player.class)) {
      get().sendChat('职业不匹配！', 'system');
      return;
    }

    const slot = itemDef.equipSlot;

    // 如果该位置已有装备，先脱下
    const currentEquip = equipment[slot];
    let newInventory = [...inventory];
    if (currentEquip) {
      newInventory.push(currentEquip);
    }

    // 装备新物品
    newInventory.splice(itemIdx, 1);
    const newEquipment = { ...equipment, [slot]: item };

    // 更新属性
    let statChanges = { attack: 0, defense: 0, hp: 0, mp: 0, accuracy: 0, agility: 0, luck: 0, critRate: 0, critDamage: 0 };
    if (itemDef.stats) {
      for (const [key, value] of Object.entries(itemDef.stats)) {
        if (key in statChanges && value) {
          (statChanges as any)[key] += value;
        }
      }
    }
    if (currentEquip) {
      const oldDef = ITEM_DEFINITIONS[currentEquip.itemId];
      if (oldDef?.stats) {
        for (const [key, value] of Object.entries(oldDef.stats)) {
          if (key in statChanges && value) {
            (statChanges as any)[key] -= value;
          }
        }
      }
    }

    // 套装加成变化：比较新旧装备列表的套装激活情况
    const oldEquippedIds = Object.values(equipment).filter(Boolean).map((i: any) => i.itemId);
    const newEquippedIds = Object.values(newEquipment).filter(Boolean).map((i: any) => i.itemId);
    const oldSetBonus = calculateActiveSetBonuses(oldEquippedIds);
    const newSetBonus = calculateActiveSetBonuses(newEquippedIds);
    for (const key of Object.keys(oldSetBonus)) {
      (statChanges as any)[key] = ((statChanges as any)[key] || 0) - (oldSetBonus[key] || 0);
    }
    for (const key of Object.keys(newSetBonus)) {
      (statChanges as any)[key] = ((statChanges as any)[key] || 0) + (newSetBonus[key] || 0);
    }

    // 提示激活的套装
    for (const setDef of Object.values(SET_BONUSES)) {
      const oldCnt = setDef.pieces.filter(id => oldEquippedIds.includes(id)).length;
      const newCnt = setDef.pieces.filter(id => newEquippedIds.includes(id)).length;
      for (const bonus of setDef.bonuses) {
        if (oldCnt < bonus.pieces && newCnt >= bonus.pieces) {
          get().sendChat(`✨ ${setDef.setName} 激活 ${bonus.pieces}件套效果！`, 'system');
        }
      }
    }

    // 考虑强化等级加成
    const enchantLevel = get().enchantLevels[slot] || 0;
    const enchantMultiplier = getEnchantStatMultiplier(enchantLevel);

    set({
      inventory: newInventory,
      equipment: newEquipment,
      player: {
        ...player,
        attack: player.attack + Math.floor(statChanges.attack * (enchantMultiplier > 1 ? (enchantMultiplier - 1) / 0.05 + 1 : 1)),
        defense: player.defense + Math.floor(statChanges.defense * (enchantMultiplier > 1 ? (enchantMultiplier - 1) / 0.05 + 1 : 1)),
        maxHp: player.maxHp + statChanges.hp,
        maxMp: player.maxMp + statChanges.mp,
        accuracy: player.accuracy + statChanges.accuracy,
        agility: player.agility + statChanges.agility,
        luck: player.luck + statChanges.luck,
        critRate: player.critRate + statChanges.critRate,
        critDamage: player.critDamage + statChanges.critDamage,
      },
    });

    get().sendChat(`装备了${itemDef.name}`, 'system');
  },

  unequipItem: (slot) => {
    const { equipment, inventory, player } = get();
    const item = equipment[slot];
    if (!item) return;

    const itemDef = ITEM_DEFINITIONS[item.itemId];
    const newInventory = [...inventory, item];
    const newEquipment = { ...equipment };
    delete newEquipment[slot];

    let statChanges = { attack: 0, defense: 0, hp: 0, mp: 0, accuracy: 0, agility: 0, luck: 0, critRate: 0, critDamage: 0 };
    if (itemDef?.stats) {
      for (const [key, value] of Object.entries(itemDef.stats)) {
        if (key in statChanges && value) {
          (statChanges as any)[key] -= value;
        }
      }
    }

    // 套装加成变化
    const oldEquippedIds = Object.values(equipment).filter(Boolean).map((i: any) => i.itemId);
    const newEquippedIds = Object.values(newEquipment).filter(Boolean).map((i: any) => i.itemId);
    const oldSetBonus = calculateActiveSetBonuses(oldEquippedIds);
    const newSetBonus = calculateActiveSetBonuses(newEquippedIds);
    for (const key of Object.keys(oldSetBonus)) {
      (statChanges as any)[key] = ((statChanges as any)[key] || 0) - (oldSetBonus[key] || 0);
    }
    for (const key of Object.keys(newSetBonus)) {
      (statChanges as any)[key] = ((statChanges as any)[key] || 0) + (newSetBonus[key] || 0);
    }

    set({
      inventory: newInventory,
      equipment: newEquipment,
      player: {
        ...player,
        attack: Math.max(1, player.attack + statChanges.attack),
        defense: Math.max(0, player.defense + statChanges.defense),
        maxHp: Math.max(50, player.maxHp + statChanges.hp),
        maxMp: Math.max(10, player.maxMp + statChanges.mp),
        accuracy: Math.max(1, player.accuracy + statChanges.accuracy),
        agility: Math.max(1, player.agility + statChanges.agility),
        luck: Math.max(0, player.luck + statChanges.luck),
        critRate: Math.max(0, player.critRate + statChanges.critRate),
        critDamage: Math.max(100, player.critDamage + statChanges.critDamage),
      },
    });

    if (itemDef) get().sendChat(`卸下了${itemDef.name}`, 'system');
  },

  sellItem: (inventoryId) => {
    const { inventory, player } = get();
    const itemIdx = inventory.findIndex(i => i.id === inventoryId);
    if (itemIdx === -1) return;

    const item = inventory[itemIdx];
    const itemDef = ITEM_DEFINITIONS[item.itemId];
    if (!itemDef) return;

    const sellPrice = itemDef.sellPrice * item.count;
    const newInventory = [...inventory];
    newInventory.splice(itemIdx, 1);

    set({
      inventory: newInventory,
      player: { ...player, gold: player.gold + sellPrice },
    });

    get().addCurrencyAction('gold', sellPrice);
    get().playSound('coin');
    get().sendChat(`出售了${itemDef.name}，获得${sellPrice}金币`, 'system');
  },

  buyItem: (itemId, price) => {
    const { inventory, player } = get();
    if (player.gold < price) {
      get().sendChat('金币不足！', 'system');
      return;
    }

    const itemDef = ITEM_DEFINITIONS[itemId];
    if (!itemDef) return;

    // 检查背包是否已有同类可堆叠物品
    const existingIdx = inventory.findIndex(i => i.itemId === itemId && itemDef.stackable);
    let newInventory: InventoryItem[];

    if (existingIdx >= 0) {
      newInventory = [...inventory];
      newInventory[existingIdx] = {
        ...newInventory[existingIdx],
        count: newInventory[existingIdx].count + 1,
      };
    } else {
      newInventory = [...inventory, { id: genId('item'), itemId, count: 1 }];
    }

    set({
      inventory: newInventory,
      player: { ...player, gold: player.gold - price },
    });

    get().playSound('coin');
    get().sendChat(`购买了${itemDef.name}，花费${price}金币`, 'system');
  },

  changeMap: (mapId, spawnX, spawnY) => {
    const { player } = get();
    const spawn = spawnX !== undefined && spawnY !== undefined
      ? { x: spawnX, y: spawnY }
      : getMapSpawnPoint(mapId);

    set({
      player: { ...player, mapId, x: spawn.x, y: spawn.y, isMoving: false },
      selectedTarget: null,
      interactingNPC: null,
    });

    get().loadMapEntities();
    get().sendChat(`进入了${MAP_DEFINITIONS[mapId]?.name || mapId}`, 'system');
  },

  interactWithNPC: (npcId) => {
    const { npcs, player } = get();
    const npc = npcs.find(n => n.id === npcId);
    if (!npc) {
      get().sendChat('找不到该NPC，可能已离开该地图', 'system');
      return;
    }

    // 距离检查：放宽到15格，更宽松（之前的8格太严，导致经常触发"太远了"）
    const dist = Math.sqrt((player.x - npc.x) ** 2 + (player.y - npc.y) ** 2);
    if (dist > 15) {
      // 太远了 - 自动靠近并提示
      get().sendChat(`【${npc.name}】太远了（距离${Math.floor(dist)}格），请先靠近再互动（需要15格内）`, 'system');
      return;
    }

    set({
      interactingNPC: npc,
      npcDialogIndex: 0,
      showShop: npc.type === 'shop',
      showCraft: npc.type === 'craft',
      showTeleportPanel: npc.type === 'teleport',
    });

    // 给一个互动反馈
    get().sendChat(`【${npc.name}】${npc.title} - 开始对话`, 'system');
    get().playSound('pickup');
  },

  closeNPCDialog: () => {
    set({
      interactingNPC: null,
      npcDialogIndex: 0,
      showShop: false,
      showCraft: false,
      showTeleportPanel: false,
    });
  },

  nextDialog: () => {
    const { interactingNPC, npcDialogIndex } = get();
    if (!interactingNPC) return;

    if (npcDialogIndex < interactingNPC.dialog.length - 1) {
      set({ npcDialogIndex: npcDialogIndex + 1 });
    } else {
      get().closeNPCDialog();
    }
  },

  enterDungeon: (dungeonMapId) => {
    const { player } = get();
    const mapDef = MAP_DEFINITIONS[dungeonMapId];
    if (!mapDef) return;

    const dungeon: DungeonInstance = {
      id: genId('dungeon'),
      mapId: dungeonMapId,
      name: mapDef.name,
      timeLimit: 1800, // 30分钟
      startTime: Date.now(),
      monsters: [],
      isCompleted: false,
      isFailed: false,
    };

    set({
      activeDungeon: dungeon,
      player: { ...player, mapId: dungeonMapId, x: 2, y: 2, isMoving: false },
      selectedTarget: null,
    });

    get().loadMapEntities();
    get().sendChat(`进入了副本：${mapDef.name}，限时30分钟！`, 'system');
  },

  exitDungeon: () => {
    const { player } = get();
    // 返回上一个野外地图
    set({
      activeDungeon: null,
      player: { ...player, mapId: 'yinxing_valley', x: 100, y: 100, isMoving: false },
    });
    get().loadMapEntities();
    get().sendChat('已退出副本', 'system');
  },

  toggleInventory: () => set(s => ({ showInventory: !s.showInventory })),
  toggleCharacter: () => set(s => ({ showCharacter: !s.showCharacter })),
  toggleSkills: () => set(s => ({ showSkills: !s.showSkills })),
  toggleShop: () => set(s => ({ showShop: !s.showShop })),
  toggleCraft: () => set(s => ({ showCraft: !s.showCraft })),
  toggleDungeonPanel: () => set(s => ({ showDungeonPanel: !s.showDungeonPanel })),
  toggleQuestLog: () => set(s => ({ showQuestLog: !s.showQuestLog })),
  toggleMinimap: () => set(s => ({ showMinimap: !s.showMinimap })),
  toggleDebugPanel: () => set(s => ({ showDebugPanel: !s.showDebugPanel })),
  toggleCraftPanel: () => set(s => ({ showCraftPanel: !s.showCraftPanel })),
  toggleEnchantPanel: () => set(s => ({ showEnchantPanel: !s.showEnchantPanel })),
  toggleReforgePanel: () => set(s => ({ showReforgePanel: !s.showReforgePanel })),
  toggleAwakenPanel: () => set(s => ({ showAwakenPanel: !s.showAwakenPanel })),
  toggleAoyiPanel: () => set(s => ({ showAoyiPanel: !s.showAoyiPanel })),
  toggleRepairPanel: () => set(s => ({ showRepairPanel: !s.showRepairPanel })),

  // 全屏地图
  toggleFullMap: () => set(s => ({ showFullMap: !s.showFullMap })),

  // 技能栏自定义
  setSkillBar: (index: number, skillId: string) => {
    const state = get();
    const newBar = [...state.skillBar];
    if (index >= 0 && index < newBar.length) {
      newBar[index] = skillId;
      set({ skillBar: newBar });
    }
  },

  // UI位置
  uiPositions: {},
  resetUILayout: () => set({
    uiPositions: {},
    showInventory: false,
    showCharacter: false,
    showSkills: false,
    showShop: false,
    showCraft: false,
    showDungeonPanel: false,
    showQuestLog: false,
    showDebugPanel: false,
    showActivityPanel: false,
    showBossTimer: false,
    showCraftPanel: false,
    showEnchantPanel: false,
    showReforgePanel: false,
    showAwakenPanel: false,
    showAoyiPanel: false,
    showRepairPanel: false,
    showGMPanel: false,
    showGuidePanel: false,
    showTeleportPanel: false,
    showFullMap: false,
  }),

  selectTarget: (type, id) => set({ selectedTarget: { type, id } }),
  clearTarget: () => set({ selectedTarget: null }),

  // === 天气系统 ===
  updateWeather: () => {
    const { player, currentWeather, weatherChangeTimer } = get();
    const newTimer = weatherChangeTimer - 16; // approximate per-tick delta

    if (newTimer > 0) {
      set({ weatherChangeTimer: newTimer });
      return;
    }

    // 天气切换 - 基于地图
    const mapWeatherPool: Record<string, RendererWeatherType[]> = {
      yinxing_valley: ['clear', 'clear', 'clear', 'rain'],         // 银杏山谷: 多晴，偶尔雨
      bqi_forest: ['rain', 'rain', 'clear', 'clear', 'rain'],      // 比奇森林: 频繁雨
      snake_valley: ['sandstorm', 'sandstorm', 'clear', 'sandstorm'], // 毒蛇山谷: 沙暴常见
      mengzhong_waste: ['sandstorm', 'thunder', 'sandstorm', 'thunder'], // 盟重荒野: 沙暴+雷暴
      cangyue_coast: ['rain', 'thunder', 'rain', 'clear'],          // 苍月岛海岸: 雨+雷暴
    };

    const pool = mapWeatherPool[player.mapId] || ['clear', 'clear', 'rain'];
    const newWeather = pool[Math.floor(Math.random() * pool.length)];

    if (newWeather !== currentWeather) {
      const weatherNames: Record<RendererWeatherType, string> = {
        clear: '晴天',
        rain: '下雨',
        sandstorm: '沙暴',
        snow: '下雪',
        thunder: '雷暴',
      };
      get().sendChat(`天气变化：${weatherNames[newWeather]}`, 'system');
    }

    // 同步渲染器天气
    renderer.setWeather(newWeather);

    set({
      currentWeather: newWeather,
      weatherChangeTimer: 300000 + Math.random() * 300000, // 5-10 minutes
    });
  },

  // === 技能视觉效果 ===
  addSkillEffect: (effect) => {
    const { activeSkillEffects } = get();
    // 限制最多20个同时存在的效果
    const cleanedEffects = activeSkillEffects.slice(-19);
    const newEffect: SkillEffect = {
      ...effect,
      id: genId('skfx'),
      startTime: Date.now(),
    };
    set({ activeSkillEffects: [...cleanedEffects, newEffect] });
  },

  // === 自动攻击 ===
  toggleAutoAttack: () => {
    const { autoAttackEnabled } = get();
    set({
      autoAttackEnabled: !autoAttackEnabled,
      autoAttackTarget: null,
      autoAttackCooldown: 0,
    });
    if (autoAttackEnabled) {
      get().sendChat('自动攻击已关闭', 'system');
    } else {
      get().sendChat('自动攻击已开启', 'system');
    }
  },

  setAutoAttackTarget: (entityId) => {
    set({
      autoAttackTarget: entityId,
      autoAttackCooldown: 0,
    });
  },

  sendChat: (message, channel = 'all') => {
    set(state => ({
      chatMessages: [...state.chatMessages, {
        id: genId('chat'),
        sender: state.phase === 'playing' ? state.player.name : '系统',
        message,
        type: 'local' as const,
        timestamp: Date.now(),
        color: '#ffffff',
        channel,
      }].slice(-100), // 保留最新100条
    }));
  },

  pickupGroundItem: (id) => {
    const state = get();
    const item = state.groundItems.find(gi => gi.id === id);
    if (!item) return;

    const itemDef = ITEM_DEFINITIONS[item.itemId];
    if (!item) return;

    const itemDefReal = ITEM_DEFINITIONS[item.itemId];
    if (!itemDefReal) return;

    // 距离检查：3格内才能拾取
    const dist = Math.sqrt((state.player.x - item.x) ** 2 + (state.player.y - item.y) ** 2);
    if (dist > 3) {
      get().sendChat('物品太远，请靠近后再拾取', 'system');
      return;
    }

    // 添加到背包 - 支持堆叠
    let newInventory;
    if (itemDefReal.stackable) {
      // 可堆叠物品：合并到已有的同ID物品堆
      const existingIdx = state.inventory.findIndex(i => i.itemId === item.itemId);
      if (existingIdx >= 0) {
        newInventory = [...state.inventory];
        const maxStack = itemDefReal.maxStack || 99;
        newInventory[existingIdx] = {
          ...newInventory[existingIdx],
          count: Math.min(maxStack, newInventory[existingIdx].count + 1),
        };
      } else {
        // 创建新堆
        const newItem = get().rollPremiumBonus(item.itemId);
        newItem.count = 1;
        newInventory = [...state.inventory, newItem];
      }
    } else {
      // 不可堆叠物品（装备等）：roll极品属性后加入
      const invItem = get().rollPremiumBonus(item.itemId);
      invItem.count = 1;
      newInventory = [...state.inventory, invItem];
    }

    set(state => ({
      groundItems: state.groundItems.filter(gi => gi.id !== id),
      inventory: newInventory,
    }));

    get().sendChat(`拾取了 ${itemDefReal.icon || ''}${itemDefReal.name}`, 'all');
    get().playSound('pickup');
  },

  tickGroundItems: () => {
    const state = get();
    const now = Date.now();
    // 地面物品5分钟后消失（原60秒太短）
    const GROUND_ITEM_TTL = 5 * 60 * 1000;
    const freshItems = state.groundItems.filter(gi => now - gi.timestamp < GROUND_ITEM_TTL);
    if (freshItems.length !== state.groundItems.length) {
      set({ groundItems: freshItems });
    }

    // Auto-pickup: when player walks within 1.5 tile of a ground item
    const playerX = state.player.x;
    const playerY = state.player.y;
    const itemsToPickup = freshItems.filter(gi => {
      const dist = Math.sqrt((gi.x - playerX) ** 2 + (gi.y - playerY) ** 2);
      return dist < 1.5;
    });

    for (const item of itemsToPickup) {
      get().pickupGroundItem(item.id);
    }
  },

  gameLoop: (deltaTime) => {
    const state = get();
    if (state.phase !== 'playing') return;

    const now = Date.now();
    const dt = deltaTime / 1000; // 转换为秒

    // 更新怪物AI
    let updatedMonsters = state.monsters.map(monster => {
      if (monster.isDead) return monster;

      const newMonster = { ...monster };
      newMonster.moveTimer -= deltaTime;

      // 怪物移动
      if (newMonster.moveTimer <= 0) {
        newMonster.moveTimer = 2000 + Math.random() * 3000;

        // 如果玩家在范围内且怪物是主动攻击型
        const distToPlayer = Math.sqrt(
          (state.player.x - monster.x) ** 2 + (state.player.y - monster.y) ** 2
        );

        if (monster.aggressive && distToPlayer < 8 && distToPlayer > 1.2) {
          // 追踪玩家
          const dx = state.player.x - monster.x;
          const dy = state.player.y - monster.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const moveStep = Math.min(monster.speed * 0.3, dist - 1);

          if (moveStep > 0) {
            const nx = monster.x + (dx / dist) * moveStep;
            const ny = monster.y + (dy / dist) * moveStep;
            const tile = getMapTile(state.player.mapId, Math.floor(nx), Math.floor(ny));
            if (isTileWalkable(tile)) {
              newMonster.x = nx;
              newMonster.y = ny;
            }
          }
        } else if (distToPlayer > 15) {
          // 回家
          const dx = monster.homeX - monster.x;
          const dy = monster.homeY - monster.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 2) {
            const moveStep = Math.min(monster.speed * 0.2, dist);
            const nx = monster.x + (dx / dist) * moveStep;
            const ny = monster.y + (dy / dist) * moveStep;
            newMonster.x = nx;
            newMonster.y = ny;
          }
        } else {
          // 随机游荡
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 2;
          const nx = monster.x + Math.cos(angle) * dist;
          const ny = monster.y + Math.sin(angle) * dist;
          const tile = getMapTile(state.player.mapId, Math.floor(nx), Math.floor(ny));
          if (isTileWalkable(tile)) {
            const distFromHome = Math.sqrt((nx - monster.homeX) ** 2 + (ny - monster.homeY) ** 2);
            if (distFromHome < 20) {
              newMonster.x = nx;
              newMonster.y = ny;
            }
          }
        }
      }

      // 怪物攻击
      if (monster.aggressive) {
        const distToPlayer = Math.sqrt(
          (state.player.x - monster.x) ** 2 + (state.player.y - monster.y) ** 2
        );

        if (distToPlayer <= monster.attackRange + 0.5 && now - monster.lastAttackTime > 2000) {
          newMonster.lastAttackTime = now;
          const monsterDamage = Math.max(1, monster.attack - state.player.defense * 0.4);
          get().takeDamage(Math.floor(monsterDamage * (0.9 + Math.random() * 0.2)), monster.id);
        }
      }

      return newMonster;
    });

    // 更新假玩家
    let updatedBots = state.bots.map(bot => {
      const newBot = { ...bot };
      newBot.moveTimer -= deltaTime;
      newBot.chatTimer -= deltaTime;

      // 假玩家移动
      if (newBot.moveTimer <= 0 && bot.movePattern !== 'stationary') {
        newBot.moveTimer = 2000 + Math.random() * 4000;

        if (bot.movePattern === 'patrol' && bot.patrolPoints.length > 0) {
          const target = bot.patrolPoints[newBot.currentPatrolIndex];
          const dx = target.x - bot.x;
          const dy = target.y - bot.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 1) {
            newBot.currentPatrolIndex = (newBot.currentPatrolIndex + 1) % bot.patrolPoints.length;
          } else {
            const step = Math.min(2, dist);
            newBot.x = bot.x + (dx / dist) * step;
            newBot.y = bot.y + (dy / dist) * step;
          }
        } else if (bot.movePattern === 'wander') {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 3;
          const nx = bot.x + Math.cos(angle) * dist;
          const ny = bot.y + Math.sin(angle) * dist;
          const mapDef = MAP_DEFINITIONS[state.player.mapId];
          if (mapDef && nx > 0 && ny > 0 && nx < mapDef.width && ny < mapDef.height) {
            const tile = getMapTile(state.player.mapId, Math.floor(nx), Math.floor(ny));
            if (isTileWalkable(tile)) {
              newBot.x = nx;
              newBot.y = ny;
            }
          }
        }
      }

      // 假玩家聊天
      if (newBot.chatTimer <= 0 && bot.chatMessages.length > 0) {
        newBot.chatTimer = 15000 + Math.random() * 45000;
        const msg = bot.chatMessages[Math.floor(Math.random() * bot.chatMessages.length)];
        set(s => ({
          chatMessages: [...s.chatMessages, {
            id: genId('chat'),
            sender: bot.name,
            message: msg,
            type: 'local' as const,
            timestamp: now,
            color: '#88ccff',
            channel: 'all' as const,
          }].slice(-100),
        }));
      }

      return newBot;
    });

    // 自然回复
    const hpRegen = state.player.hp < state.player.maxHp ? Math.min(1, state.player.maxHp * 0.005 * dt) : 0;
    const mpRegen = state.player.mp < state.player.maxMp ? Math.min(1, state.player.maxMp * 0.01 * dt) : 0;

    // 清理过期效果
    const cleanDamage = state.damageNumbers.filter(d => now - d.timestamp < 1500);
    const cleanParticles = state.particles.filter(p => now - p.timestamp < p.duration);
    // 清理过期技能视觉效果
    const cleanSkillEffects = state.activeSkillEffects.filter(e => now - e.startTime < e.duration);

    // 动态怪物生成 - 确保玩家附近始终有怪
    let dynamicMonsters = [...updatedMonsters];
    const nearMonsters = updatedMonsters.filter(m =>
      !m.isDead && Math.sqrt((m.x - state.player.x) ** 2 + (m.y - state.player.y) ** 2) < 30
    );

    if (nearMonsters.length < 8 && state.gameTick % 30 === 0) {
      const mapDef = MAP_DEFINITIONS[state.player.mapId];
      if (mapDef && mapDef.monsterIds.length > 0) {
        // 在玩家附近生成新怪物
        const spawnCount = Math.min(5, 12 - nearMonsters.length);
        for (let i = 0; i < spawnCount; i++) {
          const randomId = mapDef.monsterIds[Math.floor(Math.random() * mapDef.monsterIds.length)];
          const def = MONSTER_DEFINITIONS[randomId];
          if (def) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 20;
            const spawnX = Math.floor(state.player.x + Math.cos(angle) * dist);
            const spawnY = Math.floor(state.player.y + Math.sin(angle) * dist);
            const pos = findWalkablePosition(state.player.mapId, spawnX, spawnY, 5);
            dynamicMonsters.push(createMonsterInstance(def, pos, false));
          }
        }
      }

      // 也确保Boss在附近（野外地图）
      if (mapDef && mapDef.bossIds && nearMonsters.filter(m => m.isBoss).length === 0 && state.gameTick % 300 === 0) {
        const bossId = mapDef.bossIds[Math.floor(Math.random() * mapDef.bossIds.length)];
        const bossDef = BOSS_DEFINITIONS[bossId];
        if (bossDef) {
          const bossPos = findWalkablePosition(state.player.mapId,
            Math.floor(state.player.x) + 10,
            Math.floor(state.player.y) + 10,
            15
          );
          dynamicMonsters.push(createMonsterInstance(bossDef, bossPos, true));
        }
      }
    }

    // 清理离玩家太远的怪物（避免内存泄漏）
    dynamicMonsters = dynamicMonsters.filter(m => {
      if (m.isDead) return true; // 保留死亡怪物等待重生
      const dist = Math.sqrt((m.x - state.player.x) ** 2 + (m.y - state.player.y) ** 2);
      return dist < 80; // 保留80格范围内的怪物
    });

    // PK系统：灰名过期检查
    const updatedPKState = tickGrayNameExpiry(state.pkState);

    // 道心过期检查
    let updatedDaoHeart = state.daoHeartActive;
    if (state.daoHeartActive && state.daoHeartExpiry > 0 && now >= state.daoHeartExpiry) {
      updatedDaoHeart = false;
    }

    set({
      monsters: dynamicMonsters,
      bots: updatedBots,
      damageNumbers: cleanDamage,
      particles: cleanParticles,
      activeSkillEffects: cleanSkillEffects,
      player: {
        ...state.player,
        hp: Math.min(state.player.maxHp, state.player.hp + hpRegen),
        mp: Math.min(state.player.maxMp, state.player.mp + mpRegen),
      },
      gameTick: state.gameTick + 1,
      lastUpdate: now,
      pkState: updatedPKState,
      daoHeartActive: updatedDaoHeart,
      daoHeartExpiry: updatedDaoHeart ? state.daoHeartExpiry : 0,
    });

    // 天气更新
    get().updateWeather();

    // 地面物品定时清理 & 自动拾取
    get().tickGroundItems();

    // 自动攻击逻辑
    const curState = get();
    if (curState.autoAttackEnabled) {
      const autoAttackRange = 8; // 8格范围
      let targetMonster = curState.autoAttackTarget
        ? dynamicMonsters.find(m => m.id === curState.autoAttackTarget && !m.isDead)
        : null;

      // 如果当前目标死亡或不存在，找最近的怪
      if (!targetMonster) {
        const nearestMonster = dynamicMonsters
          .filter(m => !m.isDead)
          .sort((a, b) => {
            const da = Math.sqrt((curState.player.x - a.x) ** 2 + (curState.player.y - a.y) ** 2);
            const db = Math.sqrt((curState.player.x - b.x) ** 2 + (curState.player.y - b.y) ** 2);
            return da - db;
          })[0];

        if (nearestMonster) {
          const dist = Math.sqrt((curState.player.x - nearestMonster.x) ** 2 + (curState.player.y - nearestMonster.y) ** 2);
          if (dist <= autoAttackRange) {
            set({
              autoAttackTarget: nearestMonster.id,
              selectedTarget: { type: 'monster', id: nearestMonster.id },
            });
            targetMonster = nearestMonster;
          }
        }
      }

      // 自动攻击冷却
      const newCooldown = Math.max(0, curState.autoAttackCooldown - deltaTime);
      set({ autoAttackCooldown: newCooldown });

      if (targetMonster && newCooldown <= 0) {
        const dist = Math.sqrt((curState.player.x - targetMonster.x) ** 2 + (curState.player.y - targetMonster.y) ** 2);
        if (dist <= 2) {
          // 在攻击范围内 - 使用普通攻击
          set({ selectedTarget: { type: 'monster', id: targetMonster.id } });
          get().attackTarget();
          set({ autoAttackCooldown: 500 }); // 普通攻击冷却（缩短）
        }
        // 如果不在攻击范围但在自动攻击范围，玩家需要移动（通过 GameCanvas 处理）
      }
    }

    // 副本时间检查
    if (state.activeDungeon) {
      const elapsed = (now - state.activeDungeon.startTime) / 1000;
      if (elapsed >= state.activeDungeon.timeLimit) {
        get().sendChat('副本时间到！', 'system');
        get().exitDungeon();
      }
    }

    // 世界Boss定时刷新检查 - 每60tick(约1秒)
    if (state.gameTick % 60 === 0) {
      get().checkWorldBossSpawn();
    }

    // 定时活动检查 - 每300tick(约5秒)
    if (state.gameTick % 300 === 0) {
      get().checkTimedEvents();
    }

    // 活动重置检查 - 每1800tick(约30秒)
    if (state.gameTick % 1800 === 0) {
      get().checkActivityReset();
    }

    // 自动存档 - 每30秒
    if (state.gameTick % 1800 === 0 && state.gameTick > 0 && state.activeCharacterId) {
      get().saveCurrentGame();
    }
  },

  loadMapEntities: () => {
    const { player } = get();
    const mapId = player.mapId;

    const monsters = spawnMonstersForMap(mapId, player.x, player.y);
    const npcs = spawnNPCsForMap(mapId);
    const bots = spawnBotsForMap(mapId);

    set({
      monsters,
      npcs,
      bots,
    });
  },

  respawn: () => {
    const { player } = get();
    const spawn = getMapSpawnPoint(player.mapId);
    const stats = getClassBaseStats(player.class);

    set({
      phase: 'playing',
      player: {
        ...player,
        x: spawn.x,
        y: spawn.y,
        hp: Math.floor(player.maxHp * 0.5),
        mp: Math.floor(player.maxMp * 0.5),
      },
    });

    get().sendChat('你已复活！', 'system');
  },

  teleportToMap: (mapId, cost) => {
    const { player } = get();
    if (player.gold < cost) {
      get().sendChat('金币不足！', 'system');
      return;
    }
    set({
      player: { ...player, gold: player.gold - cost },
    });
    get().changeMap(mapId);
    get().closeNPCDialog();
  },

  acceptQuest: (questId) => {
    const { quests } = get();
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    if (quest.isComplete) {
      // 领取奖励
      const { player } = get();
      set({
        player: {
          ...player,
          exp: player.exp + quest.reward.exp,
          gold: player.gold + quest.reward.gold,
        },
        quests: quests.filter(q => q.id !== questId),
      });
      get().sendChat(`完成任务：${quest.name}，获得${quest.reward.exp}经验和${quest.reward.gold}金币！`, 'system');
    }
  },

  // === 经济系统 Actions ===

  addCurrencyAction: (type, amount) => {
    const { currency } = get();
    const newWallet = addCurrency(currency, type, amount);
    set({ currency: newWallet });
    // 同步到player.gold (向后兼容)
    if (type === 'gold') {
      set(s => ({ player: { ...s.player, gold: newWallet.gold } }));
    }
  },

  spendCurrency: (type, amount) => {
    const { currency } = get();
    if (!hasEnoughCurrency(currency, type, amount)) return false;
    const newWallet = deductCurrency(currency, type, amount);
    if (!newWallet) return false;
    set({ currency: newWallet });
    // 同步到player.gold (向后兼容)
    if (type === 'gold') {
      set(s => ({ player: { ...s.player, gold: newWallet.gold } }));
    }
    return true;
  },

  // === 强化系统 Actions ===

  enchantEquipment: (slot, useProtection) => {
    const { enchantLevels, inventory, player } = get();
    const currentLevel = enchantLevels[slot] || 0;

    // 检查是否已满级
    if (currentLevel >= ENCHANT_CONFIG.maxLevel) {
      return {
        success: false,
        resultType: 'protected' as const,
        newLevel: currentLevel,
        message: '装备已达最高强化等级',
      };
    }

    // 检查金币
    const goldCost = getEnchantGoldCost(currentLevel);
    if (player.gold < goldCost) {
      return {
        success: false,
        resultType: 'protected' as const,
        newLevel: currentLevel,
        message: '金币不足',
      };
    }

    // 检查材料
    const materialCost = getEnchantMaterialCost(currentLevel);
    const materialItemId = ENCHANT_CONFIG.materialItemId;
    const materialCount = inventory.filter(i => i.itemId === materialItemId).reduce((sum, i) => sum + i.count, 0);
    if (materialCount < materialCost) {
      return {
        success: false,
        resultType: 'protected' as const,
        newLevel: currentLevel,
        message: '材料不足',
      };
    }

    // 检查保护符
    let hasProtection = useProtection;
    if (useProtection) {
      const protectCount = inventory.filter(i => i.itemId === ENCHANT_CONFIG.protectItemId).reduce((sum, i) => sum + i.count, 0);
      if (protectCount < 1) {
        hasProtection = false;
      }
    }

    // 执行强化
    const result = performEnchant(currentLevel, hasProtection);

    // 扣除金币
    set(s => ({
      player: { ...s.player, gold: s.player.gold - goldCost },
      currency: { ...s.currency, gold: s.currency.gold - goldCost },
    }));

    // 扣除材料
    let remainingMaterial = materialCost;
    const newInventory = [...inventory];
    for (let i = newInventory.length - 1; i >= 0 && remainingMaterial > 0; i--) {
      if (newInventory[i].itemId === materialItemId) {
        if (newInventory[i].count <= remainingMaterial) {
          remainingMaterial -= newInventory[i].count;
          newInventory.splice(i, 1);
        } else {
          newInventory[i] = { ...newInventory[i], count: newInventory[i].count - remainingMaterial };
          remainingMaterial = 0;
        }
      }
    }

    // 扣除保护符
    if (hasProtection) {
      for (let i = newInventory.length - 1; i >= 0; i--) {
        if (newInventory[i].itemId === ENCHANT_CONFIG.protectItemId) {
          if (newInventory[i].count <= 1) {
            newInventory.splice(i, 1);
          } else {
            newInventory[i] = { ...newInventory[i], count: newInventory[i].count - 1 };
          }
          break;
        }
      }
    }

    // 更新强化等级
    const newEnchantLevels = { ...enchantLevels, [slot]: result.newLevel };

    // 如果装备破碎，移除装备
    if (result.resultType === 'destroy') {
      const newEquipment = { ...get().equipment };
      delete newEquipment[slot as keyof Equipment];
      delete newEnchantLevels[slot];
      set({
        enchantLevels: newEnchantLevels,
        inventory: newInventory,
        equipment: newEquipment,
      });
      get().sendChat(result.message);
    } else {
      set({
        enchantLevels: newEnchantLevels,
        inventory: newInventory,
      });
      get().sendChat(result.message);
    }

    return result;
  },

  // === 内功系统 Actions ===

  consumeNeigongPill: () => {
    const { neigongPillsConsumed, player } = get();

    // 检查等级是否解锁内功
    if (player.level < NEIGONG_UNLOCK_LEVEL) {
      get().sendChat(`需要${NEIGONG_UNLOCK_LEVEL}级才能修炼内功！`, 'system');
      return;
    }

    // 检查背包中是否有内功丹
    const { inventory } = get();
    const pillIdx = inventory.findIndex(i => i.itemId === 'neigongPill');
    if (pillIdx === -1) {
      get().sendChat('没有内功丹！', 'system');
      return;
    }

    // 消耗内功丹
    const newInventory = [...inventory];
    if (newInventory[pillIdx].count > 1) {
      newInventory[pillIdx] = { ...newInventory[pillIdx], count: newInventory[pillIdx].count - 1 };
    } else {
      newInventory.splice(pillIdx, 1);
    }

    const newPillsConsumed = neigongPillsConsumed + 1;
    const neigongData = getNeigongLevel(newPillsConsumed);

    set({
      neigongPillsConsumed: newPillsConsumed,
      neigongLevel: neigongData.level,
      maxNeigongHP: neigongData.maxNeigongHP,
      neigongHP: neigongData.maxNeigongHP,
      inventory: newInventory,
    });

    get().sendChat(`内功提升至${neigongData.level}级！内功生命：${neigongData.maxNeigongHP}，减伤：${(neigongData.damageReduction * 100).toFixed(1)}%，增伤：${(neigongData.damageIncrease * 100).toFixed(1)}%`, 'system');
  },

  // === 转生系统 Actions ===

  attemptReincarnation: () => {
    const { player, reincarnation, reincarnationPoints } = get();

    // 检查等级
    if (player.level < 60) {
      get().sendChat('需要达到60级才能转生！', 'system');
      return false;
    }

    // 检查转生次数
    if (reincarnation >= MAX_REINCARNATION) {
      get().sendChat('已达最大转生次数！', 'system');
      return false;
    }

    // 检查金币
    const cost = calculateGoldSinkCost('sink_reincarnation', player.level, get().pkState.isRedName);
    if (!get().spendCurrency('gold', cost)) {
      get().sendChat('金币不足，无法转生！');
      return false;
    }

    const newReincarnation = reincarnation + 1;
    const reincData = getReincarnationData(newReincarnation);
    const newReincPoints = reincarnationPoints + reincData.attributePointsGranted;

    // 重置等级，保留装备和强化
    const stats = getClassBaseStats(player.class);
    set({
      player: {
        ...player,
        level: 1,
        exp: 0,
        expToLevel: getExpToLevel(1),
        hp: stats.hp,
        maxHp: stats.hp,
        mp: stats.mp,
        maxMp: stats.mp,
      },
      reincarnation: newReincarnation,
      reincarnationPoints: newReincPoints,
    });

    get().playSound('levelup');
    get().sendChat(`转生成功！第${newReincarnation}次转生，获得${reincData.attributePointsGranted}属性点！经验倍率：${reincData.xpMultiplier}x`, 'system');

    return true;
  },

  // === PK系统 Actions ===

  setPKMode: (mode) => {
    const { pkState } = get();
    set({ pkState: { ...pkState, mode } });
    get().sendChat(`PK模式切换为：${PK_MODE_NAMES[mode]}`, 'system');
  },

  usePKCleansingItem: (itemId) => {
    const { pkState, inventory } = get();

    // 检查背包中是否有该物品
    const itemIdx = inventory.findIndex(i => i.itemId === itemId);
    if (itemIdx === -1) {
      get().sendChat('没有该物品！', 'system');
      return;
    }

    // 应用洗白道具
    const newPKState = applyPKCleansingItem(pkState, itemId);
    if (newPKState.pkValue === pkState.pkValue) {
      get().sendChat('该物品无法减少PK值！', 'system');
      return;
    }

    // 消耗物品
    const newInventory = [...inventory];
    if (newInventory[itemIdx].count > 1) {
      newInventory[itemIdx] = { ...newInventory[itemIdx], count: newInventory[itemIdx].count - 1 };
    } else {
      newInventory.splice(itemIdx, 1);
    }

    set({ pkState: newPKState, inventory: newInventory });
    get().sendChat(`使用洗白道具，PK值减少至${newPKState.pkValue}`, 'system');
  },

  // === 职业机制 Actions ===

  activateWarSoul: () => {
    const { player, warSoulValue } = get();
    if (player.class !== 'warrior') {
      get().sendChat('只有战士可以使用战魂爆发！', 'system');
      return;
    }

    const mechanism = getClassMechanismData('warrior');
    if (warSoulValue < (mechanism.warSoulMaxValue || 100) * 0.5) {
      get().sendChat('战魂值不足！', 'system');
      return;
    }

    // 战魂爆发效果
    set({ warSoulValue: 0 });
    get().sendChat(`战魂爆发！攻击速度提升${mechanism.warSoulBurstAtkSpeedBonus}倍，持续${(mechanism.warSoulBurstDuration || 8000) / 1000}秒！`, 'combat');

    // 一段时间后战魂爆发结束
    setTimeout(() => {
      get().sendChat('战魂爆发结束', 'combat');
    }, mechanism.warSoulBurstDuration || 8000);
  },

  // === 音效系统 Actions ===

  toggleSound: () => {
    const { soundEnabled } = get();
    if (!soundEnabled) {
      soundManager.init();
    }
    soundManager.toggle();
    set({ soundEnabled: !soundEnabled });
  },

  toggleBGM: () => {
    const { bgmEnabled } = get();
    if (!bgmEnabled) {
      soundManager.init();
    }
    set({ bgmEnabled: !bgmEnabled });
    if (!bgmEnabled) {
      soundManager.playBGM('field');
    } else {
      soundManager.stopBGM();
    }
  },

  playSound: (name) => {
    const { soundEnabled } = get();
    if (!soundEnabled) return;
    soundManager.init();
    soundManager.play(name as any);
  },

  // === 存档系统 Actions ===

  saveCurrentGame: () => {
    const state = get();
    const { player, equipment, inventory, quests, activeCharacterId, currency, enchantLevels,
      neigongLevel, neigongHP, maxNeigongHP, neigongPillsConsumed,
      reincarnation, reincarnationPoints, pkState } = state;

    // 构建存档用的装备数据
    const equipData: Record<string, { itemId: string; quantity: number } | null> = {};
    for (const [slot, item] of Object.entries(equipment)) {
      if (item) {
        equipData[slot] = { itemId: item.itemId, quantity: item.count };
      } else {
        equipData[slot] = null;
      }
    }

    saveGame({
      player: {
        name: player.name,
        classType: player.class,
        level: player.level,
        xp: player.exp,
        hp: player.hp,
        mp: player.mp,
        gold: player.gold,
        inventory: inventory.map(i => ({ itemId: i.itemId, quantity: i.count })),
        equipment: equipData,
        activeSkills: state.skillBar.filter(s => s !== ''),
        currentMapId: player.mapId,
        position: { x: player.x, y: player.y },
        accuracy: player.accuracy,
        agility: player.agility,
        luck: player.luck,
        critRate: player.critRate,
        critDamage: player.critDamage,
        warSoulValue: state.warSoulValue,
        elementStacks: state.elementStacks,
        elementType: state.elementType,
        innerPower: neigongHP,
        maxInnerPower: maxNeigongHP,
        innerPowerLevel: neigongLevel,
        rebirthLevel: reincarnation,
        rebirthPoints: reincarnationPoints,
        enchantLevel: enchantLevels as any,
        pkMode: pkState.mode,
        pkValue: pkState.pkValue,
        boundGold: currency.boundGold,
        ingot: currency.ingot,
        gloryPoints: currency.gloryPoints,
      },
      currentMapId: player.mapId,
      quests: quests,
      activeCharacterId: activeCharacterId,
    });
  },

  loadSavedGame: (characterId) => {
    const saveData = loadCharacter(characterId);
    if (!saveData) {
      get().sendChat('存档不存在！', 'system');
      return false;
    }

    const p = saveData.player;
    const stats = getClassBaseStats(p.classType);

    set({
      phase: 'playing',
      activeCharacterId: characterId,
      player: {
        name: p.name,
        class: p.classType,
        level: p.level,
        exp: p.xp,
        expToLevel: getExpToLevel(p.level),
        hp: p.hp,
        maxHp: stats.hp + p.level * 15,
        mp: p.mp,
        maxMp: stats.mp + p.level * 5,
        attack: stats.attack + p.level * 2,
        defense: stats.defense + p.level * 1,
        accuracy: p.accuracy || stats.accuracy,
        agility: p.agility || stats.agility,
        luck: p.luck || 0,
        critRate: p.critRate || 5,
        critDamage: p.critDamage || 150,
        gold: p.gold,
        x: p.position.x,
        y: p.position.y,
        mapId: p.currentMapId || 'yinxing_valley',
        isMoving: false,
        direction: 0,
        speed: 8,
      },
      inventory: p.inventory.map((item, idx) => ({
        id: genId('item'),
        itemId: item.itemId,
        count: item.quantity,
      })),
      equipment: Object.fromEntries(
        Object.entries(p.equipment || {}).filter(([_, v]) => v !== null).map(([slot, item]) => [
          slot,
          { id: genId('item'), itemId: (item as any).itemId, count: (item as any).quantity || 1 }
        ])
      ) as Equipment,
      skillBar: [...(p.activeSkills || []), '', '', '', '', '', '', ''].slice(0, 8),
      quests: saveData.quests || getInitialQuests(),
      currency: {
        gold: p.gold,
        boundGold: p.boundGold || 0,
        ingot: p.ingot || 0,
        gloryPoints: p.gloryPoints || 0,
      },
      enchantLevels: (p.enchantLevel as Record<string, number>) || {},
      neigongLevel: p.innerPowerLevel || 0,
      neigongHP: p.innerPower || 0,
      maxNeigongHP: p.maxInnerPower || 0,
      neigongPillsConsumed: 0,
      reincarnation: p.rebirthLevel || 0,
      reincarnationPoints: p.rebirthPoints || 0,
      pkState: {
        mode: p.pkMode || 'goodEvil',
        pkValue: p.pkValue || 0,
        isGrayName: false,
        grayNameExpiry: 0,
        isRedName: (p.pkValue || 0) >= RED_NAME_THRESHOLD,
      },
      warSoulValue: p.warSoulValue || 0,
      elementStacks: p.elementStacks || 0,
      elementType: p.elementType || 'none',
    });

    queueMicrotask(() => get().loadMapEntities());
    get().sendChat(`读取存档成功：${p.name}`, 'system');

    // 每日签到检查
    queueMicrotask(() => get().checkDailyLogin());

    return true;
  },

  // === 制作系统 Actions ===

  craftItem: (recipeId) => {
    const recipe = CRAFTING_RECIPES[recipeId];
    if (!recipe) return false;

    const { player, inventory } = get();

    // 检查等级
    if (player.level < recipe.requiredLevel) {
      get().sendChat(`等级不足，需要${recipe.requiredLevel}级！`, 'system');
      return false;
    }

    // 检查材料
    const inventoryItems = inventory.map(i => ({ itemId: i.itemId, quantity: i.count }));
    if (!canCraftRecipe(recipe, inventoryItems)) {
      get().sendChat('材料不足！', 'system');
      return false;
    }

    // 消耗材料
    let newInventory = [...inventory];
    for (const mat of recipe.materials) {
      let remaining = mat.quantity;
      for (let i = newInventory.length - 1; i >= 0 && remaining > 0; i--) {
        if (newInventory[i].itemId === mat.itemId) {
          if (newInventory[i].count <= remaining) {
            remaining -= newInventory[i].count;
            newInventory.splice(i, 1);
          } else {
            newInventory[i] = { ...newInventory[i], count: newInventory[i].count - remaining };
            remaining = 0;
          }
        }
      }
    }

    // 添加产出物品
    newInventory.push({ id: genId('item'), itemId: recipe.result.itemId, count: recipe.result.quantity });

    set({ inventory: newInventory });
    get().playSound('pickup');
    get().sendChat(`制作成功：${recipe.name}！`, 'system');

    return true;
  },

  // === 重铸系统 Actions ===

  reforgeEquipment: (inventoryItemId) => {
    const { inventory, player } = get();
    const item = inventory.find(i => i.id === inventoryItemId);
    if (!item) {
      return { success: false, cost: 0, message: '物品不存在' };
    }

    const itemDef = ITEM_DEFINITIONS[item.itemId];
    if (!itemDef || !itemDef.equipSlot) {
      return { success: false, cost: 0, message: '该物品无法重铸' };
    }

    // 检查品质
    if (!canReforgeCheck(itemDef.rarity)) {
      return { success: false, cost: 0, message: '仅紫色(稀有)及以上装备可重铸' };
    }

    // 检查等级解锁
    if (player.level < 42) {
      return { success: false, cost: 0, message: '需要42级解锁重铸' };
    }

    // 计算费用
    const goldCost = getReforgeGoldCost(itemDef.levelReq || 1, itemDef.rarity);
    const stoneCost = getReforgeStoneCost(itemDef.rarity);

    // 检查金币
    if (player.gold < goldCost) {
      return { success: false, cost: goldCost, message: '金币不足' };
    }

    // 检查重铸石
    const stoneCount = inventory.filter(i => i.itemId === REFORGE_STONE_ITEM_ID).reduce((sum, i) => sum + i.count, 0);
    if (stoneCount < stoneCost) {
      return { success: false, cost: goldCost, message: '重铸石不足' };
    }

    // 扣除金币
    set(s => ({
      player: { ...s.player, gold: s.player.gold - goldCost },
      currency: { ...s.currency, gold: s.currency.gold - goldCost },
    }));

    // 扣除重铸石
    let remainingStones = stoneCost;
    const newInventory = [...get().inventory];
    for (let i = newInventory.length - 1; i >= 0 && remainingStones > 0; i--) {
      if (newInventory[i].itemId === REFORGE_STONE_ITEM_ID) {
        if (newInventory[i].count <= remainingStones) {
          remainingStones -= newInventory[i].count;
          newInventory.splice(i, 1);
        } else {
          newInventory[i] = { ...newInventory[i], count: newInventory[i].count - remainingStones };
          remainingStones = 0;
        }
      }
    }

    // 生成新的重铸词条
    const newAffixes = rollReforgeAffixes(itemDef.rarity);

    // 更新物品
    const updatedInventory = newInventory.map(i =>
      i.id === inventoryItemId ? { ...i, reforgeAffixes: newAffixes } : i
    );

    set({ inventory: updatedInventory });

    const affixNames = newAffixes.map(a => {
      const affixDef = (REFORGE_AFFIX_POOL as ReforgeAffix[]).find(p => p.id === a.affixId);
      return affixDef?.name || a.stat;
    }).join(', ');

    get().sendChat(`重铸成功！新词条：${affixNames || '无'}`, 'system');
    return { success: true, cost: goldCost, message: `重铸成功！新词条：${affixNames || '无'}` };
  },

  // === 觉醒系统 Actions ===

  awakenEquipment: (inventoryItemId) => {
    const { inventory, player } = get();
    const item = inventory.find(i => i.id === inventoryItemId);
    if (!item) {
      return { success: false, cost: 0, message: '物品不存在' };
    }

    const itemDef = ITEM_DEFINITIONS[item.itemId];
    if (!itemDef || !itemDef.equipSlot) {
      return { success: false, cost: 0, message: '该物品无法觉醒' };
    }

    // 检查品质
    if (!canAwakenCheck(itemDef.rarity)) {
      return { success: false, cost: 0, message: '仅神话(红色)装备可觉醒' };
    }

    // 检查等级解锁
    if (player.level < 45) {
      return { success: false, cost: 0, message: '需要45级解锁觉醒' };
    }

    // 检查觉醒次数
    const currentAwakenCount = item.awakenCount || 0;
    if (currentAwakenCount >= MAX_AWAKENING_COUNT) {
      return { success: false, cost: 0, message: '已达最大觉醒次数' };
    }

    // 计算费用
    const goldCost = getAwakeningGoldCost(currentAwakenCount);
    const materialCost = getAwakeningMaterialCost(currentAwakenCount);

    // 检查金币
    if (player.gold < goldCost) {
      return { success: false, cost: goldCost, message: '金币不足' };
    }

    // 检查觉醒晶石
    const crystalCount = inventory.filter(i => i.itemId === AWAKENING_MATERIAL_ITEM_ID).reduce((sum, i) => sum + i.count, 0);
    if (crystalCount < materialCost) {
      return { success: false, cost: goldCost, message: '觉醒晶石不足' };
    }

    // 抽取觉醒词条
    const existingIds = item.awakenedAffixes || [];
    const newAffix = rollAwakeningAffix(player.class as CharacterClass, existingIds);
    if (!newAffix) {
      return { success: false, cost: 0, message: '没有可觉醒的词条' };
    }

    // 扣除金币
    set(s => ({
      player: { ...s.player, gold: s.player.gold - goldCost },
      currency: { ...s.currency, gold: s.currency.gold - goldCost },
    }));

    // 扣除觉醒晶石
    let remainingMaterial = materialCost;
    const newInventory2 = [...get().inventory];
    for (let i = newInventory2.length - 1; i >= 0 && remainingMaterial > 0; i--) {
      if (newInventory2[i].itemId === AWAKENING_MATERIAL_ITEM_ID) {
        if (newInventory2[i].count <= remainingMaterial) {
          remainingMaterial -= newInventory2[i].count;
          newInventory2.splice(i, 1);
        } else {
          newInventory2[i] = { ...newInventory2[i], count: newInventory2[i].count - remainingMaterial };
          remainingMaterial = 0;
        }
      }
    }

    // 更新物品
    const updatedAffixes = [...existingIds, newAffix.id];
    const updatedInventory = newInventory2.map(i =>
      i.id === inventoryItemId ? {
        ...i,
        awakenedAffixes: updatedAffixes,
        awakenCount: currentAwakenCount + 1,
      } : i
    );

    set({ inventory: updatedInventory });

    get().sendChat(`觉醒成功！获得词条：${newAffix.name} - ${newAffix.description}`, 'system');
    return {
      success: true,
      cost: goldCost,
      awakenedAffix: newAffix.id,
      message: `觉醒成功！获得：${newAffix.name} - ${newAffix.description}`,
    };
  },

  // === 技能熟练度 Actions ===

  addSkillProficiency: (skillId, count) => {
    const { skillProficiency } = get();
    const current = skillProficiency[skillId] || 0;
    const newValue = Math.min(300, current + count);
    set({
      skillProficiency: { ...skillProficiency, [skillId]: newValue },
    });
  },

  // === 奥义精修 Actions ===

  unlockAoyi: (skillId, affixId) => {
    const { skillProficiency, aoyiUnlocked, inventory, player } = get();

    // 检查熟练度
    const proficiency = skillProficiency[skillId] || 0;
    if (!canUnlockAoyi(proficiency)) {
      get().sendChat('技能熟练度不足，需要3级(200+)', 'system');
      return false;
    }

    // 检查技能是否有该奥义
    const skillDef = SKILL_DEFINITIONS[skillId];
    if (!skillDef?.aoyiAffixes?.find(a => a.id === affixId)) {
      get().sendChat('该技能没有此奥义词条', 'system');
      return false;
    }

    // 检查是否已解锁
    const unlocked = aoyiUnlocked[skillId] || [];
    if (unlocked.includes(affixId)) {
      get().sendChat('该奥义已解锁', 'system');
      return false;
    }

    // 检查材料
    const scrollCount = inventory.filter(i => i.itemId === AOYI_MATERIAL_ITEM_ID).reduce((sum, i) => sum + i.count, 0);
    if (scrollCount < AOYI_MATERIAL_COST) {
      get().sendChat('奥义残卷不足', 'system');
      return false;
    }

    // 扣除材料
    let remaining = AOYI_MATERIAL_COST;
    const newInventory = [...inventory];
    for (let i = newInventory.length - 1; i >= 0 && remaining > 0; i--) {
      if (newInventory[i].itemId === AOYI_MATERIAL_ITEM_ID) {
        if (newInventory[i].count <= remaining) {
          remaining -= newInventory[i].count;
          newInventory.splice(i, 1);
        } else {
          newInventory[i] = { ...newInventory[i], count: newInventory[i].count - remaining };
          remaining = 0;
        }
      }
    }

    // 解锁奥义
    const newUnlocked = [...unlocked, affixId];
    set({
      aoyiUnlocked: { ...aoyiUnlocked, [skillId]: newUnlocked },
      inventory: newInventory,
    });

    const affix = skillDef.aoyiAffixes.find(a => a.id === affixId);
    get().sendChat(`奥义精修成功：${affix?.name || affixId} - ${affix?.description || ''}`, 'system');
    return true;
  },

  // === 小极品生成 ===

  rollPremiumBonus: (itemId) => {
    const itemDef = ITEM_DEFINITIONS[itemId];
    const baseItem: InventoryItem = { id: genId('item'), itemId, count: 1 };

    if (!itemDef || !itemDef.equipSlot) {
      return baseItem;
    }

    // 设置耐久
    baseItem.currentDurability = itemDef.maxDurability || 100;

    // 小极品系统：绿色及以上装备才有概率
    const rarityOrder: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    const rarityIdx = rarityOrder.indexOf(itemDef.rarity);
    if (rarityIdx < 1) return baseItem; // 白色不生成

    // 品质决定极品概率
    const premiumChance = 0.1 + rarityIdx * 0.08; // 绿18% 蓝26% 紫34% 橙42% 红50%
    const roll = Math.random();
    let tier: 'normal' | 'fine' | 'superior' | 'supreme' = 'normal';
    let extraPoints = 0;
    let floatMult = 1.0;

    if (roll < premiumChance * 0.1) {
      tier = 'supreme'; // 极品
      extraPoints = 3 + Math.floor(Math.random() * 3); // 3-5点
      floatMult = 1.2 + Math.random() * 0.1; // 20%-30%浮动
    } else if (roll < premiumChance * 0.35) {
      tier = 'superior'; // 上品
      extraPoints = 1 + Math.floor(Math.random() * 3); // 1-3点
      floatMult = 1.1 + Math.random() * 0.1; // 10%-20%浮动
    } else if (roll < premiumChance) {
      tier = 'fine'; // 凡品
      extraPoints = 1;
      floatMult = 1.05 + Math.random() * 0.05; // 5%-10%浮动
    }

    if (tier !== 'normal') {
      // 随机分配额外属性点
      const statKeys = ['attack', 'defense', 'hp', 'mp', 'accuracy', 'agility', 'critRate'];
      const extraStats: Record<string, number> = {};
      for (let i = 0; i < extraPoints; i++) {
        const key = statKeys[Math.floor(Math.random() * statKeys.length)];
        extraStats[key] = (extraStats[key] || 0) + 1;
      }

      // 项链特殊：幸运+1到+3
      let luckBonus: number | undefined;
      if (itemDef.equipSlot === 'necklace' && Math.random() < 0.25) {
        luckBonus = 1 + Math.floor(Math.random() * 3);
      }

      baseItem.premiumBonus = {
        tier,
        extraStats,
        luckBonus,
        floatMultiplier: floatMult,
      };
    }

    return baseItem;
  },

  // === 装备耐久系统 Actions ===

  reduceDurability: (slot) => {
    const { equipment } = get();
    const item = equipment[slot];
    if (!item) return;

    // 每次受击有概率减少1点耐久
    if (Math.random() > 0.3) return; // 30%概率

    const maxDura = ITEM_DEFINITIONS[item.itemId]?.maxDurability || 100;
    const currentDura = item.currentDurability ?? maxDura;
    if (currentDura <= 0) return;

    const newDura = currentDura - 1;
    const updatedItem: InventoryItem = { ...item, currentDurability: newDura };
    set({ equipment: { ...equipment, [slot]: updatedItem } });

    // 耐久低于20%时警告
    if (newDura > 0 && newDura / maxDura < 0.2 && Math.random() < 0.1) {
      const itemDef = ITEM_DEFINITIONS[item.itemId];
      get().sendChat(`⚠️ ${itemDef?.name || '装备'}耐久度过低！(${newDura}/${maxDura})`, 'system');
    }

    // 耐久为0时通知
    if (newDura === 0) {
      const itemDef = ITEM_DEFINITIONS[item.itemId];
      get().sendChat(`❌ ${itemDef?.name || '装备'}耐久度归零！属性失效！`, 'system');
    }
  },

  repairEquipment: (slot) => {
    const { equipment, player } = get();
    const item = equipment[slot];
    if (!item) return { success: false, cost: 0 };

    const itemDef = ITEM_DEFINITIONS[item.itemId];
    if (!itemDef) return { success: false, cost: 0 };

    const maxDura = itemDef.maxDurability || 100;
    const currentDura = item.currentDurability ?? maxDura;
    if (currentDura >= maxDura) return { success: false, cost: 0 };

    // 修理费用 = (最大耐久 - 当前耐久) × 等级 × 品质倍率
    const rarityMults: Record<string, number> = { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5, mythic: 8 };
    const cost = Math.floor((maxDura - currentDura) * (itemDef.levelReq || 1) * (rarityMults[itemDef.rarity] || 1));

    if (player.gold < cost) {
      get().sendChat('金币不足，无法修理！');
      return { success: false, cost };
    }

    // 扣费修理
    set(s => ({
      player: { ...s.player, gold: s.player.gold - cost },
      currency: { ...s.currency, gold: s.currency.gold - cost },
      equipment: { ...s.equipment, [slot]: { ...item, currentDurability: maxDura } },
    }));

    get().sendChat(`修理${itemDef.name}完成，花费${cost}金币`, 'system');
    return { success: true, cost };
  },

  repairAllEquipment: () => {
    const { equipment } = get();
    let totalCost = 0;
    let allSuccess = true;

    for (const slot of Object.keys(equipment) as (keyof Equipment)[]) {
      const result = get().repairEquipment(slot);
      if (result.cost > 0) {
        totalCost += result.cost;
        if (!result.success) allSuccess = false;
      }
    }

    return { success: allSuccess, totalCost };
  },

  // === 世界Boss定时刷新系统 ===

  checkWorldBossSpawn: () => {
    const now = Date.now();
    const state = get();
    const schedule = { ...state.worldBossSchedule };
    let changed = false;
    const newMonsters = [...state.monsters];

    for (const rule of WORLD_BOSS_SPAWN_RULES) {
      const entry = schedule[rule.bossId];
      if (!entry) continue;

      // Check if it's time to spawn
      if (!entry.isAlive && now >= entry.nextSpawn) {
        // Check if boss of this type already exists on the map
        const existingBoss = state.monsters.find(m => m.defId === rule.bossId && !m.isDead);
        if (!existingBoss) {
          // Spawn the boss at the designated location
          const bossDef = BOSS_DEFINITIONS[rule.bossId];
          if (bossDef) {
            const spawnPos = findWalkablePosition(rule.mapId, rule.spawnX, rule.spawnY, 10);
            const bossInstance = createMonsterInstance(bossDef, spawnPos, true);
            newMonsters.push(bossInstance);

            schedule[rule.bossId] = {
              ...entry,
              isAlive: true,
              lastSpawnTime: now,
            };

            // Announce boss spawn
            get().sendSystemAnnouncement(
              `⚔️ 世界Boss【${bossDef.name}】已在${MAP_DEFINITIONS[rule.mapId]?.name || rule.mapId}刷新！`,
              'boss_announce'
            );

            changed = true;
          }
        } else {
          // Boss already alive, just update the schedule
          schedule[rule.bossId] = {
            ...entry,
            isAlive: true,
          };
          changed = true;
        }
      }
    }

    // Check boss belonging timeouts (30s without damage resets belonging)
    const belonging = { ...state.bossBelonging };
    let belongingChanged = false;
    for (const [bossId, info] of Object.entries(belonging)) {
      if (now - info.lastHitTime > 30000 && info.dropProtectionUntil === 0) {
        // 30s timeout, reset belonging
        delete belonging[bossId];
        belongingChanged = true;

        // Notify in chat
        const monster = state.monsters.find(m => m.id === bossId);
        if (monster) {
          get().sendChat(`📋 ${monster.name}的归属权已重置（30秒未攻击）`, 'system');
        }
      }
    }

    if (changed || belongingChanged) {
      set({
        worldBossSchedule: schedule,
        monsters: changed ? newMonsters : state.monsters,
        bossBelonging: belongingChanged ? belonging : state.bossBelonging,
      });
    }
  },

  claimBossBelonging: (bossInstanceId) => {
    const state = get();
    const player = state.player;

    set({
      bossBelonging: {
        ...state.bossBelonging,
        [bossInstanceId]: {
          ownerId: player.name,
          ownerName: player.name,
          lastHitTime: Date.now(),
          dropProtectionUntil: 0,
        },
      },
    });
  },

  resetBossBelonging: (bossInstanceId) => {
    const state = get();
    const newBelonging = { ...state.bossBelonging };
    delete newBelonging[bossInstanceId];
    set({ bossBelonging: newBelonging });
  },

  // === 活动点数系统 ===

  completeDailyQuest: (questId) => {
    const state = get();
    if (state.dailyCompleted[questId]) return; // Already completed

    set({
      dailyCompleted: { ...state.dailyCompleted, [questId]: true },
      completedDailies: [...state.completedDailies, questId],
      activityPoints: state.activityPoints + ACTIVITY_POINTS_PER_DAILY,
    });

    get().sendChat(`✅ 日常任务完成！活跃度+${ACTIVITY_POINTS_PER_DAILY}`, 'system');
  },

  completeWeeklyQuest: (questId) => {
    const state = get();
    if (state.weeklyCompleted[questId]) return; // Already completed

    set({
      weeklyCompleted: { ...state.weeklyCompleted, [questId]: true },
      completedWeeklies: [...state.completedWeeklies, questId],
      activityPoints: state.activityPoints + ACTIVITY_POINTS_PER_WEEKLY,
    });

    get().sendChat(`✅ 周常任务完成！活跃度+${ACTIVITY_POINTS_PER_WEEKLY}`, 'system');
  },

  claimActivityPointReward: (tier) => {
    const state = get();
    if (state.activityPointRewardsClaimed[tier]) return;
    if (state.activityPoints < tier) {
      get().sendChat(`活跃度不足${tier}，无法领取奖励！`, 'system');
      return;
    }

    const tierReward = ACTIVITY_POINT_TIER_REWARDS.find(t => t.threshold === tier);
    if (!tierReward) return;

    // Grant rewards
    const dropItems: InventoryItem[] = [];
    for (const reward of tierReward.rewards) {
      if (reward.type === 'gold') {
        get().addCurrencyAction('gold', reward.amount || 0);
      } else if (reward.type === 'boundGold') {
        get().addCurrencyAction('boundGold', reward.amount || 0);
      } else if (reward.type === 'ingot') {
        get().addCurrencyAction('ingot', reward.amount || 0);
      } else if (reward.type === 'xp') {
        // Add experience directly
        const newExp = state.player.exp + (reward.amount || 0);
        set(s => ({ player: { ...s.player, exp: newExp } }));
      } else if (reward.type === 'item' && reward.itemId) {
        dropItems.push({ id: genId('item'), itemId: reward.itemId, count: reward.itemQuantity || 1 });
      }
    }

    set({
      activityPointRewardsClaimed: { ...state.activityPointRewardsClaimed, [tier]: true },
      inventory: [...state.inventory, ...dropItems],
    });

    get().sendChat(`🎁 领取活跃度${tier}奖励！`, 'system');
    get().playSound('pickup');
  },

  checkActivityReset: () => {
    const now = Date.now();
    const state = get();

    // Check daily reset (at 0:00)
    const lastDaily = new Date(state.lastDailyReset);
    const nowDate = new Date(now);

    if (nowDate.getFullYear() !== lastDaily.getFullYear() ||
        nowDate.getMonth() !== lastDaily.getMonth() ||
        nowDate.getDate() !== lastDaily.getDate()) {
      // It's a new day - reset daily activities
      if (nowDate.getHours() >= 0 && state.lastDailyReset > 0) {
        set({
          dailyCompleted: {},
          completedDailies: [],
          activityPoints: 0,
          activityPointRewardsClaimed: {},
          lastDailyReset: now,
        });
        get().sendSystemAnnouncement('🌅 新的一天开始！日常任务已重置', 'system');
      } else {
        set({ lastDailyReset: now });
      }
    }

    // Check weekly reset (Monday 0:00)
    const lastWeekly = new Date(state.lastWeeklyReset);
    const weekDiff = Math.floor((now - state.lastWeeklyReset) / (7 * 24 * 60 * 60 * 1000));
    if (weekDiff >= 1 && nowDate.getDay() === 1 && nowDate.getHours() >= 0) {
      if (state.lastWeeklyReset > 0) {
        set({
          weeklyCompleted: {},
          completedWeeklies: [],
          lastWeeklyReset: now,
        });
        get().sendSystemAnnouncement('📅 新的一周开始！周常任务已重置', 'system');
      } else {
        set({ lastWeeklyReset: now });
      }
    }
  },

  addActivityPoints: (points) => {
    const state = get();
    set({ activityPoints: Math.min(150, state.activityPoints + points) });
  },

  // === 每日签到系统 ===

  checkDailyLogin: () => {
    const state = get();
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    if (state.lastLoginDate === today) return; // Already logged in today

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const isConsecutive = state.lastLoginDate === yesterday;

    set({
      lastLoginDate: today,
      consecutiveLoginDays: isConsecutive ? state.consecutiveLoginDays + 1 : 1,
      totalLoginDays: state.totalLoginDays + 1,
      loginRewardClaimed: false,
    });

    const days = isConsecutive ? state.consecutiveLoginDays + 1 : 1;
    get().sendChat(`📅 签到成功！连续登录第${days}天，累计登录${state.totalLoginDays + 1}天。输入 /签到 领取奖励！`, 'system');
  },

  claimLoginReward: () => {
    const state = get();
    if (state.loginRewardClaimed) {
      get().sendChat('今日奖励已领取！', 'system');
      return;
    }

    const days = state.consecutiveLoginDays;
    let rewards: { itemId: string; count: number; gold?: number }[] = [];

    // Daily login reward table - gets better with consecutive days
    if (days <= 2) {
      rewards = [
        { itemId: 'hp_potion_small', count: 5 + days * 2, gold: 50 + days * 25 },
      ];
    } else if (days <= 5) {
      rewards = [
        { itemId: 'hp_potion_medium', count: 3 + days, gold: 100 + days * 30 },
      ];
    } else if (days <= 10) {
      rewards = [
        { itemId: 'hp_potion_large', count: 2 + Math.floor(days / 2), gold: 200 + days * 40 },
      ];
    } else if (days <= 20) {
      rewards = [
        { itemId: 'hp_potion_large', count: 5, gold: 500 + days * 50 },
        { itemId: 'blessing_oil', count: 1, gold: 0 },
      ];
    } else {
      rewards = [
        { itemId: 'hp_potion_large', count: 10, gold: 1000 },
        { itemId: 'blessing_oil', count: 2, gold: 0 },
      ];
    }

    // Add items to inventory
    const newItems: InventoryItem[] = [];
    let totalGold = 0;
    for (const reward of rewards) {
      if (reward.gold) totalGold += reward.gold;
      if (reward.itemId) {
        const itemDef = ITEM_DEFINITIONS[reward.itemId];
        if (itemDef) {
          newItems.push({ id: genId('item'), itemId: reward.itemId, count: reward.count });
        }
      }
    }

    set(state => ({
      loginRewardClaimed: true,
      inventory: [...state.inventory, ...newItems],
      player: { ...state.player, gold: state.player.gold + totalGold },
    }));

    const rewardText = rewards.map(r => {
      const def = ITEM_DEFINITIONS[r.itemId];
      return def ? `${def.icon}${def.name}x${r.count}` : '';
    }).filter(Boolean).join(' ');

    get().sendChat(`🎁 签到奖励已领取！${rewardText}${totalGold > 0 ? ` 🪙${totalGold}` : ''} (连续${days}天)`, 'system');
    get().playSound('achievement');
  },

  // === 定时活动系统 ===

  checkTimedEvents: () => {
    const now = new Date();
    const state = get();
    const currentDay = now.getDay(); // 0=Sunday
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (const activity of TIMED_ACTIVITIES) {
      const schedule = activity.schedule;
      const isActive = state.activeTimedEvents.includes(activity.id);

      // Check if event should be active
      let shouldActive = false;

      if (schedule.type === 'daily') {
        const startMinutes = schedule.startHour * 60 + schedule.startMinute;
        const endMinutes = schedule.endHour * 60 + schedule.endMinute;
        const nowMinutes = currentHour * 60 + currentMinute;
        shouldActive = nowMinutes >= startMinutes && nowMinutes < endMinutes;
      } else if (schedule.type === 'weekly') {
        const days = schedule.dayOfWeek || [];
        if (days.includes(currentDay)) {
          const startMinutes = schedule.startHour * 60 + schedule.startMinute;
          const endMinutes = schedule.endHour * 60 + schedule.endMinute;
          const nowMinutes = currentHour * 60 + currentMinute;
          shouldActive = nowMinutes >= startMinutes && nowMinutes < endMinutes;
        }
      } else if (schedule.type === 'monthly') {
        const days = schedule.dayOfWeek || [];
        const weeks = schedule.weekOfMonth || [];
        if (days.includes(currentDay)) {
          // Check if it's the right week of month
          const dayOfMonth = now.getDate();
          const weekNum = Math.ceil(dayOfMonth / 7);
          if (weeks.includes(weekNum)) {
            const startMinutes = schedule.startHour * 60 + schedule.startMinute;
            const endMinutes = schedule.endHour * 60 + schedule.endMinute;
            const nowMinutes = currentHour * 60 + currentMinute;
            shouldActive = nowMinutes >= startMinutes && nowMinutes < endMinutes;
          }
        }
      }

      // Skip guild/siege events per design
      if (activity.id === 'timed_guildEscort' || activity.id === 'timed_siegeWarfare') {
        continue;
      }

      if (shouldActive && !isActive) {
        get().startTimedEvent(activity.id);
      } else if (!shouldActive && isActive) {
        get().endTimedEvent(activity.id);
      }
    }
  },

  startTimedEvent: (eventId) => {
    const state = get();
    if (state.activeTimedEvents.includes(eventId)) return;

    const activity = TIMED_ACTIVITIES.find(a => a.id === eventId);
    if (!activity) return;

    const newActiveEvents = [...state.activeTimedEvents, eventId];

    // Apply event effects
    if (eventId === 'timed_doubleXP') {
      set({ doubleExpActive: true });
    }

    // Spawn public bosses
    if (eventId === 'timed_publicBoss_14' || eventId === 'timed_publicBoss_18') {
      // Spawn extra bosses in outdoor maps - these are "全民Boss" with no belonging
      const outdoorMaps = ['yinxing_valley', 'bqi_forest', 'snake_valley', 'mengzhong_waste'];
      const newMonsters = [...state.monsters];
      for (const mapId of outdoorMaps) {
        const mapDef = MAP_DEFINITIONS[mapId];
        if (mapDef && mapDef.bossIds && mapDef.bossIds.length > 0) {
          // Spawn one boss per map
          const bossId = mapDef.bossIds[Math.floor(Math.random() * mapDef.bossIds.length)];
          const bossDef = BOSS_DEFINITIONS[bossId];
          if (bossDef) {
            const spawnCenter = { x: Math.floor(mapDef.width / 2), y: Math.floor(mapDef.height / 2) };
            const pos = findWalkablePosition(mapId, spawnCenter.x, spawnCenter.y, 20);
            const bossInstance = createMonsterInstance(bossDef, pos, true);
            // Mark as public boss (no belonging) by adding a flag
            newMonsters.push({ ...bossInstance, name: `[全民]${bossDef.name}` });
          }
        }
      }
      set({ monsters: newMonsters });
    }

    // Monster siege: spawn invasion monsters near town
    if (eventId === 'timed_monsterSiege') {
      const newMonsters = [...state.monsters];
      const mapId = state.player.mapId;
      const mapDef = MAP_DEFINITIONS[mapId];
      if (mapDef) {
        // Spawn invasion monsters near player's current location
        for (let i = 0; i < 15; i++) {
          const possibleMonsters = ['dark_knight', 'shadow_mage', 'flame_skeleton', 'zuma_guard'];
          const monId = possibleMonsters[Math.floor(Math.random() * possibleMonsters.length)];
          const def = MONSTER_DEFINITIONS[monId];
          if (def) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 10;
            const sx = Math.floor(state.player.x + Math.cos(angle) * dist);
            const sy = Math.floor(state.player.y + Math.sin(angle) * dist);
            const pos = findWalkablePosition(mapId, sx, sy, 5);
            const instance = createMonsterInstance(def, pos, false);
            newMonsters.push({ ...instance, aggressive: true, name: `[攻城]${def.name}` });
          }
        }
      }
      set({ monsters: newMonsters });
    }

    // Underground treasure: spawn treasure chests in dungeon maps
    if (eventId === 'timed_undergroundTreasure') {
      const newMonsters = [...state.monsters];
      const dungeonMaps = ['dungeon_shiwang', 'dungeon_woma', 'dungeon_zuma', 'dungeon_chiyue'];
      for (const mapId of dungeonMaps) {
        const mapDef = MAP_DEFINITIONS[mapId];
        if (mapDef) {
          // Spawn treasure chest monsters (using scarecrow as base)
          const chestDef = MONSTER_DEFINITIONS['scarecrow'];
          if (chestDef) {
            for (let i = 0; i < 3; i++) {
              const spawnCenter = { x: Math.floor(mapDef.width / 2), y: Math.floor(mapDef.height / 2) };
              const pos = findWalkablePosition(mapId, spawnCenter.x + Math.floor(Math.random() * 20 - 10), spawnCenter.y + Math.floor(Math.random() * 20 - 10), 10);
              const chest = createMonsterInstance(
                { ...chestDef, name: '宝藏箱', symbol: '📦', color: '#ffd700', exp: 500, gold: 2000 },
                pos,
                false
              );
              newMonsters.push(chest);
            }
          }
        }
      }
      set({ monsters: newMonsters });
    }

    set({
      activeTimedEvents: newActiveEvents,
      timedEventAnnouncements: [
        ...state.timedEventAnnouncements,
        { id: genId('announce'), message: activity.name + '已开始！', time: Date.now(), type: 'event_start' as const },
      ],
    });

    get().sendSystemAnnouncement(`🎉 ${activity.name}已开始！${activity.description}`, 'event_announce');
  },

  endTimedEvent: (eventId) => {
    const state = get();
    if (!state.activeTimedEvents.includes(eventId)) return;

    const activity = TIMED_ACTIVITIES.find(a => a.id === eventId);

    const newActiveEvents = state.activeTimedEvents.filter(id => id !== eventId);

    // Remove event effects
    if (eventId === 'timed_doubleXP') {
      set({ doubleExpActive: false });
    }

    set({
      activeTimedEvents: newActiveEvents,
      timedEventAnnouncements: [
        ...state.timedEventAnnouncements,
        { id: genId('announce'), message: (activity?.name || eventId) + '已结束', time: Date.now(), type: 'event_end' as const },
      ],
    });

    if (activity) {
      get().sendSystemAnnouncement(`🏁 ${activity.name}已结束！`, 'event_announce');
    }
  },

  // === 系统公告 ===

  sendSystemAnnouncement: (message, type) => {
    const colorMap: Record<string, string> = {
      boss_announce: '#ff4444',
      event_announce: '#ffcc00',
      system: '#00ccff',
    };
    const channelMap: Record<string, 'system' | 'combat'> = {
      boss_announce: 'combat',
      event_announce: 'system',
      system: 'system',
    };
    set(state => ({
      chatMessages: [...state.chatMessages, {
        id: genId('chat'),
        sender: '【公告】',
        message,
        type: type === 'system' ? 'system' as const : type,
        timestamp: Date.now(),
        color: colorMap[type] || '#ffffff',
        channel: channelMap[type] || 'system',
      }].slice(-100),
    }));
  },

  // === 活动面板 ===

  toggleActivityPanel: () => {
    set(state => ({ showActivityPanel: !state.showActivityPanel }));
  },

  toggleBossTimer: () => {
    set(state => ({ showBossTimer: !state.showBossTimer }));
  },

  // === GM调试模式 ===

  toggleGMMode: () => {
    set(state => {
      const newGM = !state.gmMode;
      return {
        gmMode: newGM,
        showGMPanel: newGM ? state.showGMPanel : false,
      };
    });
    const newGM = !get().gmMode;
    get().sendChat(newGM ? '⚡ GM调试模式已开启' : 'GM调试模式已关闭', 'system');
  },

  toggleGMPanel: () => {
    set(state => ({ showGMPanel: !state.showGMPanel }));
  },

  gmSetMaxLevel: () => {
    const maxLevel = MAX_LEVEL || 60;
    const xpNeeded = getExperienceForLevel(maxLevel);
    set(state => ({
      player: {
        ...state.player,
        level: maxLevel,
        exp: 0,
        expToLevel: getExpToLevel(maxLevel),
        // Scale stats for max level
        hp: Math.floor(state.player.maxHp * (1 + (maxLevel - state.player.level) * 0.1)),
        maxHp: Math.floor(state.player.maxHp * (1 + (maxLevel - state.player.level) * 0.1)),
        mp: Math.floor(state.player.maxMp * (1 + (maxLevel - state.player.level) * 0.1)),
        maxMp: Math.floor(state.player.maxMp * (1 + (maxLevel - state.player.level) * 0.1)),
        attack: Math.floor(state.player.attack * (1 + (maxLevel - state.player.level) * 0.05)),
        defense: Math.floor(state.player.defense * (1 + (maxLevel - state.player.level) * 0.05)),
      },
    }));
    get().sendChat(`⚡ GM: 已将等级设为${maxLevel}级`, 'system');
  },

  gmAddGold: (amount: number) => {
    set(state => ({
      player: { ...state.player, gold: state.player.gold + amount },
    }));
    get().sendChat(`⚡ GM: 增加${amount}金币`, 'system');
  },

  gmAddItem: (itemId: string, count: number) => {
    const itemDef = ITEM_DEFINITIONS[itemId];
    if (!itemDef) {
      get().sendChat(`⚡ GM: 物品${itemId}不存在`, 'system');
      return;
    }
    set(state => {
      const existing = state.inventory.find(i => i.itemId === itemId);
      let newInventory;
      if (existing) {
        newInventory = state.inventory.map(i =>
          i.itemId === itemId ? { ...i, count: i.count + count } : i
        );
      } else {
        newInventory = [...state.inventory, { id: genId('item'), itemId, count }];
      }
      return { inventory: newInventory };
    });
    get().sendChat(`⚡ GM: 添加${itemDef.name} x${count}`, 'system');
  },

  gmAddExp: (amount: number) => {
    const state = get();
    let newExp = state.player.exp + amount;
    let newLevel = state.player.level;
    let newExpToLevel = state.player.expToLevel;

    // Level up loop
    while (newExp >= newExpToLevel && newLevel < (MAX_LEVEL || 60)) {
      newExp -= newExpToLevel;
      newLevel++;
      newExpToLevel = getExpToLevel(newLevel);
    }

    set(s => ({
      player: {
        ...s.player,
        exp: newExp,
        level: newLevel,
        expToLevel: newExpToLevel,
      },
    }));
    get().sendChat(`⚡ GM: 增加${amount}经验`, 'system');
  },

  gmFullHpMp: () => {
    set(state => ({
      player: {
        ...state.player,
        hp: state.player.maxHp,
        mp: state.player.maxMp,
      },
    }));
    get().sendChat('⚡ GM: 生命和魔力已恢复满');
  },

  gmToggleInvincible: () => {
    // Store invincible state in a simple flag - checked in takeDamage
    set(state => ({
      player: {
        ...state.player,
        luck: state.player.luck >= 999 ? 0 : 999, // Use luck as invincible indicator
      },
    }));
    const isNowInvincible = get().player.luck >= 999;
    get().sendChat(isNowInvincible ? '⚡ GM: 无敌模式已开启' : '⚡ GM: 无敌模式已关闭', 'system');
  },

  gmKillAllMonsters: () => {
    set(state => ({
      monsters: state.monsters.map(m => ({ ...m, hp: 0, isDead: true })),
    }));
    get().sendChat('⚡ GM: 已清除所有怪物', 'system');
  },

  // === 退出到角色选择 ===

  exitToCharacterSelect: () => {
    const state = get();
    // Save current character first
    if (state.activeCharacterId && state.player.name) {
      state.saveCurrentGame();
    }

    // Reset to character select
    set({
      phase: 'character_select',
      showInventory: false,
      showCharacter: false,
      showSkills: false,
      showShop: false,
      showCraft: false,
      showDungeonPanel: false,
      showQuestLog: false,
      showDebugPanel: false,
      showActivityPanel: false,
      showBossTimer: false,
      showCraftPanel: false,
      showEnchantPanel: false,
      showReforgePanel: false,
      showAwakenPanel: false,
      showAoyiPanel: false,
      showRepairPanel: false,
      showGMPanel: false,
      showGuidePanel: false,
      showTeleportPanel: false,
      interactingNPC: null,
      selectedTarget: null,
      activeSummon: null,
      autoAttackEnabled: false,
      autoAttackTarget: null,
    });
  },

  // === 攻略面板 ===

  toggleGuidePanel: () => {
    set(state => ({ showGuidePanel: !state.showGuidePanel }));
  },

  // === 地图传送面板 ===

  toggleTeleportPanel: () => {
    set(state => ({ showTeleportPanel: !state.showTeleportPanel }));
  },

  teleportToMapDirect: (mapId: string) => {
    const mapDef = MAP_DEFINITIONS[mapId];
    if (!mapDef) return;
    const spawnPoint = getMapSpawnPoint(mapId);
    get().changeMap(mapId, spawnPoint.x, spawnPoint.y);
    get().sendChat(`🚀 已传送到${mapDef.name}`, 'system');
    set({ showTeleportPanel: false });
  },
}));
