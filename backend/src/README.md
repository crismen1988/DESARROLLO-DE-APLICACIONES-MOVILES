# Backend de BañosTour

## Tecnologías

- NestJS 11 con adaptador Express.
- TypeScript 5.
- Prisma 6.
- PostgreSQL 16.
- Redis 7 provisionado para evolución futura.
- Autenticación JWT HMAC-SHA256, renovación rotatoria y RBAC.

Entrada principal: `server.ts`.  
Módulo y rutas NestJS: `server/nest.module.ts`.  
Prefijo global: `/api`.

## Persistencia

Los controladores trabajan actualmente con un almacén tipado que se persiste como JSON en `AppState`. El resto de modelos Prisma describe la normalización prevista. Esta separación debe considerarse al consultar pgAdmin: las tablas pueden estar vacías aunque `AppState` contenga usuarios, tours y reservas.

## Seguridad

- Contraseñas derivadas con scrypt.
- JWT de acceso con vigencia de una hora.
- Renovación de siete días mediante cookie HttpOnly y rotación de token.
- Validación de roles en NestJS.
- CORS para `https://localhost`, `capacitor://localhost` y orígenes configurados.
- AES-256-CBC disponible para campos sensibles.
- Recuperación de contraseña simulada solo en desarrollo; en producción requiere correo.

## API

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/auth/login` | Público |
| POST | `/api/auth/register` | Público |
| POST | `/api/auth/forgot-password` | Público |
| POST | `/api/auth/reset-password` | Público |
| POST | `/api/auth/biometric` | Público con identidad biométrica |
| POST | `/api/auth/refresh` | Cookie de renovación |
| POST | `/api/auth/logout` | Sesión |
| GET | `/api/tours` | Público |
| POST | `/api/tours` | Operador o administrador |
| PUT | `/api/tours/:id` | Operador propietario o administrador |
| PUT | `/api/tours/:id/availability` | Operador o administrador |
| DELETE | `/api/tours/:id` | Operador propietario o administrador; sin reservas activas |
| GET | `/api/places`, `/api/puntos-interes` | Público |
| GET | `/api/places/:id` | Público |
| POST/PUT/DELETE | `/api/places` | Operador o administrador |
| GET | `/api/bookings` | Autenticado |
| POST | `/api/bookings` | Turista |
| PUT | `/api/bookings/:id/status` | Operador o administrador |
| GET/POST | `/api/messages` | Autenticado |
| GET | `/api/admin/users` | Administrador |
| PUT | `/api/admin/users/:id/verify` | Administrador |
| GET | `/api/admin/analytics` | Administrador |
| GET/PUT | `/api/usuarios/perfil` | Autenticado |
| GET/POST/DELETE | `/api/favoritos` | Autenticado |
| GET | `/api/resenas` | Público |
| POST/PUT/DELETE | `/api/resenas` | Autenticado |
| GET | `/api/eventos` | Público |
| POST/PUT/DELETE | `/api/eventos` | Operador o administrador |
| POST | `/api/reportes` | Autenticado |
| GET | `/api/reportes` | Administrador |
| GET | `/api/notifications` | Público |
| POST | `/api/notifications/broadcast` | Administrador |
| GET | `/api/health` | Público |
| GET | `/api/system/architecture` | Administrador |

## Desarrollo

```powershell
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

## Pruebas y compilación

```powershell
npm run lint
npm run test:api
npm run build
```
