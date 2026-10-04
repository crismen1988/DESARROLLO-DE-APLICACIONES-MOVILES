# Arquitectura técnica

## Vista general

```text
┌─────────────────────────────────────────────────────────────┐
│ Android o navegador                                        │
│ Ionic React + TypeScript + Vite + Capacitor                 │
│ UI por rol | cliente HTTP | caché | adaptadores nativos     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP/JSON en desarrollo
                               │ HTTPS/JSON en producción
                               │ Authorization: Bearer JWT
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ API NestJS con adaptador Express                            │
│ CORS | límite de cuerpo | autenticación | RBAC | validación │
│ controladores | servicios de seguridad | persistencia       │
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ PostgreSQL 16                                               │
│ tablas relacionales | restricciones | índices | migraciones │
└─────────────────────────────────────────────────────────────┘

Servicios externos condicionales:
- Firebase Cloud Messaging para entrega push nativa.
- OpenStreetMap para teselas y OSRM para cálculo de rutas.
- Proveedor SMTP pendiente para recuperación por correo.
```

## Decisiones arquitectónicas

### Separación frontend/backend

`frontend` y `backend` son unidades independientes. Cada carpeta contiene dependencias, variables de ejemplo, exclusiones de Git y documentación propias. La comunicación se realiza únicamente mediante la API configurada en `VITE_API_BASE_URL`. Ningún componente importa archivos fuente del otro.

Esta separación permite publicar cada componente en un repositorio y desplegarlo de manera independiente. El contrato HTTP y las variables de entorno son los puntos de integración.

### Aplicación híbrida

Ionic React ofrece la interfaz y Capacitor empaqueta el resultado para Android. El código TypeScript accede a funciones nativas mediante plugins oficiales o plugins Android incluidos en el proyecto. El navegador mantiene alternativas cuando la capacidad web existe.

### Backend modular sobre NestJS

NestJS registra controladores para autenticación, tours, lugares, reservas, mensajes, perfiles, administración y notificaciones. Guardas globales interpretan metadatos de autenticación y roles antes de delegar en los controladores existentes.

### Persistencia relacional actual

PostgreSQL conserva el estado activo en tablas relacionales administradas por Prisma. `User` se relaciona con tours, lugares, reservas, mensajes y sesiones; `Booking` referencia al turista y al tour; los mensajes referencian remitente y destinatario. Los identificadores únicos, claves foráneas e índices se aplican desde migraciones versionadas.

`DatabaseStore` mantiene representaciones tipadas en memoria para conservar el contrato de los controladores. Al iniciar, las reconstruye desde las tablas relacionales; cada mutación entra en una cola y se confirma mediante una transacción Prisma. Este diseño evita cambios incompatibles en la API durante la migración, aunque una futura ejecución con varias instancias deberá sustituir el estado compartido en memoria por operaciones de repositorio directas o coordinación entre procesos.

`AppState` no es una fuente activa. Se conserva como respaldo histórico para instalaciones previas. La primera ejecución posterior a la migración importa sus colecciones y crea un marcador en `DataMigration`; desde entonces los inicios y las escrituras utilizan exclusivamente las tablas relacionales.

## Responsabilidades del frontend

| Capa | Responsabilidad |
|---|---|
| Componentes | Presentar pantallas, estados de carga, vacío, error y confirmación. |
| `apiClient` | Construir URL, añadir JWT, interpretar errores y consolidar la renovación. |
| Servicios de dominio | Encapsular rutas de tours, lugares, reservas, mensajes, perfiles y administración. |
| Caché offline | Conservar lecturas recientes y limpiar información privada al cerrar sesión. |
| Puente nativo | Gestionar ubicación, cámara, QR, biometría, notificaciones y ajustes. |
| Utilidades | Traducción ES/EN y cálculo geográfico. |

El frontend valida para ofrecer respuesta inmediata, pero una validación del cliente nunca reemplaza la validación del backend.

## Responsabilidades del backend

| Componente | Responsabilidad |
|---|---|
| `main.ts` | Iniciar la aplicación, prefijo `/api`, CORS, cabeceras, cookies y límite de solicitud. |
| `nest.module.ts` | Registrar rutas, guardas de autenticación y reglas RBAC. |
| `controllers/` | Aplicar reglas de negocio y producir respuestas HTTP. |
| `security/` | JWT, renovación, contraseñas, cifrado y traducción segura de errores. |
| `db/store.ts` | Adaptar tipos de dominio, cargar tablas relacionales y serializar transacciones de escritura. |
| `fcm.service.ts` | Enviar notificaciones cuando Firebase está configurado. |
| Prisma | Gestionar conexión, migraciones y acceso a PostgreSQL. |

