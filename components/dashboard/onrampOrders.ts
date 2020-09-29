import BigNumber from 'bignumber.js'
import getConfig from 'next/config'
import { Observable, of } from 'rxjs'
import { ajax } from 'rxjs/internal-compatibility'
import { catchError, map } from 'rxjs/operators'

const {
  publicRuntimeConfig: { apiHost },
} = getConfig()

export type OnrampOrder = {
  id: string
  type: 'wyre' | 'moonpay'
  status: 'pending' | 'complete' | 'failed'
  amount: BigNumber
  date: Date
  token: string
}
export type WyreOrder = OnrampOrder & {
  type: 'wyre'
}
export type MoonpayOrder = OnrampOrder & {
  type: 'moonpay'
}

export function createOnrampOrders$(address: string): Observable<OnrampOrder[]> {
  return ajax({
    url: `${apiHost || ''}/api/order/${address.toLowerCase()}`,
  }).pipe(
    map((r: any) =>
      r.response.map((e: any) => ({
        ...e,
        amount: new BigNumber(e.amount),
        date: new Date(e.date),
      })),
    ),
    catchError(() => of()),
  )
}
