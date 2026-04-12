"use client";

import * as React from "react";
import { ChevronDown, Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

const normalizeOptionValue = (value: string) => value.trim().toLocaleLowerCase();

export function ValueAccordionSelect({
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
}) {
  const [open, setOpen] = React.useState(false);
  const [draftValue, setDraftValue] = React.useState("");
  const canAdd = Boolean(addLabel && onAdd);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  const handleAdd = () => {
    const nextValue = draftValue.trim();
    if (!nextValue || !onAdd) {
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
}
