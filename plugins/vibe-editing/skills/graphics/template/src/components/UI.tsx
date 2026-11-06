import React from 'react';
import {useCurrentFrame, interpolate, Easing, spring, useVideoConfig} from 'remotion';
import {C, sans, TYPE, accentRGB} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const useRise = (delay = 0, dist = 30, dur = 22) => {
  const f = useCurrentFrame() - delay;
  const t = interpolate(f, [0, dur], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return {opacity: t, transform: `translateY(${(1 - t) * dist}px)`};
};

export const usePop = (delay = 0) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - delay, fps, config: {damping: 14, mass: 0.6}});
  return {opacity: interpolate(s, [0, 0.4], [0, 1], {extrapolateRight: 'clamp'}), transform: `scale(${0.88 + s * 0.12})`};
};

/** Small uppercase label. Big enough to read, or remove it. */
export const Label: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{
    fontFamily: sans, fontSize: TYPE.cap, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: C.muted, ...style,
  }}>{children}</div>
);

/** Pointer that travels to a point and clicks. */
export const Cursor: React.FC<{from: [number, number]; to: [number, number]; delay?: number; travel?: number}> = ({from, to, delay = 0, travel = 34}) => {
  const f = useCurrentFrame() - delay;
  const t = interpolate(f, [0, travel], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const x = from[0] + (to[0] - from[0]) * t;
  const y = from[1] + (to[1] - from[1]) * t;
  const click = interpolate(f, [travel + 4, travel + 10, travel + 18], [1, 0.86, 1], clamp);
  const ring = interpolate(f, [travel + 4, travel + 26], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: f < 0 ? 0 : 1}}>
      {ring > 0 && ring < 1 ? (
        <div style={{
          position: 'absolute', left: -18 - ring * 35, top: -18 - ring * 35, width: 36 + ring * 70, height: 36 + ring * 70,
          border: `3px solid rgb(${accentRGB})`, borderRadius: '50%', opacity: 1 - ring,
        }} />
      ) : null}
      <svg width="46" height="46" viewBox="0 0 24 24" style={{transform: `scale(${click})`, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.28))'}}>
        <path d="M5 2 L5 19 L9.4 14.9 L12.2 21.2 L15.1 19.9 L12.4 13.8 L18.4 13.6 Z" fill="#fff" stroke="#111" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
