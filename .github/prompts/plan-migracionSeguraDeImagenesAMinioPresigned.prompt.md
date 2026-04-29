## Plan: Migracion Segura de Imagenes a MinIO Presigned

Objetivo: migrar el flujo de subida/lectura de imagenes para usar URLs firmadas privadas con MinIO (sin CDN por ahora), reduciendo riesgos de abuso, mejorando resiliencia y manteniendo compatibilidad con el flujo actual.

**Pasos**
1. Fase 0 - Asegurar contrato y compatibilidad.
   - Definir contrato nuevo de subida: `POST /api/Images/presigned-upload` devuelve `fileName`, `uploadUrl`, `expiresAtUtc`.
   - Mantener `POST /api/Images/upload` como fallback legacy para no romper clientes.
   - Dependencia: bloquea fases 1 y 2.

2. Fase 1 - Hardening de API y dominio (seguridad primero).
   - Extender `IImageService` para soportar generacion de URL de subida firmada.
   - Extender `IStoragePort` para generar presigned PUT de subida.
   - Implementar validacion fuerte de entrada en API/Application:
     - `contentType` permitido (`image/jpeg`, `image/png`, `image/webp`, `image/gif`).
     - `sizeBytes` obligatorio y rango permitido (recomendado <= 5MB configurable).
     - Rechazo explicito para tipos/size invalidos con `400` y mensaje legible.
   - Generar objeto key seguro en backend (GUID + carpeta por fecha), ignorando nombre original del cliente.
   - Dependencia: bloquea fase 2.

3. Fase 2 - Integracion MinIO presigned upload.
   - Implementar en adapter MinIO el presigned PUT con expiracion corta (10-15 min).
   - Garantizar `Content-Type` esperado en la firma para evitar uploads ambiguos.
   - Mantener endpoint de lectura actual `GET /api/Images/{fileName}` para backward compatibility.
   - Dependencia: bloquea fase 3.

4. Fase 3 - Frontend upload directo + fallback.
   - Actualizar `ImageService.ts`:
     - Solicita URL firmada al backend.
     - Sube por `fetch PUT` directo a MinIO.
     - Si falla contrato nuevo (404/501/timeout), fallback automatico a multipart legacy.
   - Añadir validacion cliente de tipo y tamano antes de subir para feedback temprano.
   - Cambiar `Promise.all` por `Promise.allSettled` en create page para evitar fallo total por una imagen.
   - Limpiar logs sensibles (`console.log({files})`).
   - Dependencia: puede avanzar en paralelo con fase 4 parcial.

5. Fase 4 - Resolucion de imagenes para futuro CDN.
   - Centralizar resolucion en util existente (`videogameImages.ts`) y soportar base configurable:
     - `NEXT_PUBLIC_IMAGE_BASE_URL` opcional (futuro CDN).
     - Si no existe, mantener ruta actual `/api/Images/{fileName}`.
   - Reutilizar util central en `create/page.tsx` para evitar logica duplicada.
   - Puede correr en paralelo con fase 3.

6. Fase 5 - Seguridad operativa y explotabilidad.
   - Limitar duracion de URLs firmadas de descarga (15-60 min segun riesgo).
   - Revisar CORS en MinIO para permitir solo origenes web del proyecto.
   - (Recomendado) rate limit en endpoint de presigned upload por usuario/IP.
   - (Recomendado) mover secretos MinIO fuera de archivos versionados y rotar credenciales.
   - Dependencia: independiente, pero debe quedar antes de produccion.

7. Fase 6 - Validacion y rollout.
   - Tests API: casos felices y invalidos (`contentType`, `sizeBytes`, expiracion, auth).
   - Tests frontend: subidas parciales, timeout, fallback legacy, reorder de imagenes.
   - Smoke manual: crear item con 1/3/9 imagenes y verificar preview + persistencia.
   - Rollout por feature flag de cliente (`NEXT_PUBLIC_USE_PRESIGNED_UPLOAD=true`).

**Edge cases y riesgos cubiertos**
- Entrada vacia o tamano 0 -> `400` con error explicito.
- Tipo MIME no permitido o nulo -> `400`.
- Archivo grande (DoS por storage/costo) -> rechazo por size antes de firmar.
- Path/object key injection -> key generado solo por backend, no por cliente.
- Reuso de URL firmada -> expiracion corta + alcance solo a un key.
- Caida MinIO o red intermitente -> fallback al endpoint legacy y errores claros.
- Fallo de una imagen entre varias -> `Promise.allSettled` evita abortar lote completo.
- URL de imagen expirada en render -> endpoint de lectura existente mantiene compatibilidad.

**Archivos relevantes**
- `/Volumes/Mac_Nvme/Dev/Dotnet/Boilerplate/Videogames.API/Controllers/ImagesController.cs` - nuevo endpoint presigned + validaciones.
- `/Volumes/Mac_Nvme/Dev/Dotnet/Boilerplate/Videogames.Application/Services/IImageService.cs` - contrato de generacion presigned.
- `/Volumes/Mac_Nvme/Dev/Dotnet/Boilerplate/Videogames.Application/Services/ImageService.cs` - reglas de validacion + key strategy.
- `/Volumes/Mac_Nvme/Dev/Dotnet/Boilerplate/Videogames.Domain/Ports/IStoragePort.cs` - abstraccion presigned upload.
- `/Volumes/Mac_Nvme/Dev/Dotnet/Boilerplate/Videogames.Infrastructure/Adapters/MinioStorageAdapter.cs` - firma PUT URL.
- `/Volumes/Mac_Nvme/Dev/Dotnet/Boilerplate/Videogames.Web/src/infrastructure/services/ImageService.ts` - subida directa + fallback.
- `/Volumes/Mac_Nvme/Dev/Dotnet/Boilerplate/Videogames.Web/src/app/create/page.tsx` - validacion cliente + allSettled.
- `/Volumes/Mac_Nvme/Dev/Dotnet/Boilerplate/Videogames.Web/src/utils/videogameImages.ts` - resolucion de base URL configurable.
- `/Volumes/Mac_Nvme/Dev/Dotnet/Boilerplate/Videogames.Web/src/constants/config.ts` - `NEXT_PUBLIC_IMAGE_BASE_URL`.

**Verificacion**
1. `dotnet test --nologo` en repo root (API + Application).
2. `dotnet build Videogames.API/Videogames.API.csproj` para validar contratos DI.
3. `npm run build` en `Videogames.Web` para validar TS y rutas.
4. E2E manual create listing con 1, 3 y 9 imagenes; forzar un fallo de una imagen y verificar exito parcial.
5. Verificar que preview y cards cargan imagen usando key almacenado (no URL externa).

**Decisiones**
- CDN: no en esta iteracion.
- Visibilidad de objetos: privadas con URL firmada.
- Incluye: seguridad de subida, compatibilidad, calidad UX de errores.
- Excluye: migracion masiva historica de datos y activacion de CDN edge (quedan para fase siguiente).