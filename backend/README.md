# BañosTour - Backend

Backend de BañosTour, una aplicación turística para consultar puntos de interés de la ciudad de Baños. El proyecto está construido con NestJS, TypeScript, Prisma y PostgreSQL. Incorpora Redis como caché, BullMQ como cola de trabajo y JWT para autenticación.

## Descripción

El backend diagnostica y mejora la consulta de puntos de interés. Se implementan los siguientes aspectos:

1. Identificación de una operación costosa.
2. Detección y corrección de una consulta N+1.
3. Caché con estrategia cache-aside, TTL de 60 segundos e invalidación explícita.
4. Procesamiento asíncrono mediante BullMQ y Redis.
5. Uso justificado de eager loading y carga bajo demanda.
6. Autenticación JWT sin consultar la base de datos en cada validación del token.
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
    ├── auth/                # Registro, login y guard JWT
    ├── categorias/          # CRUD de categorías
    ├── notificaciones/      # Cola y worker BullMQ
    ├── puntos-interes/      # Consulta N+1, consulta optimizada y caché
    ├── prisma/              # Cliente Prisma para PostgreSQL
    ├── redis/               # Cliente Redis tolerante a fallos
    └── resenas/             # Transacción y encolado de notificación
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
CACHE_TTL_SECONDS=60
PORT=3000
```

Desde `backend`:

```bash
npm install
npm run generate
npm run build
npx prisma migrate deploy
npm run start:dev
```

Las migraciones de base de datos se encuentran dentro de `prisma/migrations/` y se aplican con `npx prisma migrate deploy`.

## Modelo de datos

El modelo contiene:

- `Categoria`: clasificación de los lugares turísticos.
- `Usuario`: credenciales, rol y estado de la cuenta.
- `PuntoInteres`: nombre, descripción, ubicación, estado y categoría.
- `Resena`: calificación única por usuario y punto de interés.

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

La versión optimizada usa una sola consulta Prisma con `select` y relaciones incluidas:

```ts
categoria: { select: { id: true, nombre: true } },
resenas: { select: { calificacion: true } },
```

También devuelve solamente los campos necesarios para el listado y calcula el promedio en memoria a partir de los datos ya obtenidos.

## Caché cache-aside

La ruta `GET /puntos-interes` aplica este flujo:

1. Busca la clave `banostour:puntos-interes:activos:v1` en Redis.
2. Si existe, devuelve los datos con `fuente: cache`.
3. Si no existe, consulta PostgreSQL.
4. Guarda el resultado en Redis durante 60 segundos.
5. Devuelve los datos con `fuente: base-de-datos`.

La invalidación es explícita: al crear un punto de interés se elimina la clave de caché. Esto evita que el listado conserve información obsoleta después de una modificación.

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
GET  /auth/me
```

El login realiza una única consulta para obtener el usuario y compara el hash con bcryptjs. Luego genera un JWT con `sub`, `correo` y `rol`.

`GET /auth/me` valida la firma y expiración del JWT y utiliza directamente su payload. No ejecuta una segunda consulta a PostgreSQL para comprobar nuevamente al usuario, por lo que evita consultas redundantes en cada petición autenticada.

## Pruebas en Postman

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
| Listado de POIs | Consulta principal más consultas por cada POI | Una consulta Prisma con relaciones seleccionadas |
| Carga de relaciones | Categoría y reseñas consultadas dentro de un ciclo | Eager loading controlado y selección de campos |
| Repetición de listados | PostgreSQL en cada petición | Redis con TTL de 60 segundos |
| Datos modificados | Caché potencialmente obsoleta | Invalidación explícita al crear un POI |
| Notificación | Podría bloquear la respuesta | Trabajo asíncrono en BullMQ |
| Validación JWT | Consulta adicional por petición | Validación local del token firmado |

Los tiempos exactos deben registrarse desde Postman después de iniciar PostgreSQL y Redis. La comparación debe hacerse con la misma cantidad de datos y varias repeticiones para que el resultado sea representativo.

## Estado actual

El backend utiliza NestJS 11, Prisma 7, PostgreSQL, Redis, BullMQ, JWT y bcryptjs. En el entorno local se verificó:

- npm run build: aprobado.
- npm test -- --runInBand: 4 suites y 4 pruebas aprobadas.
- ESLint del backend: aprobado.
- Prisma Client 7.9.1 generado correctamente.

Para iniciar los servicios:

~~~powershell
cd D:\PROYECTO_APP_MOVILES\banostour
docker compose up -d

cd backend
npx prisma migrate deploy
npm run start:dev
~~~

La API escucha en el puerto 3000. Los endpoints de autenticación disponibles son:

~~~http
POST /auth/registro
POST /auth/login
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
- [x] Autenticación JWT sin consulta redundante en `auth/me`.
- [x] Validación de DTOs y restricciones de base de datos.
- [ ] Registrar tiempos reales en Postman con PostgreSQL y Redis levantados.
- [ ] Reemplazar el log del worker por notificaciones push reales.
