import { ReplaySubject, Observable } from 'rxjs'
import { useRouter } from 'next/router'
import Web3 from 'web3'
import { isAppContextAvailable, useAppContext } from 'components/AppContextProvider'
import { distinctUntilChanged } from 'rxjs/operators'
import { isEqual } from 'lodash'
import { WithChildren } from 'helpers/types'

export function createAddress$(): [Observable<string>, (address: string) => void, () => void] {
  const address$ = new ReplaySubject<string>(1)

  function changeAddress(address: string) {
    if (address && Web3.utils.isAddress(address)) {
      address$.next(address)
    }
  }

  function setupAddressContext$() {
    const router = useRouter()
    const { address } = router.query
    changeAddress(address as string)
  }

  return [address$.pipe(distinctUntilChanged(isEqual)), changeAddress, setupAddressContext$]
}

function SetupAddressContextInternal({ children }: WithChildren) {
  const { setupAddress$ } = useAppContext()
  setupAddress$()
  return children
}

export function SetupAddressContext({ children }: WithChildren) {
  if (isAppContextAvailable()) {
    return <SetupAddressContextInternal>{children}</SetupAddressContextInternal>
  }
  return children
}
