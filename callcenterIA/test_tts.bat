@echo off
echo Testing TTS...
curl -v "http://localhost:5002/api/tts?text=Hola%20mundo" -o test.wav
if %ERRORLEVEL% NEQ 0 (
    echo FAIL
) else (
    echo SUCCESS - Saved to test.wav
)
pause
