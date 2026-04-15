"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type Table as ReactTable } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ChevronDown,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import {
  AdminDataTable,
  type AdminDataTableColumnDef,
  FilterTabPanel,
  SimpleFilterOption,
  SortableHeader,
} from "~/app/admin/_components/admin-data-table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  ChartContainer,
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Checkbox } from "~/components/ui/checkbox";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { type ChartFilterOption } from "./chart-filter-panel";
import {
  type GearDetailsFormState,
  type GearFormState,
  type GearItem,
  type GearMediaAsset,
  type GearServiceLog,
  type GearStatus,
  type ModelHistoryPoint,
  type PriceGuideMatch,
  type ServiceLogFormState,
  gearStatusMetadata,
} from "./gear-manager-types";
import { buildManufacturerRadialData } from "./manufacturer-radial-chart-helpers";
import { GroupedValueAccordionSelect } from "./grouped-value-accordion-select";
import { ValueAccordionSelect } from "./value-accordion-select";

const serviceLogFormFromEntry = (
  serviceLog: GearServiceLog,
): ServiceLogFormState => ({
  serviceType: serviceLog.serviceType,
  serviceDate: serviceLog.serviceDate,
  warrantyUntil: serviceLog.warrantyUntil,
  notes: serviceLog.notes,
});

const emptyForm: GearFormState = {
  id: null,
  name: "",
  description: "",
  type: "",
  group: "",
  price: "0.00",
  quantity: "1",
  manufacturer: "",
};
const emptyDetailsForm: GearDetailsFormState = {
  status: "active",
  location: "",
  serialNumber: "",
  acquiredFrom: "",
  purchaseDate: "",
  purchaseSource: "",
  referenceNumber: "",
  notes: "",
};
const emptyServiceLogForm: ServiceLogFormState = {
  serviceType: "",
  serviceDate: "",
  warrantyUntil: "",
  notes: "",
};
const NEW_GEAR_ROW_ID = "__new-gear-row__";
const gearManagerDraftStorageKey = "admin-gear-manager-draft";

const normalizeStoredNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeQuantity = (value: unknown): number =>
  Math.trunc(Math.max(normalizeStoredNumber(value), 0));

const normalizeCurrency = (value: unknown): number =>
  Number(normalizeStoredNumber(value).toFixed(2));

const normalizeText = (value: string) => value.trim();

