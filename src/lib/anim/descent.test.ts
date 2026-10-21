import { describe, expect, it, vi } from 'vitest';
import { startDescent, type DescentState } from './descent';

describe('startDescent', () => {
  it('reports how far the page is scrolled, so the seabed can fade on it', () => {
    const root = document.createElement('div');
    Object.defineProperty(root, 'scrollHeight', { value: 3000 });
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: 240, configurable: true });
    const states: DescentState[] = [];
    const stop = startDescent(root, 40, (s) => states.push(s));
    expect(states[0]).toMatchObject({ scroll: 240, progress: 0.12 });
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    window.dispatchEvent(new Event('scroll'));
    expect(states.at(-1)).toMatchObject({ scroll: 0, progress: 0, depth: 0 });
    stop();
  });
});
