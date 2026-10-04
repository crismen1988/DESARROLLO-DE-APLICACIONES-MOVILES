# Alcance funcional y reglas de negocio

## Objetivo de la versión

La versión actual permite que un turista explore la oferta, utilice ubicación y mapa, reserve una experiencia y mantenga comunicación con el operador. El operador administra exclusivamente sus servicios y reservas. El administrador consulta el estado general, revisa operadores y emite avisos segmentados.

## Actores y control de acceso

| Actor | Acceso principal | Restricciones |
|---|---|---|
| Invitado | Bienvenida, registro, inicio de sesión y catálogo público disponible. | No crea reservas, no consulta datos privados ni envía mensajes. |
| Turista | Explorar, mapa, lugares, reservas, QR, mensajes y perfil. | No publica servicios ni accede a administración. |
| Operador | Servicios propios, disponibilidad, reservas recibidas, mensajes y perfil comercial. | No modifica servicios de otro operador ni consulta reservas ajenas. |
| Administrador | Indicadores, usuarios, validación de operadores, reservas y difusión. | Debe actuar mediante rutas protegidas; no se asume permiso por ocultar botones. |

La API identifica al usuario con el JWT y no confía en un identificador de usuario enviado por el cliente cuando puede derivarlo de la sesión.

## Requisitos funcionales

### RF-AUT — Identidad y sesión

| ID | Requisito | Estado |
|---|---|---|
| RF-AUT-01 | Registrar una cuenta de turista con nombre, correo y contraseña válidos. | Implementado |
| RF-AUT-02 | Registrar un operador con RUC de 13 dígitos y actividad comercial. | Implementado |
| RF-AUT-03 | Autenticar credenciales y devolver usuario más token de acceso. | Implementado |
| RF-AUT-04 | Renovar una sesión mediante cookie HttpOnly rotativa. | Implementado |
| RF-AUT-05 | Cerrar sesión, revocar renovación, limpiar token y datos privados locales. | Implementado |
| RF-AUT-06 | Desbloquear con biometría solo una sesión previamente iniciada y no cerrada explícitamente. | Implementado en Android |
| RF-AUT-07 | Recuperar contraseña mediante un código entregado por correo. | Condicional: falta proveedor SMTP real |

### RF-TUR — Experiencia del turista

| ID | Requisito | Criterio observable |
|---|---|---|
| RF-TUR-01 | Buscar tours por texto y filtrar por categoría. | La lista cambia sin recargar toda la aplicación. |
| RF-TUR-02 | Mostrar imagen 16:9, categoría, distancia, duración, dificultad, precio y operador. | Cada tarjeta contiene la información disponible. |
| RF-TUR-03 | Obtener ubicación al pulsar la acción correspondiente. | No se solicita permiso al iniciar sin contexto. |
| RF-TUR-04 | Mostrar posición actual y puntos de interés en el mapa. | El mapa actualiza la posición mientras la vista permanece activa. |
| RF-TUR-05 | Consultar lugares por categoría, horario, dirección y recomendaciones. | La información procede del servicio de lugares. |
| RF-TUR-06 | Calcular participantes y precio total de una reserva. | Total = precio vigente del tour × participantes. |
| RF-TUR-07 | Crear una reserva con fecha válida no pasada, cupos disponibles, identificación y consentimiento mostrado por el cliente. | La API devuelve reserva confirmada y código único. |
| RF-TUR-08 | Consultar reservas propias y su boleto QR. | Solo aparecen registros asociados al usuario autenticado. |
| RF-TUR-09 | Enviar mensajes a un operador y conservarlos solo después de respuesta exitosa. | Un error de red no presenta el mensaje como confirmado. |
| RF-TUR-10 | Ver el perfil en modo lectura y editarlo únicamente después de pulsar Editar perfil. | Los campos no aparecen editables por defecto. |

### RF-OPE — Operación turística

| ID | Requisito | Criterio observable |
|---|---|---|
| RF-OPE-01 | Crear un servicio con título, categoría, precio, duración, dificultad, descripción, capacidad, ubicación e imagen. | El servicio queda asociado al operador autenticado. |
| RF-OPE-02 | Editar información e imagen de un servicio propio. | La imagen se toma o selecciona desde el dispositivo; no se exige una URL manual. |
| RF-OPE-03 | Pausar o reabrir la disponibilidad. | Un tour cerrado no admite nuevas reservas. |
| RF-OPE-04 | Eliminar un servicio propio después de una advertencia. | El registro deja de aparecer en el catálogo. |
| RF-OPE-05 | Consultar reservas correspondientes a servicios propios. | No se muestran reservas de otros operadores. |
| RF-OPE-06 | Responder mensajes mostrando el nombre persistido del turista remitente. | No se usan nombres genéricos. |
| RF-OPE-07 | Editar el perfil comercial de manera voluntaria. | Guardar perfil aparece dentro del modo de edición. |

