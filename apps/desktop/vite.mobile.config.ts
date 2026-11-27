import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// THE PHONE COMPANION'S OWN BUILD (MOBILE-B). It runs after the desk's (package.json build:web), into the same dist-web, and is separate ON PURPOSE. As a second entry of the desk's build it renamed the
// desk's bundle (assets/index-* became main-*), which the stale-tab guard (server/src/build.ts, store/clientBuild.ts) and the harness find the build by, and it split the desk's code into a shared file.
export default defineConfig({
  plugins: [react()],
  base: './',
  publicDir: false,   // the desk's build has already copied public/, the companion's manifest and offline helper with it
  build: {
    outDir: 'dist-web',
    emptyOutDir: false,
    rollupOptions: { input: { m: fileURLToPath(new URL('./m/index.html', import.meta.url)) } },
  },
});
