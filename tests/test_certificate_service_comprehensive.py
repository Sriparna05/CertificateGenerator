import pytest
import tempfile
import os
import shutil
from unittest.mock import patch, MagicMock
from app.services.certificate_service import (
    list_templates,
    generate_certificate,
    html_to_pdf,
    html_to_image,
    generate_certificate_from_html,
    store_generated_file,
)


class TestCertificateService:
    """Comprehensive tests for certificate service."""

    @pytest.fixture
    def temp_dir(self):
        """Create a temporary directory for tests."""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)

    @pytest.fixture
    def sample_templates_dir(self, temp_dir):
        """Create sample template directories and files."""
        html_dir = os.path.join(temp_dir, "certificate_templates", "html")
        images_dir = os.path.join(temp_dir, "certificate_templates", "images")
        pptx_dir = os.path.join(temp_dir, "certificate_templates", "pptx")

        os.makedirs(html_dir)
        os.makedirs(images_dir)
        os.makedirs(pptx_dir)

        # Create sample HTML template
        html_content = """
        <!DOCTYPE html>
        <html>
        <head><title>{{ certificate_title }}</title></head>
        <body>
            <h1>Certificate of Achievement</h1>
            <p>This is to certify that <strong>{{ recipient_name }}</strong></p>
            <p>has completed <strong>{{ course_name }}</strong></p>
            <p>on {{ completion_date }}</p>
            <p>Instructor: {{ instructor_name }}</p>
        </body>
        </html>
        """
        with open(os.path.join(html_dir, "test_template.html"), "w") as f:
            f.write(html_content)

        # Create sample image file (mock)
        with open(os.path.join(images_dir, "test_image.png"), "w") as f:
            f.write("mock image data")

        # Create sample PPTX file (mock)
        with open(os.path.join(pptx_dir, "test_presentation.pptx"), "w") as f:
            f.write("mock pptx data")

        return temp_dir

    def test_list_templates(self, sample_templates_dir):
        """Test template listing functionality."""
        with patch("app.services.certificate_service.os.path.isdir", return_value=True):
            with patch("app.services.certificate_service.os.listdir") as mock_listdir:
                mock_listdir.side_effect = [
                    ["test_template.html", "another_template.html"],
                    ["test_image.png", "test_image.jpg"],
                    ["test_presentation.pptx"],
                ]

                templates = list_templates()

                assert "html" in templates
                assert "images" in templates
                assert "pptx" in templates
                assert "test_template.html" in templates["html"]
                assert "another_template.html" in templates["html"]
                assert "test_image.png" in templates["images"]
                assert "test_image.jpg" in templates["images"]
                assert "test_presentation.pptx" in templates["pptx"]

    def test_list_templates_missing_directories(self):
        """Test template listing when directories don't exist."""
        with patch(
            "app.services.certificate_service.os.path.isdir", return_value=False
        ):
            templates = list_templates()

            assert templates["html"] == []
            assert templates["images"] == []
            assert templates["pptx"] == []

    def test_store_generated_file(self, temp_dir):
        """Test file storage functionality."""
        src_file = os.path.join(temp_dir, "source.txt")
        storage_dir = os.path.join(temp_dir, "storage")

        # Create source file
        with open(src_file, "w") as f:
            f.write("test content")

        stored_path = store_generated_file(src_file, "stored.txt", storage_dir)

        assert os.path.exists(stored_path)
        assert os.path.basename(stored_path) == "stored.txt"

        with open(stored_path, "r") as f:
            assert f.read() == "test content"

    def test_store_generated_file_cloud_stub(self):
        """Test cloud storage stub functionality."""
        result = store_generated_file("/fake/path", "test.txt", use_cloud=True)
        assert result.startswith("https://cloud-storage.example.com/")
        assert result.endswith("test.txt")

    def test_generate_certificate_from_html(self, temp_dir):
        """Test HTML template rendering."""
        template_dir = os.path.join(temp_dir, "templates")
        os.makedirs(template_dir)

        # Create template
        template_content = """
        <h1>{{ title }}</h1>
        <p>Name: {{ name }}</p>
        <p>Course: {{ course }}</p>
        """
        template_path = os.path.join(template_dir, "test.html")
        with open(template_path, "w") as f:
            f.write(template_content)

        output_path = os.path.join(temp_dir, "output.html")
        context = {
            "title": "Certificate of Achievement",
            "name": "John Doe",
            "course": "Python Programming",
        }

        generate_certificate_from_html(template_dir, "test.html", output_path, context)

        assert os.path.exists(output_path)
        with open(output_path, "r") as f:
            content = f.read()
            assert "Certificate of Achievement" in content
            assert "John Doe" in content
            assert "Python Programming" in content

    @patch("app.services.certificate_service.HTML")
    @patch("app.services.certificate_service.CSS")
    @patch("app.services.certificate_service.FontConfiguration")
    def test_html_to_pdf_success(self, mock_font_config, mock_css, mock_html):
        """Test successful HTML to PDF conversion."""
        mock_html_instance = MagicMock()
        mock_html.return_value = mock_html_instance

        result = html_to_pdf("/test/input.html", "/test/output.pdf")

        assert result == "/test/output.pdf"
        mock_html.assert_called_once_with(filename="/test/input.html")
        mock_html_instance.write_pdf.assert_called_once()

    @patch("app.services.certificate_service.HTML")
    def test_html_to_pdf_import_error(self, mock_html):
        """Test HTML to PDF conversion when WeasyPrint is not available."""
        mock_html.side_effect = ImportError("WeasyPrint not found")

        result = html_to_pdf("/test/input.html", "/test/output.pdf")

        assert result is None

    @patch("app.services.certificate_service.HTML")
    def test_html_to_pdf_conversion_error(self, mock_html):
        """Test HTML to PDF conversion error handling."""
        mock_html_instance = MagicMock()
        mock_html.return_value = mock_html_instance
        mock_html_instance.write_pdf.side_effect = Exception("Conversion failed")

        result = html_to_pdf("/test/input.html", "/test/output.pdf")

        assert result is None

    @patch("app.services.certificate_service.convert_from_path")
    @patch("app.services.certificate_service.html_to_pdf")
    @patch("app.services.certificate_service.os.remove")
    def test_html_to_image_success(self, mock_remove, mock_html_to_pdf, mock_convert):
        """Test successful HTML to image conversion."""
        mock_html_to_pdf.return_value = "/test/temp.pdf"

        # Mock PIL Image
        mock_image = MagicMock()
        mock_convert.return_value = [mock_image]

        result = html_to_image("/test/input.html", "/test/output.png", "PNG")

        assert result == "/test/output.png"
        mock_html_to_pdf.assert_called_once()
        mock_convert.assert_called_once()
        mock_image.save.assert_called_once_with(
            "/test/output.png", format="PNG", quality=95, optimize=True
        )
        mock_remove.assert_called_once()

    @patch("app.services.certificate_service.convert_from_path")
    @patch("app.services.certificate_service.html_to_pdf")
    def test_html_to_image_pdf2image_not_available(
        self, mock_html_to_pdf, mock_convert
    ):
        """Test HTML to image conversion when pdf2image is not available."""
        mock_html_to_pdf.return_value = "/test/temp.pdf"
        mock_convert.side_effect = ImportError("pdf2image not found")

        with patch("app.services.certificate_service.os.rename") as mock_rename:
            result = html_to_image("/test/input.html", "/test/output.png", "PNG")

            assert result == "/test/output.pdf"
            mock_rename.assert_called_once()

    def test_generate_certificate_html_success(self, temp_dir):
        """Test successful certificate generation with HTML template."""
        # Setup template directory
        template_dir = os.path.join(temp_dir, "certificate_templates", "html")
        os.makedirs(template_dir)

        template_content = """
        <html>
        <body>
            <h1>Certificate</h1>
            <p>{{ recipient_name }}</p>
            <p>{{ course_name }}</p>
        </body>
        </html>
        """

        with open(os.path.join(template_dir, "test.html"), "w") as f:
            f.write(template_content)

        # Setup generated certificates directory
        gen_dir = os.path.join(temp_dir, "generated_certificates")
        os.makedirs(gen_dir)

        recipients = [
            {"name": "John Doe", "course": "Python 101"},
            {"name": "Jane Smith", "course": "JavaScript Basics"},
        ]

        with patch("app.services.certificate_service.os.makedirs"):
            with patch(
                "app.services.certificate_service.generate_certificate_from_html"
            ) as mock_gen_html:
                with patch("app.services.certificate_service.html_to_pdf") as mock_pdf:
                    with patch(
                        "app.services.certificate_service.store_generated_file"
                    ) as mock_store:
                        mock_store.side_effect = (
                            lambda src, name, *args: f"/stored/{name}"
                        )

                        result = generate_certificate("test.html", "pdf", recipients)

        assert result["status"] == "completed"
        assert result["total_recipients"] == 2
        assert result["successful"] == 2
        assert result["failed"] == 0
        assert len(result["results"]) == 2

        for i, cert_result in enumerate(result["results"]):
            assert cert_result["recipient"] == recipients[i]["name"]
            assert cert_result["status"] == "success"
            assert cert_result["file_path"] is not None

    def test_generate_certificate_html_multiple_formats(self, temp_dir):
        """Test certificate generation with different output formats."""
        template_dir = os.path.join(temp_dir, "certificate_templates", "html")
        os.makedirs(template_dir)

        with open(os.path.join(template_dir, "test.html"), "w") as f:
            f.write("<html><body>{{ recipient_name }}</body></html>")

        recipients = [{"name": "John Doe"}]

        formats = ["pdf", "html", "png", "jpeg"]

        for format_type in formats:
            with patch("app.services.certificate_service.os.makedirs"):
                with patch(
                    "app.services.certificate_service.generate_certificate_from_html"
                ):
                    with patch(
                        "app.services.certificate_service.html_to_pdf"
                    ) as mock_pdf:
                        with patch(
                            "app.services.certificate_service.html_to_image"
                        ) as mock_img:
                            with patch(
                                "app.services.certificate_service.store_generated_file"
                            ) as mock_store:
                                mock_store.return_value = f"/stored/cert.{format_type}"

                                result = generate_certificate(
                                    "test.html", format_type, recipients
                                )

                assert result["status"] == "completed"
                assert result["successful"] == 1

                if format_type == "pdf":
                    mock_pdf.assert_called_once()
                elif format_type in ["png", "jpeg"]:
                    mock_img.assert_called_once()

    def test_generate_certificate_template_not_found(self):
        """Test certificate generation with non-existent template."""
        recipients = [{"name": "John Doe"}]

        result = generate_certificate("nonexistent.html", "pdf", recipients)

        assert result["status"] == "completed"
        assert result["successful"] == 0
        assert result["failed"] == 1
        assert "Template not found" in result["results"][0]["error"]

    def test_generate_certificate_empty_recipients(self):
        """Test certificate generation with empty recipients list."""
        result = generate_certificate("test.html", "pdf", [])

        assert result["status"] == "completed"
        assert result["total_recipients"] == 0
        assert result["successful"] == 0
        assert result["failed"] == 0
        assert len(result["results"]) == 0

    def test_generate_certificate_invalid_format(self, temp_dir):
        """Test certificate generation with invalid output format."""
        template_dir = os.path.join(temp_dir, "certificate_templates", "html")
        os.makedirs(template_dir)

        with open(os.path.join(template_dir, "test.html"), "w") as f:
            f.write("<html><body>{{ recipient_name }}</body></html>")

        recipients = [{"name": "John Doe"}]

        # Test with invalid template extension
        result = generate_certificate("test.invalid", "pdf", recipients)

        assert result["status"] == "completed"
        assert result["successful"] == 0
        assert result["failed"] == 1
        assert "Unsupported template format" in result["results"][0]["error"]

    def test_generate_certificate_context_defaults(self, temp_dir):
        """Test that default context values are properly set."""
        template_dir = os.path.join(temp_dir, "certificate_templates", "html")
        os.makedirs(template_dir)

        with open(os.path.join(template_dir, "test.html"), "w") as f:
            f.write("<html><body>{{ recipient_name }}</body></html>")

        recipients = [{}]  # Empty recipient data

        with patch("app.services.certificate_service.os.makedirs"):
            with patch(
                "app.services.certificate_service.generate_certificate_from_html"
            ) as mock_gen:
                with patch("app.services.certificate_service.html_to_pdf"):
                    with patch("app.services.certificate_service.store_generated_file"):
                        generate_certificate("test.html", "html", recipients)

        # Check that generate_certificate_from_html was called with default context
        assert mock_gen.called
        context = mock_gen.call_args[0][3]  # Fourth argument is context

        assert context["recipient_name"] == "Recipient"
        assert context["course_name"] == "Course"
        assert context["instructor_name"] == "Instructor"
        assert context["organization_name"] == "Organization"
        assert "certificate_id" in context

    def test_generate_certificate_recipient_data_override(self, temp_dir):
        """Test that recipient data properly overrides defaults."""
        template_dir = os.path.join(temp_dir, "certificate_templates", "html")
        os.makedirs(template_dir)

        with open(os.path.join(template_dir, "test.html"), "w") as f:
            f.write("<html><body>{{ recipient_name }}</body></html>")

        recipients = [
            {
                "name": "Custom Name",
                "course": "Custom Course",
                "instructor": "Custom Instructor",
                "custom_field": "Custom Value",
            }
        ]

        with patch("app.services.certificate_service.os.makedirs"):
            with patch(
                "app.services.certificate_service.generate_certificate_from_html"
            ) as mock_gen:
                with patch("app.services.certificate_service.html_to_pdf"):
                    with patch("app.services.certificate_service.store_generated_file"):
                        generate_certificate("test.html", "html", recipients)

        context = mock_gen.call_args[0][3]

        assert context["recipient_name"] == "Custom Name"
        assert context["course_name"] == "Custom Course"
        assert context["instructor_name"] == "Custom Instructor"
        assert context["custom_field"] == "Custom Value"
