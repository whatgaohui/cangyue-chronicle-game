// 传奇存档系统 - Multi-Character Save/Load System using localStorage

import type { CharacterClass } from './classes';
import type { EquipmentSlotType } from '../store/gameStore';

// Type aliases for save data
type SkillId = string;

// QuestState is defined inline since we don't have a separate quests module
interface QuestState {
  id: string;
  name: string;
  description: string;
  type: 'kill' | 'collect' | 'talk';
  targetId: string;
  current: number;
  target: number;
  isComplete: boolean;
  reward: { exp: number; gold: number; items?: string[] };
}

const SAVE_KEY = 'legend_of_mir_saves';
const MAX_CHARACTERS = 20;

export interface SaveData {
  player: {
    name: string;
    classType: CharacterClass;
    level: number;
    xp: number;
    hp: number;
    mp: number;
    gold: number;
    inventory: { itemId: string; quantity: number }[];
    equipment: { [slot: string]: { itemId: string; quantity: number } | null };
    activeSkills: SkillId[];
    currentMapId: string;
    position: { x: number; y: number };

    // New stats
    accuracy?: number;
    agility?: number;
    luck?: number;
    critRate?: number;
    critDamage?: number;
    physicalResistance?: number;
    magicResistance?: number;

    // New systems
    skillProficiency?: Record<string, number>;
    warSoulValue?: number;
    elementStacks?: number;
    elementType?: 'fire' | 'ice' | 'lightning' | 'none';

    // Growth systems
    innerPower?: number;
    maxInnerPower?: number;
    innerPowerLevel?: number;
    rebirthLevel?: number;
    rebirthPoints?: number;

    // Enchanting
    enchantLevel?: Record<EquipmentSlotType, number>;

    // PVP / PK
    pkMode?: 'peace' | 'team' | 'guild' | 'goodEvil' | 'all';
    pkValue?: number;

    // Economy
    boundGold?: number;
    ingot?: number;
    gloryPoints?: number;

    // Guild
    guildId?: string;
    guildName?: string;
  };
  quests: QuestState[];
  timestamp: number;

  // Achievement tracking
  achievementTracking?: {
    collectedItems: string[];
    visitedMaps: string[];
    experiencedWeathers: string[];
    totalKills: number;
  };
}

export interface CharacterSlot {
  id: string;
  name: string;
  classType: CharacterClass;
  level: number;
  lastPlayed: number;
  saveData: SaveData;
}

export interface MultiSaveData {
  version: number;
  characters: CharacterSlot[];
  lastActiveCharacterId: string | null;
}

export interface PlayerSaveData {
  name: string;
  classType: CharacterClass;
  level: number;
  xp: number;
  hp: number;
  mp: number;
  gold: number;
  inventory: { itemId: string; quantity: number }[];
  equipment: { [slot: string]: { itemId: string; quantity: number } | null };
  activeSkills: SkillId[];
  currentMapId?: string;
  position: { x: number; y: number };

  // New stats
  accuracy?: number;
  agility?: number;
  luck?: number;
  critRate?: number;
  critDamage?: number;
  physicalResistance?: number;
  magicResistance?: number;

  // New systems
  skillProficiency?: Record<string, number>;
  warSoulValue?: number;
  elementStacks?: number;
  elementType?: 'fire' | 'ice' | 'lightning' | 'none';

  // Growth systems
  innerPower?: number;
  maxInnerPower?: number;
  innerPowerLevel?: number;
  rebirthLevel?: number;
  rebirthPoints?: number;

  // Enchanting
  enchantLevel?: Record<EquipmentSlotType, number>;

  // PVP / PK
  pkMode?: 'peace' | 'team' | 'guild' | 'goodEvil' | 'all';
  pkValue?: number;

  // Economy
  boundGold?: number;
  ingot?: number;
  gloryPoints?: number;

  // Guild
  guildId?: string;
  guildName?: string;
}

// ---- Helper: Migrate old single-character save to new format ----
function migrateOldSave(): MultiSaveData | null {
  try {
    const oldRaw = localStorage.getItem('legend_of_mir_save');
    if (!oldRaw) return null;
    const oldData = JSON.parse(oldRaw);
    if (!oldData?.player?.name) return null;

    const characterId = `char_${Date.now()}`;
    const migrated: MultiSaveData = {
      version: 2,
      characters: [{
        id: characterId,
        name: oldData.player.name,
        classType: oldData.player.classType,
        level: oldData.player.level || 1,
        lastPlayed: oldData.timestamp || Date.now(),
        saveData: oldData,
      }],
      lastActiveCharacterId: characterId,
    };

    // Save in new format and remove old
    localStorage.setItem(SAVE_KEY, JSON.stringify(migrated));
    localStorage.removeItem('legend_of_mir_save');
    console.log('[Save] Migrated old single-character save to new multi-character format');
    return migrated;
  } catch (e) {
    console.error('[Save] Failed to migrate old save:', e);
    return null;
  }
}

