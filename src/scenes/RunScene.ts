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
    const restoreColor = this.ctx.state.isBossFloor ? 0x8a2be2 : 0xaa3333;
    sprite.setFillStyle(0x555555);
    this.time.delayedCall(80, () => {
      if (sprite.active) sprite.setFillStyle(restoreColor);
    });
  };

  private readonly onFloorCleared = (): void => {
    this.scene.pause();
    this.scene.launch('RelicPick', { ctx: this.ctx });
  };

  private readonly onFloorStarted = (): void => {
    for (const sprite of this.enemySprites.values()) sprite.destroy();
    this.enemySprites.clear();
    for (const enemy of this.ctx.state.enemies) this.spawnEnemySprite(enemy);
  };

  private readonly onRunEnded = ({ victory }: { victory: boolean }): void => {
    this.gameEnded = true;
    this.scene.start('Result', { ctx: this.ctx, victory });
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
    this.ctx.on('attack:blocked', this.onAttackBlocked);
    this.ctx.on('floor:cleared', this.onFloorCleared);
    this.ctx.on('floor:started', this.onFloorStarted);
    this.ctx.on('run:ended', this.onRunEnded);

    this.events.once('shutdown', () => {
      this.ctx.off('enemy:killed', this.onEnemyKilled);
      this.ctx.off('attack:blocked', this.onAttackBlocked);
      this.ctx.off('floor:cleared', this.onFloorCleared);
      this.ctx.off('floor:started', this.onFloorStarted);
      this.ctx.off('run:ended', this.onRunEnded);
      this.scene.stop('Hud');
      this.scene.stop('RelicPick');
    });
  }

  override update(_time: number, delta: number): void {
    if (this.gameEnded) return;
    this.ctx.tick(delta);
  }

  private spawnEnemySprite(enemy: EnemyState): void {
    const isBoss = this.ctx.state.isBossFloor;
    const size = isBoss ? 160 : 80;
    const color = isBoss ? 0x8a2be2 : 0xaa3333;
    const hitPad = isBoss ? 90 : 50;
    const rect = this.add.rectangle(enemy.x, enemy.y, size, size, color).setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-hitPad, -hitPad, size + hitPad, size + hitPad),
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
