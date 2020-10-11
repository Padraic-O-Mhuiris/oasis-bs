// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import { UnsupportedChainIdError } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { useAppContext } from 'components/AppContextProvider'
import { networks, networksByName } from 'components/blockchain/config'
import { AccountKind, Web3AccountContext } from 'components/blockchain/web3Context'
import { useObservable } from 'helpers/observableHook'
import { WithChildren } from 'helpers/types'
import { mapValues } from 'lodash'
import React, { useEffect } from 'react'
import { Alert, Box, Button, Flex, Grid, Heading, Spinner, Text } from 'theme-ui'
import { assert } from 'ts-essentials'

const rpcUrls: { [chainId: number]: string } = mapValues(networks, (network) => network.infuraUrl)

export function getNetwork() {
  const name = 'network'
  const match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search)
  const network = (match && decodeURIComponent(match[1].replace(/\+/g, ' '))) || 'main'
  return Number.parseInt(networksByName[network].id)
}

async function getConnector(accountKind: AccountKind, network: number) {
  assert(rpcUrls[network], 'Unsupported chainId!')
  switch (accountKind) {
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
  accountKind: AccountKind
}

const SUPPORTED_WALLETS: SupportedWallet[] = [
  { iconName: 'metamask_color', accountKind: 'injected' },
]

interface ConnectWalletButton {
  isConnecting: boolean
  iconName: string
  connect?: () => void
}

function ConnectWalletButton({ isConnecting, iconName, connect }: ConnectWalletButton) {
  return (
    <Button variant="outlineSquare" sx={{ textAlign: 'left' }} onClick={connect}>
      <Flex sx={{ alignItems: 'center' }}>
        <Flex sx={{ ml: 1, mr: 3, alignItems: 'center' }}>
          {isConnecting ? <Spinner size={22} /> : <Icon name={iconName} size={22} />}
          Injected Wallet
        </Flex>
      </Flex>
    </Button>
  )
}

function connect(
  web3AccountContext: Web3AccountContext | undefined,
  accountKind: AccountKind,
  chainId: number,
) {
  return async () => {
    if (web3AccountContext?.status === 'error' || web3AccountContext?.status === 'notConnected') {
      try {
        web3AccountContext.connect(await getConnector(accountKind, chainId), accountKind)
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
      <Heading as="h1">Connect</Heading>
      {web3AccountContext.status === 'error' &&
        ((web3AccountContext.error instanceof UnsupportedChainIdError && (
          <Alert variant="error" sx={{ fontWeight: 'normal', borderRadius: 'large' }}>
            <Text sx={{ my: 1, ml: 2, fontSize: 3, lineHeight: 'body' }}>Unsupported Chain ID</Text>
          </Alert>
        )) || (
          <Alert variant="error" sx={{ fontWeight: 'normal', borderRadius: 'large' }}>
            <Text sx={{ my: 1, ml: 2, fontSize: 3, lineHeight: 'body' }}>Connection Error</Text>
          </Alert>
        ))}
      <Grid columns={1}>
        {SUPPORTED_WALLETS.map(({ iconName, accountKind }) => {
          const isConnecting =
            web3AccountContext.status === 'connecting' &&
            web3AccountContext.accountKind === accountKind

          return (
            <ConnectWalletButton
              {...{
                key: accountKind,
                isConnecting,
                iconName,
                connect:
                  web3AccountContext.status === 'connecting'
                    ? undefined
                    : connect(web3AccountContext, accountKind, getNetwork()),
              }}
            />
          )
        })}
      </Grid>
    </Grid>
  )
}
