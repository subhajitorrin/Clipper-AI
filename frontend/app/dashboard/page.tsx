"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/src/components/layout/AppShell";
import { VideoInput } from "@/src/components/dashboard/VideoInput";
import { RecentProjects } from "@/src/components/dashboard/RecentProjects";
import { fetchProjects } from "@/src/lib/api";
import { ProjectJob } from "@/src/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchProjects().then((data) => {
      if (mounted) {
        setProjects(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell
      title="Dashboard"
      subtitle="Turn long-form videos into engaging shorts."
    >
      <div className="space-y-8">
        {/* Create New Clips Section */}
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Create New Clips</h2>
            <p className="text-xs text-[#737373] mt-0.5">
              Submit a YouTube video link or upload an MP4/MOV file to generate vertical clips automatically.
            </p>
          </div>
          <VideoInput />
        </section>

        {/* Recent Projects Section */}
        <section>
          <RecentProjects projects={projects} loading={loading} />
        </section>
      </div>
    </AppShell>
  );
}
