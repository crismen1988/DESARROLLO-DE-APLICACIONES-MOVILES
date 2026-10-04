# Operación, configuración y calidad

## Requisitos técnicos

| Componente | Requisito |
|---|---|
| Desarrollo | Node.js 20 o superior y npm compatible. |
| Base de datos | PostgreSQL 16; Docker es opcional pero recomendado localmente. |
| Android | SDK de compilación y objetivo 36; mínimo 24. |
| Dispositivo | Android físico con depuración USB para validar capacidades nativas. |
| Herramientas opcionales | pgAdmin para inspección y `scrcpy` para grabación. |

## Configuración sin secretos

### Frontend

`VITE_API_BASE_URL` es la URL completa de la API y debe terminar en `/api`. Todo valor `VITE_*` se incluye en los archivos públicos de la aplicación; no puede contener claves ni contraseñas.

Ejemplos permitidos en documentación:

```env
VITE_API_BASE_URL=http://localhost:3000/api
# Producción: https://api.example.com/api
```

### Backend

| Variable | Obligación |
|---|---|
| `NODE_ENV` | `development`, `test` o `production`. |
| `PORT` | Puerto de escucha; por defecto local 3000. |
| `DATABASE_URL` | Cadena PostgreSQL privada. |
| `AES_SECRET_KEY` | Secreto de cifrado y firma; mínimo 32 caracteres en producción. |
| `ADMIN_EMAIL` | Correo inicial privado del administrador. |
| `ADMIN_PASSWORD` | Contraseña inicial robusta; nunca documentarla. |
| `CORS_ORIGINS` | Lista explícita de orígenes web permitidos. |
| `FIREBASE_PROJECT_ID` | Solo si se habilita FCM. |
| `FIREBASE_CLIENT_EMAIL` | Solo backend; cuenta de servicio. |
| `FIREBASE_PRIVATE_KEY` | Solo backend; preservar saltos de línea esperados. |

Los valores reales pertenecen al entorno de ejecución o a un gestor de secretos, nunca a archivos versionados.

## Puesta en marcha local

### Backend

```powershell
cd D:\bañostour\backend
docker compose up -d postgres pgadmin
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

### Frontend web

```powershell
cd D:\bañostour\frontend
npm run dev
```

### Android por USB

```powershell
adb devices
adb reverse tcp:3000 tcp:3000
cd D:\bañostour\frontend
npm run build
npm run cap:sync
cd android
.\gradlew.bat assembleDebug
adb install -r .\app\build\outputs\apk\debug\app-debug.apk
```

`adb reverse` debe ejecutarse de nuevo después de reconectar o reiniciar ADB. La dirección local es válida únicamente durante desarrollo.

## Gestión segura de Docker

- `docker compose up -d` crea o inicia servicios sin borrar datos existentes.
- `docker compose stop` detiene contenedores y conserva volúmenes.
- `docker compose start` reinicia contenedores detenidos.
- `docker compose down` elimina contenedores y red, pero normalmente conserva volúmenes nombrados.
- `docker compose down -v` elimina también volúmenes y puede destruir la base local; requiere respaldo y una intención expresa.

Nunca se debe recomendar una eliminación de volúmenes como paso normal para cerrar el backend.

## Comprobaciones de salud

Antes de una demostración:

1. PostgreSQL acepta conexiones.
2. Las migraciones requeridas están aplicadas.
3. `GET /api/health` responde satisfactoriamente.
4. El teléfono aparece en `adb devices` como autorizado.
5. La URL incorporada al frontend coincide con el mecanismo de conexión.
6. Una consulta pública carga tours o lugares.
7. Cada cuenta de demostración ingresa con su rol esperado.
8. Los permisos tienen el estado preparado para el caso que se demostrará.

## Verificación del código

Los comandos no generan informes que deban versionarse:

```powershell
cd D:\bañostour\frontend
npm run lint
npm run build

