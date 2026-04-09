import { createContext, useContext, useState } from 'react'
import { CURRENT_USER } from '../data/dummy'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(CURRENT_USER)

  const updateUser = (fields) => setUser(prev => ({ ...prev, ...fields }))

  return (
    <UserContext.Provider value={{ user, setUser, updateUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
