import { isAppContextAvailable } from 'components/AppContextProvider'
import { WithConnection } from 'components/connectWallet/ConnectWallet'
import { WithChildren } from 'helpers/types'
import React from 'react'
import { Container, Flex } from 'theme-ui'

export function BasicLayout({ children }: WithChildren) {
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        minHeight: '100%',
      }}
    >
      <Container>
        <Flex sx={{ width: '100%', height: '100%' }}>{children}</Flex>
      </Container>
    </Flex>
  )
}

export function AppLayout({ children }: WithChildren) {
  if (!isAppContextAvailable()) {
    return null
  }
  return <BasicLayout>{children}</BasicLayout>
}
