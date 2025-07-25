#!/usr/bin/env python3
"""Quick test of image generation issue"""

import requests
import json

# Test templates
print("=== Testing Templates ===")
response = requests.get("http://127.0.0.1:5000/api/v1/templates")
if response.status_code == 200:
    templates = response.json()
    print(f"Available templates: {templates}")
    html_templates = templates.get("templates", {}).get("html", [])
    print(f"HTML templates: {html_templates}")
else:
    print(f"Error getting templates: {response.status_code}")
    exit(1)

# Test certificate generation in different formats
test_recipient = {
    "name": "Test User",
    "course": "Test Course",
    "date": "2025-01-01",
    "instructor": "Test Instructor",
}

formats_to_test = ["pdf", "html", "png", "jpeg"]
template_to_use = html_templates[0] if html_templates else "modern_excellence.html"

print(f"\n=== Testing Certificate Generation with {template_to_use} ===")

for format_type in formats_to_test:
    print(f"\nTesting {format_type.upper()} format...")

    payload = {
        "template_id": template_to_use,
        "output_format": format_type,
        "recipients": [test_recipient],
    }

    response = requests.post(
        "http://127.0.0.1:5000/api/v1/certificates/generate", json=payload
    )

    if response.status_code == 200:
        result = response.json()
        print(f"✅ {format_type.upper()} generation successful")
        print(f"   Status: {result.get('status')}")
        print(f"   Successful: {result.get('successful', 0)}")
        print(f"   Failed: {result.get('failed', 0)}")

        if result.get("results"):
            for cert_result in result["results"]:
                if cert_result.get("file_path"):
                    file_path = cert_result["file_path"]
                    filename = file_path.split("/")[-1]
                    print(f"   Generated file: {filename}")

                    # Test download
                    download_url = (
                        f"http://127.0.0.1:5000/generated_certificates/{filename}"
                    )
                    download_response = requests.get(download_url)
                    if download_response.status_code == 200:
                        print(
                            f"   ✅ Download successful - {len(download_response.content)} bytes"
                        )
                    else:
                        print(
                            f"   ❌ Download failed - HTTP {download_response.status_code}"
                        )
                else:
                    print(f"   ❌ No file path in result")
    else:
        print(
            f"❌ {format_type.upper()} generation failed - HTTP {response.status_code}"
        )
        try:
            error_detail = response.json()
            print(f"   Error: {error_detail}")
        except:
            print(f"   Raw response: {response.text}")

print("\n=== Test Complete ===")
