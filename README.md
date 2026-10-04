# BañosTour Frontend

Aplicación móvil independiente desarrollada con Ionic React, TypeScript, Capacitor y Vite. La carpeta `frontend` está preparada para publicarse en un repositorio separado del backend.

## Tecnologías

- Ionic React 8 y React 19.
- TypeScript 5, Vite 6 y Tailwind CSS 4.
- Capacitor 8 para Android.
- Leaflet y OpenStreetMap.
- Ionic Storage para persistencia local limitada.
- Lucide Icons.
- Plugins nativos de cámara, ubicación, biometría y notificaciones push.

## Instalación

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

La única variable pública del frontend es:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

La URL debe terminar en `/api`. No coloques contraseñas ni secretos en variables `VITE_*`, porque forman parte del paquete público.

El repositorio funciona de forma independiente: no importa archivos del backend ni de la carpeta superior. Conserva juntos `src`, `public`, `android`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `capacitor.config.json`, `index.html`, `.gitignore`, `.env.example` y este README.

## Comunicación con el backend

El frontend solo consume el contrato HTTP y no accede directamente a Prisma ni PostgreSQL. La persistencia relacional del backend es transparente para la aplicación móvil: las rutas, cuerpos y respuestas vigentes se mantienen sin cambios.

### Navegador local

Puedes usar `VITE_API_BASE_URL=/api`; Vite redirige las solicitudes a `http://localhost:3000`.

### Android por USB

```powershell
adb devices
adb reverse tcp:3000 tcp:3000
npm run build
npm run cap:sync
cd android
.\gradlew.bat assembleDebug
adb install -r .\app\build\outputs\apk\debug\app-debug.apk
```

Mantén `VITE_API_BASE_URL=http://localhost:3000/api` al utilizar `adb reverse`.

### Android por red local

Configura `VITE_API_BASE_URL=http://IP_DE_TU_PC:3000/api`. El teléfono y la computadora deben compartir red y el firewall debe permitir el puerto 3000.

### Producción

Utiliza una dirección HTTPS pública y añade el origen web real en `CORS_ORIGINS` del backend.

## Funcionamiento sin conexión

Ionic Storage conserva por un máximo de siete días:

- tours y lugares;
- perfil de la sesión activa;
- reservas y boletos QR;
- mensajes previamente recibidos;
- notificaciones;
- última ubicación autorizada;
- información administrativa previamente consultada.

Sin red se permite consultar la información almacenada. Reservar, enviar mensajes, editar perfiles, administrar servicios y ejecutar acciones administrativas requiere conexión. Al volver la red, la aplicación vuelve a consultar el backend. Al cerrar sesión se eliminan los datos privados locales.

Si una sesión sigue activa, la app puede desbloquear el contenido local mediante biometría. Después de cerrar sesión explícitamente se exige correo y contraseña.

## Capacidades nativas

- **Ubicación:** obtiene la posición, calcula distancias y actualiza el mapa.
- **Cámara:** permite tomar o seleccionar fotografías para perfiles y servicios.
- **Escáner QR:** usa ML Kit en el dispositivo para leer pases y comprueba el código contra las reservas accesibles para el rol autenticado.
- **Biometría:** protege la reapertura de sesiones activas.
- **Notificaciones:** registra el dispositivo y recibe avisos cuando Firebase está configurado.

Los permisos se solicitan al utilizar cada función. La app ofrece alternativas cuando se niegan y acceso a ajustes cuando el bloqueo es permanente.

## Firebase

Coloca `google-services.json` en `android/app/`. Este archivo está excluido de Git. Las credenciales del servidor se configuran únicamente en el backend.

## Android

- API mínima: 24.
- API de compilación: 36.
- API objetivo: 36.
- Las compilaciones de depuración reutilizan `android/app/debug.keystore` cuando existe localmente y usan la clave estándar de Android en una instalación nueva. La firma de producción debe configurarse fuera del repositorio con una clave privada propia.

## Verificación

```powershell
npm run lint
npm run build
npm run cap:sync
```

No publiques `.env`, `google-services.json`, claves de firma, `node_modules`, `dist` ni directorios de compilación Android.
