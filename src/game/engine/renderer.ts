// 苍月纪元 - 渲染器引擎
// Canvas 2D 渲染系统

import { getMapTile, getTileColor, MAP_DEFINITIONS, isTileWalkable } from '../data/maps';
import type { TileType } from '../data/maps';

export interface RenderConfig {
  tileSize: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface EntityRenderInfo {
  id: string;
  x: number;
  y: number;
  name: string;
  color: string;
  symbol: string;
  size: number;
  type: 'player' | 'monster' | 'npc' | 'bot' | 'summon';
  hp?: number;
  maxHp?: number;
  level?: number;
  isTargeted?: boolean;
  isDead?: boolean;
  isAutoAttackTarget?: boolean;
  npcType?: 'shop' | 'quest' | 'craft' | 'teleport' | 'trainer' | 'bank' | 'generic';
  /** 精灵图路径，优先使用图片渲染 */
  iconPath?: string;
  /** 实体定义ID，用于查找图标 */
  defId?: string;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  timestamp: number;
  isCrit: boolean;
}

export interface ParticleEffect {
  id: string;
  x: number;
  y: number;
  type: 'hit' | 'heal' | 'levelup' | 'skill' | 'death';
  color: string;
  timestamp: number;
  duration: number;
}

export type WeatherType = 'clear' | 'rain' | 'sandstorm' | 'snow' | 'thunder';

export interface SkillEffect {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  skillId: string;
  startTime: number;
  duration: number;
  type: 'projectile' | 'aoe' | 'buff' | 'summon' | 'ground' | 'charge' | 'debuff';
  color: string;
}

export interface GroundItem {
  id: string;
  x: number;
  y: number;
  itemId: string;
  name: string;
  rarity: string;
  timestamp: number;
}

const DEFAULT_CONFIG: RenderConfig = {
  tileSize: 32,
  viewportWidth: 25,
  viewportHeight: 19,
};

// 技能视觉类型映射
const SKILL_VISUAL_MAP: Record<string, SkillEffect['type']> = {
  // 投射物类
  small_fireball: 'projectile',
  soul_fire: 'projectile',
  destroy_heaven_fire: 'projectile',
  thunder_bolt: 'projectile',
  // AOE类
  half_moon: 'aoe',
  ice_roar: 'aoe',
  hell_thunder: 'aoe',
  meteor_shower: 'aoe',
  repel_ring: 'aoe',
  hell_fire: 'aoe',
  // 地面类
  fire_wall: 'ground',
  // 增益类
  magic_shield: 'buff',
  holy_armor: 'buff',
  wuji_aura: 'buff',
  invisibility: 'buff',
  // 召唤类
  summon_skeleton: 'summon',
  summon_beast: 'summon',
  moon_spirit: 'summon',
  // 冲锋类
  savage_charge: 'charge',
  // 减益类
  lion_roar: 'debuff',
  poison: 'debuff',
  // 攻击类 (战士近战)
  power_strike: 'aoe',
  assassinate: 'aoe',
  fire_sword: 'aoe',
  sky_slash: 'aoe',
  normal_attack: 'aoe',
};

// 技能颜色映射
const SKILL_COLOR_MAP: Record<string, string> = {
  small_fireball: '#ff6600',
  soul_fire: '#44ff88',
  destroy_heaven_fire: '#cc0000',
  thunder_bolt: '#ffff00',
  half_moon: '#8888ff',
  ice_roar: '#44aaff',
  hell_thunder: '#9944ff',
  meteor_shower: '#ff2200',
  repel_ring: '#ff8844',
  hell_fire: '#cc2200',
  fire_wall: '#ff4400',
  magic_shield: '#6666ff',
  holy_armor: '#ffcc44',
  wuji_aura: '#ffaa44',
  invisibility: '#aaaaff',
  summon_skeleton: '#ccccaa',
  summon_beast: '#ff8844',
  moon_spirit: '#aaddff',
  savage_charge: '#ff8800',
  lion_roar: '#ffaa00',
  poison: '#00cc00',
  power_strike: '#ff4444',
  assassinate: '#ff0000',
  fire_sword: '#ff4400',
  sky_slash: '#ffcc00',
  normal_attack: '#ffffff',
};

export function getSkillVisualType(skillId: string): SkillEffect['type'] {
  return SKILL_VISUAL_MAP[skillId] || 'aoe';
}

export function getSkillColor(skillId: string): string {
  return SKILL_COLOR_MAP[skillId] || '#ffffff';
}

// === 精灵图映射系统 ===

// NPC ID → 精灵图文件名映射
const NPC_SPRITE_MAP: Record<string, string> = {
  village_elder: 'villageChief',
  weapon_smith: 'weaponMerchant',
  herb_merchant: 'forestHerbalist',
  armor_smith: 'armorMerchant',
  forest_ranger: 'forestRanger',
  potion_seller: 'potionMerchant',
  skill_trainer: 'skillTrainer',
  desert_merchant: 'desertMerchant',
  wandering_healer: 'healer',
  camp_commander: 'campCommander',
  blacksmith_master: 'blacksmith',
  arcane_scholar: 'arcaneScholar',
  island_hermit: 'islandHermit',
  ancient_forge: 'ancientForge',
  treasure_hunter: 'treasureHunter',
};

// 怪物 defId → 精灵图文件名映射
const MONSTER_SPRITE_MAP: Record<string, string> = {
  chicken: 'chicken',
  deer: 'deer',
  wild_wolf: 'wildWolf',
  skeleton: 'skeleton',
  orc_warrior: 'orc',
  orc_archer: 'orcArcher',
  half_beast: 'halfBeast',
  snake: 'snake',
  venomous_snake: 'venomousSnake',
  scorpion: 'darkScorpion',
  dark_spider: 'darkSpider',
  snake_demon: 'snakeDemon',
  zuma_guard: 'zumaGuard',
  flame_skeleton: 'flameSkeleton',
  dark_knight: 'darkKnight',
  shadow_mage: 'shadowMage',
  sea_serpent: 'seaSerpent',
  demon_soldier: 'demonSoldier',
  blood_bat: 'bloodBat',
  ghost_warrior: 'ghostWarrior',
  zombie: 'zombie',
  rotting_corpse: 'rottingCorpse',
  corpse_king_minion: 'zombieKing',
  woma_guard: 'womaGuard',
  woma_warrior: 'womaWarrior',
  woma_mage: 'womaMage',
  zuma_warrior: 'zumaWarrior',
  zuma_archer: 'zumaArcher',
  zuma_mage: 'zumaMage',
  red_moon_spider: 'redMoonSpider',
  blood_demon: 'bloodDemon',
  shadow_assassin: 'shadowAssassin',
  sealed_demon: 'sealedDemon',
  cursed_spirit: 'cursedSpirit',
  ancient_golem: 'ancientGolem',
  // Boss映射
  skeleton_king: 'skeletonKing',
  half_beast_commander: 'halfBeastCommander',
  snake_queen: 'snakeQueen',
  zuma_leader: 'zumaCultLeader',
  demon_lord: 'demonLord',
  corpse_king: 'corpseKing',
  woma_leader: 'womaCultLeader',
  zuma_cult_leader: 'zumaCultLeader',
  red_moon_demon: 'redMoonDemonBoss',
  sealed_overlord: 'sealedOverlord',
};

// 玩家职业 → 精灵图文件名映射
const PLAYER_SPRITE_MAP: Record<string, string> = {
  warrior: 'warrior',
  mage: 'mage',
  taoist: 'taoist',
};

/** 根据实体信息获取精灵图路径 */
export function getEntitySpritePath(entity: EntityRenderInfo): string | undefined {
  if (entity.type === 'npc') {
    const spriteName = NPC_SPRITE_MAP[entity.defId || entity.id];
    if (spriteName) return `/sprites/npcs/${spriteName}.png`;
  }
  if (entity.type === 'monster' || entity.type === 'summon') {
    const spriteName = MONSTER_SPRITE_MAP[entity.defId || entity.id];
    if (spriteName) return `/sprites/monsters/${spriteName}.png`;
  }
  if (entity.type === 'player') {
    const spriteName = PLAYER_SPRITE_MAP[entity.defId || ''];
    if (spriteName) return `/sprites/characters/${spriteName}.png`;
  }
  return entity.iconPath; // 兜底
}

export class GameRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: RenderConfig = DEFAULT_CONFIG;
  private tileCache: Map<string, string> = new Map();
  private animationFrame: number = 0;
  private time: number = 0;

