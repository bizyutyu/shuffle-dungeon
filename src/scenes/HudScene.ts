import Phaser from 'phaser';
import type { RunContext } from '@/core/run/runContext';
import { ZONES, zoneAt } from '@/core/slider/zones';
import { SliderGauge } from '@/ui/SliderGauge';

const HP_BAR_WIDTH = 240;

export class HudScene extends Phaser.Scene {
  private ctx!: RunContext;
  private gauge!: SliderGauge;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private floorText!: Phaser.GameObjects.Text;
  private modsText!: Phaser.GameObjects.Text;
  private readonly onSliderChanged = (): void => {
    this.gauge.setValue(this.ctx.slider.value);
  };

  constructor() {
    super('Hud');
  }

  init(data: { ctx: RunContext }): void {
    this.ctx = data.ctx;
  }

  create(): void {
    this.floorText = this.add.text(20, 20, '', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
    });
    this.add.rectangle(20, 62, HP_BAR_WIDTH, 18, 0x333344).setOrigin(0, 0.5);
    this.hpBarFill = this.add.rectangle(20, 62, HP_BAR_WIDTH, 18, 0x30d158).setOrigin(0, 0.5);
    this.hpText = this.add.text(20 + HP_BAR_WIDTH + 12, 62, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    });
    this.hpText.setOrigin(0, 0.5);

    this.gauge = new SliderGauge(
      this,
      this.scale.width / 2,
      this.scale.height - 200,
      this.scale.width - 80,
    );
    this.gauge.setValue(this.ctx.slider.value);

    this.modsText = this.add
      .text(this.scale.width / 2, this.scale.height - 130, '', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5, 0);

    this.ctx.on('slider:changed', this.onSliderChanged);
    this.events.once('shutdown', () => {
      this.ctx.off('slider:changed', this.onSliderChanged);
    });
  }

  override update(): void {
    this.floorText.setText(`F${this.ctx.state.floor}/5`);
    this.hpText.setText(`${Math.ceil(this.ctx.state.playerHp)}/${this.ctx.state.playerMaxHp}`);

    const hpRatio = Phaser.Math.Clamp(
      this.ctx.state.playerHp / this.ctx.state.playerMaxHp,
      0,
      1,
    );
    this.hpBarFill.width = HP_BAR_WIDTH * hpRatio;
    this.hpBarFill.setFillStyle(hpRatio > 0.5 ? 0x30d158 : hpRatio > 0.25 ? 0xffcc00 : 0xff3b30);

    const m = this.ctx.mods;
    const zoneId = zoneAt(this.ctx.slider.value);
    const zone = ZONES.find((z) => z.id === zoneId)?.label ?? '';
    this.modsText.setText(
      `${zone}  ATK x${m.atkMul.toFixed(2)}  DEF x${(1 / m.damageTakenMul).toFixed(2)}` +
        (m.critChance > 0 ? `  CRIT ${Math.round(m.critChance * 100)}%` : ''),
    );
  }
}
