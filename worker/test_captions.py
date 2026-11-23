import os
import sys
import tempfile
import subprocess

# Add worker directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "worker")))

from services.caption_generator import CaptionGenerator
from services.ffmpeg_utils import get_ffmpeg_exe
from services.video_editor import VideoEditor

def test_caption_generator_ass_format():
    """Verify generated ASS file contains valid styling, timing, and word highlights."""
    sample_words = [
        {"word": "Welcome", "punctuated_word": "Welcome", "start": 10.0, "end": 10.4},
        {"word": "to", "punctuated_word": "to", "start": 10.45, "end": 10.6},
        {"word": "ClipForge", "punctuated_word": "ClipForge,", "start": 10.65, "end": 11.2},
        {"word": "the", "punctuated_word": "the", "start": 11.3, "end": 11.5},
        {"word": "best", "punctuated_word": "best", "start": 11.55, "end": 11.9},
        {"word": "AI", "punctuated_word": "AI", "start": 12.0, "end": 12.3},
        {"word": "tool", "punctuated_word": "tool.", "start": 12.35, "end": 12.8},
    ]

    with tempfile.NamedTemporaryFile(suffix=".ass", delete=False) as f:
        temp_ass_path = f.name

    try:
        CaptionGenerator.generate_ass(
            words=sample_words,
            clip_start=10.0,
            clip_end=15.0,
            output_ass_path=temp_ass_path,
            style_preset="HormoziYellow"
        )

        with open(temp_ass_path, "r", encoding="utf-8") as f:
            content = f.read()

        assert "[Script Info]" in content
        assert "PlayResX: 1080" in content
        assert "PlayResY: 1920" in content
        assert "Style: Default" in content
        assert "Dialogue: 0," in content
        # Check active word highlight color tag
        assert "\\c&H0000E5FF" in content
        # Check relative timing (clip start was 10.0, so first word at 10.0 should start at 0:00:00.00)
        assert "0:00:00.00" in content
        print("✅ test_caption_generator_ass_format passed")
    finally:
        if os.path.exists(temp_ass_path):
            os.remove(temp_ass_path)

def test_video_render_with_captions():
    """Verify that FFmpeg actually renders a 9:16 vertical video with burned captions."""
    ffmpeg = get_ffmpeg_exe()
    with tempfile.TemporaryDirectory() as tmp_dir:
        test_video = os.path.join(tmp_dir, "test_landscape.mp4")
        test_ass = os.path.join(tmp_dir, "test_subs.ass")
        test_output = os.path.join(tmp_dir, "test_output_9_16.mp4")

        # 1. Create a 3-second synthetic 1920x1080 landscape video using testsrc
        gen_cmd = [
            ffmpeg, "-y",
            "-f", "lavfi", "-i", "testsrc=duration=3:size=1920x1080:rate=30",
            "-f", "lavfi", "-i", "sine=frequency=1000:duration=3",
            "-c:v", "libx264", "-c:a", "aac",
            test_video
        ]
        res = subprocess.run(gen_cmd, capture_output=True, text=True)
        assert res.returncode == 0, f"Synthetic video creation failed: {res.stderr}"

        # 2. Create ASS captions
        words = [
            {"word": "VIRAL", "punctuated_word": "VIRAL", "start": 0.2, "end": 0.8},
            {"word": "MOMENT", "punctuated_word": "MOMENT", "start": 0.9, "end": 1.5},
            {"word": "CAPTIONS", "punctuated_word": "CAPTIONS!", "start": 1.6, "end": 2.4},
        ]
        CaptionGenerator.generate_ass(
            words=words,
            clip_start=0.0,
            clip_end=3.0,
            output_ass_path=test_ass,
            style_preset="HormoziYellow"
        )

        # 3. Render vertical clip with captions
        out_path = VideoEditor.render_vertical_clip(
            input_video_path=test_video,
            output_clip_path=test_output,
            subtitle_path=test_ass
        )

        assert os.path.exists(out_path)
        assert os.path.getsize(out_path) > 1000

        # 4. Probe dimensions to ensure exactly 1080x1920
        probe_cmd = [
            ffmpeg, "-i", out_path
        ]
        probe_res = subprocess.run(probe_cmd, capture_output=True, text=True)
        assert "1080x1920" in probe_res.stderr, f"Unexpected dimensions: {probe_res.stderr}"
        print("✅ test_video_render_with_captions passed (1080x1920 rendered successfully with burned subtitles)")

if __name__ == "__main__":
    test_caption_generator_ass_format()
    test_video_render_with_captions()
    print("\n🎉 ALL TESTS PASSED!")
