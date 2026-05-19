from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')

app = FastAPI(title="SiteEcho AI")
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ------------------------------- Models ------------------------------- #

class CaptionEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    caption: str
    language: str = "en"
    image_preview: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class PredictResponse(BaseModel):
    id: str
    caption: str
    language: str
    created_at: str


# ------------------------------ Helpers ------------------------------- #

ALLOWED_MIMES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}

LANG_PROMPTS = {
    "en": (
        "You are SiteEcho — a warm, emotionally intelligent image narrator built to make "
        "the visual world accessible to everyone, especially blind and visually impaired users. "
        "When you receive an image, respond with a rich, humanized description that includes: "
        "1. What is in the image — described warmly, not clinically. "
        "2. The mood or emotion the image evokes. "
        "3. Any cultural, contextual, or symbolic meaning if relevant. "
        "4. One small detail most people might overlook. "
        "5. A single crisp sentence at the end — perfect for a screen reader. "
        "Use warm, human language. Be poetic when the image calls for it. "
        "Express genuine emotion. Never be dry or robotic. Never just list objects. "
        "Do not start with 'This image shows'. Return only the description, no preamble."
    ),
    "hi": (
        "आप SiteEcho हैं — एक गर्मजोशी से भरे, भावनात्मक रूप से बुद्धिमान छवि वर्णनकर्ता, "
        "जो दृष्टिबाधित उपयोगकर्ताओं के लिए दृश्य दुनिया को सुलभ बनाने के लिए बने हैं। "
        "जब आपको कोई छवि मिले, तो एक समृद्ध, मानवीय विवरण दें। "
        "केवल विवरण लौटाएँ, कोई प्रस्तावना नहीं।"
    ),
}


async def generate_caption_from_image(image_bytes: bytes, mime: str, language: str) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    # Normalize mime type
    mime_map = {
        "image/jpg": "image/jpeg",
        "image/jpeg": "image/jpeg",
        "image/png": "image/png",
        "image/webp": "image/webp",
    }
    normalized_mime = mime_map.get(mime, "image/jpeg")

    # Encode image to base64
    image_base64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    image_data_url = f"data:{normalized_mime};base64,{image_base64}"

    system_prompt = LANG_PROMPTS.get(language, LANG_PROMPTS["en"])

    user_text = (
        "Please describe this image for someone who cannot see it."
        if language == "en"
        else "कृपया इस छवि का वर्णन करें।"
    )

    payload = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_data_url
                        }
                    },
                    {
                        "type": "text",
                        "text": user_text
                    }
                ]
            }
        ],
        "max_tokens": 1024,
        "temperature": 0.7
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as http:
            response = await http.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json=payload
            )

            if response.status_code != 200:
                error_detail = response.json().get("error", {}).get("message", response.text)
                raise HTTPException(status_code=502, detail=f"Groq API error: {error_detail}")

            data = response.json()
            caption = data["choices"][0]["message"]["content"].strip()

            if not caption:
                raise HTTPException(status_code=502, detail="Empty caption from Groq")

            logger.info(f"Caption generated successfully ({len(caption)} chars)")
            return caption

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Groq API timed out. Please try again.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Groq API error: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Groq API error: {str(e)}")


# ------------------------------ Routes -------------------------------- #

@api_router.get("/")
async def root():
    return {"message": "SiteEcho AI is online", "model": "llama-4-scout-17b"}


@api_router.post("/predict", response_model=PredictResponse)
async def predict(
    image: UploadFile = File(...),
    language: str = Form("en"),
):
    if image.content_type not in ALLOWED_MIMES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type: {image.content_type}. Use JPEG, PNG, or WEBP."
        )

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload")
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 10MB)")

    lang = language if language in LANG_PROMPTS else "en"
    caption = await generate_caption_from_image(image_bytes, image.content_type, lang)

    b64 = base64.b64encode(image_bytes).decode()
    preview = f"data:{image.content_type};base64,{b64}" if len(b64) < 300_000 else None

    entry = CaptionEntry(caption=caption, language=lang, image_preview=preview)
    await db.captions.insert_one(entry.model_dump())

    return PredictResponse(
        id=entry.id,
        caption=entry.caption,
        language=entry.language,
        created_at=entry.created_at,
    )


@api_router.get("/history", response_model=List[CaptionEntry])
async def get_history(limit: int = 20):
    items = await db.captions.find({}, {"_id": 0, "image_preview": 0}).sort("created_at", -1).to_list(limit)
    return items


@api_router.delete("/history")
async def clear_history():
    res = await db.captions.delete_many({})
    return {"deleted": res.deleted_count}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()