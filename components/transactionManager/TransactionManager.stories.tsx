import { storiesOf } from '@storybook/react'
import BigNumber from 'bignumber.js'
import { AppContext } from 'components/AppContext'
import { appContext, isAppContextAvailable } from 'components/AppContextProvider'
import { TxMetaKind } from 'components/blockchain/calls/txMeta'
import { TxState, TxStatus } from 'components/blockchain/transactions'
import { OnrampOrder } from 'components/dashboard/onrampOrders'
import { ModalProvider } from 'helpers/modalHook'
import { WithChildren } from 'helpers/types'
import React from 'react'
import { of } from 'rxjs'
import { Container, Heading } from 'theme-ui'

import { TxData } from '../AppContext'
import { createTransactionManager } from './transactionManager'
import { TransactionManagerModal } from './TransactionManagerModalView'
import { TransactionManager } from './TransactionManagerView'

interface MockContextProviderProps extends WithChildren {
  transactions?: TxState<TxData>[]
  onrampOrders?: OnrampOrder[]
  title: string
}

const stories = storiesOf('Transaction Manager', module)
const storiesModal = storiesOf('Transaction Manager Modal', module)

const startTime = new Date()
startTime.setSeconds(startTime.getSeconds() - 55)

const protoTx = {
  account: '0xe6ac5629b9ade2132f42887fbbc3a3860afbd07b',
  networkId: '0',
  txNo: 2,
  start: startTime,
  lastChange: new Date(),
  dismissed: false,
  meta: {
    kind: TxMetaKind.setupDSProxy,
  } as TxData,
}

const protoSignTx: TxState<TxData> = {
  ...protoTx,
  status: TxStatus.WaitingForApproval,
}

const protoCancelledTx: TxState<TxData> = {
  ...protoTx,
  status: TxStatus.CancelledByTheUser,
  error: 'error',
}

export const protoPendingTx: TxState<TxData> = {
  ...protoTx,
  status: TxStatus.WaitingForConfirmation,
  txHash: '0x123',
  broadcastedAt: new Date(),
}

const protoPropagatingTx: TxState<TxData> = protoPendingTx

const protoFailureTx: TxState<TxData> = {
  ...protoTx,
  status: TxStatus.Failure,
  txHash: '0x123',
  blockNumber: 1234,
  receipt: {},
}

const protoErrorTx: TxState<TxData> = {
  ...protoTx,
  status: TxStatus.Error,
  txHash: '0x123',
  error: 'error',
}

export const protoSuccessTx: TxState<TxData> = {
  ...protoTx,
  status: TxStatus.Success,
  txHash: '0x123',
  blockNumber: 1234,
  receipt: {},
  confirmations: 3,
  safeConfirmations: 1,
  meta: {
    amount: new BigNumber(1000.41),
    kind: TxMetaKind.transferEth,
    address: '0x',
  },
}

const protoPendingTxWyre: OnrampOrder = {
  id: 'testId',
  type: 'wyre',
  status: 'pending',
  amount: new BigNumber(5),
  date: new Date(),
  token: 'DAI',
}

const protoSuccessTxWyre: OnrampOrder = {
  ...protoPendingTxWyre,
  status: 'complete',
}

const protoFailureTxWyre: OnrampOrder = {
  ...protoPendingTxWyre,
  status: 'failed',
}

const protoPendingTxMoonpay: OnrampOrder = {
  id: 'testId',
  type: 'moonpay',
  status: 'pending',
  amount: new BigNumber(20),
  date: new Date(),
  token: 'DAI',
}

const protoPendingTxMoonpayNoAmount: OnrampOrder = {
  id: 'testId',
  type: 'moonpay',
  status: 'pending',
  amount: new BigNumber(0),
  date: new Date(),
  token: 'DAI',
}

const protoSuccessTxMoonpay: OnrampOrder = {
  ...protoPendingTxMoonpay,
  status: 'complete',
}

