import React, { useState } from 'react';
import { Users, Plus, Trash2, CheckCircle2, UserCheck, Sparkles, X, ShieldAlert } from 'lucide-react';
import { PlacedCharacter, CharacterPreset } from '../types/character';
import { CHARACTER_PRESETS } from '../utils/proceduralCharacter';

interface CharacterRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePresetId: string;
  onSelectActivePreset: (presetId: string) => void;
  placedCharacters: PlacedCharacter[];
  onSpawnCharacterHere: (presetId: string, name: string) => void;
  onRemoveCharacter: (id: string) => void;
  onSwitchControlTo: (id: string) => void;
  currentActiveEntityId: string; // 'player' or character id
}

export const CharacterRosterModal: React.FC<CharacterRosterModalProps> = ({
  isOpen,
  onClose,
  activePresetId,
  onSelectActivePreset,
  placedCharacters,
  onSpawnCharacterHere,
  onRemoveCharacter,
  onSwitchControlTo,
  currentActiveEntityId,
}) => {
  const [selectedSpawnPreset, setSelectedSpawnPreset] = useState<string>(activePresetId);
  const [newCharName, setNewCharName] = useState<string>('');

  if (!isOpen) return null;

  const handleSpawn = () => {
    const preset = CHARACTER_PRESETS.find(p => p.id === selectedSpawnPreset) || CHARACTER_PRESETS[0];
    const name = newCharName.trim() || `${preset.name} #${placedCharacters.length + 1}`;
    onSpawnCharacterHere(selectedSpawnPreset, name);
    setNewCharName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="character-system-modal"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Sistema de Personajes
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {placedCharacters.length + 1} en el mundo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Elige tu estilo, pon nuevos personajes en el relieve y cambia de control.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Section 1: Active Skin / Archetype */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Aspecto de tu Personaje Activo
              </h3>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sin espadas ni armas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CHARACTER_PRESETS.map((preset) => {
                const isCurrent = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectActivePreset(preset.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      isCurrent
                        ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/10 ring-1 ring-purple-500'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-inner"
                      style={{
                        backgroundColor: `#${preset.primaryColor.toString(16).padStart(6, '0')}`,
                        border: `2px solid #${preset.secondaryColor.toString(16).padStart(6, '0')}`,
                        color: `#${preset.accentColor.toString(16).padStart(6, '0')}`,
                      }}
                    >
                      3D
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm text-slate-100 truncate">{preset.name}</div>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-300">
                            Activo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-purple-400 font-medium">{preset.role}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{preset.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Spawn More Characters */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              2. Poner Personajes en el Mapa
            </h3>
            <p className="text-xs text-slate-300 mb-3">
              Genera acompañantes o NPCs con físicas completas sobre las montañas y relieves.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={newCharName}
                onChange={(e) => setNewCharName(e.target.value)}
                placeholder="Nombre del personaje (ej. Aliado Alfa)..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <select
                value={selectedSpawnPreset}
                onChange={(e) => setSelectedSpawnPreset(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {CHARACTER_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSpawn}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-950/40 transition-all active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Poner Personaje</span>
              </button>
            </div>
          </div>

          {/* Section 3: Placed Characters Roster */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              3. Personajes en el Mundo ({placedCharacters.length + 1})
            </h3>

            <div className="space-y-2">
              {/* Main Player */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-xs">
                    P1
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      Jugador Principal
                      {currentActiveEntityId === 'player' && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold border border-emerald-500/30">
                          Bajo tu control
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Coordenadas X/Z en relieve montañoso
                    </div>
                  </div>
                </div>
                {currentActiveEntityId !== 'player' && (
                  <button
                    onClick={() => onSwitchControlTo('player')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Controlar</span>
                  </button>
                )}
              </div>

              {/* Spawned Characters */}
              {placedCharacters.map((c) => {
                const isControlling = currentActiveEntityId === c.id;
                const preset = CHARACTER_PRESETS.find(p => p.id === c.presetId) || CHARACTER_PRESETS[0];

                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                        style={{
                          backgroundColor: `#${preset.primaryColor.toString(16).padStart(6, '0')}`,
                          border: `1px solid #${preset.secondaryColor.toString(16).padStart(6, '0')}`,
                          color: `#${preset.accentColor.toString(16).padStart(6, '0')}`,
                        }}
                      >
                        NPC
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          {c.name}
                          {isControlling && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold border border-emerald-500/30">
                              Bajo tu control
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {preset.name} • Pos: ({c.x.toFixed(1)}, {c.z.toFixed(1)})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isControlling && (
                        <button
                          onClick={() => onSwitchControlTo(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-white text-xs font-semibold transition-colors"
                          title="Tomar control de este personaje"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Controlar</span>
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveCharacter(c.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                        title="Eliminar personaje"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {placedCharacters.length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  Aún no has colocado otros personajes. ¡Usa el botón "+ Poner Personaje" de arriba para poblar tu mundo!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
