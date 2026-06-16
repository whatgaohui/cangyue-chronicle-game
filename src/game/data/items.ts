// 苍月纪元 - 物品数据

export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'quest' | 'special';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type EquipSlot = 'weapon' | 'head' | 'body' | 'feet' | 'necklace' | 'ring1' | 'ring2' | 'bracelet1' | 'bracelet2' | 'belt' | 'medal' | 'jade';

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  stackable: boolean;
  maxStack: number;
  sellPrice: number;
  levelReq?: number;
  classReq?: string[];
  equipSlot?: EquipSlot;
  stats?: {
    attack?: number;
    defense?: number;
    hp?: number;
    mp?: number;
    accuracy?: number;
    agility?: number;
    luck?: number;
    critRate?: number;
    critDamage?: number;
  };
  icon?: string;
  color?: string;
  // 装备耐久度（仅装备类物品）
  maxDurability?: number; // 默认100
}

export const ITEM_DEFINITIONS: Record<string, ItemDef> = {
  // === 武器 ===
  wooden_sword: {
    id: 'wooden_sword', name: '木剑', type: 'weapon', rarity: 'common',
    description: '新手木剑，聊胜于无', stackable: false, maxStack: 1, sellPrice: 10,
    levelReq: 1, equipSlot: 'weapon',
    stats: { attack: 3 }, icon: '🗡️', color: '#a0826e',
  },
  iron_sword: {
    id: 'iron_sword', name: '铁剑', type: 'weapon', rarity: 'uncommon',
    description: '标准的铁剑，适合初学者', stackable: false, maxStack: 1, sellPrice: 80,
    levelReq: 5, equipSlot: 'weapon',
    stats: { attack: 8, accuracy: 2 }, icon: '🗡️', color: '#b0b0b0',
  },
  bronze_axe: {
    id: 'bronze_axe', name: '铜斧', type: 'weapon', rarity: 'common',
    description: '沉重的铜斧，攻击力尚可', stackable: false, maxStack: 1, sellPrice: 60,
    levelReq: 3, classReq: ['warrior'], equipSlot: 'weapon',
    stats: { attack: 10, agility: -1 }, icon: '🪓', color: '#cd7f32',
  },
  training_staff: {
    id: 'training_staff', name: '练习法杖', type: 'weapon', rarity: 'common',
    description: '初学者的法杖', stackable: false, maxStack: 1, sellPrice: 40,
    levelReq: 1, classReq: ['mage', 'taoist'], equipSlot: 'weapon',
    stats: { attack: 2, mp: 10 }, icon: '🪄', color: '#8a6abe',
  },
  refined_iron_sword: {
    id: 'refined_iron_sword', name: '精炼铁剑', type: 'weapon', rarity: 'rare',
    description: '经过精炼的铁剑，更加锋利', stackable: false, maxStack: 1, sellPrice: 300,
    levelReq: 15, equipSlot: 'weapon',
    stats: { attack: 18, accuracy: 5, critRate: 2 }, icon: '🗡️', color: '#d0d0e0',
  },
  shadow_blade: {
    id: 'shadow_blade', name: '暗影之刃', type: 'weapon', rarity: 'epic',
    description: '暗影中锻造的利刃', stackable: false, maxStack: 1, sellPrice: 1500,
    levelReq: 30, classReq: ['warrior'], equipSlot: 'weapon',
    stats: { attack: 45, accuracy: 10, critRate: 5, critDamage: 10 }, icon: '🗡️', color: '#4a0a6a',
  },
  fire_staff: {
    id: 'fire_staff', name: '烈焰法杖', type: 'weapon', rarity: 'epic',
    description: '蕴含烈焰之力的法杖', stackable: false, maxStack: 1, sellPrice: 1500,
    levelReq: 30, classReq: ['mage'], equipSlot: 'weapon',
    stats: { attack: 35, mp: 50, critRate: 3 }, icon: '🪄', color: '#ff4500',
  },
  spirit_sword: {
    id: 'spirit_sword', name: '灵韵之剑', type: 'weapon', rarity: 'epic',
    description: '注入灵力的神圣之剑', stackable: false, maxStack: 1, sellPrice: 1500,
    levelReq: 30, classReq: ['taoist'], equipSlot: 'weapon',
    stats: { attack: 30, mp: 40, hp: 50, accuracy: 8 }, icon: '🗡️', color: '#7aff7a',
  },

  // === 防具 ===
  cloth_armor: {
    id: 'cloth_armor', name: '布衣', type: 'armor', rarity: 'common',
    description: '普通的布衣，几乎没有防护', stackable: false, maxStack: 1, sellPrice: 15,
    levelReq: 1, equipSlot: 'body',
    stats: { defense: 2, hp: 5 }, icon: '👕', color: '#f5f5dc',
  },
  leather_armor: {
    id: 'leather_armor', name: '皮甲', type: 'armor', rarity: 'uncommon',
    description: '轻便的皮甲，适合新手', stackable: false, maxStack: 1, sellPrice: 80,
    levelReq: 5, equipSlot: 'body',
    stats: { defense: 6, hp: 15, agility: 1 }, icon: '🦺', color: '#8b4513',
  },
  wooden_shield: {
    id: 'wooden_shield', name: '木盾', type: 'armor', rarity: 'common',
    description: '简单的木盾', stackable: false, maxStack: 1, sellPrice: 25,
    levelReq: 1, equipSlot: 'bracelet1',
    stats: { defense: 4, hp: 10 }, icon: '🛡️', color: '#8b7355',
  },
  iron_armor: {
    id: 'iron_armor', name: '铁甲', type: 'armor', rarity: 'rare',
    description: '坚固的铁甲，防护力不错', stackable: false, maxStack: 1, sellPrice: 500,
    levelReq: 20, equipSlot: 'body',
    stats: { defense: 20, hp: 50 }, icon: '🦺', color: '#808080',
  },

  // === 靴子 ===
  cloth_boots: {
    id: 'cloth_boots', name: '布鞋', type: 'armor', rarity: 'common',
    description: '普通的布鞋，几乎没有防护', stackable: false, maxStack: 1, sellPrice: 15,
    levelReq: 1, equipSlot: 'feet',
    stats: { defense: 1, agility: 1 }, icon: '👞', color: '#f5f5dc',
  },
  leather_boots: {
    id: 'leather_boots', name: '皮靴', type: 'armor', rarity: 'uncommon',
    description: '轻便的皮靴，移动速度更快', stackable: false, maxStack: 1, sellPrice: 80,
    levelReq: 5, equipSlot: 'feet',
    stats: { defense: 3, agility: 3, hp: 10 }, icon: '👢', color: '#8b4513',
  },
  iron_boots: {
    id: 'iron_boots', name: '铁靴', type: 'armor', rarity: 'rare',
    description: '坚固的铁靴，防护力不错', stackable: false, maxStack: 1, sellPrice: 350,
    levelReq: 20, equipSlot: 'feet',
    stats: { defense: 8, hp: 25, agility: 1 }, icon: '👢', color: '#808080',
  },

  // === 腰带 ===
  cloth_belt: {
    id: 'cloth_belt', name: '布带', type: 'armor', rarity: 'common',
    description: '普通的布带，略微提升负重', stackable: false, maxStack: 1, sellPrice: 15,
    levelReq: 1, equipSlot: 'belt',
    stats: { hp: 5, defense: 1 }, icon: '🎽', color: '#f5f5dc',
  },
  leather_belt: {
    id: 'leather_belt', name: '皮带', type: 'armor', rarity: 'uncommon',
    description: '结实的皮带，提供基础防护', stackable: false, maxStack: 1, sellPrice: 80,
    levelReq: 5, equipSlot: 'belt',
    stats: { hp: 15, defense: 3 }, icon: '🎽', color: '#8b4513',
  },
  iron_belt: {
    id: 'iron_belt', name: '铁腰带', type: 'armor', rarity: 'rare',
    description: '镶嵌铁片的腰带，防护出色', stackable: false, maxStack: 1, sellPrice: 350,
    levelReq: 20, equipSlot: 'belt',
    stats: { hp: 40, defense: 6, accuracy: 2 }, icon: '🎽', color: '#808080',
  },

  // === 手镯 ===
  wooden_bracelet: {
    id: 'wooden_bracelet', name: '木手镯', type: 'accessory', rarity: 'common',
    description: '简单的木手镯', stackable: false, maxStack: 1, sellPrice: 20,
    levelReq: 1, equipSlot: 'bracelet1',
    stats: { defense: 1, hp: 5 }, icon: '📿', color: '#a0826e',
  },
  jade_bracelet: {
    id: 'jade_bracelet', name: '玉手镯', type: 'accessory', rarity: 'uncommon',
    description: '玉石手镯，提升灵巧', stackable: false, maxStack: 1, sellPrice: 150,
    levelReq: 8, equipSlot: 'bracelet1',
    stats: { defense: 3, hp: 15, agility: 2, mp: 10 }, icon: '📿', color: '#7aff7a',
  },
  silver_bracelet: {
    id: 'silver_bracelet', name: '银手镯', type: 'accessory', rarity: 'rare',
    description: '白银手镯，蕴含灵气', stackable: false, maxStack: 1, sellPrice: 400,
    levelReq: 20, equipSlot: 'bracelet1',
    stats: { defense: 5, hp: 30, mp: 30, accuracy: 3 }, icon: '📿', color: '#c0c0c0',
  },

  // === 项链（低级） ===
  bone_necklace: {
    id: 'bone_necklace', name: '骨项链', type: 'accessory', rarity: 'uncommon',
    description: '兽骨制成的项链', stackable: false, maxStack: 1, sellPrice: 100,
    levelReq: 5, equipSlot: 'necklace',
    stats: { attack: 3, defense: 2 }, icon: '📿', color: '#e8dcc8',
  },
  copper_necklace: {
    id: 'copper_necklace', name: '铜项链', type: 'accessory', rarity: 'uncommon',
    description: '黄铜项链，提升法力', stackable: false, maxStack: 1, sellPrice: 120,
    levelReq: 8, equipSlot: 'necklace',
    stats: { mp: 25, defense: 2 }, icon: '📿', color: '#cd7f32',
  },

  // === 戒指（低级） ===
  copper_ring: {
    id: 'copper_ring', name: '铜戒指', type: 'accessory', rarity: 'uncommon',
    description: '黄铜戒指，提升命中', stackable: false, maxStack: 1, sellPrice: 100,
    levelReq: 5, equipSlot: 'ring1',
    stats: { attack: 2, accuracy: 2 }, icon: '💍', color: '#cd7f32',
  },
  iron_ring: {
    id: 'iron_ring', name: '铁戒指', type: 'accessory', rarity: 'rare',
    description: '黑铁戒指，提升攻击', stackable: false, maxStack: 1, sellPrice: 300,
    levelReq: 18, equipSlot: 'ring1',
    stats: { attack: 6, accuracy: 3, critRate: 1 }, icon: '💍', color: '#404040',
  },

  // === 新手套装 - 银杏套装（战士向） ===
  yinxing_helmet: {
    id: 'yinxing_helmet', name: '银杏头盔', type: 'armor', rarity: 'uncommon',
    description: '银杏村铁匠打造的新手头盔', stackable: false, maxStack: 1, sellPrice: 100,
    levelReq: 5, equipSlot: 'head',
    stats: { defense: 5, hp: 15 }, icon: '⛑️', color: '#d4a017',
  },
  yinxing_armor: {
    id: 'yinxing_armor', name: '银杏战甲', type: 'armor', rarity: 'uncommon',
    description: '银杏村铁匠打造的新手战甲', stackable: false, maxStack: 1, sellPrice: 150,
    levelReq: 5, equipSlot: 'body',
    stats: { defense: 8, hp: 30 }, icon: '🦺', color: '#d4a017',
  },
  yinxing_boots: {
    id: 'yinxing_boots', name: '银杏战靴', type: 'armor', rarity: 'uncommon',
    description: '银杏村铁匠打造的新手战靴', stackable: false, maxStack: 1, sellPrice: 80,
    levelReq: 5, equipSlot: 'feet',
    stats: { defense: 3, agility: 2, hp: 10 }, icon: '👢', color: '#d4a017',
  },
  yinxing_belt: {
    id: 'yinxing_belt', name: '银杏腰带', type: 'armor', rarity: 'uncommon',
    description: '银杏村铁匠打造的新手腰带', stackable: false, maxStack: 1, sellPrice: 80,
    levelReq: 5, equipSlot: 'belt',
    stats: { hp: 20, defense: 3 }, icon: '🎽', color: '#d4a017',
  },
  yinxing_bracelet: {
    id: 'yinxing_bracelet', name: '银杏手镯', type: 'accessory', rarity: 'uncommon',
    description: '银杏村出产的灵气手镯', stackable: false, maxStack: 1, sellPrice: 100,
    levelReq: 5, equipSlot: 'bracelet1',
    stats: { defense: 2, hp: 15, mp: 10 }, icon: '📿', color: '#d4a017',
  },

  // === 比奇套装 - 中级（10-25级） ===
  biqi_helmet: {
    id: 'biqi_helmet', name: '比奇头盔', type: 'armor', rarity: 'rare',
    description: '比奇森林巡逻队装备的头盔', stackable: false, maxStack: 1, sellPrice: 500,
    levelReq: 15, equipSlot: 'head',
    stats: { defense: 10, hp: 35, accuracy: 2 }, icon: '⛑️', color: '#2e8b57',
  },
  biqi_armor: {
    id: 'biqi_armor', name: '比奇战甲', type: 'armor', rarity: 'rare',
    description: '比奇森林巡逻队装备的战甲', stackable: false, maxStack: 1, sellPrice: 700,
    levelReq: 15, equipSlot: 'body',
    stats: { defense: 15, hp: 60, attack: 3 }, icon: '🦺', color: '#2e8b57',
  },
  biqi_boots: {
    id: 'biqi_boots', name: '比奇战靴', type: 'armor', rarity: 'rare',
    description: '比奇森林巡逻队装备的战靴', stackable: false, maxStack: 1, sellPrice: 400,
    levelReq: 15, equipSlot: 'feet',
    stats: { defense: 6, agility: 4, hp: 25 }, icon: '👢', color: '#2e8b57',
  },
  biqi_belt: {
    id: 'biqi_belt', name: '比奇腰带', type: 'armor', rarity: 'rare',
    description: '比奇森林巡逻队装备的腰带', stackable: false, maxStack: 1, sellPrice: 400,
    levelReq: 15, equipSlot: 'belt',
    stats: { hp: 50, defense: 5, accuracy: 3 }, icon: '🎽', color: '#2e8b57',
  },
  biqi_bracelet: {
    id: 'biqi_bracelet', name: '比奇手镯', type: 'accessory', rarity: 'rare',
    description: '比奇森林巡逻队员的精制手镯', stackable: false, maxStack: 1, sellPrice: 500,
    levelReq: 15, equipSlot: 'bracelet1',
    stats: { defense: 4, hp: 30, mp: 25, agility: 2 }, icon: '📿', color: '#2e8b57',
  },

  // === 消耗品 ===
  hp_potion_small: {
    id: 'hp_potion_small', name: '小红药', type: 'consumable', rarity: 'common',
    description: '恢复50点生命值', stackable: true, maxStack: 99, sellPrice: 5,
    icon: '🧪', color: '#ff4444',
  },
  mp_potion_small: {
    id: 'mp_potion_small', name: '小蓝药', type: 'consumable', rarity: 'common',
    description: '恢复30点魔法值', stackable: true, maxStack: 99, sellPrice: 8,
    icon: '🧪', color: '#4444ff',
  },
  hp_potion_medium: {
    id: 'hp_potion_medium', name: '中红药', type: 'consumable', rarity: 'uncommon',
    description: '恢复150点生命值', stackable: true, maxStack: 99, sellPrice: 25,
    icon: '🧪', color: '#ff2222',
  },
  mp_potion_medium: {
    id: 'mp_potion_medium', name: '中蓝药', type: 'consumable', rarity: 'uncommon',
    description: '恢复100点魔法值', stackable: true, maxStack: 99, sellPrice: 30,
    icon: '🧪', color: '#2222ff',
  },
  hp_potion_large: {
    id: 'hp_potion_large', name: '大红药', type: 'consumable', rarity: 'rare',
    description: '恢复500点生命值', stackable: true, maxStack: 99, sellPrice: 80,
    icon: '🧪', color: '#cc0000',
  },
  mp_potion_large: {
    id: 'mp_potion_large', name: '大蓝药', type: 'consumable', rarity: 'rare',
    description: '恢复300点魔法值', stackable: true, maxStack: 99, sellPrice: 100,
    icon: '🧪', color: '#0000cc',
  },
  antidote: {
    id: 'antidote', name: '解毒药', type: 'consumable', rarity: 'common',
    description: '解除中毒状态', stackable: true, maxStack: 99, sellPrice: 15,
    icon: '💊', color: '#00cc00',
  },
  blessing_oil: {
    id: 'blessing_oil', name: '祝福油', type: 'consumable', rarity: 'rare',
    description: '提升装备幸运值', stackable: true, maxStack: 10, sellPrice: 200,
    icon: '🫧', color: '#ffcc00',
  },
  teleport_scroll: {
    id: 'teleport_scroll', name: '回城卷轴', type: 'consumable', rarity: 'uncommon',
    description: '使用后传送回出生点', stackable: true, maxStack: 10, sellPrice: 50,
    icon: '📜', color: '#c0c0c0',
  },

  // === 材料 ===
  iron_ore: {
    id: 'iron_ore', name: '铁矿石', type: 'material', rarity: 'uncommon',
    description: '锻造用的铁矿石', stackable: true, maxStack: 99, sellPrice: 20,
    icon: '⛏️', color: '#808080',
  },
  gold_coins: {
    id: 'gold_coins', name: '金币(材料)', type: 'material', rarity: 'common',
    description: '通用货币', stackable: true, maxStack: 9999, sellPrice: 1,
    icon: '🪙', color: '#ffd700',
  },

  // === 副本套装装备 ===
  // 尸王殿套装 - 白骨套装
  bone_helmet: {
    id: 'bone_helmet', name: '白骨头盔', type: 'armor', rarity: 'rare',
    description: '尸王殿的战利品', stackable: false, maxStack: 1, sellPrice: 800,
    levelReq: 25, equipSlot: 'head',
    stats: { defense: 12, hp: 30 }, icon: '⛑️', color: '#e8dcc8',
  },
  bone_armor: {
    id: 'bone_armor', name: '白骨战甲', type: 'armor', rarity: 'epic',
    description: '用白骨编织的战甲', stackable: false, maxStack: 1, sellPrice: 2000,
    levelReq: 28, equipSlot: 'body',
    stats: { defense: 25, hp: 80, attack: 5 }, icon: '🦺', color: '#e8dcc8',
  },

  // 沃玛套装
  woma_sword: {
    id: 'woma_sword', name: '沃玛之刃', type: 'weapon', rarity: 'legendary',
    description: '沃玛教主的力量凝聚于此', stackable: false, maxStack: 1, sellPrice: 5000,
    levelReq: 35, classReq: ['warrior'], equipSlot: 'weapon',
    stats: { attack: 55, accuracy: 12, critRate: 8 }, icon: '🗡️', color: '#ff6600',
  },
  woma_robe: {
    id: 'woma_robe', name: '沃玛法袍', type: 'armor', rarity: 'legendary',
    description: '沃玛教主的法袍', stackable: false, maxStack: 1, sellPrice: 5000,
    levelReq: 35, classReq: ['mage'], equipSlot: 'body',
    stats: { defense: 15, mp: 100, attack: 40 }, icon: '👘', color: '#ff6600',
  },
  woma_helmet: {
    id: 'woma_helmet', name: '沃玛头盔', type: 'armor', rarity: 'legendary',
    description: '沃玛寺庙的护头战盔', stackable: false, maxStack: 1, sellPrice: 4500,
    levelReq: 35, equipSlot: 'head',
    stats: { defense: 18, hp: 60, accuracy: 5 }, icon: '⛑️', color: '#ff6600',
  },
  woma_boots: {
    id: 'woma_boots', name: '沃玛战靴', type: 'armor', rarity: 'legendary',
    description: '沃玛寺庙的轻便战靴', stackable: false, maxStack: 1, sellPrice: 4000,
    levelReq: 35, equipSlot: 'feet',
    stats: { defense: 12, agility: 5, hp: 30 }, icon: '👢', color: '#ff6600',
  },
  woma_necklace: {
    id: 'woma_necklace', name: '沃玛项链', type: 'accessory', rarity: 'legendary',
    description: '蕴含沃玛之力的项链', stackable: false, maxStack: 1, sellPrice: 5000,
    levelReq: 35, equipSlot: 'necklace',
    stats: { attack: 15, luck: 2, critRate: 3 }, icon: '📿', color: '#ff6600',
  },
  woma_ring: {
    id: 'woma_ring', name: '沃玛戒指', type: 'accessory', rarity: 'legendary',
    description: '沃玛教主的信物戒指', stackable: false, maxStack: 1, sellPrice: 4500,
    levelReq: 35, equipSlot: 'ring1',
    stats: { attack: 10, accuracy: 5, critDamage: 8 }, icon: '💍', color: '#ff6600',
  },

  // 祖玛套装
  zuma_blade: {
    id: 'zuma_blade', name: '祖玛裁决', type: 'weapon', rarity: 'legendary',
    description: '祖玛神殿的至高武器', stackable: false, maxStack: 1, sellPrice: 10000,
    levelReq: 45, classReq: ['warrior'], equipSlot: 'weapon',
    stats: { attack: 80, accuracy: 15, critRate: 10, critDamage: 15 }, icon: '🗡️', color: '#ffa500',
  },
  zuma_helmet: {
    id: 'zuma_helmet', name: '祖玛头盔', type: 'armor', rarity: 'legendary',
    description: '祖玛神殿的守护头盔', stackable: false, maxStack: 1, sellPrice: 9000,
    levelReq: 45, equipSlot: 'head',
    stats: { defense: 25, hp: 80, accuracy: 8 }, icon: '⛑️', color: '#ffa500',
  },
  zuma_armor: {
    id: 'zuma_armor', name: '祖玛战甲', type: 'armor', rarity: 'legendary',
    description: '祖玛神殿的精工战甲', stackable: false, maxStack: 1, sellPrice: 10000,
    levelReq: 45, equipSlot: 'body',
    stats: { defense: 35, hp: 120, attack: 10 }, icon: '🦺', color: '#ffa500',
  },
  zuma_boots: {
    id: 'zuma_boots', name: '祖玛战靴', type: 'armor', rarity: 'legendary',
    description: '祖玛神殿的灵巧战靴', stackable: false, maxStack: 1, sellPrice: 8000,
    levelReq: 45, equipSlot: 'feet',
    stats: { defense: 18, agility: 8, hp: 50 }, icon: '👢', color: '#ffa500',
  },
  zuma_necklace: {
    id: 'zuma_necklace', name: '祖玛项链', type: 'accessory', rarity: 'legendary',
    description: '蕴含祖玛之力的项链', stackable: false, maxStack: 1, sellPrice: 9000,
    levelReq: 45, equipSlot: 'necklace',
    stats: { attack: 20, luck: 3, critRate: 5 }, icon: '📿', color: '#ffa500',
  },
  zuma_ring: {
    id: 'zuma_ring', name: '祖玛戒指', type: 'accessory', rarity: 'legendary',
    description: '祖玛教主的赐福戒指', stackable: false, maxStack: 1, sellPrice: 8500,
    levelReq: 45, equipSlot: 'ring1',
    stats: { attack: 15, critRate: 5, critDamage: 12 }, icon: '💍', color: '#ffa500',
  },

  // 赤月套装
  red_moon_staff: {
    id: 'red_moon_staff', name: '赤月法杖', type: 'weapon', rarity: 'mythic',
    description: '赤月恶魔的精华凝聚而成', stackable: false, maxStack: 1, sellPrice: 50000,
    levelReq: 50, classReq: ['mage'], equipSlot: 'weapon',
    stats: { attack: 70, mp: 200, critRate: 12, critDamage: 20 }, icon: '🪄', color: '#ff0033',
  },
  red_moon_armor: {
    id: 'red_moon_armor', name: '赤月战甲', type: 'armor', rarity: 'mythic',
    description: '赤月恶魔的壳甲', stackable: false, maxStack: 1, sellPrice: 50000,
    levelReq: 50, equipSlot: 'body',
    stats: { defense: 50, hp: 200, attack: 20, critRate: 5 }, icon: '🦺', color: '#ff0033',
  },
  red_moon_helmet: {
    id: 'red_moon_helmet', name: '赤月头盔', type: 'armor', rarity: 'mythic',
    description: '赤月恶魔的角冠', stackable: false, maxStack: 1, sellPrice: 45000,
    levelReq: 50, equipSlot: 'head',
    stats: { defense: 35, hp: 120, critRate: 5 }, icon: '⛑️', color: '#ff0033',
  },
  red_moon_boots: {
    id: 'red_moon_boots', name: '赤月战靴', type: 'armor', rarity: 'mythic',
    description: '赤月恶魔的足甲', stackable: false, maxStack: 1, sellPrice: 40000,
    levelReq: 50, equipSlot: 'feet',
    stats: { defense: 25, agility: 10, hp: 80, critRate: 3 }, icon: '👢', color: '#ff0033',
  },
  red_moon_necklace: {
    id: 'red_moon_necklace', name: '赤月项链', type: 'accessory', rarity: 'mythic',
    description: '赤月精华凝结的项链', stackable: false, maxStack: 1, sellPrice: 48000,
    levelReq: 50, equipSlot: 'necklace',
    stats: { attack: 25, luck: 4, critRate: 8, critDamage: 10 }, icon: '📿', color: '#ff0033',
  },
  red_moon_ring: {
    id: 'red_moon_ring', name: '赤月戒指', type: 'accessory', rarity: 'mythic',
    description: '赤月恶魔的核心结晶', stackable: false, maxStack: 1, sellPrice: 45000,
    levelReq: 50, equipSlot: 'ring1',
    stats: { attack: 20, critRate: 8, critDamage: 15 }, icon: '💍', color: '#ff0033',
  },

  // === 特殊材料 ===
  reforge_stone: {
    id: 'reforge_stone', name: '重铸石', type: 'material', rarity: 'rare',
    description: '装备重铸的必要材料，可重置随机词条', stackable: true, maxStack: 99, sellPrice: 500,
    icon: '💎', color: '#aa44ff',
  },
  awakening_crystal: {
    id: 'awakening_crystal', name: '觉醒晶石', type: 'material', rarity: 'legendary',
    description: '神话装备觉醒的必要材料', stackable: true, maxStack: 30, sellPrice: 2000,
    icon: '🔮', color: '#ff0033',
  },
  aoyi_scroll: {
    id: 'aoyi_scroll', name: '奥义残卷', type: 'material', rarity: 'epic',
    description: '技能奥义精修的必要材料', stackable: true, maxStack: 50, sellPrice: 1000,
    icon: '📜', color: '#ff8800',
  },
};

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#c0c0c0',
  uncommon: '#00cc00',
  rare: '#4488ff',
  epic: '#aa44ff',
  legendary: '#ff8800',
  mythic: '#ff0033',
};

