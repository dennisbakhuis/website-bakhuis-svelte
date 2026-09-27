import { describe, expect, it } from 'vitest';
import { landPath, MAP_HEIGHT, MAP_WIDTH, project, spherePath } from './world';

describe('world map', () => {
  it('projects the land outline once', () => {
    expect(landPath.length).toBeGreaterThan(10_000);
    expect(spherePath.startsWith('M')).toBe(true);
  });

  it('projects coordinates inside the viewport', () => {
    const amsterdam = project(4.9, 52.37);
    expect(amsterdam).not.toBeNull();
    expect(amsterdam!.x).toBeGreaterThan(MAP_WIDTH * 0.45);
    expect(amsterdam!.x).toBeLessThan(MAP_WIDTH * 0.6);
    expect(amsterdam!.y).toBeGreaterThan(0);
    expect(amsterdam!.y).toBeLessThan(MAP_HEIGHT * 0.4);
    const sydney = project(151.2, -33.9);
    expect(sydney!.x).toBeGreaterThan(amsterdam!.x);
    expect(sydney!.y).toBeGreaterThan(amsterdam!.y);
  });
});
