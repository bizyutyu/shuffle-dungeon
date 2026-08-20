/** スライダーが50から離れているほど1.0に近づくV字の危険度重み。 */
export function dangerWeight(sliderValue: number): number {
  const dist = Math.abs(sliderValue - 50) / 50; // 0(中央)..1(端)
  return Math.pow(dist, 1.5);
}

/** 経過時間・スライダー位置・フロアの深さから危険度スコアの増分を求める。 */
export function scoreDelta(dtSec: number, sliderValue: number, floor: number): number {
  return dtSec * dangerWeight(sliderValue) * (1 + floor * 0.4) * 10;
}
