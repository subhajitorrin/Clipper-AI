import re

class CaptionGenerator:
    """
    Generates high-engagement, viral 'Alex Hormozi' style .ass (Advanced SubStation Alpha)
    captions with dynamic word-by-word active highlighting.
    """

    DEFAULT_STYLE_NAME = "HormoziYellow"

    # Color format in ASS is &HAABBGGRR (Alpha, Blue, Green, Red)
    # White: &H00FFFFFF
    # Neon Yellow: &H0000E5FF (R=255, G=229, B=0)
    # Bright Cyan: &H00FFFF00 (R=0, G=255, B=255)
    # Neon Green: &H0039FF14 (R=20, G=255, B=57 -> B=14, G=FF, R=39)
    STYLES = {
        "HormoziYellow": {
            "primary": "&H00FFFFFF",      # Inactive / base text color (White)
            "highlight": "&H0000E5FF",    # Active highlighted word (Electric Yellow)
            "outline": "&H00000000",      # Deep solid black outline
            "back": "&H80000000",         # Soft drop shadow
            "fontname": "Arial",
            "fontsize": 68,
            "bold": 1,
            "italic": 0,
            "outline_w": 5.0,
            "shadow_w": 3.0,
            "margin_v": 480,              # Lifted up from bottom to avoid TikTok/Reels UI buttons
        },
        "NeonCyan": {
            "primary": "&H00FFFFFF",
            "highlight": "&H00FFFF00",    # Electric Cyan
            "outline": "&H00000000",
            "back": "&H80000000",
            "fontname": "Arial",
            "fontsize": 68,
            "bold": 1,
            "italic": 0,
            "outline_w": 5.0,
            "shadow_w": 3.0,
            "margin_v": 480,
        },
        "EmeraldGreen": {
            "primary": "&H00FFFFFF",
            "highlight": "&H0014FF39",    # Neon Emerald Green
            "outline": "&H00000000",
            "back": "&H80000000",
            "fontname": "Arial",
            "fontsize": 68,
            "bold": 1,
            "italic": 0,
            "outline_w": 5.0,
            "shadow_w": 3.0,
            "margin_v": 480,
        }
    }

    @staticmethod
    def _format_time(seconds: float) -> str:
        """Formats seconds into ASS timestamp format: H:MM:SS.cs (centiseconds)."""
        if seconds < 0:
            seconds = 0.0
        hrs = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        cs = int(round((seconds - int(seconds)) * 100))
        if cs >= 100:
            secs += 1
            cs = 0
        return f"{hrs:d}:{mins:02d}:{secs:02d}.{cs:02d}"

    @classmethod
    def generate_ass(
        cls,
        words: list,
        clip_start: float,
        clip_end: float,
        output_ass_path: str,
        style_preset: str = "HormoziYellow",
        max_words_per_group: int = 4,
        max_group_duration: float = 1.8
    ) -> str:
        """
        Creates an .ass file where words within the clip range are displayed in short
        rhythmic groups (3-4 words max) with each word highlighted as it is spoken.
        """
        style = cls.STYLES.get(style_preset, cls.STYLES[cls.DEFAULT_STYLE_NAME])

        # Filter words belonging to this clip range and make timestamps relative to clip_start
        relative_words = []
        for w in words:
            w_start = float(w.get("start", 0.0))
            w_end = float(w.get("end", 0.0))
            # Include words that overlap with clip range
            if w_end > clip_start and w_start < clip_end:
                rel_start = max(0.0, w_start - clip_start)
                rel_end = max(rel_start + 0.1, min(clip_end - clip_start, w_end - clip_start))
                clean_text = w.get("punctuated_word", w.get("word", "")).strip()
                if clean_text:
                    relative_words.append({
                        "word": clean_text.upper(),
                        "start": rel_start,
                        "end": rel_end
                    })

        # Header for 1080x1920 9:16 vertical video
        ass_content = [
            "[Script Info]",
            "ScriptType: v4.00+",
            "PlayResX: 1080",
            "PlayResY: 1920",
            "ScaledBorderAndShadow: yes",
            "WrapStyle: 0",
            "",
            "[V4+ Styles]",
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
            f"Style: Default,{style['fontname']},{style['fontsize']},{style['primary']},{style['highlight']},{style['outline']},{style['back']},{style['bold']},{style['italic']},0,0,100,100,0,0,1,{style['outline_w']},{style['shadow_w']},2,40,40,{style['margin_v']},1",
            "",
            "[Events]",
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
        ]

        if not relative_words:
            # Empty subtitle file if no words detected
            with open(output_ass_path, "w", encoding="utf-8") as f:
                f.write("\n".join(ass_content) + "\n")
            return output_ass_path

        # Group words into short rhythmic segments (e.g. 3-4 words or max 1.8 seconds)
        groups = []
        current_group = []
        for word_info in relative_words:
            if not current_group:
                current_group.append(word_info)
            else:
                group_dur = word_info["end"] - current_group[0]["start"]
                pause = word_info["start"] - current_group[-1]["end"]
                if len(current_group) >= max_words_per_group or group_dur > max_group_duration or pause > 0.6:
                    groups.append(current_group)
                    current_group = [word_info]
                else:
                    current_group.append(word_info)
        if current_group:
            groups.append(current_group)

        # Build events for each group
        # In each group, for each word's duration, render the whole group with only that active word highlighted
        highlight_color = style["highlight"]
        primary_color = style["primary"]

        for group in groups:
            for active_idx, active_word in enumerate(group):
                start_t = active_word["start"]
                # Active until next word starts, or until this word ends
                if active_idx < len(group) - 1:
                    end_t = min(active_word["end"] + 0.1, group[active_idx + 1]["start"])
                    if end_t <= start_t:
                        end_t = active_word["end"]
                else:
                    end_t = active_word["end"] + 0.15

                # Build line text: all words are displayed, but active word has highlight color override
                tokens = []
                for idx, w in enumerate(group):
                    word_str = w["word"]
                    if idx == active_idx:
                        # Highlight active word with scale bump and highlight color
                        tokens.append(f"{{\\c{highlight_color}\\fscx108\\fscy108}}{word_str}{{\\c{primary_color}\\fscx100\\fscy100}}")
                    else:
                        tokens.append(word_str)

                event_line = (
                    f"Dialogue: 0,{cls._format_time(start_t)},{cls._format_time(end_t)},"
                    f"Default,,0,0,0,,{' '.join(tokens)}"
                )
                ass_content.append(event_line)

        with open(output_ass_path, "w", encoding="utf-8") as f:
            f.write("\n".join(ass_content) + "\n")

        return output_ass_path
