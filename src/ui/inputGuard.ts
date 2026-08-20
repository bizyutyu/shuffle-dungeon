import type Phaser from 'phaser';

/**
 * シーン遷移直後は、直前の画面での連打の慣性が引き継がれて誤タップになりやすいため、
 * 一定時間ポインター入力を無効化する。
 */
export function guardInputBriefly(scene: Phaser.Scene, delayMs = 400): void {
  scene.input.enabled = false;
  scene.time.delayedCall(delayMs, () => {
    scene.input.enabled = true;
  });
}
