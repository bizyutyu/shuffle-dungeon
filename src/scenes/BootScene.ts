import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 60, 'SHUFFLE DUNGEON', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 40, 'TAP TO START', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#8e8e93',
      })
      .setOrigin(0.5);

    this.input.once('pointerdown', () => {
      this.scene.start('Run');
    });
  }
}
