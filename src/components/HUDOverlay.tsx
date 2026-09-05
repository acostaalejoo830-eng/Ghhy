import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  Camera,
  Sun,
  Volume2,
  VolumeX,
  Bone,
  Zap,
  Footprints,
  ArrowUp,
  Shield,
  HelpCircle,
  Mountain,
  Users,
  Download,
  Maximize,
  Minimize,
  Sparkles,
  FolderKanban,
} from 'lucide-react';
import {
  AnimationSlotConfig,
  AnimationType,
  CameraMode,
  SceneLightingMode,
  PerformanceMode,
} from '../types/character';
import { soundEngine } from '../audio/soundEffects';

interface HUDOverlayProps {
  currentAnimation: AnimationType;
  onAnimationChange: (anim: AnimationType) => void;
  slots: Record<AnimationType, AnimationSlotConfig>;
  onOpenSlotsModal: () => void;
  cameraMode: CameraMode;
  onToggleCameraMode: () => void;
  lightingMode: SceneLightingMode;
  onChangeLighting: (mode: SceneLightingMode) => void;
  showSkeleton: boolean;
  onToggleSkeleton: () => void;
  playbackSpeed: number;
  onChangePlaybackSpeed: (speed: number) => void;
  onTriggerAttack: () => void;
  lastHit: { damage: number; targetIdx: number; time: number } | null;
  onVirtualMove: (move: { x: number; y: number }) => void;
  // New features
  isTerrainEditorOpen: boolean;
  onToggleTerrainEditor: () => void;
  onOpenCharacterRoster: () => void;
  characterCount: number;
  onDownloadStandaloneGame: () => void;
  performanceMode: PerformanceMode;
  onTogglePerformanceMode: () => void;
  onOpenProjectManager: () => void;
  lastAutoSaveTime: number | null;
  onReturnToLobby?: () => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  currentAnimation,
  onAnimationChange,
  slots,
  onOpenSlotsModal,
  cameraMode,
  onToggleCameraMode,
  lightingMode,
  onChangeLighting,
  showSkeleton,
  onToggleSkeleton,
  playbackSpeed,
  onChangePlaybackSpeed,
  onTriggerAttack,
  lastHit,
  onVirtualMove,
  isTerrainEditorOpen,
  onToggleTerrainEditor,
  onOpenCharacterRoster,
  characterCount,
  onDownloadStandaloneGame,
  performanceMode,
  onTogglePerformanceMode,
  onOpenProjectManager,
  lastAutoSaveTime,
  onReturnToLobby,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Joystick touch state
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickThumb, setJoystickThumb] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingJoystickRef = useRef<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    soundEngine.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.isMuted = nextMuted;
    if (!nextMuted) soundEngine.playClick();
  };

  const loadedCount = (Object.values(slots) as AnimationSlotConfig[]).filter((s) => s.isLoaded).length;

  // Joystick handlers
  const handleTouchStartJoystick = (e: React.TouchEvent) => {
    isDraggingJoystickRef.current = true;
    updateJoystickPos(e.touches[0]);
  };

  const handleTouchMoveJoystick = (e: React.TouchEvent) => {
    if (!isDraggingJoystickRef.current) return;
    updateJoystickPos(e.touches[0]);
  };

  const handleTouchEndJoystick = () => {
    isDraggingJoystickRef.current = false;
    setJoystickThumb({ x: 0, y: 0 });
    onVirtualMove({ x: 0, y: 0 });
  };

  const updateJoystickPos = (touch: React.Touch) => {
    const base = joystickBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const maxRadius = rect.width / 2 - 10;
    const dist = Math.hypot(dx, dy);

    let clampedX = dx;
    let clampedY = dy;
    if (dist > maxRadius) {
      clampedX = (dx / dist) * maxRadius;
      clampedY = (dy / dist) * maxRadius;
    }

    setJoystickThumb({ x: clampedX, y: clampedY });
    onVirtualMove({
      x: clampedX / maxRadius,
      y: clampedY / maxRadius,
    });
  };

  const activeSlot = slots[currentAnimation];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 z-20">
      {/* --- Top Header & Bar --- */}
      <div className="flex items-start justify-between gap-3 flex-wrap pointer-events-auto">
        {/* App Title & Mapping badge */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-xl max-w-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 font-bold">
              3D
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Juego 3D: Relieves y Personajes
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {performanceMode === 'fast' ? '60 FPS' : 'Ultra'}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                model__28_: quieto • model__27_: caminar • model__26_: saltar • model__25_: golpe
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 shadow-xl flex-wrap">
          {/* Return to Base / Lobby button */}
          {onReturnToLobby && (
            <button
              id="btn-return-to-lobby"
              onClick={() => {
                soundEngine.playClick();
                onReturnToLobby();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold transition shadow-md shadow-red-950/40 active:scale-95 border border-red-400/40"
              title="Volver al Hangar Base / Lobby con el robot"
            >
              <span className="text-sm">🏢</span>
              <span>Base / Lobby</span>
            </button>
          )}

          {/* Projects & HTML Import Button */}
          <button
            id="btn-open-project-manager"
            onClick={() => {
              soundEngine.playClick();
              onOpenProjectManager();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-semibold transition border border-amber-500/30 shadow-md active:scale-95"
            title="Guardar o recuperar proyectos anteriores o importar un juego HTML"
          >
            <FolderKanban className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Proyectos / HTML</span>
            <span className="sm:hidden">Proyectos</span>
            {lastAutoSaveTime && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Auto-guardado activo" />
            )}
          </button>

          {/* Download Standalone Fullscreen Game Button */}
          <button
            id="btn-download-fullscreen-game"
            onClick={() => {
              soundEngine.playClick();
              onDownloadStandaloneGame();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 transition active:scale-95"
            title="Descargar archivo HTML del juego completo que se abre en pantalla completa"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar Juego</span>
            <span className="sm:hidden">Descargar</span>
          </button>

          {/* Fullscreen Button */}
          <button
            id="btn-fullscreen-toggle"
            onClick={handleToggleFullscreen}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-medium transition border border-slate-700"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span className="hidden md:inline">
              {isFullscreen ? 'Salir' : 'Pantalla Completa'}
            </span>
          </button>

          {/* Terrain Mountain Editor Toggle */}
          <button
            id="btn-toggle-mountain-editor"
            onClick={() => {
              soundEngine.playClick();
              onToggleTerrainEditor();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              isTerrainEditorOpen
                ? 'bg-sky-500/25 border-sky-400 text-sky-200 shadow-md shadow-sky-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Editor para moldear montañas y relieves 3D"
          >
            <Mountain className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Editor Montañas</span>
          </button>

          {/* Character System Button */}
          <button
            id="btn-open-character-roster"
            onClick={() => {
              soundEngine.playClick();
              onOpenCharacterRoster();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-semibold transition shadow-md shadow-purple-950/40"
            title="Sistema de Personajes y Spawning"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Personajes</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-purple-900 text-[10px] font-mono">
              {characterCount}
            </span>
          </button>

          {/* Performance Mode Switcher */}
          <button
            id="btn-toggle-performance-mode"
            onClick={() => {
              soundEngine.playClick();
              onTogglePerformanceMode();
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
              performanceMode === 'fast'
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title={performanceMode === 'fast' ? 'Modo Rápido 60 FPS (Optimizado)' : 'Modo Ultra'}
          >
            <span className="hidden sm:inline">Rendimiento: </span>
            {performanceMode === 'fast' ? '60 FPS' : 'Alta'}
          </button>

          {/* GLB File Slots Button */}
          <button
            id="btn-open-slot-manager"
            onClick={() => {
              soundEngine.playClick();
              onOpenSlotsModal();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
            title="Cargar y gestionar animaciones GLB"
          >
            <FolderOpen className="w-4 h-4 text-sky-400" />
          </button>

          {/* Camera Mode */}
          <button
            id="btn-toggle-camera-mode"
            onClick={() => {
              soundEngine.playClick();
              onToggleCameraMode();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700"
            title={cameraMode === 'follow' ? 'Cámara: Tercera Persona' : 'Cámara: Órbita Libre'}
          >
            <Camera className="w-4 h-4 text-sky-400" />
          </button>

          {/* Lighting Mode */}
          <button
            id="btn-cycle-lighting"
            onClick={() => {
              soundEngine.playClick();
              const next: Record<SceneLightingMode, SceneLightingMode> = {
                daylight: 'dusk',
                dusk: 'cyberpunk',
                cyberpunk: 'daylight',
              };
              onChangeLighting(next[lightingMode]);
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition border border-slate-700"
            title={`Iluminación: ${lightingMode}`}
          >
            <Sun className="w-4 h-4" />
          </button>

          {/* Skeleton Helper Toggle */}
          <button
            id="btn-toggle-skeleton"
            onClick={() => {
              soundEngine.playClick();
              onToggleSkeleton();
            }}
            className={`p-2 rounded-xl transition border ${
              showSkeleton
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
            }`}
            title="Ver esqueleto / articulaciones"
          >
            <Bone className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            id="btn-toggle-audio"
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>

          {/* Help Toggle */}
          <button
            id="btn-toggle-help"
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
            title="Ayuda y controles"
          >
            <HelpCircle className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* --- Help Popup Modal --- */}
      {showHelp && (
        <div
          id="help-modal-panel"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 pointer-events-auto"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-slate-200 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-sky-400" /> Guía del Juego y Herramientas
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="font-bold text-sky-300 mb-1">⛰️ Editor de Montañas y Relieves:</p>
                <p className="text-slate-300">
                  Activa el editor para elevar cordilleras, hundir valles o suavizar el suelo. El personaje y todos los acompañantes se adaptan automáticamente a la altura del terreno.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="font-bold text-purple-300 mb-1">👥 Sistema de Personajes:</p>
                <p className="text-slate-300">
                  Elige entre diferentes aspectos atléticos (Aventurero, Cyber Androide, Ninja o Explorador) y coloca múltiples personajes en el mapa que puedes controlar en cualquier momento.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="font-bold text-emerald-300 mb-1">🎮 Descarga en Pantalla Completa:</p>
                <p className="text-slate-300">
                  Descarga un archivo HTML autónomo con todo el juego listo para ejecutarse offline en pantalla completa.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="font-bold text-amber-300 mb-1">Mapeo de Teclado:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  <li><kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white font-mono">W, A, S, D</kbd>: Caminar / Correr</li>
                  <li><kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white font-mono">Espacio</kbd>: Saltar</li>
                  <li><kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white font-mono">Click / F</kbd>: Atacar (Golpe marcial de energía)</li>
                </ul>
              </div>
            </div>

            <button
              id="btn-close-help"
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* --- Floating Hit Damage Feedback --- */}
      {lastHit && Date.now() - lastHit.time < 1200 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none animate-bounce">
          <div className="px-3 py-1 rounded-full bg-rose-500/90 text-white font-black text-sm tracking-wider shadow-lg shadow-rose-950/50 flex items-center gap-1.5 border border-rose-300">
            <Zap className="w-4 h-4" /> IMPACTO -{lastHit.damage} DMG
          </div>
        </div>
      )}

      {/* --- Mobile Touch Controls --- */}
      {isMobile && (
        <div className="pointer-events-auto flex items-end justify-between w-full px-2 mb-2">
          {/* Virtual Joystick */}
          <div
            ref={joystickBaseRef}
            onTouchStart={handleTouchStartJoystick}
            onTouchMove={handleTouchMoveJoystick}
            onTouchEnd={handleTouchEndJoystick}
            className="relative w-28 h-28 rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-700/80 flex items-center justify-center touch-none select-none shadow-xl"
          >
            <div
              className="w-12 h-12 rounded-full bg-sky-500/80 border-2 border-white/60 shadow-md transform pointer-events-none"
              style={{
                transform: `translate(${joystickThumb.x}px, ${joystickThumb.y}px)`,
              }}
            />
          </div>

          {/* Action Buttons (Jump & Martial Strike) */}
          <div className="flex flex-col gap-3">
            <button
              id="btn-mobile-jump"
              onTouchStart={(e) => {
                e.preventDefault();
                window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
              }}
              className="w-14 h-14 rounded-full bg-amber-600/90 border-2 border-amber-300/60 active:scale-95 flex items-center justify-center text-white shadow-lg touch-none"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
            <button
              id="btn-mobile-attack"
              onTouchStart={(e) => {
                e.preventDefault();
                onTriggerAttack();
              }}
              className="w-16 h-16 rounded-full bg-rose-600/90 border-2 border-rose-300/60 active:scale-95 flex items-center justify-center text-white shadow-lg touch-none"
            >
              <Zap className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}

      {/* --- Bottom Dashboard Controls --- */}
      <div className="flex flex-col items-center gap-2.5 pointer-events-auto w-full max-w-2xl mx-auto">
        {/* Active Animation Status Pill */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl">
          <span className="text-xs text-slate-400 font-medium">Animación:</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${activeSlot.badgeColor}`}>
              {activeSlot.filePattern}
            </span>
            <span className="text-xs font-semibold text-white">
              {activeSlot.labelEs}
            </span>
          </div>
        </div>

        {/* Action Trigger Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-2 rounded-2xl shadow-2xl">
          {/* Quieto (model__28_) */}
          <button
            id="btn-trigger-idle"
            onClick={() => {
              soundEngine.playClick();
              onAnimationChange('idle');
            }}
            className={`p-2.5 rounded-xl text-left border transition flex items-center gap-2.5 ${
              currentAnimation === 'idle'
                ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate">Quieto</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">model__28_</div>
            </div>
          </button>

          {/* Caminar (model__27_) */}
          <button
            id="btn-trigger-walk"
            onClick={() => {
              soundEngine.playClick();
              onAnimationChange('walk');
            }}
            className={`p-2.5 rounded-xl text-left border transition flex items-center gap-2.5 ${
              currentAnimation === 'walk'
                ? 'bg-sky-500/20 border-sky-500 text-white shadow-md'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Footprints className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate">Caminar</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">model__27_</div>
            </div>
          </button>

          {/* Saltar (model__26_) */}
          <button
            id="btn-trigger-jump"
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
            }}
            className={`p-2.5 rounded-xl text-left border transition flex items-center gap-2.5 ${
              currentAnimation === 'jump'
                ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ArrowUp className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate">Saltar</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">model__26_</div>
            </div>
          </button>

          {/* Atacar / Golpe (model__25_) */}
          <button
            id="btn-trigger-attack"
            onClick={() => {
              onTriggerAttack();
            }}
            className={`p-2.5 rounded-xl text-left border transition flex items-center gap-2.5 ${
              currentAnimation === 'attack'
                ? 'bg-rose-500/20 border-rose-500 text-white shadow-md'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate">Atacar / Golpe</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">model__25_</div>
            </div>
          </button>
        </div>

        {/* Speed Slider & Quick Keyboard Hints */}
        <div className="flex items-center justify-between gap-4 w-full px-2 text-[11px] text-slate-400">
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">WASD</span> Mover
            <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Espacio</span> Saltar
            <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Click / F</span> Golpe
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span>Velocidad:</span>
            <input
              id="slider-playback-speed"
              type="range"
              min="0.25"
              max="2.0"
              step="0.25"
              value={playbackSpeed}
              onChange={(e) => onChangePlaybackSpeed(parseFloat(e.target.value))}
              className="w-20 accent-sky-500 cursor-pointer"
            />
            <span className="font-mono text-slate-200">{playbackSpeed.toFixed(2)}x</span>
          </div>
        </div>
      </div>
    </div>
  );
};
