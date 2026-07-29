import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import PredictionScreen from './src/screens/PredictionScreen';
import GradCamResultScreen from './src/screens/GradCamResultScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return <SafeAreaProvider><NavigationContainer><StatusBar style="dark" />
    <Stack.Navigator screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: '#FFFBF7' }, headerTintColor: '#5B2135' }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Silk Vision' }} />
      <Stack.Screen name="Prediction" component={PredictionScreen} options={{ title: 'Prediction' }} />
      <Stack.Screen name="Explanation" component={GradCamResultScreen} options={{ title: 'Grad-CAM explanation' }} />
    </Stack.Navigator>
  </NavigationContainer></SafeAreaProvider>;
}
