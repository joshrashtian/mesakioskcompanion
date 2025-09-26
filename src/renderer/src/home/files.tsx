import { supabase } from '@renderer/contexts/SupabaseContext'
import { useRoomContext } from '@renderer/hooks/useRoomContext'
import { useEffect, useState } from 'react'
import {
  IoDocument,
  IoDocumentOutline,
  IoImageOutline,
  IoDownloadOutline,
  IoEyeOutline
} from 'react-icons/io5'
import FullScreenViewer from '@renderer/components/FullScreenViewer'

const Files = (): React.JSX.Element => {
  const { data } = useRoomContext()
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerFiles, setViewerFiles] = useState<any[]>([])
  const [currentViewerIndex, setCurrentViewerIndex] = useState(0)
  useEffect(() => {
    const fetchFiles = async (): Promise<void> => {
      setLoading(true)
      const { data: FileData, error } = await supabase.storage.from(`rooms`).list(data.id)
      if (error) {
        console.error(error)
      } else {
        setFiles(FileData)
      }
      setLoading(false)
    }
    fetchFiles()
  }, [data.id])

  const imageFiles = files.filter(
    (file) =>
      file.name.includes('.png') || file.name.includes('.jpg') || file.name.includes('.jpeg')
  )

  const documentFiles = files.filter(
    (file) =>
      file.name.includes('.pdf') ||
      file.name.includes('.doc') ||
      file.name.includes('.docx') ||
      file.name.includes('.txt')
  )

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileName: string): React.JSX.Element => {
    if (fileName.includes('.png') || fileName.includes('.jpg') || fileName.includes('.jpeg')) {
      return <IoImageOutline className="h-6 w-6 text-blue-500" />
    } else if (fileName.includes('.pdf')) {
      return <IoDocumentOutline className="h-6 w-6 text-red-500" />
    } else if (fileName.includes('.doc') || fileName.includes('.docx')) {
      return <IoDocument className="h-6 w-6 text-blue-600" />
    } else {
      return <IoDocument className="h-6 w-6 text-gray-500" />
    }
  }

  const openViewer = (file: any, fileList: any[]): void => {
    if (!file || !fileList || !Array.isArray(fileList)) {
      console.error('Invalid file or fileList provided to openViewer')
      return
    }

    const viewableFiles = fileList.filter(
      (f) =>
        f &&
        f.name &&
        (f.name.includes('.png') ||
          f.name.includes('.jpg') ||
          f.name.includes('.jpeg') ||
          f.name.includes('.pdf'))
    )

    if (viewableFiles.length === 0) {
      console.error('No viewable files found')
      return
    }

    const index = viewableFiles.findIndex((f) => f.id === file.id)

    if (index === -1) {
      console.error('File not found in viewable files list')
      return
    }

    setViewerFiles(viewableFiles)
    setCurrentViewerIndex(index)
    setViewerOpen(true)
  }

  const closeViewer = (): void => {
    setViewerOpen(false)
    setViewerFiles([])
    setCurrentViewerIndex(0)
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full relative max-w-7xl max-h-[500px] overflow-y-scroll flex flex-col gap-4 mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Room Files</h1>
        <p className="text-gray-600">Manage and view all files in this room</p>
      </div>

      {/* Images Section */}
      {imageFiles.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <IoImageOutline className="h-6 w-6 text-blue-500" />
              Images ({imageFiles.length})
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {imageFiles.slice(0, 20).map((file: any) => (
              <div
                key={file.id}
                onClick={() => openViewer(file, imageFiles)}
                className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={`https://gnmpzioggytlqzekuyuo.supabase.co/storage/v1/object/public/rooms/${data.id}/${file.name}`}
                    alt={file.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute inset-0 bg-black/30 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openViewer(file, imageFiles)
                        }}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                        title="View fullscreen"
                      >
                        <IoEyeOutline className="h-4 w-4 text-gray-700" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const link = document.createElement('a')
                          link.href = `https://gnmpzioggytlqzekuyuo.supabase.co/storage/v1/object/public/rooms/${data.id}/${file.name}`
                          link.download = file.name
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                        title="Download"
                      >
                        <IoDownloadOutline className="h-4 w-4 text-gray-700" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {file.metadata?.size ? formatFileSize(file.metadata.size) : 'Unknown size'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Documents Section */}
      {documentFiles.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <IoDocumentOutline className="h-6 w-6 text-red-500" />
            Documents ({documentFiles.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentFiles.map((file: any) => (
              <div
                key={file.id}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-gray-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">{getFileIcon(file.name)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {file.metadata?.size ? formatFileSize(file.metadata.size) : 'Unknown size'}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openViewer(file, documentFiles)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <IoEyeOutline className="h-3 w-3" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = `https://gnmpzioggytlqzekuyuo.supabase.co/storage/v1/object/public/rooms/${data.id}/${file.name}`
                          link.download = file.name
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <IoDownloadOutline className="h-3 w-3" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Files Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <IoDocument className="h-6 w-6 text-gray-500" />
          All Files ({files.length})
        </h2>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file: any) => (
                  <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.name)}
                        <span
                          className="text-sm font-medium text-gray-900 truncate max-w-xs"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {file.name.split('.').pop()?.toUpperCase() || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {file.metadata?.size ? formatFileSize(file.metadata.size) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openViewer(file, files)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View fullscreen"
                        >
                          <IoEyeOutline className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = `https://gnmpzioggytlqzekuyuo.supabase.co/storage/v1/object/public/rooms/${data.id}/${file.name}`
                            link.download = file.name
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Download"
                        >
                          <IoDownloadOutline className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Empty State */}
      {files.length === 0 && (
        <div className="text-center py-12">
          <IoDocumentOutline className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-500">This room doesn&apos;t have any files yet.</p>
        </div>
      )}

      {/* Full Screen Viewer */}
      {viewerOpen && viewerFiles.length > 0 && (
        <FullScreenViewer
          isOpen={viewerOpen}
          onClose={closeViewer}
          files={viewerFiles}
          currentIndex={currentViewerIndex}
          onIndexChange={setCurrentViewerIndex}
          roomId={data.id}
        />
      )}
    </div>
  )
}

export default Files
