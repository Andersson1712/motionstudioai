# Plan: HyperFrames por escena, video de prueba completo y pantalla de videos guardados

## 1. HyperFrames en el editor (animación propia por escena)
- Primer paso: confirmar la librería HyperFrames (HeyGen, composiciones HTML + animaciones con tiempo controlado) y su forma de uso en el navegador. Si no se puede usar en el navegador, se usa su formato HTML con un motor de animación equivalente, manteniendo los archivos compatibles para su render.
- Cada escena del timeline recibe un bloque de animación HTML propio, generado por la IA a partir del texto de la escena y los colores del Brand Kit.
- El planificador de escenas añade ese bloque por escena; si falla o es inválido, la escena usa la animación Remotion actual.
- El reproductor en vivo muestra la animación HyperFrames de cada escena sincronizada con el frame de Remotion (se pausa, avanza y salta igual), con los subtítulos encima.
- En el inspector de escenas: botón "Regenerar animación" por escena.

## 2. Video completo de idea a play (verificación)
- Con el usuario de prueba, crear un video animado real desde una idea: guion IA (más de 1:30), voz ElevenLabs, planificador, animaciones HyperFrames.
- Comprobar en el navegador que cada escena se anima, que los subtítulos aparecen palabra por palabra y que la voz suena.
- Añadir aviso si el video generado dura menos de 1:30.
- Corregir lo que falle y compartir capturas.

## 3. Pantalla "Mis videos"
- Nueva página con todos los videos: miniatura, título, duración y estado del render (borrador, en cola, renderizando con progreso, listo, error).
- Botón "Descargar MP4" cuando esté listo; "Reintentar" si falla.
- El estado se actualiza solo mientras hay renders en curso.
- Enlace en la barra lateral.

## Limitación importante
El MP4 real necesita un servidor de render externo (Remotion + HyperFrames no pueden ejecutarse en el servidor de la app). La pantalla y el sistema de cola quedan listos; mientras no elijas AWS Lambda o tu propio servidor, los renders quedan "en cola" sin producir archivo.

## Detalles técnicos
- Tabla `render_jobs` (project_id, user_id, status, progress, mp4_path, error, timestamps) con RLS por usuario; bucket privado `renders` con URLs firmadas para descarga.
- Ruta de servidor `/api/public/render-callback` protegida con secreto compartido para que el worker externo actualice progreso y suba el MP4.
- Contrato del timeline: se añade un campo opcional `hyperframe` (html) en `layoutProps` de cada escena, sin romper el contrato existente; validado en el registro (tamaño máximo, sin scripts externos) y renderizado en un iframe aislado.
- Nueva ruta `/videos` con `head()` propio; tests para la validación del bloque HyperFrames y los estados del render.
