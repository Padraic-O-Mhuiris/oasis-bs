import { storiesOf } from '@storybook/react'
import { AppContext } from 'components/AppContext'
import { appContext, isAppContextAvailable } from 'components/AppContextProvider'
import { TxState } from 'components/blockchain/transactions'
import { Web3Context } from 'components/blockchain/web3Context'
import { OnrampOrder } from 'components/dashboard/onrampOrders'
import { createTransactionManager } from 'components/transactionManager/transactionManager'
import {
  protoPendingTx,
  protoSuccessTx,
} from 'components/transactionManager/TransactionManager.stories'
import { ModalProvider } from 'helpers/modalHook'
import { WithChildren } from 'helpers/types'
import React from 'react'
import { of } from 'rxjs'
import { Container, Heading } from 'theme-ui'
import Web3 from 'web3'

import { TxData } from '../AppContext'
import { AppHeader } from '../Header'

interface MockContextProviderProps extends WithChildren {
  web3Context: Web3Context
  title: string
  transactions?: TxState<TxData>[]
  onrampOrders?: OnrampOrder[]
}

const stories = storiesOf('Account in Header', module)

const protoWeb3Context: Web3Context = {
  chainId: 42,
  status: 'connected',
  deactivate: () => null,
  account: '0xdA1810f583320Bd25BD30130fD5Db06591bEf915',
  connectionKind: 'injected',
  web3: {} as Web3,
}

const StoryContainer = ({ children, title }: { title: string } & WithChildren) => {
  if (!isAppContextAvailable()) return null

  return (
    <Container variant="appContainer">
      <Heading variant="smallHeading" sx={{ mt: 5, mb: 3, textAlign: 'right' }}>
        {title}
      </Heading>
      {children}
    </Container>
  )
}

function MockContextProvider({
  children,
  title,
  web3Context,
  transactions = [],
  onrampOrders = [],
}: MockContextProviderProps) {
  const ctx = ({
    web3Context$: of(web3Context),
    transactionManager$: createTransactionManager(of(transactions), of(onrampOrders)),
    context$: of({
      etherscan: { url: 'etherscan' },
    }),
  } as any) as AppContext

  return (
    <appContext.Provider value={ctx as any}>
      <ModalProvider>
        <StoryContainer {...{ title }}>{children}</StoryContainer>
      </ModalProvider>
    </appContext.Provider>
  )
}

stories.add('Connected', () => {
  return (
    <MockContextProvider title="Connected Metamask Kovan" web3Context={protoWeb3Context}>
      <AppHeader />
    </MockContextProvider>
  )
})

stories.add('WalletConnect Kovan', () => {
  return (
    <MockContextProvider
      title="Connected WalletConnect Kovan"
      web3Context={{
        ...protoWeb3Context,
        connectionKind: 'walletConnect',
      }}
    >
      <AppHeader />
    </MockContextProvider>
  )
})

stories.add('Coinbase wallet Mainnet', () => {
  return (
    <MockContextProvider
      title="Connected Coinbase wallet Mainnet"
      web3Context={{
        ...protoWeb3Context,
        connectionKind: 'walletLink',
      }}
    >
      <AppHeader />
    </MockContextProvider>
  )
})

stories.add('Connected with recent transactions', () => {
  return (
    <MockContextProvider
      title="Connected Metamask Kovan"
      web3Context={protoWeb3Context}
      transactions={[protoSuccessTx, protoSuccessTx]}
    >
      <AppHeader />
    </MockContextProvider>
  )
})

stories.add('Connected with recent transactions and view more', () => {
  return (
    <MockContextProvider
      title="Connected Metamask Kovan"
      web3Context={protoWeb3Context}
      transactions={[protoSuccessTx, protoSuccessTx, protoSuccessTx, protoSuccessTx]}
    >
      <AppHeader />
    </MockContextProvider>
  )
})

stories.add('Connected with pending transaction delayed', () => {
  const startTime = new Date()
  const newTime = startTime.setSeconds(startTime.getSeconds() + 2)

  return (
    <MockContextProvider
      title="Connected Metamask Kovan"
      web3Context={protoWeb3Context}
      // @ts-ignore
      transactions={[protoSuccessTx, { ...protoPendingTx, lastChange: newTime }]}
    >
      <AppHeader />
    </MockContextProvider>
  )
})