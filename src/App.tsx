import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  AnimationSlotConfig,
  AnimationType,
  CameraMode,
  DEFAULT_ANIMATION_SLOTS,
  SceneLightingMode,
  TerrainBrushTool,
  PlacedCharacter,
  PerformanceMode,
  CustomGlbExportData,
  SavedProject,
  ParsedHtmlGame,
} from './types/character';
import { CharacterCanvas } from './components/CharacterCanvas';
import { HUDOverlay } from './components/HUDOverlay';
import { LobbyOverlay } from './components/LobbyOverlay';
import { SlotManagerModal } from './components/SlotManagerModal';
import { TerrainEditorToolbar } from './components/TerrainEditorToolbar';
import { CharacterRosterModal } from './components/CharacterRosterModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { TerrainEngine } from './utils/terrainEngine';
import { downloadStandaloneGame } from './utils/exportGameHtml';
import { projectStorage } from './utils/projectStorage';
import {
  detectSlotFromFileName,
  parseGLBBuffer,
  prepareModelForScene,
} from './utils/gltfManager';
import { soundEngine } from './audio/soundEffects';

export default function App() {
  const [slots, setSlots] = useState<Record<AnimationType, AnimationSlotConfig>>(
    DEFAULT_ANIMATION_SLOTS
  );
  const [currentAnimation, setCurrentAnimation] = useState<AnimationType>('idle');
  const [cameraMode, setCameraMode] = useState<CameraMode>('follow');
  const [lightingMode, setLightingMode] = useState<SceneLightingMode>('daylight');
  const [showSkeleton, setShowSkeleton] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Performance optimization mode ('fast' = 60 FPS capped resolution, 'ultra' = full resolution)
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('fast');

  // Scene view state: 'lobby' (Hangar Base Room) or 'game' (3D Mountain Terrain match)
  const [sceneViewMode, setSceneViewMode] = useState<'lobby' | 'game'>('lobby');

  // Mountain & Terrain sculpting state
  const terrainEngine = useMemo(() => new TerrainEngine(70, 70), []);
  const [isTerrainEditorOpen, setIsTerrainEditorOpen] = useState<boolean>(false);
  const [terrainTool, setTerrainTool] = useState<TerrainBrushTool>('raise');
  const [brushRadius, setBrushRadius] = useState<number>(6.5);
  const [brushIntensity, setBrushIntensity] = useState<number>(0.8);

  // Multi-Character System state
  const [activePresetId, setActivePresetId] = useState<string>('mecha');
  const [placedCharacters, setPlacedCharacters] = useState<PlacedCharacter[]>([
    {
      id: 'npc-1',
      name: 'Androide Explorador',
      presetId: 'robot',
      x: 5,
      z: -4,
      rotation: Math.PI / 4,
      currentAnimation: 'idle',
      animTime: 0,
    },
    {
      id: 'npc-2',
      name: 'Shinobi Centinela',
      presetId: 'ninja',
      x: -6,
      z: 5,
      rotation: -Math.PI / 3,
      currentAnimation: 'idle',
      animTime: 0,
    },
  ]);
  const [currentActiveEntityId, setCurrentActiveEntityId] = useState<string>('player');
  const [isCharacterRosterOpen, setIsCharacterRosterOpen] = useState<boolean>(false);

  // Track player coordinates for character placement
  const playerCoordinatesRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });

  // Custom GLB Model & Mixer state
  const [customModel, setCustomModel] = useState<THREE.Group | null>(null);
  const [customMixer, setCustomMixer] = useState<THREE.AnimationMixer | null>(null);
  const [customActions, setCustomActions] = useState<Record<AnimationType, THREE.AnimationAction | null>>({
    idle: null,
    walk: null,
    jump: null,
    attack: null,
  });

  // Raw GLB ArrayBuffers stored for export/download
  const glbBuffersRef = useRef<CustomGlbExportData>({
    baseModelBuffer: null,
    animations: {
      idle: null,
      walk: null,
      jump: null,
      attack: null,
    },
  });

  // Hit & Attack triggers
  const [attackTrigger, setAttackTrigger] = useState<number>(0);
  const [lastHit, setLastHit] = useState<{ damage: number; targetIdx: number; time: number } | null>(null);
  const [virtualMove, setVirtualMove] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Project manager modal state & auto-save
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState<boolean>(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<number | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  }, []);

  const prevSlotName = (slot: AnimationType) => {
    switch (slot) {
      case 'idle':
        return 'model__28_ (Quieto)';
      case 'walk':
        return 'model__27_ (Caminar)';
      case 'jump':
        return 'model__26_ (Saltar)';
      case 'attack':
        return 'model__25_ (Atacar / Golpe)';
    }
  };

  // Process raw GLB ArrayBuffer for a slot (supports files, saved projects, and HTML import)
  const processGLBBufferData = useCallback(
    async (
      buffer: ArrayBuffer,
      fileName: string,
      targetSlot?: AnimationType,
      notify: boolean = true
    ) => {
      const slot = targetSlot || detectSlotFromFileName(fileName);
      if (!slot) {
        if (notify) {
          showToast(
            `No se reconoció la animación para "${fileName}". Nombra el archivo model__28_, model__27_, model__26_, model__25_ o asígnalo manualmente.`
          );
        }
        return false;
      }

      try {
        const gltf = await parseGLBBuffer(buffer, fileName);

        // Record the raw buffer for the standalone downloadable game and project persistence
        glbBuffersRef.current.animations[slot] = buffer;

        let newModel = customModel;
        let newMixer = customMixer;

        const hasMeshes = gltf.scene && gltf.scene.children.length > 0;
        if (hasMeshes) {
          glbBuffersRef.current.baseModelBuffer = buffer;
        } else if (!glbBuffersRef.current.baseModelBuffer) {
          glbBuffersRef.current.baseModelBuffer = buffer;
        }

        if (!newModel && hasMeshes) {
          newModel = prepareModelForScene(gltf.scene, 2.0);
          newMixer = new THREE.AnimationMixer(newModel);
          setCustomModel(newModel);
          setCustomMixer(newMixer);
        } else if (newModel && !newMixer) {
          newMixer = new THREE.AnimationMixer(newModel);
          setCustomMixer(newMixer);
        }

        let duration = 0;
        let clipName = '';
        if (gltf.animations && gltf.animations.length > 0) {
          const clip = gltf.animations[0];
          duration = clip.duration;
          clipName = clip.name || `${slot}_clip`;

          if (newMixer) {
            const action = newMixer.clipAction(clip);
            if (slot === 'attack' || slot === 'jump') {
              action.setLoop(THREE.LoopOnce, 1);
              action.clampWhenFinished = false;
            } else {
              action.setLoop(THREE.LoopRepeat, Infinity);
            }

            setCustomActions((prev) => ({
              ...prev,
              [slot]: action,
            }));
          }
        }

        setSlots((prev) => ({
          ...prev,
          [slot]: {
            ...prev[slot],
            isLoaded: true,
            fileName,
            clipName,
            duration,
          },
        }));

        if (notify) {
          showToast(
            `¡Animación "${prevSlotName(slot)}" cargada exitosamente desde ${fileName}!`
          );
        }
        return true;
      } catch (err) {
        console.error('Error loading GLB:', err);
        if (notify) {
          showToast(`Error al procesar "${fileName}". Asegúrate de que sea un archivo GLB válido.`);
        }
        return false;
      }
    },
    [customMixer, customModel, showToast]
  );

  // Process a GLB File instance
  const processGLBFile = useCallback(
    async (file: File, targetSlot?: AnimationType) => {
      const buffer = await file.arrayBuffer();
      return processGLBBufferData(buffer, file.name, targetSlot, true);
    },
    [processGLBBufferData]
  );

  const handleFilesSelected = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      let successCount = 0;
      for (const file of fileArray) {
        const ok = await processGLBFile(file);
        if (ok) successCount++;
      }
      if (successCount > 0) {
        soundEngine.playClick();
      }
    },
    [processGLBFile]
  );

  const handleSingleSlotSelected = useCallback(
    async (slot: AnimationType, file: File) => {
      await processGLBFile(file, slot);
    },
    [processGLBFile]
  );

  const handleResetToDefault = useCallback(() => {
    if (customMixer) {
      customMixer.stopAllAction();
    }
    glbBuffersRef.current = {
      baseModelBuffer: null,
      animations: {
        idle: null,
        walk: null,
        jump: null,
        attack: null,
      },
    };
    setCustomModel(null);
    setCustomMixer(null);
    setCustomActions({
      idle: null,
      walk: null,
      jump: null,
      attack: null,
    });
    setSlots(DEFAULT_ANIMATION_SLOTS);
    showToast('Se ha restaurado el modelo atlético base.');
  }, [customMixer, showToast]);

  // Attempt to probe /assets/ if model files are already hosted
  useEffect(() => {
    const probePreloadedAssets = async () => {
      const candidates = [
        { name: 'model__28_.glb', slot: 'idle' as AnimationType },
        { name: 'model__27_.glb', slot: 'walk' as AnimationType },
        { name: 'model__26_.glb', slot: 'jump' as AnimationType },
        { name: 'model__25_.glb', slot: 'attack' as AnimationType },
      ];

      for (const item of candidates) {
        try {
          const res = await fetch(`/assets/${item.name}`);
          // Prevent SPA router from returning index.html as a 200 response
          if (!res.ok) continue;
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('text/html')) continue;

          const buffer = await res.arrayBuffer();
          if (buffer.byteLength < 12) continue;

          // Check for GLB binary header 'glTF' (0x46546C67)
          const u8 = new Uint8Array(buffer, 0, 4);
          const isGlb = u8[0] === 0x67 && u8[1] === 0x6c && u8[2] === 0x54 && u8[3] === 0x46;
          if (!isGlb) continue;

          await processGLBBufferData(buffer, item.name, item.slot, false);
        } catch {
          // Silent fallback if asset is not preloaded on server
        }
      }
    };

    probePreloadedAssets();
  }, [processGLBBufferData]);

  // Direct trigger to preview slot
  const handlePreviewSlot = useCallback((slot: AnimationType) => {
    setCurrentAnimation(slot);
    if (slot === 'attack') {
      setAttackTrigger((prev) => prev + 1);
    }
  }, []);

  const handleTriggerAttack = useCallback(() => {
    setAttackTrigger((prev) => prev + 1);
  }, []);

  const handleTriggerHit = useCallback((damage: number, targetIdx: number) => {
    setLastHit({
      damage,
      targetIdx,
      time: Date.now(),
    });
  }, []);

  const handleToggleCameraMode = useCallback(() => {
    setCameraMode((prev) => (prev === 'follow' ? 'orbit' : 'follow'));
  }, []);

  const handleToggleSkeleton = useCallback(() => {
    setShowSkeleton((prev) => !prev);
  }, []);

  const handleTogglePerformanceMode = useCallback(() => {
    setPerformanceMode((prev) => (prev === 'fast' ? 'ultra' : 'fast'));
    showToast(
      performanceMode === 'fast'
        ? 'Modo Ultra activado (Máxima resolución gráfica).'
        : 'Modo Rápido activado (Optimizado a 60 FPS sin tirones).'
    );
  }, [performanceMode, showToast]);

  // Terrain actions
  const handleGenerateHills = useCallback(() => {
    terrainEngine.generateProceduralMountains(1.2, 16.0);
    soundEngine.playClick();
    showToast('¡Cordilleras y relieves de montaña generados proceduralmente!');
  }, [terrainEngine, showToast]);

  const handleResetFlat = useCallback(() => {
    terrainEngine.resetToFlat();
    soundEngine.playClick();
    showToast('El terreno ha sido aplanado.');
  }, [terrainEngine, showToast]);

  // Character spawn actions
  const handleSpawnCharacterHere = useCallback(
    (presetId: string, name: string) => {
      const p = playerCoordinatesRef.current;
      // Spawn slightly offset from player so they stand side-by-side
      const offsetX = (Math.random() - 0.5) * 3 + 1.5;
      const offsetZ = (Math.random() - 0.5) * 3 + 1.5;
      const newChar: PlacedCharacter = {
        id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        presetId,
        x: p.x + offsetX,
        z: p.z + offsetZ,
        rotation: Math.random() * Math.PI * 2,
        currentAnimation: 'idle',
        animTime: 0,
      };
      setPlacedCharacters((prev) => [...prev, newChar]);
      soundEngine.playClick();
      showToast(`¡Personaje "${name}" colocado en el relieve montañoso!`);
    },
    [showToast]
  );

  const handleRemoveCharacter = useCallback((id: string) => {
    setPlacedCharacters((prev) => prev.filter((c) => c.id !== id));
    setCurrentActiveEntityId((current) => (current === id ? 'player' : current));
    soundEngine.playClick();
  }, []);

  const handleSwitchControlTo = useCallback(
    (id: string) => {
      setCurrentActiveEntityId(id);
      if (id === 'player') {
        showToast('Control devuelto al Jugador Principal.');
      } else {
        const found = placedCharacters.find((c) => c.id === id);
        if (found) {
          // Teleport main player group focus to this character location
          playerCoordinatesRef.current.x = found.x;
          playerCoordinatesRef.current.z = found.z;
          setActivePresetId(found.presetId);
          showToast(`¡Ahora estás controlando a "${found.name}"!`);
        }
      }
      soundEngine.playClick();
    },
    [placedCharacters, showToast]
  );

  // Standalone game export (with embedded custom GLB model & animations)
  const handleDownloadStandaloneGame = useCallback(() => {
    const hasCustom = !!(
      glbBuffersRef.current.baseModelBuffer ||
      glbBuffersRef.current.animations.idle ||
      glbBuffersRef.current.animations.walk ||
      glbBuffersRef.current.animations.jump ||
      glbBuffersRef.current.animations.attack
    );

    downloadStandaloneGame(
      terrainEngine,
      activePresetId,
      placedCharacters,
      glbBuffersRef.current
    );

    if (hasCustom) {
      showToast('¡Descargando juego! Incluye tu modelo 3D importado y todas sus animaciones.');
    } else {
      showToast('¡Descargando archivo HTML del juego completo en pantalla completa!');
    }
  }, [terrainEngine, activePresetId, placedCharacters, showToast]);

  // Debounced auto-save current project to IndexedDB
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const heights = terrainEngine.exportHeightArray();
        const slotsInfo: Record<AnimationType, { isLoaded: boolean; fileName?: string }> = {
          idle: { isLoaded: slots.idle.isLoaded, fileName: slots.idle.fileName },
          walk: { isLoaded: slots.walk.isLoaded, fileName: slots.walk.fileName },
          jump: { isLoaded: slots.jump.isLoaded, fileName: slots.jump.fileName },
          attack: { isLoaded: slots.attack.isLoaded, fileName: slots.attack.fileName },
        };
        await projectStorage.autoSaveCurrent({
          id: 'latest_autosave',
          name: 'Sesión guardada automáticamente',
          updatedAt: Date.now(),
          heights,
          placedCharacters,
          activePresetId,
          customGlbData: glbBuffersRef.current,
          slotsInfo,
        });
        setLastAutoSaveTime(Date.now());
      } catch (err) {
        console.warn('Auto-save failed:', err);
      }
    }, 1000);
  }, [terrainEngine, slots, placedCharacters, activePresetId]);

  // Explicit save project
  const handleSaveCurrentProject = useCallback(
    async (projectName: string) => {
      try {
        const heights = terrainEngine.exportHeightArray();
        const slotsInfo: Record<AnimationType, { isLoaded: boolean; fileName?: string }> = {
          idle: { isLoaded: slots.idle.isLoaded, fileName: slots.idle.fileName },
          walk: { isLoaded: slots.walk.isLoaded, fileName: slots.walk.fileName },
          jump: { isLoaded: slots.jump.isLoaded, fileName: slots.jump.fileName },
          attack: { isLoaded: slots.attack.isLoaded, fileName: slots.attack.fileName },
        };
        const proj: SavedProject = {
          id: `project-${Date.now()}`,
          name: projectName.trim() || `Proyecto ${new Date().toLocaleTimeString()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          heights,
          placedCharacters,
          activePresetId,
          customGlbData: glbBuffersRef.current,
          slotsInfo,
        };
        await projectStorage.saveProject(proj);
        setLastAutoSaveTime(proj.updatedAt);
        showToast(`¡Proyecto "${proj.name}" guardado exitosamente!`);
      } catch (err) {
        console.error('Error saving project:', err);
        showToast('Error al guardar el proyecto.');
      }
    },
    [terrainEngine, slots, placedCharacters, activePresetId, showToast]
  );

  // Load project from IndexedDB
  const handleLoadProject = useCallback(
    async (project: SavedProject) => {
      try {
        if (project.heights && project.heights.length > 0) {
          terrainEngine.importHeightArray(project.heights);
        }
        if (project.placedCharacters && Array.isArray(project.placedCharacters)) {
          setPlacedCharacters(project.placedCharacters);
        }
        if (project.activePresetId) {
          setActivePresetId(project.activePresetId);
        }
        if (project.customGlbData) {
          glbBuffersRef.current = project.customGlbData;
          const glb = project.customGlbData;
          const slotsOrder: AnimationType[] = ['idle', 'walk', 'jump', 'attack'];
          for (const s of slotsOrder) {
            if (glb.animations[s]) {
              await processGLBBufferData(glb.animations[s]!, `project_${s}.glb`, s, false);
            }
          }
        }
        setLastAutoSaveTime(project.updatedAt);
        showToast(`¡Proyecto "${project.name}" cargado con éxito!`);
      } catch (err) {
        console.error('Error loading project:', err);
        showToast(`Error al cargar el proyecto "${project.name}".`);
      }
    },
    [terrainEngine, processGLBBufferData, showToast]
  );

  // Restore latest auto-save
  const handleRestoreAutoSave = useCallback(async () => {
    try {
      const last = await projectStorage.getLastAutoSave();
      if (!last) {
        showToast('No se encontró ninguna sesión guardada previamente.');
        return;
      }
      await handleLoadProject(last);
      showToast('¡Sesión anterior restaurada con éxito!');
    } catch (err) {
      console.error('Error restoring auto-save:', err);
      showToast('Error al restaurar la sesión.');
    }
  }, [handleLoadProject, showToast]);

  // Import external HTML game and convert terrain & swap characters as chosen
  const handleImportHtmlGame = useCallback(
    async (
      parsed: ParsedHtmlGame,
      swapChoice: 'keep-editor' | 'use-html' | 'swap-preset'
    ) => {
      try {
        // 1. Terrain heightmap conversion
        if (parsed.heights && parsed.heights.length > 0) {
          terrainEngine.importHeightArray(parsed.heights);
        }

        // 2. Import placed characters from HTML
        if (parsed.placedCharacters && Array.isArray(parsed.placedCharacters)) {
          setPlacedCharacters(parsed.placedCharacters);
        }

        // 3. Character swapping logic
        if (swapChoice === 'use-html' && parsed.customGlbData) {
          glbBuffersRef.current = parsed.customGlbData;
          const glb = parsed.customGlbData;
          const slotsOrder: AnimationType[] = ['idle', 'walk', 'jump', 'attack'];
          for (const s of slotsOrder) {
            if (glb.animations[s]) {
              await processGLBBufferData(glb.animations[s]!, `html_${s}.glb`, s, false);
            }
          }
          showToast('¡Juego HTML importado! Terreno y personaje del archivo HTML aplicados.');
        } else if (swapChoice === 'swap-preset') {
          handleResetToDefault();
          setActivePresetId(parsed.activePresetId || 'runner');
          showToast('¡Juego HTML importado! Terreno cargado con nuevo personaje atlético.');
        } else {
          // 'keep-editor': keep current editor character and animations running on top of imported HTML terrain!
          showToast('¡Juego HTML importado! Terreno convertido manteniendo tu personaje y animaciones del editor.');
        }

        setTimeout(() => {
          triggerAutoSave();
        }, 300);
      } catch (err) {
        console.error('Error importing HTML game:', err);
        showToast('Error al importar el juego HTML.');
      }
    },
    [terrainEngine, processGLBBufferData, handleResetToDefault, triggerAutoSave, showToast]
  );

  // Auto-restore previous project on page load/refresh if available
  useEffect(() => {
    let isMounted = true;
    const checkPreviousSession = async () => {
      try {
        const last = await projectStorage.getLastAutoSave();
        if (!isMounted || !last || !last.heights || last.heights.length === 0) return;

        const hasCustomContent =
          (last.placedCharacters && last.placedCharacters.length > 0) ||
          (last.customGlbData &&
            (last.customGlbData.baseModelBuffer ||
              last.customGlbData.animations.idle ||
              last.customGlbData.animations.walk)) ||
          last.heights.some((h) => Math.abs(h) > 0.1);

        if (hasCustomContent) {
          await handleLoadProject(last);
        }
      } catch (err) {
        console.warn('Initial session check failed:', err);
      }
    };

    checkPreviousSession();

    return () => {
      isMounted = false;
    };
  }, [handleLoadProject]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <main
      id="app-root-container"
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none"
    >
      {/* 3D WebGL Canvas Layer */}
      <CharacterCanvas
        sceneViewMode={sceneViewMode}
        currentAnimation={currentAnimation}
        onAnimationChange={setCurrentAnimation}
        cameraMode={cameraMode}
        lightingMode={lightingMode}
        showSkeleton={showSkeleton}
        playbackSpeed={playbackSpeed}
        customModel={customModel}
        customMixer={customMixer}
        customActions={customActions}
        onTriggerHit={handleTriggerHit}
        activeAttackTrigger={attackTrigger}
        virtualMove={virtualMove}
        terrainEngine={terrainEngine}
        isTerrainEditorOpen={isTerrainEditorOpen}
        terrainTool={terrainTool}
        brushRadius={brushRadius}
        brushIntensity={brushIntensity}
        activePresetId={activePresetId}
        placedCharacters={placedCharacters}
        currentActiveEntityId={currentActiveEntityId}
        performanceMode={performanceMode}
        onPlayerPositionChange={(x, z) => {
          playerCoordinatesRef.current = { x, z };
        }}
        onTerrainSculptEnd={triggerAutoSave}
      />

      {/* Lobby Overlay or In-Game HUD Overlay */}
      {sceneViewMode === 'lobby' ? (
        <LobbyOverlay
          activePresetId={activePresetId}
          onSelectPreset={(presetId) => {
            setActivePresetId(presetId);
            triggerAutoSave();
            showToast('Robot cambiado en el hangar base.');
          }}
          currentAnimation={currentAnimation}
          onSelectAnimation={setCurrentAnimation}
          hasCustomModel={customModel !== null}
          onOpenSlotManager={() => setIsModalOpen(true)}
          onOpenProjectManager={() => setIsProjectManagerOpen(true)}
          onStartGame={() => setSceneViewMode('game')}
          onToggleFullscreen={handleToggleFullscreen}
          performanceMode={performanceMode}
          onTogglePerformanceMode={handleTogglePerformanceMode}
        />
      ) : (
        <HUDOverlay
          currentAnimation={currentAnimation}
          onAnimationChange={setCurrentAnimation}
          slots={slots}
          onOpenSlotsModal={() => setIsModalOpen(true)}
          cameraMode={cameraMode}
          onToggleCameraMode={handleToggleCameraMode}
          lightingMode={lightingMode}
          onChangeLighting={setLightingMode}
          showSkeleton={showSkeleton}
          onToggleSkeleton={handleToggleSkeleton}
          playbackSpeed={playbackSpeed}
          onChangePlaybackSpeed={setPlaybackSpeed}
          onTriggerAttack={handleTriggerAttack}
          lastHit={lastHit}
          onVirtualMove={setVirtualMove}
          isTerrainEditorOpen={isTerrainEditorOpen}
          onToggleTerrainEditor={() => setIsTerrainEditorOpen((prev) => !prev)}
          onOpenCharacterRoster={() => setIsCharacterRosterOpen(true)}
          characterCount={placedCharacters.length + 1}
          onDownloadStandaloneGame={handleDownloadStandaloneGame}
          performanceMode={performanceMode}
          onTogglePerformanceMode={handleTogglePerformanceMode}
          onOpenProjectManager={() => setIsProjectManagerOpen(true)}
          lastAutoSaveTime={lastAutoSaveTime}
          onReturnToLobby={() => setSceneViewMode('lobby')}
        />
      )}

      {/* Mountain Relief Sculpting Toolbar */}
      {isTerrainEditorOpen && (
        <TerrainEditorToolbar
          activeTool={terrainTool}
          onSelectTool={setTerrainTool}
          brushRadius={brushRadius}
          onRadiusChange={setBrushRadius}
          brushIntensity={brushIntensity}
          onIntensityChange={setBrushIntensity}
          onGenerateHills={() => {
            handleGenerateHills();
            triggerAutoSave();
          }}
          onResetFlat={() => {
            handleResetFlat();
            triggerAutoSave();
          }}
          onClose={() => setIsTerrainEditorOpen(false)}
        />
      )}

      {/* Character System Roster & Spawning Modal */}
      <CharacterRosterModal
        isOpen={isCharacterRosterOpen}
        onClose={() => setIsCharacterRosterOpen(false)}
        activePresetId={activePresetId}
        onSelectActivePreset={(presetId) => {
          setActivePresetId(presetId);
          triggerAutoSave();
          showToast('Aspecto de personaje actualizado.');
        }}
        placedCharacters={placedCharacters}
        onSpawnCharacterHere={(presetId, name) => {
          handleSpawnCharacterHere(presetId, name);
          triggerAutoSave();
        }}
        onRemoveCharacter={(id) => {
          handleRemoveCharacter(id);
          triggerAutoSave();
        }}
        onSwitchControlTo={handleSwitchControlTo}
        currentActiveEntityId={currentActiveEntityId}
      />

      {/* Project Persistence & HTML Game Import Modal */}
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        currentHeights={terrainEngine.exportHeightArray()}
        placedCharactersCount={placedCharacters.length}
        hasCustomModel={customModel !== null}
        onSaveCurrentProject={handleSaveCurrentProject}
        onLoadProject={handleLoadProject}
        onImportHtmlGame={handleImportHtmlGame}
        lastAutoSaveTime={lastAutoSaveTime}
        onRestoreAutoSave={handleRestoreAutoSave}
      />

      {/* GLB File / Slot Manager Modal */}
      <SlotManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        slots={slots}
        onFilesSelected={handleFilesSelected}
        onSingleSlotSelected={handleSingleSlotSelected}
        onResetToDefault={handleResetToDefault}
        isCustomModelActive={customModel !== null}
        onPreviewSlot={handlePreviewSlot}
      />

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          id="toast-notification"
          className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-slate-700 text-slate-100 text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 text-center max-w-md pointer-events-none"
        >
          {toastMessage}
        </div>
      )}
    </main>
  );
}
