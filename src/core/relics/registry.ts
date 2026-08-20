import type { RelicDef } from '@/core/relics/types';

const registry = new Map<string, RelicDef>();

export function defineRelic(def: RelicDef): RelicDef {
  if (registry.has(def.id)) throw new Error(`duplicate relic id: ${def.id}`);
  registry.set(def.id, def);
  return def;
}

export function getRelic(id: string): RelicDef {
  const def = registry.get(id);
  if (!def) throw new Error(`unknown relic id: ${id}`);
  return def;
}

export function allRelics(): readonly RelicDef[] {
  return [...registry.values()];
}
