import Phaser from 'phaser';
import type { RunContext } from '@/core/run/runContext';
import { loadHighScore, saveHighScoreIfBetter } from '@/data/storage';
import { guardInputBriefly } from '@/ui/inputGuard';

export class ResultScene extends Phaser.Scene {
  private ctx!: RunContext;
  private victory = false;

  constructor() {
    super('Result');
  }

  init(data: { ctx: RunContext; victory: boolean }): void {
    this.ctx = data.ctx;
    this.victory = data.victory;
  }

  create(): void {
    guardInputBriefly(this, 600);

    const w = this.scale.width;
    const h = this.scale.height;
    const score = Math.round(this.ctx.state.score);
    const isNewHigh = saveHighScoreIfBetter(score);

    this.add
      .text(w / 2, h * 0.22, this.victory ? 'CLEAR' : 'GAME OVER', {
        fontFamily: 'monospace',
        fontSize: '52px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, h * 0.38, `SCORE  ${score}`, {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const lines = [
      `FLOOR    ${this.ctx.state.floor}/5`,
      `RELICS   ${this.ctx.state.relicIds.length}`,
      `SEED     ${this.ctx.state.seed}`,
    ];
    this.add
      .text(w / 2, h * 0.48, lines.join('\n'), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#c0c0d0',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(
        w / 2,
        h * 0.62,
        isNewHigh ? 'NEW HIGH SCORE!' : `HIGH SCORE  ${Math.round(loadHighScore())}`,
        {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: isNewHigh ? '#ffd60a' : '#8e8e93',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(w / 2, h * 0.78, 'TAP TO RETRY', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // 「死亡→結果→次のラン開始」を2秒以内に収めるため、タイトルを挟まず直接Runへ
    this.input.once('pointerdown', () => {
      this.scene.start('Run', { seed: Date.now() });
    });
  }
}
