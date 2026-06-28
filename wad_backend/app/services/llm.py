import asyncio
import logging
import os

import google.generativeai as genai

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Load API key from settings
settings = get_settings()
api_key = settings.GEMINI_API_KEY

if api_key:
    genai.configure(api_key=api_key)
else:
    logger.warning("GEMINI_API_KEY not set – LLM predictions will be disabled.")

# Model choice – fast and cheap
MODEL_NAME = "gemini-3.5-flash"


def sqli_check(query: str) -> int:
    """
    Synchronous function that asks Gemini to classify the SQL query.
    Returns 1 for malicious (SQLi), 0 for benign.
    """
    model = genai.GenerativeModel(MODEL_NAME)
    print("loaded gemini model")

    prompt = f"""
    You are an expert cybersecurity analyst. Analyze the following SQL query and determine if it contains an SQL injection (SQLi) attack.
    
    Rules:
    - Output ONLY the number 1 if it is an web attack payload like sql injection, xss or any other attack payload.
    - Output ONLY the number 0 if it is a safe, normal.
    - Do not include any other text, punctuation, explanation, or markdown formatting.

    Payload to analyze:
    {query}
    """

    try:
        print(prompt)
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        print(f"response: {result_text}")
        result = int(result_text)
        if result in (0, 1):
            return result
        else:
            logger.warning(f"Gemini returned unexpected integer: {result}")
            return 0
    except Exception as e:
        logger.exception(f"Gemini API error: {e}")
        return 0  # fallback: treat as benign


async def call_gemini(query: str) -> int | None:
    """
    Asynchronous wrapper for sqli_check.
    Returns 0/1 on success, None if API key is missing or disabled.
    """
    if not api_key:
        print("no api key")
        return None
    return await asyncio.to_thread(sqli_check, query)
