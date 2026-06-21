import * as React from "react";

/**
 * Returns a copy of `value` that only updates after `delayMs` of no further
 * changes (a trailing/idle debounce). Each change to `value` cancels the
 * pending update and restarts the timer, so rapid changes — e.g. keystrokes —
 * collapse into a single update once activity stops.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
