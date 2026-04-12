"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type GearManagerBoundaryProps = {
  children: React.ReactNode;
};

type GearManagerBoundaryState = {
  error: Error | null;
  resetCount: number;
};

class GearManagerBoundaryInner extends React.Component<
  GearManagerBoundaryProps & { onRefresh: () => void },
  GearManagerBoundaryState
> {
  state: GearManagerBoundaryState = {
    error: null,
    resetCount: 0,
  };

  static getDerivedStateFromError(error: Error): GearManagerBoundaryState {
    return {
      error,
      resetCount: 0,
    };
  }

  componentDidCatch(error: Error) {
    console.error("GearManagerBoundary", error);
  }

  handleReset = () => {
    this.setState((current) => ({
      error: null,
      resetCount: current.resetCount + 1,
    }));
    this.props.onRefresh();
  };

  render() {
    if (this.state.error) {
      return (
        <Card className="min-w-0 border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="!h-[16px] !w-[16px]" />
              Gear Tools Crashed
            </CardTitle>
            <CardDescription>
              The rest of the page is still available. Reset this section to try
              the gear tools again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm text-destructive">
              {this.state.error.message || "An unexpected error occurred."}
            </div>
            <Button
              type="button"
              onClick={this.handleReset}
              className="border border-black dark:border-white"
            >
              <RefreshCw className="mr-2 !h-[16px] !w-[16px]" />
              Reset Gear Tools
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <React.Fragment key={this.state.resetCount}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

export function GearManagerBoundary({
  children,
}: GearManagerBoundaryProps) {
  const router = useRouter();

  return (
    <GearManagerBoundaryInner
      onRefresh={() => router.refresh()}
    >
      {children}
    </GearManagerBoundaryInner>
  );
}
