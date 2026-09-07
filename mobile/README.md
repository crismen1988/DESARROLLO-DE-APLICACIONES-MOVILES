# BañosTour Mobile

Corte documental: **2026-09-06**, rama `banostour_version2`. Consultar [verificación actual](../docs/VERIFICACION-ENTORNO.md).

Aplicación móvil multiplataforma para consultar servicios turísticos de Baños de Agua Santa. El cliente está construido con Ionic React, TypeScript y Capacitor, y consume la API desarrollada en NestJS.

## Stack y versiones

Las versiones siguientes describen el entorno registrado previamente; las dependencias reproducibles están en `package-lock.json`. Java, SDK y dispositivo deben comprobarse en cada equipo.

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

Además de las pantallas iniciales del esquema, `src/pages/` incluye TouristHome, Catalog, Favorites, Profile, AdminDashboard, ForgotPassword y ResetPassword. `src/auth/` concentra la sesión y rutas protegidas; `src/i18n/` las traducciones; `src/components/` la navegación inferior, selector de idioma y búsqueda compartida.

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
npm ci --legacy-peer-deps
Copy-Item .env.example .env.local
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

En el trabajo previo se utilizó un teléfono físico reconocido por ADB. En esta revisión no se volvió a validar la conexión del dispositivo. Su interfaz se visualiza en la PC mediante scrcpy:

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
- Selección de cuenta turista o proveedor turístico.
- Formulario ampliado para proveedores con RUC, razón social, nombre comercial, actividad, contacto, dirección, ciudad y sitio web opcional.
- Los proveedores quedan pendientes de revisión administrativa después del registro.
- Las contraseñas visibles se ocultan automáticamente después de 1.5 segundos.
- Limpieza de correo, contraseña, error y estado del ojo al volver a Login.
- Creación de cuentas con nombre, correo y contraseña.
- Integración con POST /auth/login.
- Integración con POST /auth/registro.
- Tokens de acceso y refresh únicamente en memoria del contexto React; recargar la app requiere iniciar sesión nuevamente. La renovación automática aún no está conectada en el cliente.
- Cierre de sesión.
- Consulta del backend desde Home.
- Navegación por bienvenida, login, registro, recuperación, inicio por rol, catálogo, favoritos, perfil y administración.
- Selector de idioma español/inglés y correo recordado en localStorage.
- Recuperación y restablecimiento de contraseña mediante la API y SMTP configurado.
- Administración básica de cuentas y consulta de reportes; los botones de categorías y creación de contenido todavía no ejecutan acciones.

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

## Verificaciones de la versión 2

- `npm run build`: aprobado, incluye TypeScript y Vite con minificación; avisa de bundles mayores de 500 kB.
- ESLint del frontend: aprobado.
- Cypress de autenticación, perfil e inicio: 3 specs y 9 pruebas aprobadas el 2026-09-06 con API simulada.
- Capacitor declarado: 8.5.0; no se recompiló APK en este corte.
- El teléfono físico se utiliza como destino principal y su interfaz se visualiza en la PC mediante scrcpy.
- La comprobación de conectividad requiere que PostgreSQL, Redis y el backend estén activos.

## Flujo de navegación

~~~text
Bienvenida → Login → Inicio por rol
                ↓           ↓
             Registro    Explorar / Favoritos / Perfil
                ↓                          ↓
              Login                   Cerrar sesión
                ↓
       Recuperar / Restablecer contraseña
~~~

## Perfil y actividad turística

El perfil mantiene el degradado verde y crema, las tarjetas redondeadas y los acentos coral de BañosTour. Incluye identidad, biografía, estadísticas reales y pestañas de favoritos y reseñas. Las cuentas de prestador también muestran sus lugares activos, reseñas recibidas y valoración promedio. La edición se abre en un modal; cancelar descarta los cambios pendientes, incluida la foto.

La navegación inferior compartida conecta Inicio, Explorar, Favoritos y Perfil. Correo, dirección y fecha de nacimiento se consultan dentro de la edición y no aparecen en la cabecera.

Datos utilizados:
- `GET /usuarios/perfil`: datos de la cuenta autenticada y estadísticas.
- `GET /usuarios/perfil/actividad?tipo=favoritos|resenas|lugares&pagina=1`: actividad de esa cuenta, en páginas de 12 elementos y con imagen principal del lugar.
- `PATCH /usuarios/perfil`: edición del perfil, incluida dirección y borrado de fecha/edad mediante `null`.

Pruebas de interfaz con datos simulados: `npx cypress run --spec cypress/e2e/profile.cy.ts`. Las pruebas de API con base de datos local están en `backend/test/profile.e2e-spec.ts` y crean y eliminan sus propias fixtures. Para compilar para el emulador, definir `VITE_API_URL=http://10.0.2.2:3000` en el proceso de compilación, ejecutar `npm run build` y `npx cap sync android`.

## Inicio del turista

El inicio del turista utiliza la navegación inferior como acceso principal a Inicio, Explorar, Favoritos y Perfil. Cerrar sesión sigue disponible en Perfil → Ajustes. Se han retirado los accesos duplicados de la cabecera y las tarjetas que repetían esa navegación.

La búsqueda del inicio y las categorías abren el catálogo con filtros en la URL (`busqueda`, `categoriaId`). El catálogo consulta los filtros y la paginación directamente en la API, permite limpiar los filtros y recorrer todas las páginas. La agenda del inicio consume `GET /eventos` y permite expandir cada evento para ver descripción, ubicación y fechas en la zona horaria de Ecuador; no muestra eventos ficticios si la lista está vacía.

Verificación: `npx cypress run --spec cypress/e2e/tourist-home.cy.ts,cypress/e2e/profile.cy.ts`. Las pruebas de interfaz usan datos simulados, sin crear contenido en la base de datos.
