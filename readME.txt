=======
## Practical Prompt Engineering Course — Prompt Journal
This repository contains a small, self-contained Prompt Journal / Prompt Library web-app used while working through prompt engineering exercises. It demonstrates metadata tracking, token estimation, local persistence, import/export, and a lightweight UI — all implemented in pure JavaScript (no external libraries) so it runs directly in the browser.

![Prompt Journal screenshot](./prompt-journal-metadata/screenshot.png)

### Quick summary
- Language: Plain JavaScript (ES modules), HTML, CSS
- No build step required — open `prompt-journal-metadata/index.html` in a modern browser
- Key features: model metadata tracking, token estimation, edit/view/delete prompts, export/import with schema and backup/rollback, styled modals and toasts

This README documents how the code is organized, how each module works, why the design choices were made, and how to use and test the app.

**Files of interest**
- `prompt-journal-metadata/index.html` — main demo page, UI wiring and event handlers
- `prompt-journal-metadata/styles.css` — theme, layout, responsive styles (light purple theme)
- `prompt-journal-metadata/metadata.js` — core metadata utilities (trackModel, estimateTokens, updateTimestamps)
- `prompt-journal-metadata/storage.js` — persistence, export/import, validation, backups, delete
- `prompt-journal-metadata/ui.js` — small UI helpers (confirm modal and toast notifications)

---

**How to run (developer)**
1. Open the file `prompt-journal-metadata/index.html` in a modern browser (Chrome, Edge, Firefox).
2. Use the form to add prompts (Title, Model, Content). Records are saved to `localStorage`.
3. Use the card actions to View, Edit, Delete, Export, Import, and manage backups.

No build tools required. If you prefer to serve files via a static server, run any simple server (e.g., `npx http-server` or `python -m http.server`) from the folder and open the page.

---

**Core modules — what they do and why**

1) `metadata.js` — metadata utilities

- Functions:
	- `trackModel(modelName: string, content: string): MetadataObject`
		- Validates `modelName` (non-empty, <=100 chars), auto-generates `createdAt` (ISO 8601) and `updatedAt`, and estimates tokens from `content`.
	- `estimateTokens(text: string, isCode: boolean): {min, max, confidence}`
		- Estimation uses: min = round(0.75 * word_count), max = round(0.25 * character_count). If `isCode` the values are multiplied by 1.3.
		- Confidence tiers: `high` (<1000 avg tokens), `medium` (1000–5000), `low` (>5000).
	- `updateTimestamps(metadata: MetadataObject): MetadataObject`
		- Validates `createdAt`, sets `updatedAt` to now, and ensures `updatedAt >= createdAt`.

Why: Keeping metadata responsibilities (validation, token estimation, timestamp management) in a small, focused module makes the logic easy to test and reuse. The token estimate is intentionally simple and explainable — good for a lightweight journal and for teaching purposes.

2) `storage.js` — persistence + import/export + backups

- Responsibilities:
	- Persist prompts to `localStorage` under key `promptJournal.prompts` as an array.
	- `savePrompt(prompt)` validates shape and saves/updates records (adds `id` if missing).
	- `exportPrompts()` validates all stored prompts, computes stats and triggers a JSON download. The export schema contains `version`, `exportedAt`, `stats`, and `prompts` array.
	- `importPromptsFile(file, options)` reads a JSON file, validates schema and prompts, creates a backup, and either replaces or merges data. Duplicate handling is delegated to a UI callback (so UI can prompt the user using a styled modal). On failure, the module attempts to rollback using the created backup.
	- Backups are stored in localStorage with prefix `promptJournal.backup.<timestamp>`; utilities are provided to list, restore, and delete backups.

Why: `storage.js` centralizes all persistence and data integrity checks. Backups and rollback are crucial for safe import/merge/delete operations in a local-first app. Export schema versioning (`version`) allows future compatibility strategies.

3) `ui.js` — small UI primitives

- Provides a lightweight confirm modal (`showConfirm`) returning a Promise and a `showToast` helper for ephemeral notifications (supports action buttons like "Undo").

Why: Replacing blocking `alert()`/`confirm()` calls with non-blocking UI gives a better UX and allows consistent styling. The toast system is used for success/error feedback and for presenting undo actions.

4) `index.html` — UI glue

- Wires together the modules: uses `trackModel` to create metadata, `savePrompt` to persist, `exportPrompts` / `importPromptsFile` for JSON interchange, and `showConfirm` / `showToast` for interactions.
- Renders cards showing title, model, timestamps, token estimate (color-coded), a preview (text or code block), and actions: View, Edit, Delete, Touch UpdatedAt.

Why: Keeping the page logic contained in `index.html` (as a small ES module script) keeps the demo self-contained and easy to open in a browser.

---

Export JSON schema (versioned)

Top-level object:

{
	"version": "1.0.0",
	"exportedAt": "2025-11-22T...Z",
	"stats": {
		"totalPrompts": 10,
		"averageRating": 4.2,
		"mostUsedModel": "gpt-5-mini"
	},
	"prompts": [ /* array of prompt objects (see below) */ ]
}

Prompt object shape (export/import):
- `id` (string): unique id (generated when saving if missing)
- `title` (string)
- `content` (string)
- `model` (string)
- `createdAt` / `updatedAt` (ISO 8601 with ms and Z)
- `tokenEstimate`: { min: number, max: number, confidence: 'high'|'medium'|'low' }
- `rating` (nullable number)

Validation rules enforced by `storage.js` and `metadata.js`:
- `model` must be a non-empty string (<=100 chars enforced in `metadata.js` when created via `trackModel`).
- Timestamps must be full ISO 8601 strings as produced by `new Date().toISOString()`.
- Token estimates must include `min` and `max` as numbers and `confidence` as one of the three specified strings.

---

Design decisions and rationale (the "why")

- Pure JavaScript, no dependencies: keeps the demo portable and simple to inspect. Good for teaching core concepts without build complexity.
- LocalStorage persistence: quick and reliable for single-user local demos. Backups are stored in localStorage too to allow rollback without external services.
- Simple token estimation: accurate token counting varies by tokenizer and model; for a prompt journal a heuristic (word- and character-based) is sufficient and explains trade-offs visibly to learners. The code multiplier for code-like content reflects the fact that code often tokenizes differently than natural language.
- Export schema with `version`: enables forward compatibility. Import validates versions strictly now, but can be extended to transform older versions.
- UI: small custom modal + toast system avoids heavy UI frameworks while providing a clear and consistent UX for confirmations and undo actions.

---

Testing & troubleshooting

- To inspect storage: in your browser DevTools open `Application -> Local Storage` and look for keys starting with `promptJournal`.
- To test import rollback: create an export, modify it to introduce an invalid prompt (e.g., remove `createdAt` or set an invalid timestamp), then import — the app will create a backup and should restore it on failure.
- The console will log non-fatal errors for developer visibility; toasts and modal dialogs provide user-facing messages.

---

Possible next improvements (ideas)

- Persist prompts to a backend (API) for syncing across devices.
- Use a tokenizer package to compute exact token counts for specific models.
- Add search/filter and tagging for the prompt library.
- Convert the inline editor to a modal editor so the list stays visible while editing.
- Add automated unit tests for `metadata.js` and `storage.js` (these are small and easily testable in-browser).