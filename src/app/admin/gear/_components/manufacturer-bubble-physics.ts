"use client";

import { type ManufacturerCircle } from "./generate-manufacturer-circles";

export interface ManufacturerBubbleState extends ManufacturerCircle {
  vx: number;
  vy: number;
}

const BOUNDARY_PADDING = 18;
const DRAG_BOUNDARY_PADDING = 12;
const FRICTION = 0.92;
const RESTITUTION = 0.84;
const COLLISION_RESTITUTION = 0.9;
const MINIMUM_SPEED = 0.08;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getSpeed = (circle: Pick<ManufacturerBubbleState, "vx" | "vy">) =>
  Math.hypot(circle.vx, circle.vy);

const getMass = (circle: Pick<ManufacturerCircle, "radius">) =>
  Math.max(circle.radius * circle.radius, 1);

export function initializeManufacturerBubbleState(
  circles: ManufacturerCircle[],
): ManufacturerBubbleState[] {
  return circles.map((circle) => ({
    ...circle,
    vx: 0,
    vy: 0,
  }));
}

export function getManufacturerDragBounds(
  circle: Pick<ManufacturerCircle, "radius">,
  width: number,
  height: number,
) {
  return {
    xMin: DRAG_BOUNDARY_PADDING + circle.radius,
    xMax: width - DRAG_BOUNDARY_PADDING - circle.radius,
    yMin: DRAG_BOUNDARY_PADDING + circle.radius,
    yMax: height - DRAG_BOUNDARY_PADDING - circle.radius,
  };
}

function integrateBubble({
  circle,
  width,
  height,
  delta,
}: {
  circle: ManufacturerBubbleState;
  width: number;
  height: number;
  delta: number;
}) {
  let x = circle.x + circle.vx * delta;
  let y = circle.y + circle.vy * delta;
  let vx = circle.vx * Math.pow(FRICTION, delta);
  let vy = circle.vy * Math.pow(FRICTION, delta);

  const minX = BOUNDARY_PADDING + circle.radius;
  const maxX = width - BOUNDARY_PADDING - circle.radius;
  const minY = BOUNDARY_PADDING + circle.radius;
  const maxY = height - BOUNDARY_PADDING - circle.radius;

  if (x <= minX) {
    x = minX;
    vx = Math.abs(vx) * RESTITUTION;
  } else if (x >= maxX) {
    x = maxX;
    vx = -Math.abs(vx) * RESTITUTION;
  }

  if (y <= minY) {
    y = minY;
    vy = Math.abs(vy) * RESTITUTION;
  } else if (y >= maxY) {
    y = maxY;
    vy = -Math.abs(vy) * RESTITUTION;
  }

  if (Math.abs(vx) < MINIMUM_SPEED) {
    vx = 0;
  }

  if (Math.abs(vy) < MINIMUM_SPEED) {
    vy = 0;
  }

  return {
    ...circle,
    x,
    y,
    vx,
    vy,
  };
}

function buildSpatialHash(circles: ManufacturerBubbleState[], cellSize: number) {
  const grid = new Map<string, number[]>();

  for (const [index, circle] of circles.entries()) {
    const cellX = Math.floor(circle.x / cellSize);
    const cellY = Math.floor(circle.y / cellSize);
    const key = `${cellX}:${cellY}`;
    const bucket = grid.get(key);

    if (bucket) {
      bucket.push(index);
      continue;
    }

    grid.set(key, [index]);
  }

  return grid;
}

function resolveBoundary(circle: ManufacturerBubbleState, width: number, height: number) {
  const minX = BOUNDARY_PADDING + circle.radius;
  const maxX = width - BOUNDARY_PADDING - circle.radius;
  const minY = BOUNDARY_PADDING + circle.radius;
  const maxY = height - BOUNDARY_PADDING - circle.radius;

  if (circle.x <= minX) {
    circle.x = minX;
    circle.vx = Math.abs(circle.vx) * RESTITUTION;
  } else if (circle.x >= maxX) {
    circle.x = maxX;
    circle.vx = -Math.abs(circle.vx) * RESTITUTION;
  }

  if (circle.y <= minY) {
    circle.y = minY;
    circle.vy = Math.abs(circle.vy) * RESTITUTION;
  } else if (circle.y >= maxY) {
    circle.y = maxY;
    circle.vy = -Math.abs(circle.vy) * RESTITUTION;
  }

  if (Math.abs(circle.vx) < MINIMUM_SPEED) {
    circle.vx = 0;
  }

  if (Math.abs(circle.vy) < MINIMUM_SPEED) {
    circle.vy = 0;
  }
}

