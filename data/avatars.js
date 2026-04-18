export const DICEBEAR_STYLE = 'adventurer'
export const DICEBEAR_BASE = `https://api.dicebear.com/7.x/${DICEBEAR_STYLE}/svg`

export const getAvatarUrl = (seed) =>
  `${DICEBEAR_BASE}?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`

// 16 avatars — fills a 4×4 grid on most phones with no scrolling needed
export const AVATAR_SEEDS = [
  { id: 'av-01', seed: 'Zara',   bg: '#1D9E75' },
  { id: 'av-02', seed: 'Kofi',   bg: '#185FA5' },
  { id: 'av-03', seed: 'Amara',  bg: '#854F0B' },
  { id: 'av-04', seed: 'Tunde',  bg: '#993556' },
  { id: 'av-05', seed: 'Emeka',  bg: '#3C3489' },
  { id: 'av-06', seed: 'Ngozi',  bg: '#3B6D11' },
  { id: 'av-07', seed: 'Nova',   bg: '#0F6E56' },
  { id: 'av-08', seed: 'Sage',   bg: '#72243E' },
  { id: 'av-09', seed: 'Lyric',  bg: '#0C447C' },
  { id: 'av-10', seed: 'Kali',   bg: '#993556' },
  { id: 'av-11', seed: 'Raven',  bg: '#444441' },
  { id: 'av-12', seed: 'Obi',    bg: '#993C1D' },
  { id: 'av-13', seed: 'Fatima', bg: '#1D9E75' },
  { id: 'av-14', seed: 'Yemi',   bg: '#633806' },
  { id: 'av-15', seed: 'Maya',   bg: '#26215C' },
  { id: 'av-16', seed: 'Aisha',  bg: '#185FA5' },
]
