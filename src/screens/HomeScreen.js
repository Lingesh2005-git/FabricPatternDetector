import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import PrimaryButton from '../components/PrimaryButton';
import { classifyImage, loadModel } from '../services/tflite';

export default function HomeScreen({ navigation }) {
  const [asset, setAsset] = useState(); const [loading, setLoading] = useState(false);
  const choose = async (camera) => {
    if (camera) { const permission = await ImagePicker.requestCameraPermissionsAsync(); if (!permission.granted) return Alert.alert('Camera permission required', 'Allow camera access to capture a saree image.'); }
    const result = await (camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({ mediaTypes: ['images'], quality: 0.9, base64: true, allowsEditing: false });
    if (!result.canceled) setAsset(result.assets[0]);
  };
  const predict = async () => { try { setLoading(true); await loadModel(); const prediction = await classifyImage(asset.uri, asset.base64); navigation.navigate('Prediction', { asset, prediction }); } catch (e) { Alert.alert('Inference failed', e.message || 'Unable to classify this image.'); } finally { setLoading(false); } };
  return <View style={styles.page}><Text style={styles.title}>Offline silk classifier</Text><Text style={styles.copy}>Select a clear image of a silk saree. Classification happens entirely on this device.</Text>
    {asset && <Image source={{ uri: asset.uri }} style={styles.preview} />}
    <PrimaryButton title="Choose from gallery" onPress={() => choose(false)} /><PrimaryButton title="Take a photo" onPress={() => choose(true)} secondary />
    <PrimaryButton title="Run offline prediction" onPress={predict} disabled={!asset} loading={loading} />
  </View>;
}
const styles = StyleSheet.create({ page: { flex: 1, padding: 22, backgroundColor: '#FFFBF7' }, title: { fontSize: 28, fontWeight: '800', color: '#5B2135', marginTop: 20 }, copy: { color: '#6A5660', fontSize: 16, lineHeight: 23, marginVertical: 12 }, preview: { width: '100%', aspectRatio: 1, borderRadius: 16, marginVertical: 12, backgroundColor: '#F2E9E4' } });
