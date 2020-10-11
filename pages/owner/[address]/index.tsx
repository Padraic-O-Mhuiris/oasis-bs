import { useAppContext } from 'components/AppContextProvider'
import { useObservable } from 'helpers/observableHook'
import Link from 'next/link'
import React from 'react'
import { Grid, Text } from 'theme-ui'

export default function Overview() {
  const { account$, address$, isReadOnlyMode$ } = useAppContext()
  const account = useObservable(account$)
  const address = useObservable(address$)
  const isReadOnlyMode = useObservable(isReadOnlyMode$)

  return (
    <Grid>
      <Text>isReadonlyMode: {isReadOnlyMode ? 'true' : 'false'}</Text>

      <Text>NetworkAddress: {address}</Text>
      <Text>AccountAddress: {account}</Text>

      <Link href="/1">1</Link>
      <Link href="/connect">Connect</Link>
      <Link href="/owner/0x87e76b0a50efc20259cafE0530f75aE0e816aaF1">
        0x87e76b0a50efc20259cafe0530f75ae0e816aaf1
      </Link>
      <Link href="/owner/0x87e76b0a50efc20259cafE0530f75aE0e816aaF2">
        0x87e76b0a50efc20259cafe0530f75ae0e816aaf2
      </Link>
    </Grid>
  )
}
