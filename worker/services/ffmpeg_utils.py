import os
import glob
import shutil

try:
    import imageio_ffmpeg
except ImportError:
    imageio_ffmpeg = None

def _find_libass_ffmpeg() -> str:
    """Finds an FFmpeg binary compiled with libass/subtitles support."""
    # Check Homebrew ffmpeg-full or full builds first
    candidates = [
        "/opt/homebrew/Cellar/ffmpeg-full/*/bin/ffmpeg",
        "/usr/local/Cellar/ffmpeg-full/*/bin/ffmpeg",
        "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg",
        "/usr/local/opt/ffmpeg-full/bin/ffmpeg",
    ]
    for pattern in candidates:
        matches = glob.glob(pattern)
        if matches and os.path.exists(matches[0]):
            return matches[0]

    return None

def get_bin_dir() -> str:
    """Returns the path to the directory containing ffmpeg and ffprobe."""
    local_bin = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "bin"))
    if os.path.exists(os.path.join(local_bin, "ffmpeg.exe")) or os.path.exists(os.path.join(local_bin, "ffmpeg")):
        return local_bin

    libass_ffmpeg = _find_libass_ffmpeg()
    if libass_ffmpeg:
        return os.path.dirname(os.path.abspath(libass_ffmpeg))

    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return os.path.dirname(os.path.abspath(system_ffmpeg))

    if imageio_ffmpeg:
        return os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())
    return "/usr/bin"

def get_ffmpeg_exe() -> str:
    """Returns path to ffmpeg binary (cross-platform), preferring builds with libass."""
    bin_dir = get_bin_dir()
    local_exe_win = os.path.join(bin_dir, "ffmpeg.exe")
    if os.path.exists(local_exe_win):
        return local_exe_win
    local_exe_nix = os.path.join(bin_dir, "ffmpeg")
    if os.path.exists(local_exe_nix):
        return local_exe_nix

    libass_ffmpeg = _find_libass_ffmpeg()
    if libass_ffmpeg:
        return libass_ffmpeg

    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg

    if imageio_ffmpeg:
        return imageio_ffmpeg.get_ffmpeg_exe()
    return "ffmpeg"
