import Phaser from 'phaser';
import type { RunContext } from '@/core/run/runContext';
import { getRelic } from '@/core/relics/registry';
import { guardInputBriefly } from '@/ui/inputGuard';

export class RelicPickScene extends Phaser.Scene {
  private ctx!: RunContext;

  constructor() {
    super('RelicPick');
  }

  init(data: { ctx: RunContext }): void {
    this.ctx = data.ctx;
  }

  create(): void {
    guardInputBriefly(this);

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.75);
    this.add
      .text(w / 2, h * 0.18, 'レリックをえらぶ', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const choices = this.ctx.state.relicChoices.map(getRelic);
    const cardHeight = 220;
    const startY = h * 0.32;

    choices.forEach((relic, i) => {
      const y = startY + i * (cardHeight + 24);
      const card = this.add
        .rectangle(w / 2, y, w - 80, cardHeight, 0x24243a)
        .setStrokeStyle(2, 0x5555aa)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(w / 2, y - cardHeight / 2 + 36, relic.name, {
          fontFamily: 'monospace',
          fontSize: '26px',
          color: '#ffffff',
        })
        .setOrigin(0.5);

      this.add
        .text(w / 2, y + 10, relic.description, {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#c0c0d0',
          align: 'center',
          wordWrap: { width: w - 140 },
        })
        .setOrigin(0.5);

      card.on('pointerdown', () => {
        this.sound.play('sfx-click', { volume: 0.5 });
        this.ctx.selectRelic(relic.id);
        this.scene.stop();
        this.scene.resume('Run');
      });
    });
  }
}
