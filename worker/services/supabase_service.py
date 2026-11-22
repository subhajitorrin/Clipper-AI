import os
from supabase import create_client, Client
from config import settings

class SupabaseService:
    def __init__(self):
        self.supabase: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)

    def fetch_pending_job(self):
        """Finds next pending job and claims it."""
        res = self.supabase.table("jobs").select("*").eq("status", "pending").order("created_at", desc=False).limit(1).execute()
        if res.data and len(res.data) > 0:
            job = res.data[0]
            # Lock it
            self.supabase.table("jobs").update({
                "status": "processing",
                "claimed_at": "now()",
                "worker_id": "python-worker-1"
            }).eq("id", job["id"]).execute()
            return job
        return None

    def update_progress(self, job_id: str, stage: str, progress: int, metadata: dict = None):
        """Updates real-time progress for frontend."""
        payload = {
            "current_stage": stage,
            "stage_progress": progress
        }
        if metadata is not None:
            payload["metadata"] = metadata
        self.supabase.table("jobs").update(payload).eq("id", job_id).execute()

    def complete_job(self, job_id: str):
        self.supabase.table("jobs").update({
            "status": "completed",
            "stage_progress": 100,
            "error_message": None
        }).eq("id", job_id).execute()

    def fail_job(self, job_id: str, error_message: str):
        self.supabase.table("jobs").update({
            "status": "failed",
            "error_message": error_message
        }).eq("id", job_id).execute()

    def upload_clip(self, job_id: str, clip_file_path: str, moment: dict, thumbnail_path: str = None) -> str:
        """Uploads clip to Supabase Storage and records clip in public.clips table."""
        filename = f"{job_id}/{os.path.basename(clip_file_path)}"
        with open(clip_file_path, "rb") as f:
            try:
                self.supabase.storage.from_(settings.storage_bucket).upload(
                    path=filename,
                    file=f,
                    file_options={"content-type": "video/mp4", "upsert": "true"}
                )
            except Exception as e:
                print(f"Storage note: {e}")

        output_url = self.supabase.storage.from_(settings.storage_bucket).get_public_url(filename)

        thumbnail_url = None
        if thumbnail_path and os.path.exists(thumbnail_path):
            thumb_filename = f"{job_id}/{os.path.basename(thumbnail_path)}"
            with open(thumbnail_path, "rb") as tf:
                try:
                    self.supabase.storage.from_(settings.storage_bucket).upload(
                        path=thumb_filename,
                        file=tf,
                        file_options={"content-type": "image/jpeg", "upsert": "true"}
                    )
                    thumbnail_url = self.supabase.storage.from_(settings.storage_bucket).get_public_url(thumb_filename)
                except Exception as e:
                    print(f"Thumbnail upload note: {e}")

        # Insert clip record
        self.supabase.table("clips").insert({
            "job_id": job_id,
            "title": moment["title"],
            "start_time": moment["start_time"],
            "end_time": moment["end_time"],
            "thumbnail_url": thumbnail_url,
            "output_url": output_url,
            "transcript": moment.get("hook_text", ""),
            "aspect_ratio": "9:16",
            "metadata": {"virality_score": moment.get("virality_score", 85)}
        }).execute()

        return output_url
