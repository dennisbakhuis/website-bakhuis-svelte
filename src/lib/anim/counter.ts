import type { Action } from 'svelte/action';
import { reducedMotion } from './motion';

type CounterOptions = { value: number; decimals?: number; duration?: number; suffix?: string };

function format(value: number, decimals: number): string {
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Svelte action: count the element's number up from zero when it becomes visible. */
export const counter: Action<HTMLElement, CounterOptions> = (node, options) => {
  let current = options;
  const finalText = () => `${format(current.value, current.decimals ?? 0)}${current.suffix ?? ''}`;

  if (reducedMotion()) {
    node.textContent = finalText();
    return;
  }

  node.textContent = `0${current.suffix ?? ''}`;
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      void import('animejs').then(({ animate }) => {
        const state = { v: 0 };
        animate(state, {
          v: current.value,
          duration: current.duration ?? 1600,
          ease: 'outExpo',
          onUpdate: () => {
            node.textContent = `${format(state.v, current.decimals ?? 0)}${current.suffix ?? ''}`;
          },
          onComplete: () => {
            node.textContent = finalText();
          },
        });
      });
    },
    { threshold: 0.4 },
  );
  observer.observe(node);

  return {
    update(next) {
      current = next;
      node.textContent = finalText();
    },
    destroy() {
      observer.disconnect();
    },
  };
};
