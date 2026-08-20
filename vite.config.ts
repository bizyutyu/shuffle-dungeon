import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/shuffle-dungeon/', // GitHub Pages のサブパス
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    VitePWA({
      // Workboxのビルド済みSWをそのまま使う（自前SWは書かない）
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        // 画像・音声もオフラインキャッシュ対象にする（既定はjs/css/html等のみ）
        globPatterns: ['**/*.{js,css,html,svg,png,ogg}'],
      },
      manifest: {
        id: '/shuffle-dungeon/',
        name: 'シャッフル・ダンジョン',
        short_name: 'シャッフル・ダンジョン',
        description: '因果律崩壊型・5分サクッとローグライクRPG',
        lang: 'ja',
        theme_color: '#0b0b10',
        background_color: '#0b0b10',
        display: 'standalone',
        start_url: '/shuffle-dungeon/',
        scope: '/shuffle-dungeon/',
        // 本格的なPNG/maskableアイコンはグラフィック素材調達時に差し替える
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  server: { port: 5173 }, // LAN 公開が必要なときは `pnpm dev:host`
  build: {
    target: 'es2022',
    // 意図的にtrue: 個人開発でユーザーからの不具合報告を本番スタックトレースで
    // 追えることを優先する。デプロイ先(GitHub Pages)の容量制約は緩く、PWAの
    // precacheにも含めていないためオフライン容量への影響もない。
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
