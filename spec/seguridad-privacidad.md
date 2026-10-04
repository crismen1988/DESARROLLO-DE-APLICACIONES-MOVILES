# Seguridad, privacidad y protección de datos

## Objetivo

Los controles reducen el riesgo de acceso indebido, modificación no autorizada, exposición de credenciales, pérdida de información y uso excesivo de permisos. Esta especificación documenta el comportamiento actual y los requisitos pendientes para una publicación pública; no constituye por sí sola una política de privacidad legal.

## Clasificación de información

| Nivel | Ejemplos | Tratamiento esperado |
|---|---|---|
| Público | títulos, descripciones, categorías, precios, horarios y coordenadas de atractivos | Puede entregarse sin sesión; debe validarse antes de modificarse. |
| Cuenta | nombre, correo, teléfono, origen, idioma, avatar y datos comerciales | Solo usuario propietario y roles autorizados; excluir de logs. |
| Operacional | reservas, mensajes, relación turista-operador, cupos y estados | Filtrar por sesión y rol; conservar únicamente el tiempo necesario. |
| Sensible | contraseña, documento de identidad, claves biométricas y tokens | Nunca registrar en texto claro; hash, cifrado o almacenamiento seguro según el tipo. |
| Secreto de sistema | clave AES/JWT, conexión de base, Firebase, firma Android y credenciales administrativas iniciales | Solo entorno seguro; nunca frontend, Git, capturas o documentación. |

## Amenazas consideradas

- uso de una ruta privada sin autenticación;
- modificación de un identificador para consultar datos de otro usuario;
- escalamiento de turista u operador a administrador;
- robo o reutilización de token de renovación;
- exposición de contraseña o identificación en base, log o respuesta;
- incorporación de secretos en el paquete móvil o repositorio;
- acceso a caché privada después de cerrar sesión;
- solicitud inesperada de cámara o ubicación;
- intercepción de tráfico HTTP fuera del entorno local;
- sobreescritura de estado por escrituras concurrentes;
- mensajes o imágenes demasiado grandes usados para agotar recursos.

## Autenticación

### Contraseñas

- Se almacenan con `scrypt`, sal aleatoria individual y salida de 64 bytes.
- La verificación utiliza comparación de tiempo constante.
- El backend nunca devuelve el hash en perfiles o listados.
- Los valores iniciales de administración se inyectan mediante variables de entorno.
- Para producción se exige una contraseña administrativa inicial de al menos 12 caracteres y no reutilizada.

### JWT de acceso

- Algoritmo actual: HMAC SHA-256.
- Duración actual: una hora.
- Incluye identificador, nombre, correo, rol, marca biométrica, emisión, expiración y tipo.
- El backend vuelve a consultar el usuario y su rol vigente antes de autorizar.
- Un token vencido, alterado, mal formado o asociado a un usuario inexistente produce `401`.

### Renovación

- El token aleatorio se entrega mediante cookie HttpOnly.
- En producción la cookie utiliza `Secure` y `SameSite=None`; en desarrollo usa `SameSite=Lax`.
- La cookie se limita a la ruta `/api/auth`.
- La base conserva el hash SHA-256 del token y su vencimiento, no el token original.
- Una renovación válida consume la sesión anterior y emite otra, reduciendo reutilización.
- El cierre de sesión revoca la sesión de renovación y elimina la cookie.

## Autorización y propiedad

- Las rutas privadas exigen JWT válido en el backend.
- RBAC diferencia `turista`, `operador` y `admin`.
- El operador modifica únicamente recursos asociados a su identificador, salvo facultades administrativas expresas.
- Las reservas se filtran: turista por `userId`, operador por `operatorId` y administrador por alcance autorizado.
- Los mensajes derivan remitente, nombre y rol de la sesión autenticada.
- Ocultar una acción en la interfaz mejora la experiencia, pero no es un control de seguridad suficiente.

## Cifrado y datos sensibles

- La identificación utilizada en una reserva se cifra con AES-256-GCM.
- Cada operación utiliza un IV aleatorio de 12 bytes y conserva la etiqueta de autenticación.
- La clave se deriva de `AES_SECRET_KEY`; producción rechaza una clave demasiado corta.
- La identificación no debe incluirse en listados administrativos, QR, mensajes, telemetría ni consultas mostradas durante una defensa.
- El tráfico de producción debe utilizar TLS/HTTPS. `usesCleartextTraffic` solo es tolerable en desarrollo local y debe desactivarse en la versión publicable.

## Biometría

La biometría no autentica una cuenta desde cero. Protege la reapertura de una sesión que ya fue iniciada con credenciales y que el usuario no cerró expresamente.

1. El dispositivo crea una clave privada protegida por el sistema y entrega la clave pública.
2. El backend asocia la clave pública con el usuario autenticado.
3. Al reabrir, el dispositivo solicita huella o reconocimiento facial para firmar un desafío.
4. El backend verifica la firma antes de restaurar el acceso.
5. Al cerrar sesión se revoca la asociación y se elimina la clave local cuando corresponde.

