# Silk Vision Grad-CAM API

## Run locally

Create and activate a virtual environment, then install dependencies:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API loads `../final_silk_model_v2_unknown.keras` exactly once at startup. Keep that model file at the project root.

## Test

```powershell
curl.exe -X POST http://127.0.0.1:8000/predict -F "file=@C:\path\to\saree.jpg;type=image/jpeg"
curl.exe -X POST http://127.0.0.1:8000/explain -F "file=@C:\path\to\saree.jpg;type=image/jpeg" -F "class_index=0"
```

`/explain` returns `heatmap_data_url` and `overlay_data_url` as PNG data URLs, ready for React Native's `Image` component. Interactive API documentation is at `/docs`.

## Deployment

Deploy behind TLS and an authenticated API gateway. Set specific CORS origins in `app/main.py`, apply a request-size limit at the proxy, and run one TensorFlow worker per model copy. Do not log uploaded images. This model provides visual classification assistance only; it is not proof of textile authenticity.
