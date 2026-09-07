# Verificación de BañosTour versión 2

Fecha: **2026-09-06**. Rama: `banostour_version2`. Este informe sustituye el corte del 23 de agosto y distingue pruebas ejecutadas de funcionalidades pendientes.

## Resultados ejecutados

| Comprobación | Resultado |
|---|---|
| Backend `npm run build` | Aprobado; Prisma Client 7.9.1 generado y NestJS compilado. |
| Backend `npm test -- --runInBand` | 6 suites y 9 pruebas aprobadas. |
| Backend `npm run lint` | Aprobado tras corregir formato en recuperación y tipado de respuestas en pruebas de perfil. |
| Backend `npm run test:e2e -- --runInBand` | 3 suites y 11 pruebas aprobadas, repetidas tras corregir el tipado. |
| `npx prisma migrate status` | 14 migraciones; esquema local actualizado. |
| `docker compose ps` | PostgreSQL 18.4 y Redis 8.10.0 saludables; pgAdmin 9.17 activo. |
| Mobile `npm run build` | Aprobado con TypeScript y minificación Vite; advertencia de bundles mayores de 500 kB. |
| Mobile `npm run lint` | Aprobado. |
| Cypress de autenticación, perfil e inicio | 3 specs y 9 pruebas aprobadas; Cypress 13.17.0 y Electron 118, con API simulada. |

Las pruebas HTTP del backend requieren servicios locales. La suite de perfil crea y elimina fixtures propias de usuarios, categorías, lugares, favoritos y reseñas. Ejecutarlas en desarrollo o pruebas.

Cypress inicialmente no arrancó por restricciones del entorno y `ELECTRON_RUN_AS_NODE=1`. La ejecución válida se hizo fuera del aislamiento y sin esa variable. Si la terminal presenta ese problema, ejecutar `$env:ELECTRON_RUN_AS_NODE = $null` antes de Cypress. Browserslist advirtió de su base de compatibilidad desactualizada; no impidió las pruebas.

## Funciones contrastadas con el código

| Área | Estado actual |
|---|---|
| Autenticación | Registro turista/prestador, validación matemática de RUC, login, roles, cuenta activa, refresh rotatorio y logout. |
| Recuperación | API y pantallas; token hasheado de un solo uso, 15 minutos y revocación de refresh tokens. Entrega SMTP real pendiente de verificar. |
| Sesión móvil | Tokens en memoria; correo e idioma en localStorage. Sin persistencia nativa segura ni renovación automática. |
| Catálogo | Búsqueda, categoría y paginación; caché por consulta e invalidación por prefijo. |
| POIs | Creación, edición y desactivación con autorización; horarios, imágenes HTTPS, contacto y precios en API. |
| Perfil | Foto, biografía, datos personales, estadísticas y actividad privada paginada; guardar/cancelar en el editor móvil. |
| Favoritos y reseñas | Favoritos propios; API de reseñas con promedio transaccional. |
| Eventos | Lectura pública de publicados no finalizados, creación y edición; agenda móvil con detalles. Cancelación/moderación completa pendiente. |
| Reportes | Creación autenticada y consulta/cambio de estado administrativo en API. El panel móvil consulta reportes sin editar su estado. |
| Administración | Consulta de cuentas y reportes, aprobación y activación/desactivación. Botones de categorías y creación de contenido sin acción implementada. |
| Seguridad | DTOs, guards, límites de solicitudes/cuerpos, CORS, cabeceras defensivas y Swagger configurable; cobertura parcial de pruebas. |
| Android | Proyecto Capacitor y HTTP limitado a 10.0.2.2 y 192.168.1.18. No se recompiló APK ni revalidó dispositivo en este corte. |

## Pendientes de verificación y desarrollo

- Recorrer la aplicación con API real en el dispositivo de grabación y comprobar URL, CORS y red.
- Configurar y verificar entrega SMTP. No se enviaron correos durante esta revisión.
- Registrar tiempos reales de Postman para N+1 y caché.
- Repetir auditoría npm con acceso al registro; el resultado histórico de cero vulnerabilidades no acredita esta entrega.
- Ampliar pruebas de recuperación y cobertura de negocio. Las pruebas Cypress aquí ejecutadas simulan la API.
- Las pruebas de plantilla `mobile/cypress/e2e/test.cy.ts` y `mobile/src/App.test.tsx` requieren adaptación a la aplicación actual; no forman parte de los resultados aprobados anteriores.
- Implementar mapas/GPS, modo offline, push real, renovación automática de sesión y editores móviles pendientes.
- Optimizar bundles y completar rate limiting distribuido, auditoría administrativa y verificación externa de RUC con el SRI.

El Word se conserva como antecedente académico con [actualización y correcciones](ESTADO-DOCUMENTO-ACADEMICO.md). La referencia operativa es el [README principal](../README.md).

## Reproducción

Desde `backend`, con PostgreSQL y Redis disponibles:

```powershell
npm run build
npm test -- --runInBand
npm run lint
npm run test:e2e -- --runInBand
npx prisma migrate status
```

Desde `mobile`, con `.env.local` configurado:

```powershell
npm run build
npm run lint
npm run dev
# En otra terminal:
npx cypress run --spec cypress/e2e/auth-rubric.cy.ts,cypress/e2e/profile.cy.ts,cypress/e2e/tourist-home.cy.ts
```
