# spec/ — Spec Driven Development (plantilla)

> Plantilla genérica para documentar cualquier proyecto con desarrollo dirigido por especificación (SDD): primero se escribe la spec, luego el plan, luego las tareas, y solo entonces se toca el código.

## Cómo usar esta plantilla

Copia esta carpeta a tu proyecto como `spec/`, rellena la `constitution/` una vez al arrancar y crea una carpeta por feature a partir de `features/NNN-nombre-feature/`. Sustituye todo lo que esté entre `<…>` y borra las notas en _cursiva_.

## Estado actual

- **Documentación OpenAPI**: ✅ Completada (7 módulos)
- **Constitución**: ✅ Completada
- **Features**: 🔄 En progreso

## Estructura

```
spec/
├── constitution/              # Constitución del proyecto
│   ├── mission.md             # Misión y visión
│   ├── tech-stack.md          # Stack tecnológico
│   └── roadmap.md             # Hoja de ruta
├── features/                   # Especificaciones por feature
│   ├── 001-autenticacion-core/ # Autenticación central
│   ├── 002-gestion-usuarios/   # Gestión de usuarios
│   ├── 003-organizaciones-sedes/# Organizaciones y sedes
│   ├── 004-tours/              # Gestión de tours
│   ├── 005-bookings/           # Gestión de reservas
│   ├── 006-places/              # Lugares y atracciones
│   ├── 007-chat/                # Chat y mensajería
│   ├── 008-notifications/       # Notificaciones
│   ├── 009-community/           # Comunidad
│   ├── 010-profile/             # Perfil de usuario
│   ├── 011-admin/              # Administración
│   ├── 012-system/              # Sistema
│   ├── 013-error-response/      # Manejo de errores
│   ├── 014-menus/               # Menús de navegación
│   └── 015-ai/                  # Integración IA
└── documentation/              # Documentación OpenAPI
    ├── README.md
    ├── openapi.ts
    ├── registry.ts
    └── schemas/                 # Por módulo
        ├── auth.ts
        ├── users.ts
        ├── organizaciones-sedes.ts
        ├── tours.ts
        ├── bookings.ts
        ├── places.ts
        ├── chat.ts
        ├── notifications.ts
        ├── community.ts
        ├── profile.ts
        ├── admin.ts
        ├── system.ts
        ├── error-response.ts
        ├── menus.ts
        └── ai.ts
```