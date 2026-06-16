// 苍月纪元 - 技能数据

// === 奥义精修词条定义 ===
export interface AoyiAffix {
  id: string;
  name: string;
  description: string;
  effect: string; // 效果类型标识
  value: number;
}

export interface SkillDef {
  id: string;
  name: string;
  classReq: 'warrior' | 'mage' | 'taoist' | 'all';
  levelReq: number;
  type: 'active' | 'passive';
  subType: 'attack' | 'buff' | 'debuff' | 'heal' | 'summon' | 'teleport';
  manaCost: number;
  cooldown: number; // ms
  range: number;
  damage?: number;
  damageMultiplier?: number;
  duration?: number; // ms
  description: string;
  icon: string;
  color: string;
  // 奥义精修 - 技能3级后可精修的词条
  aoyiAffixes?: AoyiAffix[];
}

export const SKILL_DEFINITIONS: Record<string, SkillDef> = {
  // === 战士技能 ===
  basic_sword: {
    id: 'basic_sword', name: '基础剑术', classReq: 'warrior', levelReq: 1,
    type: 'passive', subType: 'buff', manaCost: 0, cooldown: 0, range: 0,
    description: '永久提升准确率', icon: '⚔️', color: '#c0c0c0',
  },
  power_strike: {
    id: 'power_strike', name: '攻杀剑术', classReq: 'warrior', levelReq: 7,
    type: 'active', subType: 'attack', manaCost: 4, cooldown: 900, range: 1,
    damageMultiplier: 1.5, description: '强力一击，造成1.5倍伤害', icon: '💥', color: '#ff4444',
  },
  assassinate: {
    id: 'assassinate', name: '刺杀剑术', classReq: 'warrior', levelReq: 25,
    type: 'active', subType: 'attack', manaCost: 8, cooldown: 1500, range: 2,
    damageMultiplier: 2.0, description: '隔位攻击，无视50%防御', icon: '🗡️', color: '#ff0000',
  },
  half_moon: {
    id: 'half_moon', name: '半月弯刀', classReq: 'warrior', levelReq: 28,
    type: 'active', subType: 'attack', manaCost: 12, cooldown: 2000, range: 2,
    damageMultiplier: 1.2, description: '扇形范围攻击', icon: '🌙', color: '#8888ff',
  },
  savage_charge: {
    id: 'savage_charge', name: '野蛮冲撞', classReq: 'warrior', levelReq: 30,
    type: 'active', subType: 'attack', manaCost: 8, cooldown: 2500, range: 4,
    damageMultiplier: 1.0, duration: 1000, description: '冲撞目标，击退+眩晕1秒', icon: '🐂', color: '#ff8800',
  },
  fire_sword: {
    id: 'fire_sword', name: '烈火剑法', classReq: 'warrior', levelReq: 35,
    type: 'active', subType: 'attack', manaCost: 20, cooldown: 3500, range: 1,
    damageMultiplier: 2.5, description: '蓄力后造成2.5倍伤害，可暴击', icon: '🔥', color: '#ff4400',
    aoyiAffixes: [
      { id: 'aoyi_fire_burn', name: '灼烧', description: '燃烧目标3秒', effect: 'burn', value: 3 },
      { id: 'aoyi_fire_crit', name: '爆炎', description: '暴击率+10%', effect: 'critRate', value: 10 },
      { id: 'aoyi_fire_charge', name: '速燃', description: '蓄力时间-50%', effect: 'chargeReduction', value: 50 },
    ],
  },
  lion_roar: {
    id: 'lion_roar', name: '狮子吼', classReq: 'warrior', levelReq: 40,
    type: 'active', subType: 'debuff', manaCost: 25, cooldown: 4500, range: 3,
    duration: 3000, description: '范围怪物麻痹，玩家降攻', icon: '🦁', color: '#ffaa00',
    aoyiAffixes: [
      { id: 'aoyi_lion_range', name: '怒啸', description: '范围+30%', effect: 'rangeBonus', value: 30 },
      { id: 'aoyi_lion_dur', name: '震慑', description: '麻痹时间+2秒', effect: 'durationBonus', value: 2 },
      { id: 'aoyi_lion_atk', name: '狂吼', description: '降低攻击力翻倍', effect: 'debuffDouble', value: 2 },
    ],
  },
  sky_slash: {
    id: 'sky_slash', name: '开天斩', classReq: 'warrior', levelReq: 60,
    type: 'active', subType: 'attack', manaCost: 35, cooldown: 5500, range: 5,
    damageMultiplier: 3.0, description: '远程斩击，忽略30%防御', icon: '⚡', color: '#ffcc00',
    aoyiAffixes: [
      { id: 'aoyi_sky_igndef', name: '裂空', description: '忽略防御+20%', effect: 'ignoreDefBonus', value: 20 },
      { id: 'aoyi_sky_dmg', name: '天威', description: '伤害倍率+0.5', effect: 'damageMultiplierBonus', value: 0.5 },
      { id: 'aoyi_sky_cd', name: '连环', description: '冷却时间-30%', effect: 'cooldownReduction', value: 30 },
    ],
  },

  // === 法师技能 ===
  small_fireball: {
    id: 'small_fireball', name: '小火球', classReq: 'mage', levelReq: 1,
    type: 'active', subType: 'attack', manaCost: 3, cooldown: 700, range: 6,
    damage: 15, description: '基础远程火系攻击', icon: '🔥', color: '#ff6600',
  },
  repel_ring: {
    id: 'repel_ring', name: '抗拒火环', classReq: 'mage', levelReq: 12,
    type: 'active', subType: 'attack', manaCost: 8, cooldown: 2500, range: 2,
    damage: 20, description: '击退周围敌人', icon: '💫', color: '#ff8844',
  },
  hell_fire: {
    id: 'hell_fire', name: '地狱火', classReq: 'mage', levelReq: 16,
    type: 'active', subType: 'attack', manaCost: 10, cooldown: 1500, range: 5,
    damage: 35, description: '直线范围火焰伤害', icon: '🔥', color: '#cc2200',
  },
  thunder_bolt: {
    id: 'thunder_bolt', name: '雷电术', classReq: 'mage', levelReq: 17,
    type: 'active', subType: 'attack', manaCost: 12, cooldown: 1500, range: 6,
    damage: 45, description: '单体雷电伤害+短暂僵直', icon: '⚡', color: '#ffff00',
  },
  fire_wall: {
    id: 'fire_wall', name: '火墙', classReq: 'mage', levelReq: 22,
    type: 'active', subType: 'attack', manaCost: 20, cooldown: 4000, range: 4,
    damage: 30, duration: 5000, description: '地面持续灼烧区域', icon: '🔥', color: '#ff4400',
  },
  ice_roar: {
    id: 'ice_roar', name: '冰咆哮', classReq: 'mage', levelReq: 30,
    type: 'active', subType: 'attack', manaCost: 25, cooldown: 3000, range: 4,
    damage: 60, duration: 3000, description: '范围伤害+减速', icon: '❄️', color: '#44aaff',
  },
  hell_thunder: {
    id: 'hell_thunder', name: '地狱雷光', classReq: 'mage', levelReq: 36,
    type: 'active', subType: 'attack', manaCost: 28, cooldown: 3000, range: 2,
    damage: 70, description: '自身周围环状雷电伤害，附带小幅击退', icon: '⚡', color: '#9944ff',
  },
  magic_shield: {
    id: 'magic_shield', name: '魔法盾', classReq: 'mage', levelReq: 31,
    type: 'active', subType: 'buff', manaCost: 25, cooldown: 7000, range: 0,
    duration: 10000, description: '消耗蓝量抵消伤害', icon: '🛡️', color: '#6666ff',
  },
  destroy_heaven_fire: {
    id: 'destroy_heaven_fire', name: '灭天火', classReq: 'mage', levelReq: 38,
    type: 'active', subType: 'attack', manaCost: 32, cooldown: 4000, range: 6,
    damage: 90, description: '造成伤害同时燃烧目标蓝量', icon: '🔥', color: '#cc0000',
    aoyiAffixes: [
      { id: 'aoyi_dhf_burn', name: '天焚', description: '额外燃烧目标5秒', effect: 'burn', value: 5 },
      { id: 'aoyi_dhf_mana', name: '噬魔', description: '燃烧蓝量翻倍', effect: 'manaBurnDouble', value: 2 },
      { id: 'aoyi_dhf_dmg', name: '焚天', description: '伤害+20%', effect: 'damageBonus', value: 20 },
    ],
  },
  meteor_shower: {
    id: 'meteor_shower', name: '流星火雨', classReq: 'mage', levelReq: 42,
    type: 'active', subType: 'attack', manaCost: 40, cooldown: 7000, range: 5,
    damage: 80, duration: 3000, description: '超大范围多段灼烧伤害', icon: '☄️', color: '#ff2200',
    aoyiAffixes: [
      { id: 'aoyi_ms_range', name: '星陨', description: '范围+40%', effect: 'rangeBonus', value: 40 },
      { id: 'aoyi_ms_dur', name: '火域', description: '持续时间+3秒', effect: 'durationBonus', value: 3 },
      { id: 'aoyi_ms_tick', name: '密雨', description: '伤害段数翻倍', effect: 'tickDouble', value: 2 },
    ],
  },

  // === 道士技能 ===
  heal: {
    id: 'heal', name: '治愈术', classReq: 'taoist', levelReq: 1,
    type: 'active', subType: 'heal', manaCost: 4, cooldown: 900, range: 6,
    damage: 30, description: '持续恢复单体生命值', icon: '💚', color: '#00ff44',
  },
  spirit_force: {
    id: 'spirit_force', name: '精神力战法', classReq: 'taoist', levelReq: 9,
    type: 'passive', subType: 'buff', manaCost: 0, cooldown: 0, range: 0,
    description: '永久提升命中和道术伤害', icon: '✨', color: '#aaffaa',
  },
  poison: {
    id: 'poison', name: '施毒术', classReq: 'taoist', levelReq: 14,
    type: 'active', subType: 'debuff', manaCost: 8, cooldown: 2000, range: 5,
    duration: 8000, description: '红毒减防+绿毒持续掉血', icon: '☠️', color: '#00cc00',
  },
  soul_fire: {
    id: 'soul_fire', name: '灵魂火符', classReq: 'taoist', levelReq: 18,
    type: 'active', subType: 'attack', manaCost: 7, cooldown: 900, range: 6,
    damage: 25, description: '远程道术攻击', icon: '🔥', color: '#44ff88',
  },
  summon_skeleton: {
    id: 'summon_skeleton', name: '召唤骷髅', classReq: 'taoist', levelReq: 19,
    type: 'active', subType: 'summon', manaCost: 15, cooldown: 5000, range: 0,
    duration: 60000, description: '召唤骷髅作战', icon: '💀', color: '#ccccaa',
  },
  invisibility: {
    id: 'invisibility', name: '隐身术', classReq: 'taoist', levelReq: 20,
    type: 'active', subType: 'buff', manaCost: 12, cooldown: 6000, range: 0,
    duration: 15000, description: '隐身，清空怪物仇恨', icon: '👁️', color: '#aaaaff',
  },
  group_heal: {
    id: 'group_heal', name: '群体治愈术', classReq: 'taoist', levelReq: 33,
    type: 'active', subType: 'heal', manaCost: 25, cooldown: 3000, range: 4,
    damage: 50, description: '范围内队友持续回血', icon: '💚', color: '#00ff88',
  },
  summon_beast: {
    id: 'summon_beast', name: '召唤神兽', classReq: 'taoist', levelReq: 35,
    type: 'active', subType: 'summon', manaCost: 32, cooldown: 7000, range: 0,
    duration: 60000, description: '召唤喷火神兽', icon: '🐉', color: '#ff8844',
  },
  holy_armor: {
    id: 'holy_armor', name: '神圣战甲', classReq: 'taoist', levelReq: 28,
    type: 'active', subType: 'buff', manaCost: 20, cooldown: 5000, range: 4,
    duration: 8000, description: '提升范围内队友物防和魔防', icon: '🛡️', color: '#ffcc44',
  },
  wuji_aura: {
    id: 'wuji_aura', name: '无极真气', classReq: 'taoist', levelReq: 40,
    type: 'active', subType: 'buff', manaCost: 28, cooldown: 10000, range: 0,
    duration: 8000, description: '短时道术属性翻倍', icon: '🌀', color: '#ffaa44',
    aoyiAffixes: [
      { id: 'aoyi_wuji_dur', name: '长真', description: '持续时间+5秒', effect: 'durationBonus', value: 5 },
      { id: 'aoyi_wuji_mult', name: '太虚', description: '属性翻倍→2.5倍', effect: 'multiplierBonus', value: 2.5 },
      { id: 'aoyi_wuji_heal', name: '归元', description: '开启时瞬间恢复30%HP', effect: 'instantHeal', value: 30 },
    ],
  },
  moon_spirit: {
    id: 'moon_spirit', name: '月灵召唤', classReq: 'taoist', levelReq: 60,
    type: 'active', subType: 'summon', manaCost: 48, cooldown: 10000, range: 0,
    duration: 60000, description: '召唤远程高频输出月灵，替换神兽', icon: '🌙', color: '#aaddff',
    aoyiAffixes: [
      { id: 'aoyi_ms_dmg', name: '月华', description: '月灵伤害+30%', effect: 'summonDamage', value: 30 },
      { id: 'aoyi_ms_split', name: '幻月', description: '月灵攻击附带分裂', effect: 'splitAttack', value: 1 },
      { id: 'aoyi_ms_dur', name: '长明', description: '持续时间+20秒', effect: 'durationBonus', value: 20 },
    ],
  },

  // === 通用技能 ===
  normal_attack: {
    id: 'normal_attack', name: '普通攻击', classReq: 'all', levelReq: 1,
    type: 'active', subType: 'attack', manaCost: 0, cooldown: 500, range: 1,
    damageMultiplier: 1.0, description: '基础物理攻击', icon: '⚔️', color: '#ffffff',
  },
};

export function getSkillsForClass(className: 'warrior' | 'mage' | 'taoist'): SkillDef[] {
  return Object.values(SKILL_DEFINITIONS).filter(s => s.classReq === className || s.classReq === 'all');
}

// === 技能熟练度与奥义精修 ===

/** 技能等级计算：基于熟练度 */
export function getSkillLevel(proficiency: number): number {
  if (proficiency >= 300) return 3;
  if (proficiency >= 200) return 3; // 3级满
  if (proficiency >= 100) return 2;
  return 1;
}

/** 技能等级名称 */
export function getSkillLevelName(proficiency: number): string {
  const lv = getSkillLevel(proficiency);
  const names = ['', '入门', '熟练', '精通'];
  return names[lv] || '入门';
}

/** 判断技能是否可以解锁奥义（3级以上） */
export function canUnlockAoyi(proficiency: number): boolean {
  return proficiency >= 200;
}

/** 奥义精修消耗材料ID */
export const AOYI_MATERIAL_ITEM_ID = 'aoyi_scroll';

/** 奥义精修材料名称 */
export const AOYI_MATERIAL_NAME = '奥义残卷';

/** 解锁一条奥义需要的材料数量 */
export const AOYI_MATERIAL_COST = 5;