const normalizeGearItem = (gear: GearItem): GearItem => ({
  ...gear,
  name: normalizeText(gear.name),
  description: normalizeText(gear.description),
  type: normalizeText(gear.type),
  group: normalizeText(gear.group),
  manufacturer: normalizeText(gear.manufacturer),
  location:
    normalizeText(gear.location) ||
    [
      gear.room,
      gear.rack,
      gear.shelf,
      gear.slot,
      gear.storageCase,
    ]
      .map((value) => normalizeText(value))
      .filter(Boolean)
      .join(" / "),
  serialNumber: normalizeText(gear.serialNumber),
  acquiredFrom: normalizeText(gear.acquiredFrom),
  purchaseDate: normalizeText(gear.purchaseDate),
  purchaseSource: normalizeText(gear.purchaseSource),
  referenceNumber: normalizeText(gear.referenceNumber),
  room: [
    gear.room,
    gear.rack,
    gear.shelf,
    gear.slot,
    gear.storageCase,
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(" / "),
  rack: normalizeText(gear.rack),
  shelf: normalizeText(gear.shelf),
  slot: normalizeText(gear.slot),
  storageCase: normalizeText(gear.storageCase),
  notes: normalizeText(gear.notes),
  price: normalizeCurrency(gear.price),
  quantity: Math.trunc(normalizeStoredNumber(gear.quantity)),
  status:
    gear.status === "inactive" || gear.status === "out-of-order"
      ? gear.status
      : "active",
  serviceLogs: [...gear.serviceLogs]
    .map((log) => ({
      ...log,
      serviceType: normalizeText(log.serviceType),
      serviceDate: normalizeText(log.serviceDate),
      warrantyUntil: normalizeText(log.warrantyUntil),
      notes: normalizeText(log.notes),
    }))
    .sort((left, right) => right.serviceDate.localeCompare(left.serviceDate)),
  mediaAssets: [...gear.mediaAssets]
    .map((asset) => ({
      ...asset,
      fileName: normalizeText(asset.fileName),
      contentType: normalizeText(asset.contentType),
      storageUri: normalizeText(asset.storageUri),
      byteSize: normalizeQuantity(asset.byteSize),
    }))
    .sort((left, right) => left.fileName.localeCompare(right.fileName)),
});

const formFromGear = (gear: GearItem): GearFormState => ({
  id: gear.id,
  name: gear.name,
  description: gear.description,
  type: gear.type,
  group: gear.group,
  price: normalizeCurrency(gear.price).toFixed(2),
  quantity: String(Math.trunc(normalizeStoredNumber(gear.quantity))),
  manufacturer: gear.manufacturer,
});

const detailsFormFromGear = (gear: GearItem): GearDetailsFormState => ({
  status: gear.status,
  location: gear.location,
  serialNumber: gear.serialNumber,
  acquiredFrom: gear.acquiredFrom,
  purchaseDate: gear.purchaseDate,
  purchaseSource: gear.purchaseSource,
  referenceNumber: gear.referenceNumber,
  notes: gear.notes,
});

const draftGearFromState = ({
  form,
  details,
}: {
  form: GearFormState;
  details: GearDetailsFormState;
}): GearItem => ({
  id: NEW_GEAR_ROW_ID,
  name: form.name.trim(),
  description: form.description.trim(),
  type: form.type.trim(),
  group: form.group.trim(),
  price: normalizeCurrency(form.price),
  quantity: normalizeQuantity(form.quantity),
  manufacturer: form.manufacturer.trim(),
  status: details.status,
  location: details.location.trim(),
  serialNumber: details.serialNumber.trim(),
  acquiredFrom: details.acquiredFrom.trim(),
  purchaseDate: details.purchaseDate.trim(),
  purchaseSource: details.purchaseSource.trim(),
  referenceNumber: details.referenceNumber.trim(),
  room: "",
  rack: "",
  shelf: "",
  slot: "",
  storageCase: "",
  notes: details.notes,
  created_timestamp: "",
  updated_timestamp: null,
  serviceLogs: [],
  mediaAssets: [],
});

const parseNumber = (value: string): number | null => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isEmptyFormState = (form: GearFormState) =>
  form.id === null &&
  form.name === emptyForm.name &&
  form.description === emptyForm.description &&
  form.type === emptyForm.type &&
  form.group === emptyForm.group &&
  form.price === emptyForm.price &&
  form.quantity === emptyForm.quantity &&
  form.manufacturer === emptyForm.manufacturer;

const handleNumberInputWheel = (
  event: React.WheelEvent<HTMLInputElement>,
) => {
  event.currentTarget.blur();
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

const inventoryValueChartConfig = {
  inventoryValue: {
    label: "Inventory Value",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const spendTimelineChartConfig = {
  itemValue: {
    label: "Inventory Value",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const chartColorTokens = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const abbreviateCurrency = (value: number) => {
  if (value >= 10000) {
    return `$${Math.round(value / 1000)}k`;
  }

  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }

  return `$${Math.round(value)}`;
};

const isFullyCataloguedGearItem = (item: GearItem) => {
  const quantity = normalizeQuantity(item.quantity);
  const price = normalizeCurrency(item.price);

  return (
    item.name.trim() !== "" &&
    item.description.trim() !== "" &&
    item.type.trim() !== "" &&
    item.group.trim() !== "" &&
    item.manufacturer.trim() !== "" &&
    Number.isFinite(quantity) &&
    price > 0
  );
};

const calculateAverage = (values: number[]): number | null => {
  if (values.length === 0) return null;

  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
};

const isRecentlyAdded = (createdTimestamp: string): boolean => {
  const added = new Date(createdTimestamp);
  const deltaMilliseconds = Math.abs(Date.now() - added.getTime());
  const totalHours = Math.floor(deltaMilliseconds / 1000 / 60 / 60);
  return Math.floor(totalHours / 24) < 30;
};

const normalizeOptionValue = (value: string) => value.trim().toLocaleLowerCase();

const sanitizeReverbQuerySegment = (value: string) =>
  value.trim().replace(/^[\s\-–—:|/&,]+/, "").replace(/[\s\-–—:|/&,]+$/, "");

const buildReverbQuery = (...segments: string[]) => {
  const uniqueSegments = [...new Map(
    segments
      .map(sanitizeReverbQuerySegment)
      .filter(Boolean)
      .map((segment) => [normalizeOptionValue(segment), segment]),
  ).values()];

  return uniqueSegments.join("&");
};

const buildDefaultReverbPricingQuery = ({
  manufacturer,
  name,
}: {
  manufacturer: string;
  name: string;
}) => {
  const trimmedManufacturer = manufacturer.trim();
  const trimmedName = name.trim();

  if (!trimmedManufacturer) {
    return sanitizeReverbQuerySegment(trimmedName);
  }

  if (!trimmedName) {
    return sanitizeReverbQuerySegment(trimmedManufacturer);
  }

  const normalizedManufacturer = normalizeOptionValue(trimmedManufacturer);
  const normalizedName = normalizeOptionValue(trimmedName);
  const strippedName = normalizedName.startsWith(normalizedManufacturer)
    ? sanitizeReverbQuerySegment(trimmedName.slice(trimmedManufacturer.length))
    : trimmedName;

  return buildReverbQuery(trimmedManufacturer, strippedName);
};

const getModelHistorySeriesLabel = (point: Pick<ModelHistoryPoint, "model" | "title">) => {
  const model = point.model?.trim();
  if (model && model !== "—") {
    return model;
  }

  const title = point.title?.trim();
  if (title) {
    return title;
  }

  return "Unknown Model";
};

const getModelHistorySeriesKey = (point: Pick<ModelHistoryPoint, "model" | "title">) =>
  normalizeOptionValue(getModelHistorySeriesLabel(point));

const getHistoryFilterLabel = (
  value: string | null | undefined,
  fallback = "Unknown",
) => {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "—") {
    return fallback;
  }

  return trimmed;
};

const getHistoryFilterKey = (
  value: string | null | undefined,
  fallback = "unknown",
) => normalizeOptionValue(getHistoryFilterLabel(value, fallback));

type HistoryFilterFacet =
  | "source"
  | "title"
  | "model"
  | "manufacturer"
  | "year"
  | "condition"
  | "category";

const sortChartFilterOptionsAlphabetically = (
  options: ChartFilterOption[],
) =>
  [...options].sort((left, right) =>
    left.label.localeCompare(right.label, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

const getChartYearValue = (label: string) => {
  const match = label.match(/\d{4}/);
  return match ? Number(match[0]) : Number.NaN;
};

const sortChartFilterOptionsByYear = (options: ChartFilterOption[]) =>
  [...options].sort((left, right) => {
    const leftYear = getChartYearValue(left.label);
    const rightYear = getChartYearValue(right.label);
    const leftHasYear = Number.isFinite(leftYear);
    const rightHasYear = Number.isFinite(rightYear);

    if (leftHasYear && rightHasYear) {
      return leftYear - rightYear || left.label.localeCompare(right.label);
    }

    if (leftHasYear) return -1;
    if (rightHasYear) return 1;

    return left.label.localeCompare(right.label, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

const groupChartFilterOptionsAlphabetically = (options: ChartFilterOption[]) =>
  sortChartFilterOptionsAlphabetically(options).reduce(
    (grouped, option) => {
      const groupKey = option.label.trim().at(0)?.toLocaleUpperCase() ?? "#";
      grouped[groupKey] ??= [];
      grouped[groupKey].push(option);
      return grouped;
    },
    {} as Record<string, ChartFilterOption[]>,
  );

const groupChartFilterOptionsByDecade = (options: ChartFilterOption[]) =>
  sortChartFilterOptionsByYear(options).reduce(
    (grouped, option) => {
      const yearValue = getChartYearValue(option.label);
      const groupKey = Number.isFinite(yearValue)
        ? `${Math.floor(yearValue / 10) * 10}s`
        : "Unknown";
      grouped[groupKey] ??= [];
      grouped[groupKey].push(option);
      return grouped;
    },
    {} as Record<string, ChartFilterOption[]>,
  );

const mergeUniqueOptions = (...collections: string[][]) =>
  [...new Map(
    collections
      .flat()
      .map((value) => value.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => [normalizeOptionValue(value), value]),
  ).values()];

const groupOptionsAlphabetically = (options: string[]) =>
  options.reduce(
    (grouped, option) => {
      const normalizedOption = option.trim();
      if (!normalizedOption) {
        return grouped;
      }

      const groupKey = normalizedOption.at(0)?.toLocaleUpperCase() ?? "#";
      grouped[groupKey] ??= [];
      grouped[groupKey].push(normalizedOption);
      return grouped;
    },
    {} as Record<string, string[]>,
  );

const resetInventoryFilters = (table: ReactTable<GearItem>) => {
  table.getColumn("group")?.setFilterValue("");
  table.getColumn("type")?.setFilterValue("");
  table.getColumn("manufacturer")?.setFilterValue("");
  table.getColumn("location")?.setFilterValue("");
};

const clearInventoryTableFilters = (table: ReactTable<GearItem>) => {
  resetInventoryFilters(table);
  table.getColumn("added")?.setFilterValue(undefined);
  table.getColumn("search")?.setFilterValue("");
};

const hasActiveInventoryFilters = (table: ReactTable<GearItem>) =>
  ((table.getColumn("search")?.getFilterValue() ?? "") as string).trim() !== "" ||
  (table.getColumn("added")?.getFilterValue() ?? undefined) !== undefined ||
  ((table.getColumn("group")?.getFilterValue() ?? "") as string) !== "" ||
  ((table.getColumn("type")?.getFilterValue() ?? "") as string) !== "" ||
  ((table.getColumn("manufacturer")?.getFilterValue() ?? "") as string) !== "" ||
  ((table.getColumn("location")?.getFilterValue() ?? "") as string) !== "";

export function useGearManager({ initialGear }: { initialGear: GearItem[] }) {
  const router = useRouter();
  const [gear, setGear] = React.useState<GearItem[]>(() =>
    initialGear.map(normalizeGearItem),
  );
  const [form, setForm] = React.useState<GearFormState>(emptyForm);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedInventoryItemId, setSelectedInventoryItemId] = React.useState<
    string | null
  >(null);
  const [detailsForm, setDetailsForm] =
    React.useState<GearDetailsFormState>(emptyDetailsForm);
  const [detailsError, setDetailsError] = React.useState<string | null>(null);
  const [serviceLogForm, setServiceLogForm] =
    React.useState<ServiceLogFormState>(emptyServiceLogForm);
  const [serviceLogError, setServiceLogError] = React.useState<string | null>(
    null,
  );
  const [isServiceLogEditorOpen, setIsServiceLogEditorOpen] =
    React.useState(false);
  const [editingServiceLogId, setEditingServiceLogId] = React.useState<
    string | null
  >(null);
  const [pricingQuery, setPricingQuery] = React.useState("");
  const [pricingError, setPricingError] = React.useState<string | null>(null);
  const [priceGuideMatches, setPriceGuideMatches] = React.useState<
    PriceGuideMatch[]
  >([]);
  const [selectedPriceGuideIds, setSelectedPriceGuideIds] = React.useState<
    string[]
  >([]);
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
  const [priceGuideTableResetKey, setPriceGuideTableResetKey] = React.useState(0);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(
    null,
  );
  const [customGearTypes, setCustomGearTypes] = React.useState<string[]>([]);
  const [customGearGroups, setCustomGearGroups] = React.useState<string[]>([]);
  const [customManufacturers, setCustomManufacturers] = React.useState<string[]>(
    [],
  );
  const [customLocations, setCustomLocations] = React.useState<string[]>([]);
  const [typeRenameTarget, setTypeRenameTarget] = React.useState("");
  const [typeRenameValue, setTypeRenameValue] = React.useState("");
  const [groupRenameTarget, setGroupRenameTarget] = React.useState("");
  const [groupRenameValue, setGroupRenameValue] = React.useState("");
  const [manufacturerRenameTarget, setManufacturerRenameTarget] =
    React.useState("");
  const [manufacturerRenameValue, setManufacturerRenameValue] =
    React.useState("");
  const [locationRenameTarget, setLocationRenameTarget] = React.useState("");
  const [locationRenameValue, setLocationRenameValue] = React.useState("");
  const [newTypeValue, setNewTypeValue] = React.useState("");
  const [newGroupValue, setNewGroupValue] = React.useState("");
  const [newManufacturerValue, setNewManufacturerValue] = React.useState("");
  const [newLocationValue, setNewLocationValue] = React.useState("");
  const draftHydratedRef = React.useRef(false);
  const latestPricingRequestRef = React.useRef("");
  const lastCompletedPricingQueryRef = React.useRef("");

  React.useEffect(() => {
    setGear(initialGear.map(normalizeGearItem));
  }, [initialGear]);

  React.useEffect(() => {
    try {
      const rawDraft = window.sessionStorage.getItem(gearManagerDraftStorageKey);
      if (!rawDraft) {
        return;
      }

      const parsedDraft = JSON.parse(rawDraft) as {
        form?: Partial<GearFormState>;
        pricingQuery?: string;
        priceGuideMatches?: PriceGuideMatch[];
        selectedPriceGuideIds?: string[];
        customGearTypes?: string[];
        customGearGroups?: string[];
        customManufacturers?: string[];
        customLocations?: string[];
      };

      if (parsedDraft.form) {
        setForm({
          id:
            typeof parsedDraft.form.id === "string" || parsedDraft.form.id === null
              ? parsedDraft.form.id
              : emptyForm.id,
          name:
            typeof parsedDraft.form.name === "string"
              ? parsedDraft.form.name
              : emptyForm.name,
          description:
            typeof parsedDraft.form.description === "string"
              ? parsedDraft.form.description
              : emptyForm.description,
          type:
            typeof parsedDraft.form.type === "string"
              ? parsedDraft.form.type
              : emptyForm.type,
          group:
            typeof parsedDraft.form.group === "string"
              ? parsedDraft.form.group
              : emptyForm.group,
          price:
            typeof parsedDraft.form.price === "string"
              ? parsedDraft.form.price
              : emptyForm.price,
          quantity:
            typeof parsedDraft.form.quantity === "string"
              ? parsedDraft.form.quantity
              : emptyForm.quantity,
          manufacturer:
            typeof parsedDraft.form.manufacturer === "string"
              ? parsedDraft.form.manufacturer
              : emptyForm.manufacturer,
        });
      }

      if (typeof parsedDraft.pricingQuery === "string") {
        setPricingQuery(parsedDraft.pricingQuery);
      }

      if (Array.isArray(parsedDraft.priceGuideMatches)) {
        setPriceGuideMatches(parsedDraft.priceGuideMatches);
      }

      if (Array.isArray(parsedDraft.selectedPriceGuideIds)) {
        setSelectedPriceGuideIds(
          parsedDraft.selectedPriceGuideIds.filter(
            (value): value is string => typeof value === "string",
          ),
        );
      }

      if (Array.isArray(parsedDraft.customGearTypes)) {
        setCustomGearTypes(
          parsedDraft.customGearTypes.filter(
            (value): value is string => typeof value === "string",
          ),
        );
      }

      if (Array.isArray(parsedDraft.customGearGroups)) {
        setCustomGearGroups(
          parsedDraft.customGearGroups.filter(
            (value): value is string => typeof value === "string",
          ),
        );
      }

      if (Array.isArray(parsedDraft.customManufacturers)) {
        setCustomManufacturers(
          parsedDraft.customManufacturers.filter(
            (value): value is string => typeof value === "string",
          ),
        );
      }

      if (Array.isArray(parsedDraft.customLocations)) {
        setCustomLocations(
          parsedDraft.customLocations.filter(
            (value): value is string => typeof value === "string",
          ),
        );
      }
    } catch {
      window.sessionStorage.removeItem(gearManagerDraftStorageKey);
    } finally {
      draftHydratedRef.current = true;
    }
  }, []);

  React.useEffect(() => {
    if (!draftHydratedRef.current) {
      return;
    }

    const hasDraftState =
      !isEmptyFormState(form) ||
      pricingQuery.trim() !== "" ||
      priceGuideMatches.length > 0 ||
      selectedPriceGuideIds.length > 0 ||
      customGearTypes.length > 0 ||
      customGearGroups.length > 0 ||
      customManufacturers.length > 0 ||
      customLocations.length > 0;

    if (!hasDraftState) {
      window.sessionStorage.removeItem(gearManagerDraftStorageKey);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.sessionStorage.setItem(
        gearManagerDraftStorageKey,
        JSON.stringify({
          form,
          pricingQuery,
          priceGuideMatches,
          selectedPriceGuideIds,
          customGearTypes,
          customGearGroups,
          customManufacturers,
          customLocations,
        }),
      );
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    customManufacturers,
    customGearGroups,
    customGearTypes,
    customLocations,
    form,
    priceGuideMatches,
    pricingQuery,
    selectedPriceGuideIds,
  ]);

  const isEditing = form.id !== null;
  const isCreatingInline = selectedInventoryItemId === NEW_GEAR_ROW_ID && form.id === null;
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
  const selectedInventoryItem = React.useMemo(
    () =>
      selectedInventoryItemId
        ? gear.find((item) => item.id === selectedInventoryItemId) ?? null
        : null,
    [gear, selectedInventoryItemId],
  );
  const draftInventoryItem = React.useMemo(
    () =>
      draftGearFromState({
        form,
        details: detailsForm,
      }),
    [detailsForm, form],
  );
  const inventoryTableData = React.useMemo(
    () => (isCreatingInline ? [...gear, draftInventoryItem] : gear),
    [draftInventoryItem, gear, isCreatingInline],
  );
  const resetServiceLogEditor = React.useCallback(() => {
    setServiceLogForm(emptyServiceLogForm);
    setServiceLogError(null);
    setEditingServiceLogId(null);
    setIsServiceLogEditorOpen(false);
  }, []);
  const openNewServiceLogEditor = React.useCallback(() => {
    setServiceLogError(null);
    setEditingServiceLogId(null);
    setServiceLogForm(emptyServiceLogForm);
    setIsServiceLogEditorOpen(true);
  }, []);
  const openEditServiceLogEditor = React.useCallback((serviceLog: GearServiceLog) => {
    setServiceLogError(null);
    setEditingServiceLogId(serviceLog.id);
    setServiceLogForm(serviceLogFormFromEntry(serviceLog));
    setIsServiceLogEditorOpen(true);
  }, []);
  React.useEffect(() => {
    if (
      selectedInventoryItemId &&
      selectedInventoryItemId !== NEW_GEAR_ROW_ID &&
      !selectedInventoryItem
    ) {
      setSelectedInventoryItemId(null);
      setDetailsForm(emptyDetailsForm);
      resetServiceLogEditor();
      setDetailsError(null);
    }
  }, [resetServiceLogEditor, selectedInventoryItem, selectedInventoryItemId]);
  const isDetailsDirty = React.useMemo(() => {
    if (isCreatingInline) {
      return (
        emptyDetailsForm.status !== detailsForm.status ||
        emptyDetailsForm.location !== detailsForm.location ||
        emptyDetailsForm.serialNumber !== detailsForm.serialNumber ||
        emptyDetailsForm.acquiredFrom !== detailsForm.acquiredFrom ||
        emptyDetailsForm.purchaseDate !== detailsForm.purchaseDate ||
        emptyDetailsForm.purchaseSource !== detailsForm.purchaseSource ||
        emptyDetailsForm.referenceNumber !== detailsForm.referenceNumber ||
        emptyDetailsForm.notes !== detailsForm.notes
      );
    }

    if (!selectedInventoryItem) {
      return false;
    }

    const currentDetails = detailsFormFromGear(selectedInventoryItem);
    return (
      currentDetails.status !== detailsForm.status ||
      currentDetails.location !== detailsForm.location ||
      currentDetails.serialNumber !== detailsForm.serialNumber ||
      currentDetails.acquiredFrom !== detailsForm.acquiredFrom ||
      currentDetails.purchaseDate !== detailsForm.purchaseDate ||
      currentDetails.purchaseSource !== detailsForm.purchaseSource ||
      currentDetails.referenceNumber !== detailsForm.referenceNumber ||
      currentDetails.notes !== detailsForm.notes
    );
  }, [detailsForm, isCreatingInline, selectedInventoryItem]);
  const isEditorDirty = React.useMemo(() => {
    if (isCreatingInline) {
      return !isEmptyFormState(form);
    }

    if (!selectedInventoryItem || form.id !== selectedInventoryItem.id) {
      return false;
    }

    const currentForm = formFromGear(selectedInventoryItem);
    return (
      currentForm.name !== form.name ||
      currentForm.description !== form.description ||
      currentForm.type !== form.type ||
      currentForm.group !== form.group ||
      currentForm.price !== form.price ||
      currentForm.quantity !== form.quantity ||
      currentForm.manufacturer !== form.manufacturer
    );
  }, [form, isCreatingInline, selectedInventoryItem]);
  const canAddServiceLog =
    serviceLogForm.serviceType.trim() !== "" &&
    serviceLogForm.serviceDate.trim() !== "";
  const isEditingServiceLog = editingServiceLogId !== null;
  const defaultPricingQuery = buildDefaultReverbPricingQuery({
    manufacturer: form.manufacturer,
    name: form.name,
  });
  React.useEffect(() => {
    setPricingQuery(defaultPricingQuery.trim());
  }, [defaultPricingQuery]);
  const selectedPriceGuideMatches = React.useMemo(
    () =>
      priceGuideMatches.filter(
        (match) =>
          selectedPriceGuideIds.includes(match.id) && match.priceValue !== null,
      ),
    [priceGuideMatches, selectedPriceGuideIds],
  );
  const selectedPriceGuideRows = React.useMemo(
    () =>
      priceGuideMatches.filter((match) => selectedPriceGuideIds.includes(match.id)),
    [priceGuideMatches, selectedPriceGuideIds],
  );
  const selectedPriceGuideCount = selectedPriceGuideIds.length;
  const selectedAveragePrice = React.useMemo(
    () =>
      calculateAverage(
        selectedPriceGuideMatches
          .map((match) => match.priceValue)
          .filter((price): price is number => price !== null),
      ),
    [selectedPriceGuideMatches],
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
  const availablePriceGuideCategories = React.useMemo(
    () =>
      [...new Set(priceGuideMatches.map((match) => match.categories))]
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
  const availablePriceGuideManufacturers = React.useMemo(
    () =>
      [...new Set(priceGuideMatches.map((match) => match.manufacturer ?? "—"))]
        .filter((value) => value !== "—")
        .sort((left, right) => left.localeCompare(right)),
    [priceGuideMatches],
  );
  const selectedTitleQueries = React.useMemo(() => {
    const activeQuery = pricingQuery.trim();
    if (!activeQuery) {
      return [];
    }

    return [
      {
        key: normalizeOptionValue(activeQuery),
        title: activeQuery,
        label: activeQuery,
      },
    ];
  }, [pricingQuery]);
  const inventorySummary = React.useMemo(() => {
    const manufacturers = new Set<string>();
    const groups = new Map<
      string,
      {
        label: string;
        uniqueItemCount: number;
        fullyCataloguedCount: number;
        cataloguedPercent: number;
        totalQuantity: number;
        totalCost: number;
        types: Map<
          string,
          { label: string; totalQuantity: number; totalCost: number }
        >;
      }
    >();

    let totalQuantity = 0;
    let totalCost = 0;
    let fullyCataloguedCount = 0;

    for (const item of gear) {
      const quantity = normalizeQuantity(item.quantity);
      const price = normalizeCurrency(item.price);
      const manufacturer = item.manufacturer.trim();
      const groupLabel = item.group.trim() || "Uncategorized";
      const typeLabel = item.type.trim() || "Unspecified";
      const groupKey = normalizeOptionValue(groupLabel);
      const typeKey = normalizeOptionValue(typeLabel);
      const isFullyCatalogued = isFullyCataloguedGearItem(item);

      totalQuantity += quantity;
      totalCost += price * quantity;

      if (isFullyCatalogued) {
        fullyCataloguedCount += 1;
      }

      if (manufacturer) {
        manufacturers.add(normalizeOptionValue(manufacturer));
      }

      const groupEntry =
        groups.get(groupKey) ??
        {
          label: groupLabel,
          uniqueItemCount: 0,
          fullyCataloguedCount: 0,
          cataloguedPercent: 0,
          totalQuantity: 0,
          totalCost: 0,
          types: new Map<
            string,
            { label: string; totalQuantity: number; totalCost: number }
          >(),
        };

      groupEntry.uniqueItemCount += 1;
      if (isFullyCatalogued) {
        groupEntry.fullyCataloguedCount += 1;
      }
      groupEntry.totalQuantity += quantity;
      groupEntry.totalCost += price * quantity;

      const typeEntry =
        groupEntry.types.get(typeKey) ?? {
          label: typeLabel,
          totalQuantity: 0,
          totalCost: 0,
        };

      typeEntry.totalQuantity += quantity;
      typeEntry.totalCost += price * quantity;
      groupEntry.types.set(typeKey, typeEntry);
      groups.set(groupKey, groupEntry);
    }

    return {
      totalQuantity,
      uniqueItemCount: gear.length,
      fullyCataloguedCount,
      cataloguedPercent:
        gear.length === 0
          ? 0
          : Number(((fullyCataloguedCount / gear.length) * 100).toFixed(1)),
      manufacturerCount: manufacturers.size,
      totalCost: Number(totalCost.toFixed(2)),
      groups: [...groups.values()]
        .map((group) => ({
          ...group,
          cataloguedPercent:
            group.uniqueItemCount === 0
              ? 0
              : Number(
                  (
                    (group.fullyCataloguedCount / group.uniqueItemCount) *
                    100
                  ).toFixed(1),
                ),
          totalCost: Number(group.totalCost.toFixed(2)),
          types: [...group.types.values()].sort((left, right) =>
            left.label.localeCompare(right.label),
          ).map((type) => ({
            ...type,
            totalCost: Number(type.totalCost.toFixed(2)),
          })),
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    };
  }, [gear]);
  const inventoryValueDistributionChartData = React.useMemo(() => {
    return inventorySummary.groups
      .map((group) => ({
        group: group.label,
        groupLabel:
          group.label.length > 16 ? `${group.label.slice(0, 15)}…` : group.label,
        inventoryValue: group.totalCost,
        quantity: group.totalQuantity,
      }))
      .sort((left, right) => right.inventoryValue - left.inventoryValue);
  }, [inventorySummary.groups]);
  const inventoryManufacturerRadialChartData = React.useMemo(
    () =>
      buildManufacturerRadialData({
        items: gear,
        getManufacturer: (item) => item.manufacturer,
        getValue: (item) =>
          normalizeCurrency(item.price) * normalizeQuantity(item.quantity),
        getQuantity: (item) => normalizeQuantity(item.quantity),
        normalizeManufacturer: normalizeOptionValue,
      }),
    [gear],
  );
  const spendOverTimeChartData = React.useMemo(
    () =>
      gear
        .map((item) => {
          const createdAt = new Date(item.created_timestamp);
          const createdAtMs = createdAt.getTime();
          const quantity = normalizeQuantity(item.quantity);
          const itemValue = Number(
            (normalizeCurrency(item.price) * quantity).toFixed(2),
          );

          return {
            id: item.id,
            name: item.name,
            quantity,
            itemValue,
            createdAtMs,
            createdAtAxisLabel: Number.isFinite(createdAtMs)
              ? format(createdAt, "MMM yyyy")
              : "Unknown",
            createdAtTooltipLabel: Number.isFinite(createdAtMs)
              ? format(createdAt, "MMM d, yyyy h:mm a")
              : "Unknown date",
          };
        })
        .filter((item) => Number.isFinite(item.createdAtMs))
        .sort((left, right) => left.createdAtMs - right.createdAtMs),
    [gear],
  );
  const spendByGroupAreaChart = React.useMemo(() => {
    const sortedGroupLabels = [...new Set(
      gear
        .map((item) => item.group.trim())
        .filter(Boolean),
    )].sort((left, right) => left.localeCompare(right));

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

    for (const item of gear) {
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
        rowsByMonth.get(monthKey) ??
        {
          monthKey,
          monthLabel: format(new Date(monthMs), "MMM yyyy"),
          monthMs,
          totalValue: 0,
        };
      const inventoryValue = Number(
        (
          normalizeCurrency(item.price) * normalizeQuantity(item.quantity)
        ).toFixed(2),
      );

      currentRow[seriesEntry.key] =
        normalizeStoredNumber(currentRow[seriesEntry.key]) + inventoryValue;
      currentRow.totalValue += inventoryValue;

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
          normalizedRow[entry.key] = Number(
            normalizeStoredNumber(row[entry.key]).toFixed(2),
          );
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
  }, [gear]);
  const selectedModelHistoryPoints = React.useMemo(
    () =>
      selectedTitleQueries.flatMap(
        ({ key }) => modelHistoryCache[key] ?? [],
      ),
    [modelHistoryCache, selectedTitleQueries],
  );
  const selectedModelHistoryChartData = React.useMemo(
    () =>
      selectedModelHistoryPoints
        .filter(
          (point) => point.occurredAtMs !== null && point.priceValue !== null,
        )
        .map((point) => ({
          ...point,
          occurredAtLabel: format(
            new Date(point.occurredAtMs ?? 0),
            "MMM d, yyyy",
          ),
        }))
        .sort(
          (left, right) =>
            (left.occurredAtMs ?? 0) - (right.occurredAtMs ?? 0),
        ),
    [selectedModelHistoryPoints],
  );
  const getVisibleHistoryCategoryLabels = React.useCallback(
    (
      point: Pick<ModelHistoryPoint, "categories">,
      fallback = "Unknown",
    ) => {
      const labels = (point.categories ?? [])
        .map((category) => category.trim())
        .filter(Boolean);

      return labels.length > 0 ? labels : [fallback];
    },
    [],
  );
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
      getVisibleHistoryCategoryLabels,
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
    (facet: HistoryFilterFacet) =>
      selectedModelHistoryChartData.filter((point) =>
        matchesHistoryChartFilters(point, facet, true),
      ),
    [matchesHistoryChartFilters, selectedModelHistoryChartData],
  );
  const availableModelHistorySourceOptions = React.useMemo(
    () =>
      [...new Map(
        getHistoryPointsForFacetOptions("source").map((point) => [
          point.source,
          { key: point.source, label: point.source },
        ]),
      ).values()],
    [getHistoryPointsForFacetOptions],
  );
  const availableModelHistoryTitleOptions = React.useMemo(
    () =>
      [...new Map(
        getHistoryPointsForFacetOptions("title").map((point) => [
          getHistoryFilterKey(point.title),
          {
            key: getHistoryFilterKey(point.title),
            label: getHistoryFilterLabel(point.title),
          },
        ]),
      ).values()],
    [getHistoryPointsForFacetOptions],
  );
  const availableModelHistorySeriesOptions = React.useMemo(
    () =>
      [...new Map(
        getHistoryPointsForFacetOptions("model").map((point) => {
          const key = getModelHistorySeriesKey(point);
          return [
            key,
            {
              key,
              label: getModelHistorySeriesLabel(point),
            },
          ];
        }),
      ).values()],
    [getHistoryPointsForFacetOptions],
  );
  const availableModelHistoryManufacturerOptions = React.useMemo(
    () =>
      [...new Map(
        getHistoryPointsForFacetOptions("manufacturer").map((point) => [
          getHistoryFilterKey(point.manufacturer),
          {
            key: getHistoryFilterKey(point.manufacturer),
            label: getHistoryFilterLabel(point.manufacturer),
          },
        ]),
      ).values()],
    [getHistoryPointsForFacetOptions],
  );
  const availableModelHistoryYearOptions = React.useMemo(
    () =>
      [...new Map(
        getHistoryPointsForFacetOptions("year").map((point) => [
          getHistoryFilterKey(point.year),
          {
            key: getHistoryFilterKey(point.year),
            label: getHistoryFilterLabel(point.year),
          },
        ]),
      ).values()],
    [getHistoryPointsForFacetOptions],
  );
  const availableModelHistoryConditionOptions = React.useMemo(
    () =>
      [...new Map(
        getHistoryPointsForFacetOptions("condition").map((point) => [
          getHistoryFilterKey(point.condition),
          {
            key: getHistoryFilterKey(point.condition),
            label: getHistoryFilterLabel(point.condition),
          },
        ]),
      ).values()],
    [getHistoryPointsForFacetOptions],
  );
  const availableModelHistoryCategoryOptions = React.useMemo(
    () =>
      [...new Map(
        getHistoryPointsForFacetOptions("category").flatMap((point) =>
          getVisibleHistoryCategoryLabels(point).map((category) => [
            getHistoryFilterKey(category),
            {
              key: getHistoryFilterKey(category),
              label: getHistoryFilterLabel(category),
            },
          ]),
        ),
      ).values()],
    [getHistoryPointsForFacetOptions, getVisibleHistoryCategoryLabels],
  );
  const selectedModelHistoryListingData = React.useMemo(
    () =>
      selectedModelHistoryChartData.filter((point) => point.source === "Listing"),
    [selectedModelHistoryChartData],
  );
  const selectedModelHistoryPriceGuideData = React.useMemo(
    () =>
      selectedModelHistoryChartData.filter(
        (point) => point.source === "Price Guide",
      ),
    [selectedModelHistoryChartData],
  );
  const filteredSelectedModelHistoryListingData = React.useMemo(
    () =>
      selectedModelHistoryListingData.filter((point) =>
        matchesHistoryChartFilters(point),
      ),
    [
      matchesHistoryChartFilters,
      selectedModelHistoryListingData,
    ],
  );
  const filteredSelectedModelHistoryPriceGuideData = React.useMemo(
    () =>
      selectedModelHistoryPriceGuideData.filter((point) =>
        matchesHistoryChartFilters(point),
      ),
    [
      matchesHistoryChartFilters,
      selectedModelHistoryPriceGuideData,
    ],
  );
  const filteredSelectedModelHistoryCount =
    filteredSelectedModelHistoryListingData.length +
    filteredSelectedModelHistoryPriceGuideData.length;
  const filteredSelectedModelHistoryPoints = React.useMemo(
    () =>
      [
        ...filteredSelectedModelHistoryListingData,
        ...filteredSelectedModelHistoryPriceGuideData,
      ].sort((left, right) => (left.occurredAtMs ?? 0) - (right.occurredAtMs ?? 0)),
    [
      filteredSelectedModelHistoryListingData,
      filteredSelectedModelHistoryPriceGuideData,
    ],
  );
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
      const existingSeries = groupedSeries.get(normalizedLabel);

      if (existingSeries) {
        existingSeries.data.push(point);
        continue;
      }

      groupedSeries.set(normalizedLabel, {
        key: `modelSeries${groupedSeries.size + 1}`,
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
    () =>
      selectedModelHistorySeries.reduce<ChartConfig>(
        (config, series) => ({
          ...config,
          [series.key]: {
            label: series.label,
            color: series.color,
          },
        }),
        {},
      ),
    [selectedModelHistorySeries],
  );
  const isModelHistoryLoading = pendingModelHistoryKeys.length > 0;
  const resolvedVisibleModelHistorySources =
    visibleModelHistorySources ??
    availableModelHistorySourceOptions.map((entry) => entry.key);
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
    setVisibleModelHistoryTitleKeys((current) => {
      const nextKeys = availableModelHistoryTitleOptions.map((entry) => entry.key);
      return reconcileHistoryFilterSelection(current, nextKeys);
    });
  }, [availableModelHistoryTitleOptions, reconcileHistoryFilterSelection]);

  React.useEffect(() => {
    setVisibleModelHistoryModelKeys((current) => {
      const nextKeys = availableModelHistorySeriesOptions.map((entry) => entry.key);
      return reconcileHistoryFilterSelection(current, nextKeys);
    });
  }, [availableModelHistorySeriesOptions, reconcileHistoryFilterSelection]);

  React.useEffect(() => {
    setVisibleModelHistoryManufacturerKeys((current) => {
      const nextKeys = availableModelHistoryManufacturerOptions.map(
        (entry) => entry.key,
      );
      return reconcileHistoryFilterSelection(current, nextKeys);
    });
  }, [
    availableModelHistoryManufacturerOptions,
    reconcileHistoryFilterSelection,
  ]);

  React.useEffect(() => {
    setVisibleModelHistoryYearKeys((current) => {
      const nextKeys = availableModelHistoryYearOptions.map((entry) => entry.key);
      return reconcileHistoryFilterSelection(current, nextKeys);
    });
  }, [availableModelHistoryYearOptions, reconcileHistoryFilterSelection]);

  React.useEffect(() => {
    setVisibleModelHistoryConditionKeys((current) => {
      const nextKeys = availableModelHistoryConditionOptions.map(
        (entry) => entry.key,
      );
      return reconcileHistoryFilterSelection(current, nextKeys);
    });
  }, [availableModelHistoryConditionOptions, reconcileHistoryFilterSelection]);

  React.useEffect(() => {
    setVisibleModelHistoryCategoryKeys((current) => {
      const nextKeys = availableModelHistoryCategoryOptions.map(
        (entry) => entry.key,
      );
      return reconcileHistoryFilterSelection(current, nextKeys);
    });
  }, [availableModelHistoryCategoryOptions, reconcileHistoryFilterSelection]);

  React.useEffect(() => {
    setVisibleModelHistorySources((current) => {
      const nextKeys = availableModelHistorySourceOptions.map((entry) => entry.key);
      return reconcileHistoryFilterSelection(current, nextKeys) as Array<
        "Listing" | "Price Guide"
      > | null;
    });
  }, [availableModelHistorySourceOptions, reconcileHistoryFilterSelection]);

  const resetPricingLookup = React.useCallback((nextQuery = "") => {
    setPricingQuery(nextQuery);
    setPricingError(null);
    setModelHistoryError(null);
    setPriceGuideMatches([]);
    setSelectedPriceGuideIds([]);
    setPriceGuideTableResetKey((current) => current + 1);
    latestPricingRequestRef.current = "";
    lastCompletedPricingQueryRef.current = "";
  }, []);

  const upsertMutation = api.adminGear.upsert.useMutation({
    onMutate: () => setError(null),
    onSuccess: (saved, variables) => {
      const normalizedSaved = normalizeGearItem(saved);
      setGear((current) => {
        const next = current.filter((item) => item.id !== saved.id);
        next.push(normalizedSaved);
        next.sort((a, b) => a.name.localeCompare(b.name));
        return next;
      });
      setSelectedInventoryItemId(saved.id);
      setDetailsForm(detailsFormFromGear(normalizedSaved));
      setForm(formFromGear(normalizedSaved));
      resetPricingLookup(
        buildDefaultReverbPricingQuery({
          manufacturer: normalizedSaved.manufacturer,
          name: normalizedSaved.name,
        }),
      );
      React.startTransition(() => {
        router.refresh();
      });
    },
    onError: (err) => setError(err.message),
  });

  const deleteMutation = api.adminGear.delete.useMutation({
    onMutate: ({ id }) => {
      setError(null);
      setPendingDeleteId(id);
    },
    onSuccess: ({ id }) => {
      setGear((current) => current.filter((item) => item.id !== id));
      if (form.id === id) setForm(emptyForm);
      if (selectedInventoryItemId === id) {
        setSelectedInventoryItemId(null);
        setDetailsForm(emptyDetailsForm);
        resetServiceLogEditor();
      }
      React.startTransition(() => {
        router.refresh();
      });
    },
    onError: (err) => setError(err.message),
    onSettled: () => setPendingDeleteId(null),
  });

  const handleMediaAssetCreated = React.useCallback(
    (itemId: string, asset: GearMediaAsset) => {
      setGear((current) =>
        current.map((item) =>
          item.id === itemId
            ? normalizeGearItem({
                ...item,
                mediaAssets: [...item.mediaAssets, asset],
              })
            : item,
        ),
      );
    },
    [],
  );

  const handleMediaAssetDeleted = React.useCallback(
    (itemId: string, assetId: string) => {
      setGear((current) =>
        current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                mediaAssets: item.mediaAssets.filter((asset) => asset.id !== assetId),
              }
            : item,
        ),
      );
    },
    [],
  );

  const updateDetailsMutation = api.adminGear.updateDetails.useMutation({
    onMutate: () => setDetailsError(null),
    onSuccess: (saved) => {
      const normalized = normalizeGearItem(saved);
      setGear((current) =>
        current.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item)),
      );
      setDetailsForm(detailsFormFromGear(normalized));
      React.startTransition(() => {
        router.refresh();
      });
    },
    onError: (err) => setDetailsError(err.message),
  });

  const updateStatusMutation = api.adminGear.updateStatus.useMutation({
    onMutate: () => setDetailsError(null),
    onSuccess: (saved) => {
      const normalized = normalizeGearItem(saved);
      setGear((current) =>
        current.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item)),
      );
      setDetailsForm((current) => ({
        ...current,
        status: normalized.status,
      }));
      React.startTransition(() => {
        router.refresh();
      });
    },
  });

  const addServiceLogMutation = api.adminGear.addServiceLog.useMutation({
    onMutate: () => setServiceLogError(null),
    onSuccess: (saved) => {
      if (!selectedInventoryItemId) {
        return;
      }

      setGear((current) =>
        current.map((item) =>
          item.id === selectedInventoryItemId
            ? {
                ...item,
                serviceLogs: [saved, ...item.serviceLogs].sort((left, right) =>
                  right.serviceDate.localeCompare(left.serviceDate),
                ),
              }
            : item,
        ),
      );
      resetServiceLogEditor();
      React.startTransition(() => {
        router.refresh();
      });
    },
    onError: (err) => setServiceLogError(err.message),
  });

  const updateServiceLogMutation = api.adminGear.updateServiceLog.useMutation({
    onMutate: () => setServiceLogError(null),
    onSuccess: (saved) => {
      setGear((current) =>
        current.map((item) =>
          item.id === saved.equipmentItemId
            ? {
                ...item,
                serviceLogs: item.serviceLogs
                  .map((log) => (log.id === saved.id ? saved : log))
                  .sort((left, right) =>
                    right.serviceDate.localeCompare(left.serviceDate),
                  ),
              }
            : item,
        ),
      );
      resetServiceLogEditor();
      React.startTransition(() => {
        router.refresh();
      });
    },
    onError: (err) => setServiceLogError(err.message),
  });

  const deleteServiceLogMutation = api.adminGear.deleteServiceLog.useMutation({
    onMutate: () => setServiceLogError(null),
    onSuccess: ({ id, equipmentItemId }) => {
      setGear((current) =>
        current.map((item) =>
          item.id === equipmentItemId
            ? {
                ...item,
                serviceLogs: item.serviceLogs.filter((log) => log.id !== id),
              }
            : item,
        ),
      );
      if (editingServiceLogId === id) {
        resetServiceLogEditor();
      }
      React.startTransition(() => {
        router.refresh();
      });
    },
    onError: (err) => setServiceLogError(err.message),
  });

  const renameFacetMutation = api.adminGear.renameFacet.useMutation({
    onMutate: () => setError(null),
    onSuccess: ({ field, currentValue, nextValue }) => {
      const normalizedCurrentValue = normalizeOptionValue(currentValue);

      if (field === "type") {
        setGear((current) =>
          current.map((item) =>
            normalizeOptionValue(item.type) === normalizedCurrentValue
              ? normalizeGearItem({ ...item, type: nextValue })
              : item,
          ),
        );
        setForm((current) =>
          normalizeOptionValue(current.type) === normalizedCurrentValue
            ? { ...current, type: nextValue }
            : current,
        );
        setCustomGearTypes((current) =>
          mergeUniqueOptions(
            current.filter(
              (option) => normalizeOptionValue(option) !== normalizedCurrentValue,
            ),
            [nextValue],
          ),
        );
        setTypeRenameTarget("");
        setTypeRenameValue("");
      } else if (field === "group") {
        setGear((current) =>
          current.map((item) =>
            normalizeOptionValue(item.group) === normalizedCurrentValue
              ? normalizeGearItem({ ...item, group: nextValue })
              : item,
          ),
        );
        setForm((current) =>
          normalizeOptionValue(current.group) === normalizedCurrentValue
            ? { ...current, group: nextValue }
            : current,
        );
        setCustomGearGroups((current) =>
          mergeUniqueOptions(
            current.filter(
              (option) => normalizeOptionValue(option) !== normalizedCurrentValue,
            ),
            [nextValue],
          ),
        );
        setGroupRenameTarget("");
        setGroupRenameValue("");
      } else if (field === "manufacturer") {
        setGear((current) =>
          current.map((item) =>
            normalizeOptionValue(item.manufacturer) === normalizedCurrentValue
              ? normalizeGearItem({ ...item, manufacturer: nextValue })
              : item,
          ),
        );
        setForm((current) =>
          normalizeOptionValue(current.manufacturer) === normalizedCurrentValue
            ? { ...current, manufacturer: nextValue }
            : current,
        );
        setCustomManufacturers((current) =>
          mergeUniqueOptions(
            current.filter(
              (option) => normalizeOptionValue(option) !== normalizedCurrentValue,
            ),
            [nextValue],
          ),
        );
        setManufacturerRenameTarget("");
        setManufacturerRenameValue("");
      } else {
        setGear((current) =>
          current.map((item) =>
            normalizeOptionValue(item.location) === normalizedCurrentValue
              ? normalizeGearItem({ ...item, location: nextValue })
              : item,
          ),
        );
        setDetailsForm((current) =>
          normalizeOptionValue(current.location) === normalizedCurrentValue
            ? { ...current, location: nextValue }
            : current,
        );
        setCustomLocations((current) =>
          mergeUniqueOptions(
            current.filter(
              (option) => normalizeOptionValue(option) !== normalizedCurrentValue,
            ),
            [nextValue],
          ),
        );
        setLocationRenameTarget("");
        setLocationRenameValue("");
      }

      React.startTransition(() => {
        router.refresh();
      });
    },
    onError: (err) => setError(err.message),
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
    const query = pricingQuery.trim();

    if (!query) {
      if (
        priceGuideMatches.length > 0 ||
        selectedPriceGuideIds.length > 0 ||
        pricingError !== null
      ) {
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
      query === latestPricingRequestRef.current ||
      query === lastCompletedPricingQueryRef.current
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (
        query !== latestPricingRequestRef.current &&
        query !== lastCompletedPricingQueryRef.current
      ) {
        priceGuideSearchMutation.mutate({ query });
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    priceGuideMatches.length,
    priceGuideSearchMutation,
    pricingError,
    pricingQuery,
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

  const saveGearForm = async () => {
    setError(null);

    if (!form.name.trim()) {
      setError("Name is required.");
      return false;
    }

    if (!form.manufacturer.trim()) {
      setError("Manufacturer is required.");
      return false;
    }

    if (!form.type.trim()) {
      setError("Type is required.");
      return false;
    }

    if (!form.group.trim()) {
      setError("Group is required.");
      return false;
    }

    if (!form.description.trim()) {
      setError("Description is required.");
      return false;
    }

    if (!isPriceValid || parsedPrice === null) {
      setError("Price must be a non-negative number.");
      return false;
    }

    if (!isQuantityValid || parsedQuantity === null) {
      setError("Quantity must be a non-negative whole number.");
      return false;
    }

    const saved = await upsertMutation.mutateAsync({
      id: form.id ?? undefined,
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type.trim(),
      group: form.group.trim(),
      price: parsedPrice,
      quantity: Math.floor(parsedQuantity),
      manufacturer: form.manufacturer.trim(),
    });
    return normalizeGearItem(saved);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveGearForm();
  };

  const openNewRow = React.useCallback(() => {
    setForm(emptyForm);
    setSelectedInventoryItemId(NEW_GEAR_ROW_ID);
    setDetailsForm(emptyDetailsForm);
    resetServiceLogEditor();
    setError(null);
    setDetailsError(null);
    resetPricingLookup();
  }, [resetPricingLookup, resetServiceLogEditor]);

  const handleSelectRow = (item: GearItem) => {
    if (selectedInventoryItemId === item.id) {
      setSelectedInventoryItemId(null);
      setForm(emptyForm);
      setDetailsForm(emptyDetailsForm);
      resetServiceLogEditor();
      setDetailsError(null);
      setError(null);
      resetPricingLookup();
      return;
    }

    if (item.id === NEW_GEAR_ROW_ID) {
      setSelectedInventoryItemId(NEW_GEAR_ROW_ID);
      setError(null);
      setDetailsError(null);
      return;
    }

    const nextForm = formFromGear(item);
    setForm(nextForm);
    setSelectedInventoryItemId(item.id);
    setDetailsForm(detailsFormFromGear(item));
    resetServiceLogEditor();
    setError(null);
    setDetailsError(null);
    resetPricingLookup(
      buildDefaultReverbPricingQuery({
        manufacturer: nextForm.manufacturer,
        name: nextForm.name,
      }),
    );
  };

  const isTypeRenameValid =
    typeRenameTarget.trim() !== "" &&
    typeRenameValue.trim() !== "" &&
    normalizeOptionValue(typeRenameTarget) !== normalizeOptionValue(typeRenameValue);
  const isGroupRenameValid =
    groupRenameTarget.trim() !== "" &&
    groupRenameValue.trim() !== "" &&
    normalizeOptionValue(groupRenameTarget) !== normalizeOptionValue(groupRenameValue);
  const isManufacturerRenameValid =
    manufacturerRenameTarget.trim() !== "" &&
    manufacturerRenameValue.trim() !== "" &&
    normalizeOptionValue(manufacturerRenameTarget) !==
      normalizeOptionValue(manufacturerRenameValue);
  const isLocationRenameValid =
    locationRenameTarget.trim() !== "" &&
    locationRenameValue.trim() !== "" &&
    normalizeOptionValue(locationRenameTarget) !==
      normalizeOptionValue(locationRenameValue);

  const handleRenameFacet = async (
    field: "type" | "group" | "manufacturer" | "location",
  ) => {
    const currentValue =
      field === "type"
        ? typeRenameTarget
        : field === "group"
          ? groupRenameTarget
          : field === "manufacturer"
            ? manufacturerRenameTarget
            : locationRenameTarget;
    const nextValue =
      field === "type"
        ? typeRenameValue
        : field === "group"
          ? groupRenameValue
          : field === "manufacturer"
            ? manufacturerRenameValue
            : locationRenameValue;

    if (
      currentValue.trim() === "" ||
      nextValue.trim() === "" ||
      normalizeOptionValue(currentValue) === normalizeOptionValue(nextValue)
    ) {
      return;
    }

    await renameFacetMutation.mutateAsync({
      field,
      currentValue,
      nextValue: nextValue.trim(),
    });
  };

  const handleAddFacet = (field: "type" | "group" | "manufacturer" | "location") => {
    if (field === "type") {
      const nextValue = newTypeValue.trim();
      if (!nextValue) {
        return;
      }

      setCustomGearTypes((current) => mergeUniqueOptions(current, [nextValue]));
      setTypeRenameTarget(nextValue);
      setTypeRenameValue(nextValue);
      setNewTypeValue("");
      return;
    }

    if (field === "group") {
      const nextValue = newGroupValue.trim();
      if (!nextValue) {
        return;
      }

      setCustomGearGroups((current) => mergeUniqueOptions(current, [nextValue]));
      setGroupRenameTarget(nextValue);
      setGroupRenameValue(nextValue);
      setNewGroupValue("");
      return;
    }

    if (field === "manufacturer") {
      const nextValue = newManufacturerValue.trim();
      if (!nextValue) {
        return;
      }

      setCustomManufacturers((current) => mergeUniqueOptions(current, [nextValue]));
      setManufacturerRenameTarget(nextValue);
      setManufacturerRenameValue(nextValue);
      setNewManufacturerValue("");
      return;
    }

    const nextValue = newLocationValue.trim();
    if (!nextValue) {
      return;
    }

    setCustomLocations((current) => mergeUniqueOptions(current, [nextValue]));
    setLocationRenameTarget(nextValue);
    setLocationRenameValue(nextValue);
    setNewLocationValue("");
  };

  const handleDeleteFacet = (field: "type" | "group" | "manufacturer" | "location") => {
    if (field === "type") {
      const normalizedTarget = normalizeOptionValue(typeRenameTarget);
      if (!normalizedTarget || selectedTypeUsageCount > 0) {
        return;
      }

      setCustomGearTypes((current) =>
        current.filter(
          (option) => normalizeOptionValue(option) !== normalizedTarget,
        ),
      );
      if (normalizeOptionValue(form.type) === normalizedTarget) {
        setForm((current) => ({ ...current, type: "" }));
      }
      setTypeRenameTarget("");
      setTypeRenameValue("");
      return;
    }

    if (field === "group") {
      const normalizedTarget = normalizeOptionValue(groupRenameTarget);
      if (!normalizedTarget || selectedGroupUsageCount > 0) {
        return;
      }

      setCustomGearGroups((current) =>
        current.filter(
          (option) => normalizeOptionValue(option) !== normalizedTarget,
        ),
      );
      if (normalizeOptionValue(form.group) === normalizedTarget) {
        setForm((current) => ({ ...current, group: "" }));
      }
      setGroupRenameTarget("");
      setGroupRenameValue("");
      return;
    }

    if (field === "manufacturer") {
      const normalizedTarget = normalizeOptionValue(manufacturerRenameTarget);
      if (!normalizedTarget || selectedManufacturerUsageCount > 0) {
        return;
      }

      setCustomManufacturers((current) =>
        current.filter(
          (option) => normalizeOptionValue(option) !== normalizedTarget,
        ),
      );
      if (normalizeOptionValue(form.manufacturer) === normalizedTarget) {
        setForm((current) => ({ ...current, manufacturer: "" }));
      }
      setManufacturerRenameTarget("");
      setManufacturerRenameValue("");
      return;
    }

    const normalizedTarget = normalizeOptionValue(locationRenameTarget);
    if (!normalizedTarget || selectedLocationUsageCount > 0) {
      return;
    }

    setCustomLocations((current) =>
      current.filter(
        (option) => normalizeOptionValue(option) !== normalizedTarget,
      ),
    );
    if (normalizeOptionValue(detailsForm.location) === normalizedTarget) {
      setDetailsForm((current) => ({ ...current, location: "" }));
    }
    setLocationRenameTarget("");
    setLocationRenameValue("");
  };

  const handleClearForm = () => {
    setForm(emptyForm);
    setError(null);
    setSelectedInventoryItemId(null);
    setDetailsForm(emptyDetailsForm);
    resetServiceLogEditor();
    setDetailsError(null);
    resetPricingLookup();
  };

  const handleSaveDetails = async () => {
    let targetId = selectedInventoryItemId;

    if (isCreatingInline || (isEditing && isEditorDirty)) {
      const savedGear = await saveGearForm();
      if (!savedGear) {
        return;
      }
      targetId = savedGear.id;
    }

    if (!isDetailsDirty) {
      return;
    }

    if (!targetId || targetId === NEW_GEAR_ROW_ID) {
      return;
    }

    await updateDetailsMutation.mutateAsync({
      id: targetId,
      status: detailsForm.status,
      location: detailsForm.location,
      serialNumber: detailsForm.serialNumber,
      acquiredFrom: detailsForm.acquiredFrom,
      purchaseDate: detailsForm.purchaseDate,
      purchaseSource: detailsForm.purchaseSource,
      referenceNumber: detailsForm.referenceNumber,
      notes: detailsForm.notes,
    });
  };

  const resetInlineEditState = React.useCallback(() => {
    if (isCreatingInline) {
      handleClearForm();
      return;
    }

    if (!selectedInventoryItem) {
      return;
    }

    const nextForm = formFromGear(selectedInventoryItem);
    setForm(nextForm);
    setDetailsForm(detailsFormFromGear(selectedInventoryItem));
    setError(null);
    setDetailsError(null);
    resetPricingLookup(
      buildDefaultReverbPricingQuery({
        manufacturer: nextForm.manufacturer,
        name: nextForm.name,
      }),
    );
  }, [handleClearForm, isCreatingInline, resetPricingLookup, selectedInventoryItem]);

  const handleStatusChange = (status: GearStatus) => {
    if (detailsForm.status === status) {
      return;
    }

    const previousStatus = detailsForm.status;
    setDetailsError(null);
    setDetailsForm((current) => ({
      ...current,
      status,
    }));

    if (!selectedInventoryItemId || selectedInventoryItemId === NEW_GEAR_ROW_ID) {
      return;
    }

    setGear((current) =>
      current.map((item) =>
        item.id === selectedInventoryItemId ? { ...item, status } : item,
      ),
    );

    updateStatusMutation.mutate(
      {
        id: selectedInventoryItemId,
        status,
      },
      {
        onError: (err) => {
          setDetailsError(err.message);
          setDetailsForm((current) => ({
            ...current,
            status: previousStatus,
          }));
          setGear((current) =>
            current.map((item) =>
              item.id === selectedInventoryItemId
                ? { ...item, status: previousStatus }
                : item,
            ),
          );
        },
      },
    );
  };

  const handleSaveServiceLog = async () => {
    if (!canAddServiceLog) {
      return;
    }

    if (editingServiceLogId) {
      await updateServiceLogMutation.mutateAsync({
        id: editingServiceLogId,
        serviceType: serviceLogForm.serviceType,
        serviceDate: serviceLogForm.serviceDate,
        warrantyUntil: serviceLogForm.warrantyUntil,
        notes: serviceLogForm.notes,
      });
      return;
    }

    if (!selectedInventoryItemId) {
      return;
    }

    await addServiceLogMutation.mutateAsync({
      equipmentItemId: selectedInventoryItemId,
      serviceType: serviceLogForm.serviceType,
      serviceDate: serviceLogForm.serviceDate,
      warrantyUntil: serviceLogForm.warrantyUntil,
      notes: serviceLogForm.notes,
    });
  };

  const handleTogglePriceGuide = React.useCallback((matchId: string, checked: boolean) => {
    setSelectedPriceGuideIds((current) => {
      if (checked) {
        return current.includes(matchId) ? current : [...current, matchId];
      }

      return current.filter((id) => id !== matchId);
    });
  }, []);

  const handleApplyAveragePrice = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (selectedAveragePrice === null) {
      return;
    }

    setError(null);
    setForm((current) => ({
      ...current,
      price: selectedAveragePrice.toFixed(2),
    }));
  };

  const gearTypes = React.useMemo(
    () => [...new Set(gear.map((item) => item.type))].sort(),
    [gear],
  );
  const gearGroups = React.useMemo(
    () => [...new Set(gear.map((item) => item.group))].sort(),
    [gear],
  );
  const manufacturers = React.useMemo(
    () =>
      [...new Set(gear.map((item) => item.manufacturer.trim()).filter(Boolean))].sort(),
    [gear],
  );
  const locations = React.useMemo(
    () =>
      [...new Set(gear.map((item) => item.location.trim()).filter(Boolean))].sort(),
    [gear],
  );
  const gearByGroup = React.useMemo(
    () =>
      gear.reduce((grouped, item) => {
        const group = item.group.trim() || "Uncategorized";
        grouped[group] ??= [];
        grouped[group].push(item);
        return grouped;
      }, {} as Record<string, GearItem[]>),
    [gear],
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
  const availableLocations = React.useMemo(
    () => mergeUniqueOptions(locations, customLocations),
    [customLocations, locations],
  );
  const availableManufacturerGroups = React.useMemo(
    () => groupOptionsAlphabetically(availableManufacturers),
    [availableManufacturers],
  );
  const typeUsageCounts = React.useMemo(
    () =>
      gear.reduce((counts, item) => {
        const key = normalizeOptionValue(item.type);
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return counts;
      }, new Map<string, number>()),
    [gear],
  );
  const groupUsageCounts = React.useMemo(
    () =>
      gear.reduce((counts, item) => {
        const key = normalizeOptionValue(item.group);
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return counts;
      }, new Map<string, number>()),
    [gear],
  );
  const manufacturerUsageCounts = React.useMemo(
    () =>
      gear.reduce((counts, item) => {
        const key = normalizeOptionValue(item.manufacturer);
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return counts;
      }, new Map<string, number>()),
    [gear],
  );
  const locationUsageCounts = React.useMemo(
    () =>
      gear.reduce((counts, item) => {
        const key = normalizeOptionValue(item.location);
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return counts;
      }, new Map<string, number>()),
    [gear],
  );
  const selectedTypeUsageCount =
    typeUsageCounts.get(normalizeOptionValue(typeRenameTarget)) ?? 0;
  const selectedGroupUsageCount =
    groupUsageCounts.get(normalizeOptionValue(groupRenameTarget)) ?? 0;
  const selectedManufacturerUsageCount =
    manufacturerUsageCounts.get(normalizeOptionValue(manufacturerRenameTarget)) ??
    0;
  const selectedLocationUsageCount =
    locationUsageCounts.get(normalizeOptionValue(locationRenameTarget)) ?? 0;

  const inventoryColumns = React.useMemo<AdminDataTableColumnDef<GearItem>[]>(
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
            selectedInventoryItemId === row.original.id
              ? detailsForm.status
              : row.original.status;
          const metadata = gearStatusMetadata[status];

          return (
            <div className="flex items-center justify-center">
              <span
                aria-label={metadata.label}
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  metadata.dotClassName,
                  (status === "active" || status === "out-of-order") &&
                    "animate-pulse",
                )}
                title={metadata.label}
              />
            </div>
          );
        },
      },
      {
        id: "added",
        accessorFn: (row) => row.created_timestamp,
        filterFn: (row, _, filterValue: Date) => {
          const added = new Date(row.getValue("added"));
          const deltaMilliseconds = Math.abs(
            filterValue.getTime() - added.getTime(),
          );
          const totalHours = Math.floor(deltaMilliseconds / 1000 / 60 / 60);
          return Math.floor(totalHours / 24) < 30;
        },
        enableHiding: true,
      },
      {
        accessorKey: "name",
        size: 280,
        minSize: 220,
        maxSize: 420,
        header: ({ column }) => <SortableHeader column={column} label="Name" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 truncate text-sm font-medium">
            <span className="truncate">{row.original.name}</span>
            {isRecentlyAdded(row.original.created_timestamp) ? (
              <Badge variant="outline">NEW!</Badge>
            ) : null}
          </div>
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
          <div className="truncate text-sm">{row.original.manufacturer ?? "—"}</div>
        ),
      },
      {
        accessorKey: "location",
        filterFn: "equalsString",
        size: 220,
        minSize: 160,
        maxSize: 320,
        header: ({ column }) => (
          <SortableHeader column={column} label="Location" />
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm">
            {row.original.location || "—"}
          </div>
        ),
      },
      {
        accessorKey: "type",
        filterFn: "equalsString",
        size: 140,
        minSize: 110,
        maxSize: 180,
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
                  clearInventoryTableFilters(table);
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
        size: 150,
        minSize: 120,
        maxSize: 220,
        header: ({ column }) => <SortableHeader column={column} label="Group" />,
        cell: ({ row, table }) => {
          const groupValue = row.original.group;
          const groupFilter = (table.getColumn("group")?.getFilterValue() ?? "") as string;
          const typeFilter = (table.getColumn("type")?.getFilterValue() ?? "") as string;

          return (
            <Button
              type="button"
              className={cn(
                "h-fit p-0 hover:text-cyan-500",
                groupFilter === groupValue && "text-cyan-500",
              )}
              onClick={(event) => {
                event.stopPropagation();

                if (groupFilter === groupValue && typeFilter === "") {
                  clearInventoryTableFilters(table);
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
        accessorKey: "price",
        size: 120,
        minSize: 100,
        maxSize: 160,
        header: ({ column }) => (
          <SortableHeader column={column} label="Price" align="end" />
        ),
        cell: ({ row }) => {
          const price = normalizeStoredNumber(row.original.price);
          return <div className="text-right text-sm">${price.toFixed(2)}</div>;
        },
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
            row.location,
            row.serialNumber,
            row.acquiredFrom,
            row.purchaseSource,
            row.referenceNumber,
            row.type,
            row.group,
            row.notes,
            String(row.price),
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

          if (item.id === NEW_GEAR_ROW_ID) {
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
                      `Delete "${item.name}"? This cannot be undone.`,
                    )
                  ) {
                    deleteMutation.mutate({ id: item.id });
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
    [deleteMutation, pendingDeleteId],
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
            row.priceValue !== null ? formatCurrency(row.priceValue) : "",
          ].join(" "),
        filterFn: "includesString",
        enableHiding: true,
      },
    ],
    [handleTogglePriceGuide, selectedPriceGuideIds],
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

  const inventoryFilterTabs = React.useMemo(
    () => [
      {
        value: "type",
        label: "Type",
        render: (table: ReactTable<GearItem>) => (
          <FilterTabPanel>
            <SimpleFilterOption
              active={!hasActiveInventoryFilters(table)}
              label="All"
              onToggle={() => clearInventoryTableFilters(table)}
            />
            <Button
              type="button"
              className={cn(
                "p-0 h-[2.5em] w-fit flex md:hover:underline hover:no-underline",
                table.getColumn("added")?.getFilterValue() !== undefined &&
                  "text-cyan-500 hover:text-cyan-500 dark:hover:text-cyan-500",
              )}
              onClick={() =>
                table.getColumn("added")?.setFilterValue(
                  table.getColumn("added")?.getFilterValue() === undefined
                    ? new Date()
                    : undefined,
                )
              }
            >
              <b>New!</b>
            </Button>
            <Separator />
            <Accordion type="single" collapsible className="flex w-full flex-col">
              {Object.keys(gearByGroup)
                .sort((left, right) => left.localeCompare(right))
                .map((group) => {
                  const groupItems = gearByGroup[group] ?? [];
                  const groupedTypes = [
                    ...new Map(
                      groupItems.map((item) => [
                        normalizeOptionValue(item.type),
                        item.type,
                      ]),
                    ).values(),
                  ].sort((left, right) => left.localeCompare(right));

                  return (
                    <AccordionItem key={`admin-gear-group-${group}`} value={group}>
                      <AccordionTrigger
                        chevronSide="none"
                        className="h-[2.5em] w-full justify-between md:hover:underline hover:no-underline"
                      >
                        {group}
                      </AccordionTrigger>
                      <AccordionContent className="p-0">
                        <Separator className="mb-2 w-1/4" />
                        <SimpleFilterOption
                          active={
                            (table.getColumn("group")?.getFilterValue() ?? "") === group &&
                            (table.getColumn("type")?.getFilterValue() ?? "") === ""
                          }
                          label={`all ${group}`}
                          onToggle={() => {
                            const typeFilter =
                              (table.getColumn("type")?.getFilterValue() ?? "") as string;
                            const groupFilter =
                              (table.getColumn("group")?.getFilterValue() ?? "") as string;

                            if (groupFilter === group && typeFilter === "") {
                              clearInventoryTableFilters(table);
                            } else {
                              resetInventoryFilters(table);
                              table.setColumnFilters([{ id: "group", value: group }]);
                            }
                          }}
                        />
                        {groupedTypes.map((type) => (
                          <SimpleFilterOption
                            key={`${group}-${type}`}
                            active={
                              (table.getColumn("group")?.getFilterValue() ?? "") ===
                                group &&
                              (table.getColumn("type")?.getFilterValue() ?? "") === type
                            }
                            label={type}
                            onToggle={() => {
                              const typeFilter =
                                (table.getColumn("type")?.getFilterValue() ?? "") as string;
                              const groupFilter =
                                (table.getColumn("group")?.getFilterValue() ?? "") as string;

                              if (groupFilter === group && typeFilter === type) {
                                clearInventoryTableFilters(table);
                              } else {
                                resetInventoryFilters(table);
                                table.setColumnFilters([
                                  { id: "group", value: group },
                                  { id: "type", value: type },
                                ]);
                              }
                            }}
                          />
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
        render: (table: ReactTable<GearItem>) => (
          <FilterTabPanel>
            <SimpleFilterOption
              active={!hasActiveInventoryFilters(table)}
              label="All"
              onToggle={() => clearInventoryTableFilters(table)}
            />
            <Separator />
            <Accordion type="single" collapsible className="flex w-full flex-col">
              {Object.keys(manufacturerGroups)
                .sort((left, right) => left.localeCompare(right))
                .map((group) => (
                  <AccordionItem
                    key={`admin-gear-manufacturer-group-${group}`}
                    value={group}
                  >
                    <AccordionTrigger
                      chevronSide="none"
                      className="h-[2.5em] w-full justify-between md:hover:underline hover:no-underline"
                    >
                      {group}
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                      <Separator className="mb-2 w-1/4" />
                      {manufacturerGroups[group]
                        ?.slice()
                        .sort((left, right) => left.localeCompare(right))
                        .map((manufacturer) => (
                          <SimpleFilterOption
                            key={manufacturer}
                            active={
                              (table.getColumn("manufacturer")?.getFilterValue() ?? "") ===
                              manufacturer
                            }
                            label={manufacturer}
                            onToggle={() => {
                              const selectedManufacturer =
                                (table.getColumn("manufacturer")?.getFilterValue() ??
                                  "") as string;

                              if (selectedManufacturer === manufacturer) {
                                clearInventoryTableFilters(table);
                              } else {
                                resetInventoryFilters(table);
                                table.setColumnFilters([
                                  {
                                    id: "manufacturer",
                                    value: manufacturer,
                                  },
                                ]);
                              }
                            }}
                          />
                        ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </FilterTabPanel>
        ),
      },
      {
        value: "location",
        label: "Location",
        render: (table: ReactTable<GearItem>) => (
          <FilterTabPanel>
            <SimpleFilterOption
              active={(table.getColumn("location")?.getFilterValue() ?? "") === ""}
              label="All"
              onToggle={() => table.getColumn("location")?.setFilterValue("")}
            />
            <Separator />
            {availableLocations.map((location) => (
              <SimpleFilterOption
                key={location}
                active={
                  (table.getColumn("location")?.getFilterValue() ?? "") === location
                }
                label={location}
                onToggle={() =>
                  table.getColumn("location")?.setFilterValue(
                    (table.getColumn("location")?.getFilterValue() ?? "") === location
                      ? ""
                      : location,
                  )
                }
              />
            ))}
          </FilterTabPanel>
        ),
      },
    ],
    [availableLocations, gearByGroup, manufacturerGroups],
  );

  const taxonomyState = React.useMemo(
    () => ({
      availableGearTypes,
      availableGearGroups,
      availableManufacturerGroups,
      availableLocations,
      typeRenameTarget,
      setTypeRenameTarget,
      typeRenameValue,
      setTypeRenameValue,
      groupRenameTarget,
      setGroupRenameTarget,
      groupRenameValue,
      setGroupRenameValue,
      manufacturerRenameTarget,
      setManufacturerRenameTarget,
      manufacturerRenameValue,
      setManufacturerRenameValue,
      locationRenameTarget,
      setLocationRenameTarget,
      locationRenameValue,
      setLocationRenameValue,
      newTypeValue,
      setNewTypeValue,
      newGroupValue,
      setNewGroupValue,
      newManufacturerValue,
      setNewManufacturerValue,
      newLocationValue,
      setNewLocationValue,
      selectedTypeUsageCount,
      selectedGroupUsageCount,
      selectedManufacturerUsageCount,
      selectedLocationUsageCount,
      isTypeRenameValid,
      isGroupRenameValid,
      isManufacturerRenameValid,
      isLocationRenameValid,
      renameFacetMutation,
      handleRenameFacet,
      handleDeleteFacet,
      handleAddFacet,
    }),
    [
      availableGearGroups,
      availableGearTypes,
      availableLocations,
      availableManufacturerGroups,
      groupRenameTarget,
      groupRenameValue,
      handleAddFacet,
      handleDeleteFacet,
      handleRenameFacet,
      isGroupRenameValid,
      isLocationRenameValid,
      isManufacturerRenameValid,
      isTypeRenameValid,
      locationRenameTarget,
      locationRenameValue,
      manufacturerRenameTarget,
      manufacturerRenameValue,
      newGroupValue,
      newLocationValue,
      newManufacturerValue,
      newTypeValue,
      renameFacetMutation,
      selectedGroupUsageCount,
      selectedLocationUsageCount,
      selectedManufacturerUsageCount,
      selectedTypeUsageCount,
      typeRenameTarget,
      typeRenameValue,
    ],
  );

  return {
    inventorySummary,
    inventoryValueDistributionChartData,
    inventoryManufacturerRadialChartData,
    inventoryValueChartConfig,
    spendOverTimeChartData,
    spendTimelineChartConfig,
    spendByGroupAreaChart,
    formatCurrency,
    abbreviateCurrency,
    isEditing,
    form,
    setForm,
    error,
    handleSubmit,
    handleClearForm,
    isFormComplete,
    upsertMutation,
    availableManufacturerGroups,
    availableGearTypes,
    availableGearGroups,
    setCustomManufacturers,
    setCustomGearTypes,
    setCustomGearGroups,
    mergeUniqueOptions,
    handleNumberInputWheel,
    priceGuideSearchMutation,
    pricingError,
    priceGuideMatches,
    priceGuideColumns,
    priceGuideTableResetKey,
    priceGuideFilterTabs,
    selectedPriceGuideIds,
    selectedPriceGuideCount,
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
    isModelHistoryLoading,
    filteredSelectedModelHistoryCount,
    selectedModelHistoryChartConfig,
    selectedModelHistorySeries,
    pendingModelHistoryKeys,
    gear,
    inventoryTableData,
    isCreatingInline,
    inventoryColumns,
    selectedInventoryItemId,
    handleSelectRow,
    openNewRow,
    inventoryFilterTabs,
    detailsError,
    detailsForm,
    setDetailsForm,
    handleMediaAssetCreated,
    handleMediaAssetDeleted,
    availableLocations,
    setCustomLocations,
    updateStatusMutation,
    handleStatusChange,
    serviceLogError,
    isServiceLogEditorOpen,
    serviceLogForm,
    setServiceLogForm,
    canAddServiceLog,
    isEditingServiceLog,
    addServiceLogMutation,
    updateServiceLogMutation,
    deleteServiceLogMutation,
    handleSaveServiceLog,
    resetServiceLogEditor,
    openNewServiceLogEditor,
    openEditServiceLogEditor,
    isDetailsDirty,
    isEditorDirty,
    updateDetailsMutation,
    handleSaveDetails,
    isSavingInlineDetails:
      upsertMutation.isPending || updateDetailsMutation.isPending,
    resetInlineEditState,
    detailsFormFromGear,
    taxonomyState,
  };
}
