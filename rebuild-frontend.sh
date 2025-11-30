#!/bin/bash
# Script pour reconstruire complètement le frontend sans Prisma

echo "=== RECONSTRUCTION COMPLÈTE DU FRONTEND ==="

# 1. Supprimer tout
rm -rf node_modules
rm -rf dist
rm -rf .vite
rm -rf .next
rm -rf build
rm -f package-lock.json

# 2. Créer un package.json minimal sans Prisma
cat > package.json << 'EOF'
{
  "name": "kbs-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "lucide-react": "^0.462.0",
    "sonner": "^1.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "typescript": "^5.5.3",
    "vite": "^5.4.1"
  }
}
EOF

# 3. Créer un vite.config.ts minimal
cat > vite.config.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
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
});
EOF

# 4. Installation propre
npm install

# 5. Utiliser le main minimal
cp src/main-minimal.tsx src/main.tsx

# 6. Build
npm run build

echo "=== RECONSTRUCTION TERMINÉE ==="