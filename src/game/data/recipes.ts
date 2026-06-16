// 传奇合成配方 - Crafting Recipe Definitions

export interface CraftingRecipe {
  id: string;
  name: string;
  materials: { itemId: string; quantity: number }[];
  result: { itemId: string; quantity: number };
  requiredLevel: number;
  type: 'weapon' | 'armor' | 'accessory' | 'potion';
  description: string;
}

export const CRAFTING_RECIPES: Record<string, CraftingRecipe> = {
  recipe_bronzeSword: {
    id: 'recipe_bronzeSword',
    name: '铁剑合成',
    materials: [
      { itemId: 'ironOre', quantity: 3 },
    ],
    result: { itemId: 'bronzeSword', quantity: 1 },
    requiredLevel: 1,
    type: 'weapon',
    description: '用铁矿石铸造一把青铜剑',
  },
  recipe_ironSword: {
    id: 'recipe_ironSword',
    name: '精炼铁剑',
    materials: [
      { itemId: 'ironOre', quantity: 5 },
      { itemId: 'blackIron', quantity: 1 },
    ],
    result: { itemId: 'ironSword', quantity: 1 },
    requiredLevel: 3,
    type: 'weapon',
    description: '用铁矿石和黑铁矿锻造锋利的铁剑',
  },
  recipe_warGodArmor: {
    id: 'recipe_warGodArmor',
    name: '玄铁战甲',
    materials: [
      { itemId: 'ironOre', quantity: 5 },
      { itemId: 'leather', quantity: 2 },
    ],
    result: { itemId: 'warGodArmor', quantity: 1 },
    requiredLevel: 8,
    type: 'armor',
    description: '铁矿石与皮革打造战神铠甲',
  },
  recipe_heavyArmor: {
    id: 'recipe_heavyArmor',
    name: '重甲锻造',
    materials: [
      { itemId: 'ironOre', quantity: 8 },
      { itemId: 'blackIron', quantity: 2 },
    ],
    result: { itemId: 'heavyArmor', quantity: 1 },
    requiredLevel: 12,
    type: 'armor',
    description: '大量铁矿石锻造坚固的重型铠甲',
  },
  recipe_superHealPot: {
    id: 'recipe_superHealPot',
    name: '金创药(大)',
    materials: [
      { itemId: 'herb', quantity: 3 },
    ],
    result: { itemId: 'bigHealPot', quantity: 2 },
    requiredLevel: 1,
    type: 'potion',
    description: '用草药炼制金创药(大)',
  },
  recipe_superHealPotPack: {
    id: 'recipe_superHealPotPack',
    name: '超级金创药',
    materials: [
      { itemId: 'herb', quantity: 5 },
      { itemId: 'crystal', quantity: 1 },
    ],
    result: { itemId: 'superHealPot', quantity: 2 },
    requiredLevel: 10,
    type: 'potion',
    description: '草药与水晶炼制超级金创药',
  },
  recipe_experienceOrb: {
    id: 'recipe_experienceOrb',
    name: '经验珠合成',
    materials: [
      { itemId: 'crystal', quantity: 2 },
      { itemId: 'soulCrystal', quantity: 1 },
    ],
    result: { itemId: 'experienceOrb', quantity: 1 },
    requiredLevel: 5,
    type: 'potion',
    description: '水晶与灵魂晶石凝聚成经验珠',
  },
  recipe_dragonRing: {
    id: 'recipe_dragonRing',
    name: '龙之戒指',
    materials: [
      { itemId: 'crystal', quantity: 3 },
      { itemId: 'diamond', quantity: 1 },
    ],
    result: { itemId: 'dragonRing', quantity: 1 },
    requiredLevel: 12,
    type: 'accessory',
    description: '水晶与金刚石打造龙之戒指',
  },
  recipe_coralRing: {
    id: 'recipe_coralRing',
    name: '珊瑚戒指',
    materials: [
      { itemId: 'crystal', quantity: 2 },
      { itemId: 'leather', quantity: 1 },
    ],
    result: { itemId: 'coralRing', quantity: 1 },
    requiredLevel: 5,
    type: 'accessory',
    description: '水晶与皮革制作珊瑚戒指',
  },
  recipe_ironHelmet: {
    id: 'recipe_ironHelmet',
    name: '铁盔锻造',
    materials: [
      { itemId: 'ironOre', quantity: 4 },
      { itemId: 'leather', quantity: 1 },
    ],
    result: { itemId: 'ironHelmet', quantity: 1 },
    requiredLevel: 6,
    type: 'armor',
    description: '铁矿石与皮革打造铁盔',
  },
  recipe_soulNecklace: {
    id: 'recipe_soulNecklace',
    name: '灵魂项链',
    materials: [
      { itemId: 'soulCrystal', quantity: 2 },
      { itemId: 'crystal', quantity: 2 },
    ],
    result: { itemId: 'soulNecklace', quantity: 1 },
    requiredLevel: 10,
    type: 'accessory',
    description: '灵魂晶石与水晶铸造灵魂项链',
  },
  recipe_darkIronSword: {
    id: 'recipe_darkIronSword',
    name: '玄铁剑锻造',
    materials: [
      { itemId: 'ironOre', quantity: 8 },
      { itemId: 'blackIron', quantity: 3 },
      { itemId: 'diamond', quantity: 1 },
    ],
    result: { itemId: 'darkIronSword', quantity: 1 },
    requiredLevel: 8,
    type: 'weapon',
    description: '大量铁矿石、黑铁矿和金刚石锻造玄铁重剑',
  },
  recipe_superManaPot: {
    id: 'recipe_superManaPot',
    name: '超级魔法药',
    materials: [
      { itemId: 'crystal', quantity: 3 },
      { itemId: 'herb', quantity: 2 },
    ],
    result: { itemId: 'superManaPot', quantity: 2 },
    requiredLevel: 10,
    type: 'potion',
    description: '水晶与草药炼制超级魔法药',
  },
};

