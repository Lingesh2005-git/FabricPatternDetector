from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]

# Keras models corresponding to the TFLite classifiers
SILK_MODEL_PATH = ROOT_DIR / "best_silk_stage2.keras"
COTTON_MODEL_PATH = ROOT_DIR / "best_cotton_stage1.keras"
MATERIAL_MODEL_PATH = ROOT_DIR / "best_material_stage2.keras"

# Centralized class definitions matching mobile client
MATERIAL_CLASSES = ["cotton", "silk"]
MATERIAL_DISPLAY_NAMES = {
    "cotton": "Cotton",
    "silk": "Silk",
}

SILK_CLASSES = [
    "banarasi_silk",
    "chanderi_silk",
    "kanjeevaram_silk",
    "muga_silk",
    "mysore_silk",
    "pochampally_silk",
]

SILK_DISPLAY_NAMES = {
    "banarasi_silk": "Banarasi Silk",
    "chanderi_silk": "Chanderi Silk",
    "kanjeevaram_silk": "Kanjeevaram Silk",
    "muga_silk": "Muga Silk",
    "mysore_silk": "Mysore Silk",
    "pochampally_silk": "Pochampally Silk",
}

COTTON_CLASSES = [
    "cotton_fabric",
    "khadi",
    "ikat",
    "cotton_sarees",
    "handloom",
]

COTTON_DISPLAY_NAMES = {
    "cotton_fabric": "Cotton (Fabric)",
    "khadi": "Khadi",
    "ikat": "Ikat",
    "cotton_sarees": "Cotton Sarees",
    "handloom": "Handloom",
}

IMAGE_SIZE = (224, 224)
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