// ---- Load all character saves ----
export function loadAllSaves(): MultiSaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      // Try to migrate old format
      const migrated = migrateOldSave();
      if (migrated) return migrated;
      return { version: 2, characters: [], lastActiveCharacterId: null };
    }
    const data = JSON.parse(raw) as MultiSaveData;
    if (!data.version || data.version < 2) {
      // Migrate
      const migrated = migrateOldSave();
      if (migrated) return migrated;
    }
    return data;
  } catch (e) {
    console.error('[Save] Failed to load saves:', e);
    return { version: 2, characters: [], lastActiveCharacterId: null };
  }
}

// ---- Save all character data ----
function saveAllSaves(data: MultiSaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[Save] Failed to save:', e);
  }
}

// ---- Get character list (summary for selection screen) ----
export function getCharacterList(): { id: string; name: string; classType: CharacterClass; level: number; lastPlayed: number }[] {
  const saves = loadAllSaves();
  return saves.characters.map(c => ({
    id: c.id,
    name: c.name,
    classType: c.classType,
    level: c.level,
    lastPlayed: c.lastPlayed,
  }));
}

// ---- Get max character count ----
export function getMaxCharacters(): number {
  return MAX_CHARACTERS;
}

// ---- Check if can create new character ----
export function canCreateCharacter(): boolean {
  const saves = loadAllSaves();
  return saves.characters.length < MAX_CHARACTERS;
}

// ---- Save a character (create or update) ----
export function saveCharacter(characterId: string, state: { player: PlayerSaveData | null; currentMapId: string; quests: QuestState[]; trackedCollectedItems?: string[]; trackedVisitedMaps?: string[]; trackedExperiencedWeathers?: string[]; trackedTotalKills?: number }): string | null {
  try {
    const { player, currentMapId, quests } = state;
    if (!player) return null;

    const saves = loadAllSaves();
    const equip = player.equipment;
    const saveData: SaveData = {
      player: {
        name: player.name,
        classType: player.classType,
        level: player.level,
        xp: player.xp,
        hp: player.hp,
        mp: player.mp,
        gold: player.gold,
        inventory: player.inventory.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
        })),
        equipment: {
          weapon: equip.weapon ? { itemId: equip.weapon.itemId, quantity: equip.weapon.quantity } : null,
          body: equip.body ? { itemId: equip.body.itemId, quantity: equip.body.quantity } : null,
          head: equip.head ? { itemId: equip.head.itemId, quantity: equip.head.quantity } : null,
          necklace: equip.necklace ? { itemId: equip.necklace.itemId, quantity: equip.necklace.quantity } : null,
          ring1: equip.ring1 ? { itemId: equip.ring1.itemId, quantity: equip.ring1.quantity } : null,
          ring2: equip.ring2 ? { itemId: equip.ring2.itemId, quantity: equip.ring2.quantity } : null,
          bracelet1: equip.bracelet1 ? { itemId: equip.bracelet1.itemId, quantity: equip.bracelet1.quantity } : null,
          bracelet2: equip.bracelet2 ? { itemId: equip.bracelet2.itemId, quantity: equip.bracelet2.quantity } : null,
          belt: equip.belt ? { itemId: equip.belt.itemId, quantity: equip.belt.quantity } : null,
          feet: equip.feet ? { itemId: equip.feet.itemId, quantity: equip.feet.quantity } : null,
          medal: equip.medal ? { itemId: equip.medal.itemId, quantity: equip.medal.quantity } : null,
          jade: equip.jade ? { itemId: equip.jade.itemId, quantity: equip.jade.quantity } : null,
        },
        activeSkills: player.activeSkills,
        currentMapId: currentMapId,
        position: { x: player.position.x, y: player.position.y },

        // New stats
        accuracy: player.accuracy,
        agility: player.agility,
        luck: player.luck,
        critRate: player.critRate,
        critDamage: player.critDamage,
        physicalResistance: player.physicalResistance,
        magicResistance: player.magicResistance,

        // New systems
        skillProficiency: player.skillProficiency,
        warSoulValue: player.warSoulValue,
        elementStacks: player.elementStacks,
        elementType: player.elementType,

        // Growth systems
        innerPower: player.innerPower,
        maxInnerPower: player.maxInnerPower,
        innerPowerLevel: player.innerPowerLevel,
        rebirthLevel: player.rebirthLevel,
        rebirthPoints: player.rebirthPoints,

        // Enchanting
        enchantLevel: player.enchantLevel,

        // PVP / PK
        pkMode: player.pkMode,
        pkValue: player.pkValue,

        // Economy
        boundGold: player.boundGold,
        ingot: player.ingot,
        gloryPoints: player.gloryPoints,

        // Guild
        guildId: player.guildId,
        guildName: player.guildName,
      },
      quests: quests || [],
      timestamp: Date.now(),

      // Achievement tracking
      achievementTracking: {
        collectedItems: state.trackedCollectedItems || [],
        visitedMaps: state.trackedVisitedMaps || [],
        experiencedWeathers: state.trackedExperiencedWeathers || [],
        totalKills: state.trackedTotalKills || 0,
      },
    };

    // Find existing character or create new slot
    const existingIndex = saves.characters.findIndex(c => c.id === characterId);
    if (existingIndex >= 0) {
      // Update existing
      saves.characters[existingIndex] = {
        ...saves.characters[existingIndex],
        name: player.name,
        classType: player.classType,
        level: player.level,
        lastPlayed: Date.now(),
        saveData,
      };
    } else {
      // Create new character slot
      if (saves.characters.length >= MAX_CHARACTERS) {
        console.error('[Save] Max character limit reached');
        return null;
      }
      saves.characters.push({
        id: characterId,
        name: player.name,
        classType: player.classType,
        level: player.level,
        lastPlayed: Date.now(),
        saveData,
      });
    }

    saves.lastActiveCharacterId = characterId;
    saveAllSaves(saves);
    return characterId;
  } catch (e) {
    console.error('[Save] Failed to save character:', e);
    return null;
  }
}

