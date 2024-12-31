import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist', // Output directory for built files
    assetsDir: 'assets', // Directory for assets (images, styles)
  },
  base: './', // Ensures assets are correctly linked using relative paths
});