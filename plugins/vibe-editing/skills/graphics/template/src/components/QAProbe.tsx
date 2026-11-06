import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, useCurrentFrame} from 'remotion';

/** Measures the rendered frame and reports what is actually broken: content clipped by an
 *  overflow:hidden box, text wider than its container, text too small for a phone, or anything
 *  outside the 1080x1920 frame. Runs inside delayRender so the report lands before capture. */
export const QAProbe: React.FC = () => {
  const frame = useCurrentFrame();
  const [handle] = useState(() => delayRender(`qa-${frame}`));
  useEffect(() => {
    const issues: object[] = [];
    try {
      const TOL = 2;
      const rootEl = document.querySelector('[data-qa-root]');
      const O = rootEl ? rootEl.getBoundingClientRect() : {left: 0, top: 0};
      const label = (el: Element) => {
        const t = (el.textContent || '').trim().replace(/\s+/g, ' ');
        return t.length > 44 ? t.slice(0, 44) + '…' : t;
      };
      document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        if (el.closest('[data-qa-ignore]')) return;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        let node: HTMLElement | null = el;
        while (node) {
          if (parseFloat(getComputedStyle(node).opacity || '1') < 0.02) return;
          node = node.parentElement;
        }
        const hidesY = cs.overflowY === 'hidden' || cs.overflowY === 'clip';
        const hidesX = cs.overflowX === 'hidden' || cs.overflowX === 'clip';
        if (hidesY && el.scrollHeight > el.clientHeight + TOL) issues.push({type: 'clipped-vertical', by: el.scrollHeight - el.clientHeight, text: label(el)});
        if (hidesX && el.scrollWidth > el.clientWidth + TOL) issues.push({type: 'clipped-horizontal', by: el.scrollWidth - el.clientWidth, text: label(el)});
        if (!hidesX && el.children.length === 0 && el.scrollWidth > el.clientWidth + TOL) issues.push({type: 'text-overflow', by: el.scrollWidth - el.clientWidth, text: label(el)});
        if (el.children.length === 0 && label(el) && el.offsetWidth > 0) {
          const scale = r.width / el.offsetWidth;
          const px = parseFloat(cs.fontSize || '0');
          const pt = px * scale * (390 / 1080);
          if (px > 0 && scale > 0.05 && pt < 8.5) issues.push({type: 'too-small-on-phone', pt: Math.round(pt * 10) / 10, px: Math.round(px), text: label(el)});
        }
        if (el.children.length === 0 && label(el)) {
          const x0 = r.left - O.left, y0 = r.top - O.top, x1 = r.right - O.left, y1 = r.bottom - O.top;
          if (x0 < -TOL || y0 < -TOL || x1 > 1080 + TOL || y1 > 1920 + TOL) issues.push({type: 'out-of-frame', rect: [x0, y0, x1, y1].map(Math.round), text: label(el)});
        }
      });
    } catch (e) {
      issues.push({type: 'probe-error', text: String(e)});
    }
    const seen = new Set<string>();
    const uniq = issues.filter((i) => {
      const k = JSON.stringify(i);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    console.log('QA_REPORT ' + JSON.stringify({frame, issues: uniq}));
    continueRender(handle);
  }, [handle, frame]);
  return null;
};
