# BañosTour - Backend

Corte documental: **2026-09-06**, rama `banostour_version2`. Resultados de esta revisión en [VERIFICACION-ENTORNO.md](../docs/VERIFICACION-ENTORNO.md).

Backend de BañosTour, una aplicación turística para consultar puntos de interés de la ciudad de Baños. El proyecto está construido con NestJS, TypeScript, Prisma y PostgreSQL. Incorpora Redis como caché, BullMQ como cola de trabajo y JWT para autenticación.

## Descripción

El backend diagnostica y mejora la consulta de puntos de interés. Se implementan los siguientes aspectos:

1. Identificación de una operación costosa.
2. Detección y corrección de una consulta N+1.
3. Caché con estrategia cache-aside, TTL de 60 segundos e invalidación explícita.
4. Procesamiento asíncrono mediante BullMQ y Redis.
5. Uso justificado de eager loading y carga bajo demanda.
6. Autenticación JWT con refresh tokens rotatorios y verificación de usuario activo.
7. Pruebas comparativas con Postman.

## Stack tecnológico

- Node.js 22 o superior.
- NestJS 11.
- TypeScript 5.
- Prisma 7.
- PostgreSQL.
- Redis.
- BullMQ.
- JWT y bcryptjs.

## Estructura

```text
backend/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
└── src/
    ├── auth/                # Registro, RUC, login, JWT y refresh tokens
    ├── categorias/          # CRUD de categorías
    ├── eventos/             # Eventos turísticos
    ├── favoritos/           # Favoritos por usuario
    ├── notificaciones/      # Cola y worker BullMQ
    ├── puntos-interes/      # Consulta N+1, consulta optimizada y caché
    ├── prisma/              # Cliente Prisma para PostgreSQL
    ├── reportes/            # Reportes de incidencias
    ├── redis/               # Cliente Redis tolerante a fallos
    ├── resenas/             # Transacción y encolado de notificación
    └── usuarios/            # Perfil y administración
```

## Configuración local

Desde la raíz del proyecto:

```bash
copy .env.example .env
docker compose up -d
```

Configura en `.env` al menos:

```env
DATABASE_URL=postgresql://banostour_user:replace_with_local_password@localhost:5433/banostour
REDIS_URL=redis://localhost:6380
JWT_SECRET=una-clave-larga-y-segura-para-desarrollo
PASSWORD_RESET_URL=http://localhost:5173/reset-password
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=correo@example.com
MAIL_PASSWORD=una-clave-smtp-segura
MAIL_FROM=BañosTour <correo@example.com>
ADMIN_EMAIL=admin@banostour.local
ADMIN_PASSWORD=una-clave-de-administrador-de-12-o-mas-caracteres
ADMIN_NAME=Administrador Maestro
CACHE_TTL_SECONDS=60
PORT=3000
NODE_ENV=development
ENABLE_SWAGGER=true
CORS_ORIGINS=http://localhost:5173,http://192.168.1.18:5173,http://localhost,capacitor://localhost
```

Desde `backend`:

```bash
npm install
npm run generate
npm run build
npx prisma migrate deploy
npm run start:dev

# Crear o actualizar el administrador maestro
npm run seed:admin
```

Las migraciones de base de datos se encuentran dentro de `prisma/migrations/` y se aplican con `npx prisma migrate deploy`.

## Modelo de datos

El modelo contiene:

- `Categoria`: clasificación de los lugares turísticos.
- `Usuario`: credenciales, rol y estado de la cuenta.
- `PuntoInteres`: nombre, descripción, ubicación, estado y categoría.
- `Resena`: calificación única por usuario y punto de interés.
- `PasswordResetToken`: recuperación con hash, expiración y marca de uso.
- `HorarioPuntoInteres`, `ImagenPuntoInteres` y `ContactoPuntoInteres`: datos complementarios normalizados.
- `RefreshToken`: tokens de actualización almacenados únicamente como hash.
- `Favorito`: relación usuario-POI con clave compuesta.
- `Evento`: evento turístico con fechas, estado y creador.
- `Reporte`: incidencia sobre un POI con estado de moderación.
- `TipoCuenta` y `EstadoVerificacion`: flujo de turista y prestador con RUC.
- Los prestadores almacenan razón social, nombre comercial, actividad turística, teléfono, dirección, ciudad y sitio web opcional.