// Enchanting success rates per enchant level
// 0→1 = 100%, 1→2 = 80%, 2→3 = 60%, 3→4 = 40%, 4→5 = 20%
export const ENCHANT_SUCCESS_RATES: Record<number, number> = {
  0: 1.0,
  1: 0.8,
  2: 0.6,
  3: 0.4,
  4: 0.2,
};

export const MAX_ENCHANT_LEVEL = 5;

export function getEnchantSuccessRate(currentLevel: number): number {
  return ENCHANT_SUCCESS_RATES[currentLevel] ?? 0.1;
}

export function getAvailableRecipes(playerLevel: number, inventoryItems: { itemId: string; quantity: number }[]): CraftingRecipe[] {
  return Object.values(CRAFTING_RECIPES).filter(recipe => {
    if (playerLevel < recipe.requiredLevel) return false;
    return true; // Show all level-appropriate recipes; color-code missing materials in UI
  });
}

export function canCraftRecipe(recipe: CraftingRecipe, inventoryItems: { itemId: string; quantity: number }[]): boolean {
  return recipe.materials.every(mat => {
    const held = inventoryItems
      .filter(i => i.itemId === mat.itemId)
      .reduce((sum, i) => sum + i.quantity, 0);
    return held >= mat.quantity;
  });
}

// Materials that can be used for enchanting
export const ENCHANT_MATERIALS = ['soulCrystal', 'blackIron', 'diamond', 'crystal'];

export function getEnchantBonus(materialId: string): { stat: 'attack' | 'defense' | 'magic'; range: [number, number] } {
  switch (materialId) {
    case 'soulCrystal':
      return { stat: 'magic', range: [2, 3] };
    case 'blackIron':
      return { stat: 'defense', range: [2, 3] };
    case 'diamond':
      return { stat: 'attack', range: [2, 3] };
    case 'crystal':
      return { stat: 'attack', range: [1, 2] };
    default:
      return { stat: 'attack', range: [1, 1] };
  }
}
