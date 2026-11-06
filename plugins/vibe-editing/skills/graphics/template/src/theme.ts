import {getInputProps} from 'remotion';
import {loadFont as loadPlayfair} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadPoppins} from '@remotion/google-fonts/Poppins';
import type {Brand} from './spec';

const WEIGHTS = ['400', '500', '600', '700', '800', '900'] as const;
const playfairItalic = loadPlayfair('italic', {weights: ['700', '900'], subsets: ['latin']}).fontFamily;
const interSans = loadInter('normal', {weights: [...WEIGHTS], subsets: ['latin']}).fontFamily;
const poppinsSans = loadPoppins('normal', {weights: [...WEIGHTS], subsets: ['latin']}).fontFamily;
const poppinsItalic = loadPoppins('italic', {weights: ['700', '800', '900'], subsets: ['latin']}).fontFamily;

const DEFAULTS: Brand = {accent: '#0098FF', accentSoft: '#E1F0FF', ink: '#0B0B0C', bg: '#FDFDFD', fontSet: 'poppins'};
const brand: Brand = {...DEFAULTS, ...((getInputProps() as {brand?: Partial<Brand>}).brand ?? {})};

/** Flip `fontSet` in brand/graphics.json to restyle everything.
 *  'poppins' | 'poppins-playfair' | 'inter-playfair' */
export const FONT_SET = brand.fontSet;
export const sans = FONT_SET === 'inter-playfair' ? interSans : poppinsSans;
export const display = FONT_SET === 'poppins' ? poppinsItalic : playfairItalic;
/** Poppins sets wider than Playfair, so kickers come back a little to keep fitting the band. */
export const DISPLAY_SCALE = FONT_SET === 'poppins' ? 0.86 : 1;

const hex = brand.accent.replace('#', '');
export const accentRGB = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');

export const C = {
  bg: brand.bg, ink: brand.ink, accent: brand.accent, accentSoft: brand.accentSoft,
  muted: '#7C8288', line: '#E8E6E2', card: '#FFFFFF', dark: '#0E0E10',
};
export const SHADOW = '0 18px 48px rgba(16,14,12,0.10), 0 2px 8px rgba(16,14,12,0.06)';
export const SHADOW_SM = '0 8px 22px rgba(16,14,12,0.08)';

/** Type scale in authored px. Band scenes are drawn at 0.72 inside a 1080-wide frame and a reel is
 *  watched about 390pt wide, so phone pt = authored px x 0.26. Anything a viewer must read sits at
 *  `body` or above. `cap` is the floor and only for labels that cost nothing if unread: if a
 *  label cannot earn `cap`, delete it, do not shrink it. The QA gate fails anything under 8.5pt. */
export const TYPE = {hero: 200, h1: 76, h2: 56, body: 44, cap: 34};
