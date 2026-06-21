"use client";

import * as React from "react";

import {
  GearPricingSection,
  type GearPricingSectionProps,
} from "./gear-pricing-section";
import {
  GearSelectedTitleHistorySection,
  type GearSelectedTitleHistorySectionProps,
} from "./gear-selected-title-history-section";

export type GearPricingPanelProps = Omit<
  GearPricingSectionProps,
  "historySection"
> &
  GearSelectedTitleHistorySectionProps;

/**
 * Memoized boundary around the Reverb price guide table and the selected-title
 * history charts.
 *
 * Both inner sections are already `React.memo`, but they previously sat as a
 * freshly-built JSX tree inside the gear manager's render — so a new
 * `historySection` element was created on every keystroke, breaking
 * `GearPricingSection`'s memo and re-rendering the price-guide table while the
 * user typed. Wrapping them in a single memoized component keeps the whole
 * subtree stable: as long as the props (all derived from search state, not the
 * form fields) are unchanged, typing in the editor never re-renders it.
 */
export const GearPricingPanel = React.memo(function GearPricingPanel(
  props: GearPricingPanelProps,
) {
  return (
    <GearPricingSection
      {...props}
      historySection={<GearSelectedTitleHistorySection {...props} />}
    />
  );
});
