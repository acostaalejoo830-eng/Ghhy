import React, { useRef } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCode,
  X,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AnimationSlotConfig, AnimationType } from '../types/character';
import { soundEngine } from '../audio/soundEffects';

interface SlotManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: Record<AnimationType, AnimationSlotConfig>;
  onFilesSelected: (files: FileList | File[]) => void;
  onSingleSlotSelected: (slot: AnimationType, file: File) => void;
  onResetToDefault: () => void;
  isCustomModelActive: boolean;
  onPreviewSlot: (slot: AnimationType) => void;
}

export const SlotManagerModal: React.FC<SlotManagerModalProps> = ({
  isOpen,
  onClose,
  slots,
  onFilesSelected,
  onSingleSlotSelected,
  onResetToDefault,
  isCustomModelActive,
  onPreviewSlot,
}) => {
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const singleInputRefs = {
    idle: useRef<HTMLInputElement>(null),
    walk: useRef<HTMLInputElement>(null),
    jump: useRef<HTMLInputElement>(null),
    attack: useRef<HTMLInputElement>(null),
  };

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      soundEngine.playClick();
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const slotKeys: AnimationType[] = ['idle', 'walk', 'jump', 'attack'];

  return (
    <div
      id="slot-manager-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="slot-manager-modal-card"
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Asignación de Animaciones GLB
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Configuración de archivos para el personaje del jugador según la especificación:
            </p>
          </div>
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          id="glb-dropzone"
          onClick={() => multiFileInputRef.current?.click()}
          className="mt-4 p-5 border-2 border-dashed border-sky-500/50 hover:border-sky-400 bg-sky-950/20 hover:bg-sky-950/40 rounded-xl flex flex-col items-center justify-center cursor-pointer transition text-center group"
        >
          <input
            ref={multiFileInputRef}
            type="file"
            multiple
            accept=".glb,.gltf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onFilesSelected(e.target.files);
              }
            }}
          />
          <Upload className="w-8 h-8 text-sky-400 group-hover:scale-110 transition mb-2" />
          <p className="text-sm font-medium text-sky-200">
            Arrastra aquí tus archivos <span className="font-semibold text-white">.glb</span> o haz clic para seleccionarlos
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Se detectarán automáticamente según su nombre: <code className="text-sky-300">model__28_</code>, <code className="text-sky-300">model__27_</code>, <code className="text-sky-300">model__26_</code>, <code className="text-sky-300">model__25_</code>
          </p>
        </div>

        {/* 4 Animation Slots List */}
        <div className="mt-5 space-y-3 overflow-y-auto pr-1 flex-1">
          {slotKeys.map((key) => {
            const slot = slots[key];
            return (
              <div
                key={key}
                id={`slot-card-${key}`}
                className="p-3.5 bg-slate-800/80 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3 hover:border-slate-600 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-mono font-bold border ${slot.badgeColor}`}
                  >
                    {slot.filePattern.replace('model__', '').replace('_', '')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{slot.labelEs}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                        {slot.filePattern}
                      </span>
                      {slot.isLoaded ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Cargado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 font-medium">
                          <AlertCircle className="w-3 h-3" /> Base
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {slot.isLoaded && slot.fileName
                        ? `Archivo: ${slot.fileName} ${slot.duration ? `(${slot.duration.toFixed(2)}s)` : ''}`
                        : slot.description}
                    </p>
                  </div>
                </div>

                {/* Slot Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id={`btn-preview-slot-${key}`}
                    onClick={() => {
                      soundEngine.playClick();
                      onPreviewSlot(key);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition"
                    title="Probar esta animación"
                  >
                    <Play className="w-3.5 h-3.5 text-sky-400" />
                    Probar
                  </button>

                  <input
                    ref={singleInputRefs[key]}
                    type="file"
                    accept=".glb,.gltf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        onSingleSlotSelected(key, e.target.files[0]);
                      }
                    }}
                  />

                  <button
                    id={`btn-upload-slot-${key}`}
                    onClick={() => singleInputRefs[key].current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-medium text-white flex items-center gap-1.5 transition"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    {slot.isLoaded ? 'Reemplazar' : 'Asignar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {isCustomModelActive ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Modelo personalizado GLB activo
              </span>
            ) : (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                Usando modelo guerrero 3D interactivo por defecto
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isCustomModelActive && (
              <button
                id="btn-reset-default-model"
                onClick={() => {
                  soundEngine.playClick();
                  onResetToDefault();
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar modelo base
              </button>
            )}
            <button
              id="btn-finish-modal"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-white text-xs font-semibold text-slate-900 transition"
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
