import { View, Text } from 'react-native'
import { Image } from 'expo-image'
import { useTheme } from '../../context/ThemeContext'
import { getAvatarUrl } from '../../data/avatars'

const INITIALS_COLORS = ['#E8A838', '#3ECFAA', '#5B9CF6', '#E85D4A', '#9B72CF']

// avatarSeed  — DiceBear seed string (e.g. 'Zara')
// avatarBg    — background colour for the DiceBear circle
// uri         — uploaded photo URI (takes priority over seed)
// name        — used for initials fallback
export default function Avatar({ name, uri, avatarSeed, avatarBg, size = 40, style }) {
  const { colors } = useTheme()

  const containerStyle = [
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    style,
  ]

  // Priority 1 — uploaded photo
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    )
  }

  // Priority 2 — DiceBear illustrated avatar
  if (avatarSeed) {
    return (
      <View style={[containerStyle, { backgroundColor: avatarBg || '#1A1D25' }]}>
        <Image
          source={{ uri: getAvatarUrl(avatarSeed) }}
          style={{ width: size * 0.92, height: size * 0.92 }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>
    )
  }

  // Priority 3 — initials fallback
  const initials = name
    ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  const colorIndex = name ? name.charCodeAt(0) % INITIALS_COLORS.length : 0

  return (
    <View style={[containerStyle, {
      backgroundColor: INITIALS_COLORS[colorIndex] + '30',
      borderWidth: 1,
      borderColor: colors.border,
    }]}>
      <Text style={{ fontSize: size * 0.35, color: INITIALS_COLORS[colorIndex], fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  )
}
