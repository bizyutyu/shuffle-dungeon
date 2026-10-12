import type Phaser from 'phaser';

const FILL = 0x24243a;
const FILL_DISABLED = 0x16161f;
const STROKE = 0x5555aa;

/** 角のない矩形ボタン。無効化中はタップを受け付けず、暗く表示する。 */
export class Button {
  readonly rect: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  private enabled = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void,
  ) {
    this.rect = scene.add
      .rectangle(x, y, width, height, FILL)
      .setStrokeStyle(2, STROKE)
      .setInteractive({ useHandCursor: true });
    this.label = scene.add
      .text(x, y, text, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);
    this.rect.on('pointerdown', () => {
      if (this.enabled) onClick();
    });
  }

  setText(text: string): this {
    this.label.setText(text);
    return this;
  }

  setEnabled(enabled: boolean): this {
    this.enabled = enabled;
    this.rect.setFillStyle(enabled ? FILL : FILL_DISABLED);
    this.label.setAlpha(enabled ? 1 : 0.35);
    return this;
  }

  addTo(container: Phaser.GameObjects.Container): this {
    container.add([this.rect, this.label]);
    return this;
  }
}