cd D:\bañostour\backend
npm run lint
npm run build
npx prisma validate --schema=.\prisma\schema.prisma
npx prisma migrate status --schema=.\prisma\schema.prisma
```

Una compilación exitosa confirma tipado y empaquetado, pero no reemplaza una prueba funcional de red, base ni dispositivo.

## Matriz mínima de aceptación

| Área | Caso exitoso | Caso de error obligatorio |
|---|---|---|
| Inicio | La app carga sin pantalla blanca. | Backend no disponible produce mensaje y usa caché cuando existe. |
| Autenticación | Credenciales válidas abren el rol correcto. | Contraseña inválida no crea sesión. |
| Registro | Turista u operador válido queda persistido. | Correo/RUC inválido o duplicado se rechaza. |
| RBAC | Cada rol consulta sus recursos. | Turista no accede a administración; operador no edita recurso ajeno. |
| Reserva | Se crea, calcula total, genera QR y aparece tras nueva consulta. | Fecha pasada, cupos inválidos o tour cerrado se rechazan. |
| Servicio | Operador crea, consulta, edita, pausa y elimina uno propio. | Tour con reserva activa no se elimina. |
| Perfil | Modo lectura pasa a edición voluntaria y persiste. | Correo duplicado o RUC inválido se rechaza. |
| Mensajes | El nombre real del remitente se conserva. | Mensaje vacío, excesivo o receptor inválido se rechaza. |
| Ubicación | Con permiso, actualiza mapa y distancias. | Denegación y GPS apagado tienen caminos distintos. |
| Cámara/QR | Captura o escaneo devuelve resultado. | Cancelación o denegación mantiene la aplicación estable. |
| Biometría | Reabre sesión conservada tras verificación. | Después de cerrar sesión exige credenciales. |
| Offline | Lectura reciente aparece sin red. | Escritura offline se bloquea y no se presenta como confirmada. |

## Datos de prueba

- Utilizar cuentas específicas para demostración, nunca cuentas personales.
- No guardar contraseñas en guiones, capturas o commits.
- Crear servicios y reservas con nombres reconocibles y eliminarlos cuando la regla de negocio lo permita.
- Utilizar documentos ficticios y evitar datos reales de identidad.
- Consultar las tablas relacionales para verificar resultados; no modificar relaciones manualmente mientras la API esté ejecutándose.
- No usar `AppState` para validar el estado actual: es un respaldo histórico de migración.

## Rendimiento y límites

Controles actuales:

- carga diferida de imágenes;
- recorte y compresión antes de enviar fotografías;
- filtros específicos en consultas;
- caché de lectura por siete días;
- renovación JWT consolidada;
- límite del cuerpo HTTP;
- cola de persistencia para ordenar escrituras;
- transacciones Prisma sobre tablas relacionadas;
- paginación opcional en tours y lugares;
- límites de solicitudes generales y reforzados para autenticación.

Pendientes de escalamiento:

- división dinámica del paquete web principal;
- almacenamiento de imágenes fuera del JSON y la base;
- acceso por repositorios directos para múltiples instancias;
- observabilidad centralizada y límites distribuidos cuando exista más de una instancia.

## Publicación Android

Antes de generar una versión publicable:

1. definir un identificador de aplicación propio y definitivo;
2. desactivar tráfico HTTP claro;
3. configurar exclusivamente la URL HTTPS de producción;
4. crear una clave de carga privada y configurar firma `release` fuera del repositorio;
5. aumentar `versionCode` y revisar `versionName`;
6. generar un AAB firmado;
7. probar el artefacto de publicación en un canal interno o cerrado;
8. completar ficha, capturas, clasificación, seguridad de datos y política de privacidad;
9. comprobar permisos y compatibilidad con el nivel objetivo vigente.

## Monitoreo y respuesta a fallos

Producción debe observar, como mínimo:

- disponibilidad y latencia de `/api/health`;
- tasa de respuestas 4xx y 5xx por ruta sin registrar cuerpos sensibles;
- errores de conexión a PostgreSQL y fallos de persistencia;
- entregas FCM fallidas y tokens inválidos;
- espacio, conexiones y duración de respaldo;
- versión del backend y de la aplicación afectada.

Una alerta debe conducir a un procedimiento: identificar alcance, contener, restaurar servicio, validar datos y documentar acciones sin copiar secretos o información personal.

## Criterios para pruebas con usuarios reales

- no existen errores críticos conocidos en el flujo principal;
- backend disponible de forma estable mediante HTTPS;
- datos de prueba separados de producción;
- consentimiento y política disponibles;
- respaldo y restauración comprobados;
- canal para reportar errores y retirar participantes;
- observación de fallos sin recolectar contenido sensible;
- versión firmada e identificable;
- alcance, duración y responsabilidades comunicados a los participantes.
