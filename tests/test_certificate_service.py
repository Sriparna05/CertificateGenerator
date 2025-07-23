import pytest
from app.services.certificate_service import list_templates, store_generated_file
import os


def test_list_templates(tmp_path):
    # Setup: create dummy template directories and files
    pptx_dir = tmp_path / "certificate_templates" / "pptx"
    img_dir = tmp_path / "certificate_templates" / "images"
    html_dir = tmp_path / "certificate_templates" / "html"
    pptx_dir.mkdir(parents=True)
    img_dir.mkdir(parents=True)
    html_dir.mkdir(parents=True)
    (pptx_dir / "template1.pptx").touch()
    (img_dir / "template1.png").touch()
    (html_dir / "template1.html").touch()

    # Patch base_dir to tmp_path/certificate_templates
    result = list_templates(base_dir=str(tmp_path / "certificate_templates"))
    assert "pptx" in result and "template1.pptx" in result["pptx"]
    assert "images" in result and "template1.png" in result["images"]
    assert "html" in result and "template1.html" in result["html"]

def test_store_generated_file(tmp_path):
    # Setup: create a dummy file to store
    src = tmp_path / "dummy.txt"
    src.write_text("test")
    dest = store_generated_file(str(src), "output.txt", storage_dir=str(tmp_path / "out"))
    assert os.path.exists(dest)
    with open(dest) as f:
        assert f.read() == "test"
