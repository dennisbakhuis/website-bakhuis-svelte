import { gradientAt, reducedMotion } from './motion';

export const DESCENT_STOPS = [
  { at: 0, color: '#eaf4fb' },
  { at: 0.12, color: '#9fd3ea' },
  { at: 0.3, color: '#0f4c75' },
  { at: 0.6, color: '#0b2a4a' },
  { at: 0.85, color: '#071426' },
  { at: 1, color: '#030912' },
];

export const INK_STOPS = [
  { at: 0, color: '#0b2a4a' },
  { at: 0.18, color: '#0b2a4a' },
  { at: 0.3, color: '#e8eef6' },
  { at: 1, color: '#e8eef6' },
];

export type DescentState = { progress: number; depth: number; background: string; ink: string };

/**
 * Drive the front page "dive": as the visitor scrolls, the page background
 * darkens from surface to abyss and the depth gauge counts down in metres.
 *
 * Deliberately a plain scroll listener rather than a scroll-linked tween:
 * it is one lerp per frame, and it must keep working with reduced motion
 * because the gauge is content, not decoration.
 */
export function startDescent(
  root: HTMLElement,
  maxDepth: number,
  onChange: (state: DescentState) => void,
): () => void {
  let ticking = false;

  const update = () => {
    ticking = false;
    const total = root.scrollHeight - window.innerHeight;
    const progress = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
    const depth = Math.round(progress * maxDepth * 10) / 10;
    onChange({
      progress,
      depth,
      background: gradientAt(DESCENT_STOPS, progress),
      ink: gradientAt(INK_STOPS, progress),
    });
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}

export function motionAllowed(): boolean {
  return !reducedMotion();
}