No se recopila ni almacena huella, rostro o plantilla biométrica. Android realiza la verificación dentro de su entorno seguro.

Las interacciones nativas esperadas, como abrir cámara, selector o ajustes, no deben activar el bloqueo biométrico al regresar. El bloqueo se reserva para una reapertura real de la aplicación.

## Permisos y minimización

| Capacidad | Declaración Android | Momento de solicitud | Alternativa |
|---|---|---|---|
| Ubicación | aproximada y precisa | Al pulsar Usar mi ubicación o una función dependiente | Punto de referencia manual, caché reciente o navegación sin distancia exacta. |
| Cámara | cámara | Al tomar fotografía o escanear QR | Selector del sistema cuando aplique; continuar sin cambiar imagen. |
| Notificaciones | notificaciones en Android moderno | Al habilitar avisos | Avisos internos consultados al abrir la app. |
| Biometría | gestionada por el sistema/plugin | Al desbloquear una sesión conservada | Volver al acceso con credenciales cuando no existe sesión válida. |

No se declara acceso amplio a almacenamiento para seleccionar imágenes. Se utiliza el selector del sistema.

## Estados de permiso y degradación

- **No solicitado:** explicar finalidad antes de mostrar el diálogo del sistema.
- **Concedido:** ejecutar la capacidad y presentar el resultado.
- **Denegado:** explicar que la función es opcional y ofrecer alternativa o nuevo intento razonable.
- **Bloqueado permanentemente:** no repetir diálogos; ofrecer acceso directo a ajustes.
- **Servicio desactivado:** distinguirlo del permiso y abrir ajustes de ubicación cuando el usuario lo solicite.
- **Hardware o servicio no disponible:** mantener la aplicación operativa y mostrar un mensaje accionable.
- **Tiempo agotado:** permitir reintento y, para ubicación, usar una lectura reciente dentro del límite definido.

## Persistencia local

- Ionic Storage conserva lecturas por siete días como máximo.
- Perfil, reservas, mensajes e información administrativa usan claves privadas y se eliminan al cerrar sesión.
- La última ubicación puede mantenerse para degradación, pero no representa seguimiento histórico.
- La caché mejora disponibilidad; no constituye la fuente autoritativa.
- No se guardan contraseñas ni claves privadas del backend en Ionic Storage.
- Una escritura que requiere consistencia nunca se presenta como completada si la API no confirmó.

## LOPDP y ciclo de vida

Antes de una operación que usa identificación, la interfaz informa su finalidad y exige una aceptación expresa. Para una publicación pública también deben definirse y aplicar:

1. identidad y datos de contacto del responsable;
2. categorías de datos y finalidades concretas;
3. base de legitimación aplicable;
4. destinatarios y proveedores encargados;
5. plazo de conservación por categoría;
6. procedimiento para acceso, rectificación, eliminación y oposición;
7. eliminación de cuenta y tratamiento de reservas que deban conservarse por obligación;
8. mecanismo para retirar consentimientos opcionales;
9. respuesta a incidentes y comunicación cuando corresponda;
10. política pública coherente con la declaración de seguridad de datos de la tienda.

## Gestión de secretos

- `.env`, `.env.local` y equivalentes reales permanecen fuera de Git.
- `.env.example` contiene solo marcadores y valores de desarrollo no sensibles.
- Toda variable `VITE_*` se considera pública porque se integra en el paquete frontend.
- `google-services.json`, credenciales de servicio, almacenes de claves y propiedades de firma no se publican.
- Las claves no se muestran en videos, capturas, consultas, tickets o documentación.
- Ante sospecha de exposición se revoca y rota el secreto; eliminarlo del último commit no basta si ya existe en el historial.

## Registros y errores

- Las respuestas de producción no incluyen trazas, consultas SQL, variables ni objetos de error internos.
- Los logs no deben contener contraseña, JWT completo, cookie, identificación, clave, imagen codificada o texto privado del chat.
- Los eventos operativos pueden registrar identificadores técnicos, ruta, código HTTP y tiempo, aplicando retención limitada.
- El cliente traduce el fallo a un mensaje comprensible sin revelar estructura interna.

## Lista de salida a producción

- [ ] API disponible exclusivamente mediante HTTPS.
- [ ] Tráfico claro desactivado en Android release.
- [ ] CORS limitado a orígenes conocidos.
- [ ] Claves distintas entre desarrollo y producción, rotables y respaldadas de forma segura.
- [ ] Firma Android de producción fuera del repositorio.
- [ ] Política de privacidad pública y declaración de tienda completadas.
- [ ] Eliminación de cuenta y datos comprobada.
- [ ] Firebase y SMTP configurados solo si esas funciones se anuncian.
- [ ] Copias de seguridad cifradas y restauración ensayada.
- [ ] Revisión de dependencias y permisos realizada.
- [ ] Pruebas de acceso por rol, propiedad, cierre de sesión y denegación de permisos superadas.
