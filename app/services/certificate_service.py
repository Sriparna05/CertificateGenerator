"""
Certificate generation service.
Handles PPTX, HTML, and image template processing.
"""

import os
import shutil
import uuid
from datetime import datetime
from pptx import Presentation
from PIL import Image, ImageDraw, ImageFont
from jinja2 import Environment, FileSystemLoader

from app.celery_worker import celery_app


# Async certificate generation task
@celery_app.task
def generate_certificate_async(data):
    """
    Celery task to generate certificates asynchronously.
    Args:
        data (dict): Certificate generation request data.
    Returns:
        dict: Generation result.
    """
    try:
        template_id = data.get("template_id")
        output_format = data.get("output_format", "pdf")
        recipients = data.get("recipients", [])
        ai_options = data.get("ai_options", {})

        result = generate_certificate(
            template_id, output_format, recipients, ai_options
        )
        return result
    except Exception as e:
        return {
            "status": "error",
            "message": f"Certificate generation failed: {str(e)}",
        }


# List available templates
def list_templates(base_dir="certificate_templates"):
    """
    List available certificate templates by type (pptx, images, html).
    Returns:
        dict: {"pptx": [filenames], "images": [filenames], "html": [filenames]}
    """
    templates = {"pptx": [], "images": [], "html": []}
    pptx_dir = os.path.join(base_dir, "pptx")
    images_dir = os.path.join(base_dir, "images")
    html_dir = os.path.join(base_dir, "html")

    if os.path.isdir(pptx_dir):
        templates["pptx"] = [f for f in os.listdir(pptx_dir) if f.endswith(".pptx")]
    if os.path.isdir(images_dir):
        templates["images"] = [
            f
            for f in os.listdir(images_dir)
            if f.lower().endswith((".png", ".jpg", ".jpeg"))
        ]
    if os.path.isdir(html_dir):
        templates["html"] = [f for f in os.listdir(html_dir) if f.endswith(".html")]
    return templates


# Store generated files in local directory or (stub) cloud
def store_generated_file(
    src_path, filename, storage_dir="generated_certificates", use_cloud=False
):
    """
    Move or copy a generated file to the storage directory or upload to cloud (stub).
    Args:
        src_path (str): Path to the generated file.
        filename (str): Name for the stored file.
        storage_dir (str): Directory to store the file.
        use_cloud (bool): If True, upload to cloud (stub).
    Returns:
        str: Path or URL to the stored file.
    """
    if use_cloud:
        # TODO: Integrate with cloud storage (S3, GCS, etc.)
        return f"https://cloud-storage.example.com/{filename}"

    os.makedirs(storage_dir, exist_ok=True)
    dest_path = os.path.join(storage_dir, filename)

    # If source and destination are the same, just return the path
    if os.path.abspath(src_path) == os.path.abspath(dest_path):
        return dest_path

    # Otherwise copy the file
    shutil.copy2(src_path, dest_path)
    return dest_path


# Output HTML to PDF using WeasyPrint
def html_to_pdf(html_path, pdf_output_path):
    """
    Convert a rendered HTML file to PDF using WeasyPrint.
    Args:
        html_path (str): Path to the HTML file.
        pdf_output_path (str): Path to save the PDF.
    """
    # Import here to allow mocking in tests and avoid import errors if WeasyPrint is not installed
    from weasyprint import HTML

    HTML(html_path).write_pdf(pdf_output_path)


# Output image to PDF/PNG/JPEG using Pillow
def image_to_format(image_path, output_path, fmt="PDF"):
    """
    Convert an image to PDF, PNG, or JPEG.
    Args:
        image_path (str): Path to the image file.
        output_path (str): Path to save the output file.
        fmt (str): Output format ("PDF", "PNG", "JPEG").
    """
    image = Image.open(image_path)
    if fmt.upper() == "PDF":
        image.convert("RGB").save(output_path, "PDF")
    else:
        image.save(output_path, fmt.upper())


# Image template processing
def generate_certificate_from_image(
    template_path, output_path, text_items, font_path=None, font_size=40, fill=(0, 0, 0)
):
    """
    Overlay text on an image template at specified coordinates.
    Args:
        template_path (str): Path to the image template (PNG/JPEG).
        output_path (str): Path to save the generated image.
        text_items (list): List of dicts: [{"text": str, "xy": (x, y)}]
        font_path (str): Path to a .ttf font file (optional).
        font_size (int): Font size.
        fill (tuple): Text color (R, G, B).
    """
    image = Image.open(template_path).convert("RGBA")
    draw = ImageDraw.Draw(image)
    font = (
        ImageFont.truetype(font_path, font_size)
        if font_path
        else ImageFont.load_default()
    )
    for item in text_items:
        draw.text(item["xy"], item["text"], font=font, fill=fill)
    image.save(output_path)


# HTML template rendering
def generate_certificate_from_html(template_dir, template_name, output_path, context):
    """
    Render an HTML template with context and save to output_path.
    Args:
        template_dir (str): Directory containing HTML templates.
        template_name (str): HTML template filename.
        output_path (str): Path to save the rendered HTML file.
        context (dict): Data to render in the template.
    """
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template(template_name)
    rendered_html = template.render(context)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(rendered_html)


def generate_certificate_from_pptx(template_path, output_path, replacements):
    """
    Generate a certificate from a PPTX template by replacing placeholders.
    Args:
        template_path (str): Path to the PPTX template.
        output_path (str): Path to save the generated PPTX.
        replacements (dict): Placeholder replacements, e.g., {"{{student_name}}": "Alex Doe"}
    """
    prs = Presentation(template_path)
    for slide in prs.slides:
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    for run in paragraph.runs:
                        for key, value in replacements.items():
                            if key in run.text:
                                run.text = run.text.replace(key, value)
    prs.save(output_path)


