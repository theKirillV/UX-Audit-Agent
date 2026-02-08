import { getProject } from "@/actions/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ScanEye } from "lucide-react";
import Link from "next/link";

function statusColor(status: string) {
  switch (status) {
    case "complete": return "default" as const;
    case "processing": return "secondary" as const;
    case "error": return "destructive" as const;
    default: return "outline" as const;
  }
}

function scoreColor(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Run an Audit</h2>
        <div className="flex flex-wrap gap-3">
          <Link href={`/audit/accessibility?projectId=${project.id}`}>
            <Button variant="outline">
              <ScanEye className="mr-2 h-4 w-4" />
              Accessibility Audit
            </Button>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Past Audits</h2>
        {project.audits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No audits yet. Run your first audit above.
          </p>
        ) : (
          <div className="space-y-3">
            {project.audits.map((audit) => (
              <Card key={audit.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
                  <CardTitle className="text-sm font-medium capitalize">
                    {audit.type.replace("-", " ")} Audit
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {audit.score !== null && (
                      <span className={`text-sm font-bold ${scoreColor(audit.score)}`}>
                        {audit.score}/100
                      </span>
                    )}
                    <Badge variant={statusColor(audit.status)}>
                      {audit.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <p className="text-xs text-muted-foreground">
                    {new Date(audit.createdAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
