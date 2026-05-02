import { View, Text, StyleSheet } from 'react-native'

export default function VouchLogo({ size = 28 }) {
  const markSize = size + 12
  return (
    <View style={styles.row}>
      <View style={[styles.mark, { width: markSize, height: markSize, borderRadius: markSize * 0.24 }]}>
        <Text style={[styles.v, { fontSize: size }]}>V</Text>
      </View>
      <Text style={[styles.name, { fontSize: size }]}>ouch</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { backgroundColor: '#E8A838', alignItems: 'center', justifyContent: 'center' },
  v: { color: '#0A0F1E', fontFamily: 'Fraunces_700Bold' },
  name: { color: '#F5F0E8', fontFamily: 'Fraunces_700Bold' },
})
