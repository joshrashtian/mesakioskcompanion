import React, { useCallback, useEffect, useState } from 'react'
import {
  IoClose,
  IoChevronBack,
  IoChevronForward,
  IoDownloadOutline,
  IoExpandOutline,
  IoContractOutline,
  IoDocumentOutline,
  IoImageOutline,
  IoEyeOutline
} from 'react-icons/io5'

interface FileItem {
  id: string
  name: string
  metadata?: {
    size: number
  }
}

interface FullScreenViewerProps {
  isOpen: boolean
  onClose: () => void
  files: FileItem[]
  currentIndex: number
  onIndexChange: (index: number) => void
  roomId: string
}

const FullScreenViewer: React.FC<FullScreenViewerProps> = ({
  isOpen,
  onClose,
  files,
  currentIndex,
  onIndexChange,
  roomId
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [pdfError, setPdfError] = useState(false)

  const currentFile = files[currentIndex]
  const isImage =
    currentFile?.name.includes('.png') ||
    currentFile?.name.includes('.jpg') ||
    currentFile?.name.includes('.jpeg')
  const isPdf = currentFile?.name.includes('.pdf')

  const fileUrl = `https://gnmpzioggytlqzekuyuo.supabase.co/storage/v1/object/public/rooms/${roomId}/${currentFile?.name}`

  const goToPrevious = useCallback((): void => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1)
    }
  }, [currentIndex, onIndexChange])

  const goToNext = useCallback((): void => {
    if (currentIndex < files.length - 1) {
      onIndexChange(currentIndex + 1)
    }
  }, [currentIndex, files.length, onIndexChange])

  const toggleFullscreen = useCallback((): void => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const downloadFile = useCallback((): void => {
    if (!currentFile) return

    const link = document.createElement('a')
    link.href = fileUrl
    link.download = currentFile.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [fileUrl, currentFile])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
        case 'f':
        case 'F':
          toggleFullscreen()
          break
        case 'd':
        case 'D':
          downloadFile()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, goToPrevious, goToNext, toggleFullscreen, downloadFile])

  // Reset state when file changes
  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
    setPdfError(false)
  }, [currentIndex])

  if (
    !isOpen ||
    !currentFile ||
    !files.length ||
    currentIndex < 0 ||
    currentIndex >= files.length
  ) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold truncate max-w-md" title={currentFile.name}>
              {currentFile.name}
            </h2>
            <span className="text-sm text-gray-300">
              {currentIndex + 1} of {files.length}
            </span>
            {currentFile.metadata?.size && (
              <span className="text-sm text-gray-300">
                {formatFileSize(currentFile.metadata.size)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadFile}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Download (D)"
            >
              <IoDownloadOutline className="h-5 w-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? (
                <IoContractOutline className="h-5 w-5" />
              ) : (
                <IoExpandOutline className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <IoClose className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {files.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full transition-all"
            title="Previous (←)"
          >
            <IoChevronBack className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === files.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full transition-all"
            title="Next (→)"
          >
            <IoChevronForward className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-16">
        {isImage ? (
          <div className="relative max-w-full max-h-full">
            {!imageLoaded && !imageError && (
              <div className="flex items-center justify-center w-96 h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
              </div>
            )}
            {imageError ? (
              <div className="flex flex-col items-center justify-center text-white w-96 h-96">
                <IoImageOutline className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-lg font-medium">Failed to load image</p>
                <p className="text-sm text-gray-400">The image could not be displayed</p>
              </div>
            ) : (
              <img
                src={fileUrl}
                alt={currentFile.name}
                className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            )}
          </div>
        ) : isPdf ? (
          <div className="w-full h-full">
            {pdfError ? (
              <div className="flex flex-col items-center justify-center text-white h-full">
                <IoDocumentOutline className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">PDF Preview Unavailable</p>
                <p className="text-sm text-gray-400 mb-4 text-center max-w-md">
                  The PDF cannot be displayed in the browser. This may be due to security
                  restrictions or file format issues.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setPdfError(false)
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => {
                      window.open(fileUrl, '_blank')
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <IoEyeOutline className="h-4 w-4" />
                    Open in New Tab
                  </button>
                  <button
                    onClick={downloadFile}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <IoDownloadOutline className="h-4 w-4" />
                    Download PDF
                  </button>
                </div>
              </div>
            ) : (
              <iframe
                src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-screen max-h-[700px] border-0"
                title={currentFile.name}
                onError={() => setPdfError(true)}
                onLoad={() => {
                  // Check if iframe loaded successfully
                  setTimeout(() => {
                    try {
                      const iframe = document.querySelector('iframe')
                      if (iframe && iframe.contentDocument?.body?.innerHTML === '') {
                        setPdfError(true)
                      }
                    } catch {
                      // Cross-origin restrictions - this is expected for external PDFs
                      // Don't set error in this case as the PDF might still load
                    }
                  }, 2000)
                }}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-white">
            <IoDocumentOutline className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-lg font-medium">Preview not available</p>
            <p className="text-sm text-gray-400">This file type cannot be previewed</p>
            <button
              onClick={downloadFile}
              className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <IoDownloadOutline className="h-4 w-4" />
              Download File
            </button>
          </div>
        )}
      </div>

      {/* Footer with file info */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-center text-white text-sm">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              {isImage ? (
                <IoImageOutline className="h-4 w-4" />
              ) : (
                <IoDocumentOutline className="h-4 w-4" />
              )}
              {isImage ? 'Image' : isPdf ? 'PDF Document' : 'Document'}
            </span>
            {files.length > 1 && <span>Use arrow keys or buttons to navigate</span>}
            <span>Press F for fullscreen, D to download, Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FullScreenViewer
