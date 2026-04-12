"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type Table as ReactTable } from "@tanstack/react-table";
import {
  ChevronDown,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

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
import {
  Button,
} from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Checkbox } from "~/components/ui/checkbox";
import { DropdownMenuCheckboxItem } from "~/components/ui/dropdown-menu";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

type GearItem = RouterOutputs["adminGear"]["list"][number];
type PriceGuideMatch = RouterOutputs["adminGear"]["searchPriceGuide"][number];

interface GearFormState {
  id: string | null;
  name: string;
  description: string;
  type: string;
  group: string;
  price: string;
  quantity: string;
  manufacturer: string;
}

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
  price: normalizeCurrency(gear.price),
  quantity: Math.trunc(normalizeStoredNumber(gear.quantity)),
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

const mergeUniqueOptions = (...collections: string[][]) =>
  [...new Map(
    collections
      .flat()
      .map((value) => value.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => [normalizeOptionValue(value), value]),
  ).values()];

const resetInventoryFilters = (table: ReactTable<GearItem>) => {
  table.getColumn("group")?.setFilterValue("");
  table.getColumn("type")?.setFilterValue("");
  table.getColumn("manufacturer")?.setFilterValue("");
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
  ((table.getColumn("manufacturer")?.getFilterValue() ?? "") as string) !== "";

const SectionAccordionCard = ({
  value,
  title,
  description,
  contentClassName,
  children,
}: React.PropsWithChildren<{
  value: string;
  title: string;
  description: React.ReactNode;
  contentClassName?: string;
}>) => (
  <AccordionItem value={value} className="border-none">
    <Card className="min-w-0">
      <AccordionTrigger
        chevronSide="none"
        className="w-full justify-between px-6 py-6 hover:no-underline"
      >
        <div className="flex min-w-0 flex-col items-start gap-1 text-left">
          <div className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-0 pt-0">
        <CardContent className={cn("min-w-0", contentClassName)}>
          {children}
        </CardContent>
      </AccordionContent>
    </Card>
  </AccordionItem>
);

const ValueAccordionSelect = ({
  id,
  label,
  value,
  options,
  placeholder,
  addLabel,
  onChange,
  onAdd,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  addLabel?: string;
  onChange: (value: string) => void;
  onAdd?: (value: string) => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [draftValue, setDraftValue] = React.useState("");
  const canAdd = Boolean(addLabel && onAdd);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  const handleAdd = () => {
    const nextValue = draftValue.trim();
    if (!nextValue) {
      return;
    }

    if (!onAdd) {
      return;
    }

    onAdd(nextValue);
    onChange(nextValue);
    setDraftValue("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="ghost"
            className="flex min-h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 font-normal hover:bg-muted/50"
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value || placeholder}
            </span>
            <ChevronDown className="!h-[16px] !w-[16px] shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
        >
          <div
            className="max-h-64 overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
          >
            {options.length > 0 ? (
              <div className="flex flex-col">
                {options.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50",
                      index > 0 && "border-t",
                      normalizeOptionValue(option) === normalizeOptionValue(value) &&
                        "bg-muted font-medium",
                    )}
                    onClick={() => handleSelect(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-4 text-sm text-muted-foreground">
                No saved {label.toLocaleLowerCase()}s yet.
              </div>
            )}
          </div>
          {canAdd ? (
            <>
              <Separator />
              <div className="space-y-2 p-3">
                <Input
                  value={draftValue}
                  onChange={(event) => setDraftValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAdd();
                    }
                  }}
                  placeholder={`Add a new ${label.toLocaleLowerCase()}...`}
                />
                <div className="flex w-full justify-center">
                  <Button
                    className="cursor-pointer rounded-sm border border-black px-4 py-2 text-center text-black dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                    onClick={handleAdd}
                    disabled={!draftValue.trim()}
                  >
                    <Plus className="mr-2 !h-[16px] !w-[16px]" />
                    {addLabel}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export function GearManager({ initialGear }: { initialGear: GearItem[] }) {
  const router = useRouter();
  const [gear, setGear] = React.useState<GearItem[]>(() =>
    initialGear.map(normalizeGearItem),
  );
  const [form, setForm] = React.useState<GearFormState>(emptyForm);
  const [error, setError] = React.useState<string | null>(null);
  const [pricingQuery, setPricingQuery] = React.useState("");
  const [pricingError, setPricingError] = React.useState<string | null>(null);
  const [priceGuideMatches, setPriceGuideMatches] = React.useState<
    PriceGuideMatch[]
  >([]);
  const [selectedPriceGuideIds, setSelectedPriceGuideIds] = React.useState<
    string[]
  >([]);
  const [priceGuideTableResetKey, setPriceGuideTableResetKey] = React.useState(0);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(
    null,
  );
  const [customGearTypes, setCustomGearTypes] = React.useState<string[]>([]);
  const [customGearGroups, setCustomGearGroups] = React.useState<string[]>([]);
  const [typeRenameTarget, setTypeRenameTarget] = React.useState("");
  const [typeRenameValue, setTypeRenameValue] = React.useState("");
  const [groupRenameTarget, setGroupRenameTarget] = React.useState("");
  const [groupRenameValue, setGroupRenameValue] = React.useState("");
  const [newTypeValue, setNewTypeValue] = React.useState("");
  const [newGroupValue, setNewGroupValue] = React.useState("");
  const draftHydratedRef = React.useRef(false);

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
      customGearGroups.length > 0;

    if (!hasDraftState) {
      window.sessionStorage.removeItem(gearManagerDraftStorageKey);
      return;
    }

    window.sessionStorage.setItem(
      gearManagerDraftStorageKey,
      JSON.stringify({
        form,
        pricingQuery,
        priceGuideMatches,
        selectedPriceGuideIds,
        customGearTypes,
        customGearGroups,
      }),
    );
  }, [
    customGearGroups,
    customGearTypes,
    form,
    priceGuideMatches,
    pricingQuery,
    selectedPriceGuideIds,
  ]);

  const isEditing = form.id !== null;
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
  const defaultPricingQuery = [form.manufacturer.trim(), form.name.trim()]
    .filter(Boolean)
    .join(" ");
  const selectedPriceGuideMatches = React.useMemo(
    () =>
      priceGuideMatches.filter(
        (match) =>
          selectedPriceGuideIds.includes(match.id) && match.priceValue !== null,
      ),
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

  const resetPricingLookup = React.useCallback((nextQuery = "") => {
    setPricingQuery(nextQuery);
    setPricingError(null);
    setPriceGuideMatches([]);
    setSelectedPriceGuideIds([]);
    setPriceGuideTableResetKey((current) => current + 1);
  }, []);

  const upsertMutation = api.adminGear.upsert.useMutation({
    onMutate: () => setError(null),
    onSuccess: (saved) => {
      setGear((current) => {
        const next = current.filter((item) => item.id !== saved.id);
        next.push(normalizeGearItem(saved));
        next.sort((a, b) => a.name.localeCompare(b.name));
        return next;
      });
      setForm(emptyForm);
      resetPricingLookup();
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
      React.startTransition(() => {
        router.refresh();
      });
    },
    onError: (err) => setError(err.message),
    onSettled: () => setPendingDeleteId(null),
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
      } else {
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
      }

      React.startTransition(() => {
        router.refresh();
      });
    },
    onError: (err) => setError(err.message),
  });

  const priceGuideSearchMutation = api.adminGear.searchPriceGuide.useMutation({
    onMutate: () => {
      setPricingError(null);
      setPriceGuideMatches([]);
      setSelectedPriceGuideIds([]);
      setPriceGuideTableResetKey((current) => current + 1);
    },
    onSuccess: (matches) => {
      setPriceGuideMatches(matches);
    },
    onError: (err) => {
      setPricingError(err.message);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.type.trim()) {
      setError("Type is required.");
      return;
    }

    if (!form.group.trim()) {
      setError("Group is required.");
      return;
    }

    if (!isPriceValid || parsedPrice === null) {
      setError("Price must be a non-negative number.");
      return;
    }

    if (!isQuantityValid || parsedQuantity === null) {
      setError("Quantity must be a non-negative whole number.");
      return;
    }

    upsertMutation.mutate({
      id: form.id ?? undefined,
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type.trim(),
      group: form.group.trim(),
      price: parsedPrice,
      quantity: Math.floor(parsedQuantity),
      manufacturer: form.manufacturer.trim(),
    });
  };

  const handleSelectRow = (item: GearItem) => {
    const nextForm = formFromGear(item);
    setForm(nextForm);
    setError(null);
    resetPricingLookup([nextForm.manufacturer.trim(), nextForm.name.trim()].filter(Boolean).join(" "));
  };

  const isTypeRenameValid =
    typeRenameTarget.trim() !== "" &&
    typeRenameValue.trim() !== "" &&
    normalizeOptionValue(typeRenameTarget) !== normalizeOptionValue(typeRenameValue);
  const isGroupRenameValid =
    groupRenameTarget.trim() !== "" &&
    groupRenameValue.trim() !== "" &&
    normalizeOptionValue(groupRenameTarget) !== normalizeOptionValue(groupRenameValue);

  const handleRenameFacet = async (field: "type" | "group") => {
    const currentValue = field === "type" ? typeRenameTarget : groupRenameTarget;
    const nextValue = field === "type" ? typeRenameValue : groupRenameValue;

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

  const handleAddFacet = (field: "type" | "group") => {
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

    const nextValue = newGroupValue.trim();
    if (!nextValue) {
      return;
    }

    setCustomGearGroups((current) => mergeUniqueOptions(current, [nextValue]));
    setGroupRenameTarget(nextValue);
    setGroupRenameValue(nextValue);
    setNewGroupValue("");
  };

  const handleDeleteFacet = (field: "type" | "group") => {
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
  };

  const handleClearForm = () => {
    setForm(emptyForm);
    setError(null);
    resetPricingLookup();
  };

  const handleFetchPrices = (
    event?:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    event?.preventDefault();
    event?.stopPropagation();

    const query = pricingQuery.trim() || defaultPricingQuery;

    if (!query) {
      setPricingError("Enter a search query or fill in manufacturer and name first.");
      return;
    }

    setPricingQuery(query);
    priceGuideSearchMutation.mutate({ query });
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
    () => [...new Set(gear.map((item) => item.manufacturer))].sort(),
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
    () =>
      manufacturers.reduce((grouped, manufacturer) => {
        const groupKey = manufacturer.at(0)?.toLocaleUpperCase() ?? "#";
        grouped[groupKey] ??= [];
        grouped[groupKey].push(manufacturer);
        return grouped;
      }, {} as Record<string, string[]>),
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
  const selectedTypeUsageCount =
    typeUsageCounts.get(normalizeOptionValue(typeRenameTarget)) ?? 0;
  const selectedGroupUsageCount =
    groupUsageCounts.get(normalizeOptionValue(groupRenameTarget)) ?? 0;

  const inventoryColumns = React.useMemo<AdminDataTableColumnDef<GearItem>[]>(
    () => [
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
          <div className="truncate text-sm">{row.original.manufacturer}</div>
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
            row.name,
            row.description,
            row.manufacturer,
            row.type,
            row.group,
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

  return (
    <Accordion
      type="multiple"
      defaultValue={["summary", "editor", "taxonomy", "inventory"]}
      className="flex min-w-0 flex-col gap-6"
    >
      <SectionAccordionCard
        value="summary"
        title="Inventory Summary"
        description="Live totals across the current studio gear inventory."
        contentClassName="flex min-w-0 flex-col gap-4"
      >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Total Items
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {inventorySummary.totalQuantity.toLocaleString()}
              </div>
            </div>
            <div className="rounded-md border px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Unique Items
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {inventorySummary.uniqueItemCount.toLocaleString()}
              </div>
            </div>
            <div className="rounded-md border px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Manufacturers
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {inventorySummary.manufacturerCount.toLocaleString()}
              </div>
            </div>
            <div className="rounded-md border px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Total Inventory Cost
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {formatCurrency(inventorySummary.totalCost)}
              </div>
            </div>
          </div>

          <div className="rounded-md border px-4 py-4">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium">Cataloguing Progress</div>
                <div className="text-xs text-muted-foreground">
                  {inventorySummary.fullyCataloguedCount.toLocaleString()} of{" "}
                  {inventorySummary.uniqueItemCount.toLocaleString()} items are fully
                  catalogued.
                </div>
              </div>
              <div className="text-sm font-medium sm:text-right">
                {inventorySummary.cataloguedPercent.toFixed(1)}%
              </div>
            </div>
            <Progress
              value={inventorySummary.cataloguedPercent}
              className="mt-3 h-3"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              An item is fully catalogued when all fields are present and price is
              greater than $0.00.
            </div>
          </div>

          <div className="rounded-md border">
            <div className="border-b px-4 py-3">
              <div className="text-sm font-medium">Items by Group and Type</div>
              <div className="text-xs text-muted-foreground">
                Counts below reflect quantity, not just unique rows.
              </div>
            </div>
            {inventorySummary.groups.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                No gear inventory yet.
              </div>
            ) : (
              <div className="p-4">
                <Accordion type="multiple" className="w-full rounded-md border">
                {inventorySummary.groups.map((group) => (
                  <AccordionItem
                    key={group.label}
                    value={group.label}
                    className="w-full last:border-b-0"
                  >
                    <AccordionTrigger
                      chevronSide="none"
                      className="w-full justify-between items-start px-4 py-3 hover:no-underline sm:items-center"
                    >
                      <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="font-medium">{group.label}</div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(group.totalCost)}
                          </div>
                          <Badge variant="outline">
                            {group.totalQuantity.toLocaleString()} items
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0 pt-0">
                      <div className="border-t px-4 py-3">
                        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Cataloguing Progress
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {group.fullyCataloguedCount.toLocaleString()} of{" "}
                              {group.uniqueItemCount.toLocaleString()} items are
                              fully catalogued.
                            </div>
                          </div>
                          <div className="text-sm font-medium sm:text-right">
                            {group.cataloguedPercent.toFixed(1)}%
                          </div>
                        </div>
                        <Progress
                          value={group.cataloguedPercent}
                          className="mt-2 h-2"
                        />
                      </div>
                      <div className="divide-y border-t">
                      {group.types.map((type) => (
                        <div
                          key={`${group.label}-${type.label}`}
                          className="flex flex-col items-start gap-2 px-4 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span className="text-muted-foreground">{type.label}</span>
                          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end sm:gap-4">
                            <span className="text-muted-foreground">
                              {formatCurrency(type.totalCost)}
                            </span>
                            <Badge variant="outline">
                              {type.totalQuantity.toLocaleString()} items
                            </Badge>
                          </div>
                        </div>
                      ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
                </Accordion>
              </div>
            )}
          </div>
      </SectionAccordionCard>

      <SectionAccordionCard
        value="editor"
        title={isEditing ? "Edit Gear Item" : "Add Gear Item"}
        description={
          isEditing
            ? `Editing "${form.name || "(unnamed)"}". Save to update or clear to start over.`
            : "Fill in the form to add a new piece of gear."
        }
        contentClassName="min-w-0"
      >
          {error ? (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <form
            className="grid min-w-0 gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gear-name">Name</Label>
              <Input
                id="gear-name"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gear-manufacturer">Manufacturer</Label>
              <Input
                id="gear-manufacturer"
                value={form.manufacturer}
                onChange={(event) =>
                  setForm({ ...form, manufacturer: event.target.value })
                }
                required
              />
            </div>
            <ValueAccordionSelect
              id="gear-type"
              label="Type"
              value={form.type}
              options={availableGearTypes}
              placeholder="e.g. preamp, mic, monitor"
              addLabel="Add Type"
              onChange={(nextValue) =>
                setForm({ ...form, type: nextValue })
              }
              onAdd={(nextValue) =>
                setCustomGearTypes((current) => mergeUniqueOptions(current, [nextValue]))
              }
            />
            <ValueAccordionSelect
              id="gear-group"
              label="Group"
              value={form.group}
              options={availableGearGroups}
              placeholder="e.g. outboard, monitoring"
              addLabel="Add Group"
              onChange={(nextValue) =>
                setForm({ ...form, group: nextValue })
              }
              onAdd={(nextValue) =>
                setCustomGearGroups((current) => mergeUniqueOptions(current, [nextValue]))
              }
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gear-price">Price (USD)</Label>
              <Input
                id="gear-price"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={form.price}
                onWheel={handleNumberInputWheel}
                onChange={(event) =>
                  setForm({ ...form, price: event.target.value })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gear-quantity">Quantity</Label>
              <Input
                id="gear-quantity"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={form.quantity}
                onWheel={handleNumberInputWheel}
                onChange={(event) =>
                  setForm({ ...form, quantity: event.target.value })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="gear-description">Description</Label>
              <Textarea
                id="gear-description"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                rows={3}
                required
              />
            </div>
            <div className="flex min-w-0 flex-col gap-3 sm:col-span-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gear-reverb-query">Reverb Pricing</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="gear-reverb-query"
                    value={pricingQuery}
                    onChange={(event) => setPricingQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleFetchPrices(event);
                      }
                    }}
                    placeholder={
                      defaultPricingQuery
                        ? `Leave blank to search "${defaultPricingQuery}"`
                        : "Enter Reverb priceguide search terms"
                    }
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleFetchPrices}
                    disabled={
                      priceGuideSearchMutation.isPending &&
                      !priceGuideSearchMutation.isIdle
                    }
                    className="align-middle flex gap-1 border border-black dark:border-white"
                  >
                    {priceGuideSearchMutation.isPending ? (
                      <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
                    ) : null}
                    Fetch Prices
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The table stays empty until you fetch. Selection uses each
                  price guide row&apos;s Reverb `price_high` and each listing row&apos;s
                  current listing price. The applied gear price is the average of
                  the selected rows.
                </p>
              </div>
              {pricingError ? (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {pricingError}
                </div>
              ) : null}
              <AdminDataTable
                data={priceGuideMatches}
                columns={priceGuideColumns}
                stateResetKey={priceGuideTableResetKey}
                footerControlsLayout="stacked-mobile"
                searchColumnId="search"
                searchPlaceholder="Search fetched prices..."
                emptyMessage="Fetch prices to load Reverb matches."
                initialSorting={[]}
                initialColumnVisibility={{ search: false }}
                initialColumnOrder={[
                  "selected",
                  "title",
                  "model",
                  "year",
                  "condition",
                  "categories",
                  "priceValue",
                  "search",
                ]}
                invisibleColumns={["search"]}
                columnLabels={{
                  selected: "use",
                  title: "title",
                  model: "model",
                  year: "year",
                  condition: "condition",
                  categories: "categories",
                  priceValue: "price",
                }}
                getRowClassName={(row) => {
                  const match = row.original;
                  const isSelected = selectedPriceGuideIds.includes(match.id);

                  return cn(
                    "cursor-pointer hover:bg-muted/50",
                    isSelected && "bg-muted",
                  );
                }}
                onRowClick={(match) => {
                  handleTogglePriceGuide(
                    match.id,
                    !selectedPriceGuideIds.includes(match.id),
                  );
                }}
                filterTabs={[
                  {
                    value: "model",
                    label: "Model",
                    render: (table) => (
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
                            active={
                              (table.getColumn("model")?.getFilterValue() ?? "") ===
                              model
                            }
                            label={model}
                            onToggle={() =>
                              table
                                .getColumn("model")
                                ?.setFilterValue(
                                  (table.getColumn("model")?.getFilterValue() ?? "") ===
                                    model
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
                    render: (table) => (
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
                            active={
                              (table.getColumn("year")?.getFilterValue() ?? "") === year
                            }
                            label={year}
                            onToggle={() =>
                              table
                                .getColumn("year")
                                ?.setFilterValue(
                                  (table.getColumn("year")?.getFilterValue() ?? "") ===
                                    year
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
                    render: (table) => (
                      <FilterTabPanel>
                        <SimpleFilterOption
                          active={
                            (table.getColumn("condition")?.getFilterValue() ?? "") === ""
                          }
                          label="All"
                          onToggle={() =>
                            table.getColumn("condition")?.setFilterValue("")
                          }
                        />
                        <Separator />
                        {availablePriceGuideConditions.map((condition) => (
                          <SimpleFilterOption
                            key={condition}
                            active={
                              (table.getColumn("condition")?.getFilterValue() ?? "") ===
                              condition
                            }
                            label={condition}
                            onToggle={() =>
                              table
                                .getColumn("condition")
                                ?.setFilterValue(
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
                    render: (table) => (
                      <FilterTabPanel>
                        <SimpleFilterOption
                          active={
                            (table.getColumn("categories")?.getFilterValue() ?? "") === ""
                          }
                          label="All"
                          onToggle={() =>
                            table.getColumn("categories")?.setFilterValue("")
                          }
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
                              table
                                .getColumn("categories")
                                ?.setFilterValue(
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
                ]}
              />
              <div className="flex min-w-0 flex-col gap-2 rounded-md border px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="text-muted-foreground">
                  {priceGuideMatches.length === 0
                    ? "No Reverb matches loaded."
                    : `${priceGuideMatches.length} match${
                        priceGuideMatches.length === 1 ? "" : "es"
                      } loaded. ${selectedPriceGuideCount} selected.`}
                </div>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="min-w-0 text-muted-foreground">
                    {selectedAveragePrice === null
                      ? selectedPriceGuideCount > 0
                        ? "Selected rows without a price are ignored in the average."
                        : "Select one or more rows to calculate the average."
                      : `Average price: ${formatCurrency(selectedAveragePrice)}`}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyAveragePrice}
                    disabled={selectedAveragePrice === null}
                    className="align-middle flex gap-1 border border-black dark:border-white dark:hover:bg-white dark:hover:text-black hover:bg-black hover:text-black"
                  >
                    Use Average
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                type="submit"
                size={"sm"}
                disabled={upsertMutation.isPending || !isFormComplete}
                className="flex w-full gap-1 border border-black align-middle dark:border-white hover:border-green-500 hover:bg-green-50 hover:text-green-500 dark:hover:bg-green-950/30 sm:w-auto"
              >
                {upsertMutation.isPending ? (
                  <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
                ) : isEditing ? (
                  <Save className="mr-2 !h-[16px] !w-[16px]" />
                ) : (
                  <Plus className="mr-2 !h-[16px] !w-[16px]" />
                )}
                {isEditing ? "Save Changes" : "Add Item"}
              </Button>
              {isEditing ? (
                <Button
                  size={"sm"}
                  onClick={handleClearForm}
                  disabled={upsertMutation.isPending}
                  className="flex w-full gap-1 border border-red-600 align-middle text-red-600 hover:bg-red-600/30 sm:w-auto" 
                >
                  <X className="mr-2 !h-[16px] !w-[16px]" />
                  Cancel
                </Button>
              ) : (
                <Button
                  size={"sm"}
                  onClick={handleClearForm}
                  disabled={upsertMutation.isPending}
                  className="flex w-full gap-1 border border-red-600 align-middle text-red-600 hover:bg-red-600/30 sm:w-auto" 
                >
                  <X className="mr-2 !h-[16px] !w-[16px]" />
                  Clear
                </Button>
              )}
            </div>
          </form>
      </SectionAccordionCard>

      <SectionAccordionCard
        value="inventory"
        title="Inventory"
        description={`${gear.length} item${gear.length === 1 ? "" : "s"}. Click a row to edit.`}
        contentClassName="min-w-0"
      >
          {gear.length === 0 ? (
            <p className="text-sm text-muted-foreground">No gear yet.</p>
          ) : (
            <AdminDataTable
              data={gear}
              columns={inventoryColumns}
              footerControlsLayout="stacked-mobile"
              searchColumnId="search"
              searchPlaceholder="Search gear..."
              emptyMessage="No results."
              initialSorting={[{ id: "name", desc: false }]}
              initialColumnVisibility={{ search: false, added: false }}
              initialColumnOrder={[
                "added",
                "name",
                "description",
                "manufacturer",
                "type",
                "group",
                "price",
                "quantity",
                "search",
                "actions",
              ]}
              invisibleColumns={["search", "added"]}
              columnLabels={{
                name: "name",
                description: "description",
                manufacturer: "manufacturer",
                type: "type",
                group: "group",
                price: "price",
                quantity: "quantity",
              }}
              paginationStorageKey="admin-gear-inventory-pagination"
              getRowClassName={(row) =>
                form.id === row.original.id ? "bg-muted" : undefined
              }
              onRowClick={handleSelectRow}
              filterTabs={[
                {
                  value: "type",
                  label: "Type",
                  render: (table) => (
                    <FilterTabPanel>
                      <DropdownMenuCheckboxItem
                        side="right"
                        className={cn(
                          "h-[2.5em] w-full border-none pl-0 capitalize outline-none hover:bg-white hover:underline dark:hover:bg-black",
                          !hasActiveInventoryFilters(table) &&
                            "text-cyan-500 hover:text-cyan-500 dark:hover:text-cyan-500",
                        )}
                        checked={!hasActiveInventoryFilters(table)}
                        onCheckedChange={() => clearInventoryTableFilters(table)}
                      >
                        <Button type="button" className="p-0">
                          All
                        </Button>
                      </DropdownMenuCheckboxItem>
                      <Button
                        type="button"
                        className={cn(
                          "p-0 h-[2.5em] w-fit flex md:hover:underline hover:no-underline",
                          table.getColumn("added")?.getFilterValue() !== undefined &&
                            "text-cyan-500 dark:hover:text-cyan-500 hover:text-cyan-500",
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
                              <AccordionItem
                                key={`admin-gear-group-${group}`}
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
                                  <DropdownMenuCheckboxItem
                                    side="right"
                                    className="w-full border-none pl-0 capitalize outline-none hover:bg-white hover:underline dark:hover:bg-black"
                                    checked={
                                      (table.getColumn("group")?.getFilterValue() ?? "") ===
                                        group &&
                                      (table.getColumn("type")?.getFilterValue() ?? "") === ""
                                    }
                                    onCheckedChange={() => {
                                      const typeFilter =
                                        (table.getColumn("type")?.getFilterValue() ?? "") as
                                          string;
                                      const groupFilter =
                                        (table.getColumn("group")?.getFilterValue() ?? "") as
                                          string;

                                      if (groupFilter === group && typeFilter === "") {
                                        clearInventoryTableFilters(table);
                                      } else {
                                        resetInventoryFilters(table);
                                        table.setColumnFilters([
                                          { id: "group", value: group },
                                        ]);
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
                                        (table.getColumn("type")?.getFilterValue() ?? "") ===
                                          type
                                      }
                                      onCheckedChange={() => {
                                        const typeFilter =
                                          (table.getColumn("type")?.getFilterValue() ?? "") as
                                            string;
                                        const groupFilter =
                                          (table.getColumn("group")?.getFilterValue() ?? "") as
                                            string;

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
                  render: (table) => (
                    <FilterTabPanel>
                      <DropdownMenuCheckboxItem
                        side="right"
                        className={cn(
                          "h-[2.5em] w-full border-none pl-0 capitalize outline-none hover:bg-white hover:underline dark:hover:bg-black",
                          !hasActiveInventoryFilters(table) &&
                            "text-cyan-500 hover:text-cyan-500 dark:hover:text-cyan-500",
                        )}
                        checked={!hasActiveInventoryFilters(table)}
                        onCheckedChange={() => clearInventoryTableFilters(table)}
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
                                    <DropdownMenuCheckboxItem
                                      side="right"
                                      key={manufacturer}
                                      className={cn(
                                        "w-full border-none pl-0 capitalize outline-none hover:bg-white hover:underline dark:hover:bg-black",
                                        (table.getColumn("manufacturer")?.getFilterValue() ??
                                          "") === manufacturer &&
                                          "text-cyan-500 hover:text-cyan-500 dark:hover:text-cyan-500",
                                      )}
                                      checked={
                                        (table.getColumn("manufacturer")?.getFilterValue() ??
                                          "") === manufacturer
                                      }
                                      onCheckedChange={() => {
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
              ]}
            />
          )}
      </SectionAccordionCard>

      <SectionAccordionCard
        value="taxonomy"
        title="Manage Types & Groups"
        description="Add new values, rename existing ones across the current gear inventory, or delete unused custom values."
        contentClassName="min-w-0"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border p-4">
            <div className="mb-3">
              <div className="text-sm font-medium">Types</div>
              <div className="text-xs text-muted-foreground">
                Add a new type, rename an existing one everywhere it is used, or delete an unused custom type.
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <ValueAccordionSelect
                id="rename-gear-type"
                label="Current Type"
                value={typeRenameTarget}
                options={availableGearTypes}
                placeholder="Choose a type to rename"
                onChange={(nextValue) => {
                  setTypeRenameTarget(nextValue);
                  setTypeRenameValue(nextValue);
                }}
              />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rename-gear-type-value">New Type Name</Label>
                <Input
                  id="rename-gear-type-value"
                  value={typeRenameValue}
                  onChange={(event) => setTypeRenameValue(event.target.value)}
                  placeholder="Enter the renamed type"
                />
              </div>
              <Button
                type="button"
                onClick={() => void handleRenameFacet("type")}
                disabled={
                  !isTypeRenameValid ||
                  (renameFacetMutation.isPending &&
                    renameFacetMutation.variables?.field === "type")
                }
                className="w-full sm:w-fit border border-violet-500 text-violet-500 hover:bg-violet-800/30"
              >
                {renameFacetMutation.isPending &&
                renameFacetMutation.variables?.field === "type" ? (
                  <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
                ) : (
                  <Save className="mr-2 !h-[16px] !w-[16px]" />
                )}
                Rename Type
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDeleteFacet("type")}
                disabled={typeRenameTarget.trim() === "" || selectedTypeUsageCount > 0}
                className="w-full sm:w-fit border border-red-500 text-red-500 hover:bg-red-800/30"
              >
                <Trash2 className="mr-2 !h-[16px] !w-[16px]" />
                Delete Type
              </Button>
              <div className="text-xs text-muted-foreground">
                {selectedTypeUsageCount > 0
                  ? "This type is currently used by gear items, so rename it instead of deleting it."
                  : "Unused custom types can be deleted here."}
              </div>
              <Separator />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-gear-type-value">Add New Type</Label>
                <Input
                  id="new-gear-type-value"
                  value={newTypeValue}
                  onChange={(event) => setNewTypeValue(event.target.value)}
                  placeholder="Enter a new type"
                />
              </div>
              <Button
                type="button"
                onClick={() => handleAddFacet("type")}
                disabled={!newTypeValue.trim()}
                className="w-full sm:w-fit border border-green-500 text-green-500 hover:bg-green-800/30"
              >
                <Plus className="mr-2 !h-[16px] !w-[16px]" />
                Add Type
              </Button>
            </div>
          </div>
          <div className="rounded-md border p-4">
            <div className="mb-3">
              <div className="text-sm font-medium">Groups</div>
              <div className="text-xs text-muted-foreground">
                Add a new group, rename an existing one everywhere it is used, or delete an unused custom group.
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <ValueAccordionSelect
                id="rename-gear-group"
                label="Current Group"
                value={groupRenameTarget}
                options={availableGearGroups}
                placeholder="Choose a group to rename"
                onChange={(nextValue) => {
                  setGroupRenameTarget(nextValue);
                  setGroupRenameValue(nextValue);
                }}
              />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rename-gear-group-value">New Group Name</Label>
                <Input
                  id="rename-gear-group-value"
                  value={groupRenameValue}
                  onChange={(event) => setGroupRenameValue(event.target.value)}
                  placeholder="Enter the renamed group"
                />
              </div>
              <Button
                type="button"
                onClick={() => void handleRenameFacet("group")}
                disabled={
                  !isGroupRenameValid ||
                  (renameFacetMutation.isPending &&
                    renameFacetMutation.variables?.field === "group")
                }
                className="w-full sm:w-fit  border border-violet-500 text-violet-500 hover:bg-violet-800/30"
              >
                {renameFacetMutation.isPending &&
                renameFacetMutation.variables?.field === "group" ? (
                  <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
                ) : (
                  <Save className="mr-2 !h-[16px] !w-[16px]" />
                )}
                Rename Group
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDeleteFacet("group")}
                disabled={groupRenameTarget.trim() === "" || selectedGroupUsageCount > 0}
                className="w-full sm:w-fit border border-red-500 text-red-500 hover:bg-red-800/30"
              >
                <Trash2 className="mr-2 !h-[16px] !w-[16px]" />
                Delete Group
              </Button>
              <div className="text-xs text-muted-foreground">
                {selectedGroupUsageCount > 0
                  ? "This group is currently used by gear items, so rename it instead of deleting it."
                  : "Unused custom groups can be deleted here."}
              </div>
              <Separator />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-gear-group-value">Add New Group</Label>
                <Input
                  id="new-gear-group-value"
                  value={newGroupValue}
                  onChange={(event) => setNewGroupValue(event.target.value)}
                  placeholder="Enter a new group"
                />
              </div>
              <Button
                type="button"
                onClick={() => handleAddFacet("group")}
                disabled={!newGroupValue.trim()}
                className="w-full sm:w-fit border border-green-500 text-green-500 hover:bg-green-800/30"
              >
                <Plus className="mr-2 !h-[16px] !w-[16px]" />
                Add Group
              </Button>
            </div>
          </div>
        </div>
      </SectionAccordionCard>
    </Accordion>
  );
}
