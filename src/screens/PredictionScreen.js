import { Image, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

export default function PredictionScreen({ navigation, route }) {
const { asset, prediction } = route.params;

const displayLabel =
prediction?.label ||
'Prediction unavailable';

const confidence =
typeof prediction?.confidence === 'number'
? prediction.confidence
: 0;

return ( <View style={styles.page}>
<Image
source={{ uri: asset.uri }}
style={styles.image}
/>

  <Text style={styles.caption}>
    On-device result
  </Text>

  <Text style={styles.label}>
    {displayLabel}
  </Text>

  <Text style={styles.confidence}>
    {(confidence * 100).toFixed(1)}% confidence
  </Text>

  <View style={styles.notice}>
    <Text style={styles.noticeText}>
      This classification is an assistive result, not a certificate of
      authenticity.
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
</View>

);
}

const styles = StyleSheet.create({
page: {
flex: 1,
padding: 22,
backgroundColor: '#FFFBF7',
},

image: {
width: '100%',
aspectRatio: 1,
borderRadius: 16,
},

caption: {
marginTop: 22,
color: '#745560',
textTransform: 'uppercase',
fontWeight: '700',
fontSize: 12,
},

label: {
marginTop: 5,
color: '#5B2135',
fontSize: 30,
fontWeight: '800',
},

confidence: {
color: '#8A2D4B',
fontSize: 19,
marginTop: 6,
},

notice: {
backgroundColor: '#F8E8ED',
marginTop: 22,
padding: 14,
borderRadius: 12,
},

noticeText: {
color: '#5B2135',
lineHeight: 20,
},
});
