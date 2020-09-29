import { AbstractConnector } from '@web3-react/abstract-connector'
import { useWeb3React } from '@web3-react/core'
import { NetworkConnector } from '@web3-react/network-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import BigNumber from 'bignumber.js'
import { isAppContextAvailable, useAppContext } from 'components/AppContextProvider'
import { networks, pollingInterval } from 'components/blockchain/config'
import { contract } from 'components/blockchain/network'
import { amountFromWei } from 'components/blockchain/utils'
import { getNetwork, SUCCESSFUL_CONNECTION } from 'components/connectWallet/ConnectWallet'
import { Web3Provider } from 'ethers/dist/types/providers'
import { WithChildren } from 'helpers/types'
import { LedgerConnector } from 'ledgerConnector/ledgerConnector'
import { isEqual } from 'lodash'
import React, { useEffect, useState } from 'react'
import { Observable, ReplaySubject } from 'rxjs'
import { distinctUntilChanged, filter } from 'rxjs/operators'
import Web3 from 'web3'

export type ConnectionKind =
  | 'injected'
  | 'walletLink'
  | 'walletConnect'
  | 'trezor'
  | 'ledger'
  | 'network'

interface Connectable {
  connect: (connector: AbstractConnector, connectionKind: ConnectionKind) => void
  connectLedger: (chainId: number, derivationPath: string) => void
}

export interface Web3ContextNotConnected extends Connectable {
  status: 'notConnected'
}

export interface Web3ContextConnecting {
  status: 'connecting'
  connectionKind: ConnectionKind
}

export interface HWAccountInfo {
  address: string
  ethAmount: BigNumber
  daiAmount: BigNumber
}

export interface Web3ContextConnectingHWSelectAccount {
  status: 'connectingHWSelectAccount'
  connectionKind: 'ledger' | 'trezor'
  getAccounts: (accountsLength: number) => Promise<HWAccountInfo[]>
  selectAccount: (account: string) => void
  deactivate: () => void
}

export interface Web3ContextConnectedReadonly extends Connectable {
  status: 'connectedReadonly'
  connectionKind: ConnectionKind
  web3: Web3
  chainId: number
  deactivate: () => void
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
  | Web3ContextConnectingHWSelectAccount
  | Web3ContextError
  | Web3ContextConnectedReadonly
  | Web3ContextConnected

async function fetchAccountBalances(
  accountsLength: number,
  connector: any,
  chainId: number,
  connectionKind: 'ledger' | 'trezor',
): Promise<HWAccountInfo[]> {
  const web3 = new Web3(connector.provider)

  const accounts =
    connectionKind === 'ledger'
      ? await connector.getAccounts(accountsLength)
      : await connector.provider._providers[0].getAccountsAsync(accountsLength)

  return await Promise.all(
    accounts.map(async (address: string) => {
      const etherBalance = amountFromWei(new BigNumber(await web3.eth.getBalance(address)), 'ETH')
      const balanceOf = contract(web3, networks[chainId!].tokens.DAI).methods.balanceOf
      const daiBalance = amountFromWei(new BigNumber(await balanceOf(address).call()), 'DAI')
      return {
        address: Web3.utils.toChecksumAddress(address),
        daiAmount: daiBalance,
        ethAmount: etherBalance,
      }
    }),
  )
}

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
    const [hwAccount, setHWAccount] = useState<string>()

    async function connect(connector: AbstractConnector, connectionKind: ConnectionKind) {
      setActivatingConnector(connector)
      setConnectionKind(connectionKind)
      await activate(connector)
    }

    async function connectLedger(chainId: number, baseDerivationPath: string) {
      const connector = new LedgerConnector({
        baseDerivationPath,
        chainId,
        url: networks[chainId].infuraUrl,
        pollingInterval: pollingInterval,
      })
      setActivatingConnector(connector)
      setConnectionKind('ledger')
      setHWAccount(undefined)
      await activate(connector)
    }

    useEffect(() => {
      if (activatingConnector && activatingConnector === connector) {
        setActivatingConnector(undefined)
      }
    }, [activatingConnector, connector])

    useEffect(() => {
      if (connector && (connector as WalletLinkConnector).walletLink) {
        const con = connector as WalletLinkConnector
        con.walletLink._relay.connection.sessionConfig$
          .pipe(filter((c: any) => !!c.metadata && c.metadata.__destroyed === '1'))
          .subscribe(() => {
            localStorage.removeItem(SUCCESSFUL_CONNECTION)
          })
      }

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
          connectLedger,
        })
        return
      }

      if (!connector) {
        push({
          status: 'notConnected',
          connect,
          connectLedger,
        })
        return
      }

      if (!account) {
        push({
          status: 'connectedReadonly',
          connectionKind: connectionKind!,
          web3: library as any,
          chainId: chainId!,
          connect,
          connectLedger,
          deactivate,
        })
        return
      }

      if ((connectionKind === 'ledger' || connectionKind === 'trezor') && !hwAccount) {
        push({
          status: 'connectingHWSelectAccount',
          connectionKind,
          getAccounts: async (accountsLength: number) =>
            await fetchAccountBalances(accountsLength, connector, chainId!, connectionKind),
          selectAccount: (account: string) => {
            setHWAccount(account)
          },
          deactivate,
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
        account: ['ledger', 'trezor'].indexOf(connectionKind!) >= 0 ? hwAccount! : account!,
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
      hwAccount,
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
