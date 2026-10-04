# Misión, visión y principios del producto

## Identidad

BañosTour es un proyecto personal e independiente. Facilita el acceso a información turística de Baños de Agua Santa y la comunicación con operadores locales. No pertenece, no representa y no actúa en nombre de un municipio, GAD, ministerio u otra entidad pública.

## Problema que atiende

La información turística suele encontrarse dispersa entre redes sociales, páginas individuales y recomendaciones informales. Esto dificulta comparar actividades, conocer distancias, confirmar cupos y conservar un comprobante de reserva. Los operadores, a su vez, necesitan administrar sus servicios y responder consultas desde un canal organizado.

## Misión

Facilitar que turistas descubran, comparen y reserven experiencias y lugares de Baños de Agua Santa desde una aplicación móvil clara, segura y útil durante el viaje, incluso cuando la conectividad sea limitada.

## Visión

Consolidar BañosTour como una plataforma personal confiable para conectar turistas y operadores locales, presentar información práctica y aprovechar capacidades del dispositivo con un tratamiento proporcional y transparente de los datos personales.

## Usuarios y necesidades

### Turista

Necesita localizar experiencias y puntos de interés, comparar precio y dificultad, conocer la distancia aproximada, reservar, conservar un boleto QR y comunicarse con el operador.

### Operador turístico

Necesita publicar y mantener su oferta, controlar disponibilidad, consultar reservas vinculadas y responder al turista que inició la conversación.

### Administrador de la plataforma

Necesita revisar operadores, consultar indicadores operativos, supervisar reservas y difundir avisos sin acceder a funciones ajenas a su responsabilidad.

## Propuesta de valor

- Reúne exploración, ubicación, reserva, boleto y mensajería en un solo flujo.
- Adapta la navegación y las operaciones al rol autenticado.
- Permite leer información consultada recientemente cuando se pierde la red.
- Utiliza cámara, GPS, QR y biometría en acciones donde aportan una utilidad concreta.
- Mantiene la autoridad sobre datos y permisos en el backend, no solo en la interfaz.

## Principios de diseño y desarrollo

1. **Seguridad y privacidad desde el diseño.** Se recopila únicamente lo necesario y se aplican controles tanto en cliente como en servidor.
2. **Autoridad en el backend.** La API vuelve a validar identidad, rol, propiedad y reglas críticas aunque la interfaz ya las haya comprobado.
3. **Interfaz comprensible.** Cada acción debe indicar su resultado, error o requisito sin exponer detalles internos.
4. **Accesibilidad móvil.** Los flujos deben funcionar en pantallas pequeñas, mantener navegación visible y utilizar contraste legible.
5. **Degradación controlada.** La falta de red, permiso, sensor o servicio externo debe producir una alternativa o explicación accionable.
6. **Datos verificables.** No se presentan métricas, confirmaciones o estados simulados como si procedieran del backend.
7. **Separación de funciones.** Turista, operador y administrador reciben solo las operaciones correspondientes a su rol.
8. **Transparencia.** Las integraciones condicionales y limitaciones actuales se documentan expresamente.

## Criterios de éxito de la versión

La versión cumple su objetivo académico cuando permite demostrar, con datos persistidos:

- autenticación y navegación diferenciada para los tres roles;
- consulta de tours y lugares con búsqueda, filtros, mapa y distancia;
- creación de una reserva y recuperación posterior de su boleto QR;
- administración completa de un servicio propio por un operador;
- mensajería atribuida al usuario real;
- comprobación del resultado en la API y en PostgreSQL;
- respuesta controlada ante pérdida de red o denegación de permisos.

La publicación pública requiere además infraestructura HTTPS, firma de producción, política de privacidad, mecanismo de eliminación de cuenta y declaraciones de tienda.
