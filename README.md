# Silk Vision

An Expo React Native application with offline TensorFlow Lite silk classification and an opt-in FastAPI Grad-CAM service.

## Architecture

```text
Picker / camera image
        |
        +--> Skia resize + RGB float conversion --> TFLite model (offline) --> class + confidence
        |
        +--> [only after user taps Explain] --> FastAPI --> Keras model + Grad-CAM --> PNG heatmap + overlay
```

The local model accepts `1 x 224 x 224 x 3` RGB float32 input and produces five scores. Its class order is Banarasi, Kanchipuram, Paithani, Mysore, and Tussar silk. The Grad-CAM service uses EfficientNetB0's `top_conv`, the last convolutional feature map, because it retains spatial information while remaining closest to the classification head.

## Mobile setup

```powershell
npm install
npx expo prebuild --clean
npx expo run:android
```

Use a development build, not Expo Go: `react-native-fast-tflite` is a native module. For a physical phone, set `EXPO_PUBLIC_API_URL` to the LAN address of the backend before starting Expo, for example:

```powershell
$env:EXPO_PUBLIC_API_URL='http://192.168.1.10:8000'
npx expo start --dev-client
```

Android emulators use the default `http://10.0.2.2:8000`. Rebuild the native app after changing `app.json` or adding native dependencies.

## Backend setup and API

Follow [backend/README.md](backend/README.md). `POST /predict` accepts multipart field `file`; `POST /explain` accepts `file` and optional `class_index` from `0` to `4`.

Example prediction response:

```json
{"class_index":0,"class_name":"banarasi_silk","label":"Banarasi Silk","confidence":0.96,"scores":[0.96,0.01,0.01,0.01,0.01]}
```

`/explain` returns the same prediction fields plus `heatmap_data_url` and `overlay_data_url`: compact PNG `data:` URLs that the mobile `Image` component renders directly.

## Operations

- The mobile model is bundled and loaded once per app session; image classification remains available without a network connection.
- The backend model is loaded once at FastAPI startup. Limit a production worker to one TensorFlow model copy.
- Uploads are capped at 10 MB and only JPEG, PNG, and WebP are accepted. The app retries one transient explanation request and shows user-readable errors for offline, timeout, invalid file, and server failure conditions.
- Deploy the backend behind HTTPS, authentication, a reverse-proxy body-size limit, and explicit CORS origins. Do not retain or log uploaded images.

## Verification completed

- Android production JavaScript bundle succeeds and contains `silk_model_v2_unknown.tflite`.
- The supplied Keras model was inspected: input `224x224x3`, output `5` classes.
- Backend prediction, EfficientNet Grad-CAM generation, heatmap normalization, and PNG overlay creation were run successfully against a local image.

## Limits and future work

This is a textile classification assistant, not authentication evidence. Before release, validate accuracy on representative real-world images, measure calibration, add authenticated API access and telemetry that excludes images, and add unit/device tests for pixel preprocessing and real handset inference.
