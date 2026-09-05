import * as THREE from 'three';
import { CharacterPreset } from '../types/character';

export interface ProceduralCharacterRig {
  root: THREE.Group;
  hips: THREE.Group;
  chest: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  leftForearm: THREE.Group;
  rightArm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  leftShin: THREE.Group;
  rightLeg: THREE.Group;
  rightShin: THREE.Group;
  leftHand: THREE.Group;
  rightHand: THREE.Group;
  materials: THREE.Material[];
}

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: 'mecha',
    name: 'Robot Vanguard',
    role: 'Unidad de Asalto Pesado',
    primaryColor: 0x18181b,
    secondaryColor: 0xdc2626,
    accentColor: 0xef4444,
    description: 'Robot militar de asalto con blindaje reforzado y reactor de energía carmesí.',
  },
  {
    id: 'robot',
    name: 'Androide Cyber',
    role: 'Unidad Táctica',
    primaryColor: 0x0f172a,
    secondaryColor: 0x06b6d4,
    accentColor: 0x22d3ee,
    description: 'Chasis de titanio con reactor de energía de neón.',
  },
  {
    id: 'ninja',
    name: 'Cyber Ninja',
    role: 'Velocista Sigiloso',
    primaryColor: 0x18181b,
    secondaryColor: 0x7c3aed,
    accentColor: 0xa855f7,
    description: 'Armadura ligera de fibra de carbono con propulsores de salto dinámico.',
  },
  {
    id: 'explorer',
    name: 'Robot Explorador',
    role: 'Topógrafo de Montaña',
    primaryColor: 0x262626,
    secondaryColor: 0x10b981,
    accentColor: 0x34d399,
    description: 'Equipamiento reforzado para escalar relieves, pendientes y colinas.',
  },
  {
    id: 'runner',
    name: 'Androide Atlético',
    role: 'Atleta Runner Core',
    primaryColor: 0x1e293b,
    secondaryColor: 0xe0a93b,
    accentColor: 0x38bdf8,
    description: 'Estructura aerodinámica de alta velocidad y respuesta instantánea.',
  },
];

/**
 * Creates a clean athletic humanoid character WITHOUT swords or shields
 */
