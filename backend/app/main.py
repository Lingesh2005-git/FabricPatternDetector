import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from .config import CLASS_NAMES, DISPLAY_NAMES
from .gradcam import create_visuals, make_gradcam_heatmap
from .model_loader import get_model, warm_model
from .utils import decode_image, png_data_url

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(_: FastAPI):
    warm_model()
    yield

app = FastAPI(title="Silk Vision Grad-CAM API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[], allow_credentials=False, allow_methods=["POST", "GET"], allow_headers=["*"])

def predict(image_batch):
    values = get_model().predict(image_batch, verbose=0)[0]
    index = int(values.argmax())
    return index, values

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": get_model() is not None}

@app.post("/predict")
async def predict_endpoint(file: UploadFile = File(...)):
    _, image_batch = decode_image(await file.read(), file.content_type)
    index, values = predict(image_batch)
    return {"class_index": index, "class_name": CLASS_NAMES[index], "label": DISPLAY_NAMES[CLASS_NAMES[index]], "confidence": float(values[index]), "scores": [float(v) for v in values]}

@app.post("/explain")
async def explain_endpoint(file: UploadFile = File(...), class_index: int | None = Form(default=None)):
    original, image_batch = decode_image(await file.read(), file.content_type)
    predicted_index, values = predict(image_batch)
    selected_index = predicted_index if class_index is None else class_index
    if not 0 <= selected_index < len(CLASS_NAMES):
        raise HTTPException(422, "class_index must be between 0 and 4.")
    heatmap = make_gradcam_heatmap(get_model(), image_batch, selected_index)
    heatmap_image, overlay_image = create_visuals(original, heatmap)
    return {"class_index": selected_index, "class_name": CLASS_NAMES[selected_index], "label": DISPLAY_NAMES[CLASS_NAMES[selected_index]], "confidence": float(values[selected_index]), "heatmap_data_url": png_data_url(heatmap_image), "overlay_data_url": png_data_url(overlay_image)}
