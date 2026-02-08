"use client";

import { useEffect, useRef, useState } from "react";
import type { AccessibilityIssue } from "@/lib/prompts/accessibility";
import { cn } from "@/lib/utils";

interface ScreenshotViewerProps {
  imageUrl: string;
  issues: AccessibilityIssue[];
  selectedIssueIndex: number | null;
  onSelectIssue: (index: number) => void;
}

function severityMarkerColor(severity: string) {
  switch (severity) {
    case "critical": return "bg-red-600 border-red-800 text-white";
    case "major": return "bg-amber-500 border-amber-700 text-black";
    default: return "bg-blue-500 border-blue-700 text-white";
  }
}

export function ScreenshotViewer({
  imageUrl,
  issues,
  selectedIssueIndex,
  onSelectIssue,
}: ScreenshotViewerProps) {
  const [zoom, setZoom] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Scroll to selected marker
  useEffect(() => {
    if (selectedIssueIndex === null) return;
    const marker = markerRefs.current.get(selectedIssueIndex);
    const container = scrollContainerRef.current;
    if (!marker || !container) return;

    const markerRect = marker.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const isVisible =
      markerRect.top >= containerRect.top &&
      markerRect.bottom <= containerRect.bottom &&
      markerRect.left >= containerRect.left &&
      markerRect.right <= containerRect.right;

    if (!isVisible) {
      marker.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  }, [selectedIssueIndex]);

  return (
    <div className="sticky top-0 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          className="rounded border px-2 py-0.5 text-xs hover:bg-accent"
        >
          -
        </button>
        <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
          className="rounded border px-2 py-0.5 text-xs hover:bg-accent"
        >
          +
        </button>
        <button
          onClick={() => setZoom(1)}
          className="rounded border px-2 py-0.5 text-xs hover:bg-accent"
        >
          Reset
        </button>
      </div>
      <div
        ref={scrollContainerRef}
        className="overflow-auto rounded-lg border bg-muted/30"
      >
        <div
          className="relative"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Screenshot being audited"
            className="block max-w-full h-auto"
          />
          {issues.map((issue, i) => (
            <button
              key={i}
              ref={(el) => {
                if (el) markerRefs.current.set(i, el);
                else markerRefs.current.delete(i);
              }}
              onClick={() => onSelectIssue(i)}
              className={cn(
                "absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg transition-transform hover:scale-125",
                severityMarkerColor(issue.severity),
                selectedIssueIndex === i && "ring-2 ring-white ring-offset-2 ring-offset-background scale-125"
              )}
              style={{
                left: `${issue.locationPercentX}%`,
                top: `${issue.locationPercentY}%`,
              }}
              title={issue.title}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
