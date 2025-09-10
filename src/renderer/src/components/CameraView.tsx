import { useEffect, useMemo, useRef, useState } from 'react'

type MediaDeviceInfoLite = Pick<MediaDeviceInfo, 'deviceId' | 'label' | 'kind'>

type DisplayInfo = {
  id: number
  bounds: { x: number; y: number; width: number; height: number }
  workArea: { x: number; y: number; width: number; height: number }
  scaleFactor: number
  rotation: number
  internal: boolean
}

type VideoQuality = {
  width?: number
  height?: number
  fps?: number
}

function useCameraStream(
  selectedVideoDeviceId: string | undefined,
  selectedAudioDeviceId: string | undefined,
  quality: VideoQuality,
  muted: boolean,
  volume: number
): {
  videoRef: React.RefObject<HTMLVideoElement | null>
  audioRef: React.RefObject<HTMLAudioElement | null>
  error: string | null
} {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false
    const start = async (): Promise<void> => {
      try {
        if (stream) {
          stream.getTracks().forEach((t) => t.stop())
        }

        const constraints: MediaStreamConstraints = {
          video: {
            ...(selectedVideoDeviceId ? { deviceId: { exact: selectedVideoDeviceId } } : {}),
            ...(quality.width ? { width: { ideal: quality.width } } : {}),
            ...(quality.height ? { height: { ideal: quality.height } } : {}),
            ...(quality.fps ? { frameRate: { ideal: quality.fps } } : {})
          },
          audio: selectedAudioDeviceId ? { deviceId: { exact: selectedAudioDeviceId } } : false
        }

        const newStream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        if (isCancelled) return
        setStream(newStream)
        setError(null)
        if (videoRef.current) {
          videoRef.current.srcObject = newStream
          await videoRef.current.play().catch(() => {})
        }
        if (audioRef.current) {
          audioRef.current.srcObject = newStream
          audioRef.current.muted = muted
          audioRef.current.volume = volume
          await audioRef.current.play().catch(() => {})
        }
      } catch (e) {
        if (isCancelled) return
        const message = e instanceof Error ? e.message : 'Failed to access camera'
        setError(message)
      }
    }
    start()
    return () => {
      isCancelled = true
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideoDeviceId, selectedAudioDeviceId, quality.width, quality.height, quality.fps])

  useEffect(() => {
    if (!videoRef.current || !stream) return
    videoRef.current.srcObject = stream
  }, [stream])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.muted = muted
    audioRef.current.volume = volume
  }, [muted, volume])

  return { videoRef, audioRef, error }
}

