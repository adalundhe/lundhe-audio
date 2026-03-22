"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

type RouteTransitionOverlayProps = {
  title?: string;
  description?: string;
};

const AUDIO_LOADING_LINES = [
  {
    title: "Recalling the Session",
    description: "Pulling the last set of mix notes into place.",
  },
  {
    title: "Checking the Low End",
    description: "Making sure the kick and bass are still behaving.",
  },
  {
    title: "Patching the Rack",
    description: "Routing a few extra cables through the outboard chain.",
  },
  {
    title: "Soloing the Vocal",
    description: "Giving the lead one more pass before the page lands.",
  },
  {
    title: "Printing a Bounce",
    description: "Rendering a cleaner pass for the next screen.",
  },
  {
    title: "Aligning the Phase",
    description: "Keeping the transients tight while we switch views.",
  },
  {
    title: "Level-Matching References",
    description: "Making sure the next page hits at the right level.",
  },
  {
    title: "Taming the Resonances",
    description: "Sweeping for anything harsh before the transition finishes.",
  },
  {
    title: "Warming the Mix Bus",
    description: "Letting the glue settle in for a second.",
  },
  {
    title: "Trimming the Silence",
    description: "Cleaning the edges before we roll into the next take.",
  },
  {
    title: "Labeling the Stems",
    description: "Keeping the session tidy while the route catches up.",
  },
  {
    title: "Setting the Meters",
    description: "Watching the peaks while the next page comes online.",
  },
] as const;

export function RouteTransitionOverlay({
  title,
  description,
}: RouteTransitionOverlayProps) {
  const [activeLineIndex, setActiveLineIndex] = React.useState(0);

  React.useEffect(() => {
    if (title && description) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveLineIndex(
        (currentIndex) => (currentIndex + 1) % AUDIO_LOADING_LINES.length,
      );
    }, 1600);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [description, title]);

  const activeLine =
    AUDIO_LOADING_LINES[activeLineIndex] ?? AUDIO_LOADING_LINES[0];
  const displayedTitle = title ?? activeLine?.title ?? "Loading";
  const displayedDescription =
    description ?? activeLine?.description ?? "Preparing the next page.";

  return (
    <div className="bg-background/78 fixed inset-0 z-[120] flex items-center justify-center px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm border border-border bg-background/95 px-8 py-7 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-border bg-muted/40">
            <Loader2 className="!h-6 !w-6 animate-spin text-foreground/80" />
          </div>
          <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
            Patching the cables!
          </p>
          <h2 className="mt-3 text-lg font-medium">{displayedTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {displayedDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
