"use client";

import { ProjectJob } from "@/src/types";
import { ProjectRow } from "./ProjectRow";
import { Film } from "lucide-react";

interface RecentProjectsProps {
  projects: ProjectJob[];
  loading?: boolean;
}

export function RecentProjects({ projects, loading }: RecentProjectsProps) {
  if (loading) {
    return (
      <div className="space-y-3 pt-6" id="projects">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-[#202020] rounded-md animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 w-full rounded-xl border border-[#292929] bg-[#171717] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6" id="projects">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Recent Projects</h3>
          <p className="text-xs text-[#737373]">
            Track status, inspect progress, or view generated vertical shorts.
          </p>
        </div>
        <span className="text-xs text-[#737373]">
          {projects.length} {projects.length === 1 ? "project" : "projects"}
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#292929] bg-[#171717] p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#202020] text-[#737373] mb-3 border border-[#292929]">
            <Film className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-white">No projects created yet</p>
          <p className="text-xs text-[#737373] mt-1 max-w-xs">
            Paste a YouTube link or upload a video above to generate your first set of vertical clips.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {projects.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
