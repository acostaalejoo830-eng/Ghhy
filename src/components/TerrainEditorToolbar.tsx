import React from 'react';
import { Mountain, ArrowUp, ArrowDown, Waves, Minus, Sparkles, RotateCcw, X } from 'lucide-react';
import { TerrainBrushTool } from '../types/character';

interface TerrainEditorToolbarProps {
  activeTool: TerrainBrushTool;
  onSelectTool: (tool: TerrainBrushTool) => void;
  brushRadius: number;
  onRadiusChange: (val: number) => void;
  brushIntensity: number;
  onIntensityChange: (val: number) => void;
  onGenerateHills: () => void;
  onResetFlat: () => void;
  onClose: () => void;
}

export const TerrainEditorToolbar: React.FC<TerrainEditorToolbarProps> = ({
  activeTool,
  onSelectTool,
  brushRadius,
  onRadiusChange,
  brushIntensity,
  onIntensityChange,
  onGenerateHills,
  onResetFlat,
  onClose,
}) => {
  const tools: { id: TerrainBrushTool; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'raise', label: 'Elevar Picos', icon: <ArrowUp className="w-4 h-4 text-emerald-400" />, desc: 'Crea montañas y cordilleras' },
    { id: 'lower', label: 'Hundir Valles', icon: <ArrowDown className="w-4 h-4 text-sky-400" />, desc: 'Crea cañones y depresiones' },
    { id: 'smooth', label: 'Suavizar', icon: <Waves className="w-4 h-4 text-amber-400" />, desc: 'Difumina aristas escarpadas' },
    { id: 'flatten', label: 'Aplanar', icon: <Minus className="w-4 h-4 text-indigo-400" />, desc: 'Nivela mesetas horizontales' },
  ];

  return (
    <div
      id="terrain-editor-toolbar"
      className="absolute top-20 right-4 sm:right-6 w-80 max-w-[calc(100vw-32px)] bg-slate-900/95 backdrop-blur-xl border border-sky-500/30 rounded-2xl p-4 shadow-2xl z-30 text-white animate-in fade-in slide-in-from-right-4 duration-200 pointer-events-auto"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Mountain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Editor de Montañas</h3>
            <p className="text-[11px] text-slate-400">Pincel de relieves 3D</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Cerrar editor"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tools selection */}
      <div className="space-y-1.5 mb-4">
        <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Herramienta de Esculpido
        </label>
        <div className="grid grid-cols-2 gap-2">
          {tools.map((t) => {
            const isSelected = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTool(t.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-sky-500/25 border-sky-400 text-white shadow-md shadow-sky-500/20'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                {t.icon}
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brush parameters */}
      <div className="space-y-3 mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
            <span>Radio de Brocha</span>
            <span className="text-sky-400 font-mono">{brushRadius.toFixed(1)}m</span>
          </div>
          <input
            type="range"
            min="2"
            max="18"
            step="0.5"
            value={brushRadius}
            onChange={(e) => onRadiusChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
            <span>Fuerza / Intensidad</span>
            <span className="text-sky-400 font-mono">{(brushIntensity * 10).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.1"
            value={brushIntensity}
            onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
        </div>
      </div>

      {/* Quick Generators */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
        <button
          onClick={onGenerateHills}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Auto Montañas</span>
        </button>
        <button
          onClick={onResetFlat}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Aplanar Todo</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-400 mt-3 text-center leading-relaxed">
        Arrastra el cursor sobre el suelo para moldear relieves en tiempo real.
      </p>
    </div>
  );
};
