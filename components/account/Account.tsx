// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import { useAppContext } from 'components/AppContextProvider'
import { getConnectionKindMessage } from 'components/connectWallet/ConnectWallet'
import { Modal, ModalCloseIcon } from 'components/Modal'
import { formatAddress } from 'helpers/formatters/format'
import { ModalProps, useModal } from 'helpers/modalHook'
import { useObservable } from 'helpers/observableHook'
import { useTranslation } from 'i18n'
import React, { useRef } from 'react'
// @ts-ignore
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon'
import { TRANSITIONS } from 'theme'
import { Box, Button, Card, Flex, Grid, Heading, Text, Textarea } from 'theme-ui'

export function NetworkIndicator({ chainId, address }: { chainId: number; address: string }) {
  let color = 'networks.default'
  if (chainId === 1) {
    color = 'networks.mainnet'
  }
  if (chainId === 42) {
    color = 'networks.kovan'
  }
  return (
    <Flex sx={{ alignItems: 'center' }}>
      <Text sx={{ color, fontSize: '7px' }}>⬤</Text>
      <Text ml={2}>{formatAddress(address)}</Text>
    </Flex>
  )
}

export function AccountButton() {
  const { web3AccountContext$ } = useAppContext()
  const web3AccountContext = useObservable(web3AccountContext$)
  const openModal = useModal()

  if (web3AccountContext?.status === 'connected') {
    return (
      <Button
        variant="outline"
        sx={{ fontWeight: 'body' }}
        onClick={() => {
          openModal(AccountModal)
        }}
      >
        <NetworkIndicator
          chainId={web3AccountContext.chainId}
          address={web3AccountContext.account}
        />
      </Button>
    )
  }

  return null
}

export function AccountModal({ close }: ModalProps) {
  const { web3AccountContext$ } = useAppContext()
  const web3AccountContext = useObservable(web3AccountContext$)
  const clipboardContentRef = useRef<HTMLTextAreaElement>(null)
  const { t } = useTranslation('common')

  function disconnect() {
    if (web3AccountContext?.status === 'connected') {
      web3AccountContext.deactivate()
    }
    close()
  }

  function copyToClipboard() {
    const clipboardContent = clipboardContentRef.current

    if (clipboardContent) {
      clipboardContent.select()
      document.execCommand('copy')
    }
  }

  if (web3AccountContext?.status !== 'connected') return null

  const { account, connectionKind } = web3AccountContext

  return (
    <Modal>
      <ModalCloseIcon {...{ close }} />
      <Grid gap={4} pt={3} mt={1}>
        <Box
          px={3}
          mx={1}
          sx={{
            '&:last-child': {
              pb: 3,
              mb: 1,
            },
          }}
        >
          <Heading mb={3}>{t('account')}</Heading>
          <Card variant="secondary">
            <Grid>
              <Flex sx={{ justifyContent: 'space-between' }}>
                <Text sx={{ fontWeight: 'semiBold' }}>
                  {t('connected-with', {
                    connectionKind: getConnectionKindMessage(connectionKind),
                  })}
                </Text>
              </Flex>
              <Flex sx={{ alignItems: 'center' }}>
                <Box mr={2}>
                  <Jazzicon diameter={28} seed={jsNumberForAddress(account)} />
                </Box>
                <Text sx={{ fontSize: 5, mx: 1 }}>{formatAddress(account)}</Text>
                <Icon
                  name="copy"
                  sx={{
                    ml: 2,
                    cursor: 'pointer',
                    color: 'mutedAlt',
                    transition: TRANSITIONS.global,
                    '&:hover': { color: 'primaryEmphasis' },
                  }}
                  onClick={() => copyToClipboard()}
                />
                {/* Textarea element used for copy to clipboard using native API, custom positioning outside of screen */}
                <Textarea
                  ref={clipboardContentRef}
                  sx={{ position: 'absolute', top: '-1000px', left: '-1000px' }}
                  value={account}
                  readOnly
                />
              </Flex>
              <Button
                variant="textual"
                sx={{ textAlign: 'left', fontSize: 3, p: 0 }}
                onClick={disconnect}
              >
                Disconnect
              </Button>
            </Grid>
          </Card>
        </Box>
      </Grid>
    </Modal>
  )
}
