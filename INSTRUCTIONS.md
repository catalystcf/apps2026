# Example commands

npm run format:check

npx prettier --check .

npx prettier --write .

npm run build

npx vite src --host 127.0.0.1

# Lint and build setup

- `package.json` defines the scripts:
  - `lint` runs ESLint.
  - `format` fixes formatting, and `format:check` only checks it.
  - `build` copies `src/` into a clean `dist/`. If `src/` doesn't exist yet, it just creates an empty `dist/`, so CI passes before you've written any app code.
- `eslint.config.js` is the ESLint flat config. It uses the recommended rules, ES modules and browser globals, and turns off rules that clash with Prettier. It skips `dist/` and `node_modules/`.
- `.prettierrc.json` is empty (`{}`), which means Prettier's default style.
- `.prettierignore` tells Prettier to skip `dist/`, `node_modules/`, the lock file and the mockup images.
- `.gitattributes` stores text files with LF line endings. Prettier expects LF, so without this, `format:check` would fail on Windows, where files are checked out with CRLF.
- `.github/workflows/ci.yml` runs on every push and pull request: checkout, Node LTS with npm cache, `npm ci`, then lint, format check and build.
