import Link from 'next/link'
import React from 'react'
import { Box, Button } from 'theme-ui'

export default function LandingPage() {
  return (
    <Box sx={{ width: '100%' }}>
      <Link href={'/connect'}>
        <Button>Connect</Button>
      </Link>
    </Box>
  )
}
