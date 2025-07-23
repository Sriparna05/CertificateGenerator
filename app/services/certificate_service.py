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
        templates["images"] = [f for f in os.listdir(images_dir) if f.lower().endswith((".png", ".jpg", ".jpeg"))]
    if os.path.isdir(html_dir):
        templates["html"] = [f for f in os.listdir(html_dir) if f.endswith(".html")]
    return templates
import shutil
# Store generated files in local directory
def store_generated_file(src_path, filename, storage_dir="generated_certificates"):
    """
    Move or copy a generated file to the storage directory.
    Args:
        src_path (str): Path to the generated file.
        filename (str): Name for the stored file.
        storage_dir (str): Directory to store the file.
    Returns:
        str: Path to the stored file.
    """
    os.makedirs(storage_dir, exist_ok=True)
    dest_path = os.path.join(storage_dir, filename)
    shutil.copy2(src_path, dest_path)
    return dest_path
from weasyprint import HTML
# Output HTML to PDF using WeasyPrint
def html_to_pdf(html_path, pdf_output_path):
    """
    Convert a rendered HTML file to PDF using WeasyPrint.
    Args:
        html_path (str): Path to the HTML file.
        pdf_output_path (str): Path to save the PDF.
    """
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
from PIL import Image, ImageDraw, ImageFont
# Image template processing
def generate_certificate_from_image(template_path, output_path, text_items, font_path=None, font_size=40, fill=(0,0,0)):
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
    font = ImageFont.truetype(font_path, font_size) if font_path else ImageFont.load_default()
    for item in text_items:
        draw.text(item["xy"], item["text"], font=font, fill=fill)
    image.save(output_path)
from jinja2 import Environment, FileSystemLoader
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
"""
Certificate generation service.
Handles PPTX, HTML, and image template processing.
"""

from pptx import Presentation
import os

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
