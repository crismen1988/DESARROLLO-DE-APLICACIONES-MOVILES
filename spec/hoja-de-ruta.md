# Hoja de ruta

Esta hoja separa trabajo necesario para publicación de mejoras evolutivas. Una tarea solo cambia a completada cuando satisface su condición de cierre y la documentación asociada se actualiza.

## Prioridad 0 — Bloqueos de publicación

| Trabajo | Motivo | Condición de cierre |
|---|---|---|
| Desplegar API y PostgreSQL | La dirección local no está disponible para usuarios externos. | API estable mediante HTTPS, base no expuesta públicamente, salud y recuperación comprobadas. |
| Configurar entorno de producción | Desarrollo contiene URL local y permite tráfico claro. | Variables inyectadas, CORS restringido y Android release rechaza HTTP. |
| Definir identidad y firma Android | La compilación actual es de depuración y el identificador debe representar un proyecto personal. | Identificador definitivo, clave de carga protegida y AAB release instalado desde canal de prueba. |
| Publicar privacidad y eliminación | La aplicación procesa cuenta, ubicación, reservas y documentos. | Política pública, formulario de tienda coherente y solicitud de eliminación probada. |
| Copias de seguridad | Una falla de almacenamiento podría afectar los datos relacionales. | Respaldo cifrado automático y restauración ensayada con resultado verificable. |

## Prioridad 1 — Funciones anunciadas que dependen de terceros

### Notificaciones push

- Configurar proyecto Firebase por ambiente.
- Mantener credenciales exclusivamente en backend y archivo Android excluido de Git.
- Probar permiso concedido, denegado, bloqueado y recepción con app abierta, en segundo plano y cerrada.
- Depurar tokens inválidos sin registrar el valor completo.

**Cierre:** el backend informa configuración activa, un dispositivo físico recibe el aviso y la preferencia del usuario se respeta.

### Recuperación de contraseña

- Seleccionar proveedor SMTP o transaccional.
- Evitar enumeración de cuentas en respuestas públicas.
- Almacenar códigos como valores no recuperables, limitar intentos y aplicar expiración.
- Revocar sesiones después del cambio y registrar un evento seguro.

**Cierre:** un usuario de prueba recibe el mensaje, cambia la contraseña y las sesiones anteriores dejan de funcionar.

## Prioridad 2 — Preparación para usuarios reales

1. Ejecutar pruebas guiadas con turista, operador y administrador.
2. Verificar Android en varios tamaños, versiones y fabricantes.
3. Añadir monitoreo de errores y métricas técnicas sin contenido personal.
4. Definir soporte, tratamiento de incidentes y tiempos de respuesta.
5. Revisar accesibilidad: contraste, tamaño táctil, lector de pantalla y ampliación.
6. Corregir advertencias de tamaño mediante carga dinámica donde reduzca el arranque real.
7. Establecer retención para cuentas, reservas, mensajes, tokens y respaldos.

**Cierre:** no existen fallos críticos abiertos, los recorridos principales son repetibles y los usuarios conocen las condiciones de la prueba.

## Persistencia relacional completada

La migración `20261004_relational_persistence` trasladó usuarios, sesiones, tours, lugares, reservas, mensajes y notificaciones a tablas relacionadas. `DataMigration` evita una segunda importación y `AppState` dejó de recibir escrituras. Se conserva temporalmente como respaldo histórico para recuperación controlada.

Trabajo posterior de madurez:

1. automatizar respaldos cifrados y ensayar restauraciones;
2. observar duración y fallos de las transacciones;
3. mover las mutaciones a repositorios directos antes de ejecutar varias instancias simultáneas;
4. retirar `AppState` únicamente después de contar con un respaldo externo verificado y finalizar el periodo de transición.

**Estado:** persistencia relacional activa; retiro físico del respaldo legado pendiente por seguridad de recuperación.

## Prioridad 4 — Escalabilidad y experiencia

- Paginación y orden explícito en colecciones.
- Almacenamiento de imágenes en servicio de objetos con URL firmada o pública controlada.
- Caché HTTP y CDN para contenido público medido.
- Validación criptográfica del QR para escenarios offline controlados.
- Descarga seleccionable de información turística para zonas sin cobertura.
- Rutas y mapas con manejo de límites del proveedor.
- Métricas de producto únicamente con consentimiento y minimización.

Redis se evaluará solo si mediciones de latencia, carga o coordinación demuestran una necesidad concreta. No se incorpora por requisito nominal.

## Soporte iOS futuro

Antes de declarar compatibilidad iOS:

- crear y mantener el proyecto nativo;
- incluir cadenas de propósito específicas para cámara, ubicación y fotos;
- adaptar biometría a Face ID/Touch ID mediante almacenamiento seguro;
- configurar notificaciones APNs/FCM;
- probar permisos, enlaces, segundo plano y políticas en dispositivo físico;
- preparar firma, perfiles y ficha de App Store.

## Elementos fuera de planificación inmediata

- pagos y almacenamiento de medios de pago;
- integraciones gubernamentales;
- seguimiento continuo de ubicación;
- publicidad comportamental;
- mercado abierto sin verificación de operadores.

Incorporarlos requeriría una nueva evaluación de seguridad, privacidad, responsabilidad y reglas de tienda.
