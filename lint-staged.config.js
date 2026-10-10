export default {
  '*': 'prettier --write --ignore-unknown',
  '*.{js,mjs,ts}': 'eslint --fix',
  // astro check covers the whole project, so staged file names aren't passed to it.
  '*.{ts,astro,md,mdx}': () => 'astro check',
}
