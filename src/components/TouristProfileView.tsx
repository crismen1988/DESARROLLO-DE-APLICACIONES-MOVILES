import React, { useEffect, useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe2,
  ImageUp,
  LogOut,
  MapPinned,
  MessageCircle,
  Pencil,
  Save,
  ShieldCheck,
  Ticket,
  Users,
} from 'lucide-react';
import type { Booking, Language, User } from '../types';

interface TouristProfileViewProps {
  user: User;
  language: Language;
  bookings: Booking[];
  onToggleLanguage: () => void;
  onOpenPrivacy: () => void;
  onLogout: () => void;
  onOpenChat: () => void;
  onOpenMeetingPoints: () => void;
  onExploreTours: () => void;
  onProfileSave: (profile: Partial<User>) => Promise<void> | void;
  onRequestProfilePhoto: (onSelected: (photoUrl: string) => void) => void;
}

const TicketQr: React.FC<{ code: string }> = ({ code }) => {
  const imageUrl = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(code);
    qr.make();
    return qr.createDataURL(5, 8);
  }, [code]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col items-center justify-center shrink-0">
      <img src={imageUrl} alt={`Código QR del boleto ${code}`} className="w-28 h-28 sm:w-32 sm:h-32 [image-rendering:pixelated]" />
      <span className="mt-1 max-w-36 text-center text-[9px] leading-tight font-mono font-bold text-slate-700 break-all">{code}</span>
    </div>
  );
};

