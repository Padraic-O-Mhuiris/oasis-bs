// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import { UnsupportedChainIdError } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { NetworkConnector } from '@web3-react/network-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { useAppContext } from 'components/AppContextProvider'
import { dappName, networks, networksByName, pollingInterval } from 'components/blockchain/config'
import { ConnectionKind, Web3Context } from 'components/blockchain/web3Context'
import { AppLink } from 'components/Links'
import { LedgerAccountSelection } from 'components/withWallet/LedgerAccountSelection'
import { TrezorAccountSelection } from 'components/withWallet/TrezorAccountSelection'
import { useObservable } from 'helpers/observableHook'
import { WithChildren } from 'helpers/types'
import { useRedirect } from 'helpers/useRedirect'
import { useTranslation } from 'i18n'
import { LedgerConnector } from 'ledgerConnector/ledgerConnector'
import { mapValues } from 'lodash'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { combineLatest, Observable } from 'rxjs'
import { Alert, Box, Button, Flex, Grid, Heading, Spinner, Text } from 'theme-ui'
import { TrezorConnector } from 'trezorConnector/trezorConnector'
import { assert } from 'ts-essentials'
import Web3 from 'web3'

export const SUCCESSFUL_CONNECTION = 'successfulConnection'

const rpcUrls: { [chainId: number]: string } = mapValues(networks, (network) => network.infuraUrl)

export function getNetwork() {
  const name = 'network'
  const match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search)
  const network = (match && decodeURIComponent(match[1].replace(/\+/g, ' '))) || 'main'
  return Number.parseInt(networksByName[network].id)
}

async function getConnector(connectorKind: ConnectionKind, network: number, options: any = {}) {
  assert(rpcUrls[network], 'Unsupported chainId!')
  switch (connectorKind) {
    case 'injected':
      const connector = new InjectedConnector({
        supportedChainIds: Object.values(networks).map(({ id }) => Number.parseInt(id)),
      })
      const connectorChainId = Number.parseInt((await connector.getChainId()) as string)
      if (network !== connectorChainId) {
        alert('Browser ethereum provider and URL network param do not match!')
        throw new Error('Browser ethereum provider and URL network param do not match!')
      }
      return connector
    case 'walletLink':
      return new WalletLinkConnector({
        url: rpcUrls[network],
        appName: dappName,
      })
    case 'walletConnect':
      return new WalletConnectConnector({
        rpc: { [network]: rpcUrls[network] },
        bridge: 'https://bridge.walletconnect.org',
        qrcode: true,
        pollingInterval,
      })
    case 'trezor':
      return new TrezorConnector({
        chainId: network,
        url: rpcUrls[network],
        pollingInterval: pollingInterval,
        manifestEmail: 'dummy@abc.xyz',
        manifestAppUrl: 'http://localhost:1234',
        config: { networkId: network },
      })
    case 'ledger':
      return new LedgerConnector({
        ...options,
        chainId: network,
        url: rpcUrls[network],
        pollingInterval: pollingInterval,
      })
    case 'network':
      return new NetworkConnector({
        urls: { [network]: networks[network].infuraUrl },
        defaultChainId: network,
      })
  }
}

interface SupportedWallet {
  iconName: string
  connectionKind: ConnectionKind
}

const SUPPORTED_WALLETS: SupportedWallet[] = [
  { iconName: 'metamask_color', connectionKind: 'injected' },
  { iconName: 'wallet_connect_color', connectionKind: 'walletConnect' },
  { iconName: 'coinbase_color', connectionKind: 'walletLink' },
  { iconName: 'trezor', connectionKind: 'trezor' },
  { iconName: 'ledger', connectionKind: 'ledger' },
]

interface ConnectWalletButton {
  isConnecting: boolean
  iconName: string
  description: string
  connect?: () => void
}

function ConnectWalletButton({
  isConnecting,
  iconName,
  connect,
  description,
}: ConnectWalletButton) {
  return (
    <Button variant="outlineSquare" sx={{ textAlign: 'left' }} onClick={connect}>
      <Flex sx={{ alignItems: 'center' }}>
        <Flex sx={{ ml: 1, mr: 3, alignItems: 'center' }}>
          {isConnecting ? <Spinner size={22} /> : <Icon name={iconName} size={22} />}
        </Flex>
        {description}
      </Flex>
    </Button>
  )
}

