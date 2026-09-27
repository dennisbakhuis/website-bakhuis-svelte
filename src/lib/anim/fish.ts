/**
 * A tiny boids-style school that lives in the hero.
 *
 * Kept free of DOM so the behaviour is testable: the component owns the
 * elements and just copies positions into transforms once per frame.
 */

export type Vec = { x: number; y: number };

export type Fish = {
  id: number;
  pos: Vec;
  vel: Vec;
  size: number;
  cruise: number;
  layer: number;
  phase: number;
  panic: number;
};

export type Predator = {
  x: number;
  y: number;
  active: boolean;
  radius?: number;
  strength?: number;
};

export type Bounds = { width: number; height: number };

export const FISH_RULES = {
  neighbourhood: 140,
  separation: 34,
  cohesion: 0.35,
  alignment: 0.6,
  separate: 1.6,
  wander: 0.5,
  edge: 1.4,
  edgeMargin: 80,
  topMargin: 130,
  fleeRadius: 280,
  flee: 6,
  panicSpeed: 2.6,
  panicDecay: 0.8,
  turnRate: 3.2,
};

/** Small deterministic PRNG so schools are reproducible in tests. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSchool(count: number, bounds: Bounds, seed = 7): Fish[] {
  const rand = mulberry32(seed);
  const cx = bounds.width * (0.3 + rand() * 0.4);
  const cy = bounds.height * (0.35 + rand() * 0.3);
  const heading = rand() * Math.PI * 2;
  return Array.from({ length: count }, (_, id) => {
    const size = 0.7 + rand() * 0.6;
    const cruise = 38 + rand() * 22;
    return {
      id,
      pos: { x: cx + (rand() - 0.5) * 260, y: cy + (rand() - 0.5) * 160 },
      vel: { x: Math.cos(heading) * cruise, y: Math.sin(heading) * cruise },
      size,
      cruise,
      layer: rand(),
      phase: rand() * Math.PI * 2,
      panic: 0,
    };
  });
}

function length(v: Vec): number {
  return Math.hypot(v.x, v.y) || 1e-6;
}

function limit(v: Vec, max: number): Vec {
  const l = length(v);
  return l > max ? { x: (v.x / l) * max, y: (v.y / l) * max } : v;
}

/** Steering that pushes a fish away from the predator, strongest up close. */
export function fleeVector(fish: Fish, predator: Predator, rules = FISH_RULES): Vec {
  if (!predator.active) return { x: 0, y: 0 };
  const radius = predator.radius ?? rules.fleeRadius;
  const dx = fish.pos.x - predator.x;
  const dy = fish.pos.y - predator.y;
  const d = Math.hypot(dx, dy);
  if (d > radius || d === 0) return { x: 0, y: 0 };
  const strength = (1 - d / radius) * (predator.strength ?? rules.flee);
  return { x: (dx / d) * strength, y: (dy / d) * strength };
}

/** Advance the school by `dt` seconds. Mutates the fish in place. */
export function stepSchool(
  school: Fish[],
  predators: Predator[],
  bounds: Bounds,
  dt: number,
  time: number,
  rules = FISH_RULES,
): void {
  const step = Math.min(dt, 0.05);
  const forces = school.map((fish) => {
    let cohesion = { x: 0, y: 0 };
    let align = { x: 0, y: 0 };
    let separate = { x: 0, y: 0 };
    let n = 0;
    for (const other of school) {
      if (other === fish) continue;
      const dx = other.pos.x - fish.pos.x;
      const dy = other.pos.y - fish.pos.y;
      const d = Math.hypot(dx, dy);
      if (d > rules.neighbourhood) continue;
      n++;
      cohesion = { x: cohesion.x + dx, y: cohesion.y + dy };
      align = { x: align.x + other.vel.x, y: align.y + other.vel.y };
      if (d < rules.separation && d > 0) {
        const push = (rules.separation - d) / rules.separation;
        separate = { x: separate.x - (dx / d) * push, y: separate.y - (dy / d) * push };
      }
    }
    let force = { x: 0, y: 0 };
    if (n > 0) {
      force.x += (cohesion.x / n / rules.neighbourhood) * rules.cohesion;
      force.y += (cohesion.y / n / rules.neighbourhood) * rules.cohesion;
      force.x += (align.x / n / fish.cruise - fish.vel.x / fish.cruise) * rules.alignment;
      force.y += (align.y / n / fish.cruise - fish.vel.y / fish.cruise) * rules.alignment;
      force.x += separate.x * rules.separate;
      force.y += separate.y * rules.separate;
    }
    const wobble = time * 0.7 + fish.phase;
    force.x += Math.cos(wobble) * rules.wander * 0.4;
    force.y += Math.sin(wobble * 1.3) * rules.wander;

    const m = rules.edgeMargin;
    const top = rules.topMargin;
    const edge = rules.edge * (1 + fish.panic * 3);
    if (fish.pos.x < m) force.x += ((m - fish.pos.x) / m) * edge;
    if (fish.pos.x > bounds.width - m) force.x -= ((fish.pos.x - bounds.width + m) / m) * edge;
    if (fish.pos.y < top) force.y += ((top - fish.pos.y) / top) * edge;
    if (fish.pos.y > bounds.height - m) force.y -= ((fish.pos.y - bounds.height + m) / m) * edge;

    for (const predator of predators) {
      const flee = fleeVector(fish, predator, rules);
      if (flee.x || flee.y) fish.panic = Math.max(fish.panic, predator.strength ? 0.6 : 1);
      force = { x: force.x + flee.x, y: force.y + flee.y };
    }
    return force;
  });

  school.forEach((fish, i) => {
    const f = forces[i];
    const speedCap = fish.cruise * (1 + fish.panic * (rules.panicSpeed - 1));
    const accel = fish.cruise * rules.turnRate * (1 + fish.panic * 2);
    fish.vel = limit(
      { x: fish.vel.x + f.x * accel * step, y: fish.vel.y + f.y * accel * step },
      speedCap,
    );
    const minSpeed = fish.cruise * 0.6;
    const l = length(fish.vel);
    if (l < minSpeed) fish.vel = { x: (fish.vel.x / l) * minSpeed, y: (fish.vel.y / l) * minSpeed };
    fish.pos = { x: fish.pos.x + fish.vel.x * step, y: fish.pos.y + fish.vel.y * step };
    fish.panic = Math.max(0, fish.panic - rules.panicDecay * step);
  });
}

/**
 * Heading for a right-facing sprite drawn as `scaleX(flip ? -1 : 1) rotate(angle)`.
 * The pitch is clamped so fish never swim nose-down.
 */
export function headingDeg(vel: Vec): { angle: number; flip: boolean } {
  const flip = vel.x < 0;
  const raw = (Math.atan2(vel.y, Math.abs(vel.x)) * 180) / Math.PI;
  return { angle: Math.max(-35, Math.min(35, raw)), flip };
}