export const TouristProfileView: React.FC<TouristProfileViewProps> = ({
  user,
  language,
  bookings,
  onToggleLanguage,
  onOpenPrivacy,
  onLogout,
  onOpenChat,
  onOpenMeetingPoints,
  onExploreTours,
  onProfileSave,
  onRequestProfilePhoto,
}) => {
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone ?? '',
    origin: user.origin ?? '',
    avatarUrl: user.avatarUrl ?? '',
  });
  useEffect(() => {
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      origin: user.origin ?? '',
      avatarUrl: user.avatarUrl ?? '',
    });
  }, [user]);
  const activeBookings = bookings.filter(
    booking => booking.userId === user.id && (booking.status === 'confirmada' || booking.status === 'pendiente')
  );
  const initials = user.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError('');
    if (form.name.trim().length < 2 || form.name.trim().length > 120) {
      setProfileError('El nombre debe tener entre 2 y 120 caracteres.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setProfileError('Ingresa un correo electrónico válido.');
      return;
    }
    if (form.phone.trim() && !/^\+?[0-9][0-9\s-]{6,18}$/.test(form.phone.trim())) {
      setProfileError('Ingresa un número de teléfono válido.');
      return;
    }
    setIsSaving(true);
    try {
      await onProfileSave({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        origin: form.origin.trim(),
        avatarUrl: form.avatarUrl.trim() || undefined,
      });
      setIsEditingProfile(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'No se pudo guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      origin: user.origin ?? '',
      avatarUrl: user.avatarUrl ?? '',
    });
    setProfileError('');
    setIsEditingProfile(false);
  };

  return (
    <div className="space-y-4 pb-20">
      <section className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative w-20 h-20 rounded-full ring-4 ring-teal-50 shrink-0 mx-auto sm:mx-0 overflow-hidden bg-slate-100">
            {(isEditingProfile ? form.avatarUrl : user.avatarUrl) ? (
              <img src={isEditingProfile ? form.avatarUrl : user.avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-teal-600 text-white font-black text-2xl flex items-center justify-center">{initials}</div>
            )}
            {isEditingProfile && (
              <button
                type="button"
                aria-label="Cambiar foto de perfil"
                onClick={() => onRequestProfilePhoto(photoUrl => setForm(prev => ({ ...prev, avatarUrl: photoUrl })))}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white bg-teal-600 text-white shadow-md hover:bg-teal-500"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-[10px] uppercase font-bold tracking-wider text-teal-700">Mi perfil y reservas</p>
            <h2 className="text-lg font-black text-slate-900 truncate">{user.name}</h2>
            <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <span className="text-xs text-slate-600 truncate">{user.email}</span>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Correo verificado
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleLanguage}
            aria-label="Cambiar idioma"
            className="self-center sm:self-start inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1"
          >
            <Globe2 className="w-4 h-4 text-teal-600 ml-1" />
            {(['es', 'en'] as Language[]).map(option => (
              <span key={option} className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold ${language === option ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}>
                {option}
              </span>
            ))}
          </button>
        </div>

        {isEditingProfile ? (
          <form onSubmit={handleSave} className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-slate-700">
              <ImageUp className="w-3.5 h-3.5 text-teal-600" /> Editar perfil
            </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Nombre
              <input
                value={form.name}
                required
                minLength={2}
                maxLength={120}
                onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500"
              />
            </label>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Correo
              <input
                type="email"
                value={form.email}
                required
                maxLength={254}
                onChange={event => setForm(prev => ({ ...prev, email: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500"
              />
            </label>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Teléfono
              <input
                value={form.phone}
                type="tel"
                maxLength={20}
                onChange={event => setForm(prev => ({ ...prev, phone: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500"
              />
            </label>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Origen
              <input
                value={form.origin}
                maxLength={120}
                onChange={event => setForm(prev => ({ ...prev, origin: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500"
              />
            </label>
          </div>

          {profileError && <p role="alert" className="text-[11px] font-semibold text-rose-600">{profileError}</p>}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isSaving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm hover:bg-teal-500 disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
          </form>
        ) : (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Datos del perfil</p>
                <p className="mt-1 text-xs font-medium text-slate-700">
                  {user.phone || 'Teléfono no registrado'} · {user.origin || 'Origen no registrado'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm hover:bg-teal-500"
              >
                <Pencil className="w-3.5 h-3.5" /> Editar perfil
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
          <button type="button" onClick={onOpenPrivacy} className="w-full min-h-11 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Privacidad y datos
          </button>
          <button type="button" onClick={onLogout} className="w-full min-h-11 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-teal-700">Reservas confirmadas</p>
            <h3 className="text-sm font-black text-slate-900">Mis boletos activos</h3>
          </div>
          <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-slate-900 text-white">{activeBookings.length} activos</span>
        </div>

        {activeBookings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-7 text-center">
            <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="mt-2 text-sm font-bold text-slate-800">Aún no tienes boletos activos</p>
            <p className="mt-1 text-xs text-slate-500">Reserva un tour y tu código QR verificable aparecerá aquí.</p>
            <button type="button" onClick={onExploreTours} className="mt-3 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold">Explorar tours</button>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {activeBookings.map(booking => (
              <article key={booking.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold tracking-wider text-teal-300">Boleto verificable</p>
                    <h4 className="text-sm font-bold truncate">{booking.tourTitle}</h4>
                  </div>
                  <span className="text-[9px] uppercase font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Confirmado</span>
                </div>
                <div className="p-4 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Operadora turística</p>
                      <p className="text-xs font-bold text-slate-900">{booking.operatorName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                        <CalendarDays className="w-4 h-4 text-teal-600" />
                        <p className="mt-1 text-[10px] uppercase font-bold text-slate-400">Fecha</p>
                        <p className="text-xs font-bold text-slate-800">{booking.date}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                        <Users className="w-4 h-4 text-teal-600" />
                        <p className="mt-1 text-[10px] uppercase font-bold text-slate-400">Cupos</p>
                        <p className="text-xs font-bold text-slate-800">{booking.participants}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500">Este código es único y debe presentarse al guía antes de iniciar el recorrido.</p>
                  </div>
                  <TicketQr code={booking.qrCode} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <h3 className="text-[10px] uppercase font-bold tracking-wider text-slate-900 mb-3">Accesos directos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button type="button" onClick={onOpenChat} className="min-h-16 rounded-xl bg-teal-600 hover:bg-teal-700 text-white p-3 flex sm:flex-col items-center justify-center gap-2 text-xs font-bold">
            <MessageCircle className="w-5 h-5" /> Chatear con el guía
          </button>
          <button type="button" onClick={onOpenMeetingPoints} className="min-h-16 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 p-3 flex sm:flex-col items-center justify-center gap-2 text-xs font-bold">
            <MapPinned className="w-5 h-5 text-teal-600" /> Puntos de encuentro
          </button>
          <button type="button" onClick={() => setShowCancellationPolicy(value => !value)} className="min-h-16 rounded-xl bg-slate-900 hover:bg-slate-800 text-white p-3 flex sm:flex-col items-center justify-center gap-2 text-xs font-bold">
            <ShieldCheck className="w-5 h-5 text-teal-300" /> Políticas de cancelación
            {showCancellationPolicy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showCancellationPolicy && (
          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900">Política de cancelación</p>
            <p>Cancelación gratuita hasta 24 horas antes de la salida. Después de ese plazo, la devolución queda sujeta a las condiciones informadas por la operadora.</p>
            <p>Si el tour se cancela por clima o seguridad, puedes elegir una nueva fecha o solicitar la devolución total.</p>
          </div>
        )}
      </section>
    </div>
  );
};
