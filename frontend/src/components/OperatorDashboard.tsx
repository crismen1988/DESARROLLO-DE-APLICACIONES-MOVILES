import React, { useState } from 'react';
import { Tour, Booking, User, ChatMessage } from '../types';
import {
  Plus,
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  DollarSign,
  Camera,
  ShieldCheck,
  Megaphone,
  MessageSquare,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

const prepareServiceImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) {
    reject(new Error('Selecciona un archivo de imagen válido.'));
    return;
  }
  if (file.size > 15 * 1024 * 1024) {
    reject(new Error('La imagen original no puede superar 15 MB.'));
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('El archivo seleccionado no contiene una imagen compatible.'));
    image.onload = () => {
      const targetRatio = 16 / 9;
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = image.naturalWidth;
      let sourceHeight = image.naturalHeight;

      if (sourceWidth / sourceHeight > targetRatio) {
        sourceWidth = sourceHeight * targetRatio;
        sourceX = (image.naturalWidth - sourceWidth) / 2;
      } else {
        sourceHeight = sourceWidth / targetRatio;
        sourceY = (image.naturalHeight - sourceHeight) / 2;
      }

      const outputWidth = Math.min(1280, Math.max(320, Math.floor(sourceWidth)));
      const outputHeight = Math.round(outputWidth / targetRatio);
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('No se pudo procesar la imagen.'));
        return;
      }
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight);
      const result = canvas.toDataURL('image/jpeg', 0.82);
      if (result.length > 2_500_000) {
        reject(new Error('La imagen procesada sigue siendo demasiado grande. Selecciona otra imagen.'));
        return;
      }
      resolve(result);
    };
    image.src = String(reader.result);
  };
  reader.readAsDataURL(file);
});

