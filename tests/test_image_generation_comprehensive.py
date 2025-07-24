#!/usr/bin/env python3
"""
Comprehensive backend tests for image generation functionality.
Tests all aspects of PDF to PNG/JPEG conversion and edge cases.
"""

import pytest
import os
import sys
import tempfile
import shutil
from PIL import Image

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

from app.services.certificate_service import generate_certificate, list_templates


class TestImageGeneration:
    """Test class for image generation functionality"""

    @pytest.fixture(autouse=True)
    def setup_and_teardown(self):
        """Setup and teardown for each test"""
        # Create temporary directory for test outputs
        self.test_dir = tempfile.mkdtemp()
        self.original_cwd = os.getcwd()

        yield

        # Cleanup
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_list_templates_returns_html_templates(self):
        """Test that HTML templates are properly listed"""
        templates = list_templates()

        assert "html" in templates
        assert isinstance(templates["html"], list)
        assert len(templates["html"]) > 0

        # Check that all returned files end with .html
        for template in templates["html"]:
            assert template.endswith(".html")

    def test_png_generation_basic(self):
        """Test basic PNG generation from HTML template"""
        templates = list_templates()
        if not templates["html"]:
            pytest.skip("No HTML templates available")

        template_id = templates["html"][0]
        test_recipients = [
            {
                "name": "PNG Test User",
                "course": "Image Generation Course",
                "date": "January 25, 2025",
                "instructor": "Test Instructor",
                "organization": "Test Organization",
            }
        ]

        result = generate_certificate(template_id, "png", test_recipients)

        assert result["status"] == "completed"
        assert result["successful"] == 1
        assert result["failed"] == 0
        assert len(result["results"]) == 1

        certificate_result = result["results"][0]
        assert certificate_result["status"] == "success"
        assert certificate_result["file_path"] is not None

        # Verify the file exists and is a valid PNG
        file_path = certificate_result["file_path"]
        assert os.path.exists(file_path)

        with Image.open(file_path) as img:
            assert img.format == "PNG"
            assert img.size[0] > 500  # Minimum width
            assert img.size[1] > 300  # Minimum height

    def test_jpeg_generation_basic(self):
        """Test basic JPEG generation from HTML template"""
        templates = list_templates()
        if not templates["html"]:
            pytest.skip("No HTML templates available")

        template_id = templates["html"][0]
        test_recipients = [
            {
                "name": "JPEG Test User",
                "course": "JPEG Generation Course",
                "date": "January 25, 2025",
            }
        ]

        result = generate_certificate(template_id, "jpeg", test_recipients)

        assert result["status"] == "completed"
        assert result["successful"] == 1

        file_path = result["results"][0]["file_path"]
        assert os.path.exists(file_path)

        with Image.open(file_path) as img:
            assert img.format == "JPEG"
            assert img.mode in ["RGB", "L"]  # JPEG should be RGB or grayscale

    def test_multiple_formats_same_template(self):
        """Test generating multiple formats from the same template"""
        templates = list_templates()
        if not templates["html"]:
            pytest.skip("No HTML templates available")

        template_id = templates["html"][0]
        test_recipients = [
            {
                "name": "Multi Format User",
                "course": "Format Testing Course",
                "date": "January 25, 2025",
            }
        ]

        formats = ["pdf", "png", "jpeg", "html"]
        results = {}

        for fmt in formats:
            result = generate_certificate(template_id, fmt, test_recipients)
            assert result["status"] == "completed"
            assert result["successful"] == 1
            results[fmt] = result["results"][0]["file_path"]

        # Verify all files exist
        for fmt, file_path in results.items():
            assert os.path.exists(file_path)

            if fmt in ["png", "jpeg"]:
                with Image.open(file_path) as img:
                    assert img.format.upper() == fmt.upper()

    def test_batch_image_generation(self):
        """Test batch generation of image certificates"""
        templates = list_templates()
        if not templates["html"]:
            pytest.skip("No HTML templates available")

        template_id = templates["html"][0]

        # Create batch of 10 recipients
        test_recipients = []
        for i in range(10):
            test_recipients.append(
                {
                    "name": f"Batch Student {i + 1}",
                    "course": f"Batch Course {i + 1}",
                    "date": "January 25, 2025",
                    "instructor": "Batch Instructor",
                }
            )

        result = generate_certificate(template_id, "png", test_recipients)

        assert result["status"] == "completed"
        assert result["successful"] == 10
        assert result["failed"] == 0
        assert len(result["results"]) == 10

        # Verify all generated files
        for cert_result in result["results"]:
            assert cert_result["status"] == "success"
            file_path = cert_result["file_path"]
            assert os.path.exists(file_path)

            with Image.open(file_path) as img:
                assert img.format == "PNG"

    def test_special_characters_in_image_generation(self):
        """Test image generation with special characters and unicode"""
        templates = list_templates()
        if not templates["html"]:
            pytest.skip("No HTML templates available")

        template_id = templates["html"][0]
        test_recipients = [
            {
                "name": "François Müller-García",
                "course": "Advanced AI & Machine Learning 🤖",
                "date": "25 janvier 2025",
                "instructor": "Dr. José María Rodríguez",
                "organization": "École Polytechnique Fédérale",
            }
        ]

        result = generate_certificate(template_id, "png", test_recipients)

        assert result["status"] == "completed"
        assert result["successful"] == 1

        file_path = result["results"][0]["file_path"]
        assert os.path.exists(file_path)

        with Image.open(file_path) as img:
            assert img.format == "PNG"

    def test_long_text_handling_in_images(self):
        """Test image generation with very long text content"""
        templates = list_templates()
        if not templates["html"]:
            pytest.skip("No HTML templates available")

        template_id = templates["html"][0]
        test_recipients = [
            {
                "name": "This Is An Extremely Long Name That Should Test Text Wrapping And Layout Handling In Certificate Generation",
                "course": "This Is An Exceptionally Long Course Name That Should Test How The System Handles Extended Text Content In Certificate Templates",
                "date": "January 25, 2025",
                "instructor": "Professor With An Extraordinarily Long Academic Title And Multiple Credentials",
                "organization": "The International Academy of Advanced Learning, Research, and Professional Development in Computer Science and Information Technology",
            }
        ]

        result = generate_certificate(template_id, "png", test_recipients)

        assert result["status"] == "completed"
        assert result["successful"] == 1

        file_path = result["results"][0]["file_path"]
        assert os.path.exists(file_path)

        with Image.open(file_path) as img:
            assert img.format == "PNG"
            # Verify image is still reasonable size
            assert img.size[0] > 500
            assert img.size[1] > 300

    def test_empty_recipient_data_handling(self):
        """Test image generation with missing recipient data"""
        templates = list_templates()
        if not templates["html"]:
            pytest.skip("No HTML templates available")

        template_id = templates["html"][0]

        # Test with completely empty recipient
        result = generate_certificate(template_id, "png", [{}])
        assert result["status"] == "completed"
        assert result["successful"] == 1

        # Test with partially empty recipient
        test_recipients = [
            {
                "name": "Partial Data User",
                # Missing course, date, etc.
            }
        ]

        result = generate_certificate(template_id, "jpeg", test_recipients)
        assert result["status"] == "completed"
        assert result["successful"] == 1

    def test_invalid_template_handling(self):
        """Test image generation with invalid template"""
        result = generate_certificate(
            "nonexistent_template.html", "png", [{"name": "Test"}]
        )

        assert result["status"] == "completed"
        assert result["successful"] == 0
        assert result["failed"] == 1
        assert result["results"][0]["status"] == "error"

    def test_image_quality_and_properties(self):
        """Test generated image quality and properties"""
        templates = list_templates()
        if not templates["html"]:
            pytest.skip("No HTML templates available")

        template_id = templates["html"][0]
        test_recipients = [
            {
                "name": "Quality Test User",
                "course": "Image Quality Testing",
                "date": "January 25, 2025",
            }
        ]

        # Test PNG
        result = generate_certificate(template_id, "png", test_recipients)
        png_path = result["results"][0]["file_path"]

        with Image.open(png_path) as img:
            assert img.format == "PNG"
            assert img.mode in ["RGBA", "RGB", "P"]  # Valid PNG modes
            assert img.size[0] >= 1000  # Minimum reasonable width
            assert img.size[1] >= 700  # Minimum reasonable height

        # Check file size is reasonable
        png_size = os.path.getsize(png_path)
        assert png_size > 10000  # At least 10KB
        assert png_size < 5000000  # Less than 5MB

        # Test JPEG
        result = generate_certificate(template_id, "jpeg", test_recipients)
        jpeg_path = result["results"][0]["file_path"]

        with Image.open(jpeg_path) as img:
            assert img.format == "JPEG"
            assert img.mode in ["RGB", "L"]  # Valid JPEG modes

        jpeg_size = os.path.getsize(jpeg_path)
        assert jpeg_size > 5000  # At least 5KB
        assert jpeg_size < 3000000  # Less than 3MB

    def test_concurrent_image_generation(self):
        """Test concurrent image generation (simulated)"""
        templates = list_templates()
        if not templates["html"]:
            pytest.skip("No HTML templates available")

        template_id = templates["html"][0]

        # Generate multiple certificates "concurrently" (sequentially in test)
        results = []
        for i in range(5):
            test_recipients = [
                {
                    "name": f"Concurrent User {i}",
                    "course": f"Concurrent Course {i}",
                    "date": "January 25, 2025",
                }
            ]

            result = generate_certificate(template_id, "png", test_recipients)
            results.append(result)

        # Verify all succeeded
        for result in results:
            assert result["status"] == "completed"
            assert result["successful"] == 1
            assert result["failed"] == 0

    def test_all_available_templates(self):
        """Test image generation with all available HTML templates"""
        templates = list_templates()
        html_templates = templates["html"]

        if not html_templates:
            pytest.skip("No HTML templates available")

        test_recipients = [
            {
                "name": "Template Test User",
                "course": "Template Testing Course",
                "date": "January 25, 2025",
                "instructor": "Template Instructor",
                "organization": "Template Organization",
            }
        ]

        for template_id in html_templates:
            # Test PNG generation for each template
            result = generate_certificate(template_id, "png", test_recipients)

            assert result["status"] == "completed", (
                f"Failed for template: {template_id}"
            )
            assert result["successful"] == 1, f"No success for template: {template_id}"

            file_path = result["results"][0]["file_path"]
            assert os.path.exists(file_path), (
                f"File not found for template: {template_id}"
            )

            with Image.open(file_path) as img:
                assert img.format == "PNG", f"Wrong format for template: {template_id}"

    def test_file_cleanup_and_storage(self):
        """Test that generated files are properly stored and accessible"""
        templates = list_templates()
        if not templates["html"]:
            pytest.skip("No HTML templates available")

        template_id = templates["html"][0]
        test_recipients = [
            {
                "name": "Storage Test User",
                "course": "File Storage Testing",
                "date": "January 25, 2025",
            }
        ]

        # Count files before generation
        gen_dir = "generated_certificates"
        files_before = len(os.listdir(gen_dir)) if os.path.exists(gen_dir) else 0

        result = generate_certificate(template_id, "png", test_recipients)

        # Verify file was created
        assert result["successful"] == 1
        file_path = result["results"][0]["file_path"]
        assert os.path.exists(file_path)

        # Count files after generation
        files_after = len(os.listdir(gen_dir))
        assert files_after > files_before

        # Verify file is readable
        with Image.open(file_path) as img:
            assert img.format == "PNG"

    def test_error_recovery_in_batch(self):
        """Test error recovery in batch processing"""
        templates = list_templates()
        if not templates["html"]:
            pytest.skip("No HTML templates available")

        template_id = templates["html"][0]

        # Mix of valid and potentially problematic recipients
        test_recipients = [
            {"name": "Valid User 1", "course": "Valid Course 1"},
            {"name": "", "course": "Empty Name Course"},  # Empty name
            {"name": "Valid User 2", "course": "Valid Course 2"},
            {"name": None, "course": "None Name Course"},  # None name (potential issue)
            {"name": "Valid User 3", "course": "Valid Course 3"},
        ]

        result = generate_certificate(template_id, "png", test_recipients)

        assert result["status"] == "completed"
        # Should handle problematic data gracefully
        assert result["successful"] >= 3  # At least the valid ones should succeed
        assert len(result["results"]) == 5  # All recipients should have results


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short"])
