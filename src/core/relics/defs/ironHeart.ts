import { defineRelic } from '@/core/relics/registry';

export const ironHeart = defineRelic({
  id: 'iron_heart',
  name: '鉄の心臓',
  rarity: 'common',
  tags: ['stat'],
  description: 'たいりょくの最大値 +15',
  hooks: {
    modifyStats(stats) {
      stats.maxHp += 15;
    },
  },
});
