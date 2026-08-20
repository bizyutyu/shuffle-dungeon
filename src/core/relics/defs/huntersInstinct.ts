import { defineRelic } from '@/core/relics/registry';

export const huntersInstinct = defineRelic({
  id: 'hunters_instinct',
  name: '狩人の勘',
  rarity: 'legendary',
  tags: ['offense', 'slider'],
  describe: () => '撃破によるスライダーの引き戻しが50%強化される。',
  hooks: {
    modifyImpulse(spec, source) {
      if (source === 'kill') spec.base *= 1.5;
    },
  },
});
