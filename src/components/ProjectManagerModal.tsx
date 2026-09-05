import React, { useState, useEffect, useRef } from 'react';
import {
  FolderKanban,
  Save,
  UploadCloud,
  FileCode2,
  Trash2,
  CheckCircle2,
  Mountain,
  Users,
  Sparkles,
  RefreshCw,
  X,
  AlertCircle,
  FileUp,
} from 'lucide-react';
import { SavedProject, ParsedHtmlGame } from '../types/character';
import { projectStorage } from '../utils/projectStorage';
import { parseGameHtml } from '../utils/htmlGameParser';
import { soundEngine } from '../audio/soundEffects';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Current live state
  currentHeights: number[];
  placedCharactersCount: number;
  hasCustomModel: boolean;
  // Actions
  onSaveCurrentProject: (name: string) => Promise<void>;
  onLoadProject: (project: SavedProject) => void;
  onImportHtmlGame: (parsed: ParsedHtmlGame, swapCharacterChoice: 'keep-editor' | 'use-html' | 'swap-preset') => void;
  lastAutoSaveTime: number | null;
  onRestoreAutoSave: () => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentHeights,
  placedCharactersCount,
  hasCustomModel,
  onSaveCurrentProject,
  onLoadProject,
  onImportHtmlGame,
  lastAutoSaveTime,
  onRestoreAutoSave,
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'import-html'>('saved');
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);

  // HTML import state
  const [parsedHtml, setParsedHtml] = useState<ParsedHtmlGame | null>(null);
  const [htmlFileName, setHtmlFileName] = useState<string>('');
  const [htmlParseError, setHtmlParseError] = useState<string | null>(null);
  const [characterChoice, setCharacterChoice] = useState<'keep-editor' | 'use-html' | 'swap-preset'>('keep-editor');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved projects list
  const refreshProjectsList = async () => {
    setIsLoadingList(true);
    try {
      const list = await projectStorage.getAllProjects();
      setProjects(list);
    } catch (err) {
      console.error('Error fetching saved projects:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshProjectsList();
      setNewProjectName(`Proyecto ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const trimmed = newProjectName.trim() || 'Proyecto sin título';
    setIsSaving(true);
    try {
      soundEngine.playClick();
      await onSaveCurrentProject(trimmed);
      await refreshProjectsList();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playClick();
    if (confirm('¿Estás seguro de eliminar este proyecto guardado?')) {
      await projectStorage.deleteProject(id);
      await refreshProjectsList();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processHtmlFile(file);
    }
  };

  const handleDropHtml = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.html') || file.type.includes('html'))) {
      processHtmlFile(file);
    } else {
      setHtmlParseError('Por favor selecciona un archivo con extensión .html');
    }
  };

  const processHtmlFile = async (file: File) => {
    setHtmlFileName(file.name);
    setHtmlParseError(null);
    try {
      const text = await file.text();
      const parsed = parseGameHtml(text);
      if (!parsed.hasTerrain && !parsed.hasCustomModel) {
        setHtmlParseError('El archivo HTML no parece contener datos 3D del juego (relieves o modelos).');
        setParsedHtml(null);
        return;
      }
      setParsedHtml(parsed);
      soundEngine.playClick();
      // Default to use-html if the HTML has custom model, or keep-editor
      if (parsed.hasCustomModel) {
        setCharacterChoice('use-html');
      } else {
        setCharacterChoice('keep-editor');
      }
    } catch (err) {
      console.error('Error parsing HTML file:', err);
      setHtmlParseError('Ocurrió un error al leer el archivo HTML.');
      setParsedHtml(null);
    }
  };

  const handleApplyImport = () => {
    if (!parsedHtml) return;
    soundEngine.playClick();
    onImportHtmlGame(parsedHtml, characterChoice);
    onClose();
  };

  return (
    <div
      id="project-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Proyectos y Recuperación
                  {lastAutoSaveTime && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Auto-guardado
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">
                  Guarda proyectos, recupera sesiones previas o importa un juego HTML completo.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 ${
                activeTab === 'saved'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Save className="w-4 h-4" />
              Proyectos Guardados ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('import-html')}
              className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 ${
                activeTab === 'import-html'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileCode2 className="w-4 h-4" />
              Importar Juego HTML
            </button>
          </div>
        </div>

        {/* Tab 1: Saved Projects */}
        {activeTab === 'saved' && (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 text-xs">
            {/* Quick Auto-save recovery banner if available */}
            {lastAutoSaveTime && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-emerald-200">Última sesión auto-guardada</div>
                    <div className="text-[11px] text-emerald-400/80">
                      Guardado automáticamente a las {new Date(lastAutoSaveTime).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onRestoreAutoSave();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition active:scale-95 shrink-0"
                >
                  Recuperar
                </button>
              </div>
            )}

            {/* Save current project form */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <div className="font-semibold text-white flex items-center gap-2">
                <Save className="w-4 h-4 text-sky-400" /> Guardar Estado Actual
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Nombre de este proyecto..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition flex items-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-md shadow-sky-950/40"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Mountain className="w-3.5 h-3.5 text-sky-400" /> Relieves actuales</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-purple-400" /> {placedCharactersCount} personajes</span>
                {hasCustomModel && <span className="text-amber-300 font-mono">GLB Personalizado</span>}
              </div>
            </div>

            {/* Projects list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-400 font-semibold px-1">
                <span>Proyectos Anteriores ({projects.length})</span>
                <button
                  onClick={refreshProjectsList}
                  className="p-1 hover:text-white transition flex items-center gap-1 text-[11px]"
                >
                  <RefreshCw className="w-3 h-3" /> Actualizar
                </button>
              </div>

              {isLoadingList ? (
                <div className="p-8 text-center text-slate-500">Cargando proyectos...</div>
              ) : projects.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-400">
                  No hay proyectos guardados todavía. Asigna un nombre arriba y haz clic en "Guardar".
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {projects.map((proj) => {
                    const dateStr = new Date(proj.updatedAt).toLocaleString();
                    return (
                      <div
                        key={proj.id}
                        onClick={() => {
                          soundEngine.playClick();
                          onLoadProject(proj);
                          onClose();
                        }}
                        className="p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-sky-500/50 transition cursor-pointer flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-white text-sm truncate group-hover:text-sky-300 transition">
                            {proj.name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{dateStr}</span>
                            <span>•</span>
                            <span>{proj.placedCharacters?.length || 0} personajes</span>
                            {proj.customGlbData && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                                Con GLB
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              soundEngine.playClick();
                              onLoadProject(proj);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition active:scale-95"
                          >
                            Cargar
                          </button>
                          <button
                            onClick={(e) => handleDelete(proj.id, e)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                            title="Eliminar proyecto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Import HTML Game */}
        {activeTab === 'import-html' && (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
            {/* Drop / Upload Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropHtml}
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-purple-500 bg-slate-950/50 hover:bg-purple-950/10 transition cursor-pointer text-center space-y-2.5"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".html"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto">
                <FileUp className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">
                  Haz clic o arrastra un archivo HTML de juego aquí
                </div>
                <div className="text-slate-400 text-[11px]">
                  Compatible con juegos descargados de este editor o archivos HTML con modelos y terrenos 3D.
                </div>
              </div>
            </div>

            {/* Parse error */}
            {htmlParseError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{htmlParseError}</span>
              </div>
            )}

            {/* Parsed Inspection Card & Swap Controls */}
            {parsedHtml && (
              <div className="p-4 rounded-2xl bg-slate-800/70 border border-purple-500/40 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Archivo detectado: <span className="text-purple-300">{htmlFileName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{parsedHtml.title}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    Válido
                  </span>
                </div>

                {/* Detected content badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700">
                    <div className="text-slate-400">Terreno / Relieves:</div>
                    <div className="font-bold text-sky-300">
                      {parsedHtml.hasTerrain ? 'Montañas detectadas' : 'Plano'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700">
                    <div className="text-slate-400">Personajes:</div>
                    <div className="font-bold text-purple-300">
                      {(parsedHtml.placedCharacters?.length || 0) + 1} en escena
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700">
                    <div className="text-slate-400">Modelo GLB incrustado:</div>
                    <div className="font-bold text-amber-300">
                      {parsedHtml.hasCustomModel ? 'Sí (con animaciones)' : 'Modelo atlético'}
                    </div>
                  </div>
                </div>

                {/* Character Swap Configuration: crucial requirement from user! */}
                <div className="space-y-2 pt-1">
                  <div className="font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" />
                    ¿Qué personaje deseas usar en este terreno importado?
                  </div>
                  <div className="space-y-2">
                    <label
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                        characterChoice === 'keep-editor'
                          ? 'bg-sky-950/40 border-sky-500 text-white'
                          : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="characterChoice"
                        value="keep-editor"
                        checked={characterChoice === 'keep-editor'}
                        onChange={() => setCharacterChoice('keep-editor')}
                        className="mt-0.5 accent-sky-500"
                      />
                      <div>
                        <div className="font-bold">Usar mi personaje actual del editor con sus animaciones</div>
                        <div className="text-[11px] text-slate-400">
                          Reemplaza el personaje del HTML por tu personaje actual (GLB o preset), caminando, saltando y atacando en las montañas importadas.
                        </div>
                      </div>
                    </label>

                    {parsedHtml.hasCustomModel && (
                      <label
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                          characterChoice === 'use-html'
                            ? 'bg-purple-950/40 border-purple-500 text-white'
                            : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name="characterChoice"
                          value="use-html"
                          checked={characterChoice === 'use-html'}
                          onChange={() => setCharacterChoice('use-html')}
                          className="mt-0.5 accent-purple-500"
                        />
                        <div>
                          <div className="font-bold">Cargar el personaje y animaciones que vienen dentro del HTML</div>
                          <div className="text-[11px] text-slate-400">
                            Extrae los modelos y animaciones GLB guardados en el archivo HTML.
                          </div>
                        </div>
                      </label>
                    )}

                    <label
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                        characterChoice === 'swap-preset'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="characterChoice"
                        value="swap-preset"
                        checked={characterChoice === 'swap-preset'}
                        onChange={() => setCharacterChoice('swap-preset')}
                        className="mt-0.5 accent-emerald-500"
                      />
                      <div>
                        <div className="font-bold">Asignar nuevo modelo atlético (Aventurero / Androide / Ninja)</div>
                        <div className="text-[11px] text-slate-400">
                          Usa un personaje procedural atlético con movimiento suave sin armas antiguas.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Confirm Import Button */}
                <button
                  onClick={handleApplyImport}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 active:scale-95"
                >
                  <UploadCloud className="w-5 h-5" />
                  Importar y Continuar Editando en 3D
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
