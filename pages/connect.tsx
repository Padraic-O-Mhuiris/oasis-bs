import { useAppContext } from 'components/AppContextProvider'
import { ConnectWallet } from 'components/connectWallet/ConnectWallet'
import { useRedirect } from 'helpers/useRedirect'
import React, { useEffect } from 'react'

export default function ConnectPage() {
  const { web3AccountContext$ } = useAppContext()
  const { replace } = useRedirect()

  useEffect(() => {
    const subscription = web3AccountContext$.subscribe((web3AccountContext) => {
      if (web3AccountContext.status === 'connected') {
        replace(`/owner/${web3AccountContext.account}`)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return <ConnectWallet />
}