La relación `PuntoInteres -> Categoria` se carga de forma eager en la consulta optimizada. Las reseñas se cargan únicamente en el detalle del punto cuando se solicita `GET /puntos-interes/:id`.

## Diagnóstico: operación costosa y N+1

La operación analizada es el listado de puntos de interés:

```http
GET /puntos-interes
```

La versión didáctica del problema está disponible en:

```http
GET /puntos-interes/demo/n-plus-one
```

Su flujo es:

1. Consulta todos los puntos activos.
2. Por cada punto consulta su categoría.
3. Por cada punto consulta sus reseñas.

Con `N` puntos se generan aproximadamente `1 + 2N` consultas. Esta implementación se conserva únicamente como referencia de diagnóstico.

La versión optimizada realiza un conteo y un listado paginado en una transacción Prisma. El listado usa `select` con relaciones incluidas y evita las consultas explícitas por cada POI; esto no equivale necesariamente a una sola sentencia SQL:

```ts
categoria: { select: { id: true, nombre: true } },
resenas: { select: { calificacion: true } },
```

También devuelve solamente los campos necesarios para el listado y calcula el promedio en memoria a partir de los datos ya obtenidos.

## Caché cache-aside

La ruta `GET /puntos-interes` aplica este flujo:

1. Busca una clave con prefijo `banostour:puntos-interes:activos:v1` y sufijos de página, límite, búsqueda y categoría en Redis.
2. Si existe, devuelve los datos con `fuente: cache`.
3. Si no existe, consulta PostgreSQL.
4. Guarda el resultado en Redis durante 60 segundos.
5. Devuelve los datos con `fuente: base-de-datos`.

Crear, editar o desactivar un POI invalida las claves con ese prefijo. El TTL se configura con `CACHE_TTL_SECONDS` (60 segundos por defecto). La consulta acepta `pagina`, `limite`, `busqueda` y `categoriaId`, y devuelve `fuente`, `pagina`, `limite`, `total` y `datos`.

## Carga de relaciones

- **Eager loading:** se usa en el listado porque la categoría es necesaria para pintar cada tarjeta del mapa o catálogo y se puede obtener en la misma consulta.
- **Carga bajo demanda:** las reseñas completas se consultan en `GET /puntos-interes/:id`, porque no son necesarias para el listado y podrían aumentar el tamaño de la respuesta.

## Cola de trabajo y worker

Al crear una reseña mediante `POST /resenas`, el backend:

1. Valida la solicitud.
2. Crea la reseña y actualiza el promedio dentro de una transacción Prisma.
3. Encola una notificación en BullMQ.
4. Devuelve la respuesta sin esperar el envío de la notificación.
5. El worker procesa el trabajo en segundo plano.

En esta etapa el worker registra el procesamiento en consola. La integración futura con Firebase Cloud Messaging o Apple Push Notification Service puede reemplazar ese punto sin modificar la operación principal.

## Autenticación sin consultas redundantes

Endpoints disponibles:

```http
POST /auth/registro
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

El registro acepta `TURISTA` o `PRESTADOR_TURISTICO`. El prestador debe presentar un RUC ecuatoriano válido y queda pendiente de aprobación administrativa. El login compara el hash con bcryptjs y genera access/refresh tokens.

`GET /auth/me` valida la firma, expiración y estado activo del usuario. Los refresh tokens duran siete días, se rotan al usarse y se guardan en PostgreSQL únicamente como hash.

### Recuperación segura de contraseña

```http
POST /auth/forgot-password
POST /auth/reset-password
```

La solicitud de recuperación siempre devuelve el mismo mensaje, exista o no la cuenta, para evitar enumeración de usuarios. El enlace se envía por SMTP, expira en 15 minutos, se almacena únicamente como hash SHA-256 y solo puede utilizarse una vez. Al completar el cambio se revocan todos los refresh tokens del usuario. En producción, `PASSWORD_RESET_URL` debe apuntar a un dominio HTTPS o a un enlace profundo de la aplicación y las credenciales SMTP deben mantenerse únicamente en variables de entorno o en un gestor de secretos.

### Favoritos, eventos, reportes y usuarios

```http
GET    /favoritos                 # autenticado
POST   /favoritos/:puntoInteresId # autenticado
DELETE /favoritos/:puntoInteresId # autenticado
GET    /eventos                   # público, publicados y vigentes
POST   /eventos                   # proveedor verificado o administrador
POST   /reportes                  # autenticado
GET    /usuarios/perfil           # autenticado
GET    /usuarios/perfil/actividad # autenticado, tipo y pagina
PATCH  /usuarios/perfil           # autenticado
PATCH  /usuarios/perfil/password  # autenticado
GET    /usuarios                  # administrador
PATCH  /usuarios/:id              # administrador
PATCH  /eventos/:id               # creador o administrador
GET    /reportes                  # administrador
PATCH  /reportes/:id              # administrador
```

Las escrituras de categorías requieren administrador. La creación de POIs requiere proveedor verificado o administrador; los proveedores quedan asociados como propietarios.

Los datos adicionales del POI se administran mediante `PATCH /puntos-interes/:id/horarios`, `POST /puntos-interes/:id/imagenes` y `PATCH /puntos-interes/:id/contacto`. Las imágenes solo aceptan URLs HTTPS y se guardan como metadatos.

## Pruebas en Postman

Las escrituras requieren `Authorization: Bearer <accessToken>` con el rol indicado. Crear primero el administrador mediante el seed y obtener su token con login.

### 1. Crear una categoría

```http
POST http://localhost:3000/categorias
Content-Type: application/json

{
  "nombre": "Cascadas",
  "descripcion": "Atractivos naturales con caídas de agua"
}
```

### 2. Crear un punto de interés

```http
POST http://localhost:3000/puntos-interes
Content-Type: application/json

{
  "nombre": "Cascada de Agoyán",
  "descripcion": "Cascada turística cercana a Baños",
  "direccion": "Vía Baños - Puyo",
  "latitud": -1.3965,
  "longitud": -78.3197,
  "categoriaId": 1
}
```

### 3. Comparar N+1 contra la versión optimizada

Ejecuta varias veces:

```http
GET http://localhost:3000/puntos-interes/demo/n-plus-one
GET http://localhost:3000/puntos-interes
GET http://localhost:3000/puntos-interes
```

La primera llamada optimizada debe indicar `fuente: base-de-datos`; la segunda debe indicar `fuente: cache`. En Postman registra el tiempo de respuesta de cada operación. Con varios puntos de interés, la ruta N+1 genera más consultas y la ruta optimizada reutiliza el resultado desde Redis.

### 4. Probar autenticación

```http
POST http://localhost:3000/auth/registro
Content-Type: application/json

