/** ステータスの項目。シャッフル時は6者×6項目の素点をひとまとめにして配り直す。 */
export const STAT_KEYS = ['hp', 'mp', 'str', 'def', 'int', 'spd'] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export const STAT_LABELS: Record<StatKey, string> = {
  hp: 'たいりょく',
  mp: 'せいしんりょく',
  str: 'ちから',
  def: 'みのまもり',
  int: 'かしこさ',
  spd: 'すばやさ',
};

/** どの項目に配られても破綻しないよう、全ステータスを同じ尺度（整数1〜20）で持つ。 */
export type RawStatPoints = Record<StatKey, number>;

/** シャッフル前に、その素点が誰のどの項目だったか。 */
export interface StatOrigin {
  ownerId: CombatantId;
  stat: StatKey;
}

/** 素点1つ分。シャッフルでは構造体ごと配り直すので、出どころ（origin）が値と一緒に移動する。 */
export interface StatPoint {
  value: number;
  origin: StatOrigin;
}

export type StatPoints = Record<StatKey, StatPoint>;

/** 素点から換算した実際の値。レリックの補正はこの値に加算する。 */
export interface Stats {
  maxHp: number;
  maxMp: number;
  str: number;
  def: number;
  int: number;
  spd: number;
}

export type ActionId = 'attack' | 'focus' | 'fire' | 'heal';
export type ActionKind = 'kakutou' | 'mahou';
export type ActionTarget = 'self' | 'opponent';
export type ActionEffect = 'damage' | 'heal';

export interface ActionDef {
  id: ActionId;
  name: string;
  kind: ActionKind;
  effect: ActionEffect;
  /** シャッフル前の対象 */
  baseTarget: ActionTarget;
  /** 参照ステータスに掛ける倍率 */
  power: number;
  /** かくとうは0 */
  mpCost: number;
}

/** キャラクターが実際に持っている行動。対象はシャッフルで反転しうる。 */
export interface ActionSlot {
  id: ActionId;
  target: ActionTarget;
  /** 敵AIが行動を選ぶときの重み（プレイヤーでは使わない） */
  weight: number;
}

export type CombatantId = 'player' | `enemy${number}`;

export interface CombatantDef {
  id: CombatantId;
  name: string;
  spriteKey: string;
  /** スプライトを色違いで使い回すときの色。使わない場合はnull */
  tint: number | null;
  isBoss: boolean;
  points: RawStatPoints;
  actions: readonly { id: ActionId; weight: number }[];
}

export interface Combatant {
  id: CombatantId;
  name: string;
  spriteKey: string;
  tint: number | null;
  isBoss: boolean;
  points: StatPoints;
  actions: ActionSlot[];
  hp: number;
  mp: number;
}

/** 戦闘計算に使う、補正込みの能力。プレイヤーはレリックで、敵は素のまま。 */
export interface CombatProfile {
  stats: Stats;
  powerMul: Record<ActionKind, number>;
  /** まほうの消費MPへの加算値（負で軽減）。消費MPの下限は1 */
  mpCostDelta: number;
}

export interface ActionOutcome {
  actorId: CombatantId;
  actionId: ActionId;
  targetId: CombatantId;
  effect: ActionEffect;
  amount: number;
  mpSpent: number;
  targetHpAfter: number;
  actorMpAfter: number;
  /** この行動で対象のたいりょくが0になったか */
  knockedOut: boolean;
}

export type BattleWinner = 'player' | 'enemy' | null;

export interface TurnResult {
  outcomes: ActionOutcome[];
  winner: BattleWinner;
}

export type RunStep = 'prep' | 'battle' | 'relic' | 'ended';
export type RunStatus = 'running' | 'won' | 'lost';
export type EndReason = 'cleared' | 'defeated' | 'timeout';

export interface RunState {
  seed: number;
  step: RunStep;
  status: RunStatus;
  endReason: EndReason | null;
  /** 現在のフェーズ（1始まり） */
  phase: number;
  /** 現在のフェーズでの経過ターン数 */
  turn: number;
  shufflesLeft: number;
  player: Combatant;
  /** フェーズ順に並んだ5体の敵 */
  enemies: Combatant[];
  relicIds: string[];
  relicChoices: string[];
  score: number;
}
