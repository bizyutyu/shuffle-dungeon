import type { ZoneId } from '@/core/slider/zones';

type Listener<T> = (payload: T) => void;

export class TypedEmitter<E extends Record<string, unknown>> {
  private listeners = new Map<keyof E, Set<Listener<E[keyof E]>>>();

  on<K extends keyof E>(event: K, listener: Listener<E[K]>): void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(listener as Listener<E[keyof E]>);
    this.listeners.set(event, set);
  }

  off<K extends keyof E>(event: K, listener: Listener<E[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<E[keyof E]>);
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) listener(payload);
  }
}

export type RunEvents = {
  'slider:changed': { value: number; zone: ZoneId };
  'slider:zoneEnter': { zone: ZoneId };
  'player:damaged': { amount: number; hp: number };
  'enemy:killed': { id: string };
  'floor:cleared': { floor: number };
  'floor:started': { floor: number; isBoss: boolean };
  'relic:acquired': { id: string };
  'run:ended': { victory: boolean; score: number };
  /** 攻撃クールダウン中のタップが無視されたことをUI側に伝える（無反応に見えるのを防ぐ）。 */
  'attack:blocked': { enemyId: string };
};
