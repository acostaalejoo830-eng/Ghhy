import { ParsedHtmlGame, PlacedCharacter, CustomGlbExportData } from '../types/character';

/**
 * Converts a base64 string to an ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Parses an exported or standalone 3D HTML game file.
 * Extracts sculpted mountain terrain heights, placed characters,
 * active preset, and any embedded base64 GLB models/animations.
 */
export function parseGameHtml(htmlContent: string): ParsedHtmlGame {
  let heights: number[] | undefined;
  let placedCharacters: PlacedCharacter[] | undefined;
  let activePresetId: string | undefined;
  let title: string | undefined;

  const customGlbData: CustomGlbExportData = {
    baseModelBuffer: null,
    animations: {
      idle: null,
      walk: null,
      jump: null,
      attack: null,
    },
  };

  const animationSlotsLoaded = {
    idle: false,
    walk: false,
    jump: false,
    attack: false,
  };

  // 1. Title
  const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // 2. Terrain heights: const savedHeights = [...];
  const heightsMatch = htmlContent.match(/(?:const|var|let)\s+savedHeights\s*=\s*(\[[0-9.,\s\-eE]+\]);/);
  if (heightsMatch) {
    try {
      const parsed = JSON.parse(heightsMatch[1]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        heights = parsed;
      }
    } catch (e) {
      console.warn('Could not parse savedHeights from HTML:', e);
    }
  }

  // 3. Placed characters: const savedPlaced = [...];
  const placedMatch = htmlContent.match(/(?:const|var|let)\s+savedPlaced\s*=\s*(\[[^;]+\]);/);
  if (placedMatch) {
    try {
      const parsed = JSON.parse(placedMatch[1]);
      if (Array.isArray(parsed)) {
        placedCharacters = parsed;
      }
    } catch (e) {
      console.warn('Could not parse savedPlaced from HTML:', e);
    }
  }

  // 4. Active Preset
  const presetMatch = htmlContent.match(/(?:const|var|let)\s+activePreset\s*=\s*["']([^"']+)["']/);
  if (presetMatch) {
    activePresetId = presetMatch[1];
  }

  // 5. Embedded GLB data (glbData object)
  const glbBlockMatch = htmlContent.match(/const\s+glbData\s*=\s*(\{[\s\S]*?\n\s*\};)/);
  if (glbBlockMatch) {
    const glbBlock = glbBlockMatch[1];

    const extractBase64Field = (fieldName: string): string | null => {
      // Matches: model: "..." or model: '...' or null
      const reg = new RegExp(`${fieldName}\\s*:\\s*(?:"([^"]+)"|'([^']+)')`);
      const m = glbBlock.match(reg);
      return m ? (m[1] || m[2]) : null;
    };

    const modelB64 = extractBase64Field('model');
    const idleB64 = extractBase64Field('idle');
    const walkB64 = extractBase64Field('walk');
    const jumpB64 = extractBase64Field('jump');
    const attackB64 = extractBase64Field('attack');

    if (modelB64) {
      try {
        customGlbData.baseModelBuffer = base64ToArrayBuffer(modelB64);
      } catch (err) {
        console.warn('Failed to decode model buffer from HTML:', err);
      }
    }

    if (idleB64) {
      try {
        customGlbData.animations.idle = base64ToArrayBuffer(idleB64);
        animationSlotsLoaded.idle = true;
      } catch (err) {
        console.warn('Failed to decode idle animation buffer from HTML:', err);
      }
    }

    if (walkB64) {
      try {
        customGlbData.animations.walk = base64ToArrayBuffer(walkB64);
        animationSlotsLoaded.walk = true;
      } catch (err) {
        console.warn('Failed to decode walk animation buffer from HTML:', err);
      }
    }

    if (jumpB64) {
      try {
        customGlbData.animations.jump = base64ToArrayBuffer(jumpB64);
        animationSlotsLoaded.jump = true;
      } catch (err) {
        console.warn('Failed to decode jump animation buffer from HTML:', err);
      }
    }

    if (attackB64) {
      try {
        customGlbData.animations.attack = base64ToArrayBuffer(attackB64);
        animationSlotsLoaded.attack = true;
      } catch (err) {
        console.warn('Failed to decode attack animation buffer from HTML:', err);
      }
    }
  }

  const hasTerrain = !!(heights && heights.length > 0);
  const hasCustomModel = !!(
    customGlbData.baseModelBuffer ||
    customGlbData.animations.idle ||
    customGlbData.animations.walk ||
    customGlbData.animations.jump ||
    customGlbData.animations.attack
  );

  return {
    title: title || 'Juego 3D Importado',
    heights,
    placedCharacters,
    activePresetId: activePresetId || 'runner',
    customGlbData: hasCustomModel ? customGlbData : null,
    hasTerrain,
    hasCustomModel,
    animationSlotsLoaded,
  };
}
