import { useState, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { DISCOVER_JOURNEYS, CATEGORIES } from '../../data/dummy'
import JourneyCard from '../../components/journey/JourneyCard'
import CategoryChip from '../../components/shared/CategoryChip'
import EmptyState from '../../components/shared/EmptyState'

const ALL_CATS = ['All', ...CATEGORIES]

export default function Discover() {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [scope, setScope] = useState('nearby')

  const filtered = useMemo(() => {
    let list = DISCOVER_JOURNEYS
    if (category !== 'All') list = list.filter(j => j.category === category)
    if (scope === 'nearby') list = list.filter(j => j.country === 'Nigeria')
    if (search.trim()) list = list.filter(j => j.title.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [search, category, scope])

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => <JourneyCard journey={item} index={index} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState title="No journeys found" body="Try different filters or create your own journey." />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.screenTitle}>Discover</Text>
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search journeys..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <FlatList
              horizontal
              data={ALL_CATS}
              keyExtractor={c => c}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              renderItem={({ item }) => (
                <CategoryChip label={item} selected={category === item} onPress={() => setCategory(item)} size="sm" />
              )}
            />
            <View style={styles.toggle}>
              {['nearby', 'everywhere'].map(s => (
                <TouchableOpacity key={s} style={[styles.toggleBtn, scope === s && styles.toggleActive]} onPress={() => setScope(s)} activeOpacity={0.75}>
                  <Text style={[styles.toggleText, scope === s && styles.toggleTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing.lg, paddingBottom: spacing.xxl },
    header: { gap: spacing.md, marginBottom: spacing.md },
    screenTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.textPrimary },
    searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 46, gap: 8 },
    searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.textPrimary },
    toggle: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
    toggleBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
    toggleActive: { backgroundColor: colors.accent },
    toggleText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
    toggleTextActive: { color: colors.bg },
  })
}
