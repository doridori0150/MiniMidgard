import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  base: './',
  // asset-stage.html: the asset-kit workshop's game stage (asset-kit.json stage.local = dist/asset-stage.html)
  build: { target: 'es2022', chunkSizeWarningLimit: 1500, rollupOptions: { input: { main: 'index.html', stage: 'asset-stage.html' } } },
});
