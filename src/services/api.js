import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';

// Use the LAN IP of the computer running FastAPI when testing on a physical device.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.6:8000';
const client = axios.create({ baseURL: API_URL, timeout: 30000 });

export async function generateExplanation(asset, classIndex) {
  const network = await NetInfo.fetch();
  if (!network.isConnected || !network.isInternetReachable) {
    throw new Error('No internet connection. Grad-CAM explanations require the server.');
  }
  const body = new FormData();
  body.append('file', { uri: asset.uri, name: asset.fileName || 'silk-image.jpg', type: asset.mimeType || 'image/jpeg' });
  body.append('class_index', String(classIndex));
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try { return (await client.post('/explain', body, { headers: { 'Content-Type': 'multipart/form-data' } })).data; }
    catch (error) { lastError = error; if (!error.response || error.response.status >= 500) continue; break; }
  }
  throw lastError;
}
