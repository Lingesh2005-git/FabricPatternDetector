from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT_DIR / "final_silk_model_v2_unknown.keras"
CLASS_NAMES = ["banarasi_silk", "kanchipuram_silk", "paithani_silk", "mysore_silk", "tussar_silk"]
DISPLAY_NAMES = {
    "banarasi_silk": "Banarasi Silk", "kanchipuram_silk": "Kanchipuram Silk",
    "paithani_silk": "Paithani Silk", "mysore_silk": "Mysore Silk", "tussar_silk": "Tussar Silk",
}
IMAGE_SIZE = (224, 224)
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
