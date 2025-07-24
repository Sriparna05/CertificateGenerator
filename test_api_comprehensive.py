#!/usr/bin/env python3
"""
Comprehensive test script for Certificate Generator API
Tests all endpoints and certificate generation functionality
"""

import requests
import json
import time
import base64
import sys

# Configuration
BASE_URL = "http://127.0.0.1:5000"
USERNAME = "admin"
PASSWORD = "password123"


def get_auth_header():
    """Get basic auth header."""
    credentials = base64.b64encode(f"{USERNAME}:{PASSWORD}".encode()).decode()
    return {"Authorization": f"Basic {credentials}"}


def test_health_check():
    """Test health check endpoint."""
    print("Testing health check...")
    response = requests.get(f"{BASE_URL}/api/v1/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    print("✓ Health check passed\n")


def test_list_templates():
    """Test template listing endpoint."""
    print("Testing template listing...")
    response = requests.get(f"{BASE_URL}/api/v1/templates")
    print(f"Status Code: {response.status_code}")
    data = response.json()
    print(f"Response: {json.dumps(data, indent=2)}")
    assert response.status_code == 200
    assert "templates" in data
    print("✓ Template listing passed\n")
    return data["templates"]


def test_sync_certificate_generation(templates):
    """Test synchronous certificate generation."""
    print("Testing synchronous certificate generation...")

    # Find an available template
    template_id = None
    if templates["html"]:
        template_id = templates["html"][0]
    elif templates["images"]:
        template_id = templates["images"][0]
    elif templates["pptx"]:
        template_id = templates["pptx"][0]

    if not template_id:
        print("⚠ No templates available, skipping sync generation test")
        return

    payload = {
        "template_id": template_id,
        "output_format": "pdf",
        "recipients": [
            {
                "name": "John Doe",
                "course": "Python Programming",
                "date": "December 25, 2024",
                "instructor": "Jane Smith",
                "organization": "Tech Academy",
            },
            {
                "name": "Alice Johnson",
                "course": "Data Science Fundamentals",
                "date": "December 25, 2024",
                "instructor": "Bob Wilson",
                "organization": "Data Institute",
            },
        ],
        "ai_options": {"prompt": "congratulatory"},
    }

    response = requests.post(
        f"{BASE_URL}/api/v1/certificates/generate",
        json=payload,
        headers=get_auth_header(),
    )

    print(f"Status Code: {response.status_code}")
    data = response.json()
    print(f"Response: {json.dumps(data, indent=2)}")

    if response.status_code == 200:
        print("✓ Synchronous certificate generation passed\n")
    else:
        print(f"✗ Synchronous certificate generation failed: {data}\n")


def test_async_certificate_generation(templates):
    """Test asynchronous certificate generation."""
    print("Testing asynchronous certificate generation...")

    # Find an available template
    template_id = None
    if templates["html"]:
        template_id = templates["html"][0]
    elif templates["images"]:
        template_id = templates["images"][0]
    elif templates["pptx"]:
        template_id = templates["pptx"][0]

    if not template_id:
        print("⚠ No templates available, skipping async generation test")
        return

    payload = {
        "template_id": template_id,
        "output_format": "png",
        "recipients": [
            {
                "name": "Test User",
                "course": "Async Test Course",
                "date": "December 25, 2024",
            }
        ],
    }

    # Submit async job
    response = requests.post(
        f"{BASE_URL}/api/v1/certificates/generate_async", json=payload
    )

    print(f"Submit Status Code: {response.status_code}")
    data = response.json()
    print(f"Submit Response: {json.dumps(data, indent=2)}")

    if response.status_code != 202:
        print(f"✗ Async job submission failed: {data}\n")
        return

    job_id = data["job_id"]
    print(f"Job ID: {job_id}")

    # Check job status
    max_attempts = 10
    for attempt in range(max_attempts):
        print(f"Checking job status (attempt {attempt + 1})...")
        status_response = requests.get(f"{BASE_URL}/api/v1/jobs/{job_id}")

        print(f"Status Code: {status_response.status_code}")
        status_data = status_response.json()
        print(f"Status Response: {json.dumps(status_data, indent=2)}")

        if status_data["state"] in ["SUCCESS", "FAILURE"]:
            if status_data["state"] == "SUCCESS":
                print("✓ Asynchronous certificate generation passed\n")
            else:
                print(f"✗ Asynchronous certificate generation failed: {status_data}\n")
            break

        time.sleep(2)
    else:
        print("⚠ Job did not complete within timeout\n")


def test_authentication():
    """Test authentication requirements."""
    print("Testing authentication...")

    # Test without auth
    response = requests.post(f"{BASE_URL}/api/v1/certificates/generate", json={})
    print(f"No auth status: {response.status_code}")
    assert response.status_code == 401

    # Test with wrong auth
    wrong_auth = {"Authorization": "Basic d3JvbmdfY3JlZGVudGlhbHM="}
    response = requests.post(
        f"{BASE_URL}/api/v1/certificates/generate", json={}, headers=wrong_auth
    )
    print(f"Wrong auth status: {response.status_code}")
    assert response.status_code == 401

    print("✓ Authentication tests passed\n")


def test_validation():
    """Test input validation."""
    print("Testing input validation...")

    # Test missing required fields
    invalid_payload = {
        "template_id": "test.html"
        # Missing output_format and recipients
    }

    response = requests.post(
        f"{BASE_URL}/api/v1/certificates/generate",
        json=invalid_payload,
        headers=get_auth_header(),
    )

    print(f"Validation Status Code: {response.status_code}")
    data = response.json()
    print(f"Validation Response: {json.dumps(data, indent=2)}")

    assert response.status_code == 400
    assert "errors" in data
    print("✓ Input validation tests passed\n")


def main():
    """Run all tests."""
    print("Starting Certificate Generator API Tests")
    print("=" * 50)

    try:
        # Basic functionality tests
        test_health_check()
        templates = test_list_templates()

        # Authentication and validation tests
        test_authentication()
        test_validation()

        # Certificate generation tests
        test_sync_certificate_generation(templates)
        test_async_certificate_generation(templates)

        print("=" * 50)
        print("✓ All tests completed successfully!")

    except requests.exceptions.ConnectionError:
        print(
            "✗ Could not connect to the API. Make sure the server is running on http://127.0.0.1:5000"
        )
        sys.exit(1)
    except AssertionError as e:
        print(f"✗ Test assertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