// ---- Load a specific character ----
export function loadCharacter(characterId: string): SaveData | null {
  const saves = loadAllSaves();
  const character = saves.characters.find(c => c.id === characterId);
  if (!character) return null;

  // Update last active
  saves.lastActiveCharacterId = characterId;
  character.lastPlayed = Date.now();
  saveAllSaves(saves);

  return character.saveData;
}

// ---- Delete a character ----
export function deleteCharacter(characterId: string): boolean {
  const saves = loadAllSaves();
  const index = saves.characters.findIndex(c => c.id === characterId);
  if (index < 0) return false;

  saves.characters.splice(index, 1);
  if (saves.lastActiveCharacterId === characterId) {
    saves.lastActiveCharacterId = saves.characters.length > 0 ? saves.characters[0].id : null;
  }
  saveAllSaves(saves);
  return true;
}

// ---- Get last active character ----
export function getLastActiveCharacter(): SaveData | null {
  const saves = loadAllSaves();
  if (!saves.lastActiveCharacterId) return null;
  return loadCharacter(saves.lastActiveCharacterId);
}

// ---- Generate a unique character ID ----
export function generateCharacterId(): string {
  return `char_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ---- Backward-compatible functions for old code ----
export function saveGame(state: { player: PlayerSaveData | null; currentMapId: string; quests: QuestState[]; trackedCollectedItems?: string[]; trackedVisitedMaps?: string[]; trackedExperiencedWeathers?: string[]; trackedTotalKills?: number; activeCharacterId?: string }): void {
  const characterId = state.activeCharacterId || generateCharacterId();
  saveCharacter(characterId, state);
}

export function loadGame(): SaveData | null {
  return getLastActiveCharacter();
}

export function hasSaveData(): boolean {
  const saves = loadAllSaves();
  return saves.characters.length > 0;
}

export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem('legend_of_mir_save'); // Clean up old format too
  } catch (e) {
    console.error('[Save] Failed to delete save:', e);
  }
}

// Auto-save with throttle - only saves if at least 10 seconds have passed since last save
let lastAutoSaveTime = 0;
const AUTO_SAVE_THROTTLE = 10000; // 10 seconds

export function autoSave(state: { player: PlayerSaveData | null; currentMapId: string; quests: QuestState[]; trackedCollectedItems?: string[]; trackedVisitedMaps?: string[]; trackedExperiencedWeathers?: string[]; trackedTotalKills?: number; activeCharacterId?: string }): void {
  const now = Date.now();
  if (now - lastAutoSaveTime < AUTO_SAVE_THROTTLE) return;
  lastAutoSaveTime = now;
  saveGame(state);
}
