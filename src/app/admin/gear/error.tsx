"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export default function AdminGearError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 px-4 sm:px-6">
      <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
        <h1 className="text-2xl font-semibold">Manage Gear</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          A route-level error was caught. Reset this page segment to try again.
        </p>
      </div>

      <Card className="min-w-0 border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="!h-[16px] !w-[16px]" />
            Gear Page Error
          </CardTitle>
          <CardDescription>
            This is the final fallback boundary for the `/admin/gear` route.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm text-destructive">
            {error.message || "An unexpected error occurred."}
          </div>
          <Button
            type="button"
            onClick={reset}
            className="border border-black dark:border-white"
          >
            <RefreshCw className="mr-2 !h-[16px] !w-[16px]" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
