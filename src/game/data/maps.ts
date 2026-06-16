// 苍月纪元 - 地图系统
// 程序化地图生成 + 地图定义

export type TileType = 'grass' | 'water' | 'mountain' | 'sand' | 'forest' | 'road' | 'dungeon_floor' | 'dungeon_wall' | 'town_floor' | 'bridge';

export interface MapDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  type: 'outdoor' | 'dungeon' | 'town';
  levelRange: [number, number];
  monsterIds: string[];
  bossIds?: string[];
  npcIds?: string[];
  connectedMaps?: { direction: string; mapId: string; spawnX: number; spawnY: number }[];
  bgMusic?: string;
  ambientColor?: string;
}

// 简化的伪随机数生成器（基于坐标的哈希）
function hashCoord(x: number, y: number, seed: number = 0): number {
  let h = seed + x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return (h & 0x7fffffff) / 0x7fffffff;
}

// 平滑噪声
function smoothNoise(x: number, y: number, scale: number, seed: number = 0): number {
  const sx = x / scale;
  const sy = y / scale;
  const ix = Math.floor(sx);
  const iy = Math.floor(sy);
  const fx = sx - ix;
  const fy = sy - iy;

  const v00 = hashCoord(ix, iy, seed);
  const v10 = hashCoord(ix + 1, iy, seed);
  const v01 = hashCoord(ix, iy + 1, seed);
  const v11 = hashCoord(ix + 1, iy + 1, seed);

  const top = v00 + (v10 - v00) * fx;
  const bottom = v01 + (v11 - v01) * fx;
  return top + (bottom - top) * fy;
}

// 多层噪声叠加
function fractalNoise(x: number, y: number, octaves: number = 4, seed: number = 0): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += smoothNoise(x, y, 30 / frequency, seed + i * 1000) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
}

