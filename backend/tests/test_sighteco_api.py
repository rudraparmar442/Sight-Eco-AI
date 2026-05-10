"""Backend API tests for SightEco AI."""
import os
import io
import requests
import pytest
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ai-image-speak.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _real_jpeg_bytes():
    # Build a real-content JPEG with edges/textures (gradient + shapes)
    img = Image.new("RGB", (320, 240), (200, 220, 255))
    px = img.load()
    for y in range(240):
        for x in range(320):
            px[x, y] = ((x * 255) // 320, (y * 255) // 240, ((x + y) * 255) // 560)
    # Draw a darker rectangle (object)
    for y in range(60, 180):
        for x in range(80, 240):
            px[x, y] = (40 + (x % 20), 80, 30 + (y % 30))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


@pytest.fixture(scope="module")
def jpeg_bytes():
    return _real_jpeg_bytes()


# ---------------- Health ---------------- #
def test_root_status():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "message" in data
    assert data.get("model") == "gemini-2.5-pro"


# ---------------- Predict (English) ---------------- #
def test_predict_english(jpeg_bytes):
    files = {"image": ("test.jpg", jpeg_bytes, "image/jpeg")}
    data = {"language": "en"}
    r = requests.post(f"{API}/predict", files=files, data=data, timeout=120)
    assert r.status_code == 200, r.text
    body = r.json()
    assert set(["id", "caption", "language", "created_at"]).issubset(body.keys())
    assert body["language"] == "en"
    assert isinstance(body["caption"], str) and len(body["caption"]) > 5


# ---------------- Predict (Hindi) ---------------- #
def test_predict_hindi(jpeg_bytes):
    files = {"image": ("test.jpg", jpeg_bytes, "image/jpeg")}
    data = {"language": "hi"}
    r = requests.post(f"{API}/predict", files=files, data=data, timeout=120)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["language"] == "hi"
    assert len(body["caption"]) > 0
    # Should contain at least one Devanagari char
    assert any("\u0900" <= ch <= "\u097F" for ch in body["caption"]), f"No Hindi chars: {body['caption']}"


# ---------------- Reject unsupported MIME ---------------- #
def test_predict_rejects_text():
    files = {"image": ("test.txt", b"hello world", "text/plain")}
    data = {"language": "en"}
    r = requests.post(f"{API}/predict", files=files, data=data, timeout=30)
    assert r.status_code == 400


# ---------------- History ---------------- #
def test_history_list_after_predict(jpeg_bytes):
    # ensure at least 1 entry
    files = {"image": ("test.jpg", jpeg_bytes, "image/jpeg")}
    requests.post(f"{API}/predict", files=files, data={"language": "en"}, timeout=120)

    r = requests.get(f"{API}/history", timeout=15)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    assert len(items) >= 1
    first = items[0]
    assert "_id" not in first
    assert "image_preview" not in first
    assert "caption" in first and "created_at" in first


# ---------------- Clear history ---------------- #
def test_history_clear():
    r = requests.delete(f"{API}/history", timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert "deleted" in body
    # confirm empty
    r2 = requests.get(f"{API}/history", timeout=15)
    assert r2.status_code == 200
    assert r2.json() == []
