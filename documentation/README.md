# Documentación OpenAPI

Este directorio contiene la documentación OpenAPI generada para la API de BañosTour.

## Estructura

- `schemas/` - Documentación individual de cada módulo
- `openapi.ts` - Configuración principal de OpenAPI
- `registry.ts` - Registro de esquemas y rutas
- `responses/` - Esquemas de respuesta comunes

## Uso

La documentación se genera automáticamente y está disponible en `GET /api/docs`.

## Módulos Documentados

- `auth` - Autenticación y autorización
- `users` - Gestión de usuarios
- `organizaciones-sedes` - Organizaciones y sedes
- `roles-permisos` - Roles y permisos
- `reservas` - Reservas y agendamiento
- `tours` - Tours y actividades
- `places` - Lugares y atracciones
- `bookings` - Reservas de tours
- `chat` - Chat y mensajería
- `notifications` - Notificaciones
- `community` - Comunidad
- `profile` - Perfil de usuario
- `admin` - Administración
- `system` - Sistema
- `error-response` - Manejo de errores
- `menus` - Menús de navegación
- `ai` - Integración IA