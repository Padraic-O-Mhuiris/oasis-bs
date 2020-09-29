import { BigNumber } from 'bignumber.js'
import getConfig from 'next/config'
import { Dictionary } from 'ramda'
import { Observable } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import { map, shareReplay } from 'rxjs/operators'

const {
  publicRuntimeConfig: { wyreApiHost },
} = getConfig()

export function getWyreRates$(): Observable<Dictionary<BigNumber>> {
  return ajax({
    url: `https://${wyreApiHost}/v3/rates`,
  }).pipe(
    map((r: any) => {
      const rates: Dictionary<any> = r.response
      Object.keys(rates).forEach((key: string) => {
        rates[key] = new BigNumber(rates[key])
      })
      return { ...rates, USDDAI: new BigNumber(1) }
    }),
    shareReplay(1),
  )
}
