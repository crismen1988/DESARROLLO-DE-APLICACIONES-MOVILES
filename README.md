# BañosTour versión 2

Aplicación turística para Baños de Agua Santa. Corte documental: **6 de septiembre de 2026**. Rama de entrega: `banostour_version2`.

El proyecto reúne un cliente Ionic React con TypeScript y Capacitor para navegador y Android, una API NestJS y persistencia PostgreSQL con Prisma. Redis proporciona caché y BullMQ procesa trabajos en segundo plano.

## Estado de la aplicación

- Registro de turistas y prestadores con RUC, login, rutas protegidas y cierre de sesión.
- Recuperación de contraseña implementada en API e interfaz; el envío real requiere configurar SMTP.
- Inicio del turista con búsqueda, categorías y agenda obtenida de la API.
- Catálogo con búsqueda, filtro por categoría y paginación; favoritos por usuario.
- Perfil editable con foto, biografía y datos personales; estadísticas y actividad privada paginada.
- Interfaz diferenciada por rol y traducciones español/inglés.
- Panel administrativo básico: consulta de usuarios y reportes, aprobación de prestadores y activación/desactivación de cuentas.
- API para categorías, POIs, horarios, imágenes, contactos, precios, reseñas, eventos y reportes. La existencia de estos endpoints no implica que todos tengan editor móvil.

Los mapas interactivos, GPS, modo offline y notificaciones push reales siguen pendientes. Los tokens móviles se mantienen en memoria: recargar la aplicación requiere iniciar sesión de nuevo y todavía no existe renovación automática del access token en el cliente. Los botones administrativos de categorías y creación de contenido no tienen acción implementada.

## Preparación local

1. Copiar `.env.example` a `.env` y completar las variables locales. No publicar credenciales.
2. Ejecutar `docker compose up -d` desde la raíz.
3. En `backend`: ejecutar `npm ci`, `npx prisma migrate deploy`, `npm run build` y `npm run start:dev`. El build genera Prisma Client. `npm run seed:admin` crea o actualiza el administrador indicado en las variables de entorno.
4. En `mobile`: ejecutar `npm ci --legacy-peer-deps`, copiar `.env.example` a `.env.local` y ajustar `VITE_API_URL`; ejecutar `npm run dev`.
5. Para Android: `npm run build`, `npx cap sync android` y `npx cap run android --target <ID_DEL_DISPOSITIVO>` desde `mobile`.

La API usa el puerto 3000, Vite 5173, PostgreSQL 5433, Redis 6380 y pgAdmin 5050. Para el emulador Android, la API se alcanza mediante `http://10.0.2.2:3000`; en un teléfono físico debe usarse la IP LAN del computador y ajustar CORS y la configuración de red Android.

## Documentación

- [Backend y API](backend/README.md).
- [Cliente móvil y navegación](mobile/README.md).
- [Verificación y limitaciones de esta entrega](docs/VERIFICACION-ENTORNO.md).
- [Preparación de la grabación](docs/GUIA-VIDEO-VERSION2.md).
- [Especificaciones y tareas](backend/spec/README.md).
- [Aclaraciones sobre el documento académico Word](docs/ESTADO-DOCUMENTO-ACADEMICO.md).

`DOCUMENTACIÓN_APP_BAÑOSTOUR.docx` se conserva como antecedente académico: contiene propuestas previas, no es el contrato de la versión 2. La actualización técnica y las correcciones a esas propuestas están en los documentos enlazados. `mobile/banostour-mobile/` es un remanente de configuración; la aplicación activa se ejecuta desde `mobile/`.

## Verificación

Desde `backend`: `npm run build`, `npm test -- --runInBand`, `npm run lint` y `npm run test:e2e -- --runInBand`. Las pruebas e2e requieren PostgreSQL y Redis y usan fixtures temporales; ejecutarlas en una base de desarrollo o pruebas.

Desde `mobile`: `npm run build` y `npm run lint`. Con Vite activo en 5173: `npx cypress run --spec cypress/e2e/auth-rubric.cy.ts,cypress/e2e/profile.cy.ts,cypress/e2e/tourist-home.cy.ts`. Estas pruebas de interfaz simulan la API. Los resultados de esta revisión y cualquier bloqueo se registran en el informe de verificación.
