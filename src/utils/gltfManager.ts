import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationType } from '../types/character';

export interface ParsedAnimationResult {
  slot: AnimationType;
  fileName: string;
  clip: THREE.AnimationClip;
  duration: number;
}

export interface CustomCharacterState {
  model: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Record<AnimationType, THREE.AnimationAction | null>;
  currentAction: THREE.AnimationAction | null;
  currentType: AnimationType;
  skeletonHelper: THREE.SkeletonHelper | null;
}

/**
 * Detect which animation slot matches the given file name based on user specifications:
 * model__28_ = quieto (idle)
 * model__27_ = caminar (walk)
 * model__26_ = saltar (jump)
 * model__25_ = atacar (attack)
 */
export function detectSlotFromFileName(fileName: string): AnimationType | null {
  const lower = fileName.toLowerCase();

  // Strict number-based patterns
  if (lower.includes('28')) return 'idle';
  if (lower.includes('27')) return 'walk';
  if (lower.includes('26')) return 'jump';
  if (lower.includes('25')) return 'attack';

  // Keyword-based fallback
  if (lower.includes('idle') || lower.includes('quieto') || lower.includes('reposo')) return 'idle';
  if (lower.includes('walk') || lower.includes('caminar') || lower.includes('run') || lower.includes('correr')) return 'walk';
  if (lower.includes('jump') || lower.includes('saltar') || lower.includes('salto')) return 'jump';
  if (lower.includes('attack') || lower.includes('atacar') || lower.includes('golpe') || lower.includes('slash')) return 'attack';

  return null;
}

const loader = new GLTFLoader();

/**
 * Parses an ArrayBuffer containing a GLB / GLTF file
 */
export async function parseGLBBuffer(buffer: ArrayBuffer, fileName: string): Promise<GLTF> {
  if (!buffer || buffer.byteLength < 4) {
    throw new Error(`El archivo "${fileName}" está vacío o es demasiado pequeño para ser un modelo 3D.`);
  }

  const u8 = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 16));

  // Check if buffer starts with '<' (ASCII 60, e.g. <!DOCTYPE or <html from an HTTP error or SPA fallback)
  if (u8[0] === 0x3c) {
    throw new Error(`El archivo "${fileName}" contiene código HTML en lugar de un modelo 3D GLB/GLTF.`);
  }

  // Check for GLB binary magic: 'g' (0x67), 'l' (0x6c), 'T' (0x54), 'F' (0x46)
  const isGlb = u8[0] === 0x67 && u8[1] === 0x6c && u8[2] === 0x54 && u8[3] === 0x46;

  // Or glTF JSON: begins with '{' (0x7b) after skipping whitespace or BOM
  let isJson = false;
  for (let i = 0; i < u8.length; i++) {
    if (u8[i] === 0x7b) {
      isJson = true;
      break;
    }
    // Skip whitespace and UTF-8 BOM
    if (
      u8[i] !== 0x20 &&
      u8[i] !== 0x09 &&
      u8[i] !== 0x0a &&
      u8[i] !== 0x0d &&
      u8[i] !== 0xef &&
      u8[i] !== 0xbb &&
      u8[i] !== 0xbf
    ) {
      break;
    }
  }

  if (!isGlb && !isJson) {
    throw new Error(`El archivo "${fileName}" no tiene formato GLB binario ni glTF válido.`);
  }

  return new Promise((resolve, reject) => {
    loader.parse(
      buffer,
      '',
      (gltf) => resolve(gltf),
      (error) => reject(error)
    );
  });
}

/**
 * Normalizes a 3D model's scale and center to fit the standard game arena
 */
export function prepareModelForScene(gltfScene: THREE.Group, targetHeight: number = 2.0): THREE.Group {
  // Enable shadows on all child meshes
  gltfScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          m.side = THREE.DoubleSide;
        });
      }
    }
  });

  // Calculate bounding box and scale to standard height
  const bbox = new THREE.Box3().setFromObject(gltfScene);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());

  if (size.y > 0.001) {
    const scale = targetHeight / size.y;
    gltfScene.scale.set(scale, scale, scale);

    // Offset so feet rest on ground (y = 0)
    gltfScene.position.x = -center.x * scale;
    gltfScene.position.y = -bbox.min.y * scale;
    gltfScene.position.z = -center.z * scale;
  }

  const container = new THREE.Group();
  container.name = 'CustomGLBCharacterContainer';
  container.add(gltfScene);
  return container;
}
