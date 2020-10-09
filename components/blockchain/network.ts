// tslint:disable:no-console
import BigNumber from 'bignumber.js'
import {
  Web3NetworkContextConnected,
  Web3NetworkContext,
  Web3AccountContextConnected,
} from 'components/blockchain/web3Context'
import { memoize } from 'lodash'
import { bindNodeCallback, combineLatest, concat, interval, Observable } from 'rxjs'
import {
  catchError,
  distinctUntilChanged,
  filter,
  first,
  map,
  shareReplay,
  skip,
  startWith,
  switchMap,
} from 'rxjs/operators'

import { ContractDesc, NetworkConfig, networks } from './config'

export const every1Seconds$ = interval(1000).pipe(startWith(0))
export const every3Seconds$ = interval(3000).pipe(startWith(0))
export const every5Seconds$ = interval(5000).pipe(startWith(0))
export const every10Seconds$ = interval(10000).pipe(startWith(0))

interface WithContractMethod {
  contract: (desc: ContractDesc) => any
}

export type NetworkContextConnected = NetworkConfig &
  Web3NetworkContextConnected &
  WithContractMethod

export type NetworkContext = NetworkContextConnected

export type AccountContextConnected = NetworkConfig &
  Web3AccountContextConnected &
  WithContractMethod

export type AccountContext = AccountContextConnected

export function createAccountContext$<A>(
  web3AccountContextConnected$: Observable<Web3AccountContextConnected>,
): Observable<AccountContext> {
  return web3AccountContextConnected$.pipe(
    map((web3AccountContext) => {
      return {
        ...networks[web3AccountContext.chainId],
        ...web3AccountContext,
        contract: (c: ContractDesc) => contract(web3AccountContext.web3, c),
      }
    }),
    shareReplay(1),
  )
}

export function createNetworkContext$<A>(
  web3NetworkContextConnected$: Observable<Web3NetworkContextConnected>,
): Observable<NetworkContext> {
  return web3NetworkContextConnected$.pipe(
    map((web3NetworkContext) => {
      return {
        ...networks[web3NetworkContext.chainId],
        ...web3NetworkContext,
        contract: (c: ContractDesc) => contract(web3NetworkContext.web3, c),
      }
    }),
    shareReplay(1),
  )
}

export type EveryBlockFunction$ = <O>(
  o$: Observable<O>,
  compare?: (x: O, y: O) => boolean,
) => Observable<O>

export function compareBigNumber(a1: BigNumber, a2: BigNumber): boolean {
  return a1.comparedTo(a2) === 0
}

export function createOnEveryBlock$<A>(
  web3NetworkContextConnected$: Observable<Web3NetworkContextConnected>,
): [Observable<number>, EveryBlockFunction$] {
  const onEveryBlock$ = combineLatest(web3NetworkContextConnected$, every5Seconds$).pipe(
    switchMap(([{ web3 }]) => bindNodeCallback(web3.eth.getBlockNumber)()),
    catchError((error, source) => {
      console.log(error)
      return concat(every5Seconds$.pipe(skip(1), first()), source)
    }),
    distinctUntilChanged(),
    shareReplay(1),
  )

  function everyBlock$<O>(o$: Observable<O>, compare?: (x: O, y: O) => boolean) {
    return onEveryBlock$.pipe(
      switchMap(() => o$),
      distinctUntilChanged(compare),
    )
  }

  return [onEveryBlock$, everyBlock$]
}

export function createInitializedAccount$(account$: Observable<string | undefined>) {
  return account$.pipe(
    filter((account: string | undefined) => account !== undefined),
  ) as Observable<string>
}

export function reload(network: string) {
  if (document.location.href.indexOf('network=') !== -1) {
    document.location.href = document.location.href.replace(/network=[a-z]+/i, 'network=' + network)
  } else {
    document.location.href = document.location.href + '?network=' + network
  }
}

export function getNetwork() {
  const name = 'network'
  const match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search)
  return (match && decodeURIComponent(match[1].replace(/\+/g, ' '))) || 'main'
}

const web3s: any[] = []
export const contract = memoize(
  (web3: any, { abi, address }: ContractDesc) => new web3.eth.Contract(abi.default, address),
  (web3: any, { address }: ContractDesc) => {
    if (web3s.indexOf(web3) < 0) {
      web3s[web3s.length] = web3
    }
    return `${web3s.indexOf(web3)}${address}`
  },
)
