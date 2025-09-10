import React, { useState } from 'react'

const SideBarContext = React.createContext({
  isOpen: false,
  setIsOpen: (isOpen: boolean) => {
    void isOpen
  }
})

const SideBarProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)
  return <SideBarContext.Provider value={{ isOpen, setIsOpen }}>{children}</SideBarContext.Provider>
}

export { SideBarProvider, SideBarContext }
