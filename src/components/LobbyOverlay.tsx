import React from 'react';
import { Play, ChevronLeft, ChevronRight, Sparkles, FolderUp, Shield, Zap, Eye, Plane, Layers, Image as ImageIcon, Wind } from 'lucide-react';
import { AnimationType, CharacterPreset, LobbyConfig } from '../types/character';
import { CHARACTER_PRESETS } from '../utils/proceduralCharacter';
import { getLobbyBackdropPresets } from '../utils/lobbyBackdrops';

interface LobbyOverlayProps {
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  currentAnimation: AnimationType;
  onSelectAnimation: (anim: AnimationType) => void;
  hasCustomModel: boolean;
  onOpenSlotManager: () => void;
  onOpenProjectManager: () => void;
  onOpenLobbyBackdropModal: () => void;
  onOpenAirplaneModal: () => void;
  onStartGame: () => void;
  onStartAirplaneDrop: () => void;
  onToggleFullscreen: () => void;
  performanceMode: 'fast' | 'ultra';
  onTogglePerformanceMode: () => void;
  lobbyConfig: LobbyConfig;
}

export const LobbyOverlay: React.FC<LobbyOverlayProps> = ({
  activePresetId,
  onSelectPreset,
  currentAnimation,
  onSelectAnimation,
  hasCustomModel,
  onOpenSlotManager,
  onOpenProjectManager,
  onOpenLobbyBackdropModal,
  onOpenAirplaneModal,
  onStartGame,
  onStartAirplaneDrop,
  onToggleFullscreen,
  performanceMode,
  onTogglePerformanceMode,
  lobbyConfig,
}) => {
  const activePreset =
    CHARACTER_PRESETS.find((p) => p.id === activePresetId) || CHARACTER_PRESETS[0];

  const presets = getLobbyBackdropPresets();
  const selectedPreset = presets.find((p) => p.id === lobbyConfig.presetImageId) || presets[0];
  const activeImageUrl = lobbyConfig.customImageUrl || selectedPreset?.dataUrl;

  const handlePrevPreset = () => {
    const currentIndex = CHARACTER_PRESETS.findIndex((p) => p.id === activePresetId);
    const prevIndex = (currentIndex - 1 + CHARACTER_PRESETS.length) % CHARACTER_PRESETS.length;
    onSelectPreset(CHARACTER_PRESETS[prevIndex].id);
  };

  const handleNextPreset = () => {
    const currentIndex = CHARACTER_PRESETS.findIndex((p) => p.id === activePresetId);
    const nextIndex = (currentIndex + 1) % CHARACTER_PRESETS.length;
    onSelectPreset(CHARACTER_PRESETS[nextIndex].id);
  };

  return (
    <div
      id="lobby-overlay-root"
      className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden"
    >
      {/* 2D Photo Wallpaper mode: "la foto es toda la lobby si pongo una foto" */}
      {lobbyConfig.backdropMode === 'image2d' && activeImageUrl && (
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <img
            src={activeImageUrl}
            alt="Lobby Backdrop Wallpaper"
            className="w-full h-full object-cover filter brightness-[0.85] contrast-[1.08] transition-opacity duration-300"
          />
          {/* Subtle cinematic vignette gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/70" />
        </div>
      )}

      {/* Top Header Bar */}
      <header className="flex items-center justify-between w-full flex-wrap gap-3 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="h-11 px-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-red-500/30 shadow-lg shadow-red-950/20 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-widest text-red-400 uppercase">
                {lobbyConfig.backdropMode === 'hangar3d'
                  ? 'Base Subterránea • Hangar Sector 7'
                  : lobbyConfig.backdropMode === 'image2d'
                  ? 'Lobby 2D • Vista Panorámica'
                  : 'Plataforma 3D • Sector Táctico'}
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-100 tracking-wide uppercase">
                Lobby de Despliegue de Robots
              </span>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          {/* Lobby Backdrop Switcher Button */}
          <button
            id="lobby-btn-backdrop"
            onClick={onOpenLobbyBackdropModal}
            className="h-10 px-3.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-red-500/40 shadow-md backdrop-blur-md transition-all flex items-center gap-2 hover:border-red-400"
            title="Cambiar fondo del lobby: Hangar 3D, Foto 2D u Objeto 3D"
          >
            <Layers className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">
              {lobbyConfig.backdropMode === 'hangar3d'
                ? 'Fondo: Hangar 3D'
                : lobbyConfig.backdropMode === 'image2d'
                ? 'Fondo: Foto 2D'
                : 'Fondo: Objeto 3D'}
            </span>
          </button>

          {/* Airplane Manager Button */}
          <button
            id="lobby-btn-plane"
            onClick={onOpenAirplaneModal}
            className="h-10 px-3.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-sky-500/40 shadow-md backdrop-blur-md transition-all flex items-center gap-2 hover:border-sky-400"
            title="Configurar Avión 3D o modelo importado"
          >
            <Plane className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Avión 3D</span>
          </button>

          <button
            id="lobby-btn-projects"
            onClick={onOpenProjectManager}
            className="h-10 px-3.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700/60 shadow-md backdrop-blur-md transition-all flex items-center gap-2 hover:border-sky-500/40"
          >
            <FolderUp className="w-4 h-4 text-sky-400" />
            <span className="hidden md:inline">Proyectos / HTML</span>
          </button>

          <button
            id="lobby-btn-slots"
            onClick={onOpenSlotManager}
            className="h-10 px-3.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700/60 shadow-md backdrop-blur-md transition-all flex items-center gap-2 hover:border-purple-500/40"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline">Gestionar GLB</span>
          </button>

          <button
            id="lobby-btn-perf"
            onClick={onTogglePerformanceMode}
            className="h-10 px-3 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700/60 shadow-md backdrop-blur-md transition-all"
            title="Cambiar modo de rendimiento"
          >
            <span className="text-amber-400 font-mono">{performanceMode === 'fast' ? '⚡ 60FPS' : '✨ Ultra'}</span>
          </button>

          <button
            id="lobby-btn-fullscreen"
            onClick={onToggleFullscreen}
            className="h-10 px-3.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700/60 shadow-md backdrop-blur-md transition-all flex items-center gap-1.5"
          >
            <span>⛶</span>
          </button>
        </div>
      </header>

      {/* Bottom Control Section */}
      <footer className="w-full flex flex-col md:flex-row items-end justify-between gap-4 mt-auto">
        {/* Left Card: Character Selector & Animation Preview */}
        <div className="w-full md:w-[500px] bg-slate-950/90 border border-red-500/30 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-black/80 pointer-events-auto">
          {/* Header with Switcher Arrows */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Selección de Robot & Animaciones
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                id="lobby-prev-character-btn"
                onClick={handlePrevPreset}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-700/70 hover:border-red-500/50 flex items-center justify-center transition-all"
                title="Robot anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="lobby-next-character-btn"
                onClick={handleNextPreset}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-700/70 hover:border-red-500/50 flex items-center justify-center transition-all"
                title="Robot siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Character Bio */}
          <div className="flex items-center justify-between mb-3 bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {hasCustomModel ? 'Mi Robot GLB Importado' : activePreset.name}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                  {hasCustomModel ? 'GLB Personalizado' : activePreset.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {hasCustomModel
                  ? 'Modelo con animaciones model__28_, model__27_, model__26_, model__25_, model__24_'
                  : activePreset.description}
              </p>
            </div>
          </div>

          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {CHARACTER_PRESETS.map((preset) => {
              const isSelected = !hasCustomModel && activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  id={`lobby-preset-${preset.id}`}
                  onClick={() => onSelectPreset(preset.id)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 ${
                    isSelected
                      ? 'bg-red-600/30 border-red-500 text-white shadow-lg shadow-red-600/20'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/30"
                    style={{ backgroundColor: `#${preset.secondaryColor.toString(16).padStart(6, '0')}` }}
                  />
                  <span className="truncate w-full text-center">{preset.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Animation Preview Controls (Includes the requested Skysurf / Tabla de Surf animation) */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Probar animación en vivo:
              </span>
              <span className="text-red-400 font-mono font-bold uppercase">{currentAnimation}</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {(
                [
                  { id: 'idle', label: 'Quieto', code: 'model__28_' },
                  { id: 'walk', label: 'Caminar', code: 'model__27_' },
                  { id: 'jump', label: 'Saltar', code: 'model__26_' },
                  { id: 'attack', label: 'Golpe', code: 'model__25_' },
                  { id: 'skysurf', label: 'Surf Viento', code: 'model__24_' },
                ] as const
              ).map((anim) => {
                const isActive = currentAnimation === anim.id;
                return (
                  <button
                    key={anim.id}
                    id={`lobby-anim-${anim.id}`}
                    onClick={() => onSelectAnimation(anim.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-0.5 ${
                      isActive
                        ? anim.id === 'skysurf'
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-500/30'
                          : 'bg-red-500 text-white border-red-400 shadow-md shadow-red-500/30'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span className="truncate w-full text-center">{anim.label}</span>
                    <span className="text-[8px] opacity-75 font-mono">{anim.code}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Buttons: Start Game & Airplane Drop */}
        <div className="pointer-events-auto flex flex-col items-end gap-3">
          {/* Airplane Drop Skysurf Button */}
          <button
            id="lobby-air-drop-btn"
            onClick={onStartAirplaneDrop}
            className="group relative px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-950 via-cyan-900 to-sky-950 border border-cyan-500/60 text-white font-black text-xs sm:text-sm tracking-widest uppercase flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-950/40 hover:border-cyan-400 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <Plane className="w-4 h-4 text-cyan-300 group-hover:-translate-y-0.5 transition-transform" />
            <span>Despliegue desde Avión (Surf)</span>
            <Wind className="w-4 h-4 text-cyan-300 animate-pulse" />
          </button>

          {/* Futuristic Red Glowing "JUGAR >" / "START" button */}
          <div className="relative group cursor-pointer" onClick={onStartGame}>
            {/* Outer red neon glow diffusion */}
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-rose-600 to-red-500 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition duration-300 group-hover:scale-105 animate-pulse" />

            {/* Futuristic beveled octagonal button */}
            <button
              id="lobby-start-game-btn"
              className="relative px-8 sm:px-12 py-5 sm:py-6 rounded-2xl bg-gradient-to-b from-[#3a0a10] via-[#200508] to-[#120204] border-2 border-red-500 text-white font-black text-2xl sm:text-4xl tracking-widest uppercase flex items-center justify-center gap-4 shadow-[inset_0_0_20px_rgba(239,68,68,0.4),0_10px_30px_rgba(0,0,0,0.8)] transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-[0.98]"
              style={{
                fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                letterSpacing: '0.12em',
                textShadow: '0 0 16px rgba(239, 68, 68, 0.8), 0 2px 4px rgba(0,0,0,0.9)',
              }}
            >
              {/* Corner tech notch accents */}
              <div className="absolute top-1.5 left-2 w-2 h-2 border-t-2 border-l-2 border-red-400" />
              <div className="absolute top-1.5 right-2 w-2 h-2 border-t-2 border-r-2 border-red-400" />
              <div className="absolute bottom-1.5 left-2 w-2 h-2 border-b-2 border-l-2 border-red-400" />
              <div className="absolute bottom-1.5 right-2 w-2 h-2 border-b-2 border-r-2 border-red-400" />

              <span>JUGAR</span>
              <span className="text-red-400 font-mono text-3xl sm:text-5xl group-hover:translate-x-1.5 transition-transform duration-200">
                ›
              </span>
            </button>
          </div>

          <span className="text-[11px] font-bold text-red-400/80 tracking-widest uppercase mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mr-1">
            Presiona para entrar a la partida
          </span>
        </div>
      </footer>
    </div>
  );
};
