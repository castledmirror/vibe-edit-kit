import React from 'react';
import {useCurrentFrame, useVideoConfig, interpolate, Easing, Img, staticFile} from 'remotion';
import {C, sans, TYPE, SHADOW, accentRGB} from '../theme';
import {Label, useRise, usePop, Cursor} from './UI';
import {Kicker} from './Kicker';
import {Counter} from './Counter';
import type {SceneSpec, Row, Column} from '../spec';

/* Authored on a 1080-wide canvas, 0–960 tall. Main.tsx maps that band into the top of the frame. */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const num: React.CSSProperties = {fontFamily: sans, fontVariantNumeric: 'tabular-nums', fontWeight: 800};
const topFor = (head?: string) => (head ? 250 : 130);

const Quote: React.FC<{text: string; accent?: string}> = ({text, accent}) => {
  const parts = accent && text.includes(accent) ? text.split(accent) : [text];
  return (
    <div style={{position: 'absolute', top: 210, left: 80, width: 920, textAlign: 'center', fontFamily: sans, fontWeight: 800, fontSize: 92, lineHeight: 1.14, color: C.ink, ...useRise(2)}}>
      {parts[0]}{parts.length > 1 ? <><span style={{color: C.accent}}>{accent}</span>{parts[1]}</> : null}
    </div>
  );
};

const Stat: React.FC<{value: string; countTo?: number; prefix?: string; suffix?: string; caption: string; sub?: string; top: number}> = ({value, countTo, prefix, suffix, caption, sub, top}) => (
  <div style={{position: 'absolute', top, width: 1080, textAlign: 'center'}}>
    <div style={{...num, fontSize: TYPE.hero, lineHeight: 1, color: C.accent, letterSpacing: '-0.03em', ...usePop(0)}}>
      {countTo !== undefined ? <Counter to={countTo} prefix={prefix} suffix={suffix} dur={40} /> : value}
    </div>
    <div style={{fontFamily: sans, fontWeight: 700, fontSize: TYPE.h2, color: C.ink, marginTop: 26, lineHeight: 1.22, padding: '0 80px', ...useRise(14, 20)}}>{caption}</div>
    {sub ? <div style={{marginTop: 20, ...useRise(24, 16)}}><Label>{sub}</Label></div> : null}
  </div>
);

const ROW = {x: 100, w: 880, h: 150, gap: 26};

const RowCard: React.FC<{it: Row; top: number; style: React.CSSProperties; on?: boolean}> = ({it, top, style, on = true}) => (
  <div style={{
    position: 'absolute', left: ROW.x, top, width: ROW.w, height: ROW.h, borderRadius: 20, background: '#fff',
    border: on ? `2.5px solid ${C.accent}` : `1px solid ${C.line}`,
    boxShadow: on ? `0 12px 30px rgba(${accentRGB},0.16)` : '0 8px 22px rgba(16,14,12,0.06)',
    display: 'flex', alignItems: 'center', gap: 24, padding: '0 30px', ...style,
  }}>
    {it.n ? (
      <div style={{width: 78, height: 78, borderRadius: 20, background: on ? C.accent : C.accentSoft, color: on ? '#fff' : C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...num, fontSize: 42}}>{it.n}</div>
    ) : null}
    <div style={{minWidth: 0}}>
      <div style={{fontFamily: sans, fontWeight: 800, fontSize: TYPE.h2, color: C.ink, whiteSpace: 'nowrap'}}>{it.title}</div>
      {it.sub ? <div style={{fontFamily: sans, fontWeight: 500, fontSize: 36, color: C.muted, marginTop: 6, whiteSpace: 'nowrap'}}>{it.sub}</div> : null}
    </div>
  </div>
);

const Rows: React.FC<{items: Row[]; at?: (number | null)[]; top: number; s2f: (s: number) => number}> = ({items, at, top, s2f}) => (
  <>
    {items.map((it, i) => {
      const t = at?.[i];
      const d = t === undefined || t === null ? i * 13 : s2f(t);
      return <RowCard key={it.title} it={it} top={top + i * (ROW.h + ROW.gap)} style={useRise(d, 24, 18)} on={false} />;
    })}
  </>
);

