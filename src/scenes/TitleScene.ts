import Phaser from 'phaser';
import { loadHighScore } from '@/data/storage';
import { guardInputBriefly } from '@/ui/inputGuard';

const RULES = [
  '5体の敵と、1体ずつターン制で戦う',
  '出発前にシャッフルすると',
  '全員のステータスが配り直され',
  '行動の対象（じぶん/あいて）も入れ替わる',
  'たおすたびにレリックを1つ得る',
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
      .text(w / 2, h * 0.62, `HIGH SCORE  ${highScore}`, {
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
      // iOS Safariは最初のユーザー操作までAudioContextがsuspendedのままのため、ここで起こす
      if (this.sound instanceof Phaser.Sound.WebAudioSoundManager) {
        if (this.sound.context.state === 'suspended') void this.sound.context.resume();
      }
      this.sound.play('sfx-click', { volume: 0.5 });
      this.scene.start('Prep', { seed: Date.now() });
    });
  }
}
