import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    {
      name: 'prisma-stub',
      resolveId(id) {
        if (id.includes('prisma/client') || id.includes('.prisma/client')) {
          console.log('Intercepting Prisma import:', id);
          return path.resolve(__dirname, 'src/lib/prisma-stub.js');
        }
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      '@prisma/client': path.resolve(__dirname, 'src/lib/prisma-stub.js'),
      '.prisma/client': path.resolve(__dirname, 'src/lib/prisma-stub.js'),
      '.prisma/client/index-browser': path.resolve(__dirname, 'src/lib/prisma-stub.js')
    },
  },
  optimizeDeps: {
    exclude: ['pg', '@prisma/client', '.prisma/client', '.prisma/client/index-browser']
  },
  build: {
    rollupOptions: {
      // Pas d'external pour permettre le remplacement par le stub
    }
  },
  define: {
    global: 'globalThis',
  }
}));
