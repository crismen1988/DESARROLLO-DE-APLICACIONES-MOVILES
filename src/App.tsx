import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import {
  Tour,
  Place,
  Booking,
  ChatMessage,
  User,
  AnalyticsData,
  PushNotification,
  UserRole,
  Language,
  GeoCoordinate,
} from './types';
import { PRESET_BANOS_LOCATIONS, calculateDistanceKm } from './utils/geo';
import { getT } from './utils/i18n';
import {
  AndroidFrame,
  MapView,
  PlacesView,
  TourBookingModal,
  CameraModal,
  LocationPermissionModal,
  type LocationDialogState,
  BiometricModal,
  SecurityVaultModal,
  OperatorDashboard,
  AdminDashboard,
  ChatView,
  WelcomeScreen,
  AuthScreen,
  TouristProfileView,
} from './components';
import {
  tourService,
  placeService,
  bookingService,
  chatService,
  adminService,
  notificationService,
  nativePushService,
  authService,
  TokenStorage,
  profileService,
} from './services';
import { CapacitorNativeBridge, NativeCapabilityError } from './services/capacitor';
import { clearPrivateOfflineData, isOfflineFailure } from './services/offlineCache';
import {
  Compass,
  MapPin,
  Clock,
  Users,
  Star,
  ShieldCheck,
  Camera,
  Navigation,
  Bell,
  QrCode,
  Calendar,
  CloudSun,
  Lock,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle,
  AlertCircle,
  Share2,
  Ticket,
  LogIn,
  LogOut,
  Mountain,
  UserCheck,
  KeyRound,
  Search,
  Pencil,
  Save,
  Trash2,
} from 'lucide-react';

const getTourImageUrl = (url: string) => url.replace(/w=\d+/, 'w=1200').replace(/q=\d+/, 'q=85');

