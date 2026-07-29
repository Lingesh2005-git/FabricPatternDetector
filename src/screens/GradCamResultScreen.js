import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { generateExplanation } from '../services/api';

export default function GradCamResultScreen({ route }) {
  const { asset, prediction } = route.params; const [result, setResult] = useState(); const [loading, setLoading] = useState(false);
  const explain = async () => { try { setLoading(true); setResult(await generateExplanation(asset, prediction.classIndex)); } catch (e) { Alert.alert('Explanation unavailable', e.message || 'Check your connection and that the Grad-CAM server is running. You can retry safely.'); } finally { setLoading(false); } };
  return <ScrollView contentContainerStyle={styles.page}><Text style={styles.copy}>Grad-CAM highlights the visual regions that most influenced the selected class.</Text><PrimaryButton title="Generate explanation" onPress={explain} loading={loading} />
    {result && <View style={styles.results}><Image source={{ uri: asset.uri }} style={styles.image} /><Text style={styles.heading}>Original image</Text><Image source={{ uri: result.heatmap_data_url }} style={styles.image} /><Text style={styles.heading}>Heatmap</Text><Image source={{ uri: result.overlay_data_url }} style={styles.image} /><Text style={styles.heading}>Overlay</Text></View>}
  </ScrollView>;
}
const styles = StyleSheet.create({ page: { padding: 22, backgroundColor: '#FFFBF7', flexGrow: 1 }, copy: { color: '#6A5660', lineHeight: 22 }, results: { marginTop: 24 }, image: { width: '100%', aspectRatio: 1, borderRadius: 14, marginTop: 16 }, heading: { color: '#5B2135', fontWeight: '700', marginTop: 8 } });
