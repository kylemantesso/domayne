'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function DomainSSRPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const domain = params.slug as string

  useEffect(() => {
    // Redirect to the download route for display (without download header)
    const urlParams = new URLSearchParams(searchParams.toString())
    const redirectUrl = `/download/${encodeURIComponent(domain)}?${urlParams.toString()}`
    window.location.replace(redirectUrl)
  }, [domain, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading {domain}...</p>
      </div>
    </div>
  )
}