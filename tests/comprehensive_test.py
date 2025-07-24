#!/usr/bin/env python3
"""
Comprehensive test script for Certificate Generator
Tests all formats, templates, and edge cases
"""

import requests
import json
import os
import tempfile
import csv
import zipfile
import time
from pathlib import Path

# Configuration
API_BASE = "http://127.0.0.1:5000/api/v1"
TEST_DATA_DIR = "test_data"


class CertificateGeneratorTester:
    def __init__(self):
        self.test_results = []
        self.setup_test_data()

    def setup_test_data(self):
        """Create test data directory and sample CSV files."""
        os.makedirs(TEST_DATA_DIR, exist_ok=True)

        # Create sample CSV data
        self.sample_recipients = [
            {
                "name": "John Doe",
                "course": "Python Programming Fundamentals",
                "date": "2025-01-15",
                "instructor": "Dr. Sarah Wilson",
                "organization": "TechEd Academy",
                "duration_hours": "40",
            },
            {
                "name": "Jane Smith",
                "course": "Web Development Bootcamp",
                "date": "2025-01-20",
                "instructor": "Prof. Michael Johnson",
                "organization": "CodeCraft Institute",
                "duration_hours": "60",
            },
            {
                "name": "José María García",
                "course": "Data Science Mastery",
                "date": "2025-01-25",
                "instructor": "Dr. Elena Rodriguez",
                "organization": "DataSkills University",
                "duration_hours": "80",
            },
            {
                "name": "李小明",  # Chinese characters
                "course": "Machine Learning Advanced",
                "date": "2025-02-01",
                "instructor": "Prof. David Chen",
                "organization": "AI Academy",
                "duration_hours": "100",
            },
        ]

        # Create CSV file
        csv_path = os.path.join(TEST_DATA_DIR, "test_recipients.csv")
        with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
            fieldnames = [
                "name",
                "course",
                "date",
                "instructor",
                "organization",
                "duration_hours",
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for recipient in self.sample_recipients:
                writer.writerow(recipient)

        self.csv_file_path = csv_path

    def log_test(self, test_name, success, details=""):
        """Log test results."""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")

        self.test_results.append(
            {"test": test_name, "success": success, "details": details}
        )

    def test_api_health(self):
        """Test API health endpoint."""
        try:
            response = requests.get(f"{API_BASE}/health", timeout=5)
            success = (
                response.status_code == 200 and response.json().get("status") == "ok"
            )
            self.log_test(
                "API Health Check", success, f"Status: {response.status_code}"
            )
            return success
        except Exception as e:
            self.log_test("API Health Check", False, f"Error: {str(e)}")
            return False

    def test_list_templates(self):
        """Test template listing."""
        try:
            response = requests.get(f"{API_BASE}/templates", timeout=5)
            if response.status_code == 200:
                templates = response.json().get("templates", {})
                html_templates = templates.get("html", [])
                success = len(html_templates) > 0
                self.log_test(
                    "List Templates",
                    success,
                    f"Found {len(html_templates)} HTML templates",
                )
                return templates
            else:
                self.log_test("List Templates", False, f"HTTP {response.status_code}")
                return None
        except Exception as e:
            self.log_test("List Templates", False, f"Error: {str(e)}")
            return None

    def test_certificate_generation(
        self, template_name, output_format, recipients=None
    ):
        """Test certificate generation with specific template and format."""
        if recipients is None:
            recipients = self.sample_recipients[:2]  # Use first 2 recipients

        test_name = f"Generate Certificates - {template_name} ({output_format.upper()})"

        try:
            payload = {
                "template_id": template_name,
                "output_format": output_format,
                "recipients": recipients,
            }

            response = requests.post(
                f"{API_BASE}/certificates/generate", json=payload, timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                success = (
                    result.get("status") == "completed"
                    and result.get("successful", 0) > 0
                )
                details = f"Generated {result.get('successful', 0)}/{result.get('total_recipients', 0)} certificates"
                self.log_test(test_name, success, details)
                return result
            else:
                self.log_test(test_name, False, f"HTTP {response.status_code}")
                return None

        except Exception as e:
            self.log_test(test_name, False, f"Error: {str(e)}")
            return None

    def test_file_download(self, file_path):
        """Test downloading a generated certificate file."""
        if not file_path:
            return False

        try:
            # Extract filename from path
            filename = file_path.split("/")[-1] if "/" in file_path else file_path
            download_url = f"http://127.0.0.1:5000/generated_certificates/{filename}"

            response = requests.get(download_url, timeout=10)
            success = response.status_code == 200 and len(response.content) > 0

            details = (
                f"File size: {len(response.content)} bytes"
                if success
                else f"HTTP {response.status_code}"
            )
            self.log_test(f"Download File - {filename}", success, details)

            return success
        except Exception as e:
            self.log_test(f"Download File - {filename}", False, f"Error: {str(e)}")
            return False

    def test_zip_download(self, file_paths):
        """Test ZIP download functionality."""
        if not file_paths:
            self.log_test("ZIP Download", False, "No file paths provided")
            return False

        try:
            payload = {"file_paths": file_paths, "zip_name": "test_certificates.zip"}

            response = requests.post(
                f"{API_BASE}/certificates/download_zip", json=payload, timeout=15
            )

            if response.status_code == 200:
                # Check if response is a valid ZIP file
                try:
                    # Save to temporary file and verify
                    with tempfile.NamedTemporaryFile(
                        suffix=".zip", delete=False
                    ) as tmp_file:
                        tmp_file.write(response.content)
                        tmp_file.flush()

                        # Try to open as ZIP
                        with zipfile.ZipFile(tmp_file.name, "r") as zip_ref:
                            file_list = zip_ref.namelist()
                            success = len(file_list) > 0
                            details = f"ZIP contains {len(file_list)} files"

                        os.unlink(tmp_file.name)

                except zipfile.BadZipFile:
                    success = False
                    details = "Invalid ZIP file received"

                self.log_test("ZIP Download", success, details)
                return success
            else:
                self.log_test("ZIP Download", False, f"HTTP {response.status_code}")
                return False

        except Exception as e:
            self.log_test("ZIP Download", False, f"Error: {str(e)}")
            return False

    def test_edge_cases(self):
        """Test various edge cases."""
        print("\n🧪 Testing Edge Cases...")

        # Test with empty recipients
        self.test_certificate_generation("modern_excellence.html", "pdf", [])

        # Test with malformed recipient data
        malformed_recipients = [
            {"name": ""},  # Empty name
            {"name": "Test User"},  # Missing other fields
            {"name": "A" * 1000, "course": "B" * 1000},  # Very long strings
            {"name": None, "course": None},  # None values
        ]
        self.test_certificate_generation(
            "modern_excellence.html", "pdf", malformed_recipients
        )

        # Test with non-existent template
        try:
            response = requests.post(
                f"{API_BASE}/certificates/generate",
                json={
                    "template_id": "nonexistent_template.html",
                    "output_format": "pdf",
                    "recipients": [{"name": "Test User"}],
                },
                timeout=10,
            )

            success = response.status_code in [400, 404, 500]  # Should fail gracefully
            self.log_test(
                "Non-existent Template", success, f"HTTP {response.status_code}"
            )
        except Exception as e:
            self.log_test("Non-existent Template", False, f"Error: {str(e)}")

        # Test with invalid output format
        try:
            response = requests.post(
                f"{API_BASE}/certificates/generate",
                json={
                    "template_id": "modern_excellence.html",
                    "output_format": "invalid_format",
                    "recipients": [{"name": "Test User"}],
                },
                timeout=10,
            )

            success = response.status_code == 400  # Should reject invalid format
            self.log_test(
                "Invalid Output Format", success, f"HTTP {response.status_code}"
            )
        except Exception as e:
            self.log_test("Invalid Output Format", False, f"Error: {str(e)}")

    def test_all_formats_and_templates(self):
        """Test all combinations of templates and formats."""
        print("\n🎨 Testing All Template and Format Combinations...")

        templates = self.test_list_templates()
        if not templates:
            print("❌ Cannot proceed without templates")
            return

        html_templates = templates.get("html", [])
        formats = ["pdf", "html", "png", "jpeg"]

        all_generated_files = []

        for template in html_templates:
            for format_type in formats:
                print(f"\n  Testing {template} in {format_type.upper()} format...")
                result = self.test_certificate_generation(
                    template, format_type, [self.sample_recipients[0]]
                )

                if result and result.get("results"):
                    for cert_result in result["results"]:
                        if cert_result.get("status") == "success" and cert_result.get(
                            "file_path"
                        ):
                            file_path = cert_result["file_path"]
                            all_generated_files.append(file_path)

                            # Test individual file download
                            self.test_file_download(file_path)

                # Small delay to avoid overwhelming the server
                time.sleep(0.5)

        # Test ZIP download with all generated files
        if all_generated_files:
            print(f"\n📦 Testing ZIP download with {len(all_generated_files)} files...")
            self.test_zip_download(all_generated_files)

    def test_performance(self):
        """Test performance with larger datasets."""
        print("\n⚡ Testing Performance...")

        # Generate more recipients for performance testing
        large_recipient_list = []
        for i in range(50):  # 50 recipients
            large_recipient_list.append(
                {
                    "name": f"Test User {i + 1}",
                    "course": f"Course {i + 1}",
                    "date": "2025-01-01",
                    "instructor": f"Instructor {i + 1}",
                    "organization": "Test Organization",
                }
            )

        start_time = time.time()
        result = self.test_certificate_generation(
            "modern_excellence.html", "pdf", large_recipient_list
        )
        end_time = time.time()

        if result:
            processing_time = end_time - start_time
            certificates_per_second = (
                len(large_recipient_list) / processing_time
                if processing_time > 0
                else 0
            )

            self.log_test(
                "Performance Test",
                True,
                f"Generated {len(large_recipient_list)} certificates in {processing_time:.2f}s ({certificates_per_second:.2f} certs/sec)",
            )
        else:
            self.log_test("Performance Test", False, "Failed to generate certificates")

    def test_concurrent_requests(self):
        """Test handling of concurrent requests."""
        print("\n🔄 Testing Concurrent Requests...")

        import threading
        import queue

        results_queue = queue.Queue()

        def make_request(thread_id):
            try:
                result = self.test_certificate_generation(
                    "modern_excellence.html",
                    "pdf",
                    [{"name": f"User {thread_id}", "course": f"Course {thread_id}"}],
                )
                results_queue.put(("success", thread_id, result is not None))
            except Exception as e:
                results_queue.put(("error", thread_id, str(e)))

        # Create and start threads
        threads = []
        num_threads = 5

        for i in range(num_threads):
            thread = threading.Thread(target=make_request, args=(i,))
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

        # Collect results
        successful_requests = 0
        while not results_queue.empty():
            status, thread_id, result = results_queue.get()
            if status == "success" and result:
                successful_requests += 1

        success = successful_requests == num_threads
        self.log_test(
            "Concurrent Requests",
            success,
            f"{successful_requests}/{num_threads} requests successful",
        )

    def generate_test_report(self):
        """Generate a comprehensive test report."""
        print("\n" + "=" * 50)
        print("📊 TEST REPORT")
        print("=" * 50)

        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests

        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests / total_tests) * 100:.1f}%")

        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")

        print("\n" + "=" * 50)

        # Save detailed report to file
        report_file = os.path.join(TEST_DATA_DIR, "test_report.json")
        with open(report_file, "w") as f:
            json.dump(
                {
                    "summary": {
                        "total": total_tests,
                        "passed": passed_tests,
                        "failed": failed_tests,
                        "success_rate": (passed_tests / total_tests) * 100,
                    },
                    "results": self.test_results,
                },
                f,
                indent=2,
            )

        print(f"📄 Detailed report saved to: {report_file}")

    def run_all_tests(self):
        """Run all tests in sequence."""
        print("🚀 Starting Comprehensive Certificate Generator Tests")
        print("=" * 50)

        # Basic functionality tests
        if not self.test_api_health():
            print("❌ API is not healthy. Stopping tests.")
            return

        # Core functionality tests
        self.test_all_formats_and_templates()

        # Edge cases
        self.test_edge_cases()

        # Performance tests
        self.test_performance()

        # Concurrent request tests
        self.test_concurrent_requests()

        # Generate final report
        self.generate_test_report()


if __name__ == "__main__":
    tester = CertificateGeneratorTester()
    tester.run_all_tests()
