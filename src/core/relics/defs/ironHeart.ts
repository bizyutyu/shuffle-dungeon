import { defineRelic } from '@/core/relics/registry';

export const ironHeart = defineRelic({
  id: 'iron_heart',
  name: '鉄の心臓',
  rarity: 'common',
  tags: ['defense'],
  describe: () => '被ダメージが常に25%軽減される。',
  hooks: {
    modifyStats(mods) {
      mods.damageTakenMul *= 0.75;
    },
  },
});
