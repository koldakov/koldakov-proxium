// Starlight's config module, imported by component overrides. Starlight doesn't publish its types.
declare module 'virtual:starlight/user-config' {
  const config: import('@astrojs/starlight/types').StarlightConfig
  export default config
}
