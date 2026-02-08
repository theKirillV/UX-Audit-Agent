"use client";

import { useEffect, useRef, useState } from "react";
import type { AccessibilityIssue } from "@/lib/prompts/accessibility";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ScreenshotViewerProps {
  imageUrl: string;
  issues: AccessibilityIssue[];
  selectedIssueIndex: number | null;
  onSelectIssue: (index: number) => void;
}

function severityMarkerColor(severity: string) {
  switch (severity) {
    case "critical": return "bg-red-500 border-red-700";
    case "major": return "bg-yellow-500 border-yellow-700";
    default: return "bg-blue-500 border-blue-700";
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
        style={{ maxHeight: "70vh" }}
      >
        <div className="relative inline-block" style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
          <Image
            src={imageUrl}
            alt="Screenshot being audited"
            width={1200}
            height={800}
            className="block max-w-none"
            unoptimized
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
                "absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[10px] font-bold text-white shadow-md transition-transform hover:scale-125",
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
