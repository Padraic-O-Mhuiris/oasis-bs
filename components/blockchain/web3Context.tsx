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
import { distinctUntilChanged } from 'rxjs/operators'
import Web3 from 'web3'

export type ConnectionKind = 'injected' | 'network'

interface Connectable {
  connect: (connector: AbstractConnector, connectionKind: ConnectionKind) => void
}

export interface Web3ContextNotConnected extends Connectable {
  status: 'notConnected'
}

export interface Web3ContextConnecting {
  status: 'connecting'
  connectionKind: ConnectionKind
}

export interface Web3ContextConnected {
  status: 'connected'
  connectionKind: ConnectionKind
  web3: Web3
  chainId: number
  deactivate: () => void
  account: string
}

export interface Web3ContextError extends Connectable {
  status: 'error'
  error: Error
}

export type Web3Context =
  | Web3ContextNotConnected
  | Web3ContextConnecting
  | Web3ContextError
  | Web3ContextConnected

function createSetupWeb3Context$(): [Observable<Web3Context>, () => void] {
  const web3Context$ = new ReplaySubject<Web3Context>(1)

  function push(c: Web3Context) {
    web3Context$.next(c)
  }

  function setupWeb3Context$() {
    const context = useWeb3React<Web3Provider>()
    const { connector, library, chainId, account, activate, deactivate, active, error } = context

    const [activatingConnector, setActivatingConnector] = useState<AbstractConnector>()
    const [connectionKind, setConnectionKind] = useState<ConnectionKind>()

    async function connect(connector: AbstractConnector, connectionKind: ConnectionKind) {
      setActivatingConnector(connector)
      setConnectionKind(connectionKind)
      await activate(connector)
      console.log('Activated connector', context)
    }

    useEffect(() => {
      if (activatingConnector && activatingConnector === connector) {
        setActivatingConnector(undefined)
      }
    }, [activatingConnector, connector])

    useEffect(() => {
      if (process.browser && (window as any).ethereum) {
        ;(window as any).ethereum.autoRefreshOnNetworkChange = false
      }
    }, [])

    useEffect(() => {
      if (activatingConnector) {
        push({
          status: 'connecting',
          connectionKind: connectionKind!,
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

      if (!connector) {
        push({
          status: 'notConnected',
          connect,
        })
        return
      }

      if (chainId !== getNetwork()) {
        setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          connect(
            new NetworkConnector({
              urls: { [getNetwork()]: networks[getNetwork()].infuraUrl },
              defaultChainId: getNetwork(),
            }),
            'network',
          )
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

  return [web3Context$.pipe(distinctUntilChanged(isEqual)), setupWeb3Context$]
}

// export function createBlockNumber$(web3Context$: Observable<Web3Context>): Observable<number> {
//   //     return from(web3Context.web3.eth.getBlockNumber())
//   return web3Context$.pipe(
//     filter(web3Context => web3Context.status === 'connected'),
//     distinctUntilChanged((c1, c2) =>
//       c1.status === 'connected' &&
//       c1.status === c2.status &&
//       c1.web3 === c2.web3 &&
//       c1.chainId === c2.chainId
//     ),
//     switchMap((web3Context: Web3ContextConnected) => {
//       return new Observable<number>((subscriber) => {
//         const s = web3Context.web3.eth.subscribe('newBlockHeaders', (error, blockHeader) => {
//           if(error) {
//             subscriber.error(error)
//           }
//           subscriber.next(blockHeader.number)
//         })
//         return () => s.unsubscribe()
//       })
//     }),
//     shareReplay(1)
//   )
// }

export function createWeb3Context$(): [Observable<Web3Context>, () => void] {
  const [web3Context$, setupWeb3Context$] = createSetupWeb3Context$()
  return [web3Context$, setupWeb3Context$]
}

function SetupWeb3ContextInternal({ children }: WithChildren) {
  const { setupWeb3Context$ } = useAppContext()
  setupWeb3Context$()
  return children
}

export function SetupWeb3Context({ children }: WithChildren) {
  if (isAppContextAvailable()) {
    return <SetupWeb3ContextInternal>{children}</SetupWeb3ContextInternal>
  }
  return children
}
