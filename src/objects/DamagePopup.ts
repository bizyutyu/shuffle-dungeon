import Phaser from 'phaser';

/** 生成し直さず使い回すダメージ数値。プールから借りて fire() で発火する。 */
export class DamagePopup extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.setOrigin(0.5);
    this.setActive(false).setVisible(false);
    this.setDepth(10);
    scene.add.existing(this);
  }

  fire(x: number, y: number, text: string, color: string): void {
    this.scene.tweens.killTweensOf(this);
    this.setPosition(x, y);
    this.setText(text);
    this.setColor(color);
    this.setAlpha(1);
    this.setScale(1);
    this.setActive(true).setVisible(true);
    this.scene.tweens.add({
      targets: this,
      y: y - 56,
      alpha: 0,
      scale: 1.15,
      duration: 550,
      ease: 'Cubic.Out',
      onComplete: () => {
        this.setActive(false).setVisible(false);
      },
    });
  }
}
