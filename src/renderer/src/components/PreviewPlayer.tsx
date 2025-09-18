import React, { useRef, useEffect, useState } from 'react'

interface PreviewPlayerProps {
  previewUrl: string | null
  isPlaying: boolean
  onPlayStateChange: (playing: boolean) => void
  volume?: number
}

const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  previewUrl,
  isPlaying,
  onPlayStateChange,
  volume = 0.5
}) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentPreview, setCurrentPreview] = useState<string | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Set volume
    audio.volume = volume

    // Handle audio events
    const handlePlay = () => onPlayStateChange(true)
    const handlePause = () => onPlayStateChange(false)
    const handleEnded = () => onPlayStateChange(false)
    const handleError = () => {
      console.error('Audio playback error')
      onPlayStateChange(false)
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [onPlayStateChange, volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Handle preview URL changes
    if (previewUrl !== currentPreview) {
      audio.pause()
      if (previewUrl) {
        audio.src = previewUrl
        setCurrentPreview(previewUrl)
      } else {
        audio.src = ''
        setCurrentPreview(null)
      }
    }

    // Handle play/pause state changes
    if (previewUrl && currentPreview) {
      if (isPlaying && audio.paused) {
        audio.play().catch(console.error)
      } else if (!isPlaying && !audio.paused) {
        audio.pause()
      }
    }
  }, [previewUrl, isPlaying, currentPreview])

  return (
    <div className="hidden">
      <audio ref={audioRef} preload="none" />
    </div>
  )
}

export default PreviewPlayer
