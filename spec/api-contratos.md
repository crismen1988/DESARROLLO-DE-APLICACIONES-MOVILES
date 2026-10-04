# Contratos principales de la API

## Convenciones

- URL base: `<API_BASE_URL>/api`.
- Producción debe usar HTTPS.
- Las rutas privadas reciben `Authorization: Bearer <token-de-acceso>`.
- Los cuerpos utilizan JSON y los errores tienen, como mínimo, `{ "error": "mensaje" }`.
- Los identificadores son opacos: el cliente no debe construirlos ni extraer significado de ellos.
- Los ejemplos son ficticios y omiten tokens, cookies y datos personales reales.

## Respuestas comunes

| Código | Significado |
|---|---|
| 200 | Consulta o actualización exitosa. |
| 201 | Recurso creado. |
| 204 | Operación exitosa sin cuerpo. |
| 400 | Cuerpo, parámetro o transición inválida. |
| 401 | Credenciales o sesión inválidas. |
| 403 | Rol, propiedad o verificación insuficiente. |
| 404 | Recurso no encontrado. |
| 409 | Conflicto con el estado actual. |
| 500 | Error inesperado traducido por el filtro global. |
| 501 | Función declarada pero sin proveedor de producción, como correo. |

## Autenticación — `/auth`

| Método y ruta | Acceso | Entrada principal | Resultado |
|---|---|---|---|
| `POST /auth/register` | Público | `name`, `email`, `password`, `role`; operador añade `ruc` y `businessType` | `201`, usuario seguro, JWT y cookie de renovación. |
| `POST /auth/login` | Público | `email`, `password` | `200`, usuario seguro, JWT, vencimiento y cookie. |
| `POST /auth/refresh` | Cookie válida | Sin cuerpo obligatorio | Rota la renovación y devuelve un JWT nuevo. |
| `POST /auth/logout` | Sesión/cookie actual | Sin cuerpo obligatorio | Revoca renovación y elimina cookie. |
| `POST /auth/biometric/enroll` | Autenticado | `publicKey`, `keyId` | Asocia la clave pública; `204`. |
| `POST /auth/biometric` | Dispositivo vinculado | Solicitud de desafío o firma del desafío | Devuelve desafío o sesión biométricamente verificada. |
| `POST /auth/biometric/revoke` | Autenticado | Sin cuerpo obligatorio | Elimina asociación biométrica; `204`. |
| `POST /auth/forgot-password` | Público | `email` | Solo desarrollo; producción devuelve `501` hasta integrar SMTP. |
| `POST /auth/reset-password` | Público | `email`, `code`, `newPassword` | Solo desarrollo; cambia hash y revoca sesiones anteriores. |

Ejemplo de registro sin datos reales:

```json
{
  "name": "Usuario de ejemplo",
  "email": "usuario@example.com",
  "password": "<contraseña-no-documentada>",
  "role": "turista",
  "phone": "+593000000000",
  "origin": "Ecuador"
}
```

La respuesta nunca debe incluir `password` ni `biometricKey`.

## Tours — `/tours`

| Método y ruta | Acceso | Comportamiento |
|---|---|---|
| `GET /tours` | Público | Lista tours; admite `category`, `search` y `operatorId`. |
| `POST /tours` | Operador verificado o administrador | Crea y asocia el servicio al operador autorizado. |
| `PUT /tours/:id` | Propietario o administrador | Sustituye campos editables validados. |
| `PUT /tours/:id/availability` | Propietario o administrador | Cambia `isOpen` o capacidad sin bajar de reservas existentes. |
| `DELETE /tours/:id` | Propietario o administrador | Elimina si no existen reservas activas; de lo contrario `409`. |

Campos centrales de creación: `title`, `price`, `maxCapacity`, `category`, `duration`, `difficulty`, `description`, `imageUrl`, `latitude`, `longitude`, `included` y `availableDays`. El backend limita título a 120 caracteres, descripción a 2000 e imagen a la referencia aceptada de hasta aproximadamente 2,5 MB.

## Lugares — `/places` y `/puntos-interes`

Ambos prefijos llegan al mismo controlador.

