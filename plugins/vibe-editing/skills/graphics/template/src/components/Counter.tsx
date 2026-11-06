import React from 'react';
import {useCurrentFrame, interpolate, Easing} from 'remotion';

/** Number that counts up.  */
export const Counter: React.FC<{
  to: number; delay?: number; dur?: number; prefix?: string; suffix?: string; style?: React.CSSProperties;
}> = ({to, delay = 0, dur = 45, prefix = '', suffix = '', style}) => {
  const f = useCurrentFrame() - delay;
  const v = interpolate(f, [0, dur], [0, to], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  });
  return <span style={style}>{prefix}{Math.round(v).toLocaleString('en-US')}{suffix}</span>;
};
