import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('leaflet')) return 'maps';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('qrcode-generator')) return 'qrcode';
            if (id.includes('@capacitor') || id.includes('@aparajita')) return 'native';
            if (id.includes('@ionic')) return 'ionic';
            return undefined;
          },
        },
      },
    },
  };
});

