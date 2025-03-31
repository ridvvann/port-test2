/**
 * Storage Service
 *
 * This service handles storing and retrieving media files
 */

// Define the video data structure
export interface VideoData {
  id: string
  title: string
  description: string
  duration: string
  resolution: string
  category: string
  dateAdded: string
  thumbnailUrl: string
  thumbnailBase64?: string // Base64 encoded image data
  videoUrl?: string
  youtubeId?: string
}

// Google Drive folder IDs
const THUMBNAIL_FOLDER_ID = "1bsyKTxlk-IZxCZeuPeJSJ8hwQBQNHIuQ"
const VIDEO_FOLDER_ID = "1CgmNzIphGygCJcCJqVWzQ_HaZUQ7mfjv"

// Local storage key for video metadata
const VIDEOS_STORAGE_KEY = "videographer_videos"

// Maximum size for base64 images (in bytes) - approximately 100KB
const MAX_BASE64_SIZE = 100 * 1024

// Function to extract file ID from Google Drive URL
export function extractGoogleDriveFileId(url: string): string | null {
  // Handle different Google Drive URL formats
  const patterns = [
    /\/file\/d\/([^/]+)/, // https://drive.google.com/file/d/FILE_ID/view
    /id=([^&]+)/, // https://drive.google.com/uc?id=FILE_ID
    /\/open\?id=([^&]+)/, // https://drive.google.com/open?id=FILE_ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

// Function to get direct Google Drive viewing URL
export function getGoogleDriveViewUrl(url: string): string {
  const fileId = extractGoogleDriveFileId(url)
  if (!fileId) return url

  return `https://drive.google.com/file/d/${fileId}/view`
}

// Function to convert a File object to base64 with optional resizing
export async function fileToBase64(file: File, maxWidth = 800, maxHeight = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string

      img.onload = () => {
        // Resize the image if it's too large
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width))
          width = maxWidth
        }

        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height))
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0, width, height)

        // Get the resized image as base64 with reduced quality
        const resizedBase64 = canvas.toDataURL("image/jpeg", 0.7)

        // Check if the base64 string is still too large
        if (resizedBase64.length > MAX_BASE64_SIZE) {
          // If still too large, return a placeholder with the original file name
          console.warn("Image too large for base64 storage, using URL instead")
          resolve("")
        } else {
          resolve(resizedBase64)
        }
      }

      img.onerror = () => {
        reject(new Error("Failed to load image"))
      }
    }

    reader.onerror = (error) => {
      reject(error)
    }
  })
}

// Function to check if a string is a base64 image
export function isBase64Image(str: string): boolean {
  return str && str.startsWith("data:image")
}

// Function to get all videos from local storage
export function getAllVideos(): VideoData[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const storedVideos = localStorage.getItem(VIDEOS_STORAGE_KEY)
    return storedVideos ? JSON.parse(storedVideos) : []
  } catch (error) {
    console.error("Error retrieving videos from localStorage:", error)
    return []
  }
}

// Function to store video metadata in local storage with error handling
export function storeVideoMetadata(video: VideoData): VideoData {
  try {
    const videos = getAllVideos()
    const updatedVideos = [...videos, video]

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(updatedVideos))
      } catch (error) {
        console.error("localStorage quota exceeded:", error)

        // If storage quota is exceeded, try removing base64 data and store only URLs
        if (video.thumbnailBase64) {
          // Keep the URL but remove the base64 data
          video.thumbnailBase64 = undefined
        }

        // Try again with the modified video
        const fallbackVideos = [...videos, video]
        localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(fallbackVideos))

        throw new Error(
          "Image too large for storage. Only the URL has been saved. Please use Google Drive links for large images.",
        )
      }
    }

    return video
  } catch (error) {
    throw error
  }
}

// Function to update video metadata with error handling
export function updateVideoMetadata(id: string, updatedVideo: Partial<VideoData>): VideoData | null {
  try {
    const videos = getAllVideos()
    const videoIndex = videos.findIndex((v) => v.id === id)

    if (videoIndex === -1) {
      return null
    }

    const updatedVideos = [...videos]
    updatedVideos[videoIndex] = {
      ...updatedVideos[videoIndex],
      ...updatedVideo,
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(updatedVideos))
      } catch (error) {
        console.error("localStorage quota exceeded during update:", error)

        // If storage quota is exceeded, try removing base64 data
        if (updatedVideos[videoIndex].thumbnailBase64) {
          updatedVideos[videoIndex].thumbnailBase64 = undefined
        }

        // Try again with modified data
        localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(updatedVideos))

        throw new Error(
          "Image too large for storage. Only the URL has been saved. Please use Google Drive links for large images.",
        )
      }
    }

    return updatedVideos[videoIndex]
  } catch (error) {
    throw error
  }
}

// Function to delete video metadata
export function deleteVideoMetadata(id: string): boolean {
  const videos = getAllVideos()
  const updatedVideos = videos.filter((v) => v.id !== id)

  if (videos.length === updatedVideos.length) {
    return false
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(updatedVideos))
  }

  return true
}

// Function to get Google Drive folder URL
export function getGoogleDriveFolderUrl(type: "thumbnail" | "video"): string {
  const folderId = type === "thumbnail" ? THUMBNAIL_FOLDER_ID : VIDEO_FOLDER_ID
  return `https://drive.google.com/drive/folders/${folderId}`
}

// Function to clear localStorage to free up space
export function clearOldVideos(keepLatest = 10): boolean {
  try {
    const videos = getAllVideos()

    if (videos.length <= keepLatest) {
      return false // Nothing to clear
    }

    // Sort by date (newest first) and keep only the latest 'keepLatest' videos
    const sortedVideos = videos.sort((a, b) => {
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    })

    const videosToKeep = sortedVideos.slice(0, keepLatest)

    if (typeof window !== "undefined") {
      localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(videosToKeep))
    }

    return true
  } catch (error) {
    console.error("Error clearing old videos:", error)
    return false
  }
}

// Function to estimate localStorage usage
export function getStorageUsage(): { used: number; total: number; percentage: number } {
  try {
    let total = 5 * 1024 * 1024 // Assume 5MB as default
    let used = 0

    if (typeof window !== "undefined") {
      // Try to estimate total localStorage size
      const testKey = "___test_ls_size___"
      const testData = "1".repeat(1024) // 1KB of data
      let i = 0

      try {
        // Try to fill localStorage to estimate its size
        localStorage.setItem(testKey, "")
        while (true) {
          localStorage.setItem(testKey, testData.repeat(i))
          i++
        }
      } catch (e) {
        total = i * 1024
        localStorage.removeItem(testKey)
      }

      // Calculate current usage
      for (let j = 0; j < localStorage.length; j++) {
        const key = localStorage.key(j)
        if (key) {
          const value = localStorage.getItem(key) || ""
          used += key.length + value.length
        }
      }
    }

    return {
      used,
      total,
      percentage: Math.round((used / total) * 100),
    }
  } catch (error) {
    console.error("Error calculating storage usage:", error)
    return { used: 0, total: 5 * 1024 * 1024, percentage: 0 }
  }
}

