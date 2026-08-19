import Phaser from 'phaser';
import type { RunContext } from '@/core/run/runContext';
import { ZONES, zoneAt } from '@/core/slider/zones';
import { SliderGauge } from '@/ui/SliderGauge';

export class HudScene extends Phaser.Scene {
  private ctx!: RunContext;
  private gauge!: SliderGauge;
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
    this.hpText = this.add.text(20, 56, '', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffffff',
    });

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
    this.hpText.setText(`HP ${Math.ceil(this.ctx.state.playerHp)}/${this.ctx.state.playerMaxHp}`);

    const m = this.ctx.mods;
    const zoneId = zoneAt(this.ctx.slider.value);
    const zone = ZONES.find((z) => z.id === zoneId)?.label ?? '';
    this.modsText.setText(
      `${zone}  ATK x${m.atkMul.toFixed(2)}  DEF x${(1 / m.damageTakenMul).toFixed(2)}` +
        (m.critChance > 0 ? `  CRIT ${Math.round(m.critChance * 100)}%` : ''),
    );
  }
}
