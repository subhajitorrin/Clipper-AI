"use client";

import { use, useEffect, useState } from "react";
import { AppShell } from "@/src/components/layout/AppShell";
import { ProcessingStatus } from "@/src/components/processing/ProcessingStatus";
import { fetchProjectById } from "@/src/lib/api";
import { ProjectJob } from "@/src/types";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProcessingPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [project, setProject] = useState<ProjectJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchProjectById(resolvedParams.id).then((data) => {
      if (mounted) {
        setProject(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <AppShell title="Processing" subtitle="Fetching job status...">
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          <span className="text-xs text-[#737373]">Loading processing state...</span>
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell title="Project Not Found">
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#292929] bg-[#171717] p-12 text-center">
          <p className="text-sm font-semibold text-white">Project not found</p>
          <p className="text-xs text-[#737373] mt-1 mb-4">
            The requested project ID does not exist or has expired.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-[#E5E5E5] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Processing Status"
      subtitle={`Job: ${project.id}`}
    >
      <ProcessingStatus initialProject={project} />
    </AppShell>
  );
}
