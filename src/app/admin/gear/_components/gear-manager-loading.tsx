import { Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export function GearManagerLoading() {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Loading Gear Tools</CardTitle>
        <CardDescription>
          Pulling the latest inventory, summary, and admin controls.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-[16rem] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="!h-[16px] !w-[16px] animate-spin" />
          Loading gear manager…
        </div>
      </CardContent>
    </Card>
  );
}
