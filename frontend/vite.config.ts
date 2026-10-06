import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// En desarrollo, /api y /uploads se reenvían a la API local (en producción lo hace nginx).
const api = process.env.API_URL ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': api, '/uploads': api } },
  build: { sourcemap: false },
});
