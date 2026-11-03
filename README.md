# FabricIQ

An Expo React Native mobile application for intelligent textile classification using a multi-stage, offline TensorFlow Lite inference pipeline, with an optional FastAPI-based Grad-CAM explainability service.

## Project Overview

FabricIQ is designed to identify textile materials and classify their subtypes through a staged AI-powered classification system.

The application follows a hierarchical classification approach:

1. **Textile Classification:** Determines whether the uploaded or captured image contains a textile or a non-textile object.
2. **Material Classification:** If the image is identified as a textile, determines whether the material is Cotton or Silk.
3. **Subtype Classification:** Depending on the material prediction, the application activates the corresponding Silk or Cotton classifier to identify the specific textile category.
4. **Prediction Results:** Displays the classification results, including the textile verification, material prediction, and corresponding subtype.

All standard classification stages run locally on the device using TensorFlow Lite models, allowing FabricIQ to operate without an internet connection.

An optional Grad-CAM explainability feature is also implemented as a separate FastAPI backend service. It is currently kept inactive in the deployed application while its deployment and integration are being worked on.

---

## Architecture & Inference Flow

```text
             Picker / Camera Image
                       |
                       v
          Single-Pass Skia Preprocessing
             (1 x 224 x 224 x 3)
                       |
                       v
       [Stage 1: Textile Classifier]
       textile_gate_efficientnetb0_v1.tflite
                       |
              Is it a textile?
                       |
              +--------+--------+
              |                 |
           NO / <0.30         YES / >=0.30
              |                 |
              v                 v
       Rejection Message   [Stage 2: Material
         Stop Pipeline       Classifier]
                            material_classifier.tflite
                                  |
                       +----------+----------+
                       |                     |
                       v                     v
                   SILK                   COTTON
                       |                     |
                       v                     v
              [Stage 3: Silk]       [Stage 3: Cotton]
              silk_classifier       cotton_classifier
                  .tflite                .tflite
                       |                     |
                       v                     v
                6 Silk Classes          5 Cotton Classes
                       |                     |
                       +----------+----------+
                                  |
                                  v
                         Prediction Result
                                  |
                   +--------------+--------------+
                   |                             |
                   v                             v
             Display Results             Optional Grad-CAM
                                             (Opt-in)
                                                  |
                                                  v
                                        FastAPI Backend
                                           POST /explain
                                                  |
                                                  v
                                         Heatmap & Overlay
```

---

## Model Pipeline & Classification Details

### 1. Textile Classifier – Initial Verification

**Model:** `textile_gate_efficientnetb0_v1.tflite`

This is the initial classification stage of FabricIQ.

Before attempting to identify the material or subtype, the application checks whether the input image contains a textile.

- **Input:** `1 x 224 x 224 x 3` float32 RGB pixels.
- **Output:** One sigmoid probability representing the likelihood that the image contains a textile.
- **Decision threshold:** `0.30`.
- **Configuration:** `src/config/labels.js`, under `CONFIDENCE_THRESHOLDS.textile`.

**Decision logic:**
- Probability below 0.30: The image is rejected as a non-textile or insufficiently textile-like image, and the classification pipeline stops.
- Probability equal to or above 0.30: The image is accepted and passed to the Material Classifier.

This stage helps prevent irrelevant images from proceeding through the textile classification pipeline.

### 2. Material Classifier – Silk or Cotton

**Model:** `material_classifier.tflite`

Once an image passes the Textile Classifier, the Material Classifier determines the material category.

- **Input:** `1 x 224 x 224 x 3` float32 RGB pixels.
- **Output:** Two classes:
  - Cotton (`cotton`)
  - Silk (`silk`)

Based on the predicted material, the application selects the corresponding subtype classifier.

### 3. Silk Subtype Classifier

**Model:** `silk_classifier.tflite`

This model is activated when the Material Classifier predicts Silk.

It identifies the specific silk variety among six categories:

1. Banarasi Silk (`banarasi_silk`)
2. Chanderi Silk (`chanderi_silk`)
3. Kanjeevaram Silk (`kanjeevaram_silk`)
4. Muga Silk (`muga_silk`)
5. Mysore Silk (`mysore_silk`)
6. Pochampally Silk (`pochampally_silk`)

The predicted silk subtype is displayed on the Prediction Result Screen.

### 4. Cotton Subtype Classifier

**Model:** `cotton_classifier.tflite`

This model is activated when the Material Classifier predicts Cotton.

It identifies the specific cotton category among five classes:

1. Cotton Fabric (`cotton_fabric`)
2. Khadi (`khadi`)
3. Ikat (`ikat`)
4. Cotton Sarees (`cotton_sarees`)
5. Handloom (`handloom`)

The predicted cotton subtype is displayed on the Prediction Result Screen.

---

## Image Processing & Inference

### Single-Pass Preprocessing

FabricIQ uses Skia for image preprocessing.

