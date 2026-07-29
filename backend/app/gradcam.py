import cv2
import numpy as np
import tensorflow as tf
from PIL import Image

def _last_conv_layer(model: tf.keras.Model) -> tf.keras.layers.Layer:
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
        raise ValueError("Grad-CAM requires at least one Conv2D layer.")
    return candidates[-1]

def make_gradcam_heatmap(model: tf.keras.Model, image_batch: np.ndarray, class_index: int) -> np.ndarray:
    last_conv = _last_conv_layer(model)
    # The EfficientNet backbone is nested inside the saved classifier. Rebuild the
    # forward pass around its inner convolutional tensor so Keras 3 can trace it.
    backbone = next(
        layer for layer in model.layers
        if isinstance(layer, tf.keras.Model) and last_conv in layer.layers
    )
    backbone_index = model.layers.index(backbone)
    feature_model = tf.keras.Model(backbone.input, last_conv.output)
    inputs = tf.convert_to_tensor(image_batch)
    with tf.GradientTape() as tape:
        features = inputs
        for layer in model.layers[1:backbone_index]:
            features = layer(features, training=False)
        conv_output = feature_model(features, training=False)
        predictions = conv_output
        for layer in backbone.layers[backbone.layers.index(last_conv) + 1:]:
            predictions = layer(predictions, training=False)
        for layer in model.layers[backbone_index + 1:]:
            predictions = layer(predictions, training=False)
        loss = predictions[:, class_index]
    gradients = tape.gradient(loss, conv_output)
    weights = tf.reduce_mean(gradients, axis=(1, 2), keepdims=True)
    heatmap = tf.reduce_sum(weights * conv_output, axis=-1)[0]
    heatmap = tf.maximum(heatmap, 0)
    maximum = tf.reduce_max(heatmap)
    return (heatmap / (maximum + tf.keras.backend.epsilon())).numpy()

def create_visuals(original: Image.Image, heatmap: np.ndarray) -> tuple[Image.Image, Image.Image]:
    source = np.asarray(original.convert("RGB"))
    resized = cv2.resize(heatmap, (source.shape[1], source.shape[0]), interpolation=cv2.INTER_CUBIC)
    colored_bgr = cv2.applyColorMap(np.uint8(np.clip(resized, 0, 1) * 255), cv2.COLORMAP_JET)
    colored_rgb = cv2.cvtColor(colored_bgr, cv2.COLOR_BGR2RGB)
    overlay = cv2.addWeighted(source, 0.58, colored_rgb, 0.42, 0)
    return Image.fromarray(colored_rgb), Image.fromarray(overlay)
