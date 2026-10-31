import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "gemini_service" in data

def test_get_projects():
    res = client.get("/api/projects")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert data[0]["name"] == "E-Commerce Platform"

def test_get_dashboard():
    res = client.get("/api/projects/proj-ecommerce-01/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert data["health_status"] == "critical"
    assert data["total_tasks"] >= 8
    assert data["delayed_tasks"] >= 1
    assert data["critical_bugs"] >= 1

def test_get_tasks():
    res = client.get("/api/projects/proj-ecommerce-01/tasks")
    assert res.status_code == 200
    assert len(res.json()) >= 8

def test_get_risks():
    res = client.get("/api/projects/proj-ecommerce-01/risks")
    assert res.status_code == 200
    data = res.json()
    assert len(data["risks"]) > 0

def test_get_dependencies():
    res = client.get("/api/projects/proj-ecommerce-01/dependencies")
    assert res.status_code == 200
    data = res.json()
    assert len(data["nodes"]) >= 8
    assert len(data["edges"]) >= 3

def test_agent_analyze():
    res = client.post("/api/agents/analyze", json={"project_id": "proj-ecommerce-01"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["recommendations"]) > 0
    assert len(data["agent_activities"]) >= 3

def test_agent_activity():
    res = client.get("/api/agents/activity")
    assert res.status_code == 200
    assert len(res.json()) > 0

def test_simulator_run():
    res = client.post(
        "/api/simulator/run",
        json={"project_id": "proj-ecommerce-01", "task_id": "TASK-101", "additional_delay_days": 2},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["simulated_task_id"] == "TASK-101"
    assert data["release_impact"]["will_delay_release"] is True

def test_approvals_flow():
    # 1. Fetch approvals
    res = client.get("/api/approvals")
    assert res.status_code == 200
    recs = res.json()
    assert len(recs) > 0
    rec_id = recs[0]["id"]

    # 2. Approve
    update_res = client.post(
        f"/api/approvals/{rec_id}",
        json={"status": "approved", "comment": "Approved for emergency sprint intervention."},
    )
    assert update_res.status_code == 200
    assert update_res.json()["approval_status"] == "approved"
    assert update_res.json()["reviewer_comment"] == "Approved for emergency sprint intervention."

def test_assistant_chat():
    res = client.post(
        "/api/assistant/chat",
        json={"project_id": "proj-ecommerce-01", "message": "Why is the payment module at risk?"},
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["response"]) > 50
    assert len(data["key_takeaways"]) > 0

