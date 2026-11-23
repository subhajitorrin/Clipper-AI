import subprocess
import os
from services.ffmpeg_utils import get_ffmpeg_exe

class VideoEditor:
    face_tracker = None

    @classmethod
    def get_face_tracker(cls):
        if cls.face_tracker is None:
            try:
                from services.face_tracker import FaceTracker
                cls.face_tracker = FaceTracker()
            except ImportError:
                cls.face_tracker = None
        return cls.face_tracker

    @staticmethod
    def render_vertical_clip(
        input_video_path: str,
        output_clip_path: str,
        subtitle_path: str = None
    ) -> str:
        """
        Reframes landscape video (16:9) to vertical 9:16 (1080x1920) by tracking the main character/speaker's
        face so they stay centered in the frame, and burns dynamic styled captions if subtitle_path is provided.
        """
        os.makedirs(os.path.dirname(output_clip_path), exist_ok=True)
        ffmpeg = get_ffmpeg_exe()

        crop_x_expr = "(iw-ow)/2" # Default to center

        try:
            tracker = VideoEditor.get_face_tracker()
            center_x = tracker.detect_crop_center(input_video_path)
            if center_x is not None:
                # Target crop width for 9:16 is ow = ih * (9 / 16)
                # To place center_x at the center of the crop:
                # crop_x = center_x - (ow / 2)
                # Bound between 0 and (iw - ow)
                crop_x_expr = f"'min(max(0,{center_x}-(ih*(9/16)/2)),iw-(ih*(9/16)))'"
                print(f"  [VideoEditor] Smart framing applied: center_x={center_x}")
        except Exception as e:
            print(f"  [VideoEditor] Face tracking warning ({e}), falling back to center crop.")
            crop_x_expr = "(iw-ow)/2"

        # 9:16 dynamic crop filter & scale to standard 1080x1920
        filters = [f"crop=ih*(9/16):ih:{crop_x_expr}:0", "scale=1080:1920"]

        # Add burned animated subtitles if available
        if subtitle_path and os.path.exists(subtitle_path) and os.path.getsize(subtitle_path) > 0:
            # Escape path special characters for FFmpeg filter syntax
            escaped_sub_path = subtitle_path.replace("\\", "/").replace(":", "\\:").replace("'", "\\'")
            filters.append(f"subtitles='{escaped_sub_path}'")
            print(f"  [VideoEditor] Burning dynamic word-level subtitles from: {os.path.basename(subtitle_path)}")

        vf_filter = ",".join(filters)

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
            # If subtitles filter failed (e.g. environment issue), retry cleanly without subtitles as graceful fallback
            if subtitle_path and "subtitles" in result.stderr:
                print("  [VideoEditor] Subtitles filter error, falling back to clean render without subtitles...")
                clean_filters = f"crop=ih*(9/16):ih:{crop_x_expr}:0,scale=1080:1920"
                cmd[4] = clean_filters
                retry_result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                if retry_result.returncode == 0:
                    return output_clip_path
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
