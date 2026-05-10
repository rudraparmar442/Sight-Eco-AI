from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
import tempfile
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="SightEco AI")
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
    image_preview: Optional[str] = None  # data url thumbnail
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
        "You are an assistive vision AI for blind and visually impaired users. "
        "Describe this image in 1-3 clear, vivid, factual sentences. "
        "Focus on subjects, actions, scene, colors, and notable details. "
        "Avoid hallucinations. Do not start with phrases like 'This image shows'. "
        "Return only the caption, no preamble."
    ),
    "hi": (
        "आप दृष्टिबाधित उपयोगकर्ताओं के लिए एक सहायक AI हैं। "
        "इस छवि का वर्णन 1-3 स्पष्ट, सजीव, तथ्यात्मक वाक्यों में हिंदी में करें। "
        "विषय, क्रिया, दृश्य, रंग और महत्वपूर्ण विवरण पर ध्यान दें। "
        "केवल कैप्शन लौटाएँ, कोई प्रस्तावना नहीं।"
    ),
}


async def generate_caption_from_image(image_bytes: bytes, mime: str, language: str) -> str:
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")

    suffix_map = {"image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    suffix = suffix_map.get(mime, ".jpg")

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        tmp.write(image_bytes)
        tmp.flush()
        tmp.close()

        system_prompt = LANG_PROMPTS.get(language, LANG_PROMPTS["en"])
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"sighteco-{uuid.uuid4()}",
            system_message=system_prompt,
        ).with_model("gemini", "gemini-2.5-pro")

        image_file = FileContentWithMimeType(file_path=tmp.name, mime_type=mime)
        user_msg = UserMessage(
            text="Describe this image for an assistive screen-reader.",
            file_contents=[image_file],
        )
        response = await chat.send_message(user_msg)
        caption = (response or "").strip()
        if not caption:
            raise HTTPException(status_code=502, detail="Empty caption from model")
        return caption
    finally:
        try:
            os.unlink(tmp.name)
        except Exception:
            pass


# ------------------------------ Routes -------------------------------- #

@api_router.get("/")
async def root():
    return {"message": "SightEco AI is online", "model": "gemini-2.5-pro"}


@api_router.post("/predict", response_model=PredictResponse)
async def predict(
    image: UploadFile = File(...),
    language: str = Form("en"),
):
    if image.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {image.content_type}. Use JPEG, PNG, or WEBP.")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload")
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 10MB)")

    lang = language if language in LANG_PROMPTS else "en"
    caption = await generate_caption_from_image(image_bytes, image.content_type, lang)

    # build a small thumbnail data url (just stash original base64 small)
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
