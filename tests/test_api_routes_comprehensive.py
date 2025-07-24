import pytest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock
from app import create_app
from app.routes import register_routes


class TestAPIRoutes:
    """Comprehensive tests for API routes."""

    @pytest.fixture
    def app(self):
        """Create test app instance."""
        app = create_app()
        app.config["TESTING"] = True
        register_routes(app)
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client."""
        return app.test_client()

    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/api/v1/health")

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["status"] == "ok"

    @patch("app.routes.list_templates")
    def test_get_templates_success(self, mock_list_templates, client):
        """Test successful template listing."""
        mock_templates = {
            "html": ["template1.html", "template2.html"],
            "images": ["img1.png", "img2.jpg"],
            "pptx": ["pres1.pptx"],
        }
        mock_list_templates.return_value = mock_templates

        response = client.get("/api/v1/templates")

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["templates"] == mock_templates

    @patch("app.routes.list_templates")
    def test_get_templates_error(self, mock_list_templates, client):
        """Test template listing error handling."""
        mock_list_templates.side_effect = Exception("Template error")

        response = client.get("/api/v1/templates")

        # Should still return 200 but with error in response
        assert response.status_code == 200

    @patch("app.routes.generate_certificate")
    def test_generate_certificate_success(self, mock_generate, client):
        """Test successful certificate generation."""
        mock_result = {
            "status": "completed",
            "total_recipients": 2,
            "successful": 2,
            "failed": 0,
            "results": [
                {
                    "recipient": "John Doe",
                    "certificate_id": "cert-123",
                    "file_path": "/path/to/cert1.pdf",
                    "status": "success",
                },
                {
                    "recipient": "Jane Smith",
                    "certificate_id": "cert-456",
                    "file_path": "/path/to/cert2.pdf",
                    "status": "success",
                },
            ],
        }
        mock_generate.return_value = mock_result

        request_data = {
            "template_id": "test_template.html",
            "output_format": "pdf",
            "recipients": [
                {"name": "John Doe", "course": "Python 101"},
                {"name": "Jane Smith", "course": "JavaScript Basics"},
            ],
        }

        response = client.post(
            "/api/v1/certificates/generate",
            data=json.dumps(request_data),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == mock_result

    def test_generate_certificate_validation_error(self, client):
        """Test certificate generation with validation errors."""
        # Missing required fields
        request_data = {
            "template_id": "test_template.html"
            # Missing output_format and recipients
        }

        response = client.post(
            "/api/v1/certificates/generate",
            data=json.dumps(request_data),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert data["status"] == "error"
        assert "errors" in data

    def test_generate_certificate_invalid_json(self, client):
        """Test certificate generation with invalid JSON."""
        response = client.post(
            "/api/v1/certificates/generate",
            data="invalid json",
            content_type="application/json",
        )

        assert response.status_code == 400

    @patch("app.routes.generate_certificate")
    def test_generate_certificate_service_error(self, mock_generate, client):
        """Test certificate generation with service error."""
        mock_generate.side_effect = Exception("Service error")

        request_data = {
            "template_id": "test_template.html",
            "output_format": "pdf",
            "recipients": [{"name": "John Doe"}],
        }

        response = client.post(
            "/api/v1/certificates/generate",
            data=json.dumps(request_data),
            content_type="application/json",
        )

        assert response.status_code == 500
        data = json.loads(response.data)
        assert data["status"] == "error"
        assert "Service error" in data["message"]

    @patch("app.routes.generate_certificate_async.delay")
    def test_generate_certificate_async(self, mock_async, client):
        """Test async certificate generation."""
        mock_task = MagicMock()
        mock_task.id = "task-123"
        mock_async.return_value = mock_task

        request_data = {
            "template_id": "test_template.html",
            "output_format": "pdf",
            "recipients": [{"name": "John Doe"}],
        }

        response = client.post(
            "/api/v1/certificates/generate_async",
            data=json.dumps(request_data),
            content_type="application/json",
        )

        assert response.status_code == 202
        data = json.loads(response.data)
        assert data["status"] == "accepted"
        assert data["job_id"] == "task-123"

    @patch("app.routes.AsyncResult")
    def test_get_job_status_success(self, mock_async_result, client):
        """Test successful job status retrieval."""
        mock_result = MagicMock()
        mock_result.state = "SUCCESS"
        mock_result.ready.return_value = True
        mock_result.result = {"status": "completed"}
        mock_async_result.return_value = mock_result

        response = client.get("/api/v1/jobs/test-job-id")

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["job_id"] == "test-job-id"
        assert data["state"] == "SUCCESS"
        assert data["result"] == {"status": "completed"}

    @patch("app.routes.AsyncResult")
    def test_get_job_status_pending(self, mock_async_result, client):
        """Test job status for pending job."""
        mock_result = MagicMock()
        mock_result.state = "PENDING"
        mock_result.ready.return_value = False
        mock_result.result = None
        mock_async_result.return_value = mock_result

        response = client.get("/api/v1/jobs/test-job-id")

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["state"] == "PENDING"
        assert data["result"] is None

    @patch("app.routes.send_file")
    def test_download_certificate_success(self, mock_send_file, client):
        """Test successful certificate download."""
        # Create a temporary file to simulate certificate
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".pdf", delete=False
        ) as temp_file:
            temp_file.write("mock pdf content")
            temp_filename = os.path.basename(temp_file.name)

        try:
            with patch("app.routes.os.path.exists", return_value=True):
                with patch("app.routes.os.path.join") as mock_join:
                    mock_join.return_value = temp_file.name
                    mock_send_file.return_value = "file_response"

                    response = client.get(f"/generated_certificates/{temp_filename}")

                    mock_send_file.assert_called_once()
                    assert response == "file_response"
        finally:
            os.unlink(temp_file.name)

    def test_download_certificate_not_found(self, client):
        """Test certificate download for non-existent file."""
        response = client.get("/generated_certificates/nonexistent.pdf")

        assert response.status_code == 404
        data = json.loads(response.data)
        assert data["error"] == "File not found"

    @patch("app.routes.send_file")
    @patch("app.routes.tempfile.NamedTemporaryFile")
    @patch("app.routes.zipfile.ZipFile")
    def test_download_zip_success(
        self, mock_zipfile, mock_tempfile, mock_send_file, client
    ):
        """Test successful ZIP download."""
        # Mock temporary file
        mock_temp = MagicMock()
        mock_temp.name = "/tmp/test.zip"
        mock_tempfile.return_value = mock_temp

        # Mock ZIP file
        mock_zip = MagicMock()
        mock_zipfile.return_value.__enter__.return_value = mock_zip

        # Mock file existence
        with patch("app.routes.os.path.exists", return_value=True):
            with patch("app.routes.os.path.join") as mock_join:
                mock_join.return_value = "/path/to/cert.pdf"
                mock_send_file.return_value = "zip_response"

                request_data = {
                    "file_paths": ["cert1.pdf", "cert2.pdf"],
                    "zip_name": "certificates.zip",
                }

                response = client.post(
                    "/api/v1/certificates/download_zip",
                    data=json.dumps(request_data),
                    content_type="application/json",
                )

                # Should call ZipFile.write for each file
                assert mock_zip.write.call_count == 2
                mock_send_file.assert_called_once()
                assert response == "zip_response"

    def test_download_zip_no_file_paths(self, client):
        """Test ZIP download with no file paths."""
        request_data = {}

        response = client.post(
            "/api/v1/certificates/download_zip",
            data=json.dumps(request_data),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert data["error"] == "file_paths required"

    def test_download_zip_empty_file_paths(self, client):
        """Test ZIP download with empty file paths list."""
        request_data = {"file_paths": []}

        response = client.post(
            "/api/v1/certificates/download_zip",
            data=json.dumps(request_data),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert data["error"] == "No file paths provided"

    def test_download_zip_invalid_json(self, client):
        """Test ZIP download with invalid JSON."""
        response = client.post(
            "/api/v1/certificates/download_zip",
            data="invalid json",
            content_type="application/json",
        )

        assert response.status_code == 400

    @patch("app.routes.os.path.exists", return_value=False)
    def test_download_zip_files_not_found(self, mock_exists, client):
        """Test ZIP download when files don't exist."""
        with patch("app.routes.tempfile.NamedTemporaryFile") as mock_tempfile:
            with patch("app.routes.zipfile.ZipFile") as mock_zipfile:
                with patch("app.routes.send_file") as mock_send_file:
                    mock_temp = MagicMock()
                    mock_temp.name = "/tmp/test.zip"
                    mock_tempfile.return_value = mock_temp

                    mock_zip = MagicMock()
                    mock_zipfile.return_value.__enter__.return_value = mock_zip
                    mock_send_file.return_value = "zip_response"

                    request_data = {
                        "file_paths": ["nonexistent1.pdf", "nonexistent2.pdf"]
                    }

                    response = client.post(
                        "/api/v1/certificates/download_zip",
                        data=json.dumps(request_data),
                        content_type="application/json",
                    )

                    # Should still create ZIP but with no files
                    mock_zip.write.assert_not_called()
                    mock_send_file.assert_called_once()

    def test_output_format_validation(self, client):
        """Test that all supported output formats are accepted."""
        valid_formats = ["pdf", "html", "png", "jpeg"]

        for format_type in valid_formats:
            request_data = {
                "template_id": "test_template.html",
                "output_format": format_type,
                "recipients": [{"name": "John Doe"}],
            }

            with patch("app.routes.generate_certificate") as mock_generate:
                mock_generate.return_value = {"status": "completed"}

                response = client.post(
                    "/api/v1/certificates/generate",
                    data=json.dumps(request_data),
                    content_type="application/json",
                )

                assert response.status_code == 200

    def test_invalid_output_format(self, client):
        """Test validation with invalid output format."""
        request_data = {
            "template_id": "test_template.html",
            "output_format": "invalid_format",
            "recipients": [{"name": "John Doe"}],
        }

        response = client.post(
            "/api/v1/certificates/generate",
            data=json.dumps(request_data),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert "errors" in data

    def test_cors_headers(self, client):
        """Test CORS headers are properly set."""
        response = client.options("/api/v1/certificates/generate")

        # Should handle OPTIONS request
        assert response.status_code == 200

    def test_large_recipient_list(self, client):
        """Test handling of large recipient lists."""
        # Create a large list of recipients
        recipients = [
            {"name": f"Recipient {i}", "course": f"Course {i}"} for i in range(1000)
        ]

        request_data = {
            "template_id": "test_template.html",
            "output_format": "pdf",
            "recipients": recipients,
        }

        with patch("app.routes.generate_certificate") as mock_generate:
            mock_generate.return_value = {
                "status": "completed",
                "total_recipients": 1000,
                "successful": 1000,
                "failed": 0,
            }

            response = client.post(
                "/api/v1/certificates/generate",
                data=json.dumps(request_data),
                content_type="application/json",
            )

            assert response.status_code == 200

    def test_recipient_data_edge_cases(self, client):
        """Test edge cases in recipient data."""
        edge_case_recipients = [
            # Empty recipient
            {},
            # Recipient with only name
            {"name": "John Doe"},
            # Recipient with special characters
            {"name": "José María", "course": "Español 101"},
            # Recipient with long strings
            {"name": "A" * 1000, "course": "B" * 1000},
            # Recipient with None values
            {"name": "John", "course": None},
            # Recipient with numeric values
            {"name": "John", "age": 25, "score": 95.5},
        ]

        request_data = {
            "template_id": "test_template.html",
            "output_format": "pdf",
            "recipients": edge_case_recipients,
        }

        with patch("app.routes.generate_certificate") as mock_generate:
            mock_generate.return_value = {"status": "completed"}

            response = client.post(
                "/api/v1/certificates/generate",
                data=json.dumps(request_data),
                content_type="application/json",
            )

            assert response.status_code == 200
