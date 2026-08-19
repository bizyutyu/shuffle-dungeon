import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: '/shuffle-dungeon/', // GitHub Pages のサブパス
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173 }, // LAN 公開が必要なときは `pnpm dev:host`
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        // ~1MB の phaser を別チャンク化
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) return 'phaser';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
});
