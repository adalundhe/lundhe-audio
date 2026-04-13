"use client";

import * as React from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { type Table as ReactTable } from "@tanstack/react-table";
import { Loader2, Trash2 } from "lucide-react";

import {
  FilterTabPanel,
  SimpleFilterOption,
  SortableHeader,
  type AdminDataTableColumnDef,
} from "~/app/admin/_components/admin-data-table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { type ChartConfig } from "~/components/ui/chart";
import { Checkbox } from "~/components/ui/checkbox";
import { DropdownMenuCheckboxItem } from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import type {
  GearItem,
  ModelHistoryPoint,
  PriceGuideMatch,
} from "./gear-manager-types";
import type { ChartFilterOption } from "./chart-filter-dropdown";
import {
  abbreviateCurrency,
  buildDefaultReverbPricingQuery,
  buildSelectedHistoryChartConfig,
  calculateAverage,
  chartColorTokens,
  emptyWishlistDetailsForm,
  emptyWishlistForm,
  formatCurrency,
  getHistoryFilterKey,
  getHistoryFilterLabel,
  getModelHistorySeriesKey,
  getModelHistorySeriesLabel,
  getVisibleHistoryCategoryLabels,
  groupOptionsAlphabetically,
  handleNumberInputWheel,
  mergeUniqueOptions,
  NEW_WISHLIST_ROW_ID,
  normalizeCurrency,
  normalizeOptionValue,
  normalizeQuantity,
  normalizeText,
  normalizeWishlistItem,
  parseNumber,
  sortChartFilterOptionsAlphabetically,
  sortChartFilterOptionsByYear,
  wishlistDraftItemFromState,
  wishlistDetailsFormFromItem,
  wishlistFormFromItem,
} from "./wishlist-gear-helpers";
import { buildManufacturerRadialData } from "./manufacturer-radial-chart-helpers";
import {
  type WishlistGearDetailsFormState,
  type WishlistGearFormState,
  type WishlistGearItem,
  type WishlistStatus,
  wishlistStatusMetadata,
} from "./wishlist-gear-manager-types";
import {
  type WishlistSpendByGroupAreaChart,
  type WishlistSpendPoint,
  type WishlistSummary,
  type WishlistValuePoint,
} from "./wishlist-gear-summary-types";

type HistoryFilterFacet =
  | "source"
  | "title"
  | "model"
  | "manufacturer"
  | "year"
  | "condition"
  | "category";

const resetWishlistFilters = (table: ReactTable<WishlistGearItem>) => {
  table.getColumn("group")?.setFilterValue("");
  table.getColumn("type")?.setFilterValue("");
  table.getColumn("manufacturer")?.setFilterValue("");
  table.getColumn("status")?.setFilterValue("");
};

const clearWishlistTableFilters = (table: ReactTable<WishlistGearItem>) => {
  resetWishlistFilters(table);
  table.getColumn("search")?.setFilterValue("");
};

const hasActiveWishlistFilters = (table: ReactTable<WishlistGearItem>) =>
  ((table.getColumn("search")?.getFilterValue() ?? "") as string).trim() !== "" ||
  ((table.getColumn("group")?.getFilterValue() ?? "") as string) !== "" ||
  ((table.getColumn("type")?.getFilterValue() ?? "") as string) !== "" ||
  ((table.getColumn("manufacturer")?.getFilterValue() ?? "") as string) !== "" ||
  ((table.getColumn("status")?.getFilterValue() ?? "") as string) !== "";

const wishlistFormsEqual = (
  left: WishlistGearFormState,
  right: WishlistGearFormState,
) =>
  left.id === right.id &&
  left.name === right.name &&
  left.description === right.description &&
  left.type === right.type &&
  left.group === right.group &&
  left.price === right.price &&
  left.quantity === right.quantity &&
  left.manufacturer === right.manufacturer;

