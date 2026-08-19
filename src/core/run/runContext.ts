import type { Modifiers, RunState } from '@/core/types';
import { createRunRng, type RunRng } from '@/core/rng';
import { clamp } from '@/core/math';
import { ChaosSlider } from '@/core/slider/chaosSlider';
import { BASE_IMPULSES, killImpulseFor } from '@/core/slider/impulse';
import { zoneAt, type ZoneId } from '@/core/slider/zones';
import { zoneModsAt } from '@/core/stats/resolve';
import { createEnemy } from '@/core/combat/enemy';
import { resolvePlayerAttack, resolveEnemyDamageToPlayer } from '@/core/combat/damage';
import { TypedEmitter, type RunEvents } from '@/core/events';

const FIXED_STEP_MS = 1000 / 60;
// タブが非アクティブだった場合等の巨大なdtで1フレームに大量のステップが走るのを防ぐ
const MAX_ACCUMULATOR_MS = 250;
const BASE_ATTACK_COOLDOWN_SEC = 0.35;
const ENEMY_ATTACK_INTERVAL_SEC = 1.5;

export class RunContext extends TypedEmitter<RunEvents> {
  readonly state: RunState;
  readonly slider: ChaosSlider;
  readonly rng: RunRng;
  mods: Modifiers;
  private accumulatorMs = 0;
  private lastZone: ZoneId;
  private lastPlayerAttackAtSec = -Infinity;

  constructor(seed: number) {
    super();
    this.rng = createRunRng(seed);
    this.slider = new ChaosSlider(this.rng.slider);

    const enemies = [
      createEnemy('e1', 240, 500),
      createEnemy('e2', 480, 500),
      createEnemy('e3', 360, 700),
    ];
    // 全員が同時に初回攻撃をしないよう、攻撃タイミングを分散させる
    enemies.forEach((e, i) => {
      e.lastAttackAtSec = (i / enemies.length) * ENEMY_ATTACK_INTERVAL_SEC;
    });

    this.state = {
      seed,
      floor: 1,
      status: 'running',
      playerHp: 100,
      playerMaxHp: 100,
      enemies,
      score: 0,
      elapsedSec: 0,
    };
    this.mods = zoneModsAt(this.slider.value);
    this.lastZone = zoneAt(this.slider.value);
  }

  /** 可変フレームレートの影響を排除するため、常に固定ステップでcoreを進める。 */
  tick(dtMs: number): void {
    if (this.state.status !== 'running') return;
    this.accumulatorMs = Math.min(this.accumulatorMs + dtMs, MAX_ACCUMULATOR_MS);
    while (this.accumulatorMs >= FIXED_STEP_MS) {
      this.fixedTick(FIXED_STEP_MS);
      this.accumulatorMs -= FIXED_STEP_MS;
      if (this.state.status !== 'running') break;
    }
  }

  private fixedTick(dtMs: number): void {
    // 通常のゲームプレイでは到達しないが、テスト等で外部からHPを直接操作された場合、
    // CHAOS帯のhpRegenで復活してしまう前にここで確定させる（防御的ガード）。
    if (this.state.playerHp <= 0) {
      this.endRun(false);
      return;
    }

    this.slider.update(dtMs);
    this.mods = zoneModsAt(this.slider.value);

    const dtSec = dtMs / 1000;
    this.state.elapsedSec += dtSec;
    this.state.playerHp = clamp(
      this.state.playerHp + this.mods.hpRegenPerSec * dtSec,
      0,
      this.state.playerMaxHp,
    );
    if (this.state.playerHp <= 0) {
      this.endRun(false);
      return;
    }

    this.tickEnemyAttacks();
    if (this.state.status !== 'running') return;

    const zone = zoneAt(this.slider.value);
    if (zone !== this.lastZone) {
      this.lastZone = zone;
      this.emit('slider:zoneEnter', { zone });
    }
    this.emit('slider:changed', { value: this.slider.value, zone });
  }

  /** 敵はプレイヤーの行動とは無関係に、一定間隔で自律的に攻撃してくる。 */
  private tickEnemyAttacks(): void {
    const interval = ENEMY_ATTACK_INTERVAL_SEC / this.mods.enemySpeedMul;
    for (const enemy of this.state.enemies) {
      if (!enemy.alive) continue;
      if (this.state.elapsedSec - enemy.lastAttackAtSec < interval) continue;
      enemy.lastAttackAtSec += interval;

      const dmg = resolveEnemyDamageToPlayer(enemy.atk, this.mods);
      this.state.playerHp = clamp(this.state.playerHp - dmg, 0, this.state.playerMaxHp);
      this.slider.applyImpulse(BASE_IMPULSES.takeDamage);
      this.emit('player:damaged', { amount: dmg, hp: this.state.playerHp });
      if (this.state.playerHp <= 0) {
        this.endRun(false);
        return;
      }
    }
  }

  attackEnemy(enemyId: string): void {
    if (this.state.status !== 'running') return;

    const enemy = this.state.enemies.find((e) => e.id === enemyId && e.alive);
    if (!enemy) return;

    // atkSpeedMulに応じたクールダウン。CHAOSでは連打できず、AGGRESSIVEでは連射できる。
    const cooldownSec = BASE_ATTACK_COOLDOWN_SEC / this.mods.atkSpeedMul;
    if (this.state.elapsedSec - this.lastPlayerAttackAtSec < cooldownSec) {
      this.emit('attack:blocked', { enemyId });
      return;
    }

    this.lastPlayerAttackAtSec = this.state.elapsedSec;
    this.slider.applyImpulse(BASE_IMPULSES.attack);
    const result = resolvePlayerAttack(this.mods, this.rng.combat);

    if (result.isMisfire) {
      // 暴発はダメージを与えられなかった空振りなので、killのタップ数比例計算には含めない
      this.slider.applyImpulse(BASE_IMPULSES.misfire);
      return;
    }
    // ダメージが実際に入ったタップのみをkillインパルスの計算対象にする
    enemy.taps += 1;
    if (result.isCrit) this.slider.applyImpulse(BASE_IMPULSES.critical);

    enemy.hp = clamp(enemy.hp - result.damage, 0, enemy.maxHp);
    if (enemy.hp <= 0) {
      enemy.alive = false;
      this.slider.applyImpulse(killImpulseFor(enemy.taps));
      this.emit('enemy:killed', { id: enemy.id });
      if (this.state.enemies.every((e) => !e.alive)) {
        this.endRun(true);
      }
    }
  }

  private endRun(victory: boolean): void {
    this.state.status = victory ? 'won' : 'lost';
    this.emit('run:ended', { victory, score: this.state.score });
  }
}
