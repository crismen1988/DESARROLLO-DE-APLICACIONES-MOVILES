# BañosTour Mobile

Aplicación móvil multiplataforma para consultar servicios turísticos de Baños de Agua Santa. El cliente está construido con Ionic React, TypeScript y Capacitor, y consume la API desarrollada en NestJS.

## Stack y versiones

- Node.js: v24.19.0
- npm: 11.19.0
- Ionic React: 8.5.0
- Capacitor CLI, Core y Android: 8.5.0
- React: 19.0.0
- TypeScript: 5.9.x
- Java: OpenJDK 21.0.12 LTS
- Android SDK: C:\Users\crismen\AppData\Local\Android\Sdk

La elección de Ionic React con TypeScript y Capacitor permite reutilizar la interfaz React en navegador y Android, mantener tipado estático y acceder al runtime nativo sin duplicar la lógica principal.

## Estructura principal

~~~text
mobile/
├── android/                 # Proyecto Android generado por Capacitor
├── public/assets/           # Recursos públicos
├── src/
│   ├── pages/
│   │   ├── Welcome.tsx      # Pantalla inicial
│   │   ├── Login.tsx        # Inicio de sesión
│   │   ├── Register.tsx     # Creación de cuenta
│   │   └── Home.tsx         # Pantalla principal
│   └── App.tsx              # Rutas de la aplicación
├── .env.local               # URL local de la API
└── capacitor.config.ts      # Configuración de Capacitor
~~~

## Instalación y ejecución

Desde la carpeta mobile:

~~~powershell
npm install --legacy-peer-deps --ignore-scripts --no-audit --no-fund
npm run build
npx cap sync android
~~~

Comprobar las herramientas:

~~~powershell
ionic --version
npx cap --version
java -version
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" version
~~~

## Destino de ejecución actual

Inicialmente se configuró un emulador Android Pixel 7. Durante las pruebas, el emulador resultó demasiado lento para el ciclo de desarrollo y la interacción con la aplicación, por lo que se optó por utilizar un teléfono físico conectado por USB.

El teléfono físico es reconocido por ADB y permite ejecutar la aplicación con mejor respuesta. Su interfaz se visualiza en la PC mediante scrcpy:

~~~powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
scrcpy
~~~

Si hay más de un dispositivo conectado:

~~~powershell
scrcpy -s <ID_DEL_DISPOSITIVO>
~~~

El teléfono debe estar desbloqueado, tener habilitada la depuración USB y mostrar el estado device en adb devices.

## Ejecución en Android

Después de compilar y sincronizar:

~~~powershell
npx cap run android --target <ID_DEL_DISPOSITIVO>
~~~

Para reinstalar sin volver a copiar los archivos web:

~~~powershell
npx cap run android --no-sync --target <ID_DEL_DISPOSITIVO>
~~~

El emulador Pixel 7 se conserva como alternativa, pero no es el destino principal de trabajo debido a su lentitud:

~~~powershell
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -list-avds
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Pixel_7
~~~

## Conexión con la API local

Para el teléfono físico conectado a la misma red que el computador, mobile/.env.local debe contener:

~~~env
VITE_API_URL=http://192.168.1.18:3000
~~~

Para un emulador Android se utiliza:

~~~env
VITE_API_URL=http://10.0.2.2:3000
~~~

10.0.2.2 representa al computador desde el emulador. En el teléfono físico se utiliza la IP local del computador. Después de modificar la URL se debe recompilar y sincronizar:

~~~powershell
npm run build
npx cap sync android
~~~

## Tráfico HTTP durante el desarrollo

El backend se ejecuta localmente sin HTTPS. La configuración Android permite tráfico sin cifrar únicamente hacia 10.0.2.2 y 192.168.1.18, los hosts utilizados durante el desarrollo local. Esta excepción debe retirarse al utilizar HTTPS en un entorno de distribución.

## Funcionalidades implementadas

- Pantalla de bienvenida con imagen de Baños.
- Inicio de sesión con correo y contraseña.
- Mostrar y ocultar contraseña desde Login.
- Registro con confirmación de contraseña y controles para mostrar u ocultar ambos campos.
- Las contraseñas visibles se ocultan automáticamente después de 1.5 segundos.
- Limpieza de correo, contraseña, error y estado del ojo al volver a Login.
- Creación de cuentas con nombre, correo y contraseña.
- Integración con POST /auth/login.
- Integración con POST /auth/registro.
- Almacenamiento local del token de acceso.
- Cierre de sesión.
- Consulta del backend desde Home.
- Navegación entre Welcome, Login, Register y Home.

## Recarga en caliente

Para trabajar en navegador:

~~~powershell
npm run dev -- --host 0.0.0.0
~~~

Abrir http://localhost:5173. Los cambios de código se reflejan sin reiniciar el servidor de Vite.

Para una nueva compilación Android después de cambiar variables o código:

~~~powershell
npm run build
npx cap sync android
npx cap run android --target <ID_DEL_DISPOSITIVO>
~~~

## Verificaciones actuales

- npx tsc --noEmit: aprobado.
- ESLint del frontend: aprobado.
- npx vite build --minify false: aprobado.
- Capacitor local: 8.5.0.
- El teléfono físico se utiliza como destino principal y su interfaz se visualiza en la PC mediante scrcpy.
- La comprobación de conectividad requiere que PostgreSQL, Redis y el backend estén activos.

## Flujo de navegación

~~~text
Bienvenida → Iniciar sesión → Pantalla principal
                     ↓
              Crear una cuenta → Pantalla principal
~~~
