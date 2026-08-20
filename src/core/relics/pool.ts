import type { Rarity, RelicDef } from '@/core/relics/types';
import { allRelics } from '@/core/relics/registry';
import type { Rng } from '@/core/rng';

const RARITY_WEIGHT: Record<Rarity, number> = { common: 70, rare: 25, legendary: 5 };

function weightedSampleWithoutReplacement(
  items: readonly RelicDef[],
  count: number,
  rng: Rng,
): RelicDef[] {
  const pool = [...items];
  const result: RelicDef[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const weights = pool.map((r) => RARITY_WEIGHT[r.rarity]);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rng.next() * total;
    let idx = 0;
    for (; idx < weights.length - 1; idx++) {
      r -= weights[idx] ?? 0;
      if (r <= 0) break;
    }
    const picked = pool.splice(idx, 1)[0];
    if (picked) result.push(picked);
  }
  return result;
}

/** 所持済み・排他グループが埋まっているレリックを除外し、重み付きで候補を抽選する。 */
export function rollRelicChoices(ownedIds: readonly string[], rng: Rng, count = 3): RelicDef[] {
  const owned = new Set(ownedIds);
  const ownedDefs = allRelics().filter((r) => owned.has(r.id));
  const ownedGroups = new Set(
    ownedDefs.flatMap((r) => (r.exclusiveGroup ? [r.exclusiveGroup] : [])),
  );
  const candidates = allRelics().filter(
    (r) => !owned.has(r.id) && !(r.exclusiveGroup && ownedGroups.has(r.exclusiveGroup)),
  );
  return weightedSampleWithoutReplacement(candidates, count, rng);
}
