import React from 'react';
import {Composition, type CalculateMetadataFunction} from 'remotion';
import {Main} from './Main';
import type {Spec} from './spec';

const EMPTY: Spec = {
  name: 'empty', video: 'clip.mp4', fps: 30, duration: 1,
  camera: {vw: 880, vx: -30, vy: -395},
  brand: {accent: '#0098FF', accentSoft: '#E1F0FF', ink: '#0B0B0C', bg: '#FDFDFD', fontSet: 'poppins'},
  scenes: [],
};
const meta: CalculateMetadataFunction<Spec> = ({props}) => ({
  fps: props.fps, durationInFrames: Math.max(1, Math.round(props.duration * props.fps)),
});
const Comp = Main as unknown as React.ComponentType<Spec>;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Comp} width={1080} height={1920} fps={30} durationInFrames={30} defaultProps={EMPTY} calculateMetadata={meta} />
    <Composition id="Safe" component={Comp} width={1080} height={1920} fps={30} durationInFrames={30} defaultProps={{...EMPTY, debugSafe: true} as Spec} calculateMetadata={meta} />
    <Composition id="QA" component={Comp} width={1080} height={1920} fps={30} durationInFrames={30} defaultProps={{...EMPTY, qa: true} as Spec} calculateMetadata={meta} />
  </>
);
