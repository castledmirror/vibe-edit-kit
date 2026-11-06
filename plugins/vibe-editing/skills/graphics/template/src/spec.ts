/** The scene list. prepare.py writes the skeleton; Claude fills in `scenes`. All times are seconds
 *  on the finished clip's own timeline, taken from the word timings in shotlist.md. */
export type Row = {n?: string; title: string; sub?: string};
export type Column = {head: string; lines: string[]};

export type SceneSpec = {id: string; start: number; end: number; head?: string} & (
  | {type: 'kicker'; line1: string; line2?: string}
  | {type: 'quote'; text: string; accent?: string}
  | {type: 'stat'; value: string; countTo?: number; prefix?: string; suffix?: string; caption: string; sub?: string}
  | {type: 'rows'; items: Row[]; at?: (number | null)[]}
  | {type: 'tease'; items: Row[]; reveal: (number | null)[]}
  | {type: 'twoUp'; left: Column; right: Column}
  | {type: 'chain'; steps: {step: string; says: string}[]; match?: boolean}
  | {type: 'loop'; nodes: string[]}
  | {type: 'bars'; items: {label: string; value: number; display: string; hero?: boolean}[]}
  | {type: 'shot'; src: string; caption?: string}
  | {type: 'cta'; line1: string; line2?: string; action: string; where?: string}
);

export type Camera = {vw: number; vx: number; vy: number};
export type Brand = {accent: string; accentSoft: string; ink: string; bg: string; fontSet: string};

export type Spec = {
  name: string; video: string; fps: number; duration: number;
  camera: Camera; brand: Brand; scenes: SceneSpec[];
  allow?: {word: string; why: string}[];
};
