import { AppLink } from 'components/Links'
import { useRouter } from 'next/router'
import React from 'react'
import { Grid, Text } from 'theme-ui'

export default function Overview() {
  const router = useRouter()
  const { address } = router.query

  return (
    <Grid>
      <Text>{address}</Text>
      <AppLink href="/1">1</AppLink>
      <AppLink href="/0x87e76b0a50efc20259cafE0530f75aE0e816aaF1">
        0x87e76b0a50efc20259cafE0530f75aE0e816aaF1
      </AppLink>
    </Grid>
  )
}
