import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'), // Your main app entry point
          background: resolve(__dirname, 'src/background.js'), // Background script entry point
        },
        output: {
          entryFileNames: (chunkInfo) => {
            return chunkInfo.name === 'background' ? '[name].js' : 'assets/[name].[hash].js';
          },
        },
      },
    },
    plugins: [react()],
  };
});