const protoFailureTxMoonpay: OnrampOrder = {
  ...protoPendingTxMoonpay,
  status: 'failed',
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
  transactions = [],
  onrampOrders = [],
  children,
  title,
}: MockContextProviderProps) {
  const ctx = ({
    transactionManager$: createTransactionManager(of(transactions), of(onrampOrders)),
    context$: of({
      etherscan: { url: 'etherscan' },
    }),
    dismissTransaction: () => null,
  } as any) as AppContext
  return (
    <appContext.Provider value={ctx as any}>
      <ModalProvider>
        <StoryContainer {...{ title }}>{children}</StoryContainer>
      </ModalProvider>
    </appContext.Provider>
  )
}

stories.add('Playground', () => {
  return (
    <>
      <MockContextProvider title="No transactions">
        <TransactionManager />
      </MockContextProvider>

      <MockContextProvider
        title="Waiting for signature"
        transactions={[protoSignTx, protoPendingTx]}
      >
        <TransactionManager />
      </MockContextProvider>

      <MockContextProvider title="Propagating" transactions={[protoPropagatingTx]}>
        <TransactionManager />
      </MockContextProvider>

      <MockContextProvider title="Mining/Pending" transactions={[protoPendingTx]}>
        <TransactionManager />
      </MockContextProvider>

      <MockContextProvider title="Cancelled signature" transactions={[protoCancelledTx]}>
        <TransactionManager />
      </MockContextProvider>

      <MockContextProvider title="Error and Pending" transactions={[protoPendingTx, protoErrorTx]}>
        <TransactionManager />
      </MockContextProvider>

      <MockContextProvider title="Failure" transactions={[protoFailureTx]}>
        <TransactionManager />
      </MockContextProvider>

      <MockContextProvider title="Complete" transactions={[protoSuccessTx]}>
        <TransactionManager />
      </MockContextProvider>

      <MockContextProvider title="Wyre Pending" onrampOrders={[protoPendingTxWyre]}>
        <TransactionManager />
      </MockContextProvider>

      <MockContextProvider title="Wyre Failed" onrampOrders={[protoFailureTxWyre]}>
        <TransactionManager />
      </MockContextProvider>

      <MockContextProvider title="Wyre Complete" onrampOrders={[protoSuccessTxWyre]}>
        <TransactionManager />
      </MockContextProvider>
    </>
  )
})

storiesModal.add('Playground', () => {
  return (
    <>
      <MockContextProvider
        title="Playground"
        transactions={[protoSignTx, protoPendingTx, protoSuccessTx]}
        onrampOrders={[protoPendingTxMoonpay, protoPendingTxMoonpayNoAmount]}
      >
        <TransactionManagerModal close={() => {}} />
      </MockContextProvider>
    </>
  )
})

storiesModal.add('View More Pending', () => {
  return (
    <>
      <MockContextProvider
        title="View More Pending"
        transactions={[protoSignTx, protoPendingTx, protoPendingTx, protoPendingTx]}
      >
        <TransactionManagerModal close={() => {}} />
      </MockContextProvider>
    </>
  )
})

storiesModal.add('View More Recent', () => {
  return (
    <>
      <MockContextProvider
        title="View More Recent"
        transactions={[protoSuccessTx, protoSuccessTx, protoSuccessTx, protoSuccessTx]}
      >
        <TransactionManagerModal close={() => {}} />
      </MockContextProvider>
    </>
  )
})

storiesModal.add('View More Both', () => {
  return (
    <>
      <MockContextProvider
        title="View More Both"
        transactions={[
          protoSignTx,
          protoPendingTx,
          protoPendingTx,
          protoPendingTx,
          protoSuccessTx,
          protoSuccessTx,
          protoSuccessTx,
          protoSuccessTx,
        ]}
        onrampOrders={[protoSuccessTxWyre]}
      >
        <TransactionManagerModal close={() => {}} />
      </MockContextProvider>
    </>
  )
})

