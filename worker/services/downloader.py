import os
import yt_dlp
from services.ffmpeg_utils import get_bin_dir

class Downloader:
    @staticmethod
    def download_audio(youtube_url: str, output_path: str) -> str:
        """Downloads audio as lightweight mp3 using local ffmpeg/ffprobe binaries."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        ffmpeg_dir = get_bin_dir()

        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_path.replace('.mp3', ''),
            'ffmpeg_location': ffmpeg_dir,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '128',
            }],
            'quiet': False,
            'no_warnings': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])
        return output_path

    @staticmethod
    def download_section(youtube_url: str, start_time: float, end_time: float, output_path: str) -> str:
        """Downloads ONLY the specified clip section in 1080p/best video format."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        ffmpeg_dir = get_bin_dir()

        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': output_path,
            'ffmpeg_location': ffmpeg_dir,
            'download_ranges': yt_dlp.utils.download_range_func(None, [(start_time, end_time)]),
            'force_keyframes_at_cuts': True,
            'quiet': False,
            'no_warnings': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])
        return output_path