export default function App() {
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<string>('explore');
  const [currentRole, setCurrentRole] = useState<UserRole>('turista');
  const [language, setLanguage] = useState<Language>('es');

  // Authentication Flow State: 'welcome' | 'login' | 'register' | 'forgot_password' | null (null = browsing in-app)
  const [authFlowState, setAuthFlowState] = useState<'welcome' | 'login' | 'register' | 'forgot_password' | null>(() => {
    if (TokenStorage.get()) return null;
    return authService.getBiometricAccount() ? 'login' : 'welcome';
  });
  const [authPresetRole, setAuthPresetRole] = useState<'operador' | 'admin'>('operador');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(() => Boolean(TokenStorage.get()));
  const [isAccountProfileEditing, setIsAccountProfileEditing] = useState(false);
  const [operatorProfileForm, setOperatorProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    origin: '',
    businessType: '',
    ruc: '',
    department: '',
    avatarUrl: '',
  });

  // Location State (Baños de Agua Santa)
  const [userLocation, setUserLocation] = useState<GeoCoordinate>(PRESET_BANOS_LOCATIONS[0]);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [isUsingGps, setIsUsingGps] = useState<boolean>(false);
  const [locationDialog, setLocationDialog] = useState<LocationDialogState | null>(null);

  // App Data States
  const [tours, setTours] = useState<Tour[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [bookingEditDate, setBookingEditDate] = useState('');
  const [bookingEditParticipants, setBookingEditParticipants] = useState(1);
  const [bookingActionId, setBookingActionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);

  // Search & Category Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Modal States
  const [bookingTour, setBookingTour] = useState<Tour | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'scan' | 'photo'>('scan');
  const [biometricModalOpen, setBiometricModalOpen] = useState<boolean>(() => Boolean(TokenStorage.get() && authService.getBiometricAccount()));
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => Capacitor.isNativePlatform() && Boolean(TokenStorage.get()) && Boolean(authService.getBiometricAccount()));
  const [securityVaultOpen, setSecurityVaultOpen] = useState<boolean>(false);
  const biometricVerificationInProgress = useRef(false);
  const nativeFilePickerExpected = useRef(false);
  const nativeFilePickerTimeout = useRef<number | null>(null);
  const profilePhotoReceiver = useRef<((photoUrl: string) => void) | null>(null);
  const locationWatchId = useRef<string | null>(null);

  // In-app notification banner
  const [activeToast, setActiveToast] = useState<string | null>(null);

  const t = getT(language);

  const requireConnection = (action: string): boolean => {
    if (isOnline) return true;
    showToast(`${action} requiere conexión a internet. Puedes seguir consultando los datos guardados.`);
    return false;
  };

  // Initial Data Fetch
  useEffect(() => {
    fetchTours();
    fetchPlaces();
    fetchNotifications();
    void CapacitorNativeBridge.getSavedLocation().then(saved => {
      if (!saved) return;
      setUserLocation({ name: 'Última ubicación autorizada', latitude: saved.latitude, longitude: saved.longitude });
      setIsUsingGps(true);
    });
  }, []);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Sin conexión. Mostrando la información guardada en el dispositivo.');
    };
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Conexión restablecida. Actualizando información.');
      void fetchTours();
      void fetchPlaces();
      void fetchNotifications();
      if (currentUser) {
        void fetchBookings();
        void fetchMessages();
        if (currentUser.role === 'admin') {
          void fetchUsers();
          void fetchAnalytics();
        }
      }
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [currentUser]);

  // Registra el dispositivo para recibir promociones y eventos aun con la app cerrada.
  useEffect(() => {
    if (!currentUser || currentUser.pushEnabled === false) return;
    let cleanup: (() => Promise<void>) | undefined;
    let cancelled = false;
    void nativePushService.initialize(notification => {
      setNotifications(previous => [notification, ...previous.filter(item => item.id !== notification.id)]);
      showToast(`${notification.title}: ${notification.body}`);
    }).then(removeListeners => {
      if (cancelled) void removeListeners();
      else cleanup = removeListeners;
    }).catch(error => console.error('Notificaciones push no disponibles:', error));
    return () => {
      cancelled = true;
      if (cleanup) void cleanup();
    };
  }, [currentUser?.id, currentUser?.pushEnabled]);

  // Restore the authenticated account when Android recreates the WebView after
  // closing and reopening the app. The API client renews an expired access token
  // with the refresh session before asking the user to authenticate again.
  useEffect(() => {
    const storedToken = TokenStorage.get();
    if (!storedToken) {
      setIsRestoringSession(false);
      return;
    }

    if (authService.getBiometricAccount()) {
      setIsAppLocked(true);
      setBiometricModalOpen(true);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8_000);

    void profileService.get({ signal: controller.signal })
      .then(user => {
        setCurrentUser(user);
        setAuthToken(TokenStorage.get());
        setCurrentRole(user.role);
        setLanguage(user.language ?? 'es');
        setAuthFlowState(null);
        setActiveTab(user.role === 'operador' ? 'operator' : user.role === 'admin' ? 'admin' : 'explore');
        if (Capacitor.isNativePlatform()) {
          const prepareBiometricLock = authService.getBiometricAccount()
            ? Promise.resolve()
            : authService.enrollBiometric(user);
          void prepareBiometricLock
            .then(() => {
              if (!authService.getBiometricAccount()) return;
              setIsAppLocked(true);
              setBiometricModalOpen(true);
            })
            .catch(error => console.error('No se pudo activar el bloqueo biométrico:', error));
        }
      })
      .catch(() => {
        setAuthToken(null);
        setAuthFlowState(authService.getBiometricAccount() ? 'login' : 'welcome');
      })
      .finally(() => {
        window.clearTimeout(timeout);
        setIsRestoringSession(false);
      });

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  // Lock every authenticated role from Android's native lifecycle. WebView
  // visibility events are not reliable on every device or Android skin.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !currentUser) return;

    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;

    const markAuthorizedFilePicker = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== 'file') return;
      nativeFilePickerExpected.current = true;
      if (nativeFilePickerTimeout.current !== null) window.clearTimeout(nativeFilePickerTimeout.current);
      nativeFilePickerTimeout.current = window.setTimeout(() => {
        nativeFilePickerExpected.current = false;
        nativeFilePickerTimeout.current = null;
      }, 120_000);
    };

    const markAuthorizedNativeInteraction = () => {
      nativeFilePickerExpected.current = true;
      if (nativeFilePickerTimeout.current !== null) window.clearTimeout(nativeFilePickerTimeout.current);
      nativeFilePickerTimeout.current = window.setTimeout(() => {
        nativeFilePickerExpected.current = false;
        nativeFilePickerTimeout.current = null;
      }, 120_000);
    };

    const finishAuthorizedNativeInteraction = () => {
      window.setTimeout(() => {
        nativeFilePickerExpected.current = false;
        if (nativeFilePickerTimeout.current !== null) window.clearTimeout(nativeFilePickerTimeout.current);
        nativeFilePickerTimeout.current = null;
      }, 750);
    };

    const finishFilePickerOnFocus = () => {
      if (nativeFilePickerExpected.current) finishAuthorizedNativeInteraction();
    };

    document.addEventListener('click', markAuthorizedFilePicker, true);
    window.addEventListener('banostour:native-interaction-start', markAuthorizedNativeInteraction);
    window.addEventListener('banostour:native-interaction-end', finishAuthorizedNativeInteraction);
    window.addEventListener('focus', finishFilePickerOnFocus);

    void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (biometricVerificationInProgress.current) return;
      const biometricAccount = authService.getBiometricAccount();
      if (!biometricAccount) return;
      if (nativeFilePickerExpected.current) return;
      if (!isActive) {
        setIsAppLocked(true);
        setBiometricModalOpen(false);
        return;
      }
      setIsAppLocked(true);
      setBiometricModalOpen(true);
    }).then(handle => {
      if (disposed) {
        void handle.remove();
        return;
      }
      removeListener = () => handle.remove();
    });

    return () => {
      disposed = true;
      document.removeEventListener('click', markAuthorizedFilePicker, true);
      window.removeEventListener('banostour:native-interaction-start', markAuthorizedNativeInteraction);
      window.removeEventListener('banostour:native-interaction-end', finishAuthorizedNativeInteraction);
      window.removeEventListener('focus', finishFilePickerOnFocus);
      if (nativeFilePickerTimeout.current !== null) window.clearTimeout(nativeFilePickerTimeout.current);
      void removeListener?.();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    fetchTours();
    fetchNotifications();
    fetchBookings();
    fetchMessages();
    if (currentUser.role === 'admin') {
      fetchUsers();
      fetchAnalytics();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role !== 'turista') return;
    void fetchTours();

    const refreshToursWhenVisible = () => {
      if (document.visibilityState === 'visible') void fetchTours();
    };

    window.addEventListener('focus', refreshToursWhenVisible);
    document.addEventListener('visibilitychange', refreshToursWhenVisible);
    const refreshInterval = window.setInterval(refreshToursWhenVisible, 30_000);

    return () => {
      window.removeEventListener('focus', refreshToursWhenVisible);
      document.removeEventListener('visibilitychange', refreshToursWhenVisible);
      window.clearInterval(refreshInterval);
    };
  }, [currentUser?.role, activeTab]);

  useEffect(() => {
    if (!currentUser) return;
    setOperatorProfileForm({
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone ?? '',
      origin: currentUser.origin ?? '',
      businessType: currentUser.businessType ?? '',
      ruc: currentUser.ruc ?? '',
      department: currentUser.department ?? '',
      avatarUrl: currentUser.avatarUrl ?? '',
    });
  }, [currentUser]);

  const fetchTours = async () => {
    try {
      const data = await tourService.getTours();
      if (Array.isArray(data)) setTours(data);
    } catch (e) {
      console.error('Error cargando tours:', e);
    }
  };

  const fetchPlaces = async () => {
    try {
      const data = await placeService.getPlaces();
      if (Array.isArray(data)) setPlaces(data);
    } catch (e) {
      console.error('Error cargando lugares:', e);
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await bookingService.getBookings(undefined, currentUser?.id ?? 'current');
      if (Array.isArray(data)) setBookings(data);
    } catch (e) {
      console.error('Error cargando reservas:', e);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await chatService.getMessages(currentUser?.id ?? 'current');
      if (Array.isArray(data)) setMessages(data);
    } catch (e) {
      console.error('Error cargando mensajes:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      if (Array.isArray(data)) setUsers(data);
    } catch (e) {
      console.error('Error cargando usuarios:', e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await adminService.getAnalytics();
      if (data && typeof data === 'object') setAnalytics(data);
    } catch (e) {
      console.error('Error cargando analytics:', e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      if (Array.isArray(data)) setNotifications(data);
    } catch (e) {
      console.error('Error cargando notificaciones:', e);
    }
  };

  const acquireCurrentLocation = async () => {
    setIsGpsLoading(true);
    try {
      const pos = await CapacitorNativeBridge.getCurrentPosition();
      setUserLocation({ name: 'Mi ubicación actual', latitude: pos.latitude, longitude: pos.longitude });
      setIsUsingGps(true);
      setLocationDialog(null);
      showToast('Ubicación GPS actualizada');
    } catch (error) {
      if (error instanceof NativeCapabilityError) {
        if (error.reason === 'service-disabled') setLocationDialog('service-disabled');
        else if (error.reason === 'permission-blocked') setLocationDialog('blocked');
        else if (error.reason === 'permission-denied' || error.reason === 'permission-required') setLocationDialog('denied');
        else setLocationDialog('unavailable');
      } else {
        setLocationDialog('unavailable');
      }
    } finally {
      setIsGpsLoading(false);
    }
  };

  // Explica el uso antes de abrir la solicitud de permiso del sistema.
  const handleFetchRealGps = async () => {
    const permission = await CapacitorNativeBridge.getLocationPermissionState();
    if (permission === 'granted') {
      await acquireCurrentLocation();
      return;
    }
    setLocationDialog(permission === 'blocked' ? 'blocked' : permission === 'denied' ? 'denied' : 'explanation');
  };

  const handleRequestLocationPermission = async () => {
    setIsGpsLoading(true);
    try {
      const permission = await CapacitorNativeBridge.requestLocationPermission();
      if (permission === 'granted') await acquireCurrentLocation();
      else setLocationDialog(permission === 'blocked' ? 'blocked' : 'denied');
    } catch {
      setLocationDialog('unavailable');
    } finally {
      setIsGpsLoading(false);
    }
  };

  // Mantiene el GPS actualizado mientras el turista consulta el mapa.
  useEffect(() => {
    if (activeTab !== 'map' || currentUser?.role !== 'turista') return;
    let cancelled = false;
    void CapacitorNativeBridge.getLocationPermissionState()
      .then(async permission => {
        if (permission !== 'granted' || cancelled) return;
        await acquireCurrentLocation();
        if (cancelled) return;
        locationWatchId.current = await CapacitorNativeBridge.watchPosition(location => {
          if (cancelled) return;
          setUserLocation({ name: 'Mi ubicación en tiempo real', latitude: location.latitude, longitude: location.longitude });
          setIsUsingGps(true);
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      const watchId = locationWatchId.current;
      locationWatchId.current = null;
      if (watchId) void CapacitorNativeBridge.clearWatch(watchId);
    };
  }, [activeTab, currentUser?.role]);

  const showToast = (msg: string) => {
    setActiveToast(msg);
    setTimeout(() => setActiveToast(null), 3500);
  };

  // Handlers for Operator & Admin Actions
  const handleUpdateTourAvailability = async (tourId: string, isOpen: boolean) => {
    if (!requireConnection('Cambiar la disponibilidad')) throw new Error('Sin conexión');
    try {
      const updated = await tourService.updateAvailability(tourId, { isOpen });
      setTours(prev => prev.map(t => (t.id === tourId ? updated : t)));
      showToast(`Disponibilidad de "${updated.title}" actualizada`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo cambiar la disponibilidad.');
    }
  };

  const handleAddNewTour = async (newTourData: Partial<Tour>) => {
    if (!requireConnection('Publicar un servicio')) throw new Error('Sin conexión');
    try {
      const created = await tourService.createTour(newTourData);
      setTours(prev => [created, ...prev]);
      showToast(`¡Tour "${created.title}" publicado con éxito!`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo publicar el tour');
      throw e;
    }
  };

  const handleEditTour = async (tourId: string, tourData: Partial<Tour>) => {
    if (!requireConnection('Editar un servicio')) throw new Error('Sin conexión');
    try {
      const updated = await tourService.updateTour(tourId, tourData);
      setTours(prev => prev.map(tour => (tour.id === tourId ? updated : tour)));
      showToast(`Tour "${updated.title}" actualizado`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo actualizar el tour');
      throw e;
    }
  };

  const handleDeleteTour = async (tourId: string) => {
    if (!requireConnection('Eliminar un servicio')) throw new Error('Sin conexión');
    try {
      await tourService.deleteTour(tourId);
      setTours(prev => prev.filter(tour => tour.id !== tourId));
      showToast('Tour eliminado correctamente');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo eliminar el tour');
      throw e;
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    if (!requireConnection('Completar una reserva')) throw new Error('Sin conexión');
    const currentBooking = bookings.find(booking => booking.id === bookingId);
    try {
      const updated = await bookingService.updateStatus(bookingId, 'completada');
      setBookings(previous => previous.map(booking => (booking.id === bookingId ? updated : booking)));
      if (currentBooking) {
        setTours(previous => previous.map(tour => tour.id === currentBooking.tourId
          ? { ...tour, currentBooked: Math.max(0, tour.currentBooked - currentBooking.participants) }
          : tour));
      }
      void fetchTours();
      showToast(`Reserva completada. Se liberaron ${currentBooking?.participants ?? 0} cupo(s).`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo completar la reserva.');
      throw error;
    }
  };

  const handleUpdateBooking = async (booking: Booking) => {
    if (!requireConnection('Modificar una reserva')) return;
    setBookingActionId(booking.id);
    try {
      const updated = await bookingService.updateBooking(booking.id, {
        date: bookingEditDate,
        participants: bookingEditParticipants,
      });
      setBookings(previous => previous.map(item => item.id === booking.id ? updated : item));
      setEditingBookingId(null);
      void fetchTours();
      showToast('Reserva modificada correctamente.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo modificar la reserva.');
    } finally {
      setBookingActionId(null);
    }
  };

  const handleDeleteBooking = async (booking: Booking) => {
    if (!window.confirm(`¿Eliminar la reserva de "${booking.tourTitle}"? Esta acción liberará los cupos.`)) return;
    if (!requireConnection('Eliminar una reserva')) return;
    setBookingActionId(booking.id);
    try {
      await bookingService.deleteBooking(booking.id);
      setBookings(previous => previous.filter(item => item.id !== booking.id));
      void fetchTours();
      showToast('Reserva eliminada y cupos liberados.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo eliminar la reserva.');
    } finally {
      setBookingActionId(null);
    }
  };

  const handleVerifyOperator = async (userId: string, verified: boolean) => {
    if (!requireConnection('Verificar un operador')) return;
    try {
      const updated = await adminService.verifyUser(userId, verified);
      setUsers(prev => prev.map(u => (u.id === userId ? updated : u)));
      showToast(`Estado de licencia comercial actualizado: ${verified ? 'Aprobado' : 'Suspendido'}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo actualizar el operador.');
    }
  };

  const handleBroadcastPush = async (
    title: string,
    body: string,
    targetRole: 'todos' | 'turista' | 'operador'
  ) => {
    if (!requireConnection('Enviar una notificación')) throw new Error('Sin conexión');
    try {
      const created = await notificationService.broadcast({ title, body, targetRole });
      setNotifications(prev => [created, ...prev]);
      if (!created.delivery.configured) showToast('Aviso guardado. Falta configurar Firebase para enviarlo a dispositivos cerrados.');
      else showToast(`Notificación enviada a ${created.delivery.sent} dispositivo(s).`);
      return created.delivery;
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo enviar la notificación.');
      throw e;
    }
  };

  const handleSendMessage = async (text: string, recipientId: string) => {
    if (!currentUser) return false;
    if (!requireConnection('Enviar mensajes')) return false;

    try {
      const newMsg = await chatService.sendMessage({
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        recipientId,
        message: text,
      });
      setMessages(prev => [...prev, newMsg]);
      return true;
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo enviar el mensaje');
      return false;
    }
  };

  // Dynamic Distance Calculation for Tours
  const toursWithDistance = tours.map(tour => ({
    ...tour,
    distanceKm: calculateDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      tour.latitude,
      tour.longitude
    ),
  }));

  const filteredTours = toursWithDistance
    .filter(t => {
      const matchesCat = selectedCategory === 'Todos' || t.category === selectedCategory;
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  const handleAuthSuccess = (user: User, token: string, biometricLogin = false) => {
    TokenStorage.set(token);
    setIsRestoringSession(false);
    setCurrentUser(user);
    setAuthToken(token);
    setCurrentRole(user.role);
    setLanguage(user.language ?? 'es');
    setAuthFlowState(null);
    setIsAppLocked(false);
    void profileService.cache(user);
    if (!biometricLogin) {
      void authService.enrollBiometric(user).catch(error => console.error('No se pudo vincular biometría:', error));
    }
    showToast(`¡Bienvenido, ${user.name}! Sesión iniciada como ${user.role.toUpperCase()}`);
    if (user.role === 'operador') {
      setActiveTab('operator');
    } else if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('explore');
    }
  };

  const handleBiometricLogin = async () => {
    biometricVerificationInProgress.current = true;
    try {
      try {
        const response = await authService.biometricAuth();
        handleAuthSuccess(response.user, response.token, true);
      } catch (error) {
        if (!isOfflineFailure(error)) throw error;
        await authService.unlockOfflineSession();
        const cachedUser = await profileService.get();
        const storedToken = TokenStorage.get();
        if (!storedToken) throw new Error('La sesión local ya no está disponible.');
        handleAuthSuccess(cachedUser, storedToken, true);
        setIsOnline(false);
      }
      setIsAppLocked(false);
      showToast('Identidad confirmada. Sesión desbloqueada.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo iniciar sesión con biometría.');
      throw error;
    } finally {
      biometricVerificationInProgress.current = false;
    }
  };

  const handleLogout = () => {
    void nativePushService.unregisterCurrentDevice().catch(() => undefined);
    authService.logout();
    setCurrentUser(null);
    setAuthToken(null);
    setCurrentRole('turista');
    setIsAppLocked(false);
    setNotifications([]);
    setBookings([]);
    setMessages([]);
    setUsers([]);
    setAnalytics(null);
    void clearPrivateOfflineData();
    setAuthFlowState(authService.getBiometricAccount() ? 'login' : 'welcome');
    showToast('Sesión finalizada. ¡Esperamos verte pronto en Baños!');
  };

  const handleProfileSave = async (profile: Partial<User>) => {
    if (!requireConnection('Guardar cambios del perfil')) throw new Error('Sin conexión');
    try {
      const updated = await profileService.update(profile);
      setCurrentUser(updated);
      showToast('Perfil actualizado correctamente');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo actualizar el perfil');
      throw error;
    }
  };

  const toggleLanguage = () => {
    const next: Language = language === 'es' ? 'en' : 'es';
    setLanguage(next);
    if (currentUser) {
      const localUser = { ...currentUser, language: next };
      setCurrentUser(localUser);
      void profileService.cache(localUser);
      if (!isOnline) {
        showToast('Idioma guardado en este dispositivo. Se sincronizará cuando vuelvas a cambiarlo con conexión.');
        return;
      }
      void profileService.update({ language: next })
        .then(user => setCurrentUser(user))
        .catch(error => showToast(error instanceof Error ? error.message : 'No se pudo guardar el idioma.'));
    }
  };

  // Enforce authentication barrier: If not authenticated, always show welcome or login
  const isUserAuthenticated = currentUser !== null;
  const effectiveAuthFlow = isRestoringSession
    ? null
    : isUserAuthenticated
      ? authFlowState
      : (authFlowState || 'welcome');

  return (
    <AndroidFrame
      activeTab={activeTab}
      onTabChange={tab => {
        if (!currentUser) {
          setAuthFlowState('welcome');
          showToast('Inicia sesión para acceder a las funciones del sistema');
          return;
        }
        // Strict role boundaries
        if (currentUser.role === 'operador') {
          if (!['operator', 'bookings', 'chat', 'profile'].includes(tab)) {
            setActiveTab('operator');
            setAuthFlowState(null);
            return;
          }
        } else if (currentUser.role === 'admin') {
          if (!['admin', 'bookings', 'security', 'profile'].includes(tab)) {
            setActiveTab('admin');
            setAuthFlowState(null);
            return;
          }
        } else {
          // Turista
          if (!['explore', 'map', 'places', 'bookings', 'chat', 'profile'].includes(tab)) {
            setActiveTab('explore');
            setAuthFlowState(null);
            return;
          }
        }
        setAuthFlowState(null);
        setActiveTab(tab);
      }}
      currentRole={currentUser?.role || currentRole}
      onChangeRole={setCurrentRole}
      language={language}
      onToggleLanguage={toggleLanguage}
      notifications={notifications}
      onOpenSecurityVault={() => setSecurityVaultOpen(true)}
      currentUser={currentUser}
      onOpenWelcome={() => setAuthFlowState('welcome')}
      onOpenAuth={(mode = 'login') => setAuthFlowState(mode)}
      onLogout={handleLogout}
      isOnline={isOnline}
    >
      {/* Real-time Push Notification Toast Banner */}
      {activeToast && (
        <div className="fixed top-14 left-4 right-4 z-50 flex items-center gap-2 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-teal-500/40 backdrop-blur-md animate-bounce text-xs font-semibold">
          <Bell className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="flex-1">{activeToast}</span>
        </div>
      )}

      {isRestoringSession && (
        <div className="min-h-[70dvh] flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Restaurando tu sesión segura</p>
            <p className="mt-1 text-xs text-slate-500">Un momento, estamos verificando tu acceso.</p>
          </div>
        </div>
      )}

      {/* 0. AUTHENTICATION & WELCOME SCREENS (ENFORCED WHEN NO ACTIVE USER OR EXPLICITLY OPENED) */}
      {!isRestoringSession && effectiveAuthFlow === 'welcome' && (
        <div className="pb-16 animate-fade-in">
          <WelcomeScreen
            onGoToLogin={() => setAuthFlowState('login')}
            language={language}
            onToggleLanguage={toggleLanguage}
          />
        </div>
      )}

      {!isRestoringSession && (effectiveAuthFlow === 'login' || effectiveAuthFlow === 'register' || effectiveAuthFlow === 'forgot_password') && (
        <div className="pb-16 animate-fade-in">
          <AuthScreen
            initialMode={effectiveAuthFlow}
            presetRole={authPresetRole}
            onAuthSuccess={handleAuthSuccess}
            onBackToWelcome={() => setAuthFlowState('welcome')}
            onOpenBiometricAuth={() => {
              if (!authService.getBiometricAccount()) {
                showToast('Ingresa con correo y contraseña una vez para activar la biometría en este dispositivo.');
                return;
              }
              setBiometricModalOpen(true);
            }}
            biometricAvailable={Boolean(authService.getBiometricAccount())}
            language={language}
          />
        </div>
      )}

      {/* IN-APP TABS (STRICTLY REQUIRE AUTHENTICATED USER & EFFECTIVEAUTHFLOW === NULL) */}
      {currentUser && effectiveAuthFlow === null && (
        <>
          {/* 1. EXPLORE TAB (TURISTA VIEW) */}
          {activeTab === 'explore' && currentUser.role === 'turista' && (
        <div className="space-y-4 pb-20">
          {/* Weather & Volcano Status Banner */}
          <div className="bg-slate-900 rounded-2xl p-3.5 text-white shadow-md flex items-center justify-between border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                <CloudSun className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black">21°C • Baños de Agua Santa</span>
                  <span className="text-[9px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded font-bold">
                    Soleado
                  </span>
                </div>
                <p className="text-[10px] text-teal-200 mt-0.5">
                  Cascadas en caudal óptimo • Volcán Tungurahua en reposo
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setCameraMode('photo');
                setCameraModalOpen(true);
              }}
              title="Tomar Foto del Viaje"
              className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Geographic reference and GPS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Navigation className="w-3.5 h-3.5 text-teal-600" /> Punto de referencia en Baños
              </span>
              <button
                onClick={handleFetchRealGps}
                disabled={isGpsLoading}
                className="min-h-9 text-[11px] text-teal-700 bg-teal-50 hover:bg-teal-100 font-bold px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 border border-teal-200"
              >
                <MapPin className="w-3 h-3" />
                {isGpsLoading ? 'Obteniendo ubicación...' : 'Usar mi ubicación'}
              </button>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-teal-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Seleccionar punto de referencia"
                value={isUsingGps ? '__gps__' : userLocation.name}
                onChange={event => {
                  const reference = PRESET_BANOS_LOCATIONS.find(item => item.name === event.target.value);
                  if (!reference) return;
                  setUserLocation(reference);
                  setIsUsingGps(false);
                }}
                className="w-full min-h-11 appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-24 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
              >
                {isUsingGps && <option value="__gps__">Mi ubicación actual</option>}
                {PRESET_BANOS_LOCATIONS.map(reference => (
                  <option key={reference.name} value={reference.name}>{reference.name}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] uppercase font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full pointer-events-none">
                {isUsingGps ? 'GPS activo' : 'Referencia'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Las distancias de los tours se calculan desde esta ubicación.</p>
          </div>

          {/* Search Bar & Category Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar cascadas, rafting, columpio, canyoning..."
                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 shadow-xs"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {['Todos', 'Cascadas', 'Aventura', 'Naturaleza', 'Relax'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Nearby Tours Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t.popularTours} ({filteredTours.length})
              </h3>
              <button
                onClick={() => setActiveTab('map')}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-0.5"
              >
                Ver en Mapa <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
            {filteredTours.map(tour => (
              <div
                key={tour.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-video w-full bg-slate-100">
                  <img
                    src={getTourImageUrl(tour.imageUrl)}
                    alt={tour.title}
                    loading="lazy"
                    decoding="async"
                    onError={event => { event.currentTarget.src = '/assets/icono_banos_tour.jpg'; }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {tour.category}
                    </span>
                    <span className="bg-teal-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Navigation className="w-2.5 h-2.5" /> {tour.distanceKm} km
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-black px-2.5 py-1 rounded-xl shadow-xs">
                    ${tour.price} USD <span className="text-[10px] font-normal text-slate-500">/ pers.</span>
                  </div>
                </div>

                <div className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{tour.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Operado por {tour.operatorName}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg text-xs font-bold shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      {tour.rating}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{tour.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {tour.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" /> {tour.difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-teal-700 font-medium">
                      <CheckCircle className="w-3 h-3 text-teal-600" /> {tour.maxCapacity - tour.currentBooked} cupos
                    </span>
                  </div>

                  {/* Booking and Chat Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('chat');
                      }}
                      className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors"
                    >
                      Consultar
                    </button>

                    <button
                      onClick={() => setBookingTour(tour)}
                      className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Ticket className="w-3.5 h-3.5" /> Reservar Ahora
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. MAP TAB (TURISTA) */}
      {activeTab === 'map' && currentUser.role === 'turista' && (
        <div className="space-y-3 pb-20">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Mapa Interactivo de Baños de Agua Santa
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Ubicación y sitios cercanos
            </span>
          </div>

          <MapView
            tours={tours}
            places={places}
            userLocation={userLocation}
            isUsingGps={isUsingGps}
            isGpsLoading={isGpsLoading}
            onLocateUser={handleFetchRealGps}
            onSelectTour={tour => setBookingTour(tour)}
            onSelectPlace={place => {
              setActiveTab('places');
            }}
          />
        </div>
      )}

      {/* 3. PLACES TAB (TURISTA) */}
      {activeTab === 'places' && currentUser.role === 'turista' && (
        <PlacesView
          places={places}
          userLocation={userLocation}
          onSelectOnMap={place => {
            setActiveTab('map');
          }}
        />
      )}

      {/* 4. BOOKINGS TAB (TURISTA / OPERADOR / ADMIN) */}
      {activeTab === 'bookings' && (
        <div className="space-y-4 pb-20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                {currentUser.role === 'turista'
                  ? 'Mis Pases y Boletos QR'
                  : currentUser.role === 'operador'
                  ? 'Reservas Recibidas para mis Tours'
                  : 'Auditoría Global de Reservas'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {currentUser.role === 'turista'
                  ? 'Pases turísticos digitales con código QR para Android'
                  : currentUser.role === 'operador'
                  ? 'Lista de pasajeros confirmados con validación QR'
                  : 'Registro histórico y fiscal de transacciones en Baños'}
              </p>
            </div>

            <button
              onClick={() => {
                setCameraMode('scan');
                setCameraModalOpen(true);
              }}
              className="flex items-center gap-1 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5" /> Escanear QR
            </button>
          </div>

          {bookings.filter(b => {
            if (currentUser.role === 'turista') return b.userId === currentUser.id;
            if (currentUser.role === 'operador') return b.operatorId === currentUser.id;
            return true; // admin
          }).length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">
                {currentUser.role === 'turista'
                  ? 'Aún no tienes reservas activas. Explora los tours disponibles para reservar.'
                  : currentUser.role === 'operador'
                  ? 'No hay nuevas reservas para tus tours en este momento.'
                  : 'No se registran transacciones de reservas en el sistema.'}
              </p>
              {currentUser.role === 'turista' && (
                <button
                  onClick={() => setActiveTab('explore')}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
                >
                  Ver Tours en Baños
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {bookings
                .filter(b => {
                  if (currentUser.role === 'turista') return b.userId === currentUser.id;
                  if (currentUser.role === 'operador') return b.operatorId === currentUser.id;
                  return true; // admin
                })
                .map(b => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
                >
                  <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-teal-400">PASE VÁLIDO</span>
                      <p className="text-xs font-mono font-bold">{b.id}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {b.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{b.tourTitle}</h4>
                      <p className="text-[11px] text-slate-500">Operado por {b.operatorName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Fecha</span>
                        <p className="font-semibold text-slate-800">{b.date}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Pasajeros</span>
                        <p className="font-semibold text-slate-800">{b.participants} personas</p>
                      </div>
                    </div>

                    {currentUser.role === 'turista' && editingBookingId === b.id && (
                      <div className="grid grid-cols-2 gap-2 rounded-xl border border-teal-200 bg-teal-50 p-2.5">
                        <label className="text-[10px] font-bold text-slate-600">
                          Nueva fecha
                          <input
                            type="date"
                            min={new Date().toISOString().slice(0, 10)}
                            value={bookingEditDate}
                            onChange={event => setBookingEditDate(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                          />
                        </label>
                        <label className="text-[10px] font-bold text-slate-600">
                          Pasajeros
                          <input
                            type="number"
                            min={1}
                            value={bookingEditParticipants}
                            onChange={event => setBookingEditParticipants(Number(event.target.value))}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                          />
                        </label>
                        <button
                          disabled={bookingActionId === b.id}
                          onClick={() => void handleUpdateBooking(b)}
                          className="col-span-2 flex items-center justify-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                        >
                          <Save className="h-3.5 w-3.5" /> {bookingActionId === b.id ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                      </div>
                    )}

                    {currentUser.role === 'turista' && !['completada', 'cancelada'].includes(b.status) && (
                      <div className="flex gap-2">
                        <button
                          disabled={bookingActionId === b.id}
                          onClick={() => {
                            if (editingBookingId === b.id) {
                              setEditingBookingId(null);
                              return;
                            }
                            setBookingEditDate(b.date);
                            setBookingEditParticipants(b.participants);
                            setEditingBookingId(b.id);
                          }}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700"
                        >
                          <Pencil className="h-3.5 w-3.5" /> {editingBookingId === b.id ? 'Cancelar edición' : 'Modificar'}
                        </button>
                        <button
                          disabled={bookingActionId === b.id}
                          onClick={() => void handleDeleteBooking(b)}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Eliminar
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">Total Pagado</span>
                        <p className="text-sm font-black text-teal-800">${b.totalPrice} USD</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (currentUser.role === 'turista') {
                              setActiveTab('profile');
                              return;
                            }
                            setCameraMode('scan');
                            setCameraModalOpen(true);
                          }}
                          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-900" /> {currentUser.role === 'turista' ? 'Ver QR' : 'Escanear QR'}
                        </button>

                        {currentUser.role === 'turista' && (
                          <button
                            onClick={() => setActiveTab('chat')}
                            className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs"
                          >
                            Contactar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. CHAT TAB (TURISTA Y OPERADOR) */}
      {activeTab === 'chat' && (currentUser.role === 'turista' || currentUser.role === 'operador') && (
        <div className="space-y-3 pb-20">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Mensajería Turista - Operador
            </h3>
            <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded">
              Conversación protegida
            </span>
          </div>

          <ChatView
            messages={messages}
            currentRole={currentUser.role}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            onSendMessage={handleSendMessage}
          />
        </div>
      )}

      {/* 6. OPERATOR TAB (OPERADOR ONLY) */}
      {activeTab === 'operator' && currentUser.role === 'operador' && (
        <OperatorDashboard
          tours={tours}
          bookings={bookings}
          messages={messages}
          operator={currentUser}
          onUpdateTourAvailability={handleUpdateTourAvailability}
          onAddNewTour={handleAddNewTour}
          onEditTour={handleEditTour}
          onDeleteTour={handleDeleteTour}
          onCompleteBooking={handleCompleteBooking}
          onOpenScanner={() => {
            setCameraMode('scan');
            setCameraModalOpen(true);
          }}
          onNavigateToChat={() => setActiveTab('chat')}
        />
      )}

      {/* 7. ADMIN TAB (ADMIN ONLY) */}
      {activeTab === 'admin' && currentUser.role === 'admin' && (
        <AdminDashboard
          users={users}
          bookings={bookings}
          analytics={analytics}
          onVerifyOperator={handleVerifyOperator}
          onBroadcastPush={handleBroadcastPush}
        />
      )}

      {/* 8. PROFILE & SECURITY TAB */}
      {activeTab === 'profile' && (
        <div className="space-y-4 pb-20">
          {currentUser.role === 'turista' ? (
            <TouristProfileView
              user={currentUser}
              language={language}
              bookings={bookings}
              onToggleLanguage={toggleLanguage}
              onOpenPrivacy={() => setSecurityVaultOpen(true)}
              onLogout={handleLogout}
              onOpenChat={() => setActiveTab('chat')}
              onOpenMeetingPoints={() => setActiveTab('map')}
              onExploreTours={() => setActiveTab('explore')}
              onProfileSave={handleProfileSave}
              onRequestProfilePhoto={receiver => {
                profilePhotoReceiver.current = receiver;
                setCameraMode('photo');
                setCameraModalOpen(true);
              }}
            />
          ) : currentUser ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-100 ring-4 ring-teal-50 shrink-0">
                  {(isAccountProfileEditing ? operatorProfileForm.avatarUrl : currentUser.avatarUrl) ? (
                    <img src={isAccountProfileEditing ? operatorProfileForm.avatarUrl : currentUser.avatarUrl} alt="Foto del operador" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-teal-600 text-white font-black text-xl flex items-center justify-center">
                      {currentUser.name
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                  {isAccountProfileEditing && (
                    <button
                      type="button"
                      aria-label="Cambiar foto de perfil"
                      onClick={() => {
                        profilePhotoReceiver.current = photoUrl => setOperatorProfileForm(prev => ({ ...prev, avatarUrl: photoUrl }));
                        setCameraMode('photo');
                        setCameraModalOpen(true);
                      }}
                      className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white bg-teal-600 text-white shadow-md hover:bg-teal-500"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900">{currentUser.name}</h3>
                  <p className="text-xs text-slate-500">{currentUser.email} • {currentUser.phone || '+593 98 421 9832'}</p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">Rol: {currentUser.role.toUpperCase()}</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">Sesión activa</span>
                  </div>
                </div>
              </div>

              {isAccountProfileEditing ? (
              <form
                onSubmit={async event => {
                  event.preventDefault();
                  const normalizedName = operatorProfileForm.name.trim();
                  const normalizedEmail = operatorProfileForm.email.trim();
                  const normalizedPhone = operatorProfileForm.phone.trim();
                  const normalizedRuc = operatorProfileForm.ruc.trim();
                  if (normalizedName.length < 2 || normalizedName.length > 120) {
                    showToast('El nombre debe tener entre 2 y 120 caracteres.');
                    return;
                  }
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                    showToast('Ingresa un correo electrónico válido.');
                    return;
                  }
                  if (normalizedPhone && !/^\+?[0-9][0-9\s-]{6,18}$/.test(normalizedPhone)) {
                    showToast('Ingresa un número de teléfono válido.');
                    return;
                  }
                  if (currentUser.role === 'operador' && !/^\d{13}$/.test(normalizedRuc)) {
                    showToast('El RUC del operador debe contener 13 dígitos.');
                    return;
                  }
                  const formPayload: Partial<User> = {
                    name: normalizedName,
                    email: normalizedEmail,
                    phone: normalizedPhone,
                    origin: operatorProfileForm.origin.trim(),
                    businessType: operatorProfileForm.businessType.trim(),
                    ruc: normalizedRuc,
                    department: operatorProfileForm.department.trim(),
                    avatarUrl: operatorProfileForm.avatarUrl.trim() || undefined,
                  };
                  try {
                    await handleProfileSave(formPayload);
                    setIsAccountProfileEditing(false);
                  } catch {
                    // El mensaje de error ya se muestra mediante la alerta global.
                  }
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Nombre
                    <input
                      value={operatorProfileForm.name}
                      required
                      minLength={2}
                      maxLength={120}
                      onChange={event => setOperatorProfileForm(prev => ({ ...prev, name: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Correo
                    <input
                      type="email"
                      value={operatorProfileForm.email}
                      required
                      maxLength={254}
                      onChange={event => setOperatorProfileForm(prev => ({ ...prev, email: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Teléfono
                    <input
                      value={operatorProfileForm.phone}
                      type="tel"
                      maxLength={20}
                      onChange={event => setOperatorProfileForm(prev => ({ ...prev, phone: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Origen
                    <input
                      value={operatorProfileForm.origin}
                      maxLength={120}
                      onChange={event => setOperatorProfileForm(prev => ({ ...prev, origin: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 sm:col-span-2">
                    Tipo de negocio
                    <input
                      value={operatorProfileForm.businessType}
                      required={currentUser.role === 'operador'}
                      maxLength={120}
                      onChange={event => setOperatorProfileForm(prev => ({ ...prev, businessType: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    RUC
                    <input
                      value={operatorProfileForm.ruc}
                      inputMode="numeric"
                      pattern={currentUser.role === 'operador' ? '[0-9]{13}' : undefined}
                      maxLength={13}
                      required={currentUser.role === 'operador'}
                      onChange={event => setOperatorProfileForm(prev => ({ ...prev, ruc: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Departamento
                    <input
                      value={operatorProfileForm.department}
                      maxLength={120}
                      onChange={event => setOperatorProfileForm(prev => ({ ...prev, department: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> Guardar perfil
                  </button>
                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setAuthFlowState('welcome')}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
                    >
                      <Mountain className="w-3.5 h-3.5 text-teal-600" /> Pantalla Bienvenida
                    </button>
                  )}
                </div>
              </form>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Datos del perfil</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <p className="text-slate-700"><span className="font-bold text-slate-900">Origen:</span> {currentUser.origin || 'No registrado'}</p>
                    <p className="text-slate-700"><span className="font-bold text-slate-900">Teléfono:</span> {currentUser.phone || 'No registrado'}</p>
                    <p className="text-slate-700 sm:col-span-2"><span className="font-bold text-slate-900">Negocio:</span> {currentUser.businessType || 'No registrado'}</p>
                    <p className="text-slate-700"><span className="font-bold text-slate-900">RUC:</span> {currentUser.ruc || 'No registrado'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAccountProfileEditing(true)}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm hover:bg-teal-500"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Editar perfil
                  </button>
                </div>
              )}

              {!isAccountProfileEditing && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
                  </button>
                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setAuthFlowState('welcome')}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
                    >
                      <Mountain className="w-3.5 h-3.5 text-teal-600" /> Pantalla Bienvenida
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-teal-200/90 p-4 shadow-xs text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-200 text-teal-600 font-black text-xl flex items-center justify-center mx-auto">
                <Users className="w-7 h-7 text-teal-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Modo Explorador Invitado</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Estás explorando BañosTour sin una cuenta activa. Inicia sesión o regístrate para confirmar reservas con código QR y contactar operadores.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setAuthFlowState('login')}
                  className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" /> Iniciar Sesión
                </button>
                <button
                  onClick={() => setAuthFlowState('register')}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <UserCheck className="w-3.5 h-3.5 text-teal-400" /> Crear Cuenta
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1 text-[11px]">
                <button
                  onClick={() => setAuthFlowState('forgot_password')}
                  className="text-teal-700 hover:underline font-semibold flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" /> ¿Olvidaste tu contraseña?
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => setAuthFlowState('welcome')}
                  className="text-slate-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <Mountain className="w-3 h-3 text-teal-600" /> Ver Bienvenida
                </button>
              </div>
            </div>
          )}


          {/* Account Security */}
          {currentUser.role !== 'turista' && (
          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-md border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Seguridad de tu cuenta
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                Protegida
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Tu información personal y tus reservas están protegidas. Administra aquí tus métodos de acceso y privacidad.
            </p>

            <div className="pt-1">
              <button
                onClick={() => setSecurityVaultOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Privacidad y datos
              </button>
            </div>
          </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Global Modals */}
      <TourBookingModal
        isOpen={!!bookingTour}
        tour={bookingTour}
        onClose={() => setBookingTour(null)}
        currentUser={currentUser}
        isOnline={isOnline}
        onBookingSuccess={newBooking => {
          setBookings(prev => [newBooking, ...prev]);
          void fetchTours();
          showToast(`¡Reserva confirmada! Código: ${newBooking.id}`);
        }}
      />

      <CameraModal
        isOpen={cameraModalOpen}
        mode={cameraMode}
        onClose={() => {
          setCameraModalOpen(false);
          profilePhotoReceiver.current = null;
        }}
        onCapture={photoUrl => {
          if (profilePhotoReceiver.current) {
            profilePhotoReceiver.current(photoUrl);
            showToast('Fotografía lista. Guarda los cambios para actualizar tu perfil.');
            return;
          }
          showToast('Fotografía guardada localmente.');
        }}
        onScanResult={code => {
          if (!currentUser) {
            showToast('Inicia sesión para verificar una reserva.');
            return;
          }
          const normalizedCode = code.trim();
          const accessibleBooking = bookings.find(booking => {
            const belongsToRole = currentUser.role === 'admin'
              || (currentUser.role === 'operador' && booking.operatorId === currentUser.id)
              || (currentUser.role === 'turista' && booking.userId === currentUser.id);
            return belongsToRole && (booking.qrCode === normalizedCode || booking.id === normalizedCode);
          });
          if (!accessibleBooking) {
            showToast('El QR no corresponde a una reserva disponible para este perfil.');
            return;
          }
          if (accessibleBooking.status === 'completada') {
            showToast('Este servicio ya fue completado. El QR ya no es válido.');
            return;
          }
          if (accessibleBooking.status === 'cancelada') {
            showToast('Esta reserva fue cancelada. El QR ya no es válido.');
            return;
          }
          if (accessibleBooking.status !== 'confirmada') {
            showToast('Esta reserva todavía no está confirmada y no puede validarse.');
            return;
          }
          showToast(`QR verificado: ${accessibleBooking.tourTitle} (${accessibleBooking.status}).`);
        }}
      />

      <LocationPermissionModal
        isOpen={locationDialog !== null}
        state={locationDialog ?? 'explanation'}
        onClose={() => setLocationDialog(null)}
        onRequestPermission={() => void handleRequestLocationPermission()}
        onOpenAppSettings={() => void CapacitorNativeBridge.openAppSettings()}
        onOpenLocationSettings={() => void CapacitorNativeBridge.openLocationSettings()}
      />

      <BiometricModal
        isOpen={biometricModalOpen}
        onClose={() => setBiometricModalOpen(false)}
        userName={currentUser?.name ?? authService.getBiometricAccount()?.userName}
        onSuccess={handleBiometricLogin}
        autoStart={isAppLocked}
        canCancel={!isAppLocked}
      />

      <SecurityVaultModal
        isOpen={securityVaultOpen}
        onClose={() => setSecurityVaultOpen(false)}
        activeRole={currentRole}
      />
    </AndroidFrame>
  );
}
