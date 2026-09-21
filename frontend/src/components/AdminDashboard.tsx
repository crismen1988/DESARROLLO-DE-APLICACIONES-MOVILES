import React, { useState } from 'react';
import { User, Booking, AnalyticsData, PushNotification } from '../types';
import {
  BarChart3,
  Users,
  ShieldCheck,
  Building2,
  DollarSign,
  BellRing,
  Send,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Layers,
  Sparkles,
  MapPin,
} from 'lucide-react';

interface AdminDashboardProps {
  users: User[];
  bookings: Booking[];
  analytics: AnalyticsData | null;
  onVerifyOperator: (userId: string, verified: boolean) => void;
  onBroadcastPush: (title: string, body: string, targetRole: 'todos' | 'turista' | 'operador') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  bookings,
  analytics,
  onVerifyOperator,
  onBroadcastPush,
}) => {
  const [adminTab, setAdminTab] = useState<'analytics' | 'verification' | 'transactions' | 'broadcast'>('analytics');
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [targetRole, setTargetRole] = useState<'todos' | 'turista' | 'operador'>('todos');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const operators = users.filter(u => u.role === 'operador');
  const pendingOperators = operators.filter(o => !o.verified);

  const handleSendPush = (e: React.FormEvent) => {
    e.preventDefault();
    onBroadcastPush(pushTitle, pushBody, targetRole);
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  const totalPlatformVolume = bookings.reduce((sum, b) => sum + (b.status !== 'cancelada' ? b.totalPrice : 0), 0);

  return (
    <div className="space-y-4 pb-20">
      {/* Admin Title Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold uppercase border border-rose-500/40">
                Gestión de la plataforma
              </span>
              <span className="text-[10px] text-teal-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Acceso administrativo
              </span>
            </div>
            <h2 className="text-base font-bold text-white">Panel Administrativo Central</h2>
            <p className="text-xs text-slate-300">
              Gestión de operadores, validación de licencias y monitoreo de demanda turística.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Estado</span>
            <p className="text-sm font-bold text-emerald-400">Operativo</p>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800 text-center">
          <div className="bg-slate-800/60 rounded-xl p-2">
            <span className="text-[9px] text-slate-400 uppercase">Volumen Total</span>
            <p className="text-sm font-black text-emerald-400">${totalPlatformVolume.toLocaleString()} USD</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2">
            <span className="text-[9px] text-slate-400 uppercase">Turistas Activos</span>
            <p className="text-sm font-black text-white">{analytics?.metrics.activeTourists ?? 0}</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2">
            <span className="text-[9px] text-slate-400 uppercase">Operadores</span>
            <p className="text-sm font-black text-teal-300">{operators.length}</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2">
            <span className="text-[9px] text-slate-400 uppercase">Por Validar</span>
            <p className="text-sm font-black text-amber-300">{pendingOperators.length}</p>
          </div>
        </div>
      </div>

      {/* Admin Navigation Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'analytics', label: 'Analíticas & Demanda', icon: BarChart3 },
          { id: 'verification', label: `Validar Perfiles (${pendingOperators.length})`, icon: Building2 },
          { id: 'transactions', label: 'Transacciones', icon: DollarSign },
          { id: 'broadcast', label: 'Notificaciones Push', icon: BellRing },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                adminTab === tab.id
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Analytics & Demand Tab */}
      {adminTab === 'analytics' && (
        <div className="space-y-4">
          {/* Monthly Visitors Bars */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Flujo Mensual de Turistas en Baños
                </h3>
                <p className="text-[11px] text-slate-500">Reservas registradas en la plataforma</p>
              </div>
            </div>

            <div className="flex items-end justify-between h-36 pt-4 px-2 border-b border-slate-100">
              {(analytics?.monthlyVisitors || []).map(v => {
                const max = 8000;
                const heightPercent = Math.round((v.tourists / max) * 100);
                return (
                  <div key={v.month} className="flex flex-col items-center gap-1.5 flex-1">
                    <span className="text-[9px] font-bold text-slate-600">{v.tourists}</span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-8 rounded-t-lg bg-teal-600 shadow-sm transition-all"
                    />
                    <span className="text-[10px] font-bold text-slate-500">{v.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Popular Attractions Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
              Atractivos Turísticos Más Demandados
            </h3>
            <div className="space-y-2.5">
              {(analytics?.popularAttractions || []).map(item => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" /> {item.name}
                    </span>
                    <span className="font-bold text-slate-700">{item.share}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.share}%` }}
                      className="h-full bg-teal-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data summary */}
          <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-400 flex items-center gap-1.5">
                <Database className="w-4 h-4" /> Resumen de actividad
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase">
                Actualizado
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Los indicadores muestran solo registros de esta plataforma.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
              <div className="bg-slate-800/80 p-2 rounded-lg">
                <span className="text-slate-400">Reservas:</span>
                <p className="text-white font-bold">{analytics?.metrics.totalBookings ?? 0}</p>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg">
                <span className="text-slate-400">Tours:</span>
                <p className="text-white font-bold">{analytics?.metrics.totalTours ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Commercial Verification Tab */}
      {adminTab === 'verification' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Revisión de perfiles de operadores
            </h3>
            <span className="text-xs text-slate-500">
              {pendingOperators.length} pendientes de aprobación
            </span>
          </div>

          <div className="space-y-3">
            {operators.map(op => (
              <div
                key={op.id}
                className={`rounded-2xl border p-3.5 shadow-sm transition-all ${
                  op.verified
                    ? 'bg-white border-slate-200'
                    : 'bg-amber-50/70 border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900">{op.name}</h4>
                      {op.verified ? (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verificado
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Revisión Requerida
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-1">{op.businessType}</p>
                    <div className="text-[11px] text-slate-500 space-y-0.5 mt-1 font-mono">
                      <p>RUC: <strong className="text-slate-700">{op.ruc}</strong></p>
                      <p>Registro interno: <strong className="text-slate-700">{op.businessRegistration}</strong></p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    {!op.verified ? (
                      <button
                        onClick={() => onVerifyOperator(op.id, true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow active:scale-95"
                      >
                        Aprobar perfil
                      </button>
                    ) : (
                      <button
                        onClick={() => onVerifyOperator(op.id, false)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-2 py-1 rounded-lg"
                      >
                        Suspender
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Transactions Supervision Tab */}
      {adminTab === 'transactions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Libro Mayor de Transacciones Turísticas
            </h3>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              Auditoría Segura
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 font-bold">ID Pase</th>
                    <th className="p-2.5 font-bold">Turista</th>
                    <th className="p-2.5 font-bold">Tour Reservado</th>
                    <th className="p-2.5 font-bold">Monto</th>
                    <th className="p-2.5 font-bold">Protección</th>
                    <th className="p-2.5 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-900">{b.id}</td>
                      <td className="p-2.5 text-slate-800">{b.userName}</td>
                      <td className="p-2.5 text-slate-600 truncate max-w-[140px]">{b.tourTitle}</td>
                      <td className="p-2.5 font-black text-slate-900">${b.totalPrice} USD</td>
                      <td className="p-2.5">
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                          <Lock className="w-2.5 h-2.5" /> Protegido
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Push Notification Broadcast Tab */}
      {adminTab === 'broadcast' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <BellRing className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold">Difusión de notificaciones</h3>
          </div>
          <p className="text-xs text-slate-500">
            Envía avisos meteorológicos, estado de vías hacia Baños, alertas del volcán Tungurahua o promociones en tiempo real.
          </p>

          <form onSubmit={handleSendPush} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Título de la Notificación</label>
              <input
                type="text"
                required
                value={pushTitle}
                onChange={e => setPushTitle(e.target.value)}
                className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Mensaje / Contenido</label>
              <textarea
                rows={3}
                required
                value={pushBody}
                onChange={e => setPushBody(e.target.value)}
                className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Audiencia Destino</label>
              <select
                value={targetRole}
                onChange={e => setTargetRole(e.target.value as any)}
                className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="todos">Todos los Usuarios (Turistas + Operadores)</option>
                <option value="turista">Solo Turistas en la Ciudad</option>
                <option value="operador">Solo Operadores Turísticos Registrados</option>
              </select>
            </div>

            {broadcastSent && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ¡Notificación Push enviada a todos los dispositivos Android con éxito!
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> Transmitir Notificación Push Ahora
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