export function advanceManufacturerBubbleFrame({
  circles,
  width,
  height,
  delta,
  draggingId,
  movingIds,
}: {
  circles: ManufacturerBubbleState[];
  width: number;
  height: number;
  delta: number;
  draggingId: string | null;
  movingIds: Set<string>;
}) {
  const next = circles.map((circle) => {
    if (circle.id === draggingId) {
      return {
        ...circle,
        vx: 0,
        vy: 0,
      };
    }

    if (!movingIds.has(circle.id)) {
      return circle;
    }

    return integrateBubble({
      circle,
      width,
      height,
      delta,
    });
  });

  const maxRadius = Math.max(...next.map((circle) => circle.radius), 1);
  const cellSize = Math.max(maxRadius * 2.2, 24);
  const grid = buildSpatialHash(next, cellSize);
  const processedPairs = new Set<string>();
  const nextMovingIds = new Set<string>();

  for (const circle of next) {
    if (circle.id !== draggingId && getSpeed(circle) > MINIMUM_SPEED) {
      nextMovingIds.add(circle.id);
    }
  }

  for (const [index, circle] of next.entries()) {
    if (circle.id === draggingId || !nextMovingIds.has(circle.id)) {
      continue;
    }

    const minCellX = Math.floor((circle.x - circle.radius) / cellSize);
    const maxCellX = Math.floor((circle.x + circle.radius) / cellSize);
    const minCellY = Math.floor((circle.y - circle.radius) / cellSize);
    const maxCellY = Math.floor((circle.y + circle.radius) / cellSize);

    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
        const bucket = grid.get(`${cellX}:${cellY}`);
        if (!bucket) {
          continue;
        }

        for (const otherIndex of bucket) {
          if (otherIndex === index) {
            continue;
          }

          const other = next[otherIndex];
          if (!other || other.id === draggingId) {
            continue;
          }

          const pairKey =
            index < otherIndex ? `${index}:${otherIndex}` : `${otherIndex}:${index}`;

          if (processedPairs.has(pairKey)) {
            continue;
          }

          processedPairs.add(pairKey);

          const dx = other.x - circle.x;
          const dy = other.y - circle.y;
          const distance = Math.hypot(dx, dy) || 0.0001;
          const minDistance = circle.radius + other.radius;

          if (distance >= minDistance) {
            continue;
          }

          const normalX = dx / distance;
          const normalY = dy / distance;
          const overlap = minDistance - distance;
          const inverseMassA = 1 / getMass(circle);
          const inverseMassB = 1 / getMass(other);
          const inverseMassTotal = inverseMassA + inverseMassB;
          const separationA = overlap * (inverseMassA / inverseMassTotal);
          const separationB = overlap * (inverseMassB / inverseMassTotal);

          circle.x -= normalX * separationA;
          circle.y -= normalY * separationA;
          other.x += normalX * separationB;
          other.y += normalY * separationB;

          const relativeVelocityX = other.vx - circle.vx;
          const relativeVelocityY = other.vy - circle.vy;
          const normalVelocity = relativeVelocityX * normalX + relativeVelocityY * normalY;

          if (normalVelocity < 0) {
            const impulse =
              (-(1 + COLLISION_RESTITUTION) * normalVelocity) / inverseMassTotal;

            circle.vx -= impulse * inverseMassA * normalX;
            circle.vy -= impulse * inverseMassA * normalY;
            other.vx += impulse * inverseMassB * normalX;
            other.vy += impulse * inverseMassB * normalY;
          }

          resolveBoundary(circle, width, height);
          resolveBoundary(other, width, height);

          if (getSpeed(circle) > MINIMUM_SPEED) {
            nextMovingIds.add(circle.id);
          }

          if (getSpeed(other) > MINIMUM_SPEED) {
            nextMovingIds.add(other.id);
          }
        }
      }
    }
  }

  for (const circle of next) {
    if (circle.id === draggingId) {
      continue;
    }

    resolveBoundary(circle, width, height);

    if (getSpeed(circle) > MINIMUM_SPEED) {
      nextMovingIds.add(circle.id);
      continue;
    }

    nextMovingIds.delete(circle.id);
  }

  return {
    circles: next,
    movingIds: nextMovingIds,
  };
}

export const manufacturerBubblePhysicsConstants = {
  boundaryPadding: BOUNDARY_PADDING,
  minimumSpeed: MINIMUM_SPEED,
};
