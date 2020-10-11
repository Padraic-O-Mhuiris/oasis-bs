import { createWeb3Context$ } from 'components/blockchain/web3Context'
import { combineLatest, Observable, of } from 'rxjs'
import { map, shareReplay, startWith, switchMap, share } from 'rxjs/operators'

import {
  createOnEveryBlock$,
  createNetworkContext$,
  createAccountContext$,
} from './blockchain/network'
import { createAddress$ } from './blockchain/addressContext'
import { EstimateGasFunction, SendTransactionFunction } from './blockchain/calls/callsHelpers'
import { TxMetaKind } from './blockchain/calls/txMeta'
import { routeChangeComplete$ } from './blockchain/route'

export type TxData = Approve

export type Approve = {
  kind: TxMetaKind.approve
  token: string
  spender: string
}

export interface TxHelpers {
  send: SendTransactionFunction<TxData>
  sendWithGasEstimation: SendTransactionFunction<TxData>
  estimateGas: EstimateGasFunction<TxData>
}

export type TxHelpers$ = Observable<TxHelpers>

export function setupAppContext() {
  const address$ = createAddress$(routeChangeComplete$)

  const [
    web3AccountContext$,
    web3AccountContextConnected$,
    setupWeb3AccountContext$,
    web3NetworkContext$,
    web3NetworkContextConnected$,
    setupWeb3NetworkContext$,
  ] = createWeb3Context$()

  // const [, everyBlock$] = createOnEveryBlock$(web3NetworkContextConnected$)

  const networkContext$ = createNetworkContext$(web3NetworkContextConnected$)
  const accountContext$ = createAccountContext$(web3AccountContextConnected$)

  const account$ = web3AccountContext$.pipe(
    map((status) => (status.status === 'connected' ? status.account : undefined)),
  )

  const chainId$ = web3NetworkContextConnected$.pipe(map(({ chainId }) => chainId))
  const isReadOnlyMode$ = combineLatest(account$, address$).pipe(
    map(([account, address]) => !account || account !== address),
    startWith(true),
  )

  return {
    address$,
    account$,
    isReadOnlyMode$,
    web3AccountContext$,
    setupWeb3AccountContext$,
    web3NetworkContext$,
    setupWeb3NetworkContext$,
    chainId$,
    networkContext$,
    accountContext$,
  }
}

export type AppContext = ReturnType<typeof setupAppContext>
