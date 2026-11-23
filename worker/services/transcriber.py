import os
from deepgram import DeepgramClient
from config import settings

class Transcriber:
    def __init__(self):
        # deepgram-sdk supports timeout directly in seconds (e.g. 600.0s = 10 minutes)
        self.client = DeepgramClient(
            api_key=settings.deepgram_api_key,
            timeout=600.0
        )

    def transcribe(self, audio_path: str) -> dict:
        """Transcribes audio file using Deepgram Nova-2 and returns full text + word timestamps."""
        with open(audio_path, "rb") as audio_file:
            audio_bytes = audio_file.read()
            response = self.client.listen.v1.media.transcribe_file(
                request=audio_bytes,
                model="nova-2",
                smart_format=True,
                punctuate=True,
                utterances=True,
            )

            results = response.results
            channel = results.channels[0]
            alternative = channel.alternatives[0]
            transcript_text = alternative.transcript

            words = []
            for word_obj in getattr(alternative, "words", []):
                words.append({
                    "word": word_obj.word,
                    "start": word_obj.start,
                    "end": word_obj.end,
                    "punctuated_word": getattr(word_obj, "punctuated_word", word_obj.word)
                })

            return {
                "transcript": transcript_text,
                "words": words
            }
