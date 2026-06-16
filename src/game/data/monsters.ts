// 苍月纪元 - 怪物数据

export interface MonsterDrop {
  itemId: string;
  rate: number; // 0-1 probability
  minCount: number;
  maxCount: number;
}

export interface BossSkill {
  id: string;
  name: string;
  damageMultiplier: number;
  cooldown: number;
  effect?: 'stun' | 'summon' | 'buff' | 'aoe' | 'knockback';
  description: string;
}

export interface MonsterDef {
  id: string;
  name: string;
  level: number;
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  speed: number;
  exp: number;
  gold: number;
  color: string;
  symbol: string;
  size: number;
  aggressive: boolean;
  attackRange: number;
  skills?: string[];
  drops?: MonsterDrop[];
  bossSkills?: BossSkill[];
}

// 野外普通怪物
export const MONSTER_DEFINITIONS: Record<string, MonsterDef> = {
  // 银杏山谷 1-10级
  chicken: {
    id: 'chicken', name: '野鸡', level: 1, hp: 30, mp: 0, attack: 3, defense: 1, speed: 1,
    exp: 5, gold: 1, color: '#f5e6a3', symbol: '🐔', size: 12, aggressive: false, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_small', rate: 0.3, minCount: 1, maxCount: 2 },
    ],
  },
  deer: {
    id: 'deer', name: '小鹿', level: 3, hp: 50, mp: 0, attack: 5, defense: 2, speed: 2,
    exp: 10, gold: 2, color: '#a67c52', symbol: '🦌', size: 14, aggressive: false, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_small', rate: 0.35, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_small', rate: 0.2, minCount: 1, maxCount: 1 },
    ],
  },
  wild_wolf: {
    id: 'wild_wolf', name: '野狼', level: 5, hp: 80, mp: 0, attack: 10, defense: 4, speed: 3,
    exp: 20, gold: 5, color: '#7a7a7a', symbol: '🐺', size: 16, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_small', rate: 0.4, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_small', rate: 0.25, minCount: 1, maxCount: 2 },
      { itemId: 'wooden_sword', rate: 0.05, minCount: 1, maxCount: 1 },
    ],
  },
  skeleton: {
    id: 'skeleton', name: '骷髅兵', level: 8, hp: 120, mp: 0, attack: 15, defense: 6, speed: 2,
    exp: 35, gold: 8, color: '#d4c8a8', symbol: '💀', size: 16, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_small', rate: 0.4, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_small', rate: 0.3, minCount: 1, maxCount: 2 },
      { itemId: 'iron_sword', rate: 0.03, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.15, minCount: 1, maxCount: 2 },
    ],
  },

  // 比奇森林 10-25级
  orc_warrior: {
    id: 'orc_warrior', name: '半兽人战士', level: 12, hp: 200, mp: 20, attack: 25, defense: 10, speed: 2,
    exp: 60, gold: 15, color: '#5a8a3a', symbol: '👹', size: 18, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_small', rate: 0.45, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_small', rate: 0.3, minCount: 1, maxCount: 2 },
      { itemId: 'iron_sword', rate: 0.04, minCount: 1, maxCount: 1 },
      { itemId: 'leather_armor', rate: 0.03, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.2, minCount: 1, maxCount: 3 },
    ],
  },
  orc_archer: {
    id: 'orc_archer', name: '半兽人弓手', level: 14, hp: 150, mp: 30, attack: 22, defense: 6, speed: 3,
    exp: 55, gold: 12, color: '#6a9a4a', symbol: '🏹', size: 16, aggressive: true, attackRange: 5,
    drops: [
      { itemId: 'hp_potion_small', rate: 0.4, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_small', rate: 0.35, minCount: 1, maxCount: 2 },
      { itemId: 'iron_ore', rate: 0.18, minCount: 1, maxCount: 2 },
    ],
  },
  half_beast: {
    id: 'half_beast', name: '半兽统领', level: 18, hp: 350, mp: 40, attack: 35, defense: 15, speed: 2,
    exp: 100, gold: 25, color: '#4a7a2a', symbol: '🦍', size: 20, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.3, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_medium', rate: 0.2, minCount: 1, maxCount: 1 },
      { itemId: 'refined_iron_sword', rate: 0.02, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.25, minCount: 1, maxCount: 4 },
    ],
  },
  snake: {
    id: 'snake', name: '青蛇', level: 15, hp: 180, mp: 30, attack: 28, defense: 8, speed: 4,
    exp: 70, gold: 18, color: '#2a8a4a', symbol: '🐍', size: 14, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_small', rate: 0.45, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_small', rate: 0.3, minCount: 1, maxCount: 2 },
      { itemId: 'antidote', rate: 0.2, minCount: 1, maxCount: 2 },
    ],
  },

  // 毒蛇山谷 25-35级
  venomous_snake: {
    id: 'venomous_snake', name: '毒蛇', level: 26, hp: 400, mp: 50, attack: 45, defense: 18, speed: 4,
    exp: 150, gold: 35, color: '#8a2a4a', symbol: '🐍', size: 14, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.4, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_medium', rate: 0.3, minCount: 1, maxCount: 2 },
      { itemId: 'antidote', rate: 0.25, minCount: 1, maxCount: 3 },
      { itemId: 'iron_ore', rate: 0.2, minCount: 1, maxCount: 3 },
    ],
  },
  scorpion: {
    id: 'scorpion', name: '沙漠蝎', level: 28, hp: 450, mp: 0, attack: 50, defense: 22, speed: 2,
    exp: 170, gold: 40, color: '#aa6a2a', symbol: '🦂', size: 16, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.4, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_medium', rate: 0.25, minCount: 1, maxCount: 2 },
      { itemId: 'iron_armor', rate: 0.02, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.25, minCount: 1, maxCount: 4 },
    ],
  },
  dark_spider: {
    id: 'dark_spider', name: '暗影蜘蛛', level: 30, hp: 500, mp: 60, attack: 55, defense: 20, speed: 3,
    exp: 200, gold: 45, color: '#3a2a4a', symbol: '🕷️', size: 16, aggressive: true, attackRange: 2,
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.45, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_medium', rate: 0.3, minCount: 1, maxCount: 2 },
      { itemId: 'refined_iron_sword', rate: 0.03, minCount: 1, maxCount: 1 },
    ],
  },
  snake_demon: {
    id: 'snake_demon', name: '蛇妖', level: 33, hp: 600, mp: 80, attack: 65, defense: 25, speed: 3,
    exp: 250, gold: 55, color: '#6a2a6a', symbol: '🐍', size: 18, aggressive: true, attackRange: 3,
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.45, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_medium', rate: 0.35, minCount: 1, maxCount: 2 },
      { itemId: 'iron_armor', rate: 0.03, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.2, minCount: 2, maxCount: 4 },
    ],
  },

  // 盟重荒野 35-45级
  zuma_guard: {
    id: 'zuma_guard', name: '祖玛卫士', level: 36, hp: 700, mp: 60, attack: 70, defense: 30, speed: 2,
    exp: 300, gold: 65, color: '#8a4a2a', symbol: '⚔️', size: 18, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_large', rate: 0.15, minCount: 1, maxCount: 1 },
      { itemId: 'hp_potion_medium', rate: 0.4, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_medium', rate: 0.35, minCount: 1, maxCount: 2 },
      { itemId: 'iron_armor', rate: 0.04, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.25, minCount: 2, maxCount: 5 },
    ],
  },
  flame_skeleton: {
    id: 'flame_skeleton', name: '烈焰骷髅', level: 38, hp: 750, mp: 100, attack: 80, defense: 28, speed: 3,
    exp: 350, gold: 70, color: '#ff4a2a', symbol: '💀', size: 18, aggressive: true, attackRange: 3,
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.45, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_medium', rate: 0.35, minCount: 1, maxCount: 2 },
      { itemId: 'shadow_blade', rate: 0.01, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.3, minCount: 2, maxCount: 5 },
    ],
  },
  dark_knight: {
    id: 'dark_knight', name: '暗黑骑士', level: 40, hp: 900, mp: 80, attack: 90, defense: 35, speed: 2,
    exp: 400, gold: 80, color: '#2a2a4a', symbol: '🛡️', size: 20, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_large', rate: 0.2, minCount: 1, maxCount: 1 },
      { itemId: 'hp_potion_medium', rate: 0.4, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_medium', rate: 0.3, minCount: 1, maxCount: 2 },
      { itemId: 'iron_armor', rate: 0.05, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.25, minCount: 2, maxCount: 5 },
    ],
  },
  shadow_mage: {
    id: 'shadow_mage', name: '暗影法师', level: 42, hp: 600, mp: 200, attack: 100, defense: 20, speed: 3,
    exp: 380, gold: 75, color: '#4a2a6a', symbol: '🧙', size: 16, aggressive: true, attackRange: 5,
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.4, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_large', rate: 0.15, minCount: 1, maxCount: 1 },
      { itemId: 'fire_staff', rate: 0.01, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.2, minCount: 2, maxCount: 4 },
    ],
  },

  // 苍月岛海岸 45-60级
  sea_serpent: {
    id: 'sea_serpent', name: '海蛇妖', level: 46, hp: 1000, mp: 120, attack: 110, defense: 40, speed: 4,
    exp: 500, gold: 100, color: '#2a6a8a', symbol: '🐉', size: 18, aggressive: true, attackRange: 2,
    drops: [
      { itemId: 'hp_potion_large', rate: 0.25, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_large', rate: 0.2, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.3, minCount: 3, maxCount: 6 },
      { itemId: 'shadow_blade', rate: 0.015, minCount: 1, maxCount: 1 },
    ],
  },
  demon_soldier: {
    id: 'demon_soldier', name: '恶魔兵', level: 50, hp: 1200, mp: 100, attack: 130, defense: 50, speed: 2,
    exp: 600, gold: 120, color: '#8a2a2a', symbol: '😈', size: 20, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_large', rate: 0.3, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_large', rate: 0.2, minCount: 1, maxCount: 2 },
      { itemId: 'shadow_blade', rate: 0.02, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.3, minCount: 3, maxCount: 6 },
    ],
  },
  blood_bat: {
    id: 'blood_bat', name: '血蝠', level: 48, hp: 800, mp: 150, attack: 120, defense: 30, speed: 5,
    exp: 550, gold: 110, color: '#6a1a2a', symbol: '🦇', size: 14, aggressive: true, attackRange: 2,
    drops: [
      { itemId: 'hp_potion_large', rate: 0.25, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_medium', rate: 0.35, minCount: 1, maxCount: 3 },
      { itemId: 'iron_ore', rate: 0.25, minCount: 2, maxCount: 5 },
    ],
  },
  ghost_warrior: {
    id: 'ghost_warrior', name: '幽灵武士', level: 55, hp: 1500, mp: 200, attack: 150, defense: 55, speed: 3,
    exp: 800, gold: 150, color: '#3a4a6a', symbol: '👻', size: 20, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_large', rate: 0.35, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_large', rate: 0.25, minCount: 1, maxCount: 2 },
      { itemId: 'shadow_blade', rate: 0.025, minCount: 1, maxCount: 1 },
      { itemId: 'spirit_sword', rate: 0.015, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.3, minCount: 3, maxCount: 6 },
    ],
  },

  // 副本怪物 - 尸王殿
  zombie: {
    id: 'zombie', name: '僵尸', level: 22, hp: 350, mp: 0, attack: 35, defense: 15, speed: 1,
    exp: 80, gold: 20, color: '#5a6a3a', symbol: '🧟', size: 16, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.35, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_small', rate: 0.3, minCount: 1, maxCount: 2 },
      { itemId: 'bone_helmet', rate: 0.02, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.2, minCount: 1, maxCount: 3 },
    ],
  },
  rotting_corpse: {
    id: 'rotting_corpse', name: '腐烂尸骸', level: 25, hp: 400, mp: 0, attack: 40, defense: 18, speed: 1,
    exp: 100, gold: 25, color: '#4a5a2a', symbol: '💀', size: 18, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.4, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_medium', rate: 0.25, minCount: 1, maxCount: 1 },
      { itemId: 'bone_helmet', rate: 0.03, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.25, minCount: 1, maxCount: 3 },
    ],
  },
  corpse_king_minion: {
    id: 'corpse_king_minion', name: '尸王护卫', level: 28, hp: 500, mp: 30, attack: 50, defense: 22, speed: 2,
    exp: 130, gold: 30, color: '#6a4a2a', symbol: '⚔️', size: 18, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.4, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_medium', rate: 0.3, minCount: 1, maxCount: 2 },
      { itemId: 'bone_armor', rate: 0.02, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.25, minCount: 2, maxCount: 4 },
    ],
  },

  // 副本怪物 - 沃玛寺庙
  woma_guard: {
    id: 'woma_guard', name: '沃玛卫士', level: 32, hp: 600, mp: 40, attack: 60, defense: 25, speed: 2,
    exp: 180, gold: 40, color: '#7a3a2a', symbol: '👹', size: 18, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.4, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_medium', rate: 0.3, minCount: 1, maxCount: 2 },
      { itemId: 'iron_armor', rate: 0.03, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.25, minCount: 2, maxCount: 4 },
    ],
  },
  woma_warrior: {
    id: 'woma_warrior', name: '沃玛战士', level: 35, hp: 700, mp: 50, attack: 70, defense: 30, speed: 2,
    exp: 220, gold: 50, color: '#8a4a3a', symbol: '⚔️', size: 20, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_large', rate: 0.15, minCount: 1, maxCount: 1 },
      { itemId: 'hp_potion_medium', rate: 0.4, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_medium', rate: 0.35, minCount: 1, maxCount: 2 },
      { itemId: 'woma_sword', rate: 0.005, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.3, minCount: 2, maxCount: 5 },
    ],
  },
  woma_mage: {
    id: 'woma_mage', name: '沃玛法师', level: 38, hp: 500, mp: 150, attack: 85, defense: 18, speed: 3,
    exp: 250, gold: 55, color: '#9a5a4a', symbol: '🧙', size: 16, aggressive: true, attackRange: 4,
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.4, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_large', rate: 0.15, minCount: 1, maxCount: 1 },
      { itemId: 'woma_robe', rate: 0.005, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.25, minCount: 2, maxCount: 4 },
    ],
  },

  // 副本怪物 - 祖玛神殿
  zuma_warrior: {
    id: 'zuma_warrior', name: '祖玛战士', level: 38, hp: 800, mp: 60, attack: 80, defense: 35, speed: 2,
    exp: 280, gold: 60, color: '#aa6a2a', symbol: '⚔️', size: 20, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_large', rate: 0.2, minCount: 1, maxCount: 1 },
      { itemId: 'hp_potion_medium', rate: 0.4, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_medium', rate: 0.3, minCount: 1, maxCount: 2 },
      { itemId: 'zuma_blade', rate: 0.003, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.3, minCount: 3, maxCount: 5 },
    ],
  },
  zuma_archer: {
    id: 'zuma_archer', name: '祖玛弓手', level: 40, hp: 650, mp: 80, attack: 90, defense: 25, speed: 3,
    exp: 300, gold: 65, color: '#ba7a3a', symbol: '🏹', size: 18, aggressive: true, attackRange: 5,
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.4, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_medium', rate: 0.35, minCount: 1, maxCount: 2 },
      { itemId: 'iron_ore', rate: 0.25, minCount: 2, maxCount: 5 },
    ],
  },
  zuma_mage: {
    id: 'zuma_mage', name: '祖玛法师', level: 42, hp: 600, mp: 200, attack: 100, defense: 20, speed: 3,
    exp: 320, gold: 70, color: '#ca8a4a', symbol: '🧙', size: 16, aggressive: true, attackRange: 5,
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.4, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_large', rate: 0.2, minCount: 1, maxCount: 1 },
      { itemId: 'fire_staff', rate: 0.01, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.25, minCount: 3, maxCount: 5 },
    ],
  },

  // 副本怪物 - 赤月洞穴
  red_moon_spider: {
    id: 'red_moon_spider', name: '赤月蜘蛛', level: 46, hp: 900, mp: 80, attack: 105, defense: 38, speed: 4,
    exp: 400, gold: 85, color: '#aa2a2a', symbol: '🕷️', size: 16, aggressive: true, attackRange: 2,
    drops: [
      { itemId: 'hp_potion_large', rate: 0.25, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_large', rate: 0.2, minCount: 1, maxCount: 1 },
      { itemId: 'red_moon_staff', rate: 0.003, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.3, minCount: 3, maxCount: 6 },
    ],
  },
  blood_demon: {
    id: 'blood_demon', name: '血魔', level: 50, hp: 1100, mp: 150, attack: 125, defense: 45, speed: 3,
    exp: 500, gold: 100, color: '#cc1a1a', symbol: '😈', size: 20, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_large', rate: 0.3, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_large', rate: 0.25, minCount: 1, maxCount: 2 },
      { itemId: 'red_moon_armor', rate: 0.003, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.3, minCount: 3, maxCount: 6 },
    ],
  },
  shadow_assassin: {
    id: 'shadow_assassin', name: '暗影刺客', level: 52, hp: 800, mp: 120, attack: 140, defense: 30, speed: 5,
    exp: 480, gold: 95, color: '#2a1a4a', symbol: '🗡️', size: 16, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_large', rate: 0.25, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_large', rate: 0.2, minCount: 1, maxCount: 1 },
      { itemId: 'shadow_blade', rate: 0.015, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.25, minCount: 3, maxCount: 5 },
    ],
  },

  // 副本怪物 - 封魔谷
  sealed_demon: {
    id: 'sealed_demon', name: '封印恶魔', level: 42, hp: 950, mp: 100, attack: 100, defense: 40, speed: 2,
    exp: 380, gold: 80, color: '#4a1a5a', symbol: '👿', size: 20, aggressive: true, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_large', rate: 0.2, minCount: 1, maxCount: 1 },
      { itemId: 'hp_potion_medium', rate: 0.4, minCount: 1, maxCount: 3 },
      { itemId: 'mp_potion_medium', rate: 0.3, minCount: 1, maxCount: 2 },
      { itemId: 'iron_ore', rate: 0.25, minCount: 2, maxCount: 5 },
    ],
  },
  cursed_spirit: {
    id: 'cursed_spirit', name: '诅咒之灵', level: 44, hp: 700, mp: 180, attack: 110, defense: 25, speed: 4,
    exp: 400, gold: 85, color: '#5a2a6a', symbol: '👻', size: 16, aggressive: true, attackRange: 4,
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.4, minCount: 1, maxCount: 2 },
      { itemId: 'mp_potion_large', rate: 0.2, minCount: 1, maxCount: 1 },
      { itemId: 'spirit_sword', rate: 0.01, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.25, minCount: 2, maxCount: 5 },
    ],
  },
  ancient_golem: {
    id: 'ancient_golem', name: '远古石像', level: 46, hp: 1500, mp: 0, attack: 95, defense: 60, speed: 1,
    exp: 420, gold: 90, color: '#6a6a5a', symbol: '🗿', size: 22, aggressive: false, attackRange: 1,
    drops: [
      { itemId: 'hp_potion_large', rate: 0.25, minCount: 1, maxCount: 2 },
      { itemId: 'iron_armor', rate: 0.05, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.35, minCount: 3, maxCount: 6 },
    ],
  },
};

