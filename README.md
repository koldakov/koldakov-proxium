# koldakov-proxium

React + TypeScript + Vite.

## Development

```sh
npm install
npm run dev
```

## Linting

ESLint, Prettier and `tsc` run on every commit via husky + lint-staged. `npm install` sets up the
hook.

```sh
npm run lint          # eslint
npm run format        # prettier --write
npm run format:check  # prettier --check
npm run typecheck     # tsc -b
```
