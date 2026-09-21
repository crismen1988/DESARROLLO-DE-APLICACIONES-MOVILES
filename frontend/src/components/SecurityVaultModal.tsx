import React from 'react';
import { CheckCircle2, Database, Fingerprint, Lock, ShieldCheck, UserRoundCheck, X } from 'lucide-react';

interface SecurityVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeToken?: string;
  activeRole?: string;
}

const roleName: Record<string, string> = {
  turista: 'Turista',
  operador: 'Operador turístico',
  admin: 'Administrador',
};

export const SecurityVaultModal: React.FC<SecurityVaultModalProps> = ({
  isOpen,
  onClose,
  activeRole = 'turista',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <section role="dialog" aria-modal="true" aria-labelledby="privacy-title" className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 max-h-[92dvh] flex flex-col">
        <header className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold tracking-wider text-teal-300">Cuenta protegida</p>
              <h3 id="privacy-title" className="font-bold text-sm text-white truncate">Privacidad y seguridad</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 text-slate-800">
          <div className="flex items-center justify-between gap-3 bg-teal-50 border border-teal-200 rounded-2xl p-3">
            <div className="flex items-center gap-2 min-w-0">
              <UserRoundCheck className="w-5 h-5 text-teal-700 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-wide text-teal-700">Perfil activo</p>
                <p className="text-sm font-bold text-slate-900 truncate">{roleName[activeRole] || activeRole}</p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">Verificado</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <article className="border border-slate-200 rounded-2xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-2"><Lock className="w-4 h-4 text-teal-600" /><h4 className="text-[10px] uppercase font-bold tracking-wide text-slate-900">Acceso a la cuenta</h4></div>
              <p className="text-xs leading-relaxed text-slate-600">Tu sesión se protege y se cierra de forma segura al salir de la aplicación.</p>
            </article>
            <article className="border border-slate-200 rounded-2xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-2"><Fingerprint className="w-4 h-4 text-teal-600" /><h4 className="text-[10px] uppercase font-bold tracking-wide text-slate-900">Biometría</h4></div>
              <p className="text-xs leading-relaxed text-slate-600">La huella o el rostro se solicitan al iniciar sesión o confirmar una acción sensible. BañosTour no almacena estos datos.</p>
            </article>
            <article className="border border-slate-200 rounded-2xl p-4 bg-white sm:col-span-2">
              <div className="flex items-center gap-2 mb-2"><Database className="w-4 h-4 text-teal-600" /><h4 className="text-[10px] uppercase font-bold tracking-wide text-slate-900">Uso de tus datos</h4></div>
              <p className="text-xs leading-relaxed text-slate-600">Usamos tus datos para gestionar reservas, atención al viajero y las funciones autorizadas para tu perfil.</p>
            </article>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <h4 className="text-[10px] uppercase font-bold tracking-wide text-slate-900 mb-2">Tus derechos</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              {['Consultar y actualizar tu información personal.', 'Solicitar la eliminación de tu cuenta y tus datos.', 'Recibir información clara sobre el uso de tus datos.'].map(item => (
                <li key={item} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><span>{item}</span></li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="p-4 border-t border-slate-200 bg-white">
          <button type="button" onClick={onClose} className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition-colors">Entendido</button>
        </footer>
      </section>
    </div>
  );
};
