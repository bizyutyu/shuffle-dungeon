import Phaser from 'phaser';
import { RunContext } from '@/core/run/runContext';
import type { EnemyState } from '@/core/types';

export class RunScene extends Phaser.Scene {
  private ctx!: RunContext;
  private enemySprites = new Map<string, Phaser.GameObjects.Rectangle>();
  private gameEnded = false;

  private readonly onEnemyKilled = ({ id }: { id: string }): void => {
    this.enemySprites.get(id)?.destroy();
    this.enemySprites.delete(id);
  };

  private readonly onAttackBlocked = ({ enemyId }: { enemyId: string }): void => {
    // クールダウン中のタップを「反応がない壊れたUI」に見せないための短いフィードバック
    const sprite = this.enemySprites.get(enemyId);
    if (!sprite) return;
    sprite.setFillStyle(0x555555);
    this.time.delayedCall(80, () => {
      if (sprite.active) sprite.setFillStyle(0xaa3333);
    });
  };

  private readonly onRunEnded = ({ victory }: { victory: boolean }): void => {
    this.gameEnded = true;
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, victory ? 'CLEAR' : 'GAME OVER', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  };

  constructor() {
    super('Run');
  }

  init(data: { seed?: number } = {}): void {
    this.ctx = new RunContext(data.seed ?? Date.now());
    this.enemySprites = new Map();
    this.gameEnded = false;
  }

  create(): void {
    this.scene.launch('Hud', { ctx: this.ctx });

    for (const enemy of this.ctx.state.enemies) {
      this.spawnEnemySprite(enemy);
    }

    this.ctx.on('enemy:killed', this.onEnemyKilled);
    this.ctx.on('run:ended', this.onRunEnded);
    this.ctx.on('attack:blocked', this.onAttackBlocked);

    this.events.once('shutdown', () => {
      this.ctx.off('enemy:killed', this.onEnemyKilled);
      this.ctx.off('run:ended', this.onRunEnded);
      this.ctx.off('attack:blocked', this.onAttackBlocked);
      this.scene.stop('Hud');
    });
  }

  override update(_time: number, delta: number): void {
    if (this.gameEnded) return;
    this.ctx.tick(delta);
  }

  private spawnEnemySprite(enemy: EnemyState): void {
    const rect = this.add.rectangle(enemy.x, enemy.y, 80, 80, 0xaa3333).setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-50, -50, 100, 100),
      hitAreaCallback: (hitArea: Phaser.Geom.Rectangle, x: number, y: number): boolean =>
        Phaser.Geom.Rectangle.Contains(hitArea, x, y),
      useHandCursor: true,
    });
    rect.on('pointerdown', () => {
      if (!this.gameEnded) this.ctx.attackEnemy(enemy.id);
    });
    this.enemySprites.set(enemy.id, rect);
  }
}
