# Plan tecnico: favoritos, eventos y reportes

## Alcance

Permitir personalizacion y colaboracion comunitaria sin exponer datos privados.

## Implementacion actual

1. `src/favoritos/`: favoritos por usuario con clave compuesta.
2. `src/eventos/`: lectura publica de eventos vigentes y escritura autorizada.
3. `src/reportes/`: creacion de incidencias y moderacion administrativa.
4. Prisma: relaciones, estados, indices y claves foraneas.

## Reglas

- Un usuario no duplica un favorito.
- Los eventos publicos deben estar publicados y vigentes.
- Solo creadores autorizados o administradores editan eventos.
- Solo usuarios autenticados crean reportes.
- Solo administradores revisan y cambian estados de reportes.
- Las respuestas publicas excluyen identidad del reportante.

## Validacion

- Probar propiedad y roles.
- Probar fechas de evento.
- Probar POI existente y activo.
- Probar duplicados y relaciones inexistentes.
