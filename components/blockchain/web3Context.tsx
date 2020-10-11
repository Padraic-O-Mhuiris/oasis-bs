import { AbstractConnector } from '@web3-react/abstract-connector'
import { useWeb3React } from '@web3-react/core'
import { NetworkConnector } from '@web3-react/network-connector'
import { isAppContextAvailable, useAppContext } from 'components/AppContextProvider'
import { networks } from 'components/blockchain/config'
import { getNetwork } from 'components/connectWallet/ConnectWallet'
import { Web3Provider } from 'ethers/dist/types/providers'
import { Address } from 'helpers/schemas'
import { WithChildren } from 'helpers/types'
import { isEqual } from 'lodash'
import React, { useEffect, useState } from 'react'
import { Observable, ReplaySubject } from 'rxjs'
import { distinctUntilChanged, filter, shareReplay } from 'rxjs/operators'
import Web3 from 'web3'

export type AccountKind = 'injected'

export interface AccountConnectable {
  connect: (connector: AbstractConnector, accountKind: AccountKind) => void
}

export interface Web3AccountContextNotConnected extends AccountConnectable {
  status: 'notConnected'
}

export interface Web3AccountContextConnecting {
  status: 'connecting'
  accountKind: AccountKind
}

export interface Web3AccountContextConnected {
  status: 'connected'
  accountKind: AccountKind
  web3: Web3
  chainId: number
  deactivate: () => void
  account: Address
}
export interface Web3AccountContextError extends AccountConnectable {
  status: 'error'
  error: Error
}

export type Web3AccountContext =
  | Web3AccountContextNotConnected
  | Web3AccountContextConnecting
  | Web3AccountContextError
  | Web3AccountContextConnected

export type NetworkKind = 'network'

export interface NetworkConnectable {
  connect: (connector: AbstractConnector, networkKind: NetworkKind) => void
}

export interface Web3NetworkContextNotConnected extends NetworkConnectable {
  status: 'notConnected'
}

export interface Web3NetworkContextConnecting {
  status: 'connecting'
  networkKind: NetworkKind
}

export interface Web3NetworkContextConnected {
  status: 'connected'
  networkKind: NetworkKind
  web3: Web3
  chainId: number
  deactivate: () => void
}

export interface Web3NetworkContextError extends NetworkConnectable {
  status: 'error'
  error: Error
}

export type Web3NetworkContext =
  | Web3NetworkContextNotConnected
  | Web3NetworkContextConnecting
  | Web3NetworkContextError
  | Web3NetworkContextConnected

type Web3Context = [
  Observable<Web3AccountContext>,
  Observable<Web3AccountContextConnected>,
  () => void,
  Observable<Web3NetworkContext>,
  Observable<Web3NetworkContextConnected>,
  () => void,
]

function createWeb3AccountContextSetup(web3Context$: ReplaySubject<Web3AccountContext>) {
  function push(c: Web3AccountContext) {
    web3Context$.next(c)
  }

  function setupWeb3Context$() {
    const context = useWeb3React<Web3Provider>('account')
    if (!context) {
      return
    }

    const { connector, library, chainId, account, activate, deactivate, active, error } = context
    const [activatingConnector, setActivatingConnector] = useState<AbstractConnector>()
    const [accountKind, setAccountKind] = useState<AccountKind>()

    async function connect(connector: AbstractConnector, accountKind: AccountKind) {
      setActivatingConnector(connector)
      setAccountKind(accountKind)
      await activate(connector, (e: Error) => console.error(e), false)
    }

    useEffect(() => {
      if (activatingConnector && activatingConnector === connector) {
        setActivatingConnector(undefined)
      }
    }, [activatingConnector, connector])

    useEffect(() => {
      if (activatingConnector) {
        push({
          status: 'connecting',
          accountKind: accountKind!,
        })
        return
      }

      if (!active) {
        push({
          status: 'notConnected',
          connect,
        })
        return
      }

      if (error) {
        push({
          status: 'error',
          error,
          connect,
        })
        return
      }

      if (active && account && chainId) {
        push({
          status: 'connected',
          accountKind: accountKind!,
          web3: library as any,
          chainId: chainId,
          account: account,
          deactivate,
        })
      }
    }, [
      activatingConnector,
      accountKind,
      connector,
      library,
      chainId,
      account,
      activate,
      deactivate,
      active,
      error,
    ])
  }

  return setupWeb3Context$
}

