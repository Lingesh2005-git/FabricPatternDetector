import threading
import tensorflow as tf
from .config import MODEL_PATH

_model = None
_lock = threading.Lock()

def get_model() -> tf.keras.Model:
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                if not MODEL_PATH.exists():
                    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")
                _model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    return _model

def warm_model() -> None:
    get_model()
