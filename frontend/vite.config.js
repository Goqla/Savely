import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/buscar': 'http://localhost:3000' } },
  build: { outDir: 'dist', emptyOutDir: true }
});
