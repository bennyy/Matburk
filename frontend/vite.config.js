import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Detta är viktigt för WSL2/Docker
    port: 5173,
  },
  // Enable source maps for clearer stack traces in production
  build: {
    sourcemap: true,
    // Uncomment to disable minification temporarily while debugging
    // minify: false,
  },
});
