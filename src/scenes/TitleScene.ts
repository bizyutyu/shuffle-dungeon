import Phaser from 'phaser';
import { loadHighScore } from '@/data/storage';
import { guardInputBriefly } from '@/ui/inputGuard';

const RULES = [
  '下のスライダーが今の強さを決める',
  'タップで攻撃するたびスライダーが揺れる',
  '左寄り: 攻撃力UP / 被ダメ2倍',
  '右寄り: HP自動回復 / 攻撃が遅くなる',
  '敵は放っておいても一定間隔で攻撃してくる',
];

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    guardInputBriefly(this);

    const w = this.scale.width;
    const h = this.scale.height;

    this.add
      .text(w / 2, h * 0.14, 'SHUFFLE DUNGEON', {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, h * 0.32, RULES.join('\n'), {
        fontFamily: 'monospace',
        fontSize: '19px',
        color: '#c0c0d0',
        align: 'center',
        lineSpacing: 14,
      })
      .setOrigin(0.5);

    const highScore = loadHighScore();
    this.add
      .text(w / 2, h * 0.62, `HIGH SCORE  ${Math.round(highScore)}`, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#8e8e93',
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, h * 0.74, 'TAP TO START', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.input.once('pointerdown', () => {
      this.scene.start('Run', { seed: Date.now() });
    });
  }
}
