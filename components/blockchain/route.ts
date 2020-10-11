import { RouteQuery, RouteQuerySchema } from 'helpers/schemas'
import { isEqual } from 'lodash'
import Router from 'next/router'
import { Observable, ReplaySubject } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'

export function createRouteChangeComplete$(): Observable<RouteQuery> {
  const routeQuery$ = new ReplaySubject<RouteQuery>(1)

  Router.events.on('routeChangeComplete', () => {
    const { query } = Router
    const validatedQuery = RouteQuerySchema.parse(query)
    routeQuery$.next(validatedQuery)
  })

  return routeQuery$.pipe(distinctUntilChanged(isEqual))
}
