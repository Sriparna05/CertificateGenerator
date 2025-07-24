#!/usr/bin/env python3
"""
API Integration tests for image generation.
Tests the complete pipeline from API calls to file generation.
"""

import requests
import time
import os
from PIL import Image


class ImageGenerationAPITest:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.test_results = []

    def log_result(self, test_name, success, message=""):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        self.test_results.append(result)

        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"    {message}")

    def check_server_health(self):
        """Check if the server is running"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                self.log_result("Server Health Check", True, "Server is running")
                return True
            else:
                self.log_result(
                    "Server Health Check",
                    False,
                    f"Server returned {response.status_code}",
                )
                return False
        except requests.ConnectionError:
            self.log_result(
                "Server Health Check",
                False,
                "Cannot connect to server - is it running?",
            )
            return False
        except Exception as e:
            self.log_result("Server Health Check", False, f"Error: {str(e)}")
            return False

    def test_templates_api(self):
        """Test templates API"""
        try:
            response = requests.get(f"{self.base_url}/api/templates")
            if response.status_code == 200:
                templates = response.json()
                html_templates = templates.get("html", [])
                if html_templates:
                    self.log_result(
                        "Templates API",
                        True,
                        f"Found {len(html_templates)} HTML templates",
                    )
                    return html_templates[0]  # Return first template for further tests
                else:
                    self.log_result(
                        "Templates API", False, "No HTML templates available"
                    )
                    return None
            else:
                self.log_result(
                    "Templates API", False, f"API returned {response.status_code}"
                )
                return None
        except Exception as e:
            self.log_result("Templates API", False, f"Exception: {str(e)}")
            return None

    def test_png_generation_api(self, template_id):
        """Test PNG generation via API"""
        test_data = {
            "template_id": template_id,
            "output_format": "png",
            "recipients": [
                {
                    "name": "PNG API Test User",
                    "course": "API PNG Generation Course",
                    "date": "January 25, 2025",
                    "instructor": "API Test Instructor",
                    "organization": "API Test Organization",
                }
            ],
        }

        try:
            response = requests.post(f"{self.base_url}/api/generate", json=test_data)

            if response.status_code == 200:
                result = response.json()
                if (
                    result.get("status") == "completed"
                    and result.get("successful", 0) > 0
                ):
                    file_path = result["results"][0]["file_path"]

                    # Verify the file exists and is valid
                    if os.path.exists(file_path):
                        try:
                            with Image.open(file_path) as img:
                                if img.format == "PNG":
                                    size = os.path.getsize(file_path)
                                    self.log_result(
                                        "PNG Generation API",
                                        True,
                                        f"Generated PNG: {img.size[0]}x{img.size[1]}, {size} bytes",
                                    )
                                    return file_path
                                else:
                                    self.log_result(
                                        "PNG Generation API",
                                        False,
                                        f"Wrong format: {img.format}",
                                    )
                        except Exception as e:
                            self.log_result(
                                "PNG Generation API",
                                False,
                                f"Cannot open image: {str(e)}",
                            )
                    else:
                        self.log_result(
                            "PNG Generation API", False, f"File not found: {file_path}"
                        )
                else:
                    self.log_result(
                        "PNG Generation API", False, f"Generation failed: {result}"
                    )
            else:
                self.log_result(
                    "PNG Generation API", False, f"API returned {response.status_code}"
                )

        except Exception as e:
            self.log_result("PNG Generation API", False, f"Exception: {str(e)}")

        return None

    def test_jpeg_generation_api(self, template_id):
        """Test JPEG generation via API"""
        test_data = {
            "template_id": template_id,
            "output_format": "jpeg",
            "recipients": [
                {
                    "name": "JPEG API Test User",
                    "course": "API JPEG Generation Course",
                    "date": "January 25, 2025",
                }
            ],
        }

        try:
            response = requests.post(f"{self.base_url}/api/generate", json=test_data)

            if response.status_code == 200:
                result = response.json()
                if (
                    result.get("status") == "completed"
                    and result.get("successful", 0) > 0
                ):
                    file_path = result["results"][0]["file_path"]

                    if os.path.exists(file_path):
                        try:
                            with Image.open(file_path) as img:
                                if img.format == "JPEG" and img.mode in ["RGB", "L"]:
                                    size = os.path.getsize(file_path)
                                    self.log_result(
                                        "JPEG Generation API",
                                        True,
                                        f"Generated JPEG: {img.size[0]}x{img.size[1]}, {size} bytes",
                                    )
                                    return file_path
                                else:
                                    self.log_result(
                                        "JPEG Generation API",
                                        False,
                                        f"Wrong format/mode: {img.format}/{img.mode}",
                                    )
                        except Exception as e:
                            self.log_result(
                                "JPEG Generation API",
                                False,
                                f"Cannot open image: {str(e)}",
                            )
                    else:
                        self.log_result(
                            "JPEG Generation API", False, f"File not found: {file_path}"
                        )
                else:
                    self.log_result(
                        "JPEG Generation API", False, f"Generation failed: {result}"
                    )
            else:
                self.log_result(
                    "JPEG Generation API", False, f"API returned {response.status_code}"
                )

        except Exception as e:
            self.log_result("JPEG Generation API", False, f"Exception: {str(e)}")

        return None

    def test_batch_image_generation_api(self, template_id):
        """Test batch image generation via API"""
        # Create 5 test recipients
        recipients = []
        for i in range(5):
            recipients.append(
                {
                    "name": f"Batch Student {i + 1}",
                    "course": f"Batch Course {i + 1}",
                    "date": "January 25, 2025",
                    "instructor": "Batch Instructor",
                }
            )

        test_data = {
            "template_id": template_id,
            "output_format": "png",
            "recipients": recipients,
        }

        try:
            response = requests.post(f"{self.base_url}/api/generate", json=test_data)

            if response.status_code == 200:
                result = response.json()
                successful = result.get("successful", 0)
                total = result.get("total_recipients", 0)

                if successful == 5 and total == 5:
                    # Verify all files exist and are valid
                    valid_files = 0
                    for cert_result in result["results"]:
                        if cert_result["status"] == "success":
                            file_path = cert_result["file_path"]
                            if os.path.exists(file_path):
                                try:
                                    with Image.open(file_path) as img:
                                        if img.format == "PNG":
                                            valid_files += 1
                                except Exception:
                                    pass

                    if valid_files == 5:
                        self.log_result(
                            "Batch Image Generation API",
                            True,
                            f"Generated {valid_files}/5 valid PNG files",
                        )
                    else:
                        self.log_result(
                            "Batch Image Generation API",
                            False,
                            f"Only {valid_files}/5 files are valid",
                        )
                else:
                    self.log_result(
                        "Batch Image Generation API",
                        False,
                        f"Expected 5/5, got {successful}/{total}",
                    )
            else:
                self.log_result(
                    "Batch Image Generation API",
                    False,
                    f"API returned {response.status_code}",
                )

        except Exception as e:
            self.log_result("Batch Image Generation API", False, f"Exception: {str(e)}")

    def test_download_api(self, file_path):
        """Test file download API"""
        if not file_path:
            self.log_result("Download API", False, "No file to test download")
            return

        filename = os.path.basename(file_path)

        try:
            response = requests.get(f"{self.base_url}/api/download/{filename}")

            if response.status_code == 200:
                # Check content length
                content_length = len(response.content)

                if content_length > 1000:  # Reasonable file size
                    self.log_result(
                        "Download API",
                        True,
                        f"Downloaded {filename} ({content_length} bytes)",
                    )
                else:
                    self.log_result(
                        "Download API", False, f"File too small: {content_length} bytes"
                    )
            else:
                self.log_result(
                    "Download API", False, f"Download failed: {response.status_code}"
                )

        except Exception as e:
            self.log_result("Download API", False, f"Exception: {str(e)}")

    def test_zip_download_api(self, template_id):
        """Test ZIP download API for multiple images"""
        # Generate multiple certificates
        recipients = [
            {"name": "Zip User 1", "course": "Zip Course 1"},
            {"name": "Zip User 2", "course": "Zip Course 2"},
            {"name": "Zip User 3", "course": "Zip Course 3"},
        ]

        test_data = {
            "template_id": template_id,
            "output_format": "png",
            "recipients": recipients,
        }

        try:
            # Generate certificates
            generate_response = requests.post(
                f"{self.base_url}/api/generate", json=test_data
            )

            if generate_response.status_code == 200:
                result = generate_response.json()
                if result.get("successful", 0) == 3:
                    # Get filenames for ZIP download
                    filenames = [
                        cert["file_path"].split("/")[-1]
                        for cert in result["results"]
                        if cert["status"] == "success"
                    ]

                    # Test ZIP download
                    zip_response = requests.post(
                        f"{self.base_url}/api/download/zip",
                        json={"filenames": filenames},
                    )

                    if zip_response.status_code == 200:
                        zip_size = len(zip_response.content)
                        if zip_size > 5000:  # Reasonable ZIP size
                            self.log_result(
                                "ZIP Download API",
                                True,
                                f"Downloaded ZIP ({zip_size} bytes)",
                            )
                        else:
                            self.log_result(
                                "ZIP Download API",
                                False,
                                f"ZIP too small: {zip_size} bytes",
                            )
                    else:
                        self.log_result(
                            "ZIP Download API",
                            False,
                            f"ZIP download failed: {zip_response.status_code}",
                        )
                else:
                    self.log_result(
                        "ZIP Download API",
                        False,
                        "Could not generate certificates for ZIP test",
                    )
            else:
                self.log_result(
                    "ZIP Download API",
                    False,
                    "Could not generate certificates for ZIP test",
                )

        except Exception as e:
            self.log_result("ZIP Download API", False, f"Exception: {str(e)}")

    def test_special_characters_api(self, template_id):
        """Test API with special characters"""
        test_data = {
            "template_id": template_id,
            "output_format": "png",
            "recipients": [
                {
                    "name": "François Müller-García 🎓",
                    "course": "Advanced AI & ML 🤖",
                    "date": "25 janvier 2025",
                    "instructor": "Dr. José María",
                    "organization": "École Polytechnique",
                }
            ],
        }

        try:
            response = requests.post(f"{self.base_url}/api/generate", json=test_data)

            if response.status_code == 200:
                result = response.json()
                if (
                    result.get("status") == "completed"
                    and result.get("successful", 0) > 0
                ):
                    file_path = result["results"][0]["file_path"]
                    if os.path.exists(file_path):
                        with Image.open(file_path) as img:
                            if img.format == "PNG":
                                self.log_result(
                                    "Special Characters API",
                                    True,
                                    "Handled unicode/emojis correctly",
                                )
                            else:
                                self.log_result(
                                    "Special Characters API",
                                    False,
                                    f"Wrong format: {img.format}",
                                )
                    else:
                        self.log_result(
                            "Special Characters API",
                            False,
                            f"File not found: {file_path}",
                        )
                else:
                    self.log_result(
                        "Special Characters API", False, f"Generation failed: {result}"
                    )
            else:
                self.log_result(
                    "Special Characters API",
                    False,
                    f"API returned {response.status_code}",
                )

        except Exception as e:
            self.log_result("Special Characters API", False, f"Exception: {str(e)}")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("IMAGE GENERATION API TEST SUMMARY")
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

    def run_all_tests(self):
        """Run all API tests"""
        print("Starting Image Generation API Tests...\n")

        # Check server health first
        if not self.check_server_health():
            print("Server is not available. Please start the Flask server first.")
            return

        # Get available templates
        template_id = self.test_templates_api()
        if not template_id:
            print("No templates available. Cannot continue with tests.")
            return

        print(f"\nUsing template: {template_id}\n")

        # Run image generation tests
        png_file = self.test_png_generation_api(template_id)
        self.test_jpeg_generation_api(template_id)

        # Test batch generation
        self.test_batch_image_generation_api(template_id)

        # Test download functionality
        self.test_download_api(png_file)

        # Test ZIP download
        self.test_zip_download_api(template_id)

        # Test special characters
        self.test_special_characters_api(template_id)

        # Print summary
        self.print_summary()


if __name__ == "__main__":
    tester = ImageGenerationAPITest()
    tester.run_all_tests()
