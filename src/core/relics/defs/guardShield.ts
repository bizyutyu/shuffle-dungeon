import { defineRelic } from '@/core/relics/registry';

export const guardShield = defineRelic({
  id: 'guard_shield',
  name: '守りの盾',
  rarity: 'common',
  tags: ['stat'],
  description: 'みのまもり +3',
  hooks: {
    modifyStats(stats) {
      stats.def += 3;
    },
  },
});
