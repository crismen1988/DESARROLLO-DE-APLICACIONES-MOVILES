# BaÃ±osTour

BaÃ±osTour es una aplicaciÃ³n mÃ³vil personal para descubrir y reservar experiencias turÃ­sticas en BaÃ±os de Agua Santa. No pertenece ni representa a una entidad estatal.

## Estado actual

- Frontend mÃ³vil: Ionic React 8, React 19, TypeScript, Vite y Tailwind CSS 4.
- AplicaciÃ³n Android: Capacitor 8.
- Backend: NestJS 11 sobre Express, escrito en TypeScript.
- Persistencia: PostgreSQL 16 mediante Prisma.
- Servicios locales: Redis 7 y pgAdmin 4 mediante Docker Compose.
- Roles RBAC: turista, operador turÃ­stico y administrador.
- Idiomas: espaÃ±ol e inglÃ©s.
- DiseÃ±o: interfaz responsiva, paleta slate/teal/emerald e iconos Lucide.

## Funciones

### Turista

- Explorar tours por texto y categorÃ­a.
- Usar GPS real y calcular distancias.
- Consultar mapa, lugares, hospedaje y gastronomÃ­a.
- Reservar por fecha y participantes con cÃ¡lculo en USD.
- Recibir boleto QR verificable.
- Consultar reservas, chatear con el operador y cerrar sesiÃ³n.
- Usar biometrÃ­a nativa desde la pantalla de inicio de sesiÃ³n cuando el dispositivo la admite.

### Operador

- Publicar tours y establecimientos.
- Editar tours, gestionar disponibilidad y cupos.
- Eliminar servicios propios cuando no tengan reservas activas.
- Consultar reservas y comunicarse con turistas.
- Administrar su perfil comercial.

### Administrador

- Consultar indicadores y transacciones de la plataforma.
- Revisar y aprobar perfiles de operadores.
- Enviar notificaciones segmentadas.
- Administrar usuarios segÃºn permisos RBAC.

## Estructura del proyecto

El proyecto estÃ¡ dividido limpiamente en dos componentes independientes:

```
baÃ±ostour/
â”œâ”€â”€ backend/            # API NestJS, Prisma ORM, PostgreSQL/Redis, Dockerfile
â”‚   â”œâ”€â”€ prisma/         # Esquema Prisma y migraciones
â”‚   â”œâ”€â”€ src/            # Controladores, rutas, seguridad y lÃ³gica
â”‚   â”œâ”€â”€ tests/          # Pruebas de integraciÃ³n / humo de API
â”‚   â””â”€â”€ package.json    # Dependencias de backend
â”œâ”€â”€ frontend/           # App Ionic React 8, Vite, Tailwind CSS 4 y Capacitor 8
â”‚   â”œâ”€â”€ android/        # Proyecto nativo Android (Capacitor)
â”‚   â”œâ”€â”€ src/            # Componentes React, hooks, servicios y vistas
â”‚   â”œâ”€â”€ public/         # Recursos pÃºblicos
â”‚   â””â”€â”€ package.json    # Dependencias de frontend
â”œâ”€â”€ docker-compose.yml  # OrquestaciÃ³n de servicios locales (backend, postgres, redis, pgadmin)
â””â”€â”€ package.json        # Scripts de conveniencia raÃ­z
```

## EjecuciÃ³n local

Requisitos: Node.js 20 o superior, npm, Docker Desktop y, para Android, Android Studio con ADB.

### 1. Instalar dependencias

```powershell
npm run install:all
```

### 2. Levantar el Backend (API NestJS en puerto 3000)

```powershell
# Desde la raÃ­z del proyecto:
npm run dev:backend

# O ingresando a la carpeta backend:
cd backend
npm run dev
```

API disponible en: http://127.0.0.1:3000/api  
Salud de la API: http://127.0.0.1:3000/api/health

### 3. Levantar el Frontend (Vite en puerto 5173 con proxy automÃ¡tico a la API)

```powershell
# Desde la raÃ­z del proyecto:
npm run dev:frontend

# O ingresando a la carpeta frontend:
cd frontend
npm run dev
```

