from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import asyncio
import json
import os
import httpx
import websockets
from typing import List, Dict
from contextlib import asynccontextmanager
import mysql.connector

import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("telephony")

# Config
DB_URL = "mysql+aiomysql://root:widowmaker@mysql:3306/cloud_master"
ARI_URL = os.getenv("ARI_URL", "http://asterisk:8088/ari")
ARI_WS_URL = os.getenv("ARI_WS_URL", "ws://asterisk:8088/ari/events")
ARI_USER = os.getenv("ARI_USER", "ariuser")
ARI_PASS = os.getenv("ARI_PASS", "aripass")

# Real-time state store
extension_states = {}

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

def get_db_conn():
    return mysql.connector.connect(
        host="mysql",
        user="root",
        password="widowmaker",
        database="cloud_master"
    )

async def sync_initial_states():
    """Fetches current endpoint states from Asterisk ARI"""
    logger.info("📡 Syncing initial states from Asterisk...")
    url = f"{ARI_URL}/endpoints"
    auth = httpx.BasicAuth(ARI_USER, ARI_PASS)
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, auth=auth)
            if resp.status_code == 200:
                endpoints = resp.json()
                for ep in endpoints:
                    if ep.get("technology") == "PJSIP":
                        ext = ep.get("resource")
                        state = ep.get("state") # online, offline, etc.
                        
                        # ARI Endpoint state is different from DeviceState
                        # online -> NOT_INUSE
                        # offline -> UNAVAILABLE
                        status_map = {
                            "online": "libre",
                            "offline": "desconectado",
                            "unknown": "desconectado"
                        }
                        extension_states[ext] = status_map.get(state, "desconectado")
                logger.info(f"✅ Synced {len(endpoints)} endpoints")
            else:
                logger.error(f"❌ Failed to sync states: {resp.status_code} {resp.text}")
    except Exception as e:
        logger.error(f"❌ Error syncing initial states: {e}")

async def asterisk_event_listener():
    """Listens to ARI events for DeviceStateChanges"""
    await sync_initial_states()
    
    logger.info(f"ARI Monitor Loop Starting. URL: {ARI_WS_URL}")
    ws_url = f"{ARI_WS_URL}?app=telephony_monitor&subscribeAll=true&api_key={ARI_USER}:{ARI_PASS}"
    
    while True:
        try:
            logger.info("Attempting to connect to Asterisk ARI WS...")
            async with websockets.connect(ws_url) as ws:
                logger.info("✅ ARI Monitor CONNECTED to Asterisk")
                while True:
                    msg = await ws.recv()
                    event = json.loads(msg)
                    
                    # Log event type for debugging
                    event_type = event.get("type")
                    if event_type != "RTPReceiverStat": # Avoid noise
                        logger.debug(f"Received ARI Event: {event_type}")

                    if event_type == "DeviceStateChanged":
                        device = event["device_state"]["name"]
                        state = event["device_state"]["state"]
                        ext = device.split("/")[-1] if "/" in device else device
                        
                        logger.info(f"🔄 Device State Change: {device} -> {state}")
                        
                        status_map = {
                            "NOT_INUSE": "libre",
                            "BUSY": "ocupado",
                            "RINGING": "timbrando",
                            "ONHOLD": "espera",
                            "UNAVAILABLE": "desconectado"
                        }
                        
                        final_status = status_map.get(state, "desconocido")
                        extension_states[ext] = final_status
                        
                        payload = json.dumps({
                            "type": "state_change",
                            "extension": ext,
                            "status": final_status
                        })
                        await manager.broadcast(payload)
                        logger.info(f"📡 Broadcasted state change for {ext}: {final_status}")
        except Exception as e:
            print(f"❌ ARI Monitor Error: {e}")
            await asyncio.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("🚀 Telephony Service Starting...")
    monitor_task = asyncio.create_task(asterisk_event_listener())
    yield
    # Shutdown logic
    logger.info("🛑 Telephony Service Shutting Down...")
    monitor_task.cancel()

app = FastAPI(title="Cloudfly Telephony Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/extensions")
def list_extensions():
    try:
        conn = get_db_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id as extension, context, allow FROM ps_endpoints")
        extensions = cursor.fetchall()
        
        # Enrich with real-time state
        for ext in extensions:
            ext["status"] = extension_states.get(ext["extension"], "desconectado")
        
        cursor.close()
        conn.close()
        return extensions
    except Exception as e:
        print(f"DB Error: {e}")
        return []

@app.post("/extensions/{ext}/toggle")
def toggle_extension(ext: str, active: bool):
    return {"status": "ok", "extension": ext, "active": active}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    # Push initial state immediately
    try:
        extensions = list_extensions()
        await websocket.send_text(json.dumps({
            "type": "initial_state",
            "extensions": extensions
        }))
        logger.info(f"📤 Pushed initial state to new client ({len(extensions)} extensions)")
    except Exception as e:
        logger.error(f"❌ Error pushing initial state: {e}")

    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WS Error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
