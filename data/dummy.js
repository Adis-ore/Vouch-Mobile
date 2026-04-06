export const CURRENT_USER = {
  id: 'user-1',
  full_name: 'Adis Afolabi',
  username: 'adisafolabi',
  avatar_url: null,
  bio: 'Building things and learning fast.',
  country: 'Nigeria',
  region: 'Oyo',
  location: 'Ibadan, Nigeria',
  email: 'adis@example.com',
  phone: '+234 801 234 5678',
  streak_total: 47,
  current_streak: 14,
  longest_streak: 21,
  total_journeys: 7,
  journeys_completed: 4,
  completed_journeys: 4,
  reputation_score: 94,
  streak_mode: 'strict',
  notification_checkins: true,
  notification_milestones: true,
  notification_messages: false,
  notification_reminders: true,
}

export const BADGES = [
  { key: 'first_step',    name: 'First Step',     icon: 'footsteps-outline',      earned: true  },
  { key: 'streak_7',      name: 'On Fire',         icon: 'flame',                  earned: true  },
  { key: 'streak_14',     name: 'Two Weeks',       icon: 'barbell-outline',        earned: true  },
  { key: 'streak_30',     name: 'Unstoppable',     icon: 'flash-outline',          earned: false },
  { key: 'committed',     name: 'Committed',       icon: 'checkmark-circle-outline', earned: true  },
  { key: 'proof_master',  name: 'Proof Master',    icon: 'camera-outline',         earned: false },
  { key: 'trusted',       name: 'Trusted',         icon: 'shield-checkmark-outline', earned: true  },
  { key: 'veteran',       name: 'Veteran',         icon: 'ribbon-outline',         earned: false },
  { key: 'stake_survivor',name: 'Stake Survivor',  icon: 'wallet-outline',         earned: false },
]

export const ACTIVE_JOURNEY = {
  id: 'journey-1',
  title: 'Learn Python in 30 Days',
  description: 'From complete beginner to building real projects. Daily 1-hour sessions covering syntax, functions, OOP, and a final project.',
  category: 'Learning',
  cover_image_url: null,
  duration_days: 30,
  start_date: '2025-01-01',
  end_date: '2025-01-31',
  days_elapsed: 14,
  progress_percent: 47,
  max_participants: 4,
  current_participants: 4,
  status: 'active',
  stake_amount: 1000,
  stake_currency: 'NGN',
  country: 'Nigeria',
  region: 'Lagos',
  creator_id: 'user-2',
}

export const JOURNEY_MEMBERS = [
  { user_id: 'user-1', full_name: 'Adis Afolabi',    avatar_url: null, current_streak: 14, total_checkins: 14, role: 'member'  },
  { user_id: 'user-2', full_name: 'Tunde Olatunji',  avatar_url: null, current_streak: 12, total_checkins: 13, role: 'creator' },
  { user_id: 'user-3', full_name: 'Chioma Nwosu',    avatar_url: null, current_streak: 14, total_checkins: 14, role: 'member'  },
  { user_id: 'user-4', full_name: 'Emmanuel Bello',  avatar_url: null, current_streak: 9,  total_checkins: 11, role: 'member'  },
]

export const MILESTONES = [
  { id: 'm-1', week_number: 1, title: 'Python Basics',     description: 'Variables, data types, loops, functions, conditionals',          is_unlocked: true,  both_reflected: true  },
  { id: 'm-2', week_number: 2, title: 'Data Structures',   description: 'Lists, dicts, tuples, sets. File I/O. Error handling.',           is_unlocked: true,  both_reflected: false },
  { id: 'm-3', week_number: 3, title: 'OOP & Modules',     description: 'Classes, inheritance, standard library, pip packages',           is_unlocked: false, both_reflected: false },
  { id: 'm-4', week_number: 4, title: 'Final Project',     description: 'Build a complete Python project and present it',                 is_unlocked: false, both_reflected: false },
]

export const CHECKINS = [
  {
    id: 'ci-1', user_id: 'user-1',
    checkin_date: '2025-01-14',
    note: 'Finished the chapter on list comprehensions. Actually made sense once I saw the pattern. Built a small script that filters even numbers from a list.',
    proof_url: null, proof_type: null,
    next_step: 'Dictionary comprehensions tomorrow',
    verified_count: 2, flag_count: 0,
    user: { full_name: 'Adis Afolabi', avatar_url: null },
  },
  {
    id: 'ci-2', user_id: 'user-2',
    checkin_date: '2025-01-14',
    note: "Worked through nested loops and practiced with 2D arrays. Also reviewed yesterday's material for 20 mins. Feeling solid on week 2 content.",
    proof_url: 'https://placehold.co/400x300', proof_type: 'image',
    next_step: 'Start file I/O section',
    verified_count: 3, flag_count: 0,
    user: { full_name: 'Tunde Olatunji', avatar_url: null },
  },
  {
    id: 'ci-3', user_id: 'user-3',
    checkin_date: '2025-01-14',
    note: 'Did 90 mins today to catch up. Covered all of error handling. try/except/finally now makes complete sense. Added notes to my Python notebook.',
    proof_url: null, proof_type: null,
    next_step: 'Module system',
    verified_count: 2, flag_count: 0,
    user: { full_name: 'Chioma Nwosu', avatar_url: null },
  },
  {
    id: 'ci-4', user_id: 'user-1',
    checkin_date: '2025-01-13',
    note: 'Covered dictionary methods today. .get(), .items(), .keys(), .values() — all practiced with exercises from Python.org.',
    proof_url: null, proof_type: null,
    next_step: 'List comprehensions',
    verified_count: 3, flag_count: 0,
    user: { full_name: 'Adis Afolabi', avatar_url: null },
  },
]

