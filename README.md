# Silk Vision

An Expo React Native mobile application for offline textile classification using a staged TensorFlow Lite pipeline, paired with an opt-in FastAPI Grad-CAM explainability service.

---

## Architecture & Inference Flow

```text
Picker / Camera Image
        │
        ▼
Single-pass Skia RGB Preprocessing (1 x 224 x 224 x 3 float32 buffer)
        │
        ▼
[Stage 1: Offline TFLite] textile_gate_efficientnetb0_v1.tflite
        |
        +-- probability < 0.30 --> Rejection message; stop inference
        |
        +-- probability >= 0.30 --> Continue
        v
[Stage 2: Offline TFLite] material_classifier.tflite
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
   Silk Branch                   Cotton Branch               Low Confidence
        │                             │                             │
[Stage 3: Offline TFLite]     [Stage 3: Offline TFLite]             ▼
  silk_classifier.tflite        cotton_classifier.tflite      Uncertain Notice
        │                             │                      (assistive view)
        ▼                             ▼
Final Silk Subtype             Final Cotton Subtype
  (e.g., Banarasi Silk)          (e.g., Khadi)
        │                             │
        └──────────────┬──────────────┘
                       │
                       ▼
             Prediction Result Screen
  (Shows Textile Gate + Material + Subtype Results)
                       │
            [User taps "Generate Grad-CAM"]
                       │
                       ▼
        FastAPI Backend Service (`POST /explain`)
  (Runs Grad-CAM against matching Keras model: best_silk_stage2.keras / best_cotton_stage1.keras)
                       │
                       ▼
             PNG Heatmap & Overlay URLs
```

---

## Model Pipeline & Classes

### 1. Textile Gate (`textile_gate_efficientnetb0_v1.tflite`)
- **Input**: `1 x 224 x 224 x 3` float32 RGB pixels in the `0-255` range.
- **Output**: One sigmoid probability for TEXTILE.
- **Decision threshold**: `0.30`, configured in `src/config/labels.js` as `CONFIDENCE_THRESHOLDS.textile`.
- Images below the threshold stop here. Accepted images continue to the existing classifiers.

### 2. Material Classifier (`material_classifier.tflite`)
- **Input**: `1 x 224 x 224 x 3` (float32 RGB).
- **Output**: 2 classes `[cotton, silk]`.
- Determines whether the textile fabric is Silk or Cotton.

### 3. Silk Classifier (`silk_classifier.tflite`)
- **Execution**: Triggered when Stage 2 predicts Silk.
- **Output**: 6 classes:
  1. Banarasi Silk (`banarasi_silk`)
  2. Chanderi Silk (`chanderi_silk`)
  3. Kanjeevaram Silk (`kanjeevaram_silk`)
  4. Muga Silk (`muga_silk`)
  5. Mysore Silk (`mysore_silk`)
  6. Pochampally Silk (`pochampally_silk`)

### 4. Cotton Classifier (`cotton_classifier.tflite`)
- **Execution**: Triggered when Stage 2 predicts Cotton.
- **Output**: 5 classes:
  1. Cotton (Fabric) (`cotton_fabric`)
  2. Khadi (`khadi`)
  3. Ikat (`ikat`)
  4. Cotton Sarees (`cotton_sarees`)
  5. Handloom (`handloom`)

---

## Mobile Setup & Development

### Prerequisites
- Node.js (v18+)
- Android Studio / Xcode for native development builds (since `react-native-fast-tflite` is a native module)

```powershell
# Install dependencies
npm install

# Generate native project files if needed
npx expo prebuild --clean

# Run on Android development build
npx expo run:android
```

### Physical Device Backend Connection
To test Grad-CAM on a physical device, supply your computer's local network IP in `EXPO_PUBLIC_API_URL` prior to starting the Expo development client:

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.10:8000"
npx expo start --dev-client
```

*Note: Android Emulators automatically resolve to `http://10.0.2.2:8000`.*

---

## Grad-CAM Backend Service

The optional Grad-CAM backend (`backend/`) dynamically dispatches requests to the corresponding Keras models:
- Silk: `best_silk_stage2.keras`
- Cotton: `best_cotton_stage1.keras`

### Running the Backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Backend API Endpoints

- `GET /health`: Health check and class taxonomy status.
- `POST /explain`: Generates Grad-CAM heatmap and overlay images.
  - **Form Fields**:
    - `file`: Image file (JPEG, PNG, or WebP up to 10 MB).
    - `material`: `"silk"` or `"cotton"`.
    - `class_index`: Target class index integer.
  - **Returns**: JSON with prediction metadata, `heatmap_data_url`, and `overlay_data_url`.

---

## Operational & Privacy Principles

- **Offline-First**: All inferences (Textile Gate, Material, Silk, Cotton) are computed strictly on-device using bundled TFLite models. No network request is made during image capture or standard prediction.
- **Single-Pass Preprocessing**: Skia resizes and generates the float32 pixel buffer once per classification run.
- **Opt-In Explainability**: The image is transmitted to the backend only when the user explicitly requests a visual Grad-CAM explanation.
- **Zero Data Retention**: The backend processes the image in-memory for Grad-CAM tensor gradients and discards it immediately without saving or logging.