export default function CameraView(): React.JSX.Element {
  const [devices, setDevices] = useState<MediaDeviceInfoLite[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfoLite[]>([])
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string | undefined>(undefined)
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string | undefined>(undefined)
  const [mirror, setMirror] = useState(true)
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [quality, setQuality] = useState<VideoQuality>({})
  const [muted, setMuted] = useState<boolean>(false)
  const [volume, setVolume] = useState<number>(1)

  const { videoRef, audioRef, error } = useCameraStream(
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    quality,
    muted,
    volume
  )

  useEffect(() => {
    const enumerate = async (): Promise<void> => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => {})
        const list = await navigator.mediaDevices.enumerateDevices()
        const cams = list.filter((d) => d.kind === 'videoinput')
        setDevices(
          cams.map((d) => ({ deviceId: d.deviceId, label: d.label || 'Camera', kind: d.kind }))
        )
        if (!selectedVideoDeviceId && cams[0]) setSelectedVideoDeviceId(cams[0].deviceId)

        const auds = list.filter((d) => d.kind === 'audioinput')
        setAudioDevices(
          auds.map((d) => ({ deviceId: d.deviceId, label: d.label || 'Audio Input', kind: d.kind }))
        )
        if (!selectedAudioDeviceId && auds[0]) setSelectedAudioDeviceId(auds[0].deviceId)
      } catch {
        // ignore
      }
    }
    enumerate()
  }, [selectedVideoDeviceId, selectedAudioDeviceId])

  useEffect(() => {
    window.api
      .getDisplays()
      .then((d) => setDisplays(d))
      .catch(() => {})
  }, [])

  const mirrorClass = useMemo(() => (mirror ? 'scale-x-[-1]' : ''), [mirror])

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-4 fixed lg:top-12 overflow-x-scroll lg:left-24 lg:right-24 z-10  bg-zinc-400/70 rounded-3xl px-24 flex items-center gap-3">
        <div className="h-6 w-20 mr-2 drag rounded cursor-move" />
        <div className="flex flex-col">
          <label className="text-sm text-zinc-300">Display / Camera</label>
          <select
            className="bg-zinc-900 text-zinc-100 rounded px-2 py-1 border border-zinc-700 no-drag"
            value={selectedVideoDeviceId || ''}
            onChange={(e) => setSelectedVideoDeviceId(e.target.value)}
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || 'Camera'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-zinc-300">Mirror</label>
          <input
            className="no-drag"
            type="checkbox"
            checked={mirror}
            onChange={(e) => setMirror(e.target.checked)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-zinc-300">Resolution</label>
          <select
            className="bg-zinc-900 text-zinc-100 rounded px-2 py-1 border border-zinc-700 no-drag"
            onChange={(e) => {
              const val = e.target.value
              if (val === 'auto') setQuality({})
              else if (val === '720p') setQuality({ width: 1280, height: 720, fps: quality.fps })
              else if (val === '1080p') setQuality({ width: 1920, height: 1080, fps: quality.fps })
              else if (val === '1440p') setQuality({ width: 2560, height: 1440, fps: quality.fps })
              else if (val === '2160p') setQuality({ width: 3840, height: 2160, fps: quality.fps })
            }}
            defaultValue="auto"
          >
            <option value="auto">Auto</option>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
            <option value="1440p">1440p</option>
            <option value="2160p">2160p</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-zinc-300">FPS</label>
          <input
            type="number"
            min={1}
            max={120}
            className="w-20 bg-zinc-900 text-zinc-100 rounded px-2 py-1 border border-zinc-700 no-drag"
            value={quality.fps ?? ''}
            onChange={(e) =>
              setQuality((q) => ({
                ...q,
                fps: e.target.value ? Number(e.target.value) : undefined
              }))
            }
            placeholder="auto"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-zinc-300">Audio In</label>
          <select
            className="bg-zinc-900 text-zinc-100 rounded px-2 py-1 border border-zinc-700 no-drag"
            value={selectedAudioDeviceId || ''}
            onChange={(e) => setSelectedAudioDeviceId(e.target.value)}
          >
            <option value="">Off</option>
            {audioDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || 'Audio Input'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-zinc-300">Mute</label>
          <input
            className="no-drag"
            type="checkbox"
            checked={muted}
            onChange={(e) => setMuted(e.target.checked)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-zinc-300">Volume</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="no-drag"
          />
        </div>

        <div className="flex-1" />
        <div className="flex flex-col">
          <label className="text-sm text-zinc-300">Screen</label>
          <select
            className="bg-zinc-900 text-zinc-100 rounded px-2 py-1 border border-zinc-700 no-drag"
            onChange={async (e) => {
              const id = Number(e.target.value)
              if (!Number.isNaN(id)) await window.api.moveToDisplayAndFullscreen(id)
            }}
            defaultValue=""
          >
            <option value="" disabled>
              Choose…
            </option>
            {displays.map((d) => (
              <option key={d.id} value={d.id}>
                {d.internal ? 'Built-in' : 'External'} — {d.bounds.width}×{d.bounds.height} @{' '}
                {d.scaleFactor}x
              </option>
            ))}
          </select>
        </div>
        <button
          className="ml-2 px-3 py-1 rounded bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700 no-drag"
          onClick={() => window.api.exitFullscreen()}
        >
          Exit Fullscreen
        </button>
      </div>

      <div className="flex-1 bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          className={`max-h-full max-w-full ${mirrorClass}`}
          autoPlay
          playsInline
          muted
        />
        <audio ref={audioRef} autoPlay hidden />
      </div>

      {error ? <div className="p-2 text-red-400 text-sm">{error}</div> : null}
    </div>
  )
}
