import Phaser from 'phaser';
import type { RunContext } from '@/core/run/runContext';
import type { ActionId, ActionOutcome, Combatant, CombatantId } from '@/core/types';
import { ACTIONS, PLAYER_ACTION_IDS } from '@/core/combat/actions';
import { TOTAL_PHASES } from '@/core/combat/roster';
import { mpCostOf } from '@/core/combat/damage';
import { DamagePopup } from '@/objects/DamagePopup';
import { Button } from '@/ui/Button';
import { StatBar } from '@/ui/StatBar';
import { FLIPPED_COLOR, NORMAL_COLOR, TARGET_LABELS } from '@/ui/labels';
import { statEntries } from '@/ui/statView';

const DAMAGE_POPUP_POOL_SIZE = 4;
const ENEMY_SCALE = 10;
const BOSS_SCALE = 14;
const PLAYER_SCALE = 7;
const ENEMY_POS = { x: 360, y: 400 };
const PLAYER_POS = { x: 360, y: 720 };
const BAR_WIDTH = 300;
/** 結果の演出を見せてから次のカードを出すまでの間 */
const AFTER_RESULT_DELAY_MS = 500;

interface Vitals {
  hp: number;
  mp: number;
}

/**
 * ターン制の戦闘画面。core は1ターン分をまとめて解決するので、この画面は
 * 「〇〇の△△！」カード → タップ → 結果、の順に1行動ずつ再生する。
 * 再生が終わるまでバーの表示を進めないよう、画面に出している値（vitals）を core の状態とは別に持つ。
 */
export class RunScene extends Phaser.Scene {
  private ctx!: RunContext;
  private enemySprite!: Phaser.GameObjects.Image;
  private playerSprite!: Phaser.GameObjects.Image;
  private enemyName!: Phaser.GameObjects.Text;
  private headerText!: Phaser.GameObjects.Text;
  private enemyHpBar!: StatBar;
  private playerHpBar!: StatBar;
  private playerMpBar!: StatBar;
  private actionButtons = new Map<ActionId, Button>();
  private statusButton!: Button;
  private damagePopups: DamagePopup[] = [];
  private damagePopupIndex = 0;
  private vitals = new Map<CombatantId, Vitals>();
  private playing = false;

  private readonly onBattleStarted = (): void => {
    this.setupBattle();
  };

  constructor() {
    super('Run');
  }

  init(data: { ctx: RunContext }): void {
    this.ctx = data.ctx;
    this.actionButtons = new Map();
    this.vitals = new Map();
    this.playing = false;
  }

  create(): void {
    const w = this.scale.width;
    this.headerText = this.add.text(24, 24, '', {
      fontFamily: 'monospace',
      fontSize: '26px',
      color: '#ffffff',
    });

    this.enemyName = this.add
      .text(w / 2, 120, '', { fontFamily: 'monospace', fontSize: '26px', color: '#ffffff' })
      .setOrigin(0.5);
    this.enemyHpBar = new StatBar(this, 150, 165, BAR_WIDTH, 'たいりょく', 'hp');
    this.enemySprite = this.add.image(ENEMY_POS.x, ENEMY_POS.y, 'enemy-zombie');

    this.playerSprite = this.add
      .image(PLAYER_POS.x, PLAYER_POS.y, this.ctx.state.player.spriteKey)
      .setScale(PLAYER_SCALE);
    this.add
      .text(w / 2, 810, this.ctx.state.player.name, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.playerHpBar = new StatBar(this, 150, 850, BAR_WIDTH, 'たいりょく', 'hp');
    this.playerMpBar = new StatBar(this, 150, 882, BAR_WIDTH, 'せいしんりょく', 0x0a84ff);

    this.statusButton = new Button(this, w - 120, 50, 200, 64, 'ステータス', () =>
      this.showStatusPanel(),
    );

    PLAYER_ACTION_IDS.forEach((id, i) => {
      const x = i % 2 === 0 ? w * 0.27 : w * 0.73;
      const y = i < 2 ? 1010 : 1150;
      this.actionButtons.set(id, new Button(this, x, y, 320, 120, '', () => this.onAction(id)));
    });

    this.damagePopups = Array.from({ length: DAMAGE_POPUP_POOL_SIZE }, () => new DamagePopup(this));
    this.damagePopupIndex = 0;

    this.ctx.on('battle:started', this.onBattleStarted);
    this.events.once('shutdown', () => {
      this.ctx.off('battle:started', this.onBattleStarted);
      this.scene.stop('RelicPick');
    });

    this.setupBattle();
  }

  private setupBattle(): void {
    const { player } = this.ctx.state;
    const enemy = this.ctx.currentEnemy;
    this.vitals.set(player.id, { hp: player.hp, mp: player.mp });
    this.vitals.set(enemy.id, { hp: enemy.hp, mp: enemy.mp });

    this.enemySprite
      .setTexture(enemy.spriteKey)
      .setScale(enemy.isBoss ? BOSS_SCALE : ENEMY_SCALE)
      .setAlpha(1)
      .setVisible(true);
    if (enemy.tint === null) this.enemySprite.clearTint();
    else this.enemySprite.setTint(enemy.tint);
    this.enemyName.setText(enemy.isBoss ? `${enemy.name}（ボス）` : enemy.name);

    this.refreshView();
    this.showBanner(`${enemy.name} があらわれた！`);
  }

  private onAction(id: ActionId): void {
    if (this.playing) return;
    const result = this.ctx.act(id);
    if (!result) return;
    this.sound.play('sfx-click', { volume: 0.4 });
    this.playing = true;
    this.refreshButtons();
    this.playOutcomes([...result.outcomes]);
  }

  private playOutcomes(queue: ActionOutcome[]): void {
    const next = queue.shift();
    if (!next) {
      this.onTurnPlayed();
      return;
    }
    this.showActionCard(next, () => {
      this.applyOutcome(next);
      this.time.delayedCall(AFTER_RESULT_DELAY_MS, () => this.playOutcomes(queue));
    });
  }

  /** 「〇〇の△△！」カード。タップで消え、そこで初めて結果を見せる。 */
  private showActionCard(outcome: ActionOutcome, onDismiss: () => void): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const actor = this.combatantOf(outcome.actorId);
    const action = ACTIONS[outcome.actionId];

    const shade = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.45).setInteractive();
    const panel = this.add.rectangle(w / 2, 560, 620, 200, 0x24243a).setStrokeStyle(3, 0xffffff);
    const text = this.add
      .text(w / 2, 545, `${actor.name}の${action.name}！`, {
        fontFamily: 'monospace',
        fontSize: '34px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 580 },
      })
      .setOrigin(0.5);
    const hint = this.add
      .text(w / 2, 630, 'タップ', { fontFamily: 'monospace', fontSize: '16px', color: '#8e8e93' })
      .setOrigin(0.5);
    const card = [shade, panel, text, hint];
    this.tweens.add({ targets: [panel, text], scale: { from: 0.85, to: 1 }, duration: 120 });

