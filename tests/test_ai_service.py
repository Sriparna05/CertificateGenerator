import pytest
from app.services.ai_service import generate_personalized_message

def test_generate_personalized_message_stub():
    prompt = "Congratulations, John!"
    recipient_data = {"name": "John"}
    result = generate_personalized_message(prompt, recipient_data)
    assert isinstance(result, str)
    assert "Congratulations John" in result
