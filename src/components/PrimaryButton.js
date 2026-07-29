import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

export default function PrimaryButton({ title, onPress, disabled, loading, secondary }) {
  return <Pressable disabled={disabled || loading} onPress={onPress} style={[styles.button, secondary && styles.secondary, (disabled || loading) && styles.disabled]}>
    {loading ? <ActivityIndicator color={secondary ? '#5B2135' : '#fff'} /> : <Text style={[styles.text, secondary && styles.secondaryText]}>{title}</Text>}
  </Pressable>;
}
const styles = StyleSheet.create({ button: { backgroundColor: '#8A2D4B', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 }, text: { color: '#fff', fontWeight: '700', fontSize: 16 }, secondary: { backgroundColor: '#F8E8ED', borderWidth: 1, borderColor: '#8A2D4B' }, secondaryText: { color: '#5B2135' }, disabled: { opacity: 0.55 } });
