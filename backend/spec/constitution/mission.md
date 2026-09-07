# Mision de BañosTour

BañosTour conecta a turistas, habitantes locales y proveedores con informacion turistica confiable de Baños de Agua Santa.

## Alcance del backend

- Exponer una API REST para POIs, categorias, reseñas, favoritos, eventos y reportes.
- Proteger operaciones privadas mediante autenticacion y autorizacion.
- Mantener la integridad de la informacion con PostgreSQL y Prisma.
- Soportar cache, trabajos asincronos y clientes moviles con conectividad variable.

## Principios

- La informacion publica se puede consultar sin cuenta.
- Toda escritura se valida en el backend y en la base de datos cuando sea posible.
- Los usuarios solo pueden modificar sus propios recursos, salvo administradores.
- Los proveedores solo administran POIs que les pertenecen y hayan sido verificados.
- No se exponen contraseñas, hashes ni secretos; los tokens de sesion solo se entregan en las respuestas de autenticacion que los requieren.
