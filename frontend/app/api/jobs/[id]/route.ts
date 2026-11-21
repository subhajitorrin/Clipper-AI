import { NextResponse } from "next/server";
import { JobsService } from "@/src/services/jobs.service";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const [job, clips] = await Promise.all([
      JobsService.getJobById(id),
      JobsService.getClipsByJobId(id),
    ]);

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        job,
        clips,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch job details" },
      { status: 500 }
    );
  }
}
