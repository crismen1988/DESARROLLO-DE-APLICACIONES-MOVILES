# Roadmap del backend

## Base implementada

- Autenticacion local con JWT.
- Catalogo de categorias y puntos de interes.
- Reseñas con promedio transaccional.
- Cache Redis y trabajos BullMQ.
- Validacion global de DTOs.

## Completado al 2026-09-06

- Registro de turistas y prestadores con RUC.
- Refresh tokens, logout y cambio de contraseña.
- Favoritos, eventos y reportes basicos.
- Edicion de reseñas y POIs con autorizacion.
- Rate limiting, Swagger y filtro global de errores.
- Planes y tareas detallados para las features.
- Recuperacion de contraseña por token hasheado de un solo uso.
- Paginacion, filtros, busqueda, horarios, imagenes y contactos de POIs.
- Perfil visual, datos personales y actividad privada paginada.

## Siguiente trabajo

1. Recuperacion de contraseña y pruebas e2e completas.
2. Paginacion, filtros y busqueda.
3. Horarios, imagenes y contactos de POIs.
4. Notificaciones push reales.
5. Rate limiting distribuido con Redis.
6. Auditoria administrativa y verificacion externa del RUC.
