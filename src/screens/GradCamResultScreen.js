import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { generateExplanation } from '../services/api';

export default function GradCamResultScreen({ route }) {
  const { asset, prediction } = route.params;
  const [result, setResult] = useState();
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    try {
      setLoading(true);
      const data = await generateExplanation(
        asset,
        prediction.material,
        prediction.classIndex
      );
      setResult(data);
    } catch (e) {
      Alert.alert(
        'Explanation unavailable',
        e.message || 'Check your connection and ensure the Grad-CAM backend server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const materialTitle = prediction?.materialLabel || (prediction?.material === 'cotton' ? 'Cotton' : 'Silk');
  const subtypeTitle = prediction?.label || 'Target category';

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>Visual Heatmap (Grad-CAM)</Text>
      <Text style={styles.copy}>
        Grad-CAM analyzes which texture, weave, and pattern regions in the image most strongly influenced the classification for <Text style={styles.highlight}>{subtypeTitle}</Text> ({materialTitle}).
      </Text>

      {!result && (
        <PrimaryButton
          title="Generate explanation"
          onPress={explain}
          loading={loading}
        />
      )}

      {result && (
        <View style={styles.results}>
          <Text style={styles.heading}>Original image</Text>
          <Image source={{ uri: asset.uri }} style={styles.image} />

          <Text style={styles.heading}>Grad-CAM Heatmap</Text>
          <Image source={{ uri: result.heatmap_data_url }} style={styles.image} />

          <Text style={styles.heading}>Heatmap Overlay</Text>
          <Image source={{ uri: result.overlay_data_url }} style={styles.image} />

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Analysis Summary</Text>
            <Text style={styles.infoText}>
              Model: {result.model_used || prediction.modelUsed}{'\n'}
              Target: {result.label} ({result.class_name}){'\n'}
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </Text>
          </View>

          <PrimaryButton
            title="Re-generate explanation"
            onPress={explain}
            loading={loading}
            secondary
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 22,
    backgroundColor: '#FFFBF7',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#5B2135',
    marginBottom: 8,
  },
  copy: {
    color: '#6A5660',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  highlight: {
    fontWeight: '700',
    color: '#5B2135',
  },
  results: {
    marginTop: 12,
  },
  heading: {
    color: '#5B2135',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#F2E9E4',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#EFE5DF',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B2135',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#6A5660',
    lineHeight: 18,
  },
});
