import React from 'react';
import { AlertCircle, MapPin, Settings, X } from 'lucide-react';

export type LocationDialogState = 'explanation' | 'denied' | 'blocked' | 'service-disabled' | 'unavailable';

interface LocationPermissionModalProps {
  isOpen: boolean;
  state: LocationDialogState;
  onClose: () => void;
  onRequestPermission: () => void;
  onOpenAppSettings: () => void;
  onOpenLocationSettings: () => void;
}

const copy: Record<LocationDialogState, { title: string; body: string }> = {
  explanation: {
    title: 'Usar tu ubicación',
    body: 'BañosTour utilizará tu ubicación mientras usas la aplicación para calcular la distancia a tours y lugares cercanos. No se activa en segundo plano.',
  },
  denied: {
    title: 'Ubicación no autorizada',
    body: 'Puedes volver a conceder el permiso o continuar eligiendo manualmente un punto de referencia en Baños.',
  },
  blocked: {
    title: 'Permiso bloqueado',
    body: 'El permiso de ubicación fue denegado permanentemente. Actívalo desde los ajustes de BañosTour para utilizar el GPS.',
  },
  'service-disabled': {
    title: 'GPS desactivado',
    body: 'El permiso está concedido, pero el servicio de ubicación del dispositivo está apagado. Actívalo para calcular distancias reales.',
  },
  unavailable: {
    title: 'Ubicación no disponible',
    body: 'No fue posible obtener una ubicación válida. Puedes continuar con un punto de referencia manual.',
  },
};

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  state,
  onClose,
  onRequestPermission,
  onOpenAppSettings,
  onOpenLocationSettings,
}) => {
  if (!isOpen) return null;
  const content = copy[state];

  return (
    <div className="fixed inset-0 z-[400] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            {state === 'explanation' ? <MapPin className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="mt-4 text-base font-black text-slate-900">{content.title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{content.body}</p>
        <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[10px] text-slate-500">
          Siempre puedes explorar usando el selector manual. BañosTour guarda localmente la última ubicación autorizada para conservar tu referencia.
        </p>

        <div className="mt-4 grid gap-2">
          {(state === 'explanation' || state === 'denied') && (
            <button onClick={onRequestPermission} className="min-h-11 rounded-xl bg-teal-600 px-4 text-xs font-bold text-white hover:bg-teal-500">
              {state === 'explanation' ? 'Continuar y solicitar permiso' : 'Volver a solicitar permiso'}
            </button>
          )}
          {state === 'blocked' && (
            <button onClick={onOpenAppSettings} className="min-h-11 rounded-xl bg-teal-600 px-4 text-xs font-bold text-white hover:bg-teal-500 flex items-center justify-center gap-2">
              <Settings className="h-4 w-4" /> Abrir ajustes de la aplicación
            </button>
          )}
          {state === 'service-disabled' && (
            <button onClick={onOpenLocationSettings} className="min-h-11 rounded-xl bg-teal-600 px-4 text-xs font-bold text-white hover:bg-teal-500 flex items-center justify-center gap-2">
              <Settings className="h-4 w-4" /> Activar ubicación del dispositivo
            </button>
          )}
          <button onClick={onClose} className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50">
            Usar punto de referencia manual
          </button>
        </div>
      </div>
    </div>
  );
};