export function createProceduralHumanoid(presetId: string = 'runner'): ProceduralCharacterRig {
  const root = new THREE.Group();
  root.name = `ProceduralHumanoid_${presetId}`;

  const preset = CHARACTER_PRESETS.find(p => p.id === presetId) || CHARACTER_PRESETS[0];

  const materials: THREE.Material[] = [];

  const mainMat = new THREE.MeshStandardMaterial({
    color: preset.primaryColor,
    roughness: 0.4,
    metalness: 0.6,
  });
  materials.push(mainMat);

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: preset.secondaryColor,
    roughness: 0.35,
    metalness: 0.5,
  });
  materials.push(secondaryMat);

  const glowMat = new THREE.MeshStandardMaterial({
    color: preset.accentColor,
    emissive: preset.accentColor,
    emissiveIntensity: 0.7,
    roughness: 0.2,
    metalness: 0.8,
  });
  materials.push(glowMat);

  const suitClothMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7,
    metalness: 0.1,
  });
  materials.push(suitClothMat);

  const applyShadows = (mesh: THREE.Mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  };

  // --- Pelvis / Hips ---
  const hips = new THREE.Group();
  hips.position.y = 1.0;
  root.add(hips);

  const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.2, 8), mainMat);
  applyShadows(pelvisMesh);
  hips.add(pelvisMesh);

  const beltMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.06, 8), secondaryMat);
  beltMesh.position.y = 0.08;
  applyShadows(beltMesh);
  hips.add(beltMesh);

  // --- Chest / Torso ---
  const chest = new THREE.Group();
  chest.position.y = 0.16;
  hips.add(chest);

  const spineMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 0.2, 8), suitClothMat);
  spineMesh.position.y = 0.09;
  applyShadows(spineMesh);
  chest.add(spineMesh);

  const upperChestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.3, 0.26), mainMat);
  upperChestMesh.position.y = 0.3;
  applyShadows(upperChestMesh);
  chest.add(upperChestMesh);

  // Glowing chest emblem / core
  const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 8), glowMat);
  chestCore.rotation.x = Math.PI / 2;
  chestCore.position.set(0, 0.3, 0.14);
  chest.add(chestCore);

  // --- Head & Visor ---
  const head = new THREE.Group();
  head.position.y = 0.52;
  chest.add(head);

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.1, 6), suitClothMat);
  neckMesh.position.y = 0.04;
  applyShadows(neckMesh);
  head.add(neckMesh);

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.26), mainMat);
  headMesh.position.y = 0.2;
  applyShadows(headMesh);
  head.add(headMesh);

  // Sleek visor
  const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.06), glowMat);
  visorMesh.position.set(0, 0.2, 0.13);
  head.add(visorMesh);

  // --- Left Arm & Hand (No weapons!) ---
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.32, 0.36, 0);
  chest.add(leftArm);

  const leftShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), secondaryMat);
  applyShadows(leftShoulder);
  leftArm.add(leftShoulder);

  const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.26, 6), suitClothMat);
  leftUpperArm.position.y = -0.13;
  applyShadows(leftUpperArm);
  leftArm.add(leftUpperArm);

  const leftForearm = new THREE.Group();
  leftForearm.position.y = -0.26;
  leftArm.add(leftForearm);

  const leftLowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.24, 6), mainMat);
  leftLowerArm.position.y = -0.12;
  applyShadows(leftLowerArm);
  leftForearm.add(leftLowerArm);

  // Clean athletic hand/glove
  const leftHand = new THREE.Group();
  leftHand.position.y = -0.25;
  leftForearm.add(leftHand);

  const leftGlove = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), secondaryMat);
  applyShadows(leftGlove);
  leftHand.add(leftGlove);

  // --- Right Arm & Hand (No weapons!) ---
  const rightArm = new THREE.Group();
  rightArm.position.set(0.32, 0.36, 0);
  chest.add(rightArm);

  const rightShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), secondaryMat);
  applyShadows(rightShoulder);
  rightArm.add(rightShoulder);

  const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.26, 6), suitClothMat);
  rightUpperArm.position.y = -0.13;
  applyShadows(rightUpperArm);
  rightArm.add(rightUpperArm);

  const rightForearm = new THREE.Group();
  rightForearm.position.y = -0.26;
  rightArm.add(rightForearm);

  const rightLowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.24, 6), mainMat);
  rightLowerArm.position.y = -0.12;
  applyShadows(rightLowerArm);
  rightForearm.add(rightLowerArm);

  // Clean athletic hand/glove
  const rightHand = new THREE.Group();
  rightHand.position.y = -0.25;
  rightForearm.add(rightHand);

  const rightGlove = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), secondaryMat);
  applyShadows(rightGlove);
  rightHand.add(rightGlove);

  // --- Left Leg & Foot ---
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.15, -0.06, 0);
  hips.add(leftLeg);

  const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.42, 6), suitClothMat);
  leftThigh.position.y = -0.21;
  applyShadows(leftThigh);
  leftLeg.add(leftThigh);

  const leftShin = new THREE.Group();
  leftShin.position.y = -0.42;
  leftLeg.add(leftShin);

  const leftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 6), mainMat);
  leftCalf.position.y = -0.21;
  applyShadows(leftCalf);
  leftShin.add(leftCalf);

  const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.24), secondaryMat);
  leftFoot.position.set(0, -0.42, 0.05);
  applyShadows(leftFoot);
  leftShin.add(leftFoot);

  // --- Right Leg & Foot ---
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.15, -0.06, 0);
  hips.add(rightLeg);

  const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.42, 6), suitClothMat);
  rightThigh.position.y = -0.21;
  applyShadows(rightThigh);
  rightLeg.add(rightThigh);

  const rightShin = new THREE.Group();
  rightShin.position.y = -0.42;
  rightLeg.add(rightShin);

  const rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 6), mainMat);
  rightCalf.position.y = -0.21;
  applyShadows(rightCalf);
  rightShin.add(rightCalf);

  const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.24), secondaryMat);
  rightFoot.position.set(0, -0.42, 0.05);
  applyShadows(rightFoot);
  rightShin.add(rightFoot);

  return {
    root,
    hips,
    chest,
    head,
    leftArm,
    leftForearm,
    rightArm,
    rightForearm,
    leftLeg,
    leftShin,
    rightLeg,
    rightShin,
    leftHand,
    rightHand,
    materials,
  };
}

