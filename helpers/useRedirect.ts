import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'

export function getQueryParams(query: ParsedUrlQuery) {
  let queryParams = '?'

  queryParams += query.network ? `network=${query.network}` : ''

  return queryParams === '?' ? '' : queryParams
}

export function useRedirect() {
  const router = useRouter()

  function push(url: string, as?: string) {
    const queryParams = getQueryParams(router.query)
    /* eslint-disable-next-line */
    router.push(`${url}${queryParams}`, `${as || url}${queryParams}`)
  }

  function replace(url: string, as?: string) {
    const queryParams = getQueryParams(router.query)
    /* eslint-disable-next-line */
    router.replace(`${url}${queryParams}`, `${as || url}${queryParams}`)
  }

  return { push, replace }
}
