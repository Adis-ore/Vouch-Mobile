import { Tabs } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

function TabIcon({ focused, children, colors }) {
  return (
    <View style={styles.iconWrap}>
      {children}
      {focused && <View style={[styles.dot, { backgroundColor: colors.accent }]} />}
    </View>
  )
}

function HomeIcon({ color }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
      <View style={{ width: 14, height: 12, borderWidth: 1.8, borderColor: color, borderRadius: 2, marginTop: 4 }} />
      <View style={{ width: 18, height: 10, borderLeftWidth: 1.8, borderRightWidth: 1.8, borderTopWidth: 1.8, borderColor: color, borderTopLeftRadius: 3, borderTopRightRadius: 3, position: 'absolute', top: 0 }} />
    </View>
  )
}

function CompassIcon({ color }) {
  return (
    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.8, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 5, height: 5, backgroundColor: color, borderRadius: 2.5 }} />
    </View>
  )
}

function FlagIcon({ color }) {
  return (
    <View style={{ width: 24, height: 24, justifyContent: 'center' }}>
      <View style={{ width: 1.8, height: 20, backgroundColor: color, position: 'absolute', left: 5 }} />
      <View style={{ width: 12, height: 8, backgroundColor: color, borderRadius: 1, position: 'absolute', left: 7, top: 2 }} />
    </View>
  )
}

function PersonIcon({ color }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1.8, borderColor: color }} />
      <View style={{ width: 18, height: 8, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderWidth: 1.8, borderBottomWidth: 0, borderColor: color }} />
    </View>
  )
}

export default function TabsLayout() {
  const { colors } = useTheme()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} colors={colors}><HomeIcon color={color} /></TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} colors={colors}><CompassIcon color={color} /></TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="journeys"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} colors={colors}><FlagIcon color={color} /></TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} colors={colors}><PersonIcon color={color} /></TabIcon>
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 2 },
})
