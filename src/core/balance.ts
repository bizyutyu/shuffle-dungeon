// バランス調整で触る数値をここに集める。

/** 素点→実際の値の換算係数 */
export const HP_PER_POINT = 5;
export const MP_PER_POINT = 3;

export const POINT_MIN = 1;
export const POINT_MAX = 20;

/** 耐性（みのまもり／かしこさ）がダメージを打ち消す割合 */
export const RESIST_RATE = 0.5;

/** シャッフル1回で、各行動の対象が本来の対象から反転する確率 */
export const TARGET_FLIP_CHANCE = 0.3;
export const MAX_SHUFFLES = 3;

/** 互いに相手を削れない組み合わせで戦闘が終わらなくなるのを防ぐ。超えたら敗北 */
export const MAX_TURNS_PER_BATTLE = 10;

export const RELIC_CHOICE_COUNT = 3;
