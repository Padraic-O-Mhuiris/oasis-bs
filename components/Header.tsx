// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import { AccountButton } from 'components/account/Account'
import { useAppContext } from 'components/AppContextProvider'
import { AppLink, AppLinkProps } from 'components/Links'
import { useObservable } from 'helpers/observableHook'
import { WithChildren } from 'helpers/types'
import { useTranslation } from 'i18n'
import React from 'react'
import { TRANSITIONS } from 'theme'
import { Box, Container, Flex, Text } from 'theme-ui'

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
  const { web3AccountContext$ } = useAppContext()
  const web3AccountContext = useObservable(web3AccountContext$)

  return (
    <>
      <BasicHeader variant="appContainer">
        {web3AccountContext?.status === 'connected' ? (
          <>
            {CustomLogoWithBack ? <CustomLogoWithBack /> : <LogoWithBack {...{ backLink }} />}
            <Flex sx={{ maxWidth: 'calc(100% - 40px)', justifyContent: 'flex-end' }}>
              <AccountButton />
            </Flex>
          </>
        ) : (
          <AppLink href="/connect">Connect</AppLink>
        )}
      </BasicHeader>
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