/** Tease, then reveal: show the count with real labels blurred, un-blur each on the word it is said. */
const Tease: React.FC<{items: Row[]; reveal: (number | null)[]; top: number; s2f: (s: number) => number}> = ({items, reveal, top, s2f}) => {
  const f = useCurrentFrame();
  return (
    <>
      {items.map((it, i) => {
        const rise = useRise(i * 12, 24, 18);
        const at = reveal[i];
        const open = at === null || at === undefined ? 0 : interpolate(f, [s2f(at), s2f(at) + 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
        return (
          <div key={it.title} style={{position: 'absolute', inset: 0, filter: `blur(${(1 - open) * 16}px)`}}>
            <RowCard it={it} top={top + i * (ROW.h + ROW.gap)} style={rise} on={open > 0.5} />
          </div>
        );
      })}
    </>
  );
};

/* Cards fit their content so a short list does not sit in a tall empty box. */
const colHeight = (c: Column) => 84 + 52 + c.lines.reduce((h, l) => h + 22 + 56 * Math.ceil(l.length / 16), 0);

const Col: React.FC<{c: Column; x: number; hero: boolean; delay: number; top: number; h: number}> = ({c, x, hero, delay, top, h}) => (
  <div style={{
    position: 'absolute', left: x, top, width: 440, height: h, borderRadius: 26, background: '#fff',
    border: hero ? `2.5px solid ${C.accent}` : `1px solid ${C.line}`, boxShadow: '0 14px 34px rgba(16,14,12,0.08)',
    overflow: 'hidden', ...useRise(delay, 26),
  }}>
    <div style={{height: 84, background: hero ? C.accent : C.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, fontWeight: 800, fontSize: 34, letterSpacing: '0.04em', textTransform: 'uppercase'}}>{c.head}</div>
    <div style={{padding: '26px 28px'}}>
      {c.lines.map((l, i) => (
        <div key={l} style={{display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 22, ...useRise(delay + 12 + i * 8, 14, 16)}}>
          <div style={{width: 11, height: 11, borderRadius: 6, background: hero ? C.accent : C.muted, marginTop: 18, flexShrink: 0}} />
          <div style={{fontFamily: sans, fontWeight: 600, fontSize: TYPE.body, color: C.ink, lineHeight: 1.26}}>{l}</div>
        </div>
      ))}
    </div>
  </div>
);

const Chain: React.FC<{steps: {step: string; says: string}[]; match?: boolean; top: number}> = ({steps, match = false, top}) => {
  const f = useCurrentFrame();
  const H = 132, GAP = 26, X = 70, W = 940;
  return (
    <>
      {steps.map((s, i) => {
        const d = i * 14;
        const y = top + i * (H + GAP);
        const flag = interpolate(f, [d + 26, d + 42], [0, 1], clamp);
        return (
          <React.Fragment key={s.step}>
            {i > 0 ? (
              <svg style={{position: 'absolute', left: X + 54, top: y - GAP - 4}} width={28} height={GAP + 8}>
                <path d={`M14 2 V${GAP} M7 ${GAP - 8} L14 ${GAP + 1} L21 ${GAP - 8}`} fill="none" stroke={C.muted} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity={interpolate(f, [d - 6, d + 8], [0, 1], clamp)} />
              </svg>
            ) : null}
            <div style={{position: 'absolute', left: X, top: y, width: W, height: H, borderRadius: 22, background: '#fff', border: `1px solid ${C.line}`, boxShadow: '0 10px 26px rgba(16,14,12,0.07)', display: 'flex', alignItems: 'center', gap: 24, padding: '0 34px', ...useRise(d, 22, 18)}}>
              <div style={{width: 268, flexShrink: 0}}><Label>{s.step}</Label></div>
              <div style={{flex: 1, minWidth: 0, fontFamily: sans, fontWeight: 800, fontSize: 50, lineHeight: 1.1, color: match ? C.accent : C.ink, opacity: flag, whiteSpace: 'nowrap'}}>{s.says}</div>
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

const Loop: React.FC<{nodes: string[]; cy: number}> = ({nodes, cy}) => {
  const f = useCurrentFrame();
  const r = 190, cx = 540, nodeW = 280;
  const sweep = interpolate(f, [6, 78], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const dotA = (-90 + sweep * 360) * (Math.PI / 180);
  return (
    <>
      <svg style={{position: 'absolute', inset: 0}} width={1080} height={960}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.line} strokeWidth="6" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.accent} strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * r} strokeDashoffset={2 * Math.PI * r * (1 - sweep)} transform={`rotate(-90 ${cx} ${cy})`} />
        <circle cx={cx + Math.cos(dotA) * r} cy={cy + Math.sin(dotA) * r} r="14" fill={C.accent} />
      </svg>
      {nodes.map((l, i) => {
        const a = ((-90 + (360 / nodes.length) * i) * Math.PI) / 180;
        return (
          <div key={l} style={{position: 'absolute', left: cx + Math.cos(a) * r - nodeW / 2, top: cy + Math.sin(a) * r - 42, width: nodeW, height: 84, borderRadius: 30, background: '#fff', border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(16,14,12,0.07)', fontFamily: sans, fontWeight: 800, fontSize: 40, color: C.ink, whiteSpace: 'nowrap', ...usePop(4 + i * 8)}}>{l}</div>
        );
      })}
    </>
  );
};

const Bars: React.FC<{items: {label: string; value: number; display: string; hero?: boolean}[]; top: number}> = ({items, top}) => {
  const f = useCurrentFrame();
  const max = Math.max(...items.map((b) => b.value));
  return (
    <>
      {items.map((b, i) => {
        const d = i * 14;
        const t = interpolate(f, [d, d + 32], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
        const y = top + i * 200;
        const W = 880;
        return (
          <div key={b.label} style={{position: 'absolute', left: 100, top: y, width: W, height: 170, ...useRise(d, 18, 16)}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: sans, fontWeight: 800, fontSize: TYPE.h2, color: C.ink}}>
              <span>{b.label}</span><span style={{color: b.hero ? C.accent : C.ink}}>{b.display}</span>
            </div>
            <div style={{marginTop: 16, height: 56, width: W, borderRadius: 28, background: C.accentSoft}}>
              <div style={{height: 56, width: (W * b.value * t) / max, borderRadius: 28, background: b.hero ? C.accent : C.ink}} />
            </div>
          </div>
        );
      })}
    </>
  );
};

/** A REAL image at its true aspect ratio: the layout fits around it, it is never cropped. */
const Shot: React.FC<{src: string; caption?: string; top: number}> = ({src, caption, top}) => {
  const bottom = caption ? 840 : 930;
  return (
    <>
      <div style={{position: 'absolute', left: 80, top, width: 920, height: bottom - top, display: 'flex', alignItems: 'center', justifyContent: 'center', ...usePop(2)}}>
        <Img src={staticFile(src)} style={{maxWidth: 920, maxHeight: bottom - top, width: 'auto', height: 'auto', borderRadius: 22, boxShadow: SHADOW}} />
      </div>
      {caption ? <div style={{position: 'absolute', top: 860, width: 1080, textAlign: 'center', fontFamily: sans, fontWeight: 700, fontSize: TYPE.body, color: C.ink, ...useRise(14, 14)}}>{caption}</div> : null}
    </>
  );
};

const CTA: React.FC<{line1: string; line2?: string; action: string; where?: string}> = ({line1, line2, action, where}) => (
  <>
    <Kicker l1={line1} l2={line2} size={96} top={150} />
    <div style={{position: 'absolute', left: 140, top: 520, width: 800, height: 150, borderRadius: 24, background: C.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, fontWeight: 800, fontSize: 60, boxShadow: `0 14px 34px rgba(${accentRGB},0.34)`, ...useRise(16, 16)}}>{action}</div>
    {where ? <div style={{position: 'absolute', top: 710, width: 1080, textAlign: 'center', ...useRise(26, 12)}}><Label>{where}</Label></div> : null}
    <Cursor from={[930, 860]} to={[520, 595]} delay={40} />
  </>
);

export const SceneView: React.FC<{scene: SceneSpec}> = ({scene: s}) => {
  const {fps} = useVideoConfig();
  const s2f = (t: number) => Math.round((t - s.start) * fps);
  const top = topFor(s.head);
  return (
    <>
      {s.head ? <Kicker l1={s.head} size={TYPE.h1} top={90} /> : null}
      {s.type === 'kicker' ? <Kicker l1={s.line1} l2={s.line2} size={120} top={250} /> : null}
      {s.type === 'quote' ? <Quote text={s.text} accent={s.accent} /> : null}
      {s.type === 'stat' ? <Stat value={s.value} countTo={s.countTo} prefix={s.prefix} suffix={s.suffix} caption={s.caption} sub={s.sub} top={s.head ? 280 : 200} /> : null}
      {s.type === 'rows' ? <Rows items={s.items} at={s.at} top={top} s2f={s2f} /> : null}
      {s.type === 'tease' ? <Tease items={s.items} reveal={s.reveal} top={top} s2f={s2f} /> : null}
      {s.type === 'twoUp' ? (() => {
        const h = Math.min(960 - top - 30, Math.max(colHeight(s.left), colHeight(s.right)));
        return <><Col c={s.left} x={60} hero={false} delay={0} top={top} h={h} /><Col c={s.right} x={580} hero delay={14} top={top} h={h} /></>;
      })() : null}
      {s.type === 'chain' ? <Chain steps={s.steps} match={s.match} top={top} /> : null}
      {s.type === 'loop' ? <Loop nodes={s.nodes} cy={s.head ? 560 : 480} /> : null}
      {s.type === 'bars' ? <Bars items={s.items} top={top + 20} /> : null}
      {s.type === 'shot' ? <Shot src={s.src} caption={s.caption} top={top} /> : null}
      {s.type === 'cta' ? <CTA line1={s.line1} line2={s.line2} action={s.action} where={s.where} /> : null}
    </>
  );
};
