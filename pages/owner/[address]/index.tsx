import React from 'react'
import { Grid, Text } from 'theme-ui'
import { useAppContext } from 'components/AppContextProvider'
import { useObservable } from 'helpers/observableHook'
import Link from 'next/link'

function Account({ account }: { account: string | undefined }) {
  if (account) {
    return <Text>{account}</Text>
  }
  return null
}

export default function Overview() {
  const { account$, address$ } = useAppContext()
  const account = useObservable(account$)
  const address = useObservable(address$)

  return (
    <Grid>
      <Text>NetworkAddress: {address}</Text>
      <Account account={account} />
      <Link href="/1">1</Link>
      <Link href="/owner/0x87e76b0a50efc20259cafE0530f75aE0e816aaF1">
        0x87e76b0a50efc20259cafe0530f75ae0e816aaf1
      </Link>
      <Link href="/owner/0x87e76b0a50efc20259cafE0530f75aE0e816aaF2">
        0x87e76b0a50efc20259cafe0530f75ae0e816aaf2
      </Link>
    </Grid>
  )
}
