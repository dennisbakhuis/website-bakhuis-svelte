import { describe, expect, it } from 'vitest';
import { createSchool, fleeVector, headingDeg, mulberry32, stepSchool } from './fish';

const bounds = { width: 1200, height: 800 };
const noShark = { x: 0, y: 0, active: false };

describe('fish school', () => {
  it('is reproducible for a seed', () => {
    const a = createSchool(5, bounds, 3);
    const b = createSchool(5, bounds, 3);
    expect(a).toEqual(b);
    expect(mulberry32(1)()).toBe(mulberry32(1)());
  });

  it('keeps swimming inside the bounds', () => {
    const school = createSchool(12, bounds, 11);
    for (let t = 0; t < 1200; t++) stepSchool(school, [noShark], bounds, 1 / 60, t / 60);
    for (const fish of school) {
      expect(fish.pos.x).toBeGreaterThan(-60);
      expect(fish.pos.x).toBeLessThan(bounds.width + 60);
      expect(fish.pos.y).toBeGreaterThan(-60);
      expect(fish.pos.y).toBeLessThan(bounds.height + 60);
      expect(Math.hypot(fish.vel.x, fish.vel.y)).toBeLessThanOrEqual(fish.cruise + 1e-6);
    }
  });

  it('flees from a shark and speeds up', () => {
    const school = createSchool(8, bounds, 5);
    const shark = { x: school[0].pos.x - 60, y: school[0].pos.y, active: true };
    const before = Math.hypot(school[0].pos.x - shark.x, school[0].pos.y - shark.y);
    for (let t = 0; t < 60; t++) stepSchool(school, [shark], bounds, 1 / 60, t / 60);
    const after = Math.hypot(school[0].pos.x - shark.x, school[0].pos.y - shark.y);
    expect(after).toBeGreaterThan(before);
    expect(Math.hypot(school[0].vel.x, school[0].vel.y)).toBeGreaterThan(school[0].cruise);
  });

  it('ignores an inactive or far away shark', () => {
    const fish = createSchool(1, bounds, 1)[0];
    expect(fleeVector(fish, noShark)).toEqual({ x: 0, y: 0 });
    expect(fleeVector(fish, { x: fish.pos.x + 5000, y: fish.pos.y, active: true })).toEqual({
      x: 0,
      y: 0,
    });
    const near = fleeVector(fish, { x: fish.pos.x + 10, y: fish.pos.y, active: true });
    expect(near.x).toBeLessThan(0);
  });

  it('honours a custom radius and strength', () => {
    const fish = createSchool(1, bounds, 1)[0];
    const near = { x: fish.pos.x + 150, y: fish.pos.y, active: true, radius: 100, strength: 2 };
    expect(fleeVector(fish, near)).toEqual({ x: 0, y: 0 });
    const inside = { ...near, x: fish.pos.x + 50 };
    expect(fleeVector(fish, inside).x).toBeCloseTo(-1);
  });

  it('derives a clamped heading', () => {
    expect(headingDeg({ x: 10, y: 0 })).toEqual({ angle: 0, flip: false });
    expect(headingDeg({ x: -10, y: 0 })).toEqual({ angle: 0, flip: true });
    expect(headingDeg({ x: 1, y: 100 }).angle).toBe(35);
    expect(headingDeg({ x: -1, y: -100 })).toEqual({ angle: -35, flip: true });
  });
});
