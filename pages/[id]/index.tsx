import { useRouter } from 'next/router'
import React from 'react'

export default function Vault() {
  const router = useRouter()
  const { id } = router.query
  return <p>{id}</p>
}
