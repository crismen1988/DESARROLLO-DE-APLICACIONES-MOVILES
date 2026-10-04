# Modelo y persistencia de datos

## Fuente de verdad actual

PostgreSQL 16 es la base persistente y sus tablas relacionales son la fuente de verdad. Prisma administra el esquema, las relaciones y las migraciones. Los datos activos se distribuyen así:

| Tabla | Responsabilidad principal |
|---|---|
| `User` | Identidad, credenciales derivadas, rol, perfil, preferencias y claves públicas biométricas. |
| `Tour` | Servicios turísticos ofrecidos por un operador. |
| `Place` | Puntos de interés y servicios de ubicación. |
| `Booking` | Reservas vinculadas con turista y tour. |
| `ChatMessage` | Mensajes vinculados con remitente y destinatario. |
| `PushNotification` | Avisos persistidos por audiencia. |
| `RefreshSession` | Hashes de sesiones renovables y vencimiento. |
| `Review` | Estructura relacional preparada para reseñas; no tiene flujo público activo en la versión actual. |
| `DataMigration` | Marcadores de transformaciones de datos ya ejecutadas. |

`AppState` contiene el respaldo documental de versiones anteriores. La API actual no lo lee después de completar la importación ni lo actualiza en cada escritura. Su presencia no significa que continúe siendo la fuente de datos.

## Estrategia de acceso actual

1. Al iniciar, `DatabaseStore` consulta el marcador `app-state-to-relational-v1`.
2. En una instalación ya migrada, carga las tablas relacionales y reconstruye los tipos esperados por la API.
3. En una instalación antigua sin marcador, importa `AppState`, transforma campos y relaciones, guarda las entidades y registra la migración.
4. Los controladores consultan o modifican las representaciones tipadas actuales.
5. Cada mutación llama a `persist()` y entra en una cola para conservar el orden dentro de la instancia.
6. Prisma ejecuta los `upsert`, cambios de estado y sesiones dentro de una transacción.
7. La respuesta HTTP se envía después de confirmar la persistencia.

La base ya está normalizada y permite inspeccionar cada entidad mediante Prisma Studio o pgAdmin. El uso de representaciones en memoria sigue siendo una restricción para múltiples instancias concurrentes; antes de escalar horizontalmente se deben ejecutar mutaciones directas mediante repositorios o añadir coordinación distribuida.

## Entidades de dominio

### Usuario

| Grupo | Campos principales | Observaciones |
|---|---|---|
| Identidad | `id`, `name`, `email`, `role` | Correo único; rol válido: turista, operador o administrador. |
| Credenciales | `password`, `biometricKey`, `biometricEnabled` | Contraseña contiene hash scrypt; clave biométrica es pública y no se entrega al cliente. |
| Contacto | `phone`, `origin`, `language`, `avatarUrl` | Datos editables del propio perfil. |
| Operador | `businessType`, `ruc`, `businessRegistration`, `verified`, `rating` | RUC único cuando corresponde; operador nuevo requiere revisión. |
| Notificaciones | `pushEnabled`, `pushTokens` | Hasta cinco tokens recientes por usuario. |

### Tour

- Identidad y propiedad: `id`, `operatorId`, `operatorName`.
- Presentación: título, categoría, descripción, imagen, duración, dificultad e incluidos.
- Ubicación: latitud y longitud.
- Comercial: precio y días disponibles.
- Capacidad: `maxCapacity`, `currentBooked`, `isOpen`.
- Ciclo de vida: `active`; eliminar un tour lo desactiva sin destruir relaciones históricas.
- Reputación: calificación y número de reseñas.

La propiedad se comprueba por `operatorId`. `currentBooked` no puede superar `maxCapacity`, y reducir la capacidad por debajo de ocupación existente se rechaza.

### Lugar

Contiene nombre, categoría, dirección, coordenadas, descripción, imagen, teléfono, etiquetas, horario, recomendaciones, operador opcional, verificación y estado activo. La eliminación actual es lógica: `active=false`.

### Reserva

