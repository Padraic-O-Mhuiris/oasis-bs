/*
 * Copyright (C) 2020 Maker Ecosystem Growth Holdings, INC.
 */
// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import { Box, Card, Flex, Grid, Label, Text } from '@theme-ui/components'
import { BigNumber } from 'bignumber.js'
import { useAppContext } from 'components/AppContextProvider'
import { getToken } from 'components/blockchain/config'
import { ModalBottom, ModalButton } from 'components/Modal'
import { BigNumberInput } from 'helpers/BigNumberInput'
import { formatAmount, formatCryptoBalance, formatFiatBalance } from 'helpers/formatters/format'
import { ModalProps } from 'helpers/modalHook'
import { useObservable } from 'helpers/observableHook'
import { useTranslation } from 'i18n'
import React, { ChangeEvent, useEffect } from 'react'
import ReactSelect from 'react-select'
import { createNumberMask } from 'text-mask-addons/dist/textMaskAddons'
import { Heading } from 'theme-ui'

import { trackingEvents } from '../../analytics/analytics'
import {
  AmountFieldChange,
  CurrencyFieldChange,
  FormChangeKind,
  getBuyAmount,
  Message,
  MessageKind,
  OnrampKind,
  OnrampKindChange,
} from './onrampForm'

function messageContent(msg: Message, quoteCurrency: string) {
  switch (msg.kind) {
    case MessageKind.incorrectAmount:
      return `Minimum amount is 20 ${quoteCurrency}`
    default:
      return null
  }
}

type OnRampFormProps = {
  onramp: OnrampKind
}

const options = [
  {
    value: 'DAI',
    label: (
      <Flex sx={{ alignItems: 'center' }}>
        <Icon name="dai_circle_color" size={30} mr={2} />
        <Text ml={1}>DAI</Text>
      </Flex>
    ),
  },
  {
    value: 'ETH',
    label: (
      // minHeight to compensate for screen jumping while switching currencies
      <Flex sx={{ alignItems: 'center', minHeight: '30px' }}>
        <Icon name="ether_circle_color" size={27} mr={2} />
        <Text ml={1}>ETH</Text>
      </Flex>
    ),
  },
]

function CurrencySelect({ token, handleCurrencyChange }: any) {
  return (
    <ReactSelect
      options={options.filter(({ value }) => value !== token)}
      components={{
        IndicatorsContainer: () => null,
        ValueContainer: ({ children }) => (
          <Flex my={1} sx={{ color: 'primary' }}>
            {children}
          </Flex>
        ),
        SingleValue: ({ children }) => <Box>{children}</Box>,
        Option: ({ children, innerProps }) => (
          <Box
            {...innerProps}
            sx={{
              p: 3,
              cursor: 'pointer',
              '&:hover': {
                bg: 'background',
              },
            }}
          >
            {children}
          </Box>
        ),
        Menu: ({ innerProps, children }) => (
          <Card
            {...innerProps}
            sx={{
              position: 'absolute',
              width: '100%',
              mt: 2,
              borderRadius: 'large',
              fontSize: 5,
              p: 0,
              overflow: 'hidden',
            }}
          >
            {children}
          </Card>
        ),
        MenuList: ({ children }) => <Box>{children}</Box>,
        Control: ({ innerProps, children, selectProps: { menuIsOpen } }) => (
          <Flex
            {...innerProps}
            sx={{
              variant: 'forms.select',
              cursor: 'pointer',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 2,
            }}
          >
            {children}
            <Icon name={menuIsOpen ? 'chevron_up' : 'chevron_down'} />
          </Flex>
        ),
      }}
      isSearchable={false}
      defaultValue={options.find(({ value }) => value === token)}
      // @ts-ignore
      onChange={({ value }) => handleCurrencyChange(value)}
    />
  )
}

