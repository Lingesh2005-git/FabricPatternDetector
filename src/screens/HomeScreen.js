import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import PrimaryButton from '../components/PrimaryButton';
import { classifyImage, loadAllModels } from '../services/tflite';

export default function HomeScreen({ navigation }) {
  const [asset, setAsset] = useState();
  const [loading, setLoading] = useState(false);

  const choose = async (camera) => {
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          return Alert.alert(
            'Camera permission required',
            'Allow camera access to capture a fabric image.'
          );
        }
      }
      const pickerFn = camera
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

      const result = await pickerFn({
        mediaTypes: ['images'],
        quality: 0.9,
        base64: true,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAsset(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Image selection error', err.message || 'Could not load the selected image.');
    }
  };

  const predict = async () => {
    if (!asset) return;
    try {
      setLoading(true);
      await loadAllModels();
      const prediction = await classifyImage(asset.uri, asset.base64);
      navigation.navigate('Prediction', { asset, prediction });
    } catch (e) {
      Alert.alert('Inference failed', e.message || 'Unable to classify this image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>Silk & Cotton Classifier</Text>
      <Text style={styles.copy}>
        Silk Vision identifies whether a fabric is silk or cotton, then predicts its specific textile category. Classification happens entirely offline on this device.
      </Text>

      {asset ? (
        <Image source={{ uri: asset.uri }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No image selected</Text>
        </View>
      )}

      <PrimaryButton
        title="Choose from gallery"
        onPress={() => choose(false)}
      />
      <PrimaryButton
        title="Take a photo"
        onPress={() => choose(true)}
        secondary
      />
      <PrimaryButton
        title="Run offline prediction"
        onPress={predict}
        disabled={!asset}
        loading={loading}
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#5B2135',
    marginTop: 10,
  },
  copy: {
    color: '#6A5660',
    fontSize: 16,
    lineHeight: 23,
    marginVertical: 12,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    marginVertical: 12,
    backgroundColor: '#F2E9E4',
  },
  placeholder: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: 16,
    marginVertical: 12,
    backgroundColor: '#F7EFEA',
    borderWidth: 1.5,
    borderColor: '#E8DCD5',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#9C858E',
    fontSize: 15,
    fontWeight: '500',
  },
});