interface OperatorDashboardProps {
  tours: Tour[];
  bookings: Booking[];
  messages: ChatMessage[];
  operator: User;
  onUpdateTourAvailability: (tourId: string, isOpen: boolean) => void;
  onAddNewTour: (newTour: Partial<Tour>) => Promise<void>;
  onEditTour: (tourId: string, tour: Partial<Tour>) => Promise<void>;
  onDeleteTour: (tourId: string) => Promise<void>;
  onOpenScanner: () => void;
  onNavigateToChat: () => void;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({
  tours,
  bookings,
  messages,
  operator,
  onUpdateTourAvailability,
  onAddNewTour,
  onEditTour,
  onDeleteTour,
  onOpenScanner,
  onNavigateToChat,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tours' | 'bookings' | 'promote'>('tours');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [tourToDelete, setTourToDelete] = useState<Tour | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Tour Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('20');
  const [duration, setDuration] = useState('3 horas');
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Moderado' | 'Exigente'>('Moderado');
  const [category, setCategory] = useState<'Aventura' | 'Cascadas' | 'Relax' | 'Naturaleza' | 'Cultura'>('Aventura');
  const [maxCapacity, setMaxCapacity] = useState('20');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [imageError, setImageError] = useState('');

  const operatorTours = tours.filter(t => t.operatorId === operator.id);
  const operatorBookings = bookings.filter(b => b.operatorId === operator.id);

  const resetForm = () => {
    setTitle('');
    setPrice('20');
    setDuration('3 horas');
    setDifficulty('Moderado');
    setCategory('Aventura');
    setMaxCapacity('20');
    setDescription('');
    setImageUrl('');
    setImageFileName('');
    setImageError('');
    setEditingTour(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (tour: Tour) => {
    setEditingTour(tour);
    setTitle(tour.title);
    setPrice(String(tour.price));
    setDuration(tour.duration);
    setDifficulty(tour.difficulty);
    setCategory(tour.category as typeof category);
    setMaxCapacity(String(tour.maxCapacity));
    setDescription(tour.description);
    setImageUrl(tour.imageUrl);
    setImageFileName('Imagen actual del servicio');
    setImageError('');
    setShowAddModal(true);
  };

  const closeTourModal = () => {
    if (isSaving) return;
    setShowAddModal(false);
    resetForm();
  };

  const handleSaveTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setImageError('Selecciona una imagen para el servicio.');
      return;
    }
    const payload: Partial<Tour> = {
      title,
      price: Number(price),
      duration,
      difficulty,
      category,
      maxCapacity: Number(maxCapacity),
      description,
      imageUrl,
      operatorId: operator.id,
      operatorName: operator.name,
      availableDays: ['Todos los días'],
      included: ['Guía profesional', 'Equipo certificado', 'Póliza de seguro'],
      isOpen: true,
      currentBooked: 0,
      rating: 5.0,
      reviewsCount: 1,
      latitude: -1.398,
      longitude: -78.332,
    };
    setIsSaving(true);
    try {
      if (editingTour) await onEditTour(editingTour.id, payload);
      else await onAddNewTour(payload);
      setShowAddModal(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImageError('');
    try {
      const preparedImage = await prepareServiceImage(file);
      setImageUrl(preparedImage);
      setImageFileName(file.name);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'No se pudo cargar la imagen.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!tourToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteTour(tourToDelete.id);
      setTourToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Operator Welcome Banner */}
      <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-md border border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-bold uppercase border border-teal-500/40">
                Operador Verificado
              </span>
              <span className="text-[10px] text-slate-300 font-mono">
                RUC: {operator.ruc || '1891726543001'}
              </span>
            </div>
            <h2 className="text-base font-bold text-white">{operator.name}</h2>
            <p className="text-xs text-teal-300 mt-0.5">{operator.businessType || 'Agencia de Deportes de Aventura'}</p>
          </div>

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-400 text-slate-900 text-xs font-bold px-3 py-2 rounded-xl shadow active:scale-95 transition-all shrink-0"
          >
            <Camera className="w-4 h-4" /> Escanear QR Ticket
          </button>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-700/60 text-center">
          <div className="bg-slate-800/60 rounded-xl p-2">
            <span className="text-[10px] text-slate-400">Tours Activos</span>
            <p className="text-sm font-black text-white">{operatorTours.length}</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2">
            <span className="text-[10px] text-slate-400">Reservas</span>
            <p className="text-sm font-black text-teal-300">{operatorBookings.length}</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2">
            <span className="text-[10px] text-slate-400">Rating</span>
            <p className="text-sm font-black text-amber-300">★ 4.9</p>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('tours')}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
            activeSubTab === 'tours'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Mis Servicios & Disponibilidad
        </button>
        <button
          onClick={() => setActiveSubTab('bookings')}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
            activeSubTab === 'bookings'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Reservas Recibidas ({operatorBookings.length})
        </button>
        <button
          onClick={() => setActiveSubTab('promote')}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
            activeSubTab === 'promote'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Promocionar Negocio
        </button>
      </div>

      {/* 1. Tours Tab */}
      {activeSubTab === 'tours' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Catálogo de Tours Disponibles
            </h3>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> Publicar Nuevo Tour
            </button>
          </div>

          <div className="space-y-3">
            {operatorTours.map(tour => (
              <div
                key={tour.id}
                className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm hover:shadow transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={tour.imageUrl}
                    alt={tour.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {tour.category}
                      </span>
                      <span className="text-sm font-black text-teal-800">${tour.price} USD</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{tour.title}</h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-slate-400" /> {tour.duration}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Users className="w-3 h-3 text-slate-400" /> {tour.currentBooked}/{tour.maxCapacity} cupos
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-slate-600">Estado para turistas:</span>
                        <button
                          onClick={() => onUpdateTourAvailability(tour.id, !tour.isOpen)}
                          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                            tour.isOpen
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tour.isOpen ? (
                            <><ToggleRight className="w-4 h-4 text-emerald-600" /> Abierto</>
                          ) : (
                            <><ToggleLeft className="w-4 h-4 text-rose-600" /> Pausado</>
                          )}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => openEditModal(tour)}
                          aria-label={`Editar ${tour.title}`}
                          className="flex items-center justify-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
                          onClick={() => setTourToDelete(tour)}
                          aria-label={`Eliminar ${tour.title}`}
                          className="flex items-center justify-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Bookings Tab */}
      {activeSubTab === 'bookings' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pases y Reservas Confirmadas
            </h3>
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1 text-teal-700 bg-teal-50 border border-teal-200 text-xs font-bold px-2.5 py-1 rounded-lg"
            >
              <QrCode className="w-3.5 h-3.5" /> Escanear QR en Punto de Encuentro
            </button>
          </div>

          <div className="space-y-2.5">
            {operatorBookings.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No hay reservas registradas.</p>
            ) : (
              operatorBookings.map(b => (
                <div
                  key={b.id}
                  className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-slate-900">{b.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">{b.tourTitle}</p>
                    <p className="text-[11px] text-slate-500">
                      Cliente: {b.userName} • {b.participants} pasajeros • Fecha: {b.date}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-teal-700">${b.totalPrice} USD</span>
                    <button
                      onClick={onOpenScanner}
                      className="block mt-1 text-[10px] text-teal-600 bg-teal-50 hover:bg-teal-100 font-bold px-2 py-0.5 rounded"
                    >
                      Validar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. Promote Business Tab */}
      {activeSubTab === 'promote' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
          <div className="flex items-center gap-2 text-teal-700">
            <Megaphone className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900">
              Promocionar Emprendimiento en Baños
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Destaca tu Hotel, Hostal, Hostería, Restaurante o Agencia de Deportes de Aventura en los primeros resultados geolocalizados de la app.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="border border-teal-200 bg-teal-50/50 rounded-xl p-3">
              <span className="text-[10px] font-bold text-teal-800 uppercase">Plan Destacado</span>
              <p className="text-sm font-black text-slate-900 mt-0.5">Top en Mapa y GPS</p>
              <p className="text-[11px] text-slate-500 mt-1">Aparece a turistas en un radio de 5km</p>
              <button className="mt-2 text-xs font-bold text-white bg-teal-600 px-3 py-1 rounded-lg shadow-sm">
                Activar Plan
              </button>
            </div>

            <div className="border border-slate-200 bg-slate-50 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-700 uppercase">Banner Promocional</span>
              <p className="text-sm font-black text-slate-900 mt-0.5">Notificación Push</p>
              <p className="text-[11px] text-slate-500 mt-1">Envía una oferta a 1,400+ turistas</p>
              <button className="mt-2 text-xs font-bold text-slate-800 bg-slate-200 px-3 py-1 rounded-lg">
                Solicitar Cupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to Add New Tour */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900">
                {editingTour ? 'Editar Tour / Experiencia' : 'Publicar Nuevo Tour / Experiencia'}
              </h3>
              <button
                onClick={closeTourModal}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTour} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Título del Tour</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej: Canopy Extremo San Martín 650m"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Categoría</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-xs text-slate-800"
                  >
                    <option value="Aventura">Aventura</option>
                    <option value="Cascadas">Cascadas</option>
                    <option value="Naturaleza">Naturaleza</option>
                    <option value="Relax">Relax</option>
                    <option value="Cultura">Cultura</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Precio USD</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Duración</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="Ej: 4 horas"
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Capacidad Máxima</label>
                  <input
                    type="number"
                    required
                    min={Math.max(1, editingTour?.currentBooked ?? 1)}
                    value={maxCapacity}
                    onChange={e => setMaxCapacity(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Dificultad</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as typeof difficulty)}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                >
                  <option value="Fácil">Fácil</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Exigente">Exigente</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Descripción</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detalles sobre el punto de encuentro, equipo incluido, etc."
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Imagen del servicio</label>
                <input
                  id="service-image-picker"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelection}
                  className="sr-only"
                />
                <div className="mt-1 rounded-2xl border border-slate-300 bg-slate-50 overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Vista previa del servicio" className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="w-full aspect-video flex flex-col items-center justify-center text-slate-400">
                      <Camera className="w-8 h-8" />
                      <span className="text-[11px] mt-1">Sin imagen seleccionada</span>
                    </div>
                  )}
                  <div className="p-3 flex items-center gap-3">
                    <label htmlFor="service-image-picker" className="shrink-0 cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700">
                      <Camera className="w-4 h-4" /> {imageUrl ? 'Cambiar imagen' : 'Cargar imagen'}
                    </label>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700 truncate">{imageFileName || 'Cámara o galería del móvil'}</p>
                      <p className="text-[10px] text-slate-500">JPG, PNG o WebP · formato final 16:9</p>
                    </div>
                  </div>
                </div>
                {imageError && <p className="mt-1.5 text-[11px] font-semibold text-rose-600">{imageError}</p>}
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-md mt-2"
              >
                {isSaving ? 'Guardando...' : editingTour ? 'Guardar cambios' : 'Guardar y publicar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {tourToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 border border-slate-200 shadow-2xl">
            <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Eliminar servicio</h3>
            <p className="text-xs text-slate-600 mt-2">
              ¿Deseas eliminar “{tourToDelete.title}”? Esta acción no se puede deshacer.
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Los servicios con reservas activas deben completarse o cancelarse antes de eliminarlos.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setTourToDelete(null)}
                className="py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-50"
              >
                Conservar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold disabled:bg-rose-300"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar servicio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
