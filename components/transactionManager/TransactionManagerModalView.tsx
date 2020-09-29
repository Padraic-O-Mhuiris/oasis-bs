// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import { ActivityItem } from 'components/Activity'
import { TxData } from 'components/AppContext'
import { useAppContext } from 'components/AppContextProvider'
import { TxMetaKind } from 'components/blockchain/calls/txMeta'
import { TxMeta, TxState, TxStatus } from 'components/blockchain/transactions'
import { Modal, ModalCloseIcon } from 'components/Modal'
import { TxMgrTransaction } from 'components/transactionManager/transactionManager'
import { ViewMore } from 'components/ViewMore'
import { ModalProps } from 'helpers/modalHook'
import { useObservable } from 'helpers/observableHook'
import { useTranslation } from 'i18n'
import React, { useState } from 'react'
import { Box, Button, Flex, Grid, Heading, Link } from 'theme-ui'

import { ICONS } from './TransactionManagerView'
import { getTransactionTranslations } from './transactionTranslations'

const TRANSACTIONS_INCREMENT = 3

interface TransactionProps<A extends TxMeta> {
  transaction: TxMgrTransaction
  etherscan: any
}

const ICONS_RECENT_TRANSACTIONS = {
  error: <Icon name="close" size="14px" />,
  sent: <Icon name="send" size="14px" sx={{ position: 'relative', top: '-2px' }} />,
  moonpay: <Icon name="moonpay" size="14px" />,
  wyre: <Icon name="wyre" size="16px" />,
  dsrDeposit: <Icon name="arrow_down" size="14px" />,
  dsrWithdraw: <Icon name="arrow_up_thin" size="14px" />,
}

export function getRecentTransactionIcon(tx: TxMgrTransaction) {
  const { kind, raw } = tx
  if (kind === 'blockchain') {
    const { meta } = raw as TxState<TxData>

    switch (meta.kind) {
      case TxMetaKind.dsrJoin:
        return ICONS_RECENT_TRANSACTIONS.dsrDeposit
      case TxMetaKind.dsrExit:
        return ICONS_RECENT_TRANSACTIONS.dsrWithdraw
      default:
        return ICONS_RECENT_TRANSACTIONS.sent
    }
  } else if (kind === 'wyre') {
    return ICONS_RECENT_TRANSACTIONS.wyre
  } else if (kind === 'moonpay') {
    return ICONS_RECENT_TRANSACTIONS.moonpay
  } else {
    return ICONS_RECENT_TRANSACTIONS.sent
  }
}

function PendingTransaction<A extends TxMeta>({
  transaction,
  etherscan: { url },
}: TransactionProps<A>) {
  const { raw, kind, status } = transaction
  const { t } = useTranslation()

  return (
    <Flex sx={{ alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
      <Flex sx={{ flex: 1, alignItems: 'center' }}>
        <Flex sx={{ alignItems: 'center', pr: 2, mr: 1 }}>
          {status === TxStatus.WaitingForApproval ? ICONS.sign : ICONS.pending}
        </Flex>
        <Box sx={{ flex: 1 }}>{getTransactionTranslations(transaction).pending}</Box>
      </Flex>
      {kind === 'blockchain' && (raw as any).txHash && (
        <Link href={`${url}/tx/${(raw as any).txHash}`} target="_blank" rel="noopener noreferrer">
          <Button variant="secondarySmall" sx={{ ml: 1 }}>
            <Flex sx={{ alignItems: 'center' }}>
              {t('view')}
              <Icon name="increase" sx={{ ml: 1 }} size={12} />
            </Flex>
          </Button>
        </Link>
      )}
    </Flex>
  )
}

function RecentTransaction<A extends TxMeta>({ transaction }: TransactionProps<A>) {
  const { lastChange, status } = transaction
  const isFailed =
    status === TxStatus.CancelledByTheUser ||
    status === TxStatus.Error ||
    status === TxStatus.Failure ||
    status === 'failed'
  const label = getTransactionTranslations(transaction)[isFailed ? 'recentFailed' : 'recent']

  return (
    <ActivityItem
      {...{
        timestamp: lastChange,
        label,
        icon: isFailed ? ICONS_RECENT_TRANSACTIONS.error : getRecentTransactionIcon(transaction),
        iconColor: 'primaryEmphasis',
      }}
    />
  )
}

function PendingTransactions() {
  const { transactionManager$, context$ } = useAppContext()
  const transactions = useObservable(transactionManager$)?.pendingTransactions
  const context = useObservable(context$)
  const [transactionsCount, setTransactionsCount] = useState(TRANSACTIONS_INCREMENT)
  const { t } = useTranslation()

  function viewMore() {
    setTransactionsCount(transactionsCount + TRANSACTIONS_INCREMENT)
  }

  if (!context || !transactions || !transactions.length) return null
  const { etherscan } = context

  return (
    <Box>
      <Heading mb={4} px={3} mx={1}>
        {t('pending-transactions')}
      </Heading>
      <Box px={3} mx={1}>
        {transactions.slice(0, transactionsCount).map((transaction) => (
          <PendingTransaction {...{ transaction, etherscan, key: transaction.id }} />
        ))}
      </Box>
      {transactionsCount < transactions.length && <ViewMore viewMore={viewMore} />}
    </Box>
  )
}

export function RecentTransactions() {
  const { transactionManager$, context$ } = useAppContext()
  const transactions = useObservable(transactionManager$)?.recentTransactions
  const context = useObservable(context$)
  const [transactionsCount, setTransactionsCount] = useState(TRANSACTIONS_INCREMENT)
  const { t } = useTranslation()

  function viewMore() {
    setTransactionsCount(transactionsCount + TRANSACTIONS_INCREMENT)
  }

  if (!context || !transactions || !transactions.length) return null
  const { etherscan } = context

  return (
    <Box>
      <Heading mb={4} px={3} mx={1}>
        {t('recent-transactions')}
      </Heading>
      <Box px={3} mx={1}>
        {transactions.slice(0, transactionsCount).map((transaction) => (
          <RecentTransaction {...{ transaction, etherscan, key: transaction.id }} />
        ))}
      </Box>
      {transactionsCount < transactions.length && <ViewMore viewMore={viewMore} />}
    </Box>
  )
}

export function TransactionManagerModal({ close }: ModalProps) {
  return (
    <Modal>
      <ModalCloseIcon {...{ close }} />
      <Grid gap={4} pt={3} mt={1}>
        <PendingTransactions />
        <RecentTransactions />
      </Grid>
    </Modal>
  )
}