### RF-ADM — Administración

| ID | Requisito | Criterio observable |
|---|---|---|
| RF-ADM-01 | Consultar indicadores derivados de usuarios, tours y reservas. | Los valores proceden del backend. |
| RF-ADM-02 | Consultar usuarios y verificar operadores pendientes. | La operación exige rol administrador. |
| RF-ADM-03 | Consultar reservas como vista de auditoría operativa. | La información sensible no se descifra ni expone en la lista. |
| RF-ADM-04 | Emitir avisos para todos, turistas u operadores. | El aviso queda persistido; la entrega push es condicional a Firebase. |

## Reglas de negocio

### Registro y perfiles

- El correo debe tener formato válido y no puede repetirse.
- La contraseña debe cumplir la longitud mínima configurada; en producción, la cuenta administrativa inicial exige una contraseña más robusta.
- El nombre se limita a una longitud razonable y el teléfono, cuando existe, admite dígitos, espacios, guion y prefijo internacional.
- El RUC del operador debe contener 13 dígitos.
- Una edición de perfil no permite cambiar el rol del usuario desde el cliente.

### Servicios

- El precio no puede ser negativo y la capacidad debe ser mayor que cero.
- Las coordenadas deben corresponder a rangos válidos de latitud y longitud.
- El operador solo modifica o elimina servicios cuyo `operatorId` coincide con su sesión; el administrador conserva facultades de supervisión.
- La disponibilidad se controla con `isOpen`; pausar no equivale a eliminar.

### Reservas

- Solo un turista autenticado crea una reserva.
- El tour debe existir y estar abierto.
- La API rechaza fechas anteriores al día actual; el cliente orienta la selección según la disponibilidad informada.
- Los participantes deben ser un entero positivo y no superar los cupos disponibles.
- El total se calcula con el precio del backend; el cliente no decide el valor final.
- La identificación se cifra antes de persistirse.
- El código QR identifica la reserva, pero no debe incluir datos personales legibles.
- Estados válidos: `confirmada`, `pendiente`, `completada` y `cancelada`.

### Mensajería y notificaciones

- Remitente, nombre y rol se derivan del usuario autenticado.
- El receptor debe existir y la conversación debe respetar el contexto permitido.
- El texto vacío o excesivo se rechaza.
- Solo el administrador difunde notificaciones globales o segmentadas.

## Estados relevantes

### Sesión

```text
sin sesión -> credenciales válidas -> sesión activa
sesión activa -> cierre de aplicación -> sesión bloqueada -> biometría -> sesión activa
sesión activa -> cerrar sesión -> sin sesión
token vencido -> renovación válida -> sesión activa
token vencido -> renovación inválida -> sin sesión
```

Cerrar la aplicación no equivale a cerrar sesión. La biometría protege la reapertura de una sesión conservada; nunca sustituye el primer inicio con correo y contraseña ni permite volver después de un cierre explícito.

### Servicio turístico

```text
creado y abierto <-> pausado
creado -> editado
creado o editado -> eliminado
```

### Reserva

La API admite los estados definidos por el dominio. Cualquier transición debe comprobar el rol y, para un operador, la propiedad del tour relacionado.

## Funcionamiento sin conexión

La aplicación conserva por un máximo de siete días la última lectura exitosa de tours, lugares, perfil, reservas, mensajes, notificaciones, información administrativa y ubicación autorizada. Las claves privadas se separan por usuario cuando corresponde.

En modo sin conexión:

- se permite leer información reciente almacenada;
- se identifica visualmente que el contenido puede no estar actualizado;
- no se crean reservas, mensajes, perfiles, servicios ni acciones administrativas pendientes;
- al recuperar la red, una nueva consulta reemplaza la caché;
- cerrar sesión elimina la información privada local.

## Fuera del alcance actual

- pagos electrónicos y almacenamiento de tarjetas;
- Redis o caché distribuida en el backend;
- sincronización de escrituras offline;
- integración oficial con instituciones públicas;
- recuperación real por correo sin proveedor SMTP;
- garantía de notificación push sin credenciales Firebase;
- publicación iOS y sus cadenas de propósito;
- analítica de comportamiento de usuarios;
- validación criptográfica autónoma del QR sin consultar datos autorizados.