function connect(
  web3Context: Web3Context | undefined,
  connectorKind: ConnectionKind,
  chainId: number,
  options: any = {},
) {
  return async () => {
    if (
      web3Context?.status === 'error' ||
      web3Context?.status === 'notConnected' ||
      web3Context?.status === 'connectedReadonly'
    ) {
      try {
        web3Context.connect(await getConnector(connectorKind, chainId, options), connectorKind)
      } catch (e) {
        console.log(e)
      }
    }
  }
}

export function getInjectedWalletKind() {
  const w = window as any

  if (w.imToken) return 'IMToken'

  if (!w.web3 || typeof w.web3.currentProvider === 'undefined') return undefined

  if (w.web3.currentProvider.isAlphaWallet) return 'Alpha Wallet'

  if (w.web3.currentProvider.isMetaMask) return 'MetaMask'

  if (w.web3.currentProvider.isTrust) return 'Trust'

  if (typeof w.SOFA !== 'undefined') return 'Coinbase'

  if (typeof w.__CIPHER__ !== 'undefined') return 'Coinbase'

  if (w.web3.currentProvider.constructor.name === 'EthereumProvider') return 'Mist'

  if (w.web3.currentProvider.constructor.name === 'Web3FrameProvider') return 'Parity'

  if (w.web3.currentProvider.host && w.web3.currentProvider.host.indexOf('infura') !== -1)
    return 'Infura'

  if (w.web3.currentProvider.host && w.web3.currentProvider.host.indexOf('localhost') !== -1)
    return 'Localhost'

  return 'Injected provider'
}

export function getConnectionKindMessage(connectionKind: ConnectionKind) {
  switch (connectionKind) {
    case 'injected':
      return getInjectedWalletKind()
    case 'walletConnect':
      return 'WalletConnect'
    case 'walletLink':
      return 'Coinbase wallet'
    case 'trezor':
      return 'Trezor'
    case 'ledger':
      return 'Ledger'
    case 'network':
      return 'Network'
  }
}

export function ConnectWallet() {
  const { web3Context$ } = useAppContext()
  const web3Context = useObservable(web3Context$)
  const { t } = useTranslation('common')
  const [connectingLedger, setConnectingLedger] = useState(false)

  useEffect(() => {
    if (web3Context?.status === 'connectedReadonly' || web3Context?.status === 'connected') {
      setConnectingLedger(false)
    }
  }, [web3Context])

  if (!web3Context) {
    return null
  }

  if (
    connectingLedger &&
    (web3Context.status === 'notConnected' ||
      web3Context.status === 'error' ||
      web3Context.status === 'connectedReadonly' ||
      web3Context.status === 'connecting' ||
      web3Context.status === 'connectingHWSelectAccount')
  ) {
    return (
      <LedgerAccountSelection
        cancel={() => {
          if (web3Context.status === 'connectingHWSelectAccount') {
            web3Context.deactivate()
            return setConnectingLedger(false)
          }
          return setConnectingLedger(false)
        }}
        chainId={getNetwork()}
        web3Context={web3Context}
      />
    )
  }

  if (
    (web3Context.status === 'connecting' || web3Context.status === 'connectingHWSelectAccount') &&
    web3Context.connectionKind === 'trezor'
  ) {
    return (
      <TrezorAccountSelection
        cancel={() => {
          if (web3Context.status === 'connectingHWSelectAccount') {
            web3Context.deactivate()
          }
        }}
        web3Context={web3Context}
      />
    )
  }

  if (web3Context.status === 'connecting' && web3Context.connectionKind === 'network') {
    return <Box>{t('readonly-user-connecting')}</Box>
  }

  // if (web3Context.status === 'connected' || web3Context.status === 'connectedReadonly') {
  //   return children
  // }

  return (
    <Grid
      gap={4}
      columns="1fr"
      sx={{
        textAlign: 'center',
        maxWidth: '300px',
        width: '100%',
        mx: 'auto',
      }}
    >
      <Heading as="h1">{t('connect-wallet')}</Heading>
      {web3Context.status === 'error' &&
        ((web3Context.error instanceof UnsupportedChainIdError && (
          <Alert variant="error" sx={{ fontWeight: 'normal', borderRadius: 'large' }}>
            <Text sx={{ my: 1, ml: 2, fontSize: 3, lineHeight: 'body' }}>
              {t('metamask-unsupported-network')}
            </Text>
          </Alert>
        )) || (
          <Alert variant="error" sx={{ fontWeight: 'normal', borderRadius: 'large' }}>
            <Text sx={{ my: 1, ml: 2, fontSize: 3, lineHeight: 'body' }}>{t('connect-error')}</Text>
          </Alert>
        ))}
      <Grid columns={1}>
        {SUPPORTED_WALLETS.map(({ iconName, connectionKind }) => {
          const isConnecting =
            web3Context.status === 'connecting' && web3Context.connectionKind === connectionKind
          const connectionKindMsg = getConnectionKindMessage(connectionKind)
          const descriptionTranslation = isConnecting ? 'connect-confirm' : 'connect-with'

          return (
            <ConnectWalletButton
              {...{
                key: connectionKind,
                isConnecting,
                iconName,
                description: t(descriptionTranslation, {
                  connectionKind: connectionKindMsg,
                }),
                connect:
                  web3Context.status === 'connecting'
                    ? undefined
                    : connectionKind === 'ledger'
                    ? () => setConnectingLedger(true)
                    : connect(web3Context, connectionKind, getNetwork()),
              }}
            />
          )
        })}
      </Grid>
      <Box sx={{ fontWeight: 'semiBold', mt: 5 }}>
        <Text>{t('new-to-ethereum')}</Text>
        <AppLink href="/" withAccountPrefix={false}>
          <Flex sx={{ alignItems: 'center', justifyContent: 'center', color: 'onSecondary' }}>
            <Text sx={{ color: 'onSecondary' }}>{t('learn-more-wallets')}</Text>
            <Icon name="increase" size="12px" sx={{ position: 'relative', ml: 1, top: '1px' }} />
          </Flex>
        </AppLink>
      </Box>
    </Grid>
  )
}

