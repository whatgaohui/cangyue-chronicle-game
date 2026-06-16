// 苍月纪元 - 经济系统 (Economy System)
// Four Currency System, Trading Rules, Inflation Control, Gold Sinks

// ============================================================
// 1. Currency Types & Definitions (四币体系)
// ============================================================

/**
 * The four currency types in 苍月纪元.
 *
 * gold        (金币):     Freely tradeable, earned from monsters/quests/events
 * boundGold   (绑定金币): Fully bound, from check-in/dailies/achievements
 * ingot       (元宝):     Premium currency, tradable with 72h time lock on premium items
 * gloryPoints (荣耀积分): Fully bound, from siege/guild wars/tournaments
 */
export type CurrencyType = 'gold' | 'boundGold' | 'ingot' | 'gloryPoints';

/**
 * Definition for a single currency type.
 */
export interface CurrencyDefinition {
  /** Unique currency identifier */
  id: CurrencyType;
  /** Chinese display name */
  name: string;
  /** Description of how this currency is obtained and used */
  description: string;
  /** Whether this currency can be traded between players */
  tradeable: boolean;
  /** Display color (CSS color string) */
  color: string;
  /** Icon identifier for UI rendering */
  icon: string;
  /** Sources where this currency can be obtained */
  sources: string[];
  /** Uses for this currency */
  uses: string[];
}

/**
 * Complete currency definitions for the four-currency system.
 *
 * | Currency     | Get From                           | Use For                                    | Trade Property              |
 * |--------------|------------------------------------|---------------------------------------------|-----------------------------|
 * | 金币         | Monsters, sell, quests, events     | Enhancement, repair, potions, trade, siege  | Freely tradeable            |
 * | 绑定金币     | Check-in, dailies, achievements    | Basic consumption, bound shop exchange       | Fully bound, no trade       |
 * | 元宝         | Recharge, trade house sales        | Premium items, cross-server trade, fees      | Tradable, 72h time lock     |
 * | 荣耀积分     | Siege, guild wars, tournaments     | Rare materials, exclusive titles             | Fully bound, no trade       |
 */
export const CURRENCY_DEFINITIONS: Record<CurrencyType, CurrencyDefinition> = {
  gold: {
    id: 'gold',
    name: '金币',
    description: '通用货币，可通过击杀怪物、出售物品、完成任务和参与活动获得。可用于强化、修理、购买药水、交易和攻城报名。',
    tradeable: true,
    color: '#FFD700',
    icon: 'coin_gold',
    sources: ['怪物掉落', '出售物品', '任务奖励', '活动奖励'],
    uses: ['装备强化', '装备修理', '购买药水', '玩家交易', '攻城报名费'],
  },
  boundGold: {
    id: 'boundGold',
    name: '绑定金币',
    description: '绑定货币，通过签到、日常任务和成就获得。仅能用于基础消费和绑定商店兑换，不可交易。',
    tradeable: false,
    color: '#C0C0C0',
    icon: 'coin_bound',
    sources: ['每日签到', '日常任务', '成就奖励'],
    uses: ['基础消费', '绑定商店兑换'],
  },
  ingot: {
    id: 'ingot',
    name: '元宝',
    description: '高级货币，通过充值和交易行出售获得。可用于购买高级物品、跨服交易和支付手续费。可交易，交易后神话装备有72小时时间锁。',
    tradeable: true,
    color: '#FF6B35',
    icon: 'coin_ingot',
    sources: ['充值', '交易行出售'],
    uses: ['购买高级物品', '跨服交易', '交易手续费'],
  },
  gloryPoints: {
    id: 'gloryPoints',
    name: '荣耀积分',
    description: '荣耀货币，通过攻城战、行会战和锦标赛获得。可用于兑换稀有材料和专属称号，不可交易。',
    tradeable: false,
    color: '#9B59B6',
    icon: 'coin_glory',
    sources: ['攻城战', '行会战', '锦标赛'],
    uses: ['稀有材料兑换', '专属称号'],
  },
};

/** All currency type keys in display order */
export const CURRENCY_TYPES: CurrencyType[] = ['gold', 'boundGold', 'ingot', 'gloryPoints'];