// 地图定义
export const MAP_DEFINITIONS: Record<string, MapDefinition> = {
  yinxing_valley: {
    id: 'yinxing_valley',
    name: '银杏山谷',
    width: 200,
    height: 200,
    type: 'outdoor',
    levelRange: [1, 10],
    monsterIds: ['chicken', 'deer', 'wild_wolf', 'skeleton'],
    bossIds: ['skeleton_king'],
    npcIds: ['village_elder', 'weapon_smith', 'herb_merchant', 'armor_smith'],
    connectedMaps: [
      { direction: 'north', mapId: 'bqi_forest', spawnX: 100, spawnY: 180 }
    ],
    ambientColor: '#4a7c3f',
  },
  bqi_forest: {
    id: 'bqi_forest',
    name: '比奇森林',
    width: 300,
    height: 300,
    type: 'outdoor',
    levelRange: [10, 25],
    monsterIds: ['orc_warrior', 'orc_archer', 'half_beast', 'snake'],
    bossIds: ['half_beast_commander'],
    npcIds: ['forest_ranger', 'potion_seller', 'skill_trainer'],
    connectedMaps: [
      { direction: 'south', mapId: 'yinxing_valley', spawnX: 100, spawnY: 20 },
      { direction: 'north', mapId: 'snake_valley', spawnX: 150, spawnY: 280 }
    ],
    ambientColor: '#2d5a1e',
  },
  snake_valley: {
    id: 'snake_valley',
    name: '毒蛇山谷',
    width: 300,
    height: 300,
    type: 'outdoor',
    levelRange: [25, 35],
    monsterIds: ['venomous_snake', 'scorpion', 'dark_spider', 'snake_demon'],
    bossIds: ['snake_queen'],
    npcIds: ['desert_merchant', 'wandering_healer'],
    connectedMaps: [
      { direction: 'south', mapId: 'bqi_forest', spawnX: 150, spawnY: 20 },
      { direction: 'north', mapId: 'mengzhong_waste', spawnX: 150, spawnY: 280 }
    ],
    ambientColor: '#8b7355',
  },
  mengzhong_waste: {
    id: 'mengzhong_waste',
    name: '盟重荒野',
    width: 400,
    height: 400,
    type: 'outdoor',
    levelRange: [35, 45],
    monsterIds: ['zuma_guard', 'flame_skeleton', 'dark_knight', 'shadow_mage'],
    bossIds: ['zuma_leader'],
    npcIds: ['camp_commander', 'blacksmith_master', 'arcane_scholar'],
    connectedMaps: [
      { direction: 'south', mapId: 'snake_valley', spawnX: 150, spawnY: 20 },
      { direction: 'north', mapId: 'cangyue_coast', spawnX: 200, spawnY: 380 }
    ],
    ambientColor: '#5a4a3a',
  },
  cangyue_coast: {
    id: 'cangyue_coast',
    name: '苍月岛海岸',
    width: 500,
    height: 500,
    type: 'outdoor',
    levelRange: [45, 60],
    monsterIds: ['sea_serpent', 'demon_soldier', 'blood_bat', 'ghost_warrior'],
    bossIds: ['demon_lord'],
    npcIds: ['island_hermit', 'ancient_forge', 'treasure_hunter'],
    connectedMaps: [
      { direction: 'south', mapId: 'mengzhong_waste', spawnX: 200, spawnY: 20 }
    ],
    ambientColor: '#3a4a5a',
  },
  // 副本地图
  dungeon_shiwang: {
    id: 'dungeon_shiwang',
    name: '尸王殿',
    width: 60,
    height: 60,
    type: 'dungeon',
    levelRange: [20, 40],
    monsterIds: ['zombie', 'rotting_corpse', 'corpse_king_minion'],
    bossIds: ['corpse_king'],
    ambientColor: '#2a1a2a',
  },
  dungeon_woma: {
    id: 'dungeon_woma',
    name: '沃玛寺庙',
    width: 80,
    height: 80,
    type: 'dungeon',
    levelRange: [30, 50],
    monsterIds: ['woma_guard', 'woma_warrior', 'woma_mage'],
    bossIds: ['woma_leader'],
    ambientColor: '#3a1a1a',
  },
  dungeon_zuma: {
    id: 'dungeon_zuma',
    name: '祖玛神殿',
    width: 100,
    height: 100,
    type: 'dungeon',
    levelRange: [35, 60],
    monsterIds: ['zuma_warrior', 'zuma_archer', 'zuma_mage'],
    bossIds: ['zuma_cult_leader'],
    ambientColor: '#1a2a3a',
  },
  dungeon_chiyue: {
    id: 'dungeon_chiyue',
    name: '赤月洞穴',
    width: 80,
    height: 80,
    type: 'dungeon',
    levelRange: [45, 60],
    monsterIds: ['red_moon_spider', 'blood_demon', 'shadow_assassin'],
    bossIds: ['red_moon_demon'],
    ambientColor: '#3a0a0a',
  },
  dungeon_sealed: {
    id: 'dungeon_sealed',
    name: '封魔谷',
    width: 100,
    height: 100,
    type: 'dungeon',
    levelRange: [40, 60],
    monsterIds: ['sealed_demon', 'cursed_spirit', 'ancient_golem'],
    bossIds: ['sealed_overlord'],
    ambientColor: '#1a1a2a',
  },
};

// 程序化地图瓦片生成
export function getMapTile(mapId: string, x: number, y: number): TileType {
  const mapDef = MAP_DEFINITIONS[mapId];
  if (!mapDef) return 'grass';

  // 边界检查
  if (x < 0 || y < 0 || x >= mapDef.width || y >= mapDef.height) return 'mountain';

  if (mapDef.type === 'dungeon') {
    return getDungeonTile(mapId, x, y, mapDef.width, mapDef.height);
  }

  if (mapDef.type === 'outdoor' || mapDef.type === 'town') {
    return getOutdoorTile(mapId, x, y, mapDef.width, mapDef.height);
  }

  return 'grass';
}

