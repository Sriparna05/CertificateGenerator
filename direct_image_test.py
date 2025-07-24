#!/usr/bin/env python3
"""
Direct test of image generation without API - to isolate the issue
"""

import os
import sys

# Add app directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.join(current_dir, "app")
sys.path.insert(0, app_dir)


def test_image_generation_direct():
    """Test image generation directly"""
    print("Testing Image Generation Directly")
    print("=" * 50)

    try:
        # Import the functions
        from app.services.certificate_service import (
            generate_certificate,
            list_templates,
        )

        print("✓ Successfully imported certificate service functions")

        # Check templates
        templates = list_templates()
        print(f"✓ Templates found: {templates}")

        html_templates = templates.get("html", [])
        if not html_templates:
            print("✗ No HTML templates found")
            return

        template_id = html_templates[0]
        print(f"✓ Using template: {template_id}")

        # Test recipients
        test_recipients = [
            {
                "name": "Direct Test User",
                "course": "Direct Image Generation Test",
                "date": "January 25, 2025",
                "instructor": "Direct Test Instructor",
                "organization": "Direct Test Org",
            }
        ]

        print("\nTesting PDF generation...")
        try:
            result = generate_certificate(template_id, "pdf", test_recipients)
            print(f"PDF Result: {result}")

            if result["status"] == "completed" and result["successful"] > 0:
                pdf_path = result["results"][0]["file_path"]
                if os.path.exists(pdf_path):
                    size = os.path.getsize(pdf_path)
                    print(f"✓ PDF generated: {pdf_path} ({size} bytes)")
                else:
                    print(f"✗ PDF file not found: {pdf_path}")
            else:
                print(f"✗ PDF generation failed")
        except Exception as e:
            print(f"✗ PDF generation error: {e}")
            import traceback

            traceback.print_exc()

        print("\nTesting PNG generation...")
        try:
            result = generate_certificate(template_id, "png", test_recipients)
            print(f"PNG Result status: {result.get('status')}")
            print(f"PNG Result successful: {result.get('successful')}")
            print(f"PNG Result failed: {result.get('failed')}")

            if result["status"] == "completed" and result["successful"] > 0:
                png_path = result["results"][0]["file_path"]
                print(f"PNG file path: {png_path}")

                if os.path.exists(png_path):
                    size = os.path.getsize(png_path)
                    print(f"✓ PNG generated: {png_path} ({size} bytes)")

                    # Try to verify with PIL
                    try:
                        from PIL import Image

                        with Image.open(png_path) as img:
                            print(
                                f"✓ PNG details: {img.size[0]}x{img.size[1]}, format={img.format}, mode={img.mode}"
                            )
                    except Exception as e:
                        print(f"✗ Error opening PNG with PIL: {e}")
                else:
                    print(f"✗ PNG file not found: {png_path}")
            else:
                print(f"✗ PNG generation failed")
                if result.get("results"):
                    for r in result["results"]:
                        if r.get("error"):
                            print(f"  Error: {r['error']}")
        except Exception as e:
            print(f"✗ PNG generation error: {e}")
            import traceback

            traceback.print_exc()

        print("\nTesting JPEG generation...")
        try:
            result = generate_certificate(template_id, "jpeg", test_recipients)
            print(f"JPEG Result status: {result.get('status')}")
            print(f"JPEG Result successful: {result.get('successful')}")

            if result["status"] == "completed" and result["successful"] > 0:
                jpeg_path = result["results"][0]["file_path"]
                print(f"JPEG file path: {jpeg_path}")

                if os.path.exists(jpeg_path):
                    size = os.path.getsize(jpeg_path)
                    print(f"✓ JPEG generated: {jpeg_path} ({size} bytes)")

                    # Try to verify with PIL
                    try:
                        from PIL import Image

                        with Image.open(jpeg_path) as img:
                            print(
                                f"✓ JPEG details: {img.size[0]}x{img.size[1]}, format={img.format}, mode={img.mode}"
                            )
                    except Exception as e:
                        print(f"✗ Error opening JPEG with PIL: {e}")
                else:
                    print(f"✗ JPEG file not found: {jpeg_path}")
            else:
                print(f"✗ JPEG generation failed")
                if result.get("results"):
                    for r in result["results"]:
                        if r.get("error"):
                            print(f"  Error: {r['error']}")
        except Exception as e:
            print(f"✗ JPEG generation error: {e}")
            import traceback

            traceback.print_exc()

    except Exception as e:
        print(f"✗ Import or setup error: {e}")
        import traceback

        traceback.print_exc()


def test_dependencies():
    """Test required dependencies"""
    print("\nTesting Dependencies")
    print("=" * 30)

    dependencies = [
        ("weasyprint", "WeasyPrint"),
        ("pdf2image", "pdf2image"),
        ("PIL", "Pillow"),
        ("jinja2", "Jinja2"),
    ]

    for module, name in dependencies:
        try:
            __import__(module)
            print(f"✓ {name} is available")
        except ImportError as e:
            print(f"✗ {name} is NOT available: {e}")


def check_existing_files():
    """Check existing generated files"""
    print("\nChecking Existing Generated Files")
    print("=" * 40)

    gen_dir = "generated_certificates"
    if os.path.exists(gen_dir):
        files = os.listdir(gen_dir)
        png_files = [f for f in files if f.endswith(".png")]
        jpeg_files = [f for f in files if f.endswith(".jpeg")]
        pdf_files = [f for f in files if f.endswith(".pdf")]
        html_files = [f for f in files if f.endswith(".html")]

        print(f"Total files: {len(files)}")
        print(f"PNG files: {len(png_files)}")
        print(f"JPEG files: {len(jpeg_files)}")
        print(f"PDF files: {len(pdf_files)}")
        print(f"HTML files: {len(html_files)}")

        # Test a few existing PNG files
        if png_files:
            print(f"\nTesting existing PNG files...")
            for png_file in png_files[:3]:  # Test first 3
                png_path = os.path.join(gen_dir, png_file)
                try:
                    from PIL import Image

                    with Image.open(png_path) as img:
                        size = os.path.getsize(png_path)
                        print(
                            f"✓ {png_file}: {img.size[0]}x{img.size[1]}, {size} bytes"
                        )
                except Exception as e:
                    print(f"✗ {png_file}: Error - {e}")

        # Test a few existing JPEG files
        if jpeg_files:
            print(f"\nTesting existing JPEG files...")
            for jpeg_file in jpeg_files[:3]:  # Test first 3
                jpeg_path = os.path.join(gen_dir, jpeg_file)
                try:
                    from PIL import Image

                    with Image.open(jpeg_path) as img:
                        size = os.path.getsize(jpeg_path)
                        print(
                            f"✓ {jpeg_file}: {img.size[0]}x{img.size[1]}, {size} bytes"
                        )
                except Exception as e:
                    print(f"✗ {jpeg_file}: Error - {e}")
    else:
        print("✗ generated_certificates directory not found")


if __name__ == "__main__":
    os.chdir("/home/illionar/Gemini/CertificateGenerator")

    test_dependencies()
    check_existing_files()
    test_image_generation_direct()
