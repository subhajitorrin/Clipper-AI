import os
import time
import shutil
import traceback
from config import settings
from services.ffmpeg_utils import get_bin_dir

# Ensure worker/bin is in the system PATH for yt-dlp & child processes
bin_dir = get_bin_dir()
if bin_dir not in os.environ.get("PATH", ""):
    os.environ["PATH"] = bin_dir + os.pathsep + os.environ.get("PATH", "")

from services.downloader import Downloader
from services.transcriber import Transcriber
from services.analyzer import Analyzer
from services.video_editor import VideoEditor
from services.caption_generator import CaptionGenerator
from services.supabase_service import SupabaseService

def process_job(job: dict, db: SupabaseService, transcriber: Transcriber, analyzer: Analyzer):
    job_id = job["id"]
    video_url = job.get("video_url")
    clip_duration = job.get("clip_duration", 45)
    requested_clips = job.get("requested_clips", 3)
    job_temp_dir = os.path.join(settings.temp_dir, job_id)
    os.makedirs(job_temp_dir, exist_ok=True)

    print(f"\n🚀 Processing Job {job_id} for URL: {video_url}")

    try:
        # Step 1: Download Audio Stream Only
        db.update_progress(job_id, "audio", 25)
        audio_path = os.path.join(job_temp_dir, "audio.mp3")
        print("  [1/4] Extracting audio stream...")
        Downloader.download_audio(video_url, audio_path)

        # Step 2: Transcribe via Deepgram Nova-2
        db.update_progress(job_id, "transcribing", 50)
        print("  [2/4] Transcribing with Deepgram Nova-2...")
        transcript_data = transcriber.transcribe(audio_path)
        transcript = transcript_data["transcript"]
        words = transcript_data["words"]

        # Step 3: Analyze Moments via OpenAI gpt-4o-mini
        db.update_progress(job_id, "moments", 75)
        print("  [3/4] Detecting viral moments with gpt-4o-mini...")
        moments = analyzer.detect_moments(transcript, words, clip_duration, requested_clips)

        # Step 4: Download Sections & Render 9:16 Vertical Clips
        total_moments = len(moments)
        db.update_progress(job_id, "rendering", 75, metadata={
            "total_clips": total_moments,
            "current_clip_index": 0,
            "current_clip_title": moments[0]["title"] if total_moments > 0 else "",
            "step_description": f"Preparing {total_moments} viral clips..."
        })
        print(f"  [4/4] Cutting & rendering {total_moments} vertical clips...")

        for i, moment in enumerate(moments):
            clip_num = i + 1
            clip_title = moment.get("title", f"Clip {clip_num}")
            print(f"  -> Processing clip {clip_num}/{total_moments}: '{clip_title}' ({moment['start_time']}s - {moment['end_time']}s)")
            
            # Update progress: downloading
            progress_val = int(75 + ((i + 0.2) / total_moments) * 20)
            db.update_progress(job_id, "rendering", progress_val, metadata={
                "total_clips": total_moments,
                "current_clip_index": clip_num,
                "current_clip_title": clip_title,
                "current_clip_stage": "downloading",
                "step_description": f"Downloading clip {clip_num} of {total_moments}: \"{clip_title}\""
            })

            raw_section_path = os.path.join(job_temp_dir, f"raw_clip_{i}.mp4")
            vertical_clip_path = os.path.join(job_temp_dir, f"clip_{i}.mp4")
            thumbnail_clip_path = os.path.join(job_temp_dir, f"thumb_{i}.jpg")
            subtitle_ass_path = os.path.join(job_temp_dir, f"clip_{i}.ass")

            # Zero-storage: only download the exact chunk
            Downloader.download_section(video_url, moment["start_time"], moment["end_time"], raw_section_path)

            # Generate dynamic word-by-word karaoke ASS captions
            try:
                CaptionGenerator.generate_ass(
                    words=words,
                    clip_start=moment["start_time"],
                    clip_end=moment["end_time"],
                    output_ass_path=subtitle_ass_path,
                    style_preset="HormoziYellow"
                )
            except Exception as ce:
                print(f"Caption generation warning: {ce}")
                subtitle_ass_path = None
            
            # Update progress: rendering vertical 9:16
            progress_val = int(75 + ((i + 0.6) / total_moments) * 20)
            db.update_progress(job_id, "rendering", progress_val, metadata={
                "total_clips": total_moments,
                "current_clip_index": clip_num,
                "current_clip_title": clip_title,
                "current_clip_stage": "rendering",
                "step_description": f"Reframing & rendering clip {clip_num} of {total_moments} with dynamic captions..."
            })
            VideoEditor.render_vertical_clip(raw_section_path, vertical_clip_path, subtitle_path=subtitle_ass_path)

            # Generate high-quality 9:16 video thumbnail frame
            try:
                VideoEditor.extract_thumbnail(vertical_clip_path, thumbnail_clip_path, timestamp=1.0)
            except Exception as te:
                print(f"Thumbnail generation warning: {te}")

            # Upload clip and record to Supabase
            progress_val = int(75 + ((i + 0.9) / total_moments) * 20)
            db.update_progress(job_id, "rendering", progress_val, metadata={
                "total_clips": total_moments,
                "current_clip_index": clip_num,
                "current_clip_title": clip_title,
                "current_clip_stage": "uploading",
                "step_description": f"Saving & uploading clip {clip_num} of {total_moments}..."
            })
            db.upload_clip(job_id, vertical_clip_path, moment, thumbnail_path=thumbnail_clip_path)

        db.complete_job(job_id)
        print(f"🎉 Job {job_id} completed successfully!")

    except Exception as e:
        print(f"❌ Job {job_id} failed: {e}")
        traceback.print_exc()
        db.fail_job(job_id, str(e))
    finally:
        # Wipe all local temp files
        shutil.rmtree(job_temp_dir, ignore_errors=True)

def main():
    print("=== ClipForge AI Worker Started (Listening for jobs) ===")
    db = SupabaseService()
    transcriber = Transcriber()
    analyzer = Analyzer()

    while True:
        try:
            job = db.fetch_pending_job()
            if job:
                process_job(job, db, transcriber, analyzer)
            else:
                time.sleep(settings.poll_interval)
        except KeyboardInterrupt:
            print("\nWorker stopped by user.")
            break
        except Exception as e:
            print(f"Worker polling loop error: {e}")
            time.sleep(settings.poll_interval)

if __name__ == "__main__":
    main()
