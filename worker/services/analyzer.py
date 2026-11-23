import json
import math
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List
from config import settings

class Moment(BaseModel):
    title: str = Field(description="Catchy, high-CTR short title for the clip")
    start_time: float = Field(description="Start time in seconds")
    end_time: float = Field(description="End time in seconds")
    hook_text: str = Field(description="Opening hook sentence or attention-grabber")
    virality_score: int = Field(description="Virality rating from 1 to 100")
    reasoning: str = Field(description="Why this is a top viral moment / punchline / revelation")

class MomentAnalysis(BaseModel):
    moments: List[Moment]

class Analyzer:
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)

    def _chunk_transcript(self, words: list, chunk_duration_sec: float = 600.0, overlap_sec: float = 60.0) -> List[dict]:
        """
        Splits lengthy transcripts into overlapping time-based chunks so full 1-2 hour videos
        can be thoroughly analyzed without hitting token limits or truncating the end.
        """
        if not words:
            return []

        total_duration = words[-1]["end"]
        if total_duration <= chunk_duration_sec:
            # Entire video fits in one segment
            text = " ".join([w.get("punctuated_word", w["word"]) for w in words])
            return [{
                "text": text,
                "start_time": words[0]["start"],
                "end_time": words[-1]["end"]
            }]

        chunks = []
        current_start = 0.0

        while current_start < total_duration:
            current_end = current_start + chunk_duration_sec
            chunk_words = [w for w in words if current_start <= w["start"] < current_end]

            if chunk_words:
                chunk_text = " ".join([w.get("punctuated_word", w["word"]) for w in chunk_words])
                chunks.append({
                    "text": chunk_text,
                    "start_time": chunk_words[0]["start"],
                    "end_time": chunk_words[-1]["end"]
                })

            current_start += (chunk_duration_sec - overlap_sec)

        return chunks

    def detect_moments(self, transcript: str, words: list, clip_duration: int = 45, requested_clips: int = 3) -> List[dict]:
        """
        Scans the full transcript across all sections, evaluating viral potential,
        hooks, debates, insights, and emotional climaxes. Selects only the best, highest-scoring clips.
        
        If clip_duration <= 0: AUTO DURATION MODE (AI decides optimal natural story boundary between 18s and 75s).
        If requested_clips <= 0: AUTO CLIPS MODE (Calculates optimal number of clips based on video length, up to 25).
        """
        if not words and not transcript:
            return []

        # Determine total duration of the video in seconds from words if available
        total_video_duration = words[-1]["end"] if words else 600.0

        is_auto_clips = requested_clips <= 0
        is_auto_duration = clip_duration <= 0

        # In Auto clips mode, dynamically scale based on video length:
        # e.g., ~1 clip per 3-4 minutes of content, min 5, max 30 clips
        if is_auto_clips:
            calculated_clips = max(5, min(30, int(total_video_duration / 200)))
            target_clips = calculated_clips
            print(f"  [Analyzer] AUTO CLIPS MODE: Video length {total_video_duration/60:.1f} mins -> targeting {target_clips} top viral shorts.")
        else:
            target_clips = requested_clips

        chunks = self._chunk_transcript(words, chunk_duration_sec=700.0, overlap_sec=60.0)
        if not chunks:
            chunks = [{"text": transcript, "start_time": 0.0, "end_time": max(60.0, total_video_duration)}]

        all_candidate_moments = []

        if is_auto_duration:
            duration_instruction = (
                "5. NATURAL DURATION (AUTO-DURATION MODE): Do NOT force an arbitrary cut length. "
                "Let the speaker's natural thought, story, punchline, or hook dictate the clip boundaries. "
                "Each clip must be a complete standalone thought between 18s and 75s (ideal sweet spot: 25s–60s). "
                "Ensure the clip ends right after the punchline, resolution, or climax."
            )
            chunk_duration_hint = "Duration: Natural story/hook length between 18s and 75s (complete standalone thought)."
        else:
            tolerance = 5 if clip_duration <= 15 else 10
            duration_instruction = (
                f"5. DURATION: Each clip must be approximately {clip_duration}s "
                f"(allowed range: {max(10, clip_duration - tolerance)}s to {clip_duration + tolerance}s)."
            )
            chunk_duration_hint = f"Target duration per clip: ~{clip_duration}s (allowed: {max(10, clip_duration - tolerance)}s - {clip_duration + tolerance}s)."

        system_instruction = (
            "You are an elite, world-class viral video curator and editor for YouTube Shorts, TikTok, and Instagram Reels.\n"
            "Your job is to find the absolute HIGHEST-POTENTIAL viral moments from long-form podcasts, interviews, and videos.\n\n"
            "CRITERIA FOR TOP CLIPS:\n"
            "1. STRONG HOOK: The first 3 seconds must grab instant attention (a shocking statement, controversial debate, intriguing question, intense story, or high-value tip).\n"
            "2. STANDALONE NARRATIVE: A viewer scrolling on TikTok/Shorts must understand the clip without having seen the rest of the video. It must have a beginning, middle, and satisfying climax or punchline.\n"
            "3. HIGH RETENTION & VIRALITY: Prioritize shocking revelations, intense debates, breakthrough advice, hilarious reactions, or deeply emotional storytelling over routine talk, introductions, or pleasantries.\n"
            "4. ACCURATE TIMESTAMPS: Start exactly right as the speaker begins the relevant thought/sentence, and end cleanly right as the point concludes.\n"
            f"{duration_instruction}"
        )

        clips_per_chunk = max(3, math.ceil((target_clips * 1.5) / len(chunks)))

        for idx, chunk in enumerate(chunks):
            chunk_prompt = f"""Analyze this section of the podcast transcript (Time: {chunk['start_time']:.1f}s to {chunk['end_time']:.1f}s):
Identify up to {clips_per_chunk} of the MOST viral, high-energy, or insightful clips from this section.
{chunk_duration_hint}

Transcript segment:
\"\"\"
{chunk['text']}
\"\"\"
"""
            try:
                response = self.client.beta.chat.completions.parse(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": chunk_prompt}
                    ],
                    response_format=MomentAnalysis,
                    temperature=0.25
                )

                parsed = response.choices[0].message.parsed
                for m in parsed.moments:
                    duration = m.end_time - m.start_time
                    if is_auto_duration:
                        # Allow flexible natural length between 15s and 90s
                        if 15.0 <= duration <= 90.0:
                            all_candidate_moments.append(m.model_dump())
                    else:
                        tolerance = 5 if clip_duration <= 15 else 10
                        if (clip_duration - tolerance - 5) <= duration <= (clip_duration + tolerance + 5):
                            all_candidate_moments.append(m.model_dump())
            except Exception as e:
                print(f"  [Analyzer] Chunk {idx+1}/{len(chunks)} analysis warning: {e}")

        if not all_candidate_moments:
            # Fallback to single pass with transcript start
            try:
                fallback_prompt = f"""Find the top {target_clips} viral standalone moments ({chunk_duration_hint}):
{transcript[:25000]}
"""
                response = self.client.beta.chat.completions.parse(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": fallback_prompt}
                    ],
                    response_format=MomentAnalysis,
                    temperature=0.25
                )
                return [m.model_dump() for m in response.choices[0].message.parsed.moments][:target_clips]
            except Exception:
                return []

        # Deduplicate overlapping candidate clips
        # Sort by virality_score descending
        all_candidate_moments.sort(key=lambda x: x.get("virality_score", 0), reverse=True)

        selected_moments = []
        for cand in all_candidate_moments:
            # In auto mode, if we have plenty of candidates, only pick high virality scores (>= 60)
            if is_auto_clips and cand.get("virality_score", 0) < 60 and len(selected_moments) >= 5:
                continue

            c_start = cand["start_time"]
            c_end = cand["end_time"]

            # Check overlap with already chosen top moments
            has_heavy_overlap = False
            for sel in selected_moments:
                s_start = sel["start_time"]
                s_end = sel["end_time"]
                overlap = max(0, min(c_end, s_end) - max(c_start, s_start))
                # If overlap is more than 30% of either clip, skip
                if overlap > (0.30 * min(c_end - c_start, s_end - s_start)):
                    has_heavy_overlap = True
                    break

            if not has_heavy_overlap:
                selected_moments.append(cand)

            if len(selected_moments) >= target_clips:
                break

        # If not enough non-overlapping, fill with remaining candidates up to target_clips
        if len(selected_moments) < target_clips:
            for cand in all_candidate_moments:
                if cand not in selected_moments:
                    selected_moments.append(cand)
                if len(selected_moments) >= target_clips:
                    break

        print(f"  [Analyzer] Evaluated full video: selected top {len(selected_moments)} viral clips (virality scores: {[m.get('virality_score') for m in selected_moments]}).")
        return selected_moments
