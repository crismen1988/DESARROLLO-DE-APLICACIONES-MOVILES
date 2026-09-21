# Estado de implementación de BañosTour

Actualizado: 19 de septiembre de 2026.

## Alcance

BañosTour es un proyecto personal de turismo. La interfaz y la documentación no atribuyen el producto a una institución pública. La administración corresponde al control interno de la plataforma.

## Arquitectura implementada

```text
Ionic React 8 + React 19 + TypeScript
                |
       API REST /api
                |
      NestJS 11 + Express
                |
      Prisma 6 + PostgreSQL 16
```

Capacitor 8 empaqueta el frontend para Android. Docker Compose inicia la aplicación, PostgreSQL, Redis y pgAdmin. Redis está provisionado, pero la capa de negocio actual persiste el estado en PostgreSQL y todavía no usa Redis como caché de producción.

## Funcionalidad verificada

- Pantalla de bienvenida con imagen local y favicon del proyecto.
- Interfaz adaptable para móvil y escritorio sin alterar la paleta visual solicitada.
- Registro e inicio de sesión para turista y operador.
- Inicio de sesión biométrico nativo mediante Capacitor cuando existe enrolamiento biométrico.
- Cierre de sesión accesible en el perfil del turista.
- Exploración en tiempo real por búsqueda y categorías.
- Geolocalización con Capacitor y cálculo Haversine de distancia.
- Tarjetas de tours con imagen 16:9, categoría, duración, dificultad y precio.
- Modal de reserva con fecha, participantes, total y aviso LOPDP.
- Perfil del turista con idioma, correo verificado, boletos y QR.
- Paneles diferenciados para turista, operador y administrador.
- Edición y eliminación protegida de servicios propios del operador.
- Revisión interna de perfiles comerciales de operadores.
- Chat, favoritos, reseñas, eventos, reportes y notificaciones.
- PostgreSQL persistente mediante el documento `AppState`.
- API protegida con JWT, renovación de sesión y RBAC.

## Decisiones técnicas

### Frontend

Todo el código de aplicación está en TypeScript (`.ts` y `.tsx`). Ionic aporta la estructura móvil, React gestiona estado y componentes, Tailwind resuelve estilos responsivos y Lucide React aporta iconos.

### Backend

NestJS expone los controladores bajo `/api`. Los controladores reutilizan servicios de dominio tipados. Express actúa como adaptador HTTP de NestJS y como servidor de recursos de Vite o del directorio `dist`.

### Datos

Prisma conecta con PostgreSQL. Los datos activos se serializan en `AppState`; los modelos relacionales del esquema son la ruta prevista para una normalización gradual. Las migraciones se encuentran en `server/db/migrations`.

### Seguridad

- Las contraseñas no se pueden recuperar en texto plano; se verifican contra hashes scrypt.
- El administrador local se configura mediante `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
- El token de acceso dura una hora.
- El token de renovación dura siete días, se rota y se conserva como hash.
- Las rutas comprueban autenticación y rol en el servidor.
- El cierre de sesión revoca la sesión de renovación.
- El flujo de recuperación requiere integrar correo en producción.

## Pendientes conocidos

- Conectar Redis como caché real si las métricas de uso lo justifican.
- Migrar los controladores de `AppState` a los modelos relacionales por etapas.
- Integrar un proveedor de correo para recuperación en producción.
- Configurar HTTPS y secretos distintos para un despliegue público.
- Añadir firma y verificación criptográfica del contenido QR si se requiere validación fuera de línea.

## Validación

```powershell
npm run lint
npm run test:api
npm run build
```
