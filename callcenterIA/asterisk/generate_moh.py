import wave
import math
import struct

# Parameters
duration = 30.0  # seconds
frequency = 440.0  # Hz (A4 note)
sample_rate = 8000
amplitude = 16000

# Create a sine wave
with wave.open('hold_music.wav', 'w') as wav_file:
    wav_file.setnchannels(1)
    wav_file.setsampwidth(2)
    wav_file.setframerate(sample_rate)
    
    for i in range(int(duration * sample_rate)):
        # Generate two tones to make it slightly more "musical"
        val1 = math.sin(2.0 * math.pi * 440.0 * i / sample_rate)
        val2 = math.sin(2.0 * math.pi * 554.37 * i / sample_rate) # C#5
        value = int((val1 + val2) * 0.5 * amplitude)
        data = struct.pack('<h', value)
        wav_file.writeframesraw(data)

print("Generated hold_music.wav")
