import React, { useState, useEffect } from 'react'

interface UpdateInfo {
  version: string
  releaseDate: string
  releaseNotes?: string
}

interface UpdateProgress {
  bytesPerSecond: number
  percent: number
  transferred: number
  total: number
}

const UpdateManager: React.FC = () => {
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null)
  const [isUpdateReady, setIsUpdateReady] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [status, setStatus] = useState<string>('')

  useEffect(() => {
    // Get current app version
    window.api.updater.getAppVersion().then(setCurrentVersion)

    // Set up update event listeners
    window.api.updater.onUpdateAvailable((info: UpdateInfo) => {
      setUpdateInfo(info)
      setStatus('Update available! Downloading...')
    })

    window.api.updater.onDownloadProgress((progress: UpdateProgress) => {
      setDownloadProgress(progress)
    })

    window.api.updater.onUpdateDownloaded((_info: UpdateInfo) => {
      // eslint-disable-line @typescript-eslint/no-unused-vars
      setIsUpdateReady(true)
      setDownloadProgress(null)
      setStatus('Update downloaded! Ready to install.')
    })

    return () => {
      window.api.updater.removeAllListeners()
    }
  }, [])

  const handleCheckForUpdates = async (): Promise<void> => {
    setIsChecking(true)
    setStatus('Checking for updates...')

    try {
      const result = await window.api.updater.checkForUpdates()

      if (result.error) {
        setStatus(`Error: ${result.error}`)
      } else if (result.message) {
        setStatus(result.message)
      } else if (!updateInfo) {
        setStatus('No updates available')
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setStatus('Failed to check for updates')
    } finally {
      setIsChecking(false)
    }
  }

  const handleInstallUpdate = async (): Promise<void> => {
    try {
      await window.api.updater.installUpdate()
      setStatus('Installing update...')
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setStatus('Failed to install update')
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatSpeed = (bytesPerSecond: number): string => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return formatBytes(bytesPerSecond) + '/s'
  }

  return (
    <div className="update-manager p-4 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">App Updates</h3>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Current Version: <span className="font-mono">{currentVersion}</span>
        </p>
      </div>

      {status && (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          {status}
        </div>
      )}

      {updateInfo && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <h4 className="font-semibold text-green-800">Update Available</h4>
          <p className="text-sm text-green-700">Version: {updateInfo.version}</p>
          {updateInfo.releaseNotes && (
            <p className="text-sm text-green-700 mt-1">{updateInfo.releaseNotes}</p>
          )}
        </div>
      )}

      {downloadProgress && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-semibold text-yellow-800">Downloading Update</h4>
          <div className="mt-2">
            <div className="flex justify-between text-sm text-yellow-700 mb-1">
              <span>{Math.round(downloadProgress.percent)}%</span>
              <span>{formatSpeed(downloadProgress.bytesPerSecond)}</span>
            </div>
            <div className="w-full bg-yellow-200 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress.percent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-yellow-600 mt-1">
              <span>{formatBytes(downloadProgress.transferred)}</span>
              <span>{formatBytes(downloadProgress.total)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleCheckForUpdates}
          disabled={isChecking || !!downloadProgress}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isChecking ? 'Checking...' : 'Check for Updates'}
        </button>

        {isUpdateReady && (
          <button
            onClick={handleInstallUpdate}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Install & Restart
          </button>
        )}
      </div>
    </div>
  )
}

export default UpdateManager
