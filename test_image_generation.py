#!/usr/bin/env python3
"""
Comprehensive test script for certificate image generation.
This script will test all aspects of image generation including:
- PDF to PNG conversion
- PDF to JPEG conversion
- HTML to image conversion
- Edge cases and error handling
- File quality verification
"""

import os
import sys
import requests
import time
from PIL import Image

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from app.services.certificate_service import generate_certificate, list_templates


class ImageGenerationTester:
    def __init__(self):
        self.base_url = "http://localhost:5000"
        self.test_results = []
        self.generated_files = []

    def log_result(self, test_name, success, message="", file_path=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "file_path": file_path,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        self.test_results.append(result)

        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"    {message}")
        if file_path and os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            print(f"    File: {file_path} ({file_size} bytes)")
            self.generated_files.append(file_path)
        print()

    def verify_image_quality(self, image_path, format_type):
        """Verify image quality and properties"""
        try:
            with Image.open(image_path) as img:
                width, height = img.size
                mode = img.mode

                # Check minimum dimensions
                if width < 500 or height < 300:
                    return False, f"Image too small: {width}x{height}"

                # Check format
                if img.format.upper() != format_type.upper():
                    return (
                        False,
                        f"Wrong format: expected {format_type}, got {img.format}",
                    )

                # Check mode for JPEG (should be RGB)
                if format_type.upper() == "JPEG" and mode not in ["RGB", "L"]:
                    return False, f"Invalid mode for JPEG: {mode}"

                return True, f"Valid {format_type}: {width}x{height}, mode={mode}"

        except Exception as e:
            return False, f"Cannot open image: {str(e)}"

    def test_backend_service_directly(self):
        """Test backend service functions directly"""
        print("Testing backend service functions directly...")

        # Test HTML templates exist
        templates = list_templates()
        html_templates = templates.get("html", [])

        if not html_templates:
            self.log_result(
                "HTML Templates Available", False, "No HTML templates found"
            )
            return

        self.log_result(
            "HTML Templates Available",
            True,
            f"Found {len(html_templates)} templates: {html_templates}",
        )

        # Test with first available template
        template_id = html_templates[0]

        # Test data
        test_recipients = [
            {
                "name": "Test Person",
                "course": "Advanced Python Programming",
                "date": "January 25, 2025",
                "instructor": "Dr. Smith",
                "organization": "Tech Academy",
            }
        ]

        # Test PDF generation
        try:
            result = generate_certificate(template_id, "pdf", test_recipients)
            if result["status"] == "completed" and result["successful"] > 0:
                pdf_path = result["results"][0]["file_path"]
                self.log_result(
                    "PDF Generation (Direct)", True, "Generated PDF", pdf_path
                )
            else:
                self.log_result(
                    "PDF Generation (Direct)", False, f"PDF generation failed: {result}"
                )
        except Exception as e:
            self.log_result("PDF Generation (Direct)", False, f"Exception: {str(e)}")

        # Test PNG generation
        try:
            result = generate_certificate(template_id, "png", test_recipients)
            if result["status"] == "completed" and result["successful"] > 0:
                png_path = result["results"][0]["file_path"]
                is_valid, message = self.verify_image_quality(png_path, "PNG")
                self.log_result("PNG Generation (Direct)", is_valid, message, png_path)
            else:
                self.log_result(
                    "PNG Generation (Direct)", False, f"PNG generation failed: {result}"
                )
        except Exception as e:
            self.log_result("PNG Generation (Direct)", False, f"Exception: {str(e)}")

        # Test JPEG generation
        try:
            result = generate_certificate(template_id, "jpeg", test_recipients)
            if result["status"] == "completed" and result["successful"] > 0:
                jpeg_path = result["results"][0]["file_path"]
                is_valid, message = self.verify_image_quality(jpeg_path, "JPEG")
                self.log_result(
                    "JPEG Generation (Direct)", is_valid, message, jpeg_path
                )
            else:
                self.log_result(
                    "JPEG Generation (Direct)",
                    False,
                    f"JPEG generation failed: {result}",
                )
        except Exception as e:
            self.log_result("JPEG Generation (Direct)", False, f"Exception: {str(e)}")

    def test_api_endpoints(self):
        """Test API endpoints for image generation"""
        print("Testing API endpoints...")

        # Test server availability
        try:
            response = requests.get(f"{self.base_url}/health")
            if response.status_code == 200:
                self.log_result("Server Health Check", True, "Server is running")
            else:
                self.log_result(
                    "Server Health Check",
                    False,
                    f"Server returned {response.status_code}",
                )
                return
        except requests.ConnectionError:
            self.log_result("Server Health Check", False, "Cannot connect to server")
            return

        # Get available templates
        try:
            response = requests.get(f"{self.base_url}/api/templates")
            if response.status_code == 200:
                templates = response.json()
                html_templates = templates.get("html", [])
                if html_templates:
                    template_id = html_templates[0]
                    self.log_result(
                        "Template API", True, f"Using template: {template_id}"
                    )
                else:
                    self.log_result(
                        "Template API", False, "No HTML templates available"
                    )
                    return
            else:
                self.log_result(
                    "Template API",
                    False,
                    f"Templates API failed: {response.status_code}",
                )
                return
        except Exception as e:
            self.log_result("Template API", False, f"Exception: {str(e)}")
            return

        # Test certificate generation API
        test_data = {
            "template_id": template_id,
            "recipients": [
                {
                    "name": "API Test User",
                    "course": "Certificate Generation Testing",
                    "date": "January 25, 2025",
                    "instructor": "Test Instructor",
                    "organization": "Test Organization",
                }
            ],
        }

        # Test each format
        for format_type in ["pdf", "png", "jpeg", "html"]:
            try:
                test_data["output_format"] = format_type
                response = requests.post(
                    f"{self.base_url}/api/generate", json=test_data
                )

                if response.status_code == 200:
                    result = response.json()
                    if (
                        result.get("status") == "completed"
                        and result.get("successful", 0) > 0
                    ):
                        file_path = result["results"][0]["file_path"]

                        if format_type in ["png", "jpeg"]:
                            is_valid, message = self.verify_image_quality(
                                file_path, format_type.upper()
                            )
                            self.log_result(
                                f"API {format_type.upper()} Generation",
                                is_valid,
                                message,
                                file_path,
                            )
                        else:
                            self.log_result(
                                f"API {format_type.upper()} Generation",
                                True,
                                "Generated successfully",
                                file_path,
                            )
                    else:
                        self.log_result(
                            f"API {format_type.upper()} Generation",
                            False,
                            f"Generation failed: {result}",
                        )
                else:
                    self.log_result(
                        f"API {format_type.upper()} Generation",
                        False,
                        f"API returned {response.status_code}",
                    )

            except Exception as e:
                self.log_result(
                    f"API {format_type.upper()} Generation",
                    False,
                    f"Exception: {str(e)}",
                )

        # Test download API
        try:
            # Generate a certificate first
            test_data["output_format"] = "png"
            response = requests.post(f"{self.base_url}/api/generate", json=test_data)

            if response.status_code == 200:
                result = response.json()
                if (
                    result.get("status") == "completed"
                    and result.get("successful", 0) > 0
                ):
                    file_path = result["results"][0]["file_path"]
                    filename = os.path.basename(file_path)

                    # Test download
                    download_response = requests.get(
                        f"{self.base_url}/api/download/{filename}"
                    )
                    if download_response.status_code == 200:
                        self.log_result(
                            "Download API",
                            True,
                            f"Downloaded {filename} ({len(download_response.content)} bytes)",
                        )
                    else:
                        self.log_result(
                            "Download API",
                            False,
                            f"Download failed: {download_response.status_code}",
                        )
                else:
                    self.log_result(
                        "Download API",
                        False,
                        "Could not generate file for download test",
                    )
            else:
                self.log_result(
                    "Download API", False, "Could not generate file for download test"
                )

        except Exception as e:
            self.log_result("Download API", False, f"Exception: {str(e)}")

    def test_edge_cases(self):
        """Test edge cases and error conditions"""
        print("Testing edge cases...")

        # Test with empty recipient data
        try:
            result = generate_certificate("modern_excellence.html", "png", [{}])
            success = result["status"] == "completed" and result["successful"] > 0
            self.log_result(
                "Empty Recipient Data", success, "Handled empty recipient data"
            )
        except Exception as e:
            self.log_result("Empty Recipient Data", False, f"Exception: {str(e)}")

        # Test with special characters
        try:
            special_recipients = [
                {
                    "name": "Tëst Üsér with Spëciål Chārs",
                    "course": "Cöursé with Émojis 🎓",
                    "date": "January 25, 2025",
                    "instructor": "Dr. François",
                    "organization": "Académie Française",
                }
            ]
            result = generate_certificate(
                "modern_excellence.html", "png", special_recipients
            )
            success = result["status"] == "completed" and result["successful"] > 0
            self.log_result("Special Characters", success, "Handled special characters")
        except Exception as e:
            self.log_result("Special Characters", False, f"Exception: {str(e)}")

        # Test with long text
        try:
            long_recipients = [
                {
                    "name": "This Is A Very Long Name That Should Test Text Wrapping And Layout",
                    "course": "This Is An Extremely Long Course Name That Might Cause Layout Issues With Text Wrapping And Positioning",
                    "date": "January 25, 2025",
                    "instructor": "Professor With A Very Long Name That Tests Text Handling",
                    "organization": "The International Academy of Advanced Learning and Professional Development",
                }
            ]
            result = generate_certificate(
                "modern_excellence.html", "png", long_recipients
            )
            success = result["status"] == "completed" and result["successful"] > 0
            self.log_result("Long Text Handling", success, "Handled long text")
        except Exception as e:
            self.log_result("Long Text Handling", False, f"Exception: {str(e)}")

        # Test invalid template
        try:
            result = generate_certificate(
                "nonexistent_template.html", "png", [{"name": "Test"}]
            )
            success = result["status"] == "completed" and result["failed"] == 1
            self.log_result(
                "Invalid Template", success, "Handled invalid template gracefully"
            )
        except Exception as e:
            self.log_result(
                "Invalid Template", True, f"Properly raised exception: {str(e)}"
            )

        # Test invalid format
        try:
            result = generate_certificate(
                "modern_excellence.html", "invalid_format", [{"name": "Test"}]
            )
            success = result["status"] == "completed" and result["failed"] == 1
            self.log_result(
                "Invalid Format", success, "Handled invalid format gracefully"
            )
        except Exception as e:
            self.log_result(
                "Invalid Format", True, f"Properly raised exception: {str(e)}"
            )

    def test_batch_generation(self):
        """Test batch generation with multiple recipients"""
        print("Testing batch generation...")

        # Test multiple recipients
        batch_recipients = []
        for i in range(5):
            batch_recipients.append(
                {
                    "name": f"Batch User {i + 1}",
                    "course": f"Batch Course {i + 1}",
                    "date": "January 25, 2025",
                    "instructor": "Batch Instructor",
                    "organization": "Batch Organization",
                }
            )

        for format_type in ["png", "jpeg", "pdf"]:
            try:
                result = generate_certificate(
                    "modern_excellence.html", format_type, batch_recipients
                )
                if result["status"] == "completed":
                    success_count = result["successful"]
                    total_count = result["total_recipients"]
                    self.log_result(
                        f"Batch {format_type.upper()} Generation",
                        success_count == total_count,
                        f"Generated {success_count}/{total_count} certificates",
                    )
                else:
                    self.log_result(
                        f"Batch {format_type.upper()} Generation",
                        False,
                        "Batch generation failed",
                    )
            except Exception as e:
                self.log_result(
                    f"Batch {format_type.upper()} Generation",
                    False,
                    f"Exception: {str(e)}",
                )

    def test_file_cleanup_and_storage(self):
        """Test file cleanup and storage"""
        print("Testing file cleanup and storage...")

        # Check generated_certificates directory
        gen_dir = "generated_certificates"
        if os.path.exists(gen_dir):
            files_before = len(os.listdir(gen_dir))
            self.log_result(
                "Generated Directory Exists", True, f"Found {files_before} files"
            )

            # Generate a test certificate
            try:
                generate_certificate(
                    "modern_excellence.html", "png", [{"name": "Cleanup Test"}]
                )
                files_after = len(os.listdir(gen_dir))

                if files_after > files_before:
                    self.log_result(
                        "File Storage",
                        True,
                        f"File count increased from {files_before} to {files_after}",
                    )
                else:
                    self.log_result("File Storage", False, "No new files created")

            except Exception as e:
                self.log_result("File Storage", False, f"Exception: {str(e)}")
        else:
            self.log_result(
                "Generated Directory Exists",
                False,
                "Generated certificates directory not found",
            )

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("IMAGE GENERATION TEST SUMMARY")
        print("=" * 60)

        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests

        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests / total_tests) * 100:.1f}%")

        if failed_tests > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ✗ {result['test']}: {result['message']}")

        print(f"\nGenerated Files ({len(self.generated_files)}):")
        for file_path in self.generated_files[-10:]:  # Show last 10 files
            if os.path.exists(file_path):
                size = os.path.getsize(file_path)
                print(f"  {os.path.basename(file_path)} ({size} bytes)")

        if len(self.generated_files) > 10:
            print(f"  ... and {len(self.generated_files) - 10} more files")

    def run_all_tests(self):
        """Run all tests"""
        print("Starting comprehensive image generation tests...\n")

        # Install missing dependency if needed
        try:
            import importlib.util

            if importlib.util.find_spec("pdf2image") is None:
                print("Installing pdf2image dependency...")
                os.system("pip install pdf2image")
        except ImportError:
            print("Installing pdf2image dependency...")
            os.system("pip install pdf2image")

        self.test_backend_service_directly()
        self.test_api_endpoints()
        self.test_edge_cases()
        self.test_batch_generation()
        self.test_file_cleanup_and_storage()

        self.print_summary()


if __name__ == "__main__":
    tester = ImageGenerationTester()
    tester.run_all_tests()
