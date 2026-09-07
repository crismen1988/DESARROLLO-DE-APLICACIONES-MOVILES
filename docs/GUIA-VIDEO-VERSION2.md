# Recorrido para el video de BañosTour versión 2

Fecha: 2026-09-06. Presentar esta entrega como una aplicación en desarrollo con backend y cliente móvil integrados.

## Antes de grabar

1. Levantar Docker y la API; comprobar `npx prisma migrate status` desde `backend`.
2. Configurar `VITE_API_URL` para navegador, emulador o teléfono. En Android, compilar y sincronizar después de cambiar código o URL.
3. Preparar una cuenta de demostración sin datos personales reales. Usar el seed de administrador únicamente si se mostrará ese rol.
4. Confirmar la conexión desde el dispositivo y recorrer las pantallas. Las pruebas del navegador con API simulada no sustituyen esta comprobación.

## Recorrido sugerido

1. Mostrar bienvenida, marca y selector de idioma.
2. Mostrar validaciones del login y del registro, confirmación de contraseña y selección turista/prestador. Explicar RUC y aprobación administrativa.
3. Iniciar sesión como turista. Mostrar categorías, búsqueda y agenda. Si no hay eventos, explicar el estado vacío.
4. Abrir Explorar desde una categoría o búsqueda, limpiar filtros y mostrar paginación cuando existan suficientes lugares.
5. Consultar favoritos y perfil. Editar biografía o foto; mostrar guardar y cancelar, datos personales y actividad propia.
6. Cerrar sesión desde Perfil → Ajustes y comprobar que una ruta protegida solicita autenticación.
7. Opcional: entrar como administrador y mostrar las acciones reales de aprobación/activación y la consulta de reportes.
8. Mostrar la rama `banostour_version2`, el README y los resultados de verificación.

## Alcance que debe explicarse

La recuperación de contraseña requiere un SMTP configurado y comprobación de entrega real. La API ofrece funciones adicionales que aún no cuentan con editor móvil. Los botones administrativos de categorías y creación de contenido son pendientes de interfaz. Los mapas, GPS, modo offline y push real quedan para una etapa posterior. No presentar el worker que escribe en consola como envío push al teléfono.