/**
 * Player currency wallet.
 */
export interface CurrencyWallet {
  gold: number;
  boundGold: number;
  ingot: number;
  gloryPoints: number;
}

/**
 * Create a default empty wallet.
 */
export function createDefaultWallet(): CurrencyWallet {
  return {
    gold: 0,
    boundGold: 0,
    ingot: 0,
    gloryPoints: 0,
  };
}

/**
 * Get currency amount from wallet by type.
 */
export function getCurrencyAmount(wallet: CurrencyWallet, type: CurrencyType): number {
  return wallet[type];
}

/**
 * Check if wallet has enough of a given currency.
 */
export function hasEnoughCurrency(wallet: CurrencyWallet, type: CurrencyType, amount: number): boolean {
  return wallet[type] >= amount;
}

/**
 * Deduct currency from wallet. Returns new wallet or null if insufficient.
 */
export function deductCurrency(wallet: CurrencyWallet, type: CurrencyType, amount: number): CurrencyWallet | null {
  if (wallet[type] < amount) return null;
  return { ...wallet, [type]: wallet[type] - amount };
}

/**
 * Add currency to wallet.
 */
export function addCurrency(wallet: CurrencyWallet, type: CurrencyType, amount: number): CurrencyWallet {
  return { ...wallet, [type]: wallet[type] + amount };
}

// ============================================================
// 2. Trading Rules (交易规则)
// ============================================================

/**
 * Trading modes available in the game.
 */
export type TradeMode = 'faceToFace' | 'stall' | 'tradeHouse';

/** Trade mode display names */
export const TRADE_MODE_NAMES: Record<TradeMode, string> = {
  faceToFace: '面对面交易',
  stall: '摆摊',
  tradeHouse: '交易行',
};

/** Trade mode descriptions */
export const TRADE_MODE_DESCRIPTIONS: Record<TradeMode, string> = {
  faceToFace: '与其他玩家直接面对面交易，无需手续费',
  stall: '在安全区摆摊出售物品，需缴纳5%手续费',
  tradeHouse: '跨服交易行寄售，需缴纳8%手续费',
};

/**
 * Trading configuration constants.
 */
export interface TradeConfig {
  /** Stall tax rate (0.05 = 5%) */
  stallTaxRate: number;
  /** Trade house tax rate (0.08 = 8%) */
  tradeHouseTaxRate: number;
  /** Premium item time lock duration in hours (72h) */
  premiumItemLockHours: number;
  /** Whether red-name players are forbidden from all trading */
  redNameTradeForbidden: boolean;
  /** System recycle (回收) floor price ratio for items */
  systemRecycleRatio: number;
}

/** Global trading configuration */
export const TRADE_CONFIG: TradeConfig = {
  stallTaxRate: 0.05,
  tradeHouseTaxRate: 0.08,
  premiumItemLockHours: 72,
  redNameTradeForbidden: true,
  systemRecycleRatio: 0.2, // System buys back at 20% of base price
};

/**
 * Calculate tax for a trade.
 *
 * @param mode      Trading mode
 * @param amount    Transaction amount
 * @returns Tax amount to be deducted
 */
export function calculateTradeTax(mode: TradeMode, amount: number): number {
  switch (mode) {
    case 'faceToFace':
      return 0; // No tax for face-to-face
    case 'stall':
      return Math.floor(amount * TRADE_CONFIG.stallTaxRate);
    case 'tradeHouse':
      return Math.floor(amount * TRADE_CONFIG.tradeHouseTaxRate);
    default:
      return 0;
  }
}

/**
 * Calculate net proceeds after tax.
 *
 * @param mode      Trading mode
 * @param amount    Transaction amount
 * @returns Amount after tax deduction
 */
export function calculateNetProceeds(mode: TradeMode, amount: number): number {
  return amount - calculateTradeTax(mode, amount);
}

// ============================================================
// 3. Premium Item Time Lock (极品装备时间锁)
// ============================================================

/**
 * Premium item time lock record.
 * After a mythic item is traded, it is locked for 72 hours
 * and cannot be re-traded until the lock expires.
 */