## Flujos principales

### Inicio de sesión y renovación

1. El cliente envía correo y contraseña a `POST /api/auth/login`.
2. El backend busca el usuario y verifica el hash scrypt con comparación segura.
3. Si las credenciales son válidas, devuelve un JWT de acceso y crea una sesión de renovación.
4. El token de renovación viaja como cookie HttpOnly; el servidor persiste solo su hash.
5. Ante un `401`, el cliente intenta una única renovación compartida por las solicitudes concurrentes.
6. Si la renovación falla, elimina el token local y exige autenticación nuevamente.

### Reserva

1. El turista selecciona tour, fecha no pasada, participantes y acepta el tratamiento informado en la interfaz.
2. El cliente valida campos básicos y envía la solicitud autenticada.
3. El backend obtiene el turista desde el JWT, consulta el tour y valida disponibilidad y cupos.
4. Calcula el total con el precio persistido y cifra la identificación con AES-256-GCM.
5. Genera identificador y código QR, actualiza ocupación y persiste el estado.
6. Devuelve una representación sin la identificación en texto claro.
7. El cliente actualiza la interfaz y la copia offline privada.

### Ubicación y mapa

1. El usuario pulsa la acción de ubicación.
2. La app explica el propósito y consulta el estado del permiso.
3. Con permiso concedido, distingue permiso de servicio GPS habilitado.
4. Obtiene posición actual o una lectura nativa reciente dentro del límite permitido.
5. Calcula distancias en el dispositivo y actualiza el mapa mientras la vista está activa.
6. La última ubicación se guarda localmente para degradación; no se envía al backend como historial.

### Servicio del operador

1. El operador crea o edita un formulario y obtiene una imagen del selector o cámara.
2. El cliente recorta/comprime la imagen y envía la operación autenticada.
3. El backend comprueba el rol y, en edición o eliminación, la propiedad del servicio.
4. La cola de persistencia confirma la transacción relacional antes de responder.

## Comunicación y errores

- Formato: JSON UTF-8, excepto recursos estáticos y datos de imagen codificados por el flujo actual.
- Prefijo: `/api`.
- Autenticación: `Authorization: Bearer <token>` para rutas privadas.
- Renovación: cookie HttpOnly limitada a `/api/auth`.
- Éxito: códigos 200 o 201 según la operación.
- Cliente inválido: 400.
- Sesión ausente o vencida: 401.
- Rol o propiedad insuficiente: 403.
- Recurso inexistente: 404.
- Conflicto, por ejemplo correo duplicado o cupos agotados: 409 cuando corresponde.
- Fallo inesperado: respuesta 500 controlada, sin traza ni secretos.

## Entornos de ejecución

### Desarrollo web

El navegador usa el proxy de Vite hacia la API local. Adecuado para interfaces y lógica que no dependen de hardware.

### Android por USB

`adb reverse tcp:3000 tcp:3000` permite que `localhost:3000` en el dispositivo llegue al backend del equipo. Es una configuración de desarrollo, no una solución de producción.

### Red local

El dispositivo consume temporalmente una dirección LAN. Requiere misma red y reglas de firewall. No ofrece disponibilidad pública ni identidad TLS.

### Producción planificada

- API desplegada en una URL HTTPS estable.
- PostgreSQL administrado o protegido en una red privada.
- CORS limitado a orígenes reales.
- secretos inyectados por el entorno de ejecución;
- migraciones ejecutadas como paso controlado;
- monitoreo, copias de seguridad y recuperación comprobada;
- aplicación Android firmada como `release` y configurada con la URL HTTPS.

## Restricciones conocidas

- El proceso conserva representaciones en memoria; varias instancias escribiendo en paralelo necesitarían repositorios directos o coordinación para evitar estados obsoletos.
- Las imágenes codificadas dentro del flujo actual aumentan el tamaño de solicitud; producción debería usar almacenamiento de objetos.
- El paquete web principal todavía puede beneficiarse de división dinámica de código.
- OSRM, teselas de mapa, Firebase y correo dependen de disponibilidad externa.
- El identificador y la firma definitiva de Android deben resolverse antes de publicar.
