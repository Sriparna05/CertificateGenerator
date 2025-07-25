#!/usr/bin/env python3
"""
Final System Test Report for Certificate Generator API
This script performs a comprehensive test of all functionality and generates a report.
"""

import requests
import time
import base64
import os
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:5000"
USERNAME = "admin"
PASSWORD = "password123"


def get_auth_header():
    """Get basic auth header."""
    credentials = base64.b64encode(f"{USERNAME}:{PASSWORD}".encode()).decode()
    return {"Authorization": f"Basic {credentials}"}


def generate_report():
    """Generate a comprehensive test report."""
    print("=" * 80)
    print("CERTIFICATE GENERATOR API - SYSTEM TEST REPORT")
    print("=" * 80)
    print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"API Base URL: {BASE_URL}")
    print()

    results = {"total_tests": 0, "passed": 0, "failed": 0, "tests": []}

    # Test 1: Health Check
    print("1. Testing Health Check Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/health", timeout=5)
        if response.status_code == 200 and response.json()["status"] == "ok":
            print("   ✓ PASSED - Health check endpoint working")
            results["passed"] += 1
            results["tests"].append({"name": "Health Check", "status": "PASSED"})
        else:
            print("   ✗ FAILED - Health check endpoint not working")
            results["failed"] += 1
            results["tests"].append({"name": "Health Check", "status": "FAILED"})
    except Exception as e:
        print(f"   ✗ FAILED - Health check error: {e}")
        results["failed"] += 1
        results["tests"].append(
            {"name": "Health Check", "status": "FAILED", "error": str(e)}
        )
    results["total_tests"] += 1

    # Test 2: Template Listing
    print("\n2. Testing Template Listing...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/templates", timeout=5)
        data = response.json()
        templates = data.get("templates", {})

        template_count = sum(len(v) for v in templates.values())
        print(f"   Available templates: {template_count}")
        print(f"   HTML templates: {len(templates.get('html', []))}")
        print(f"   Image templates: {len(templates.get('images', []))}")
        print(f"   PPTX templates: {len(templates.get('pptx', []))}")

        if response.status_code == 200 and template_count > 0:
            print("   ✓ PASSED - Template listing working")
            results["passed"] += 1
            results["tests"].append(
                {
                    "name": "Template Listing",
                    "status": "PASSED",
                    "templates": template_count,
                }
            )
        else:
            print("   ✗ FAILED - No templates found")
            results["failed"] += 1
            results["tests"].append({"name": "Template Listing", "status": "FAILED"})
    except Exception as e:
        print(f"   ✗ FAILED - Template listing error: {e}")
        results["failed"] += 1
        results["tests"].append(
            {"name": "Template Listing", "status": "FAILED", "error": str(e)}
        )
    results["total_tests"] += 1

    # Test 3: Authentication
    print("\n3. Testing Authentication...")
    try:
        # Test without auth
        no_auth_response = requests.post(
            f"{BASE_URL}/api/v1/certificates/generate", json={}, timeout=5
        )

        # Test with wrong auth
        wrong_auth = {"Authorization": "Basic d3JvbmdfY3JlZGVudGlhbHM="}
        wrong_auth_response = requests.post(
            f"{BASE_URL}/api/v1/certificates/generate",
            json={},
            headers=wrong_auth,
            timeout=5,
        )

        if (
            no_auth_response.status_code == 401
            and wrong_auth_response.status_code == 401
        ):
            print("   ✓ PASSED - Authentication working correctly")
            results["passed"] += 1
            results["tests"].append({"name": "Authentication", "status": "PASSED"})
        else:
            print("   ✗ FAILED - Authentication not working")
            results["failed"] += 1
            results["tests"].append({"name": "Authentication", "status": "FAILED"})
    except Exception as e:
        print(f"   ✗ FAILED - Authentication test error: {e}")
        results["failed"] += 1
        results["tests"].append(
            {"name": "Authentication", "status": "FAILED", "error": str(e)}
        )
    results["total_tests"] += 1

    # Test 4: Synchronous Certificate Generation
    print("\n4. Testing Synchronous Certificate Generation...")
    try:
        payload = {
            "template_id": "achievement_template.html",
            "output_format": "pdf",
            "recipients": [
                {
                    "name": "System Test User",
                    "course": "Automated Testing",
                    "date": "December 25, 2024",
                    "instructor": "Test Bot",
                    "organization": "QA Department",
                }
            ],
        }

        response = requests.post(
            f"{BASE_URL}/api/v1/certificates/generate",
            json=payload,
            headers=get_auth_header(),
            timeout=30,
        )

        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "completed" and data.get("successful", 0) > 0:
                print("   ✓ PASSED - Synchronous generation working")
                print(f"   Generated {data.get('successful', 0)} certificates")
                results["passed"] += 1
                results["tests"].append(
                    {
                        "name": "Sync Generation",
                        "status": "PASSED",
                        "generated": data.get("successful", 0),
                    }
                )
            else:
                print(f"   ✗ FAILED - Generation failed: {data}")
                results["failed"] += 1
                results["tests"].append({"name": "Sync Generation", "status": "FAILED"})
        else:
            print(f"   ✗ FAILED - HTTP {response.status_code}")
            results["failed"] += 1
            results["tests"].append({"name": "Sync Generation", "status": "FAILED"})
    except Exception as e:
        print(f"   ✗ FAILED - Sync generation error: {e}")
        results["failed"] += 1
        results["tests"].append(
            {"name": "Sync Generation", "status": "FAILED", "error": str(e)}
        )
    results["total_tests"] += 1

    # Test 5: Asynchronous Certificate Generation
    print("\n5. Testing Asynchronous Certificate Generation...")
    try:
        payload = {
            "template_id": "achievement_template.html",
            "output_format": "pdf",
            "recipients": [
                {
                    "name": "Async Test User",
                    "course": "Asynchronous Processing",
                    "date": "December 25, 2024",
                }
            ],
        }

        # Submit async job
        response = requests.post(
            f"{BASE_URL}/api/v1/certificates/generate_async", json=payload, timeout=10
        )

        if response.status_code == 202:
            job_id = response.json()["job_id"]
            print(f"   Job submitted: {job_id}")

            # Wait for completion
            for attempt in range(10):
                time.sleep(2)
                status_response = requests.get(
                    f"{BASE_URL}/api/v1/jobs/{job_id}", timeout=5
                )
                status_data = status_response.json()

                if status_data["state"] in ["SUCCESS", "FAILURE"]:
                    if (
                        status_data["state"] == "SUCCESS"
                        and status_data.get("result", {}).get("successful", 0) > 0
                    ):
                        print("   ✓ PASSED - Asynchronous generation working")
                        results["passed"] += 1
                        results["tests"].append(
                            {"name": "Async Generation", "status": "PASSED"}
                        )
                    else:
                        print(f"   ✗ FAILED - Async job failed: {status_data}")
                        results["failed"] += 1
                        results["tests"].append(
                            {"name": "Async Generation", "status": "FAILED"}
                        )
                    break
            else:
                print("   ✗ FAILED - Job timeout")
                results["failed"] += 1
                results["tests"].append(
                    {"name": "Async Generation", "status": "FAILED", "error": "timeout"}
                )
        else:
            print(f"   ✗ FAILED - Job submission failed: {response.status_code}")
            results["failed"] += 1
            results["tests"].append({"name": "Async Generation", "status": "FAILED"})
    except Exception as e:
        print(f"   ✗ FAILED - Async generation error: {e}")
        results["failed"] += 1
        results["tests"].append(
            {"name": "Async Generation", "status": "FAILED", "error": str(e)}
        )
    results["total_tests"] += 1

    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Total Tests: {results['total_tests']}")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {results['failed']}")
    print(
        f"Success Rate: {(results['passed'] / results['total_tests'] * 100):.1f}%"
        if results["total_tests"] > 0
        else "0%"
    )

    if results["failed"] == 0:
        print(
            "\n🎉 ALL TESTS PASSED! The Certificate Generator API is working correctly."
        )
    else:
        print(
            f"\n⚠️  {results['failed']} test(s) failed. Please check the issues above."
        )

    # Check generated files
    print("\n" + "=" * 80)
    print("GENERATED CERTIFICATES")
    print("=" * 80)
    try:
        cert_files = [
            f for f in os.listdir("generated_certificates") if f.startswith("cert_")
        ]
        print(f"Total generated certificate files: {len(cert_files)}")

        recent_files = sorted([f for f in cert_files if "20250724" in f])[-5:]
        if recent_files:
            print("\nRecent certificates:")
            for f in recent_files:
                file_path = os.path.join("generated_certificates", f)
                size = os.path.getsize(file_path)
                print(f"  {f} ({size} bytes)")
    except Exception as e:
        print(f"Error checking certificate files: {e}")

    print("\n" + "=" * 80)

    return results


if __name__ == "__main__":
    try:
        results = generate_report()
        exit_code = 0 if results["failed"] == 0 else 1
        exit(exit_code)
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
        exit(1)
    except Exception as e:
        print(f"Test framework error: {e}")
        exit(1)