/**
 * Updates procedural animation posing for the weaponless humanoid
 */
export function updateHumanoidPose(
  rig: ProceduralCharacterRig,
  animation: 'idle' | 'walk' | 'jump' | 'attack' | 'skysurf',
  animTime: number,
  attackProgress: number // 0 to 1
): void {
  const { hips, chest, head, leftArm, leftForearm, rightArm, rightForearm, leftLeg, leftShin, rightLeg, rightShin } = rig;

  // Reset basic defaults
  hips.position.x = 0;
  hips.position.z = 0;
  hips.rotation.set(0, 0, 0);
  chest.rotation.set(0, 0, 0);
  head.rotation.set(0, 0, 0);

  if (animation === 'idle') {
    // Model__28_ style Idle: relaxed athletic readiness, subtle natural breathing
    const breathe = Math.sin(animTime * 2.4);
    const sway = Math.cos(animTime * 1.2);

    hips.position.y = 1.0 + breathe * 0.02;
    hips.rotation.y = sway * 0.03;
    chest.rotation.x = breathe * 0.02;
    chest.rotation.z = -sway * 0.02;
    head.rotation.y = -sway * 0.025;

    // Relaxed arms at sides
    leftArm.rotation.x = 0.08 + breathe * 0.02;
    leftArm.rotation.z = -0.15;
    leftForearm.rotation.x = -0.25;

    rightArm.rotation.x = 0.08 + breathe * 0.02;
    rightArm.rotation.z = 0.15;
    rightForearm.rotation.x = -0.25;

    // Legs firmly grounded
    leftLeg.rotation.x = 0.02;
    leftLeg.rotation.z = -0.04;
    leftShin.rotation.x = -0.02;

    rightLeg.rotation.x = -0.02;
    rightLeg.rotation.z = 0.04;
    rightShin.rotation.x = 0.02;

  } else if (animation === 'walk') {
    // Model__27_ style Walk: athletic stride, balanced arm counter-swings, spring in hips
    const walkSpeed = 7.5;
    const t = animTime * walkSpeed;
    const stride = Math.sin(t);
    const bounce = Math.abs(Math.cos(t));

    hips.position.y = 0.98 + bounce * 0.05;
    hips.rotation.y = -stride * 0.12;
    chest.rotation.y = stride * 0.1;
    chest.rotation.x = 0.08; // athletic forward lean

    // Alternating leg stride
    leftLeg.rotation.x = stride * 0.65;
    leftShin.rotation.x = stride > 0 ? -stride * 0.45 : -0.08;

    rightLeg.rotation.x = -stride * 0.65;
    rightShin.rotation.x = stride < 0 ? stride * 0.45 : -0.08;

    // Natural arm swinging with elbows slightly flexed
    leftArm.rotation.x = -stride * 0.55;
    leftArm.rotation.z = -0.12;
    leftForearm.rotation.x = -0.3;

    rightArm.rotation.x = stride * 0.55;
    rightArm.rotation.z = 0.12;
    rightForearm.rotation.x = -0.3;

  } else if (animation === 'jump') {
    // Model__26_ style Jump: athletic vertical leap, dynamic knee flexion, stabilizing arms
    const t = Math.min(animTime * 4.0, Math.PI);
    const airCurve = Math.sin(t);

    hips.position.y = 1.0 + airCurve * 0.6;
    hips.rotation.x = -0.1;
    chest.rotation.x = -0.12;

    // Legs tucked dynamically
    leftLeg.rotation.x = -0.7;
    leftShin.rotation.x = -0.8;
    rightLeg.rotation.x = -0.6;
    rightShin.rotation.x = -0.7;

    // Arms out for balance
    leftArm.rotation.x = -0.4;
    leftArm.rotation.z = -0.5;
    leftForearm.rotation.x = -0.2;

    rightArm.rotation.x = -0.4;
    rightArm.rotation.z = 0.5;
    rightForearm.rotation.x = -0.2;

  } else if (animation === 'attack') {
    // Model__25_ style Attack: Powerful martial strike & energy punch combo (NO SWORD!)
    const p = Math.max(0, Math.min(1, attackProgress));

    if (p < 0.25) {
      // Wind-up: pull back right fist, pivot torso into strike position
      const phase = p / 0.25;
      hips.rotation.y = -0.4 * phase;
      chest.rotation.y = -0.5 * phase;

      rightArm.rotation.x = -0.6 * phase;
      rightArm.rotation.z = 0.3 * phase;
      rightForearm.rotation.x = -1.2 * phase;

      leftArm.rotation.x = 0.3 * phase;
      leftArm.rotation.z = -0.3 * phase;
    } else if (p < 0.65) {
      // Impact thrust: explosive forward martial punch!
      const phase = (p - 0.25) / 0.4;
      const strike = Math.sin(phase * Math.PI * 0.5);

      hips.rotation.y = -0.4 + 0.8 * strike;
      chest.rotation.y = -0.5 + 1.1 * strike;
      chest.rotation.x = 0.15 * strike;

      rightArm.rotation.x = -0.6 + 1.6 * strike; // Punch forward
      rightArm.rotation.z = 0.1 * strike;
      rightForearm.rotation.x = -0.2;

      leftArm.rotation.x = -0.4 * strike;
      leftArm.rotation.z = -0.4;

      // Solid martial stance
      leftLeg.rotation.x = 0.35 * strike;
      rightLeg.rotation.x = -0.45 * strike;
    } else {
      // Recovery back to athletic ready stance
      const phase = (p - 0.65) / 0.35;
      const rec = 1 - phase;

      hips.rotation.y = 0.4 * rec;
      chest.rotation.y = 0.6 * rec;
      chest.rotation.x = 0.15 * rec;

      rightArm.rotation.x = 1.0 * rec;
      rightForearm.rotation.x = -0.2 * rec;

      leftLeg.rotation.x = 0.35 * rec;
      rightLeg.rotation.x = -0.45 * rec;
    }
  } else if (animation === 'skysurf') {
    // Cyber Skysurf pose: Athletic surfer stance, crouched knees riding the hoverboard,
    // arms extended for wind balance, floating with aerodynamic updrafts
    const windBreeze = Math.sin(animTime * 3.2);
    const windRoll = Math.cos(animTime * 2.2);

    hips.position.y = 0.9 + windBreeze * 0.04;
    // Pivot hips sideways like a real surfer on a board
    hips.rotation.y = -0.7 + windRoll * 0.06;
    hips.rotation.x = -0.15; // aerodynamic forward lean
    hips.rotation.z = windRoll * 0.08;

    chest.rotation.y = 0.5; // upper torso counter-rotates forward to face flight direction
    chest.rotation.x = -0.1 + windBreeze * 0.03;
    head.rotation.y = 0.25;

    // Surfer legs: deeply bent knees, athletic shock absorption on hoverboard
    leftLeg.rotation.x = -0.55;
    leftLeg.rotation.z = 0.15;
    leftShin.rotation.x = 0.65; // bent knee

    rightLeg.rotation.x = 0.35;
    rightLeg.rotation.z = -0.2;
    rightShin.rotation.x = 0.45;

    // Balancing arms cutting through the wind currents
    leftArm.rotation.x = -0.6 + windBreeze * 0.05;
    leftArm.rotation.z = -0.7;
    leftForearm.rotation.x = -0.3;

    rightArm.rotation.x = 0.4 + windBreeze * 0.05;
    rightArm.rotation.z = 0.8;
    rightForearm.rotation.x = -0.4;
  }
}
