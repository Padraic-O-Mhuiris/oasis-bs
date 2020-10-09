import { useRouter } from 'next/router'
import React from 'react'
import { useAppContext } from 'components/AppContextProvider'
import { Box, Grid, Text } from 'theme-ui'
import { useObservable } from 'helpers/observableHook'

export default function Vault() {
  const { account$, address$, isReadOnlyMode$ } = useAppContext()
  const account = useObservable(account$)
  const address = useObservable(address$)
  const isReadOnlyMode = useObservable(isReadOnlyMode$)

  const router = useRouter()
  const { id } = router.query

  return (
    <Grid>
      <Box>Vault: {id}</Box>
      <Box>
        <Text>Readonly: {isReadOnlyMode ? 'true' : 'false'}</Text>
        <Text>Account: {account}</Text>
        <Text>Address: {address}</Text>
      </Box>
    </Grid>
  )
}
