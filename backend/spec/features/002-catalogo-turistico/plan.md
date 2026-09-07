# Plan tecnico: catalogo turistico

## Alcance

Gestionar categorias y POIs de BañosTour, separando lectura publica de operaciones de proveedores y administradores.

## Implementacion actual

1. `src/categorias/`: CRUD con escritura administrativa.
2. `src/puntos-interes/`: listado optimizado, detalle, cache y operaciones de propietario.
3. `src/auth/roles.guard.ts`: autorizacion por rol.
4. Prisma: categorias, POIs, horarios, imagenes, contacto, propietario y estados.
5. Redis: cache-aside por pagina, limite, busqueda y categoria; invalidacion por prefijo.

## Reglas

- Solo se publican POIs activos.
- Proveedores no verificados no publican.
- Un proveedor solo modifica sus propios POIs.
- Administradores pueden moderar.
- Coordenadas, categorias e identificadores se validan antes de persistir.
- El borrado de POIs es logico.

## Validacion

- Comprobar 401, 403 y 404.
- Comprobar propiedad cruzada entre proveedores.
- Comprobar invalidacion de cache.
- Comprobar que datos inactivos no aparezcan en lecturas publicas.
