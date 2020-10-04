// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import { UnsupportedChainIdError } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { NetworkConnector } from '@web3-react/network-connector'
import { useAppContext } from 'components/AppContextProvider'
import { networks, networksByName } from 'components/blockchain/config'
import { ConnectionKind, Web3Context, Web3AccountContext } from 'components/blockchain/web3Context'
import { AppLink } from 'components/Links'
import { useObservable } from 'helpers/observableHook'
import { WithChildren } from 'helpers/types'
import { useTranslation } from 'i18n'
import { mapValues } from 'lodash'
import React, { useEffect } from 'react'
import { Alert, Box, Button, Flex, Grid, Heading, Spinner, Text } from 'theme-ui'
import { assert } from 'ts-essentials'
import { Observable } from 'rxjs'
import { useRouter } from 'next/router'

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
    if (web3Context?.status === 'error' || web3Context?.status === 'notConnected') {
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
    case 'network':
      return 'Network'
  }
}

export function ConnectWallet() {
  const { web3AccountContext$ } = useAppContext()
  const web3AccountContext = useObservable(web3AccountContext$)
  const { t } = useTranslation('common')

  if (!web3AccountContext) {
    return null
  }

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
      {web3AccountContext.status === 'error' &&
        ((web3AccountContext.error instanceof UnsupportedChainIdError && (
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
            web3AccountContext.status === 'connecting' &&
            web3AccountContext.connectionKind === connectionKind
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
                  web3AccountContext.status === 'connecting'
                    ? undefined
                    : connect(web3AccountContext, connectionKind, getNetwork()),
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

function autoConnect(web3AccountContext$: Observable<Web3AccountContext>, defaultChainId: number) {
  let firstTime = true

  const subscription = web3AccountContext$.subscribe(async (web3AccountContext) => {
    try {
      const serialized = localStorage.getItem(SUCCESSFUL_CONNECTION)
      if (firstTime && web3AccountContext.status === 'notConnected' && serialized) {
        const connectionKind = JSON.parse(serialized) as ConnectionKind
        console.log('autoConnecting from localStorage', connectionKind, defaultChainId)
        const connector = await getConnector(connectionKind, defaultChainId)
        web3AccountContext.connect(connector, connectionKind)
      } else if (web3AccountContext.status === 'notConnected') {
        // if (readOnlyAccount) {
        //   console.log('autoConnecting readonly', defaultChainId)
        //   web3AccountContext.connect(await getConnector('network', defaultChainId), 'network')
        // }
      }
      if (web3AccountContext.status === 'connected') {
        localStorage.setItem(
          SUCCESSFUL_CONNECTION,
          JSON.stringify(web3AccountContext.connectionKind),
        )
      } else {
        localStorage.removeItem(SUCCESSFUL_CONNECTION)
      }
    } catch (e) {
      if (web3AccountContext.status === 'notConnected') {
        console.log('falling back to autoConnecting readonly', defaultChainId)
      }
    } finally {
      firstTime = false
    }
  })
  return () => {
    subscription.unsubscribe()
  }
}

export function WithConnection({ children }: WithChildren) {
  const { web3AccountContext$ } = useAppContext()
  const router = useRouter()

  return children
}
