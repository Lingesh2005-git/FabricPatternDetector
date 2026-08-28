import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from .config import (
    COTTON_CLASSES,
    COTTON_DISPLAY_NAMES,
    MATERIAL_CLASSES,
    MATERIAL_DISPLAY_NAMES,
    SILK_CLASSES,
    SILK_DISPLAY_NAMES,
)
from .gradcam import create_visuals, make_gradcam_heatmap
from .model_loader import get_model_for_material, warm_models
from .utils import decode_image, png_data_url

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(_: FastAPI):
    warm_models()
    yield

app = FastAPI(
    title="Silk Vision Staged Grad-CAM API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "supported_materials": MATERIAL_CLASSES,
        "silk_classes_count": len(SILK_CLASSES),
        "cotton_classes_count": len(COTTON_CLASSES),
    }

@app.post("/explain")
async def explain_endpoint(
    file: UploadFile = File(...),
    material: str = Form(default="silk"),
    class_index: int | None = Form(default=None),
):
    # Validate material
    norm_material = material.lower().strip() if material else "silk"
    if norm_material not in ["silk", "cotton"]:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported material '{material}'. Material must be 'silk' or 'cotton'.",
        )

    # Resolve class list and display names
    if norm_material == "silk":
        classes = SILK_CLASSES
        display_names = SILK_DISPLAY_NAMES
    else:
        classes = COTTON_CLASSES
        display_names = COTTON_DISPLAY_NAMES

    # Load matching Keras model
    try:
        model = get_model_for_material(norm_material)
    except FileNotFoundError as exc:
        logger.error(f"Missing model: {exc}")
        raise HTTPException(
            status_code=503,
            detail=(
                f"Grad-CAM cannot run because the matching Keras model for '{norm_material}' "
                f"is not supplied on the server. Please ensure the matching Keras model is placed in the project root."
            ),
        ) from exc
    except Exception as exc:
        logger.error(f"Failed to load model for {norm_material}: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load model for material '{norm_material}'.",
        ) from exc

    # Decode and validate image
    original, image_batch = decode_image(await file.read(), file.content_type)

    # Compute predictions on the backend model
    values = model.predict(image_batch, verbose=0)[0]
    predicted_index = int(values.argmax())

    selected_index = predicted_index if class_index is None else class_index
    if not (0 <= selected_index < len(classes)):
        raise HTTPException(
            status_code=422,
            detail=(
                f"Invalid class_index {selected_index} for material '{norm_material}'. "
                f"Must be between 0 and {len(classes) - 1}."
            ),
        )

    # Generate Grad-CAM heatmap & visuals
    heatmap = make_gradcam_heatmap(model, image_batch, selected_index)
    heatmap_image, overlay_image = create_visuals(original, heatmap)

    class_name = classes[selected_index]
    label = display_names.get(class_name, class_name)
    confidence = float(values[selected_index])

    return {
        "material": norm_material,
        "class_index": selected_index,
        "class_name": class_name,
        "label": label,
        "confidence": confidence,
        "model_used": f"{norm_material}_classifier",
        "heatmap_data_url": png_data_url(heatmap_image),
        "overlay_data_url": png_data_url(overlay_image),
    }
