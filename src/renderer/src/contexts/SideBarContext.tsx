import React, { useState } from 'react'

const SideBarContext = React.createContext({
  isOpen: false,
  //@ts-ignore: setIsOpen is not used
  setIsOpen: (isOpen: boolean) => {
    // do nothing
  }
})

const SideBarProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)
  return <SideBarContext.Provider value={{ isOpen, setIsOpen }}>{children}</SideBarContext.Provider>
}

export { SideBarProvider, SideBarContext }
