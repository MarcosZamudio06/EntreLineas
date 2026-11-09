# Entre líneas

A local-first, Spanish-language songwriting inspiration studio. Generate two or three visual prompts from **1,200 words across 12 categories (100 per category)**, lock words you want to keep, and capture the connection in your notebook.

## Run

Requires Node.js 22 or newer. No package installation is necessary.

```sh
npm run dev       # http://127.0.0.1:5173
npm test          # Node built-in unit tests
npm run check     # JavaScript syntax checks
npm run build     # Copy the static site to dist/
```

To preview the build, stop the development server and run `node scripts/serve.mjs --dist`. Set `PORT=5174` to use a different port. If your host's Node/OpenSSL or npm shell configuration is blocked, use `OPENSSL_CONF=/dev/null npm_config_script_shell=/bin/sh npm test` (substitute the command as needed).

## Use

Select topics in **Tu universo**, choose **2** or **3**, then use **Generar ideas** or the space bar. Lock a word to retain it during the next generation. **Guardar idea** stores the combination with the current notebook text; **Mis ideas** lets you retrieve or delete it. The notebook autosaves locally.

## Privacy and imagery

Notes and saved ideas live in this browser's `localStorage`; there is no backend or account. Clearing site data removes them. Storage failure is reported and leaves the current session usable. Saved ideas are capped at 100; saving an existing combination updates its notes.

All shipped photos and fonts are local, so the runtime makes no third-party image/font requests. The photos are **category-level atmospheric references**, not portraits of named people, product certifications, or official film stills. Asset origins are recorded in `assets/sources.json`. Source photographs are from Unsplash; fonts are DM Sans and Instrument Serif (Google Fonts, SIL Open Font License).

## Structure

- `index.html`: semantic page structure.
- `src/`: UI, visual styling, word data, pure generation logic, and storage validation.
- `assets/`: photographs, self-hosted fonts, vector icons, and provenance.
- `tests/`: unit tests for generation/data/storage.
- `scripts/`: static server and build helpers.

No deployment, Git initialization, or commits are performed by these commands. The static output can be served by a conventional static host.