function autoConnect(
  web3Context$: Observable<Web3Context>,
  readOnlyAccount$: Observable<string | undefined>,
  defaultChainId: number,
) {
  let firstTime = true

  const subscription = combineLatest(web3Context$, readOnlyAccount$).subscribe(
    async ([web3Context, readOnlyAccount]) => {
      try {
        const serialized = localStorage.getItem(SUCCESSFUL_CONNECTION)
        if (firstTime && web3Context.status === 'notConnected' && serialized) {
          const connectionKind = JSON.parse(serialized) as ConnectionKind
          if (connectionKind !== 'ledger' && connectionKind !== 'trezor') {
            console.log('autoConnecting from localStorage', connectionKind, defaultChainId)
            const connector = await getConnector(connectionKind, defaultChainId)
            web3Context.connect(connector, connectionKind)
          }
        } else if (web3Context.status === 'notConnected') {
          if (readOnlyAccount) {
            console.log('autoConnecting readonly', defaultChainId)
            web3Context.connect(await getConnector('network', defaultChainId), 'network')
          }
        }
        if (web3Context.status === 'connected') {
          localStorage.setItem(SUCCESSFUL_CONNECTION, JSON.stringify(web3Context.connectionKind))
        } else {
          localStorage.removeItem(SUCCESSFUL_CONNECTION)
        }
      } catch (e) {
        if (web3Context.status === 'notConnected' && readOnlyAccount) {
          console.log('falling back to autoConnecting readonly', defaultChainId)
          web3Context.connect(await getConnector('network', defaultChainId), 'network')
        }
      } finally {
        firstTime = false
      }
    },
  )
  return () => {
    subscription.unsubscribe()
  }
}

export function WithConnection({ children }: WithChildren) {
  const router = useRouter()
  const { web3Context$, readonlyAccount$ } = useAppContext()
  const { address } = router.query as { address: string; network: string }
  const { push } = useRedirect()

  useEffect(() => {
    if (Web3.utils.isAddress(address)) {
      readonlyAccount$.next(address)
    } else {
      push('/connect')
    }
    return () => readonlyAccount$.next(undefined)
  }, [address])

  useEffect(() => autoConnect(web3Context$, readonlyAccount$, getNetwork()), [])

  return children
}
