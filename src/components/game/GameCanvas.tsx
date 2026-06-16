'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '@/game/store/gameStore';
import { renderer } from '@/game/engine/renderer';
import { MAP_DEFINITIONS } from '@/game/data/maps';
import type { EntityRenderInfo } from '@/game/engine/renderer';
import { getWeatherCombatModifiers } from '@/game/engine/combatCalc';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const clickTargetRef = useRef<{ x: number; y: number } | null>(null);

  const player = useGameStore(s => s.player);
  const monsters = useGameStore(s => s.monsters);
  const npcs = useGameStore(s => s.npcs);
  const bots = useGameStore(s => s.bots);
  const damageNumbers = useGameStore(s => s.damageNumbers);
  const particles = useGameStore(s => s.particles);
  const groundItems = useGameStore(s => s.groundItems);
  const gameLoop = useGameStore(s => s.gameLoop);
  const movePlayer = useGameStore(s => s.movePlayer);
  const selectTarget = useGameStore(s => s.selectTarget);
  const attackTarget = useGameStore(s => s.attackTarget);
  const skillUse = useGameStore(s => s.useSkill);
  const interactWithNPC = useGameStore(s => s.interactWithNPC);
  const pickupGroundItem = useGameStore(s => s.pickupGroundItem);
  const phase = useGameStore(s => s.phase);
  const showMinimap = useGameStore(s => s.showMinimap);
  const autoAttackEnabled = useGameStore(s => s.autoAttackEnabled);
  const autoAttackTarget = useGameStore(s => s.autoAttackTarget);

  // 当地图改变时清除点击移动目标和按键状态（防止自动行走bug）
  const currentMapId = player.mapId;
  useEffect(() => {
    clickTargetRef.current = null;
    keysRef.current.clear(); // 清除残留按键状态，防止地图切换后角色自动行走
    useGameStore.getState().stopMovement(); // 重置isMoving状态
  }, [currentMapId]);

  // Re-initialize canvas when game phase changes to playing
  useEffect(() => {
    if (phase === 'playing') {
      const canvas = canvasRef.current;
      if (canvas) {
        const container = canvas.parentElement;
        if (container) {
          // 减去右侧 96px 的按钮栏占位，使 canvas 实际像素尺寸与 CSS 显示尺寸一致
          canvas.width = Math.max(320, container.clientWidth - 96);
          canvas.height = container.clientHeight;
          renderer.updateConfig({
            viewportWidth: Math.ceil(canvas.width / 32) + 2,
            viewportHeight: Math.ceil(canvas.height / 32) + 2,
          });
          renderer.init(canvas);
        }
      }
    }
  }, [phase]);

  // 初始化Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      // 减去右侧 96px 的按钮栏占位，使 canvas 实际像素尺寸与 CSS 显示尺寸一致
      canvas.width = Math.max(320, container.clientWidth - 96);
      canvas.height = container.clientHeight;
      renderer.updateConfig({
        viewportWidth: Math.ceil(canvas.width / 32) + 2,
        viewportHeight: Math.ceil(canvas.height / 32) + 2,
      });
    };

    resizeCanvas();
    renderer.init(canvas);
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否在输入框中输入文字（input/textarea/contenteditable）
      const target = e.target as HTMLElement | null;
      const isInputFocused = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );
      // 如果在输入框中，只处理 Escape，不触发任何游戏快捷键
      if (isInputFocused) {
        return;
      }

      keysRef.current.add(e.key.toLowerCase());

      // Q键 - 快速使用红药
      if (e.key.toLowerCase() === 'q') {
        e.preventDefault();
        useGameStore.getState().useQuickPotion('hp');
        return;
      }
      // E键 - 快速使用蓝药
      if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        useGameStore.getState().useQuickPotion('mp');
        return;
      }
      // F键 - 与最近的NPC互动
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const st = useGameStore.getState();
        const px = st.player.x;
        const py = st.player.y;
        let nearestNpc: { id: string; dist: number } | null = null;
        for (const n of st.npcs) {
          const dx = n.x - px;
          const dy = n.y - py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= 15 && (!nearestNpc || dist < nearestNpc.dist)) {
            nearestNpc = { id: n.id, dist };
          }
        }
        if (nearestNpc) {
          st.interactWithNPC(nearestNpc.id);
        } else {
          st.sendChat('附近没有可互动的NPC（需15格内）', 'system');
        }
        return;
      }

      // 技能快捷键
      if (e.key >= '1' && e.key <= '8') {
        const skillBar = useGameStore.getState().skillBar;
        const skillIdx = parseInt(e.key) - 1;
        if (skillBar[skillIdx]) {
          skillUse(skillBar[skillIdx]);
        }
      }

      // 功能键
      switch (e.key.toLowerCase()) {
        case 'i': useGameStore.getState().toggleInventory(); break;
        case 'c': useGameStore.getState().toggleCharacter(); break;
        case 'k': useGameStore.getState().toggleSkills(); break;
        case 'm': useGameStore.getState().toggleFullMap(); break;
        case 'n': useGameStore.getState().toggleMinimap(); break;
        case 'q': useGameStore.getState().toggleQuestLog(); break;
        case 'j': useGameStore.getState().toggleDungeonPanel(); break;
        case 'tab': {
          // Tab键选中10*10范围内最近的怪物
          e.preventDefault();
          const state = useGameStore.getState();
          const px = state.player.x;
          const py = state.player.y;
          let nearest = null as null | { id: string; dist: number };
          for (const m of state.monsters) {
            if (m.isDead) continue;
            const dx = m.x - px;
            const dy = m.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= 10 && (!nearest || dist < nearest.dist)) {
              nearest = { id: m.id, dist };
            }
          }
          if (nearest) {
            state.selectTarget('monster', nearest.id);
            // 开启自动攻击
            if (state.autoAttackEnabled) {
              state.setAutoAttackTarget(nearest.id);
            }
          }
          break;
        }
        case 'escape': {
          const state = useGameStore.getState();
          if (state.interactingNPC) {
            state.closeNPCDialog();
          } else {
            state.clearTarget();
          }
          break;
        }
        case ' ': {
          e.preventDefault();
          attackTarget();
          break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [attackTarget, skillUse]);

  // 鼠标点击
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 防止事件冒泡到UI层
    e.stopPropagation();

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { player, monsters, npcs, bots, autoAttackEnabled } = useGameStore.getState();
    const tileSize = 32;
    const vpHalfW = Math.floor(canvas.width / 32 / 2);
    const vpHalfH = Math.floor(canvas.height / 32 / 2);

    // 计算世界坐标
    const worldX = Math.floor(player.x - vpHalfW + mouseX / tileSize);
    const worldY = Math.floor(player.y - vpHalfH + mouseY / tileSize);

    // 检查是否点击了实体
    let clicked = false;

    // 优先检查地面物品（拾取）
    for (const gi of useGameStore.getState().groundItems) {
      const screenX = (gi.x - player.x + vpHalfW) * tileSize;
      const screenY = (gi.y - player.y + vpHalfH) * tileSize;
      const dist = Math.sqrt((mouseX - screenX) ** 2 + (mouseY - screenY) ** 2);
      if (dist < 24) {
        // 点击物品：先尝试拾取，如果距离远会自动走过去
        const worldDist = Math.sqrt((gi.x - player.x) ** 2 + (gi.y - player.y) ** 2);
        if (worldDist <= 3) {
          pickupGroundItem(gi.id);
        } else {
          // 设置自动寻路到物品位置
          clickTargetRef.current = { x: gi.x, y: gi.y };
          useGameStore.getState().sendChat(`前往拾取 ${gi.name}...`, 'system');
        }
        clicked = true;
        break;
      }
    }

    // 检查NPC
    if (!clicked) {
      for (const npc of npcs) {
        const screenX = (npc.x - player.x + vpHalfW) * tileSize;
        const screenY = (npc.y - player.y + vpHalfH) * tileSize;
        const dist = Math.sqrt((mouseX - screenX) ** 2 + (mouseY - screenY) ** 2);
        if (dist < 32) {
          interactWithNPC(npc.id);
          clicked = true;
          break;
        }
      }
    }

    // 检查怪物
    if (!clicked) {
      for (const monster of monsters) {
        if (monster.isDead) continue;
        const screenX = (monster.x - player.x + vpHalfW) * tileSize;
        const screenY = (monster.y - player.y + vpHalfH) * tileSize;
        const dist = Math.sqrt((mouseX - screenX) ** 2 + (mouseY - screenY) ** 2);
        if (dist < 32) {
          selectTarget('monster', monster.id);
          // 自动攻击：点击怪物时设置自动攻击目标
          if (autoAttackEnabled) {
            useGameStore.getState().setAutoAttackTarget(monster.id);
          }
          clicked = true;
          break;
        }
      }
    }

    // 检查假玩家
    if (!clicked) {
      for (const bot of bots) {
        const screenX = (bot.x - player.x + vpHalfW) * tileSize;
        const screenY = (bot.y - player.y + vpHalfH) * tileSize;
        const dist = Math.sqrt((mouseX - screenX) ** 2 + (mouseY - screenY) ** 2);
        if (dist < 32) {
          selectTarget('bot', bot.id);
          clicked = true;
          break;
        }
      }
    }

    // 如果没有点击实体，设置移动目标
    if (!clicked) {
      clickTargetRef.current = { x: worldX + 0.5, y: worldY + 0.5 };
    }
  }, [interactWithNPC, selectTarget]);

  // 游戏主循环
  useEffect(() => {
    const loop = (timestamp: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const deltaTime = Math.min(timestamp - lastTimeRef.current, 100); // 最大100ms
      lastTimeRef.current = timestamp;

      const state = useGameStore.getState();
      if (state.phase === 'playing') {
        // 天气移动速度修正
        let speedMult = 1.0;
        try {
          const weatherModifiers = getWeatherCombatModifiers(state.currentWeather);
          speedMult = weatherModifiers.movementSpeedMultiplier || 1.0;
        } catch {
          speedMult = 1.0;
        }

        // 处理键盘移动
        const keys = keysRef.current;
        let dx = 0, dy = 0;
        const moveSpeed = 0.32 * speedMult; // 略微提速，让走位更流畅

        if (keys.has('w') || keys.has('arrowup')) dy -= moveSpeed;
        if (keys.has('s') || keys.has('arrowdown')) dy += moveSpeed;
        if (keys.has('a') || keys.has('arrowleft')) dx -= moveSpeed;
        if (keys.has('d') || keys.has('arrowright')) dx += moveSpeed;

        if (dx !== 0 || dy !== 0) {
          // 对角线移动速度归一化
          if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
          }
          // 手动移动时，清除自动攻击目标，避免被auto-walk拉回怪物身边
          // （这样玩家可以自由逃离战斗；松开按键后autoAttack会自动重新选怪）
          if (state.autoAttackTarget) {
            state.setAutoAttackTarget(null);
          }
          state.movePlayer(dx, dy);
          clickTargetRef.current = null; // 手动移动取消点击移动
        } else if (!clickTargetRef.current) {
          // 没有按键也没有点击目标时，停止移动状态
          if (state.player.isMoving) {
            state.stopMovement();
          }
        }

        // 点击移动
        if (clickTargetRef.current) {
          const target = clickTargetRef.current;
          const pdx = target.x - state.player.x;
          const pdy = target.y - state.player.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

          if (pdist < 0.3) {
            clickTargetRef.current = null;
            state.stopMovement();
          } else {
            const step = Math.min(state.player.speed * 0.016 * speedMult, pdist);
            const nx = state.player.x + (pdx / pdist) * step;
            const ny = state.player.y + (pdy / pdist) * step;
            state.movePlayer((pdx / pdist) * step, (pdy / pdist) * step);

            // 检查是否到达了地面物品附近（自动拾取）
            const nearItem = state.groundItems.find(gi => {
              const d = Math.sqrt((gi.x - nx) ** 2 + (gi.y - ny) ** 2);
              return d < 1.5;
            });
            if (nearItem && pdist < 3) {
              state.pickupGroundItem(nearItem.id);
              clickTargetRef.current = null;
              state.stopMovement();
            }
          }
        }

        // 自动攻击：如果目标不在攻击范围但在自动攻击范围，自动走向目标
        if (state.autoAttackEnabled && state.autoAttackTarget) {
          const targetMonster = state.monsters.find(m => m.id === state.autoAttackTarget && !m.isDead);
          if (targetMonster) {
            const autoRange = 8;
            const dist = Math.sqrt((state.player.x - targetMonster.x) ** 2 + (state.player.y - targetMonster.y) ** 2);
            if (dist > 2 && dist <= autoRange && !keysRef.current.size && !clickTargetRef.current) {
              const pdx = targetMonster.x - state.player.x;
              const pdy = targetMonster.y - state.player.y;
              const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
              const step = Math.min(state.player.speed * 0.016 * speedMult, pdist - 1.5);
              if (step > 0) {
                state.movePlayer((pdx / pdist) * step, (pdy / pdist) * step);
              }
            } else if (dist > autoRange) {
              // 超出自动攻击范围，清除目标
              state.setAutoAttackTarget(null);
            }
          }
        }

        // 游戏逻辑更新
        state.gameLoop(deltaTime);

        // 召唤兽AI更新
        state.tickSummon(deltaTime, state.monsters);

        // 设置玩家职业（用于精灵图渲染）
        renderer.setPlayerClass(state.player.class);

        // 渲染
        const entities: EntityRenderInfo[] = [
          // 怪物
          ...state.monsters.map(m => ({
            id: m.id,
            x: m.x,
            y: m.y,
            name: m.name,
            color: m.color,
            symbol: m.symbol,
            size: m.size,
            type: 'monster' as const,
            hp: m.hp,
            maxHp: m.maxHp,
            level: m.level,
            isTargeted: state.selectedTarget?.id === m.id,
            isDead: m.isDead,
            isAutoAttackTarget: state.autoAttackEnabled && state.autoAttackTarget === m.id,
            defId: m.defId,
          })),
          // NPC
          ...state.npcs.map(n => ({
            id: n.id,
            x: n.x,
            y: n.y,
            name: n.name,
            color: n.color,
            symbol: n.symbol,
            size: 20,
            type: 'npc' as const,
            npcType: n.type as EntityRenderInfo['npcType'],
            defId: n.defId,
          })),
          // 假玩家
          ...state.bots.map(b => ({
            id: b.id,
            x: b.x,
            y: b.y,
            name: b.name,
            color: b.color,
            symbol: b.symbol,
            size: 14,
            type: 'bot' as const,
            level: b.level,
          })),
        ];

        // 召唤兽
        if (state.activeSummon) {
          entities.push({
            id: state.activeSummon.id,
            x: state.activeSummon.x,
            y: state.activeSummon.y,
            name: state.activeSummon.name,
            color: state.activeSummon.color,
            symbol: state.activeSummon.symbol,
            size: state.activeSummon.size,
            type: 'summon' as const,
            hp: state.activeSummon.hp,
            maxHp: state.activeSummon.maxHp,
            level: state.activeSummon.level,
            defId: state.activeSummon.defId,
          });
        }

        renderer.render(
          state.player.x,
          state.player.y,
          state.player.mapId,
          entities,
          state.damageNumbers,
          state.particles,
          0, // cameraOffsetX
          0, // cameraOffsetY
          state.activeSkillEffects
        );

        // 渲染地面掉落物品
        renderer.renderGroundItems(
          state.groundItems,
          state.player.x,
          state.player.y
        );

        // 小地图
        if (showMinimap && minimapRef.current) {
          renderer.renderMinimap(
            minimapRef.current,
            state.player.x,
            state.player.y,
            state.player.mapId,
            entities,
            state.groundItems.map(gi => ({ id: gi.id, x: gi.x, y: gi.y, rarity: gi.rarity }))
          );
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [showMinimap]);

  return (
    // 右侧留出 96px 给功能按钮栏（QuickButtons），避免地图从按钮后方透出造成视觉重叠
    <div className="relative w-full h-full overflow-hidden bg-black" style={{ paddingRight: '96px' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        style={{ width: 'calc(100% - 96px)', height: '100%' }}
        onClick={handleCanvasClick}
      />

      {/* 小地图 */}
      {showMinimap && (
        <canvas
          ref={minimapRef}
          width={220}
          height={220}
          className="absolute top-2 border-2 border-amber-600/70 rounded-lg opacity-90 z-10"
          style={{ imageRendering: 'pixelated', right: '104px' }}
        />
      )}
    </div>
  );
}
