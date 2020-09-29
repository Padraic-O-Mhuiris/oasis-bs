// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import { AccountButton } from 'components/account/Account'
import { useAppContext } from 'components/AppContextProvider'
import { AppLink, AppLinkProps } from 'components/Links'
import { TransactionManager } from 'components/transactionManager/TransactionManagerView'
import { formatAddress } from 'helpers/formatters/format'
import { useObservable } from 'helpers/observableHook'
import { WithChildren } from 'helpers/types'
import { useReadonlyAccount } from 'helpers/useReadonlyAccount'
import { useTranslation } from 'i18n'
import React from 'react'
import { TRANSITIONS } from 'theme'
import { Alert, Box, Container, Flex, Text } from 'theme-ui'

function Logo() {
  return (
    <AppLink
      withAccountPrefix={false}
      href="/"
      sx={{ color: 'primary', fontWeight: 'semiBold', fontSize: 5 }}
    >
      Oasis
    </AppLink>
  )
}

export function BasicHeader({ variant, children }: { variant?: string } & WithChildren) {
  return (
    <Box as="header">
      <Container
        variant={variant}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 2,
          p: 3,
          mb: 3,
          minHeight: '83px',
        }}
      >
        {children}
      </Container>
    </Box>
  )
}

export function BackArrow() {
  return (
    <Box
      sx={{
        cursor: 'pointer',
        color: 'onBackground',
        fontSize: '0',
        transition: TRANSITIONS.global,
        '&:hover': {
          color: 'onSurface',
        },
      }}
    >
      <Icon name="arrow_left" size="auto" width="32" height="47" />
    </Box>
  )
}

export function LogoWithBack({
  backLink,
  onClick,
}: {
  backLink?: AppLinkProps
  onClick?: () => void
}) {
  return onClick ? (
    <Box onClick={onClick}>
      <BackArrow />
    </Box>
  ) : backLink ? (
    <AppLink {...backLink}>
      <BackArrow />
    </AppLink>
  ) : (
    <Logo />
  )
}

export function AppHeader({
  backLink,
  CustomLogoWithBack,
}: {
  backLink?: AppLinkProps
  CustomLogoWithBack?: () => JSX.Element
}) {
  const { web3Context$ } = useAppContext()
  const web3Context = useObservable(web3Context$)
  const { readonlyAccount, account } = useReadonlyAccount()
  const { t } = useTranslation()

  return (
    <>
      <BasicHeader variant="appContainer">
        {web3Context?.status === 'connected' || web3Context?.status === 'connectedReadonly' ? (
          <>
            {CustomLogoWithBack ? <CustomLogoWithBack /> : <LogoWithBack {...{ backLink }} />}
            <Flex sx={{ maxWidth: 'calc(100% - 40px)', justifyContent: 'flex-end' }}>
              {/* Transaction Manager is always visible for proper animation of sliding. Otherwise first slide in of notification is instant rather than animated */}
              <TransactionManager />
              <AccountButton />
            </Flex>
          </>
        ) : null}
      </BasicHeader>
      {readonlyAccount && account && (
        <Container variant="appContainer" mb={4} mt={-3}>
          <Alert variant="readonly">
            {`${t('readonly-alert-message')} `}
            <Text sx={{ fontWeight: 'semiBold', display: 'inline' }}>{formatAddress(account)}</Text>
          </Alert>
        </Container>
      )}
    </>
  )
}

export function MarketingHeader() {
  const { t } = useTranslation()

  return (
    <BasicHeader>
      <Logo />
      <AppLink href="/connect" variant="nav">
        {t('connect-wallet-button')}
      </AppLink>
    </BasicHeader>
  )
}
