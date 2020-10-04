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

export enum Web3ContextType {
  Network = 'Network',
  Account = 'Account',
}

export type ConnectionKind = 'injected' | 'network'

export interface Connectable {
  connect: (connector: AbstractConnector, connectionKind: ConnectionKind) => void
}

export interface Web3ContextNotConnected extends Connectable {
  status: 'notConnected'
}

export interface Web3ContextConnecting {
  status: 'connecting'
  connectionKind: ConnectionKind
}

export interface Web3AccountContextConnected {
  status: 'connected'
  connectionKind: AccountKind
  web3: Web3
  chainId: number
  deactivate: () => void
  account: string
}

export interface Web3NetworkContextConnected {
  status: 'connected'
  connectionKind: NetworkKind
  web3: Web3
  chainId: number
  deactivate: () => void
}

export interface Web3ContextError extends Connectable {
  status: 'error'
  error: Error
}

export type Web3AccountContext =
  | Web3ContextNotConnected
  | Web3ContextConnecting
  | Web3ContextError
  | Web3AccountContextConnected

export type Web3NetworkContext =
  | Web3ContextNotConnected
  | Web3ContextConnecting
  | Web3ContextError
  | Web3NetworkContextConnected

type CreatedWeb3Context = [
  Observable<Web3AccountContext>,
  Observable<Web3AccountContextConnected>,
  () => void,
  Observable<Web3NetworkContext>,
  Observable<Web3NetworkContextConnected>,
  () => void,
]

function createWeb3ContextSetup(
  web3Context$: ReplaySubject<Web3AccountContext | Web3NetworkContext>,
  isNetwork: boolean,
) {
  function push(c: Web3Context) {
    web3Context$.next(c)
  }

  function setupWeb3Context$() {
    const context = useWeb3React<Web3Provider>(
      isNetwork ? Web3ContextType.Network : Web3ContextType.Account,
    )
    const { connector, library, chainId, account, activate, deactivate, active, error } = context

    const [activatingConnector, setActivatingConnector] = useState<AbstractConnector>()
    const [connectionKind, setConnectionKind] = useState<ConnectionKind>()

    async function connect(connector: AbstractConnector, connectionKind: ConnectionKind) {
      setActivatingConnector(connector)
      setConnectionKind(connectionKind)
      await activate(connector, (e: Error) => console.error(e), false)
    }

    useEffect(() => {
      if (activatingConnector && activatingConnector === connector) {
        setActivatingConnector(undefined)
      }
    }, [activatingConnector, connector])

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
        return
      }

      if (isNetwork) {
        console.log('k2e ck 2')
        if (error) {
          console.log('Web3NetworkContext Error: attempting reconnect in 5s...', err)
          push({
            status: 'error',
            error,
          })
          setTimeout(() => connectNetwork, 5 * 1000)
          return
        } else {
          connectNetwork()
          push({
            status: 'connected',
            connectionKind: 'network',
            web3: library as any,
            chainId: chainId!,
            deactivate,
          })
          return
        }
      } else {
        if (error) {
          console.log(error)
          push({
            status: 'error',
            error,
            connect,
          })
          return
        } else {
          push({
            status: 'connected',
            connectionKind: connectionKind!,
            web3: library as any,
            chainId: chainId!,
            account: account!,
            deactivate,
          })
        }
      }

      return () => {
        console.log('unmount')
        deactivate()
      }
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

  const web3AccountContext = [
    web3AccountContext$,
    web3AccountContext$.pipe(filter(({ status }) => status === 'connected')) as Observable<
      Web3AccountContextConnected
    >,
    createWeb3ContextSetup(_web3AccountContext$, false),
  ]

  const web3NetworkContext = [
    web3NetworkContext$,
    web3NetworkContext$.pipe(filter(({ status }) => status === 'connected')) as Observable<
      Web3NetworkContextConnected
    >,
    createWeb3ContextSetup(_web3NetworkContext$, true),
  ]

  return [...web3AccountContext, ...web3NetworkContext]
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
