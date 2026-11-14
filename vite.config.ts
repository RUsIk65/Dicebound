import vinext from 'vinext';
import { defineConfig } from 'vite';
import { sites } from './scripts/vite/sites-vite-plugin';

export default defineConfig({
  plugins: [vinext(), sites({ mockAuth: true })],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true } },
  },
});
