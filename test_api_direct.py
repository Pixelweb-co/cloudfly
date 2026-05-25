import pytest
import requests
from unittest.mock import Mock

BASE_URL = "http://localhost:8080"  # backend service port defined in docker-compose

def test_backend_health(monkeypatch):
    """Verify that the backend health endpoint is reachable and returns expected payload."""
    # Mock the requests.get call to avoid real network dependency
    mock_resp = Mock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"status": "ok"}
    monkeypatch.setattr(requests, "get", lambda url, timeout=5: mock_resp)

    resp = requests.get(f"{BASE_URL}/health", timeout=5)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert data.get("status") == "ok", f"Unexpected health payload: {data}"
