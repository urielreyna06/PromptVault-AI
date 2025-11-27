# PromptVault-AI — Prompt Journal
Librería inteligente de prompts de IA para gestionar, organizar y optimizar prompts reutilizables.

Este repositorio contiene una versión demostrativa de una pequeña aplicación de Prompt Journal / Prompt Library construida con JavaScript (ES modules), HTML y CSS, sin dependencias externas. La aplicación muestra cómo guardar prompts con metadata, estimar tokens, editar, ver, eliminar, exportar/importar con backups y ahora *copiar rápidamente* el contenido del prompt desde cada tarjeta con un botón de Copy.

Principales características
- Guardado en `localStorage` y persistencia local
- Estimación de tokens (heurística simple para texto y código)
- Validación de timestamps ISO 8601 y checks para la integridad de los datos
- Import/Export con schema versionado, estadísticas y backup/rollback
- Visualización: vista previa y modal para ver el prompt completo
- Editar prompt con recalculado de tokens y actualización de timestamps
- Eliminación con backup automático y opción de Undo
- Copiar prompt al portapapeles desde la tarjeta (botón Copy)
- Dark mode: modo oscuro con paleta morada y persistencia de la preferencia (botón en la esquina superior izquierda)

Estructura del proyecto
- `prompt-journal-metadata/`
  - `index.html` — demo auto-contenida y glue UI
  - `styles.css` — estilo y temas (light purple theme)
  - `metadata.js` — lógica de metadatos (trackModel, estimateTokens, updateTimestamps)
  - `storage.js` — persistencia, validación, export/import, backups y utilidades
  - `ui.js` — helpers UI: confirm modal y toasts (notificaciones)

Cómo ejecutar
1. Abre `prompt-journal-metadata/index.html` en un navegador moderno.
2. Añade prompts mediante el formulario (Título, Modelo, Contenido).
3. Usa las acciones en las tarjetas: View, Edit, Copy, Delete, Export / Import y Backups.

Notas de diseño (por qué)
- Hechos para enseñanza: sin dependencias, fácil de auditar, perfecto para experimentar con prompts y probar flujos de trabajo locales.
- Backups y rollback: esenciales para importación y acciones destructivas en una app local-first.
- Copiar contenido con un botón directo mejora la experiencia del usuario y evita pasos innecesarios.

Contribuir
- Si quieres mejorar esta demo: abre un Issue o Pull Request, o crea tu fork y contribuye.

---
<!-- Agrega captura de pantalla si la tienes en prompt-journal-metadata/screenshot.png -->
<<<<<<< HEAD
# PromptVault-AI
Librería inteligente de prompts de IA para gestionar,  organizar y optimizar prompts reutilizables.

>>>>>>> ec2f160 (Initial commit PromptVaultV0)
