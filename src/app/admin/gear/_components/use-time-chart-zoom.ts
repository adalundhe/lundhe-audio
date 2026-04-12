"use client";

import * as React from "react";

const DAY_MS = 24 * 60 * 60 * 1000;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getDataDomain = (values: number[]) => {
  if (values.length === 0) {
    return null;
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  return [minValue, maxValue] as const;
};

const getPaddedDomain = (dataDomain: readonly [number, number] | null) => {
  if (!dataDomain) {
    return null;
  }

  const [minValue, maxValue] = dataDomain;
  const span = Math.max(maxValue - minValue, DAY_MS);
  const padding = Math.max(span * 0.05, DAY_MS * 7);

  return [minValue - padding, maxValue + padding] as const;
};

const clampDomain = (
  start: number,
  end: number,
  fullDomain: readonly [number, number],
) => {
  const [fullStart, fullEnd] = fullDomain;
  const fullSpan = fullEnd - fullStart;
  const nextSpan = end - start;

  if (nextSpan >= fullSpan) {
    return [fullStart, fullEnd] as const;
  }

  let nextStart = start;
  let nextEnd = end;

  if (nextStart < fullStart) {
    nextEnd += fullStart - nextStart;
    nextStart = fullStart;
  }

  if (nextEnd > fullEnd) {
    nextStart -= nextEnd - fullEnd;
    nextEnd = fullEnd;
  }

  return [nextStart, nextEnd] as const;
};

export function useTimeChartZoom(
  values: number[],
  { minimumVisibleSpanMs }: { minimumVisibleSpanMs?: number } = {},
) {
  const dataDomain = React.useMemo(() => getDataDomain(values), [values]);
  const fullDomain = React.useMemo(() => getPaddedDomain(dataDomain), [dataDomain]);
  const [zoomDomain, setZoomDomain] = React.useState<readonly [number, number] | null>(
    null,
  );
  const touchStateRef = React.useRef<
    | {
        type: "pan";
        startX: number;
        startDomain: readonly [number, number];
      }
    | {
        type: "pinch";
        startDistance: number;
        startDomain: readonly [number, number];
        anchorRatio: number;
      }
    | null
  >(null);

  const minimumSpan = React.useMemo(() => {
    if (!fullDomain) {
      return minimumVisibleSpanMs ?? DAY_MS;
    }

    const fullSpan = fullDomain[1] - fullDomain[0];
    return Math.max(
      minimumVisibleSpanMs ?? fullSpan / 60,
      DAY_MS,
    );
  }, [fullDomain, minimumVisibleSpanMs]);
  const fullDomainStart = fullDomain ? fullDomain[0] : null;
  const fullDomainEnd = fullDomain ? fullDomain[1] : null;

  React.useEffect(() => {
    setZoomDomain(null);
  }, [fullDomainEnd, fullDomainStart, values.length]);

  const resolvedDomain = zoomDomain ?? fullDomain;
  const isZoomed =
    !!zoomDomain &&
    !!fullDomain &&
    (zoomDomain[0] !== fullDomain[0] || zoomDomain[1] !== fullDomain[1]);

  const updateZoomDomain = React.useCallback(
    (nextDomain: readonly [number, number] | null) => {
      if (!fullDomain || !nextDomain) {
        setZoomDomain(null);
        return;
      }

      const [fullStart, fullEnd] = fullDomain;
      const [nextStart, nextEnd] = clampDomain(
        nextDomain[0],
        nextDomain[1],
        fullDomain,
      );

      if (nextStart <= fullStart && nextEnd >= fullEnd) {
        setZoomDomain(null);
        return;
      }

      setZoomDomain([nextStart, nextEnd]);
    },
    [fullDomain],
  );

  const zoomToFactor = React.useCallback(
    (factor: number, anchorRatio = 0.5) => {
      if (!resolvedDomain || !fullDomain) {
        return;
      }

      const [currentStart, currentEnd] = resolvedDomain;
      const currentSpan = currentEnd - currentStart;
      const fullSpan = fullDomain[1] - fullDomain[0];
      const nextSpan = clamp(currentSpan * factor, minimumSpan, fullSpan);
      const anchorValue = currentStart + currentSpan * anchorRatio;
      const nextStart = anchorValue - nextSpan * anchorRatio;
      const nextEnd = nextStart + nextSpan;

      updateZoomDomain([nextStart, nextEnd]);
    },
    [fullDomain, minimumSpan, resolvedDomain, updateZoomDomain],
  );

  const panByRatio = React.useCallback(
    (ratioDelta: number) => {
      if (!zoomDomain || !fullDomain) {
        return;
      }

      const span = zoomDomain[1] - zoomDomain[0];
      const delta = span * ratioDelta;
      updateZoomDomain([zoomDomain[0] + delta, zoomDomain[1] + delta]);
    },
    [fullDomain, updateZoomDomain, zoomDomain],
  );

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) {
      return 0;
    }

    const [leftTouch, rightTouch] = [touches[0]!, touches[1]!];
    return Math.hypot(
      rightTouch.clientX - leftTouch.clientX,
      rightTouch.clientY - leftTouch.clientY,
    );
  };

  const interactionProps = React.useMemo(
    () => ({
      onWheel: (event: React.WheelEvent<HTMLDivElement>) => {
        if (!resolvedDomain || !fullDomain || !event.ctrlKey) {
          return;
        }

        event.preventDefault();
        const bounds = event.currentTarget.getBoundingClientRect();
        const anchorRatio = clamp(
          (event.clientX - bounds.left) / Math.max(bounds.width, 1),
          0,
          1,
        );

        zoomToFactor(event.deltaY < 0 ? 0.4 : 2.5, anchorRatio);
      },
      onTouchStart: (event: React.TouchEvent<HTMLDivElement>) => {
        if (!resolvedDomain) {
          return;
        }

        if (event.touches.length === 2) {
          const distance = getTouchDistance(event.touches);
          const bounds = event.currentTarget.getBoundingClientRect();
          const midpointX =
            (event.touches[0]!.clientX + event.touches[1]!.clientX) / 2;
          touchStateRef.current = {
            type: "pinch",
            startDistance: distance,
            startDomain: resolvedDomain,
            anchorRatio: clamp(
              (midpointX - bounds.left) / Math.max(bounds.width, 1),
              0,
              1,
            ),
          };
          return;
        }

        if (event.touches.length === 1 && isZoomed) {
          touchStateRef.current = {
            type: "pan",
            startX: event.touches[0]!.clientX,
            startDomain: resolvedDomain,
          };
        }
      },
      onTouchMove: (event: React.TouchEvent<HTMLDivElement>) => {
        if (!fullDomain || !touchStateRef.current) {
          return;
        }

        if (
          touchStateRef.current.type === "pinch" &&
          event.touches.length === 2
        ) {
          const distance = getTouchDistance(event.touches);
          if (distance <= 0 || touchStateRef.current.startDistance <= 0) {
            return;
          }

          event.preventDefault();
          const factor = touchStateRef.current.startDistance / distance;
          const startSpan =
            touchStateRef.current.startDomain[1] -
            touchStateRef.current.startDomain[0];
          const fullSpan = fullDomain[1] - fullDomain[0];
          const nextSpan = clamp(startSpan * factor, minimumSpan, fullSpan);
          const anchorValue =
            touchStateRef.current.startDomain[0] +
            startSpan * touchStateRef.current.anchorRatio;
          const nextStart =
            anchorValue - nextSpan * touchStateRef.current.anchorRatio;
          updateZoomDomain([nextStart, nextStart + nextSpan]);
          return;
        }

        if (
          touchStateRef.current.type === "pan" &&
          event.touches.length === 1
        ) {
          const bounds = event.currentTarget.getBoundingClientRect();
          const deltaX =
            touchStateRef.current.startX - event.touches[0]!.clientX;
          const ratioDelta = deltaX / Math.max(bounds.width, 1);
          const startSpan =
            touchStateRef.current.startDomain[1] -
            touchStateRef.current.startDomain[0];

          event.preventDefault();
          updateZoomDomain([
            touchStateRef.current.startDomain[0] + startSpan * ratioDelta,
            touchStateRef.current.startDomain[1] + startSpan * ratioDelta,
          ]);
        }
      },
      onTouchEnd: () => {
        touchStateRef.current = null;
      },
      onTouchCancel: () => {
        touchStateRef.current = null;
      },
      style: {
        touchAction: "pan-y pinch-zoom" as const,
      },
    }),
    [
      fullDomain,
      isZoomed,
      minimumSpan,
      resolvedDomain,
      updateZoomDomain,
      zoomToFactor,
    ],
  );

  return {
    dataDomain,
    domain: resolvedDomain,
    isZoomed,
    canZoomIn:
      !!resolvedDomain && resolvedDomain[1] - resolvedDomain[0] > minimumSpan,
    canZoomOut: isZoomed,
    zoomIn: () => zoomToFactor(0.35),
    zoomOut: () => zoomToFactor(3),
    panLeft: () => panByRatio(-0.75),
    panRight: () => panByRatio(0.75),
    resetZoom: () => setZoomDomain(null),
    setDateRange: (nextStartMs: number | null, nextEndMs: number | null) => {
      if (!fullDomain || !dataDomain) {
        setZoomDomain(null);
        return;
      }

      const start = nextStartMs ?? dataDomain[0];
      const end = nextEndMs ?? dataDomain[1];

      if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
        return;
      }

      updateZoomDomain([start, end]);
    },
    interactionProps,
  };
}
