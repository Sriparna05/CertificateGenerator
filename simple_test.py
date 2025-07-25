#!/usr/bin/env python3
"""
Simple direct test without imports
"""

import os


def test_simple():
    print("Simple test - checking certificate templates directory")

    # Check if certificate_templates directory exists
    if os.path.exists("certificate_templates"):
        print("✓ certificate_templates directory exists")

        html_dir = os.path.join("certificate_templates", "html")
        if os.path.exists(html_dir):
            html_files = [f for f in os.listdir(html_dir) if f.endswith(".html")]
            print(f"✓ Found {len(html_files)} HTML templates: {html_files}")
        else:
            print("✗ HTML templates directory not found")
    else:
        print("✗ certificate_templates directory not found")

    # Check if generated_certificates directory exists
    if os.path.exists("generated_certificates"):
        files = os.listdir("generated_certificates")
        print(f"✓ generated_certificates directory exists with {len(files)} files")

        # Check for different formats
        png_files = [f for f in files if f.endswith(".png")]
        jpeg_files = [f for f in files if f.endswith(".jpeg")]
        pdf_files = [f for f in files if f.endswith(".pdf")]

        print(f"  PNG files: {len(png_files)}")
        print(f"  JPEG files: {len(jpeg_files)}")
        print(f"  PDF files: {len(pdf_files)}")

        if png_files:
            # Check a PNG file
            png_path = os.path.join("generated_certificates", png_files[0])
            size = os.path.getsize(png_path)
            print(f"  Sample PNG: {png_files[0]} ({size} bytes)")

            # Try to open with PIL
            try:
                from PIL import Image

                with Image.open(png_path) as img:
                    print(
                        f"  PNG dimensions: {img.size}, mode: {img.mode}, format: {img.format}"
                    )
            except Exception as e:
                print(f"  Error opening PNG: {e}")

        if jpeg_files:
            # Check a JPEG file
            jpeg_path = os.path.join("generated_certificates", jpeg_files[0])
            size = os.path.getsize(jpeg_path)
            print(f"  Sample JPEG: {jpeg_files[0]} ({size} bytes)")

            # Try to open with PIL
            try:
                from PIL import Image

                with Image.open(jpeg_path) as img:
                    print(
                        f"  JPEG dimensions: {img.size}, mode: {img.mode}, format: {img.format}"
                    )
            except Exception as e:
                print(f"  Error opening JPEG: {e}")

    else:
        print("✗ generated_certificates directory not found")


if __name__ == "__main__":
    test_simple()
