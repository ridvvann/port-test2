"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Pencil, Trash2, Plus, Youtube, ExternalLink, Info, Upload, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { LogoutButton } from "@/components/logout-button"
import Link from "next/link"
import { v4 as uuidv4 } from "uuid"
import {
  getAllVideos,
  storeVideoMetadata,
  updateVideoMetadata,
  deleteVideoMetadata,
  getGoogleDriveFolderUrl,
  extractGoogleDriveFileId,
  fileToBase64,
  isBase64Image,
  getGoogleDriveViewUrl,
  clearOldVideos,
  getStorageUsage,
  type VideoData,
} from "@/lib/google-drive-storage"

export default function AdminPage() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoData, setVideoData] = useState({
    title: "",
    description: "",
    duration: "",
    resolution: "",
    category: "youtube",
    youtubeId: "",
    thumbnailUrl: "",
    videoUrl: "",
  })
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [thumbnailBase64, setThumbnailBase64] = useState<string | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null)
  const [videos, setVideos] = useState<VideoData[]>([])
  const [loading, setLoading] = useState(true)
  const [editingVideo, setEditingVideo] = useState<VideoData | null>(null)
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isClearStorageDialogOpen, setIsClearStorageDialogOpen] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<VideoData | null>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false)
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0, percentage: 0 })

  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const editThumbnailInputRef = useRef<HTMLInputElement>(null)

  // Load videos on component mount
  useEffect(() => {
    loadVideos()
    updateStorageUsage()
  }, [])

  // Update storage usage stats
  const updateStorageUsage = () => {
    const usage = getStorageUsage()
    setStorageUsage(usage)
  }

  // Load videos from local storage
  const loadVideos = () => {
    try {
      setLoading(true)
      const data = getAllVideos()
      setVideos(data)
    } catch (error) {
      console.error("Error loading videos:", error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setVideoData((prev) => ({ ...prev, [name]: value }))
  }

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setThumbnailFile(file)

    try {
      // Show warning if file is large
      if (file.size > 1024 * 1024) {
        // 1MB
        setMessage({
          type: "warning",
          text: "Large image detected. The image will be resized to save storage space. Consider using Google Drive URL for very large images.",
        })
      }

      // Convert file to base64 with resizing
      const base64 = await fileToBase64(file)

      if (!base64) {
        // If base64 is empty, it means the image was too large even after resizing
        setMessage({
          type: "warning",
          text: "Image is too large for local storage. Please use Google Drive URL instead.",
        })
        setThumbnailBase64(null)
        setThumbnailPreview(URL.createObjectURL(file))
      } else {
        setThumbnailBase64(base64)
        setThumbnailPreview(base64)

        // Clear the URL input since we're using a file
        setVideoData((prev) => ({ ...prev, thumbnailUrl: "" }))
      }
    } catch (error) {
      console.error("Error converting file to base64:", error)
      setMessage({
        type: "error",
        text: "Failed to process the thumbnail image.",
      })
    }
  }

  const handleEditThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !editingVideo) return

    const file = files[0]
    setEditThumbnailFile(file)

    try {
      // Show warning if file is large
      if (file.size > 1024 * 1024) {
        // 1MB
        setMessage({
          type: "warning",
          text: "Large image detected. The image will be resized to save storage space. Consider using Google Drive URL for very large images.",
        })
      }

      // Convert file to base64 with resizing
      const base64 = await fileToBase64(file)

      if (!base64) {
        // If base64 is empty, it means the image was too large even after resizing
        setMessage({
          type: "warning",
          text: "Image is too large for local storage. Please use Google Drive URL instead.",
        })

        setEditingVideo({
          ...editingVideo,
          thumbnailPreview: URL.createObjectURL(file),
          thumbnailBase64: undefined,
          thumbnailUrl: "", // Clear the URL since we're using a file
        })
      } else {
        setEditingVideo({
          ...editingVideo,
          thumbnailBase64: base64,
          thumbnailPreview: base64,
          thumbnailUrl: "", // Clear the URL since we're using a file
        })
      }
    } catch (error) {
      console.error("Error converting file to base64:", error)
      setMessage({
        type: "error",
        text: "Failed to process the thumbnail image.",
      })
    }
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditingVideo((prev) => {
      if (!prev) return null

      // If changing thumbnail URL, update preview
      if (name === "thumbnailUrl" && value) {
        return {
          ...prev,
          [name]: value,
          thumbnailPreview: value,
          thumbnailBase64: undefined, // Reset base64 when URL changes
        }
      }

      return { ...prev, [name]: value }
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setVideoData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditSelectChange = (name: string, value: string) => {
    setEditingVideo((prev) => (prev ? { ...prev, [name]: value } : null))
  }

  const resetForm = () => {
    setVideoData({
      title: "",
      description: "",
      duration: "",
      resolution: "",
      category: "youtube",
      youtubeId: "",
      thumbnailUrl: "",
      videoUrl: "",
    })
    setThumbnailPreview(null)
    setThumbnailBase64(null)
    setThumbnailFile(null)
    setUploadProgress(0)

    // Reset file input
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setUploadProgress(0)
    setMessage(null)

    try {
      // Validate required fields
      if (!videoData.title || !videoData.description || !videoData.duration || !videoData.resolution) {
        throw new Error("Please fill out all required fields")
      }

      // For YouTube videos, require YouTube ID
      if (videoData.category === "youtube" && !videoData.youtubeId) {
        throw new Error("Please provide a YouTube video ID for YouTube videos")
      }

      // For non-YouTube videos, require video URL
      if (videoData.category !== "youtube" && !videoData.videoUrl) {
        throw new Error("Please provide a Google Drive video URL")
      }

      // Require either a thumbnail URL or a thumbnail file
      if (!videoData.thumbnailUrl && !thumbnailBase64 && !thumbnailFile) {
        throw new Error("Please provide a thumbnail image")
      }

      // If we have a file but no base64 (too large), require a URL
      if (thumbnailFile && !thumbnailBase64 && !videoData.thumbnailUrl) {
        throw new Error(
          "The image is too large for local storage. Please provide a Google Drive URL for the thumbnail.",
        )
      }

      // Validate Google Drive URLs
      if (videoData.category !== "youtube" && videoData.videoUrl && !extractGoogleDriveFileId(videoData.videoUrl)) {
        throw new Error("Invalid Google Drive video URL. Please provide a valid sharing link.")
      }

      // Check storage usage
      if (storageUsage.percentage > 80) {
        setMessage({
          type: "warning",
          text: `Storage is ${storageUsage.percentage}% full. Consider clearing old videos to free up space.`,
        })
      }

      // Simulate upload progress
      setUploadProgress(50)

      // Create a new video object
      const newVideo: VideoData = {
        id: uuidv4(),
        title: videoData.title,
        description: videoData.description,
        duration: videoData.duration,
        resolution: videoData.resolution,
        category: videoData.category,
        dateAdded: new Date().toISOString(),
        thumbnailUrl: videoData.thumbnailUrl,
        ...(thumbnailBase64 ? { thumbnailBase64 } : {}),
        ...(videoData.category !== "youtube" && videoData.videoUrl ? { videoUrl: videoData.videoUrl } : {}),
        ...(videoData.category === "youtube" && videoData.youtubeId ? { youtubeId: videoData.youtubeId } : {}),
      }

      // Store in local storage
      try {
        const storedVideo = storeVideoMetadata(newVideo)
        setUploadProgress(100)

        // Add to videos array
        setVideos((prev) => [...prev, storedVideo])

        // Show success message
        setMessage({
          type: "success",
          text: "Video added successfully! It will now appear in your portfolio.",
        })

        // Update storage usage
        updateStorageUsage()

        // Reset form
        resetForm()
      } catch (error) {
        if (error instanceof Error) {
          // If it's a storage quota error, show a specific message
          if (error.message.includes("quota") || error.message.includes("too large")) {
            setMessage({
              type: "warning",
              text: error.message + " Consider clearing old videos to free up space.",
            })

            // Try to add without the base64 data
            const fallbackVideo = {
              ...newVideo,
              thumbnailBase64: undefined,
            }

            if (!fallbackVideo.thumbnailUrl && thumbnailFile) {
              // If we have a file but no URL, we need to get a URL
              setMessage({
                type: "error",
                text: "Storage quota exceeded. Please provide a Google Drive URL for the thumbnail or clear old videos.",
              })
              throw error
            }

            // Try to store without base64
            const storedVideo = storeVideoMetadata(fallbackVideo)
            setVideos((prev) => [...prev, storedVideo])

            // Update storage usage
            updateStorageUsage()

            // Reset form
            resetForm()
          } else {
            throw error
          }
        } else {
          throw error
        }
      }
    } catch (error) {
      console.error("Error:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "An error occurred. Please try again.",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (video: VideoData) => {
    setEditingVideo({
      ...video,
      thumbnailPreview: video.thumbnailBase64 || video.thumbnailUrl,
    })
    setEditThumbnailFile(null)
    setIsEditDialogOpen(true)

    // Reset file input
    if (editThumbnailInputRef.current) {
      editThumbnailInputRef.current.value = ""
    }
  }

  const handleDelete = (video: VideoData) => {
    setVideoToDelete(video)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!videoToDelete) return

    try {
      setUploading(true)

      // Delete from local storage
      const success = deleteVideoMetadata(videoToDelete.id)
      if (!success) {
        throw new Error("Failed to delete video")
      }

      // Filter out the video to delete
      setVideos((prev) => prev.filter((video) => video.id !== videoToDelete.id))

      // Update storage usage
      updateStorageUsage()

      setMessage({
        type: "success",
        text: "Video deleted successfully!",
      })
    } catch (error) {
      console.error("Error deleting video:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "An error occurred while deleting the video.",
      })
    } finally {
      setUploading(false)
      setIsDeleteDialogOpen(false)
      setVideoToDelete(null)
    }
  }

  const saveEditedVideo = async () => {
    if (!editingVideo) return

    try {
      setUploading(true)
      setUploadProgress(0)

      // Validate Google Drive URLs
      if (
        editingVideo.category !== "youtube" &&
        editingVideo.videoUrl &&
        !extractGoogleDriveFileId(editingVideo.videoUrl)
      ) {
        throw new Error("Invalid Google Drive video URL. Please provide a valid sharing link.")
      }

      // If we have a file but no base64 (too large), require a URL
      if (editThumbnailFile && !editingVideo.thumbnailBase64 && !editingVideo.thumbnailUrl) {
        throw new Error(
          "The image is too large for local storage. Please provide a Google Drive URL for the thumbnail.",
        )
      }

      // Simulate upload progress
      setUploadProgress(50)

      // Create an updated video object
      const updatedVideo: VideoData = {
        ...editingVideo,
        title: editingVideo.title,
        description: editingVideo.description,
        duration: editingVideo.duration,
        resolution: editingVideo.resolution,
        category: editingVideo.category,
        thumbnailUrl: editingVideo.thumbnailUrl,
        ...(editingVideo.thumbnailBase64 ? { thumbnailBase64: editingVideo.thumbnailBase64 } : {}),
        ...(editingVideo.category !== "youtube" && editingVideo.videoUrl ? { videoUrl: editingVideo.videoUrl } : {}),
        ...(editingVideo.category === "youtube" && editingVideo.youtubeId ? { youtubeId: editingVideo.youtubeId } : {}),
      }

      // Remove temporary properties
      delete updatedVideo.thumbnailPreview

      // Update in local storage
      try {
        const updated = updateVideoMetadata(editingVideo.id, updatedVideo)
        if (!updated) {
          throw new Error("Failed to update video metadata")
        }

        setUploadProgress(100)

        // Update the videos array
        setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))

        // Update storage usage
        updateStorageUsage()

        // Show success message
        setMessage({
          type: "success",
          text: "Video updated successfully!",
        })

        // Close the dialog
        setIsEditDialogOpen(false)
        setEditingVideo(null)
        setEditThumbnailFile(null)
      } catch (error) {
        if (error instanceof Error) {
          // If it's a storage quota error, show a specific message
          if (error.message.includes("quota") || error.message.includes("too large")) {
            setMessage({
              type: "warning",
              text: error.message + " Consider clearing old videos to free up space.",
            })

            // Try to update without the base64 data
            const fallbackVideo = {
              ...updatedVideo,
              thumbnailBase64: undefined,
            }

            if (!fallbackVideo.thumbnailUrl && editThumbnailFile) {
              // If we have a file but no URL, we need to get a URL
              setMessage({
                type: "error",
                text: "Storage quota exceeded. Please provide a Google Drive URL for the thumbnail or clear old videos.",
              })
              throw error
            }

            // Try to update without base64
            const updated = updateVideoMetadata(editingVideo.id, fallbackVideo)
            if (updated) {
              setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))

              // Update storage usage
              updateStorageUsage()

              // Close the dialog
              setIsEditDialogOpen(false)
              setEditingVideo(null)
              setEditThumbnailFile(null)
            } else {
              throw new Error("Failed to update video metadata")
            }
          } else {
            throw error
          }
        } else {
          throw error
        }
      }
    } catch (error) {
      console.error("Error updating video:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "An error occurred. Please try again.",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClearStorage = () => {
    setIsClearStorageDialogOpen(true)
  }

  const confirmClearStorage = () => {
    try {
      // Keep only the 10 most recent videos
      const cleared = clearOldVideos(10)

      if (cleared) {
        // Reload videos
        loadVideos()

        // Update storage usage
        updateStorageUsage()

        setMessage({
          type: "success",
          text: "Storage cleared successfully! Only the 10 most recent videos have been kept.",
        })
      } else {
        setMessage({
          type: "info",
          text: "No videos were cleared. You have 10 or fewer videos.",
        })
      }
    } catch (error) {
      console.error("Error clearing storage:", error)
      setMessage({
        type: "error",
        text: "An error occurred while clearing storage.",
      })
    } finally {
      setIsClearStorageDialogOpen(false)
    }
  }

  const openGoogleDriveFolder = (type: "thumbnail" | "video") => {
    const url = getGoogleDriveFolderUrl(type)
    window.open(url, "_blank")
  }

  const openVideoInNewTab = (url: string) => {
    if (!url) return
    window.open(getGoogleDriveViewUrl(url), "_blank")
  }

  const triggerThumbnailFileInput = () => {
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.click()
    }
  }

  const triggerEditThumbnailFileInput = () => {
    if (editThumbnailInputRef.current) {
      editThumbnailInputRef.current.click()
    }
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Video Management Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsHelpDialogOpen(true)}>
              <Info className="h-4 w-4 mr-2" />
              Help
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile-images">Manage Profile Images</Link>
            </Button>
            <LogoutButton />
          </div>
        </div>

        {/* Storage Usage Indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Storage Usage: {storageUsage.percentage}%</span>
            <Button variant="outline" size="sm" onClick={handleClearStorage} className="text-xs">
              Clear Old Videos
            </Button>
          </div>
          <Progress
            value={storageUsage.percentage}
            className="h-2"
            // Add color based on usage
            style={{
              background:
                storageUsage.percentage > 90
                  ? "rgba(239, 68, 68, 0.2)"
                  : storageUsage.percentage > 70
                    ? "rgba(245, 158, 11, 0.2)"
                    : "rgba(16, 185, 129, 0.2)",
            }}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(storageUsage.used / 1024)} KB used of approximately {Math.round(storageUsage.total / 1024)} KB
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === "success"
                ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                : message.type === "warning"
                  ? "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                  : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
            }`}
          >
            {message.type === "warning" && <AlertTriangle className="h-4 w-4 inline-block mr-2" />}
            {message.text}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="upload">Upload New Video</TabsTrigger>
            <TabsTrigger value="manage">Manage Videos</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Add New Video</CardTitle>
                <CardDescription>Add videos from Google Drive or YouTube to your portfolio.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">
                      Video Title
                    </label>
                    <Input id="title" name="title" value={videoData.title} onChange={handleChange} required />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      className="w-full p-2 rounded-md border bg-background min-h-[100px]"
                      value={videoData.description}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="duration" className="text-sm font-medium">
                        Duration
                      </label>
                      <Input
                        id="duration"
                        name="duration"
                        placeholder="e.g. 12:45"
                        value={videoData.duration}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="resolution" className="text-sm font-medium">
                        Resolution
                      </label>
                      <Input
                        id="resolution"
                        name="resolution"
                        placeholder="e.g. 4K"
                        value={videoData.resolution}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium">
                      Category
                    </label>
                    <Select value={videoData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="documentary">Documentary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {videoData.category === "youtube" ? (
                    <div className="space-y-2">
                      <label htmlFor="youtubeId" className="text-sm font-medium">
                        YouTube Video ID
                      </label>
                      <div className="flex gap-2">
                        <Input
                          id="youtubeId"
                          name="youtubeId"
                          placeholder="e.g. dQw4w9WgXcQ"
                          value={videoData.youtubeId}
                          onChange={handleChange}
                          required={videoData.category === "youtube"}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => window.open("https://www.youtube.com", "_blank")}
                          title="Open YouTube"
                        >
                          <Youtube size={18} />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        The ID is the part after "v=" in a YouTube URL (e.g., youtube.com/watch?v=dQw4w9WgXcQ)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label htmlFor="videoUrl" className="text-sm font-medium">
                        Google Drive Video URL
                      </label>
                      <div className="flex gap-2">
                        <Input
                          id="videoUrl"
                          name="videoUrl"
                          placeholder="https://drive.google.com/file/d/..."
                          value={videoData.videoUrl}
                          onChange={handleChange}
                          required={videoData.category !== "youtube"}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => openGoogleDriveFolder("video")}
                          title="Open Google Drive Videos Folder"
                        >
                          <ExternalLink size={18} />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Paste the Google Drive sharing link for your video
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Thumbnail Image</label>

                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={thumbnailInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleThumbnailFileChange}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Button type="button" variant="outline" onClick={triggerThumbnailFileInput} className="w-full">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Thumbnail
                        </Button>
                        {thumbnailFile && (
                          <p className="text-xs text-muted-foreground mt-2">Selected: {thumbnailFile.name}</p>
                        )}
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>- OR -</span>
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="thumbnailUrl" className="text-sm font-medium">
                          Google Drive Thumbnail URL
                        </label>
                        <div className="flex gap-2">
                          <Input
                            id="thumbnailUrl"
                            name="thumbnailUrl"
                            placeholder="https://drive.google.com/file/d/..."
                            value={videoData.thumbnailUrl}
                            onChange={handleChange}
                            disabled={!!thumbnailBase64}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => openGoogleDriveFolder("thumbnail")}
                            title="Open Google Drive Thumbnails Folder"
                            disabled={!!thumbnailBase64}
                          >
                            <ExternalLink size={18} />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Paste the Google Drive sharing link for your thumbnail image
                        </p>
                      </div>
                    </div>

                    {thumbnailPreview && (
                      <div className="relative aspect-video w-full max-w-md mx-auto border rounded-md overflow-hidden mt-4">
                        <img
                          src={thumbnailPreview || "/placeholder.svg"}
                          alt="Thumbnail preview"
                          className="object-cover w-full h-full"
                        />
                        {thumbnailBase64 && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-500">Local Upload</Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  <Button type="submit" disabled={uploading} className="w-full">
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Video
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>Manage Existing Videos</CardTitle>
                <CardDescription>Edit or delete your uploaded videos.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading videos...</span>
                  </div>
                ) : videos.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No videos found. Add your first video!</p>
                    <Button onClick={() => setActiveTab("upload")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Video
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {videos.map((video) => (
                      <div key={video.id} className="border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="relative aspect-video">
                            {video.thumbnailBase64 || isBase64Image(video.thumbnailUrl) ? (
                              <img
                                src={video.thumbnailBase64 || video.thumbnailUrl}
                                alt={video.title}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <img
                                src={video.thumbnailUrl || "/placeholder.svg?height=400&width=600"}
                                alt={video.title}
                                className="object-cover w-full h-full"
                              />
                            )}
                            <Badge className="absolute top-2 right-2">{video.category}</Badge>
                            {(video.thumbnailBase64 || isBase64Image(video.thumbnailUrl)) && (
                              <Badge className="absolute top-2 left-2 bg-green-500">Local Upload</Badge>
                            )}
                          </div>
                          <div className="p-4 md:col-span-2">
                            <h3 className="text-lg font-bold mb-2">{video.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{video.description}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                              <span>Duration: {video.duration}</span>
                              <span>Resolution: {video.resolution}</span>
                              <span>Added: {new Date(video.dateAdded).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(video)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(video)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                              {video.videoUrl && (
                                <Button variant="outline" size="sm" onClick={() => openVideoInNewTab(video.videoUrl!)}>
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Open Video
                                </Button>
                              )}
                              {video.youtubeId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, "_blank")
                                  }
                                >
                                  <Youtube className="mr-2 h-4 w-4" />
                                  Open on YouTube
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Video Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
          </DialogHeader>
          {editingVideo && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-title" className="text-sm font-medium">
                  Video Title
                </label>
                <Input id="edit-title" name="title" value={editingVideo.title} onChange={handleEditChange} required />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-description" className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  className="w-full p-2 rounded-md border bg-background min-h-[100px]"
                  value={editingVideo.description}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-duration" className="text-sm font-medium">
                    Duration
                  </label>
                  <Input
                    id="edit-duration"
                    name="duration"
                    value={editingVideo.duration}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-resolution" className="text-sm font-medium">
                    Resolution
                  </label>
                  <Input
                    id="edit-resolution"
                    name="resolution"
                    value={editingVideo.resolution}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-category" className="text-sm font-medium">
                  Category
                </label>
                <Select
                  value={editingVideo.category}
                  onValueChange={(value) => handleEditSelectChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="documentary">Documentary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingVideo.category === "youtube" ? (
                <div className="space-y-2">
                  <label htmlFor="edit-youtubeId" className="text-sm font-medium">
                    YouTube Video ID
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-youtubeId"
                      name="youtubeId"
                      placeholder="e.g. dQw4w9WgXcQ"
                      value={editingVideo.youtubeId || ""}
                      onChange={handleEditChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => window.open("https://www.youtube.com", "_blank")}
                      title="Open YouTube"
                    >
                      <Youtube size={18} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">The ID is the part after "v=" in a YouTube URL</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="edit-videoUrl" className="text-sm font-medium">
                    Google Drive Video URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-videoUrl"
                      name="videoUrl"
                      placeholder="https://drive.google.com/file/d/..."
                      value={editingVideo.videoUrl || ""}
                      onChange={handleEditChange}
                      required={editingVideo.category !== "youtube"}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => openGoogleDriveFolder("video")}
                      title="Open Google Drive Videos Folder"
                    >
                      <ExternalLink size={18} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Paste the Google Drive sharing link for your video</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Thumbnail Image</label>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={editThumbnailInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleEditThumbnailFileChange}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Button type="button" variant="outline" onClick={triggerEditThumbnailFileInput} className="w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload New Thumbnail
                    </Button>
                    {editThumbnailFile && (
                      <p className="text-xs text-muted-foreground mt-2">Selected: {editThumbnailFile.name}</p>
                    )}
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>- OR -</span>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="edit-thumbnailUrl" className="text-sm font-medium">
                      Google Drive Thumbnail URL
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="edit-thumbnailUrl"
                        name="thumbnailUrl"
                        placeholder="https://drive.google.com/file/d/..."
                        value={editingVideo.thumbnailUrl}
                        onChange={handleEditChange}
                        disabled={!!editingVideo.thumbnailBase64}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => openGoogleDriveFolder("thumbnail")}
                        title="Open Google Drive Thumbnails Folder"
                        disabled={!!editingVideo.thumbnailBase64}
                      >
                        <ExternalLink size={18} />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Paste the Google Drive sharing link for your thumbnail image
                    </p>
                  </div>
                </div>

                {editingVideo.thumbnailPreview && (
                  <div className="relative aspect-video w-full max-w-md mx-auto border rounded-md overflow-hidden mt-4">
                    <img
                      src={editingVideo.thumbnailPreview || "/placeholder.svg"}
                      alt="Thumbnail preview"
                      className="object-cover w-full h-full"
                    />
                    {editingVideo.thumbnailBase64 && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500">Local Upload</Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={uploading}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={saveEditedVideo} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete the video "{videoToDelete?.title}"? This action cannot be undone.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently remove the video metadata from your portfolio.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Storage Dialog */}
      <Dialog open={isClearStorageDialogOpen} onOpenChange={setIsClearStorageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Clear Storage</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>This will keep only the 10 most recent videos and delete all older videos to free up storage space.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This action cannot be undone. Are you sure you want to proceed?
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmClearStorage}>
              Clear Storage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>How to Add Videos to Your Portfolio</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <h3 className="font-medium text-lg">Storage Limitations</h3>
            <p>Your browser has limited storage space (typically 5-10MB). When uploading images:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Images are automatically resized to save space</li>
              <li>Very large images will be rejected and you'll need to use Google Drive URLs instead</li>
              <li>If you hit storage limits, use the "Clear Old Videos" button to free up space</li>
            </ul>

            <h3 className="font-medium text-lg">Adding Thumbnail Images</h3>
            <p>You have two options for adding thumbnail images:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>Upload from your device</strong> - Click "Upload Thumbnail" to select an image from your
                computer
              </li>
              <li>
                <strong>Use Google Drive URL</strong> - Paste a Google Drive sharing link for your image
              </li>
            </ol>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md text-amber-800 dark:text-amber-300">
              <h4 className="font-medium">Recommended Approach</h4>
              <p className="text-sm mt-1">
                For small images (under 1MB), upload directly from your device. For larger images, use Google Drive
                URLs.
              </p>
            </div>

            <h3 className="font-medium text-lg mt-6">How Videos Work</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Videos are not embedded directly - they open in a new tab when clicked</li>
              <li>YouTube videos will open on YouTube.com</li>
              <li>Google Drive videos will open in Google Drive's viewer</li>
              <li>This approach ensures maximum compatibility across all devices</li>
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHelpDialogOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

