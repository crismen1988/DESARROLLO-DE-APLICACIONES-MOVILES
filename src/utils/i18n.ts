import { Language } from '../types';

export const translations = {
  es: {
    appTitle: 'BañosTour',
    appSubtitle: 'Baños de Agua Santa, Ecuador',
    tabExplore: 'Explorar',
    tabMap: 'Mapa',
    tabPlaces: 'Lugares',
    tabBookings: 'Reservas',
    tabChat: 'Mensajes',
    tabOperator: 'Operador',
    tabAdmin: 'Administración',
    tabProfile: 'Seguridad & Perfil',
    
    // Filters & Search
    searchPlaceholder: 'Buscar cascadas, rafting, hoteles, melcochas...',
    allCategories: 'Todos',
    catWaterfalls: 'Cascadas',
    catAdventure: 'Aventura',
    catRelax: 'Relax',
    catNature: 'Naturaleza',
    catCulture: 'Cultura',
    catFood: 'Gastronomía',
    catHotel: 'Hoteles',
    catHostal: 'Hostales',
    catHosteria: 'Hosterías',
    catTermas: 'Termas',

    // Attractions & Tours
    nearbyRecomms: 'Recomendaciones Cerca de Ti',
    popularTours: 'Tours & Aventuras Imperdibles',
    duration: 'Duración',
    difficulty: 'Dificultad',
    included: 'Incluye',
    bookTour: 'Reservar Tour',
    priceFrom: 'Desde',
    perPerson: 'por persona',
    spotsAvailable: 'cupos disponibles',
    closedTour: 'Agotado / Cerrado temporalmente',

    // Places
    verifiedBusiness: 'Perfil comercial verificado',
    callNow: 'Llamar al Local',
    viewOnMap: 'Ver en Mapa',
    
    // Bookings
    myBookingsTitle: 'Tus Pases y Reservas',
    confirmed: 'Confirmada',
    scanQrNotice: 'Muestra este código QR en la entrada o al operador',
    noBookings: 'Aún no tienes reservas activas. ¡Explora los tours y vive la aventura!',
    openCameraScanner: 'Escanear QR de Entrada',
    
    // Chat
    chatWithOperator: 'Chat directo con el Operador',
    typeMessage: 'Escribe una consulta sobre el tour...',
    send: 'Enviar',
    
    // Operator Panel
    operatorDashboard: 'Panel de Operador Turístico',
    manageServices: 'Gestión de Tours & Servicios',
    addNewTour: 'Publicar Nuevo Tour',
    availability: 'Disponibilidad',
    openStatus: 'Abierto',
    closedStatus: 'Pausado',
    receivedBookings: 'Reservas Recibidas',
    validateTicket: 'Validar Ticket con Cámara',
    
    // Admin Panel
    adminDashboard: 'Panel de Supervisión Turística',
    commercialValidation: 'Validación de Perfiles Comerciales',
    superviseTransactions: 'Supervisión de Transacciones',
    systemAnalytics: 'Métricas de Demanda & Clientes',
    pushCenter: 'Centro de Notificaciones Push',
    broadcastPush: 'Enviar Notificación Masiva',
    
    // Security & Bio
    biometricTitle: 'Autenticación Biométrica Android',
    biometricDesc: 'Protege tu cuenta con huella digital o reconocimiento facial',
    biometricBtn: 'Autenticar con Biometría',
    biometricSuccess: 'Identidad Biométrica Confirmada',
    aesEncryptionBadge: 'Datos cifrados con AES-256-CBC según LOPDP/GDPR',
    jwtTokenBadge: 'Sesión Segura JWT con Roles RBAC',
    switchRole: 'Cambiar Rol de Demostración:',
  },
  en: {
    appTitle: 'BañosTour',
    appSubtitle: 'Baños de Agua Santa, Ecuador',
    tabExplore: 'Explore',
    tabMap: 'Map',
    tabPlaces: 'Places',
    tabBookings: 'Bookings',
    tabChat: 'Messages',
    tabOperator: 'Operator',
    tabAdmin: 'Admin',
    tabProfile: 'Security & Profile',

    // Filters & Search
    searchPlaceholder: 'Search waterfalls, rafting, hotels, sweets...',
    allCategories: 'All',
    catWaterfalls: 'Waterfalls',
    catAdventure: 'Adventure',
    catRelax: 'Relax',
    catNature: 'Nature',
    catCulture: 'Culture',
    catFood: 'Gastronomy',
    catHotel: 'Hotels',
    catHostal: 'Hostels',
    catHosteria: 'Lodges',
    catTermas: 'Hot Springs',

    // Attractions & Tours
    nearbyRecomms: 'Recommendations Near You',
    popularTours: 'Must-Do Tours & Adventures',
    duration: 'Duration',
    difficulty: 'Difficulty',
    included: 'Included',
    bookTour: 'Book Tour',
    priceFrom: 'From',
    perPerson: 'per person',
    spotsAvailable: 'spots left',
    closedTour: 'Sold out / Closed',

    // Places
    verifiedBusiness: 'Verified by Baños Tourism Board',
    callNow: 'Call Venue',
    viewOnMap: 'View on Map',

    // Bookings
    myBookingsTitle: 'Your Passes & Bookings',
    confirmed: 'Confirmed',
    scanQrNotice: 'Show this QR code at the entrance or to the guide',
    noBookings: 'No active bookings yet. Explore top tours and live the adventure!',
    openCameraScanner: 'Scan Ticket QR Code',

    // Chat
    chatWithOperator: 'Direct Chat with Operator',
    typeMessage: 'Ask a question about the tour...',
    send: 'Send',

    // Operator Panel
    operatorDashboard: 'Tour Operator Portal',
    manageServices: 'Manage Tours & Services',
    addNewTour: 'Publish New Tour',
    availability: 'Availability',
    openStatus: 'Open',
    closedStatus: 'Paused',
    receivedBookings: 'Incoming Bookings',
    validateTicket: 'Validate Ticket via Camera',

    // Admin Panel
    adminDashboard: 'Tourism Supervision Console',
    commercialValidation: 'Commercial Profile Verification',
    superviseTransactions: 'Transaction Monitoring',
    systemAnalytics: 'Demand & Customer Analytics',
    pushCenter: 'Push Notification Dispatcher',
    broadcastPush: 'Broadcast Push Notification',

    // Security & Bio
    biometricTitle: 'Android Biometric Authentication',
    biometricDesc: 'Secure your account with fingerprint or facial unlock',
    biometricBtn: 'Authenticate with Biometrics',
    biometricSuccess: 'Biometric Identity Confirmed',
    aesEncryptionBadge: 'Data encrypted with AES-256-CBC under GDPR/LOPDP',
    jwtTokenBadge: 'Secure JWT Session with RBAC Roles',
    switchRole: 'Switch Demo Role:',
  }
};

export function getT(lang: Language) {
  return translations[lang] || translations.es;
}
