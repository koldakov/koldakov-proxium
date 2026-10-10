import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightLlmsTxt from 'starlight-llms-txt'

// https://astro.build/config
export default defineConfig({
  site: 'https://proxium.koldakov.com',
  integrations: [
    starlight({
      title: 'Proxium',
      description:
        'Your own proxy service in one docker run. HTTP and SOCKS5 proxy with accounts, quotas, speed limits, outgoing IP pools and a web admin panel.',
      logo: { src: './src/assets/logo.svg' },
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/koldakov/proxium' }],
      lastUpdated: true,
      plugins: [starlightLlmsTxt()],
      sidebar: [
        { label: 'Start here', items: [{ autogenerate: { directory: 'start' } }] },
        { label: 'Installation', items: [{ autogenerate: { directory: 'installation' } }] },
        { label: 'Proxy', items: [{ autogenerate: { directory: 'proxy' } }] },
        { label: 'Admin UI', items: [{ autogenerate: { directory: 'admin' } }] },
        { label: 'Reference', items: [{ autogenerate: { directory: 'reference' } }] },
        { label: 'Project', items: [{ autogenerate: { directory: 'project' } }] },
      ],
    }),
  ],
})
