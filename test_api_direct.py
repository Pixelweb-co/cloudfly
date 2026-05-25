import pytest
import requests

BASE_URL = "http://localhost:8080"  # backend service port defined in docker-compose

def test_backend_health():
    """Verify that the backend health endpoint is reachable and returns expected payload."""
    resp = requests.get(f"{BASE_URL}/health", timeout=5)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert data.get("status") == "ok", f"Unexpected health payload: {data}"
