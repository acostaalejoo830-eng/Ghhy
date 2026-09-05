import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export interface AirplaneRig {
  root: THREE.Group;
  dropPoint: THREE.Object3D;
  leftTurbine: THREE.Mesh;
  rightTurbine: THREE.Mesh;
  strobeLightLeft: THREE.PointLight;
  strobeLightRight: THREE.PointLight;
  exhaustLeft: THREE.Mesh;
  exhaustRight: THREE.Mesh;
  isCustomGlb: boolean;
  customModel?: THREE.Group;
  update: (delta: number, time: number) => void;
}

/**
 * Creates the procedural 3D Military Cargo Dropship
 * Sleek military transport aircraft with cockpit, dual wing jet engines,
 * rear open cargo bay ramp for dropping on the surfboard, and navigation strobes.
 */
export function createProceduralAirplane(): AirplaneRig {
  const root = new THREE.Group();
  root.name = 'MilitaryAirplane';

  // Base materials
  const fuselageMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Dark tactical navy/slate
    roughness: 0.35,
    metalness: 0.75,
  });

  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.4,
    metalness: 0.8,
  });

  const accentRedMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.3,
    metalness: 0.5,
  });

  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Glowing cockpit glass
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0x0369a1,
    emissiveIntensity: 0.4,
  });

  const jetGlowMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
  });

  // 1. Fuselage Body (Elongated cargo transport)
  const fuselageGeo = new THREE.BoxGeometry(3.6, 2.6, 14.0);
  const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
  fuselage.position.y = 0;
  fuselage.castShadow = true;
  fuselage.receiveShadow = true;
  root.add(fuselage);

  // Nose Cone (Beveled aerodynamic nose)
  const noseGeo = new THREE.ConeGeometry(1.8, 4.0, 8);
  noseGeo.rotateX(-Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, fuselageMat);
  nose.position.set(0, 0, 8.8);
  nose.castShadow = true;
  root.add(nose);

  // Cockpit Canopy Glass
  const cockpitGeo = new THREE.BoxGeometry(1.6, 0.9, 2.5);
  const cockpit = new THREE.Mesh(cockpitGeo, canopyMat);
  cockpit.position.set(0, 1.3, 5.5);
  cockpit.rotation.x = -0.22;
  root.add(cockpit);

  // 2. Main Wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(-1.6, 1.0);
  wingShape.lineTo(-12.0, -3.5);
  wingShape.lineTo(-12.0, -5.2);
  wingShape.lineTo(-1.6, -2.5);
  wingShape.closePath();

  const wingExtrude = { depth: 0.25, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 };
  const leftWingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrude);
  leftWingGeo.rotateX(Math.PI / 2);
  const leftWing = new THREE.Mesh(leftWingGeo, wingMat);
  leftWing.position.set(0, 0.6, 0);
  leftWing.castShadow = true;
  root.add(leftWing);

  // Right wing (Mirrored)
  const rightWingGeo = leftWingGeo.clone();
  rightWingGeo.scale(-1, 1, 1);
  const rightWing = new THREE.Mesh(rightWingGeo, wingMat);
  rightWing.position.set(0, 0.6, 0);
  rightWing.castShadow = true;
  root.add(rightWing);

  // Wingtip Hazard / Red stripes
  const wingtipDecalGeo = new THREE.BoxGeometry(1.2, 0.35, 1.8);
  const leftTip = new THREE.Mesh(wingtipDecalGeo, accentRedMat);
  leftTip.position.set(-11.5, 0.6, -4.2);
  root.add(leftTip);

  const rightTip = new THREE.Mesh(wingtipDecalGeo, accentRedMat);
  rightTip.position.set(11.5, 0.6, -4.2);
  root.add(rightTip);

  // 3. Dual Jet Turbofan Engines
  const enginePodGeo = new THREE.CylinderGeometry(0.85, 0.8, 3.8, 16);
  enginePodGeo.rotateX(Math.PI / 2);

  const engineMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.9,
    roughness: 0.2,
  });

  const leftEngine = new THREE.Mesh(enginePodGeo, engineMat);
  leftEngine.position.set(-5.5, -0.2, -0.5);
  leftEngine.castShadow = true;
  root.add(leftEngine);

  const rightEngine = new THREE.Mesh(enginePodGeo, engineMat);
  rightEngine.position.set(5.5, -0.2, -0.5);
  rightEngine.castShadow = true;
  root.add(rightEngine);

  // Front Turbine Blades
  const bladeGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.2, 8);
  bladeGeo.rotateX(Math.PI / 2);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95 });

  const leftTurbine = new THREE.Mesh(bladeGeo, bladeMat);
  leftTurbine.position.set(-5.5, -0.2, 1.4);
  root.add(leftTurbine);

  const rightTurbine = new THREE.Mesh(bladeGeo, bladeMat);
  rightTurbine.position.set(5.5, -0.2, 1.4);
  root.add(rightTurbine);

  // Jet Exhaust Glowing Cones
  const exhaustGeo = new THREE.ConeGeometry(0.7, 2.2, 16);
  exhaustGeo.rotateX(-Math.PI / 2);

  const exhaustLeft = new THREE.Mesh(exhaustGeo, jetGlowMat);
  exhaustLeft.position.set(-5.5, -0.2, -3.2);
  root.add(exhaustLeft);

  const exhaustRight = new THREE.Mesh(exhaustGeo, jetGlowMat);
  exhaustRight.position.set(5.5, -0.2, -3.2);
  root.add(exhaustRight);

  // 4. Twin Vertical Stabilizers (Tail Fins)
  const finGeo = new THREE.BoxGeometry(0.2, 3.2, 2.8);
  const leftFin = new THREE.Mesh(finGeo, wingMat);
  leftFin.position.set(-1.4, 2.5, -6.0);
  leftFin.rotation.z = -0.15;
  leftFin.castShadow = true;
  root.add(leftFin);

  const rightFin = new THREE.Mesh(finGeo, wingMat);
  rightFin.position.set(1.4, 2.5, -6.0);
  rightFin.rotation.z = 0.15;
  rightFin.castShadow = true;
  root.add(rightFin);

  // 5. Rear Cargo Bay & Open Ramp (Where character drops with surfboard)
  const bayInteriorGeo = new THREE.BoxGeometry(2.8, 2.0, 4.0);
  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.7,
  });
  const bayInterior = new THREE.Mesh(bayInteriorGeo, interiorMat);
  bayInterior.position.set(0, -0.1, -5.2);
  root.add(bayInterior);

  // Open Ramp extending downward out the back
  const rampGeo = new THREE.BoxGeometry(2.6, 0.15, 3.2);
  const rampMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.8,
    roughness: 0.3,
  });
  const ramp = new THREE.Mesh(rampGeo, rampMat);
  ramp.position.set(0, -1.2, -7.8);
  ramp.rotation.x = 0.35; // Angled down like open cargo door
  root.add(ramp);

  // Drop Point Anchor: The exact world space exit point where skysurf initiates
  const dropPoint = new THREE.Object3D();
  dropPoint.name = 'DropPoint';
  dropPoint.position.set(0, -1.4, -9.0);
  root.add(dropPoint);

  // 6. Navigation Strobe Lights (Blinking)
  const strobeLightLeft = new THREE.PointLight(0xff0000, 2, 25);
  strobeLightLeft.position.set(-12.0, 0.7, -4.2);
  root.add(strobeLightLeft);

  const strobeLightRight = new THREE.PointLight(0x00ff66, 2, 25);
  strobeLightRight.position.set(12.0, 0.7, -4.2);
  root.add(strobeLightRight);

  // Scale plane to impressive realistic presence
  root.scale.set(1.5, 1.5, 1.5);

  return {
    root,
    dropPoint,
    leftTurbine,
    rightTurbine,
    strobeLightLeft,
    strobeLightRight,
    exhaustLeft,
    exhaustRight,
    isCustomGlb: false,
    update: (delta: number, time: number) => {
      // Spin turbine blades
      leftTurbine.rotation.z += delta * 25.0;
      rightTurbine.rotation.z += delta * 25.0;

      // Pulse exhaust cones
      const pulse = 1.0 + Math.sin(time * 15.0) * 0.2;
      exhaustLeft.scale.set(1, 1, pulse);
      exhaustRight.scale.set(1, 1, pulse);

      // Blinking strobe lights (every 1 second flash)
      const strobeActive = Math.floor(time * 2.0) % 2 === 0 && (time * 10) % 10 < 2;
      strobeLightLeft.intensity = strobeActive ? 4.0 : 0.2;
      strobeLightRight.intensity = strobeActive ? 4.0 : 0.2;
    },
  };
}

