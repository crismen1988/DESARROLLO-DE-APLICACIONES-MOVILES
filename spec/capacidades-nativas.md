# Capacidades nativas y degradación

## Alcance

BañosTour integra capacidades del dispositivo cuando aportan valor al flujo turístico. Todas son opcionales para la instalación: la ausencia de GPS o cámara no debe impedir que la aplicación abra y permita las operaciones que no dependen de ellas.

## Matriz general

| Capacidad | Uso | Plugin o puente | Persistencia | Backend |
|---|---|---|---|---|
| Ubicación | Distancias, posición actual y mapa | Capacitor Geolocation + `DeviceSettings` | Última lectura con fecha | No almacena historial de ubicación. |
| Cámara/fotos | Avatar e imagen de servicio | Selector/cámara del sistema + modal | Imagen hasta guardar | Perfil o tour recibe la imagen procesada. |
| Escáner QR | Verificar boleto accesible para el rol | ML Kit y cámara | No conserva video | Compara contra reservas ya autorizadas. |
| Biometría | Desbloquear sesión conservada | Clave Android protegida + desafío | Referencia de cuenta y clave local segura | Guarda clave pública y verifica firma. |
| Notificaciones | Avisos, promociones y reservas | Capacitor Push Notifications | Token local y avisos consultados | Registra token y usa FCM si está configurado. |

## Ubicación

### Secuencia

1. El usuario pulsa Usar mi ubicación o abre una función que la necesita.
2. La aplicación consulta `prompt`, `granted`, `denied` o `blocked`.
3. Si nunca se solicitó, explica que se usará para distancias y mapa.
4. Después de conceder, comprueba por separado que el servicio de ubicación esté activo.
5. Solicita una lectura con tiempo límite.
6. Guarda la lectura con precisión y fecha y actualiza distancias.
7. En el mapa, mantiene una observación mientras la vista está activa y la detiene al salir.

### Degradación

| Situación | Comportamiento esperado |
|---|---|
| Permiso no concedido | Mantener punto de referencia manual y explicar cómo activarlo. |
| Denegación recuperable | Permitir continuar sin GPS y volver a solicitar desde una acción explícita. |
| Denegación permanente | Mostrar acceso a ajustes de la aplicación. |
| Servicio GPS apagado | Abrir ajustes de ubicación, no confundir con permiso. |
| Tiempo agotado | Informar y permitir reintento; usar lectura nativa reciente cuando exista. |
| Sin lectura nueva | Usar una ubicación guardada válida para referencia, indicando su limitación. |
| Navegador sin API | Mantener selección manual y catálogo. |

La lectura nativa conocida se descarta si supera aproximadamente una hora. La caché general tiene un límite mayor, pero debe presentarse como dato anterior, no como posición en tiempo real.

## Cámara, selector e imágenes

### Usos separados

- **Fotografía:** captura un avatar o imagen del servicio.
- **Selector:** permite escoger una imagen mediante el proveedor del sistema sin solicitar permiso amplio de galería.
- **QR:** abre cámara para leer un boleto.

Las fotografías de servicios se recortan a proporción 16:9 y se comprimen antes de enviarse. El backend acepta formatos de imagen definidos y limita el tamaño de la referencia recibida.

### Degradación

- Denegar cámara no debe cerrar el formulario ni solicitar biometría al regresar.
- Para una foto puede mantenerse la imagen anterior o utilizar el selector del sistema.
- Para QR, si la cámara queda bloqueada, se ofrece acceso a ajustes y se conserva la consulta manual de reservas.
- Cancelar cámara o selector no se considera un error de sesión.
- La imagen solo se persiste al guardar el perfil o servicio; una captura cancelada no modifica datos.

## Biometría

### Condiciones de uso

- Solo Android en la versión actual.
- Requiere una autenticación previa con correo y contraseña.
- Se usa al regresar a una aplicación cerrada o enviada al fondo con sesión conservada.
- No se solicita por abrir cámara, selector o ajustes durante una acción esperada.
- Cerrar sesión elimina el acceso biométrico de esa sesión; el siguiente acceso exige credenciales.

### Flujo criptográfico

1. El dispositivo genera un par de claves; la privada no abandona el almacén protegido.
2. La API recibe `keyId` y clave pública mediante una sesión autenticada.
3. Para desbloquear, el cliente pide un desafío de un solo uso con vigencia aproximada de un minuto.
4. Android solicita huella o rostro para autorizar la firma.
5. La API verifica firma, dispositivo, usuario y vigencia, y consume el desafío.
6. Solo entonces emite tokens de sesión nuevos.

### Fallos

- Sin hardware, sin biometría registrada o clave invalidada: volver al inicio con credenciales.
- Usuario cancela: mantener contenido bloqueado.
- Firma, dispositivo o desafío inválido: `401`, sin crear sesión.
- Cierre explícito previo: ocultar la opción biométrica.

## Escáner QR

- Los tres roles pueden abrir la cámara desde una acción disponible para su flujo.
- La aplicación no debe aceptar un código solo porque tenga el prefijo esperado.
- Turista verifica únicamente sus reservas.
- Operador verifica reservas de sus servicios.
- Administrador verifica según su alcance administrativo.
- Un código inexistente o no autorizado produce un mensaje controlado sin revelar a quién pertenece.

La verificación actual usa las reservas accesibles cargadas por la sesión. Una validación criptográfica completamente offline está planificada, no implementada.

## Notificaciones

### Aviso persistido

El administrador crea un aviso con título, cuerpo, audiencia y tipo. Este registro queda disponible para consulta interna incluso cuando FCM no está configurado.

### Entrega nativa condicional

1. Con permiso concedido, Capacitor registra el dispositivo.
2. El token se vincula al usuario autenticado y se limita a cinco tokens recientes.
3. El administrador difunde el aviso.
4. El backend selecciona usuarios por audiencia y envía sus tokens a FCM.
5. La respuesta distingue servicio configurado, enviados y fallidos.

Sin credenciales Firebase, la aplicación no debe afirmar que una notificación llegó con la app cerrada. Puede demostrar el aviso interno persistido.

## Permisos Android declarados

- `INTERNET`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_FINE_LOCATION`
- `CAMERA`
- `POST_NOTIFICATIONS`

El GPS y la cámara se declaran como hardware no obligatorio. No se solicitan permisos amplios de almacenamiento.

## Evidencia mínima en dispositivo físico

Para cada capacidad seleccionada en una evaluación:

1. mostrar explicación previa;
2. demostrar permiso concedido y resultado útil;
3. demostrar denegación sin cierre o pantalla bloqueada;
4. demostrar denegación permanente y acceso a ajustes;
5. distinguir permiso de servicio desactivado cuando aplique;
6. evidenciar caché o registro enviado al backend;
7. reiniciar el flujo para comprobar que el estado final es coherente.
