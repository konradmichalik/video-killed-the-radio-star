import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// `base` matters for GitHub Pages project sites served from /<repo>/.
// The deploy workflow sets VITE_BASE=/<repo>/. Defaults to '/' for local dev,
// user/org pages (<user>.github.io) and custom domains.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // we ship our own hand-written public/manifest.json
      manifest: false,
      workbox: {
        // precache the app shell + data so it loads offline (videos still
        // need the network to actually stream from YouTube)
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json,webmanifest}'],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { host: true, port: 5173 },
});
