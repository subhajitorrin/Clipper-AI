import subprocess
import os
from services.ffmpeg_utils import get_ffmpeg_exe

class VideoEditor:
    @staticmethod
    def render_vertical_clip(input_video_path: str, output_clip_path: str, words_for_clip: list = None) -> str:
        """Crops 16:9 to centered 9:16 vertical video with smooth framing."""
        os.makedirs(os.path.dirname(output_clip_path), exist_ok=True)
        ffmpeg = get_ffmpeg_exe()

        # 9:16 center crop filter: crops width to (height * 9 / 16) and scales to standard 1080x1920
        vf_filter = "crop=ih*(9/16):ih:(iw-ow)/2:0,scale=1080:1920"

        cmd = [
            ffmpeg,
            "-y",
            "-i", input_video_path,
            "-vf", vf_filter,
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "128k",
            output_clip_path
        ]

        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg render error: {result.stderr[-500:]}")

        return output_clip_path

    @staticmethod
    def extract_thumbnail(video_path: str, thumbnail_path: str, timestamp: float = 1.0) -> str:
        """Extracts a high quality frame from the video as a thumbnail image."""
        os.makedirs(os.path.dirname(thumbnail_path), exist_ok=True)
        ffmpeg = get_ffmpeg_exe()

        cmd = [
            ffmpeg,
            "-y",
            "-ss", str(timestamp),
            "-i", video_path,
            "-vframes", "1",
            "-q:v", "2",
            thumbnail_path
        ]

        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if result.returncode != 0 or not os.path.exists(thumbnail_path):
            # Fallback to frame at start if timestamp was past end
            cmd[2] = "0.0"
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        return thumbnail_path
