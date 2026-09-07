# 001 Autenticacion y sesiones

## Objetivo

Permitir registro y acceso movil seguros con JWT de corta duracion y refresh tokens rotatorios.

## Reglas

- El registro asigna TURISTA por defecto.
- Las contraseñas se almacenan solo como hash bcrypt.
- El access token dura una hora como maximo.
- El refresh token dura siete dias, se almacena hasheado y se revoca al rotar.
- Un usuario inactivo no puede iniciar sesion ni usar una sesion vigente.
- Las respuestas nunca incluyen passwordHash ni tokens persistentes almacenados.

## Endpoints

- POST /auth/registro
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me

## Recuperacion y perfil implementados en version 2

- POST /auth/forgot-password y POST /auth/reset-password.
- Token opaco de un solo uso, hash SHA-256, expiracion de 15 minutos y revocacion de refresh tokens al restablecer.
- Envio mediante SMTP configurable; respuesta generica aunque el correo no exista.
- GET/PATCH /usuarios/perfil, GET /usuarios/perfil/actividad y PATCH /usuarios/perfil/password.
- Actividad privada por tipo, paginada en grupos de 12; estadisticas de favoritos, reseñas y lugares propios.
