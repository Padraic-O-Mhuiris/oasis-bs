import { Address, AddressQuerySchema, RouteQuery } from 'helpers/schemas'
import { isEqual } from 'lodash'
import { Observable } from 'rxjs'
import { distinctUntilChanged, filter, map, shareReplay } from 'rxjs/operators'

export function createAddress$(routeChangeComplete$: Observable<RouteQuery>): Observable<Address> {
  return routeChangeComplete$.pipe(
    filter((query) => AddressQuerySchema.safeParse(query).success),
    map(({ address }) => address),
    distinctUntilChanged(isEqual),
    shareReplay(1),
  )
}
