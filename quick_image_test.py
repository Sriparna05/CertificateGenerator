#!/usr/bin/env python3
"""
Quick test for image generation - check if PDF to image conversion works
"""

import os
import sys

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from app.services.certificate_service import generate_certificate, list_templates


def quick_image_test():
    print("Quick Image Generation Test")
    print("=" * 40)

    # Check templates
    templates = list_templates()
    html_templates = templates.get("html", [])
    print(f"Available HTML templates: {html_templates}")

    if not html_templates:
        print("No HTML templates found!")
        return

    template_id = html_templates[0]
    print(f"Using template: {template_id}")

    # Test recipients
    test_recipients = [
        {
            "name": "Quick Test User",
            "course": "Image Generation Test",
            "date": "January 25, 2025",
            "instructor": "Test Instructor",
            "organization": "Test Org",
        }
    ]

    # Test PNG generation
    print("\nTesting PNG generation...")
    try:
        result = generate_certificate(template_id, "png", test_recipients)
        print(f"PNG Result: {result}")

        if result["status"] == "completed" and result["successful"] > 0:
            png_path = result["results"][0]["file_path"]
            if os.path.exists(png_path):
                size = os.path.getsize(png_path)
                print(f"✓ PNG generated successfully: {png_path} ({size} bytes)")
            else:
                print(f"✗ PNG file not found: {png_path}")
        else:
            print(f"✗ PNG generation failed: {result}")
    except Exception as e:
        print(f"✗ PNG generation exception: {e}")
        import traceback

        traceback.print_exc()

    # Test JPEG generation
    print("\nTesting JPEG generation...")
    try:
        result = generate_certificate(template_id, "jpeg", test_recipients)
        print(f"JPEG Result: {result}")

        if result["status"] == "completed" and result["successful"] > 0:
            jpeg_path = result["results"][0]["file_path"]
            if os.path.exists(jpeg_path):
                size = os.path.getsize(jpeg_path)
                print(f"✓ JPEG generated successfully: {jpeg_path} ({size} bytes)")
            else:
                print(f"✗ JPEG file not found: {jpeg_path}")
        else:
            print(f"✗ JPEG generation failed: {result}")
    except Exception as e:
        print(f"✗ JPEG generation exception: {e}")
        import traceback

        traceback.print_exc()

    # Test PDF generation for comparison
    print("\nTesting PDF generation...")
    try:
        result = generate_certificate(template_id, "pdf", test_recipients)
        print(f"PDF Result: {result}")

        if result["status"] == "completed" and result["successful"] > 0:
            pdf_path = result["results"][0]["file_path"]
            if os.path.exists(pdf_path):
                size = os.path.getsize(pdf_path)
                print(f"✓ PDF generated successfully: {pdf_path} ({size} bytes)")
            else:
                print(f"✗ PDF file not found: {pdf_path}")
        else:
            print(f"✗ PDF generation failed: {result}")
    except Exception as e:
        print(f"✗ PDF generation exception: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    quick_image_test()
