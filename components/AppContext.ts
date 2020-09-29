import { BigNumber } from 'bignumber.js'
import {
  call,
  createSendTransaction,
  createSendWithGasConstraints,
  estimateGas,
  EstimateGasFunction,
  SendTransactionFunction,
  TransactionDef,
} from 'components/blockchain/calls/callsHelpers'
import { createGasPrice$, tokenPricesInUSD$ } from 'components/blockchain/prices'
import { createSend, SendFunction } from 'components/blockchain/transactions'
import { createWeb3Context$ } from 'components/blockchain/web3Context'
import { createOnrampOrders$, OnrampOrder } from 'components/dashboard/onrampOrders'
import { createTransactionManager } from 'components/transactionManager/transactionManager'
import { loadablifyLight } from 'helpers/loadable'
import { zero } from 'helpers/zero'
import { equals } from 'ramda'
import { combineLatest, defer, Observable, of } from 'rxjs'
import { filter, map, mergeMap, shareReplay, startWith, switchMap } from 'rxjs/operators'

import { trackingEvents } from './analytics/analytics'
import { mixpanelIdentify } from './analytics/mixpanel'
import { createAllowance$, createTokenBalance$ } from './blockchain/erc20'
import {
  compareBigNumber,
  ContextConnected,
  createAccount$,
  createContext$,
  createInitializedAccount$,
  createOnEveryBlock$,
  createWeb3ContextConnected$,
} from './blockchain/network'
import { createDaiDeposit$ } from './dashboard/daiDeposit'
import { createDashboard$ } from './dashboard/dashboard'
import { SetOwnerData, SetupDSProxyData } from './dashboard/dsrPot/dsProxyCalls'
import { createDsrDeposit$ } from './dashboard/dsrPot/dsrDeposit'
import { createDsrHistory$ } from './dashboard/dsrPot/dsrHistory'
import { createDsrCreation$ } from './dashboard/dsrPot/dsrPotCreate'
import { createDsrWithdraw$ } from './dashboard/dsrPot/dsrWithdraw'
import {
  ApproveData,
  DisapproveData,
  TransferErc20Data,
  TransferEthData,
} from './dashboard/dsrPot/erc20Calls'
import {
  chi,
  dsr,
  DsrExitAllData,
  DsrExitData,
  DsrJoinData,
  pie,
} from './dashboard/dsrPot/potCalls'
import { createErc20ExtEventsHistory$ } from './dashboard/erc20History'
import { createEthTransferHistory$ } from './dashboard/ethTransferHistory'
import { getMoonpayRates$ } from './dashboard/onramp/moonpay'
import { createOnrampForm$ } from './dashboard/onramp/onrampForm'
import { getWyreRates$ } from './dashboard/onramp/wyre'
import { createProxyAddress$ } from './dashboard/proxy'
import { createTokenSend$ } from './dashboard/tokenSend'
import { pluginDevModeHelpers } from './devModeHelpers'

export type TxData =
  | ApproveData
  | DisapproveData
  | SetupDSProxyData
  | SetOwnerData
  | DsrJoinData
  | DsrExitData
  | DsrExitAllData
  | TransferEthData
  | TransferErc20Data

export interface TxHelpers {
  send: SendTransactionFunction<TxData>
  sendWithGasEstimation: SendTransactionFunction<TxData>
  estimateGas: EstimateGasFunction<TxData>
}

export type TxHelpers$ = Observable<TxHelpers>

function createTxHelpers$(
  context$: Observable<ContextConnected>,
  send: SendFunction<TxData>,
  gasPrice$: Observable<BigNumber>,
): TxHelpers$ {
  return context$.pipe(
    filter(({ status }) => status === 'connected'),
    map((context) => ({
      send: createSendTransaction(send, context),
      sendWithGasEstimation: createSendWithGasConstraints(send, context, gasPrice$),
      estimateGas: <B extends TxData>(def: TransactionDef<B>, args: B): Observable<number> => {
        return estimateGas(context, def, args)
      },
    })),
  )
}

export function setupAppContext() {
  const [web3Context$, setupWeb3Context$] = createWeb3Context$()

  const account$ = createAccount$(web3Context$)
  const initializedAccount$ = createInitializedAccount$(account$)

  web3Context$.subscribe((web3Context) =>
    console.log(
      'web3Context:',
      web3Context.status,
      (web3Context as any).chainId,
      (web3Context as any).account,
    ),
  )

  const web3ContextConnected$ = createWeb3ContextConnected$(web3Context$)

  const [onEveryBlock$, everyBlock$] = createOnEveryBlock$(web3ContextConnected$)

  const context$ = createContext$(web3ContextConnected$)

  const connectedContext$ = context$.pipe(
    filter(({ status }) => status === 'connected'),
    shareReplay(1),
  ) as Observable<ContextConnected>

  return {
    web3Context$,
    setupWeb3Context$,
    initializedAccount$,
    context$,
  }
}

export type AppContext = ReturnType<typeof setupAppContext>
