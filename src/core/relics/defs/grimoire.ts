import { defineRelic } from '@/core/relics/registry';

export const grimoire = defineRelic({
  id: 'grimoire',
  name: '古の魔導書',
  rarity: 'rare',
  tags: ['mahou'],
  description: 'まほうの倍率 ×1.3',
  hooks: {
    powerMultiplier(kind) {
      return kind === 'mahou' ? 1.3 : 1;
    },
  },
});
