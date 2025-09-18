import React, { useState } from 'react'

const SessionContext = React.createContext({
  session: null,
  setSession: (session: any) => {
    void session
  }
})

const SessionProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const [session, setSession] = useState<any>(null)
  return (
    <SessionContext.Provider value={{ session, setSession }}>{children}</SessionContext.Provider>
  )
}

export { SessionContext, SessionProvider }
