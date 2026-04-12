"use client";

import * as React from "react";
import { AlertCircle, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import type { GearItem, GearServiceLog, ServiceLogFormState } from "./gear-manager-types";

interface GearServiceLogSectionProps {
  item: GearItem;
  serviceLogError: string | null;
  isServiceLogEditorOpen: boolean;
  serviceLogForm: ServiceLogFormState;
  setServiceLogForm: React.Dispatch<React.SetStateAction<ServiceLogFormState>>;
  canAddServiceLog: boolean;
  isEditingServiceLog: boolean;
  addServiceLogMutation: {
    isPending: boolean;
  };
  updateServiceLogMutation: {
    isPending: boolean;
  };
  deleteServiceLogMutation: {
    isPending: boolean;
    mutateAsync: (input: { id: string }) => Promise<unknown>;
  };
  handleSaveServiceLog: () => Promise<void>;
  resetServiceLogEditor: () => void;
  openNewServiceLogEditor: () => void;
  openEditServiceLogEditor: (serviceLog: GearServiceLog) => void;
}

export const GearServiceLogSection = React.memo(function GearServiceLogSection({
  item,
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
}: GearServiceLogSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">Service / Maintenance Log</div>
        <div className="text-xs text-muted-foreground">
          Track repairs, tube swaps, recaps, calibration, warranty dates, and
          service notes for this item.
        </div>
      </div>

      {serviceLogError ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serviceLogError}
        </div>
      ) : null}

      {isServiceLogEditorOpen ? (
        <div className="rounded-md border bg-muted/10 p-3">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(10rem,0.55fr)_minmax(10rem,0.55fr)]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`service-type-${item.id}`}>Service Type</Label>
              <Input
                id={`service-type-${item.id}`}
                value={serviceLogForm.serviceType}
                onChange={(event) =>
                  setServiceLogForm((current) => ({
                    ...current,
                    serviceType: event.target.value,
                  }))
                }
                placeholder="e.g. Tube swap"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`service-date-${item.id}`}>Service Date</Label>
              <Input
                id={`service-date-${item.id}`}
                type="date"
                value={serviceLogForm.serviceDate}
                onChange={(event) =>
                  setServiceLogForm((current) => ({
                    ...current,
                    serviceDate: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`warranty-until-${item.id}`}>Warranty Until</Label>
              <Input
                id={`warranty-until-${item.id}`}
                type="date"
                value={serviceLogForm.warrantyUntil}
                onChange={(event) =>
                  setServiceLogForm((current) => ({
                    ...current,
                    warrantyUntil: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            <Label htmlFor={`service-notes-${item.id}`}>Notes</Label>
            <Textarea
              id={`service-notes-${item.id}`}
              rows={3}
              value={serviceLogForm.notes}
              onChange={(event) =>
                setServiceLogForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Describe the service, repair, calibration, or warranty note..."
            />
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              size="sm"
              disabled={
                !canAddServiceLog ||
                addServiceLogMutation.isPending ||
                updateServiceLogMutation.isPending
              }
              onClick={() => void handleSaveServiceLog()}
              className="w-full border border-black dark:border-white sm:w-auto"
            >
              {addServiceLogMutation.isPending || updateServiceLogMutation.isPending ? (
                <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
              ) : isEditingServiceLog ? (
                <Save className="mr-2 !h-[16px] !w-[16px]" />
              ) : (
                <Plus className="mr-2 !h-[16px] !w-[16px]" />
              )}
              {isEditingServiceLog ? "Save Changes" : "Add Row"}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={addServiceLogMutation.isPending || updateServiceLogMutation.isPending}
              onClick={resetServiceLogEditor}
              className="w-full border border-red-600 text-red-600 hover:bg-red-600/30 sm:w-auto"
            >
              <X className="mr-2 !h-[16px] !w-[16px]" />
              {isEditingServiceLog ? "Cancel" : "Clear"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-max min-w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Service Type</TableHead>
              <TableHead className="whitespace-nowrap">Service Date</TableHead>
              <TableHead className="whitespace-nowrap">Warranty Until</TableHead>
              <TableHead className="min-w-[18rem] whitespace-nowrap">Notes</TableHead>
              <TableHead className="w-0 whitespace-nowrap" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {item.serviceLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="whitespace-normal text-muted-foreground">
                  <div className="flex items-start gap-2 py-1">
                    <AlertCircle className="mt-0.5 !h-[16px] !w-[16px] shrink-0" />
                    <span>No service history logged yet for this item.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              item.serviceLogs.map((serviceLog) => (
                <TableRow key={serviceLog.id} className="group align-top">
                  <TableCell className="whitespace-nowrap font-medium">
                    {serviceLog.serviceType}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {serviceLog.serviceDate}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {serviceLog.warrantyUntil || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="max-w-[28rem] truncate" title={serviceLog.notes || "—"}>
                      {serviceLog.notes || "—"}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right align-middle">
                    <div className="flex justify-end">
                      <div className="pointer-events-none inline-flex items-center gap-1 rounded-md border bg-background/95 p-1 opacity-0 shadow-sm transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={
                            deleteServiceLogMutation.isPending ||
                            addServiceLogMutation.isPending ||
                            updateServiceLogMutation.isPending
                          }
                          onClick={() => openEditServiceLogEditor(serviceLog)}
                          className="h-7 px-2"
                        >
                          <Pencil className="mr-1 !h-[16px] !w-[16px]" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={deleteServiceLogMutation.isPending}
                          onClick={() =>
                            void deleteServiceLogMutation.mutateAsync({ id: serviceLog.id })
                          }
                          className="h-7 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="mr-1 !h-[16px] !w-[16px]" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </table>
      </div>

      <div className="flex justify-start">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openNewServiceLogEditor}
          className="border border-black dark:border-white"
        >
          <Plus className="mr-2 !h-[16px] !w-[16px]" />
          Add Row
        </Button>
      </div>
    </div>
  );
});

