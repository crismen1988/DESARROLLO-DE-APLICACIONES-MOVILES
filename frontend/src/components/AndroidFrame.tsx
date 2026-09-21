import React from 'react';
import { User as UserType, UserRole, Language, PushNotification } from '../types';
import { getT } from '../utils/i18n';
import {
  Compass,
  MapPin,
  Coffee,
  Ticket,
  MessageSquare,
  Building2,
  ShieldCheck,
  UserRound,
  Smartphone,
  Globe,
  ShieldAlert,
  LogOut,
  Mountain,
  UserCheck,
  Lock,
} from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  language: Language;
  onToggleLanguage: () => void;
  notifications: PushNotification[];
  onOpenSecurityVault: () => void;
  currentUser?: UserType | null;
  onOpenWelcome?: () => void;
  onOpenAuth?: (mode?: 'login' | 'register' | 'forgot_password') => void;
  onLogout?: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeTab,
  onTabChange,
  currentRole,
  onChangeRole,
  language,
  onToggleLanguage,
  notifications,
  onOpenSecurityVault,
  currentUser,
  onOpenWelcome,
  onOpenAuth,
  onLogout,
}) => {
  const t = getT(language);

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-50 text-slate-800 flex flex-col items-center justify-start py-0 sm:py-6 px-0 sm:px-4 font-sans">
      {/* Desktop session controls */}
      <div className="w-full max-w-5xl mb-3 hidden sm:flex items-center justify-between px-2 text-xs font-semibold text-slate-600">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 bg-white border border-slate-300 px-3 py-1.5 rounded-xl shadow-xs text-slate-700 font-bold">
            <Smartphone className="w-4 h-4 text-teal-600" />
            BañosTour • Turismo y experiencias locales
          </span>
        </div>

        {/* User session information */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-white border border-teal-200 text-teal-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                {currentUser.role === 'operador' && 'Operador:'}
                {currentUser.role === 'admin' && 'Administrador:'}
                {currentUser.role === 'turista' && 'Turista:'}
                <span className="text-slate-900 font-extrabold ml-1 truncate max-w-[150px]">
                  {currentUser.name}
                </span>
              </span>

              <button
                onClick={onLogout}
                className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-xl shadow-xs font-bold text-xs transition-colors"
                title="Cerrar Sesión Actual"
              >
                <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                Acceso Protegido
              </span>
            </div>
          )}

          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-xl shadow-xs font-bold text-slate-700"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" /> {language.toUpperCase()}
          </button>

        </div>
      </div>

      {/* Real responsive application surface; Android supplies its own system chrome. */}
      <div className="w-full bg-white flex-1 min-h-0 flex flex-col relative overflow-hidden">

        {/* Ionic Styled Top App Header */}
        <div className="bg-slate-900 text-white px-3 sm:px-4 py-3 shadow-md flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenWelcome}
              title="Ir a Pantalla de Bienvenida"
              className="w-9 h-9 rounded-xl bg-teal-400/20 hover:bg-teal-400/30 border border-teal-400/40 flex items-center justify-center text-teal-300 font-black text-sm shadow-inner transition-colors"
            >
              BT
            </button>
            <div className="cursor-pointer" onClick={onOpenWelcome} title="Pantalla de Bienvenida">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black tracking-tight text-white font-sans">
                  {t.appTitle}
                </h1>
              </div>
              <p className="text-[10px] text-teal-200/80 -mt-0.5">Baños de Agua Santa, Ecuador</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Welcome Screen button */}
            {onOpenWelcome && (
              <button
                onClick={onOpenWelcome}
                title="Pantalla de Bienvenida"
                className="w-8 h-8 rounded-full bg-teal-900/60 hover:bg-teal-900 border border-teal-400/40 flex items-center justify-center text-teal-300 transition-colors"
              >
                <Mountain className="w-4 h-4" />
              </button>
            )}

            {/* Mobile session role indicator (only rendered when user is logged in) */}
            {currentUser && (
              <button
                onClick={() => onTabChange('profile')}
                className="text-[10px] bg-slate-900 text-teal-300 font-bold px-2.5 py-1.5 rounded-xl border border-teal-500/40 uppercase flex items-center gap-1.5"
                title="Ver perfil o cerrar sesión"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {currentUser.role === 'operador' ? 'OPERADOR' : currentUser.role === 'admin' ? 'ADMIN' : 'TURISTA'}
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Viewport */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 sm:p-5 bg-slate-50 relative">
          <main className="w-full max-w-5xl mx-auto">{children}</main>
        </div>

        {/* Ionic Bottom Navigation Bar - ONLY when user is authenticated */}
        {currentUser && (
          <nav aria-label="Navegación principal" className="bg-white border-t border-slate-200 px-1 sm:px-2 py-2 flex items-center justify-around text-slate-500 shadow-lg shrink-0 z-40 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {/* OPERADOR ROLE TABS */}
            {currentUser.role === 'operador' && (
              <>
                <button
                  onClick={() => onTabChange('operator')}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                    activeTab === 'operator'
                      ? 'text-teal-600 font-bold'
                      : 'hover:text-slate-800'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span className="text-[10px]">Mi Negocio</span>
                </button>

                <button
                  onClick={() => onTabChange('bookings')}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                    activeTab === 'bookings'
                      ? 'text-teal-600 font-bold'
                      : 'hover:text-slate-800'
                  }`}
                >
                  <Ticket className="w-5 h-5" />
                  <span className="text-[10px]">Reservas</span>
                </button>

                <button
                  onClick={() => onTabChange('chat')}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                    activeTab === 'chat'
                      ? 'text-teal-600 font-bold'
                      : 'hover:text-slate-800'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-[10px]">Mensajes</span>
                </button>

                <button
                  onClick={() => onTabChange('profile')}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                    activeTab === 'profile'
                      ? 'text-teal-600 font-bold'
                      : 'hover:text-slate-800'
                  }`}
                >
                  <UserRound className="w-5 h-5" />
                  <span className="text-[10px]">Mi Perfil</span>
                </button>
              </>
            )}

            {/* ADMIN ROLE TABS */}
            {currentUser.role === 'admin' && (
              <>
                <button
                  onClick={() => onTabChange('admin')}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                    activeTab === 'admin'
                      ? 'text-teal-600 font-bold'
                      : 'hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-[10px]">Panel Admin</span>
                </button>

                <button
                  onClick={() => onTabChange('bookings')}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                    activeTab === 'bookings'
                      ? 'text-teal-600 font-bold'
                      : 'hover:text-slate-800'
                  }`}
                >
                  <Ticket className="w-5 h-5" />
                  <span className="text-[10px]">Auditoría</span>
                </button>

                <button
                  onClick={onOpenSecurityVault}
                  className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl hover:text-slate-800 transition-all text-slate-500"
                >
                  <Lock className="w-5 h-5 text-teal-600" />
                  <span className="text-[10px]">Privacidad</span>
                </button>

                <button
                  onClick={() => onTabChange('profile')}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                    activeTab === 'profile'
                      ? 'text-teal-600 font-bold'
                      : 'hover:text-slate-800'
                  }`}
                >
                  <UserRound className="w-5 h-5" />
                  <span className="text-[10px]">Mi Perfil</span>
                </button>
              </>
            )}

            {/* TURISTA ROLE TABS */}
            {currentUser.role === 'turista' && (
              <>
                <button
                  onClick={() => onTabChange('explore')}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                    activeTab === 'explore'
                      ? 'text-teal-600 font-bold'
                      : 'hover:text-slate-800'
                  }`}
                >
                  <Compass className="w-5 h-5" />
                  <span className="text-[10px]">{t.tabExplore}</span>
                </button>

                <button
                  onClick={() => onTabChange('map')}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                    activeTab === 'map'
                      ? 'text-teal-600 font-bold'
                      : 'hover:text-slate-800'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  <span className="text-[10px]">{t.tabMap}</span>
                </button>

                <button
                  onClick={() => onTabChange('places')}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                    activeTab === 'places'
                      ? 'text-teal-600 font-bold'
                      : 'hover:text-slate-800'
                  }`}
                >
                  <Coffee className="w-5 h-5" />
                  <span className="text-[10px]">{t.tabPlaces}</span>
                </button>

                <button
                  onClick={() => onTabChange('bookings')}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                    activeTab === 'bookings'
                      ? 'text-teal-600 font-bold'
                      : 'hover:text-slate-800'
                  }`}
                >
                  <Ticket className="w-5 h-5" />
                  <span className="text-[10px]">{t.tabBookings}</span>
                </button>

                <button
                  onClick={() => onTabChange('chat')}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                    activeTab === 'chat'
                      ? 'text-teal-600 font-bold'
                      : 'hover:text-slate-800'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-[10px]">{t.tabChat}</span>
                </button>

                <button
                  onClick={() => onTabChange('profile')}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                    activeTab === 'profile'
                      ? 'text-teal-600 font-bold'
                      : 'hover:text-slate-800'
                  }`}
                >
                  <UserRound className="w-5 h-5" />
                  <span className="text-[10px]">{t.tabProfile}</span>
                </button>
              </>
            )}
          </nav>
        )}

      </div>
    </div>
  );
};
