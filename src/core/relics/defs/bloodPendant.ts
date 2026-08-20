import { defineRelic } from '@/core/relics/registry';

export const bloodPendant = defineRelic({
  id: 'blood_pendant',
  name: '血の吊り下げ',
  rarity: 'common',
  tags: ['offense', 'risk'],
  exclusiveGroup: 'restPointShift',
  describe: () => '静止点が25に移動する。常にアグレッシブ寄りに揺れ戻る。',
  hooks: {
    modifySliderConfig(cfg) {
      cfg.restPoint = 25;
    },
  },
});