The image is resized and converted into a float32 RGB pixel buffer with dimensions:

`1 x 224 x 224 x 3`

The same preprocessed buffer is reused across the classification stages, avoiding unnecessary repeated image preprocessing.

### Offline Inference

The following models are executed directly on the mobile device:

- Textile Classifier
- Material Classifier
- Silk Subtype Classifier
- Cotton Subtype Classifier

The application uses TensorFlow Lite through `react-native-fast-tflite`.

No backend request is required for normal image classification.

---

## Application Development & Deployment

FabricIQ is developed using Expo and React Native.

### Technologies Used

- React Native
- Expo
- TensorFlow Lite
- `react-native-fast-tflite`
- React Native Skia
- FastAPI (optional Grad-CAM backend)
- Python and TensorFlow/Keras

### Mobile Development Setup

**Prerequisites:**
- Node.js (v18+)
- Android Studio for Android native development
- Xcode for iOS native development
- Expo development build

Install dependencies:

```powershell
npm install
```

Generate native project files when required:

```powershell
npx expo prebuild --clean
```

Run on Android:

```powershell
npx expo run:android
```

### Android Deployment

The Android application has been successfully built using Expo Application Services (EAS).

The project also uses GitHub for source-code management and release distribution.

Repository:

https://github.com/Lingesh2005-git/FabricPatternDetector

The application is being developed with Android deployment as the current priority, with the possibility of iOS support in the future.

---

## Optional Grad-CAM Explainability Service

FabricIQ includes an additional Grad-CAM implementation intended to provide visual explanations of model predictions.

Grad-CAM generates a heatmap highlighting image regions that contribute to a model's prediction.

Unlike standard classification, which runs entirely offline, Grad-CAM is designed as an opt-in feature that uses a separate FastAPI backend.

### Backend Models

The backend dynamically selects the corresponding Keras model:

- Silk: `best_silk_stage2.keras`
- Cotton: `best_cotton_stage1.keras`

### Backend API

**Health Check:**

`GET /health`

Checks backend availability and class taxonomy.

**Grad-CAM Generation:**

`POST /explain`

Accepts:
- `file`: Input image (JPEG, PNG, or WebP, up to 10 MB).
- `material`: `silk` or `cotton`.
- `class_index`: Target class index.

Returns:
- Prediction metadata.
- `heatmap_data_url`.
- `overlay_data_url`.

### Backend Execution

```powershell
cd backend

python -m venv .venv

.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Physical Device Connection

For local development and testing:

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.10:8000"

npx expo start --dev-client
```

Replace the IP address with the development computer's local network IP.

For Android emulators, use:

`http://10.0.2.2:8000`

**Current status:** The Grad-CAM implementation and its supporting files are preserved in the project repository. The feature is currently commented out of the active application because the initial backend deployment encountered memory limitations when loading the Keras models. Further backend deployment and integration work remains.

---

## Operational & Privacy Principles

### Offline-First Classification

All four classification models run locally on the mobile device. Internet connectivity is not required for the standard prediction workflow.

### Hierarchical Classification

The application follows a sequential classification process:

Textile Verification → Material Identification → Subtype Classification.

This ensures that only images accepted by the initial Textile Classifier proceed to the subsequent classification stages.

### Single-Pass Image Processing

Skia preprocessing generates one RGB float32 image buffer, which is reused by the classification pipeline.

### Opt-In Explainability

The image is intended to be transmitted to the Grad-CAM backend only when the user explicitly requests an explanation.

### Data Handling

The intended backend design processes images in memory without retaining uploaded images. This is a design objective that should be verified against actual logging, storage and deployment configurations before claiming zero data retention.

---

## Current Project Status & Completed Work

The following summarizes the implementation completed so far:

| Component | Status |
|---|---|
| Expo React Native application | Implemented |
| Textile Classifier | Implemented |
| Material Classifier (Silk/Cotton) | Implemented |
| Silk Subtype Classifier (6 classes) | Implemented |
| Cotton Subtype Classifier (5 classes) | Implemented |
| TensorFlow Lite model integration | Implemented |
| On-device inference pipeline | Implemented |
| Skia image preprocessing | Implemented |
| Prediction result screen | Implemented |
| Android EAS build | Successfully built |
| GitHub repository and source management | Set up |
| Grad-CAM algorithm and backend implementation | Preserved |
| Grad-CAM production deployment and integration | Pending |

## Future Enhancements

1. Complete Grad-CAM backend deployment.
2. Integrate the optional Grad-CAM feature into the active mobile application.
3. Investigate on-device Grad-CAM using TensorFlow Lite to reduce backend dependency.
4. Improve confidence handling and rejection mechanisms across classification stages.
5. Complete iOS development and deployment.
6. Improve application performance and user experience.

---

**FabricIQ – An Offline-First AI-Powered Textile Classification and Analysis Application.**