  // 精灵图缓存系统
  private spriteCache: Map<string, HTMLImageElement> = new Map();
  private spriteLoadQueue: Set<string> = new Set();
  private spritesLoaded: boolean = false;
  private playerClass: string = 'warrior'; // 当前玩家职业

  // 天气系统
  private weather: WeatherType = 'clear';
  private weatherParticles: Array<{x: number; y: number; speed: number; size: number}> = [];
  private lastThunderFlash: number = 0;
  private thunderFlashActive: boolean = false;
  private nextThunderTime: number = 0;

  constructor() {
    // 初始化天气粒子池
    this.initWeatherParticles();
    // 初始化雷声计时
    this.nextThunderTime = Date.now() + 5000 + Math.random() * 10000;
    // 预加载所有精灵图
    this.preloadAllSprites();
  }

  /** 设置玩家职业（用于选择玩家精灵图） */
  setPlayerClass(cls: string): void {
    this.playerClass = cls;
  }

  /** 预加载所有精灵图 */
  private preloadAllSprites(): void {
    const allPaths: string[] = [];

    // 加载所有NPC精灵图
    Object.values(NPC_SPRITE_MAP).forEach(name => {
      allPaths.push(`/sprites/npcs/${name}.png`);
    });

    // 加载所有怪物精灵图
    Object.values(MONSTER_SPRITE_MAP).forEach(name => {
      const path = `/sprites/monsters/${name}.png`;
      if (!allPaths.includes(path)) allPaths.push(path);
    });

    // 加载所有角色精灵图
    Object.values(PLAYER_SPRITE_MAP).forEach(name => {
      allPaths.push(`/sprites/characters/${name}.png`);
    });

    // 异步加载
    for (const path of allPaths) {
      this.loadSprite(path);
    }
  }

  /** 加载单个精灵图 */
  private loadSprite(path: string): void {
    if (this.spriteCache.has(path) || this.spriteLoadQueue.has(path)) return;
    this.spriteLoadQueue.add(path);

    const img = new Image();
    img.onload = () => {
      this.spriteCache.set(path, img);
      this.spriteLoadQueue.delete(path);
    };
    img.onerror = () => {
      this.spriteLoadQueue.delete(path);
      // 图片加载失败时静默处理，会fallback到emoji
    };
    img.src = path;
  }

  /** 获取精灵图，如果未加载则尝试加载 */
  private getSprite(path: string): HTMLImageElement | null {
    const cached = this.spriteCache.get(path);
    if (cached && cached.complete && cached.naturalWidth > 0) return cached;
    if (!this.spriteLoadQueue.has(path)) this.loadSprite(path);
    return null;
  }

  /** 初始化天气粒子池 */
  private initWeatherParticles() {
    this.weatherParticles = [];
    for (let i = 0; i < 200; i++) {
      this.weatherParticles.push({
        x: Math.random() * 1200,
        y: Math.random() * 800,
        speed: 2 + Math.random() * 4,
        size: 1 + Math.random() * 2,
      });
    }
  }

  /** Deterministic hash for tile/particle variation */
  private tileHash(x: number, y: number): number {
    const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return h - Math.floor(h);
  }

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  updateConfig(config: Partial<RenderConfig>) {
    this.config = { ...this.config, ...config };
  }

  /** 设置天气 */
  setWeather(weather: string): void {
    this.weather = weather as WeatherType;
    this.initWeatherParticles();
  }

  render(
    playerX: number,
    playerY: number,
    mapId: string,
    entities: EntityRenderInfo[],
    damageNumbers: DamageNumber[],
    particles: ParticleEffect[],
    cameraOffsetX: number = 0,
    cameraOffsetY: number = 0,
    skillEffects: SkillEffect[] = []
  ) {
    if (!this.ctx || !this.canvas) return;

    this.time = Date.now();
    this.animationFrame++;

    const { tileSize, viewportWidth, viewportHeight } = this.config;
    const mapDef = MAP_DEFINITIONS[mapId];
    if (!mapDef) return;

    // 计算视口偏移（以玩家为中心）
    const vpHalfW = Math.floor(viewportWidth / 2);
    const vpHalfH = Math.floor(viewportHeight / 2);
    const startTileX = Math.floor(playerX) - vpHalfW;
    const startTileY = Math.floor(playerY) - vpHalfH;

    // 像素偏移（平滑移动）
    const subTileX = (playerX - Math.floor(playerX)) * tileSize;
    const subTileY = (playerY - Math.floor(playerY)) * tileSize;

    // 清空画布
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 渲染地图瓦片
    for (let vy = -1; vy <= viewportHeight + 1; vy++) {
      for (let vx = -1; vx <= viewportWidth + 1; vx++) {
        const worldX = startTileX + vx;
        const worldY = startTileY + vy;

        const tile = getMapTile(mapId, worldX, worldY);
        const screenX = vx * tileSize - subTileX;
        const screenY = vy * tileSize - subTileY;

        this.renderTile(screenX, screenY, tile, worldX, worldY, mapId);
      }
    }

    // 渲染天气（在地图瓦片之后，实体之前）
    this.renderWeather();

    // 渲染实体（按Y排序实现遮挡）
    const sortedEntities = [...entities].sort((a, b) => a.y - b.y);
    for (const entity of sortedEntities) {
      const relX = entity.x - startTileX;
      const relY = entity.y - startTileY;
      const screenX = relX * tileSize - subTileX;
      const screenY = relY * tileSize - subTileY;

      // 只渲染视口内的实体
      if (screenX < -tileSize * 2 || screenX > (viewportWidth + 2) * tileSize ||
          screenY < -tileSize * 2 || screenY > (viewportHeight + 2) * tileSize) {
        continue;
      }

      this.renderEntity(screenX, screenY, entity);
    }

    // 渲染技能视觉效果（实体之后，伤害数字之前）
    this.renderSkillEffects(skillEffects, startTileX, startTileY, subTileX, subTileY, playerX, playerY);

    // 渲染伤害数字
    this.renderDamageNumbers(damageNumbers, startTileX, startTileY, subTileX, subTileY);

    // 渲染粒子效果
    this.renderParticles(particles, startTileX, startTileY, subTileX, subTileY);

    // 渲染玩家指示器（始终在中心）
    this.renderPlayerIndicator();

    // 渲染环境光照效果
    this.renderAmbientEffects(mapId);
  }

  // === 天气渲染 ===
  private renderWeather() {
    if (!this.ctx || !this.canvas) return;
    if (this.weather === 'clear') return;

    const w = this.canvas.width;
    const h = this.canvas.height;

    switch (this.weather) {
      case 'rain':
        this.renderRain(w, h);
        break;
      case 'sandstorm':
        this.renderSandstorm(w, h);
        break;
      case 'snow':
        this.renderSnow(w, h);
        break;
      case 'thunder':
        this.renderThunder(w, h);
        break;
    }
  }

  private renderRain(w: number, h: number) {
    if (!this.ctx) return;

    // 雨滴
    const particleCount = Math.min(200, this.weatherParticles.length);
    for (let i = 0; i < particleCount; i++) {
      const p = this.weatherParticles[i];
      p.y += p.speed * 3;
      p.x += p.speed * 0.3; // 轻微斜风

      if (p.y > h) {
        p.y = -10;
        p.x = Math.random() * w;
      }
      if (p.x > w) p.x = 0;

      this.ctx.strokeStyle = `rgba(100, 150, 255, ${0.3 + Math.random() * 0.2})`;
      this.ctx.lineWidth = p.size * 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x + 2, p.y + p.speed * 4);
      this.ctx.stroke();
    }

