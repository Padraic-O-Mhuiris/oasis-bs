// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import { useAppContext } from 'components/AppContextProvider'
import { TxStatus } from 'components/blockchain/transactions'
import { TxMeta } from 'components/blockchain/transactions'
import { TxMgrTransaction } from 'components/transactionManager/transactionManager'
import { useModal } from 'helpers/modalHook'
import { useObservable } from 'helpers/observableHook'
import { UnreachableCaseError } from 'helpers/UnreachableCaseError'
import { useTranslation } from 'i18n'
import React, { useEffect, useState } from 'react'
import { animated, useSpring } from 'react-spring'
import { Box, Card, Flex, Spinner, Text } from 'theme-ui'

import { TransactionManagerModal } from './TransactionManagerModalView'
import { getTransactionTranslations } from './transactionTranslations'

export interface TransactionProps<A extends TxMeta> {
  transaction?: TxMgrTransaction
}

export const ICONS = {
  sign: <Icon name="sign_transaction" />,
  pending: (
    <Spinner
      variant="styles.spinner.large"
      sx={{
        color: 'spinnerWarning',
        boxSizing: 'content-box',
      }}
    />
  ),
  complete: <Icon name="checkmark" color="onSuccess" />,
  error: <Icon name="close" color="onError" />,
}

export function describeTxNotificationStatus(tx?: TxMgrTransaction) {
  if (!tx) {
    return { icon: undefined, keySuffix: undefined }
  }

  switch (tx.status) {
    // statuses from Wallet
    case TxStatus.WaitingForApproval:
      return { icon: ICONS.sign, keySuffix: 'sign' }
    case TxStatus.Propagating:
    case TxStatus.WaitingForConfirmation:
      return { icon: ICONS.pending, keySuffix: 'pending' }
    case TxStatus.Error:
    case TxStatus.Failure:
      return { icon: ICONS.error, keySuffix: 'failed' }
    case TxStatus.CancelledByTheUser:
      return { icon: ICONS.error, keySuffix: 'rejected' }
    case TxStatus.Success:
      return { icon: ICONS.complete, keySuffix: 'complete' }
    // Statuses from Wyre
    case 'pending':
      return { icon: ICONS.pending, keySuffix: 'pending' }
    case 'failed':
      return { icon: ICONS.error, keySuffix: 'failed' }
    case 'complete':
      return { icon: ICONS.complete, keySuffix: 'complete' }
    default:
      throw new UnreachableCaseError(tx)
  }
}

export function TransactionNotificationDescription<A extends TxMeta>({
  transaction,
  isVisible,
}: TransactionProps<A> & { isVisible: boolean }) {
  const props = useSpring({ transform: isVisible ? 'translateX(0%)' : 'translateX(105%)' })

  return (
    <animated.div
      style={{ ...props, display: 'flex', position: 'relative', maxWidth: 'calc(100% - 140px)' }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: '-50px',
          borderRadius: 'round',
          border: 'light',
          borderColor: 'muted',
          bg: 'txManagerBg',
          boxShadow: 'txManager',
        }}
      />
      <Flex
        sx={{
          alignItems: 'center',
          borderRadius: 'round',
          pl: 3,
          pr: 2,
          position: 'relative',
          minWidth: '75px',
        }}
      >
        <Text
          variant="text"
          sx={{
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {transaction && getTransactionTranslations(transaction).notification}
        </Text>
      </Flex>
    </animated.div>
  )
}

function TransactionNotificationStatus<A extends TxMeta>({ transaction }: TransactionProps<A>) {
  const { icon, keySuffix } = describeTxNotificationStatus(transaction)
  const { t } = useTranslation()

  return (
    <Card
      py={2}
      sx={{
        borderRadius: 'round',
        alignSelf: 'flex-end',
        borderLeft: 'light',
        borderLeftColor: 'muted',
        minWidth: '140px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Flex sx={{ alignItems: 'center', justifyContent: 'center' }}>
        {icon && (
          <Flex sx={{ alignItems: 'center' }} pl={2}>
            {icon}
          </Flex>
        )}
        <Text pl={2} mx={1}>
          {keySuffix ? t(`notification-status-${keySuffix}`) : ''}
        </Text>
      </Flex>
    </Card>
  )
}

export function TransactionManager() {
  const { transactionManager$, context$ } = useAppContext()
  const transactions = useObservable(transactionManager$)
  const transaction = transactions?.notificationTransaction
  const context = useObservable(context$)
  const openModal = useModal()
  const [isVisible, setIsVisible] = useState(false)
  const props = useSpring({ display: isVisible ? 'flex' : 'none' })

  useEffect(() => {
    if (transaction && !isVisible) {
      setIsVisible(true)
    } else if (!transaction && isVisible) {
      setIsVisible(false)
    }
  }, [transaction])

  if (!transactions || !context) return null

  const { etherscan } = context

  return (
    <animated.div
      style={{
        ...props,
        justifyContent: 'flex-end',
        cursor: 'pointer',
        width: '100%',
      }}
      onClick={() => openModal(TransactionManagerModal)}
    >
      <Card
        sx={{
          p: 0,
          lineHeight: 'buttons',
          overflow: 'hidden',
          border: 'none',
          background: 'none',
          borderRadius: 'round',
        }}
      >
        <Flex>
          <TransactionNotificationDescription
            {...{
              transaction: transaction?.tx,
              etherscan,
              isVisible: transaction?.withDescription || false,
            }}
          />
          <TransactionNotificationStatus {...{ transaction: transaction?.tx, etherscan }} />
        </Flex>
      </Card>
    </animated.div>
  )
}
