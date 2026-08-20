import Phaser from 'phaser';
import { RunContext } from '@/core/run/runContext';
import type { EnemyState } from '@/core/types';
import { ZONES, type ZoneId } from '@/core/slider/zones';
import { DamagePopup } from '@/objects/DamagePopup';

const DAMAGE_POPUP_POOL_SIZE = 8;
const ENEMY_SCALE = 5;
const BOSS_SCALE = 10;

export class RunScene extends Phaser.Scene {
  private ctx!: RunContext;
  private enemySprites = new Map<string, Phaser.GameObjects.Image>();
  private playerSprite!: Phaser.GameObjects.Image;
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
    this.sound.play(isCrit ? 'sfx-critical' : 'sfx-attack', { volume: 0.5 });
    this.flashSprite(sprite);
  };

  private readonly onPlayerDamaged = ({ amount }: { amount: number; hp: number }): void => {
    this.nextDamagePopup().fire(
      this.scale.width / 2,
      this.scale.height * 0.56,
      `-${Math.round(amount)}`,
      '#ff3b30',
    );
    this.sound.play('sfx-hurt', { volume: 0.5 });
    this.flashSprite(this.playerSprite);
  };

  private readonly onEnemyKilled = ({ id }: { id: string }): void => {
    this.enemySprites.get(id)?.destroy();
    this.enemySprites.delete(id);
    this.sound.play('sfx-kill', { volume: 0.5 });
  };

  private readonly onAttackMisfire = (): void => {
    this.sound.play('sfx-misfire', { volume: 0.4 });
  };

  private readonly onAttackBlocked = ({ enemyId }: { enemyId: string }): void => {
    // クールダウン中のタップを「反応がない壊れたUI」に見せないための短いフィードバック
    const sprite = this.enemySprites.get(enemyId);
    if (!sprite) return;
    sprite.setTint(0x555555);
    this.time.delayedCall(80, () => {
      if (sprite.active) sprite.clearTint();
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
    this.sound.play('jingle-floor-clear', { volume: 0.6 });
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
    this.sound.play(victory ? 'jingle-victory' : 'jingle-game-over', { volume: 0.6 });
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

    this.playerSprite = this.add.image(this.scale.width / 2, 920, 'player').setScale(ENEMY_SCALE);

    this.damagePopups = Array.from({ length: DAMAGE_POPUP_POOL_SIZE }, () => new DamagePopup(this));
    this.damagePopupIndex = 0;

    for (const enemy of this.ctx.state.enemies) {
      this.spawnEnemySprite(enemy);
    }

    this.ctx.on('enemy:killed', this.onEnemyKilled);
    this.ctx.on('enemy:damaged', this.onEnemyDamaged);
    this.ctx.on('player:damaged', this.onPlayerDamaged);
    this.ctx.on('attack:blocked', this.onAttackBlocked);
    this.ctx.on('attack:misfire', this.onAttackMisfire);
    this.ctx.on('slider:zoneEnter', this.onZoneEnter);
    this.ctx.on('floor:cleared', this.onFloorCleared);
    this.ctx.on('floor:started', this.onFloorStarted);
    this.ctx.on('run:ended', this.onRunEnded);

    this.events.once('shutdown', () => {
      this.ctx.off('enemy:killed', this.onEnemyKilled);
      this.ctx.off('enemy:damaged', this.onEnemyDamaged);
      this.ctx.off('player:damaged', this.onPlayerDamaged);
      this.ctx.off('attack:blocked', this.onAttackBlocked);
      this.ctx.off('attack:misfire', this.onAttackMisfire);
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

  private flashSprite(sprite: Phaser.GameObjects.Image): void {
    sprite.setTint(0xffffff);
    this.time.delayedCall(60, () => {
      if (sprite.active) sprite.clearTint();
    });
  }

  override update(_time: number, delta: number): void {
    if (this.gameEnded) return;
    this.ctx.tick(delta);
  }

  private spawnEnemySprite(enemy: EnemyState): void {
    const isBoss = this.ctx.state.isBossFloor;
    const scale = isBoss ? BOSS_SCALE : ENEMY_SCALE;
    const size = 16 * scale;
    const hitPad = isBoss ? 40 : 24;
    const sprite = this.add
      .image(enemy.x, enemy.y, enemy.spriteKey)
      .setScale(scale)
      .setInteractive({
        hitArea: new Phaser.Geom.Rectangle(
          -size / 2 - hitPad,
          -size / 2 - hitPad,
          size + hitPad * 2,
          size + hitPad * 2,
        ),
        hitAreaCallback: (hitArea: Phaser.Geom.Rectangle, x: number, y: number): boolean =>
          Phaser.Geom.Rectangle.Contains(hitArea, x, y),
        useHandCursor: true,
      });
    sprite.on('pointerdown', () => {
      if (!this.gameEnded) this.ctx.attackEnemy(enemy.id);
    });
    this.enemySprites.set(enemy.id, sprite);
  }
}
