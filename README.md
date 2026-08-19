# シャッフル・ダンジョン

因果律崩壊型・5分サクッとローグライクRPG。画面下部の「カオス・スライダー」1本が全パラメータを支配し、プレイヤーの行動のたびに揺れ動く。ストーリーは極薄、リプレイ性重視。

スマホでの隙間時間プレイを想定した Web ブラウザゲーム。

## 遊ぶ

https://bizyutyu.github.io/shuffle-dungeon/ （準備中）

## 技術スタック

- **Vite + TypeScript**
- **Phaser 3.90.0**（キャレットなし完全固定）。Phaser 4 が既に安定版だが、チュートリアル・実務事例の蓄積量を優先し 3 系を意図的に選択した
- デプロイ: GitHub Pages（GitHub Actions 経由）

## アーキテクチャ

`src/core/` はゲームロジック（カオス・スライダーの物理・ダメージ計算・レリック効果・スコア集計）を Phaser に一切依存しない純粋 TypeScript として実装している。これは Phaser の一般的な構成ではなく、本作特有の設計判断:

- 本作の面白さの核はスライダーの数値バランスであり、描画なしで Vitest から高速に反復・シミュレーションできることが開発速度に直結する
- 乱数は `Math.random()` を使わず、シード付き決定論的 RNG（mulberry32）に統一している。同じシードで同じランが再現できるため、シード共有によるスコアアタックやデイリーチャレンジを後から無理なく追加できる

## 開発

```bash
pnpm install
pnpm dev            # ローカル開発サーバー
pnpm dev:host       # LAN 経由でスマホ実機から確認
pnpm typecheck
pnpm lint
pnpm test
```

## ライセンス

コードは [MIT License](./LICENSE)。使用素材のライセンス・出典は [assets/CREDITS.md](./assets/CREDITS.md) を参照。
