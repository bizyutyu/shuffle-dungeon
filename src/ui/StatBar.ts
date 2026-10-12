import type Phaser from 'phaser';

/** 「たいりょく 32/60」のような数値つきのバー。 */
export class StatBar {
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly text: Phaser.GameObjects.Text;
  private readonly width: number;
  private readonly label: string;
  private readonly color: number | 'hp';

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    label: string,
    color: number | 'hp',
  ) {
    this.width = width;
    this.label = label;
    this.color = color;
    scene.add.rectangle(x, y, width, 16, 0x333344).setOrigin(0, 0.5);
    this.fill = scene.add.rectangle(x, y, width, 16, 0x30d158).setOrigin(0, 0.5);
    this.text = scene.add
      .text(x + width + 12, y, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' })
      .setOrigin(0, 0.5);
  }

  setValue(current: number, max: number): void {
    const ratio = max > 0 ? Math.min(Math.max(current / max, 0), 1) : 0;
    this.fill.width = this.width * ratio;
    const color =
      this.color === 'hp'
        ? ratio > 0.5
          ? 0x30d158
          : ratio > 0.25
            ? 0xffcc00
            : 0xff3b30
        : this.color;
    this.fill.setFillStyle(color);
    this.text.setText(`${this.label} ${current}/${max}`);
  }
}
