"use client"

import type React from "react"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Maximize2, ExternalLink } from "lucide-react"
import { useState } from "react"
import { getGoogleDriveViewUrl, isBase64Image } from "@/lib/google-drive-storage"

interface VideoCardProps {
  title: string
  description: string
  duration: string
  resolution: string
  thumbnailUrl: string
  thumbnailBase64?: string
  videoUrl?: string
  youtubeId?: string
}

export function VideoCard({
  title,
  description,
  duration,
  resolution,
  thumbnailUrl,
  thumbnailBase64,
  videoUrl,
  youtubeId,
}: VideoCardProps) {
  const [imageError, setImageError] = useState(false)

  // Determine the thumbnail source
  const thumbnailSrc = thumbnailBase64 || (isBase64Image(thumbnailUrl) ? thumbnailUrl : null) || thumbnailUrl

  // Handle video click
  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault()

    if (youtubeId) {
      // Open YouTube video in a new tab
      window.open(`https://www.youtube.com/watch?v=${youtubeId}`, "_blank")
    } else if (videoUrl) {
      // Open Google Drive video in a new tab
      window.open(getGoogleDriveViewUrl(videoUrl), "_blank")
    }
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md cursor-pointer group" onClick={handleVideoClick}>
      <div className="relative aspect-video">
        {isBase64Image(thumbnailSrc) ? (
          // Render base64 image directly
          <img
            src={imageError ? "/placeholder.svg?height=400&width=600" : thumbnailSrc}
            alt={title}
            className="object-cover w-full h-full"
            onError={() => setImageError(true)}
          />
        ) : (
          // Use Next.js Image for external URLs
          <Image
            src={imageError ? "/placeholder.svg?height=400&width=600" : thumbnailSrc}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
            unoptimized={true}
          />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="rounded-full bg-primary/90 p-3 transform scale-90 group-hover:scale-100 transition-transform">
            <ExternalLink className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-3">{description}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize2 size={14} />
            <span>{resolution}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

