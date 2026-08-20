import { defineRelic } from '@/core/relics/registry';

export const coldCompress = defineRelic({
  id: 'cold_compress',
  name: '冷たい湿布',
  rarity: 'common',
  tags: ['defense', 'risk'],
  exclusiveGroup: 'restPointShift',
  describe: () => '静止点が75に移動する。常にカオス寄りに揺れ戻る。',
  hooks: {
    modifySliderConfig(cfg) {
      cfg.restPoint = 75;
    },
  },
});
