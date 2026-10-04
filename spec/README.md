# Especificación de BañosTour

Esta carpeta constituye la referencia funcional y técnica del proyecto. Describe el comportamiento implementado, sus límites actuales y las condiciones necesarias para operar BañosTour de forma segura. No sustituye al código ni contiene credenciales, datos personales, direcciones privadas o valores reales de producción.

## Estado documental

**Fecha de revisión:** 4 de octubre de 2026  
**Versión documentada:** 1.0 en desarrollo  
**Plataforma comprobada:** Android 7.0 o superior (API 24+)  
**Estado de publicación:** apta para demostración académica; pendiente de preparación para distribución pública.

Los términos usados en los documentos tienen este significado:

- **Implementado:** existe en el código actual y forma parte del flujo operativo.
- **Condicional:** el código existe, pero necesita infraestructura o credenciales externas.
- **Planificado:** todavía no debe presentarse como funcionalidad disponible.
- **Fuera de alcance:** no forma parte de la versión actual.

## Índice

| Documento | Contenido |
|---|---|
| [Misión y visión](mision-vision.md) | Propósito, usuarios, propuesta de valor y principios. |
| [Alcance funcional](alcance-funcional.md) | Actores, requisitos, reglas de negocio, estados y exclusiones. |
| [Arquitectura](arquitectura.md) | Componentes, flujos, límites, comunicación y despliegue. |
| [Contratos de API](api-contratos.md) | Rutas, autorización, entradas, salidas y errores esperados. |
| [Modelo y persistencia de datos](modelo-datos.md) | Estado actual en PostgreSQL, entidades, integridad y evolución. |
| [Capacidades nativas](capacidades-nativas.md) | Permisos, estados, degradación y relación con el backend. |
| [Seguridad y privacidad](seguridad-privacidad.md) | Controles, clasificación de datos, sesiones, LOPDP y secretos. |
| [Operación y calidad](operacion-calidad.md) | Entornos, compilación, verificación, respaldo y criterios de salida. |
| [Hoja de ruta](hoja-de-ruta.md) | Trabajo pendiente ordenado por prioridad y condición de cierre. |

## Límites de esta documentación

- Los ejemplos usan identificadores ficticios y dominios reservados como `example.com`.
- Las variables se mencionan por nombre, nunca por su valor real.
- No se incluyen contraseñas, tokens, claves criptográficas, credenciales de Firebase, archivos de firma, cadenas de conexión ni datos exportados.
- Las rutas y respuestas representan el contrato actual; el código del backend sigue siendo la autoridad ejecutable.
- Las funciones que dependen de SMTP, Firebase o infraestructura pública se marcan como condicionales.

## Regla de actualización

Un cambio debe reflejarse en esta carpeta cuando modifica alguno de estos elementos:

1. rol autorizado o regla de negocio;
2. ruta, cuerpo o respuesta de la API;
3. dato recopilado, almacenado, cifrado o eliminado;
4. permiso del dispositivo o comportamiento ante su denegación;
5. variable de configuración, requisito de despliegue o nivel de API;
6. función presentada como implementada, condicional o futura.

Las ideas futuras pertenecen a la hoja de ruta y no deben describirse como capacidades terminadas.