export interface PremiumItemLock {
  /** Item instance ID */
  itemInstanceId: string;
  /** Item definition ID */
  itemId: string;
  /** When the lock was applied */
  lockStart: number; // timestamp
  /** When the lock expires */
  lockExpiry: number; // timestamp
  /** Lock duration in hours */
  lockDurationHours: number;
}

/**
 * Item rarities that trigger the premium time lock when traded.
 */
export const PREMIUM_LOCK_RARITIES: string[] = ['mythic'];

/**
 * Create a premium item lock record.
 */
export function createPremiumItemLock(itemInstanceId: string, itemId: string): PremiumItemLock {
  const now = Date.now();
  const lockMs = TRADE_CONFIG.premiumItemLockHours * 60 * 60 * 1000;
  return {
    itemInstanceId,
    itemId,
    lockStart: now,
    lockExpiry: now + lockMs,
    lockDurationHours: TRADE_CONFIG.premiumItemLockHours,
  };
}

/**
 * Check if a premium item lock has expired.
 */
export function isPremiumLockExpired(lock: PremiumItemLock): boolean {
  return Date.now() >= lock.lockExpiry;
}

// ============================================================
// 4. Gold Sink System (金币消耗体系)
// ============================================================

/**
 * Definition of a gold sink — a mechanism that removes gold from circulation.
 */
export interface GoldSinkDefinition {
  /** Unique identifier */
  id: string;
  /** Chinese name */
  name: string;
  /** Description of the gold sink */
  description: string;
  /** Category for grouping */
  category: 'enhancement' | 'repair' | 'consumption' | 'pk' | 'neigong' | 'reincarnation' | 'siege' | 'other';
  /** Base cost (may be multiplied by level/quality) */
  baseCost: number;
  /** Whether cost scales with player level */
  scalesWithLevel: boolean;
  /** Level scaling factor (cost = baseCost + level * scalingFactor) */
  levelScalingFactor: number;
  /** Whether this sink is affected by red name penalties */
  affectedByRedName: boolean;
}

/**
 * All gold sinks in the game.
 * These are the primary mechanisms for removing gold from circulation.
 */
export const GOLD_SINKS: GoldSinkDefinition[] = [
  {
    id: 'sink_enhancement',
    name: '装备强化',
    description: '强化装备消耗金币，等级越高消耗越大',
    category: 'enhancement',
    baseCost: 1000,
    scalesWithLevel: true,
    levelScalingFactor: 500,
    affectedByRedName: false,
  },
  {
    id: 'sink_repair',
    name: '装备修理',
    description: '修理损坏的装备消耗金币，红名玩家费用翻倍',
    category: 'repair',
    baseCost: 500,
    scalesWithLevel: true,
    levelScalingFactor: 200,
    affectedByRedName: true,
  },
  {
    id: 'sink_potions',
    name: '药水购买',
    description: '购买各类药水和消耗品',
    category: 'consumption',
    baseCost: 100,
    scalesWithLevel: true,
    levelScalingFactor: 50,
    affectedByRedName: true,
  },
  {
    id: 'sink_pkCleanse',
    name: 'PK洗白',
    description: '使用清心丹等道具减少PK值需要金币',
    category: 'pk',
    baseCost: 50000,
    scalesWithLevel: false,
    levelScalingFactor: 0,
    affectedByRedName: false,
  },
  {
    id: 'sink_neigong',
    name: '内功修炼',
    description: '内功升级消耗大量金币',
    category: 'neigong',
    baseCost: 10000,
    scalesWithLevel: true,
    levelScalingFactor: 2000,
    affectedByRedName: false,
  },
  {
    id: 'sink_reincarnation',
    name: '转生渡劫',
    description: '转生需要消耗巨额金币',
    category: 'reincarnation',
    baseCost: 1_000_000,
    scalesWithLevel: false,
    levelScalingFactor: 0,
    affectedByRedName: false,
  },
  {
    id: 'sink_siegeTax',
    name: '攻城税费',
    description: '攻城战报名费和相关消耗',
    category: 'siege',
    baseCost: 500_000,
    scalesWithLevel: false,
    levelScalingFactor: 0,
    affectedByRedName: false,
  },
];

