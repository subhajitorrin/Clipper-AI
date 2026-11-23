import os
import time
import yt_dlp
from services.ffmpeg_utils import get_bin_dir

class Downloader:
    @staticmethod
    def download_audio(youtube_url: str, output_path: str) -> str:
        """Downloads audio as lightweight mp3 using local ffmpeg/ffprobe binaries with retry."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        ffmpeg_dir = get_bin_dir()

        # Format fallbacks
        format_candidates = [
            'ba/b',
            'bestaudio/best',
            'worstaudio/worst',
        ]

        last_err = None
        for attempt, fmt in enumerate(format_candidates):
            try:
                ydl_opts = {
                    'format': fmt,
                    'outtmpl': output_path.replace('.mp3', ''),
                    'ffmpeg_location': ffmpeg_dir,
                    'extractor_args': {
                        'youtube': {
                            'player_client': ['android', 'ios', 'web']
                        }
                    },
                    'http_headers': {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept-Language': 'en-US,en;q=0.9',
                    },
                    'postprocessors': [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'mp3',
                        'preferredquality': '64',
                    }],
                    'quiet': False,
                    'no_warnings': True,
                }
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([youtube_url])
                return output_path
            except Exception as e:
                last_err = e
                print(f"  [Downloader] Audio download attempt {attempt+1} failed with format '{fmt}': {e}. Retrying...")
                time.sleep(2)

        raise last_err

    @staticmethod
    def download_section(youtube_url: str, start_time: float, end_time: float, output_path: str, max_retries: int = 3) -> str:
        """
        Downloads ONLY the specified clip section.
        Uses resilient format fallback: 'bv*+ba/b' -> 'best' -> 'worst' to prevent
        'Requested format is not available' errors.
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        ffmpeg_dir = get_bin_dir()

        # Resilient format choices: start with best audio+video, fallback to best single file, or any available
        format_options = [
            'bv*+ba/b',
            'bestvideo+bestaudio/best',
            'best',
            'worstvideo*+worstaudio/worst'
        ]

        last_exception = None
        for attempt in range(max_retries):
            fmt = format_options[min(attempt, len(format_options) - 1)]
            ydl_opts = {
                'format': fmt,
                'outtmpl': output_path,
                'ffmpeg_location': ffmpeg_dir,
                'download_ranges': yt_dlp.utils.download_range_func(None, [(start_time, end_time)]),
                'force_keyframes_at_cuts': True,
                'extractor_args': {
                    'youtube': {
                        'player_client': ['android', 'ios', 'web']
                    }
                },
                'http_headers': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                'quiet': False,
                'no_warnings': True,
                'ignoreerrors': False,
            }

            try:
                print(f"  [Downloader] Downloading section ({start_time:.1f}s - {end_time:.1f}s) [attempt {attempt+1}/{max_retries}, format='{fmt}']...")
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([youtube_url])
                
                if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                    return output_path
                else:
                    raise RuntimeError(f"Section download produced empty file at {output_path}")

            except Exception as e:
                last_exception = e
                print(f"  [Downloader] Attempt {attempt+1} failed: {e}")
                time.sleep(2)

        raise last_exception

