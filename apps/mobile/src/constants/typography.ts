import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const Typography = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: Colors.textDark },
  h2: { fontSize: 20, fontWeight: '700', color: Colors.textDark },
  h3: { fontSize: 18, fontWeight: '600', color: Colors.textDark },
  body: { fontSize: 14, fontWeight: '400', color: Colors.textDark },
  bodyGray: { fontSize: 14, fontWeight: '400', color: Colors.textGray },
  caption: { fontSize: 12, fontWeight: '400', color: Colors.textGray },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textDark },
});
