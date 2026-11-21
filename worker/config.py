import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    deepgram_api_key: str = os.getenv("DEEPGRAM_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    poll_interval: int = int(os.getenv("POLL_INTERVAL", "5"))
    temp_dir: str = os.getenv("TEMP_DIR", "./temp")
    storage_bucket: str = os.getenv("STORAGE_BUCKET", "clips")

settings = Settings()
