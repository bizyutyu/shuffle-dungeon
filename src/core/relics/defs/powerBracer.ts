import { defineRelic } from '@/core/relics/registry';

export const powerBracer = defineRelic({
  id: 'power_bracer',
  name: '力の腕輪',
  rarity: 'common',
  tags: ['stat', 'kakutou'],
  description: 'ちから +3',
  hooks: {
    modifyStats(stats) {
      stats.str += 3;
    },
  },
});