Frontend disponible en: http://localhost:5173

## Dispositivos Emulados (Android Studio)

### 3.1 Configurar emulador

```powershell
# 1. Abrir Android Studio
# 2. Abrir "Device Manager" (icono de telÃ©fono en toolbar)
# 3. Hacer clic en "Create New Device" (o "AVD" en pestaÃ±a "Virtual Devices")
# 4. Elegir un dispositivo predefinido (por ejemplo, "Pixel 7 API 34")
# 5. Configurar:
#   - Target: Android 14 (API 34)
#   - ABI: x86_64
#   - Skin: Default
#   - Ram: 2048 MB
#   - Storage: 4096 MB
# 6. Hacer clic en "Next" y luego "Finish"
```

### 3.2 Iniciar emulador

```powershell
# Desde Android Studio:
# 1. Hacer clic en el botÃ³n "Play" (Run) en toolbar
# 2. Seleccionar el emulador creado
# 3. Esperar a que el emulador inicie

# O desde terminal:
# cd frontend/android
# ./gradlew.bat installDebug
```

### 3.3 Configurar redirecciÃ³n de puertos

```powershell
# Redirigir puerto de API del host al emulador:
adb reverse tcp:3000 tcp:3000

# Verificar conexiÃ³n:
adb devices
adb shell echo "API disponible en: http://10.0.2.2:3000/api"
```

## Dispositivos FÃ­sicos (USB)

### 4.1 Preparar dispositivo Android

```powershell
# 1. Habilitar Opciones de Desarrollador:
#   - Desbloquear bloqueo de OEM
#   - Permitir depuraciÃ³n USB
#   - Activar "Instalar a travÃ©s de USB"
#   - Activar "DepuraciÃ³n USB (Segura)"

# 2. Conectar dispositivo al computador mediante USB:
#   - Usar cable USB-C
#   - Si es USB-C a USB-C, puede ser necesario usar un adaptador
#   - Si es USB-C a Lightning, usar cable adaptador adecuado

# 3. Aceptar solicitud de depuraciÃ³n en dispositivo
```

### 4.2 Instalar aplicaciones en dispositivo

```powershell
# 1. Verificar dispositivo conectado:
adb devices
# DeberÃ­a mostrar algo como: 12345678 device

# 2. Redirigir puerto de API:
adb reverse tcp:3000 tcp:3000

# 3. Instalar aplicaciÃ³n:
# Desde la raÃ­z del proyecto:
npm run build:frontend
npm run cap:sync

# O instalar directamente:
cd frontend/android
.\gradlew.bat assembleDebug
cd ..\..
adb install -r .\frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

### 4.3 Usar dispositivo fÃ­sico

```powershell
# Una vez instalado, la aplicaciÃ³n estarÃ¡ disponible en el dispositivo
# Iniciar sesiÃ³n en la aplicaciÃ³n y acceder a:
# - http://10.0.0.2:3000/api (o la IP del computador si estÃ¡ en red local)
# - O usar el proxy automÃ¡tico de Capacitor si estÃ¡ configurado
```

## Flujo de Trabajo Completo

### Escenario 1: Desarrollo en computador (emulador)

```powershell
# 1. Levantar backend:
npm run dev:backend

# 2. Levantar frontend:
npm run dev:frontend

# 3. Iniciar emulador:
# Desde Android Studio o:
cd frontend/android
.\gradlew.bat installDebug

# 4. Configurar redirecciÃ³n:
adb reverse tcp:3000 tcp:3000

# 5. Probar:
# - Frontend: http://localhost:5173
# - API: http://10.0.2.2:3000/api
# - Emulador: Iniciar aplicaciÃ³n desde home screen
```

### Escenario 2: Desarrollo con dispositivo fÃ­sico

```powershell
# 1. Preparar dispositivo (habilitar depuraciÃ³n USB, desbloquear OEM)
# 2. Conectar dispositivo mediante USB
# 3. Instalar aplicaciÃ³n:
npm run build:frontend
npm run cap:sync

# 4. Levantar backend:
npm run dev:backend

# 5. Levantar frontend (opcional para pruebas en computador):
npm run dev:frontend

