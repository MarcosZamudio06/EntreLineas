# Repository Guidelines

## Project Structure & Module Organization

Entre líneas is a dependency-free, Spanish-language songwriting inspiration tool. `index.html` contains the semantic interface; `src/app.js` manages interactions, `src/styles.css` defines visual tokens and responsive layouts, `src/data.js` owns the vocabulary, `src/generator.js` contains pure selection logic, and `src/storage.js` validates browser persistence. Keep photographs, fonts, icons, and their provenance in `assets/`. Unit tests belong in `tests/`; development/build utilities belong in `scripts/`. `dist/` is generated output, not the source of truth.

## Build, Test, and Development Commands

Use Node.js 22 or newer. No dependency installation is required.

- `npm run dev`: serve the application at `http://127.0.0.1:5173`.
- `npm test`: run the built-in Node test suite.
- `npm run check`: syntax-check application modules.
- `npm run build`: copy shipping files into `dist/`.
- `node scripts/serve.mjs --dist`: preview the generated site.

If host configuration blocks Node/npm, see the documented OpenSSL and script-shell workaround in `README.md`.

## Coding Style & Naming Conventions

Use ES modules, two-space JavaScript indentation, semicolons, and descriptive `camelCase` functions. Export shared constants in `UPPER_SNAKE_CASE`; use kebab-case CSS classes and HTML IDs. Keep pure logic separate from DOM effects. Preserve Spanish UI copy; use English for identifiers and technical documentation. No formatter or linter is configured. Check syntax and inspect responsive layouts before submitting.

## Testing Guidelines

Use `node:test` and `node:assert/strict`; name suites `*.test.js`. Write a failing regression test before changing selection or persistence behavior. Cover two/three-word counts, uniqueness, filters, locks, rerolls, corrupted storage, and vocabulary integrity. No percentage coverage threshold is configured. Manually verify keyboard operation, mobile layout, saving/retrieving ideas, and unavailable storage.

## Commit & Pull Request Guidelines

This directory has no Git history yet, so no historical commit convention is established. Use Conventional Commits, such as `feat(generator): add new themes`; never add AI attribution or `Co-Authored-By` trailers. Keep tests and documentation with their behavior change. PRs should describe the user-visible result, link relevant issues, include exact verification commands/results, and provide desktop/mobile screenshots for visual changes. Do not commit personal notes, credentials, or generated output unless explicitly required.
