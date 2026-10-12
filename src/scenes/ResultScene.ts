import Phaser from 'phaser';
import type { RunContext } from '@/core/run/runContext';
import { MAX_TURNS_PER_BATTLE } from '@/core/balance';
import { loadHighScore, saveHighScoreIfBetter } from '@/data/storage';
import { guardInputBriefly } from '@/ui/inputGuard';
import { TOTAL_PHASES } from '@/core/combat/roster';
import type { EndReason } from '@/core/types';

const END_MESSAGES: Record<EndReason, string> = {
  cleared: 'すべての敵をたおした！',
  defeated: 'ちからつきた…',
  timeout: `${MAX_TURNS_PER_BATTLE}ターンで決着がつかなかった…`,
};

export class ResultScene extends Phaser.Scene {
  private ctx!: RunContext;

  constructor() {
    super('Result');
  }

  init(data: { ctx: RunContext }): void {
    this.ctx = data.ctx;
  }

  create(): void {
    guardInputBriefly(this, 600);

    const w = this.scale.width;
    const h = this.scale.height;
    const { state } = this.ctx;
    const score = state.score;
    const isNewHigh = saveHighScoreIfBetter(score);

    this.add
      .text(w / 2, h * 0.2, state.status === 'won' ? 'CLEAR' : 'GAME OVER', {
        fontFamily: 'monospace',
        fontSize: '52px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, h * 0.27, END_MESSAGES[state.endReason ?? 'defeated'], {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#c0c0d0',
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
      `フェーズ  ${state.phase}/${TOTAL_PHASES}`,
      `レリック  ${state.relicIds.length}`,
      `シード    ${state.seed}`,
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
      .text(w / 2, h * 0.62, isNewHigh ? 'NEW HIGH SCORE!' : `HIGH SCORE  ${loadHighScore()}`, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: isNewHigh ? '#ffd60a' : '#8e8e93',
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, h * 0.78, 'TAP TO RETRY', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // すぐ次のランを始められるよう、タイトルを挟まず直接ぼうけんじゅんびへ
    this.input.once('pointerdown', () => {
      this.sound.play('sfx-click', { volume: 0.5 });
      this.scene.start('Prep', { seed: Date.now() });
    });
  }
}
