import sys
from config import settings

def test_config():
    print("=== Testing Worker Configuration ===")
    errors = []
    if not settings.supabase_url:
        errors.append("❌ SUPABASE_URL is missing")
    else:
        print(f"✅ SUPABASE_URL: {settings.supabase_url}")

    if not settings.supabase_service_role_key:
        errors.append("❌ SUPABASE_SERVICE_ROLE_KEY is missing")
    else:
        print("✅ SUPABASE_SERVICE_ROLE_KEY: [Present]")

    if not settings.deepgram_api_key:
        errors.append("❌ DEEPGRAM_API_KEY is missing")
    else:
        print("✅ DEEPGRAM_API_KEY: [Present]")

    if not settings.openai_api_key:
        errors.append("❌ OPENAI_API_KEY is missing")
    else:
        print("✅ OPENAI_API_KEY: [Present]")

    try:
        from services.ffmpeg_utils import get_ffmpeg_exe
        ffmpeg = get_ffmpeg_exe()
        print(f"✅ FFmpeg binary located: {ffmpeg}")
    except Exception as e:
        errors.append(f"❌ FFmpeg check failed: {e}")

    if errors:
        print("\nFix the following issues in worker/.env:")
        for err in errors:
            print(f"  {err}")
        sys.exit(1)
    else:
        print("\n🎉 All keys and binaries configured successfully!")

if __name__ == "__main__":
    test_config()
