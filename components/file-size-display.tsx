interface FileSizeDisplayProps {
  sizeInBytes: number
}

export function FileSizeDisplay({ sizeInBytes }: FileSizeDisplayProps) {
  // Convert bytes to human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return <span>{formatFileSize(sizeInBytes)}</span>
}

