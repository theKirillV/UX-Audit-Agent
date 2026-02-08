"use client";

import { useEffect, useRef, useState } from "react";
import type { AccessibilityResult } from "@/lib/prompts/accessibility";
import { ScreenshotViewer } from "./ScreenshotViewer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

function scoreColorClass(score: number) {
  if (score >= 80) return "bg-green-600";
  if (score >= 50) return "bg-amber-600";
  return "bg-red-600";
}

function severityIcon(severity: string) {
  switch (severity) {
    case "critical": return <AlertCircle className="h-4 w-4 text-red-600" />;
    case "major": return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    default: return <Info className="h-4 w-4 text-blue-600" />;
  }
}

function severityBadgeVariant(severity: string) {
  switch (severity) {
    case "critical": return "destructive" as const;
    case "major": return "secondary" as const;
    default: return "outline" as const;
  }
}

function severityMarkerColor(severity: string) {
  switch (severity) {
    case "critical": return "bg-red-600 text-white";
    case "major": return "bg-amber-500 text-black";
    default: return "bg-blue-500 text-white";
  }
}

interface AuditResultsProps {
  result: AccessibilityResult;
  imageUrl: string;
}

// An issue with its original index in the array (used for marker numbering)
interface IndexedIssue {
  issue: AccessibilityResult["issues"][number];
  originalIndex: number;
}

export function AuditResults({ result, imageUrl }: AuditResultsProps) {
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Build indexed issues grouped by severity
  const indexed: IndexedIssue[] = result.issues.map((issue, i) => ({ issue, originalIndex: i }));
  const criticalIssues = indexed.filter((i) => i.issue.severity === "critical");
  const majorIssues = indexed.filter((i) => i.issue.severity === "major");
  const minorIssues = indexed.filter((i) => i.issue.severity === "minor");

  const sections = [
    { label: "Critical", issues: criticalIssues, defaultOpen: true },
    { label: "Major", issues: majorIssues, defaultOpen: true },
    { label: "Minor", issues: minorIssues, defaultOpen: false },
  ].filter((s) => s.issues.length > 0);

  // Scroll to selected card when marker is clicked
  useEffect(() => {
    if (selectedIssue === null) return;
    const card = cardRefs.current.get(selectedIssue);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedIssue]);

  return (
    <div className="flex gap-6">
      {/* Screenshot panel — 70% width */}
      <div className="w-[70%] shrink-0">
        <ScreenshotViewer
          imageUrl={imageUrl}
          issues={result.issues}
          selectedIssueIndex={selectedIssue}
          onSelectIssue={setSelectedIssue}
        />
      </div>

      {/* Results panel — 30% width */}
      <ScrollArea className="h-[calc(100vh-8rem)] w-[30%]">
        <div className="space-y-4 pr-3">
          {/* Score */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white",
                scoreColorClass(result.score)
              )}
            >
              {result.score}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold">Accessibility Score</h3>
              <p className="text-xs text-muted-foreground">{result.summary}</p>
            </div>
          </div>

          {/* Issue counts — plain text, not interactive */}
          <p className="text-xs text-muted-foreground">
            {[
              criticalIssues.length > 0 && `${criticalIssues.length} critical`,
              majorIssues.length > 0 && `${majorIssues.length} major`,
              minorIssues.length > 0 && `${minorIssues.length} minor`,
            ].filter(Boolean).join(" · ")}
            {" · "}{result.issues.length} total
          </p>

          {/* Grouped issues */}
          {sections.map((section) => (
            <Collapsible key={section.label} defaultOpen={section.defaultOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm font-medium hover:bg-muted">
                <span>
                  {section.label} ({section.issues.length})
                </span>
                <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 space-y-2">
                  {section.issues.map(({ issue, originalIndex }) => {
                    const markerNumber = originalIndex + 1;
                    return (
                      <Card
                        key={originalIndex}
                        ref={(el) => {
                          if (el) cardRefs.current.set(originalIndex, el);
                          else cardRefs.current.delete(originalIndex);
                        }}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-accent/50",
                          selectedIssue === originalIndex && "border-primary bg-accent/30"
                        )}
                        onClick={() => setSelectedIssue(originalIndex)}
                      >
                        <CardHeader className="space-y-0 pb-2 pt-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                                severityMarkerColor(issue.severity)
                              )}
                            >
                              {markerNumber}
                            </span>
                            {severityIcon(issue.severity)}
                            <CardTitle className="text-sm font-medium">
                              {issue.title}
                            </CardTitle>
                            <Badge
                              variant={severityBadgeVariant(issue.severity)}
                              className="ml-auto text-[10px]"
                            >
                              {issue.criterion}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-3 pt-0">
                          <p className="text-xs text-muted-foreground mb-1">
                            {issue.location}
                          </p>
                          <p className="text-sm mb-2">{issue.problem}</p>
                          <div className="rounded bg-muted/50 p-2">
                            <p className="text-xs font-medium text-muted-foreground mb-0.5">
                              Recommendation
                            </p>
                            <p className="text-sm">{issue.recommendation}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}

          {result.issues.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No accessibility issues found. Great job!
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