function createWeb3NetworkContextSetup(web3Context$: ReplaySubject<Web3NetworkContext>) {
  function push(c: Web3NetworkContext) {
    web3Context$.next(c)
  }

  function setupWeb3Context$() {
    const context = useWeb3React<Web3Provider>('network')
    if (!context) {
      return
    }

    const { connector, library, chainId, account, activate, deactivate, active, error } = context

    const [activatingConnector, setActivatingConnector] = useState<AbstractConnector>()
    const [networkKind, setNetworkKind] = useState<NetworkKind>()

    async function connect(connector: AbstractConnector, networkKind: NetworkKind) {
      setActivatingConnector(connector)
      setNetworkKind(networkKind)
      await activate(connector, (e: Error) => console.log(e), false)
    }

    useEffect(() => {
      if (activatingConnector && activatingConnector === connector) {
        setActivatingConnector(undefined)
      }
    }, [activatingConnector, connector])

    useEffect(() => {
      if (activatingConnector) {
        push({
          status: 'connecting',
          networkKind: networkKind!,
        })
        return
      }

      if (!connector) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        connect(
          new NetworkConnector({
            urls: { [getNetwork()]: networks[getNetwork()].infuraUrl },
            defaultChainId: getNetwork(),
          }),
          'network',
        )

        push({
          status: 'notConnected',
          connect,
        })
        return
      }

      if (error) {
        push({
          connect,
          status: 'error',
          error,
        })
        return
      }

      if (active && chainId) {
        push({
          status: 'connected',
          networkKind: networkKind!,
          web3: library as any,
          chainId: chainId,
          deactivate,
        })
      }
    }, [
      activatingConnector,
      networkKind,
      connector,
      library,
      chainId,
      account,
      activate,
      deactivate,
      active,
      error,
    ])
  }

  return setupWeb3Context$
}

export function createWeb3Context$(): Web3Context {
  const _web3AccountContext$ = new ReplaySubject<Web3AccountContext>(1)
  const _web3NetworkContext$ = new ReplaySubject<Web3NetworkContext>(1)

  const web3AccountContext$ = _web3AccountContext$.pipe(distinctUntilChanged(isEqual))
  const web3NetworkContext$ = _web3NetworkContext$.pipe(distinctUntilChanged(isEqual))

  const web3AccountContextConnected$ = web3AccountContext$.pipe(
    filter(({ status }) => status === 'connected'),
    shareReplay(1),
  )

  const web3NetworkContextConnected$ = web3NetworkContext$.pipe(
    filter(({ status }) => status === 'connected'),
    shareReplay(1),
  )
  return [
    web3AccountContext$,
    web3AccountContextConnected$,
    createWeb3AccountContextSetup(_web3AccountContext$),
    web3NetworkContext$,
    web3NetworkContextConnected$,
    createWeb3NetworkContextSetup(_web3NetworkContext$),
  ]
}

function SetupWeb3AccountContextInternal({ children }: WithChildren) {
  const { setupWeb3AccountContext$ } = useAppContext()

  setupWeb3AccountContext$()
  return children
}

function SetupWeb3NetworkContextInternal({ children }: WithChildren) {
  const { setupWeb3NetworkContext$ } = useAppContext()
  setupWeb3NetworkContext$()
  return children
}

export function SetupWeb3Context({ children }: WithChildren) {
  if (isAppContextAvailable()) {
    return (
      <SetupWeb3AccountContextInternal>
        <SetupWeb3NetworkContextInternal>{children}</SetupWeb3NetworkContextInternal>
      </SetupWeb3AccountContextInternal>
    )
  }
  return children
}
