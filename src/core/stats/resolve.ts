import type { Modifiers } from '@/core/types';
import { ZONES } from '@/core/slider/zones';

function lerpModifiers(a: Modifiers, b: Modifiers, t: number): Modifiers {
  const result = {} as Modifiers;
  for (const key of Object.keys(a) as (keyof Modifiers)[]) {
    result[key] = a[key] + (b[key] - a[key]) * t;
  }
  return result;
}

/** スライダー値からゾーンを線形補間したステータス修飾値を求める。 */
export function zoneModsAt(value: number): Modifiers {
  const zs = ZONES; // anchor昇順を前提
  const first = zs[0];
  const last = zs[zs.length - 1];
  if (!first || !last) throw new Error('ZONES is empty');

  if (value <= first.anchor) return { ...first.mods };
  if (value >= last.anchor) return { ...last.mods };

  const hi = zs.findIndex((z) => z.anchor >= value);
  const a = zs[hi - 1];
  const b = zs[hi];
  if (!a || !b) throw new Error('zoneModsAt: anchor lookup failed');
  if (value === a.anchor) return { ...a.mods };
  if (value === b.anchor) return { ...b.mods };
  const t = (value - a.anchor) / (b.anchor - a.anchor);
  return lerpModifiers(a.mods, b.mods, t);
}
