import { defineConfig } from 'vite';

// base './' supaya jalan di GitHub Pages (subpath repo) maupun domain sendiri
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 900 }, // three.js cukup besar
});