/**
 * Calculate the gold cost for a specific sink at a given player level.
 *
 * @param sinkId     Gold sink ID
 * @param playerLevel Player's current level
 * @param isRedName  Whether the player is red-named
 * @returns Gold cost for this sink
 */
export function calculateGoldSinkCost(
  sinkId: string,
  playerLevel: number,
  isRedName: boolean,
): number {
  const sink = GOLD_SINKS.find((s) => s.id === sinkId);
  if (!sink) return 0;

  let cost = sink.baseCost;
  if (sink.scalesWithLevel) {
    cost += playerLevel * sink.levelScalingFactor;
  }

  // Red name penalty doubles costs for affected sinks
  if (isRedName && sink.affectedByRedName) {
    cost *= 2;
  }

  return Math.floor(cost);
}

// ============================================================
// 5. Inflation Control (通胀控制)
// ============================================================

/**
 * Inflation control configuration.
 * When server gold exceeds a threshold, automatic measures are triggered.
 */
export interface InflationControlConfig {
  /** Gold threshold that triggers inflation control */
  serverGoldThreshold: number;
  /** Enhancement cost multiplier when inflation control is active */
  enhancementCostMultiplier: number;
  /** Monster gold drop reduction factor (0.5 = 50% reduction) */
  monsterDropReductionFactor: number;
  /** Whether inflation control is currently active */
  isActive: boolean;
}

/** Default inflation control configuration */
export const INFLATION_CONTROL: InflationControlConfig = {
  serverGoldThreshold: 10_000_000_000, // 100亿
  enhancementCostMultiplier: 1.5, // 50% increase in enhancement costs
  monsterDropReductionFactor: 0.7, // 30% reduction in monster gold drops
  isActive: false,
};

/**
 * Check if inflation control should be activated based on total server gold.
 *
 * @param totalServerGold  Total gold in circulation across all players
 * @returns Whether inflation control should be active
 */
export function shouldActivateInflationControl(totalServerGold: number): boolean {
  return totalServerGold >= INFLATION_CONTROL.serverGoldThreshold;
}

/**
 * Get the inflation-adjusted enhancement cost.
 *
 * @param baseCost    Base enhancement cost
 * @param isActive    Whether inflation control is active
 * @returns Adjusted cost
 */
export function getInflationAdjustedEnhancementCost(baseCost: number, isActive: boolean): number {
  if (!isActive) return baseCost;
  return Math.floor(baseCost * INFLATION_CONTROL.enhancementCostMultiplier);
}

/**
 * Get the inflation-adjusted monster gold drop.
 *
 * @param baseDrop    Base gold drop amount
 * @param isActive    Whether inflation control is active
 * @returns Adjusted drop amount
 */
export function getInflationAdjustedMonsterDrop(baseDrop: number, isActive: boolean): number {
  if (!isActive) return baseDrop;
  return Math.floor(baseDrop * INFLATION_CONTROL.monsterDropReductionFactor);
}

// ============================================================
// 6. Price Configurations (价格配置)
// ============================================================

/**
 * Common item prices for reference in game systems.
 */
export const COMMON_PRICES = {
  /** Small healing potion */
  smallHealPotion: 50,
  /** Large healing potion */
  largeHealPotion: 200,
  /** Small mana potion */
  smallManaPotion: 80,
  /** Large mana potion */
  largeManaPotion: 300,
  /** Neigong pill (内功丹) */
  neigongPill: 5000,
  /** PK cleanse small (清心丹) */
  pkCleanseSmall: 10000,
  /** PK cleanse medium (化怨符) */
  pkCleanseMedium: 30000,
  /** PK cleanse large (赎罪令) */
  pkCleanseLarge: 80000,
  /** Guild creation horn (号角) */
  omaHorn: 500000,
  /** Resurrection scroll */
  resurrectionScroll: 1000,
  /** Town portal scroll */
  townPortalScroll: 200,
} as const;

/**
 * Equipment repair cost as a percentage of the item's sell price,
 * per point of durability lost.
 */
export const REPAIR_COST_PER_DURABILITY = 0.01; // 1% of sell price per durability point
