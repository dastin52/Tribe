import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Пробуем взять основной ключ или тот, что на скрине (API_KEY_tribe)
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.API_KEY_tribe)
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});