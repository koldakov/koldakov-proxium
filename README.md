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

## Versions

Older releases stay in Docker, so every release has its own docs, versioned with
[starlight-versions](https://starlight-versions.vercel.app) (`starlightVersions` in `astro.config.mjs`):

- `src/content/docs/` (except the version folders) is the current release, now `0.1.1`, served at `/`.
- `src/content/docs/<version>/` is a frozen snapshot of an older release, served at `/<version>/`, with its images in
  `src/assets/<version>/` and its sidebar in `src/content/versions/<version>.json`. Now only `0.1.0`.
- `project/` (changelog, roadmap) isn't versioned: one page for all releases.

Snapshots aren't updated, fixes go to the current pages only.

On a new release, e.g. `0.1.2`, before editing the pages:

1. In `astro.config.mjs` set `current.label` to the new version and add the previous one to the top of `versions`,
   newest first, as the version select lists them:

   ```js
   starlightVersions({
     current: { label: '0.1.2' },
     versions: [{ slug: '0.1.1' }, { slug: '0.1.0' }],
     exclude: ['project/**'],
   })
   ```

2. `npm run build`: the plugin copies the current pages to `src/content/docs/0.1.1/`, the images to
   `src/assets/0.1.1/` and writes `src/content/versions/0.1.1.json`.
3. `npx prettier --write src/content/docs/0.1.1 src/content/versions`: the plugin rewrites Markdown in its own style.
4. Rebuild `src/content/docs/0.1.1/index.mdx` from `src/content/docs/index.mdx` by hand: the plugin mangles the
   JSX and doesn't prefix `href`s of components. Add `slug: 0.1.1`, prefix the links with `/0.1.1/` and point the
   image import to `src/assets/0.1.1/`.
5. Check the snapshot against the pages: only `slug`, `/0.1.1/` links, image paths and table padding differ.
6. Pin the snapshot to its release, the current pages follow the last one: `ikoldakov/proxium` in commands →
   `ikoldakov/proxium:0.1.1`, `git clone` → `git clone --branch v0.1.1`, `blob/main` links to repo files →
   `blob/v0.1.1`. Find them with `grep -rnE 'ikoldakov/proxium$|git clone|blob/main' src/content/docs/0.1.1`.

Then edit the current pages for the new release and copy the changelog and the roadmap from the proxium repo.

## Linting

ESLint, Prettier and `astro check` run on every commit via husky + lint-staged. `npm install` sets up the hook.

```sh
npm run lint          # eslint
npm run format        # prettier --write
npm run format:check  # prettier --check
npm run typecheck     # astro check
```
