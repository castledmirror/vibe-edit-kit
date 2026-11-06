import React from 'react';
import {useCurrentFrame, interpolate, Easing} from 'remotion';
import {display, DISPLAY_SCALE, C} from '../theme';

/** Italic two-line headline: line 1 in ink, line 2 in the accent colour. */
export const Kicker: React.FC<{l1: string; l2?: string; delay?: number; size?: number; top?: number}> = ({l1, l2, delay = 0, size = 74, top = 100}) => {
  const f = useCurrentFrame() - delay;
  const rise = (i: number) => {
    const t = interpolate(f, [i * 5, i * 5 + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
    return {opacity: t, transform: `translateY(${(1 - t) * 26}px)`};
  };
  return (
    <div style={{
      position: 'absolute', top, left: 40, width: 1000, textAlign: 'center', fontFamily: display,
      fontStyle: 'italic', fontWeight: 900, fontSize: size * DISPLAY_SCALE, lineHeight: 1.06,
      letterSpacing: '0.005em', color: C.ink,
    }}>
      <div style={rise(0)}>{l1}</div>
      {l2 ? <div style={{...rise(1), color: C.accent}}>{l2}</div> : null}
    </div>
  );
};
