// 苍月纪元 - NPC数据

export interface NPCDef {
  id: string;
  name: string;
  title: string;
  mapId: string;
  x: number;
  y: number;
  color: string;
  symbol: string;
  type: 'shop' | 'quest' | 'craft' | 'teleport' | 'trainer' | 'bank' | 'generic';
  dialog: string[];
  shopItems?: { itemId: string; price: number }[];
  craftRecipes?: { recipeId: string; name: string; materials: { itemId: string; count: number }[]; result: { itemId: string; count: number } }[];
  teleportTargets?: { mapId: string; name: string; cost: number }[];
}

export const NPC_DEFINITIONS: Record<string, NPCDef> = {
  // 银杏山谷NPC
  village_elder: {
    id: 'village_elder', name: '村长', title: '银杏村长', mapId: 'yinxing_valley',
    x: 98, y: 98, color: '#d4a017', symbol: '👴', type: 'quest',
    dialog: [
      '欢迎来到银杏山谷，年轻人！',
      '这里是新手村，周围有些温顺的动物可以练手。',
      '等你变强了，可以去北边的比奇森林冒险。',
      '记得多和商人聊聊，他们有你需要的东西。',
    ],
  },
  weapon_smith: {
    id: 'weapon_smith', name: '铁匠王大锤', title: '武器锻造师', mapId: 'yinxing_valley',
    x: 102, y: 98, color: '#b87333', symbol: '🔨', type: 'shop',
    dialog: ['需要好兵器吗？我这儿有最锋利的刀剑！', '不过想买好货，得有足够的金币。'],
    shopItems: [
      { itemId: 'wooden_sword', price: 50 },
      { itemId: 'iron_sword', price: 200 },
      { itemId: 'bronze_axe', price: 150 },
      { itemId: 'training_staff', price: 100 },
      { itemId: 'cloth_boots', price: 30 },
      { itemId: 'leather_boots', price: 80 },
      { itemId: 'cloth_belt', price: 30 },
      { itemId: 'leather_belt', price: 80 },
      { itemId: 'wooden_bracelet', price: 40 },
    ],
  },
  herb_merchant: {
    id: 'herb_merchant', name: '药婆婆', title: '草药商人', mapId: 'yinxing_valley',
    x: 100, y: 102, color: '#7cba5f', symbol: '🧪', type: 'shop',
    dialog: ['买药吗？我这里的药水可都是上好的草药熬制。', '冒险可别忘了带药水啊！'],
    shopItems: [
      { itemId: 'hp_potion_small', price: 20 },
      { itemId: 'mp_potion_small', price: 25 },
      { itemId: 'hp_potion_medium', price: 80 },
      { itemId: 'mp_potion_medium', price: 100 },
    ],
  },
  armor_smith: {
    id: 'armor_smith', name: '甲匠李铁臂', title: '防具锻造师', mapId: 'yinxing_valley',
    x: 96, y: 100, color: '#808080', symbol: '🛡️', type: 'shop',
    dialog: ['想活得久，就得穿好甲！', '来，看看我的防具，都是精品！'],
    shopItems: [
      { itemId: 'cloth_armor', price: 80 },
      { itemId: 'leather_armor', price: 200 },
      { itemId: 'wooden_shield', price: 100 },
      { itemId: 'yinxing_helmet', price: 200 },
      { itemId: 'yinxing_armor', price: 300 },
      { itemId: 'yinxing_boots', price: 150 },
      { itemId: 'yinxing_belt', price: 150 },
      { itemId: 'yinxing_bracelet', price: 200 },
      { itemId: 'jade_bracelet', price: 280 },
      { itemId: 'copper_ring', price: 200 },
      { itemId: 'bone_necklace', price: 200 },
    ],
  },

  // 比奇森林NPC
  forest_ranger: {
    id: 'forest_ranger', name: '游侠阿尔法', title: '森林巡逻', mapId: 'bqi_forest',
    x: 148, y: 148, color: '#2e8b57', symbol: '🏹', type: 'quest',
    dialog: [
      '这片森林最近不太平，半兽人越来越多了。',
      '如果你能帮忙清理一些，我会给你不错的报酬。',
      '注意那些半兽人弓手，他们的箭可不长眼。',
    ],
  },
  potion_seller: {
    id: 'potion_seller', name: '炼药师陈百草', title: '药水商人', mapId: 'bqi_forest',
    x: 152, y: 148, color: '#9370db', symbol: '🧪', type: 'shop',
    dialog: ['森林里的草药特别多，我做的药水品质一流！'],
    shopItems: [
      { itemId: 'hp_potion_medium', price: 80 },
      { itemId: 'mp_potion_medium', price: 100 },
      { itemId: 'hp_potion_large', price: 250 },
      { itemId: 'antidote', price: 50 },
      { itemId: 'biqi_helmet', price: 1000 },
      { itemId: 'biqi_armor', price: 1400 },
      { itemId: 'biqi_boots', price: 800 },
      { itemId: 'biqi_belt', price: 800 },
      { itemId: 'biqi_bracelet', price: 1000 },
      { itemId: 'silver_bracelet', price: 800 },
      { itemId: 'iron_ring', price: 600 },
      { itemId: 'copper_necklace', price: 250 },
    ],
  },
  skill_trainer: {
    id: 'skill_trainer', name: '武学导师玄真', title: '技能训练师', mapId: 'bqi_forest',
    x: 150, y: 152, color: '#daa520', symbol: '📜', type: 'trainer',
    dialog: [
      '想学新技能？来对地方了！',
      '每升几级就能学到更强大的技能。',
      '选好你的职业路线，我会教你对应的技能。',
    ],
  },

  // 毒蛇山谷NPC
  desert_merchant: {
    id: 'desert_merchant', name: '沙漠商人哈桑', title: '行脚商人', mapId: 'snake_valley',
    x: 148, y: 148, color: '#d2691e', symbol: '🏪', type: 'shop',
    dialog: ['沙漠里的东西最珍贵！', '我能弄到别处买不到的好货。'],
    shopItems: [
      { itemId: 'hp_potion_large', price: 250 },
      { itemId: 'mp_potion_large', price: 300 },
      { itemId: 'blessing_oil', price: 500 },
      { itemId: 'teleport_scroll', price: 200 },
    ],
  },
  wandering_healer: {
    id: 'wandering_healer', name: '游医华小仙', title: '医师', mapId: 'snake_valley',
    x: 152, y: 148, color: '#ff69b4', symbol: '💊', type: 'generic',
    dialog: ['中毒了？来我这里，包你药到病除！', '毒蛇山谷的毒可不是闹着玩的。'],
  },

  // 盟重荒野NPC
  camp_commander: {
    id: 'camp_commander', name: '军营统领赵将军', title: '军营统领', mapId: 'mengzhong_waste',
    x: 198, y: 198, color: '#b22222', symbol: '⚔️', type: 'quest',
    dialog: [
      '这里是盟重军营，荒野上到处是危险。',
      '祖玛的爪牙越来越猖狂了！',
      '有胆量的就去祖玛神殿，但要做好准备。',
    ],
  },
  blacksmith_master: {
    id: 'blacksmith_master', name: '大师铁匠欧冶子', title: '高级锻造师', mapId: 'mengzhong_waste',
    x: 202, y: 198, color: '#cd853f', symbol: '⚒️', type: 'craft',
    dialog: ['老夫锻造了一辈子的兵器，你有什么材料？', '好的材料才能锻造出好的装备。'],
    craftRecipes: [
      {
        recipeId: 'refine_iron_sword', name: '精炼铁剑',
        materials: [{ itemId: 'iron_ore', count: 5 }, { itemId: 'gold_coins', count: 500 }],
        result: { itemId: 'refined_iron_sword', count: 1 },
      },
    ],
  },
  arcane_scholar: {
    id: 'arcane_scholar', name: '秘法师莫里恩', title: '传送大师', mapId: 'mengzhong_waste',
    x: 200, y: 202, color: '#9400d3', symbol: '🔮', type: 'teleport',
    dialog: ['需要传送到别的地方吗？', '传送需要一些金币作为费用。'],
    teleportTargets: [
      { mapId: 'yinxing_valley', name: '银杏山谷', cost: 100 },
      { mapId: 'bqi_forest', name: '比奇森林', cost: 150 },
      { mapId: 'snake_valley', name: '毒蛇山谷', cost: 200 },
      { mapId: 'cangyue_coast', name: '苍月岛海岸', cost: 500 },
    ],
  },

  // 苍月岛海岸NPC
  island_hermit: {
    id: 'island_hermit', name: '岛居仙人', title: '隐世高人', mapId: 'cangyue_coast',
    x: 248, y: 248, color: '#f0e68c', symbol: '🧙', type: 'quest',
    dialog: [
      '你终于来了，我等你很久了。',
      '苍月岛上封印着远古的恶魔，只有强者才能面对它。',
      '做好准备，前面是最危险的挑战。',
    ],
  },
  ancient_forge: {
    id: 'ancient_forge', name: '远古熔炉', title: '神器锻造', mapId: 'cangyue_coast',
    x: 252, y: 248, color: '#ff4500', symbol: '🔥', type: 'craft',
    dialog: ['这是远古留下的熔炉，可以锻造强大的装备。', '但你需要稀有的材料。'],
  },
  treasure_hunter: {
    id: 'treasure_hunter', name: '寻宝者杰克', title: '冒险家', mapId: 'cangyue_coast',
    x: 250, y: 252, color: '#daa520', symbol: '🗺️', type: 'generic',
    dialog: [
      '我在岛上发现了不少宝藏！',
      '如果你有兴趣，可以去探索那些隐藏的洞穴。',
      '不过要小心，那里可不只有宝藏...',
    ],
    teleportTargets: [
      { mapId: 'dungeon_chiyue', name: '赤月洞穴', cost: 1000 },
      { mapId: 'dungeon_sealed', name: '封魔谷', cost: 800 },
    ],
  },
};

export function getNPCDef(id: string): NPCDef | undefined {
  return NPC_DEFINITIONS[id];
}

export function getNPCsForMap(mapId: string): NPCDef[] {
  return Object.values(NPC_DEFINITIONS).filter(npc => npc.mapId === mapId);
}
