import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Vite заменит все упоминания process.env.API_KEY на значение из настроек Cloudflare
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY_tribe || process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  }
});