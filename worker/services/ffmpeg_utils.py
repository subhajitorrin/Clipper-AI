import os
import shutil
import imageio_ffmpeg

def get_bin_dir() -> str:
    """Returns the path to the directory containing ffmpeg and ffprobe."""
    local_bin = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "bin"))
    if os.path.exists(os.path.join(local_bin, "ffmpeg.exe")):
        return local_bin
    
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return os.path.dirname(os.path.abspath(system_ffmpeg))
    
    return os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())

def get_ffmpeg_exe() -> str:
    """Returns path to ffmpeg binary."""
    bin_dir = get_bin_dir()
    local_exe = os.path.join(bin_dir, "ffmpeg.exe")
    if os.path.exists(local_exe):
        return local_exe
    return imageio_ffmpeg.get_ffmpeg_exe()
