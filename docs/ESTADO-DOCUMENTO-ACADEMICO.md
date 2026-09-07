# Actualización del documento académico para la versión 2

Fecha: 2026-09-06. Este documento acompaña a `DOCUMENTACIÓN_APP_BAÑOSTOUR.docx` y actualiza sus propuestas según el código actual. El Word conserva las respuestas originales de los foros como antecedentes; no debe utilizarse como lista de funciones terminadas ni como especificación ejecutable.

| Propuesta o afirmación anterior | Estado real de la versión 2 |
|---|---|
| JavaScript como lenguaje principal y migración futura a TypeScript | Backend y cliente ya usan TypeScript. El tipado estático corresponde a TypeScript, no a JavaScript. |
| Mapa, geolocalización, almacenamiento offline y push | Pendientes. Las dependencias sugeridas en los foros no equivalen a integraciones instaladas. |
| Modelo Prisma ilustrativo con `ubicacionGPS`, `Notificacion` y `@check` | El modelo vigente es `backend/prisma/schema.prisma`: coordenadas separadas, imágenes/horarios/contacto normalizados y sin modelo de notificaciones persistentes. No copiar el pseudocódigo del foro como migración. |
| Dos roles | Existen `TURISTA`, `PROVEEDOR` y `ADMINISTRADOR`; el tipo de cuenta diferencia turista de prestador turístico. |
| Actualizar perfil o POIs mediante PUT | Se utiliza `PATCH /usuarios/perfil` y `PATCH /puntos-interes/:id`. |
| Rutas `/reseñas` y `/admin/usuarios` | Las rutas son `/resenas` y `/usuarios`; la autorización administrativa se verifica con guards. |
| Agregar favoritos con `POST /favoritos` | Se utiliza `POST /favoritos/:puntoInteresId`. |
| Ambos tokens son JWT firmados | El access token es JWT y dura una hora. El refresh token es opaco, aleatorio, dura siete días y su hash se persiste y revoca en PostgreSQL. |
| Tokens en almacenamiento seguro nativo y renovación automática | Los tokens del cliente están en memoria. El correo recordado y el idioma sí usan localStorage. Persistencia segura y renovación automática siguen pendientes. |
| Sesión completamente sin estado en el servidor | Los refresh tokens y su revocación se guardan en base de datos; el guard también comprueba que la cuenta siga activa. |
| Recuperación de acceso futura | API y pantallas implementadas con token hasheado de un solo uso y expiración de 15 minutos; entrega de correo real pendiente de verificar con SMTP. |
| Propuestas de respuesta a reseñas, visitas y moderación avanzada | No se declaran implementadas. Las estadísticas del perfil muestran actividad y valoraciones existentes, no analítica de visitas. |

La referencia operativa es el [README principal](../README.md), los READMEs de backend y móvil y el [informe de verificación](VERIFICACION-ENTORNO.md). Esta revisión leyó el contenido del Word, pero no modificó ni verificó visualmente su maquetación: el entorno no dispone del runtime documental y renderizador empaquetados requeridos.
