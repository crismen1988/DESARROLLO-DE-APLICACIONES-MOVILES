import React, { useState, useEffect } from 'react';
import { Tour, Booking, User } from '../types';
import { X, Calendar, Users, Shield, QrCode, CheckCircle2, Lock, Sparkles, MapPin } from 'lucide-react';
import { bookingService } from '../services/bookingService';

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const tomorrowLocal = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatLocalDate(date);
};

interface TourBookingModalProps {
  isOpen: boolean;
  tour: Tour | null;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
  currentUser?: User | null;
  isOnline?: boolean;
}

export const TourBookingModal: React.FC<TourBookingModalProps> = ({
  isOpen,
  tour,
  onClose,
  onBookingSuccess,
  currentUser,
  isOnline = true,
}) => {
  const [participants, setParticipants] = useState<number>(2);
  const [bookingDate, setBookingDate] = useState<string>(tomorrowLocal);
  const [userName, setUserName] = useState<string>(currentUser?.name || '');
  const [userEmail, setUserEmail] = useState<string>(currentUser?.email || '');
  const [passportNumber, setPassportNumber] = useState<string>('');
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.name);
      setUserEmail(currentUser.email);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isOpen) return;
    const availableSeats = Math.max(0, tour ? tour.maxCapacity - tour.currentBooked : 0);
    setParticipants(Math.min(2, Math.max(1, availableSeats)));
    setBookingDate(tomorrowLocal());
    setPassportNumber('');
    setPrivacyAccepted(false);
    setCompletedBooking(null);
    setSubmitError(null);
  }, [isOpen, tour?.id]);

  if (!isOpen || !tour) return null;

  const totalPrice = tour.price * participants;
  const availableSeats = Math.max(0, tour.maxCapacity - tour.currentBooked);
  const participantLimit = Math.min(10, availableSeats);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!tour.isOpen || availableSeats < 1) {
      setSubmitError('Este tour no tiene cupos disponibles para reservar.');
      return;
    }
    if (participants < 1 || participants > participantLimit) {
      setSubmitError(`Selecciona entre 1 y ${participantLimit} participante(s).`);
      return;
    }
    if (bookingDate < formatLocalDate(new Date())) {
      setSubmitError('Selecciona una fecha actual o futura.');
      return;
    }
    if (userName.trim().length < 2) {
      setSubmitError('Ingresa el nombre completo del titular.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) {
      setSubmitError('Ingresa un correo electrónico válido.');
      return;
    }
    if (passportNumber.trim().length < 5 || passportNumber.trim().length > 30) {
      setSubmitError('Ingresa una cédula o pasaporte válido.');
      return;
    }
    if (!privacyAccepted) {
      setSubmitError('Debes aceptar el aviso de protección de datos para reservar.');
      return;
    }
    if (!isOnline) {
      setSubmitError('Necesitas conexión a internet para confirmar la reserva. Tus datos del formulario se conservarán.');
      return;
    }
    setIsSubmitting(true);

    try {
      const data = await bookingService.createBooking({
        tourId: tour.id,
        userId: currentUser?.id,
        userName: userName.trim(),
        userEmail: userEmail.trim(),
        date: bookingDate,
        participants,
        passportNumber: passportNumber.trim(),
      });
      setCompletedBooking(data);
      onBookingSuccess(data);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo confirmar la reserva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    setCompletedBooking(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="relative bg-slate-900 text-white p-5 flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {tour.category}
            </span>
            <h3 className="text-base font-bold mt-1 text-white pr-4">{tour.title}</h3>
            <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-teal-400" /> Operado por: {tour.operatorName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {!completedBooking ? (
            <form onSubmit={handleSubmitBooking} className="space-y-4">
              {/* Date & Guests Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1 uppercase mb-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" /> Fecha del Tour
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    min={formatLocalDate(new Date())}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1 uppercase mb-1">
                    <Users className="w-3.5 h-3.5 text-teal-600" /> Pasajeros
                  </label>
                  <div className="flex items-center justify-between mt-1">
                    <button
                      type="button"
                      onClick={() => setParticipants(Math.max(1, participants - 1))}
                      disabled={participants <= 1 || availableSeats < 1}
                      className="w-9 h-9 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-bold text-slate-700 text-sm"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold text-slate-900">{participants} personas</span>
                    <button
                      type="button"
                      onClick={() => setParticipants(Math.min(participantLimit, participants + 1))}
                      disabled={participants >= participantLimit || availableSeats < 1}
                      className="w-9 h-9 rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Passenger Info */}
              <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Datos del Titular de la Reserva
                </h4>
                <div>
                  <label className="text-xs text-slate-600 font-medium">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="mt-1 w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    maxLength={254}
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    className="mt-1 w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium">
                    Cédula / Pasaporte (Requerido por seguro de aventura)
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    maxLength={30}
                    value={passportNumber}
                    onChange={e => setPassportNumber(e.target.value)}
                    className="mt-1 w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Personal data notice and consent */}
                <label className="pt-3 border-t border-slate-200 flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={privacyAccepted}
                    onChange={e => setPrivacyAccepted(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-teal-600 rounded border-slate-300 focus:ring-teal-500 shrink-0"
                  />
                  <span className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <span className="block text-xs font-bold text-slate-800">Protección de datos personales</span>
                      <span className="block text-[10px] leading-relaxed text-slate-500">
                        Acepto el tratamiento de mis datos para gestionar esta reserva, conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP).
                      </span>
                    </span>
                  </span>
                </label>
              </div>

              {/* Price Summary */}
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-teal-700 font-medium">Precio por persona</span>
                  <p className="text-xs text-slate-500">${tour.price}.00 USD x {participants}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-teal-700 font-medium">Total a Pagar</span>
                  <p className="text-xl font-black text-teal-900">${totalPrice}.00 USD</p>
                </div>
              </div>

              {/* Submit Button */}
              {submitError && (
                <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !privacyAccepted || !isOnline || availableSeats < 1}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
              >
                {!isOnline ? (
                  'Conexión requerida para reservar'
                ) : isSubmitting ? (
                  'Generando Pase QR...'
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Confirmar Reserva Segura (${totalPrice} USD)
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Digital Boarding Pass / QR Ticket Screen */
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <h4 className="text-lg font-bold text-slate-900">¡Reserva Confirmada Exitosamente!</h4>
              <p className="text-xs text-slate-600">
                Tu boleto digital ha sido emitido y guardado en la app móvil.
              </p>

              {/* Android Boarding Pass Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-700 shadow-xl relative overflow-hidden text-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div>
                    <span className="text-[10px] text-teal-400 font-mono">CÓDIGO DE PASE</span>
                    <p className="text-sm font-black font-mono tracking-wider">{completedBooking.id}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ACTIVO
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Tour</span>
                    <p className="font-bold text-slate-100">{completedBooking.tourTitle}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Fecha</span>
                      <p className="font-semibold text-slate-200">{completedBooking.date}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Pasajeros</span>
                      <p className="font-semibold text-slate-200">{completedBooking.participants} personas</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Titular</span>
                    <p className="font-semibold text-slate-200">{completedBooking.userName}</p>
                  </div>
                </div>

                {/* Official QR code */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col items-center justify-center">
                  <div className="bg-white p-3 rounded-xl shadow-inner">
                    <div className="w-32 h-32 flex flex-col items-center justify-center border-2 border-slate-900 rounded-lg p-1 bg-white">
                      <QrCode className="w-24 h-24 text-slate-900" />
                      <span className="text-[8px] font-mono text-slate-700 font-bold mt-1">
                        {completedBooking.qrCode}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Presenta este código al operador en Baños de Agua Santa
                  </p>
                </div>
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Ver en Mis Reservas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
