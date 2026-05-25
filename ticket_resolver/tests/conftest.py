import sys, os
import pytest
# Ensure the ticket_resolver package is on the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ticket_resolver.main import app

@pytest.fixture
def client():
    from fastapi.testclient import TestClient
    return TestClient(app)
