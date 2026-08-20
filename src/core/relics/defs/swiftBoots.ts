import { defineRelic } from '@/core/relics/registry';

export const swiftBoots = defineRelic({
  id: 'swift_boots',
  name: '俊足のブーツ',
  rarity: 'common',
  tags: ['offense'],
  describe: () => '攻撃速度が常に20%上がる（クールダウンが短くなる）。',
  hooks: {
    modifyStats(mods) {
      mods.atkSpeedMul *= 1.2;
    },
  },
});
