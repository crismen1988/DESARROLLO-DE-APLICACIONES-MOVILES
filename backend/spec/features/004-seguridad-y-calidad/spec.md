# 004 Seguridad y calidad

## Objetivo

Reducir exposicion y hacer predecible el comportamiento de la API.

## Controles

- Cabeceras HTTP defensivas y CORS con lista permitida.
- Rate limiting en login, registro y escrituras.
- Filtro global para errores de Prisma y errores no controlados.
- Limites de body y validacion estricta de DTOs.
- Logs sin contraseñas, tokens ni datos personales innecesarios.
- Swagger/OpenAPI actualizado junto con cada endpoint.
- Pruebas unitarias, de integracion y de autorizacion.
