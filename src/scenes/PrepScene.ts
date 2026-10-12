import Phaser from 'phaser';
import { RunContext } from '@/core/run/runContext';
import { ACTIONS } from '@/core/combat/actions';
import { Button } from '@/ui/Button';
import { FLIPPED_COLOR, NORMAL_COLOR, TARGET_LABELS } from '@/ui/labels';
import { statEntries } from '@/ui/statView';
import { guardInputBriefly } from '@/ui/inputGuard';

const MARGIN_X = 40;
const PLAYER_TOP = 200;
const STAT_ROW_HEIGHT = 50;
const ENEMY_TOP = 760;
const ENEMY_ROW_HEIGHT = 60;

/**
 * ぼうけんじゅんび: 自分のステータスと行動の対象を見て、配り直すか出発するかを決める。
 * 敵がどう配り直されたかは、戦うまで見せない。
 */
export class PrepScene extends Phaser.Scene {
  private ctx!: RunContext;
  private playerView!: Phaser.GameObjects.Container;
  private shuffleButton!: Button;

  constructor() {
    super('Prep');
  }

  init(data: { seed?: number } = {}): void {
    this.ctx = new RunContext(data.seed ?? Date.now());
  }

  create(): void {
    guardInputBriefly(this);
    const w = this.scale.width;

    this.add
      .text(w / 2, 70, 'ぼうけんじゅんび', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.add
      .text(w / 2, 130, 'シャッフルすると、全員のステータスと\n行動の対象が配り直される', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: NORMAL_COLOR,
        align: 'center',
      })
      .setOrigin(0.5);

    this.playerView = this.add.container(0, 0);
    this.renderPlayer();
    this.renderEnemies();

    this.shuffleButton = new Button(this, w * 0.27, 1180, 320, 100, '', () => this.onShuffle());
    new Button(this, w * 0.73, 1180, 320, 100, 'しゅっぱつ', () => this.onDepart());
    this.refreshShuffleButton();
  }

  private onShuffle(): void {
    if (!this.ctx.shuffle()) return;
    this.sound.play('sfx-click', { volume: 0.5 });
    this.cameras.main.flash(150, 255, 214, 10);
    this.renderPlayer();
    this.refreshShuffleButton();
  }

  private onDepart(): void {
    if (!this.ctx.depart()) return;
    this.sound.play('sfx-click', { volume: 0.5 });
    this.scene.start('Run', { ctx: this.ctx });
  }

  private refreshShuffleButton(): void {
    const left = this.ctx.state.shufflesLeft;
    this.shuffleButton.setText(`シャッフル\n（のこり ${left}）`).setEnabled(left > 0);
  }

  /** 項目・値・出どころ（シャッフル前は誰のどの項目だったか）を1行ずつ並べる。 */
  private renderPlayer(): void {
    const w = this.scale.width;
    const { player } = this.ctx.state;
    const view = this.playerView;
    view.removeAll(true);

    view.add(
      this.add
        .rectangle(w / 2, PLAYER_TOP + 250, w - 32, 520, 0x1a1a2a)
        .setStrokeStyle(2, 0x5555aa),
    );
    view.add(
      this.add.text(MARGIN_X, PLAYER_TOP + 10, `${player.name}（あなた）`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      }),
    );

    statEntries(player.id, this.ctx.playerProfile().stats, player.points).forEach((entry, i) => {
      const y = PLAYER_TOP + 70 + i * STAT_ROW_HEIGHT;
      view.add([
        this.add.text(MARGIN_X, y, entry.label, {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: NORMAL_COLOR,
        }),
        this.add
          .text(MARGIN_X + 250, y, String(entry.value), {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#ffffff',
          })
          .setOrigin(1, 0),
        this.add.text(MARGIN_X + 280, y + 2, `← ${entry.origin}`, {
          fontFamily: 'monospace',
          fontSize: '17px',
          color: entry.isOriginal ? '#8e8e93' : FLIPPED_COLOR,
        }),
      ]);
    });

    // 本来の対象から反転している行動は色を変えて目立たせる
    const actionsTop = PLAYER_TOP + 70 + 6 * STAT_ROW_HEIGHT + 20;
    const slotWidth = (w - MARGIN_X * 2) / 2;
    player.actions.forEach((slot, i) => {
      const flipped = slot.target !== ACTIONS[slot.id].baseTarget;
      view.add(
        this.add.text(
          MARGIN_X + slotWidth * (i % 2),
          actionsTop + Math.floor(i / 2) * 40,
          `${ACTIONS[slot.id].name} → ${TARGET_LABELS[slot.target]}`,
          {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: flipped ? FLIPPED_COLOR : NORMAL_COLOR,
          },
        ),
      );
    });
  }

  /** 敵は名前と順番だけ見せる。ステータスと行動の対象は戦うまでわからない。 */
  private renderEnemies(): void {
    this.add.text(MARGIN_X, ENEMY_TOP, 'あいて（ステータスは たたかうまで ひみつ）', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#8e8e93',
    });
    this.ctx.state.enemies.forEach((enemy, i) => {
      this.add.text(
        MARGIN_X,
        ENEMY_TOP + 50 + i * ENEMY_ROW_HEIGHT,
        `${i + 1}. ${enemy.name}${enemy.isBoss ? '（ボス）' : ''}`,
        { fontFamily: 'monospace', fontSize: '22px', color: '#ffffff' },
      );
    });
  }
}