| Campo | Procedencia |
|---|---|
| `tourId`, fecha y participantes | Solicitud validada. |
| tour y operador mostrados | Relaciones consultadas desde `Tour` y `User`. |
| usuario mostrado | Relación autenticada con `User`. |
| `status` | Estado del dominio; inicialmente `confirmada`. |
| `qrCode` | Código único generado por el backend. |
| `encryptedPassport` | Documento cifrado con AES-256-GCM, si fue proporcionado. |
| `createdAt` | Momento generado en el servidor. |

El precio total queda fijado al crear la reserva. El título, imagen y nombres visibles se reconstruyen desde las relaciones actuales; por ello pueden reflejar una edición posterior del servicio o del perfil.

### Mensaje

Incluye remitente y receptor mediante claves foráneas, tour opcional, texto y hora. El nombre y el rol del remitente se obtienen de la relación con `User`, lo que evita mostrar una identidad genérica. Las consultas se filtran para que el usuario participe como remitente o receptor.

### Notificación

Incluye título, cuerpo, audiencia (`todos`, `turista`, `operador`), tipo (`alerta`, `promocion`, `reserva`, `sistema`), marca temporal y lectura. La persistencia del aviso y su entrega mediante FCM son resultados distintos.

### Sesión de renovación

Solo conserva hash del token, usuario y vencimiento. Consumir una sesión la elimina antes de emitir la siguiente. Las sesiones vencidas se depuran durante el proceso de emisión.

## Invariantes

- correo y RUC aplicable no deben duplicarse;
- debe existir al menos un administrador;
- no se devuelve contraseña ni clave biométrica en respuestas de perfil;
- un operador no modifica recursos ajenos;
- un tour con reservas activas no se elimina;
- una reserva cancelada no se reactiva;
- cancelar descuenta cupos sin producir valores negativos;
- el QR no contiene el documento personal;
- un lugar inactivo o no verificado no aparece en consultas públicas;
- un token de dispositivo no se duplica en el perfil.

## Caché del dispositivo

Ionic Storage utiliza una base local denominada internamente para BañosTour. Cada entrada incluye:

```text
savedAt: instante de almacenamiento
data: copia de la respuesta
```

Una lectura con más de siete días se considera vencida. Los prefijos privados cubren perfil, reservas, mensajes, administración y notificaciones. Cerrar sesión elimina esas entradas aunque falle una llamada remota.

La caché no reemplaza PostgreSQL, no acepta escrituras offline y puede desaparecer por limpieza del sistema, falta de espacio o reinstalación.

## Copias de seguridad y recuperación

Para producción se debe definir:

- respaldo automático cifrado de PostgreSQL;
- retención y ubicación separada del servidor principal;
- restauración ensayada y documentada;
- objetivo de pérdida aceptable y tiempo máximo de recuperación;
- acceso limitado a operadores autorizados;
- comprobación de integridad posterior a restauración.

No deben almacenarse exportaciones reales dentro del repositorio.

## Migración relacional aplicada

La migración versionada `20261004_relational_persistence`:

1. añadió los campos de perfil y ciclo de vida que utilizaba la API;
2. creó `RefreshSession` con relación hacia `User`;
3. creó `DataMigration` para registrar la importación;
4. mantuvo intacto el documento legado durante la transición;
5. importó usuarios antes de sus recursos dependientes;
6. importó tours y lugares antes de reservas y mensajes;
7. conservó identificadores existentes para no romper el frontend ni los códigos QR;
8. cambió las lecturas y escrituras posteriores hacia las tablas relacionales.

### Integridad y eliminación

- El correo y el RUC son únicos cuando están presentes.
- Los tours pertenecen a un operador mediante clave foránea.
- Las reservas pertenecen a un usuario y un tour.
- Los mensajes relacionan remitente y destinatario.
- Las sesiones se eliminan en cascada si se elimina su usuario.
- Tours y lugares se retiran del catálogo con `active=false`.
- Las migraciones se ejecutan con `npm run prisma:deploy`; no se debe usar sincronización forzada del esquema sobre una base con datos.

`AppState` podrá retirarse físicamente cuando exista un respaldo externo verificado y haya finalizado el periodo de recuperación. Hasta entonces permanece sin escrituras y no debe usarse para consultas funcionales.
