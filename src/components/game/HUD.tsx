'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/game/store/gameStore';
import { ITEM_DEFINITIONS, RARITY_COLORS, RARITY_NAMES, SET_BONUSES, calculateActiveSetBonuses } from '@/game/data/items';
import { SKILL_DEFINITIONS } from '@/game/data/skills';
import { MAP_DEFINITIONS, getDungeonMapIds, getMapSpawnPoint, getMapTile, getTileColor, isTileWalkable } from '@/game/data/maps';
import { CRAFTING_RECIPES, getAvailableRecipes, canCraftRecipe } from '@/game/data/recipes';
import { getEnchantSuccessRateV2, getEnchantGoldCost, getEnchantMaterialCost, getEnchantLevelColor, getEnchantLevelName, ENCHANT_CONFIG } from '@/game/data/enchanting';
import { canReforge as canReforgeCheck, getReforgeGoldCost, getReforgeStoneCost, REFORGE_AFFIX_POOL, REFORGE_STONE_ITEM_ID } from '@/game/data/reforge';
import type { ReforgeAffix } from '@/game/data/reforge';
import { canAwaken as canAwakenCheck, getAwakeningGoldCost, getAwakeningMaterialCost, AWAKENING_AFFIX_POOL, AWAKENING_MATERIAL_ITEM_ID, MAX_AWAKENING_COUNT } from '@/game/data/awakening';
import type { AwakeningAffix } from '@/game/data/awakening';
import { getSkillLevel, getSkillLevelName, canUnlockAoyi, AOYI_MATERIAL_ITEM_ID, AOYI_MATERIAL_COST } from '@/game/data/skills';
import { PK_MODE_NAMES, PK_MODES } from '@/game/data/pvp';
import { CURRENCY_DEFINITIONS } from '@/game/data/economy';
import { DAILY_QUESTS, WEEKLY_QUESTS, TIMED_ACTIVITIES, ACTIVITY_POINT_TIER_REWARDS } from '@/game/data/activities';
import type { InventoryItem, Equipment } from '@/game/store/gameStore';
import { getCharacterList, deleteCharacter, loadCharacter, generateCharacterId, canCreateCharacter, getMaxCharacters, type CharacterSlot } from '@/game/data/save';
import { getNeigongLevel, getReincarnationData } from '@/game/data/growth';
import DraggableWindow from './DraggableWindow';

// === 角色选择界面（支持多角色） ===
export function CharacterSelect() {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<'warrior' | 'mage' | 'taoist'>('warrior');
  const [showCreate, setShowCreate] = useState(false);
  const [characters, setCharacters] = useState<{ id: string; name: string; classType: 'warrior' | 'mage' | 'taoist'; level: number; lastPlayed: number }[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const selectCharacter = useGameStore(s => s.selectCharacter);
  const loadSavedGame = useGameStore(s => s.loadSavedGame);

  // 加载角色列表
  useEffect(() => {
    setCharacters(getCharacterList());
  }, []);

  const classInfo = {
    warrior: {
      name: '战士', desc: '近战物理职业，高攻高防，擅长近身搏斗',
      color: '#ff4444', icon: '⚔️',
      stats: '攻击:★★★★★ 防御:★★★★ 速度:★★★ 法术:★',
    },
    mage: {
      name: '法师', desc: '远程法术职业，高魔高攻，擅长群体法术',
      color: '#4444ff', icon: '🔮',
      stats: '攻击:★★★ 防御:★★ 速度:★★★ 法术:★★★★★',
    },
    taoist: {
      name: '道士', desc: '辅助召唤职业，攻防平衡，擅长治疗和召唤',
      color: '#44ff44', icon: '☯️',
      stats: '攻击:★★★ 防御:★★★ 速度:★★★★ 法术:★★★★',
    },
  };

  const maxChars = getMaxCharacters();
  const canCreate = canCreateCharacter();

  const handleCreateCharacter = () => {
    if (!name.trim() || !canCreate) return;
    selectCharacter(name.trim(), selectedClass);
  };

  const handleSelectCharacter = (charId: string) => {
    const success = loadSavedGame(charId);
    if (!success) {
      // 如果加载失败，提示
      console.error('Failed to load character:', charId);
    }
  };

  const handleDeleteCharacter = (charId: string) => {
    deleteCharacter(charId);
    setCharacters(getCharacterList());
    setConfirmDeleteId(null);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-black z-50 overflow-auto">
      <div className="w-full max-w-3xl p-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #ffd700, #ff8c00, #ffd700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.3))',
          }}>
            苍月纪元
          </h1>
          <p className="text-gray-400 text-sm mt-2">Cang Yue Chronicle — 传奇世界</p>
        </div>

        {/* 已有角色列表 */}
        {characters.length > 0 && !showCreate && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-amber-400 font-bold text-lg">选择角色</h2>
              <span className="text-gray-500 text-xs">{characters.length}/{maxChars}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {characters.map(char => (
                <div
                  key={char.id}
                  className="p-4 rounded-xl border-2 border-gray-600 bg-gray-800/50 hover:border-amber-400 hover:bg-amber-900/20 transition-all cursor-pointer group relative"
                  onClick={() => handleSelectCharacter(char.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: classInfo[char.classType].color + '20', border: `2px solid ${classInfo[char.classType].color}40` }}>
                      {classInfo[char.classType].icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-base truncate">{char.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm" style={{ color: classInfo[char.classType].color }}>{classInfo[char.classType].name}</span>
                        <span className="text-amber-400 text-sm">Lv.{char.level}</span>
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        上次: {new Date(char.lastPlayed).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  {/* 删除按钮 */}
                  {confirmDeleteId === char.id ? (
                    <div className="absolute top-1 right-1 flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCharacter(char.id); }}
                        className="px-2 py-0.5 bg-red-600 hover:bg-red-500 rounded text-xs text-white"
                      >确认删除</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                        className="px-2 py-0.5 bg-gray-600 hover:bg-gray-500 rounded text-xs text-white"
                      >取消</button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(char.id); }}
                      className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                      title="删除角色"
                    >✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 新建角色 / 已有角色切换按钮 */}
        {canCreate && (
          <div className="mb-6">
            {characters.length > 0 && (
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="w-full py-2 rounded-lg border-2 border-dashed border-amber-600/40 text-amber-400 hover:bg-amber-900/20 hover:border-amber-400 transition-all text-sm"
              >
                {showCreate ? '← 返回角色列表' : '+ 新建角色'}
              </button>
            )}
          </div>
        )}

        {/* 新建角色表单 */}
        {(showCreate || characters.length === 0) && (
          <div className="mb-6">
            {/* 角色名输入 */}
            <div className="mb-4">
              <label className="block text-amber-400 text-sm mb-2 font-medium">角色名称</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="请输入你的角色名"
                maxLength={8}
                className="w-full px-4 py-3 bg-gray-800/80 border-2 border-amber-600/50 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>

            {/* 职业选择 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {(['warrior', 'mage', 'taoist'] as const).map(cls => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedClass === cls
                      ? 'border-amber-400 bg-amber-900/30 scale-105'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-400'
                  }`}
                >
                  <div className="text-4xl mb-2">{classInfo[cls].icon}</div>
                  <div className="text-lg font-bold mb-1" style={{ color: classInfo[cls].color }}>
                    {classInfo[cls].name}
                  </div>
                  <div className="text-xs text-gray-400 leading-relaxed">{classInfo[cls].desc}</div>
                  <div className="text-xs text-gray-500 mt-2">{classInfo[cls].stats}</div>
                </button>
              ))}
            </div>

            {/* 开始按钮 */}
            <button
              onClick={handleCreateCharacter}
              disabled={!name.trim() || !canCreate}
              className="w-full py-4 rounded-xl text-xl font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: name.trim() && canCreate ? 'linear-gradient(135deg, #b8860b, #daa520, #b8860b)' : '#333',
                color: name.trim() && canCreate ? '#1a1a1a' : '#666',
                boxShadow: name.trim() && canCreate ? '0 0 30px rgba(218,165,32,0.4)' : 'none',
              }}
            >
              进入苍月
            </button>
          </div>
        )}

        {!canCreate && characters.length > 0 && (
          <div className="text-center text-red-400 text-sm mb-4">已达最大角色数({maxChars}个)</div>
        )}

        <p className="text-center text-gray-600 text-xs mt-4">WASD/方向键移动 · 鼠标点击交互 · 1-8使用技能</p>
      </div>
    </div>
  );
}

// === 顶部状态栏 ===
export function TopStatusBar() {
  const player = useGameStore(s => s.player);
  const mapDef = MAP_DEFINITIONS[player.mapId];
  const doubleExpActive = useGameStore(s => s.doubleExpActive);

  const exitToCharacterSelect = useGameStore(s => s.exitToCharacterSelect);
  const saveCurrentGame = useGameStore(s => s.saveCurrentGame);

  return (
    <div className="absolute top-0 left-0 right-[96px] z-20 pointer-events-none">
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-black/70 backdrop-blur-sm flex-wrap">
        {/* 玩家信息 */}
        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center border border-amber-500/50 overflow-hidden">
            <img
              src={player.class === 'warrior' ? '/sprites/characters/warrior.png' : player.class === 'mage' ? '/sprites/characters/mage.png' : '/sprites/characters/taoist.png'}
              alt={player.class}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-white font-bold text-sm truncate max-w-20">{player.name}</span>
              <span className="text-amber-400 text-sm">Lv.{player.level}</span>
            </div>
            <div className="text-gray-400 text-xs truncate max-w-24">{mapDef?.name || player.mapId}</div>
          </div>
        </div>

        {/* HP条 */}
        <div className="flex-1 min-w-20 max-w-36">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-red-400 text-xs font-medium">HP</span>
            <span className="text-red-300 text-xs">{Math.floor(player.hp)}/{player.maxHp}</span>
          </div>
          <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden border border-red-900/50">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(player.hp / player.maxHp) * 100}%`,
                background: player.hp / player.maxHp > 0.5
                  ? 'linear-gradient(90deg, #22c55e, #eab308, #ef4444)'
                  : player.hp / player.maxHp > 0.25
                  ? 'linear-gradient(90deg, #eab308, #f97316)'
                  : 'linear-gradient(90deg, #ef4444, #dc2626)',
              }}
            />
          </div>
        </div>

        {/* MP条 */}
        <div className="flex-1 min-w-20 max-w-36">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-blue-400 text-xs font-medium">MP</span>
            <span className="text-blue-300 text-xs">{Math.floor(player.mp)}/{player.maxMp}</span>
          </div>
          <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden border border-blue-900/50">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(player.mp / player.maxMp) * 100}%`,
                background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #22d3ee)',
              }}
            />
          </div>
        </div>

        {/* EXP条 (含2x经验指示) */}
        <div className="flex-1 min-w-24 max-w-40">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-yellow-400 text-xs font-medium">EXP</span>
            <div className="flex items-center gap-0.5">
              {doubleExpActive && <span className="text-yellow-300 text-xs font-bold animate-pulse">✨2x</span>}
              <span className="text-yellow-300 text-xs">{player.exp}/{player.expToLevel}</span>
            </div>
          </div>
          <div className={`h-2 bg-gray-800 rounded-full overflow-hidden border ${doubleExpActive ? 'border-yellow-400/60' : 'border-yellow-900/50'}`}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(player.exp / player.expToLevel) * 100}%`,
                background: doubleExpActive
                  ? 'linear-gradient(90deg, #ffd700, #ff8c00, #ffd700)'
                  : 'linear-gradient(90deg, #7c3aed, #a855f7, #fbbf24)',
              }}
            />
          </div>
        </div>

        {/* 金币 */}
        <div className="flex items-center gap-1 pointer-events-auto shrink-0">
          <span className="text-yellow-400 text-sm">🪙</span>
          <span className="text-yellow-300 text-sm font-medium">{player.gold}</span>
        </div>

        {/* PK模式 + 音效 */}
        <div className="flex items-center gap-1 pointer-events-auto shrink-0">
          <PKModeSelector />
          <SoundControl />
        </div>

        {/* 内功/转生/战魂 */}
        <GrowthStatusBar />

        {/* 坐标 */}
        <div className="text-gray-500 text-[10px] shrink-0">
          ({Math.floor(player.x)},{Math.floor(player.y)})
        </div>

        {/* 保存并退出按钮 */}
        <div className="flex items-center gap-1 pointer-events-auto shrink-0">
          <button
            onClick={() => { saveCurrentGame(); }}
            className="px-1.5 py-0.5 rounded text-[10px] bg-green-900/40 hover:bg-green-800/50 text-green-400 border border-green-600/30 transition-colors"
            title="保存游戏"
          >
            💾保存
          </button>
          <button
            onClick={() => { 
              if (confirm('确定要退出游戏吗？当前进度将自动保存。')) {
                exitToCharacterSelect(); 
              }
            }}
            className="px-1.5 py-0.5 rounded text-[10px] bg-red-900/40 hover:bg-red-800/50 text-red-400 border border-red-600/30 transition-colors"
            title="保存并退出游戏"
          >
            🚪退出
          </button>
          <ResetLayoutButton />
        </div>
      </div>
    </div>
  );
}

// === 技能栏 ===
export function SkillBar() {
  const skillBar = useGameStore(s => s.skillBar);
  const skills = useGameStore(s => s.skills);
  const skillUse = useGameStore(s => s.useSkill);
  const setSkillBar = useGameStore(s => s.setSkillBar);
  const autoAttackEnabled = useGameStore(s => s.autoAttackEnabled);
  const toggleAutoAttack = useGameStore(s => s.toggleAutoAttack);
  const currentWeather = useGameStore(s => s.currentWeather);
  const inventory = useGameStore(s => s.inventory);
  const player = useGameStore(s => s.player);
  const useQuickPotion = useGameStore(s => s.useQuickPotion);

  const now = Date.now();

  // 计算红蓝药水数量与最佳药水显示
  const hpPotionIds = ['hp_potion_small', 'hp_potion_medium', 'hp_potion_large'];
  const mpPotionIds = ['mp_potion_small', 'mp_potion_medium', 'mp_potion_large'];
  const hpCount = inventory
    .filter(i => hpPotionIds.includes(i.itemId))
    .reduce((sum, i) => sum + i.count, 0);
  const mpCount = inventory
    .filter(i => mpPotionIds.includes(i.itemId))
    .reduce((sum, i) => sum + i.count, 0);
  // 当前可用的最高档药水（用于显示图标颜色）
  const bestHp = hpPotionIds.slice().reverse().find(id => inventory.some(i => i.itemId === id));
  const bestMp = mpPotionIds.slice().reverse().find(id => inventory.some(i => i.itemId === id));
  const hpColor = bestHp === 'hp_potion_large' ? '#cc0000' : bestHp === 'hp_potion_medium' ? '#ff2222' : '#ff4444';
  const mpColor = bestMp === 'mp_potion_large' ? '#0000cc' : bestMp === 'mp_potion_medium' ? '#2222ff' : '#4444ff';
  const hpPercent = Math.floor((player.hp / player.maxHp) * 100);
  const mpPercent = Math.floor((player.mp / player.maxMp) * 100);

  const weatherIcons: Record<string, string> = {
    clear: '☀️',
    rain: '🌧️',
    sandstorm: '🏜️',
    snow: '❄️',
    thunder: '⛈️',
  };

  const weatherNames: Record<string, string> = {
    clear: '晴天',
    rain: '下雨',
    sandstorm: '沙暴',
    snow: '下雪',
    thunder: '雷暴',
  };

  // 右键移除技能
  const handleContextMenu = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    if (skillBar[idx]) {
      setSkillBar(idx, '');
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-end gap-2">
        {/* 天气指示器 */}
        <div className="px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg border border-amber-600/30 text-xs text-amber-300 flex items-center gap-1" title={`当前天气: ${weatherNames[currentWeather] || '晴天'}`}>
          <span>{weatherIcons[currentWeather] || '☀️'}</span>
          <span className="hidden sm:inline">{weatherNames[currentWeather] || '晴天'}</span>
        </div>

        {/* 红药快捷槽 (Q键) */}
        <button
          onClick={() => useQuickPotion('hp')}
          disabled={hpCount === 0 || hpPercent >= 100}
          className="relative w-14 h-14 rounded-lg border-2 transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50 group"
          style={{
            borderColor: hpCount > 0 ? hpColor : '#444',
            backgroundColor: hpCount > 0 ? hpColor + '20' : '#1a1a1a',
          }}
          title={`红药快捷键 Q\n当前数量: ${hpCount}\n生命: ${player.hp}/${player.maxHp} (${hpPercent}%)\n点击或按Q使用`}
        >
          <span className="text-2xl">🧪</span>
          {/* 血量进度条 */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800 rounded-b-lg overflow-hidden">
            <div className="h-full transition-all" style={{ width: `${hpPercent}%`, backgroundColor: hpColor }} />
          </div>
          {/* 数量 */}
          <span className="absolute -top-1 -right-1 text-xs font-bold bg-black/90 px-1.5 rounded text-white min-w-6 text-center">
            {hpCount}
          </span>
          {/* 快捷键标识 */}
          <span className="absolute -top-1 -left-1 text-[10px] font-bold bg-amber-700/90 px-1 rounded text-white">
            Q
          </span>
          {/* 红色高亮边框（低血量警告） */}
          {hpPercent < 30 && hpCount > 0 && (
            <div className="absolute inset-0 rounded-lg border-2 border-red-500 animate-pulse pointer-events-none" />
          )}
        </button>

        {/* 蓝药快捷槽 (E键) */}
        <button
          onClick={() => useQuickPotion('mp')}
          disabled={mpCount === 0 || mpPercent >= 100}
          className="relative w-14 h-14 rounded-lg border-2 transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50 group"
          style={{
            borderColor: mpCount > 0 ? mpColor : '#444',
            backgroundColor: mpCount > 0 ? mpColor + '20' : '#1a1a1a',
          }}
          title={`蓝药快捷键 E\n当前数量: ${mpCount}\n魔法: ${player.mp}/${player.maxMp} (${mpPercent}%)\n点击或按E使用`}
        >
          <span className="text-2xl">🧪</span>
          {/* 蓝量进度条 */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800 rounded-b-lg overflow-hidden">
            <div className="h-full transition-all" style={{ width: `${mpPercent}%`, backgroundColor: mpColor }} />
          </div>
          {/* 数量 */}
          <span className="absolute -top-1 -right-1 text-xs font-bold bg-black/90 px-1.5 rounded text-white min-w-6 text-center">
            {mpCount}
          </span>
          {/* 快捷键标识 */}
          <span className="absolute -top-1 -left-1 text-[10px] font-bold bg-blue-700/90 px-1 rounded text-white">
            E
          </span>
        </button>

        {/* 技能栏 */}
        <div className="flex gap-1 p-2 bg-black/70 backdrop-blur-sm rounded-xl border border-amber-600/30">
          {skillBar.map((skillId, idx) => {
            const skill = skillId ? SKILL_DEFINITIONS[skillId] : null;
            const activeSkill = skillId ? skills.find(s => s.id === skillId) : null;
            const isOnCooldown = activeSkill ? now < activeSkill.cooldownEnd : false;
            const cooldownProgress = isOnCooldown && activeSkill
              ? (activeSkill.cooldownEnd - now) / (skill?.cooldown || 1)
              : 0;

            return (
              <button
                key={idx}
                onClick={() => skillId && skillUse(skillId)}
                onContextMenu={(e) => handleContextMenu(e, idx)}
                disabled={!skillId || isOnCooldown}
                className="relative w-12 h-12 rounded-lg border-2 transition-all duration-150 disabled:opacity-50 hover:scale-110 active:scale-95"
                style={{
                  borderColor: skill ? (skill.color || '#666') + '80' : '#333',
                  backgroundColor: skill ? (skill.color || '#444') + '20' : '#1a1a1a',
                }}
                title={skill ? `${skill.name} (${idx + 1})\n${skill.description}\n消耗: ${skill.manaCost}MP\n右键移除` : `快捷键 ${idx + 1}\n在技能面板中分配`}
              >
                {skill ? (
                  <>
                    <span className="text-lg">{skill.icon}</span>
                    {isOnCooldown && (
                      <div
                        className="absolute inset-0 bg-black/60 rounded-lg"
                        style={{
                          clipPath: `inset(${(1 - cooldownProgress) * 100}% 0 0 0)`,
                        }}
                      />
                    )}
                    <span className="absolute -top-1 -right-1 text-xs text-amber-400 font-bold bg-black/80 px-1 rounded">
                      {idx + 1}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-600 text-xs">{idx + 1}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 自动攻击按钮 */}
        <button
          onClick={toggleAutoAttack}
          className={`px-3 py-2 rounded-lg border-2 transition-all duration-150 hover:scale-105 active:scale-95 text-sm font-medium ${
            autoAttackEnabled
              ? 'bg-red-900/60 border-red-500/60 text-red-300 shadow-lg shadow-red-500/20'
              : 'bg-black/70 border-amber-600/30 text-amber-400/60'
          }`}
          title={autoAttackEnabled ? '自动攻击已开启（点击关闭）' : '自动攻击已关闭（点击开启）'}
        >
          <span className="flex items-center gap-1">
            ⚔️<span className="hidden sm:inline">{autoAttackEnabled ? 'ON' : 'AUTO'}</span>
          </span>
        </button>
      </div>
    </div>
  );
}

// === 召唤兽状态指示器 ===
export function SummonStatus() {
  const activeSummon = useGameStore(s => s.activeSummon);
  const dismissSummon = useGameStore(s => s.dismissSummon);

  if (!activeSummon) return null;

  const now = Date.now();
  const remainingMs = Math.max(0, activeSummon.expiresAt - now);
  const remainingSec = Math.floor(remainingMs / 1000);
  const hpPercent = Math.max(0, Math.floor((activeSummon.hp / activeSummon.maxHp) * 100));

  let hpColor = '#44ff44';
  if (hpPercent < 30) hpColor = '#ff4444';
  else if (hpPercent < 60) hpColor = '#ffaa44';

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg border border-blue-500/30">
        <span className="text-sm">{activeSummon.symbol}</span>
        <span className="text-xs text-blue-300 font-medium">{activeSummon.name}</span>
        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${hpPercent}%`, backgroundColor: hpColor }}
          />
        </div>
        <span className="text-xs text-gray-300">{hpPercent}%</span>
        <span className="text-xs text-gray-400">{remainingSec}s</span>
        <button
          onClick={() => dismissSummon()}
          className="text-xs text-red-400 hover:text-red-300 ml-1"
          title="解散召唤兽"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// === 目标信息面板 ===
