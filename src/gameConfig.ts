import Phaser from 'phaser';
import { BootScene } from '@/scenes/BootScene';
import { PreloadScene } from '@/scenes/PreloadScene';
import { TitleScene } from '@/scenes/TitleScene';
import { RunScene } from '@/scenes/RunScene';
import { HudScene } from '@/scenes/HudScene';
import { RelicPickScene } from '@/scenes/RelicPickScene';
import { ResultScene } from '@/scenes/ResultScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0b0b10',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 720,
    height: 1280,
  },
  render: { antialias: false, pixelArt: true, roundPixels: true },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
  input: { activePointers: 2 },
  scene: [BootScene, PreloadScene, TitleScene, RunScene, HudScene, RelicPickScene, ResultScene],
};
