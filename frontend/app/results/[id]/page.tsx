"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/src/components/layout/AppShell";
import { ClipGallery } from "@/src/components/results/ClipGallery";
import { fetchProjectById, fetchClipsByJobId } from "@/src/lib/api";
import { ProjectJob, GeneratedClip } from "@/src/types";
import { ArrowLeft, Loader2 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ResultsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [project, setProject] = useState<ProjectJob | null>(null);
  const [clips, setClips] = useState<GeneratedClip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchProjectById(resolvedParams.id),
      fetchClipsByJobId(resolvedParams.id),
    ]).then(([projData, clipData]) => {
      if (mounted) {
        setProject(projData);
        setClips(clipData);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <AppShell title="Results" subtitle="Loading clips...">
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          <span className="text-xs text-[#737373]">Loading generated shorts...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Results & Shorts"
      subtitle={project?.title || "Project Shorts"}
    >
      <div className="space-y-6">
        {/* Back Link and Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#737373] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {project?.title || "Generated Shorts"}
          </h2>
          <p className="text-xs text-[#737373] mt-1">
            Target duration: {project?.clip_duration === 0 ? "Auto (Natural Length)" : `${project?.clip_duration || 45}s`} • {clips.length} clips generated
          </p>
        </div>

        {/* Gallery */}
        <ClipGallery clips={clips} projectTitle={project?.title || "Shorts"} />
      </div>
    </AppShell>
  );
}
