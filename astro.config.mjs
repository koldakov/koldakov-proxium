import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import rehypeExternalLinks from 'rehype-external-links'
import starlightLlmsTxt from 'starlight-llms-txt'
import starlightVersions from 'starlight-versions'

// Pages of older versions, see Versions in README.md.
const snapshots = ['[0-9]*', '[0-9]*/**']

// https://astro.build/config
export default defineConfig({
  site: 'https://proxium.koldakov.com',
  markdown: {
    rehypePlugins: [[rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }]],
  },
  integrations: [
    starlight({
      title: 'Proxium',
      description:
        'Your own proxy service in one docker run. HTTP and SOCKS5 proxy with accounts, quotas, speed limits, outgoing IP pools and a web admin panel.',
      logo: { src: './src/assets/logo.svg' },
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/koldakov/proxium' }],
      components: {
        Footer: './src/components/Footer.astro',
        SocialIcons: './src/components/SocialIcons.astro',
      },
      customCss: ['./src/styles/custom.css'],
      lastUpdated: true,
      plugins: [
        starlightVersions({
          current: { label: '0.2.0' },
          versions: [{ slug: '0.1.1' }, { slug: '0.1.0' }],
          exclude: ['project/**'],
        }),
        // Out of llms-small.txt, at the end of llms-full.txt.
        starlightLlmsTxt({ exclude: snapshots, demote: snapshots }),
      ],
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
