# Docker y acceso local

## Requisitos

- Docker Desktop en ejecuciÃ³n.
- Archivo `.env.local` en la raÃ­z.
- Puertos libres: 3000, 5051, 5432 y 6379.

## Iniciar todos los servicios

```powershell
docker compose --env-file .env.local up -d --build
docker compose --env-file .env.local ps
```

Servicios:

| Servicio | DirecciÃ³n |
|---|---|
| Frontend y API | http://127.0.0.1:3000 |
| Salud API | http://127.0.0.1:3000/api/health |
| pgAdmin | http://127.0.0.1:5051 |
| PostgreSQL | 127.0.0.1:5432 |
| Redis | 127.0.0.1:6379 |

## Credenciales locales

### AplicaciÃ³n

| Rol | Correo | ContraseÃ±a |
|---|---|---|
| Administrador | admin@banostour.ec | <CONFIGURA_ADMIN_PASSWORD> |
| Operador | operador@banostour.ec | operador123 |

### pgAdmin

- Correo: `admin@banostour.ec`
- ContraseÃ±a: `<CONFIGURA_PGADMIN_PASSWORD>`

### PostgreSQL

- Host desde pgAdmin: `postgres`
- Puerto: `5432`
- Base: `banostour_db`
- Usuario: `banos_user`
- ContraseÃ±a: `<CONFIGURA_POSTGRES_PASSWORD>`

El servidor se registra automÃ¡ticamente en pgAdmin como `BaÃ±osTour PostgreSQL`. La informaciÃ³n activa se encuentra principalmente en `public.AppState`.

## Mantenimiento

```powershell
docker compose --env-file .env.local logs -f app
docker compose --env-file .env.local restart app
docker compose --env-file .env.local down
```

Para aplicar migraciones y reconstruir:

```powershell
docker compose --env-file .env.local up -d --build
```

Los volÃºmenes `postgres_data`, `redis_data` y `pgadmin_data` conservan datos al detener contenedores. No use `docker compose down -v` salvo que desee borrar los datos locales.

## Dispositivo Android

```powershell
adb reverse tcp:3000 tcp:3000
```

Esta redirecciÃ³n permite que la app instalada resuelva `localhost:3000` contra el equipo. Debe repetirse despuÃ©s de reconectar o reiniciar el dispositivo.
