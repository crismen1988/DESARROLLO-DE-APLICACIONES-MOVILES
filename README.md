# BañosTour Backend

API REST independiente de BañosTour, construida con NestJS, TypeScript, Prisma y PostgreSQL. La carpeta `backend` está preparada para publicarse en un repositorio separado del frontend.

## Tecnologías

- Node.js 20 o superior.
- NestJS 11 con adaptador Express.
- TypeScript 5.
- Prisma 6 y PostgreSQL 16.
- JWT, cookie de renovación HttpOnly, scrypt y RBAC.
- Firebase Cloud Messaging opcional para notificaciones push.

Redis no forma parte de la implementación actual.

## Instalación local

```powershell
Copy-Item .env.example .env
npm install
docker compose up -d postgres pgadmin
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

La API queda disponible en `http://localhost:3000/api`. El endpoint de salud es `http://localhost:3000/api/health`.

## Variables de entorno

| Variable | Uso |
|---|---|
| `PORT` | Puerto HTTP de la API. |
| `NODE_ENV` | Entorno de ejecución. |
| `DATABASE_URL` | Conexión de Prisma a PostgreSQL. |
| `AES_SECRET_KEY` | Clave privada utilizada para cifrado AES. |
| `ADMIN_EMAIL` | Correo del administrador inicial en producción. |
| `ADMIN_PASSWORD` | Contraseña inicial del administrador; mínimo 12 caracteres en producción. |
| `CORS_ORIGINS` | Orígenes web permitidos, separados por comas. |
| `FIREBASE_PROJECT_ID` | Proyecto de Firebase para push. |
| `FIREBASE_CLIENT_EMAIL` | Cuenta de servicio de Firebase. |
| `FIREBASE_PRIVATE_KEY` | Clave privada de Firebase. |

Los valores reales deben mantenerse únicamente en `.env`, archivo excluido de Git.

El repositorio funciona de forma independiente: no importa archivos del frontend ni de la carpeta superior. Conserva juntos `src`, `prisma`, `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`, `.env.example` y este README.

## Docker

El `docker-compose.yml` del backend inicia API, PostgreSQL y pgAdmin.

```powershell
docker compose up -d --build
docker compose ps
```

Para detener sin borrar datos:

```powershell
docker compose stop
```

No uses `docker compose down -v` si deseas conservar los volúmenes.

## Comunicación con el frontend

- Web local: `CORS_ORIGINS=http://localhost:5173`.
- Capacitor: el backend permite los orígenes locales utilizados por Android.
- Dispositivo USB: configura `adb reverse tcp:3000 tcp:3000`.
- Red local: usa la IP del equipo y permite el puerto 3000.
- Producción: publica la API con HTTPS y registra el origen real del frontend.

## Persistencia

PostgreSQL es la fuente de verdad y Prisma escribe en las tablas relacionales `User`, `Tour`, `Place`, `Booking`, `ChatMessage`, `PushNotification` y `RefreshSession`. Las relaciones, valores únicos e índices se declaran en `prisma/schema.prisma` y se aplican mediante migraciones versionadas.

La migración `20261004_relational_persistence` importa una sola vez los datos de instalaciones anteriores. `AppState` se conserva únicamente como respaldo histórico de esa transición y ya no recibe escrituras de la API. `DataMigration` registra que la importación terminó para impedir que el documento antiguo vuelva a sobrescribir las tablas.

Tours y lugares utilizan eliminación lógica mediante `active`. Así se ocultan del catálogo sin romper reservas o relaciones históricas. Las sesiones de renovación almacenan solamente el hash del token y su vencimiento.

Después de obtener cambios del esquema ejecuta:

```powershell
npm run prisma:generate
npm run prisma:deploy
```

`prisma:deploy` aplica migraciones pendientes sin crear una migración nueva. Para inspección local se puede usar `npm run prisma:studio`; no deben modificarse relaciones manualmente mientras la API esté escribiendo.

## Verificación

```powershell
npm run lint
npm run build
npx prisma validate --schema=./prisma/schema.prisma
npx prisma migrate status --schema=./prisma/schema.prisma
```

## Archivos privados

No publiques `.env`, claves de Firebase, copias de base de datos, logs, `node_modules` ni `dist`.
