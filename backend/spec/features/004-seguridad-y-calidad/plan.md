# Plan tecnico: seguridad y calidad

## Controles actuales

- `ValidationPipe` global con whitelist y rechazo de propiedades desconocidas.
- Cabeceras HTTP defensivas y CORS restringido.
- Rate limiting global y limites reforzados en autenticacion.
- Filtro global para errores HTTP y Prisma conocidos.
- Swagger en `/api/docs` y `/api/docs-json`.
- Prisma con claves foraneas, unicidad, indices y migraciones.
- Auditoria npm: debe ejecutarse y fecharse; no hay resultado vigente en esta revision.

## Validacion

- Build de produccion.
- Pruebas unitarias.
- Pruebas de autorizacion.
- Pruebas de abuso de login.
- Revisión de secretos en logs y respuestas.
- Pruebas e2e contra PostgreSQL y Redis aislados.

## Riesgos pendientes

- El rate limit en memoria no es suficiente para multiples instancias si no se migra a Redis.
- Las pruebas actuales no cubren toda la API.
- La auditoria automatizada no sustituye un pentest.
