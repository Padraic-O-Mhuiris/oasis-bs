import { useAppContext } from 'components/AppContextProvider'
import { ConnectWallet } from 'components/connectWallet/ConnectWallet'
import { HeaderlessLayout } from 'components/Layouts'
import { useRedirect } from 'helpers/useRedirect'
import React, { useEffect } from 'react'

export default function ConnectPage() {
  const { web3Context$ } = useAppContext()
  const { replace } = useRedirect()

  useEffect(() => {
    const subscription = web3Context$.subscribe((web3Context) => {
      if (web3Context.status === 'connected') {
        replace(`/owner/[address]`, `/owner/${web3Context.account}`)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return <ConnectWallet />
}

ConnectPage.layout = HeaderlessLayout