export function TargetInfo() {
  const selectedTarget = useGameStore(s => s.selectedTarget);
  const monsters = useGameStore(s => s.monsters);
  const npcs = useGameStore(s => s.npcs);
  const bots = useGameStore(s => s.bots);
  const player = useGameStore(s => s.player);
  const bossBelonging = useGameStore(s => s.bossBelonging);
  const clearTarget = useGameStore(s => s.clearTarget);

  if (!selectedTarget) return null;

  let target: { name: string; level?: number; hp?: number; maxHp?: number; color?: string; isBoss?: boolean; id?: string } | null = null;

  if (selectedTarget.type === 'monster') {
    target = monsters.find(m => m.id === selectedTarget.id) ?? null;
  } else if (selectedTarget.type === 'npc') {
    target = npcs.find(n => n.id === selectedTarget.id) ?? null;
  } else if (selectedTarget.type === 'bot') {
    target = bots.find(b => b.id === selectedTarget.id) ?? null;
  }

  if (!target) return null;

  const dist = target.hp !== undefined
    ? Math.floor(Math.sqrt((player.x - (monsters.find(m => m.id === selectedTarget?.id)?.x || 0)) ** 2 + (player.y - (monsters.find(m => m.id === selectedTarget?.id)?.y || 0)) ** 2))
    : 0;

  // Boss归属信息
  const belonging = target.id ? bossBelonging[target.id] : null;
  const isPublicBoss = target.name.startsWith('[全民]');

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
      <div className={`flex items-center gap-3 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-xl border min-w-64 ${
        target.isBoss ? 'border-red-500/60' : 'border-amber-600/30'
      }`}>
        <div
          className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm"
          style={{ borderColor: target.color || '#666', backgroundColor: (target.color || '#333') + '30' }}
        >
          {selectedTarget.type === 'monster' ? '👹' : selectedTarget.type === 'npc' ? '👤' : '🧑'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-bold text-sm ${target.isBoss ? 'text-red-300' : 'text-white'}`}>{target.name}</span>
            {target.level && <span className="text-amber-400 text-xs">Lv.{target.level}</span>}
            {target.isBoss && <span className="text-red-400 text-xs font-bold">BOSS</span>}
          </div>
          {target.hp !== undefined && target.maxHp !== undefined && (
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(target.hp / target.maxHp) * 100}%`,
                  background: target.hp / target.maxHp > 0.5 ? '#44ff44' : target.hp / target.maxHp > 0.25 ? '#ffaa44' : '#ff4444',
                }}
              />
            </div>
          )}
          {/* Boss归属显示 */}
          {target.isBoss && !isPublicBoss && (
            <div className="text-xs mt-1">
              {belonging ? (
                <span className="text-amber-300">归属: {belonging.ownerName}</span>
              ) : (
                <span className="text-gray-400">归属: 无</span>
              )}
            </div>
          )}
          {target.isBoss && isPublicBoss && (
            <div className="text-xs mt-1 text-green-400">全民Boss · 自由拾取</div>
          )}
        </div>
        <button onClick={clearTarget} className="text-gray-400 hover:text-white text-lg">✕</button>
      </div>
    </div>
  );
}

// === 聊天框 ===
type ChatChannel = 'all' | 'system' | 'combat' | 'trade' | 'party';

