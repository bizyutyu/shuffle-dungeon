import { defineRelic } from '@/core/relics/registry';

export const thriftRing = defineRelic({
  id: 'thrift_ring',
  name: '節約の指輪',
  rarity: 'rare',
  tags: ['mahou'],
  description: 'まほうの消費せいしんりょく −2（最低1）',
  hooks: {
    mpCostDelta() {
      return -2;
    },
  },
});
