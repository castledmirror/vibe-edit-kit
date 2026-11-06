import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SAFE, SAFE_BOTTOM_Y} from '../safe';

/** Debug-only: visualises the platform keep-out zones over the ad. */
export const SafeOverlay: React.FC = () => {
  const red = 'rgba(255,0,64,0.24)';
  const box: React.CSSProperties = {position: 'absolute', background: red};
  const lbl: React.CSSProperties = {
    position: 'absolute', fontFamily: 'monospace', fontSize: 22, color: '#B3003A', fontWeight: 700,
  };
  return (
    <AbsoluteFill>
      <div style={{...box, left: 0, top: 0, width: 1080, height: SAFE.top}} />
      <div style={{...box, left: 0, top: SAFE_BOTTOM_Y, width: 1080, height: SAFE.bottom}} />
      <div style={{...box, left: 1080 - SAFE.right, top: SAFE.rail.top, width: SAFE.right, height: SAFE.rail.bottom - SAFE.rail.top}} />
      <div style={{position: 'absolute', left: 0, top: SAFE_BOTTOM_Y, width: 1080, height: 4, background: '#FF0040'}} />
      <div style={{...lbl, left: 16, top: SAFE.top + 8}}>top keep-out {SAFE.top}px</div>
      <div style={{...lbl, left: 16, top: SAFE_BOTTOM_Y - 34}}>safe floor y={SAFE_BOTTOM_Y}</div>
      <div style={{...lbl, left: 16, top: SAFE.captions.top + 6, color: '#0B6', }}>caption band</div>
      <div style={{position: 'absolute', left: 60, top: SAFE.captions.top, width: 840,
        height: SAFE.captions.bottom - SAFE.captions.top, border: '3px dashed #0B6'}} />
    </AbsoluteFill>
  );
};
