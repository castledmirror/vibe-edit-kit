import React from 'react';
import {AbsoluteFill, Sequence, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing} from 'remotion';
import {C} from './theme';
import {SafeOverlay} from './components/SafeOverlay';
import {QAProbe} from './components/QAProbe';
import {SceneView} from './components/Scenes';
import type {Spec, Camera} from './spec';

/* The clip is mounted once and its geometry animates between two states, so audio and playback
   never restart. `card` drops the speaker into the lower part of the frame, under the graphic;
   `full` is the untouched clip. prepare.py sets camera.vy from a face scan so heads never crop. */
type Rect = {x: number; y: number; w: number; h: number; r: number; vw: number; vx: number; vy: number};
const CARD = (c: Camera): Rect => ({x: 130, y: 760, w: 820, h: 1160, r: 44, vw: c.vw, vx: c.vx, vy: c.vy});
const FULL: Rect = {x: 0, y: 0, w: 1080, h: 1920, r: 0, vw: 1080, vx: 0, vy: 0};
const TR = 14;
const BRIDGE_S = 1.0; // gaps shorter than this stay in card, so the layout never flickers

export const schedule = (spec: Spec, fps: number): [number, 'card' | 'full'][] => {
  const sorted = [...spec.scenes].sort((a, b) => a.start - b.start);
  const out: [number, 'card' | 'full'][] = [[0, 'full']];
  sorted.forEach((s, i) => {
    if (out[out.length - 1][1] !== 'card') out.push([Math.max(0, Math.round(s.start * fps) - 8), 'card']);
    const next = sorted[i + 1];
    if (!next || next.start - s.end >= BRIDGE_S) out.push([Math.round(s.end * fps), 'full']);
  });
  return out;
};

const Webcam: React.FC<{spec: Spec}> = ({spec}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sch = schedule(spec, fps);
  let idx = 0;
  for (let i = 0; i < sch.length; i++) if (f >= sch[i][0]) idx = i;
  const rect = (m: 'card' | 'full') => (m === 'card' ? CARD(spec.camera) : FULL);
  const cur = rect(sch[idx][1]);
  const prev = idx > 0 ? rect(sch[idx - 1][1]) : cur;
  const t = interpolate(f, [sch[idx][0], sch[idx][0] + TR], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const k = (a: number, b: number) => a + (b - a) * t;
  const r = {x: k(prev.x, cur.x), y: k(prev.y, cur.y), w: k(prev.w, cur.w), h: k(prev.h, cur.h), r: k(prev.r, cur.r), vw: k(prev.vw, cur.vw), vx: k(prev.vx, cur.vx), vy: k(prev.vy, cur.vy)};
  return (
    <div data-qa-ignore="intentional-crop" style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: `${r.r}px ${r.r}px 0 0`, overflow: 'hidden', boxShadow: r.r > 6 ? '0 -10px 40px rgba(16,14,12,0.10)' : 'none'}}>
      <OffthreadVideo src={staticFile(spec.video)} style={{position: 'absolute', left: r.vx, top: r.vy, width: r.vw, height: r.vw * (1920 / 1080), objectFit: 'cover'}} />
    </div>
  );
};

/* Scenes are authored in a 0–960 band and mapped into y 130–759 with one transform. */
const FIT_SCALE = 0.72;
const FIT_SHIFT = 68;

const FadeEdges: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const o = Math.min(
    interpolate(f, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    interpolate(f, [dur - 10, dur - 2], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

export const Main: React.FC<Spec & {debugSafe?: boolean; qa?: boolean}> = ({debugSafe = false, qa = false, ...spec}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill data-qa-root="1" style={{background: C.bg}}>
      {spec.scenes.map((s) => {
        const from = Math.round(s.start * fps);
        const dur = Math.max(1, Math.round((s.end - s.start) * fps));
        return (
          <Sequence key={s.id} from={from} durationInFrames={dur} layout="none">
            <FadeEdges dur={dur}>
              <AbsoluteFill style={{transformOrigin: '540px 0px', transform: `translateY(${FIT_SHIFT}px) scale(${FIT_SCALE})`}}>
                <SceneView scene={s} />
              </AbsoluteFill>
            </FadeEdges>
          </Sequence>
        );
      })}
      <Webcam spec={spec} />
      {debugSafe ? <SafeOverlay /> : null}
      {qa ? <QAProbe /> : null}
    </AbsoluteFill>
  );
};
