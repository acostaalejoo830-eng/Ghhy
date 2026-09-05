import React, { useRef } from 'react';
import { Image, Box, Layers, Upload, Check, Trash2, X, Sparkles } from 'lucide-react';
import { LobbyBackdropMode, LobbyConfig } from '../types/character';
import { getLobbyBackdropPresets, LobbyBackdropPreset } from '../utils/lobbyBackdrops';

interface LobbyBackdropModalProps {
  isOpen: boolean;
  onClose: () => void;
  lobbyConfig: LobbyConfig;
  onUpdateLobbyConfig: (newConfig: Partial<LobbyConfig>) => void;
  onImportLobbyObjectGlb: (buffer: ArrayBuffer, fileName: string) => void;
}

export const LobbyBackdropModal: React.FC<LobbyBackdropModalProps> = ({
  isOpen,
  onClose,
  lobbyConfig,
  onUpdateLobbyConfig,
  onImportLobbyObjectGlb,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const glbInputRef = useRef<HTMLInputElement>(null);
  const presets = getLobbyBackdropPresets();

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdateLobbyConfig({
        backdropMode: 'image2d',
        customImageUrl: dataUrl,
        customImageFileName: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGlbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      onImportLobbyObjectGlb(buffer, file.name);
      onUpdateLobbyConfig({
        backdropMode: 'object3d',
      });
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-950 border border-red-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Configuración del Fondo del Lobby
              </h2>
              <p className="text-xs text-slate-400">
                Cambia entre Hangar 3D, Imagen 2D de pantalla completa u Objeto 3D en la misma posición
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main 3 Modes Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Modo de Interfaz del Lobby
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Hangar 3D */}
              <button
                type="button"
                onClick={() => onUpdateLobbyConfig({ backdropMode: 'hangar3d' })}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                  lobbyConfig.backdropMode === 'hangar3d'
                    ? 'bg-red-950/40 border-red-500 text-white shadow-lg shadow-red-950/40 ring-1 ring-red-500'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Box className={`w-5 h-5 ${lobbyConfig.backdropMode === 'hangar3d' ? 'text-red-400' : 'text-slate-400'}`} />
                  {lobbyConfig.backdropMode === 'hangar3d' && <Check className="w-4 h-4 text-red-400" />}
                </div>
                <div>
                  <div className="text-sm font-black text-slate-100">1. Hangar 3D Militar</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Entorno subterráneo 3D completo con paredes, neones y suelo táctico.
                  </div>
                </div>
              </button>

              {/* Option 2: 2D Photo Wallpaper */}
              <button
                type="button"
                onClick={() => onUpdateLobbyConfig({ backdropMode: 'image2d' })}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                  lobbyConfig.backdropMode === 'image2d'
                    ? 'bg-red-950/40 border-red-500 text-white shadow-lg shadow-red-950/40 ring-1 ring-red-500'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Image className={`w-5 h-5 ${lobbyConfig.backdropMode === 'image2d' ? 'text-red-400' : 'text-slate-400'}`} />
                  {lobbyConfig.backdropMode === 'image2d' && <Check className="w-4 h-4 text-red-400" />}
                </div>
                <div>
                  <div className="text-sm font-black text-slate-100">2. Imagen 2D (Foto)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    La foto cubre toda la pantalla del lobby como wallpaper cinematográfico.
                  </div>
                </div>
              </button>

              {/* Option 3: 3D Object at same position */}
              <button
                type="button"
                onClick={() => onUpdateLobbyConfig({ backdropMode: 'object3d' })}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                  lobbyConfig.backdropMode === 'object3d'
                    ? 'bg-red-950/40 border-red-500 text-white shadow-lg shadow-red-950/40 ring-1 ring-red-500'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Sparkles className={`w-5 h-5 ${lobbyConfig.backdropMode === 'object3d' ? 'text-red-400' : 'text-slate-400'}`} />
                  {lobbyConfig.backdropMode === 'object3d' && <Check className="w-4 h-4 text-red-400" />}
                </div>
                <div>
                  <div className="text-sm font-black text-slate-100">3. Objeto 3D</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Plataforma u objeto 3D importado en esa misma posición exacta.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Section for Mode 2: Upload Photo or Select Preset */}
          {lobbyConfig.backdropMode === 'image2d' && (
            <div className="space-y-4 pt-2 border-t border-slate-800 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Foto de Fondo del Lobby (Toda la Pantalla)
                </span>
                {lobbyConfig.customImageUrl && (
                  <button
                    onClick={() =>
                      onUpdateLobbyConfig({
                        customImageUrl: null,
                        customImageFileName: null,
                      })
                    }
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Quitar foto personalizada
                  </button>
                )}
              </div>

              {/* Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-red-500/40 hover:border-red-400 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl p-5 text-center transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <Upload className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-200">
                  Haz clic para subir una foto propia (JPG, PNG, WebP)
                </div>
                <div className="text-[11px] text-slate-400">
                  La foto cubrirá toda la interfaz del lobby y se guardará en el HTML
                </div>
                {lobbyConfig.customImageFileName && (
                  <div className="mt-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono">
                    Foto cargada: {lobbyConfig.customImageFileName}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Presets Gallery */}
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  O elige una ilustración de fondo militar/aéreo:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {presets.map((preset) => {
                    const isSelected =
                      !lobbyConfig.customImageUrl &&
                      (lobbyConfig.presetImageId === preset.id ||
                        (!lobbyConfig.presetImageId && preset.id === 'hangar_art'));

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          onUpdateLobbyConfig({
                            presetImageId: preset.id,
                            customImageUrl: null,
                            customImageFileName: null,
                          })
                        }
                        className={`group relative rounded-xl overflow-hidden border transition-all text-left flex flex-col ${
                          isSelected
                            ? 'border-red-500 ring-2 ring-red-500 shadow-lg shadow-red-950/40'
                            : 'border-slate-800 hover:border-slate-600 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="h-20 w-full bg-slate-900 relative overflow-hidden">
                          <img
                            src={preset.thumbnailDataUrl}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-slate-900/90 flex-1">
                          <div className="text-[11px] font-bold text-white leading-tight">
                            {preset.name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Section for Mode 3: Custom 3D Object at same position */}
          {lobbyConfig.backdropMode === 'object3d' && (
            <div className="space-y-4 pt-2 border-t border-slate-800 animate-in fade-in duration-200">
              <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Objeto o Escenario 3D en la Misma Posición
              </span>
              <p className="text-xs text-slate-400">
                En este modo se ocultan las paredes y techo del hangar, y se coloca un objeto 3D o pedestal en esa ubicación exacta. Puedes importar cualquier modelo 3D en formato GLB.
              </p>

              <div
                onClick={() => glbInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-red-500/40 hover:border-red-400 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl p-5 text-center transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <Sparkles className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-200">
                  Importar Modelo 3D de Objeto / Escenario (.glb)
                </div>
                <div className="text-[11px] text-slate-400">
                  Reemplazará el objeto 3D en la misma posición y se incluirá en el HTML exportado
                </div>
                {lobbyConfig.customLobbyObjectFileName ? (
                  <div className="mt-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono">
                    Modelo 3D cargado: {lobbyConfig.customLobbyObjectFileName}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500">
                    Actualmente usando: Pedestal Holográfico Militar Táctico
                  </div>
                )}
                <input
                  ref={glbInputRef}
                  type="file"
                  accept=".glb,.gltf"
                  className="hidden"
                  onChange={handleGlbUpload}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Los cambios se reflejan al instante y se exportan al HTML
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all uppercase tracking-wider"
          >
            Listo / Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};
