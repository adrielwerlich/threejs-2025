import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  assetsInclude: ['**/*.glsl'],
  resolve: {
    alias: {
      '@react-three/cannon': '@react-three/cannon/dist/index.js'
    }
  },
  optimizeDeps: {
    include: ['@react-three/cannon'],
    exclude: ['@dimforge/rapier3d-compat']
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  }
});
