# Stack y convenciones de BañosTour

- Runtime: Node.js 22 o superior.
- API: NestJS y TypeScript estricto.
- Base de datos: PostgreSQL mediante Prisma.
- Cache y trabajos: Redis, ioredis y BullMQ.
- Autenticacion: JWT de acceso y refresh token rotatorio.
- Validacion: DTOs de Nest con class-validator y restricciones Prisma/PostgreSQL.
- Clientes: Ionic React y Capacitor.
- Pruebas: Jest unitario e integracion HTTP.

## Convenciones

- Los controladores coordinan HTTP; las reglas viven en servicios.
- Las consultas complejas deben encapsularse en repositorios del modulo.
- Toda entrada externa se valida antes de llegar al servicio.
- Las respuestas no incluyen secretos, hashes ni errores internos.
- Las rutas publicas incluyen lectura turistica y registro, login, refresh, logout y recuperacion de acceso.
- Las escrituras de recursos turisticos y perfiles requieren autenticacion y autorizacion; autenticacion y recuperacion validan sus propias credenciales o tokens.
- Las migraciones son incrementales y no se modifican despues de aplicarse.
