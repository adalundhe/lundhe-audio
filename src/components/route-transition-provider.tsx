"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { RouteTransitionOverlay } from "./route-transition-overlay";

type RouteTransitionContextValue = {
  startRouteTransition: () => void;
};

const RouteTransitionContext =
  React.createContext<RouteTransitionContextValue | null>(null);

const MIN_OVERLAY_VISIBLE_MS = 220;
const MAX_PENDING_MS = 12000;

export function RouteTransitionProvider({ children }: React.PropsWithChildren) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = React.useState(false);
  const hasMountedRef = React.useRef(false);
  const startedAtRef = React.useRef<number | null>(null);
  const hideTimerRef = React.useRef<number | null>(null);
  const failSafeTimerRef = React.useRef<number | null>(null);

  const clearTimers = React.useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (failSafeTimerRef.current !== null) {
      window.clearTimeout(failSafeTimerRef.current);
      failSafeTimerRef.current = null;
    }
  }, []);

  const stopRouteTransition = React.useCallback(() => {
    if (startedAtRef.current === null) {
      setIsPending(false);
      clearTimers();
      return;
    }

    const elapsedMs = Date.now() - startedAtRef.current;
    const remainingMs = Math.max(0, MIN_OVERLAY_VISIBLE_MS - elapsedMs);

    clearTimers();
    hideTimerRef.current = window.setTimeout(() => {
      setIsPending(false);
      startedAtRef.current = null;
      hideTimerRef.current = null;
    }, remainingMs);
  }, [clearTimers]);

  const startRouteTransition = React.useCallback(() => {
    clearTimers();

    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
      setIsPending(true);
    }

    failSafeTimerRef.current = window.setTimeout(() => {
      setIsPending(false);
      startedAtRef.current = null;
      failSafeTimerRef.current = null;
    }, MAX_PENDING_MS);
  }, [clearTimers]);

  React.useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.target && anchor.target !== "_self") {
        return;
      }

      if (anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href");

      if (!href || href.startsWith("#")) {
        return;
      }

      let url: URL;

      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (
        url.origin !== window.location.origin ||
        url.protocol !== window.location.protocol
      ) {
        return;
      }

      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;

      if (url.pathname === currentPath && url.search === currentSearch) {
        return;
      }

      startRouteTransition();
    };

    const handlePopState = () => {
      startRouteTransition();
    };

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, [clearTimers, startRouteTransition]);

  React.useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (isPending) {
      stopRouteTransition();
    }
  }, [isPending, pathname, searchParams, stopRouteTransition]);

  const contextValue = React.useMemo(
    () => ({
      startRouteTransition,
    }),
    [startRouteTransition],
  );

  return (
    <RouteTransitionContext.Provider value={contextValue}>
      {children}
      {isPending ? <RouteTransitionOverlay /> : null}
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransition() {
  const context = React.useContext(RouteTransitionContext);

  if (!context) {
    throw new Error(
      "useRouteTransition must be used inside RouteTransitionProvider.",
    );
  }

  return context;
}
