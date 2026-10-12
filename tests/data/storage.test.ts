import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadHighScore, saveHighScoreIfBetter } from '@/data/storage';

const KEY = 'shuffle-dungeon:highscore';

beforeEach(() => {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    get length() {
      return store.size;
    },
  };
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage');
});

describe('ハイスコアの保存', () => {
  it('保存した値を読み込める', () => {
    expect(saveHighScoreIfBetter(3000)).toBe(true);
    expect(loadHighScore()).toBe(3000);
    expect(saveHighScoreIfBetter(2000)).toBe(false);
  });

  it.each(['1e999', '-100', '12.5', '"9999"'])('改ざんされた値（%s）は0として扱う', (score) => {
    localStorage.setItem(KEY, `{"version":2,"score":${score}}`);
    expect(loadHighScore()).toBe(0);
  });

  it('v1の記録と壊れたJSONは0として扱う', () => {
    localStorage.setItem(KEY, '{"version":1,"score":500}');
    expect(loadHighScore()).toBe(0);
    localStorage.setItem(KEY, '{broken');
    expect(loadHighScore()).toBe(0);
  });
});
