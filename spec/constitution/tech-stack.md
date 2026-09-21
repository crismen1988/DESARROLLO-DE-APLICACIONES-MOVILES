# Stack Tecnológico

## Backend (NestJS)

- **Framework**: NestJS 11 con TypeScript
- **Servidor**: Express.js
- **ORM**: Prisma 5 con PostgreSQL 16
- **Cache**: Redis 7
- **Autenticación**: Keycloak (realm local)
- **Seguridad**: JWT, bcrypt, AES-256-CBC para datos sensibles
- **Validación**: Zod schemas
- **Documentación**: OpenAPI 3.0 con swagger-ui
- **Testing**: Jest + Supertest
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict

## Frontend (Ionic React)

- **Framework**: Ionic React 8 con React 19
- **Build Tool**: Vite con Tailwind CSS 4
- **Runtime**: Capacitor 8 para Android nativo
- **Estado**: TypeScript + Zustand + TanStack Query
- **UI**: Componentes Ionic, Lucide icons
- **Navegación**: React Router
- **HTTP**: Cliente API personalizado con interceptores
- **Testing**: Jest + React Testing Library
- **Build**: Vite para web, Gradle para Android

## Infraestructura

- **Base de datos**: PostgreSQL 16 (Docker)
- **Cache**: Redis 7 (Docker)
- **Admin**: pgAdmin 4 (Docker)
- **Contenedores**: Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoreo**: Logs estructurados, métricas básicas

## Arquitectura

### Backend

```
backend/
├── src/
│   ├── controllers/     # Controladores REST
│   ├── routes/          # Rutas Express
│   ├── services/        # Lógica de negocio
│   ├── database/        # Acceso a datos Prisma
│   ├── security/        # JWT, bcrypt, rate limiting
│   └── types/           # Tipos compartidos
└── tests/                # Pruebas de integración
```

### Frontend

```
frontend/
├── src/
│   ├── components/      # Componentes UI
│   ├── hooks/           # Hooks personalizados
│   ├── services/        # Servicios de API
│   ├── views/           # Vistas principales
│   └── types/           # Tipos TypeScript
└── android/              # Proyecto nativo Capacitor
```

## APIs Externas

- **Mapas**: API de mapas (implementación pendiente)
- **Pagos**: Gateway de pagos (implementación pendiente)
- **Email**: Servicio de email (implementación pendiente)

## Convenciones de Codigo

### Backend

- **Patrón**: Clean Architecture con capas bien definidas
- **Validación**: Zod schemas en cada endpoint
- **Documentación**: OpenAPI 3.0 obligatoria para nuevas features
- **Seguridad**: RBAC con roles: turista, operador, admin
- **Errores**: Envoltorio consistente de respuesta de error
- **Logging**: Pino para logs estructurados

### Frontend

- **Patrón**: Atomic Design para componentes
- **Estado**: Zustand para gestión simple de estado
- **Queries**: TanStack Query para data fetching
- **Formularios**: React Hook Form con Zod validation
- **Navegación**: React Router con protección de rutas
- **Errores**: Manejador centralizado de errores

## Decisiones de Diseño

### Backend

1. **Prisma sobre SQL directo**: Proporciona tipado fuerte y migraciones fáciles
2. **Keycloak para auth**: Proporciona SSO, roles y gestión de usuarios empresarial
3. **Redis para cache**: Mejora el rendimiento para datos de lectura frecuente
4. **OpenAPI obligatorio**: Asegura contratos API consistentes

### Frontend

1. **Ionic + React**: Proporciona componentes nativos y rendimiento web
2. **Capacitor**: Permite acceso a APIs nativas Android
3. **Tailwind CSS**: Proporciona estilos consistentes y rapid development
4. **TanStack Query**: Manejo robusto de estado, caching y pagination

## Requisitos de Entorno

### Desarrollo Local

- Node.js 20 o superior
- npm o yarn
- Docker Desktop
- Android Studio (para desarrollo Android)

### CI/CD

- GitHub Actions
- Docker Registry
- Servicios de base de datos administrados

## Escalabilidad

- **Horizontal**: Diseñado para múltiples instancias
- **Vertical**: Optimizado para bases de datos grandes
- **Cache**: Estrategia de cache multi-nivel
- **CDN**: Recursos estáticos a través de CDN

## Seguridad

- **Autenticación**: OAuth 2.0 con JWT
- **Autorización**: RBAC con permisos granulares
- **HTTPS**: Forzado en toda la comunicación
- **Headers**: Security headers apropiados
- **Validación**: Validación de entrada estricta
- **Rate Limiting**: Rate limiting por IP y usuario
- **Monitoreo**: Detección de anomalías

## Mantenimiento

- **Versionado**: Semantic Versioning (semver)
- **Documentación**: OpenAPI + comentarios de código
- **Pruebas**: Cobertura de pruebas unitarias y de integración
- **Linter**: Linting en CI/CD
- **Type Checking**: Type checking en CI/CD
- **Documentación**: Documentación generada automáticamente