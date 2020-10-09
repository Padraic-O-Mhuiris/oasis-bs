import { AbstractConnector } from '@web3-react/abstract-connector'
import { useWeb3React } from '@web3-react/core'
import { NetworkConnector } from '@web3-react/network-connector'
import { isAppContextAvailable, useAppContext } from 'components/AppContextProvider'
import { networks } from 'components/blockchain/config'
import { getNetwork } from 'components/connectWallet/ConnectWallet'
import { Web3Provider } from 'ethers/dist/types/providers'
import { WithChildren } from 'helpers/types'
import { isEqual } from 'lodash'
import React, { useEffect, useState } from 'react'
import { Observable, ReplaySubject } from 'rxjs'
import { distinctUntilChanged, filter } from 'rxjs/operators'
import Web3 from 'web3'

export type NetworkKind = 'network'
export type AccountKind = 'injected'

export interface Connectable<ConnectionKind> {
  connect: (connector: AbstractConnector, connectionKind: ConnectionKind) => void
}

export interface Web3AccountContextNotConnected extends Connectable<AccountKind> {
  status: 'notConnected'
}

export interface Web3AccountContextConnecting {
  status: 'connecting'
  connectionKind: AccountKind
}

export interface Web3AccountContextConnected {
  status: 'connected'
  connectionKind: AccountKind
  web3: Web3
  chainId: number
  deactivate: () => void
  account: string
}
export interface Web3AccountContextError extends Connectable<AccountKind> {
  status: 'error'
  error: Error
}

export type Web3AccountContext =
  | Web3AccountContextNotConnected
  | Web3AccountContextConnecting
  | Web3AccountContextError
  | Web3AccountContextConnected

export interface Web3NetworkContextNotConnected extends Connectable<NetworkKind> {
  status: 'notConnected'
}

export interface Web3NetworkContextConnecting {
  status: 'connecting'
  connectionKind: NetworkKind
}

export interface Web3NetworkContextConnected {
  status: 'connected'
  connectionKind: NetworkKind
  web3: Web3
  chainId: number
  deactivate: () => void
}

export interface Web3NetworkContextError extends Connectable<NetworkKind> {
  status: 'error'
  error: Error
}

export type Web3NetworkContext =
  | Web3NetworkContextNotConnected
  | Web3NetworkContextConnecting
  | Web3NetworkContextError
  | Web3NetworkContextConnected

type CreatedWeb3Context = [
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
    const [connectionKind, setConnectionKind] = useState<AccountKind>()

    async function connect(connector: AbstractConnector, connectionKind: AccountKind) {
      setActivatingConnector(connector)
      setConnectionKind(connectionKind)
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
          connectionKind: connectionKind!,
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
        console.log(error)
        push({
          status: 'error',
          error,
          connect,
        })
        return
      }

      push({
        status: 'connected',
        connectionKind: connectionKind!,
        web3: library as any,
        chainId: chainId!,
        account: account!,
        deactivate,
      })
    }, [
      activatingConnector,
      connectionKind,
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
    const [connectionKind, setConnectionKind] = useState<NetworkKind>()

    async function connect(connector: AbstractConnector, connectionKind: NetworkKind) {
      setActivatingConnector(connector)
      setConnectionKind(connectionKind)
      await activate(connector, (e: Error) => console.error(e), false)
    }

    function connectNetwork() {
      connect(
        new NetworkConnector({
          urls: { [getNetwork()]: networks[getNetwork()].infuraUrl },
          defaultChainId: getNetwork(),
        }),
        'network',
      )
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
          connectionKind: connectionKind!,
        })
        return
      }

      if (!connector) {
        push({
          status: 'notConnected',
          connect,
        })
        connectNetwork()
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

      push({
        status: 'connected',
        connectionKind: 'network',
        web3: library as any,
        chainId: chainId!,
        deactivate,
      })
    }, [
      activatingConnector,
      connectionKind,
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

export function createWeb3Context$(): CreatedWeb3Context {
  const _web3AccountContext$ = new ReplaySubject<Web3AccountContext>(1)
  const _web3NetworkContext$ = new ReplaySubject<Web3NetworkContext>(1)

  const web3AccountContext$ = _web3AccountContext$.pipe(distinctUntilChanged(isEqual))
  const web3NetworkContext$ = _web3NetworkContext$.pipe(distinctUntilChanged(isEqual))

  return [
    web3AccountContext$,
    web3AccountContext$.pipe(filter(({ status }) => status === 'connected')) as Observable<
      Web3AccountContextConnected
    >,
    createWeb3AccountContextSetup(_web3AccountContext$),
    web3NetworkContext$,
    web3NetworkContext$.pipe(filter(({ status }) => status === 'connected')) as Observable<
      Web3NetworkContextConnected
    >,
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
