#!/bin/bash
# Entrypoint script to run both ARI bot and API server

# Start API server in background
python3 /app/api_server.py &
API_PID=$!

# Start ARI bot (main process)
python3 /app/ari_bot_2.py &
BOT_PID=$!

# Wait for both processes
wait $API_PID $BOT_PID