# 6. Configurar redirecciÃ³n:
adb reverse tcp:3000 tcp:3000

# 7. Probar:
# - Dispositivo: Iniciar aplicaciÃ³n
# - API: http://10.0.0.2:3000/api (IP del computador)
```

### Escenario 3: ProducciÃ³n (dispositivo fÃ­sico)

```powershell
# 1. Compilar aplicaciÃ³n para producciÃ³n:
npm run build:frontend

# 2. Instalar en dispositivo:
cd frontend/android
.\gradlew.bat assembleRelease
cd ..\..
adb install -r .\frontend\android\app\build\outputs\apk\release\app-release.apk

# 3. Levantar backend en servidor:
npm run start:backend

# 4. Configurar redirecciÃ³n:
adb reverse tcp:3000 tcp:3000

# 5. Probar aplicaciÃ³n en dispositivo
```

## Comandos Ãštiles

### Verificaciones

```powershell
# Verificar dispositivos conectados:
adb devices

# Verificar puertos redirigidos:
adb reverse --list

# Verificar logs del emulador:
adb logcat

# Verificar estado de aplicaciÃ³n:
adb shell pm list packages | grep com.banostour
```

### SoluciÃ³n de Problemas

#### Problema: "No se puede establecer conexiÃ³n con el emulador"

```powershell
# 1. Verificar que el emulador estÃ© corriendo:
adb devices
# DeberÃ­a mostrar el dispositivo

# 2. Reiniciar emulador:
# Desde Android Studio: Hacer clic derecho en emulador -> "Power Operations" -> "Cold Boot Now"
# O desde terminal:
adb emu kill
# Luego reiniciar con ./gradlew.bat installDebug

# 3. Verificar USB (si es dispositivo fÃ­sico):
# - Usar cable USB diferente
# - Probar con otro computador
# - Verificar que el dispositivo estÃ© desbloqueado
```

#### Problema: "La aplicaciÃ³n no se instala en dispositivo"

```powershell
# 1. Verificar permisos:
adb shell pm install --help

# 2. Instalar manualmente:
adb install frontend/android/app/build/outputs/apk/debug/app-debug.apk

# 3. Verificar espacio en dispositivo:
adb shell df -h

# 4. Verificar versiÃ³n de Android:
adb shell getprop ro.build.version.release
```

#### Problema: "API no responde en dispositivo"

```powershell
# 1. Verificar redirecciÃ³n:
adb reverse --list
# DeberÃ­a mostrar: tcp:3000

# 2. Probar conexiÃ³n:
adb shell curl -I http://10.0.2.2:3000/api/health

# 3. Verificar firewall (si es en red diferente):
# Agregar excepciÃ³n para puerto 3000
```

## ConfiguraciÃ³n Avanzada

### Usar Genymotion en lugar de emulador de Android Studio

```powershell
# 1. Descargar Genymotion desde https://www.genymotion.com/
# 2. Descargar imÃ¡genes de dispositivos desde https://www.genymotion.com/store/
# 3. Iniciar Genymotion
# 4. Conectar dispositivo virtual:
adb devices
# 5. Configurar redirecciÃ³n:
adb reverse tcp:3000 tcp:3000
```

### Usar mÃºltiples dispositivos/emuladores

```powershell
# 1. Obtener IDs de dispositivos:
adb devices
# Ejemplo: 0123456789ABCDEF device

# 2. Trabajar con dispositivo especÃ­fico:
adb -s 0123456789ABCDEF reverse tcp:3000 tcp:3000

# 3. Trabajar con emulador especÃ­fico:
adb -s emulator-5554 reverse tcp:3000 tcp:3000
```

## Monitoreo y DepuraciÃ³n

### Monitorear logs del emulador/dispositivo

```powershell
# Monitorear logs en tiempo real:
adb logcat -s "BaÃ±osTour"

# Monitorear logs especÃ­ficos:
adb logcat ActivityManager:W "BaÃ±osTour" *:S

# Exportar logs:
adb logcat > device_logs.txt
```

### Verificar estado de aplicaciÃ³n

```powershell
# Verificar procesos:
adb shell ps | grep com.banostour

