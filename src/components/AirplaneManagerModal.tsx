import React, { useRef } from 'react';
import { Plane, Upload, Play, Check, RefreshCw, X, Wind } from 'lucide-react';

interface AirplaneManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customPlaneFileName?: string | null;
  onImportPlaneGlb: (buffer: ArrayBuffer, fileName: string) => void;
  onResetToDefaultPlane: () => void;
  onStartAirplaneDrop: () => void;
}

export const AirplaneManagerModal: React.FC<AirplaneManagerModalProps> = ({
  isOpen,
  onClose,
  customPlaneFileName,
  onImportPlaneGlb,
  onResetToDefaultPlane,
  onStartAirplaneDrop,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      onImportPlaneGlb(buffer, file.name);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-950 border border-sky-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Avión 3D & Despliegue en Tabla de Surf
              </h2>
              <p className="text-xs text-slate-400">
                Avión militar de transporte o modelo GLB importado con caída suave por el viento
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
        <div className="p-6 space-y-5">
          {/* Current Airplane Status Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-sky-400">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Avión en Vuelo Activo
                </div>
                <div className="text-sm font-black text-white">
                  {customPlaneFileName ? customPlaneFileName : 'Avión Militar Dropship Táctico'}
                </div>
              </div>
            </div>

            {customPlaneFileName ? (
              <button
                onClick={onResetToDefaultPlane}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
                title="Restaurar avión por defecto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restaurar Predeterminado</span>
              </button>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-bold">
                Procedural Táctico
              </span>
            )}
          </div>

          {/* Upload Custom Airplane GLB Box */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Importar Avión Propio (.glb / .gltf)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-sky-500/40 hover:border-sky-400 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl p-5 text-center transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <Upload className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-200">
                Haz clic para subir un modelo 3D de avión en formato GLB
              </div>
              <div className="text-[11px] text-slate-400">
                Sustituirá al avión militar en el cielo y se incluirá en el archivo HTML descargable
              </div>
              {customPlaneFileName && (
                <div className="mt-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono flex items-center gap-1">
                  <Check className="w-3 h-3" /> Modelo cargado: {customPlaneFileName}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".glb,.gltf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {/* Sky Surf Flight Explanation Banner */}
          <div className="bg-gradient-to-r from-sky-950/40 to-cyan-950/40 border border-sky-500/30 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 mt-0.5">
              <Wind className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-bold text-sky-200">
                Dinámica de Caída Lenta por el Viento en Tabla de Surf
              </div>
              <p className="text-slate-300 leading-relaxed">
                Al salir del avión, el personaje desciende con sustentación aerodinámica mecido suavemente por el aire. Utiliza <strong className="text-white">WASD</strong> o las flechas para inclinar y dirigir la tabla en el cielo. Al llegar al suelo puedes continuar surfeando el terreno o caminar a pie.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Cerrar
          </button>

          <button
            onClick={() => {
              onClose();
              onStartAirplaneDrop();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-sky-600/30 transition-all uppercase tracking-wider flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Iniciar Salto desde el Avión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
