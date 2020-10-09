import { AppLink } from 'components/Links'
import React from 'react'
import { Grid, Text } from 'theme-ui'
import { useAppContext } from 'components/AppContextProvider'
import { useObservable } from 'helpers/observableHook'

export default function Overview() {
  const { account$, address$ } = useAppContext()
  const account = useObservable(account$)
  const address = useObservable(address$)
  return (
    <Grid>
      <Text>NetworkAddress: {address}</Text>
      {account ? <Text>AccountAddress: {account}</Text> : null}
      <AppLink href="/1">1</AppLink>
    </Grid>
  )
}
