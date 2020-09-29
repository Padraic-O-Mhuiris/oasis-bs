// tslint:disable:no-console
import BigNumber from 'bignumber.js'
import { Web3Context, Web3ContextConnected } from 'components/blockchain/web3Context'
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

export type ContextConnected = NetworkConfig & Web3ContextConnected & WithContractMethod

export type Context = ContextConnected

export function createContext$<A>(
  web3ContextConnected$: Observable<Web3ContextConnected>,
): Observable<Context> {
  return web3ContextConnected$.pipe(
    map((web3Context) => {
      return {
        ...networks[web3Context.chainId],
        ...web3Context,
        contract: (c: ContractDesc) => contract(web3Context.web3, c),
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
  web3Context$: Observable<Web3ContextConnected>,
): [Observable<number>, EveryBlockFunction$] {
  const onEveryBlock$ = combineLatest(web3Context$, every5Seconds$).pipe(
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

export function createWeb3ContextConnected$(web3Context$: Observable<Web3Context>) {
  return web3Context$.pipe(filter(({ status }) => status === 'connected')) as Observable<
    Web3ContextConnected
  >
}

export function createAccount$(web3Context$: Observable<Web3Context>) {
  return web3Context$.pipe(
    map((status) => (status.status === 'connected' ? status.account : undefined)),
  )
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
