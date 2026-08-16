# Verificación del entorno y requisitos de BañosTour

Fecha de auditoría: 2026-08-15. Proyecto: `D:\PROYECTO_APP_MOVILES\banostour`.

## Criterio

`Completado` significa que existe evidencia en archivos o que el comando/prueba se ejecutó con éxito. `Pendiente` significa que requiere un servicio o dispositivo que no estaba disponible. No se infiere cumplimiento por la sola presencia de una configuración.

| Requisito | Estado | Evidencia o acción pendiente |
|---|---|---|
| Framework elegido y justificación técnica | Completado | Ionic React + TypeScript + Capacitor; justificación en `mobile/README.md`. |
| Node.js y npm | Completado | `node --version` → `v24.19.0`; `npm --version` → `11.19.0`. |
| Ionic | Pendiente de reconfirmar | El proyecto declara Ionic React `8.5.0`. `ionic --version` no pudo completar porque el CLI global recibió `EPERM` al escribir `C:\Users\crismen\.ionic\config.json`. |
| Capacitor | Pendiente de reconfirmar | Dependencias `@capacitor/*` `8.5.0`; `npx cap doctor` solo mostró `Capacitor Doctor` y quedó bloqueado. |
| Java | Completado | `java -version` → OpenJDK `21.0.12` LTS. |
| Android SDK / adb | Parcial | `adb.exe` existe en `C:\Users\crismen\AppData\Local\Android\Sdk\platform-tools`, pero no está en PATH. |
| Emulador Pixel 7 | Pendiente | `emulator.exe -list-avds` no devolvió AVD; iniciar/configurar `Pixel_7` en Android Studio. |
| Teléfono físico | Pendiente | `adb devices` detectó `1122564423020012` como `unauthorized`; aceptar la clave RSA en el teléfono y repetir hasta estado `device`. |
| Backend NestJS + Prisma compila | Completado | `backend/npm run build` terminó correctamente; Prisma Client `7.9.1` generado. |
| Pruebas backend | Completado | `npm test -- --runInBand`: 4 suites y 4 tests aprobados. |
| PostgreSQL / Redis / pgAdmin | Pendiente | `docker compose ps` no pudo conectar con Docker Engine; no hay evidencia de contenedores activos. |
| `/auth/login`, `/auth/registro`, `/auth/me` | Completado en código | Rutas presentes en `backend/src/auth/auth.controller.ts`; prueba HTTP real pendiente. |
| URL emulador | Completado en configuración | `.env.local` admite `http://10.0.2.2:3000`; descomentar esa línea y recompilar. |
| URL teléfono físico | Completado en configuración | `.env.local` usa `http://192.168.1.18:3000`; requiere misma red y firewall permitido. |
| Excepción HTTP limitada | Completado en configuración | `network_security_config.xml` solo permite `10.0.2.2` y `192.168.1.18`; no se permite cleartext global. |
| Solicitud exitosa app → backend | Pendiente | El backend en `localhost:3000` agotó el tiempo de espera; levantar Docker, migraciones y backend. |
| Pantallas welcome/login/registro/home | Completado en código | Rutas en `mobile/src/App.tsx`; revisión visual pendiente de dispositivo o navegador. |
| Ojo de contraseña | Completado en código | `Login.tsx` usa `eyeOutline`/`eyeOffOutline`, botón accesible y cambia `type`. |
| Limpieza al regresar a login | Completado en código | `useIonViewWillEnter` limpia correo, contraseña, visibilidad y error cada vez que entra la vista. |
| Codificación UTF-8 | Completado en fuentes | Los textos se leen correctamente con `Get-Content -Encoding utf8`. |
| Build frontend | Parcial | `npx tsc --noEmit` y `npx vite build --minify false` pasaron; `npm run build` queda bloqueado durante minificación. |
| Recarga en caliente | Pendiente de evidencia visible | Ejecutar `npm run dev`, abrir Vite y modificar un texto sin reiniciar. |
| README frontend/backend | Completado | Ambos READMEs documentan stack, ejecución, endpoints y limitaciones. |

## Comandos para cerrar los pendientes

```powershell
cd D:\PROYECTO_APP_MOVILES\banostour
docker compose up -d
cd backend
npx prisma migrate deploy
npm run start:dev

# otra terminal, frontend
cd D:\PROYECTO_APP_MOVILES\banostour\mobile
npm run dev
# o para Android:
npx tsc --noEmit
npx vite build --minify false
npx cap sync android
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
npx cap run android --target emulator-5554
```

Usar `VITE_API_URL=http://10.0.2.2:3000` en el emulador o `VITE_API_URL=http://192.168.1.18:3000` en el teléfono físico antes de compilar.
