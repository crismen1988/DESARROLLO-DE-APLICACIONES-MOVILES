import React from 'react';
import { Language } from '../types';
import {
  ArrowRight,
  LogIn,
  Globe,
  MapPin,
} from 'lucide-react';

interface WelcomeScreenProps {
  onGoToLogin: () => void;
  language: Language;
  onToggleLanguage: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGoToLogin,
  language,
  onToggleLanguage,
}) => {
  const isEs = language === 'es';

  return (
    <div className="min-h-full flex flex-col justify-between text-slate-800 animate-fade-in pb-4 pt-1">
      {/* Selector de idioma flotante discreto */}
      <div className="flex items-center justify-end px-2 pb-1">
        <button
          onClick={onToggleLanguage}
          className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-teal-600" />
          {language.toUpperCase()}
        </button>
      </div>

      {/* Imagen principal de Baños de Agua Santa */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 my-2 flex-1 min-h-[380px] sm:min-h-[440px] flex flex-col justify-end">
        <img
          src="/assets/banos.jpg"
          alt="Basílica y parque central de Baños de Agua Santa por la noche"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Degradado para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

        {/* Información y Título sobre la Imagen */}
        <div className="relative z-10 p-6 text-white space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-teal-400" />
            Baños de Agua Santa, Tungurahua
          </span>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight text-white drop-shadow-md">
            {isEs ? 'Bienvenido a Baños de Agua Santa' : 'Welcome to Baños de Agua Santa'}
          </h1>
          <p className="text-sm text-slate-200 leading-relaxed max-w-sm">
            {isEs
              ? 'Descubre las cascadas, la aventura andina y las aguas termales con BañosTour.'
              : 'Discover waterfalls, Andean adventure, and hot springs on the official tourism platform.'}
          </p>
        </div>
      </div>

      {/* Botón Principal para Iniciar Sesión */}
      <div className="px-2 pt-3">
        <button
          onClick={onGoToLogin}
          className="w-full py-4 px-6 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-base shadow-lg active:scale-98 transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <LogIn className="w-5 h-5 text-teal-300" />
          <span>{isEs ? 'Iniciar Sesión' : 'Log In'}</span>
          <ArrowRight className="w-5 h-5 ml-auto" />
        </button>
      </div>
    </div>
  );
};