export const RARITY_NAMES: Record<ItemRarity, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '精良',
  epic: '稀有',
  legendary: '传说',
  mythic: '神话',
};

export function getItemDef(id: string): ItemDef | undefined {
  return ITEM_DEFINITIONS[id];
}

// === 套装系统 ===
export interface SetBonusDef {
  setId: string;
  setName: string;
  pieces: string[]; // item IDs in the set
  bonuses: {
    pieces: number; // number of pieces needed
    stats: Record<string, number>;
  }[];
}

export const SET_BONUSES: Record<string, SetBonusDef> = {
  // === 新手套装 - 银杏套装（5级） ===
  yinxing_set: {
    setId: 'yinxing_set',
    setName: '银杏套装',
    pieces: ['yinxing_helmet', 'yinxing_armor', 'yinxing_boots', 'yinxing_belt', 'yinxing_bracelet'],
    bonuses: [
      {
        pieces: 2,
        stats: { defense: 5, hp: 30 },
      },
      {
        pieces: 3,
        stats: { defense: 10, hp: 60, attack: 3 },
      },
      {
        pieces: 5,
        stats: { defense: 18, hp: 120, attack: 8, agility: 3, accuracy: 3 },
      },
    ],
  },
  // === 中级套装 - 比奇套装（15级） ===
  biqi_set: {
    setId: 'biqi_set',
    setName: '比奇套装',
    pieces: ['biqi_helmet', 'biqi_armor', 'biqi_boots', 'biqi_belt', 'biqi_bracelet'],
    bonuses: [
      {
        pieces: 2,
        stats: { defense: 10, hp: 80 },
      },
      {
        pieces: 3,
        stats: { defense: 20, hp: 150, attack: 8, accuracy: 5 },
      },
      {
        pieces: 5,
        stats: { defense: 35, hp: 300, attack: 18, agility: 6, accuracy: 8, critRate: 3 },
      },
    ],
  },
  woma_set: {
    setId: 'woma_set',
    setName: '沃玛套装',
    pieces: ['woma_sword', 'woma_robe', 'woma_helmet', 'woma_boots', 'woma_necklace', 'woma_ring'],
    bonuses: [
      {
        pieces: 2,
        stats: { attack: 10, defense: 5 },
      },
      {
        pieces: 4,
        stats: { attack: 20, defense: 10, hp: 100, critRate: 3 },
      },
      {
        pieces: 6,
        stats: { attack: 35, defense: 20, hp: 200, critRate: 5, critDamage: 10, luck: 2 },
      },
    ],
  },
  zuma_set: {
    setId: 'zuma_set',
    setName: '祖玛套装',
    pieces: ['zuma_blade', 'zuma_helmet', 'zuma_armor', 'zuma_boots', 'zuma_necklace', 'zuma_ring'],
    bonuses: [
      {
        pieces: 2,
        stats: { attack: 15, defense: 8 },
      },
      {
        pieces: 4,
        stats: { attack: 30, defense: 15, hp: 150, critRate: 5, accuracy: 5 },
      },
      {
        pieces: 6,
        stats: { attack: 50, defense: 25, hp: 300, critRate: 8, critDamage: 15, luck: 3 },
      },
    ],
  },
  red_moon_set: {
    setId: 'red_moon_set',
    setName: '赤月套装',
    pieces: ['red_moon_staff', 'red_moon_armor', 'red_moon_helmet', 'red_moon_boots', 'red_moon_necklace', 'red_moon_ring'],
    bonuses: [
      {
        pieces: 2,
        stats: { attack: 20, defense: 10 },
      },
      {
        pieces: 4,
        stats: { attack: 40, defense: 20, hp: 200, critRate: 5, critDamage: 5 },
      },
      {
        pieces: 6,
        stats: { attack: 65, defense: 35, hp: 400, critRate: 10, critDamage: 20, luck: 4, mp: 100 },
      },
    ],
  },
};

/**
 * 计算玩家当前激活的套装加成
 * @param equippedItemIds 玩家已装备的物品ID列表
 * @returns 激活的套装加成统计
 */
export function calculateActiveSetBonuses(equippedItemIds: string[]): Record<string, number> {
  const totalBonuses: Record<string, number> = {};

  for (const setDef of Object.values(SET_BONUSES)) {
    const equippedPieces = setDef.pieces.filter(id => equippedItemIds.includes(id)).length;

    for (const bonus of setDef.bonuses) {
      if (equippedPieces >= bonus.pieces) {
        for (const [stat, value] of Object.entries(bonus.stats)) {
          totalBonuses[stat] = (totalBonuses[stat] || 0) + value;
        }
      }
    }
  }

  return totalBonuses;
}
