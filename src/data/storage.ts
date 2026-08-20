const STORAGE_KEY = 'shuffle-dungeon:highscore';
const SCHEMA_VERSION = 1;

interface StoredHighScore {
  version: number;
  score: number;
}

function isStoredHighScore(data: unknown): data is StoredHighScore {
  return (
    typeof data === 'object' &&
    data !== null &&
    'version' in data &&
    'score' in data &&
    (data as { version: unknown }).version === SCHEMA_VERSION &&
    typeof (data as { score: unknown }).score === 'number'
  );
}

export function loadHighScore(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const data: unknown = JSON.parse(raw);
    return isStoredHighScore(data) ? data.score : 0;
  } catch {
    return 0;
  }
}

/** ハイスコアを更新できた場合のみtrueを返す。 */
export function saveHighScoreIfBetter(score: number): boolean {
  const current = loadHighScore();
  if (score <= current) return false;
  try {
    const data: StoredHighScore = { version: SCHEMA_VERSION, score };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
