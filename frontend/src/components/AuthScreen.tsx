import React, { useState } from 'react';
import { User, UserRole, Language } from '../types';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Phone,
  Building2,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Sparkles,
  ArrowRight,
  HelpCircle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { API_BASE_URL } from '../services/apiClient';

export type AuthMode = 'login' | 'register' | 'forgot_password';

interface AuthScreenProps {
  initialMode?: AuthMode;
  presetRole?: 'operador' | 'admin';
  onAuthSuccess: (user: User, token: string) => void;
  onBackToWelcome: () => void;
  onOpenBiometricAuth: () => void;
  biometricAvailable?: boolean;
  language: Language;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'login',
  presetRole = 'operador',
  onAuthSuccess,
  onBackToWelcome,
  onOpenBiometricAuth,
  biometricAvailable = false,
  language,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Form states: Login (empty by default for real user input)
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Form states: Register
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('turista');
  const [regOrigin, setRegOrigin] = useState<string>('Ecuador');
  const [regBusinessType, setRegBusinessType] = useState<string>('');
  const [regRuc, setRegRuc] = useState<string>('');
  const [acceptTerms, setAcceptTerms] = useState<boolean>(true);

  // Form states: Forgot Password
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1);
  const [recoveryEmail, setRecoveryEmail] = useState<string>('');
  const [recoveryCode, setRecoveryCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');

  const isEs = language === 'es';

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginEmail.trim()) {
      setErrorMessage(isEs ? 'Por favor ingresa tu correo electrónico.' : 'Please enter your email.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isEs ? 'Credenciales incorrectas' : 'Invalid credentials'));
      }

      setSuccessMessage(isEs ? '¡Sesión iniciada con éxito!' : 'Login successful!');
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || (isEs ? 'Error al iniciar sesión' : 'Login error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMessage(isEs ? 'Por favor completa todos los campos requeridos.' : 'Please fill all required fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage(isEs ? 'Las contraseñas no coinciden.' : 'Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage(isEs ? 'La contraseña debe tener al menos 6 caracteres.' : 'Password must be at least 6 characters.');
      return;
    }

    if (!acceptTerms) {
      setErrorMessage(
        isEs
          ? 'Debes aceptar los Términos y Política de Protección de Datos (LOPDP).'
          : 'You must accept the Terms and Data Privacy Policy.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          role: regRole,
          phone: regPhone.trim(),
          origin: regOrigin.trim(),
          businessType: regBusinessType.trim(),
          ruc: regRuc.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isEs ? 'Error al crear la cuenta' : 'Registration error'));
      }

      setSuccessMessage(isEs ? '¡Cuenta creada exitosamente!' : 'Account created successfully!');
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || (isEs ? 'Error al registrar usuario' : 'Registration error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password - Step 1: Request Code
  const handleRequestRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!recoveryEmail.trim()) {
      setErrorMessage(isEs ? 'Ingresa tu correo registrado.' : 'Enter your registered email.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isEs ? 'Error al enviar código' : 'Error sending code'));
      }

      setRecoveryStep(2);
      setSuccessMessage(
        isEs
          ? `Código de seguridad enviado a ${recoveryEmail}.`
          : `Security code sent to ${recoveryEmail}.`
      );
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password - Step 2 & 3: Submit New Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!recoveryCode.trim()) {
      setErrorMessage(isEs ? 'Ingresa el código de 6 dígitos.' : 'Enter the 6-digit code.');
      return;
    }

    if (!newPassword.trim()) {
      setErrorMessage(isEs ? 'Ingresa tu nueva contraseña.' : 'Enter your new password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage(isEs ? 'Las nuevas contraseñas no coinciden.' : 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(isEs ? 'La contraseña debe tener al menos 6 caracteres.' : 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recoveryEmail.trim(),
          code: recoveryCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isEs ? 'Error restableciendo contraseña' : 'Reset error'));
      }

      setSuccessMessage(
        isEs
          ? '¡Tu contraseña ha sido actualizada con éxito! Ya puedes iniciar sesión.'
          : 'Your password has been successfully updated! You can now log in.'
      );
      setRecoveryStep(3); // Completed step
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-start text-slate-800 animate-fade-in pb-10">
      {/* Top Header & Back to Welcome */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          onClick={onBackToWelcome}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {isEs ? 'Bienvenida' : 'Welcome'}
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded-lg border border-teal-200/60">
            Acceso seguro
          </span>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl my-3 border border-slate-200">
        <button
          onClick={() => {
            setMode('login');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            mode === 'login'
              ? 'bg-white text-teal-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isEs ? 'Iniciar Sesión' : 'Log In'}
        </button>
        <button
          onClick={() => {
            setMode('register');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            mode === 'register'
              ? 'bg-white text-teal-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isEs ? 'Crear Cuenta' : 'Register'}
        </button>
        <button
          onClick={() => {
            setMode('forgot_password');
            setRecoveryStep(1);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            mode === 'forgot_password'
              ? 'bg-white text-teal-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isEs ? 'Recuperar' : 'Recovery'}
        </button>
      </div>

      {/* Global Alerts: Error / Success */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-2xl flex items-start gap-2 mb-3 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="flex-1">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-2xl flex items-start gap-2 mb-3 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="flex-1">{successMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. LOGIN VIEW                                            */}
      {/* ======================================================== */}
      {mode === 'login' && (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {isEs ? '¡Bienvenido de Nuevo!' : 'Welcome Back!'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEs
                ? 'Ingresa tus credenciales para acceder a tus reservas y pases QR en Baños.'
                : 'Enter your credentials to access bookings and QR passes in Baños.'}
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-3">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {isEs ? 'Correo Electrónico' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="ejemplo@email.com"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  {isEs ? 'Contraseña' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryEmail(loginEmail);
                    setRecoveryStep(1);
                    setMode('forgot_password');
                  }}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 transition-colors"
                >
                  {isEs ? '¿Olvidaste tu contraseña?' : 'Forgot password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                />
                <span>{isEs ? 'Recordar mi sesión en este dispositivo' : 'Remember me on this device'}</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  {isEs ? 'Iniciar Sesión' : 'Log In'}
                </>
              )}
            </button>
          </form>

          {/* Biometric Login Quick Option */}
          {biometricAvailable && <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onOpenBiometricAuth}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-teal-300 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 border border-teal-500/30 transition-colors"
            >
              <Fingerprint className="w-4 h-4 text-teal-400" />
              {isEs ? 'Ingresar con Biometría (Huella / Face ID)' : 'Log in with Biometrics'}
            </button>
          </div>}

          {/* Switch to Register */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              {isEs ? '¿Aún no tienes una cuenta?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-bold text-teal-700 hover:text-teal-900 underline ml-1"
              >
                {isEs ? 'Crear Cuenta' : 'Register'}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. REGISTER VIEW (CREAR CUENTA)                          */}
      {/* ======================================================== */}
      {mode === 'register' && (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {isEs ? 'Crea tu Cuenta en BañosTour' : 'Create your BañosTour Account'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEs
                ? 'Únete como turista para reservar tours y hoteles, o como operador turístico local.'
                : 'Join as a tourist to book tours and hotels, or as a local tour operator.'}
            </p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            {/* Account Type Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {isEs ? 'Tipo de Cuenta / Rol' : 'Account Type / Role'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole('turista')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    regRole === 'turista'
                      ? 'bg-teal-50 border-teal-600 text-teal-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserIcon className="w-4 h-4 text-teal-600" />
                  <span>{isEs ? 'Turista (Viajero)' : 'Tourist (Traveler)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('operador')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    regRole === 'operador'
                      ? 'bg-teal-50 border-teal-600 text-teal-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>{isEs ? 'Operador Turístico' : 'Tour Operator'}</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {regRole === 'operador'
                  ? isEs ? 'Nombre del Representante o Agencia' : 'Representative or Agency Name'
                  : isEs ? 'Nombre Completo' : 'Full Name'}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder={regRole === 'operador' ? 'Pastaza Adventure / Juan Pérez' : 'Carlos Mendoza'}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {isEs ? 'Correo Electrónico' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="ejemplo@email.com"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {isEs ? 'Teléfono / WhatsApp' : 'Phone / WhatsApp'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="+593 99 123 4567"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Operator Specific Fields */}
            {regRole === 'operador' && (
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {isEs ? 'Número de RUC (Ecuador)' : 'Tax ID (RUC)'}
                  </label>
                  <input
                    type="text"
                    value={regRuc}
                    onChange={e => setRegRuc(e.target.value)}
                    placeholder="1891726543001"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {isEs ? 'Tipo de Actividad Turística' : 'Business Category'}
                  </label>
                  <input
                    type="text"
                    value={regBusinessType}
                    onChange={e => setRegBusinessType(e.target.value)}
                    placeholder="Agencia de Rafting, Hostal, Canyoning..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            )}

            {/* Tourist Specific Fields */}
            {regRole === 'turista' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {isEs ? 'Ciudad / País de Origen' : 'City / Country of Origin'}
                </label>
                <input
                  type="text"
                  value={regOrigin}
                  onChange={e => setRegOrigin(e.target.value)}
                  placeholder="Quito, Ecuador / Bogotá, Colombia"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 shadow-2xs"
                />
              </div>
            )}

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {isEs ? 'Contraseña' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {isEs ? 'Confirmar' : 'Confirm'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300 mt-0.5 shrink-0"
                />
                <span>
                  {isEs
                    ? 'Acepto los Términos y la Política de Protección de Datos Personales de Ecuador (LOPDP).'
                    : 'I accept the Terms and Data Privacy Policy of Ecuador (LOPDP).'}
                </span>
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  {isEs ? 'Crear Mi Cuenta' : 'Create My Account'}
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              {isEs ? '¿Ya tienes una cuenta registrada?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-bold text-teal-700 hover:text-teal-900 underline ml-1"
              >
                {isEs ? 'Inicia Sesión' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. FORGOT PASSWORD VIEW (RECUPERAR CONTRASEÑA)            */}
      {/* ======================================================== */}
      {mode === 'forgot_password' && (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/70 flex items-center justify-center mx-auto shadow-2xs">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {isEs ? 'Recuperar Contraseña' : 'Password Recovery'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEs
                ? 'Te enviaremos un código de seguridad para verificar tu identidad y restablecer tu clave.'
                : "We'll send you a security code to verify your identity and reset your password."}
            </p>
          </div>

          {/* STEP 1: Enter Email */}
          {recoveryStep === 1 && (
            <form onSubmit={handleRequestRecoveryCode} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {isEs ? 'Correo Electrónico Registrado' : 'Registered Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={e => setRecoveryEmail(e.target.value)}
                    placeholder="carlos.mendoza@email.com"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    {isEs ? 'Enviar Código de Recuperación' : 'Send Recovery Code'}
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter Verification Code & New Password */}
          {recoveryStep === 2 && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {isEs ? 'Código de 6 Dígitos' : '6-Digit Security Code'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={recoveryCode}
                  onChange={e => setRecoveryCode(e.target.value)}
                  placeholder="849201"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-center text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:border-teal-500 shadow-2xs"
                />
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {isEs ? 'Nueva Contraseña' : 'New Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {isEs ? 'Confirmar Nueva Contraseña' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {isEs ? 'Restablecer Contraseña' : 'Reset Password'}
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Completed Success Banner */}
          {recoveryStep === 3 && (
            <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-3xl text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-emerald-950">
                {isEs ? '¡Contraseña Actualizada!' : 'Password Updated!'}
              </h4>
              <p className="text-xs text-emerald-800">
                {isEs
                  ? 'Tu contraseña ha sido restablecida exitosamente en el sistema de BañosTour.'
                  : 'Your password has been successfully reset in BañosTour.'}
              </p>
              <button
                onClick={() => {
                  setLoginPassword(newPassword);
                  setMode('login');
                  setRecoveryStep(1);
                  setErrorMessage(null);
                  setSuccessMessage(isEs ? 'Inicia sesión con tu nueva contraseña.' : 'Log in with your new password.');
                }}
                className="w-full py-3 bg-teal-700 hover:bg-teal-600 text-white rounded-xl font-bold text-xs shadow transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                {isEs ? 'Iniciar Sesión Ahora' : 'Log In Now'}
              </button>
            </div>
          )}

          {/* Back to Login link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 underline"
            >
              {isEs ? 'Volver al Inicio de Sesión' : 'Back to Login'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
