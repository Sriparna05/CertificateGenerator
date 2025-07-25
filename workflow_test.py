#!/usr/bin/env python3
"""
Frontend-Backend Integration Test Script
Tests the complete workflow of the Certificate Generator
"""

import time
import requests
import json


def test_complete_workflow():
    """Test the complete certificate generation workflow"""
    print("🚀 Testing Complete Certificate Generation Workflow")
    print("=" * 60)

    API_BASE = "http://127.0.0.1:5000/api/v1"
    FRONTEND_URL = "http://localhost:8080"

    # Test 1: Verify services are running
    print("\n📋 Step 1: Verify Services")
    print("-" * 30)

    try:
        # Check backend
        backend_response = requests.get(f"{API_BASE}/health", timeout=5)
        print(f"✅ Backend health: {backend_response.status_code}")

        # Check frontend
        frontend_response = requests.get(FRONTEND_URL, timeout=5)
        print(f"✅ Frontend accessible: {frontend_response.status_code}")

    except Exception as e:
        print(f"❌ Service check failed: {e}")
        return False

    # Test 2: Templates API
    print("\n📋 Step 2: Templates API")
    print("-" * 30)

    try:
        templates_response = requests.get(f"{API_BASE}/templates")
        templates_data = templates_response.json()
        print(f"✅ Templates loaded: {templates_data}")

        available_templates = []
        available_templates.extend(templates_data["templates"]["html"])
        available_templates.extend(templates_data["templates"]["images"])
        available_templates.extend(templates_data["templates"]["pptx"])

        if not available_templates:
            print("❌ No templates available!")
            return False

        template_to_use = available_templates[0]
        print(f"✅ Will use template: {template_to_use}")

    except Exception as e:
        print(f"❌ Templates API failed: {e}")
        return False

    # Test 3: Certificate Generation
    print("\n📋 Step 3: Certificate Generation")
    print("-" * 30)

    try:
        # Test data similar to what frontend would send
        test_request = {
            "template_id": template_to_use,
            "output_format": "pdf",
            "recipients": [
                {
                    "name": "Test User",
                    "course": "Frontend Integration Test",
                    "date": "2025-01-25",
                    "instructor": "Automated Test",
                    "organization": "QA Department",
                }
            ],
            "ai_options": {"prompt": "congratulatory"},
        }

        generate_response = requests.post(
            f"{API_BASE}/certificates/generate",
            headers={"Content-Type": "application/json"},
            json=test_request,
        )

        if generate_response.status_code == 200:
            result = generate_response.json()
            print(f"✅ Certificate generation successful!")
            print(f"   - Total recipients: {result.get('total_recipients', 0)}")
            print(f"   - Successful: {result.get('successful', 0)}")
            print(f"   - Failed: {result.get('failed', 0)}")

            # Check if files were created
            if result.get("results"):
                for cert_result in result["results"]:
                    if cert_result.get("status") == "success":
                        print(
                            f"   - Generated: {cert_result.get('file_path', 'Unknown')}"
                        )
                    else:
                        print(
                            f"   - Failed: {cert_result.get('error', 'Unknown error')}"
                        )
        else:
            print(f"❌ Certificate generation failed: {generate_response.status_code}")
            print(f"   Response: {generate_response.text}")
            return False

    except Exception as e:
        print(f"❌ Certificate generation failed: {e}")
        return False

    # Test 4: CORS headers for frontend
    print("\n📋 Step 4: CORS Verification")
    print("-" * 30)

    try:
        cors_response = requests.get(
            f"{API_BASE}/templates", headers={"Origin": FRONTEND_URL}
        )

        cors_header = cors_response.headers.get("Access-Control-Allow-Origin")
        if cors_header:
            print(f"✅ CORS header present: {cors_header}")
        else:
            print("❌ CORS header missing")
            return False

    except Exception as e:
        print(f"❌ CORS test failed: {e}")
        return False

    print("\n" + "=" * 60)
    print("🎉 ALL WORKFLOW TESTS PASSED!")
    print("\n📝 The system is ready for use:")
    print(f"   1. Open {FRONTEND_URL} in your browser")
    print("   2. Upload a CSV file with recipient data")
    print("   3. Select a template")
    print("   4. Generate certificates")
    print("\n🔧 Debugging tips:")
    print("   - Check browser console for JavaScript errors")
    print("   - Verify file upload is working")
    print("   - Ensure buttons are enabled after each step")
    print("   - Check network tab for API calls")

    return True


if __name__ == "__main__":
    test_complete_workflow()
