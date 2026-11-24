import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: false,
    // Two pages: today's Wrizo, and the phone companion at its own address (/m/). The companion has its own entry, so the desk's bundle does not load any of it.
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        m: fileURLToPath(new URL('./m/index.html', import.meta.url)),
      },
    },
  },
  // Dev-only: proxy API/auth to the local server so `vite dev` can talk to it.
  // No effect on the production build (server serves the app same-origin).
  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/api': 'http://localhost:3000',
    },
  },
});
