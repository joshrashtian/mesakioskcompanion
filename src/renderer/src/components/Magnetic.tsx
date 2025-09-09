import React, { useRef } from 'react'

type MagneticProps = {
  maxTranslate?: number
  children: React.ReactNode
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min
  if (value > max) return max
  return value
}

const Magnetic: React.FC<MagneticProps> = ({ maxTranslate = 8, children }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (event) => {
    const element = wrapperRef.current
    if (!element) return

    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const deltaX = event.clientX - centerX
    const deltaY = event.clientY - centerY

    const normX = clamp(deltaX / (rect.width / 2), -1, 1)
    const normY = clamp(deltaY / (rect.height / 2), -1, 1)

    const translateX = normX * maxTranslate
    const translateY = normY * maxTranslate

    element.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`
  }

  const handleMouseLeave: React.MouseEventHandler<HTMLDivElement> = () => {
    const element = wrapperRef.current
    if (!element) return
    element.style.transform = 'translate3d(0px, 0px, 0)'
  }

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: 'transform 120ms ease-out',
        willChange: 'transform',
        display: 'inline-block'
      }}
    >
      {children}
    </div>
  )
}

export default Magnetic
