# Silk Vision Grad-CAM API

FastAPI service for generating Grad-CAM heatmaps and visual overlays for both Silk and Cotton textile classifiers.

---

## Architecture & Model Support

The API dynamically routes explainability requests to the appropriate Keras model stored at the project root:
- **Silk Classifier**: `best_silk_stage2.keras` (6 classes)
- **Cotton Classifier**: `best_cotton_stage1.keras` (5 classes)
- **Material Classifier**: `best_material_stage2.keras` (2 classes)

The service extracts gradients from the final convolutional layer of the `EfficientNetB0` backbone (`top_conv`), generating normalized Class Activation Maps and blending them over the original image using OpenCV JET colormaps.

---

## Local Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## API Endpoints

### 1. Health Check
`GET /health`
```json
{
  "status": "ok",
  "supported_materials": ["cotton", "silk"],
  "silk_classes_count": 6,
  "cotton_classes_count": 5
}
```

### 2. Generate Grad-CAM Explanation
`POST /explain`

**Request**: Multipart Form Data
- `file`: Image binary (JPEG, PNG, WebP $\le$ 10 MB).
- `material`: `"silk"` or `"cotton"`.
- `class_index`: Target class index integer (`0` to `5` for silk, `0` to `4` for cotton).

**Example cURL**:
```powershell
curl.exe -X POST http://127.0.0.1:8000/explain `
  -F "file=@C:\path\to\saree.jpg;type=image/jpeg" `
  -F "material=silk" `
  -F "class_index=0"
```

**Response**:
```json
{
  "material": "silk",
  "class_index": 0,
  "class_name": "banarasi_silk",
  "label": "Banarasi Silk",
  "confidence": 0.942,
  "model_used": "silk_classifier",
  "heatmap_data_url": "data:image/png;base64,...",
  "overlay_data_url": "data:image/png;base64,..."
}
```

---

## Privacy & Security

- **In-Memory Processing**: Uploaded images are decoded in memory for feature extraction and discarded immediately. No images are written to disk or database.
- **Payload Limits**: Capped at 10 MB per file.
- **Input Validation**: Strict validation on supported MIME types, allowed material identifiers, and bounded class indices.
