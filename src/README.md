# Implementación del backend

## Entrada y estructura

- `src/main.ts`: inicia NestJS, carga `.env`, configura CORS, encabezados y prefijo `/api`.
- `src/nest.module.ts`: declara controladores HTTP y guardas RBAC.
- `src/controllers/`: lógica de autenticación, tours, lugares, reservas, mensajes, perfiles, administración y notificaciones.
- `src/db/store.ts`: adaptación entre los tipos de la API y las tablas relacionales de Prisma, carga inicial y cola de escritura.
- `src/security/`: JWT, renovación, contraseñas, cifrado y filtro global de errores.
- `src/services/fcm.service.ts`: envío opcional mediante Firebase Cloud Messaging.
- `prisma/`: esquema y migraciones de PostgreSQL.

## Seguridad implementada

- Contraseñas derivadas con scrypt y sal aleatoria.
- Tokens JWT de acceso con duración de una hora.
- Sesiones de renovación de siete días, almacenadas como hash y rotadas en cada uso.
- Cookie de renovación HttpOnly.
- Autenticación biométrica mediante desafío firmado por una clave protegida en el dispositivo.
- Roles `turista`, `operador` y `admin` comprobados en el servidor.
- CORS restringido a orígenes conocidos y configurables.
- AES-256-GCM para campos sensibles de reservas.
- Límite de 4 MB para cuerpos HTTP.

## Endpoints vigentes

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/auth/login` | Público |
| POST | `/api/auth/register` | Público |
| POST | `/api/auth/forgot-password` | Público |
| POST | `/api/auth/reset-password` | Público |
| POST | `/api/auth/biometric` | Desafío biométrico |
| POST | `/api/auth/biometric/enroll` | Autenticado |
| POST | `/api/auth/biometric/revoke` | Autenticado |
| POST | `/api/auth/refresh` | Cookie de renovación |
| POST | `/api/auth/logout` | Sesión actual |
| GET | `/api/tours` | Público |
| POST | `/api/tours` | Operador o administrador |
| PUT | `/api/tours/:id` | Propietario o administrador |
| PUT | `/api/tours/:id/availability` | Operador o administrador |
| DELETE | `/api/tours/:id` | Propietario o administrador |
| GET | `/api/places` | Público |
| GET | `/api/puntos-interes` | Público |
| GET | `/api/places/:id` | Público |
| POST/PUT/DELETE | `/api/places` | Operador o administrador |
| GET | `/api/bookings` | Autenticado y filtrado por rol |
| POST | `/api/bookings` | Turista |
| PUT | `/api/bookings/:id/status` | Operador o administrador |
| GET/POST | `/api/messages` | Autenticado |
| GET | `/api/usuarios/perfil` | Autenticado |
| PUT | `/api/usuarios/perfil` | Autenticado |
| GET | `/api/admin/users` | Administrador |
| PUT | `/api/admin/users/:id/verify` | Administrador |
| PUT | `/api/admin/usuarios/:id/rol` | Administrador |
| GET | `/api/admin/analytics` | Administrador |
| GET | `/api/notifications` | Público |
| POST | `/api/notifications/broadcast` | Administrador |
| POST | `/api/notifications/device` | Autenticado |
| DELETE | `/api/notifications/device` | Autenticado |
| GET | `/api/health` | Público |

## Persistencia

`DatabaseStore` carga las tablas relacionales al iniciar y conserva en memoria las representaciones que esperan los controladores. Cada mutación se serializa mediante una cola y se confirma dentro de una transacción Prisma antes de responder. La API mantiene así su contrato actual mientras PostgreSQL conserva usuarios, servicios, lugares, reservas, mensajes, notificaciones y sesiones en tablas separadas.

En una instalación antigua, el proceso consulta el marcador `DataMigration`. Si la importación todavía no ocurrió, transforma el respaldo `AppState`, persiste las entidades y crea el marcador `app-state-to-relational-v1`. En los siguientes inicios solo se leen las tablas relacionales. El documento antiguo no recibe nuevas escrituras.

La eliminación de tours y lugares es lógica mediante `active`; las reservas conservan sus relaciones. Redis no está configurado ni es necesario para ejecutar la aplicación.

