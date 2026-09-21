# Hoja de Ruta

## Estado Actual (2026-09-20)

### Completado ✅

- **Documentación OpenAPI**: 17 módulos completados (auth, users, organizaciones-sedes, tours, bookings, places, chat, notifications, community, profile, admin, system, error-response, menus, ai)
- **Constitución del Proyecto**: Misión, visión, stack tecnológico
- **Estructura Spec**: Plantilla completa para desarrollo dirigido por especificación

### En Progreso 🔄

- **Features**: Creación de especificaciones detalladas para cada módulo
- **Documentación**: Integración con endpoints reales del backend
- **Tests**: Pruebas de integración y verificación de contratos

## Features por Completar

### 001 · Autenticación Central
- **Estado**: ✅ Completada
- **Endpoints**: Login, callback, sesión, refresh, logout
- **Documentación**: Completada en `documentation/schemas/auth.ts`

### 002 · Gestión de Usuarios
- **Estado**: ✅ Completada
- **Endpoints**: CRUD de usuarios con RBAC
- **Documentación**: Completada en `documentation/schemas/users.ts`

### 003 · Organizaciones y Sedes
- **Estado**: ✅ Completada
- **Endpoints**: Gestión completa de organizaciones y sedes
- **Documentación**: Completada en `documentation/schemas/organizaciones-sedes.ts`

### 004 · Gestión de Tours
- **Estado**: ✅ Completada
- **Endpoints**: CRUD de tours con disponibilidad
- **Documentación**: Completada en `documentation/schemas/tours.ts`

### 005 · Gestión de Reservas
- **Estado**: ✅ Completada
- **Endpoints**: Gestión completa de reservas
- **Documentación**: Completada en `documentation/schemas/bookings.ts`

### 006 · Lugares y Atracciones
- **Estado**: ✅ Completada
- **Endpoints**: Gestión de lugares turísticos
- **Documentación**: Completada en `documentation/schemas/places.ts`

### 007 · Chat y Mensajería
- **Estado**: ✅ Completada
- **Endpoints**: Sistema de mensajería en tiempo real
- **Documentación**: Completada en `documentation/schemas/chat.ts`

### 008 · Notificaciones
- **Estado**: ✅ Completada
- **Endpoints**: Sistema de notificaciones push
- **Documentación**: Completada en `documentation/schemas/notifications.ts`

### 009 · Comunidad
- **Estado**: ✅ Completada
- **Endpoints**: Funcionalidades de comunidad y foros
- **Documentación**: Completada en `documentation/schemas/community.ts`

### 010 · Perfil de Usuario
- **Estado**: ✅ Completada
- **Endpoints**: Perfil de usuario con avatar y preferencias
- **Documentación**: Completada en `documentation/schemas/profile.ts`

### 011 · Administración
- **Estado**: ✅ Completada
- **Endpoints**: Panel de administración y gestión de sistema
- **Documentación**: Completada en `documentation/schemas/admin.ts`

### 012 · Sistema
- **Estado**: ✅ Completada
- **Endpoints**: Configuración y monitoreo del sistema
- **Documentación**: Completada en `documentation/schemas/system.ts`

### 013 · Manejo de Errores
- **Estado**: ✅ Completada
- **Endpoints**: Manejo robusto de errores y validación
- **Documentación**: Completada en `documentation/schemas/error-response.ts`

### 014 · Menús de Navegación
- **Estado**: ✅ Completada
- **Endpoints**: Sistema de menús RBAC
- **Documentación**: Completada en `documentation/schemas/menus.ts`

### 015 · Integración IA
- **Estado**: ✅ Completada
- **Endpoints**: Servicios de IA para recomendaciones
- **Documentación**: Completada en `documentation/schemas/ai.ts`

## Próximos Pasos

### Fase 1: Verificación y Pruebas

1. **Ejecutar tests completos**
   - `yarn lint && yarn typecheck && yarn test && yarn build`
   - Verificar que todos los tests pasen

2. **Verificar documentación OpenAPI**
   - Generar spec completa: `npx tsx documentation/openapi.ts`
   - Verificar en `GET /api/docs`
   - Asegurar que todos los endpoints aparezcan correctamente

3. **Validar contratos**
   - Verificar que los schemas Zod coincidan con los endpoints reales
   - Asegurar que la seguridad y validación estén documentadas

### Fase 2: Integración

1. **Conectar documentación con backend**
   - Integrar schemas con controladores reales
   - Asegurar que la documentación refleje la implementación

2. **Crear tests de integración**
   - Probar endpoints contra base de datos real
   - Verificar RBAC y permisos
   - Probar flujos de usuario completos

3. **Actualizar documentación móvil**
   - Sincronizar con `canchago-ionic/spec/constitution/api-integration.md`
   - Asegurar que los contratos móviles reflejen los endpoints reales

