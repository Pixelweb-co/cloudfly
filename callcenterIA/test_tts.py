
import requests
import sys

TTS_URL = 'http://localhost:5002'

def test_tts():
    print(f"Testing TTS at {TTS_URL}...")
    try:
        # Check if server is reachable
        print("1. Checking simple string...")
        text = "Hola, esto es una prueba de voz."
        url = f"{TTS_URL}/api/tts?text={requests.utils.quote(text)}"
        print(f"   Requesting: {url}")
        
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            print("   ✅ Success! Status 200")
            print(f"   Received {len(response.content)} bytes of audio.")
            with open("test_tts.wav", "wb") as f:
                f.write(response.content)
            print("   Saved to test_tts.wav")
        else:
            print(f"   ❌ Failed. Status: {response.status_code}")
            print(f"   Response: {response.text}")

    except Exception as e:
        print(f"   ❌ Exception: {e}")
        print("\nPossible causes:")
        print("- Container 'tts' is not running (docker-compose ps)")
        print("- Port 5002 is blocked or in use")
        print("- Model is still downloading (check docker logs tts)")

if __name__ == "__main__":
    test_tts()
