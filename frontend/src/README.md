# Frontend de BañosTour

## Tecnologías

- Ionic React 8.
- React 19.
- TypeScript.
- Capacitor 8 para Android.
- Vite 6.
- Tailwind CSS 4.
- Lucide React.
- Leaflet.
- Ionic Storage.

## Diseño

La interfaz es responsiva y prioriza móviles. Usa blancos y grises suaves, acentos teal y emerald, texto slate de alto contraste, badges redondeados y tarjetas oscuras para contenido destacado. No se presenta como producto de una institución pública.

## Pantallas y roles

### Acceso

La bienvenida usa recursos locales de `public/assets`. El usuario puede iniciar sesión, registrarse o explorar como invitado. La biometría nativa aparece en el acceso cuando el dispositivo y una cuenta previa lo permiten.

### Turista

- Búsqueda en tiempo real y filtros horizontales.
- GPS real y distancias en kilómetros.
- Tours con imagen 16:9, duración, dificultad y precio en USD.
- Reserva con fecha, participantes, total y aviso LOPDP.
- Perfil con idioma, correo verificado, boletos QR y cierre de sesión.
- Chat, puntos de encuentro y política de cancelación.

### Operador

- Gestión de tours, disponibilidad y cupos.
- Edición de datos del servicio y eliminación con confirmación.
- Bloqueo de eliminación cuando existen reservas activas.
- Registro de establecimientos y eventos.
- Consulta de reservas y mensajería.
- Perfil comercial sujeto a revisión interna de la plataforma.

### Administrador

- Métricas y actividad de la plataforma.
- Revisión de operadores.
- Transacciones y notificaciones segmentadas.
- Gestión de usuarios según RBAC.

## Estructura principal

```text
src/
  components/     pantallas y componentes visuales
  hooks/          estado de sesión
  services/       cliente HTTP y servicios por dominio
  utils/          geolocalización e idioma
  App.tsx         navegación y orquestación
  types.ts        contratos TypeScript
```

El cliente HTTP se encuentra en `src/services/apiClient.ts`. La URL base se toma de `VITE_API_BASE_URL` y, si no existe, usa `/api` en web.

## Android

La configuración Capacitor está en `capacitor.config.json`. Para un dispositivo conectado:

```powershell
adb reverse tcp:3000 tcp:3000
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
adb install -r .\app\build\outputs\apk\debug\app-debug.apk
```

## Validación

```powershell
npm run lint
npm run build
```
