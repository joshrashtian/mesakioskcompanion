import { useRoomContext } from '@renderer/hooks/useRoomContext'
import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const QRCodePopup = (): React.JSX.Element => {
  const { data } = useRoomContext()
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div
      className={`${isOpen ? 'block' : 'hidden'} bg-white shadow-lg rounded-lg p-4 fixed bottom-3 left-20 origin-bottom-left`}
    >
      <QRCodeSVG value={data.room?.id || ''} size={100} />
      <button onClick={() => setIsOpen(!isOpen)} className="text-black">
        Close QR Code
      </button>
    </div>
  )
}

export default QRCodePopup
