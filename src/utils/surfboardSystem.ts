import * as THREE from 'three';

/**
 * Procedural Cyber Surfboard and Skysurf flight systems
 * Allows the robot to glide slowly through the wind when dropping from the airplane
 * or surfing the skies.
 */

export interface CyberSurfboardRig {
  root: THREE.Group;
  boardMesh: THREE.Mesh;
  leftThrusterGlow: THREE.Mesh;
  rightThrusterGlow: THREE.Mesh;
  windTrailLeft: THREE.Mesh;
  windTrailRight: THREE.Mesh;
  update: (time: number, isBankingLeft: boolean, isBankingRight: boolean) => void;
}

export function createCyberSurfboard(): CyberSurfboardRig {
  const root = new THREE.Group();
  root.name = 'CyberSurfboard';

  // 1. Board Main Body (Aerodynamic sci-fi hoverboard / skysurf shape)
  const boardShape = new THREE.Shape();
  // Nose (tapered aerodynamic point)
  boardShape.moveTo(0, 0.95);
  boardShape.bezierCurveTo(0.24, 0.7, 0.28, 0.2, 0.26, -0.4);
  // Split twin-tail
  boardShape.lineTo(0.22, -0.85);
  boardShape.lineTo(0.12, -0.72);
  boardShape.lineTo(0, -0.6);
  boardShape.lineTo(-0.12, -0.72);
  boardShape.lineTo(-0.22, -0.85);
  boardShape.lineTo(-0.26, -0.4);
  boardShape.bezierCurveTo(-0.28, 0.2, -0.24, 0.7, 0, 0.95);

  const extrudeSettings = {
    steps: 1,
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
  };

  const boardGeo = new THREE.ExtrudeGeometry(boardShape, extrudeSettings);
  // Orient board horizontally (X: width, Y: thickness, Z: length)
  boardGeo.rotateX(Math.PI / 2);
  boardGeo.center();

  // Dark stealth carbon material with cyber highlights
  const boardMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.25,
    metalness: 0.85,
  });

  const boardMesh = new THREE.Mesh(boardGeo, boardMat);
  boardMesh.castShadow = true;
  boardMesh.receiveShadow = true;
  root.add(boardMesh);

  // Top Neon Energy Inlay Strip (Red / Cyan glowing strip)
  const stripGeo = new THREE.PlaneGeometry(0.06, 1.4);
  stripGeo.rotateX(-Math.PI / 2);
  const stripMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4, // Cyan glow
  });
  const stripMesh = new THREE.Mesh(stripGeo, stripMat);
  stripMesh.position.y = 0.038;
  root.add(stripMesh);

  // Foot grip pads (front and rear)
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
  });
  const frontPad = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.015, 0.28), padMat);
  frontPad.position.set(0, 0.035, 0.28);
  root.add(frontPad);

  const rearPad = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.015, 0.26), padMat);
  rearPad.position.set(0, 0.035, -0.32);
  root.add(rearPad);

  // Twin Rear Ion Thrusters
  const thrusterGeo = new THREE.CylinderGeometry(0.045, 0.06, 0.16, 12);
  thrusterGeo.rotateX(Math.PI / 2);
  const thrusterMetalMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.9,
    roughness: 0.2,
  });

  const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMetalMat);
  leftThruster.position.set(-0.14, -0.01, -0.65);
  root.add(leftThruster);

  const rightThruster = new THREE.Mesh(thrusterGeo, thrusterMetalMat);
  rightThruster.position.set(0.14, -0.01, -0.65);
  root.add(rightThruster);

  // Glowing Plasma Exhaust Plumes
  const plumeGeo = new THREE.ConeGeometry(0.05, 0.28, 12);
  plumeGeo.rotateX(-Math.PI / 2);
  const plumeMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
  });

  const leftThrusterGlow = new THREE.Mesh(plumeGeo, plumeMat);
  leftThrusterGlow.position.set(-0.14, -0.01, -0.8);
  root.add(leftThrusterGlow);

  const rightThrusterGlow = new THREE.Mesh(plumeGeo, plumeMat);
  rightThrusterGlow.position.set(0.14, -0.01, -0.8);
  root.add(rightThrusterGlow);

  // Wind Trail Streaks (soft ribbons that extend behind the surfboard)
  const trailGeo = new THREE.PlaneGeometry(0.04, 1.2);
  trailGeo.rotateX(-Math.PI / 2);
  const trailMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
  });

  const windTrailLeft = new THREE.Mesh(trailGeo, trailMat);
  windTrailLeft.position.set(-0.22, 0, -1.1);
  root.add(windTrailLeft);

  const windTrailRight = new THREE.Mesh(trailGeo, trailMat);
  windTrailRight.position.set(0.22, 0, -1.1);
  root.add(windTrailRight);

  return {
    root,
    boardMesh,
    leftThrusterGlow,
    rightThrusterGlow,
    windTrailLeft,
    windTrailRight,
    update: (time: number, isBankingLeft: boolean, isBankingRight: boolean) => {
      // Gentle wind bobbing and tilt
      const windWave = Math.sin(time * 3.5);
      const windRoll = Math.cos(time * 2.2);

      let targetRoll = windRoll * 0.08;
      if (isBankingLeft) targetRoll = -0.35;
      if (isBankingRight) targetRoll = 0.35;

      root.rotation.z = THREE.MathUtils.lerp(root.rotation.z, targetRoll, 0.1);
      root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, -0.06 + windWave * 0.04, 0.1);

      // Pulse thruster plasma plumes with the wind
      const plumeScale = 1.0 + Math.sin(time * 18.0) * 0.25;
      leftThrusterGlow.scale.set(1, 1, plumeScale);
      rightThrusterGlow.scale.set(1, 1, plumeScale);

      // Flickering wind trails
      windTrailLeft.scale.set(1, 1, 0.8 + Math.random() * 0.4);
      windTrailRight.scale.set(1, 1, 0.8 + Math.random() * 0.4);
    },
  };
}
