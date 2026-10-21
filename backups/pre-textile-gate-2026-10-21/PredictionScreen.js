import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

export default function PredictionScreen({ navigation, route }) {
  const { asset, prediction } = route.params;

  const materialLabel = prediction?.materialLabel || (prediction?.material === 'cotton' ? 'Cotton' : 'Silk');
  const materialConfidence = typeof prediction?.materialConfidence === 'number'
    ? prediction.materialConfidence
    : 0;

  const subtypeLabel = prediction?.label || 'Unknown category';
  const subtypeConfidence = typeof prediction?.confidence === 'number'
    ? prediction.confidence
    : 0;

  const isUncertain = Boolean(prediction?.isUncertain);
  const uncertaintyReason = prediction?.uncertaintyReason;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Image source={{ uri: asset.uri }} style={styles.image} />

      <Text style={styles.caption}>Staged On-Device Result</Text>

      {/* Two-Level Classification Result Card */}
      <View style={styles.card}>
        {/* Level 1: Material */}
        <View style={styles.levelRow}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelTag}>STAGE 1 • MATERIAL</Text>
            <Text style={styles.levelConfidence}>
              {(materialConfidence * 100).toFixed(1)}%
            </Text>
          </View>
          <Text style={styles.levelTitle}>
            {materialLabel}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Level 2: Subtype */}
        <View style={styles.levelRow}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelTag}>STAGE 2 • SUBTYPE CATEGORY</Text>
            <Text style={styles.levelConfidence}>
              {(subtypeConfidence * 100).toFixed(1)}%
            </Text>
          </View>
          <Text style={styles.levelTitle}>
            {subtypeLabel}
          </Text>
        </View>
      </View>

      {/* Uncertainty Notice if confidence is below threshold */}
      {isUncertain && (
        <View style={styles.uncertainCard}>
          <Text style={styles.uncertainTitle}>Low Confidence Warning</Text>
          <Text style={styles.uncertainText}>
            {uncertaintyReason || 'The classifier is uncertain about this prediction. Please verify with a clearer, well-lit photo.'}
          </Text>
        </View>
      )}

      {/* Disclaimer Notice */}
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          This classification is an assistive machine learning prediction, not a certified guarantee of textile authenticity.
        </Text>
      </View>

      <PrimaryButton
        title="Generate Grad-CAM explanation"
        onPress={() =>
          navigation.navigate('Explanation', {
            asset,
            prediction,
          })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 22,
    backgroundColor: '#FFFBF7',
    flexGrow: 1,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#F2E9E4',
  },
  caption: {
    marginTop: 20,
    color: '#745560',
    textTransform: 'uppercase',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#EFE5DF',
    shadowColor: '#5B2135',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  levelRow: {
    paddingVertical: 6,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A2D4B',
    letterSpacing: 0.5,
  },
  levelConfidence: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8A2D4B',
  },
  levelTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#5B2135',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F2E9E4',
    marginVertical: 12,
  },
  uncertainCard: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#F57C00',
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  uncertainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 4,
  },
  uncertainText: {
    fontSize: 13,
    color: '#795548',
    lineHeight: 18,
  },
  notice: {
    backgroundColor: '#F8E8ED',
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
  },
  noticeText: {
    color: '#5B2135',
    fontSize: 13,
    lineHeight: 19,
  },
});