    shade.once('pointerdown', () => {
      for (const obj of card) obj.destroy();
      onDismiss();
    });
  }

  private applyOutcome(o: ActionOutcome): void {
    const actorVitals = this.vitals.get(o.actorId);
    const targetVitals = this.vitals.get(o.targetId);
    if (actorVitals) actorVitals.mp = o.actorMpAfter;
    if (targetVitals) targetVitals.hp = o.targetHpAfter;

    const sprite = o.targetId === 'player' ? this.playerSprite : this.enemySprite;
    const isDamage = o.effect === 'damage';
    this.nextDamagePopup().fire(
      sprite.x,
      sprite.y - sprite.displayHeight / 2,
      `${isDamage ? '-' : '+'}${o.amount}`,
      isDamage ? '#ff3b30' : '#30d158',
    );
    if (isDamage) {
      this.sound.play(o.targetId === 'player' ? 'sfx-hurt' : 'sfx-attack', { volume: 0.5 });
      this.flashSprite(sprite);
      this.cameras.main.shake(100, 0.004);
    } else {
      this.sound.play('sfx-critical', { volume: 0.35 });
    }
    if (o.knockedOut) {
      this.sound.play('sfx-kill', { volume: 0.5 });
      this.tweens.add({ targets: sprite, alpha: 0, duration: 400 });
    }
    this.refreshView();
  }

  private onTurnPlayed(): void {
    const { step } = this.ctx.state;
    if (step === 'ended') {
      const victory = this.ctx.state.status === 'won';
      this.sound.play(victory ? 'jingle-victory' : 'jingle-game-over', { volume: 0.6 });
      this.time.delayedCall(700, () => this.scene.start('Result', { ctx: this.ctx }));
      return;
    }
    if (step === 'relic') {
      this.sound.play('jingle-floor-clear', { volume: 0.6 });
      this.time.delayedCall(600, () => {
        this.playing = false;
        this.scene.pause();
        this.scene.launch('RelicPick', { ctx: this.ctx });
      });
      return;
    }
    this.playing = false;
    this.refreshView();
  }

  private refreshView(): void {
    const { player, phase, turn } = this.ctx.state;
    const enemy = this.ctx.currentEnemy;
    const playerStats = this.ctx.playerProfile().stats;
    const enemyStats = this.ctx.enemyProfile().stats;
    const pv = this.vitals.get(player.id) ?? player;
    const ev = this.vitals.get(enemy.id) ?? enemy;

    this.headerText.setText(`フェーズ ${phase}/${TOTAL_PHASES}   ターン ${turn}`);
    this.enemyHpBar.setValue(ev.hp, enemyStats.maxHp);
    this.playerHpBar.setValue(pv.hp, playerStats.maxHp);
    this.playerMpBar.setValue(pv.mp, playerStats.maxMp);
    this.refreshButtons();
  }

  /** 自分と今の敵のステータス一覧。各値の出どころ（シャッフル前は誰のどの項目だったか）も常に出す。 */
  private showStatusPanel(): void {
    if (this.playing) return;
    const w = this.scale.width;
    const h = this.scale.height;
    const panel = this.add.container(0, 0).setDepth(30);
    const shade = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6).setInteractive();
    panel.add([
      shade,
      this.add.rectangle(w / 2, 650, w - 40, 1060, 0x1a1a2a).setStrokeStyle(2, 0x5555aa),
    ]);

    const sections: [Combatant, number][] = [
      [this.ctx.state.player, 160],
      [this.ctx.currentEnemy, 610],
    ];
    for (const [c, top] of sections) {
      const isPlayer = c.id === 'player';
      const stats = isPlayer ? this.ctx.playerProfile().stats : this.ctx.enemyProfile().stats;
      const vitals = this.vitals.get(c.id) ?? c;
      panel.add(
        this.add.text(48, top, isPlayer ? `${c.name}（あなた）` : c.name, {
          fontFamily: 'monospace',
          fontSize: '24px',
          color: '#ffffff',
        }),
      );
      statEntries(c.id, stats, c.points).forEach((entry, i) => {
        const y = top + 52 + i * 52;
        // たいりょく・せいしんりょくは戦闘中なので「いま/最大」で出す
        const value =
          entry.key === 'hp'
            ? `${vitals.hp}/${entry.value}`
            : entry.key === 'mp'
              ? `${vitals.mp}/${entry.value}`
              : String(entry.value);
        panel.add([
          this.add.text(48, y, entry.label, {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: NORMAL_COLOR,
          }),
          this.add
            .text(330, y, value, { fontFamily: 'monospace', fontSize: '22px', color: '#ffffff' })
            .setOrigin(1, 0),
          this.add.text(350, y + 2, `← ${entry.origin}`, {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: entry.isOriginal ? '#8e8e93' : FLIPPED_COLOR,
          }),
        ]);
      });
    }
    panel.add(
      this.add
        .text(w / 2, 1145, 'タップでとじる', {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#8e8e93',
        })
        .setOrigin(0.5),
    );
    shade.once('pointerdown', () => panel.destroy(true));
  }

  private refreshButtons(): void {
    this.statusButton.setEnabled(!this.playing);
    const usable = new Set(this.ctx.usableActionIds());
    const player = this.ctx.state.player;
    const profile = this.ctx.playerProfile();
    for (const [id, button] of this.actionButtons) {
      const slot = player.actions.find((s) => s.id === id);
      if (!slot) {
        button.setEnabled(false);
        continue;
      }
      const action = ACTIONS[id];
      const kind = action.kind === 'kakutou' ? 'かくとう' : `まほう MP${mpCostOf(action, profile)}`;
      button.setText(`${action.name}\n${kind}  →${TARGET_LABELS[slot.target]}`);
      button.label.setColor(slot.target !== action.baseTarget ? FLIPPED_COLOR : '#ffffff');
      button.setEnabled(!this.playing && usable.has(id) && this.ctx.state.step === 'battle');
    }
  }

  private showBanner(message: string): void {
    const banner = this.add
      .text(this.scale.width / 2, 560, message, {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({
      targets: banner,
      alpha: 0,
      delay: 900,
      duration: 400,
      onComplete: () => banner.destroy(),
    });
  }

  private combatantOf(id: CombatantId): Combatant {
    if (id === 'player') return this.ctx.state.player;
    const enemy = this.ctx.state.enemies.find((e) => e.id === id);
    if (!enemy) throw new Error(`unknown combatant: ${id}`);
    return enemy;
  }

  private nextDamagePopup(): DamagePopup {
    const popup = this.damagePopups[this.damagePopupIndex];
    this.damagePopupIndex = (this.damagePopupIndex + 1) % DAMAGE_POPUP_POOL_SIZE;
    if (!popup) throw new Error('damage popup pool not initialized');
    return popup;
  }

  private flashSprite(sprite: Phaser.GameObjects.Image): void {
    const enemyTint = this.ctx.currentEnemy.tint;
    sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(60, () => {
      if (!sprite.active) return;
      // setTint は色だけを変えてモードは変えないので、clearTint で MULTIPLY に戻してから、
      // 色違いの敵は元の色を付け直す（戻さないと白いシルエットのままになる）
      sprite.clearTint();
      if (sprite === this.enemySprite && enemyTint !== null) sprite.setTint(enemyTint);
    });
  }
}
