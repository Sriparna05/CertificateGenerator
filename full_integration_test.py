#!/usr/bin/env python3
"""
Full Integration Test for Certificate Generator
Tests both backend API endpoints and frontend-backend integration
"""

import requests
import json
import sys
import time

API_BASE = "http://127.0.0.1:5000/api/v1"


def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{API_BASE}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False


def test_templates():
    """Test templates endpoint"""
    print("🔍 Testing templates endpoint...")
    try:
        response = requests.get(f"{API_BASE}/templates")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Templates endpoint working. Found templates: {data}")
            return data
        else:
            print(f"❌ Templates endpoint failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Templates endpoint error: {e}")
        return None


def test_certificate_generation():
    """Test certificate generation endpoint"""
    print("🔍 Testing certificate generation...")
    try:
        request_data = {
            "template_id": "achievement_template.html",
            "output_format": "pdf",
            "recipients": [
                {
                    "name": "John Doe",
                    "course": "React Development",
                    "date": "2025-01-15",
                    "instructor": "Sarah Johnson",
                    "organization": "Tech Academy",
                },
                {
                    "name": "Jane Smith",
                    "course": "Node.js Fundamentals",
                    "date": "2025-01-20",
                    "instructor": "Mike Wilson",
                    "organization": "DevCorp",
                },
            ],
            "ai_options": {"prompt": "congratulatory"},
        }

        response = requests.post(
            f"{API_BASE}/certificates/generate",
            headers={"Content-Type": "application/json"},
            json=request_data,
        )

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Certificate generation successful: {data}")
            return data
        else:
            print(f"❌ Certificate generation failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Certificate generation error: {e}")
        return None


def test_async_generation():
    """Test async certificate generation endpoint"""
    print("🔍 Testing async certificate generation...")
    try:
        request_data = {
            "template_id": "completion_template.html",
            "output_format": "pdf",
            "recipients": [
                {
                    "name": "Alice Brown",
                    "course": "Full Stack Development",
                    "date": "2025-01-25",
                    "instructor": "David Chen",
                    "organization": "CodeSchool",
                }
            ],
        }

        response = requests.post(
            f"{API_BASE}/certificates/generate_async",
            headers={"Content-Type": "application/json"},
            json=request_data,
        )

        if response.status_code == 202:
            data = response.json()
            job_id = data.get("job_id")
            print(f"✅ Async job started: {job_id}")

            # Poll for job status
            for i in range(10):  # Try for up to 20 seconds
                time.sleep(2)
                status_response = requests.get(f"{API_BASE}/jobs/{job_id}")
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    print(f"Job status: {status_data['state']}")

                    if status_data["state"] in ["SUCCESS", "FAILURE"]:
                        print(f"✅ Async generation completed: {status_data}")
                        return status_data
                else:
                    print(f"❌ Job status check failed: {status_response.status_code}")
                    break

            print("⏰ Async job timeout")
            return None
        else:
            print(f"❌ Async generation failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Async generation error: {e}")
        return None


def test_frontend_access():
    """Test frontend is accessible"""
    print("🔍 Testing frontend accessibility...")
    try:
        response = requests.get("http://localhost:8081")
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend not accessible: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend access error: {e}")
        return False


def main():
    """Run all integration tests"""
    print("🚀 Starting Full Integration Test")
    print("=" * 50)

    tests = [
        ("Health Check", test_health),
        ("Templates API", test_templates),
        ("Certificate Generation", test_certificate_generation),
        ("Async Generation", test_async_generation),
        ("Frontend Access", test_frontend_access),
    ]

    results = []
    for test_name, test_func in tests:
        print(f"\n📋 {test_name}")
        print("-" * 30)
        result = test_func()
        results.append((test_name, result is not None and result != False))
        print()

    print("=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)

    passed = 0
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name:.<30} {status}")
        if success:
            passed += 1

    print(f"\nOverall: {passed}/{len(results)} tests passed")

    if passed == len(results):
        print("\n🎉 ALL TESTS PASSED! The Certificate Generator is fully functional.")
        print("\n📝 Next steps:")
        print("1. Open http://localhost:8081 in your browser")
        print("2. Upload the test_recipients.csv file")
        print("3. Select a template")
        print("4. Generate certificates")
    else:
        print(
            f"\n⚠️  {len(results) - passed} tests failed. Please check the issues above."
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
