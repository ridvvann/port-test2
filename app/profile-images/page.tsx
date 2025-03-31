"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"
import { ExternalLink, Info, Upload, AlertTriangle } from "lucide-react"
import { getGoogleDriveFolderUrl, isBase64Image, fileToBase64, getStorageUsage } from "@/lib/google-drive-storage"
import { Badge } from "@/components/ui/badge"

export default function ProfileImagesPage() {
  // Initialize with null instead of accessing localStorage directly
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [aboutImage, setAboutImage] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null)
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false)
  const [isClearStorageDialogOpen, setIsClearStorageDialogOpen] = useState(false)
  const [heroImageInput, setHeroImageInput] = useState<string>("")
  const [aboutImageInput, setAboutImageInput] = useState<string>("")
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null)
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0, percentage: 0 })

  const heroImageInputRef = useRef<HTMLInputElement>(null)
  const aboutImageInputRef = useRef<HTMLInputElement>(null)

  // Load images from localStorage only on the client side
  useEffect(() => {
    // Check if window is defined (client side)
    if (typeof window !== "undefined") {
      const storedHeroImage = localStorage.getItem("profile_hero_image")
      const storedAboutImage = localStorage.getItem("profile_about_image")

      if (storedHeroImage) {
        setHeroImage(storedHeroImage)
        setHeroImageInput(storedHeroImage)
      }

      if (storedAboutImage) {
        setAboutImage(storedAboutImage)
        setAboutImageInput(storedAboutImage)
      }

      // Update storage usage
      updateStorageUsage()
    }
  }, [])

  // Update storage usage stats
  const updateStorageUsage = () => {
    const usage = getStorageUsage()
    setStorageUsage(usage)
  }

  const handleHeroImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setHeroImageFile(file)

    try {
      // Show warning if file is large
      if (file.size > 1024 * 1024) {
        // 1MB
        setMessage({
          type: "warning",
          text: "Large image detected. The image will be resized to save storage space.",
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
        return
      }

      setHeroImageInput(base64)
      setHeroImage(base64)

      // Save to localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("profile_hero_image", base64)

          // Update storage usage
          updateStorageUsage()

          setMessage({
            type: "success",
            text: "Hero image uploaded and saved successfully!",
          })
        } catch (error) {
          console.error("Error saving to localStorage:", error)
          setMessage({
            type: "error",
            text: "Failed to save image. Storage quota exceeded. Try clearing old data.",
          })
        }
      }
    } catch (error) {
      console.error("Error converting file to base64:", error)
      setMessage({
        type: "error",
        text: "Failed to process the hero image.",
      })
    }
  }

  const handleAboutImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setAboutImageFile(file)

    try {
      // Show warning if file is large
      if (file.size > 1024 * 1024) {
        // 1MB
        setMessage({
          type: "warning",
          text: "Large image detected. The image will be resized to save storage space.",
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
        return
      }

      setAboutImageInput(base64)
      setAboutImage(base64)

      // Save to localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("profile_about_image", base64)

          // Update storage usage
          updateStorageUsage()

          setMessage({
            type: "success",
            text: "About image uploaded and saved successfully!",
          })
        } catch (error) {
          console.error("Error saving to localStorage:", error)
          setMessage({
            type: "error",
            text: "Failed to save image. Storage quota exceeded. Try clearing old data.",
          })
        }
      }
    } catch (error) {
      console.error("Error converting file to base64:", error)
      setMessage({
        type: "error",
        text: "Failed to process the about image.",
      })
    }
  }

  const handleHeroImageSave = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("profile_hero_image", heroImageInput)

        // Update storage usage
        updateStorageUsage()
      }

      setHeroImage(heroImageInput)
      setMessage({ type: "success", text: "Hero image URL saved successfully!" })
    } catch (error) {
      console.error("Error saving hero image:", error)
      setMessage({ type: "error", text: "Failed to save hero image URL. Please check the format." })
    }
  }

  const handleAboutImageSave = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("profile_about_image", aboutImageInput)

        // Update storage usage
        updateStorageUsage()
      }

      setAboutImage(aboutImageInput)
      setMessage({ type: "success", text: "About image URL saved successfully!" })
    } catch (error) {
      console.error("Error saving about image:", error)
      setMessage({ type: "error", text: "Failed to save about image URL. Please check the format." })
    }
  }

  const handleClearStorage = () => {
    setIsClearStorageDialogOpen(true)
  }

  const confirmClearStorage = () => {
    try {
      // Clear videos data but keep profile images
      const heroImg = localStorage.getItem("profile_hero_image")
      const aboutImg = localStorage.getItem("profile_about_image")

      // Clear all localStorage
      localStorage.clear()

      // Restore profile images
      if (heroImg) localStorage.setItem("profile_hero_image", heroImg)
      if (aboutImg) localStorage.setItem("profile_about_image", aboutImg)

      // Update storage usage
      updateStorageUsage()

      setMessage({
        type: "success",
        text: "Storage cleared successfully! All videos have been removed but profile images are kept.",
      })
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

  const openGoogleDriveFolder = () => {
    const url = getGoogleDriveFolderUrl("thumbnail")
    window.open(url, "_blank")
  }

  const triggerHeroImageFileInput = () => {
    if (heroImageInputRef.current) {
      heroImageInputRef.current.click()
    }
  }

  const triggerAboutImageFileInput = () => {
    if (aboutImageInputRef.current) {
      aboutImageInputRef.current.click()
    }
  }

  const isHeroImageBase64 = heroImage && isBase64Image(heroImage)
  const isAboutImageBase64 = aboutImage && isBase64Image(aboutImage)

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Profile Images</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClearStorage}>
              Clear Storage
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsHelpDialogOpen(true)}>
              <Info className="h-4 w-4 mr-2" />
              Help
            </Button>
          </div>
        </div>

        {/* Storage Usage Indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Storage Usage: {storageUsage.percentage}%</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Hero Image Card */}
          <Card>
            <CardHeader>
              <CardTitle>Hero Image</CardTitle>
              <CardDescription>This image appears on the home page hero section</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square w-full relative mb-4 border rounded-md overflow-hidden">
                {heroImage ? (
                  isHeroImageBase64 ? (
                    <img
                      src={heroImage || "/placeholder.svg"}
                      alt="Hero preview"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Image
                      src={heroImage || "/placeholder.svg"}
                      alt="Hero preview"
                      fill
                      className="object-cover"
                      unoptimized={true}
                      onError={() => {
                        setMessage({
                          type: "error",
                          text: "Error loading hero image. Please check the URL and make sure the file is accessible.",
                        })
                      }}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <p className="text-muted-foreground">No image provided</p>
                  </div>
                )}
                {isHeroImageBase64 && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500">Local Upload</Badge>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={heroImageInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleHeroImageFileChange}
              />

              <div className="space-y-4">
                <Button type="button" variant="outline" onClick={triggerHeroImageFileInput} className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Hero Image
                </Button>

                {heroImageFile && <p className="text-xs text-muted-foreground">Selected: {heroImageFile.name}</p>}

                <div className="flex items-center justify-center">
                  <div className="border-t w-full"></div>
                  <span className="px-4 text-sm text-muted-foreground">OR</span>
                  <div className="border-t w-full"></div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="hero-image-url" className="text-sm font-medium">
                    Google Drive Image URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="hero-image-url"
                      type="text"
                      placeholder="https://drive.google.com/file/d/..."
                      value={isBase64Image(heroImageInput) ? "Image embedded in HTML" : heroImageInput}
                      onChange={(e) => setHeroImageInput(e.target.value)}
                      disabled={isBase64Image(heroImageInput)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={openGoogleDriveFolder}
                      title="Open Google Drive Thumbnails Folder"
                      disabled={isBase64Image(heroImageInput)}
                    >
                      <ExternalLink size={18} />
                    </Button>
                  </div>
                  <Button
                    onClick={handleHeroImageSave}
                    className="w-full mt-2"
                    disabled={!heroImageInput || isBase64Image(heroImageInput)}
                  >
                    Save Image URL
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">Recommended size: 600x600 pixels (square)</p>
            </CardFooter>
          </Card>

          {/* About Image Card */}
          <Card>
            <CardHeader>
              <CardTitle>About Image</CardTitle>
              <CardDescription>This image appears in the About section</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full relative mb-4 border rounded-md overflow-hidden">
                {aboutImage ? (
                  isAboutImageBase64 ? (
                    <img
                      src={aboutImage || "/placeholder.svg"}
                      alt="About preview"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Image
                      src={aboutImage || "/placeholder.svg"}
                      alt="About preview"
                      fill
                      className="object-cover"
                      unoptimized={true}
                      onError={() => {
                        setMessage({
                          type: "error",
                          text: "Error loading about image. Please check the URL and make sure the file is accessible.",
                        })
                      }}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <p className="text-muted-foreground">No image provided</p>
                  </div>
                )}
                {isAboutImageBase64 && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500">Local Upload</Badge>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={aboutImageInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAboutImageFileChange}
              />

              <div className="space-y-4">
                <Button type="button" variant="outline" onClick={triggerAboutImageFileInput} className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload About Image
                </Button>

                {aboutImageFile && <p className="text-xs text-muted-foreground">Selected: {aboutImageFile.name}</p>}

                <div className="flex items-center justify-center">
                  <div className="border-t w-full"></div>
                  <span className="px-4 text-sm text-muted-foreground">OR</span>
                  <div className="border-t w-full"></div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="about-image-url" className="text-sm font-medium">
                    Google Drive Image URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="about-image-url"
                      type="text"
                      placeholder="https://drive.google.com/file/d/..."
                      value={isBase64Image(aboutImageInput) ? "Image embedded in HTML" : aboutImageInput}
                      onChange={(e) => setAboutImageInput(e.target.value)}
                      disabled={isBase64Image(aboutImageInput)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={openGoogleDriveFolder}
                      title="Open Google Drive Thumbnails Folder"
                      disabled={isBase64Image(aboutImageInput)}
                    >
                      <ExternalLink size={18} />
                    </Button>
                  </div>
                  <Button
                    onClick={handleAboutImageSave}
                    className="w-full mt-2"
                    disabled={!aboutImageInput || isBase64Image(aboutImageInput)}
                  >
                    Save Image URL
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">Recommended size: 1280x720 pixels (16:9 aspect ratio)</p>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button asChild>
            <a href="/">Go to Home Page</a>
          </Button>
        </div>
      </div>

      {/* Help Dialog */}
      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>How to Use Images in Your Portfolio</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <h3 className="font-medium text-lg">Storage Limitations</h3>
            <p>Your browser has limited storage space (typically 5-10MB). When uploading images:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Images are automatically resized to save space</li>
              <li>Very large images will be rejected and you'll need to use Google Drive URLs instead</li>
              <li>If you hit storage limits, use the "Clear Storage" button to free up space</li>
            </ul>

            <h3 className="font-medium text-lg">Two Ways to Add Images</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>Upload from your device</strong> - Click "Upload Hero Image" or "Upload About Image" to select
                an image from your computer
              </li>
              <li>
                <strong>Use Google Drive URL</strong> - Paste a Google Drive sharing link and click "Save Image URL"
              </li>
            </ol>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md text-amber-800 dark:text-amber-300">
              <h4 className="font-medium">Recommended Approach</h4>
              <p className="text-sm mt-1">
                For small images (under 1MB), upload directly from your device. For larger images, use Google Drive
                URLs.
              </p>
            </div>

            <h3 className="font-medium text-lg mt-6">Image Recommendations</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Hero Image:</strong> 600x600 pixels (square) for best results
              </li>
              <li>
                <strong>About Image:</strong> 1280x720 pixels (16:9 aspect ratio) for best results
              </li>
              <li>Use high-quality images with good lighting and composition</li>
              <li>Smaller file sizes will load faster on your website</li>
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHelpDialogOpen(false)}>Got it</Button>
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
            <p>This will remove all videos from storage to free up space, but keep your profile images.</p>
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
    </div>
  )
}