// Boss 定义
export const BOSS_DEFINITIONS: Record<string, MonsterDef> = {
  // 野外Boss
  skeleton_king: {
    id: 'skeleton_king', name: '骷髅王', level: 10, hp: 1000, mp: 100, attack: 30, defense: 12, speed: 2,
    exp: 200, gold: 100, color: '#e8d888', symbol: '👑', size: 24, aggressive: true, attackRange: 2,
    skills: ['bone_strike', 'summon_skeletons'],
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.5, minCount: 2, maxCount: 5 },
      { itemId: 'mp_potion_medium', rate: 0.4, minCount: 1, maxCount: 3 },
      { itemId: 'iron_sword', rate: 0.15, minCount: 1, maxCount: 1 },
      { itemId: 'bone_helmet', rate: 0.1, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.4, minCount: 3, maxCount: 8 },
    ],
    bossSkills: [
      { id: 'bone_strike', name: '骨刺打击', damageMultiplier: 1.5, cooldown: 5000, effect: 'knockback', description: '骨刺贯穿目标并击退' },
      { id: 'summon_skeletons', name: '召唤骷髅', damageMultiplier: 0, cooldown: 15000, effect: 'summon', description: '召唤2-3只骷髅兵' },
    ],
  },
  half_beast_commander: {
    id: 'half_beast_commander', name: '半兽统领', level: 20, hp: 2500, mp: 200, attack: 55, defense: 22, speed: 2,
    exp: 500, gold: 250, color: '#5a9a2a', symbol: '👹', size: 26, aggressive: true, attackRange: 2,
    skills: ['war_cry', 'furious_strike'],
    drops: [
      { itemId: 'hp_potion_medium', rate: 0.6, minCount: 3, maxCount: 6 },
      { itemId: 'mp_potion_medium', rate: 0.5, minCount: 2, maxCount: 4 },
      { itemId: 'leather_armor', rate: 0.15, minCount: 1, maxCount: 1 },
      { itemId: 'refined_iron_sword', rate: 0.08, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.5, minCount: 5, maxCount: 10 },
    ],
    bossSkills: [
      { id: 'war_cry', name: '战吼', damageMultiplier: 0, cooldown: 12000, effect: 'buff', description: '提升自身及周围怪物攻击力' },
      { id: 'furious_strike', name: '狂暴一击', damageMultiplier: 2.0, cooldown: 8000, description: '蓄力重击，造成双倍伤害' },
    ],
  },
  snake_queen: {
    id: 'snake_queen', name: '蛇后', level: 30, hp: 4000, mp: 300, attack: 80, defense: 30, speed: 3,
    exp: 800, gold: 400, color: '#aa4a6a', symbol: '👸', size: 26, aggressive: true, attackRange: 3,
    skills: ['venom_spray', 'summon_snakes'],
    drops: [
      { itemId: 'hp_potion_large', rate: 0.3, minCount: 2, maxCount: 4 },
      { itemId: 'hp_potion_medium', rate: 0.5, minCount: 3, maxCount: 6 },
      { itemId: 'mp_potion_medium', rate: 0.4, minCount: 2, maxCount: 4 },
      { itemId: 'iron_armor', rate: 0.1, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.5, minCount: 5, maxCount: 12 },
    ],
    bossSkills: [
      { id: 'venom_spray', name: '毒液喷射', damageMultiplier: 1.8, cooldown: 6000, effect: 'aoe', description: '范围毒液攻击' },
      { id: 'summon_snakes', name: '召唤蛇群', damageMultiplier: 0, cooldown: 18000, effect: 'summon', description: '召唤毒蛇助战' },
    ],
  },
  zuma_leader: {
    id: 'zuma_leader', name: '祖玛教主', level: 42, hp: 8000, mp: 500, attack: 130, defense: 50, speed: 2,
    exp: 1500, gold: 800, color: '#ca7a2a', symbol: '🔥', size: 28, aggressive: true, attackRange: 3,
    skills: ['fire_nova', 'stone_curse'],
    drops: [
      { itemId: 'hp_potion_large', rate: 0.5, minCount: 3, maxCount: 6 },
      { itemId: 'mp_potion_large', rate: 0.4, minCount: 2, maxCount: 4 },
      { itemId: 'zuma_blade', rate: 0.03, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.6, minCount: 8, maxCount: 15 },
      { itemId: 'blessing_oil', rate: 0.1, minCount: 1, maxCount: 2 },
    ],
    bossSkills: [
      { id: 'petrify_gaze', name: '石化凝视', damageMultiplier: 1.2, cooldown: 10000, effect: 'stun', description: '石化目标3秒' },
      { id: 'sacrifice_explode', name: '小怪献祭自爆', damageMultiplier: 2.5, cooldown: 20000, effect: 'aoe', description: '献祭周围小怪造成范围爆炸伤害' },
      { id: 'berserk', name: '残血狂化', damageMultiplier: 1.5, cooldown: 0, effect: 'buff', description: '血量低于30%时攻击力提升50%' },
    ],
  },
  demon_lord: {
    id: 'demon_lord', name: '恶魔领主', level: 55, hp: 15000, mp: 800, attack: 200, defense: 70, speed: 2,
    exp: 3000, gold: 1500, color: '#cc2a2a', symbol: '😈', size: 30, aggressive: true, attackRange: 3,
    skills: ['dark_blast', 'demon_summon', 'hellfire'],
    drops: [
      { itemId: 'hp_potion_large', rate: 0.6, minCount: 3, maxCount: 8 },
      { itemId: 'mp_potion_large', rate: 0.5, minCount: 2, maxCount: 5 },
      { itemId: 'red_moon_armor', rate: 0.02, minCount: 1, maxCount: 1 },
      { itemId: 'red_moon_staff', rate: 0.02, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.6, minCount: 10, maxCount: 20 },
      { itemId: 'blessing_oil', rate: 0.15, minCount: 1, maxCount: 3 },
    ],
    bossSkills: [
      { id: 'dark_blast', name: '暗影爆破', damageMultiplier: 2.0, cooldown: 8000, effect: 'aoe', description: '范围暗影伤害' },
      { id: 'demon_summon', name: '恶魔召唤', damageMultiplier: 0, cooldown: 20000, effect: 'summon', description: '召唤恶魔兵助战' },
      { id: 'hellfire', name: '地狱烈焰', damageMultiplier: 2.5, cooldown: 15000, effect: 'aoe', description: '全屏火焰攻击' },
    ],
  },

  // 副本Boss
  corpse_king: {
    id: 'corpse_king', name: '尸王', level: 30, hp: 5000, mp: 300, attack: 70, defense: 28, speed: 2,
    exp: 1000, gold: 500, color: '#7a6a2a', symbol: '👑', size: 26, aggressive: true, attackRange: 2,
    skills: ['corpse_explosion', 'raise_dead'],
    drops: [
      { itemId: 'hp_potion_large', rate: 0.4, minCount: 2, maxCount: 5 },
      { itemId: 'mp_potion_medium', rate: 0.5, minCount: 3, maxCount: 5 },
      { itemId: 'bone_helmet', rate: 0.15, minCount: 1, maxCount: 1 },
      { itemId: 'bone_armor', rate: 0.1, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.5, minCount: 5, maxCount: 12 },
    ],
    bossSkills: [
      { id: 'corpse_explosion', name: '尸体爆炸', damageMultiplier: 2.0, cooldown: 10000, effect: 'aoe', description: '引爆周围尸体造成范围伤害' },
      { id: 'raise_dead', name: '亡者复生', damageMultiplier: 0, cooldown: 15000, effect: 'summon', description: '复活死亡怪物为其作战' },
    ],
  },
  woma_leader: {
    id: 'woma_leader', name: '沃玛教主', level: 40, hp: 8000, mp: 600, attack: 100, defense: 40, speed: 2,
    exp: 2000, gold: 1000, color: '#9a4a2a', symbol: '🔥', size: 28, aggressive: true, attackRange: 3,
    skills: ['fire_nova', 'woma_blessing'],
    drops: [
      { itemId: 'hp_potion_large', rate: 0.5, minCount: 3, maxCount: 6 },
      { itemId: 'mp_potion_large', rate: 0.4, minCount: 2, maxCount: 4 },
      { itemId: 'woma_sword', rate: 0.05, minCount: 1, maxCount: 1 },
      { itemId: 'woma_robe', rate: 0.05, minCount: 1, maxCount: 1 },
      { itemId: 'woma_helmet', rate: 0.04, minCount: 1, maxCount: 1 },
      { itemId: 'woma_boots', rate: 0.04, minCount: 1, maxCount: 1 },
      { itemId: 'woma_necklace', rate: 0.03, minCount: 1, maxCount: 1 },
      { itemId: 'woma_ring', rate: 0.03, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.6, minCount: 8, maxCount: 15 },
      { itemId: 'blessing_oil', rate: 0.12, minCount: 1, maxCount: 2 },
    ],
    bossSkills: [
      { id: 'fire_nova', name: '火焰新星', damageMultiplier: 2.0, cooldown: 8000, effect: 'aoe', description: '自身周围环状火焰爆发' },
      { id: 'summon_guard', name: '召唤卫士', damageMultiplier: 0, cooldown: 15000, effect: 'summon', description: '召唤2只沃玛卫士护卫' },
      { id: 'charge_stun', name: '冲撞眩晕', damageMultiplier: 1.5, cooldown: 12000, effect: 'stun', description: '冲向目标造成伤害并眩晕2秒' },
    ],
  },
  zuma_cult_leader: {
    id: 'zuma_cult_leader', name: '祖玛教主', level: 48, hp: 12000, mp: 800, attack: 140, defense: 55, speed: 2,
    exp: 3000, gold: 1500, color: '#ba6a1a', symbol: '⚡', size: 28, aggressive: true, attackRange: 3,
    skills: ['lightning_storm', 'petrify_gaze'],
    drops: [
      { itemId: 'hp_potion_large', rate: 0.6, minCount: 3, maxCount: 8 },
      { itemId: 'mp_potion_large', rate: 0.5, minCount: 2, maxCount: 5 },
      { itemId: 'zuma_blade', rate: 0.05, minCount: 1, maxCount: 1 },
      { itemId: 'zuma_helmet', rate: 0.04, minCount: 1, maxCount: 1 },
      { itemId: 'zuma_armor', rate: 0.04, minCount: 1, maxCount: 1 },
      { itemId: 'zuma_boots', rate: 0.04, minCount: 1, maxCount: 1 },
      { itemId: 'zuma_necklace', rate: 0.03, minCount: 1, maxCount: 1 },
      { itemId: 'zuma_ring', rate: 0.03, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.6, minCount: 10, maxCount: 18 },
      { itemId: 'blessing_oil', rate: 0.15, minCount: 1, maxCount: 3 },
    ],
    bossSkills: [
      { id: 'petrify_gaze', name: '石化凝视', damageMultiplier: 1.2, cooldown: 10000, effect: 'stun', description: '石化目标3秒' },
      { id: 'sacrifice_explode', name: '小怪献祭自爆', damageMultiplier: 2.5, cooldown: 20000, effect: 'aoe', description: '献祭周围小怪造成范围爆炸伤害' },
      { id: 'berserk', name: '残血狂化', damageMultiplier: 1.5, cooldown: 0, effect: 'buff', description: '血量低于30%时攻击力提升50%' },
    ],
  },
  red_moon_demon: {
    id: 'red_moon_demon', name: '赤月恶魔', level: 55, hp: 18000, mp: 1000, attack: 180, defense: 65, speed: 2,
    exp: 5000, gold: 2500, color: '#dd1a1a', symbol: '🌑', size: 30, aggressive: true, attackRange: 4,
    skills: ['ground_spikes', 'spider_summon', 'reflect_shield'],
    drops: [
      { itemId: 'hp_potion_large', rate: 0.7, minCount: 5, maxCount: 10 },
      { itemId: 'mp_potion_large', rate: 0.6, minCount: 3, maxCount: 6 },
      { itemId: 'red_moon_staff', rate: 0.05, minCount: 1, maxCount: 1 },
      { itemId: 'red_moon_armor', rate: 0.05, minCount: 1, maxCount: 1 },
      { itemId: 'red_moon_helmet', rate: 0.04, minCount: 1, maxCount: 1 },
      { itemId: 'red_moon_boots', rate: 0.04, minCount: 1, maxCount: 1 },
      { itemId: 'red_moon_necklace', rate: 0.03, minCount: 1, maxCount: 1 },
      { itemId: 'red_moon_ring', rate: 0.03, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.7, minCount: 10, maxCount: 25 },
      { itemId: 'blessing_oil', rate: 0.2, minCount: 1, maxCount: 3 },
      { itemId: 'teleport_scroll', rate: 0.15, minCount: 1, maxCount: 3 },
    ],
    bossSkills: [
      { id: 'ground_spikes', name: '全屏地刺', damageMultiplier: 2.0, cooldown: 12000, effect: 'aoe', description: '全屏地刺攻击' },
      { id: 'spider_summon', name: '召唤蜘蛛', damageMultiplier: 0, cooldown: 18000, effect: 'summon', description: '召唤赤月蜘蛛群' },
      { id: 'reflect_shield', name: '怪物反伤护盾', damageMultiplier: 0, cooldown: 25000, effect: 'buff', description: '为周围怪物附加反伤护盾' },
    ],
  },
  sealed_overlord: {
    id: 'sealed_overlord', name: '封印霸王', level: 52, hp: 15000, mp: 900, attack: 160, defense: 60, speed: 2,
    exp: 4000, gold: 2000, color: '#4a1a5a', symbol: '👁️', size: 28, aggressive: true, attackRange: 3,
    skills: ['void_crush', 'seal_release'],
    drops: [
      { itemId: 'hp_potion_large', rate: 0.6, minCount: 3, maxCount: 8 },
      { itemId: 'mp_potion_large', rate: 0.5, minCount: 2, maxCount: 5 },
      { itemId: 'shadow_blade', rate: 0.04, minCount: 1, maxCount: 1 },
      { itemId: 'spirit_sword', rate: 0.04, minCount: 1, maxCount: 1 },
      { itemId: 'iron_ore', rate: 0.6, minCount: 8, maxCount: 18 },
      { itemId: 'blessing_oil', rate: 0.15, minCount: 1, maxCount: 3 },
    ],
    bossSkills: [
      { id: 'void_crush', name: '虚空碾压', damageMultiplier: 2.5, cooldown: 10000, effect: 'knockback', description: '虚空之力碾压目标并击退' },
      { id: 'seal_release', name: '封印释放', damageMultiplier: 1.8, cooldown: 20000, effect: 'aoe', description: '释放封印之力造成范围伤害' },
    ],
  },
};

export function getMonsterDef(id: string): MonsterDef | undefined {
  return MONSTER_DEFINITIONS[id] || BOSS_DEFINITIONS[id];
}

export function isBoss(id: string): boolean {
  return id in BOSS_DEFINITIONS;
}