def generate_certificate(template_id, output_format, recipients, ai_options=None):
    """
    Generate certificates for multiple recipients.

    Args:
        template_id (str): Template identifier (e.g., "achievement_template.html")
        output_format (str): Output format ("pdf", "png", "jpeg")
        recipients (list): List of recipient data dictionaries
        ai_options (dict): AI personalization options

    Returns:
        dict: Result with generated certificate paths
    """
    results = []
    template_base_dir = "certificate_templates"

    for recipient in recipients:
        try:
            certificate_id = str(uuid.uuid4())
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            # Determine template type based on file extension
            if template_id.endswith(".html"):
                # HTML template
                template_dir = os.path.join(template_base_dir, "html")
                template_path = os.path.join(template_dir, template_id)

                if not os.path.exists(template_path):
                    raise FileNotFoundError(f"Template not found: {template_path}")

                # Prepare context with default values
                context = {
                    "recipient_name": recipient.get("name", "Recipient"),
                    "course_name": recipient.get("course", "Course"),
                    "date": recipient.get("date", datetime.now().strftime("%B %d, %Y")),
                    "certificate_id": certificate_id,
                    "instructor_name": recipient.get("instructor", "Instructor"),
                    "organization_name": recipient.get("organization", "Organization"),
                    "subject_area": recipient.get("subject_area", "Various Subjects"),
                    "completion_date": recipient.get(
                        "completion_date", datetime.now().strftime("%B %d, %Y")
                    ),
                    "duration_hours": recipient.get("duration_hours", "40"),
                    "issuer_name": recipient.get(
                        "issuer_name", "Certificate Authority"
                    ),
                    **recipient,  # Allow override of any field
                }

                # Generate HTML file
                html_filename = f"cert_{certificate_id}_{timestamp}.html"
                html_path = os.path.join("generated_certificates", html_filename)
                os.makedirs("generated_certificates", exist_ok=True)

                generate_certificate_from_html(
                    template_dir, template_id, html_path, context
                )

                # Convert to requested format
                if output_format.lower() == "pdf":
                    pdf_filename = f"cert_{certificate_id}_{timestamp}.pdf"
                    pdf_path = os.path.join("generated_certificates", pdf_filename)
                    html_to_pdf(html_path, pdf_path)
                    final_path = pdf_path
                else:
                    final_path = html_path

            elif template_id.endswith((".png", ".jpg", ".jpeg")):
                # Image template
                template_path = os.path.join(template_base_dir, "images", template_id)

                if not os.path.exists(template_path):
                    raise FileNotFoundError(f"Template not found: {template_path}")

                # Prepare text replacements
                text_items = [
                    {"text": recipient.get("name", "Recipient"), "xy": (400, 220)},
                    {"text": recipient.get("course", "Course Name"), "xy": (400, 340)},
                    {
                        "text": recipient.get(
                            "date", datetime.now().strftime("%B %d, %Y")
                        ),
                        "xy": (400, 420),
                    },
                ]

                output_filename = (
                    f"cert_{certificate_id}_{timestamp}.{output_format.lower()}"
                )
                output_path = os.path.join("generated_certificates", output_filename)
                os.makedirs("generated_certificates", exist_ok=True)

                generate_certificate_from_image(template_path, output_path, text_items)
                final_path = output_path

            elif template_id.endswith(".pptx"):
                # PPTX template
                template_path = os.path.join(template_base_dir, "pptx", template_id)

                if not os.path.exists(template_path):
                    raise FileNotFoundError(f"Template not found: {template_path}")

                # Prepare replacements
                replacements = {
                    "{{name}}": recipient.get("name", "Recipient"),
                    "{{course}}": recipient.get("course", "Course Name"),
                    "{{date}}": recipient.get(
                        "date", datetime.now().strftime("%B %d, %Y")
                    ),
                    "{{instructor}}": recipient.get("instructor", "Instructor"),
                    "{{organization}}": recipient.get("organization", "Organization"),
                }

                if output_format.lower() == "pptx":
                    output_filename = f"cert_{certificate_id}_{timestamp}.pptx"
                    output_path = os.path.join(
                        "generated_certificates", output_filename
                    )
                    os.makedirs("generated_certificates", exist_ok=True)

                    generate_certificate_from_pptx(
                        template_path, output_path, replacements
                    )
                    final_path = output_path
                else:
                    # For non-PPTX output, we'd need to convert PPTX to image first
                    # This is a placeholder - requires additional libraries like python-pptx-to-image
                    raise ValueError("PPTX to PDF/PNG/JPEG conversion not implemented")
            else:
                raise ValueError(f"Unsupported template format: {template_id}")

            # Store the generated file
            stored_path = store_generated_file(final_path, os.path.basename(final_path))

            results.append(
                {
                    "recipient": recipient.get("name", "Recipient"),
                    "certificate_id": certificate_id,
                    "file_path": stored_path,
                    "status": "success",
                }
            )

        except Exception as e:
            results.append(
                {
                    "recipient": recipient.get("name", "Unknown"),
                    "certificate_id": None,
                    "file_path": None,
                    "status": "error",
                    "error": str(e),
                }
            )

    return {
        "status": "completed",
        "total_recipients": len(recipients),
        "successful": len([r for r in results if r["status"] == "success"]),
        "failed": len([r for r in results if r["status"] == "error"]),
        "results": results,
    }
