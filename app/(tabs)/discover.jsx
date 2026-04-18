import { useState, useMemo, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { CATEGORIES } from '../../data/dummy'
import { apiGetDiscoverJourneys } from '../../utils/api'
import { getPrefetchedJourneys } from '../../utils/journeyPrefetch'
import { logger } from '../../utils/logger'
import JourneyCard from '../../components/journey/JourneyCard'
import CategoryChip from '../../components/shared/CategoryChip'
import EmptyState from '../../components/shared/EmptyState'

const ALL_CATS = ['All', ...CATEGORIES.map(c => typeof c === 'string' ? c : c.label)]

export default function Discover() {
  const { colors } = useTheme()
  const { user } = useUser()
  const router = useRouter()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [scope, setScope] = useState('nearby')
  const [sortTab, setSortTab] = useState('trending')
  const [journeys, setJourneys] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const cached = getPrefetchedJourneys(scope)
    if (cached) {
      setJourneys(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }
    try {
      const res = await apiGetDiscoverJourneys({ country_only: scope === 'nearby' })
      setJourneys(res.journeys || [])
    } catch (err) {
      logger.error('[DISCOVER]', `Load failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(useCallback(() => { load() }, [scope]))

  const filtered = useMemo(() => {
    let list = [...journeys]
    if (category !== 'All') list = list.filter(j => j.category === category)
    if (search.trim()) list = list.filter(j => j.title.toLowerCase().includes(search.toLowerCase()))

    if (sortTab === 'trending') {
      list = list.sort((a, b) =>
        (b.current_participants / b.max_participants) - (a.current_participants / a.max_participants)
      )
    } else if (sortTab === 'popular') {
      list = list.sort((a, b) =>
        b.current_participants !== a.current_participants
          ? b.current_participants - a.current_participants
          : (b.stake_amount || 0) - (a.stake_amount || 0)
      )
    } else if (sortTab === 'latest') {
      list = list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    return list
  }, [search, category, sortTab, journeys])

  const openJourney = (journey) => {
    router.push(`/journey/preview?id=${journey.id}`)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <JourneyCard journey={item} index={index} onJoin={() => openJourney(item)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState title="No journeys found" body="Try different filters or create your own journey." />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.screenTitle}>Discover</Text>
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
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
            {/* Sort tabs */}
            <View style={styles.sortRow}>
              {[
                { key: 'trending', label: 'Trending', icon: 'trending-up-outline' },
                { key: 'popular', label: 'Popular', icon: 'flame-outline' },
                { key: 'latest', label: 'Latest', icon: 'time-outline' },
                { key: 'all', label: 'All', icon: 'grid-outline' },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.sortTab, sortTab === tab.key && { backgroundColor: colors.accent + '18', borderColor: colors.accent }]}
                  onPress={() => setSortTab(tab.key)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={tab.icon} size={13} color={sortTab === tab.key ? colors.accent : colors.textMuted} />
                  <Text style={[styles.sortTabText, { color: sortTab === tab.key ? colors.accent : colors.textMuted }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Scope toggle */}
            <View style={styles.toggle}>
              {['nearby', 'everywhere'].map(s => (
                <TouchableOpacity key={s} style={[styles.toggleBtn, scope === s && { backgroundColor: colors.accent }]} onPress={() => setScope(s)} activeOpacity={0.75}>
                  <Text style={[styles.toggleText, { color: scope === s ? colors.bg : colors.textMuted }]}>
                    {s === 'nearby' ? 'Nearby' : 'Everywhere'}
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
    searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15 },
    sortRow: { flexDirection: 'row', gap: 8 },
    sortTab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt },
    sortTabText: { fontFamily: fonts.bodyMedium, fontSize: 12 },
    toggle: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
    toggleBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
    toggleText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  })
}
