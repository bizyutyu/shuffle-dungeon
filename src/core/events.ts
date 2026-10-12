import type { CombatantId, EndReason, TurnResult } from '@/core/types';

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
  'prep:shuffled': { shufflesLeft: number };
  'battle:started': { phase: number; enemyId: CombatantId };
  'turn:resolved': TurnResult;
  'battle:won': { phase: number };
  'relic:acquired': { id: string };
  'run:ended': { victory: boolean; reason: EndReason; score: number };
};