    // 暗色叠加
    this.ctx.fillStyle = 'rgba(0, 0, 40, 0.15)';
    this.ctx.fillRect(0, 0, w, h);
  }

  private renderSandstorm(w: number, h: number) {
    if (!this.ctx) return;

    // 沙粒
    const particleCount = Math.min(200, this.weatherParticles.length);
    for (let i = 0; i < particleCount; i++) {
      const p = this.weatherParticles[i];
      p.x += p.speed * 4; // 横向吹
      p.y += Math.sin(this.time / 500 + i) * 0.5;

      if (p.x > w) {
        p.x = -10;
        p.y = Math.random() * h;
      }

      this.ctx.fillStyle = `rgba(194, 160, 80, ${0.4 + Math.random() * 0.3})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 沙尘叠加
    this.ctx.fillStyle = 'rgba(180, 150, 80, 0.12)';
    this.ctx.fillRect(0, 0, w, h);
  }

  private renderSnow(w: number, h: number) {
    if (!this.ctx) return;

    // 雪花
    const particleCount = Math.min(150, this.weatherParticles.length);
    for (let i = 0; i < particleCount; i++) {
      const p = this.weatherParticles[i];
      p.y += p.speed * 0.5; // 慢速下落
      p.x += Math.sin(this.time / 1000 + i * 0.5) * 0.3; // 摇摆

      if (p.y > h) {
        p.y = -10;
        p.x = Math.random() * w;
      }

      const alpha = 0.5 + Math.sin(this.time / 800 + i) * 0.2;
      this.ctx.fillStyle = `rgba(240, 245, 255, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 白色叠加
    this.ctx.fillStyle = 'rgba(200, 210, 230, 0.08)';
    this.ctx.fillRect(0, 0, w, h);
  }

  private renderThunder(w: number, h: number) {
    if (!this.ctx) return;

    // 先渲染雨
    this.renderRain(w, h);

    // 雷暴闪光
    const now = this.time;
    if (now >= this.nextThunderTime && !this.thunderFlashActive) {
      this.thunderFlashActive = true;
      this.lastThunderFlash = now;
      this.nextThunderTime = now + 5000 + Math.random() * 10000;
    }

    if (this.thunderFlashActive) {
      const flashAge = now - this.lastThunderFlash;
      if (flashAge < 300) {
        // 闪光效果
        const flashAlpha = flashAge < 100 ? 0.6 : 0.6 * (1 - (flashAge - 100) / 200);
        this.ctx.fillStyle = `rgba(255, 255, 240, ${flashAlpha})`;
        this.ctx.fillRect(0, 0, w, h);
      } else {
        this.thunderFlashActive = false;
      }
    }
  }

  // === 技能视觉效果渲染 ===
  private renderSkillEffects(
    effects: SkillEffect[],
    startTileX: number,
    startTileY: number,
    subTileX: number,
    subTileY: number,
    playerX: number,
    playerY: number
  ) {
    if (!this.ctx) return;
    const { tileSize } = this.config;
    const now = this.time;

    for (const effect of effects) {
      const age = now - effect.startTime;
      if (age > effect.duration || age < 0) continue;

      const progress = Math.min(1, age / effect.duration);
      const alpha = Math.max(0, 1 - progress);

      // 计算技能效果的世界坐标到屏幕坐标
      const toScreen = (wx: number, wy: number) => {
        const relX = wx - startTileX;
        const relY = wy - startTileY;
        return {
          sx: relX * tileSize - subTileX + tileSize / 2,
          sy: relY * tileSize - subTileY + tileSize / 2,
        };
      };

      const from = toScreen(effect.x, effect.y);
      const to = toScreen(effect.targetX, effect.targetY);

      switch (effect.type) {
        case 'projectile': {
          // 投射物：从施法者飞向目标
          const px = from.sx + (to.sx - from.sx) * progress;
          const py = from.sy + (to.sy - from.sy) * progress;
          const projectileSize = 5 + Math.sin(now / 100) * 2;

          // 拖尾
          this.ctx.strokeStyle = effect.color + Math.floor(alpha * 128).toString(16).padStart(2, '0');
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          const trailProgress = Math.max(0, progress - 0.15);
          const trailX = from.sx + (to.sx - from.sx) * trailProgress;
          const trailY = from.sy + (to.sy - from.sy) * trailProgress;
          this.ctx.moveTo(trailX, trailY);
          this.ctx.lineTo(px, py);
          this.ctx.stroke();

          // 发光球
          const gradient = this.ctx.createRadialGradient(px, py, 0, px, py, projectileSize);
          gradient.addColorStop(0, effect.color);
          gradient.addColorStop(0.5, effect.color + '80');
          gradient.addColorStop(1, 'transparent');
          this.ctx.fillStyle = gradient;
          this.ctx.beginPath();
          this.ctx.arc(px, py, projectileSize, 0, Math.PI * 2);
          this.ctx.fill();
          break;
        }

        case 'aoe': {
          // AOE：在目标位置展开圆形/弧形效果
          const expandRadius = progress * tileSize * 2;
          const aoeAlpha = alpha * 0.6;

          // 外环
          this.ctx.strokeStyle = effect.color + Math.floor(aoeAlpha * 200).toString(16).padStart(2, '0');
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.arc(to.sx, to.sy, expandRadius, 0, Math.PI * 2);
          this.ctx.stroke();

          // 填充
          const aoeGrad = this.ctx.createRadialGradient(to.sx, to.sy, 0, to.sx, to.sy, expandRadius);
          aoeGrad.addColorStop(0, effect.color + Math.floor(aoeAlpha * 80).toString(16).padStart(2, '0'));
          aoeGrad.addColorStop(1, 'transparent');
          this.ctx.fillStyle = aoeGrad;
          this.ctx.beginPath();
          this.ctx.arc(to.sx, to.sy, expandRadius, 0, Math.PI * 2);
          this.ctx.fill();
          break;
        }

        case 'ground': {
          // 地面效果：持续燃烧区域
          const groundAlpha = alpha * 0.5;
          const groundRadius = tileSize * 1.2;

          // 地面光圈
          const groundGrad = this.ctx.createRadialGradient(to.sx, to.sy, 0, to.sx, to.sy, groundRadius);
          groundGrad.addColorStop(0, effect.color + Math.floor(groundAlpha * 150).toString(16).padStart(2, '0'));
          groundGrad.addColorStop(0.7, effect.color + Math.floor(groundAlpha * 60).toString(16).padStart(2, '0'));
          groundGrad.addColorStop(1, 'transparent');
          this.ctx.fillStyle = groundGrad;
          this.ctx.beginPath();
          this.ctx.arc(to.sx, to.sy, groundRadius, 0, Math.PI * 2);
          this.ctx.fill();

          // 火焰粒子
          for (let i = 0; i < 5; i++) {
            const flameX = to.sx + Math.sin(now / 200 + i * 1.3) * groundRadius * 0.6;
            const flameY = to.sy - progress * 15 - i * 3;
            const flameSize = 2 + Math.sin(now / 150 + i) * 1;
            this.ctx.fillStyle = effect.color + Math.floor(groundAlpha * 200).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(flameX, flameY, flameSize, 0, Math.PI * 2);
            this.ctx.fill();
          }
          break;
        }

        case 'buff': {
          // 增益效果：角色周围光环
          const buffRadius = 16 + Math.sin(now / 200) * 3;
          const buffAlpha = alpha * 0.7;

          // 光环
          this.ctx.strokeStyle = effect.color + Math.floor(buffAlpha * 200).toString(16).padStart(2, '0');
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(from.sx, from.sy, buffRadius, 0, Math.PI * 2);
          this.ctx.stroke();

          // 内环发光
          const buffGrad = this.ctx.createRadialGradient(from.sx, from.sy, 0, from.sx, from.sy, buffRadius);
          buffGrad.addColorStop(0, effect.color + Math.floor(buffAlpha * 50).toString(16).padStart(2, '0'));
          buffGrad.addColorStop(0.8, effect.color + Math.floor(buffAlpha * 20).toString(16).padStart(2, '0'));
          buffGrad.addColorStop(1, 'transparent');
          this.ctx.fillStyle = buffGrad;
          this.ctx.beginPath();
          this.ctx.arc(from.sx, from.sy, buffRadius, 0, Math.PI * 2);
          this.ctx.fill();

          // 旋转粒子
          for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + now / 500;
            const orbitRadius = buffRadius + 3;
            const px = from.sx + Math.cos(angle) * orbitRadius;
            const py = from.sy + Math.sin(angle) * orbitRadius;
            this.ctx.fillStyle = effect.color;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 2, 0, Math.PI * 2);
            this.ctx.fill();
          }
          break;
        }

        case 'summon': {
          // 召唤效果：传送门圆圈
          const summonRadius = 20 + Math.sin(now / 300) * 3;
          const summonAlpha = alpha * 0.8;

          // 传送门环
          this.ctx.strokeStyle = effect.color + Math.floor(summonAlpha * 200).toString(16).padStart(2, '0');
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.arc(from.sx, from.sy, summonRadius, 0, Math.PI * 2);
          this.ctx.stroke();

          // 传送门内部旋转
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - now / 300;
            const innerR = summonRadius * 0.7;
            const px = from.sx + Math.cos(angle) * innerR;
            const py = from.sy + Math.sin(angle) * innerR;
            this.ctx.fillStyle = effect.color + Math.floor(summonAlpha * 150).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(px, py, 2, 0, Math.PI * 2);
            this.ctx.fill();
          }

          // 中心发光
          const sumGrad = this.ctx.createRadialGradient(from.sx, from.sy, 0, from.sx, from.sy, summonRadius * 0.5);
          sumGrad.addColorStop(0, effect.color + Math.floor(summonAlpha * 80).toString(16).padStart(2, '0'));
          sumGrad.addColorStop(1, 'transparent');
          this.ctx.fillStyle = sumGrad;
          this.ctx.beginPath();
          this.ctx.arc(from.sx, from.sy, summonRadius * 0.5, 0, Math.PI * 2);
          this.ctx.fill();
          break;
        }

        case 'charge': {
          // 冲锋效果：运动轨迹
          const chargeAlpha = alpha * 0.7;

          // 残影轨迹
          for (let i = 0; i < 5; i++) {
            const trailProg = progress - i * 0.05;
            if (trailProg < 0) continue;
            const trailX = from.sx + (to.sx - from.sx) * trailProg;
            const trailY = from.sy + (to.sy - from.sy) * trailProg;
            const trailAlpha = chargeAlpha * (1 - i * 0.2);

            this.ctx.strokeStyle = effect.color + Math.floor(trailAlpha * 200).toString(16).padStart(2, '0');
            this.ctx.lineWidth = 3 - i * 0.5;
            this.ctx.beginPath();
            this.ctx.arc(trailX, trailY, 8 - i, 0, Math.PI * 2);
            this.ctx.stroke();
          }

          // 冲锋线条
          this.ctx.strokeStyle = effect.color + Math.floor(chargeAlpha * 150).toString(16).padStart(2, '0');
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(from.sx, from.sy);
          this.ctx.lineTo(
            from.sx + (to.sx - from.sx) * progress,
            from.sy + (to.sy - from.sy) * progress
          );
          this.ctx.stroke();
          break;
        }

        case 'debuff': {
          // 减益效果：扩散环
          const debuffRadius = progress * tileSize * 1.5;
          const debuffAlpha = alpha * 0.6;

          // 扩散环
          this.ctx.strokeStyle = effect.color + Math.floor(debuffAlpha * 200).toString(16).padStart(2, '0');
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.arc(to.sx, to.sy, debuffRadius, 0, Math.PI * 2);
          this.ctx.stroke();

          // 内部填充
          const debuffGrad = this.ctx.createRadialGradient(to.sx, to.sy, 0, to.sx, to.sy, debuffRadius);
          debuffGrad.addColorStop(0, effect.color + Math.floor(debuffAlpha * 60).toString(16).padStart(2, '0'));
          debuffGrad.addColorStop(1, 'transparent');
          this.ctx.fillStyle = debuffGrad;
          this.ctx.beginPath();
          this.ctx.arc(to.sx, to.sy, debuffRadius, 0, Math.PI * 2);
          this.ctx.fill();
          break;
        }
      }
    }
  }

  private renderTile(
    screenX: number,
    screenY: number,
    tile: TileType,
    worldX: number,
    worldY: number,
    mapId: string
  ) {
    if (!this.ctx) return;

    const { tileSize } = this.config;
    const baseColor = getTileColor(tile);

    // 基础瓦片颜色
    this.ctx.fillStyle = baseColor;
    this.ctx.fillRect(screenX, screenY, tileSize, tileSize);

    // 瓦片装饰
    const seed = (worldX * 7 + worldY * 13 + mapId.charCodeAt(0)) & 0xff;

    switch (tile) {
      case 'grass':
        // 草地上的小细节
        if (seed % 5 === 0) {
          this.ctx.fillStyle = '#5a8c4f';
          this.ctx.fillRect(screenX + 8, screenY + 12, 2, 4);
          this.ctx.fillRect(screenX + 20, screenY + 6, 2, 4);
        }
        if (seed % 7 === 0) {
          this.ctx.fillStyle = '#6a9c5f';
          this.ctx.fillRect(screenX + 14, screenY + 18, 2, 3);
        }
        // 花朵
        if (seed % 20 === 0) {
          this.ctx.fillStyle = seed % 2 === 0 ? '#ff6688' : '#ffdd44';
          this.ctx.beginPath();
          this.ctx.arc(screenX + 16, screenY + 16, 2, 0, Math.PI * 2);
          this.ctx.fill();
        }
        break;

      case 'forest':
        // 树木
        this.ctx.fillStyle = '#1a4a0e';
        this.ctx.beginPath();
        this.ctx.arc(screenX + 16, screenY + 10, 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#3a2a1a';
        this.ctx.fillRect(screenX + 14, screenY + 18, 4, 10);
        break;

      case 'water':
        // 水面波纹动画
        const waveOffset = Math.sin(this.time / 800 + worldX * 0.5 + worldY * 0.3) * 20;
        const r = 0x2a + Math.floor(waveOffset);
        const g = 0x5a + Math.floor(waveOffset * 0.5);
        const b = 0x8a + Math.floor(waveOffset * 0.3);
        this.ctx.fillStyle = `rgb(${Math.max(0, r)},${Math.max(0, g)},${Math.max(0, b)})`;
        this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // 水面高光
        if (seed % 3 === 0) {
          this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
          this.ctx.fillRect(screenX + seed % 20, screenY + seed % 16, 8, 2);
        }
        break;

      case 'mountain':
        // 山地
        this.ctx.fillStyle = '#7a7a7a';
        this.ctx.beginPath();
        this.ctx.moveTo(screenX + 16, screenY + 2);
        this.ctx.lineTo(screenX + 30, screenY + 28);
        this.ctx.lineTo(screenX + 2, screenY + 28);
        this.ctx.fill();
        // 雪顶
        this.ctx.fillStyle = '#e8e8e8';
        this.ctx.beginPath();
        this.ctx.moveTo(screenX + 16, screenY + 2);
        this.ctx.lineTo(screenX + 20, screenY + 10);
        this.ctx.lineTo(screenX + 12, screenY + 10);
        this.ctx.fill();
        break;

      case 'sand':
        // 沙地
        if (seed % 4 === 0) {
          this.ctx.fillStyle = '#b8983a';
          this.ctx.fillRect(screenX + seed % 24, screenY + seed % 20, 4, 2);
        }
        break;

      case 'road':
        // 道路
        this.ctx.fillStyle = '#9a8a5a';
        this.ctx.fillRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
        if (seed % 6 === 0) {
          this.ctx.fillStyle = '#7a6a3a';
          this.ctx.fillRect(screenX + 12, screenY + 14, 6, 2);
        }
        break;

      case 'town_floor':
        // 城镇地板
        this.ctx.fillStyle = '#aa9a6a';
        this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
        this.ctx.strokeStyle = '#8a7a4a';
        this.ctx.strokeRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);
        break;

      case 'dungeon_floor':
        // 副本地板
        this.ctx.fillStyle = '#3a3a3a';
        this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
        if (seed % 5 === 0) {
          this.ctx.fillStyle = '#2a2a2a';
          this.ctx.fillRect(screenX + 4, screenY + 4, 8, 8);
        }
        // 暗红光效
        if (seed % 15 === 0) {
          const glowAlpha = 0.1 + Math.sin(this.time / 1000 + seed) * 0.05;
          this.ctx.fillStyle = `rgba(255, 50, 50, ${glowAlpha})`;
          this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
        }
        break;

      case 'dungeon_wall':
        // 副本墙壁
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
        this.ctx.fillStyle = '#252525';
        this.ctx.fillRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);
        // 砖缝
        this.ctx.strokeStyle = '#0a0a0a';
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY + tileSize / 2);
        this.ctx.lineTo(screenX + tileSize, screenY + tileSize / 2);
        this.ctx.stroke();
        break;

      case 'bridge':
        this.ctx.fillStyle = '#8a5a2a';
        this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
        this.ctx.fillStyle = '#6a3a0a';
        for (let i = 0; i < 3; i++) {
          this.ctx.fillRect(screenX + 4, screenY + i * 10 + 2, tileSize - 8, 2);
        }
        break;
    }

    // 瓦片边缘阴影
    this.ctx.fillStyle = 'rgba(0,0,0,0.08)';
    this.ctx.fillRect(screenX, screenY + tileSize - 2, tileSize, 2);
  }

  private renderEntity(screenX: number, screenY: number, entity: EntityRenderInfo) {
    if (!this.ctx) return;
    const { tileSize } = this.config;
    const centerX = screenX + tileSize / 2;
    const bodyY = screenY + tileSize / 2 - 2;

    // 实体阴影 - 更好的椭圆阴影
    this.ctx.fillStyle = 'rgba(0,0,0,0.25)';
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, screenY + tileSize - 1, entity.size * 0.7, 3, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 身体光晕 - 所有实体都有微弱光晕
    if (entity.type === 'monster' || entity.type === 'npc' || entity.type === 'bot') {
      const glowSize = entity.size + (entity.type === 'monster' && entity.size >= 24 ? 8 : 3);
      const glowAlpha = entity.type === 'monster' && entity.size >= 24 ? 0.19 : 0.08;
      // Parse hex color safely
      let r = 128, g = 128, b = 128;
      try {
        if (entity.color && entity.color.startsWith('#') && entity.color.length >= 7) {
          r = parseInt(entity.color.slice(1, 3), 16);
          g = parseInt(entity.color.slice(3, 5), 16);
          b = parseInt(entity.color.slice(5, 7), 16);
        }
      } catch {}
      const gradient = this.ctx.createRadialGradient(centerX, bodyY, 0, centerX, bodyY, glowSize);
      gradient.addColorStop(0, `rgba(${r},${g},${b},${glowAlpha})`);
      gradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(centerX, bodyY, glowSize, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 自动攻击目标指示器（脉冲红色圆圈）
    if (entity.isAutoAttackTarget && !entity.isDead) {
      const autoPulse = Math.sin(this.time / 250) * 4;
      const autoAlpha = 0.4 + Math.sin(this.time / 250) * 0.2;
      this.ctx.strokeStyle = `rgba(255, 50, 50, ${autoAlpha})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(centerX, bodyY, entity.size * 0.6 + 4 + autoPulse, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // 尝试使用精灵图渲染
    const spritePath = getEntitySpritePath(entity);
    const sprite = spritePath ? this.getSprite(spritePath) : null;

    if (sprite) {
      // === 精灵图渲染模式 ===
      // 根据实体大小计算绘制尺寸
      const drawSize = entity.type === 'npc' ? tileSize * 1.1 :
                       entity.size >= 24 ? tileSize * 1.2 :   // Boss
                       entity.size >= 18 ? tileSize * 1.0 :   // 中型怪
                       tileSize * 0.85;                        // 小怪
      const drawX = centerX - drawSize / 2;
      const drawY = bodyY - drawSize / 2 + 2; // 稍微下移对齐脚底

      // 选中/目标高亮边框
      if (entity.isTargeted) {
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, screenY + tileSize - 1, drawSize * 0.4, 4, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }

      // Boss额外光圈
      if (entity.type === 'monster' && entity.size >= 24) {
        const bossPulse = Math.sin(this.time / 500) * 3;
        this.ctx.strokeStyle = `rgba(255, 100, 0, ${0.3 + Math.sin(this.time / 500) * 0.15})`;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(centerX, bodyY, drawSize * 0.55 + bossPulse, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      // 绘制精灵图（圆形裁切，更精美）
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(centerX, bodyY, drawSize * 0.45, 0, Math.PI * 2);
      this.ctx.closePath();
      this.ctx.clip();
      this.ctx.drawImage(sprite, drawX, drawY, drawSize, drawSize);
      this.ctx.restore();

      // 精灵图圆形边框
      this.ctx.strokeStyle = entity.isTargeted ? 'rgba(255,255,0,0.8)' :
                             entity.type === 'npc' ? 'rgba(255,204,0,0.4)' :
                             entity.type === 'monster' && entity.size >= 24 ? 'rgba(255,100,0,0.4)' :
                             'rgba(255,255,255,0.2)';
      this.ctx.lineWidth = entity.isTargeted ? 2 : 1;
      this.ctx.beginPath();
      this.ctx.arc(centerX, bodyY, drawSize * 0.45, 0, Math.PI * 2);
      this.ctx.stroke();

      // NPC类型图标（在精灵图右上角显示小图标）
      if (entity.npcType) {
        const iconRadius = 5;
        const iconX = centerX + drawSize * 0.35;
        const iconY = bodyY - drawSize * 0.35;
        const iconColors: Record<string, string> = {
          shop: '#ffd700', quest: '#ff6600', craft: '#ff8800',
          teleport: '#aa44ff', trainer: '#44aaff', bank: '#44ff44', generic: '#aaaaaa',
        };
        const iconSymbols: Record<string, string> = {
          shop: '$', quest: '!', craft: '⚒', teleport: '⇧', trainer: '☆', bank: '◆', generic: '?',
        };
        this.ctx.fillStyle = iconColors[entity.npcType] || '#aaaaaa';
        this.ctx.beginPath();
        this.ctx.arc(iconX, iconY, iconRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 7px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(iconSymbols[entity.npcType] || '?', iconX, iconY);
      }

    } else {
      // === 传统渲染模式（emoji/文字回退） ===
      const bodyRadius = entity.size * 0.5;
      const bodyGradient = this.ctx.createRadialGradient(
        centerX - bodyRadius * 0.3, bodyY - bodyRadius * 0.3, 0,
        centerX, bodyY, bodyRadius
      );
      bodyGradient.addColorStop(0, this.lightenColor(entity.color, 40));
      bodyGradient.addColorStop(0.7, entity.color);
      bodyGradient.addColorStop(1, this.darkenColor(entity.color, 30));
      this.ctx.fillStyle = bodyGradient;
      this.ctx.beginPath();
      this.ctx.arc(centerX, bodyY, bodyRadius, 0, Math.PI * 2);
      this.ctx.fill();

      // 实体轮廓
      if (entity.isTargeted) {
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 2.5;
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 6;
      } else {
        this.ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.shadowBlur = 0;
      }
      this.ctx.beginPath();
      this.ctx.arc(centerX, bodyY, bodyRadius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;

      // 高光效果 - 左上角亮斑
      this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
      this.ctx.beginPath();
      this.ctx.arc(centerX - bodyRadius * 0.3, bodyY - bodyRadius * 0.3, bodyRadius * 0.4, 0, Math.PI * 2);
      this.ctx.fill();

      // 实体符号（emoji或文字）- 更好的字体和阴影
      this.ctx.font = `${entity.size}px serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
      this.ctx.shadowBlur = 2;
      this.ctx.shadowOffsetX = 1;
      this.ctx.shadowOffsetY = 1;
      this.ctx.fillText(entity.symbol, centerX, bodyY);
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;

      // NPC类型徽章
      if (entity.npcType) {
        const badgeColors: Record<string, string> = {
          shop: '#ffd700', quest: '#ff6600', craft: '#ff8800',
          teleport: '#aa44ff', trainer: '#44aaff', bank: '#44ff44', generic: '#aaaaaa',
        };
        const badgeTexts: Record<string, string> = {
          shop: '商', quest: '任', craft: '造', teleport: '传', trainer: '学', bank: '库', generic: 'NPC',
        };
        const badgeColor = badgeColors[entity.npcType] || '#aaaaaa';
        const badgeText = badgeTexts[entity.npcType] || 'NPC';
        const badgeX = centerX + (entity.size || 16) + 2;
        const badgeY = screenY - 4;
        this.ctx.font = 'bold 7px sans-serif';
        const tw = this.ctx.measureText(badgeText).width + 4;
        this.ctx.fillStyle = badgeColor;
        this.ctx.fillRect(badgeX, badgeY - 7, tw, 10);
        this.ctx.fillStyle = '#000';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(badgeText, badgeX + tw / 2, badgeY);
      }
    }

    // 名称标签 - 带背景提升可读性
    if (entity.name) {
      const nameColor = entity.type === 'monster' ?
        (entity.size >= 24 ? '#ff8800' : '#ff4444') :
        entity.type === 'npc' ? '#ffcc00' :
        entity.type === 'bot' ? '#44aaff' :
        entity.type === 'summon' ? '#88ccff' : '#ffffff';

      this.ctx.font = 'bold 10px sans-serif';
      this.ctx.textAlign = 'center';

      // 名称背景条
      const nameWidth = this.ctx.measureText(entity.name).width + 6;
      this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
      this.ctx.fillRect(centerX - nameWidth / 2, screenY - 10, nameWidth, 12);

      this.ctx.fillStyle = nameColor;
      this.ctx.fillText(entity.name, centerX, screenY - 2);

      // 等级标签
      if (entity.level) {
        this.ctx.font = '8px sans-serif';
        const levelText = `Lv${entity.level}`;
        const levelWidth = this.ctx.measureText(levelText).width + 4;
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(centerX - levelWidth / 2, screenY - 20, levelWidth, 10);
        this.ctx.fillStyle = '#cccccc';
        this.ctx.fillText(levelText, centerX, screenY - 13);
      }

      // NPC类型徽章
      if (entity.npcType) {
        const badgeColors: Record<string, string> = {
          shop: '#ffd700',
          quest: '#ff6600',
          craft: '#ff8800',
          teleport: '#aa44ff',
          trainer: '#44aaff',
          bank: '#44ff44',
          generic: '#aaaaaa',
        };
        const badgeTexts: Record<string, string> = {
          shop: '商',
          quest: '任',
          craft: '造',
          teleport: '传',
          trainer: '学',
          bank: '库',
          generic: 'NPC',
        };
        const badgeColor = badgeColors[entity.npcType] || '#aaaaaa';
        const badgeText = badgeTexts[entity.npcType] || 'NPC';
        const badgeX = centerX + (entity.size || 16) + 2;
        const badgeY = screenY - 4;
        this.ctx.font = 'bold 7px sans-serif';
        const tw = this.ctx.measureText(badgeText).width + 4;
        this.ctx.fillStyle = badgeColor;
        this.ctx.fillRect(badgeX, badgeY - 7, tw, 10);
        this.ctx.fillStyle = '#000';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(badgeText, badgeX + tw / 2, badgeY);
      }
    }

    // 召唤兽主人指示器（蓝色菱形）
    if (entity.type === 'summon') {
      const indicatorY = screenY - 18;
      this.ctx.fillStyle = '#4488ff';
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, indicatorY - 4);
      this.ctx.lineTo(centerX + 3, indicatorY);
      this.ctx.lineTo(centerX, indicatorY + 4);
      this.ctx.lineTo(centerX - 3, indicatorY);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // 血条
    if (entity.hp !== undefined && entity.maxHp !== undefined && entity.maxHp > 0) {
      const barWidth = 30;
      const barHeight = 3;
      const barX = centerX - barWidth / 2;
      const barY = screenY + tileSize - 6;
      const hpRatio = Math.max(0, entity.hp / entity.maxHp);

      // 背景
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

      // 血条颜色
      let hpColor = '#44ff44';
      if (hpRatio < 0.3) hpColor = '#ff4444';
      else if (hpRatio < 0.6) hpColor = '#ffaa44';

      this.ctx.fillStyle = hpColor;
      this.ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    }

    // 死亡标记
    if (entity.isDead) {
      this.ctx.fillStyle = 'rgba(255,0,0,0.5)';
      this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
      this.ctx.font = '16px sans-serif';
      this.ctx.fillStyle = '#ff0000';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('✕', centerX, bodyY);
    }
  }

  // 颜色辅助方法 - 亮化颜色
  private lightenColor(hex: string, amount: number): string {
    try {
      if (!hex || !hex.startsWith('#') || hex.length < 7) return hex;
      const color = hex.replace('#', '');
      const r = Math.min(255, parseInt(color.substring(0, 2), 16) + amount);
      const g = Math.min(255, parseInt(color.substring(2, 4), 16) + amount);
      const b = Math.min(255, parseInt(color.substring(4, 6), 16) + amount);
      if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
      return `rgb(${r},${g},${b})`;
    } catch {
      return hex;
    }
  }

  // 颜色辅助方法 - 暗化颜色
  private darkenColor(hex: string, amount: number): string {
    try {
      if (!hex || !hex.startsWith('#') || hex.length < 7) return hex;
      const color = hex.replace('#', '');
      const r = Math.max(0, parseInt(color.substring(0, 2), 16) - amount);
      const g = Math.max(0, parseInt(color.substring(2, 4), 16) - amount);
      const b = Math.max(0, parseInt(color.substring(4, 6), 16) - amount);
      if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
      return `rgb(${r},${g},${b})`;
    } catch {
      return hex;
    }
  }

  private renderPlayerIndicator() {
    if (!this.ctx) return;
    const { tileSize, viewportWidth, viewportHeight } = this.config;
    const centerX = viewportWidth / 2 * tileSize + tileSize / 2;
    const centerY = viewportHeight / 2 * tileSize + tileSize / 2;

    // 尝试使用精灵图渲染玩家
    const playerSpriteName = PLAYER_SPRITE_MAP[this.playerClass];
    const playerSpritePath = playerSpriteName ? `/sprites/characters/${playerSpriteName}.png` : null;
    const playerSprite = playerSpritePath ? this.getSprite(playerSpritePath) : null;

    if (playerSprite) {
      // 精灵图渲染模式
      const drawSize = tileSize * 1.2;
      const drawX = centerX - drawSize / 2;
      const drawY = centerY - drawSize / 2;

      // 脉冲光环（在精灵图下方）
      const pulseSize = 3 + Math.sin(this.time / 300) * 2;
      this.ctx.strokeStyle = `rgba(255, 255, 100, ${0.3 + Math.sin(this.time / 300) * 0.15})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, drawSize * 0.5 + pulseSize, 0, Math.PI * 2);
      this.ctx.stroke();

      // 圆形裁切绘制精灵图
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, drawSize * 0.45, 0, Math.PI * 2);
      this.ctx.closePath();
      this.ctx.clip();
      this.ctx.drawImage(playerSprite, drawX, drawY, drawSize, drawSize);
      this.ctx.restore();

      // 白色圆形边框
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, drawSize * 0.45, 0, Math.PI * 2);
      this.ctx.stroke();

      // 方向指示器
      this.ctx.fillStyle = '#ffff00';
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY - drawSize * 0.5, 3, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // 传统蓝色圆球回退
      // 玩家身体
      this.ctx.fillStyle = '#4488ff';
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      this.ctx.fill();

      // 玩家轮廓
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      this.ctx.stroke();

      // 脉冲光环
      const pulseSize = 3 + Math.sin(this.time / 300) * 2;
      this.ctx.strokeStyle = `rgba(255, 255, 100, ${0.3 + Math.sin(this.time / 300) * 0.15})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, 18 + pulseSize, 0, Math.PI * 2);
      this.ctx.stroke();

      // 玩家方向指示器
      this.ctx.fillStyle = '#ffff00';
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY - 14, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  // 环境光照效果
  private renderAmbientEffects(mapId: string) {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const mapDef = MAP_DEFINITIONS[mapId];

    // 基于地图类型的环境色温
    if (mapDef?.type === 'dungeon') {
      // 副本：暗红色暗角效果
      const gradient = this.ctx.createRadialGradient(w/2, h/2, Math.min(w, h) * 0.2, w/2, h/2, Math.min(w, h) * 0.7);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.5, 'rgba(20,0,0,0.2)');
      gradient.addColorStop(1, 'rgba(40,0,0,0.5)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, w, h);
    } else {
      // 野外：轻微暗角 + 环境色
      const gradient = this.ctx.createRadialGradient(w/2, h/2, Math.min(w, h) * 0.3, w/2, h/2, Math.min(w, h) * 0.8);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.7, 'rgba(0,0,0,0.05)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.25)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, w, h);
    }

    // 简单的粒子效果（漂浮尘埃/萤火虫）
    const particleCount = mapDef?.type === 'dungeon' ? 3 : 5;
    for (let i = 0; i < particleCount; i++) {
      const seed = Math.floor(this.time / 2000) + i * 100;
      const px = (this.tileHash(seed, i * 17) * w);
      const py = (this.tileHash(i * 31, seed) * h);
      const alpha = 0.2 + Math.sin(this.time / 1000 + i * 2) * 0.15;
      const size = 1 + Math.sin(this.time / 800 + i) * 0.5;

      if (mapDef?.type === 'dungeon') {
        // 副本中的红色火光粒子
        this.ctx.fillStyle = `rgba(255, 100, 50, ${alpha})`;
      } else {
        // 野外的绿色/黄色萤火虫
        this.ctx.fillStyle = `rgba(200, 255, 100, ${alpha * 0.8})`;
      }
      this.ctx.beginPath();
      this.ctx.arc(px, py, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private renderDamageNumbers(
    numbers: DamageNumber[],
    startTileX: number,
    startTileY: number,
    subTileX: number,
    subTileY: number
  ) {
    if (!this.ctx) return;
    const { tileSize } = this.config;
    const now = Date.now();

    for (const num of numbers) {
      const age = now - num.timestamp;
      if (age > 1500) continue;

      const relX = num.x - startTileX;
      const relY = num.y - startTileY;
      const screenX = relX * tileSize - subTileX + tileSize / 2;
      const screenY = relY * tileSize - subTileY - 20 - (age / 50);

      const alpha = Math.max(0, 1 - age / 1500);

      this.ctx.font = num.isCrit ? 'bold 16px sans-serif' : 'bold 12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = `rgba(0,0,0,${alpha * 0.7})`;
      this.ctx.fillText(`-${num.value}`, screenX + 1, screenY + 1);
      if (num.color.startsWith('#')) {
        const r = parseInt(num.color.slice(1, 3), 16);
        const g = parseInt(num.color.slice(3, 5), 16);
        const b = parseInt(num.color.slice(5, 7), 16);
        this.ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      } else if (num.color.startsWith('rgb')) {
        this.ctx.fillStyle = num.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
      } else {
        this.ctx.fillStyle = `rgba(255,255,50,${alpha})`;
      }
      this.ctx.fillText(`-${num.value}`, screenX, screenY);
    }
  }

  private renderParticles(
    particles: ParticleEffect[],
    startTileX: number,
    startTileY: number,
    subTileX: number,
    subTileY: number
  ) {
    if (!this.ctx) return;
    const { tileSize } = this.config;
    const now = Date.now();

    for (const p of particles) {
      const age = now - p.timestamp;
      if (age > p.duration) continue;

      const relX = p.x - startTileX;
      const relY = p.y - startTileY;
      const screenX = relX * tileSize - subTileX + tileSize / 2;
      const screenY = relY * tileSize - subTileY + tileSize / 2;

      const progress = age / p.duration;
      const alpha = 1 - progress;

      switch (p.type) {
        case 'hit':
          // 攻击命中粒子
          for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + progress * 3;
            const dist = progress * 15;
            const px = screenX + Math.cos(angle) * dist;
            const py = screenY + Math.sin(angle) * dist;
            this.ctx.fillStyle = `rgba(255,200,50,${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 2, 0, Math.PI * 2);
            this.ctx.fill();
          }
          break;
        case 'heal':
          // 治疗粒子
          for (let i = 0; i < 3; i++) {
            const py = screenY - progress * 20 - i * 5;
            const px = screenX + Math.sin(progress * 5 + i) * 5;
            this.ctx.fillStyle = `rgba(50,255,50,${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 2, 0, Math.PI * 2);
            this.ctx.fill();
          }
          break;
        case 'levelup':
          // 升级特效
          const radius = progress * 30;
          this.ctx.strokeStyle = `rgba(255,215,0,${alpha})`;
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
          this.ctx.stroke();
          break;
        case 'skill':
          // 技能特效
          const skillRadius = 10 + progress * 20;
          this.ctx.strokeStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(screenX, screenY, skillRadius, 0, Math.PI * 2);
          this.ctx.stroke();
          break;
        case 'death':
          // 死亡特效
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = progress * 25;
            const px = screenX + Math.cos(angle) * dist;
            const py = screenY + Math.sin(angle) * dist;
            this.ctx.fillStyle = `rgba(200,50,50,${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 3 * (1 - progress), 0, Math.PI * 2);
            this.ctx.fill();
          }
          break;
      }
    }
  }

  // 渲染地面掉落物品
  renderGroundItems(
    groundItems: GroundItem[],
    playerX: number,
    playerY: number
  ) {
    if (!this.ctx || !this.canvas) return;
    if (groundItems.length === 0) return;

    const { tileSize, viewportWidth, viewportHeight } = this.config;
    const vpHalfW = Math.floor(viewportWidth / 2);
    const vpHalfH = Math.floor(viewportHeight / 2);
    const startTileX = Math.floor(playerX) - vpHalfW;
    const startTileY = Math.floor(playerY) - vpHalfH;
    const subTileX = (playerX - Math.floor(playerX)) * tileSize;
    const subTileY = (playerY - Math.floor(playerY)) * tileSize;
    const ctx = this.ctx;
    const now = this.time;

    // Rarity color map - 参考传奇的颜色
    const rarityColorMap: Record<string, string> = {
      common: '#cccccc',
      uncommon: '#1eff00',
      rare: '#0070dd',
      epic: '#a335ee',
      legendary: '#ff8000',
      mythic: '#e6cc80',
    };

    for (const item of groundItems) {
      const relX = item.x - startTileX;
      const relY = item.y - startTileY;
      const screenX = relX * tileSize - subTileX + tileSize / 2;
      const screenY = relY * tileSize - subTileY + tileSize / 2;

      // Skip off-screen items
      if (screenX < -tileSize * 2 || screenX > (viewportWidth + 2) * tileSize ||
          screenY < -tileSize * 2 || screenY > (viewportHeight + 2) * tileSize) {
        continue;
      }

      const color = rarityColorMap[item.rarity] || '#ffffff';

      // 解析颜色用于rgba
      let gr = 255, gg = 255, gb = 255;
      try {
        if (color.startsWith('#') && color.length >= 7) {
          gr = parseInt(color.slice(1, 3), 16);
          gg = parseInt(color.slice(3, 5), 16);
          gb = parseInt(color.slice(5, 7), 16);
        }
      } catch {}

      // 脉动光晕 - 增大可见度
      const pulseAlpha = 0.5 + Math.sin(now / 300) * 0.3;
      const glowRadius = 12 + Math.sin(now / 300) * 3;

      // 外层光晕
      const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowRadius + 6);
      gradient.addColorStop(0, `rgba(${gr},${gg},${gb},${pulseAlpha})`);
      gradient.addColorStop(0.5, `rgba(${gr},${gg},${gb},${pulseAlpha * 0.4})`);
      gradient.addColorStop(1, `rgba(${gr},${gg},${gb},0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, glowRadius + 6, 0, Math.PI * 2);
      ctx.fill();

      // 物品方块背景 - 参考传奇的物品方块图标
      ctx.fillStyle = `rgba(${gr},${gg},${gb},0.3)`;
      ctx.fillRect(screenX - 7, screenY - 7, 14, 14);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX - 7, screenY - 7, 14, 14);

      // 中心点 - 更明显
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.9 + Math.sin(now / 200) * 0.1;
      ctx.beginPath();
      ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // 闪烁粒子 - 围绕物品旋转
      for (let i = 0; i < 4; i++) {
        const angle = (now / 500 + i * (Math.PI * 2 / 4));
        const sparkDist = 10 + Math.sin(now / 400 + i) * 3;
        const sx = screenX + Math.cos(angle) * sparkDist;
        const sy = screenY + Math.sin(angle) * sparkDist;
        const sparkAlpha = 0.4 + Math.sin(now / 200 + i * 2) * 0.4;
        ctx.fillStyle = color;
        ctx.globalAlpha = Math.max(0, sparkAlpha);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // 物品名称 - 显示在物品上方
      ctx.font = 'bold 11px sans-serif';
      // 文字背景
      const textWidth = ctx.measureText(item.name).width;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(screenX - textWidth / 2 - 3, screenY - 22, textWidth + 6, 14);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.95;
      ctx.textAlign = 'center';
      ctx.fillText(item.name, screenX, screenY - 12);
      ctx.textAlign = 'left'; // reset
      ctx.globalAlpha = 1.0;
    }
  }

  // 渲染小地图
  renderMinimap(
    minimapCanvas: HTMLCanvasElement,
    playerX: number,
    playerY: number,
    mapId: string,
    entities: EntityRenderInfo[],
    groundItems?: { id: string; x: number; y: number; rarity: string }[]
  ) {
    const mctx = minimapCanvas.getContext('2d');
    if (!mctx) return;

    const mapDef = MAP_DEFINITIONS[mapId];
    if (!mapDef) return;

    const mw = minimapCanvas.width;
    const mh = minimapCanvas.height;
    const scaleX = mw / mapDef.width;
    const scaleY = mh / mapDef.height;

    // 背景
    mctx.fillStyle = '#0a0a0a';
    mctx.fillRect(0, 0, mw, mh);

    // 简化的地图渲染（采样渲染）
    const step = Math.max(1, Math.floor(mapDef.width / mw));
    for (let y = 0; y < mapDef.height; y += step) {
      for (let x = 0; x < mapDef.width; x += step) {
        const tile = getMapTile(mapId, x, y);
        const color = getTileColor(tile);
        mctx.fillStyle = color;
        mctx.fillRect(x * scaleX, y * scaleY, Math.max(1, step * scaleX) + 0.5, Math.max(1, step * scaleY) + 0.5);
      }
    }

    // 实体点 - 增大标记和字体
    for (const e of entities) {
      const ex = e.x * scaleX;
      const ey = e.y * scaleY;
      
      if (e.type === 'npc') {
        // NPC: gold diamond with name label
        mctx.fillStyle = '#ffcc00';
        mctx.beginPath();
        mctx.moveTo(ex, ey - 4);
        mctx.lineTo(ex + 3, ey);
        mctx.lineTo(ex, ey + 4);
        mctx.lineTo(ex - 3, ey);
        mctx.closePath();
        mctx.fill();
        // NPC name label
        mctx.font = '9px sans-serif';
        mctx.fillStyle = '#ffcc00';
        mctx.fillText(e.name, ex + 5, ey + 3);
      } else if (e.type === 'monster' && e.size >= 24) {
        // Boss: red circle with name
        mctx.fillStyle = '#ff2222';
        mctx.beginPath();
        mctx.arc(ex, ey, 4, 0, Math.PI * 2);
        mctx.fill();
        mctx.strokeStyle = '#ff6666';
        mctx.lineWidth = 1;
        mctx.stroke();
        mctx.font = '9px sans-serif';
        mctx.fillStyle = '#ff6666';
        mctx.fillText(e.name, ex + 5, ey + 3);
      } else if (e.type === 'monster') {
        mctx.fillStyle = '#ff4444';
        mctx.beginPath();
        mctx.arc(ex, ey, 2, 0, Math.PI * 2);
        mctx.fill();
      } else if (e.type === 'bot') {
        mctx.fillStyle = '#4488ff';
        mctx.beginPath();
        mctx.arc(ex, ey, 2, 0, Math.PI * 2);
        mctx.fill();
      } else if (e.type === 'summon') {
        mctx.fillStyle = '#88ccff';
        mctx.beginPath();
        mctx.arc(ex, ey, 2, 0, Math.PI * 2);
        mctx.fill();
      }
    }

    // 地面掉落物品 - 在小地图上显示
    if (groundItems && groundItems.length > 0) {
      const rarityColorMap: Record<string, string> = {
        common: '#cccccc',
        uncommon: '#1eff00',
        rare: '#0070dd',
        epic: '#a335ee',
        legendary: '#ff8000',
        mythic: '#e6cc80',
      };
      for (const gi of groundItems) {
        const ix = gi.x * scaleX;
        const iy = gi.y * scaleY;
        mctx.fillStyle = rarityColorMap[gi.rarity] || '#cccccc';
        mctx.beginPath();
        mctx.arc(ix, iy, 2, 0, Math.PI * 2);
        mctx.fill();
      }
    }

    // 玩家位置 with direction indicator
    const px = playerX * scaleX;
    const py = playerY * scaleY;
    // 玩家光晕
    mctx.strokeStyle = '#00ff8866';
    mctx.lineWidth = 1.5;
    mctx.beginPath();
    mctx.arc(px, py, 6, 0, Math.PI * 2);
    mctx.stroke();
    // 玩家点
    mctx.fillStyle = '#ffffff';
    mctx.beginPath();
    mctx.arc(px, py, 4, 0, Math.PI * 2);
    mctx.fill();
    // Direction triangle
    mctx.fillStyle = '#00ff88';
    mctx.beginPath();
    mctx.moveTo(px, py - 8);
    mctx.lineTo(px - 4, py - 3);
    mctx.lineTo(px + 4, py - 3);
    mctx.closePath();
    mctx.fill();

    // 视口框
    const vpW = 25 * scaleX;
    const vpH = 19 * scaleY;
    mctx.strokeStyle = 'rgba(255,255,255,0.5)';
    mctx.lineWidth = 1;
    mctx.strokeRect(px - vpW / 2, py - vpH / 2, vpW, vpH);

    // 地图名称
    mctx.fillStyle = 'rgba(0,0,0,0.6)';
    mctx.fillRect(2, 2, 80, 16);
    mctx.font = 'bold 11px sans-serif';
    mctx.fillStyle = '#ffd700';
    mctx.fillText(mapDef.name, 5, 14);

    // Legend in bottom-left corner
    mctx.fillStyle = 'rgba(0,0,0,0.6)';
    mctx.fillRect(2, mh - 22, 78, 20);
    mctx.font = '8px sans-serif';
    mctx.fillStyle = '#ff4444';
    mctx.fillText('●怪', 5, mh - 12);
    mctx.fillStyle = '#ffcc00';
    mctx.fillText('◆NPC', 28, mh - 12);
    mctx.fillStyle = '#ffffff';
    mctx.fillText('●玩家', 55, mh - 12);

    // Semi-transparent border around minimap
    mctx.strokeStyle = 'rgba(217, 119, 6, 0.5)';
    mctx.lineWidth = 2;
    mctx.strokeRect(0, 0, mw, mh);
  }

  destroy() {
    this.canvas = null;
    this.ctx = null;
  }
}

export const renderer = new GameRenderer();