| Método y ruta | Acceso | Comportamiento |
|---|---|---|
| `GET /places` | Público | Lista lugares verificados y activos; filtro opcional `category`. |
| `GET /places/:id` | Público | Devuelve un lugar visible o `404`. |
| `POST /places` | Operador o administrador | Crea un punto asociado y visible. |
| `PUT /places/:id` | Propietario verificado o administrador | Modifica campos permitidos o activa/desactiva. |
| `DELETE /places/:id` | Propietario verificado o administrador | Realiza eliminación lógica mediante `active=false`. |

Categorías válidas: `Comida`, `Hotel`, `Hostal`, `Hostería`, `Airbnb`, `Termas` y `Mirador`.

## Reservas — `/bookings`

| Método y ruta | Acceso | Comportamiento |
|---|---|---|
| `GET /bookings` | Autenticado | Turista ve las propias; operador las de sus tours; administrador ve el conjunto autorizado. |
| `POST /bookings` | Turista | Valida tour, fecha, participantes, cupos y datos requeridos; cifra identificación y genera QR. |
| `PUT /bookings/:id/status` | Operador propietario o administrador | Acepta estados del dominio; una cancelada no se reactiva. |

Entrada conceptual de una reserva:

```json
{
  "tourId": "tour-identificador-opaco",
  "date": "AAAA-MM-DD",
  "participants": 2,
  "passportNumber": "<identificación-no-documentada>"
}
```

El backend calcula `totalPrice`, deriva usuario y operador, cifra `passportNumber`, incrementa ocupación y crea `qrCode`. Cancelar libera cupos una sola vez.

## Mensajes — `/messages`

| Método y ruta | Acceso | Comportamiento |
|---|---|---|
| `GET /messages` | Autenticado | Devuelve mensajes donde el usuario es remitente o receptor. |
| `POST /messages` | Autenticado | Recibe `recipientId`, `message` y `tourId` opcional. |

El remitente real se obtiene del JWT. No se admite enviarse mensajes a sí mismo ni usar un destinatario inexistente. El texto se recorta y se limita a 2000 caracteres.

## Perfil — `/usuarios/perfil`

| Método y ruta | Acceso | Comportamiento |
|---|---|---|
| `GET /usuarios/perfil` | Autenticado | Devuelve el perfil sin contraseña ni clave biométrica. |
| `PUT /usuarios/perfil` | Autenticado | Actualiza campos permitidos del propio usuario. |

Campos editables: nombre, correo único, teléfono, origen, idioma `es`/`en`, preferencia push, avatar y campos comerciales cuando correspondan. El cuerpo no puede convertir al usuario en otro rol.

## Administración — `/admin`

| Método y ruta | Acceso | Comportamiento |
|---|---|---|
| `GET /admin/users` | Administrador | Lista usuarios sin contraseña. |
| `PUT /admin/users/:id/verify` | Administrador | Cambia verificación del usuario. |
| `GET /admin/analytics` | Administrador | Calcula ingresos no cancelados, usuarios, tours, reservas y pendientes. |
| `PUT /admin/usuarios/:id/rol` | Administrador | Cambia rol con protección del último administrador y del actor actual. |

Cambiar un usuario a operador reinicia su verificación. No puede eliminarse el acceso del último administrador ni el propio acceso administrativo desde esa operación.

## Notificaciones — `/notifications`

| Método y ruta | Acceso | Comportamiento |
|---|---|---|
| `GET /notifications` | Público con personalización opcional | Filtra por rol si existe JWT y respeta `pushEnabled=false`. |
| `POST /notifications/broadcast` | Administrador | Persiste aviso y solicita entrega FCM si está configurado. |
| `POST /notifications/device` | Autenticado | Registra token de dispositivo; conserva como máximo cinco por usuario. |
| `DELETE /notifications/device` | Autenticado | Desvincula el token indicado. |

Una respuesta de difusión incluye el aviso y un resumen de entrega. `configured=false` significa que el aviso interno se guardó, pero no existía configuración FCM para envío nativo.

## Salud — `/health`

`GET /health` es público y confirma que la API está disponible y puede comprobar su capa de datos. No debe revelar cadena de conexión, versión de secretos ni contenido de usuarios.

## Compatibilidad y cambios

Un cambio incompatible requiere actualizar simultáneamente servicios del frontend, este documento y las notas de versión. Son incompatibles, entre otros: renombrar campos obligatorios, cambiar estados aceptados, restringir un rol, variar el formato de error o retirar una ruta.
