export type AlertKind =
  | "price_spike"
  | "volume_spike"
  | "whale_move"
  | "flow_shift"
  | "cluster_buy";

export interface Actor {
  address: string;
  labels: string[];
  usdValue: number;
  /** "buy" | "sell" | "in" | "out" — whichever fits the kind */
  action: string;
  /** raw amount in token units, useful when usd is missing */
  amount?: number;
  token?: string;
}

export interface Detection {
  kind: AlertKind;
  /** 1 (whisper) … 5 (siren) */
  severity: number;
  token?: string;
  /** primary headline written by the detector — narrator may rewrite */
  headline: string;
  windowMin: number;
  /** numeric features the narrator can quote (deltas, sigmas, $$) */
  metrics: Record<string, number | string>;
  /** main wallets behind the move (sorted by impact desc) */
  actors: Actor[];
  /** representative tx hashes for the alert */
  txExamples: string[];
  /** key for cooldown dedupe; same key within window is squashed */
  cooldownKey: string;
}
