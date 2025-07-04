import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/extrinsics': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/blocks': {
        target: 'http://backend:8000',
        changeOrigin: true,
      }
    }
  }
}); 