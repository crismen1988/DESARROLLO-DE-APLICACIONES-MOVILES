# Implementación del frontend

## Organización

```text
src/
├── components/   pantallas y componentes visuales
├── services/     API, sesión, capacidades nativas y caché local
├── utils/        distancia geográfica e internacionalización
├── App.tsx       estado principal, navegación y coordinación
├── main.tsx      arranque Ionic React
└── types.ts      contratos TypeScript
```

## Roles y navegación

### Turista

- Exploración con búsqueda y filtros por categoría.
- Tours con fotografía 16:9, distancia, duración, dificultad y precio.
- Mapa con ubicación actual, puntos de interés y rutas.
- Reserva con fecha, participantes, total y consentimiento LOPDP.
- Perfil, idioma, reservas activas, boleto QR, chat y cierre de sesión.

### Operador

- Alta, edición, disponibilidad y eliminación de servicios propios.
- Fotografías tomadas o seleccionadas desde el dispositivo.
- Consulta de reservas y mensajes con el nombre real del turista.
- Perfil comercial editable bajo acción explícita del usuario.

### Administrador

- Indicadores de actividad.
- Revisión de operadores.
- Consulta de transacciones.
- Notificaciones segmentadas.
- Gestión permitida por RBAC.

## Servicios principales

- `apiClient.ts`: URL base, JWT, renovación y errores normalizados.
- `authService.ts`: acceso, registro, sesión, biometría y cierre seguro.
- `tourService.ts` y `placeService.ts`: catálogo y caché offline.
- `bookingService.ts`: reservas autenticadas y consulta offline.
- `chatService.ts`: mensajes autenticados y lectura offline.
- `profileService.ts`: perfil y restauración local.
- `notificationService.ts` y `nativePushService.ts`: avisos y registro FCM.
- `capacitor.ts`: ubicación, ajustes del sistema y seguimiento GPS.
- `offlineCache.ts`: Ionic Storage, caducidad y borrado de datos privados.

## Sesión y biometría

El token se conserva para restaurar una sesión no cerrada. En Android, al regresar a una sesión activa se solicita biometría. Con red, el servidor valida un desafío firmado; sin red, la clave privada protegida por Android confirma la identidad localmente. El cierre de sesión revoca la vinculación biométrica, borra el token y elimina el caché privado.

## Modo offline

Las lecturas recurren al último dato válido solo ante fallos de conexión. Errores HTTP como 401 no se ocultan con datos antiguos. Las operaciones de escritura no se encolan para evitar reservas duplicadas o cambios incompatibles.

## Diseño

La interfaz mantiene la paleta slate, teal y emerald, iconos Lucide, tarjetas responsivas y navegación inferior fija. No contiene referencias institucionales ni controles técnicos dirigidos al usuario final.