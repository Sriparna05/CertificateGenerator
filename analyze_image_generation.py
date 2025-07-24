#!/usr/bin/env python3
"""
Final verification of image generation functionality.
This script checks existing generated files and verifies image generation is working.
"""

import os
from PIL import Image
import json
from datetime import datetime


def analyze_generated_files():
    """Analyze all generated files to verify image generation status"""
    print("Certificate Generation Analysis Report")
    print("=" * 50)
    print(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    gen_dir = "generated_certificates"

    if not os.path.exists(gen_dir):
        print(f"❌ Generated certificates directory '{gen_dir}' not found!")
        return

    # Get all files
    all_files = os.listdir(gen_dir)

    # Categorize files
    files_by_type = {
        "pdf": [f for f in all_files if f.endswith(".pdf")],
        "png": [f for f in all_files if f.endswith(".png")],
        "jpeg": [f for f in all_files if f.endswith(".jpeg")],
        "html": [f for f in all_files if f.endswith(".html")],
        "csv": [f for f in all_files if f.endswith(".csv")],
        "other": [
            f
            for f in all_files
            if not any(
                f.endswith(ext) for ext in [".pdf", ".png", ".jpeg", ".html", ".csv"]
            )
        ],
    }

    print("📊 FILE SUMMARY")
    print("-" * 20)
    total_files = len(all_files)
    print(f"Total files: {total_files}")

    for file_type, files in files_by_type.items():
        count = len(files)
        percentage = (count / total_files * 100) if total_files > 0 else 0
        print(f"{file_type.upper()}: {count} files ({percentage:.1f}%)")

    print()

    # Analyze image files in detail
    if files_by_type["png"] or files_by_type["jpeg"]:
        print("🖼️  IMAGE ANALYSIS")
        print("-" * 20)

        image_files = files_by_type["png"] + files_by_type["jpeg"]
        valid_images = 0
        invalid_images = 0
        total_size = 0

        image_details = []

        for img_file in image_files[:10]:  # Analyze first 10 images
            img_path = os.path.join(gen_dir, img_file)

            try:
                file_size = os.path.getsize(img_path)
                total_size += file_size

                with Image.open(img_path) as img:
                    width, height = img.size
                    format_type = img.format
                    mode = img.mode

                    # Check if image is reasonable
                    is_valid = (
                        width >= 500
                        and height >= 300  # Minimum dimensions
                        and file_size >= 5000  # Minimum file size (5KB)
                    )

                    if is_valid:
                        valid_images += 1
                        status = "✅ Valid"
                    else:
                        invalid_images += 1
                        status = "❌ Invalid"

                    image_details.append(
                        {
                            "file": img_file,
                            "size": f"{width}x{height}",
                            "format": format_type,
                            "mode": mode,
                            "file_size": f"{file_size:,} bytes",
                            "status": status,
                        }
                    )

            except Exception as e:
                invalid_images += 1
                image_details.append(
                    {"file": img_file, "status": f"❌ Error: {str(e)}"}
                )

        print(f"Images analyzed: {len(image_details)}")
        print(f"Valid images: {valid_images}")
        print(f"Invalid images: {invalid_images}")

        if total_size > 0:
            avg_size = total_size / len(image_details)
            print(f"Average file size: {avg_size:,.0f} bytes")

        print("\nImage Details:")
        for detail in image_details:
            file_name = (
                detail["file"][:40] + "..."
                if len(detail["file"]) > 40
                else detail["file"]
            )
            print(f"  {file_name}")
            if "size" in detail:
                print(
                    f"    Size: {detail['size']}, Format: {detail['format']}, Mode: {detail['mode']}"
                )
                print(f"    File Size: {detail['file_size']}")
            print(f"    Status: {detail['status']}")
            print()
    else:
        print("🖼️  IMAGE ANALYSIS")
        print("-" * 20)
        print("❌ No PNG or JPEG image files found!")
        print("This indicates that image generation is NOT working.")
        print()

    # Check PDF to image conversion capability
    print("🔄 CONVERSION CAPABILITY CHECK")
    print("-" * 30)

    # Check if required libraries are available
    try:
        import importlib.util

        spec = importlib.util.find_spec("pdf2image")
        if spec is not None:
            print("✅ pdf2image library is available")
        else:
            print("❌ pdf2image library is NOT available")
            print("   Install with: pip install pdf2image")
    except ImportError:
        print("❌ pdf2image library is NOT available")
        print("   Install with: pip install pdf2image")

    try:
        import importlib.util

        spec = importlib.util.find_spec("weasyprint")
        if spec is not None:
            print("✅ weasyprint library is available")
        else:
            print("❌ weasyprint library is NOT available")
            print("   Install with: pip install weasyprint")
    except ImportError:
        print("❌ weasyprint library is NOT available")
        print("   Install with: pip install weasyprint")

    try:
        import importlib.util

        spec = importlib.util.find_spec("PIL")
        if spec is not None:
            print("✅ PIL (Pillow) library is available")
        else:
            print("❌ PIL (Pillow) library is NOT available")
            print("   Install with: pip install Pillow")
    except ImportError:
        print("❌ PIL (Pillow) library is NOT available")
        print("   Install with: pip install Pillow")

    print()

    # Template analysis
    print("📋 TEMPLATE ANALYSIS")
    print("-" * 20)

    template_dir = "certificate_templates/html"
    if os.path.exists(template_dir):
        templates = [f for f in os.listdir(template_dir) if f.endswith(".html")]
        print(f"Available HTML templates: {len(templates)}")
        for template in templates:
            print(f"  • {template}")
    else:
        print("❌ Template directory not found!")

    print()

    # Recommendations
    print("💡 RECOMMENDATIONS")
    print("-" * 20)

    if not files_by_type["png"] and not files_by_type["jpeg"]:
        print("❌ CRITICAL: Image generation is not working!")
        print("   Recommended actions:")
        print("   1. Ensure pdf2image is installed: pip install pdf2image")
        print("   2. Check if Poppler is installed (required by pdf2image)")
        print("   3. Test PDF generation first, then image conversion")
        print("   4. Check server logs for conversion errors")
    elif valid_images < len(files_by_type["png"] + files_by_type["jpeg"]) / 2:
        print("⚠️  WARNING: Image generation is partially working")
        print("   Some images may be corrupted or malformed")
    else:
        print("✅ Image generation appears to be working correctly!")
        print("   Images are being generated with proper dimensions and file sizes")

    if files_by_type["pdf"]:
        print(f"✅ PDF generation is working ({len(files_by_type['pdf'])} files)")
    else:
        print("❌ PDF generation may not be working")

    print()

    # Generate summary report
    summary = {
        "timestamp": datetime.now().isoformat(),
        "total_files": total_files,
        "file_counts": {k: len(v) for k, v in files_by_type.items()},
        "image_analysis": {
            "total_images": len(files_by_type["png"] + files_by_type["jpeg"]),
            "valid_images": valid_images if "valid_images" in locals() else 0,
            "invalid_images": invalid_images if "invalid_images" in locals() else 0,
        },
        "status": "working"
        if files_by_type["png"] or files_by_type["jpeg"]
        else "not_working",
    }

    # Save summary report
    with open("image_generation_analysis.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(f"📄 Detailed analysis saved to: image_generation_analysis.json")


if __name__ == "__main__":
    # Change to the project directory
    os.chdir("/home/illionar/Gemini/CertificateGenerator")
    analyze_generated_files()
