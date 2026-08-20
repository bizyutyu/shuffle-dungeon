import { defineRelic } from '@/core/relics/registry';

export const unstableCore = defineRelic({
  id: 'unstable_core',
  name: '不安定な核',
  rarity: 'rare',
  tags: ['slider', 'risk'],
  describe: () => 'スライダーの揺れ幅が2倍になる。減衰も弱まり、静止しにくくなる。',
  hooks: {
    modifySliderConfig(cfg) {
      cfg.noise *= 2;
      cfg.damping *= 0.5;
    },
  },
});
