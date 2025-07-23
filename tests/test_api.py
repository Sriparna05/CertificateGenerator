import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    resp = client.get('/api/v1/health')
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "ok"

def test_list_templates(client):
    resp = client.get('/api/v1/templates')
    assert resp.status_code == 200
    assert "templates" in resp.get_json()

def test_generate_certificate_unauth(client):
    resp = client.post('/api/v1/certificates/generate', json={})
    assert resp.status_code == 401

def test_generate_certificate_validation(client):
    # Auth: admin/password123
    resp = client.post(
        '/api/v1/certificates/generate',
        json={"template_id": "t1", "output_format": "pdf", "recipients": []},
        headers={"Authorization": "Basic YWRtaW46cGFzc3dvcmQxMjM="}
    )
    assert resp.status_code == 200 or resp.status_code == 400