/**
 * Loads a custom imported Airplane model from GLB buffer
 */
export async function loadCustomAirplaneGlb(buffer: ArrayBuffer): Promise<AirplaneRig> {
  const loader = new GLTFLoader();
  const gltf = await loader.parseAsync(buffer, '');

  const root = new THREE.Group();
  root.name = 'CustomImportedAirplane';

  const model = gltf.scene;

  // Auto-center and normalize scale
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const targetSize = 25.0; // Realistic large dropship scale
  const scale = targetSize / maxDim;
  model.scale.set(scale, scale, scale);

  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center.multiplyScalar(scale));

  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  root.add(model);

  // Position drop point behind the custom model
  const dropPoint = new THREE.Object3D();
  dropPoint.name = 'CustomDropPoint';
  dropPoint.position.set(0, -1.5, -targetSize * 0.55);
  root.add(dropPoint);

  // Strobe beacons
  const strobeLightLeft = new THREE.PointLight(0xff2222, 2, 25);
  strobeLightLeft.position.set(-targetSize * 0.45, 1, 0);
  root.add(strobeLightLeft);

  const strobeLightRight = new THREE.PointLight(0x22ff44, 2, 25);
  strobeLightRight.position.set(targetSize * 0.45, 1, 0);
  root.add(strobeLightRight);

  // Dummy meshes for uniform interface
  const dummyMesh = new THREE.Mesh();

  return {
    root,
    dropPoint,
    leftTurbine: dummyMesh,
    rightTurbine: dummyMesh,
    strobeLightLeft,
    strobeLightRight,
    exhaustLeft: dummyMesh,
    exhaustRight: dummyMesh,
    isCustomGlb: true,
    customModel: model,
    update: (_delta: number, time: number) => {
      const strobeActive = Math.floor(time * 2.0) % 2 === 0 && (time * 10) % 10 < 2;
      strobeLightLeft.intensity = strobeActive ? 4.0 : 0.2;
      strobeLightRight.intensity = strobeActive ? 4.0 : 0.2;
    },
  };
}
