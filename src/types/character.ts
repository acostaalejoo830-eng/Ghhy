/**
 * Types and interfaces for the 3D Character and Animation System
 */

export type AnimationType = 'idle' | 'walk' | 'jump' | 'attack' | 'skysurf';

export type LobbyBackdropMode = 'hangar3d' | 'image2d' | 'object3d';

export interface LobbyConfig {
  backdropMode: LobbyBackdropMode;
  customImageUrl?: string | null; // Data URL or base64 image
  customImageFileName?: string | null;
  presetImageId?: string; // 'runway' | 'clouds_plane' | 'hangar_art' | 'cyber_platform'
  customPlaneBuffer?: ArrayBuffer | null;
  customPlaneFileName?: string | null;
  customLobbyObjectBuffer?: ArrayBuffer | null;
  customLobbyObjectFileName?: string | null;
}

export interface AnimationSlotConfig {
  id: AnimationType;
  filePattern: string; // e.g. "model__28_"
  labelEs: string;
  labelEn: string;
  description: string;
  keyboardHint: string;
  badgeColor: string;
  isLoaded: boolean;
  fileName?: string;
  clipName?: string;
  duration?: number;
}

export const DEFAULT_ANIMATION_SLOTS: Record<AnimationType, AnimationSlotConfig> = {
  idle: {
    id: 'idle',
    filePattern: 'model__28_',
    labelEs: 'Quieto (Idle)',
    labelEn: 'Idle',
    description: 'Animación de postura de reposo cuando el personaje está quieto.',
    keyboardHint: 'Sin teclas',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    isLoaded: false,
  },
  walk: {
    id: 'walk',
    filePattern: 'model__27_',
    labelEs: 'Caminar (Walk)',
    labelEn: 'Walk',
    description: 'Animación de locomoción atlética al presionar WASD o joystick.',
    keyboardHint: 'W, A, S, D',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    isLoaded: false,
  },
  jump: {
    id: 'jump',
    filePattern: 'model__26_',
    labelEs: 'Saltar (Jump)',
    labelEn: 'Jump',
    description: 'Animación de impulso acrobático y suspensión en el aire.',
    keyboardHint: 'Barra Espaciadora',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    isLoaded: false,
  },
  attack: {
    id: 'attack',
    filePattern: 'model__25_',
    labelEs: 'Atacar / Golpe (Attack)',
    labelEn: 'Attack',
    description: 'Animación de impacto marcial, golpe de energía o combo cuerpo a cuerpo.',
    keyboardHint: 'Click Izq. o Tecla F',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    isLoaded: false,
  },
  skysurf: {
    id: 'skysurf',
    filePattern: 'model__24_',
    labelEs: 'Tabla de Surf (Caída lenta)',
    labelEn: 'Sky Surf (Glider)',
    description: 'Animación y planeo suave con tabla de surf cibernética mecida por el viento.',
    keyboardHint: 'Tecla E o Botón Surf',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    isLoaded: false,
  },
};

export interface LoadedModelAsset {
  id: AnimationType;
  fileName: string;
  fileSize: number;
  buffer: ArrayBuffer;
  duration?: number;
}

export type SceneLightingMode = 'daylight' | 'dusk' | 'cyberpunk';
export type CameraMode = 'follow' | 'orbit';
export type PerformanceMode = 'fast' | 'ultra';

export type TerrainBrushTool = 'raise' | 'lower' | 'smooth' | 'flatten';

export interface CharacterPreset {
  id: string;
  name: string;
  role: string;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  description: string;
}

export interface PlacedCharacter {
  id: string;
  name: string;
  presetId: string;
  x: number;
  z: number;
  rotation: number;
  currentAnimation: AnimationType;
  animTime: number;
}

export interface CustomGlbExportData {
  baseModelBuffer?: ArrayBuffer | null;
  animations: {
    idle?: ArrayBuffer | null;
    walk?: ArrayBuffer | null;
    jump?: ArrayBuffer | null;
    attack?: ArrayBuffer | null;
    skysurf?: ArrayBuffer | null;
  };
  customPlaneBuffer?: ArrayBuffer | null;
  customLobbyObjectBuffer?: ArrayBuffer | null;
  lobbyConfig?: {
    backdropMode: LobbyBackdropMode;
    customImageBase64?: string | null;
    presetImageId?: string;
  };
}

export interface SavedProject {
  id: string;
  name: string;
  updatedAt: number;
  createdAt?: number;
  heights: number[];
  placedCharacters: PlacedCharacter[];
  activePresetId: string;
  customGlbData?: CustomGlbExportData | null;
  slotsInfo?: Record<AnimationType, { isLoaded: boolean; fileName?: string }>;
  lobbyConfig?: LobbyConfig;
}

export interface ParsedHtmlGame {
  heights?: number[];
  placedCharacters?: PlacedCharacter[];
  activePresetId?: string;
  customGlbData?: CustomGlbExportData | null;
  title?: string;
  hasTerrain: boolean;
  hasCustomModel: boolean;
  lobbyConfig?: {
    backdropMode?: LobbyBackdropMode;
    customImageBase64?: string | null;
    presetImageId?: string;
  };
  animationSlotsLoaded: {
    idle: boolean;
    walk: boolean;
    jump: boolean;
    attack: boolean;
    skysurf?: boolean;
  };
}

