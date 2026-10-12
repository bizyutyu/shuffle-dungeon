import { defineRelic } from '@/core/relics/registry';

export const fightersGlove = defineRelic({
  id: 'fighters_glove',
  name: '闘魂のグローブ',
  rarity: 'rare',
  tags: ['kakutou'],
  description: 'かくとうの倍率 ×1.3',
  hooks: {
    powerMultiplier(kind) {
      return kind === 'kakutou' ? 1.3 : 1;
    },
  },
});
