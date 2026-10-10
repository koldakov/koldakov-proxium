# koldakov-proxium

Documentation site of [Proxium](https://github.com/koldakov/proxium) at https://proxium.koldakov.com.
Built with [Astro Starlight](https://starlight.astro.build), deployed to Netlify (`netlify.toml`).

## Development

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # astro check + static site in dist/
npm run preview  # serve dist/
```

Pages are Markdown in `src/content/docs/`, one folder per sidebar section, `sidebar.order` in the frontmatter sets
the order. Images go to `src/assets/`.

## Linting

ESLint, Prettier and `astro check` run on every commit via husky + lint-staged. `npm install` sets up the hook.

```sh
npm run lint          # eslint
npm run format        # prettier --write
npm run format:check  # prettier --check
npm run typecheck     # astro check
```
