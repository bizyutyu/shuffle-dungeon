import { defineRelic } from '@/core/relics/registry';

export const manaSpring = defineRelic({
  id: 'mana_spring',
  name: '魔力の泉',
  rarity: 'common',
  tags: ['stat', 'mahou'],
  description: 'せいしんりょくの最大値 +9',
  hooks: {
    modifyStats(stats) {
      stats.maxMp += 9;
    },
  },
});