storiesModal.add('Translations pending, recent and icons', () => {
  return (
    <>
      <MockContextProvider
        title="Translations"
        transactions={[
          protoSignTx,
          {
            ...protoPendingTx,
            meta: { kind: TxMetaKind.transferEth, address: '0x0', amount: new BigNumber(5) },
          },
          {
            ...protoPendingTx,
            meta: {
              kind: TxMetaKind.transferErc20,
              address: '0x0',
              amount: new BigNumber(5),
              token: 'DAI',
            },
          },
          {
            ...protoPendingTx,
            meta: { kind: TxMetaKind.disapprove, token: 'DAI', spender: '0x0' },
          },
          {
            ...protoPendingTx,
            meta: { kind: TxMetaKind.approve, token: 'DAI', spender: '0x0' },
          },
          {
            ...protoPendingTx,
            meta: { kind: TxMetaKind.dsrExit, proxyAddress: '0x0', amount: new BigNumber(5) },
          },
          {
            ...protoPendingTx,
            meta: { kind: TxMetaKind.dsrJoin, proxyAddress: '0x0', amount: new BigNumber(5) },
          },
          {
            ...protoPendingTx,
            meta: { kind: TxMetaKind.setOwner, proxyAddress: '0x0', owner: '0x0' },
          },
          {
            ...protoSuccessTx,
            meta: { kind: TxMetaKind.transferEth, address: '0x0', amount: new BigNumber(5) },
          },
          {
            ...protoSuccessTx,
            meta: {
              kind: TxMetaKind.transferErc20,
              address: '0x0',
              amount: new BigNumber(5),
              token: 'DAI',
            },
          },
          {
            ...protoSuccessTx,
            meta: { kind: TxMetaKind.disapprove, token: 'DAI', spender: '0x0' },
          },
          {
            ...protoSuccessTx,
            meta: { kind: TxMetaKind.approve, token: 'DAI', spender: '0x0' },
          },
          {
            ...protoSuccessTx,
            meta: { kind: TxMetaKind.dsrExit, proxyAddress: '0x0', amount: new BigNumber(5) },
          },
          {
            ...protoSuccessTx,
            meta: { kind: TxMetaKind.dsrJoin, proxyAddress: '0x0', amount: new BigNumber(5) },
          },
          {
            ...protoSuccessTx,
            meta: { kind: TxMetaKind.setOwner, proxyAddress: '0x0', owner: '0x0' },
          },
        ]}
        onrampOrders={[
          protoPendingTxWyre,
          protoSuccessTxWyre,
          protoPendingTxMoonpay,
          protoSuccessTxMoonpay,
        ]}
      >
        <TransactionManagerModal close={() => {}} />
      </MockContextProvider>
    </>
  )
})

storiesModal.add('Translations Failed', () => {
  return (
    <>
      <MockContextProvider
        title="Translations"
        transactions={[
          protoFailureTx,
          {
            ...protoFailureTx,
            meta: { kind: TxMetaKind.transferEth, address: '0x0', amount: new BigNumber(5) },
          },
          {
            ...protoFailureTx,
            meta: {
              kind: TxMetaKind.transferErc20,
              address: '0x0',
              amount: new BigNumber(5),
              token: 'DAI',
            },
          },
          {
            ...protoFailureTx,
            meta: { kind: TxMetaKind.disapprove, token: 'DAI', spender: '0x0' },
          },
          {
            ...protoFailureTx,
            meta: { kind: TxMetaKind.approve, token: 'DAI', spender: '0x0' },
          },
          {
            ...protoFailureTx,
            meta: { kind: TxMetaKind.dsrExit, proxyAddress: '0x0', amount: new BigNumber(5) },
          },
          {
            ...protoFailureTx,
            meta: { kind: TxMetaKind.dsrJoin, proxyAddress: '0x0', amount: new BigNumber(5) },
          },
          {
            ...protoFailureTx,
            meta: { kind: TxMetaKind.setOwner, proxyAddress: '0x0', owner: '0x0' },
          },
        ]}
        onrampOrders={[protoFailureTxWyre, protoFailureTxMoonpay]}
      >
        <TransactionManagerModal close={() => {}} />
      </MockContextProvider>
    </>
  )
})
