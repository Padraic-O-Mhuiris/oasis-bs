// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import { UnsupportedChainIdError } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { useAppContext } from 'components/AppContextProvider'
import { networks, networksByName } from 'components/blockchain/config'
import { AccountKind, Web3AccountContext } from 'components/blockchain/web3Context'
import { AppLink } from 'components/Links'
import { useObservable } from 'helpers/observableHook'
import { WithChildren } from 'helpers/types'
import { mapValues } from 'lodash'
import React, { useEffect } from 'react'
import { Alert, Box, Button, Flex, Grid, Heading, Spinner, Text } from 'theme-ui'
import { assert } from 'ts-essentials'

export const SUCCESSFUL_CONNECTION = 'successfulConnection'

const rpcUrls: { [chainId: number]: string } = mapValues(networks, (network) => network.infuraUrl)

export function getNetwork() {
  const name = 'network'
  const match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search)
  const network = (match && decodeURIComponent(match[1].replace(/\+/g, ' '))) || 'main'
  return Number.parseInt(networksByName[network].id)
}

async function getConnector(connectorKind: AccountKind, network: number) {
  assert(rpcUrls[network], 'Unsupported chainId!')
  switch (connectorKind) {
    case 'injected':
      const connector = new InjectedConnector({
        supportedChainIds: Object.values(networks).map(({ id }) => Number.parseInt(id)),
      })
      const connectorChainId = Number.parseInt((await connector.getChainId()) as string)
      if (network !== connectorChainId) {
        alert('Browser ethereum providerand URL network param do not match!')
        throw new Error('Browser ethereum provider and URL network param do not match!')
      }
      return connector
  }
}

interface SupportedWallet {
  iconName: string
  connectionKind: AccountKind
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
  web3AccountContext: Web3AccountContext | undefined,
  connectorKind: AccountKind,
  chainId: number,
) {
  return async () => {
    if (web3AccountContext?.status === 'error' || web3AccountContext?.status === 'notConnected') {
      try {
        web3AccountContext.connect(await getConnector(connectorKind, chainId), connectorKind)
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

export function getConnectionKindMessage(connectionKind: AccountKind) {
  switch (connectionKind) {
    case 'injected':
      return getInjectedWalletKind()
  }
}

export function ConnectWallet() {
  const { web3AccountContext$ } = useAppContext()
  const web3AccountContext = useObservable(web3AccountContext$)

  if (!web3AccountContext) {
    console.log('no context')
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
              metamask-unsupported-network
            </Text>
          </Alert>
        )) || (
          <Alert variant="error" sx={{ fontWeight: 'normal', borderRadius: 'large' }}>
            <Text sx={{ my: 1, ml: 2, fontSize: 3, lineHeight: 'body' }}>{connect - error}</Text>
          </Alert>
        ))}
      <Grid columns={1}>
        {SUPPORTED_WALLETS.map(({ iconName, connectionKind }) => {
          const isConnecting =
            web3AccountContext.status === 'connecting' &&
            web3AccountContext.connectionKind === connectionKind

          return (
            <ConnectWalletButton
              {...{
                key: connectionKind,
                isConnecting,
                iconName,
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
            <Text sx={{ color: 'onSecondary' }}>learn-more-wallets</Text>
            <Icon name="increase" size="12px" sx={{ position: 'relative', ml: 1, top: '1px' }} />
          </Flex>
        </AppLink>
      </Box>
    </Grid>
  )
}

export function WithConnection({ children }: WithChildren) {
  const { web3AccountContext$, chainId$ } = useAppContext()

  const chainId = useObservable(chainId$)

  useEffect(() => {
    let subscription: any
    if (chainId) {
      let firstTime = true
      subscription = web3AccountContext$.subscribe(async (web3AccountContext) => {
        try {
          const serialized = localStorage.getItem(SUCCESSFUL_CONNECTION)
          if (firstTime && web3AccountContext.status === 'notConnected' && serialized) {
            const connectionKind = JSON.parse(serialized) as AccountKind
            if (connectionKind === 'injected') {
              const connector = await getConnector(connectionKind, chainId)
              console.log(connector)
              web3AccountContext.connect(connector, connectionKind)
            }
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
        } finally {
          firstTime = false
        }
      })
    }
    return () => subscription?.unsubscribe()
  }, [chainId])

  return children
}
