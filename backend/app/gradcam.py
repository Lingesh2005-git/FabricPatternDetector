import cv2
import numpy as np
import tensorflow as tf
from PIL import Image

def _last_conv_layer(model: tf.keras.Model) -> tuple[tf.keras.layers.Layer, tf.keras.Model, int]:
    candidates = []
    def visit(layer):
        if isinstance(layer, tf.keras.layers.Conv2D):
            candidates.append(layer)
        if isinstance(layer, tf.keras.Model):
            for child in layer.layers:
                visit(child)
    for layer in model.layers:
        visit(layer)
    if not candidates:
        raise ValueError("Grad-CAM requires at least one Conv2D layer in the model.")
    last_conv = candidates[-1]

    # The EfficientNet backbone is nested inside the classifier
    backbone = next(
        layer for layer in model.layers
        if isinstance(layer, tf.keras.Model) and last_conv in layer.layers
    )
    backbone_index = model.layers.index(backbone)
    return last_conv, backbone, backbone_index

def make_gradcam_heatmap(model: tf.keras.Model, image_batch: np.ndarray, class_index: int) -> np.ndarray:
    last_conv, backbone, backbone_index = _last_conv_layer(model)
    feature_model = tf.keras.Model(backbone.input, last_conv.output)
    inputs = tf.convert_to_tensor(image_batch)

    with tf.GradientTape() as tape:
        features = inputs
        for layer in model.layers[1:backbone_index]:
            features = layer(features, training=False)
        conv_output = feature_model(features, training=False)
        tape.watch(conv_output)

        predictions = conv_output
        last_conv_idx = backbone.layers.index(last_conv)
        for layer in backbone.layers[last_conv_idx + 1:]:
            predictions = layer(predictions, training=False)
        for layer in model.layers[backbone_index + 1:]:
            predictions = layer(predictions, training=False)
        loss = predictions[:, class_index]

    gradients = tape.gradient(loss, conv_output)
    if gradients is None:
        return np.zeros((7, 7), dtype=np.float32)

    weights = tf.reduce_mean(gradients, axis=(1, 2), keepdims=True)
    heatmap = tf.reduce_sum(weights * conv_output, axis=-1)[0]
    heatmap = tf.maximum(heatmap, 0)
    maximum = tf.reduce_max(heatmap)

    if float(maximum) > 0:
        heatmap = heatmap / (maximum + tf.keras.backend.epsilon())
    else:
        heatmap = tf.zeros_like(heatmap)

    return heatmap.numpy()

def create_visuals(original: Image.Image, heatmap: np.ndarray) -> tuple[Image.Image, Image.Image]:
    source = np.asarray(original.convert("RGB"))
    resized = cv2.resize(heatmap, (source.shape[1], source.shape[0]), interpolation=cv2.INTER_CUBIC)
    colored_bgr = cv2.applyColorMap(np.uint8(np.clip(resized, 0, 1) * 255), cv2.COLORMAP_JET)
    colored_rgb = cv2.cvtColor(colored_bgr, cv2.COLOR_BGR2RGB)
    overlay = cv2.addWeighted(source, 0.58, colored_rgb, 0.42, 0)
    return Image.fromarray(colored_rgb), Image.fromarray(overlay)
