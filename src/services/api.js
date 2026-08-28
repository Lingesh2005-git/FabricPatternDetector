import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';

// Use the LAN IP of the computer running FastAPI when testing on a physical device.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.6:8000';
const client = axios.create({ baseURL: API_URL, timeout: 30000 });

export async function generateExplanation(asset, material, classIndex) {
  const network = await NetInfo.fetch();
  if (!network.isConnected || !network.isInternetReachable) {
    throw new Error('No internet connection. Grad-CAM explanations require connection to the backend server.');
  }

  const body = new FormData();
  body.append('file', {
    uri: asset.uri,
    name: asset.fileName || 'fabric-image.jpg',
    type: asset.mimeType || 'image/jpeg',
  });
  body.append('material', material || 'silk');
  body.append('class_index', String(classIndex ?? 0));

  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await client.post('/explain', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      lastError = error;
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      if (!error.response || error.response.status >= 500) {
        continue;
      }
      break;
    }
  }

  const message = lastError.response?.data?.detail || lastError.message || 'Server error while generating Grad-CAM explanation.';
  throw new Error(message);
}
