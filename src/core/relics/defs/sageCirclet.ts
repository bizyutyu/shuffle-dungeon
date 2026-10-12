import { defineRelic } from '@/core/relics/registry';

export const sageCirclet = defineRelic({
  id: 'sage_circlet',
  name: '賢者のサークレット',
  rarity: 'common',
  tags: ['stat', 'mahou'],
  description: 'かしこさ +3',
  hooks: {
    modifyStats(stats) {
      stats.int += 3;
    },
  },
});
