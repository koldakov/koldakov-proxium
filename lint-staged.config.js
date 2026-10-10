export default {
  '*': 'prettier --write --ignore-unknown',
  '*.{js,jsx,ts,tsx}': 'eslint --fix',
  // tsc checks the whole project, so staged file names aren't passed to it.
  '*.{ts,tsx}': () => 'tsc -b',
}
