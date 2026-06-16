// 苍月纪元 - 假玩家/机器人系统

export interface BotDef {
  id: string;
  name: string;
  level: number;
  class: 'warrior' | 'mage' | 'taoist';
  mapId: string;
  x: number;
  y: number;
  color: string;
  symbol: string;
  chatMessages: string[];
  movePattern: 'patrol' | 'wander' | 'stationary';
  patrolPoints?: { x: number; y: number }[];
}

export const BOT_DEFINITIONS: BotDef[] = [
  // 银杏山谷
  { id: 'bot_1', name: '剑客小白', level: 5, class: 'warrior', mapId: 'yinxing_valley', x: 95, y: 105,
    color: '#4488ff', symbol: '🧑', chatMessages: ['新手村真不错！', '有人组队吗？', '木剑也挺好的~'],
    movePattern: 'patrol', patrolPoints: [{ x: 95, y: 105 }, { x: 105, y: 105 }, { x: 105, y: 95 }, { x: 95, y: 95 }] },
  { id: 'bot_2', name: '火法小美', level: 8, class: 'mage', mapId: 'yinxing_valley', x: 108, y: 95,
    color: '#ff4488', symbol: '👩', chatMessages: ['法师真好玩！', '小火球好帅！', '谁有蓝药？'],
    movePattern: 'wander' },
  { id: 'bot_3', name: '道士阿明', level: 6, class: 'taoist', mapId: 'yinxing_valley', x: 92, y: 92,
    color: '#44ff88', symbol: '🧑', chatMessages: ['治愈术真的好用', '我要去练级了', '有没有人需要治疗？'],
    movePattern: 'patrol', patrolPoints: [{ x: 92, y: 92 }, { x: 92, y: 108 }] },
  { id: 'bot_4', name: '战士大壮', level: 3, class: 'warrior', mapId: 'yinxing_valley', x: 110, y: 110,
    color: '#ff8844', symbol: '👨', chatMessages: ['我要变强！', '打怪真爽', '有人带吗？'],
    movePattern: 'wander' },

  // 比奇森林
  { id: 'bot_5', name: '侠客无名', level: 15, class: 'warrior', mapId: 'bqi_forest', x: 140, y: 155,
    color: '#cc4444', symbol: '🧑', chatMessages: ['半兽人真难打', '这把铁剑不错', '有没有人组队刷半兽？'],
    movePattern: 'patrol', patrolPoints: [{ x: 140, y: 155 }, { x: 160, y: 155 }, { x: 160, y: 140 }] },
  { id: 'bot_6', name: '冰霜法师', level: 18, class: 'mage', mapId: 'bqi_forest', x: 155, y: 140,
    color: '#4488cc', symbol: '👩', chatMessages: ['冰咆哮好酷！', '蓝药不够用了', '一起刷怪吗？'],
    movePattern: 'wander' },
  { id: 'bot_7', name: '天师道人', level: 16, class: 'taoist', mapId: 'bqi_forest', x: 145, y: 145,
    color: '#88cc44', symbol: '🧓', chatMessages: ['施毒术太强了', '骷髅帮我抗怪', '需要治疗的来找我'],
    movePattern: 'patrol', patrolPoints: [{ x: 145, y: 145 }, { x: 155, y: 145 }, { x: 155, y: 155 }] },
  { id: 'bot_8', name: '独行侠', level: 20, class: 'warrior', mapId: 'bqi_forest', x: 130, y: 160,
    color: '#884444', symbol: '🧑', chatMessages: ['我一个人也行！', '半兽统领在哪？', '高手在此'],
    movePattern: 'wander' },

  // 毒蛇山谷
  { id: 'bot_9', name: '蛇谷行者', level: 28, class: 'warrior', mapId: 'snake_valley', x: 145, y: 155,
    color: '#aa6622', symbol: '🧑', chatMessages: ['毒蛇好可怕', '小心蝎子！', '有没有解毒药？'],
    movePattern: 'wander' },
  { id: 'bot_10', name: '暗夜法师', level: 30, class: 'mage', mapId: 'snake_valley', x: 155, y: 145,
    color: '#6622aa', symbol: '👩', chatMessages: ['这些怪经验好多', '魔法盾真好用', '组队更效率！'],
    movePattern: 'patrol', patrolPoints: [{ x: 155, y: 145 }, { x: 145, y: 155 }] },

  // 盟重荒野
  { id: 'bot_11', name: '荒野猎人', level: 38, class: 'warrior', mapId: 'mengzhong_waste', x: 195, y: 205,
    color: '#aa4444', symbol: '🧑', chatMessages: ['祖玛卫士太难打了', '有人去副本吗？', '这装备怎么获得？'],
    movePattern: 'patrol', patrolPoints: [{ x: 195, y: 205 }, { x: 205, y: 205 }, { x: 205, y: 195 }] },
  { id: 'bot_12', name: '炼金术士', level: 40, class: 'mage', mapId: 'mengzhong_waste', x: 205, y: 195,
    color: '#4444aa', symbol: '👩', chatMessages: ['需要药水吗？', '这边的怪掉好东西', '传送点在这边'],
    movePattern: 'wander' },
  { id: 'bot_13', name: '圣光道士', level: 36, class: 'taoist', mapId: 'mengzhong_waste', x: 200, y: 210,
    color: '#44aa44', symbol: '🧓', chatMessages: ['群体治愈术太好用了', '需要Buff来找我', '祖玛教主太强了！'],
    movePattern: 'stationary' },

  // 苍月岛海岸
  { id: 'bot_14', name: '苍月剑圣', level: 52, class: 'warrior', mapId: 'cangyue_coast', x: 245, y: 255,
    color: '#ff4444', symbol: '🧑', chatMessages: ['苍月岛不是新手来的地方', '恶魔领主太可怕了', '有没有红药？'],
    movePattern: 'patrol', patrolPoints: [{ x: 245, y: 255 }, { x: 255, y: 255 }, { x: 255, y: 245 }] },
  { id: 'bot_15', name: '元素法师', level: 55, class: 'mage', mapId: 'cangyue_coast', x: 255, y: 245,
    color: '#4444ff', symbol: '👩', chatMessages: ['流星火雨太帅了！', '这里的怪好强', '小心海蛇妖'],
    movePattern: 'wander' },
  { id: 'bot_16', name: '通灵道人', level: 50, class: 'taoist', mapId: 'cangyue_coast', x: 260, y: 260,
    color: '#44ff44', symbol: '🧓', chatMessages: ['神兽真强！', '转生以后更强', '有没有人去赤月洞穴？'],
    movePattern: 'wander' },

  // 额外的假玩家
  { id: 'bot_17', name: '风云剑客', level: 10, class: 'warrior', mapId: 'yinxing_valley', x: 85, y: 85,
    color: '#cc6600', symbol: '🧑', chatMessages: ['攻杀剑术好帅！', '我要去比奇森林了', '有人一起吗？'],
    movePattern: 'wander' },
  { id: 'bot_18', name: '雷电法师', level: 22, class: 'mage', mapId: 'bqi_forest', x: 165, y: 135,
    color: '#6644cc', symbol: '👩', chatMessages: ['雷电术威力真大！', '蓝药又没了...', '有战士帮忙抗怪吗？'],
    movePattern: 'wander' },
  { id: 'bot_19', name: '月灵使', level: 45, class: 'taoist', mapId: 'mengzhong_waste', x: 190, y: 190,
    color: '#44cc88', symbol: '🧓', chatMessages: ['月灵召唤太厉害了', '转生是必须的', '组队下副本效率高'],
    movePattern: 'patrol', patrolPoints: [{ x: 190, y: 190 }, { x: 210, y: 190 }] },
  { id: 'bot_20', name: '霸王战士', level: 48, class: 'warrior', mapId: 'cangyue_coast', x: 240, y: 240,
    color: '#cc2200', symbol: '👨', chatMessages: ['开天斩！', '我快转生了', '这把武器太强了！'],
    movePattern: 'wander' },
];

export function getBotsForMap(mapId: string): BotDef[] {
  return BOT_DEFINITIONS.filter(b => b.mapId === mapId);
}
