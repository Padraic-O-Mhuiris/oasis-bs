import { RouteQuerySchema, RouteQuery } from 'helpers/schemas'
import Router from 'next/router'
import { Observable, Observer } from 'rxjs'
import { share } from 'rxjs/operators'

export const routeChangeComplete$: Observable<RouteQuery> = Observable.create(
  (obs: Observer<any>) => {
    Router.events.on('routeChangeComplete', () => {
      const { query } = Router
      const validatedQuery = RouteQuerySchema.parse(query)
      obs.next(validatedQuery)
    })
  },
).pipe(share())