export function OnrampFormView({ onramp, close }: ModalProps<OnRampFormProps>) {
  const { onrampForm$ } = useAppContext()
  const onrampForm = useObservable(onrampForm$)
  const { t } = useTranslation('common')

  useEffect(() => {
    if (onrampForm && onramp !== onrampForm.onramp) {
      onrampForm.change({
        onramp,
        kind: FormChangeKind.onrampKindChange,
      } as OnrampKindChange)
    }
  }, [onrampForm])

  if (!onrampForm) {
    return null
  }

  const { amount, messages, proceed, token, quoteCurrency } = onrampForm

  const errorMessages = (messages || []).map((msg) => messageContent(msg, quoteCurrency))

  function handleAmountChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/,/g, '')
    onrampForm!.change({
      kind: FormChangeKind.amountFieldChange,
      value: value === '' ? null : new BigNumber(value),
    } as AmountFieldChange)
  }

  function handleCurrencyChange(value: string) {
    onrampForm!.change({
      kind: FormChangeKind.currencyFieldChange,
      value,
    } as CurrencyFieldChange)
  }

  const buyAmount = getBuyAmount(onrampForm, amount || new BigNumber(1))
  const hasErrors = errorMessages.length > 0
  const canProceed = amount && !hasErrors

  return (
    <ModalBottom {...{ close }}>
      <Grid gap={4}>
        <Heading sx={{ textAlign: 'center' }}>
          {t('buy')} {token}
        </Heading>
        <Grid>
          <Box>
            <Label sx={{ mb: 2 }}>{t('currency')}</Label>
            <CurrencySelect {...{ token, handleCurrencyChange }} />
            <Label sx={{ mt: 3, mb: 2 }}>{t('amount')}</Label>
            <BigNumberInput
              data-test-id="type-amount"
              type="text"
              mask={createNumberMask({
                allowDecimal: true,
                decimalLimit: getToken(token).digits,
                prefix: '',
              })}
              onChange={handleAmountChange}
              value={(amount || null) && formatAmount(amount as BigNumber, token)}
              guide={true}
              placeholder={'0'}
              variant={hasErrors ? 'inputError' : 'input'}
            />
            {hasErrors && (
              <Text variant="error" sx={{ fontSize: 3, mt: 2, pt: 1 }}>
                {errorMessages.map((msg) => msg)}
              </Text>
            )}
          </Box>
          <Card variant="secondaryRounded" sx={{ p: 3 }}>
            <Grid p={2} sx={{ fontSize: 4 }}>
              {buyAmount && (
                <Box>
                  <Label>{t('exchange-rate')}</Label>
                  <Text sx={{ color: 'onSurface' }}>
                    {formatFiatBalance(buyAmount)} {quoteCurrency} into{' '}
                    {formatCryptoBalance(amount || new BigNumber(1))} {token}
                  </Text>
                </Box>
              )}
              {/* TODO After David finalizes designs */}
              {/* {onrampForm.onramp === OnrampKind.MoonPay && ( */}
              {/*   <> */}
              {/*     <Box> */}
              {/*       <Label>{t('conversion-fee')}</Label> */}
              {/*       <Text sx={{ color: 'onSurface' }}>??.?? {quoteCurrency}</Text> */}
              {/*     </Box> */}
              {/*     <Box> */}
              {/*       <Label>{t('miner-fee')}</Label> */}
              {/*       <Text sx={{ color: 'onSurface' }}>??.?? {quoteCurrency}</Text> */}
              {/*     </Box> */}
              {/*   </> */}
              {/* )} */}
            </Grid>
          </Card>
        </Grid>
      </Grid>
      <Box sx={{ mt: 4 }}>
        <Text sx={{ color: 'onSurface', px: 1 }}>{t('onramp-leave-message')}</Text>
        <ModalButton
          onClick={
            canProceed
              ? () => {
                  proceed(onrampForm)
                  trackingEvents.onrampProceed(onrampForm.token)
                }
              : undefined
          }
          disabled={!canProceed}
          sx={{ mt: 3 }}
        >
          {t('buy-with', { token, onramp })}
        </ModalButton>
      </Box>
    </ModalBottom>
  )
}
