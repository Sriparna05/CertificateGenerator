from app import app

def test_list_templates():
    client = app.test_client()
    response = client.get('/api/v1/templates')
    assert response.status_code == 200
    assert 'templates' in response.json
