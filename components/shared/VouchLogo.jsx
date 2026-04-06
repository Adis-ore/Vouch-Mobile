import { View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

export default function VouchLogo({ size = 28 }) {
  const s = size
  return (
    <View style={{ width: s, height: s }}>
      <Svg width={s} height={s} viewBox="0 0 40 40">
        {/* Background */}
        <Path
          d={`M10 0 H30 Q40 0 40 10 V30 Q40 40 30 40 H10 Q0 40 0 30 V10 Q0 0 10 0`}
          fill="#0A0F1E"
        />
        {/* Left person head */}
        <Circle cx="12" cy="9" r="3.5" fill="#E8A838" />
        {/* Right person head */}
        <Circle cx="28" cy="9" r="3.5" fill="#E8A838" />
        {/* V shape */}
        <Path
          d="M12 13.5 L20 30 L28 13.5"
          stroke="#E8A838"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Shared goal dot */}
        <Circle cx="20" cy="30" r="2" fill="#3ECFAA" />
      </Svg>
    </View>
  )
}
