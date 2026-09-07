# Plan tecnico: autenticacion y sesiones

## Alcance

Mantener JWT para clientes moviles y añadir refresh tokens rotatorios, revocacion y control de cuentas activas.

## Implementacion actual

1. `src/auth/auth.controller.ts`: registro, login, refresh, logout, identidad y recuperacion.
2. `src/auth/auth.service.ts`: bcrypt, JWT y refresh tokens opacos.
3. `src/auth/auth.guard.ts`: valida firma, expiracion y usuario activo.
4. `src/auth/ruc.validator.ts`: valida RUC ecuatoriano para prestadores.
5. `prisma/schema.prisma`: usuario, tipo de cuenta, verificacion y sesiones.
6. `src/auth/mail.service.ts`: envio SMTP del enlace de recuperacion.
7. `src/usuarios/`: perfil, actividad privada y cambio de contraseña.
8. `prisma/seed.ts`: administrador maestro mediante variables de entorno.

## Reglas de seguridad

- Nunca registrar contraseñas, tokens ni hashes.
- Guardar solo el hash SHA-256 del refresh token.
- Rotar el refresh token en cada uso.
- Revocar sesiones al cambiar contraseña.
- No permitir registro publico de administradores.
- El prestador requiere RUC valido y aprobacion administrativa.

## Validacion

- Build y pruebas unitarias.
- Casos de token ausente, invalido, expirado, revocado y usuario inactivo.
- Casos de RUC valido e invalido.
- Prueba de concurrencia para reutilizacion de refresh token.
