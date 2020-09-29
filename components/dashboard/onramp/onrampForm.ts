/*
 * Copyright (C) 2020 Maker Ecosystem Growth Holdings, INC.
 */

import { BigNumber } from 'bignumber.js'
import { ContextConnected } from 'components/blockchain/network'
import { Dictionary } from 'ramda'
import { merge, Observable, Subject } from 'rxjs'
import { map, scan } from 'rxjs/operators'

export enum OnrampKind {
  Wyre = 'Wyre',
  MoonPay = 'MoonPay',
}

export interface AmountFieldChange {
  kind: FormChangeKind.amountFieldChange
  value?: BigNumber
}

export interface CurrencyFieldChange {
  kind: FormChangeKind.currencyFieldChange
  value: string
}

export interface AccountChange {
  kind: FormChangeKind.accountChange
  account: string
}

export interface ContextChange {
  kind: FormChangeKind.contextChange
  network: string | null
}

export interface OnrampKindChange {
  kind: FormChangeKind.onrampKindChange
  onramp: OnrampKind
}

export interface RatesChange {
  kind: FormChangeKind.ratesChange
  onramp: OnrampKind
  rates: Dictionary<BigNumber>
}

export enum FormChangeKind {
  amountFieldChange = 'amount',
  currencyFieldChange = 'currency',
  accountChange = 'account',
  contextChange = 'context',
  onrampKindChange = 'onrampKind',
  ratesChange = 'rates',
}

export enum MessageKind {
  incorrectAmount = 'incorrectAmount',
}

export type Message = {
  kind: MessageKind.incorrectAmount
}

export type ManualChange =
  | AmountFieldChange
  | CurrencyFieldChange
  | AccountChange
  | ContextChange
  | OnrampKindChange
  | RatesChange

type OnrampFormChange = ManualChange

export interface OnrampFormState {
  onramp: OnrampKind | undefined
  readyToProceed?: boolean
  token: string
  account?: string
  network?: string | null
  messages: Message[]
  amount?: BigNumber
  change: (change: ManualChange) => void
  proceed: (state: OnrampFormState) => void
  cancel: () => void
  rates: Dictionary<Dictionary<BigNumber>>
  quoteCurrency: string
}

function applyChange(state: OnrampFormState, change: OnrampFormChange): OnrampFormState {
  switch (change.kind) {
    case FormChangeKind.amountFieldChange:
      return { ...state, amount: change.value }
    case FormChangeKind.currencyFieldChange:
      return { ...state, token: change.value, amount: undefined }
    case FormChangeKind.accountChange:
      return { ...state, account: change.account }
    case FormChangeKind.contextChange:
      return { ...state, network: change.network }
    case FormChangeKind.onrampKindChange:
      return { ...state, onramp: change.onramp }
    case FormChangeKind.ratesChange:
      const rates = { ...state.rates, [change.onramp]: change.rates }
      return { ...state, rates }
  }
  return state
}

function validate(state: OnrampFormState) {
  const messages: Message[] = []
  const buyAmount = getBuyAmount(state, state.amount)

  // Minimum amount is 20 USD
  if (buyAmount && buyAmount.lt(20)) {
    messages.push({
      kind: MessageKind.incorrectAmount,
    })
  }

  return {
    ...state,
    messages,
  }
}

function toAccountChange(initializedAccount$: Observable<string>) {
  return initializedAccount$.pipe(
    map((account) => {
      return {
        account,
        kind: FormChangeKind.accountChange,
      } as AccountChange
    }),
  )
}

function toContextChange(connectedContext$: Observable<ContextConnected>) {
  return connectedContext$.pipe(
    map(({ chainId }) => {
      return {
        network: chainId === 1 ? 'main' : chainId === 42 ? 'kovan' : null,
        kind: FormChangeKind.contextChange,
      } as ContextChange
    }),
  )
}

export function getBuyAmount(state: OnrampFormState, amount: BigNumber | undefined) {
  if (!state.onramp || !state.rates[state.onramp] || !amount) return undefined
  const rate = state.rates[state.onramp][`${state.quoteCurrency}${state.token}`]
  return amount.multipliedBy(rate)
}

export function createOnrampForm$(
  initializedAccount$: Observable<string>,
  connectedContext$: Observable<ContextConnected>,
  wyreRates$: Observable<Dictionary<BigNumber>>,
  moonpayRates$: Observable<Dictionary<BigNumber>>,
): Observable<OnrampFormState> {
  const manualChange$ = new Subject<ManualChange>()

  const change = manualChange$.next.bind(manualChange$)

  async function proceed(state: OnrampFormState) {
    const { account, network, token, amount } = state
    const redirectUrl = `${window.location.protocol}//${window.location.host}/${account}/dashboard?network=${network}`

    const failureRedirectUrl = redirectUrl

    const buyAmount = getBuyAmount(state, amount)
    if (state.onramp === OnrampKind.Wyre) {
      const result = await fetch('/api/new_wyre_order', {
        method: 'POST',
        body: JSON.stringify({
          network,
          amount: buyAmount && buyAmount.toString(),
          sourceCurrency: 'USD',
          destCurrency: token,
          recipient: account,
          redirectUrl,
          failureRedirectUrl,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const json = await result.json()
      if (json?.url) window.location.href = json.url
    }
    if (state.onramp === OnrampKind.MoonPay) {
      window.location.href = `${window.location.protocol}//${
        window.location.host
      }/api/new_moonpay_order?recipient=${account}&currencyCode=${token.toLowerCase()}&redirectURL=${redirectUrl}&baseCurrencyCode=usd&baseCurrencyAmount=${buyAmount}&network=${network}`
    }
  }

  const initialState = {
    change,
    proceed,
    cancel: () => {},
    messages: [],
    token: 'DAI',
    account: undefined,
    network: undefined,
    rates: {},
    quoteCurrency: 'USD',
    onramp: undefined,
  }

  function toRatesChange(
    rates$: Observable<Dictionary<BigNumber>>,
    onramp: OnrampKind,
  ): Observable<RatesChange> {
    return rates$.pipe(
      map(
        (rates) =>
          ({
            rates,
            onramp,
            kind: FormChangeKind.ratesChange,
          } as RatesChange),
      ),
    )
  }

  return merge(
    manualChange$,
    toAccountChange(initializedAccount$),
    toContextChange(connectedContext$),
    toRatesChange(wyreRates$, OnrampKind.Wyre),
    toRatesChange(moonpayRates$, OnrampKind.MoonPay),
  ).pipe(scan(applyChange, initialState), map(validate))
}
