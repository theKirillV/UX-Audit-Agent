"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScreenshotUpload } from "@/components/upload/ScreenshotUpload";
import { AuditResults } from "@/components/audit/AuditResults";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, ScanEye } from "lucide-react";
import type { AccessibilityResult } from "@/lib/prompts/accessibility";

interface ProjectOption {
  id: string;
  name: string;
}

function AccessibilityAuditContent() {
  const searchParams = useSearchParams();
  const preselectedProjectId = searchParams.get("projectId");

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(preselectedProjectId ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AccessibilityResult | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { getProjects } = await import("@/actions/projects");
        const data = await getProjects();
        setProjects(data.map((p) => ({ id: p.id, name: p.name })));
        if (preselectedProjectId) setSelectedProjectId(preselectedProjectId);
      } catch {
        toast.error("Failed to load projects");
      } finally {
        setLoadingProjects(false);
      }
    }
    load();
  }, [preselectedProjectId]);

  async function handleCreateProject() {
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      const { createProject } = await import("@/actions/projects");
      const project = await createProject(newProjectName.trim());
      setProjects((prev) => [{ id: project.id, name: project.name }, ...prev]);
      setSelectedProjectId(project.id);
      setNewProjectName("");
      toast.success("Project created");
    } catch {
      toast.error("Failed to create project");
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleRunAudit() {
    if (!selectedProjectId || imageUrls.length === 0) return;

    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/audit/accessibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId, imageUrls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
      toast.success("Audit complete!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Audit failed");
    } finally {
      setRunning(false);
    }
  }

  if (result && imageUrls[0]) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Accessibility Audit Results</h1>
          <Button
            variant="outline"
            onClick={() => {
              setResult(null);
              setImageUrls([]);
            }}
          >
            Run Another Audit
          </Button>
        </div>
        <AuditResults result={result} imageUrl={imageUrls[0]} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Accessibility Audit</h1>
        <p className="text-sm text-muted-foreground">
          Upload a screenshot to check WCAG 2.1 AA compliance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Select Project</CardTitle>
          <CardDescription>Choose an existing project or create a new one</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingProjects ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">or</span>
                <Input
                  placeholder="New project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreateProject}
                  disabled={creatingProject || !newProjectName.trim()}
                >
                  {creatingProject ? "Creating..." : "Create"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Upload Screenshot</CardTitle>
          <CardDescription>
            Upload one or more screenshots of the UI to audit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScreenshotUpload
            onUploaded={(url) => setImageUrls((prev) => [...prev, url])}
            uploadedUrls={imageUrls}
            onRemove={(url) => setImageUrls((prev) => prev.filter((u) => u !== url))}
          />
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={handleRunAudit}
        disabled={!selectedProjectId || imageUrls.length === 0 || running}
      >
        {running ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running Audit (this may take 10-15s)...
          </>
        ) : (
          <>
            <ScanEye className="mr-2 h-4 w-4" />
            Run Accessibility Audit
          </>
        )}
      </Button>
    </div>
  );
}

export default function AccessibilityAuditPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      }
    >
      <AccessibilityAuditContent />
    </Suspense>
  );
}
