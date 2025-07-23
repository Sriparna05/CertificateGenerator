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
