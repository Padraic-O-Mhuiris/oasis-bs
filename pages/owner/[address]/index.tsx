import { useRouter } from 'next/router'
import React from 'react'

export default function Overview() {
  const router = useRouter()
  const { address } = router.query

  return <p>{address}</p>
}
