import { NextResponse } from "next/server";
import { JobsService } from "@/src/services/jobs.service";

export async function GET() {
  try {
    const jobs = await JobsService.getAllJobs();
    return NextResponse.json({ success: true, data: jobs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoUrl, videoPath, clipDuration, requestedClips } = body;

    if (!videoUrl && !videoPath) {
      return NextResponse.json(
        { success: false, error: "Either videoUrl or videoPath must be provided." },
        { status: 400 }
      );
    }

    const title = videoUrl
      ? `YouTube: ${videoUrl.replace(/^https?:\/\/(www\.)?/, "")}`
      : videoPath
      ? `Upload: ${videoPath}`
      : "New Video Clip Project";

    const newJob = await JobsService.createJob({
      title,
      videoUrl,
      videoPath,
      clipDuration: clipDuration || 45,
      requestedClips: requestedClips || 3,
    });

    return NextResponse.json({ success: true, data: newJob }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create job" },
      { status: 500 }
    );
  }
}
