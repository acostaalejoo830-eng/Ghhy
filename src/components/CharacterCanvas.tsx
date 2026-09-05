import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  AnimationType,
  CameraMode,
  SceneLightingMode,
  TerrainBrushTool,
  PlacedCharacter,
  PerformanceMode,
  LobbyConfig,
} from '../types/character';
import {
  createProceduralHumanoid,
  ProceduralCharacterRig,
  updateHumanoidPose,
} from '../utils/proceduralCharacter';
import { TerrainEngine } from '../utils/terrainEngine';
import { soundEngine } from '../audio/soundEffects';
import { createHangarBase, HangarBaseEnvironment } from '../utils/hangarEnvironment';
import { createCyberSurfboard, CyberSurfboardRig } from '../utils/surfboardSystem';
import { createProceduralAirplane, AirplaneRig } from '../utils/airplaneSystem';

interface CharacterCanvasProps {
  sceneViewMode?: 'lobby' | 'game';
  currentAnimation: AnimationType;
  onAnimationChange: (anim: AnimationType) => void;
  cameraMode: CameraMode;
  lightingMode: SceneLightingMode;
  showSkeleton: boolean;
  playbackSpeed: number;
  customModel: THREE.Group | null;
  customMixer: THREE.AnimationMixer | null;
  customActions: Record<AnimationType, THREE.AnimationAction | null>;
  onTriggerHit: (damage: number, dummyIndex: number) => void;
  activeAttackTrigger: number;
  virtualMove: { x: number; y: number };
  // Terrain & Sculpting
  terrainEngine: TerrainEngine;
  isTerrainEditorOpen: boolean;
  terrainTool: TerrainBrushTool;
  brushRadius: number;
  brushIntensity: number;
  // Multi-character system
  activePresetId: string;
  placedCharacters: PlacedCharacter[];
  currentActiveEntityId: string;
  // Performance
  performanceMode: PerformanceMode;
  // Feedback when player location changes
  onPlayerPositionChange?: (x: number, z: number) => void;
  onTerrainSculptEnd?: () => void;
  // Lobby, Airplane & Surfboard configurations
  lobbyConfig?: LobbyConfig;
  customPlaneModel?: THREE.Group | null;
  customLobbyObjectModel?: THREE.Group | null;
  isAirplaneDropping?: boolean;
  onAirplaneDropComplete?: () => void;
}

interface HitParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface TargetDummy {
  group: THREE.Group;
  crystalMesh: THREE.Mesh;
  baseY: number;
  hitTimer: number;
  health: number;
}

function createProceduralLobbyPedestal(): THREE.Group {
  const group = new THREE.Group();
  // Octagonal sci-fi platform base
  const baseGeo = new THREE.CylinderGeometry(2.3, 2.6, 0.4, 8);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.8,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = -0.2;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Outer glowing energy ring
  const ringGeo = new THREE.TorusGeometry(2.2, 0.05, 16, 32);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.02;
  group.add(ring);

  // Inner red accent ring
  const innerRingGeo = new THREE.TorusGeometry(1.5, 0.03, 16, 32);
  innerRingGeo.rotateX(Math.PI / 2);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
  });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.position.y = 0.02;
  group.add(innerRing);

  // Center hologram beacon
  const beaconGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 32);
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 0.01;
  group.add(beacon);

  return group;
}

