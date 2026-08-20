import Phaser from 'phaser';
import { RunContext } from '@/core/run/runContext';
import type { EnemyState } from '@/core/types';
import { ZONES, type ZoneId } from '@/core/slider/zones';
import { DamagePopup } from '@/objects/DamagePopup';

const DAMAGE_POPUP_POOL_SIZE = 8;

export class RunScene extends Phaser.Scene {
  private ctx!: RunContext;
  private enemySprites = new Map<string, Phaser.GameObjects.Rectangle>();
  private damagePopups: DamagePopup[] = [];
  private damagePopupIndex = 0;
  private gameEnded = false;

  private readonly onEnemyDamaged = ({
    id,
    amount,
    isCrit,
  }: {
    id: string;
    amount: number;
    isCrit: boolean;
  }): void => {
    const sprite = this.enemySprites.get(id);
    if (!sprite) return;
    this.nextDamagePopup().fire(
      sprite.x,
      sprite.y - 20,
      Math.round(amount).toString(),
      isCrit ? '#ffd60a' : '#ffffff',
    );
  };

  private readonly onPlayerDamaged = ({ amount }: { amount: number; hp: number }): void => {
    this.nextDamagePopup().fire(
      this.scale.width / 2,
      this.scale.height * 0.56,
      `-${Math.round(amount)}`,
      '#ff3b30',
    );
  };

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

  private readonly onZoneEnter = ({ zone }: { zone: ZoneId }): void => {
    // ゾーンを跨いだ瞬間の「気持ちよさ」の演出。読み込んだゾーンの色でフラッシュ+軽い揺れ。
    const def = ZONES.find((z) => z.id === zone);
    const color = def?.colorHex ?? 0xffffff;
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    this.cameras.main.flash(180, r, g, b, false);
    this.cameras.main.shake(120, 0.004);
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

    this.damagePopups = Array.from({ length: DAMAGE_POPUP_POOL_SIZE }, () => new DamagePopup(this));
    this.damagePopupIndex = 0;

    for (const enemy of this.ctx.state.enemies) {
      this.spawnEnemySprite(enemy);
    }

    this.ctx.on('enemy:killed', this.onEnemyKilled);
    this.ctx.on('enemy:damaged', this.onEnemyDamaged);
    this.ctx.on('player:damaged', this.onPlayerDamaged);
    this.ctx.on('attack:blocked', this.onAttackBlocked);
    this.ctx.on('slider:zoneEnter', this.onZoneEnter);
    this.ctx.on('floor:cleared', this.onFloorCleared);
    this.ctx.on('floor:started', this.onFloorStarted);
    this.ctx.on('run:ended', this.onRunEnded);

    this.events.once('shutdown', () => {
      this.ctx.off('enemy:killed', this.onEnemyKilled);
      this.ctx.off('enemy:damaged', this.onEnemyDamaged);
      this.ctx.off('player:damaged', this.onPlayerDamaged);
      this.ctx.off('attack:blocked', this.onAttackBlocked);
      this.ctx.off('slider:zoneEnter', this.onZoneEnter);
      this.ctx.off('floor:cleared', this.onFloorCleared);
      this.ctx.off('floor:started', this.onFloorStarted);
      this.ctx.off('run:ended', this.onRunEnded);
      this.scene.stop('Hud');
      this.scene.stop('RelicPick');
    });
  }

  private nextDamagePopup(): DamagePopup {
    const popup = this.damagePopups[this.damagePopupIndex];
    this.damagePopupIndex = (this.damagePopupIndex + 1) % DAMAGE_POPUP_POOL_SIZE;
    if (!popup) throw new Error('damage popup pool not initialized');
    return popup;
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
