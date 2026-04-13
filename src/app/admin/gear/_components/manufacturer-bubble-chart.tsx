"use client";

import * as React from "react";
import { Drag, raise } from "@visx/drag";
import { LinearGradient } from "@visx/gradient";

import { cn } from "~/lib/utils";
import {
  manufacturerChartColorVars,
} from "./generate-manufacturer-circles";
import generateManufacturerCircles from "./generate-manufacturer-circles";
import {
  advanceManufacturerBubbleFrame,
  getManufacturerDragBounds,
  initializeManufacturerBubbleState,
  manufacturerBubblePhysicsConstants,
  type ManufacturerBubbleState,
} from "./manufacturer-bubble-physics";
import { type ManufacturerRadialDatum } from "./manufacturer-radial-chart-helpers";

interface ManufacturerBubbleChartProps {
  data: ManufacturerRadialDatum[];
  valueLabel: string;
  quantityLabel: string;
  valueFormatter: (value: number) => string;
  centerLabel: string;
  emptyMessage: string;
  className?: string;
}

type ManufacturerBubbleTooltip = {
  bubble: ManufacturerBubbleState;
  anchorX: number;
  anchorY: number;
};

export const ManufacturerBubbleChart = React.memo(function ManufacturerBubbleChart({
  data,
  valueLabel,
  quantityLabel,
  valueFormatter,
  centerLabel,
  emptyMessage,
  className,
}: ManufacturerBubbleChartProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [draggingItems, setDraggingItems] = React.useState<ManufacturerBubbleState[]>([]);
  const draggingItemsRef = React.useRef<ManufacturerBubbleState[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [tooltip, setTooltip] = React.useState<ManufacturerBubbleTooltip | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState<{ left: number; top: number } | null>(
    null,
  );
  const animationFrameRef = React.useRef<number | null>(null);
  const lastAnimationTimeRef = React.useRef<number | null>(null);
  const draggingIdRef = React.useRef<string | null>(null);
  const movingIdsRef = React.useRef<Set<string>>(new Set());
  const dragVelocityRef = React.useRef<Record<string, { vx: number; vy: number }>>({});
  const dragPointerRef = React.useRef<
    Record<string, { x: number; y: number; time: number }>
  >({});
  const tooltipRef = React.useRef<HTMLDivElement | null>(null);
  const initializedLayoutKeyRef = React.useRef<string | null>(null);
  const chartHeight = 360;

  const syncDraggingItems = React.useCallback(
    (
      updater:
        | ManufacturerBubbleState[]
        | ((
            current: ManufacturerBubbleState[],
          ) => ManufacturerBubbleState[]),
    ) => {
      const next =
        typeof updater === "function"
          ? updater(draggingItemsRef.current)
          : updater;

      draggingItemsRef.current = next;
      setDraggingItems(next);
      return next;
    },
    [],
  );

  const stepPhysics = React.useCallback(
    (time: number) => {
      const previousTime = lastAnimationTimeRef.current ?? time;
      const delta = Math.min(Math.max((time - previousTime) / 16.667, 0.5), 2.5);
      lastAnimationTimeRef.current = time;
      const result = advanceManufacturerBubbleFrame({
        circles: draggingItemsRef.current,
        width: containerWidth,
        height: chartHeight,
        delta,
        draggingId: draggingIdRef.current,
        movingIds: movingIdsRef.current,
      });

      movingIdsRef.current = result.movingIds;
      syncDraggingItems(result.circles);
      const shouldContinue =
        draggingIdRef.current !== null || movingIdsRef.current.size > 0;

      if (shouldContinue) {
        animationFrameRef.current = window.requestAnimationFrame(stepPhysics);
        return;
      }

      animationFrameRef.current = null;
      lastAnimationTimeRef.current = null;
    },
    [chartHeight, containerWidth, syncDraggingItems],
  );

  const ensureAnimation = React.useCallback(() => {
    if (animationFrameRef.current !== null || typeof window === "undefined") {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(stepPhysics);
  }, [stepPhysics]);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }

    const update = () => setContainerWidth(node.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const bubbleLayoutKey = React.useMemo(
    () =>
      JSON.stringify({
        width: containerWidth,
        height: chartHeight,
        data: data.map((entry) => [
          entry.label,
          entry.value,
          entry.totalQuantity,
          entry.uniqueItemCount,
        ]),
      }),
    [chartHeight, containerWidth, data],
  );

  React.useEffect(() => {
    if (containerWidth > 10 && chartHeight > 10) {
      if (initializedLayoutKeyRef.current === bubbleLayoutKey) {
        return;
      }

      initializedLayoutKeyRef.current = bubbleLayoutKey;
      movingIdsRef.current.clear();
      dragVelocityRef.current = {};
      dragPointerRef.current = {};
      draggingIdRef.current = null;
      syncDraggingItems(
        initializeManufacturerBubbleState(
          generateManufacturerCircles({
            data,
            width: containerWidth,
            height: chartHeight,
          }),
        ),
      );
    }
  }, [bubbleLayoutKey, chartHeight, containerWidth, data, syncDraggingItems]);

  React.useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  React.useLayoutEffect(() => {
    if (!tooltip || !tooltipRef.current || !containerRef.current) {
      setTooltipPosition(null);
      return;
    }

    const tooltipNode = tooltipRef.current;
    const containerNode = containerRef.current;
    const tooltipWidth = tooltipNode.offsetWidth;
    const tooltipHeight = tooltipNode.offsetHeight;
    const containerWidth = containerNode.clientWidth;
    const containerHeight = containerNode.clientHeight;
    const gutter = 12;
    const preferredLeft = tooltip.anchorX + 16;
    const preferredTop = tooltip.anchorY - tooltipHeight - 16;
    const left = Math.min(
      Math.max(preferredLeft, gutter),
      Math.max(containerWidth - tooltipWidth - gutter, gutter),
    );
    const top =
      preferredTop >= gutter
        ? preferredTop
        : Math.min(
            tooltip.anchorY + 16,
            Math.max(containerHeight - tooltipHeight - gutter, gutter),
          );

    setTooltipPosition({ left, top });
  }, [tooltip]);

  const activeBubble =
    draggingItems.find((bubble) => bubble.id === activeId) ??
    draggingItems[draggingItems.length - 1] ??
    null;

  const updateTooltip = React.useCallback(
    (
      event:
        | React.MouseEvent<SVGCircleElement>
        | React.TouchEvent<SVGCircleElement>,
      bubble: ManufacturerBubbleState,
    ) => {
      const node = containerRef.current;
      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      const point =
        "touches" in event
          ? event.touches[0] ?? event.changedTouches[0]
          : event;

      if (!point) {
        return;
      }

      setTooltip({
        bubble,
        anchorX: point.clientX - rect.left,
        anchorY: point.clientY - rect.top,
      });
      setActiveId(bubble.id);
    },
    [],
  );

  return (
    <div
      className={cn("flex min-w-0 flex-col gap-3", className)}
      style={manufacturerChartColorVars}
    >
      <div
        ref={containerRef}
        className="relative min-w-0 overflow-hidden rounded-md border bg-background"
        onPointerLeave={() => {
          setActiveId(null);
          setTooltip(null);
          setTooltipPosition(null);
        }}
        style={{ touchAction: "none" }}
      >
        {draggingItems.length === 0 || containerWidth < 10 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <svg
            width="100%"
            height={chartHeight}
            viewBox={`0 0 ${containerWidth} ${chartHeight}`}
            role="img"
            aria-label={centerLabel}
            className="block"
          >
            <LinearGradient id="manufacturer-bubble-stroke" from="hsl(var(--manufacturer-chart-5))" to="hsl(var(--manufacturer-chart-2))" />
            <rect
              fill="hsl(var(--background))"
              width={containerWidth}
              height={chartHeight}
              rx={14}
            />

            {draggingItems.map((bubble) => {
              const gradientId = `manufacturer-gradient-${bubble.label.replace(/[^a-z0-9]+/gi, "-")}`;

              return (
                <LinearGradient
                  key={gradientId}
                  id={gradientId}
                  from={bubble.color}
                  to={bubble.gradientTo}
                  rotate={35}
                />
              );
            })}

            {draggingItems.map((bubble, index) => {
              const gradientId = `manufacturer-gradient-${bubble.label.replace(/[^a-z0-9]+/gi, "-")}`;

              return (
                <Drag
                  key={`drag-${bubble.id}`}
                  width={containerWidth}
                  height={chartHeight}
                  x={bubble.x}
                  y={bubble.y}
                  restrict={getManufacturerDragBounds(
                    bubble,
                    containerWidth,
                    chartHeight,
                  )}
                  onDragStart={() => {
                    syncDraggingItems((current) => {
                      const currentIndex = current.findIndex((item) => item.id === bubble.id);
                      return currentIndex >= 0 ? raise(current, currentIndex) : current;
                    });
                    draggingIdRef.current = bubble.id;
                    movingIdsRef.current.delete(bubble.id);
                    dragVelocityRef.current[bubble.id] = { vx: 0, vy: 0 };
                    dragPointerRef.current[bubble.id] = {
                      x: bubble.x,
                      y: bubble.y,
                      time: performance.now(),
                    };
                    setActiveId(bubble.id);
                    ensureAnimation();
                  }}
                  onDragMove={({ x, y, dx, dy }) => {
                    const nextX = (typeof x === "number" ? x : bubble.x) + dx;
                    const nextY = (typeof y === "number" ? y : bubble.y) + dy;
                    const now = performance.now();
                    const previousPointer =
                      dragPointerRef.current[bubble.id] ?? {
                        x: bubble.x,
                        y: bubble.y,
                        time: now - 16.667,
                      };
                    const elapsedFrames = Math.max(
                      (now - previousPointer.time) / 16.667,
                      1,
                    );

                    dragVelocityRef.current[bubble.id] = {
                      vx: (nextX - previousPointer.x) / elapsedFrames,
                      vy: (nextY - previousPointer.y) / elapsedFrames,
                    };
                    dragPointerRef.current[bubble.id] = {
                      x: nextX,
                      y: nextY,
                      time: now,
                    };
                  }}
                  onDragEnd={({ x, y, dx, dy }) => {
                    const nextX = (typeof x === "number" ? x : bubble.x) + dx;
                    const nextY = (typeof y === "number" ? y : bubble.y) + dy;
                    const nextVelocity =
                      dragVelocityRef.current[bubble.id] ?? { vx: 0, vy: 0 };
                    const vx = nextVelocity.vx * 1.35;
                    const vy = nextVelocity.vy * 1.35;

                    syncDraggingItems((current) =>
                      current.map((item) =>
                        item.id === bubble.id
                          ? {
                              ...item,
                              x: Math.min(
                                Math.max(
                                  nextX,
                                  manufacturerBubblePhysicsConstants.boundaryPadding +
                                    item.radius,
                                ),
                                containerWidth -
                                  manufacturerBubblePhysicsConstants.boundaryPadding -
                                  item.radius,
                              ),
                              y: Math.min(
                                Math.max(
                                  nextY,
                                  manufacturerBubblePhysicsConstants.boundaryPadding +
                                    item.radius,
                                ),
                                chartHeight -
                                  manufacturerBubblePhysicsConstants.boundaryPadding -
                                  item.radius,
                              ),
                              vx,
                              vy,
                            }
                          : item,
                      ),
                    );
                    if (
                      Math.abs(vx) > manufacturerBubblePhysicsConstants.minimumSpeed ||
                      Math.abs(vy) > manufacturerBubblePhysicsConstants.minimumSpeed
                    ) {
                      movingIdsRef.current.add(bubble.id);
                    } else {
                      movingIdsRef.current.delete(bubble.id);
                    }
                    delete dragPointerRef.current[bubble.id];
                    draggingIdRef.current = null;
                    ensureAnimation();
                  }}
                >
                  {(drag) => (
                    <circle
                      cx={drag.x}
                      cy={drag.y}
                      r={drag.isDragging ? bubble.radius + 4 : bubble.radius}
                      fill={drag.isDragging ? "url(#manufacturer-bubble-stroke)" : bubble.color}
                      transform={`translate(${drag.dx}, ${drag.dy})`}
                      fillOpacity={drag.isDragging ? 0.96 : activeBubble?.id === bubble.id ? 0.78 : 0.62}
                      stroke="transparent"
                      strokeWidth={0}
                      className="outline-none transition-[r,fill] duration-150 ease-out focus:outline-none"
                      style={{
                        cursor: drag.isDragging ? "grabbing" : "grab",
                        outline: "none",
                        WebkitTapHighlightColor: "transparent",
                      }}
                      tabIndex={-1}
                      focusable="false"
                      onMouseEnter={(event) => updateTooltip(event, bubble)}
                      onMouseMove={(event) => {
                        updateTooltip(event, bubble);
                        drag.dragMove(event);
                      }}
                      onMouseUp={drag.dragEnd}
                      onMouseDown={drag.dragStart}
                      onTouchStart={(event) => {
                        updateTooltip(event, bubble);
                        drag.dragStart(event);
                      }}
                      onTouchMove={(event) => {
                        updateTooltip(event, bubble);
                        drag.dragMove(event);
                      }}
                      onTouchEnd={drag.dragEnd}
                    />
                  )}
                </Drag>
              );
            })}
          </svg>
        )}

        {tooltip ? (
          <div
            ref={tooltipRef}
            className="pointer-events-none absolute z-10 grid min-w-[12rem] gap-2 rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
            style={{
              left: tooltipPosition?.left ?? tooltip.anchorX,
              top: tooltipPosition?.top ?? tooltip.anchorY,
              opacity: tooltipPosition ? 1 : 0,
            }}
          >
            <div className="font-medium text-foreground">{tooltip.bubble.label}</div>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: tooltip.bubble.color }}
                  />
                  <span>{valueLabel}</span>
                </div>
                <span className="font-medium text-foreground">
                  {valueFormatter(tooltip.bubble.value)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{quantityLabel}</span>
                <span className="font-medium text-foreground">
                  {tooltip.bubble.totalQuantity.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Rows</span>
                <span className="font-medium text-foreground">
                  {tooltip.bubble.uniqueItemCount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

    </div>
  );
});
