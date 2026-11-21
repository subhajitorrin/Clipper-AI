import json
from openai import OpenAI
from pydantic import BaseModel
from typing import List
from config import settings

class Moment(BaseModel):
    title: str
    start_time: float
    end_time: float
    hook_text: str
    virality_score: int

class MomentAnalysis(BaseModel):
    moments: List[Moment]

class Analyzer:
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)

    def detect_moments(self, transcript: str, words: list, clip_duration: int = 45, requested_clips: int = 3) -> List[dict]:
        """Uses OpenAI gpt-4o-mini to find viral moments from transcript."""
        # Provide sample timestamps to help the model pick precise ranges
        sample_context = f"Total words: {len(words)}. First word at {words[0]['start'] if words else 0}s, last at {words[-1]['end'] if words else 0}s."

        prompt = f"""You are a viral YouTube Shorts and TikTok video editor.
Analyze the following transcript and find the top {requested_clips} most viral, engaging, and standalone moments.
Each moment should be approximately {clip_duration} seconds long (within ±10 seconds).
Ensure the start has a strong hook and the end has a natural conclusion or cliffhanger.

Context: {sample_context}

Transcript:
{transcript[:15000]}
"""

        response = self.client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You analyze transcripts and select top viral clip timestamps."},
                {"role": "user", "content": prompt}
            ],
            response_format=MomentAnalysis,
            temperature=0.3
        )

        parsed = response.choices[0].message.parsed
        return [m.model_dump() for m in parsed.moments]
