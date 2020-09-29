import { BigNumber } from 'bignumber.js'
import { getToken } from 'components/blockchain/config'
import { Context, every10Seconds$ } from 'components/blockchain/network'
import { bindNodeCallback, combineLatest, forkJoin, Observable, of } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import { catchError, distinctUntilChanged, map, shareReplay, switchMap } from 'rxjs/operators'

export interface Ticker {
  [label: string]: BigNumber
}

export type GasPrice$ = Observable<BigNumber>

export function createGasPrice$<A>(
  onEveryBlock$: Observable<number>,
  context$: Observable<Context>,
): GasPrice$ {
  return combineLatest(onEveryBlock$, context$).pipe(
    switchMap(([, { web3 }]) => bindNodeCallback(web3.eth.getGasPrice)()),
    map((x) => new BigNumber(x)),
    distinctUntilChanged((x: BigNumber, y: BigNumber) => x.eq(y)),
    shareReplay(1),
  )
}

// TODO: This should be unified with fetching price for ETH.
// Either this logic should contain only fetching from 3rd party endpoint
// or we wait until all of the tokens have PIP deployed.

const tradingTokens = ['DAI', 'ETH']

export const tokenPricesInUSD$: Observable<Ticker> = every10Seconds$.pipe(
  switchMap(() =>
    forkJoin(
      tradingTokens.map((token) =>
        ajax({
          url: `https://api.coinpaprika.com/v1/tickers/${getToken(token).ticker}/`,
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }).pipe(
          map(({ response }) => ({
            [token]: new BigNumber(response.quotes.USD.price),
          })),
          catchError((error) => {
            console.debug(`Error fetching price data: ${error}`)
            return of({})
          }),
        ),
      ),
    ),
  ),
  map((prices) => prices.reduce((a, e) => ({ ...a, ...e }))),
  shareReplay(1),
)

export const etherPriceUsd$: Observable<BigNumber | undefined> = every10Seconds$.pipe(
  switchMap(() => getPriceFeed('eth-ethereum')),
  distinctUntilChanged((x: BigNumber, y: BigNumber) => x?.eq(y)),
  shareReplay(1),
)

function getPriceFeed(ticker: string): Observable<BigNumber | undefined> {
  return ajax({
    url: `https://api.coinpaprika.com/v1/tickers/${ticker}/`,
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  }).pipe(
    map(({ response }) => new BigNumber(response.quotes.USD.price)),
    catchError((error) => {
      console.debug(`Error fetching price data: ${error}`)
      return of(undefined)
    }),
  )
}