function getOutdoorTile(mapId: string, x: number, y: number, w: number, h: number): TileType {
  const seed = mapId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  // 地图边缘是山
  const edgeMargin = 3;
  if (x < edgeMargin || y < edgeMargin || x >= w - edgeMargin || y >= h - edgeMargin) {
    return 'mountain';
  }

  // 基础地形噪声
  const elevation = fractalNoise(x, y, 4, seed);
  const moisture = fractalNoise(x, y, 4, seed + 500);

  // 出生点附近安全区（草地+路）
  const centerX = w / 2;
  const centerY = h / 2;
  const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
  const safeRadius = 15;

  if (distFromCenter < safeRadius) {
    // 中心城镇区域
    if (distFromCenter < 5) return 'town_floor';
    if (distFromCenter < 8 && (Math.abs(x - centerX) < 2 || Math.abs(y - centerY) < 2)) return 'road';
    return 'grass';
  }

  // 道路系统 - 从中心向四个方向延伸
  const roadWidth = 2;
  const isNorthSouthRoad = Math.abs(x - centerX) < roadWidth;
  const isEastWestRoad = Math.abs(y - centerY) < roadWidth;
  if (isNorthSouthRoad || isEastWestRoad) return 'road';

  // 水域
  if (elevation < 0.3 && moisture > 0.5) return 'water';

  // 沙地
  if (elevation < 0.35 && moisture < 0.3) return 'sand';

  // 森林
  if (elevation > 0.4 && elevation < 0.65 && moisture > 0.5) return 'forest';

  // 山地
  if (elevation > 0.7) return 'mountain';

  // 默认草地
  return 'grass';
}

function getDungeonTile(mapId: string, x: number, y: number, w: number, h: number): TileType {
  const seed = mapId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  // 边界全是墙
  if (x === 0 || y === 0 || x === w - 1 || y === h - 1) return 'dungeon_wall';

  // 入口区域（左上角）
  if (x <= 5 && y <= 5) return 'dungeon_floor';

  // 生成房间和走廊的简单算法
  const roomNoise = fractalNoise(x, y, 2, seed);
  const corridorNoise = fractalNoise(x, y, 3, seed + 200);

  // 走廊 - 每隔一定间距有水平和垂直走廊
  const corridorSpacing = 12;
  const isHCorridor = y % corridorSpacing < 2;
  const isVCorridor = x % corridorSpacing < 2;

  // 房间 - 某些区域是开放的
  const roomSize = 8;
  const roomCenterX = Math.round(x / roomSize) * roomSize;
  const roomCenterY = Math.round(y / roomSize) * roomSize;
  const inRoom = Math.abs(x - roomCenterX) < 4 && Math.abs(y - roomCenterY) < 4 && roomNoise > 0.45;

  if (inRoom || isHCorridor || isVCorridor) {
    return 'dungeon_floor';
  }

  // 墙壁
  return 'dungeon_wall';
}

// 检查瓦片是否可行走
export function isTileWalkable(tile: TileType): boolean {
  switch (tile) {
    case 'grass':
    case 'sand':
    case 'forest':
    case 'road':
    case 'town_floor':
    case 'dungeon_floor':
    case 'bridge':
      return true;
    case 'water':
    case 'mountain':
    case 'dungeon_wall':
      return false;
    default:
      return false;
  }
}

// 获取瓦片颜色
export function getTileColor(tile: TileType): string {
  switch (tile) {
    case 'grass': return '#4a7c3f';
    case 'water': return '#2a5a8a';
    case 'mountain': return '#6a6a6a';
    case 'sand': return '#c4a854';
    case 'forest': return '#2d5a1e';
    case 'road': return '#8a7a5a';
    case 'dungeon_floor': return '#3a3a3a';
    case 'dungeon_wall': return '#1a1a1a';
    case 'town_floor': return '#9a8a6a';
    case 'bridge': return '#7a5a2a';
    default: return '#4a7c3f';
  }
}

// 获取地图出生点
export function getMapSpawnPoint(mapId: string): { x: number; y: number } {
  const mapDef = MAP_DEFINITIONS[mapId];
  if (!mapDef) return { x: 5, y: 5 };

  if (mapDef.type === 'dungeon') {
    return { x: 2, y: 2 };
  }

  return { x: Math.floor(mapDef.width / 2), y: Math.floor(mapDef.height / 2) };
}

// 获取所有地图ID列表
export function getAllMapIds(): string[] {
  return Object.keys(MAP_DEFINITIONS);
}

// 获取野外地图ID列表
export function getOutdoorMapIds(): string[] {
  return Object.values(MAP_DEFINITIONS).filter(m => m.type === 'outdoor').map(m => m.id);
}

// 获取副本地图ID列表
export function getDungeonMapIds(): string[] {
  return Object.values(MAP_DEFINITIONS).filter(m => m.type === 'dungeon').map(m => m.id);
}
