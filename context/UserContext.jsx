import { createContext, useContext, useState } from 'react'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)

  const updateUser = (fields) => setUser(prev => prev ? { ...prev, ...fields } : { ...fields })

  const incrementCheckinTotal = () =>
    setUser(prev => prev ? { ...prev, streak_total: (prev.streak_total || 0) + 1 } : prev)

  const updateStreak = (streak) =>
    setUser(prev => prev ? { ...prev, current_streak: streak } : prev)

  return (
    <UserContext.Provider value={{ user, setUser, updateUser, incrementCheckinTotal, updateStreak }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
