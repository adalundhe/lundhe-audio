"use client";

import * as React from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";

interface GearTaxonomyFacetAccordionItemProps {
  value: string;
  title: string;
  description: string;
  selector: React.ReactNode;
  renameInputId: string;
  renameLabel: string;
  renameValue: string;
  renamePlaceholder: string;
  onRenameValueChange: (value: string) => void;
  onRename: () => void;
  renameDisabled: boolean;
  renamePending: boolean;
  renameButtonLabel: string;
  onDelete: () => void;
  deleteDisabled: boolean;
  deleteButtonLabel: string;
  helperText: string;
  newInputId: string;
  newLabel: string;
  newValue: string;
  newPlaceholder: string;
  onNewValueChange: (value: string) => void;
  onAdd: () => void;
  addDisabled: boolean;
  addButtonLabel: string;
}

export function GearTaxonomyFacetAccordionItem({
  value,
  title,
  description,
  selector,
  renameInputId,
  renameLabel,
  renameValue,
  renamePlaceholder,
  onRenameValueChange,
  onRename,
  renameDisabled,
  renamePending,
  renameButtonLabel,
  onDelete,
  deleteDisabled,
  deleteButtonLabel,
  helperText,
  newInputId,
  newLabel,
  newValue,
  newPlaceholder,
  onNewValueChange,
  onAdd,
  addDisabled,
  addButtonLabel,
}: GearTaxonomyFacetAccordionItemProps) {
  return (
    <AccordionItem value={value} className="overflow-hidden rounded-md border">
      <AccordionTrigger
        chevronSide="none"
        className="w-full justify-between px-4 py-4 hover:no-underline"
      >
        <div className="flex min-w-0 flex-col items-start gap-1 text-left">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-0 pt-0">
        <div className="flex min-w-0 flex-col gap-3 border-t px-4 py-4">
          {selector}
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor={renameInputId}>{renameLabel}</Label>
            <Input
              id={renameInputId}
              value={renameValue}
              onChange={(event) => onRenameValueChange(event.target.value)}
              placeholder={renamePlaceholder}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              onClick={onRename}
              disabled={renameDisabled}
              className="w-full border border-violet-500 text-violet-500 hover:bg-violet-800/30 sm:w-fit"
            >
              {renamePending ? (
                <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
              ) : (
                <Save className="mr-2 !h-[16px] !w-[16px]" />
              )}
              {renameButtonLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onDelete}
              disabled={deleteDisabled}
              className="w-full border border-red-500 text-red-500 hover:bg-red-800/30 sm:w-fit"
            >
              <Trash2 className="mr-2 !h-[16px] !w-[16px]" />
              {deleteButtonLabel}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">{helperText}</div>
          <Separator />
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor={newInputId}>{newLabel}</Label>
            <Input
              id={newInputId}
              value={newValue}
              onChange={(event) => onNewValueChange(event.target.value)}
              placeholder={newPlaceholder}
            />
          </div>
          <Button
            type="button"
            onClick={onAdd}
            disabled={addDisabled}
            className="w-full border border-green-500 text-green-500 hover:bg-green-800/30 sm:w-fit"
          >
            <Plus className="mr-2 !h-[16px] !w-[16px]" />
            {addButtonLabel}
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
