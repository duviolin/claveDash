import { useState } from 'react'
import type { AxiosError } from 'axios'
import type { DeactivationErrorDetails } from '@/types'

interface BlockedInfo {
  name: string
  slug: string
  details: DeactivationErrorDetails
}

export function useDeactivationBlockedHandler() {
  const [blockedInfo, setBlockedInfo] = useState<BlockedInfo | null>(null)

  const handleBlockedError = (
    error: unknown,
    entity: { name: string; slug: string }
  ) => {
    const err = error as AxiosError<{ details?: DeactivationErrorDetails }>

    if (err.response?.status === 409 && err.response.data?.details) {
      setBlockedInfo({
        name: entity.name,
        slug: entity.slug,
        details: err.response.data.details,
      })
      return true
    }

    return false
  }

  return {
    blockedInfo,
    setBlockedInfo,
    handleBlockedError,
  }
}
