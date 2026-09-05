import * as THREE from 'three';

/**
 * Creates the procedural textures for the sci-fi military hangar/bunker base
 * matching the user's reference image:
 * - Dark industrial tiled floor with reflective wet look
 * - Red diagonal hazard warning stripes on side borders
 * - Central tactical military/cyber wing chevron insignia
 */
export function createHangarFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const dummyCanvas = document.createElement('canvas');
    dummyCanvas.width = 16;
    dummyCanvas.height = 16;
    return new THREE.CanvasTexture(dummyCanvas);
  }

  // 1. Dark industrial wet metal base
  ctx.fillStyle = '#0e1420';
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Tile grid (squares)
  const tileSize = 128;
  ctx.strokeStyle = '#060a12';
  ctx.lineWidth = 4;
  for (let x = 0; x <= 1024; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Subtle surface noise / grunge
  for (let i = 0; i < 3000; i++) {
    const nx = Math.random() * 1024;
    const ny = Math.random() * 1024;
    const rad = Math.random() * 2 + 1;
    const alpha = Math.random() * 0.08;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(nx, ny, rad, rad);
  }

  // 3. Red diagonal hazard warning stripes (left and right flanks)
  const stripeWidth = 56;
  const stripeGap = 64;

  // Left flank hazard stripes
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 320, 1024);
  ctx.clip();
  ctx.fillStyle = '#dc2626';
  for (let i = -1024; i < 2048; i += stripeWidth + stripeGap) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + stripeWidth, 0);
    ctx.lineTo(i + stripeWidth + 600, 1024);
    ctx.lineTo(i + 600, 1024);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Right flank hazard stripes
  ctx.save();
  ctx.beginPath();
  ctx.rect(704, 0, 320, 1024);
  ctx.clip();
  ctx.fillStyle = '#dc2626';
  for (let i = 0; i < 3072; i += stripeWidth + stripeGap) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + stripeWidth, 0);
    ctx.lineTo(i + stripeWidth - 600, 1024);
    ctx.lineTo(i - 600, 1024);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 4. Central tactical military/cyber wing chevron insignia
  ctx.save();
  const cx = 512;
  const cy = 540;
  ctx.translate(cx, cy);

  // Emblem color: slightly weathered silver with high contrast
  ctx.fillStyle = 'rgba(226, 232, 240, 0.88)';
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.lineWidth = 3;

  // Center triangle chevron
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(-50, -45);
  ctx.lineTo(0, -20);
  ctx.lineTo(50, -45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Left wing chevron
  ctx.beginPath();
  ctx.moveTo(-18, -15);
  ctx.lineTo(-140, -110);
  ctx.lineTo(-85, -135);
  ctx.lineTo(-10, -55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right wing chevron
  ctx.beginPath();
  ctx.moveTo(18, -15);
  ctx.lineTo(140, -110);
  ctx.lineTo(85, -135);
  ctx.lineTo(10, -55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Outer lower wing accent chevrons
  ctx.beginPath();
  ctx.moveTo(-24, 25);
  ctx.lineTo(-110, -40);
  ctx.lineTo(-75, -60);
  ctx.lineTo(-15, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(24, 25);
  ctx.lineTo(110, -40);
  ctx.lineTo(75, -60);
  ctx.lineTo(15, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  // 5. Dark vignette overlay on the borders
  const grad = ctx.createRadialGradient(512, 512, 250, 512, 512, 700);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export interface HangarBaseEnvironment {
  group: THREE.Group;
  doorGroup: THREE.Group;
  redNeonLights: THREE.PointLight[];
  openDoors: (progress: number) => void;
  dispose: () => void;
}

/**
 * Builds the complete 3D military hangar/bunker base from the reference image:
 * - Angled trapezoidal bunker walls
 * - Corrugated blast door with top frosted window slats
 * - Atmospheric rim backlight through top window slats
 * - Glowing red neon light tubes on diagonal ceiling joints and floor rails
 * - Wet reflective floor with central insignia and warning chevrons
 * - Mop and bucket prop in the corner
 */
export function createHangarBase(): HangarBaseEnvironment {
  const group = new THREE.Group();
  group.name = 'HangarBaseEnvironment';

  const materialsToDispose: THREE.Material[] = [];
  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const texturesToDispose: THREE.Texture[] = [];
  const redNeonLights: THREE.PointLight[] = [];

  const baseWidth = 14;
  const baseDepth = 18;
  const baseHeight = 8.5;

  // 1. Floor
  const floorTex = createHangarFloorTexture();
  texturesToDispose.push(floorTex);

  const floorGeo = new THREE.PlaneGeometry(baseWidth, baseDepth);
  floorGeo.rotateX(-Math.PI / 2);
  geometriesToDispose.push(floorGeo);

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.28, // glossy wet reflection
    metalness: 0.65,
  });
  materialsToDispose.push(floorMat);

  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.set(0, 0, 0);
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // 2. Ceiling with corrugated panels and dark metal girders
  const ceilGeo = new THREE.PlaneGeometry(baseWidth * 0.75, baseDepth);
  ceilGeo.rotateX(Math.PI / 2);
  geometriesToDispose.push(ceilGeo);

  const ceilMat = new THREE.MeshStandardMaterial({
    color: 0x18202f,
    roughness: 0.75,
    metalness: 0.4,
  });
  materialsToDispose.push(ceilMat);

  const ceilMesh = new THREE.Mesh(ceilGeo, ceilMat);
  ceilMesh.position.set(0, baseHeight, 0);
  group.add(ceilMesh);

  // Ceiling structural transverse I-beams
  const beamMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.6,
    metalness: 0.7,
  });
  materialsToDispose.push(beamMat);

  for (let z = -baseDepth / 2 + 2; z <= baseDepth / 2; z += 3.8) {
    const beamGeo = new THREE.BoxGeometry(baseWidth * 0.75, 0.45, 0.3);
    geometriesToDispose.push(beamGeo);
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, baseHeight - 0.22, z);
    group.add(beam);
  }

  // 3. Side Walls (Angled lower-to-upper bunker shape)
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x141c2c,
    roughness: 0.7,
    metalness: 0.5,
  });
  materialsToDispose.push(wallMat);

  // Left vertical lower wall
  const lowerWallH = 5.2;
  const leftLowerGeo = new THREE.BoxGeometry(0.5, lowerWallH, baseDepth);
  geometriesToDispose.push(leftLowerGeo);
  const leftLower = new THREE.Mesh(leftLowerGeo, wallMat);
  leftLower.position.set(-baseWidth / 2, lowerWallH / 2, 0);
  group.add(leftLower);

  // Right vertical lower wall
  const rightLower = new THREE.Mesh(leftLowerGeo, wallMat);
  rightLower.position.set(baseWidth / 2, lowerWallH / 2, 0);
  group.add(rightLower);

  // Left sloped upper bunker wall
  const slopeGeo = new THREE.BoxGeometry(0.4, 4.2, baseDepth);
  geometriesToDispose.push(slopeGeo);
  const leftSlope = new THREE.Mesh(slopeGeo, wallMat);
  leftSlope.position.set(-baseWidth / 2 + 0.9, lowerWallH + 1.6, 0);
  leftSlope.rotation.z = -0.45;
  group.add(leftSlope);

  // Right sloped upper bunker wall
  const rightSlope = new THREE.Mesh(slopeGeo, wallMat);
  rightSlope.position.set(baseWidth / 2 - 0.9, lowerWallH + 1.6, 0);
  rightSlope.rotation.z = 0.45;
  group.add(rightSlope);

  // 4. Rear Industrial Gate / Blast Door (Back wall)
  const doorGroup = new THREE.Group();
  doorGroup.position.set(0, 0, -baseDepth / 2 + 0.2);
  group.add(doorGroup);

  // Door outer frame
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.5,
    metalness: 0.8,
  });
  materialsToDispose.push(frameMat);

  const doorWidth = 9.2;
  const doorHeight = 6.4;

  // Corrugated blast door panels
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x222d3d,
    roughness: 0.55,
    metalness: 0.65,
  });
  materialsToDispose.push(panelMat);

  const doorSlabGeo = new THREE.BoxGeometry(doorWidth, doorHeight, 0.25);
  geometriesToDispose.push(doorSlabGeo);
  const doorSlab = new THREE.Mesh(doorSlabGeo, panelMat);
  doorSlab.position.set(0, doorHeight / 2, 0);
  doorSlab.castShadow = true;
  doorGroup.add(doorSlab);

  // Horizontal reinforcing struts across the corrugated gate
  const strutMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.4,
    metalness: 0.8,
  });
  materialsToDispose.push(strutMat);

  for (let y = 1.0; y < doorHeight; y += 1.4) {
    const hStrutGeo = new THREE.BoxGeometry(doorWidth, 0.16, 0.35);
    geometriesToDispose.push(hStrutGeo);
    const hStrut = new THREE.Mesh(hStrutGeo, strutMat);
    hStrut.position.set(0, y, 0.08);
    doorGroup.add(hStrut);
  }

  // Vertical central dividing beams
  const vStrutGeo = new THREE.BoxGeometry(0.25, doorHeight, 0.35);
  geometriesToDispose.push(vStrutGeo);
  [-2.2, 0, 2.2].forEach((vx) => {
    const vStrut = new THREE.Mesh(vStrutGeo, strutMat);
    vStrut.position.set(vx, doorHeight / 2, 0.08);
    doorGroup.add(vStrut);
  });

  // 5. Top Window Slats / Frosted Glass Vents (Atmospheric Backlight)
  const windowCount = 8;
  const windowTotalW = doorWidth - 0.4;
  const slatW = windowTotalW / windowCount - 0.1;
  const slatH = 0.95;
  const slatY = doorHeight + 0.6;

  const windowGlassMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });
  materialsToDispose.push(windowGlassMat);

  const startX = -windowTotalW / 2 + slatW / 2;
  for (let i = 0; i < windowCount; i++) {
    const slatGeo = new THREE.PlaneGeometry(slatW, slatH);
    geometriesToDispose.push(slatGeo);
    const slat = new THREE.Mesh(slatGeo, windowGlassMat);
    slat.position.set(startX + i * (slatW + 0.1), slatY, -baseDepth / 2 + 0.25);
    group.add(slat);
  }

  // Strong warm-white backlight coming through the top windows (cinematic rim lighting)
  const backRimLight = new THREE.DirectionalLight(0xfff7ed, 3.2);
  backRimLight.position.set(0, slatY + 1, -baseDepth / 2 - 2);
  backRimLight.target.position.set(0, 1.2, 0);
  group.add(backRimLight);
  group.add(backRimLight.target);

  // 6. Glowing Red Neon Light Tubes (Matching the reference image!)
  const redNeonMat = new THREE.MeshBasicMaterial({
    color: 0xff1e38,
  });
  materialsToDispose.push(redNeonMat);

  // Top diagonal neon tubes along roof angles (Left and Right)
  const neonTubeLen = 14;
  const tubeGeo = new THREE.CylinderGeometry(0.045, 0.045, neonTubeLen, 8);
  tubeGeo.rotateX(Math.PI / 2);
  geometriesToDispose.push(tubeGeo);

  // Left top diagonal neon tube
  const leftTopNeon = new THREE.Mesh(tubeGeo, redNeonMat);
  leftTopNeon.position.set(-baseWidth / 2 + 1.2, baseHeight - 0.8, 0);
  group.add(leftTopNeon);

  // Right top diagonal neon tube
  const rightTopNeon = new THREE.Mesh(tubeGeo, redNeonMat);
  rightTopNeon.position.set(baseWidth / 2 - 1.2, baseHeight - 0.8, 0);
  group.add(rightTopNeon);

  // Floor side rail neon tubes (along bottom baseboards)
  const leftFloorNeon = new THREE.Mesh(tubeGeo, redNeonMat);
  leftFloorNeon.position.set(-baseWidth / 2 + 0.4, 0.08, 0);
  group.add(leftFloorNeon);

  const rightFloorNeon = new THREE.Mesh(tubeGeo, redNeonMat);
  rightFloorNeon.position.set(baseWidth / 2 - 0.4, 0.08, 0);
  group.add(rightFloorNeon);

  // Red point lights to cast neon glow on wet floor and robot
  const redLightLeft = new THREE.PointLight(0xff2244, 2.8, 14);
  redLightLeft.position.set(-baseWidth / 2 + 1.5, 1.5, 1.0);
  group.add(redLightLeft);
  redNeonLights.push(redLightLeft);

  const redLightRight = new THREE.PointLight(0xff2244, 2.8, 14);
  redLightRight.position.set(baseWidth / 2 - 1.5, 1.5, 1.0);
  group.add(redLightRight);
  redNeonLights.push(redLightRight);

  const redLightFront = new THREE.PointLight(0xff1e38, 2.2, 10);
  redLightFront.position.set(0, 0.6, 3.5);
  group.add(redLightFront);
  redNeonLights.push(redLightFront);

  // 7. Mop and Bucket Detail (In back right corner, exactly like the image!)
  const propGroup = new THREE.Group();
  propGroup.position.set(3.6, 0, -baseDepth / 2 + 1.6);
  group.add(propGroup);

  // Bucket
  const bucketGeo = new THREE.CylinderGeometry(0.38, 0.3, 0.48, 12);
  geometriesToDispose.push(bucketGeo);
  const bucketMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.6,
    metalness: 0.3,
  });
  materialsToDispose.push(bucketMat);
  const bucket = new THREE.Mesh(bucketGeo, bucketMat);
  bucket.position.y = 0.24;
  bucket.castShadow = true;
  propGroup.add(bucket);

  // Small detergent basin next to it
  const basinGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.22, 12);
  geometriesToDispose.push(basinGeo);
  const basinMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.5,
  });
  materialsToDispose.push(basinMat);
  const basin = new THREE.Mesh(basinGeo, basinMat);
  basin.position.set(0.65, 0.11, 0.2);
  basin.castShadow = true;
  propGroup.add(basin);

  // Mop handle leaning against the rear door frame
  const mopGeo = new THREE.CylinderGeometry(0.022, 0.022, 2.6, 8);
  geometriesToDispose.push(mopGeo);
  const mopMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.3,
    metalness: 0.8,
  });
  materialsToDispose.push(mopMat);
  const mop = new THREE.Mesh(mopGeo, mopMat);
  mop.position.set(0.1, 1.25, -0.2);
  mop.rotation.x = -0.32;
  mop.rotation.z = 0.18;
  propGroup.add(mop);

  // Function to animate door opening
  const openDoors = (progress: number) => {
    // Blast door raises upwards like an industrial hangar rolling gate
    doorGroup.position.y = progress * 7.0;
  };

  const dispose = () => {
    materialsToDispose.forEach((m) => m.dispose());
    geometriesToDispose.forEach((g) => g.dispose());
    texturesToDispose.forEach((t) => t.dispose());
  };

  return {
    group,
    doorGroup,
    redNeonLights,
    openDoors,
    dispose,
  };
}