# Verificar memoria:
adb shell dumpsys meminfo com.banostour

# Verificar red:
adb shell dumpsys netstats
```

## Mantenimiento

### Limpiar datos del emulador

```powershell
# Detener emulador:
adb emu kill

# Eliminar datos:
adb emu wipe

# Reiniciar emulador:
adb start-server
```

### Limpiar instalaciÃ³n de aplicaciÃ³n

```powershell
# Desinstalar aplicaciÃ³n:
adb uninstall com.banostour

# Eliminar datos:
adb shell pm clear com.banostour
```

## Recursos Ãštiles

- **DocumentaciÃ³n de Android Studio**: https://developer.android.com/studio
- **DocumentaciÃ³n de ADB**: https://developer.android.com/tools/adb
- **DocumentaciÃ³n de Capacitor**: https://capacitorjs.com/docs/
- **Genymotion**: https://www.genymotion.com/
- **Iconos Lucide**: https://lucide.dev/

## Contacto

Si encuentras problemas o necesitas ayuda:

1. Verificar logs del emulador/dispositivo
2. Verificar redirecciÃ³n de puertos
3. Asegurar que ambos backend y frontend estÃ©n corriendo
4. Verificar que el emulador/dispositivo tenga suficiente memoria y espacio
5. Revisar la configuraciÃ³n de red (firewall, VPN, etc.)

Para soporte tÃ©cnico, contactar al equipo de desarrollo en dev@banostour.ec

---

## Android en un dispositivo fÃ­sico

La compilaciÃ³n Android utiliza Capacitor dentro de la carpeta `frontend/`:

```powershell
# 1. Verificar dispositivo conectado y redirigir el puerto de la API local al telÃ©fono:
adb devices
adb reverse tcp:3000 tcp:3000

# 2. Compilar frontend y sincronizar con Android (desde la raÃ­z):
npm run build:frontend
npm run cap:sync

# 3. Compilar e instalar en el telÃ©fono:
cd frontend\android
.\gradlew.bat assembleDebug
cd ..\..
adb install -r .\frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

O en un solo paso automÃ¡tico usando Capacitor CLI:
```powershell
npm run build:frontend
npm run cap:run
```

Si se desconecta el cable o se reinicia el dispositivo, vuelva a ejecutar `adb reverse tcp:3000 tcp:3000`.

## Base de datos y pgAdmin (Docker)

```powershell
docker compose --env-file .env.local up -d
```

- Servidor visible desde pgAdmin: `BaÃ±osTour PostgreSQL`
- Host interno: `postgres`
- Puerto: `5432`
- Base: `banostour_db`
- Usuario PostgreSQL: `banos_user`
- ContraseÃ±a PostgreSQL: `<CONFIGURA_POSTGRES_PASSWORD>`
- pgAdmin URL: http://127.0.0.1:5051
- Usuario pgAdmin: `admin@banostour.ec`
- ContraseÃ±a pgAdmin: `<CONFIGURA_PGADMIN_PASSWORD>`

## Comandos Ãºtiles

```powershell
# Verificaciones y compilaciones
npm run lint:backend
npm run lint:frontend
npm run test:backend
npm run build:backend
npm run build:frontend
```

## Seguridad y privacidad

- ContraseÃ±as derivadas con scrypt y sal aleatoria.
- JWT de acceso de una hora.
- SesiÃ³n de renovaciÃ³n con token rotatorio almacenado como hash y cookie HttpOnly.
- AutorizaciÃ³n por rol en el backend.
- Cifrado AES-256-CBC para datos sensibles previstos por el flujo de reserva.
- Aviso de tratamiento de datos conforme a la LOPDP ecuatoriana.
- BiometrÃ­a nativa utilizada para desbloquear el inicio de sesiÃ³n, no como control redundante dentro de un perfil ya autenticado.

Consulte [IMPLEMENTACION.md](IMPLEMENTACION.md), [DOCKER_INSTRUCTIONS.md](DOCKER_INSTRUCTIONS.md), [server/README.md](server/README.md) y [src/README.md](src/README.md).

