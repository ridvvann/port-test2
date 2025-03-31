"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ForceRefresh() {
  const router = useRouter()

  useEffect(() => {
    // Force a hard refresh to clear any cached data
    router.refresh()
  }, [router])

  return null
}

