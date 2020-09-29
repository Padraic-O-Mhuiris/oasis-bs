// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import BigNumber from 'bignumber.js'
import { TokenConfig } from 'components/blockchain/config'
import { CardBalance } from 'components/Cards'
import { ModalBackIcon, ModalBottom, ModalButton } from 'components/Modal'
import { formatAddress, formatCryptoBalance } from 'helpers/formatters/format'
import { InputWithMax, InputWithSuffix } from 'helpers/input'
import { ModalProps } from 'helpers/modalHook'
import { useObservable } from 'helpers/observableHook'
import { useTranslation } from 'i18n'
import { TFunction } from 'next-i18next'
import React, { useEffect, useState } from 'react'
import { Button, Flex, Grid, Heading, Input, Text } from 'theme-ui'
import Web3 from 'web3'

import { trackingEvents } from '../../analytics/analytics'
import { useAppContext } from '../../AppContextProvider'
import { ManualChange } from '../dsrPot/dsrDeposit'
import { AddressChange, TokenSendMessage, TokenSendState } from '../tokenSend'

function handleAmountChange(change: (ch: ManualChange) => void) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '')
    change({
      kind: 'amount',
      amount: value === '' ? undefined : new BigNumber(value),
    })
  }
}

function parseMessageErrors(message: TokenSendMessage, t: TFunction, token: TokenConfig) {
  switch (message.kind) {
    case 'addressInvalid':
      return t('address-invalid')
    case 'amountIsEmpty':
      return t('send-amount-empty', { token: token.symbol })
    case 'amountMoreThanBalance':
      return t('send-amount-exceed-balance', { token: token.symbol })
    default:
      return message.kind
  }
}

interface SendViewProps extends TokenSendState {
  token: TokenConfig
  close: () => void
}

function Editing({ stage, change, address, messages, token, dai, eth, amount }: SendViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { t } = useTranslation('common')

  const balance = token.symbol === 'DAI' ? dai : eth

  const addressMessages = messages
    .filter((m) => m.kind === 'addressInvalid')
    .map((m) => parseMessageErrors(m, t, token))

  const amountMessages = messages
    .filter((m) => m.kind !== 'addressInvalid')
    .map((m) => parseMessageErrors(m, t, token))

  function handleAddressChange(change: (ch: AddressChange) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      change({
        kind: 'address',
        address: value === '' ? undefined : value,
      })
    }
  }

  function handlePasteFromClipboard(change: (ch: AddressChange) => void) {
    return () =>
      navigator.clipboard.readText().then((value) => {
        change({
          kind: 'address',
          address: value === '' ? undefined : value,
        })
      })
  }

  function handleSetMax(change: (ch: ManualChange) => void) {
    return () => {
      change({ kind: 'amount', amount: balance })
    }
  }

  const displayAddress = !address
    ? ''
    : Web3.utils.isAddress(address)
    ? formatAddress(address)
    : address

  const hasAddressErrors = addressMessages.length > 0 && !!address
  const hasAmountErrors = amountMessages.length > 0 && !!amount

  return (
    <Grid sx={{ justifyItems: 'center' }} gap={4}>
      <Heading>{t('send')}</Heading>
      <Grid gap={2} sx={{ width: '100%' }}>
        <Heading variant="smallHeading">{t('address')}</Heading>
        <InputWithSuffix
          input={
            <Input
              type="text"
              disabled={stage !== 'editing'}
              onChange={isEditing ? handleAddressChange(change!) : undefined}
              onBlur={() => setIsEditing(false)}
              onFocus={() => setIsEditing(true)}
              value={isEditing ? address : displayAddress}
              placeholder={t('send-to')}
              sx={{ pr: 6 }}
              variant={hasAddressErrors ? 'inputError' : 'input'}
            />
          }
          suffix={
            <Button onClick={handlePasteFromClipboard(change!)} variant="secondary">
              {t('paste')}
            </Button>
          }
        />
        {hasAddressErrors ? <Text variant="error">{addressMessages.join(',')}</Text> : null}
      </Grid>
      <Grid gap={3} sx={{ width: '100%' }}>
        <Grid gap={2} sx={{ width: '100%' }}>
          <Heading variant="smallHeading">{t('amount')}</Heading>
          <InputWithMax
            {...{
              amount,
              token,
              disabled: stage !== 'editing',
              hasError: hasAmountErrors,
              onChange: handleAmountChange(change!),
              onSetMax: handleSetMax(change!),
            }}
          />
          {hasAmountErrors ? <Text variant="error">{amountMessages.join(',')}</Text> : null}
        </Grid>
        <CardBalance token={token.symbol} icon={token.icon} balance={balance} />
      </Grid>
    </Grid>
  )
}

function Confirmation({ amount, token, address }: SendViewProps) {
  const { t } = useTranslation('common')

  return (
    <Grid sx={{ justifyItems: 'center' }} gap={4}>
      <Heading>{t('confirm')}</Heading>
      <Grid sx={{ justifyItems: 'center' }} gap={4}>
        <Heading variant="smallHeading">{t('you-are-sending')}</Heading>
        <Flex sx={{ alignItems: 'center' }}>
          <Icon name={token.icon} size={55} />
          <Text sx={{ ml: 2, fontSize: 8 }}>{formatCryptoBalance(amount!)}</Text>
        </Flex>
        <Heading variant="smallHeading">{t('to-the-following-address')}</Heading>
        <Grid mx={3} bg="background" sx={{ borderRadius: 'large', overflowWrap: 'break-word' }}>
          <Text py={3} px={4} sx={{ fontSize: 4, color: 'textAlt', textAlign: 'center' }}>
            {address}
          </Text>
        </Grid>
      </Grid>
    </Grid>
  )
}

export function SendView(props: SendViewProps) {
  const { t } = useTranslation('common')
  const { stage, token, sendDai, sendEth, close, proceed, canProceed, activeToken, change } = props
  useEffect(() => {
    if (change && activeToken !== token.symbol) {
      change({
        kind: 'activeToken',
        activeToken: token.symbol,
      })
    }
  }, [token])

  const send = token.symbol === 'DAI' ? sendDai : sendEth

  const proceedAction = () => {
    proceed && proceed()
    trackingEvents.tokenSendProceed()
  }

  const modalButtonAction =
    stage === 'editing'
      ? proceedAction
      : stage === 'sendWaiting4Confirmation'
      ? () => {
          send!()
          close!()
        }
      : undefined

  const modalButtonContent =
    stage === 'editing' ? t('continue') : stage === 'sendWaiting4Confirmation' ? t('confirm') : ''

  return (
    <>
      {props.stage === 'editing' ? <Editing {...props} /> : <Confirmation {...props} />}
      <ModalButton onClick={modalButtonAction} disabled={!canProceed}>
        {modalButtonContent}
      </ModalButton>
    </>
  )
}

interface TokenSendViewProps {
  token: TokenConfig
}
export function TokenSendView({ token, close }: ModalProps<TokenSendViewProps>) {
  const { tokenSend$ } = useAppContext()
  const tokenSend = useObservable(tokenSend$)

  if (!tokenSend) return null

  return (
    <ModalBottom {...{ close }}>
      {tokenSend.stage === 'sendWaiting4Confirmation' ? (
        <ModalBackIcon back={tokenSend.reset!} />
      ) : null}
      <SendView {...tokenSend} token={token} close={close} />
    </ModalBottom>
  )
}