export function ChatBox() {
  const chatMessages = useGameStore(s => s.chatMessages);
  const sendChat = useGameStore(s => s.sendChat);
  const [input, setInput] = useState('');
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('all');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    if (input.trim()) {
      const msg = input.trim();
      // GM命令: /gm 开启/关闭GM模式
      if (msg.toLowerCase() === '/gm') {
        useGameStore.getState().toggleGMMode();
        // 同时打开 GM 面板（如果已开启 GM 模式则打开，否则关闭）
        const isGM = !useGameStore.getState().gmMode;
        if (isGM) {
          // 刚开启 GM 模式，打开面板
          setTimeout(() => {
            useGameStore.setState({ showGMPanel: true });
          }, 0);
        }
      } else if (msg === '/签到' || msg === '/qiandao') {
        useGameStore.getState().claimLoginReward();
      } else {
        sendChat(msg, 'all');
      }
      setInput('');
    }
  };

  // Filter messages by channel
  const filteredMessages = activeChannel === 'all'
    ? chatMessages
    : chatMessages.filter(msg => msg.channel === activeChannel);

  const recentMessages = filteredMessages.slice(-50);

  // Channel tab definitions
  const channelTabs: { key: ChatChannel; label: string; color: string }[] = [
    { key: 'all', label: '全部', color: '#ffffff' },
    { key: 'system', label: '系统', color: '#ffd700' },
    { key: 'combat', label: '战斗', color: '#ff4444' },
    { key: 'trade', label: '交易', color: '#1eff00' },
    { key: 'party', label: '组队', color: '#44aaff' },
  ];

  // Get message text color based on channel
  const getMsgTextColor = (msg: { channel: string; type: string; color: string }) => {
    if (msg.type === 'boss_announce') return 'text-red-200';
    if (msg.type === 'event_announce') return 'text-yellow-200';
    switch (msg.channel) {
      case 'system': return 'text-yellow-200';
      case 'combat': return 'text-red-200';
      case 'trade': return 'text-green-200';
      case 'party': return 'text-blue-200';
      default: return 'text-gray-300';
    }
  };

  // Format timestamp to HH:MM
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // 拖动相关状态（聊天框支持自由拖动）
  const [chatPos, setChatPos] = useState({ x: 8, y: -1 });
  const [chatSize, setChatSize] = useState({ width: 360, height: 200 });
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const [isResizingChat, setIsResizingChat] = useState(false);
  const chatDragOffset = useRef({ x: 0, y: 0 });
  const chatResizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // 初始化Y坐标（贴近底部）
  useEffect(() => {
    if (chatPos.y === -1) {
      setChatPos({ x: 8, y: window.innerHeight - chatSize.height - 80 });
    }
  }, [chatPos.y, chatSize.height]);

  // 拖动逻辑
  useEffect(() => {
    if (!isDraggingChat) return;
    const handleMove = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - chatDragOffset.current.x));
      const newY = Math.max(40, Math.min(window.innerHeight - 80, e.clientY - chatDragOffset.current.y));
      setChatPos({ x: newX, y: newY });
    };
    const handleUp = () => setIsDraggingChat(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDraggingChat]);

  // 调整大小逻辑
  useEffect(() => {
    if (!isResizingChat) return;
    const handleMove = (e: MouseEvent) => {
      const newW = Math.max(280, chatResizeStart.current.w + (e.clientX - chatResizeStart.current.x));
      const newH = Math.max(140, chatResizeStart.current.h + (e.clientY - chatResizeStart.current.y));
      setChatSize({ width: newW, height: newH });
    };
    const handleUp = () => setIsResizingChat(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isResizingChat]);

  return (
    <div
      className="absolute z-20 flex flex-col bg-black/70 backdrop-blur-sm rounded-xl border border-amber-600/30 overflow-hidden shadow-xl"
      style={{
        left: chatPos.x,
        top: chatPos.y,
        width: chatSize.width,
        height: chatSize.height,
      }}
    >
      {/* 标题栏 - 可拖动 */}
      <div
        className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-amber-900/40 to-transparent border-b border-amber-600/30 cursor-move select-none"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDraggingChat(true);
          chatDragOffset.current = { x: e.clientX - chatPos.x, y: e.clientY - chatPos.y };
        }}
      >
        <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {channelTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveChannel(tab.key)}
              className={`px-2 py-0.5 text-xs rounded-t transition-colors whitespace-nowrap ${
                activeChannel === tab.key
                  ? 'bg-amber-900/40 text-amber-300 font-medium'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              style={activeChannel === tab.key ? { borderBottom: `2px solid ${tab.color}` } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-gray-500 text-[10px] ml-2" title="拖动移动 · 右下角调整大小">⋮⋮</span>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
        {recentMessages.map(msg => (
          <div key={msg.id} className={`text-sm leading-relaxed ${
            msg.type === 'boss_announce' ? 'bg-red-900/30 rounded px-1 py-0.5 border-l-2 border-red-500' :
            msg.type === 'event_announce' ? 'bg-yellow-900/30 rounded px-1 py-0.5 border-l-2 border-yellow-500' :
            ''
          }`}>
            <span className="text-gray-600 mr-1">{formatTime(msg.timestamp)}</span>
            <span className="font-medium" style={{ color: msg.color === '#ffffff' ? '#88ccff' : msg.color }}>
              [{msg.sender}]
            </span>
            <span className={`ml-1 ${getMsgTextColor(msg)}`}>{msg.message}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* 输入框 */}
      <div className="flex gap-1 p-1 border-t border-amber-600/20">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="输入消息或命令（如/gm）..."
          className="flex-1 px-2 py-1 bg-gray-800/80 border border-gray-600/50 rounded text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
        />
        <button onClick={handleSend} className="px-3 py-1 bg-amber-600/80 hover:bg-amber-500 rounded text-xs text-white font-medium transition-colors">
          发送
        </button>
      </div>

      {/* 调整大小手柄 */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsResizingChat(true);
          chatResizeStart.current = {
            x: e.clientX,
            y: e.clientY,
            w: chatSize.width,
            h: chatSize.height,
          };
        }}
        style={{
          background: 'linear-gradient(135deg, transparent 50%, rgba(218, 165, 32, 0.5) 50%)',
        }}
      />
    </div>
  );
}

// === 快捷功能按钮 ===
export function QuickButtons() {
  const toggleInventory = useGameStore(s => s.toggleInventory);
  const toggleCharacter = useGameStore(s => s.toggleCharacter);
  const toggleSkills = useGameStore(s => s.toggleSkills);
  const toggleDungeonPanel = useGameStore(s => s.toggleDungeonPanel);
  const toggleQuestLog = useGameStore(s => s.toggleQuestLog);
  const toggleCraftPanel = useGameStore(s => s.toggleCraftPanel);
  const toggleEnchantPanel = useGameStore(s => s.toggleEnchantPanel);
  const toggleReforgePanel = useGameStore(s => s.toggleReforgePanel);
  const toggleAwakenPanel = useGameStore(s => s.toggleAwakenPanel);
  const toggleAoyiPanel = useGameStore(s => s.toggleAoyiPanel);
  const toggleRepairPanel = useGameStore(s => s.toggleRepairPanel);
  const toggleTeleportPanel = useGameStore(s => s.toggleTeleportPanel);
  const toggleGuidePanel = useGameStore(s => s.toggleGuidePanel);
  const toggleGMPanel = useGameStore(s => s.toggleGMPanel);
  const playerLevel = useGameStore(s => s.player.level);
  const gmMode = useGameStore(s => s.gmMode);
  const [hoveredBtn, setHoveredBtn] = useState<number | null>(null);

  const buttons = [
    { icon: '🎒', iconSrc: '/icons/ui/inventory.png', label: '背包', key: 'I', desc: '查看和管理你的物品与装备', action: toggleInventory },
    { icon: '👤', iconSrc: '/icons/ui/character.png', label: '角色', key: 'C', desc: '查看角色属性、等级和装备信息', action: toggleCharacter },
    { icon: '⚡', iconSrc: '/icons/ui/skills.png', label: '技能', key: 'K', desc: '查看和配置技能栏', action: toggleSkills },
    { icon: '🏰', iconSrc: '/icons/ui/dungeon.png', label: '副本', key: 'J', desc: '进入副本挑战强大Boss', action: toggleDungeonPanel },
    { icon: '📜', iconSrc: '/icons/ui/quest.png', label: '任务', key: 'Q', desc: '查看当前任务和日常活动', action: toggleQuestLog },
    { icon: '🔧', iconSrc: '/icons/ui/craft.png', label: '制作', key: 'P', desc: '使用材料制作装备和道具', action: toggleCraftPanel },
    { icon: '⚒️', iconSrc: '/icons/ui/enchant.png', label: '强化', key: 'E', desc: '强化装备提升属性', action: toggleEnchantPanel },
    { icon: '💫', iconSrc: '/icons/ui/settings.png', label: '重铸', key: '', desc: '重铸装备获得随机词条（Lv42解锁）', action: toggleReforgePanel, reqLevel: 42 },
    { icon: '🌟', iconSrc: '/icons/ui/shop.png', label: '觉醒', key: '', desc: '觉醒装备获得强力属性（Lv45解锁）', action: toggleAwakenPanel, reqLevel: 45 },
    { icon: '🌀', iconSrc: '/icons/ui/map.png', label: '奥义', key: '', desc: '精修技能奥义', action: toggleAoyiPanel },
    { icon: '🔨', iconSrc: '/icons/ui/attack_icon.png', label: '修理', key: '', desc: '修复装备耐久度', action: toggleRepairPanel },
    { icon: '🚀', iconSrc: '/icons/ui/chat.png', label: '传送', key: '', desc: '快速传送到各个地图', action: toggleTeleportPanel },
    { icon: '📖', iconSrc: '/icons/ui/bgm_on.png', label: '攻略', key: '', desc: '新手引导和游戏攻略', action: toggleGuidePanel },
    ...(gmMode ? [{ icon: '⚡', iconSrc: '/icons/ui/pk_mode.png', label: 'GM', key: '', desc: 'GM调试面板', action: toggleGMPanel }] : []),
  ];

  return (
    <div
      className="absolute z-25 select-none"
      style={{ right: 0, top: 56, bottom: 0, width: 96 }}
    >
      {/* 不透明侧栏背景 + 左侧装饰边线，彻底遮挡地图透出 */}
      <div className="relative h-full flex flex-col items-center gap-1.5 pt-2 pb-4 px-1.5 bg-gradient-to-b from-gray-900/97 via-gray-900/95 to-gray-950/97 backdrop-blur-md border-l-2 border-amber-700/50 shadow-[_-4px_0_12px_rgba(0,0,0,0.6)] overflow-y-auto"
           style={{ scrollbarWidth: 'thin' }}>
        <div className="text-[10px] font-bold text-amber-500/90 tracking-wider mb-1">功能</div>
        {buttons.map((btn, idx) => {
          const isLocked = btn.reqLevel ? playerLevel < btn.reqLevel : false;
          const isGM = btn.label === 'GM';
          return (
            <div key={idx} className="relative w-full flex justify-center"
              onMouseEnter={() => setHoveredBtn(idx)}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <button
                onClick={btn.action}
                disabled={!!isLocked}
                className={`w-11 h-11 rounded-lg bg-black/70 backdrop-blur-sm border flex items-center justify-center transition-all hover:scale-110 active:scale-90 ${
                  isLocked ? 'border-gray-700/30 opacity-40 cursor-not-allowed' :
                  isGM ? 'border-yellow-500/60 bg-yellow-900/20 hover:bg-yellow-800/40' :
                  'border-amber-600/40 hover:bg-amber-900/40 hover:border-amber-500/50'
                }`}
                title={btn.label}
              >
                {isLocked ? <span className="text-sm">🔒</span> :
                 btn.iconSrc ? <img src={btn.iconSrc} alt={btn.label} className="w-7 h-7 object-contain drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]" /> :
                 <span className="text-base">{btn.icon}</span>}
              </button>
              {/* Hover tooltip - 显示在按钮左侧，避免出屏 */}
              {hoveredBtn === idx && (
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-48 px-3 py-2.5 bg-gray-900/97 backdrop-blur-md border border-amber-600/50 rounded-lg shadow-2xl pointer-events-none z-50"
                     style={{ animation: 'slideInLeft 0.2s ease-out' }}>
                  <div className="text-amber-400 font-bold text-sm mb-1">{btn.label}</div>
                  <div className="text-gray-300 text-xs leading-relaxed">{btn.desc}</div>
                  {btn.key && <div className="text-amber-600/80 text-xs mt-1.5 flex items-center gap-1">
                    <span className="px-1 py-0.5 bg-amber-900/40 rounded text-amber-400 font-mono text-xs">{btn.key}</span>
                    <span>快捷键</span>
                  </div>}
                  {isLocked && btn.reqLevel && <div className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    🔒 需要 Lv.{btn.reqLevel}
                  </div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === 背包面板 ===
export function InventoryPanel() {
  const showInventory = useGameStore(s => s.showInventory);
  const toggleInventory = useGameStore(s => s.toggleInventory);
  const inventory = useGameStore(s => s.inventory);
  const equipment = useGameStore(s => s.equipment);
  const itemUse = useGameStore(s => s.useItem);
  const equipItem = useGameStore(s => s.equipItem);
  const unequipItem = useGameStore(s => s.unequipItem);
  const sellItem = useGameStore(s => s.sellItem);

  if (!showInventory) return null;

  return (
    <DraggableWindow title="背包" icon="🎒" onClose={toggleInventory} defaultWidth={520} defaultHeight={500}>
      <div className="flex">
        {/* 装备区域 */}
        <div className="w-44 p-3 border-r border-amber-600/20">
          <h3 className="text-amber-300 text-xs font-medium mb-2">装备</h3>
          <div className="space-y-1">
            {(['weapon', 'head', 'body', 'feet', 'necklace', 'ring1', 'ring2', 'bracelet1', 'bracelet2', 'belt', 'medal', 'jade'] as const).map(slot => {
              const item = equipment[slot];
              const itemDef = item ? ITEM_DEFINITIONS[item.itemId] : null;
              return (
                <div
                  key={slot}
                  onClick={() => item && unequipItem(slot)}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-amber-900/30 cursor-pointer transition-colors"
                >
                  <span className="text-xs text-gray-500 w-12">{slotLabel(slot)}</span>
                  {itemDef ? (
                    <span className="text-xs truncate" style={{ color: RARITY_COLORS[itemDef.rarity] }}>
                      {itemDef.icon} {itemDef.name}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-700">空</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 背包物品列表 */}
        <div className="flex-1 p-3">
          <h3 className="text-amber-300 text-xs font-medium mb-2">物品 ({inventory.length}/40)</h3>
          <div className="grid grid-cols-2 gap-1 max-h-80 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {inventory.map(item => {
              const itemDef = ITEM_DEFINITIONS[item.itemId];
              if (!itemDef) return null;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-1 px-2 py-1.5 rounded bg-gray-800/50 hover:bg-gray-700/50 border border-transparent hover:border-amber-600/30 transition-all cursor-pointer group"
                  style={{ borderLeftColor: RARITY_COLORS[itemDef.rarity], borderLeftWidth: 3 }}
                  title={`${itemDef.name}\n${itemDef.description}\n左键: 使用/装备 · 右键: 卖出`}
                  onDoubleClick={() => {
                    if (itemDef.type === 'consumable') itemUse(item.id);
                    else if (itemDef.equipSlot) equipItem(item.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    sellItem(item.id);
                  }}
                >
                  <span className="text-sm">{itemDef.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate" style={{ color: RARITY_COLORS[itemDef.rarity] }}>
                      {itemDef.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.count > 1 ? <span className="text-amber-400 font-bold">x{item.count}</span> : RARITY_NAMES[itemDef.rarity]}
                    </div>
                  </div>
                  <div className="hidden group-hover:flex gap-0.5">
                    {itemDef.type === 'consumable' && (
                      <button onClick={() => itemUse(item.id)} className="px-1 py-0.5 bg-green-700 hover:bg-green-600 rounded text-xs text-white">用</button>
                    )}
                    {itemDef.equipSlot && (
                      <button onClick={() => equipItem(item.id)} className="px-1 py-0.5 bg-blue-700 hover:bg-blue-600 rounded text-xs text-white">穿</button>
                    )}
                    <button onClick={() => sellItem(item.id)} className="px-1 py-0.5 bg-red-700 hover:bg-red-600 rounded text-xs text-white">卖</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
}

function slotLabel(slot: keyof Equipment): string {
  const labels: Record<string, string> = {
    weapon: '武器', head: '头盔', body: '衣服', feet: '靴子',
    necklace: '项链', ring1: '戒指1', ring2: '戒指2',
    bracelet1: '手镯1', bracelet2: '手镯2', belt: '腰带', medal: '勋章', jade: '玉佩',
  };
  return labels[slot] || slot;
}

// === 角色面板 ===
export function CharacterPanel() {
  const showCharacter = useGameStore(s => s.showCharacter);
  const toggleCharacter = useGameStore(s => s.toggleCharacter);
  const player = useGameStore(s => s.player);
  const neigongLevel = useGameStore(s => s.neigongLevel);
  const neigongPillsConsumed = useGameStore(s => s.neigongPillsConsumed);
  const reincarnation = useGameStore(s => s.reincarnation);
  const equipment = useGameStore(s => s.equipment);

  if (!showCharacter) return null;

  const className = player.class === 'warrior' ? '战士' : player.class === 'mage' ? '法师' : '道士';

  // Calculate equipment bonuses
  const equipBonus: Record<string, number> = { attack: 0, defense: 0, accuracy: 0, agility: 0, hp: 0, mp: 0, critRate: 0 };
  const equippedItems = Object.values(equipment).filter(Boolean);
  for (const item of equippedItems) {
    if (!item) continue;
    const itemDef = ITEM_DEFINITIONS[item.itemId];
    if (!itemDef?.stats) continue;
    for (const [key, val] of Object.entries(itemDef.stats)) {
      if (key in equipBonus) equipBonus[key] += val;
    }
    // Premium bonus
    if (item.premiumBonus?.extraStats) {
      for (const [key, val] of Object.entries(item.premiumBonus.extraStats)) {
        if (key in equipBonus) equipBonus[key] += (val as number);
      }
    }
    // Reforge affixes
    if (item.reforgeAffixes) {
      for (const affix of item.reforgeAffixes) {
        if (affix.stat in equipBonus) equipBonus[affix.stat] = (equipBonus[affix.stat] || 0) + affix.value;
      }
    }
  }

  // Calculate set bonuses
  const equippedItemIds = equippedItems.filter(Boolean).map(item => item!.itemId);
  const activeSetBonusStats = calculateActiveSetBonuses(equippedItemIds);
  const activeSetNames: { name: string; count: number; nextBonus: string | null; currentBonus: string | null }[] = [];
  for (const setDef of Object.values(SET_BONUSES)) {
    const count = setDef.pieces.filter(id => equippedItemIds.includes(id)).length;
    if (count >= 2) {
      // 找到当前已激活的最高档加成
      let currentBonus: string | null = null;
      for (const bonus of setDef.bonuses) {
        if (count >= bonus.pieces) {
          currentBonus = `${bonus.pieces}件: ` + Object.entries(bonus.stats).map(([k, v]) => `${k}+${v}`).join(', ');
        }
      }
      // 找到下一个未激活的加成
      let nextBonus: string | null = null;
      for (const bonus of setDef.bonuses) {
        if (count < bonus.pieces) {
          nextBonus = `${bonus.pieces}件: ` + Object.entries(bonus.stats).map(([k, v]) => `${k}+${v}`).join(', ');
          break;
        }
      }
      activeSetNames.push({ name: setDef.setName, count, nextBonus, currentBonus });
    }
  }

  // Neigong progress
  const neigongData = (() => {
    try {
      return getNeigongLevel(neigongPillsConsumed);
    } catch { return null; }
  })();

  // Reincarnation data
  const reincData = (() => {
    try {
      return reincarnation > 0 ? getReincarnationData(reincarnation) : null;
    } catch { return null; }
  })();

  const stats = [
    { label: '等级', value: player.level, color: '#ffd700', bonus: '' },
    { label: '攻击力', value: player.attack, color: '#ff4444', bonus: equipBonus.attack > 0 ? `+${equipBonus.attack}` : '' },
    { label: '防御力', value: player.defense, color: '#4488ff', bonus: equipBonus.defense > 0 ? `+${equipBonus.defense}` : '' },
    { label: '准确', value: player.accuracy, color: '#44ff44', bonus: equipBonus.accuracy > 0 ? `+${equipBonus.accuracy}` : '' },
    { label: '敏捷', value: player.agility, color: '#44ffff', bonus: equipBonus.agility > 0 ? `+${equipBonus.agility}` : '' },
    { label: '幸运', value: player.luck, color: '#ff44ff', bonus: '' },
    { label: '暴击率', value: `${player.critRate}%`, color: '#ffaa00', bonus: equipBonus.critRate > 0 ? `+${equipBonus.critRate}%` : '' },
    { label: '暴击伤害', value: `${player.critDamage}%`, color: '#ff6600', bonus: '' },
    { label: '金币', value: player.gold, color: '#ffd700', bonus: '' },
  ];

  return (
    <DraggableWindow title="角色信息" icon="👤" onClose={toggleCharacter} defaultWidth={380} defaultHeight={580}>
      <div className="p-4 space-y-3">
        {/* Basic info */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center border border-amber-500/50 overflow-hidden">
            <img
              src={player.class === 'warrior' ? '/sprites/characters/warrior.png' : player.class === 'mage' ? '/sprites/characters/mage.png' : '/sprites/characters/taoist.png'}
              alt={player.class}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-white font-bold text-lg">{player.name}</div>
            <div className="text-amber-400 text-sm">{className}</div>
            <div className="text-gray-400 text-xs">HP: {Math.floor(player.hp)}/{player.maxHp} | MP: {Math.floor(player.mp)}/{player.maxMp}</div>
          </div>
        </div>

        {/* Neigong Level */}
        <div className="border border-cyan-800/40 rounded-lg p-2 bg-cyan-900/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-cyan-400 text-xs font-bold">⚡ 内功等级</span>
            <span className="text-cyan-300 text-xs">Lv.{neigongLevel}</span>
          </div>
          {neigongData && neigongData.level > 0 && (
            <>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (neigongPillsConsumed / (neigongData.pillsRequired + 10)) * 100)}%`,
                    background: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
                  }}
                />
              </div>
              <div className="text-cyan-500/70 text-xs mt-0.5">
                减伤: {(neigongData.damageReduction * 100).toFixed(1)}% | 增伤: {(neigongData.damageIncrease * 100).toFixed(1)}%
              </div>
            </>
          )}
          {neigongLevel === 0 && <div className="text-gray-600 text-xs">尚未修炼内功</div>}
        </div>

        {/* Rebirth Level */}
        <div className="border border-amber-800/40 rounded-lg p-2 bg-amber-900/10">
          <div className="flex items-center justify-between">
            <span className="text-amber-400 text-xs font-bold">🔄 转生等级</span>
            <span className="text-amber-300 text-xs">{reincarnation > 0 ? `第${reincarnation}转` : '未转生'}</span>
          </div>
          {reincData && (
            <div className="text-amber-500/70 text-xs mt-0.5">
              属性点+{reincData.attributePointsGranted} | 经验倍率: {reincData.xpMultiplier}x
            </div>
          )}
        </div>

        {/* Set Bonuses */}
        {activeSetNames.length > 0 && (
          <div className="border border-orange-800/40 rounded-lg p-2 bg-orange-900/10">
            <span className="text-orange-400 text-xs font-bold">🛡️ 套装效果</span>
            {activeSetNames.map(({ name, count, currentBonus, nextBonus }) => (
              <div key={name} className="text-xs mt-1 space-y-0.5">
                <div className="text-orange-300 font-medium">{name} ({count}件)</div>
                {currentBonus && (
                  <div className="text-green-400 text-[10px] pl-2">✓ 已激活: {currentBonus}</div>
                )}
                {nextBonus && (
                  <div className="text-gray-500 text-[10px] pl-2">下一档: {nextBonus}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-amber-600/20" />

        {/* Stats with bonus display */}
        <div className="space-y-1.5">
          {stats.map(stat => (
            <div key={stat.label} className="flex items-center justify-between px-3 py-1.5 bg-gray-800/50 rounded">
              <span className="text-gray-400 text-sm">{stat.label}</span>
              <div className="flex items-center gap-1">
                <span className="font-medium text-sm" style={{ color: stat.color }}>{stat.value}</span>
                {stat.bonus && <span className="text-green-400 text-xs">({stat.bonus})</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DraggableWindow>
  );
}

// === 技能面板 ===
export function SkillsPanel() {
  const showSkills = useGameStore(s => s.showSkills);
  const toggleSkills = useGameStore(s => s.toggleSkills);
  const player = useGameStore(s => s.player);
  const skillBar = useGameStore(s => s.skillBar);
  const setSkillBar = useGameStore(s => s.setSkillBar);
  const [assigningSkill, setAssigningSkill] = useState<string | null>(null);

  if (!showSkills) return null;

  const allSkills = Object.values(SKILL_DEFINITIONS).filter(
    s => (s.classReq === player.class || s.classReq === 'all') && player.level >= s.levelReq
  );

  const handleAssignSkill = (skillId: string, slotIndex: number) => {
    setSkillBar(slotIndex, skillId);
    setAssigningSkill(null);
  };

  return (
    <DraggableWindow title="技能" icon="⚡" onClose={toggleSkills} defaultWidth={420} defaultHeight={520}>
      <div className="p-4 max-h-[420px] overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin' }}>
        {/* 技能栏分配提示 */}
        {assigningSkill && (
          <div className="p-2 bg-amber-900/30 border border-amber-500/40 rounded-lg">
            <div className="text-amber-300 text-xs font-bold mb-1">
              📌 选择技能栏位置放置「{SKILL_DEFINITIONS[assigningSkill]?.name}」
            </div>
            <div className="flex gap-1">
              {skillBar.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAssignSkill(assigningSkill, idx)}
                  className="w-10 h-10 rounded-lg border-2 border-amber-500/50 bg-amber-900/20 hover:bg-amber-800/40 flex items-center justify-center text-xs text-amber-400 font-bold transition-all hover:scale-110"
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setAssigningSkill(null)}
                className="px-2 h-10 rounded-lg border border-gray-600 bg-gray-800/50 hover:bg-gray-700/50 text-xs text-gray-400"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 当前技能栏预览 */}
        <div className="p-2 bg-gray-800/50 rounded-lg border border-amber-600/20">
          <div className="text-amber-400 text-xs font-medium mb-1.5">当前技能栏</div>
          <div className="flex gap-1">
            {skillBar.map((skillId, idx) => {
              const skill = skillId ? SKILL_DEFINITIONS[skillId] : null;
              return (
                <div
                  key={idx}
                  className="relative w-10 h-10 rounded-lg border flex items-center justify-center"
                  style={{
                    borderColor: skill ? (skill.color || '#666') + '80' : '#333',
                    backgroundColor: skill ? (skill.color || '#444') + '15' : '#1a1a1a40',
                  }}
                >
                  {skill ? (
                    <span className="text-base">{skill.icon}</span>
                  ) : (
                    <span className="text-gray-600 text-xs">{idx + 1}</span>
                  )}
                  <span className="absolute -top-1 -right-0.5 text-[9px] text-amber-400 bg-black/80 px-0.5 rounded">
                    {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 可用技能列表 */}
        <div className="text-amber-400 text-xs font-medium">可用技能（点击分配到技能栏）</div>
        {allSkills.map(skill => {
          const isInBar = skillBar.includes(skill.id);
          return (
            <div
              key={skill.id}
              className="flex items-center gap-3 px-3 py-2 bg-gray-800/50 rounded-lg border border-transparent hover:border-amber-600/30 transition-colors cursor-pointer"
              onClick={() => {
                if (skill.type !== 'passive') {
                  setAssigningSkill(skill.id);
                }
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl border-2"
                style={{ borderColor: skill.color + '80', backgroundColor: skill.color + '20' }}
              >
                {skill.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">{skill.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">
                    {skill.type === 'passive' ? '被动' : '主动'}
                  </span>
                  {isInBar && <span className="text-xs text-green-400">已在技能栏</span>}
                </div>
                <div className="text-gray-400 text-xs mt-0.5">{skill.description}</div>
                <div className="text-gray-500 text-xs mt-0.5">
                  {skill.manaCost > 0 && `消耗: ${skill.manaCost}MP `}
                  {skill.cooldown > 0 && `冷却: ${(skill.cooldown / 1000).toFixed(1)}s `}
                  {`范围: ${skill.range}`}
                </div>
              </div>
              {skill.type !== 'passive' && (
                <button
                  className="px-2 py-1 bg-amber-700/50 hover:bg-amber-600/60 rounded text-xs text-amber-200 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setAssigningSkill(skill.id); }}
                >
                  📌分配
                </button>
              )}
            </div>
          );
        })}
      </div>
    </DraggableWindow>
  );
}

// === 副本面板 ===
export function DungeonPanel() {
  const showDungeonPanel = useGameStore(s => s.showDungeonPanel);
  const toggleDungeonPanel = useGameStore(s => s.toggleDungeonPanel);
  const enterDungeon = useGameStore(s => s.enterDungeon);
  const player = useGameStore(s => s.player);
  const activeDungeon = useGameStore(s => s.activeDungeon);
  const exitDungeon = useGameStore(s => s.exitDungeon);
  const teleportToMapDirect = useGameStore(s => s.teleportToMapDirect);

  if (!showDungeonPanel) return null;

  const dungeons = getDungeonMapIds().map(id => MAP_DEFINITIONS[id]);
  const allMaps = Object.values(MAP_DEFINITIONS);

  return (
    <DraggableWindow title="副本与传送" icon="🏰" onClose={toggleDungeonPanel} defaultWidth={440} defaultHeight={550}>
      <div className="p-4 space-y-4">
        {activeDungeon && (
          <div className="px-4 py-2 bg-red-900/30 border border-red-600/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-red-300 text-sm">当前副本: {activeDungeon.name}</span>
              <button onClick={exitDungeon} className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-xs text-white">
                退出副本
              </button>
            </div>
            <div className="text-red-400 text-xs mt-1">
              剩余时间: {Math.max(0, Math.floor((activeDungeon.timeLimit - (Date.now() - activeDungeon.startTime) / 1000) / 60))}分钟
            </div>
          </div>
        )}

        {/* 野外地图传送 */}
        <div>
          <h3 className="text-green-400 text-sm font-bold mb-2">🌍 野外地图传送</h3>
          <div className="space-y-1.5">
            {allMaps.filter(m => m.type === 'outdoor').map(map => {
              const canEnter = player.level >= map.levelRange[0];
              const isCurrent = map.id === player.mapId;
              return (
                <div
                  key={map.id}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                    isCurrent ? 'border-amber-400 bg-amber-900/20' :
                    canEnter ? 'border-amber-600/30 bg-gray-800/50 hover:border-amber-400' :
                    'border-gray-700/30 bg-gray-900/50 opacity-50'
                  }`}
                >
                  <div>
                    <span className={`text-sm font-medium ${isCurrent ? 'text-amber-300' : 'text-white'}`}>{map.name}</span>
                    <span className="text-xs text-amber-400 ml-2">Lv.{map.levelRange[0]}-{map.levelRange[1]}</span>
                  </div>
                  {!isCurrent && (
                    <button
                      onClick={() => canEnter && teleportToMapDirect(map.id)}
                      disabled={!canEnter}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        canEnter ? 'bg-purple-700 hover:bg-purple-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      🚀 传送
                    </button>
                  )}
                  {isCurrent && <span className="text-xs text-amber-400">当前位置</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* 副本入口 */}
        <div>
          <h3 className="text-red-400 text-sm font-bold mb-2">🏰 副本入口</h3>
          <div className="space-y-1.5">
            {dungeons.map(dungeon => {
              const canEnter = player.level >= dungeon.levelRange[0];
              return (
                <div
                  key={dungeon.id}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    canEnter
                      ? 'bg-gray-800/50 border-amber-600/30 hover:border-amber-400'
                      : 'bg-gray-900/50 border-gray-700/30 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium text-sm">{dungeon.name}</span>
                      <span className="text-xs text-amber-400 ml-2">Lv.{dungeon.levelRange[0]}-{dungeon.levelRange[1]}</span>
                    </div>
                    <button
                      onClick={() => canEnter && teleportToMapDirect(dungeon.id)}
                      disabled={!canEnter}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        canEnter ? 'bg-purple-700 hover:bg-purple-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      🚀 传送
                    </button>
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {dungeon.width}x{dungeon.height} · 限时30分钟
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
}

// === 任务面板 ===
export function QuestPanel() {
  const showQuestLog = useGameStore(s => s.showQuestLog);
  const toggleQuestLog = useGameStore(s => s.toggleQuestLog);
  const quests = useGameStore(s => s.quests);
  const acceptQuest = useGameStore(s => s.acceptQuest);

  if (!showQuestLog) return null;

  return (
    <DraggableWindow title="任务" icon="📜" onClose={toggleQuestLog} defaultWidth={340} defaultHeight={400}>
      <div className="p-4 space-y-2 max-h-80 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {quests.length === 0 ? (
          <div className="text-gray-500 text-center py-4 text-sm">暂无任务</div>
        ) : quests.map(quest => (
          <div key={quest.id} className={`p-3 rounded-lg border ${
            quest.isComplete ? 'bg-green-900/20 border-green-600/30' : 'bg-gray-800/50 border-amber-600/20'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">{quest.name}</span>
              {quest.isComplete && (
                <button
                  onClick={() => acceptQuest(quest.id)}
                  className="px-2 py-0.5 bg-green-700 hover:bg-green-600 rounded text-xs text-white"
                >
                  领奖
                </button>
              )}
            </div>
            <div className="text-gray-400 text-xs mt-1">{quest.description}</div>
            <div className="mt-1">
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (quest.current / quest.target) * 100)}%`,
                    background: quest.isComplete ? '#44ff44' : '#daa520',
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{quest.current}/{quest.target}</div>
            </div>
            <div className="text-xs text-amber-400 mt-1">奖励: {quest.reward.exp}经验 {quest.reward.gold}金币</div>
          </div>
        ))}
      </div>
    </DraggableWindow>
  );
}

// === NPC对话框 ===
export function NPCDialog() {
  const interactingNPC = useGameStore(s => s.interactingNPC);
  const npcDialogIndex = useGameStore(s => s.npcDialogIndex);
  const nextDialog = useGameStore(s => s.nextDialog);
  const closeNPCDialog = useGameStore(s => s.closeNPCDialog);
  const buyItem = useGameStore(s => s.buyItem);
  const teleportToMap = useGameStore(s => s.teleportToMap);
  const toggleCraftPanel = useGameStore(s => s.toggleCraftPanel);
  const toggleRepairPanel = useGameStore(s => s.toggleRepairPanel);
  const toggleEnchantPanel = useGameStore(s => s.toggleEnchantPanel);
  const toggleReforgePanel = useGameStore(s => s.toggleReforgePanel);
  const toggleAwakenPanel = useGameStore(s => s.toggleAwakenPanel);
  const player = useGameStore(s => s.player);

  if (!interactingNPC) return null;

  // NPC 类型对应的功能按钮
  const npcActionButtons: { label: string; icon: string; action: () => void; show: boolean }[] = [
    { label: '商店', icon: '🛒', action: () => {}, show: !!interactingNPC.shopItems && interactingNPC.shopItems.length > 0 },
    { label: '制作', icon: '🔨', action: () => { closeNPCDialog(); toggleCraftPanel(); }, show: interactingNPC.type === 'craft' || interactingNPC.type === 'shop' },
    { label: '修理', icon: '🔧', action: () => { closeNPCDialog(); toggleRepairPanel(); }, show: interactingNPC.type === 'shop' || interactingNPC.type === 'craft' },
    { label: '强化', icon: '⚒️', action: () => { closeNPCDialog(); toggleEnchantPanel(); }, show: true },
    { label: '重铸', icon: '💫', action: () => { closeNPCDialog(); toggleReforgePanel(); }, show: player.level >= 42 },
    { label: '觉醒', icon: '🌟', action: () => { closeNPCDialog(); toggleAwakenPanel(); }, show: player.level >= 45 },
  ];

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[560px] max-w-[95vw]">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-xl border-2 border-amber-600/40 overflow-hidden shadow-2xl">
        {/* NPC头像和名字 */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-900/50 to-transparent border-b border-amber-600/30">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-3xl border border-amber-500/50">
            {interactingNPC.symbol}
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-base">{interactingNPC.name}</div>
            <div className="text-amber-400 text-xs">{interactingNPC.title}</div>
            <div className="text-gray-500 text-[10px] mt-0.5">类型: {interactingNPC.type}</div>
          </div>
          <button onClick={closeNPCDialog} className="ml-auto text-gray-400 hover:text-white text-xl px-2">✕</button>
        </div>

        {/* 对话内容 */}
        {interactingNPC.dialog.length > 0 && (
          <div className="px-4 py-3 border-b border-amber-600/20 bg-black/20">
            <p className="text-gray-200 text-sm leading-relaxed">
              💬 {interactingNPC.dialog[npcDialogIndex] || interactingNPC.dialog[0]}
            </p>
            {npcDialogIndex < interactingNPC.dialog.length - 1 ? (
              <button onClick={nextDialog} className="mt-2 text-amber-400 text-xs hover:text-amber-300 flex items-center gap-1">
                继续 ▶ <span className="text-gray-500">({npcDialogIndex + 1}/{interactingNPC.dialog.length})</span>
              </button>
            ) : (
              <div className="mt-2 text-gray-500 text-xs">— 对话结束 —</div>
            )}
          </div>
        )}

        {/* 快捷功能按钮 */}
        <div className="px-4 py-2 border-b border-amber-600/20 bg-amber-900/10">
          <div className="text-amber-300 text-xs font-medium mb-2">⚡ 快捷功能</div>
          <div className="flex flex-wrap gap-1.5">
            {npcActionButtons.filter(b => b.show).map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.action}
                className="px-3 py-1.5 bg-gray-800/80 hover:bg-amber-900/50 border border-amber-600/30 hover:border-amber-500/50 rounded-lg text-xs text-gray-200 hover:text-amber-200 transition-colors flex items-center gap-1"
              >
                <span>{btn.icon}</span>
                <span>{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 商店物品 */}
        {interactingNPC.shopItems && interactingNPC.shopItems.length > 0 && (
          <div className="px-4 py-2 border-b border-amber-600/20">
            <h3 className="text-amber-300 text-xs font-medium mb-2">🛒 商店</h3>
            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {interactingNPC.shopItems.map((item, idx) => {
                const itemDef = ITEM_DEFINITIONS[item.itemId];
                if (!itemDef) return null;
                return (
                  <div key={idx} className="flex items-center gap-2 px-2 py-1.5 bg-gray-800/50 rounded hover:bg-gray-700/50 transition-colors">
                    <span className="text-sm">{itemDef.icon || '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate" style={{ color: RARITY_COLORS[itemDef.rarity] }}>{itemDef.name}</div>
                      <div className="text-xs text-amber-400">🪙 {item.price}</div>
                    </div>
                    <button
                      onClick={() => buyItem(item.itemId, item.price)}
                      className="px-2 py-0.5 bg-amber-700 hover:bg-amber-600 rounded text-xs text-white"
                    >
                      购买
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 传送目标 */}
        {interactingNPC.teleportTargets && interactingNPC.teleportTargets.length > 0 && (
          <div className="px-4 py-2">
            <h3 className="text-amber-300 text-xs font-medium mb-2">🚀 传送</h3>
            <div className="flex flex-wrap gap-1">
              {interactingNPC.teleportTargets.map((target, idx) => (
                <button
                  key={idx}
                  onClick={() => teleportToMap(target.mapId, target.cost)}
                  className="px-3 py-1.5 bg-purple-900/50 hover:bg-purple-800/50 rounded-lg border border-purple-600/30 text-xs text-purple-200 transition-colors"
                >
                  {target.name} (🪙{target.cost})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// === 死亡界面 ===
export function DeathScreen() {
  const phase = useGameStore(s => s.phase);
  const respawn = useGameStore(s => s.respawn);
  const player = useGameStore(s => s.player);

  if (phase !== 'dead') return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
      <div className="text-center">
        <div className="text-6xl mb-4">💀</div>
        <h2 className="text-4xl font-bold text-red-500 mb-2">你已阵亡</h2>
        <p className="text-gray-400 mb-6">复活后将恢复50%生命和魔法</p>
        <button
          onClick={respawn}
          className="px-8 py-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 rounded-xl text-white font-bold text-lg transition-all shadow-lg shadow-red-900/50"
        >
          立即复活
        </button>
      </div>
    </div>
  );
}

// === 活动事件横幅 ===
export function EventBanner() {
  const activeTimedEvents = useGameStore(s => s.activeTimedEvents);
  const doubleExpActive = useGameStore(s => s.doubleExpActive);

  if (activeTimedEvents.length === 0) return null;

  // Get event details
  const eventNames: Record<string, { name: string; icon: string; color: string }> = {
    timed_doubleXP: { name: '双倍经验', icon: '✨', color: '#ffd700' },
    timed_publicBoss_14: { name: '全民Boss', icon: '👹', color: '#ff4444' },
    timed_publicBoss_18: { name: '全民Boss', icon: '👹', color: '#ff4444' },
    timed_monsterSiege: { name: '怪物攻城', icon: '⚔️', color: '#ff6600' },
    timed_undergroundTreasure: { name: '地下寻宝', icon: '💎', color: '#aa44ff' },
    timed_tournament: { name: '武道会', icon: '🏆', color: '#ffcc00' },
    timed_crossServerExpedition: { name: '跨服远征', icon: '🌍', color: '#44aaff' },
  };

  return (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 z-15 pointer-events-none">
      <div className="flex items-center gap-1">
        {activeTimedEvents.map(eventId => {
          const info = eventNames[eventId];
          if (!info) return null;
          const isDoubleXP = eventId === 'timed_doubleXP';
          const isBossEvent = eventId.includes('publicBoss') || eventId.includes('Boss');
          return (
            <div
              key={eventId}
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 pointer-events-auto ${
                isDoubleXP ? 'animate-pulse' : ''
              }`}
              style={{
                background: isDoubleXP
                  ? 'linear-gradient(90deg, rgba(255,215,0,0.7), rgba(255,180,0,0.5), rgba(255,215,0,0.7))'
                  : isBossEvent
                  ? 'linear-gradient(90deg, rgba(255,0,0,0.5), rgba(200,0,0,0.3), rgba(255,0,0,0.5))'
                  : 'linear-gradient(90deg, rgba(0,0,0,0.5), rgba(50,50,50,0.6), rgba(0,0,0,0.5))',
                border: isDoubleXP ? '1px solid #ffd700' : isBossEvent ? '1px solid #ff4444' : '1px solid #666',
                color: isDoubleXP ? '#000' : '#fff',
              }}
            >
              <span>{info.icon}</span>
              <span>{info.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === 世界Boss计时器 ===
export function BossTimerPanel() {
  const worldBossSchedule = useGameStore(s => s.worldBossSchedule);
  const showBossTimer = useGameStore(s => s.showBossTimer);
  const toggleBossTimer = useGameStore(s => s.toggleBossTimer);

  const bossNames: Record<string, string> = {
    woma_leader: '沃玛教主',
    zuma_cult_leader: '祖玛教主',
    red_moon_demon: '赤月恶魔',
  };

  const bossColors: Record<string, string> = {
    woma_leader: '#ff6644',
    zuma_cult_leader: '#4488ff',
    red_moon_demon: '#ff2244',
  };

  const formatCountdown = (ms: number): string => {
    if (ms <= 0) return '即将刷新';
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) return `${hours}时${minutes}分`;
    if (minutes > 0) return `${minutes}分${seconds}秒`;
    return `${seconds}秒`;
  };

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* 迷你Boss计时器 - 显示在右上角小地图下方 */}
      <div className="absolute top-44 right-[104px] z-20">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg border border-red-900/40 px-2 py-1 pointer-events-auto">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-red-400 text-xs font-bold">⚔ Boss</span>
            <button onClick={toggleBossTimer} className="text-gray-400 hover:text-white text-xs ml-1">
              {showBossTimer ? '▼' : '▶'}
            </button>
          </div>
          {Object.entries(worldBossSchedule).map(([bossId, entry]) => {
            const name = bossNames[bossId] || bossId;
            const color = bossColors[bossId] || '#999';
            const remaining = entry.nextSpawn - Date.now();
            return (
              <div key={bossId} className="flex items-center gap-1.5 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.isAlive ? '#44ff44' : '#666' }} />
                <span className="text-[10px]" style={{ color }}>{name}</span>
                {entry.isAlive ? (
                  <span className="text-green-400 text-[10px] font-bold">存活</span>
                ) : (
                  <span className="text-gray-400 text-[10px]">{formatCountdown(remaining)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 展开的详细Boss计时器面板 */}
      {showBossTimer && (
        <DraggableWindow title="⚔ 世界Boss日程" icon="⚔" onClose={toggleBossTimer} defaultWidth={280} defaultHeight={350}>
          <div className="p-3 space-y-3">
            {Object.entries(worldBossSchedule).map(([bossId, entry]) => {
              const name = bossNames[bossId] || bossId;
              const color = bossColors[bossId] || '#999';
              const remaining = entry.nextSpawn - Date.now();
              return (
                <div key={bossId} className="bg-gray-900/50 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm" style={{ color }}>{name}</span>
                    {entry.isAlive ? (
                      <span className="text-green-400 text-xs font-bold bg-green-900/30 px-2 py-0.5 rounded">存活中</span>
                    ) : (
                      <span className="text-gray-400 text-xs bg-gray-800 px-2 py-0.5 rounded">等待刷新</span>
                    )}
                  </div>
                  {!entry.isAlive && (
                    <div className="text-xs text-gray-400">
                      刷新倒计时: <span className="text-amber-300">{formatCountdown(remaining)}</span>
                    </div>
                  )}
                  {entry.isAlive && (
                    <div className="text-xs text-green-300">快去挑战吧！</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {bossId === 'woma_leader' && '每日 12:00 / 20:00'}
                    {bossId === 'zuma_cult_leader' && '周三 / 周六 21:30'}
                    {bossId === 'red_moon_demon' && '周日 22:00'}
                  </div>
                </div>
              );
            })}
          </div>
        </DraggableWindow>
      )}
    </>
  );
}

// === 活动面板 ===
export function ActivityPanel() {
  const showActivityPanel = useGameStore(s => s.showActivityPanel);
  const toggleActivityPanel = useGameStore(s => s.toggleActivityPanel);
  const activityPoints = useGameStore(s => s.activityPoints);
  const dailyCompleted = useGameStore(s => s.dailyCompleted);
  const weeklyCompleted = useGameStore(s => s.weeklyCompleted);
  const activityPointRewardsClaimed = useGameStore(s => s.activityPointRewardsClaimed);
  const claimActivityPointReward = useGameStore(s => s.claimActivityPointReward);
  const activeTimedEvents = useGameStore(s => s.activeTimedEvents);
  const doubleExpActive = useGameStore(s => s.doubleExpActive);

  if (!showActivityPanel) return null;

  const dailyCount = Object.values(dailyCompleted).filter(Boolean).length;
  const weeklyCount = Object.values(weeklyCompleted).filter(Boolean).length;

  // Calculate time until next daily reset
  const now = new Date();
  const tomorrowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const msUntilReset = tomorrowMidnight.getTime() - now.getTime();
  const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
  const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={toggleActivityPanel} />
      <div className="relative bg-gray-900/95 backdrop-blur-md rounded-2xl border border-amber-600/40 w-full max-w-md max-h-[80vh] overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-amber-400 font-bold text-lg">📋 活动中心</h2>
          <button onClick={toggleActivityPanel} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {/* 双倍经验状态 */}
        {doubleExpActive && (
          <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border border-yellow-500/40">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <div>
                <div className="text-yellow-300 font-bold text-sm">双倍经验进行中！</div>
                <div className="text-yellow-200/70 text-xs">所有怪物经验翻倍</div>
              </div>
            </div>
          </div>
        )}

        {/* 活跃度进度条 */}
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-300 text-sm font-bold">活跃度</span>
            <span className="text-amber-200 text-sm">{activityPoints} / 100</span>
          </div>
          <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (activityPoints / 100) * 100)}%`,
                background: 'linear-gradient(90deg, #b8860b, #daa520, #ffd700)',
              }}
            />
            {/* Tier markers */}
            {[30, 60, 100].map(tier => (
              <div
                key={tier}
                className="absolute top-0 h-full w-0.5 bg-white/50"
                style={{ left: `${tier}%` }}
              />
            ))}
          </div>
          {/* Tier rewards */}
          <div className="flex justify-between mt-2">
            {[30, 60, 100].map(tier => {
              const claimed = activityPointRewardsClaimed[tier];
              const canClaim = activityPoints >= tier && !claimed;
              return (
                <div key={tier} className="flex flex-col items-center">
                  <button
                    onClick={() => canClaim && claimActivityPointReward(tier)}
                    disabled={!canClaim}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                      claimed ? 'bg-green-700/50 text-green-300' :
                      canClaim ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer' :
                      'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {claimed ? '✓ 已领' : `${tier}点`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 日常任务 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-green-400 text-sm font-bold">📅 日常任务 ({dailyCount})</h3>
            <span className="text-gray-400 text-xs">重置: {hoursUntilReset}时{minutesUntilReset}分</span>
          </div>
          <div className="space-y-1">
            {DAILY_QUESTS.slice(0, 6).map(quest => (
              <div key={quest.id} className="flex items-center justify-between bg-gray-800/30 rounded px-2 py-1">
                <span className={`text-xs ${dailyCompleted[quest.id] ? 'text-green-400' : 'text-gray-300'}`}>
                  {dailyCompleted[quest.id] ? '✅' : '⬜'} {quest.name}
                </span>
                <span className="text-xs text-amber-400/70">+10</span>
              </div>
            ))}
          </div>
        </div>

        {/* 周常任务 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-blue-400 text-sm font-bold">📆 周常任务 ({weeklyCount})</h3>
          </div>
          <div className="space-y-1">
            {WEEKLY_QUESTS.slice(0, 6).map(quest => (
              <div key={quest.id} className="flex items-center justify-between bg-gray-800/30 rounded px-2 py-1">
                <span className={`text-xs ${weeklyCompleted[quest.id] ? 'text-green-400' : 'text-gray-300'}`}>
                  {weeklyCompleted[quest.id] ? '✅' : '⬜'} {quest.name}
                </span>
                <span className="text-xs text-amber-400/70">+20</span>
              </div>
            ))}
          </div>
        </div>

        {/* 当前活跃事件 */}
        {activeTimedEvents.length > 0 && (
          <div className="mb-4">
            <h3 className="text-yellow-400 text-sm font-bold mb-2">🔥 进行中的活动</h3>
            <div className="space-y-1">
              {activeTimedEvents.map(eventId => {
                const activity = TIMED_ACTIVITIES.find(a => a.id === eventId);
                return activity ? (
                  <div key={eventId} className="bg-yellow-900/20 border border-yellow-600/30 rounded px-2 py-1">
                    <div className="text-yellow-300 text-xs font-medium">{activity.name}</div>
                    <div className="text-gray-400 text-xs">{activity.description}</div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// === 活动快捷入口（右侧迷你按钮） ===
export function ActivityQuickButton() {
  const toggleActivityPanel = useGameStore(s => s.toggleActivityPanel);
  const activityPoints = useGameStore(s => s.activityPoints);
  const activeTimedEvents = useGameStore(s => s.activeTimedEvents);
  const doubleExpActive = useGameStore(s => s.doubleExpActive);

  return (
    <div className="absolute right-[104px] bottom-40 z-20 pointer-events-auto">
      <button
        onClick={toggleActivityPanel}
        className="relative w-10 h-10 rounded-lg bg-black/60 backdrop-blur-sm border border-amber-600/40 flex items-center justify-center hover:border-amber-400 transition-all"
      >
        <span className="text-lg">📋</span>
        {/* Activity points badge */}
        <div className="absolute -top-1 -right-1 bg-amber-600 rounded-full w-5 h-5 flex items-center justify-center text-xs text-white font-bold">
          {activityPoints}
        </div>
        {/* Active event indicator */}
        {(activeTimedEvents.length > 0 || doubleExpActive) && (
          <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
        )}
      </button>
    </div>
  );
}

// === Boss血条显示 ===
export function BossHealthBar() {
  const monsters = useGameStore(s => s.monsters);
  const player = useGameStore(s => s.player);
  const selectedTarget = useGameStore(s => s.selectedTarget);

  // Find nearby boss monsters (within 12 tiles)
  const nearbyBosses = monsters.filter(m => {
    if (m.isDead) return false;
    if (m.size < 24) return false; // Only bosses
    const dist = Math.sqrt((m.x - player.x) ** 2 + (m.y - player.y) ** 2);
    return dist < 12;
  });

  if (nearbyBosses.length === 0) return null;

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-25 flex flex-col gap-1.5 w-80">
      {nearbyBosses.slice(0, 3).map(boss => {
        const hpPercent = Math.max(0, (boss.hp / boss.maxHp) * 100);
        const isTargeted = selectedTarget?.id === boss.id;
        return (
          <div key={boss.id} className={`px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg border ${isTargeted ? 'border-red-500/70 shadow-lg shadow-red-500/20' : 'border-red-900/40'}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-red-400 text-xs">💀</span>
                <span className="text-red-300 font-bold text-xs">{boss.name}</span>
                <span className="text-gray-500 text-xs">Lv.{boss.level}</span>
              </div>
              <span className="text-xs text-red-300">{Math.floor(boss.hp)}/{boss.maxHp}</span>
            </div>
            <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden border border-red-900/50">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${hpPercent}%`,
                  background: hpPercent > 50
                    ? 'linear-gradient(90deg, #dc2626, #ef4444, #f87171)'
                    : hpPercent > 25
                    ? 'linear-gradient(90deg, #b91c1c, #dc2626, #ef4444)'
                    : 'linear-gradient(90deg, #7f1d1d, #991b1b, #b91c1c)',
                  boxShadow: hpPercent < 25 ? '0 0 8px rgba(239,68,68,0.5)' : 'none',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// === 主HUD组件 ===
export default function HUD() {
  const phase = useGameStore(s => s.phase);
  const showEnchantPanel = useGameStore(s => s.showEnchantPanel);
  const showCraftPanel = useGameStore(s => s.showCraftPanel);
  const showReforgePanel = useGameStore(s => s.showReforgePanel);
  const showAwakenPanel = useGameStore(s => s.showAwakenPanel);
  const showAoyiPanel = useGameStore(s => s.showAoyiPanel);
  const showRepairPanel = useGameStore(s => s.showRepairPanel);
  const showGMPanel = useGameStore(s => s.showGMPanel);
  const showGuidePanel = useGameStore(s => s.showGuidePanel);
  const showTeleportPanel = useGameStore(s => s.showTeleportPanel);
  const showFullMap = useGameStore(s => s.showFullMap);

  if (phase === 'character_select') {
    return <CharacterSelect />;
  }

  return (
    <>
      <TopStatusBar />
      <BossHealthBar />
      <SkillBar />
      <SummonStatus />
      <TargetInfo />
      <ChatBox />
      <QuickButtons />
      <EventBanner />
      <BossTimerPanel />
      <ActivityQuickButton />
      <InventoryPanel />
      <CharacterPanel />
      <SkillsPanel />
      <DungeonPanel />
      <QuestPanel />
      <NPCDialog />
      <DeathScreen />
      <WorldMapPanel />
      <CombatLogPanel />
      <ActivityPanel />
      {showEnchantPanel && <EnchantPanel />}
      {showCraftPanel && <CraftPanel />}
      {showReforgePanel && <ReforgePanel />}
      {showAwakenPanel && <AwakenPanel />}
      {showAoyiPanel && <AoyiPanel />}
      {showRepairPanel && <RepairPanel />}
      {showGMPanel && <GMPanel />}
      {showGuidePanel && <GuidePanel />}
      {showTeleportPanel && <TeleportPanel />}
      {showFullMap && <FullMapOverlay />}
    </>
  );
}

// === 世界地图面板 ===
export function WorldMapPanel() {
  const [showMap, setShowMap] = useState(false);
  const player = useGameStore(s => s.player);
  const changeMap = useGameStore(s => s.changeMap);

  if (!showMap) {
    return (
      <button
        onClick={() => setShowMap(true)}
        className="absolute top-16 right-[104px] z-20 px-2 py-1 bg-black/60 backdrop-blur-sm rounded border border-amber-600/30 text-xs text-amber-400 hover:bg-amber-900/40 transition-colors"
      >
        🗺️ 大地图
      </button>
    );
  }

  const outdoorMaps = Object.values(MAP_DEFINITIONS).filter(m => m.type === 'outdoor');

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMap(false)} />
      <div className="relative bg-gray-900/95 backdrop-blur-md rounded-xl border-2 border-amber-600/40 overflow-hidden shadow-2xl w-full max-w-xl max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-amber-900/50 to-transparent border-b border-amber-600/30">
          <h2 className="text-amber-400 font-bold">🗺️ 世界地图</h2>
          <button onClick={() => setShowMap(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[70vh]" style={{ scrollbarWidth: 'thin' }}>
          {/* 地图关系图 */}
          <div className="relative mb-4 bg-gray-800/50 rounded-xl p-4" style={{ minHeight: '200px' }}>
            {outdoorMaps.map((map, idx) => {
              const isCurrentMap = map.id === player.mapId;
              const canEnter = player.level >= map.levelRange[0];
              const y = 20 + idx * 40;
              return (
                <div
                  key={map.id}
                  className={`absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg border-2 transition-all cursor-pointer ${
                    isCurrentMap
                      ? 'border-amber-400 bg-amber-900/40 shadow-lg shadow-amber-500/20'
                      : canEnter
                      ? 'border-gray-500 bg-gray-700/50 hover:border-amber-400 hover:bg-gray-600/50'
                      : 'border-gray-700 bg-gray-800/30 opacity-50 cursor-not-allowed'
                  }`}
                  style={{ top: `${y}px`, minWidth: '200px' }}
                  onClick={() => canEnter && !isCurrentMap && changeMap(map.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isCurrentMap ? 'text-amber-300' : 'text-white'}`}>
                      {isCurrentMap && '📍 '}{map.name}
                    </span>
                    <span className="text-xs text-amber-400">Lv.{map.levelRange[0]}-{map.levelRange[1]}</span>
                  </div>
                  {isCurrentMap && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      当前位置 ({Math.floor(player.x)}, {Math.floor(player.y)})
                    </div>
                  )}
                </div>
              );
            })}

            {/* 连接线 */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              {outdoorMaps.slice(0, -1).map((_, idx) => (
                <line
                  key={idx}
                  x1="50%"
                  y1={`${52 + idx * 40}px`}
                  x2="50%"
                  y2={`${72 + idx * 40}px`}
                  stroke="#666"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
              ))}
            </svg>
          </div>

          {/* 地图详情 */}
          <div className="grid grid-cols-2 gap-2">
            {outdoorMaps.map(map => {
              const isCurrent = map.id === player.mapId;
              const canEnter = player.level >= map.levelRange[0];
              return (
                <div
                  key={map.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    isCurrent ? 'border-amber-400 bg-amber-900/20' :
                    canEnter ? 'border-gray-600 bg-gray-800/50' : 'border-gray-700 bg-gray-800/30 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isCurrent ? 'text-amber-300' : 'text-white'}`}>
                      {map.name}
                    </span>
                    <span className="text-xs text-amber-400">Lv.{map.levelRange[0]}-{map.levelRange[1]}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {map.width}×{map.height} · {map.type === 'outdoor' ? '野外' : '副本'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    怪物: {map.monsterIds.length}种 {map.bossIds?.length ? `· Boss: ${map.bossIds.length}个` : ''}
                  </div>
                  <div className="text-xs text-gray-400">
                    NPC: {map.npcIds?.length || 0}个
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// === 战斗日志面板 ===
export function CombatLogPanel() {
  const chatMessages = useGameStore(s => s.chatMessages);
  const [isOpen, setIsOpen] = useState(false);

  // 过滤出战斗相关消息
  const combatMessages = chatMessages.filter(m =>
    m.message.includes('伤害') ||
    m.message.includes('击杀') ||
    m.message.includes('经验') ||
    m.message.includes('金币') ||
    m.message.includes('升级') ||
    m.message.includes('死亡') ||
    m.message.includes('攻击') ||
    m.message.includes('技能') ||
    m.message.includes('装备') ||
    m.message.includes('使用') ||
    m.message.includes('任务')
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-20 right-[104px] z-20 px-2 py-1 bg-black/60 backdrop-blur-sm rounded border border-red-600/30 text-xs text-red-400 hover:bg-red-900/40 transition-colors"
      >
        ⚔️ 战斗日志 {combatMessages.length > 0 && `(${combatMessages.length})`}
      </button>
    );
  }

  return (
    <div className="absolute bottom-20 right-[104px] z-20 w-72">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-xl border border-red-600/40 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-red-900/30 to-transparent border-b border-red-600/20">
          <h3 className="text-red-400 text-xs font-bold">⚔️ 战斗日志</h3>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white text-sm">✕</button>
        </div>
        <div className="max-h-48 overflow-y-auto p-2 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
          {combatMessages.length === 0 ? (
            <div className="text-gray-500 text-xs text-center py-4">暂无战斗记录</div>
          ) : (
            combatMessages.slice(-30).map(msg => (
              <div key={msg.id} className="text-xs leading-relaxed">
                <span className="text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="ml-1" style={{ color: msg.color }}>{msg.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// === 装备强化面板 ===
export function EnchantPanel() {
  const equipment = useGameStore(s => s.equipment);
  const inventory = useGameStore(s => s.inventory);
  const enchantLevels = useGameStore(s => s.enchantLevels);
  const gold = useGameStore(s => s.player.gold);
  const enchantEquipment = useGameStore(s => s.enchantEquipment);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [useProtection, setUseProtection] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const equippedSlots = Object.entries(equipment).filter(([_, item]) => item != null);
  const selectedEquip = selectedSlot ? equipment[selectedSlot as keyof Equipment] : null;
  const currentEnchantLevel = selectedSlot ? (enchantLevels[selectedSlot] || 0) : 0;
  const successRate = getEnchantSuccessRateV2(currentEnchantLevel);
  const goldCost = getEnchantGoldCost(currentEnchantLevel);
  const materialCost = getEnchantMaterialCost(currentEnchantLevel);
  const hasMaterial = inventory.some(i => i.itemId === ENCHANT_CONFIG.materialItemId && i.count >= materialCost);
  const canEnchant = selectedSlot && selectedEquip && gold >= goldCost && hasMaterial && currentEnchantLevel < ENCHANT_CONFIG.maxLevel;

  const handleEnchant = () => {
    if (!selectedSlot) return;
    const enchantResult = enchantEquipment(selectedSlot, useProtection);
    setResult(enchantResult.message);
    setTimeout(() => setResult(null), 3000);
  };

  const slotNames: Record<string, string> = {
    weapon: '武器', head: '头盔', body: '铠甲', feet: '靴子',
    necklace: '项链', ring1: '戒指1', ring2: '戒指2', bracelet1: '手镯1', bracelet2: '手镯2',
    belt: '腰带', medal: '勋章', jade: '玉佩',
  };

  return (
    <DraggableWindow title="⚒️ 装备强化" icon="⚒️" onClose={() => useGameStore.getState().toggleEnchantPanel()} defaultWidth={400} defaultHeight={520}>
      <div className="p-3 space-y-3">
        {/* 装备列表 */}
        <div className="grid grid-cols-3 gap-1.5">
            {equippedSlots.map(([slot, item]) => {
              const enchantLv = enchantLevels[slot] || 0;
              const isSelected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    isSelected ? 'border-purple-400 bg-purple-900/30' : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
                  }`}
                >
                  <div className="text-xs text-gray-400">{slotNames[slot] || slot}</div>
                  <div className="text-xs font-medium truncate" style={{ color: getEnchantLevelColor(enchantLv) }}>
                    {item ? ITEM_DEFINITIONS[item.itemId]?.name || item.itemId : ''}
                    {enchantLv > 0 && ` +${enchantLv}`}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 强化信息 */}
          {selectedEquip && (
            <div className="bg-gray-800/60 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">当前强化</span>
                <span className="text-sm font-bold" style={{ color: getEnchantLevelColor(currentEnchantLevel) }}>
                  {getEnchantLevelName(currentEnchantLevel)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">成功率</span>
                <span className="text-xs text-green-400">{(successRate * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">消耗金币</span>
                <span className={`text-xs ${gold >= goldCost ? 'text-yellow-400' : 'text-red-400'}`}>
                  {goldCost.toLocaleString()} 💰
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{ENCHANT_CONFIG.material}</span>
                <span className={`text-xs ${hasMaterial ? 'text-green-400' : 'text-red-400'}`}>
                  ×{materialCost} {hasMaterial ? '✓' : '✗'}
                </span>
              </div>
              {currentEnchantLevel >= 10 && (
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={useProtection}
                    onChange={(e) => setUseProtection(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-amber-400">使用{ENCHANT_CONFIG.protectItemName}（防破碎）</span>
                </label>
              )}
            </div>
          )}

          {/* 强化按钮 */}
          <button
            onClick={handleEnchant}
            disabled={!canEnchant}
            className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${
              canEnchant
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {currentEnchantLevel >= ENCHANT_CONFIG.maxLevel ? '已满级' : `强化 +${currentEnchantLevel} → +${currentEnchantLevel + 1}`}
          </button>

          {/* 结果提示 */}
          {result && (
            <div className={`text-center text-sm font-bold py-2 rounded-lg ${
              result.includes('成功') ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
            }`}>
              {result}
            </div>
          )}
        </div>
    </DraggableWindow>
  );
}

// === 制作面板 ===
export function CraftPanel() {
  const player = useGameStore(s => s.player);
  const inventory = useGameStore(s => s.inventory);
  const craftItem = useGameStore(s => s.craftItem);

  const recipes = getAvailableRecipes(player.level, inventory.map(i => ({ itemId: i.itemId, quantity: i.count })));

  return (
    <DraggableWindow title="🔧 合成制作" icon="🔧" onClose={() => useGameStore.getState().toggleCraftPanel()} defaultWidth={400} defaultHeight={500}>
      <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {recipes.length === 0 ? (
            <div className="text-gray-500 text-xs text-center py-8">暂无可用配方</div>
          ) : (
            recipes.map(recipe => {
              const canCraft = canCraftRecipe(recipe, inventory.map(i => ({ itemId: i.itemId, quantity: i.count })));
              const hasMaterials = recipe.materials.every(mat => {
                const held = inventory.filter(i => i.itemId === mat.itemId).reduce((sum, i) => sum + i.count, 0);
                return held >= mat.quantity;
              });

              return (
                <div
                  key={recipe.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    canCraft ? 'border-amber-600/40 bg-gray-800/60' : 'border-gray-700 bg-gray-800/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-amber-300">{recipe.name}</span>
                    <span className="text-xs text-gray-400">Lv.{recipe.requiredLevel}</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-2">{recipe.description}</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {recipe.materials.map((mat, i) => {
                      const held = inventory.filter(item => item.itemId === mat.itemId).reduce((sum, item) => sum + item.count, 0);
                      const enough = held >= mat.quantity;
                      return (
                        <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${enough ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                          {ITEM_DEFINITIONS[mat.itemId]?.name || mat.itemId} ×{mat.quantity} ({held})
                        </span>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => craftItem(recipe.id)}
                    disabled={!canCraft}
                    className={`w-full py-1 rounded text-xs font-bold ${
                      canCraft
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {canCraft ? '制作' : '材料不足'}
                  </button>
                </div>
              );
            })
          )}
        </div>
    </DraggableWindow>
  );
}

// === PK模式选择器 ===
export function PKModeSelector() {
  const pkState = useGameStore(s => s.pkState);
  const setPKMode = useGameStore(s => s.setPKMode);
  const [isOpen, setIsOpen] = useState(false);

  const modeColors: Record<string, string> = {
    peace: '#4ade80',
    team: '#60a5fa',
    guild: '#c084fc',
    goodEvil: '#facc15',
    all: '#f87171',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-0.5 rounded text-xs font-bold border"
        style={{
          borderColor: modeColors[pkState.mode] || '#888',
          color: modeColors[pkState.mode] || '#888',
        }}
      >
        {PK_MODE_NAMES[pkState.mode]}
        {pkState.isRedName && ' 🔴'}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-gray-900/95 rounded-lg border border-gray-600 overflow-hidden z-50 min-w-32">
          {PK_MODES.map(mode => (
            <button
              key={mode}
              onClick={() => { setPKMode(mode); setIsOpen(false); }}
              className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-700/50 transition-colors ${
                pkState.mode === mode ? 'bg-gray-700/30' : ''
              }`}
              style={{ color: modeColors[mode] }}
            >
              {PK_MODE_NAMES[mode]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// === 音效控制 ===
export function SoundControl() {
  const soundEnabled = useGameStore(s => s.soundEnabled);
  const bgmEnabled = useGameStore(s => s.bgmEnabled);
  const toggleSound = useGameStore(s => s.toggleSound);
  const toggleBGM = useGameStore(s => s.toggleBGM);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggleSound}
        className={`px-1.5 py-0.5 rounded text-xs ${soundEnabled ? 'text-green-400 bg-green-900/20' : 'text-gray-500 bg-gray-800/50'}`}
      >
        🔊
      </button>
      <button
        onClick={toggleBGM}
        className={`px-1.5 py-0.5 rounded text-xs ${bgmEnabled ? 'text-blue-400 bg-blue-900/20' : 'text-gray-500 bg-gray-800/50'}`}
      >
        🎵
      </button>
    </div>
  );
}

// === 4货币显示 ===
export function CurrencyDisplay() {
  const currency = useGameStore(s => s.currency);

  return (
    <div className="flex items-center gap-2 text-xs">
      <span style={{ color: CURRENCY_DEFINITIONS.gold.color }}>💰{currency.gold.toLocaleString()}</span>
      <span style={{ color: CURRENCY_DEFINITIONS.boundGold.color }}>🔒{currency.boundGold.toLocaleString()}</span>
      <span style={{ color: CURRENCY_DEFINITIONS.ingot.color }}>💎{currency.ingot.toLocaleString()}</span>
      <span style={{ color: CURRENCY_DEFINITIONS.gloryPoints.color }}>🏆{currency.gloryPoints.toLocaleString()}</span>
    </div>
  );
}

// === 内功/转生状态栏 ===
export function GrowthStatusBar() {
  const player = useGameStore(s => s.player);
  const neigongLevel = useGameStore(s => s.neigongLevel);
  const neigongHP = useGameStore(s => s.neigongHP);
  const maxNeigongHP = useGameStore(s => s.maxNeigongHP);
  const reincarnation = useGameStore(s => s.reincarnation);
  const warSoulValue = useGameStore(s => s.warSoulValue);

  if (player.level < 40 && reincarnation === 0 && warSoulValue === 0) return null;

  return (
    <div className="flex items-center gap-2 text-xs">
      {reincarnation > 0 && (
        <span className="text-amber-400">🔄{reincarnation}转</span>
      )}
      {neigongLevel > 0 && (
        <span className="text-cyan-400">
          ⚡内功Lv{neigongLevel}
          {maxNeigongHP > 0 && ` ${neigongHP}/${maxNeigongHP}`}
        </span>
      )}
      {warSoulValue > 0 && player.class === 'warrior' && (
        <span className="text-red-400">🗡️战魂{warSoulValue}</span>
      )}
    </div>
  );
}

// === 重铸面板 ===
export function ReforgePanel() {
  const inventory = useGameStore(s => s.inventory);
  const gold = useGameStore(s => s.player.gold);
  const reforgeEquipment = useGameStore(s => s.reforgeEquipment);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // 只显示紫色及以上装备
  const equippableItems = inventory.filter(i => {
    const def = ITEM_DEFINITIONS[i.itemId];
    return def?.equipSlot && canReforgeCheck(def.rarity);
  });

  const selectedItem = selectedItemId ? inventory.find(i => i.id === selectedItemId) : null;
  const selectedItemDef = selectedItem ? ITEM_DEFINITIONS[selectedItem.itemId] : null;
  const goldCost = selectedItemDef ? getReforgeGoldCost(selectedItemDef.levelReq || 1, selectedItemDef.rarity) : 0;
  const stoneCost = selectedItemDef ? getReforgeStoneCost(selectedItemDef.rarity) : 0;
  const stoneCount = inventory.filter(i => i.itemId === REFORGE_STONE_ITEM_ID).reduce((sum, i) => sum + i.count, 0);
  const canReforgeNow = selectedItem && gold >= goldCost && stoneCount >= stoneCost;

  const handleReforge = () => {
    if (!selectedItemId) return;
    const res = reforgeEquipment(selectedItemId);
    setResult(res.message);
    setTimeout(() => setResult(null), 4000);
  };

  return (
    <DraggableWindow title="💫 装备重铸" icon="💫" onClose={() => useGameStore.getState().toggleReforgePanel()} defaultWidth={400} defaultHeight={520}>
      <div className="p-3 space-y-3">
          <div className="text-xs text-gray-500">选择紫色及以上装备进行重铸，重置随机词条</div>

          {/* 可重铸装备列表 */}
          <div className="max-h-48 overflow-y-auto space-y-1" style={{ scrollbarWidth: 'thin' }}>
            {equippableItems.length === 0 ? (
              <div className="text-gray-500 text-xs text-center py-4">背包中没有可重铸的装备</div>
            ) : equippableItems.map(item => {
              const def = ITEM_DEFINITIONS[item.itemId];
              if (!def) return null;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                    selectedItemId === item.id ? 'border-purple-400 bg-purple-900/30' : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
                  }`}
                >
                  <span className="text-sm">{def.icon}</span>
                  <span className="text-xs truncate" style={{ color: RARITY_COLORS[def.rarity] }}>{def.name}</span>
                  {item.reforgeAffixes && item.reforgeAffixes.length > 0 && (
                    <span className="text-xs text-purple-400">{'✦'.repeat(item.reforgeAffixes.length)}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 重铸信息 */}
          {selectedItemDef && (
            <div className="bg-gray-800/60 rounded-lg p-3 space-y-2">
              <div className="text-xs text-gray-400">当前词条：</div>
              {selectedItem?.reforgeAffixes && selectedItem.reforgeAffixes.length > 0 ? (
                selectedItem.reforgeAffixes.map((a, i) => {
                  const affixDef = (REFORGE_AFFIX_POOL as ReforgeAffix[]).find(p => p.id === a.affixId);
                  return (
                    <div key={i} className="text-xs text-purple-300 pl-2">
                      {affixDef?.name || a.stat} +{a.value}
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-gray-600 pl-2">无词条</div>
              )}
              <div className="border-t border-gray-700 pt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">金币</span>
                  <span className={gold >= goldCost ? 'text-yellow-400' : 'text-red-400'}>{goldCost.toLocaleString()} 💰</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">重铸石</span>
                  <span className={stoneCount >= stoneCost ? 'text-green-400' : 'text-red-400'}>×{stoneCost} ({stoneCount})</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleReforge}
            disabled={!canReforgeNow}
            className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${
              canReforgeNow
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            重铸
          </button>

          {result && (
            <div className={`text-center text-sm font-bold py-2 rounded-lg ${
              result.includes('成功') ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
            }`}>
              {result}
            </div>
          )}
        </div>
    </DraggableWindow>
  );
}

// === 觉醒面板 ===
export function AwakenPanel() {
  const inventory = useGameStore(s => s.inventory);
  const gold = useGameStore(s => s.player.gold);
  const playerClass = useGameStore(s => s.player.class);
  const awakenEquipment = useGameStore(s => s.awakenEquipment);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [showGlow, setShowGlow] = useState(false);

  // 只显示神话装备
  const mythicItems = inventory.filter(i => {
    const def = ITEM_DEFINITIONS[i.itemId];
    return def?.equipSlot && canAwakenCheck(def.rarity);
  });

  const selectedItem = selectedItemId ? inventory.find(i => i.id === selectedItemId) : null;
  const selectedItemDef = selectedItem ? ITEM_DEFINITIONS[selectedItem.itemId] : null;
  const awakenCount = selectedItem?.awakenCount || 0;
  const goldCost = getAwakeningGoldCost(awakenCount);
  const materialCost = getAwakeningMaterialCost(awakenCount);
  const crystalCount = inventory.filter(i => i.itemId === AWAKENING_MATERIAL_ITEM_ID).reduce((sum, i) => sum + i.count, 0);
  const canAwakenNow = selectedItem && gold >= goldCost && crystalCount >= materialCost && awakenCount < MAX_AWAKENING_COUNT;

  // 职业可用词条池
  const classPool = AWAKENING_AFFIX_POOL.filter(a => a.classReq === playerClass || a.classReq === 'all');

  const handleAwaken = () => {
    if (!selectedItemId) return;
    const res = awakenEquipment(selectedItemId);
    setResult(res.message);
    if (res.success) {
      setShowGlow(true);
      setTimeout(() => setShowGlow(false), 2000);
    }
    setTimeout(() => setResult(null), 4000);
  };

  return (
    <DraggableWindow title="🌟 装备觉醒" icon="🌟" onClose={() => useGameStore.getState().toggleAwakenPanel()} defaultWidth={400} defaultHeight={520}>
      <div className={`bg-gray-900/95 backdrop-blur-md rounded-xl border overflow-hidden shadow-2xl transition-all duration-500 ${
        showGlow ? 'border-red-500 shadow-red-500/30 shadow-2xl' : 'border-red-600/50'
      }`}>
        <div className="p-3 space-y-3">
          <div className="text-xs text-gray-500">仅神话(红色)装备可觉醒，解锁职业专属词条</div>

          {/* 可觉醒装备列表 */}
          <div className="max-h-36 overflow-y-auto space-y-1" style={{ scrollbarWidth: 'thin' }}>
            {mythicItems.length === 0 ? (
              <div className="text-gray-500 text-xs text-center py-4">背包中没有神话装备</div>
            ) : mythicItems.map(item => {
              const def = ITEM_DEFINITIONS[item.itemId];
              if (!def) return null;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                    selectedItemId === item.id ? 'border-red-400 bg-red-900/30' : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
                  }`}
                >
                  <span className="text-sm">{def.icon}</span>
                  <span className="text-xs truncate" style={{ color: RARITY_COLORS[def.rarity] }}>{def.name}</span>
                  <span className="text-xs text-red-400 ml-auto">觉醒{item.awakenCount || 0}/{MAX_AWAKENING_COUNT}</span>
                </button>
              );
            })}
          </div>

          {/* 觉醒信息 */}
          {selectedItemDef && (
            <div className="bg-gray-800/60 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">觉醒次数</span>
                <span className="text-red-400">{awakenCount}/{MAX_AWAKENING_COUNT}</span>
              </div>
              <div className="text-xs text-gray-400">已有觉醒词条：</div>
              {(selectedItem?.awakenedAffixes || []).map(id => {
                const affix = AWAKENING_AFFIX_POOL.find(a => a.id === id);
                return affix ? (
                  <div key={id} className="text-xs text-red-300 pl-2">
                    ✦ {affix.name} - {affix.description}
                  </div>
                ) : null;
              })}
              {(!selectedItem?.awakenedAffixes || selectedItem.awakenedAffixes.length === 0) && (
                <div className="text-xs text-gray-600 pl-2">暂无觉醒词条</div>
              )}

              <div className="border-t border-gray-700 pt-2">
                <div className="text-xs text-gray-400 mb-1">可能出现的词条：</div>
                <div className="max-h-24 overflow-y-auto space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
                  {classPool.slice(0, 6).map(a => (
                    <div key={a.id} className="text-xs text-gray-500 pl-2">
                      {a.name} - {a.description}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-700 pt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">金币</span>
                  <span className={gold >= goldCost ? 'text-yellow-400' : 'text-red-400'}>{goldCost.toLocaleString()} 💰</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">觉醒晶石</span>
                  <span className={crystalCount >= materialCost ? 'text-green-400' : 'text-red-400'}>×{materialCost} ({crystalCount})</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleAwaken}
            disabled={!canAwakenNow}
            className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${
              canAwakenNow
                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {awakenCount >= MAX_AWAKENING_COUNT ? '已达最大觉醒' : `觉醒 (${awakenCount}/${MAX_AWAKENING_COUNT})`}
          </button>

          {result && (
            <div className={`text-center text-sm font-bold py-2 rounded-lg ${
              result.includes('成功') ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
            }`}>
              {result}
            </div>
          )}
        </div>
      </div>
    </DraggableWindow>
  );
}

// === 奥义精修面板 ===
export function AoyiPanel() {
  const player = useGameStore(s => s.player);
  const skillProficiency = useGameStore(s => s.skillProficiency);
  const aoyiUnlocked = useGameStore(s => s.aoyiUnlocked);
  const inventory = useGameStore(s => s.inventory);
  const unlockAoyi = useGameStore(s => s.unlockAoyi);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  // 只显示有奥义词条的技能
  const skillsWithAoyi = Object.values(SKILL_DEFINITIONS).filter(
    s => (s.classReq === player.class || s.classReq === 'all') && s.aoyiAffixes && s.aoyiAffixes.length > 0 && player.level >= s.levelReq
  );

  const selectedDef = selectedSkill ? SKILL_DEFINITIONS[selectedSkill] : null;
  const proficiency = selectedSkill ? (skillProficiency[selectedSkill] || 0) : 0;
  const unlockedAffixes = selectedSkill ? (aoyiUnlocked[selectedSkill] || []) : [];
  const scrollCount = inventory.filter(i => i.itemId === AOYI_MATERIAL_ITEM_ID).reduce((sum, i) => sum + i.count, 0);

  return (
    <DraggableWindow title="🌀 奥义精修" icon="🌀" onClose={() => useGameStore.getState().toggleAoyiPanel()} defaultWidth={400} defaultHeight={520}>
      <div className="p-3 space-y-3">
          <div className="text-xs text-gray-500">技能熟练度达到3级后可精修奥义词条</div>

          {/* 技能列表 */}
          <div className="max-h-48 overflow-y-auto space-y-1" style={{ scrollbarWidth: 'thin' }}>
            {skillsWithAoyi.map(skill => {
              const prof = skillProficiency[skill.id] || 0;
              const lv = getSkillLevel(prof);
              const unlocked = aoyiUnlocked[skill.id] || [];
              return (
                <button
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                    selectedSkill === skill.id ? 'border-amber-400 bg-amber-900/30' : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
                  }`}
                >
                  <span className="text-lg">{skill.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium" style={{ color: skill.color }}>{skill.name}</div>
                    <div className="text-xs text-gray-500">Lv.{lv} ({prof}/300) {getSkillLevelName(prof)}</div>
                  </div>
                  <span className="text-xs text-amber-400">{unlocked.length}/{skill.aoyiAffixes?.length || 0}</span>
                </button>
              );
            })}
          </div>

          {/* 奥义详情 */}
          {selectedDef?.aoyiAffixes && (
            <div className="bg-gray-800/60 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">技能等级</span>
                <span className="text-amber-400">{getSkillLevelName(proficiency)} ({proficiency}/300)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">奥义残卷</span>
                <span className={scrollCount >= AOYI_MATERIAL_COST ? 'text-green-400' : 'text-red-400'}>
                  {scrollCount}/{AOYI_MATERIAL_COST}
                </span>
              </div>

              <div className="border-t border-gray-700 pt-2 space-y-1.5">
                {selectedDef.aoyiAffixes.map(affix => {
                  const isUnlocked = unlockedAffixes.includes(affix.id);
                  const canUnlockThis = canUnlockAoyi(proficiency) && !isUnlocked && scrollCount >= AOYI_MATERIAL_COST;
                  return (
                    <div key={affix.id} className={`flex items-center gap-2 p-2 rounded-lg border ${
                      isUnlocked ? 'border-amber-600/50 bg-amber-900/20' : 'border-gray-700 bg-gray-800/30'
                    }`}>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium ${isUnlocked ? 'text-amber-300' : 'text-gray-400'}`}>
                          {affix.name}
                        </div>
                        <div className="text-xs text-gray-500">{affix.description}</div>
                      </div>
                      {isUnlocked ? (
                        <span className="text-xs text-amber-400">✓ 已解锁</span>
                      ) : (
                        <button
                          onClick={() => canUnlockThis && selectedSkill && unlockAoyi(selectedSkill, affix.id)}
                          disabled={!canUnlockThis}
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            canUnlockThis
                              ? 'bg-amber-600 hover:bg-amber-500 text-white'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          解锁
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
    </DraggableWindow>
  );
}

// === 修理面板 ===
export function RepairPanel() {
  const equipment = useGameStore(s => s.equipment);
  const gold = useGameStore(s => s.player.gold);
  const repairEquipment = useGameStore(s => s.repairEquipment);
  const repairAllEquipment = useGameStore(s => s.repairAllEquipment);
  const [result, setResult] = useState<string | null>(null);

  const equippedSlots = Object.entries(equipment).filter(([_, item]) => item != null);

  const handleRepairSlot = (slot: string) => {
    const res = repairEquipment(slot as keyof Equipment);
    if (res.success) {
      setResult(`修理成功，花费${res.cost}金币`);
    } else if (res.cost > 0) {
      setResult('金币不足！');
    }
    setTimeout(() => setResult(null), 3000);
  };

  const handleRepairAll = () => {
    const res = repairAllEquipment();
    if (res.success) {
      setResult(`全部修理完成，共花费${res.totalCost}金币`);
    } else {
      setResult('部分装备金币不足');
    }
    setTimeout(() => setResult(null), 3000);
  };

  return (
    <DraggableWindow title="🔨 装备修理" icon="🔨" onClose={() => useGameStore.getState().toggleRepairPanel()} defaultWidth={340} defaultHeight={480}>
      <div className="p-3 space-y-3">
          <div className="max-h-64 overflow-y-auto space-y-1.5" style={{ scrollbarWidth: 'thin' }}>
            {equippedSlots.map(([slot, item]) => {
              const def = ITEM_DEFINITIONS[item.itemId];
              if (!def) return null;
              const maxDura = def.maxDurability || 100;
              const currentDura = item.currentDurability ?? maxDura;
              const isLow = currentDura / maxDura < 0.2;
              const isBroken = currentDura === 0;
              const rarityMults: Record<string, number> = { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5, mythic: 8 };
              const repairCost = Math.floor((maxDura - currentDura) * (def.levelReq || 1) * (rarityMults[def.rarity] || 1));

              return (
                <div key={slot} className={`p-2 rounded-lg border ${
                  isBroken ? 'border-red-500/50 bg-red-900/20' : isLow ? 'border-yellow-500/50 bg-yellow-900/20' : 'border-gray-700 bg-gray-800/50'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{def.icon}</span>
                      <span className="text-xs" style={{ color: RARITY_COLORS[def.rarity] }}>{def.name}</span>
                    </div>
                    {currentDura < maxDura && (
                      <button
                        onClick={() => handleRepairSlot(slot)}
                        disabled={gold < repairCost}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          gold >= repairCost ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        修理 🪙{repairCost}
                      </button>
                    )}
                  </div>
                  {/* 耐久条 */}
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(currentDura / maxDura) * 100}%`,
                        background: isBroken ? '#ef4444' : isLow ? '#eab308' : currentDura / maxDura < 0.5 ? '#f97316' : '#22c55e',
                      }}
                    />
                  </div>
                  <div className={`text-xs mt-0.5 ${isBroken ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {currentDura}/{maxDura} {isBroken && '(属性失效!)'}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleRepairAll}
            className="w-full py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg transition-all"
          >
            全部修理
          </button>

          {result && (
            <div className={`text-center text-sm font-bold py-2 rounded-lg ${
              result.includes('成功') || result.includes('完成') ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
            }`}>
              {result}
            </div>
          )}
        </div>
    </DraggableWindow>
  );
}

// === GM调试面板 ===
export function GMPanel() {
  const toggleGMPanel = useGameStore(s => s.toggleGMPanel);
  const gmSetMaxLevel = useGameStore(s => s.gmSetMaxLevel);
  const gmAddGold = useGameStore(s => s.gmAddGold);
  const gmAddItem = useGameStore(s => s.gmAddItem);
  const gmAddExp = useGameStore(s => s.gmAddExp);
  const gmFullHpMp = useGameStore(s => s.gmFullHpMp);
  const gmToggleInvincible = useGameStore(s => s.gmToggleInvincible);
  const gmKillAllMonsters = useGameStore(s => s.gmKillAllMonsters);
  const gmMode = useGameStore(s => s.gmMode);
  const player = useGameStore(s => s.player);
  const [goldAmount, setGoldAmount] = useState(10000);
  const [expAmount, setExpAmount] = useState(100000);
  const [selectedItemId, setSelectedItemId] = useState('hp_potion_small');
  const [itemCount, setItemCount] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState<string>('consumable');
  const [itemSearch, setItemSearch] = useState('');

  // 按类别归类所有物品
  const categoryLabels: Record<string, string> = {
    weapon: '⚔️ 武器',
    armor: '🛡️ 防具',
    accessory: '💍 饰品',
    consumable: '🧪 消耗品',
    material: '📦 材料',
    quest: '📜 任务物品',
    special: '✨ 特殊物品',
  };

  // 按类别分组所有物品
  const allItemsByCategory = React.useMemo(() => {
    const grouped: Record<string, { id: string; name: string; rarity: string; icon?: string }[]> = {};
    Object.values(ITEM_DEFINITIONS).forEach(item => {
      if (!grouped[item.type]) grouped[item.type] = [];
      grouped[item.type].push({
        id: item.id,
        name: item.name,
        rarity: item.rarity,
        icon: item.icon,
      });
    });
    // 按稀有度和名称排序
    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    Object.keys(grouped).forEach(cat => {
      grouped[cat].sort((a, b) => {
        const ra = rarityOrder.indexOf(a.rarity);
        const rb = rarityOrder.indexOf(b.rarity);
        if (ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name);
      });
    });
    return grouped;
  }, []);

  // 当前类别下的物品（带搜索过滤）
  const currentCategoryItems = React.useMemo(() => {
    const items = allItemsByCategory[selectedCategory] || [];
    if (!itemSearch.trim()) return items;
    const q = itemSearch.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
  }, [allItemsByCategory, selectedCategory, itemSearch]);

  // 切换类别时重置选中物品
  React.useEffect(() => {
    if (currentCategoryItems.length > 0 && !currentCategoryItems.find(i => i.id === selectedItemId)) {
      setSelectedItemId(currentCategoryItems[0].id);
    }
  }, [selectedCategory, currentCategoryItems, selectedItemId]);

  return (
    <DraggableWindow title="GM调试面板" icon="⚡" onClose={toggleGMPanel} defaultWidth={440} defaultHeight={580}>
      <div className="p-4 space-y-4">
        {/* 状态信息 */}
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
          <div className="text-yellow-400 text-xs font-bold mb-1">⚡ GM调试模式</div>
          <div className="text-yellow-200/70 text-xs">无敌状态: {player.luck >= 999 ? '✅ 已开启' : '❌ 未开启'}</div>
          <div className="text-yellow-200/70 text-xs">等级: Lv.{player.level} | 金币: {player.gold.toLocaleString()}</div>
        </div>

        {/* 快捷操作 */}
        <div>
          <h3 className="text-amber-300 text-xs font-bold mb-2">快捷操作</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={gmSetMaxLevel} className="px-3 py-2 bg-gradient-to-r from-yellow-700 to-amber-700 hover:from-yellow-600 hover:to-amber-600 rounded-lg text-xs font-bold text-white transition-all">
              🎯 满级
            </button>
            <button onClick={gmFullHpMp} className="px-3 py-2 bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-600 hover:to-emerald-600 rounded-lg text-xs font-bold text-white transition-all">
              💚 满血满蓝
            </button>
            <button onClick={gmToggleInvincible} className={`px-3 py-2 rounded-lg text-xs font-bold text-white transition-all ${
              player.luck >= 999 ? 'bg-gradient-to-r from-red-700 to-pink-700' : 'bg-gradient-to-r from-blue-700 to-indigo-700'
            }`}>
              🛡️ {player.luck >= 999 ? '关闭无敌' : '开启无敌'}
            </button>
            <button onClick={gmKillAllMonsters} className="px-3 py-2 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 rounded-lg text-xs font-bold text-white transition-all">
              💀 清除所有怪物
            </button>
          </div>
        </div>

        {/* 添加金币 */}
        <div>
          <h3 className="text-amber-300 text-xs font-bold mb-2">添加金币</h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={goldAmount}
              onChange={e => setGoldAmount(Number(e.target.value))}
              className="flex-1 px-3 py-1.5 bg-gray-800 border border-amber-600/30 rounded-lg text-white text-sm focus:border-amber-400 focus:outline-none"
            />
            <button onClick={() => gmAddGold(goldAmount)} className="px-4 py-1.5 bg-gradient-to-r from-yellow-700 to-amber-700 hover:from-yellow-600 hover:to-amber-600 rounded-lg text-xs font-bold text-white">
              🪙 添加
            </button>
          </div>
          <div className="flex gap-1 mt-1">
            {[1000, 10000, 100000, 1000000].map(amt => (
              <button key={amt} onClick={() => setGoldAmount(amt)} className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300">
                {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}K`}
              </button>
            ))}
          </div>
        </div>

        {/* 添加经验 */}
        <div>
          <h3 className="text-amber-300 text-xs font-bold mb-2">添加经验</h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={expAmount}
              onChange={e => setExpAmount(Number(e.target.value))}
              className="flex-1 px-3 py-1.5 bg-gray-800 border border-amber-600/30 rounded-lg text-white text-sm focus:border-amber-400 focus:outline-none"
            />
            <button onClick={() => gmAddExp(expAmount)} className="px-4 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 rounded-lg text-xs font-bold text-white">
              ✨ 添加
            </button>
          </div>
        </div>

        {/* 添加物品 - 按类别选择 */}
        <div>
          <h3 className="text-amber-300 text-xs font-bold mb-2">添加物品（按类别）</h3>
          <div className="space-y-2">
            {/* 类别选择 */}
            <div className="flex flex-wrap gap-1">
              {Object.keys(allItemsByCategory).map(cat => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setItemSearch(''); }}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    selectedCategory === cat
                      ? 'bg-amber-700 text-white font-bold'
                      : 'bg-gray-700/60 text-gray-300 hover:bg-gray-600/60'
                  }`}
                >
                  {categoryLabels[cat] || cat}
                  <span className="ml-1 text-[10px] opacity-70">({allItemsByCategory[cat].length})</span>
                </button>
              ))}
            </div>

            {/* 搜索框 */}
            <input
              type="text"
              value={itemSearch}
              onChange={e => setItemSearch(e.target.value)}
              placeholder="搜索物品名称或ID..."
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600/50 rounded text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
            />

            {/* 物品下拉列表（当前类别+搜索过滤） */}
            <select
              value={selectedItemId}
              onChange={e => setSelectedItemId(e.target.value)}
              size={6}
              className="w-full px-2 py-1 bg-gray-800 border border-amber-600/30 rounded-lg text-white text-sm focus:border-amber-400 focus:outline-none"
              style={{ minHeight: '120px' }}
            >
              {currentCategoryItems.length === 0 ? (
                <option value="" disabled>没有匹配的物品</option>
              ) : currentCategoryItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.icon || '📦'} {item.name} [{item.rarity}]
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="number"
                value={itemCount}
                onChange={e => setItemCount(Number(e.target.value))}
                min={1}
                max={9999}
                className="flex-1 px-3 py-1.5 bg-gray-800 border border-amber-600/30 rounded-lg text-white text-sm focus:border-amber-400 focus:outline-none"
              />
              <button
                onClick={() => gmAddItem(selectedItemId, itemCount)}
                disabled={!selectedItemId}
                className="px-4 py-1.5 bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 rounded-lg text-xs font-bold text-white"
              >
                📦 添加
              </button>
            </div>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
}

// === 攻略面板（新人引导） ===
export function GuidePanel() {
  const toggleGuidePanel = useGameStore(s => s.toggleGuidePanel);
  const [currentSection, setCurrentSection] = useState(0);

  const sections = [
    {
      title: '🎮 入门指南',
      icon: '🎮',
      content: [
        { subtitle: '移动操作', text: '使用 WASD 或方向键移动角色，也可以鼠标点击地面移动到目标位置。按住方向键可持续移动，点击远处地面可自动寻路到达。手动移动时会自动解除自动攻击锁定，避免被扯回怪物身边，可自由逃离战斗。' },
        { subtitle: '快捷键汇总', text: 'WASD/方向键:移动 · Q:快速红药 · E:快速蓝药 · F:与最近NPC互动 · 1-8:释放技能 · Tab:选中10格内最近怪物 · 空格:普通攻击 · I背包 · C角色 · K技能 · M全地图 · N小地图 · J副本 · Q任务 · ESC:关闭面板/清除目标' },
        { subtitle: '药水快捷槽', text: '技能栏左侧有红蓝药水快捷槽，显示当前数量和血/蓝百分比。点击或按Q/E可智能使用背包中现有的最小档药水（避免浪费大药）。血量低于30%时红药槽会闪烁警示。' },
        { subtitle: 'NPC互动', text: '靠近NPC（15格内）后点击NPC或按F键可打开对话面板。商店类NPC可直接购买物品，制作类NPC可打造装备，传送类NPC可传送到其他地图。' },
      ],
    },
    {
      title: '⚔️ 战斗系统',
      icon: '⚔️',
      content: [
        { subtitle: '职业技能', text: '每个职业拥有独特的技能树：战士擅长近战物理攻击，法师拥有强力法术AOE，道士则能治疗和召唤。将技能拖放到底部技能栏，按数字键1-8快速释放。' },
        { subtitle: '自动攻击', text: '点击技能栏右侧的AUTO按钮开启自动攻击。开启后点击怪物会自动锁定并持续攻击，角色会自动走向攻击范围内的怪物。' },
        { subtitle: '元素克制', text: '游戏存在职业克制关系：战士克制法师、法师克制道士、道士克制战士。克制方对被克制方造成额外30%伤害，合理利用克制关系能让战斗更轻松。' },
      ],
    },
    {
      title: '🎒 装备系统',
      icon: '🎒',
      content: [
        { subtitle: '装备槽位', text: '装备槽包含：武器、头盔、铠甲、靴子、项链、戒指×2、手镯×2、腰带、勋章、玉佩共12个槽位。不同的装备槽提供不同属性加成，集齐套装可获得额外加成。' },
        { subtitle: '套装属性', text: '集齐2/3/5件同套装可激活逐级递增的套装加成。新手期有银杏套装（5级）、中期有比奇套装（15级），后期还有沃玛/祖玛/赤月套装。角色面板会显示当前已激活的套装效果和下一档预期加成。' },
        { subtitle: '装备获取', text: '击杀怪物和Boss是获取装备的主要途径，不同地图掉落不同等级和品质的装备。装备品质从低到高为：白(普通)→绿(优秀)→蓝(稀有)→紫(史诗)→橙(传说)→红(神话)。' },
        { subtitle: '装备强化', text: '使用强化石和金币可以对装备进行强化，提升装备基础属性。强化等级越高成功率越低，+10以上可能破碎，建议使用保护符。' },
        { subtitle: '重铸与觉醒', text: '42级解锁重铸功能，可为紫色以上装备附加随机词条；45级解锁觉醒功能，进一步强化装备。两者都需要消耗特定材料和金币。' },
        { subtitle: '耐久修理', text: '装备在战斗中会损耗耐久度，耐久为0时属性失效。在修理面板可花费金币修复，建议定期维护装备。' },
      ],
    },
    {
      title: '🗺️ 地图与传送',
      icon: '🗺️',
      content: [
        { subtitle: '地图探索', text: '游戏共有5个野外地图和5个副本地图，难度从银杏山谷(1-10级)逐步递增到苍月岛海岸(45-60级)。探索新区域时注意怪物等级，避免进入过高等级区域。' },
        { subtitle: '传送功能', text: '点击右侧快捷栏的"🚀传送"按钮可打开传送面板，直接传送到已解锁的地图和副本，无需走到NPC处。副本面板也提供传送按钮。' },
        { subtitle: '副本挑战', text: '副本地图有时间限制(30分钟)，怪物密度更高、掉落更好。建议组队或等级达标后进入，副本内有Boss守护，击杀可获得丰厚奖励。' },
      ],
    },
    {
      title: '📊 成长系统',
      icon: '📊',
      content: [
        { subtitle: '升级与经验', text: '击杀怪物获取经验值，达到升级所需经验后自动升级。升级后HP、MP、攻击、防御等属性都会提升。活动期间可能开启双倍经验，留意事件横幅提示。' },
        { subtitle: '内功系统', text: '40级后解锁内功系统，消耗内功丹提升内功等级。内功提供额外HP加成，内功HP会在受到攻击时优先消耗，相当于额外的护盾。' },
        { subtitle: '转生系统', text: '满级后可进行转生，转生后等级重置但获得转生点数和属性加成。转生次数越多，角色越强大，同时解锁更多高级内容。' },
        { subtitle: '日常活动', text: '每天有日常任务和周常任务可完成，获取活跃度点数。活跃度达到30/60/100时可领取对应档位的奖励，包括经验、金币和稀有道具。' },
      ],
    },
    {
      title: '⚡ 进阶技巧',
      icon: '⚡',
      content: [
        { subtitle: 'GM调试模式', text: '在聊天框输入"/gm"可开启GM调试模式，开启后右侧快捷栏会出现GM按钮。GM面板提供满级、加金币、加物品、无敌等调试功能，方便快速测试。' },
        { subtitle: '保存与退出', text: '游戏自动每10秒保存一次，也可手动点击顶部状态栏的"💾保存"按钮。点击"🚪退出"按钮可保存并退回到角色选择界面，支持最多20个角色。' },
        { subtitle: '天气系统', text: '游戏中会随机出现天气变化(下雨/沙暴/下雪/雷暴)，不同天气会影响移动速度和战斗效果。留意技能栏左侧的天气指示器。' },
        { subtitle: '世界Boss', text: '右上角显示世界Boss刷新计时，Boss存活时可以前往挑战。Boss掉落比普通怪物丰厚得多，还有专属装备和大量金币奖励。' },
      ],
    },
  ];

  const current = sections[currentSection];

  return (
    <DraggableWindow title="新人攻略" icon="📖" onClose={toggleGuidePanel} defaultWidth={480} defaultHeight={520}>
      <div className="flex h-full">
        {/* 左侧导航 */}
        <div className="w-36 border-r border-amber-600/20 p-2 space-y-1">
          {sections.map((section, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSection(idx)}
              className={`w-full text-left px-2 py-2 rounded-lg text-xs transition-all ${
                currentSection === idx
                  ? 'bg-amber-900/40 border border-amber-400/50 text-amber-300'
                  : 'hover:bg-gray-800/50 text-gray-400 border border-transparent'
              }`}
            >
              {section.icon} {section.title.replace(/^.\s/, '')}
            </button>
          ))}
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 p-4 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <h2 className="text-amber-400 font-bold text-base mb-4">{current.title}</h2>
          <div className="space-y-4">
            {current.content.map((item, idx) => (
              <div key={idx} className="bg-gray-800/40 rounded-lg p-3">
                <h3 className="text-white text-sm font-bold mb-1.5">{item.subtitle}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          {/* 导航按钮 */}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
              disabled={currentSection === 0}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs text-white transition-colors"
            >
              ← 上一页
            </button>
            <button
              onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
              disabled={currentSection === sections.length - 1}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs text-white transition-colors"
            >
              下一页 →
            </button>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
}

// === 传送面板 ===
export function TeleportPanel() {
  const toggleTeleportPanel = useGameStore(s => s.toggleTeleportPanel);
  const teleportToMapDirect = useGameStore(s => s.teleportToMapDirect);
  const player = useGameStore(s => s.player);
  const allMaps = Object.values(MAP_DEFINITIONS);
  const outdoorMaps = allMaps.filter(m => m.type === 'outdoor');
  const dungeonMaps = allMaps.filter(m => m.type === 'dungeon');

  return (
    <DraggableWindow title="地图传送" icon="🚀" onClose={toggleTeleportPanel} defaultWidth={380} defaultHeight={500}>
      <div className="p-4 space-y-4">
        {/* 野外地图 */}
        <div>
          <h3 className="text-green-400 text-sm font-bold mb-2">🌍 野外地图</h3>
          <div className="space-y-1.5">
            {outdoorMaps.map(map => {
              const canEnter = player.level >= map.levelRange[0];
              const isCurrent = map.id === player.mapId;
              return (
                <div
                  key={map.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    isCurrent ? 'border-amber-400 bg-amber-900/20' :
                    canEnter ? 'border-green-600/30 bg-gray-800/50 hover:border-green-400' :
                    'border-gray-700/30 bg-gray-900/50 opacity-50'
                  }`}
                >
                  <div>
                    <div className={`text-sm font-medium ${isCurrent ? 'text-amber-300' : 'text-white'}`}>{map.name}</div>
                    <div className="text-xs text-amber-400">Lv.{map.levelRange[0]}-{map.levelRange[1]} · {map.width}x{map.height}</div>
                  </div>
                  {isCurrent ? (
                    <span className="text-xs text-amber-400 px-2 py-1 bg-amber-900/30 rounded">📍 当前</span>
                  ) : (
                    <button
                      onClick={() => teleportToMapDirect(map.id)}
                      disabled={!canEnter}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        canEnter ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      🚀 传送
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 副本地图 */}
        <div>
          <h3 className="text-red-400 text-sm font-bold mb-2">🏰 副本地图</h3>
          <div className="space-y-1.5">
            {dungeonMaps.map(map => {
              const canEnter = player.level >= map.levelRange[0];
              const isCurrent = map.id === player.mapId;
              return (
                <div
                  key={map.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    isCurrent ? 'border-amber-400 bg-amber-900/20' :
                    canEnter ? 'border-red-600/30 bg-gray-800/50 hover:border-red-400' :
                    'border-gray-700/30 bg-gray-900/50 opacity-50'
                  }`}
                >
                  <div>
                    <div className={`text-sm font-medium ${isCurrent ? 'text-amber-300' : 'text-white'}`}>{map.name}</div>
                    <div className="text-xs text-amber-400">Lv.{map.levelRange[0]}-{map.levelRange[1]}</div>
                  </div>
                  {isCurrent ? (
                    <span className="text-xs text-amber-400 px-2 py-1 bg-amber-900/30 rounded">📍 当前</span>
                  ) : (
                    <button
                      onClick={() => teleportToMapDirect(map.id)}
                      disabled={!canEnter}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        canEnter ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      🚀 传送
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
}

// === 全屏地图覆盖层 ===
export function FullMapOverlay() {
  const toggleFullMap = useGameStore(s => s.toggleFullMap);
  const player = useGameStore(s => s.player);
  const monsters = useGameStore(s => s.monsters);
  const npcs = useGameStore(s => s.npcs);
  const [zoom, setZoom] = useState(2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mapDef = MAP_DEFINITIONS[player.mapId];

  // 地图名/地图切换时重置缩放
  useEffect(() => {
    setZoom(2);
    setOffset({ x: 0, y: 0 });
  }, [player.mapId]);

  // 渲染全屏地图
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapDef) return;

    const container = canvas.parentElement;
    if (!container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tileSize = 4 * zoom;
    const centerX = canvas.width / 2 + offset.x;
    const centerY = canvas.height / 2 + offset.y;
    const playerScreenX = centerX;
    const playerScreenY = centerY;

    // 背景
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制地图瓦片 - 使用getTileColor获取正确的地形颜色
    const startTileX = Math.max(0, Math.floor(-centerX / tileSize) + player.x);
    const startTileY = Math.max(0, Math.floor(-centerY / tileSize) + player.y);
    const endTileX = Math.min(mapDef.width, Math.ceil((canvas.width - centerX) / tileSize) + player.x);
    const endTileY = Math.min(mapDef.height, Math.ceil((canvas.height - centerY) / tileSize) + player.y);

    for (let ty = startTileY; ty < endTileY; ty++) {
      for (let tx = startTileX; tx < endTileX; tx++) {
        const sx = centerX + (tx - player.x) * tileSize;
        const sy = centerY + (ty - player.y) * tileSize;

        const tile = getMapTile(player.mapId, tx, ty);
        ctx.fillStyle = getTileColor(tile);
        ctx.fillRect(sx, sy, tileSize + 0.5, tileSize + 0.5);
      }
    }

    // 绘制NPC标记 - 增大标记和字体
    for (const npc of npcs) {
      const nx = centerX + (npc.x - player.x) * tileSize;
      const ny = centerY + (npc.y - player.y) * tileSize;
      if (nx >= -20 && nx <= canvas.width + 20 && ny >= -20 && ny <= canvas.height + 20) {
        // NPC菱形标记
        ctx.fillStyle = '#44ff44';
        ctx.beginPath();
        ctx.moveTo(nx, ny - 5 * zoom);
        ctx.lineTo(nx + 4 * zoom, ny);
        ctx.lineTo(nx, ny + 5 * zoom);
        ctx.lineTo(nx - 4 * zoom, ny);
        ctx.closePath();
        ctx.fill();
        // NPC名称
        ctx.font = `bold ${Math.max(10, 9 * zoom)}px sans-serif`;
        ctx.fillStyle = '#44ff44';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, nx, ny - 8 * zoom);
        ctx.textAlign = 'start';
      }
    }

    // 绘制怪物标记 - 区分普通怪和Boss
    for (const monster of monsters) {
      if (monster.isDead) continue;
      const mx = centerX + (monster.x - player.x) * tileSize;
      const my = centerY + (monster.y - player.y) * tileSize;
      if (mx >= -20 && mx <= canvas.width + 20 && my >= -20 && my <= canvas.height + 20) {
        if (monster.isBoss) {
          // Boss: 大红点 + 名称
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.arc(mx, my, 4 * zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ff6666';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.font = `bold ${Math.max(10, 9 * zoom)}px sans-serif`;
          ctx.fillStyle = '#ff6666';
          ctx.textAlign = 'center';
          ctx.fillText(monster.name, mx, my - 7 * zoom);
          ctx.textAlign = 'start';
        } else {
          // 普通怪: 小橙点
          ctx.fillStyle = '#ff8800';
          ctx.beginPath();
          ctx.arc(mx, my, 2 * zoom, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 绘制玩家位置
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, 5 * zoom, 0, Math.PI * 2);
    ctx.fill();
    // 玩家位置光晕
    ctx.strokeStyle = '#ffd70088';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, 8 * zoom, 0, Math.PI * 2);
    ctx.stroke();
    // 玩家名称
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${Math.max(11, 10 * zoom)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(player.name, playerScreenX, playerScreenY - 12 * zoom);
    ctx.textAlign = 'start';

    // 地图边界框
    const mapStartX = centerX + (0 - player.x) * tileSize;
    const mapStartY = centerY + (0 - player.y) * tileSize;
    const mapW = mapDef.width * tileSize;
    const mapH = mapDef.height * tileSize;
    ctx.strokeStyle = '#ffd70066';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapStartX, mapStartY, mapW, mapH);
    // 地图名称
    ctx.font = `bold ${Math.max(14, 12 * zoom)}px sans-serif`;
    ctx.fillStyle = '#ffd700cc';
    ctx.textAlign = 'center';
    ctx.fillText(mapDef.name, mapStartX + mapW / 2, mapStartY - 6 * zoom);
    ctx.textAlign = 'start';

  }, [zoom, offset, player, monsters, npcs, mapDef]);

  // 鼠标滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.max(0.5, Math.min(5, zoom - e.deltaY * 0.001));
    setZoom(newZoom);
  };

  // 拖拽移动地图
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/80" onClick={toggleFullMap} />

      {/* 地图画布 */}
      <div className="relative w-full h-full">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-grab"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* 地图信息覆盖层 */}
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="px-4 py-3 bg-black/80 backdrop-blur-sm rounded-lg border border-amber-600/40">
            <div className="text-amber-400 font-bold text-base mb-1">🗺️ {mapDef?.name || '未知地图'}</div>
            <div className="text-gray-300 text-sm">坐标: ({Math.floor(player.x)}, {Math.floor(player.y)})</div>
            <div className="text-gray-400 text-xs mt-1">滚轮缩放 · 拖拽移动</div>
          </div>
        </div>

        {/* 缩放控制 */}
        <div className="absolute top-4 right-4 flex flex-col gap-1 pointer-events-auto">
          <button
            onClick={() => setZoom(Math.min(5, zoom + 0.5))}
            className="w-8 h-8 bg-black/70 hover:bg-amber-900/50 border border-amber-600/40 rounded text-amber-400 text-lg flex items-center justify-center"
          >
            +
          </button>
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.5))}
            className="w-8 h-8 bg-black/70 hover:bg-amber-900/50 border border-amber-600/40 rounded text-amber-400 text-lg flex items-center justify-center"
          >
            −
          </button>
          <button
            onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
            className="w-8 h-8 bg-black/70 hover:bg-amber-900/50 border border-amber-600/40 rounded text-amber-400 text-[10px] flex items-center justify-center"
          >
            重置
          </button>
        </div>

        {/* 图例 */}
        <div className="absolute bottom-4 left-4 pointer-events-none">
          <div className="px-3 py-2 bg-black/80 backdrop-blur-sm rounded-lg border border-amber-600/40 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> 玩家</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> NPC</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> 怪物</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Boss</span>
          </div>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={toggleFullMap}
          className="absolute top-4 right-16 pointer-events-auto px-3 py-1.5 bg-black/70 hover:bg-red-900/50 border border-amber-600/40 rounded-lg text-gray-300 hover:text-white text-sm transition-colors"
        >
          ✕ 关闭 (M)
        </button>
      </div>
    </div>
  );
}

// === 重置布局按钮 ===
export function ResetLayoutButton() {
  const resetUILayout = useGameStore(s => s.resetUILayout);
  const [showConfirm, setShowConfirm] = useState(false);

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => { resetUILayout(); setShowConfirm(false); }}
          className="px-1.5 py-0.5 rounded text-[10px] bg-amber-700 hover:bg-amber-600 text-white transition-colors"
        >
          确认
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-1.5 py-0.5 rounded text-[10px] bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          取消
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-1.5 py-0.5 rounded text-[10px] bg-amber-900/40 hover:bg-amber-800/50 text-amber-400 border border-amber-600/30 transition-colors"
      title="重置所有面板位置和状态"
    >
      🔄复原
    </button>
  );
}