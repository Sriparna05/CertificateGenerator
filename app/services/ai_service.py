"""
AI Personalization Service
Google Gemini API integration for personalized certificate messages.
"""

import os
import logging

logger = logging.getLogger(__name__)


def generate_personalized_message(prompt, recipient_data):
    """
    Generate a personalized message using Google Gemini API.
    Args:
        prompt (str): Custom prompt for the AI.
        recipient_data (dict): Data about the recipient.
    Returns:
        str: Personalized message.
    """
    api_key = os.getenv("GOOGLE_GEMINI_API_KEY")

    if not api_key:
        logger.warning("Google Gemini API key not found, using fallback message")
        return generate_fallback_message(recipient_data)

    try:
        # TODO: Integrate with Google Gemini API
        # For now, return an enhanced fallback
        return generate_enhanced_message(prompt, recipient_data)
    except Exception as e:
        logger.error(f"AI service error: {e}")
        return generate_fallback_message(recipient_data)


def generate_fallback_message(recipient_data):
    """
    Generate a fallback message when AI service is unavailable.
    Args:
        recipient_data (dict): Data about the recipient.
    Returns:
        str: Fallback personalized message.
    """
    name = recipient_data.get("name", "Recipient")
    course = recipient_data.get("course", "this course")

    return f"Congratulations {name}! Your dedication and hard work in completing {course} is truly commendable. This achievement represents your commitment to excellence and continuous learning."


def generate_enhanced_message(prompt, recipient_data):
    """
    Generate an enhanced message based on template and recipient data.
    Args:
        prompt (str): Custom prompt template.
        recipient_data (dict): Data about the recipient.
    Returns:
        str: Enhanced personalized message.
    """
    name = recipient_data.get("name", "Recipient")
    course = recipient_data.get("course", "this course")
    achievement = recipient_data.get("achievement", "completion")

    templates = {
        "congratulatory": f"Congratulations {name}! Your successful {achievement} of {course} demonstrates exceptional dedication and skill. This certificate recognizes your outstanding commitment to learning and professional development.",
        "motivational": f"Well done, {name}! Completing {course} is a significant milestone in your educational journey. Your perseverance and hard work have paid off, and this achievement will serve as a foundation for future success.",
        "professional": f"This certificate acknowledges that {name} has successfully demonstrated proficiency in {course}. This accomplishment reflects your commitment to professional excellence and continuous improvement.",
        "academic": f"We are pleased to recognize {name} for the successful completion of {course}. Your academic performance and dedication to learning exemplify the standards of excellence we value.",
    }

    # Use prompt as template key if it matches, otherwise use congratulatory
    message_type = prompt.lower() if prompt.lower() in templates else "congratulatory"
    return templates[message_type]
