import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: the browser talks only to Vite; /api is proxied to the Fastify server.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, proxy: { '/api': 'http://127.0.0.1:3001' } },
});