const wishlistValueChartConfig = {
  targetValue: {
    label: "Target Value",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const wishlistSpendTimelineChartConfig = {
  itemValue: {
    label: "Target Value",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const isFullyCataloguedWishlistItem = (item: WishlistGearItem) => {
  const quantity = normalizeQuantity(item.quantity);
  const targetPrice = normalizeCurrency(item.targetPrice);

  return (
    item.name.trim() !== "" &&
    item.description.trim() !== "" &&
    item.type.trim() !== "" &&
    item.group.trim() !== "" &&
    item.manufacturer.trim() !== "" &&
    Number.isFinite(quantity) &&
    targetPrice > 0
  );
};

export function useWishlistGearManager({
  initialWishlist,
  taxonomySeedItems,
}: {
  initialWishlist?: WishlistGearItem[];
  taxonomySeedItems: GearItem[];
}) {
  const router = useRouter();
  const [items, setItems] = React.useState<WishlistGearItem[]>(() =>
    (initialWishlist ?? []).map(normalizeWishlistItem),
  );
  const [form, setForm] = React.useState<WishlistGearFormState>(emptyWishlistForm);
  const [formExternalVersion, setFormExternalVersion] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);
  const [detailsForm, setDetailsForm] =
    React.useState<WishlistGearDetailsFormState>(emptyWishlistDetailsForm);
  const [detailsError, setDetailsError] = React.useState<string | null>(null);
  const [pricingError, setPricingError] = React.useState<string | null>(null);
  const [priceGuideMatches, setPriceGuideMatches] = React.useState<
    PriceGuideMatch[]
  >([]);
  const [selectedPriceGuideIds, setSelectedPriceGuideIds] = React.useState<
    string[]
  >([]);
  const [priceGuideTableResetKey, setPriceGuideTableResetKey] = React.useState(0);
  const [modelHistoryCache, setModelHistoryCache] = React.useState<
    Record<string, ModelHistoryPoint[]>
  >({});
  const [pendingModelHistoryKeys, setPendingModelHistoryKeys] = React.useState<
    string[]
  >([]);
  const [modelHistoryError, setModelHistoryError] = React.useState<string | null>(
    null,
  );
  const [visibleModelHistoryTitleKeys, setVisibleModelHistoryTitleKeys] =
    React.useState<string[] | null>(null);
  const [visibleModelHistoryModelKeys, setVisibleModelHistoryModelKeys] =
    React.useState<string[] | null>(null);
  const [visibleModelHistoryManufacturerKeys, setVisibleModelHistoryManufacturerKeys] =
    React.useState<string[] | null>(null);
  const [visibleModelHistoryYearKeys, setVisibleModelHistoryYearKeys] =
    React.useState<string[] | null>(null);
  const [visibleModelHistoryConditionKeys, setVisibleModelHistoryConditionKeys] =
    React.useState<string[] | null>(null);
  const [visibleModelHistoryCategoryKeys, setVisibleModelHistoryCategoryKeys] =
    React.useState<string[] | null>(null);
  const [visibleModelHistorySources, setVisibleModelHistorySources] =
    React.useState<Array<"Listing" | "Price Guide"> | null>(null);
  const [customGearTypes, setCustomGearTypes] = React.useState<string[]>([]);
  const [customGearGroups, setCustomGearGroups] = React.useState<string[]>([]);
  const [customManufacturers, setCustomManufacturers] = React.useState<string[]>(
    [],
  );
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(
    null,
  );
  const latestPricingRequestRef = React.useRef("");
  const lastCompletedPricingQueryRef = React.useRef("");

  React.useEffect(() => {
    setItems((initialWishlist ?? []).map(normalizeWishlistItem));
  }, [initialWishlist]);

  const replaceForm = React.useCallback((nextForm: WishlistGearFormState) => {
    setForm(nextForm);
    setFormExternalVersion((current) => current + 1);
  }, []);

  const publishForm = React.useCallback((nextForm: WishlistGearFormState) => {
    setForm((current) => (wishlistFormsEqual(current, nextForm) ? current : nextForm));
  }, []);

  const isEditing = form.id !== null;
  const isCreatingInline = selectedItemId === NEW_WISHLIST_ROW_ID && form.id === null;
  const parsedPrice = parseNumber(form.price);
  const parsedQuantity = parseNumber(form.quantity);
  const isPriceValid =
    parsedPrice !== null && form.price.trim() !== "" && parsedPrice >= 0;
  const isQuantityValid =
    parsedQuantity !== null &&
    form.quantity.trim() !== "" &&
    parsedQuantity >= 0 &&
    Number.isInteger(parsedQuantity);
  const isFormComplete =
    form.name.trim() !== "" &&
    form.manufacturer.trim() !== "" &&
    form.type.trim() !== "" &&
    form.group.trim() !== "" &&
    form.description.trim() !== "" &&
    isPriceValid &&
    isQuantityValid;
  const selectedItem = React.useMemo(
    () => (selectedItemId ? items.find((item) => item.id === selectedItemId) ?? null : null),
    [items, selectedItemId],
  );
  const isDetailsDirty = React.useMemo(() => {
    if (isCreatingInline) {
      return (
        emptyWishlistDetailsForm.status !== detailsForm.status ||
        emptyWishlistDetailsForm.notes !== detailsForm.notes
      );
    }

    if (!selectedItem) {
      return false;
    }

    const currentDetails = wishlistDetailsFormFromItem(selectedItem);
    return (
      currentDetails.status !== detailsForm.status ||
      currentDetails.notes !== detailsForm.notes
    );
  }, [detailsForm, selectedItem]);
  const isEditorDirty = React.useMemo(() => {
    if (isCreatingInline) {
      return !wishlistFormsEqual(form, emptyWishlistForm);
    }

    if (!selectedItem || form.id !== selectedItem.id) {
      return false;
    }

    const currentForm = wishlistFormFromItem(selectedItem);
    return (
      currentForm.name !== form.name ||
      currentForm.description !== form.description ||
      currentForm.type !== form.type ||
      currentForm.group !== form.group ||
      currentForm.price !== form.price ||
      currentForm.quantity !== form.quantity ||
      currentForm.manufacturer !== form.manufacturer
    );
  }, [form, isCreatingInline, selectedItem]);

  const draftItem = React.useMemo(
    () =>
      wishlistDraftItemFromState({
        form,
        details: detailsForm,
      }),
    [detailsForm, form],
  );
  const displayedItems = React.useMemo(
    () => (isCreatingInline ? [...items, draftItem] : items),
    [draftItem, isCreatingInline, items],
  );

  const pricingQuery = React.useMemo(
    () =>
      buildDefaultReverbPricingQuery({
        manufacturer: form.manufacturer,
        name: form.name,
      }).trim(),
    [form.manufacturer, form.name],
  );
  const deferredPricingQuery = React.useDeferredValue(pricingQuery);

  const selectedPriceGuideMatches = React.useMemo(
    () =>
      priceGuideMatches.filter(
        (match) =>
          selectedPriceGuideIds.includes(match.id) && match.priceValue !== null,
      ),
    [priceGuideMatches, selectedPriceGuideIds],
  );
  const selectedAveragePrice = React.useMemo(
    () =>
      calculateAverage(
        selectedPriceGuideMatches
          .map((match) => match.priceValue)
          .filter((value): value is number => value !== null),
      ),
    [selectedPriceGuideMatches],
  );

  const selectedTitleQueries = React.useMemo(() => {
    if (!deferredPricingQuery) {
      return [];
    }

    return [
      {
        key: normalizeOptionValue(deferredPricingQuery),
        title: deferredPricingQuery,
        label: deferredPricingQuery,
      },
    ];
  }, [deferredPricingQuery]);
  const wishlistSummary = React.useMemo<WishlistSummary>(() => {
    const manufacturers = new Set<string>();
    const groups = new Map<
      string,
      {
        label: string;
        uniqueItemCount: number;
        fullyCataloguedCount: number;
        cataloguedPercent: number;
        totalQuantity: number;
        totalValue: number;
        types: Map<string, { label: string; totalQuantity: number; totalValue: number }>;
      }
    >();

    let totalQuantity = 0;
    let totalValue = 0;
    let fullyCataloguedCount = 0;

    for (const item of items) {
      const quantity = normalizeQuantity(item.quantity);
      const targetPrice = normalizeCurrency(item.targetPrice);
      const manufacturer = item.manufacturer.trim();
      const groupLabel = item.group.trim() || "Uncategorized";
      const typeLabel = item.type.trim() || "Unspecified";
      const groupKey = normalizeOptionValue(groupLabel);
      const typeKey = normalizeOptionValue(typeLabel);
      const isFullyCatalogued = isFullyCataloguedWishlistItem(item);

      totalQuantity += quantity;
      totalValue += targetPrice * quantity;

      if (isFullyCatalogued) {
        fullyCataloguedCount += 1;
      }

      if (manufacturer) {
        manufacturers.add(normalizeOptionValue(manufacturer));
      }

      const groupEntry =
        groups.get(groupKey) ?? {
          label: groupLabel,
          uniqueItemCount: 0,
          fullyCataloguedCount: 0,
          cataloguedPercent: 0,
          totalQuantity: 0,
          totalValue: 0,
          types: new Map<
            string,
            { label: string; totalQuantity: number; totalValue: number }
          >(),
        };

      groupEntry.uniqueItemCount += 1;
      if (isFullyCatalogued) {
        groupEntry.fullyCataloguedCount += 1;
      }
      groupEntry.totalQuantity += quantity;
      groupEntry.totalValue += targetPrice * quantity;

      const typeEntry =
        groupEntry.types.get(typeKey) ?? {
          label: typeLabel,
          totalQuantity: 0,
          totalValue: 0,
        };

      typeEntry.totalQuantity += quantity;
      typeEntry.totalValue += targetPrice * quantity;
      groupEntry.types.set(typeKey, typeEntry);
      groups.set(groupKey, groupEntry);
    }

    return {
      totalQuantity,
      uniqueItemCount: items.length,
      manufacturerCount: manufacturers.size,
      totalValue: Number(totalValue.toFixed(2)),
      fullyCataloguedCount,
      cataloguedPercent:
        items.length === 0
          ? 0
          : Number(((fullyCataloguedCount / items.length) * 100).toFixed(1)),
      groups: [...groups.values()]
        .map((group) => ({
          ...group,
          cataloguedPercent:
            group.uniqueItemCount === 0
              ? 0
              : Number(
                  ((group.fullyCataloguedCount / group.uniqueItemCount) * 100).toFixed(1),
                ),
          totalValue: Number(group.totalValue.toFixed(2)),
          types: [...group.types.values()]
            .sort((left, right) => left.label.localeCompare(right.label))
            .map((type) => ({
              ...type,
              totalValue: Number(type.totalValue.toFixed(2)),
            })),
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    };
  }, [items]);
  const wishlistValueDistributionChartData = React.useMemo<WishlistValuePoint[]>(
    () =>
      wishlistSummary.groups
        .map((group) => ({
          group: group.label,
          groupLabel:
            group.label.length > 16 ? `${group.label.slice(0, 15)}…` : group.label,
          targetValue: group.totalValue,
        }))
        .sort((left, right) => right.targetValue - left.targetValue),
    [wishlistSummary.groups],
  );
  const wishlistManufacturerRadialChartData = React.useMemo(
    () =>
      buildManufacturerRadialData({
        items,
        getManufacturer: (item) => item.manufacturer,
        getValue: (item) =>
          normalizeCurrency(item.targetPrice) * normalizeQuantity(item.quantity),
        getQuantity: (item) => normalizeQuantity(item.quantity),
        normalizeManufacturer: normalizeOptionValue,
      }),
    [items],
  );
  const wishlistSpendOverTimeChartData = React.useMemo<WishlistSpendPoint[]>(
    () =>
      items
        .map((item) => {
          const createdAt = new Date(item.created_timestamp);
          const createdAtMs = createdAt.getTime();
          const quantity = normalizeQuantity(item.quantity);
          const itemValue = Number(
            (normalizeCurrency(item.targetPrice) * quantity).toFixed(2),
          );

          return {
            name: item.name,
            quantity,
            itemValue,
            createdAtMs,
            createdAtTooltipLabel: Number.isFinite(createdAtMs)
              ? format(createdAt, "MMM d, yyyy h:mm a")
              : "Unknown date",
          };
        })
        .filter((item) => Number.isFinite(item.createdAtMs))
        .sort((left, right) => left.createdAtMs - right.createdAtMs),
    [items],
  );
  const wishlistSpendByGroupAreaChart =
    React.useMemo<WishlistSpendByGroupAreaChart>(() => {
      const sortedGroupLabels = [
        ...new Set(items.map((item) => item.group.trim()).filter(Boolean)),
      ].sort((left, right) => left.localeCompare(right));

      const series = sortedGroupLabels.map((groupLabel, index) => ({
        groupLabel,
        key: `groupSeries${index + 1}`,
        color: chartColorTokens[index % chartColorTokens.length]!,
      }));

      const rowsByMonth = new Map<
        string,
        {
          monthKey: string;
          monthLabel: string;
          monthMs: number;
          totalValue: number;
        } & Record<string, number | string>
      >();

      for (const item of items) {
        const groupLabel = item.group.trim() || "Uncategorized";
        const seriesEntry = series.find((entry) => entry.groupLabel === groupLabel);
        if (!seriesEntry) {
          continue;
        }

        const createdAt = new Date(item.created_timestamp);
        const monthMs = new Date(
          createdAt.getFullYear(),
          createdAt.getMonth(),
          1,
        ).getTime();

        if (!Number.isFinite(monthMs)) {
          continue;
        }

        const monthKey = format(new Date(monthMs), "yyyy-MM");
        const currentRow =
          rowsByMonth.get(monthKey) ?? {
            monthKey,
            monthLabel: format(new Date(monthMs), "MMM yyyy"),
            monthMs,
            totalValue: 0,
          };
        const targetValue = Number(
          (
            normalizeCurrency(item.targetPrice) * normalizeQuantity(item.quantity)
          ).toFixed(2),
        );

        currentRow[seriesEntry.key] =
          Number(currentRow[seriesEntry.key] ?? 0) + targetValue;
        currentRow.totalValue += targetValue;

        rowsByMonth.set(monthKey, currentRow);
      }

      const data = [...rowsByMonth.values()]
        .sort((left, right) => left.monthMs - right.monthMs)
        .map((row) => {
          const normalizedRow: Record<string, number | string> = {
            monthKey: row.monthKey,
            monthLabel: row.monthLabel,
            monthMs: row.monthMs,
            totalValue: Number(row.totalValue.toFixed(2)),
          };

          for (const entry of series) {
            normalizedRow[entry.key] = Number(Number(row[entry.key] ?? 0).toFixed(2));
          }

          return normalizedRow;
        });

      const config = series.reduce<ChartConfig>(
        (current, entry) => ({
          ...current,
          [entry.key]: {
            label: entry.groupLabel,
            color: entry.color,
          },
        }),
        {},
      );

      return { data, series, config };
    }, [items]);

  const matchesHistoryChartFilters = React.useCallback(
    (
      point: ModelHistoryPoint,
      ignoredFacet?: HistoryFilterFacet,
      ignoreEmptySelections = false,
    ) => {
      const pointCategoryKeys = getVisibleHistoryCategoryLabels(point).map((category) =>
        getHistoryFilterKey(category),
      );
      const sourceSelectionInactive =
        visibleModelHistorySources === null ||
        (ignoreEmptySelections && visibleModelHistorySources.length === 0);
      const titleSelectionInactive =
        visibleModelHistoryTitleKeys === null ||
        (ignoreEmptySelections && visibleModelHistoryTitleKeys.length === 0);
      const modelSelectionInactive =
        visibleModelHistoryModelKeys === null ||
        (ignoreEmptySelections && visibleModelHistoryModelKeys.length === 0);
      const manufacturerSelectionInactive =
        visibleModelHistoryManufacturerKeys === null ||
        (ignoreEmptySelections &&
          visibleModelHistoryManufacturerKeys.length === 0);
      const yearSelectionInactive =
        visibleModelHistoryYearKeys === null ||
        (ignoreEmptySelections && visibleModelHistoryYearKeys.length === 0);
      const conditionSelectionInactive =
        visibleModelHistoryConditionKeys === null ||
        (ignoreEmptySelections && visibleModelHistoryConditionKeys.length === 0);
      const categorySelectionInactive =
        visibleModelHistoryCategoryKeys === null ||
        (ignoreEmptySelections && visibleModelHistoryCategoryKeys.length === 0);

      return (
        (ignoredFacet === "source" ||
          sourceSelectionInactive ||
          visibleModelHistorySources.includes(point.source)) &&
        (ignoredFacet === "title" ||
          titleSelectionInactive ||
          visibleModelHistoryTitleKeys.includes(getHistoryFilterKey(point.title))) &&
        (ignoredFacet === "model" ||
          modelSelectionInactive ||
          visibleModelHistoryModelKeys.includes(getModelHistorySeriesKey(point))) &&
        (ignoredFacet === "manufacturer" ||
          manufacturerSelectionInactive ||
          visibleModelHistoryManufacturerKeys.includes(
            getHistoryFilterKey(point.manufacturer),
          )) &&
        (ignoredFacet === "year" ||
          yearSelectionInactive ||
          visibleModelHistoryYearKeys.includes(getHistoryFilterKey(point.year))) &&
        (ignoredFacet === "condition" ||
          conditionSelectionInactive ||
          visibleModelHistoryConditionKeys.includes(
            getHistoryFilterKey(point.condition),
          )) &&
        (ignoredFacet === "category" ||
          categorySelectionInactive ||
          pointCategoryKeys.some((key) => visibleModelHistoryCategoryKeys.includes(key)))
      );
    },
    [
      visibleModelHistoryCategoryKeys,
      visibleModelHistoryConditionKeys,
      visibleModelHistoryManufacturerKeys,
      visibleModelHistoryModelKeys,
      visibleModelHistorySources,
      visibleModelHistoryTitleKeys,
      visibleModelHistoryYearKeys,
    ],
  );

  const getHistoryPointsForFacetOptions = React.useCallback(
    (facet: HistoryFilterFacet, points: ModelHistoryPoint[]) =>
      points.filter((point) => matchesHistoryChartFilters(point, facet, true)),
    [matchesHistoryChartFilters],
  );

  const upsertWishlistMutation = api.adminGear.upsertWishlist.useMutation({
    onMutate: () => setError(null),
    onSuccess: (saved) => {
      const normalizedSaved = normalizeWishlistItem(saved);
      setItems((current) => {
        const next = current.filter((item) => item.id !== saved.id);
        next.push(normalizedSaved);
        next.sort((a, b) => a.name.localeCompare(b.name));
        return next;
      });
      setSelectedItemId(saved.id);
      replaceForm(wishlistFormFromItem(normalizedSaved));
      setDetailsForm(wishlistDetailsFormFromItem(normalizedSaved));
      React.startTransition(() => {
        router.refresh();
      });
    },
    onError: (err) => setError(err.message),
  });
  const updateWishlistDetailsMutation = api.adminGear.updateWishlistDetails.useMutation({
    onMutate: () => setDetailsError(null),
    onSuccess: (saved) => {
      const normalizedSaved = normalizeWishlistItem(saved);
      setItems((current) =>
        current.map((item) =>
          item.id === normalizedSaved.id ? { ...item, ...normalizedSaved } : item,
        ),
      );
      setDetailsForm(wishlistDetailsFormFromItem(normalizedSaved));
      React.startTransition(() => {
        router.refresh();
      });
    },
    onError: (err) => setDetailsError(err.message),
  });
  const updateWishlistStatusMutation = api.adminGear.updateWishlistStatus.useMutation({
    onMutate: () => setDetailsError(null),
    onSuccess: (saved) => {
      const normalizedSaved = normalizeWishlistItem(saved);
      setItems((current) =>
        current.map((item) =>
          item.id === normalizedSaved.id ? { ...item, ...normalizedSaved } : item,
        ),
      );
      setDetailsForm((current) => ({
        ...current,
        status: normalizedSaved.status,
      }));
      React.startTransition(() => {
        router.refresh();
      });
    },
    onError: (err) => setDetailsError(err.message),
  });
  const deleteWishlistMutation = api.adminGear.deleteWishlist.useMutation({
    onMutate: ({ id }) => {
      setError(null);
      setPendingDeleteId(id);
    },
    onSuccess: ({ id }) => {
      setItems((current) => current.filter((item) => item.id !== id));
      if (selectedItemId === id) {
        setSelectedItemId(null);
        replaceForm(emptyWishlistForm);
        setDetailsForm(emptyWishlistDetailsForm);
        setDetailsError(null);
      }
      React.startTransition(() => {
        router.refresh();
      });
    },
    onError: (err) => setError(err.message),
    onSettled: () => setPendingDeleteId(null),
  });
  const promoteWishlistMutation = api.adminGear.promoteWishlist.useMutation({
    onMutate: () => setDetailsError(null),
    onSuccess: ({ wishlistId }) => {
      setItems((current) => current.filter((item) => item.id !== wishlistId));
      if (selectedItemId === wishlistId) {
        setSelectedItemId(null);
        replaceForm(emptyWishlistForm);
        setDetailsForm(emptyWishlistDetailsForm);
      }
      React.startTransition(() => {
        router.refresh();
      });
    },
    onError: (err) => setDetailsError(err.message),
  });
  const priceGuideSearchMutation = api.adminGear.searchPriceGuide.useMutation({
    onMutate: ({ query }) => {
      latestPricingRequestRef.current = query;
      setPricingError(null);
      setPriceGuideMatches([]);
      setSelectedPriceGuideIds([]);
      setPriceGuideTableResetKey((current) => current + 1);
    },
    onSuccess: (matches, variables) => {
      if (variables.query !== latestPricingRequestRef.current) {
        return;
      }

      lastCompletedPricingQueryRef.current = variables.query;
      setPriceGuideMatches(matches);
    },
    onError: (err, variables) => {
      if (variables.query !== latestPricingRequestRef.current) {
        return;
      }

      lastCompletedPricingQueryRef.current = "";
      setPricingError(err.message);
    },
  });
  const modelHistorySearchMutation = api.adminGear.searchModelHistory.useMutation();

  React.useEffect(() => {
    if (!deferredPricingQuery) {
      if (priceGuideMatches.length > 0 || selectedPriceGuideIds.length > 0 || pricingError) {
        setPricingError(null);
        setPriceGuideMatches([]);
        setSelectedPriceGuideIds([]);
        setPriceGuideTableResetKey((current) => current + 1);
      }

      latestPricingRequestRef.current = "";
      lastCompletedPricingQueryRef.current = "";
      return;
    }

    if (
      deferredPricingQuery === latestPricingRequestRef.current ||
      deferredPricingQuery === lastCompletedPricingQueryRef.current
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (
        deferredPricingQuery !== latestPricingRequestRef.current &&
        deferredPricingQuery !== lastCompletedPricingQueryRef.current
      ) {
        priceGuideSearchMutation.mutate({ query: deferredPricingQuery });
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [
    priceGuideMatches.length,
    priceGuideSearchMutation,
    pricingError,
    deferredPricingQuery,
    selectedPriceGuideIds.length,
  ]);

  React.useEffect(() => {
    const missingTitles = selectedTitleQueries.filter(
      ({ key }) =>
        modelHistoryCache[key] === undefined &&
        !pendingModelHistoryKeys.includes(key),
    );

    if (missingTitles.length === 0) {
      return;
    }

    setModelHistoryError(null);

    for (const titleEntry of missingTitles) {
      setPendingModelHistoryKeys((current) =>
        current.includes(titleEntry.key) ? current : [...current, titleEntry.key],
      );

      void modelHistorySearchMutation
        .mutateAsync({ title: titleEntry.title })
        .then((result) => {
          setModelHistoryCache((current) => ({
            ...current,
            [titleEntry.key]: result.matches,
          }));
        })
        .catch((err: { message?: string }) => {
          setModelHistoryError(
            err.message ?? "Unable to fetch Reverb model history right now.",
          );
        })
        .finally(() => {
          setPendingModelHistoryKeys((current) =>
            current.filter((key) => key !== titleEntry.key),
          );
        });
    }
  }, [
    modelHistoryCache,
    modelHistorySearchMutation,
    pendingModelHistoryKeys,
    selectedTitleQueries,
  ]);

  const selectedModelHistoryChartData = React.useMemo(
    () =>
      selectedTitleQueries
        .flatMap(({ key }) => modelHistoryCache[key] ?? [])
        .filter((point) => point.occurredAtMs !== null && point.priceValue !== null)
        .map((point) => ({
          ...point,
          occurredAtLabel:
            point.occurredAtMs === null
              ? "Unknown"
              : new Date(point.occurredAtMs).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
        }))
        .sort((left, right) => (left.occurredAtMs ?? 0) - (right.occurredAtMs ?? 0)),
    [modelHistoryCache, selectedTitleQueries],
  );

  const buildFacetOptions = React.useCallback(
    (facet: HistoryFilterFacet): ChartFilterOption[] => {
      const points = getHistoryPointsForFacetOptions(facet, selectedModelHistoryChartData);

      if (facet === "source") {
        return points.reduce<ChartFilterOption[]>((options, point) => {
          if (!options.some((option) => option.key === point.source)) {
            options.push({ key: point.source, label: point.source });
          }
          return options;
        }, []);
      }

      if (facet === "title") {
        return points.reduce<ChartFilterOption[]>((options, point) => {
          const key = getHistoryFilterKey(point.title);
          if (!options.some((option) => option.key === key)) {
            options.push({ key, label: getHistoryFilterLabel(point.title) });
          }
          return options;
        }, []);
      }

      if (facet === "model") {
        return points.reduce<ChartFilterOption[]>((options, point) => {
          const key = getModelHistorySeriesKey(point);
          if (!options.some((option) => option.key === key)) {
            options.push({ key, label: getModelHistorySeriesLabel(point) });
          }
          return options;
        }, []);
      }

      if (facet === "manufacturer") {
        return points.reduce<ChartFilterOption[]>((options, point) => {
          const key = getHistoryFilterKey(point.manufacturer);
          if (!options.some((option) => option.key === key)) {
            options.push({
              key,
              label: getHistoryFilterLabel(point.manufacturer),
            });
          }
          return options;
        }, []);
      }

      if (facet === "year") {
        return points.reduce<ChartFilterOption[]>((options, point) => {
          const key = getHistoryFilterKey(point.year);
          if (!options.some((option) => option.key === key)) {
            options.push({ key, label: getHistoryFilterLabel(point.year) });
          }
          return options;
        }, []);
      }

      if (facet === "condition") {
        return points.reduce<ChartFilterOption[]>((options, point) => {
          const key = getHistoryFilterKey(point.condition);
          if (!options.some((option) => option.key === key)) {
            options.push({
              key,
              label: getHistoryFilterLabel(point.condition),
            });
          }
          return options;
        }, []);
      }

      return points.reduce<ChartFilterOption[]>((options, point) => {
        for (const category of getVisibleHistoryCategoryLabels(point)) {
          const key = getHistoryFilterKey(category);
          if (!options.some((option) => option.key === key)) {
            options.push({ key, label: getHistoryFilterLabel(category) });
          }
        }
        return options;
      }, []);
    },
    [getHistoryPointsForFacetOptions, selectedModelHistoryChartData],
  );

  const availableModelHistorySourceOptions = React.useMemo(
    () => sortChartFilterOptionsAlphabetically(buildFacetOptions("source")),
    [buildFacetOptions],
  );
  const availableModelHistoryTitleOptions = React.useMemo(
    () => sortChartFilterOptionsAlphabetically(buildFacetOptions("title")),
    [buildFacetOptions],
  );
  const availableModelHistorySeriesOptions = React.useMemo(
    () => sortChartFilterOptionsAlphabetically(buildFacetOptions("model")),
    [buildFacetOptions],
  );
  const availableModelHistoryManufacturerOptions = React.useMemo(
    () => sortChartFilterOptionsAlphabetically(buildFacetOptions("manufacturer")),
    [buildFacetOptions],
  );
  const availableModelHistoryYearOptions = React.useMemo(
    () => sortChartFilterOptionsByYear(buildFacetOptions("year")),
    [buildFacetOptions],
  );
  const availableModelHistoryConditionOptions = React.useMemo(
    () => sortChartFilterOptionsAlphabetically(buildFacetOptions("condition")),
    [buildFacetOptions],
  );
  const availableModelHistoryCategoryOptions = React.useMemo(
    () => sortChartFilterOptionsAlphabetically(buildFacetOptions("category")),
    [buildFacetOptions],
  );

  const reconcileHistoryFilterSelection = React.useCallback(
    (current: string[] | null, nextKeys: string[]) => {
      if (current === null) {
        return null;
      }

      if (current.length === 0) {
        return current;
      }

      if (nextKeys.length === 0) {
        return null;
      }

      const preservedKeys = current.filter((key) => nextKeys.includes(key));

      if (preservedKeys.length === 0 || preservedKeys.length === nextKeys.length) {
        return null;
      }

      if (
        preservedKeys.length === current.length &&
        preservedKeys.every((key, index) => key === current[index])
      ) {
        return current;
      }

      return preservedKeys;
    },
    [],
  );

  React.useEffect(() => {
    setVisibleModelHistorySources((current) =>
      reconcileHistoryFilterSelection(
        current,
        availableModelHistorySourceOptions.map((entry) => entry.key),
      ) as Array<"Listing" | "Price Guide"> | null,
    );
  }, [availableModelHistorySourceOptions, reconcileHistoryFilterSelection]);

  React.useEffect(() => {
    setVisibleModelHistoryTitleKeys((current) =>
      reconcileHistoryFilterSelection(
        current,
        availableModelHistoryTitleOptions.map((entry) => entry.key),
      ),
    );
  }, [availableModelHistoryTitleOptions, reconcileHistoryFilterSelection]);

  React.useEffect(() => {
    setVisibleModelHistoryModelKeys((current) =>
      reconcileHistoryFilterSelection(
        current,
        availableModelHistorySeriesOptions.map((entry) => entry.key),
      ),
    );
  }, [availableModelHistorySeriesOptions, reconcileHistoryFilterSelection]);

  React.useEffect(() => {
    setVisibleModelHistoryManufacturerKeys((current) =>
      reconcileHistoryFilterSelection(
        current,
        availableModelHistoryManufacturerOptions.map((entry) => entry.key),
      ),
    );
  }, [availableModelHistoryManufacturerOptions, reconcileHistoryFilterSelection]);

  React.useEffect(() => {
    setVisibleModelHistoryYearKeys((current) =>
      reconcileHistoryFilterSelection(
        current,
        availableModelHistoryYearOptions.map((entry) => entry.key),
      ),
    );
  }, [availableModelHistoryYearOptions, reconcileHistoryFilterSelection]);

  React.useEffect(() => {
    setVisibleModelHistoryConditionKeys((current) =>
      reconcileHistoryFilterSelection(
        current,
        availableModelHistoryConditionOptions.map((entry) => entry.key),
      ),
    );
  }, [availableModelHistoryConditionOptions, reconcileHistoryFilterSelection]);

  React.useEffect(() => {
    setVisibleModelHistoryCategoryKeys((current) =>
      reconcileHistoryFilterSelection(
        current,
        availableModelHistoryCategoryOptions.map((entry) => entry.key),
      ),
    );
  }, [availableModelHistoryCategoryOptions, reconcileHistoryFilterSelection]);

  const filteredSelectedModelHistoryPoints = React.useMemo(
    () =>
      selectedModelHistoryChartData.filter((point) =>
        matchesHistoryChartFilters(point),
      ),
    [matchesHistoryChartFilters, selectedModelHistoryChartData],
  );
  const filteredSelectedModelHistoryCount = filteredSelectedModelHistoryPoints.length;
  const selectedModelHistorySeries = React.useMemo(() => {
    const groupedSeries = new Map<
      string,
      {
        key: string;
        label: string;
        color: string;
        data: typeof filteredSelectedModelHistoryPoints;
      }
    >();

    for (const point of filteredSelectedModelHistoryPoints) {
      const label = getModelHistorySeriesLabel(point);
      const normalizedLabel = getModelHistorySeriesKey(point);
      const existing = groupedSeries.get(normalizedLabel);

      if (existing) {
        existing.data.push(point);
        continue;
      }

      groupedSeries.set(normalizedLabel, {
        key: `wishlistModelSeries${groupedSeries.size + 1}`,
        label,
        color: chartColorTokens[groupedSeries.size % chartColorTokens.length]!,
        data: [point],
      });
    }

    return [...groupedSeries.values()].map((series) => ({
      ...series,
      data: [...series.data].sort(
        (left, right) => (left.occurredAtMs ?? 0) - (right.occurredAtMs ?? 0),
      ),
    }));
  }, [filteredSelectedModelHistoryPoints]);
  const selectedModelHistoryChartConfig = React.useMemo(
    () => buildSelectedHistoryChartConfig(selectedModelHistorySeries),
    [selectedModelHistorySeries],
  );

  const resolvedVisibleModelHistorySources =
    visibleModelHistorySources ??
    availableModelHistorySourceOptions.map((entry) => entry.key as "Listing" | "Price Guide");
  const resolvedVisibleModelHistoryTitleKeys =
    visibleModelHistoryTitleKeys ??
    availableModelHistoryTitleOptions.map((entry) => entry.key);
  const resolvedVisibleModelHistoryModelKeys =
    visibleModelHistoryModelKeys ??
    availableModelHistorySeriesOptions.map((entry) => entry.key);
  const resolvedVisibleModelHistoryManufacturerKeys =
    visibleModelHistoryManufacturerKeys ??
    availableModelHistoryManufacturerOptions.map((entry) => entry.key);
  const resolvedVisibleModelHistoryYearKeys =
    visibleModelHistoryYearKeys ??
    availableModelHistoryYearOptions.map((entry) => entry.key);
  const resolvedVisibleModelHistoryConditionKeys =
    visibleModelHistoryConditionKeys ??
    availableModelHistoryConditionOptions.map((entry) => entry.key);
  const resolvedVisibleModelHistoryCategoryKeys =
    visibleModelHistoryCategoryKeys ??
    availableModelHistoryCategoryOptions.map((entry) => entry.key);

  const taxonomySeed = React.useMemo(
    () => [...taxonomySeedItems, ...items],
    [items, taxonomySeedItems],
  );
  const gearTypes = React.useMemo(
    () => [...new Set(taxonomySeed.map((item) => item.type.trim()).filter(Boolean))].sort(),
    [taxonomySeed],
  );
  const gearGroups = React.useMemo(
    () => [...new Set(taxonomySeed.map((item) => item.group.trim()).filter(Boolean))].sort(),
    [taxonomySeed],
  );
  const manufacturers = React.useMemo(
    () =>
      [...new Set(taxonomySeed.map((item) => item.manufacturer.trim()).filter(Boolean))].sort(),
    [taxonomySeed],
  );
  const manufacturerGroups = React.useMemo(
    () => groupOptionsAlphabetically(manufacturers),
    [manufacturers],
  );
  const availableGearTypes = React.useMemo(
    () => mergeUniqueOptions(gearTypes, customGearTypes),
    [customGearTypes, gearTypes],
  );
  const availableGearGroups = React.useMemo(
    () => mergeUniqueOptions(gearGroups, customGearGroups),
    [customGearGroups, gearGroups],
  );
  const availableManufacturers = React.useMemo(
    () => mergeUniqueOptions(manufacturers, customManufacturers),
    [customManufacturers, manufacturers],
  );
  const availableManufacturerGroups = React.useMemo(
    () => groupOptionsAlphabetically(availableManufacturers),
    [availableManufacturers],
  );
  const wishlistByGroup = React.useMemo(
    () =>
      items.reduce((grouped, item) => {
        const group = item.group.trim() || "Uncategorized";
        grouped[group] ??= [];
        grouped[group].push(item);
        return grouped;
      }, {} as Record<string, WishlistGearItem[]>),
    [items],
  );
  const availableStatuses = React.useMemo(
    () => ["researching", "watching", "ready-to-buy"] as WishlistStatus[],
    [],
  );
  const availablePriceGuideManufacturers = React.useMemo(
    () =>
      [...new Set(priceGuideMatches.map((match) => match.manufacturer ?? "—"))]
        .filter((value) => value !== "—")
        .sort((left, right) => left.localeCompare(right)),
    [priceGuideMatches],
  );
  const availablePriceGuideModels = React.useMemo(
    () =>
      [...new Set(priceGuideMatches.map((match) => match.model))]
        .filter((value) => value !== "—")
        .sort((left, right) => left.localeCompare(right)),
    [priceGuideMatches],
  );
  const availablePriceGuideYears = React.useMemo(
    () =>
      [...new Set(priceGuideMatches.map((match) => match.year))]
        .filter((value) => value !== "—")
        .sort((left, right) => left.localeCompare(right)),
    [priceGuideMatches],
  );
  const availablePriceGuideConditions = React.useMemo(
    () =>
      [...new Set(priceGuideMatches.map((match) => match.condition))]
        .filter((value) => value !== "—")
        .sort((left, right) => left.localeCompare(right)),
    [priceGuideMatches],
  );
  const availablePriceGuideCategories = React.useMemo(
    () =>
      [...new Set(priceGuideMatches.map((match) => match.categories))]
        .filter((value) => value !== "—")
        .sort((left, right) => left.localeCompare(right)),
    [priceGuideMatches],
  );

  const saveWishlistForm = async (nextForm = form) => {
    setError(null);

    const nextParsedPrice = parseNumber(nextForm.price);
    const nextParsedQuantity = parseNumber(nextForm.quantity);
    const nextIsPriceValid =
      nextParsedPrice !== null &&
      nextForm.price.trim() !== "" &&
      nextParsedPrice >= 0;
    const nextIsQuantityValid =
      nextParsedQuantity !== null &&
      nextForm.quantity.trim() !== "" &&
      nextParsedQuantity >= 0 &&
      Number.isInteger(nextParsedQuantity);
    const nextIsFormComplete =
      nextForm.name.trim() !== "" &&
      nextForm.manufacturer.trim() !== "" &&
      nextForm.type.trim() !== "" &&
      nextForm.group.trim() !== "" &&
      nextForm.description.trim() !== "" &&
      nextIsPriceValid &&
      nextIsQuantityValid;

    if (!nextIsFormComplete || nextParsedPrice === null || nextParsedQuantity === null) {
      setError("Fill out all required wishlist fields before saving.");
      return null;
    }

    return upsertWishlistMutation.mutateAsync({
      id: nextForm.id ?? undefined,
      name: nextForm.name.trim(),
      description: nextForm.description.trim(),
      type: nextForm.type.trim(),
      group: nextForm.group.trim(),
      targetPrice: nextParsedPrice,
      quantity: Math.floor(nextParsedQuantity),
      manufacturer: nextForm.manufacturer.trim(),
    });
  };

  const handleSubmit = React.useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveWishlistForm();
  }, [saveWishlistForm]);

  const handleSubmitForm = React.useCallback(
    async (nextForm: WishlistGearFormState) => {
      publishForm(nextForm);
      return saveWishlistForm(nextForm);
    },
    [publishForm, saveWishlistForm],
  );

  const handleSelectRow = React.useCallback((item: WishlistGearItem) => {
    if (selectedItemId === item.id) {
      setSelectedItemId(null);
      replaceForm(emptyWishlistForm);
      setDetailsForm(emptyWishlistDetailsForm);
      setDetailsError(null);
      return;
    }

    if (item.id === NEW_WISHLIST_ROW_ID) {
      setSelectedItemId(NEW_WISHLIST_ROW_ID);
      setError(null);
      setDetailsError(null);
      return;
    }

    replaceForm(wishlistFormFromItem(item));
    setDetailsForm(wishlistDetailsFormFromItem(item));
    setSelectedItemId(item.id);
    setError(null);
    setDetailsError(null);
  }, [replaceForm, selectedItemId]);

  const handleClearForm = React.useCallback(() => {
    replaceForm(emptyWishlistForm);
    setError(null);
    setSelectedItemId(null);
    setDetailsForm(emptyWishlistDetailsForm);
    setDetailsError(null);
  }, [replaceForm]);

  const openNewRow = React.useCallback(() => {
    replaceForm(emptyWishlistForm);
    setDetailsForm(emptyWishlistDetailsForm);
    setSelectedItemId(NEW_WISHLIST_ROW_ID);
    setError(null);
    setDetailsError(null);
  }, [replaceForm]);

  const handleSaveDetails = async () => {
    let targetId = selectedItemId;

    if (isCreatingInline || (isEditing && isEditorDirty)) {
      const saved = await saveWishlistForm();
      if (!saved) {
        return;
      }
      targetId = saved.id;
    }

    if (!isDetailsDirty || !targetId || targetId === NEW_WISHLIST_ROW_ID) {
      return;
    }

    await updateWishlistDetailsMutation.mutateAsync({
      id: targetId,
      status: detailsForm.status,
      notes: detailsForm.notes,
    });
  };

  const handlePromote = async () => {
    let targetId = selectedItemId;

    if (isCreatingInline || (isEditing && isEditorDirty)) {
      const saved = await saveWishlistForm();
      if (!saved) {
        return;
      }
      targetId = saved.id;
    }

    if (targetId && isDetailsDirty) {
      await updateWishlistDetailsMutation.mutateAsync({
        id: targetId,
        status: detailsForm.status,
        notes: detailsForm.notes,
      });
    }

    if (!targetId) {
      return;
    }

    await promoteWishlistMutation.mutateAsync({ id: targetId });
  };

  const resetInlineEditState = React.useCallback(() => {
    if (isCreatingInline) {
      handleClearForm();
      return;
    }

    if (!selectedItem) {
      return;
    }

    replaceForm(wishlistFormFromItem(selectedItem));
    setDetailsForm(wishlistDetailsFormFromItem(selectedItem));
    setError(null);
    setDetailsError(null);
  }, [handleClearForm, isCreatingInline, replaceForm, selectedItem]);

  const handleApplyAveragePrice = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (selectedAveragePrice === null) {
      return;
    }

    replaceForm({
      ...form,
      price: selectedAveragePrice.toFixed(2),
    });
  };

  const handleStatusChange = React.useCallback(
    (status: WishlistStatus) => {
      if (detailsForm.status === status) {
        return;
      }

      const previousStatus = detailsForm.status;
      setDetailsError(null);
      setDetailsForm((current) => ({
        ...current,
        status,
      }));

      if (!selectedItemId) {
        return;
      }

      if (selectedItemId === NEW_WISHLIST_ROW_ID) {
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === selectedItemId ? { ...item, status } : item,
        ),
      );

      updateWishlistStatusMutation.mutate(
        {
          id: selectedItemId,
          status,
        },
        {
          onError: (err) => {
            setDetailsError(err.message);
            setDetailsForm((current) => ({
              ...current,
              status: previousStatus,
            }));
            setItems((current) =>
              current.map((item) =>
                item.id === selectedItemId
                  ? { ...item, status: previousStatus }
                  : item,
              ),
            );
          },
        },
      );
    },
    [detailsForm.status, selectedItemId, updateWishlistStatusMutation],
  );

  const handleTogglePriceGuide = React.useCallback((matchId: string, checked: boolean) => {
    setSelectedPriceGuideIds((current) => {
      if (checked) {
        return current.includes(matchId) ? current : [...current, matchId];
      }

      return current.filter((id) => id !== matchId);
    });
  }, []);

  const columns = React.useMemo<AdminDataTableColumnDef<WishlistGearItem>[]>(
    () => [
      {
        id: "status",
        accessorKey: "status",
        enableSorting: false,
        enableHiding: false,
        size: 48,
        minSize: 48,
        maxSize: 48,
        header: () => <div className="w-full" />,
        cell: ({ row }) => {
          const status =
            selectedItemId === row.original.id ? detailsForm.status : row.original.status;
          const metadata = wishlistStatusMetadata[status];

          return (
            <div className="flex items-center justify-center">
              <span
                aria-label={metadata.label}
                className={cn(
                  "h-2.5 w-2.5 rounded-full animate-pulse",
                  metadata.dotClassName,
                )}
                title={metadata.label}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "name",
        size: 280,
        minSize: 220,
        maxSize: 420,
        header: ({ column }) => <SortableHeader column={column} label="Name" />,
        cell: ({ row }) => (
          <div className="truncate text-sm font-medium">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "description",
        size: 420,
        minSize: 300,
        maxSize: 640,
        enableSorting: false,
        header: () => (
          <div className="flex h-full w-full items-center justify-start gap-3 text-left text-muted-foreground">
            Description
          </div>
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">
            {row.original.description}
          </div>
        ),
      },
      {
        accessorKey: "manufacturer",
        filterFn: "equalsString",
        size: 180,
        minSize: 140,
        maxSize: 260,
        header: ({ column }) => (
          <SortableHeader column={column} label="Manufacturer" />
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm">{row.original.manufacturer}</div>
        ),
      },
      {
        accessorKey: "type",
        filterFn: "equalsString",
        size: 150,
        minSize: 110,
        maxSize: 220,
        header: ({ column }) => <SortableHeader column={column} label="Type" />,
        cell: ({ row, table }) => {
          const typeValue = row.original.type;
          const groupValue = row.original.group;
          const typeFilter = (table.getColumn("type")?.getFilterValue() ?? "") as string;
          const groupFilter = (table.getColumn("group")?.getFilterValue() ?? "") as string;

          return (
            <Button
              type="button"
              className={cn(
                "h-fit p-0 hover:text-cyan-500",
                (typeFilter === typeValue || groupFilter === groupValue) &&
                  "text-cyan-500",
              )}
              onClick={(event) => {
                event.stopPropagation();

                if (typeFilter === typeValue) {
                  clearWishlistTableFilters(table);
                  return;
                }

                table.setColumnFilters([{ id: "type", value: typeValue }]);
              }}
            >
              <div className="truncate text-sm lowercase">{typeValue}</div>
            </Button>
          );
        },
      },
      {
        accessorKey: "group",
        filterFn: "equalsString",
        size: 160,
        minSize: 120,
        maxSize: 220,
        header: ({ column }) => <SortableHeader column={column} label="Group" />,
        cell: ({ row, table }) => {
          const groupValue = row.original.group;
          const groupFilter = (table.getColumn("group")?.getFilterValue() ?? "") as string;

          return (
            <Button
              type="button"
              className={cn(
                "h-fit p-0 hover:text-cyan-500",
                groupFilter === groupValue && "text-cyan-500",
              )}
              onClick={(event) => {
                event.stopPropagation();

                if (groupFilter === groupValue) {
                  clearWishlistTableFilters(table);
                  return;
                }

                table.setColumnFilters([{ id: "group", value: groupValue }]);
              }}
            >
              <div className="truncate text-sm">{groupValue}</div>
            </Button>
          );
        },
      },
      {
        accessorKey: "targetPrice",
        size: 140,
        minSize: 120,
        maxSize: 180,
        header: ({ column }) => (
          <SortableHeader column={column} label="Target" align="end" />
        ),
        cell: ({ row }) => (
          <div className="text-right text-sm">
            {formatCurrency(normalizeCurrency(row.original.targetPrice))}
          </div>
        ),
      },
      {
        accessorKey: "quantity",
        size: 90,
        minSize: 70,
        maxSize: 120,
        header: ({ column }) => (
          <SortableHeader column={column} label="Qty" align="end" />
        ),
        cell: ({ row }) => (
          <div className="text-right text-sm">{row.original.quantity}</div>
        ),
      },
      {
        id: "search",
        accessorFn: (row) =>
          [
            row.status,
            row.name,
            row.description,
            row.manufacturer,
            row.type,
            row.group,
            row.notes,
            String(row.targetPrice),
          ].join(" "),
        filterFn: "includesString",
        enableHiding: true,
      },
      {
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        size: 70,
        minSize: 70,
        maxSize: 70,
        header: () => <div className="w-fit" />,
        cell: ({ row }) => {
          const item = row.original;
          const isDeleting = pendingDeleteId === item.id;

          if (item.id === NEW_WISHLIST_ROW_ID) {
            return <div className="flex justify-end" />;
          }

          return (
            <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isDeleting}
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete "${item.name}" from the wishlist? This cannot be undone.`,
                    )
                  ) {
                    deleteWishlistMutation.mutate({ id: item.id });
                  }
                }}
                aria-label={`Delete ${item.name}`}
              >
                {isDeleting ? (
                  <Loader2 className="!h-[16px] !w-[16px] animate-spin" />
                ) : (
                  <Trash2 className="!h-[16px] !w-[16px] text-destructive" />
                )}
              </Button>
            </div>
          );
        },
      },
    ],
    [deleteWishlistMutation, detailsForm.status, pendingDeleteId, selectedItemId],
  );

  const priceGuideColumns = React.useMemo<
    AdminDataTableColumnDef<PriceGuideMatch>[]
  >(
    () => [
      {
        id: "selected",
        accessorFn: (row) => (selectedPriceGuideIds.includes(row.id) ? 1 : 0),
        enableSorting: false,
        enableHiding: false,
        size: 64,
        minSize: 64,
        maxSize: 64,
        header: () => (
          <div className="flex h-full w-full items-center justify-center text-left text-muted-foreground">
            Use
          </div>
        ),
        cell: ({ row }) => {
          const match = row.original;
          const isSelected = selectedPriceGuideIds.includes(match.id);

          return (
            <div
              className="flex items-center justify-center"
              onClick={(event) => event.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  handleTogglePriceGuide(match.id, checked === true)
                }
                aria-label={`Use ${match.title} in price calculation`}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        enableSorting: true,
        enableHiding: true,
        size: 320,
        minSize: 240,
        maxSize: 520,
        header: ({ column }) => <SortableHeader column={column} label="Title" />,
        cell: ({ row }) => (
          <div className="truncate text-sm font-medium">{row.original.title}</div>
        ),
      },
      {
        accessorKey: "manufacturer",
        enableSorting: true,
        enableHiding: true,
        filterFn: "equalsString",
        size: 220,
        minSize: 160,
        maxSize: 320,
        header: ({ column }) => (
          <SortableHeader column={column} label="Manufacturer" />
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm">{row.original.manufacturer}</div>
        ),
      },
      {
        accessorKey: "model",
        enableSorting: true,
        enableHiding: true,
        filterFn: "equalsString",
        size: 220,
        minSize: 160,
        maxSize: 320,
        header: ({ column }) => <SortableHeader column={column} label="Model" />,
        cell: ({ row }) => (
          <div className="truncate text-sm">{row.original.model}</div>
        ),
      },
      {
        accessorKey: "year",
        enableSorting: true,
        enableHiding: true,
        filterFn: "equalsString",
        size: 150,
        minSize: 120,
        maxSize: 220,
        header: ({ column }) => <SortableHeader column={column} label="Year" />,
        cell: ({ row }) => (
          <div className="truncate text-sm">{row.original.year}</div>
        ),
      },
      {
        accessorKey: "categories",
        enableSorting: true,
        enableHiding: true,
        filterFn: "equalsString",
        size: 360,
        minSize: 260,
        maxSize: 560,
        header: ({ column }) => (
          <SortableHeader column={column} label="Categories" />
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">
            {row.original.categories}
          </div>
        ),
      },
      {
        accessorKey: "condition",
        enableSorting: true,
        enableHiding: true,
        filterFn: "equalsString",
        size: 180,
        minSize: 140,
        maxSize: 260,
        header: ({ column }) => (
          <SortableHeader column={column} label="Condition" />
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm">{row.original.condition}</div>
        ),
      },
      {
        accessorKey: "priceValue",
        sortingFn: "basic",
        enableSorting: true,
        enableHiding: true,
        size: 140,
        minSize: 120,
        maxSize: 180,
        header: ({ column }) => (
          <SortableHeader column={column} label="Price" align="end" />
        ),
        cell: ({ row }) => (
          <div className="text-right text-sm">
            {row.original.priceValue !== null
              ? formatCurrency(row.original.priceValue)
              : "—"}
          </div>
        ),
      },
      {
        id: "search",
        accessorFn: (row) =>
          [
            row.title,
            row.manufacturer ?? "",
            row.model,
            row.year,
            row.condition,
            row.categories,
            row.source,
          ].join(" "),
        filterFn: "includesString",
        enableHiding: true,
      },
    ],
    [handleTogglePriceGuide, selectedPriceGuideIds],
  );

  const filterTabs = React.useMemo(
    () => [
      {
        value: "type",
        label: "Type",
        render: (table: ReactTable<WishlistGearItem>) => (
          <FilterTabPanel>
            <DropdownMenuCheckboxItem
              side="right"
              className={cn(
                "h-[2.5em] w-full border-none pl-0 capitalize outline-none hover:bg-white hover:underline dark:hover:bg-black",
                !hasActiveWishlistFilters(table) &&
                  "text-cyan-500 hover:text-cyan-500 dark:hover:text-cyan-500",
              )}
              checked={!hasActiveWishlistFilters(table)}
              onCheckedChange={() => clearWishlistTableFilters(table)}
            >
              <Button type="button" className="p-0">
                All
              </Button>
            </DropdownMenuCheckboxItem>
            <Separator />
            <Accordion type="single" collapsible className="flex w-full flex-col">
              {Object.keys(wishlistByGroup)
                .sort((left, right) => left.localeCompare(right))
                .map((group) => {
                  const groupItems = wishlistByGroup[group] ?? [];
                  const groupedTypes = [
                    ...new Map(
                      groupItems.map((item) => [
                        normalizeOptionValue(item.type),
                        item.type,
                      ]),
                    ).values(),
                  ].sort((left, right) => left.localeCompare(right));

                  return (
                    <AccordionItem key={`wishlist-group-${group}`} value={group}>
                      <AccordionTrigger
                        chevronSide="none"
                        className="h-[2.5em] w-full justify-between md:hover:underline hover:no-underline"
                      >
                        {group}
                      </AccordionTrigger>
                      <AccordionContent className="p-0">
                        <Separator className="mb-2 w-1/4" />
                        <DropdownMenuCheckboxItem
                          side="right"
                          className="w-full border-none pl-0 capitalize outline-none hover:bg-white hover:underline dark:hover:bg-black"
                          checked={
                            (table.getColumn("group")?.getFilterValue() ?? "") === group &&
                            (table.getColumn("type")?.getFilterValue() ?? "") === ""
                          }
                          onCheckedChange={() => {
                            const typeFilter =
                              (table.getColumn("type")?.getFilterValue() ?? "") as string;
                            const groupFilter =
                              (table.getColumn("group")?.getFilterValue() ?? "") as string;

                            if (groupFilter === group && typeFilter === "") {
                              clearWishlistTableFilters(table);
                            } else {
                              resetWishlistFilters(table);
                              table.setColumnFilters([{ id: "group", value: group }]);
                            }
                          }}
                        >
                          <Button type="button" className="h-[1.5em] p-0">
                            {`all ${group}`}
                          </Button>
                        </DropdownMenuCheckboxItem>
                        {groupedTypes.map((type) => (
                          <DropdownMenuCheckboxItem
                            side="right"
                            key={`${group}-${type}`}
                            className="w-full border-none pl-0 capitalize outline-none hover:bg-white hover:underline dark:hover:bg-black"
                            checked={
                              (table.getColumn("group")?.getFilterValue() ?? "") ===
                                group &&
                              (table.getColumn("type")?.getFilterValue() ?? "") === type
                            }
                            onCheckedChange={() => {
                              const typeFilter =
                                (table.getColumn("type")?.getFilterValue() ?? "") as string;
                              const groupFilter =
                                (table.getColumn("group")?.getFilterValue() ?? "") as string;

                              if (groupFilter === group && typeFilter === type) {
                                clearWishlistTableFilters(table);
                              } else {
                                resetWishlistFilters(table);
                                table.setColumnFilters([
                                  { id: "group", value: group },
                                  { id: "type", value: type },
                                ]);
                              }
                            }}
                          >
                            <Button type="button" className="h-[1.5em] p-0">
                              {type}
                            </Button>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
            </Accordion>
          </FilterTabPanel>
        ),
      },
      {
        value: "brand",
        label: "Brand",
        render: (table: ReactTable<WishlistGearItem>) => (
          <FilterTabPanel>
            <DropdownMenuCheckboxItem
              side="right"
              className={cn(
                "h-[2.5em] w-full border-none pl-0 capitalize outline-none hover:bg-white hover:underline dark:hover:bg-black",
                !hasActiveWishlistFilters(table) &&
                  "text-cyan-500 hover:text-cyan-500 dark:hover:text-cyan-500",
              )}
              checked={!hasActiveWishlistFilters(table)}
              onCheckedChange={() => clearWishlistTableFilters(table)}
            >
              <Button type="button" className="p-0">
                All
              </Button>
            </DropdownMenuCheckboxItem>
            <Separator />
            <Accordion type="single" collapsible className="flex w-full flex-col">
              {Object.keys(manufacturerGroups)
                .sort((left, right) => left.localeCompare(right))
                .map((group) => (
                  <AccordionItem key={`wishlist-manufacturer-${group}`} value={group}>
                    <AccordionTrigger
                      chevronSide="none"
                      className="h-[2.5em] w-full justify-between md:hover:underline hover:no-underline"
                    >
                      {group}
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                      <Separator className="mb-2 w-1/4" />
                      {manufacturerGroups[group]?.map((manufacturer) => (
                        <DropdownMenuCheckboxItem
                          side="right"
                          key={manufacturer}
                          className="w-full border-none pl-0 capitalize outline-none hover:bg-white hover:underline dark:hover:bg-black"
                          checked={
                            (table.getColumn("manufacturer")?.getFilterValue() ?? "") ===
                            manufacturer
                          }
                          onCheckedChange={() => {
                            const currentManufacturer =
                              (table.getColumn("manufacturer")?.getFilterValue() ??
                                "") as string;

                            if (currentManufacturer === manufacturer) {
                              clearWishlistTableFilters(table);
                            } else {
                              resetWishlistFilters(table);
                              table.setColumnFilters([
                                { id: "manufacturer", value: manufacturer },
                              ]);
                            }
                          }}
                        >
                          <Button type="button" className="h-[1.5em] p-0">
                            {manufacturer}
                          </Button>
                        </DropdownMenuCheckboxItem>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </FilterTabPanel>
        ),
      },
      {
        value: "status",
        label: "Status",
        render: (table: ReactTable<WishlistGearItem>) => (
          <FilterTabPanel>
            <SimpleFilterOption
              active={(table.getColumn("status")?.getFilterValue() ?? "") === ""}
              label="All"
              onToggle={() => table.getColumn("status")?.setFilterValue("")}
            />
            <Separator />
            {availableStatuses.map((status) => (
              <SimpleFilterOption
                key={status}
                active={(table.getColumn("status")?.getFilterValue() ?? "") === status}
                label={wishlistStatusMetadata[status].label}
                onToggle={() =>
                  table.getColumn("status")?.setFilterValue(
                    (table.getColumn("status")?.getFilterValue() ?? "") === status
                      ? ""
                      : status,
                  )
                }
              />
            ))}
          </FilterTabPanel>
        ),
      },
    ],
    [availableStatuses, manufacturerGroups, wishlistByGroup],
  );

  const priceGuideFilterTabs = React.useMemo(
    () => [
      {
        value: "manufacturer",
        label: "Manufacturer",
        render: (table: ReactTable<PriceGuideMatch>) => (
          <FilterTabPanel>
            <SimpleFilterOption
              active={(table.getColumn("manufacturer")?.getFilterValue() ?? "") === ""}
              label="All"
              onToggle={() => table.getColumn("manufacturer")?.setFilterValue("")}
            />
            <Separator />
            {availablePriceGuideManufacturers.map((manufacturer) => (
              <SimpleFilterOption
                key={manufacturer}
                active={
                  (table.getColumn("manufacturer")?.getFilterValue() ?? "") ===
                  manufacturer
                }
                label={manufacturer}
                onToggle={() =>
                  table.getColumn("manufacturer")?.setFilterValue(
                    (table.getColumn("manufacturer")?.getFilterValue() ?? "") ===
                      manufacturer
                      ? ""
                      : manufacturer,
                  )
                }
              />
            ))}
          </FilterTabPanel>
        ),
      },
      {
        value: "model",
        label: "Model",
        render: (table: ReactTable<PriceGuideMatch>) => (
          <FilterTabPanel>
            <SimpleFilterOption
              active={(table.getColumn("model")?.getFilterValue() ?? "") === ""}
              label="All"
              onToggle={() => table.getColumn("model")?.setFilterValue("")}
            />
            <Separator />
            {availablePriceGuideModels.map((model) => (
              <SimpleFilterOption
                key={model}
                active={(table.getColumn("model")?.getFilterValue() ?? "") === model}
                label={model}
                onToggle={() =>
                  table.getColumn("model")?.setFilterValue(
                    (table.getColumn("model")?.getFilterValue() ?? "") === model
                      ? ""
                      : model,
                  )
                }
              />
            ))}
          </FilterTabPanel>
        ),
      },
      {
        value: "year",
        label: "Year",
        render: (table: ReactTable<PriceGuideMatch>) => (
          <FilterTabPanel>
            <SimpleFilterOption
              active={(table.getColumn("year")?.getFilterValue() ?? "") === ""}
              label="All"
              onToggle={() => table.getColumn("year")?.setFilterValue("")}
            />
            <Separator />
            {availablePriceGuideYears.map((year) => (
              <SimpleFilterOption
                key={year}
                active={(table.getColumn("year")?.getFilterValue() ?? "") === year}
                label={year}
                onToggle={() =>
                  table.getColumn("year")?.setFilterValue(
                    (table.getColumn("year")?.getFilterValue() ?? "") === year
                      ? ""
                      : year,
                  )
                }
              />
            ))}
          </FilterTabPanel>
        ),
      },
      {
        value: "condition",
        label: "Condition",
        render: (table: ReactTable<PriceGuideMatch>) => (
          <FilterTabPanel>
            <SimpleFilterOption
              active={(table.getColumn("condition")?.getFilterValue() ?? "") === ""}
              label="All"
              onToggle={() => table.getColumn("condition")?.setFilterValue("")}
            />
            <Separator />
            {availablePriceGuideConditions.map((condition) => (
              <SimpleFilterOption
                key={condition}
                active={
                  (table.getColumn("condition")?.getFilterValue() ?? "") === condition
                }
                label={condition}
                onToggle={() =>
                  table.getColumn("condition")?.setFilterValue(
                    (table.getColumn("condition")?.getFilterValue() ?? "") ===
                      condition
                      ? ""
                      : condition,
                  )
                }
              />
            ))}
          </FilterTabPanel>
        ),
      },
      {
        value: "categories",
        label: "Categories",
        render: (table: ReactTable<PriceGuideMatch>) => (
          <FilterTabPanel>
            <SimpleFilterOption
              active={(table.getColumn("categories")?.getFilterValue() ?? "") === ""}
              label="All"
              onToggle={() => table.getColumn("categories")?.setFilterValue("")}
            />
            <Separator />
            {availablePriceGuideCategories.map((category) => (
              <SimpleFilterOption
                key={category}
                active={
                  (table.getColumn("categories")?.getFilterValue() ?? "") ===
                  category
                }
                label={category}
                onToggle={() =>
                  table.getColumn("categories")?.setFilterValue(
                    (table.getColumn("categories")?.getFilterValue() ?? "") ===
                      category
                      ? ""
                      : category,
                  )
                }
              />
            ))}
          </FilterTabPanel>
        ),
      },
    ],
    [
      availablePriceGuideCategories,
      availablePriceGuideConditions,
      availablePriceGuideManufacturers,
      availablePriceGuideModels,
      availablePriceGuideYears,
    ],
  );

  return {
    wishlistSummary,
    wishlistValueDistributionChartData,
    wishlistManufacturerRadialChartData,
    wishlistValueChartConfig,
    wishlistSpendOverTimeChartData,
    wishlistSpendTimelineChartConfig,
    wishlistSpendByGroupAreaChart,
    items: displayedItems,
    isCreatingInline,
    isEditing,
    form,
    formExternalVersion,
    setForm,
    publishForm,
    error,
    handleSubmit,
    handleSubmitForm,
    handleClearForm,
    openNewRow,
    isFormComplete,
    upsertWishlistMutation,
    availableManufacturerGroups,
    availableGearTypes,
    availableGearGroups,
    setCustomManufacturers,
    setCustomGearTypes,
    setCustomGearGroups,
    mergeUniqueOptions,
    handleNumberInputWheel,
    pricingError,
    priceGuideMatches,
    priceGuideColumns,
    priceGuideTableResetKey,
    priceGuideFilterTabs,
    selectedPriceGuideIds,
    selectedPriceGuideCount: selectedPriceGuideIds.length,
    selectedAveragePrice,
    handleApplyAveragePrice,
    handleTogglePriceGuide,
    selectedTitleQueries,
    availableModelHistorySourceOptions,
    resolvedVisibleModelHistorySources,
    setVisibleModelHistorySources,
    availableModelHistoryTitleOptions,
    resolvedVisibleModelHistoryTitleKeys,
    setVisibleModelHistoryTitleKeys,
    availableModelHistorySeriesOptions,
    resolvedVisibleModelHistoryModelKeys,
    setVisibleModelHistoryModelKeys,
    availableModelHistoryManufacturerOptions,
    resolvedVisibleModelHistoryManufacturerKeys,
    setVisibleModelHistoryManufacturerKeys,
    availableModelHistoryYearOptions,
    resolvedVisibleModelHistoryYearKeys,
    setVisibleModelHistoryYearKeys,
    availableModelHistoryConditionOptions,
    resolvedVisibleModelHistoryConditionKeys,
    setVisibleModelHistoryConditionKeys,
    availableModelHistoryCategoryOptions,
    resolvedVisibleModelHistoryCategoryKeys,
    setVisibleModelHistoryCategoryKeys,
    modelHistoryError,
    selectedModelHistoryChartData,
    isModelHistoryLoading: pendingModelHistoryKeys.length > 0,
    filteredSelectedModelHistoryCount,
    selectedModelHistoryChartConfig,
    selectedModelHistorySeries,
    pendingModelHistoryKeys,
    formatCurrency,
    abbreviateCurrency,
    columns,
    selectedItemId,
    handleSelectRow,
    filterTabs,
    detailsForm,
    setDetailsForm,
    detailsError,
    isDetailsDirty,
    isEditorDirty,
    handleSaveDetails,
    isSavingInlineDetails:
      upsertWishlistMutation.isPending ||
      updateWishlistDetailsMutation.isPending ||
      updateWishlistStatusMutation.isPending,
    resetInlineEditState,
    handlePromote,
    isPromoting: promoteWishlistMutation.isPending,
    updateWishlistStatusMutation,
    handleStatusChange,
  };
}