### Fase 3: Producción

1. **Configurar CI/CD**
   - Pipelines para tests y builds
   - Implementación automática con verificación de documentación

2. **Documentación de operaciones**
   - Guías de despliegue y mantenimiento
   - Procedimientos de respaldo y recuperación

## Dependencias y Bloqueos

### Bloqueo Actual: Incompatibilidad Zod 4 / zod-to-openapi

- **Problema**: `yarn build` falla debido a incompatibilidad de tipos entre Zod 4 y `@asteasolutions/zod-to-openapi`
- **Impacto**: Impide levantar el servidor y verificar la documentación OpenAPI visualmente
- **Estado**: Documentado en `spec/constitution/roadmap.md` ítem 010
- **Acción**: Requiere feature dedicada para resolver la incompatibilidad

### Dependencias Críticas

1. **@asteasolutions/zod-to-openapi**: Para generación de OpenAPI
2. **Zod**: Para validación de esquemas
3. **NestJS**: Framework principal
4. **Prisma**: ORM para PostgreSQL
5. **Keycloak**: Autenticación y autorización

## Criterios de Éxito

### Para Cada Feature

1. **Documentación Completa**
   - Todos los endpoints registrados con `registry.registerPath()`
   - Todos los schemas Zod registrados con `registry.registerComponent()`
   - Módulo exportado desde `documentation/schemas/index.ts`
   - Visible y correcto en `GET /api/docs`

2. **Tests Verdes**
   - `yarn lint`: Sin errores (warnings preexistentes permitidos)
   - `yarn typecheck`: Sin errores nuevos
   - `yarn test`: 100% de cobertura
   - `yarn build`: Sin errores (después de resolver bloqueo Zod)

3. **Verificación Manual**
   - Probar endpoints contra Keycloak/Postgres real
   - Verificar RBAC y permisos
   - Probar flujos de usuario completos

### Para el Proyecto Completo

1. **Documentación OpenAPI Completa**
   - 17 módulos documentados
   - Todos los endpoints con seguridad, request/response y ejemplos
   - Swagger UI funcional

2. **Tests de Integración**
   - 100+ tests verdes
   - Cobertura completa de endpoints
   - Pruebas de RBAC y seguridad

3. **Despliegue Limpio**
   - `yarn build` sin errores
   - CI/CD funcional
   - Documentación actualizada

## Timeline Estimada

### Q4 2026

- **Semana 1-2**: Resolver bloqueo Zod, completar tests
- **Semana 3-4**: Integrar documentación con backend, crear tests de integración

### Q1 2027

- **Semana 1-2**: Actualizar documentación móvil, configurar CI/CD
- **Semana 3-4**: Despliegue de producción, documentación de operaciones

## Próximas Features (Post-Implementación)

### 016 · Rate Limiting
- Rate limiting por IP y usuario
- Middleware específico para endpoints sensibles

### 017 · Monitoreo y Observabilidad
- Métricas de rendimiento
- Logging estructurado

### 018 · Carga Diferida
- Carga perezosa de módulos pesados
- Optimización de bundle size

### 019 · MFA y Social Login
- Autenticación multi-factor
- Login social (Google, Facebook)

### 020 · Edge Caching
- Cache distribuido
- Invalidation de cache

## Notas de Implementación

### Decisiones Tomadas

1. **OpenAPI Obligatorio**: Todas las nuevas features deben documentarse
2. **Zod para Validación**: Esquemas consistentes en todo el stack
3. **RBAC Centralizado**: Keycloak para autenticación y autorización
4. **Documentación Paralela**: Documentación creada en el mismo paso que los endpoints

### Lecciones Aprendidas

1. **Documentación como Contracto**: La documentación OpenAPI es el contrato real del API
2. **Validación Temprana**: La validación de schemas debe ser paralela al desarrollo de código
3. **Tests de Integración**: Esencial para verificar que la documentación coincide con la implementación
4. **RBAC Consistente**: El mismo sistema de roles debe funcionar en backend y frontend

## Próximos Eventos

### Reunión de Revisión
- **Fecha**: Próxima semana
- **Tema**: Progreso de features, bloqueos, dependencias
- **Acciones**: Planificar resolución de bloqueo Zod, verificar criterios de éxito

### Demo de Documentación
- **Fecha**: Próxima semana
- **Objetivo**: Mostrar spec OpenAPI completa a stakeholders
- **Verificación**: Todos los endpoints visibles y correctos en Swagger UI

### Sprint Review
- **Fecha**: Fin de sprint
- **Entrega**: Features completadas, tests verdes, documentación actualizada
- **Métrica**: % de cobertura de documentación vs endpoints implementados