import logging
import threading
from pathlib import Path
import tensorflow as tf
from .config import (
    COTTON_MODEL_PATH,
    MATERIAL_MODEL_PATH,
    SILK_MODEL_PATH,
)

logger = logging.getLogger(__name__)

_models: dict[str, tf.keras.Model] = {}
_lock = threading.Lock()

def _load_model_safe(model_key: str, path: Path) -> tf.keras.Model:
    if model_key not in _models:
        with _lock:
            if model_key not in _models:
                if not path.exists():
                    raise FileNotFoundError(
                        f"Matching Keras model not found at '{path.name}'. "
                        f"Grad-CAM needs the matching Keras model for the '{model_key}' classifier."
                    )
                logger.info(f"Loading Keras model '{model_key}' from {path}...")
                _models[model_key] = tf.keras.models.load_model(path, compile=False)
                logger.info(f"Successfully loaded '{model_key}' model.")
    return _models[model_key]

def get_silk_model() -> tf.keras.Model:
    return _load_model_safe("silk", SILK_MODEL_PATH)

def get_cotton_model() -> tf.keras.Model:
    return _load_model_safe("cotton", COTTON_MODEL_PATH)

def get_material_model() -> tf.keras.Model:
    return _load_model_safe("material", MATERIAL_MODEL_PATH)

def get_model_for_material(material: str) -> tf.keras.Model:
    normalized = material.lower().strip()
    if normalized == "silk":
        return get_silk_model()
    elif normalized == "cotton":
        return get_cotton_model()
    else:
        raise ValueError(f"Unknown material '{material}'. Supported materials are 'silk' and 'cotton'.")

def warm_models() -> None:
    """Pre-warm available models if they exist."""
    for key, path in [("silk", SILK_MODEL_PATH), ("cotton", COTTON_MODEL_PATH), ("material", MATERIAL_MODEL_PATH)]:
        if path.exists():
            try:
                _load_model_safe(key, path)
            except Exception as e:
                logger.warning(f"Could not pre-warm {key} model: {e}")
