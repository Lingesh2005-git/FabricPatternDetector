import base64
import io
from PIL import Image, UnidentifiedImageError
import numpy as np
from fastapi import HTTPException
from .config import IMAGE_SIZE, MAX_UPLOAD_BYTES

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

def decode_image(contents: bytes, content_type: str | None) -> tuple[Image.Image, np.ndarray]:
    if not contents or len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Image must be between 1 byte and 10 MB.")
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(415, "Only JPEG, PNG, and WebP images are supported.")
    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        image.thumbnail((4096, 4096))
        display = image.copy()
        resized = image.resize(IMAGE_SIZE, Image.Resampling.LANCZOS)
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(422, "The uploaded file is not a valid image.") from exc
    return display, np.expand_dims(np.asarray(resized, dtype=np.float32) / 255.0, axis=0)

def png_data_url(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")