export const CharacterCanvas: React.FC<CharacterCanvasProps> = ({
  sceneViewMode = 'lobby',
  currentAnimation,
  onAnimationChange,
  cameraMode,
  lightingMode,
  showSkeleton,
  playbackSpeed,
  customModel,
  customMixer,
  customActions,
  onTriggerHit,
  activeAttackTrigger,
  virtualMove,
  terrainEngine,
  isTerrainEditorOpen,
  terrainTool,
  brushRadius,
  brushIntensity,
  activePresetId,
  placedCharacters,
  currentActiveEntityId,
  performanceMode,
  onPlayerPositionChange,
  onTerrainSculptEnd,
  lobbyConfig,
  customPlaneModel,
  customLobbyObjectModel,
  isAirplaneDropping,
  onAirplaneDropComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const hangarEnvRef = useRef<HangarBaseEnvironment | null>(null);
  const sceneViewModeRef = useRef<'lobby' | 'game'>(sceneViewMode);

  useEffect(() => {
    sceneViewModeRef.current = sceneViewMode;
  }, [sceneViewMode]);

  // Lighting references
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

  // Player & Entities
  const playerGroupRef = useRef<THREE.Group>(new THREE.Group());
  const proceduralRigRef = useRef<ProceduralCharacterRig | null>(null);
  const skeletonHelperRef = useRef<THREE.SkeletonHelper | null>(null);

  // Spawned NPC rigs
  const npcRigsRef = useRef<Map<string, { group: THREE.Group; rig: ProceduralCharacterRig }>>(new Map());

  // Terrain Sculpt Cursor Indicator
  const brushCursorMeshRef = useRef<THREE.Mesh | null>(null);
  const isSculptingRef = useRef<boolean>(false);

  // Player Physics & Movement
  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const playerVelYRef = useRef<number>(0);
  const playerAngleRef = useRef<number>(0);
  const isGroundedRef = useRef<boolean>(true);
  const isAttackingRef = useRef<boolean>(false);
  const attackProgressRef = useRef<number>(0);
  const keyStateRef = useRef<Record<string, boolean>>({});

  // Combat & FX
  const targetsRef = useRef<TargetDummy[]>([]);
  const particlesRef = useRef<HitParticle[]>([]);
  const strikeShockwaveRef = useRef<THREE.Mesh | null>(null);
  const stepTimerRef = useRef<number>(0);

  // Surfboard, Airplane and Custom Lobby Object rigs
  const surfboardRigRef = useRef<CyberSurfboardRig | null>(null);
  const airplaneRigRef = useRef<AirplaneRig | null>(null);
  const lobbyObjectGroupRef = useRef<THREE.Group>(new THREE.Group());
  const isDroppingRef = useRef<boolean>(false);

  // GLTF Animation action
  const activeGLTFActionRef = useRef<THREE.AnimationAction | null>(null);
  const activeAnimationTypeRef = useRef<AnimationType>(currentAnimation);

  // Sync ref
  useEffect(() => {
    activeAnimationTypeRef.current = currentAnimation;
  }, [currentAnimation]);

  // Sync isAirplaneDropping
  useEffect(() => {
    if (isAirplaneDropping) {
      isDroppingRef.current = true;
      playerPosRef.current.set(0, 72, -25);
      playerAngleRef.current = 0;
      isGroundedRef.current = false;
      onAnimationChange('skysurf');
      soundEngine.playGameStart();
    }
  }, [isAirplaneDropping, onAnimationChange]);

  // Sync customLobbyObjectModel
  useEffect(() => {
    const group = lobbyObjectGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    if (customLobbyObjectModel) {
      group.add(customLobbyObjectModel);
    } else {
      group.add(createProceduralLobbyPedestal());
    }
  }, [customLobbyObjectModel]);

  // Sync customPlaneModel
  useEffect(() => {
    if (!airplaneRigRef.current) return;
    if (customPlaneModel) {
      airplaneRigRef.current.airplaneRoot.children.forEach((c) => {
        c.visible = false;
      });
      airplaneRigRef.current.airplaneRoot.add(customPlaneModel);
    }
  }, [customPlaneModel]);

  // Sync lobbyConfig backdrop mode
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    const isLobby = sceneViewModeRef.current === 'lobby';
    if (!isLobby) return;

    const mode = lobbyConfig?.backdropMode || 'hangar3d';
    if (hangarEnvRef.current) {
      hangarEnvRef.current.group.visible = mode === 'hangar3d';
    }
    if (lobbyObjectGroupRef.current) {
      lobbyObjectGroupRef.current.visible = mode === 'object3d';
    }

    if (mode === 'image2d') {
      sceneRef.current.background = null;
      rendererRef.current.setClearColor(0x000000, 0);
    } else {
      sceneRef.current.background = new THREE.Color(0x0a0c14);
      rendererRef.current.setClearColor(0x0a0c14, 1);
    }
  }, [lobbyConfig?.backdropMode]);

  // Handle sceneViewMode transitions
  useEffect(() => {
    if (!sceneRef.current) return;
    const isLobby = sceneViewMode === 'lobby';

    if (hangarEnvRef.current) {
      hangarEnvRef.current.group.visible = isLobby;
    }
    terrainEngine.data.mesh.visible = !isLobby;
    targetsRef.current.forEach((t) => {
      t.group.visible = !isLobby;
    });
    npcRigsRef.current.forEach(({ group }) => {
      group.visible = !isLobby;
    });

    if (isLobby) {
      playerPosRef.current.set(0, 0, 0);
      playerAngleRef.current = 0;
      if (playerGroupRef.current) {
        playerGroupRef.current.position.set(0, 0, 0);
        playerGroupRef.current.rotation.y = 0;
      }
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, 1.45, 4.4);
        controlsRef.current.target.set(0, 1.25, 0);
        controlsRef.current.update();
      }
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(0x0a0c14);
      }
    } else {
      soundEngine.playGameStart();
      soundEngine.playHangarDoor();
      const startH = terrainEngine.getHeightAt(0, 0);
      playerPosRef.current.set(0, startH, 0);
      if (playerGroupRef.current) {
        playerGroupRef.current.position.set(0, startH, 0);
      }
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(0x0f172a);
      }
    }
  }, [sceneViewMode, terrainEngine]);

  // Handle external attack trigger
  const prevAttackTriggerRef = useRef<number>(activeAttackTrigger);
  useEffect(() => {
    if (activeAttackTrigger > prevAttackTriggerRef.current) {
      triggerAttack();
    }
    prevAttackTriggerRef.current = activeAttackTrigger;
  }, [activeAttackTrigger]);

  const triggerAttack = useCallback(() => {
    if (isAttackingRef.current) return;
    isAttackingRef.current = true;
    attackProgressRef.current = 0;
    onAnimationChange('attack');
    soundEngine.playAttackSwing();

    // Trigger shockwave effect
    if (strikeShockwaveRef.current) {
      strikeShockwaveRef.current.visible = true;
      strikeShockwaveRef.current.scale.set(0.1, 0.1, 0.1);
      (strikeShockwaveRef.current.material as THREE.MeshBasicMaterial).opacity = 0.9;
    }

    // Check hit against training targets
    const pPos = playerPosRef.current;
    targetsRef.current.forEach((dummy, idx) => {
      const dummyPos = dummy.group.position;
      const dist = pPos.distanceTo(dummyPos);
      if (dist < 3.0) {
        dummy.hitTimer = 0.35;
        dummy.health = Math.max(0, dummy.health - 34);
        soundEngine.playHitImpact();
        onTriggerHit(34, idx);

        const scene = sceneRef.current;
        if (scene) {
          for (let i = 0; i < 10; i++) {
            const sparkGeo = new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 4, 4);
            const sparkMat = new THREE.MeshBasicMaterial({
              color: Math.random() > 0.5 ? 0x38bdf8 : 0xf43f5e,
              transparent: true,
              opacity: 1,
            });
            const spark = new THREE.Mesh(sparkGeo, sparkMat);
            spark.position.copy(dummyPos).add(new THREE.Vector3(0, 1.2, 0));
            scene.add(spark);

            particlesRef.current.push({
              mesh: spark,
              velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 6,
                Math.random() * 4 + 1.5,
                (Math.random() - 0.5) * 6
              ),
              life: 0,
              maxLife: 0.4 + Math.random() * 0.2,
            });
          }
        }
      }
    });
  }, [onAnimationChange, onTriggerHit]);

  // Lighting Mode Sync
  useEffect(() => {
    const dir = dirLightRef.current;
    const hemi = hemiLightRef.current;
    const amb = ambientLightRef.current;
    const scene = sceneRef.current;

    if (!dir || !hemi || !amb || !scene) return;

    if (lightingMode === 'daylight') {
      scene.background = new THREE.Color(0x0a1020);
      scene.fog = new THREE.FogExp2(0x0a1020, 0.016);
      dir.color.setHex(0xfff5ea);
      dir.intensity = 1.9;
      dir.position.set(15, 30, 15);
      hemi.color.setHex(0xb8d9f8);
      hemi.groundColor.setHex(0x1e293b);
      hemi.intensity = 0.9;
      amb.color.setHex(0xffffff);
      amb.intensity = 0.5;
    } else if (lightingMode === 'dusk') {
      scene.background = new THREE.Color(0x1a0f1e);
      scene.fog = new THREE.FogExp2(0x1a0f1e, 0.02);
      dir.color.setHex(0xf97316);
      dir.intensity = 2.2;
      dir.position.set(18, 14, -12);
      hemi.color.setHex(0xfbcfe8);
      hemi.groundColor.setHex(0x311b92);
      hemi.intensity = 0.8;
      amb.color.setHex(0xffb59b);
      amb.intensity = 0.4;
    } else {
      // cyberpunk
      scene.background = new THREE.Color(0x050814);
      scene.fog = new THREE.FogExp2(0x050814, 0.024);
      dir.color.setHex(0x06b6d4);
      dir.intensity = 2.0;
      dir.position.set(-14, 20, 10);
      hemi.color.setHex(0xd946ef);
      hemi.groundColor.setHex(0x0f172a);
      hemi.intensity = 1.1;
      amb.color.setHex(0x0284c7);
      amb.intensity = 0.6;
    }
  }, [lightingMode]);

  // Performance Mode updates
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (performanceMode === 'fast') {
      renderer.setPixelRatio(1.0); // 1.0 for rock solid 60 FPS
      if (dirLightRef.current) {
        dirLightRef.current.shadow.mapSize.set(1024, 1024);
      }
    } else {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      if (dirLightRef.current) {
        dirLightRef.current.shadow.mapSize.set(2048, 2048);
      }
    }
  }, [performanceMode]);

  // Update procedural player skin when preset changes
  useEffect(() => {
    if (customModel) return; // If custom GLB active, don't swap
    const playerGroup = playerGroupRef.current;
    if (proceduralRigRef.current) {
      playerGroup.remove(proceduralRigRef.current.root);
      proceduralRigRef.current.materials.forEach((m) => m.dispose());
    }
    const newRig = createProceduralHumanoid(activePresetId);
    proceduralRigRef.current = newRig;
    playerGroup.add(newRig.root);
  }, [activePresetId, customModel]);

  // Update custom model action transitions
  useEffect(() => {
    if (!customMixer) return;
    const nextAction = customActions[currentAnimation];
    if (!nextAction) return;

    const prevAction = activeGLTFActionRef.current;
    if (prevAction && prevAction !== nextAction) {
      prevAction.fadeOut(0.18);
    }
    nextAction.reset().fadeIn(0.18).play();
    activeGLTFActionRef.current = nextAction;
  }, [currentAnimation, customActions, customMixer]);

  // Update Skeleton Helper
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (showSkeleton) {
      if (!skeletonHelperRef.current) {
        const target = customModel || playerGroupRef.current;
        const helper = new THREE.SkeletonHelper(target);
        (helper.material as THREE.LineBasicMaterial).linewidth = 2;
        scene.add(helper);
        skeletonHelperRef.current = helper;
      }
      skeletonHelperRef.current.visible = true;
    } else if (skeletonHelperRef.current) {
      skeletonHelperRef.current.visible = false;
    }
  }, [customModel, showSkeleton]);

  // Sync placed characters (NPCs) in the 3D scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentMap = npcRigsRef.current;
    const activeIds = new Set(placedCharacters.map((c) => c.id));

    // Remove deleted NPCs
    for (const [id, entity] of currentMap.entries()) {
      if (!activeIds.has(id)) {
        scene.remove(entity.group);
        entity.rig.materials.forEach((m) => m.dispose());
        currentMap.delete(id);
      }
    }

    // Add or update NPCs
    placedCharacters.forEach((c) => {
      if (!currentMap.has(c.id)) {
        const group = new THREE.Group();
        const rig = createProceduralHumanoid(c.presetId);
        group.add(rig.root);

        const groundY = terrainEngine.getHeightAt(c.x, c.z);
        group.position.set(c.x, groundY, c.z);
        group.rotation.y = c.rotation || 0;

        scene.add(group);
        currentMap.set(c.id, { group, rig });
      } else {
        const entity = currentMap.get(c.id)!;
        const groundY = terrainEngine.getHeightAt(c.x, c.z);
        entity.group.position.set(c.x, groundY, c.z);
        entity.group.rotation.y = c.rotation || 0;
      }
    });
  }, [placedCharacters, terrainEngine]);

  // Brush cursor scale & visibility
  useEffect(() => {
    if (!brushCursorMeshRef.current) return;
    brushCursorMeshRef.current.visible = isTerrainEditorOpen;
    brushCursorMeshRef.current.scale.set(brushRadius, brushRadius, brushRadius);
  }, [isTerrainEditorOpen, brushRadius]);

  // Main Scene Initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1020);
    scene.fog = new THREE.FogExp2(0x0a1020, 0.016);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 300);
    camera.position.set(0, 3.5, 6.5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(performanceMode === 'fast' ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 2.0;
    controls.maxDistance = 60.0;
    controls.target.set(0, 1.2, 0);
    controlsRef.current = controls;

    // Lights
    const ambLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambLight);
    ambientLightRef.current = ambLight;

    const hemiLight = new THREE.HemisphereLight(0xb8d9f8, 0x1e293b, 0.9);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.9);
    dirLight.position.set(15, 30, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = performanceMode === 'fast' ? 1024 : 2048;
    dirLight.shadow.mapSize.height = performanceMode === 'fast' ? 1024 : 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 70;
    const d = 35;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0003;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // --- Add Editable Mountain Terrain ---
    scene.add(terrainEngine.data.mesh);

    // --- Sci-Fi Military Hangar Base (Lobby Environment) ---
    const hangarBase = createHangarBase();
    hangarEnvRef.current = hangarBase;
    scene.add(hangarBase.group);

    // --- Procedural / Custom 3D Object Pedestal ---
    const lobbyObjGroup = lobbyObjectGroupRef.current;
    scene.add(lobbyObjGroup);
    if (customLobbyObjectModel) {
      lobbyObjGroup.add(customLobbyObjectModel);
    } else {
      lobbyObjGroup.add(createProceduralLobbyPedestal());
    }

    // --- 3D Airplane System in the Sky ---
    const airplaneRig = createProceduralAirplane();
    airplaneRigRef.current = airplaneRig;
    scene.add(airplaneRig.root);
    if (customPlaneModel) {
      airplaneRig.airplaneRoot.children.forEach((c) => {
        c.visible = false;
      });
      airplaneRig.airplaneRoot.add(customPlaneModel);
    }

    const isLobbyInitial = sceneViewModeRef.current === 'lobby';
    const initMode = lobbyConfig?.backdropMode || 'hangar3d';
    hangarBase.group.visible = isLobbyInitial && (initMode === 'hangar3d');
    lobbyObjGroup.visible = isLobbyInitial && (initMode === 'object3d');
    terrainEngine.data.mesh.visible = !isLobbyInitial;
    airplaneRig.root.visible = !isLobbyInitial;

    if (isLobbyInitial) {
      if (initMode === 'image2d') {
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
      } else {
        scene.background = new THREE.Color(0x0a0c14);
      }
    }

    // --- Sculpt Brush Indicator Ring ---
    const ringGeo = new THREE.RingGeometry(0.95, 1.05, 36);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const brushRing = new THREE.Mesh(ringGeo, ringMat);
    brushRing.visible = false;
    scene.add(brushRing);
    brushCursorMeshRef.current = brushRing;

    // --- Target Crystals ---
    const targets: TargetDummy[] = [];
    const targetLocations = [
      { x: 0, z: -6 },
      { x: -7, z: 3 },
      { x: 7, z: 3 },
    ];

    targetLocations.forEach((loc) => {
      const dummyGroup = new THREE.Group();
      const initialY = terrainEngine.getHeightAt(loc.x, loc.z);
      dummyGroup.position.set(loc.x, initialY, loc.z);

      const pedGeo = new THREE.CylinderGeometry(0.6, 0.75, 0.35, 8);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
      const ped = new THREE.Mesh(pedGeo, pedMat);
      ped.position.y = 0.18;
      ped.castShadow = true;
      ped.receiveShadow = true;
      dummyGroup.add(ped);

      const cryGeo = new THREE.OctahedronGeometry(0.55, 0);
      const cryMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xe11d48,
        emissiveIntensity: 0.8,
        roughness: 0.25,
        metalness: 0.7,
      });
      const crystal = new THREE.Mesh(cryGeo, cryMat);
      crystal.position.y = 1.3;
      crystal.castShadow = true;
      dummyGroup.add(crystal);

      scene.add(dummyGroup);
      targets.push({
        group: dummyGroup,
        crystalMesh: crystal,
        baseY: 1.3,
        hitTimer: 0,
        health: 100,
      });
    });
    targetsRef.current = targets;
    targets.forEach((t) => {
      t.group.visible = !isLobbyInitial;
    });

    // --- Player Group & Character Rig (No swords!) ---
    const playerGroup = playerGroupRef.current;
    if (isLobbyInitial) {
      playerPosRef.current.set(0, 0, 0);
      playerGroup.position.set(0, 0, 0);
      playerAngleRef.current = 0;
      camera.position.set(0, 1.45, 4.4);
      controls.target.set(0, 1.25, 0);
    } else {
      const startH = terrainEngine.getHeightAt(0, 0);
      playerPosRef.current.set(0, startH, 0);
      playerGroup.position.set(0, startH, 0);
    }
    scene.add(playerGroup);

    if (customModel) {
      playerGroup.add(customModel);
    } else {
      const proceduralRig = createProceduralHumanoid(activePresetId);
      proceduralRigRef.current = proceduralRig;
      playerGroup.add(proceduralRig.root);
    }

    // --- Cyber Surfboard Rig Attached to Character ---
    const surfboardRig = createCyberSurfboard();
    surfboardRigRef.current = surfboardRig;
    surfboardRig.root.position.set(0, 0.02, 0);
    surfboardRig.root.visible = false;
    playerGroup.add(surfboardRig.root);

    // --- Martial Impact Shockwave Ring (No sword arc) ---
    const shockwaveGeo = new THREE.RingGeometry(0.5, 0.9, 32);
    shockwaveGeo.rotateX(-Math.PI / 2);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const shockwave = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwave.position.set(0, 0.1, 0.5);
    shockwave.visible = false;
    playerGroup.add(shockwave);
    strikeShockwaveRef.current = shockwave;

    // --- Keyboard & Mouse Listeners ---
    const handleKeyDown = (e: KeyboardEvent) => {
      keyStateRef.current[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (isGroundedRef.current && !isAttackingRef.current) {
          playerVelYRef.current = 7.2;
          isGroundedRef.current = false;
          onAnimationChange('jump');
          soundEngine.playJump();
        }
      } else if (e.code === 'KeyF' || e.code === 'KeyJ' || e.code === 'Enter') {
        e.preventDefault();
        triggerAttack();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keyStateRef.current[e.code] = false;
    };

    // Raycaster for Terrain Sculpting & Clicking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // Left click only

      if (isTerrainEditorOpen) {
        isSculptingRef.current = true;
        sculptAtPointer(e.clientX, e.clientY);
      } else {
        triggerAttack();
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isTerrainEditorOpen) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(terrainEngine.data.mesh);

      if (intersects.length > 0) {
        const hit = intersects[0].point;
        if (brushCursorMeshRef.current) {
          brushCursorMeshRef.current.position.set(hit.x, hit.y + 0.05, hit.z);
          brushCursorMeshRef.current.visible = true;
        }

        if (isSculptingRef.current) {
          terrainEngine.sculpt(hit.x, hit.z, brushRadius, brushIntensity, terrainTool);
        }
      } else if (brushCursorMeshRef.current) {
        brushCursorMeshRef.current.visible = false;
      }
    };

    const handlePointerUp = () => {
      if (isSculptingRef.current) {
        isSculptingRef.current = false;
        onTerrainSculptEnd?.();
      }
    };

    const sculptAtPointer = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(terrainEngine.data.mesh);
      if (intersects.length > 0) {
        const hit = intersects[0].point;
        terrainEngine.sculpt(hit.x, hit.z, brushRadius, brushIntensity, terrainTool);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const canvasEl = renderer.domElement;
    canvasEl.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();
    let proceduralAnimTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.05);
      const effectiveDelta = delta * playbackSpeed;
      proceduralAnimTime += effectiveDelta;

      if (customMixer) {
        customMixer.update(effectiveDelta);
      }

      // If in lobby mode: robot stands in center of the Hangar Base, plays active animation
      if (sceneViewModeRef.current === 'lobby') {
        const currentAnim = activeAnimationTypeRef.current;
        const isSurfing = currentAnim === 'skysurf';

        if (surfboardRigRef.current) {
          surfboardRigRef.current.root.visible = isSurfing;
          if (isSurfing) {
            surfboardRigRef.current.update(effectiveDelta, proceduralAnimTime, 0);
          }
        }

        if (isSurfing) {
          playerPosRef.current.set(0, 0.45 + Math.sin(proceduralAnimTime * 3) * 0.05, 0);
        } else {
          playerPosRef.current.set(0, 0, 0);
        }
        playerGroup.position.copy(playerPosRef.current);
        playerGroup.rotation.y = 0;

        if (proceduralRigRef.current && proceduralRigRef.current.root.visible) {
          updateHumanoidPose(
            proceduralRigRef.current,
            currentAnim,
            proceduralAnimTime,
            currentAnim === 'attack' ? (Math.sin(proceduralAnimTime * 5) + 1) * 0.5 : 0
          );
        }

        controls.target.set(0, 1.25, 0);
        controls.update();
        renderer.render(scene, camera);
        return;
      }

      // Update Airplane in sky
      if (airplaneRigRef.current) {
        airplaneRigRef.current.root.visible = true;
        airplaneRigRef.current.update(effectiveDelta, clock.getElapsedTime());
      }

      // --- AIRPLANE DROP SEQUENCE: Gentle aerodynamic wind glide on surfboard ---
      if (isDroppingRef.current) {
        const keys = keyStateRef.current;
        let steerX = 0;
        let steerZ = 0;
        if (keys['KeyA'] || keys['ArrowLeft']) steerX -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) steerX += 1;
        if (keys['KeyW'] || keys['ArrowUp']) steerZ += 1;
        if (keys['KeyS'] || keys['ArrowDown']) steerZ -= 1;

        if (Math.abs(virtualMove.x) > 0.05 || Math.abs(virtualMove.y) > 0.05) {
          steerX += virtualMove.x;
          steerZ -= virtualMove.y;
        }

        // Steer horizontal translation
        playerPosRef.current.x += steerX * 9.5 * effectiveDelta;
        playerPosRef.current.z += (steerZ * 8.0 + 5.0) * effectiveDelta; // natural forward flight glide

        // Glide descent rate: S pulls up (descend slower), W dives (descend faster)
        const glideRate = steerZ < 0 ? 3.2 : steerZ > 0 ? 7.5 : 4.6;
        playerPosRef.current.y -= glideRate * effectiveDelta;

        // Banking tilt
        playerAngleRef.current = THREE.MathUtils.lerp(
          playerAngleRef.current,
          -steerX * 0.45,
          8.0 * delta
        );

        const groundH = terrainEngine.getHeightAt(playerPosRef.current.x, playerPosRef.current.z);

        // Smooth landing touchdown
        if (playerPosRef.current.y <= groundH + 0.2) {
          playerPosRef.current.y = groundH;
          isDroppingRef.current = false;
          isGroundedRef.current = true;
          onAnimationChange('idle');
          onAirplaneDropComplete?.();
          soundEngine.playStep();
        }

        playerGroup.position.copy(playerPosRef.current);
        playerGroup.rotation.y = playerAngleRef.current;

        // Update Surfboard Rig during air-drop
        if (surfboardRigRef.current) {
          surfboardRigRef.current.root.visible = true;
          surfboardRigRef.current.update(effectiveDelta, proceduralAnimTime, playerAngleRef.current);
        }

        if (proceduralRigRef.current && proceduralRigRef.current.root.visible) {
          updateHumanoidPose(proceduralRigRef.current, 'skysurf', proceduralAnimTime, 0);
        }

        // Camera follow during air-drop
        const targetCam = new THREE.Vector3(
          playerPosRef.current.x,
          playerPosRef.current.y + 2.8,
          playerPosRef.current.z - 6.5
        );
        camera.position.lerp(targetCam, 10.0 * delta);
        controls.target.set(playerPosRef.current.x, playerPosRef.current.y + 0.8, playerPosRef.current.z);
        controls.update();

        renderer.render(scene, camera);
        return;
      }

      // Update Surfboard Rig in standard game mode
      const isSurfing = activeAnimationTypeRef.current === 'skysurf';
      if (surfboardRigRef.current) {
        surfboardRigRef.current.root.visible = isSurfing;
        if (isSurfing) {
          surfboardRigRef.current.update(effectiveDelta, proceduralAnimTime, playerAngleRef.current);
        }
      }

      // Movement input
      const keys = keyStateRef.current;
      let moveX = 0;
      let moveZ = 0;

      if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

      if (Math.abs(virtualMove.x) > 0.05 || Math.abs(virtualMove.y) > 0.05) {
        moveX += virtualMove.x;
        moveZ += virtualMove.y;
      }

      const isMoving = Math.hypot(moveX, moveZ) > 0.12;

      // Camera relative movement
      if (isMoving && !isAttackingRef.current) {
        const camForward = new THREE.Vector3();
        camera.getWorldDirection(camForward);
        camForward.y = 0;
        camForward.normalize();

        const camRight = new THREE.Vector3(-camForward.z, 0, camForward.x);

        const moveDir = new THREE.Vector3()
          .addScaledVector(camForward, -moveZ)
          .addScaledVector(camRight, moveX)
          .normalize();

        const speed = 5.2 * effectiveDelta;
        playerPosRef.current.addScaledVector(moveDir, speed);

        // Constrain to terrain boundary (radius ~ 32)
        const maxBound = terrainEngine.data.size / 2 - 1.5;
        playerPosRef.current.x = Math.max(-maxBound, Math.min(maxBound, playerPosRef.current.x));
        playerPosRef.current.z = Math.max(-maxBound, Math.min(maxBound, playerPosRef.current.z));

        // Rotation
        const targetAngle = Math.atan2(moveDir.x, moveDir.z);
        let diff = targetAngle - playerAngleRef.current;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        playerAngleRef.current += diff * Math.min(1, 14 * delta);

        if (isGroundedRef.current) {
          stepTimerRef.current += delta;
          if (stepTimerRef.current > 0.36) {
            soundEngine.playStep();
            stepTimerRef.current = 0;
          }
        }
      }

      // Height on mountain relief
      const groundH = terrainEngine.getHeightAt(playerPosRef.current.x, playerPosRef.current.z);

      // Jump & Gravity
      if (!isGroundedRef.current) {
        playerVelYRef.current -= 20 * effectiveDelta;
        playerPosRef.current.y += playerVelYRef.current * effectiveDelta;

        if (playerPosRef.current.y <= groundH) {
          playerPosRef.current.y = groundH;
          playerVelYRef.current = 0;
          isGroundedRef.current = true;
          soundEngine.playStep();
        }
      } else {
        // Smoothly adhere to ground height
        playerPosRef.current.y = THREE.MathUtils.lerp(playerPosRef.current.y, groundH, 0.4);
      }

      // Attack Progress
      if (isAttackingRef.current) {
        attackProgressRef.current += effectiveDelta * 2.8;

        if (strikeShockwaveRef.current) {
          const p = attackProgressRef.current;
          const sMat = strikeShockwaveRef.current.material as THREE.MeshBasicMaterial;
          const scale = 0.5 + p * 2.5;
          strikeShockwaveRef.current.scale.set(scale, scale, scale);
          sMat.opacity = Math.max(0, 1.0 - p);
        }

        if (attackProgressRef.current >= 1.0) {
          isAttackingRef.current = false;
          attackProgressRef.current = 0;
          if (strikeShockwaveRef.current) strikeShockwaveRef.current.visible = false;
        }
      }

      // State machine
      let resolvedAnimation: AnimationType = 'idle';
      if (isAttackingRef.current) {
        resolvedAnimation = 'attack';
      } else if (!isGroundedRef.current) {
        resolvedAnimation = 'jump';
      } else if (isMoving) {
        resolvedAnimation = 'walk';
      } else {
        resolvedAnimation = 'idle';
      }

      if (resolvedAnimation !== activeAnimationTypeRef.current) {
        onAnimationChange(resolvedAnimation);
      }

      playerGroup.position.copy(playerPosRef.current);
      playerGroup.rotation.y = playerAngleRef.current;

      // Update procedural character rig (without weapons)
      if (proceduralRigRef.current && proceduralRigRef.current.root.visible) {
        updateHumanoidPose(
          proceduralRigRef.current,
          resolvedAnimation,
          proceduralAnimTime,
          attackProgressRef.current
        );
      }

      // Update all placed NPCs
      npcRigsRef.current.forEach(({ group, rig }, id) => {
        const gh = terrainEngine.getHeightAt(group.position.x, group.position.z);
        group.position.y = gh;
        updateHumanoidPose(rig, 'idle', proceduralAnimTime + group.position.x * 0.5, 0);
      });

      // Update Target Dummy positions based on terrain
      targetsRef.current.forEach((t) => {
        const gh = terrainEngine.getHeightAt(t.group.position.x, t.group.position.z);
        t.group.position.y = gh;
        t.crystalMesh.position.y = t.baseY + Math.sin(proceduralAnimTime * 2.5) * 0.1;
        t.crystalMesh.rotation.y += delta * 1.5;

        if (t.hitTimer > 0) {
          t.hitTimer -= delta;
          (t.crystalMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.5;
        } else {
          (t.crystalMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
        }
      });

      // Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life += delta;
        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          particlesRef.current.splice(i, 1);
        } else {
          p.velocity.y -= 12 * delta;
          p.mesh.position.addScaledVector(p.velocity, delta);
          const ratio = 1 - p.life / p.maxLife;
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = ratio;
        }
      }

      // Camera
      if (cameraMode === 'follow') {
        const followDistance = 5.2;
        const followHeight = 2.6;
        const pPos = playerPosRef.current;

        const camTarget = new THREE.Vector3(
          pPos.x - Math.sin(playerAngleRef.current) * followDistance,
          pPos.y + followHeight,
          pPos.z - Math.cos(playerAngleRef.current) * followDistance
        );

        camera.position.lerp(camTarget, Math.min(1, 6 * delta));
        controls.target.lerp(
          new THREE.Vector3(pPos.x, pPos.y + 1.2, pPos.z),
          Math.min(1, 8 * delta)
        );
      } else {
        controls.target.lerp(
          new THREE.Vector3(playerPosRef.current.x, playerPosRef.current.y + 1.1, playerPosRef.current.z),
          Math.min(1, 10 * delta)
        );
      }
      controls.update();

      // Render frame
      renderer.render(scene, camera);

      if (onPlayerPositionChange) {
        onPlayerPositionChange(playerPosRef.current.x, playerPosRef.current.z);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvasEl.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      if (hangarEnvRef.current) {
        hangarEnvRef.current.dispose();
      }
      renderer.dispose();
    };
  }, [
    cameraMode,
    onAnimationChange,
    playbackSpeed,
    triggerAttack,
    virtualMove,
    terrainEngine,
    performanceMode,
  ]);

  return (
    <div
      id="three-character-viewport"
      ref={containerRef}
      className={`relative w-full h-full select-none overflow-hidden touch-none ${
        isTerrainEditorOpen ? 'cursor-none' : 'cursor-crosshair'
      }`}
    />
  );
};
