import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Fingerprint, KeyRound, ShieldCheck } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

interface BiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  userName?: string;
  autoStart?: boolean;
  canCancel?: boolean;
}

type BiometricState = 'checking' | 'idle' | 'scanning' | 'success' | 'unavailable';

export const BiometricModal: React.FC<BiometricModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userName = 'tu cuenta',
  autoStart = false,
  canCancel = true,
}) => {
  const [state, setState] = useState<BiometricState>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const autoStarted = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    autoStarted.current = false;
    setErrorMessage(null);
    setState('checking');

    if (!Capacitor.isNativePlatform()) {
      setState('unavailable');
      setErrorMessage('La autenticación biométrica está disponible en la aplicación instalada en Android.');
      return;
    }

    void BiometricAuth.checkBiometry()
      .then(result => {
        if (result.isAvailable || result.deviceIsSecure) {
          setState('idle');
        } else {
          setState('unavailable');
          setErrorMessage('Configura una huella, rostro o bloqueo de pantalla seguro en tu dispositivo.');
        }
      })
      .catch(() => {
        setState('unavailable');
        setErrorMessage('No se pudo comprobar la autenticación del dispositivo.');
      });
  }, [isOpen]);

  const authenticate = async () => {
    if (state !== 'idle') return;
    setState('scanning');
    setErrorMessage(null);
    try {
      await onSuccess();
      setState('success');
      navigator.vibrate?.([80, 40, 80]);
      setTimeout(() => {
        onClose();
      }, 600);
    } catch {
      setState('idle');
      setErrorMessage('No se pudo confirmar la identidad. Inténtalo nuevamente.');
    }
  };

  useEffect(() => {
    if (isOpen && autoStart && state === 'idle' && !autoStarted.current) {
      autoStarted.current = true;
      void authenticate();
    }
  }, [isOpen, autoStart, state]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <section role="dialog" aria-modal="true" aria-labelledby="biometric-title" className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200">
        <header className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300"><ShieldCheck className="w-5 h-5" /></div>
            <div>
              <h4 id="biometric-title" className="font-bold text-sm">Autenticación biométrica</h4>
              <p className="text-[11px] text-slate-300">Verificación nativa del dispositivo</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold bg-teal-900/60 text-teal-300 px-2 py-0.5 rounded-full border border-teal-700/50">Acceso seguro</span>
        </header>

        <div className="p-6 text-center">
          <p className="text-sm font-semibold text-slate-800">Confirma tu identidad para continuar</p>
          <p className="text-xs text-slate-500 mt-1 mb-5">Usuario: <strong className="text-teal-700">{userName}</strong></p>

          <button
            type="button"
            onClick={authenticate}
            disabled={state !== 'idle'}
            aria-label="Iniciar autenticación biométrica"
            className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 disabled:cursor-not-allowed ${
              state === 'scanning' ? 'bg-teal-50 border-2 border-teal-500 scale-105' :
              state === 'success' ? 'bg-emerald-50 border-2 border-emerald-500' :
              state === 'unavailable' ? 'bg-slate-100 border-2 border-slate-200' :
              'bg-slate-100 hover:bg-teal-50 border-2 border-dashed border-slate-300 hover:border-teal-400'
            }`}
          >
            {state === 'success' ? <CheckCircle2 className="w-12 h-12 text-emerald-600" /> : <Fingerprint className={`w-12 h-12 text-teal-600 ${state === 'scanning' ? 'animate-pulse' : ''}`} />}
          </button>

          <p className="text-xs font-medium text-slate-600 mt-4">
            {state === 'checking' && 'Comprobando seguridad del dispositivo...'}
            {state === 'idle' && 'Usa tu huella, rostro o bloqueo del dispositivo'}
            {state === 'scanning' && 'Esperando confirmación...'}
            {state === 'success' && 'Identidad confirmada'}
            {state === 'unavailable' && 'Autenticación no disponible'}
          </p>

          {errorMessage && <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-left text-[11px] text-rose-700 flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{errorMessage}</div>}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left mt-4 text-[11px] text-slate-600 flex items-start gap-2">
            <KeyRound className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <p><strong className="text-slate-800">Privacidad:</strong> BañosTour no recibe ni almacena tu huella o rostro.</p>
          </div>

          <div className="mt-5 flex items-center gap-3">
            {canCancel && <button type="button" onClick={onClose} className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancelar</button>}
            <button type="button" onClick={authenticate} disabled={state !== 'idle'} className="flex-1 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-50">
              {state === 'idle' ? 'Verificar identidad' : state === 'unavailable' ? 'No disponible' : 'Procesando...'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