{
  "correo": "turista@banostour.local",
  "nombre": "Turista Demo",
  "password": "Password123"
}
```

Usa el `accessToken` recibido:

```http
GET http://localhost:3000/auth/me
Authorization: Bearer <accessToken>
```

### 5. Probar la cola

Con el token anterior:

```http
POST http://localhost:3000/resenas
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "puntoInteresId": 1,
  "calificacion": 5,
  "comentario": "Un lugar muy recomendable"
}
```

La respuesta se obtiene de inmediato y el procesamiento de la notificación aparece en la consola del worker.

## Comparación antes y después

| Aspecto | Antes | Después |
|---|---|---|
| Listado de POIs | Consulta principal más consultas por cada POI | Conteo y listado paginado con relaciones seleccionadas |
| Carga de relaciones | Categoría y reseñas consultadas dentro de un ciclo | Eager loading controlado y selección de campos |
| Repetición de listados | PostgreSQL en cada petición | Redis con TTL de 60 segundos |
| Datos modificados | Caché potencialmente obsoleta | Invalidación por prefijo al crear, editar o desactivar un POI |
| Notificación | Podría bloquear la respuesta | Trabajo asíncrono en BullMQ |
| Validación JWT | Solo firma y expiración | Firma, expiración y usuario activo |

Los tiempos exactos deben registrarse desde Postman después de iniciar PostgreSQL y Redis. La comparación debe hacerse con la misma cantidad de datos y varias repeticiones para que el resultado sea representativo.

## Seguridad implementada

- Validación global estricta de DTOs.
- Validación automática del RUC ecuatoriano.
- Aprobación administrativa de prestadores.
- Guards de JWT y roles.
- Rechazo de usuarios inactivos en peticiones autenticadas.
- Refresh tokens rotatorios, hasheados y revocables.
- Cabeceras HTTP defensivas y CORS restringido.
- Rate limiting global y límites reforzados para autenticación.
- Swagger/OpenAPI disponible en `/api/docs` y `/api/docs-json` cuando `ENABLE_SWAGGER=true`; debe permanecer deshabilitado en producción salvo que se proteja adicionalmente.
- Límite de 100 KB para cuerpos JSON y URL-encoded.
- Normalización de correos a minúsculas y límites máximos para credenciales.
- Respuestas sin hashes, contraseñas ni secretos.
- Ruta de diagnóstico N+1 disponible solo fuera de producción.
- Claves foráneas, índices y unicidad en PostgreSQL.

## Pendientes conocidos

- Moderación avanzada de eventos y reportes.
- Verificar entrega real de recuperación por SMTP y completar sus pruebas automatizadas.
- Notificaciones push persistentes.
- Rate limiting distribuido para múltiples instancias.
- Auditoría histórica de acciones administrativas.
- Verificación externa del RUC con el SRI.
- Pruebas de integración y seguridad ampliadas.
- Revisión final del almacenamiento de tokens en Android/iOS.

## Estado actual

El backend utiliza NestJS 11, Prisma 7, PostgreSQL, Redis, BullMQ, JWT y bcryptjs. En el entorno local se verificó:

- `npm run build`: aprobado.
- `npm test -- --runInBand`: 6 suites y 9 pruebas aprobadas.
- `npm run test:e2e -- --runInBand`: 3 suites y 11 pruebas HTTP aprobadas.
- ESLint del backend: aprobado sin errores ni advertencias.
- Prisma Client 7.9.1 generado correctamente.

Para iniciar los servicios:

~~~powershell
cd D:\PROYECTO_APP_MOVILES\banostour
docker compose up -d

cd backend
npx prisma migrate deploy
npm run start:dev
~~~

La API escucha en el puerto 3000. Sus endpoints de autenticación son:

~~~http
POST /auth/registro
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/me
~~~

La comprobación de persistencia desde pgAdmin se realiza en http://localhost:5050, conectando al servidor PostgreSQL con host postgres, puerto 5432, base banostour y el usuario configurado en .env:

~~~sql
SELECT id, nombre, correo, rol, activo, creado_en
FROM usuarios
ORDER BY id DESC;
~~~

La aplicación móvil utiliza este backend desde el teléfono físico mediante http://192.168.1.18:3000 o desde un emulador Android mediante http://10.0.2.2:3000.

- [x] Diagnóstico de operación costosa.
- [x] Ruta demostrativa con N+1.
- [x] Ruta optimizada con eager loading y `select`.
- [x] Caché cache-aside con TTL e invalidación.
- [x] Worker asíncrono con BullMQ.
- [x] Autenticación JWT con comprobación de usuario activo.
- [x] Refresh tokens rotatorios, revocables y almacenados como hash.
- [x] Registro de turistas y prestadores con validación de RUC.
- [x] Favoritos, eventos, reportes y administración básica de usuarios.
- [x] Las 14 migraciones Prisma aplicadas y comprobadas con `npx prisma migrate status` el 2026-09-06.
- [x] Rate limiting global y específico para autenticación.
- [x] Swagger/OpenAPI configurable mediante `ENABLE_SWAGGER`.
- [x] Filtro global de excepciones y errores Prisma.
- [x] Pruebas e2e básicas de seguridad y validación.
- [x] Paginación, búsqueda y filtro por categoría del catálogo.
- [x] Horarios, imágenes HTTPS y contactos de POIs.
- [x] Validación de DTOs y restricciones de base de datos.
- [ ] Registrar tiempos reales en Postman con PostgreSQL y Redis levantados.
- [ ] Reemplazar el log del worker por notificaciones push reales.

La auditoría de dependencias debe ejecutarse con conexión a npm mediante `npm audit --audit-level=high`; su resultado depende del estado actual del registro y no se declara como aprobado sin evidencia de esa ejecución. Prisma permanece en la versión 7.9.1 y las pruebas e2e se ejecutan con `npm run test:e2e` usando el modo de módulos requerido por Prisma 7.