export const MESSAGES = [
  { id: 'msg-1', sender_id: 'user-2', content: "Good morning everyone, let's smash week 2", type: 'text', created_at: '2025-01-14T07:02:00Z', user: { full_name: 'Tunde Olatunji' } },
  { id: 'msg-2', sender_id: 'user-1', content: 'Ready! I struggled with list comprehensions yesterday but I finally get it', type: 'text', created_at: '2025-01-14T07:15:00Z', user: { full_name: 'Adis Afolabi' } },
  { id: 'msg-3', sender_id: null,     content: 'Milestone 1 (Python Basics) has been completed by all members', type: 'system', created_at: '2025-01-07T23:00:00Z', user: null },
  { id: 'msg-4', sender_id: 'user-3', content: 'That error handling section is TOUGH. Took me two reads to get it', type: 'text', created_at: '2025-01-14T09:30:00Z', user: { full_name: 'Chioma Nwosu' } },
  { id: 'msg-5', sender_id: 'user-4', content: 'Sorry I missed 2 days guys, family thing. Back on track from today', type: 'text', created_at: '2025-01-14T10:00:00Z', user: { full_name: 'Emmanuel Bello' } },
]

export const DISCOVER_JOURNEYS = [
  {
    id: 'j-2', title: 'Run 5km Every Day for 21 Days',
    description: 'Daily 5km run — morning or evening, your choice. Log time and route. Build the habit, not just the fitness.',
    category: 'Fitness', duration_days: 21, max_participants: 3, current_participants: 1,
    stake_amount: 500, country: 'Nigeria', region: 'Lagos',
    days_elapsed: 0, progress_percent: 0,
    creator: { full_name: 'Seun Adeleke', reputation_score: 88 },
  },
  {
    id: 'j-3', title: 'Read One Book Per Week for a Month',
    description: '4 weeks, 4 books. Any genre. Just commit to finishing. Share key takeaways with the group each Sunday.',
    category: 'Habit', duration_days: 28, max_participants: 5, current_participants: 3,
    stake_amount: 0, country: 'Nigeria', region: 'Abuja',
    days_elapsed: 0, progress_percent: 0,
    creator: { full_name: 'Ngozi Obi', reputation_score: 76 },
  },
  {
    id: 'j-4', title: 'Build a SaaS Product in 60 Days',
    description: 'Ship a real product with paying customers. Daily build logs. Weekly revenue milestones. Serious people only.',
    category: 'Career', duration_days: 60, max_participants: 2, current_participants: 1,
    stake_amount: 2000, country: 'Nigeria', region: 'Lagos',
    days_elapsed: 0, progress_percent: 0,
    creator: { full_name: 'Kola Adeyemi', reputation_score: 97 },
  },
  {
    id: 'j-5', title: 'Morning Prayer & Devotion — 30 Days',
    description: "Start each day with 20 mins prayer and scripture. Log your verse and one thing you're grateful for.",
    category: 'Faith', duration_days: 30, max_participants: 10, current_participants: 6,
    stake_amount: 0, country: 'Nigeria', region: 'Oyo',
    days_elapsed: 0, progress_percent: 0,
    creator: { full_name: 'Pastor Femi', reputation_score: 91 },
  },
  {
    id: 'j-6', title: 'Learn React Native in 45 Days',
    description: 'From JavaScript basics to shipping a real mobile app. Follow a structured curriculum, build 3 projects.',
    category: 'Learning', duration_days: 45, max_participants: 4, current_participants: 2,
    stake_amount: 1500, country: 'Ghana', region: 'Accra',
    days_elapsed: 0, progress_percent: 0,
    creator: { full_name: 'Kwame Asante', reputation_score: 83 },
  },
]

export const MY_PAST_JOURNEYS = [
  { id: 'j-old-1', title: 'Build a Portfolio in 2 Weeks', category: 'Career',   status: 'completed', duration_days: 14 },
  { id: 'j-old-2', title: 'No Sugar for 30 Days',         category: 'Habit',    status: 'completed', duration_days: 30 },
  { id: 'j-old-3', title: 'Learn SQL from Scratch',       category: 'Learning', status: 'abandoned', duration_days: 21 },
]

export const CHECKIN_HEATMAP = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
  count: Math.random() > 0.15 ? 1 : 0,
}))

export const NOTIFICATIONS = [
  { id: 'n-1', type: 'checkin',   title: 'Tunde checked in',        body: 'Tunde just checked in on Learn Python. Go verify!',              read: false, created_at: '2025-01-14T09:00:00Z' },
  { id: 'n-2', type: 'streak',    title: '14-day streak!',           body: 'You have checked in 14 days in a row. Incredible.',              read: false, created_at: '2025-01-14T00:05:00Z' },
  { id: 'n-3', type: 'milestone', title: 'Week 2 unlocked',          body: 'Milestone 1 complete. Week 2 is now open for Learn Python.',     read: true,  created_at: '2025-01-07T23:00:00Z' },
  { id: 'n-4', type: 'badge',     title: 'Badge earned: Two Weeks',  body: 'You just earned the Two Weeks Strong badge!',                    read: true,  created_at: '2025-01-14T00:05:00Z' },
]

export const CATEGORIES = ['Learning', 'Fitness', 'Habit', 'Career', 'Faith', 'Finance', 'Custom']
