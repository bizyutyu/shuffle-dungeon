import Phaser from 'phaser';
import { ZONES } from '@/core/slider/zones';

export class SliderGauge extends Phaser.GameObjects.Container {
  private readonly knob: Phaser.GameObjects.Arc;
  private readonly valueText: Phaser.GameObjects.Text;
  private readonly trackWidth: number;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    this.trackWidth = width;

    const bands = scene.add.graphics();
    for (const zone of ZONES) {
      const x0 = (zone.bounds[0] / 100) * width - width / 2;
      const x1 = (zone.bounds[1] / 100) * width - width / 2;
      bands.fillStyle(zone.colorHex, 0.35);
      bands.fillRect(x0, -20, x1 - x0, 40);
    }
    this.add(bands);

    this.knob = scene.add.circle(0, 0, 14, 0xffffff);
    this.add(this.knob);

    this.valueText = scene.add
      .text(0, 32, '', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' })
      .setOrigin(0.5, 0);
    this.add(this.valueText);

    scene.add.existing(this);
  }

  setValue(value: number): void {
    this.knob.x = (value / 100) * this.trackWidth - this.trackWidth / 2;
    this.valueText.setText(`${Math.round(value)}`);
  }
}
