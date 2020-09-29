import { isAppContextAvailable } from 'components/AppContextProvider'
import { WithConnection } from 'components/connectWallet/ConnectWallet'
import { Footer } from 'components/Footer'
import { AppHeader, BasicHeader, MarketingHeader } from 'components/Header'
import { AppLinkProps } from 'components/Links'
import { WithChildren } from 'helpers/types'
import React from 'react'
import { Container, Flex, SxStyleProp } from 'theme-ui'

interface BasicLayoutProps extends WithChildren {
  header: JSX.Element
  footer?: JSX.Element
  sx?: SxStyleProp
  variant?: string
}

export interface AppLayoutProps extends WithChildren {
  backLink?: AppLinkProps
  CustomLogoWithBack?: () => JSX.Element
}

export interface MarketingLayoutProps extends WithChildren {
  variant?: string
}

export function BasicLayout({ header, footer, children, sx, variant }: BasicLayoutProps) {
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        minHeight: '100%',
        ...sx,
      }}
    >
      {header}
      <Container variant={variant || 'appContainer'} sx={{ flex: 2, mb: 5 }} as="main">
        <Flex sx={{ width: '100%', height: '100%' }}>{children}</Flex>
      </Container>
      {footer}
    </Flex>
  )
}

export function AppLayout({ children, backLink, CustomLogoWithBack }: AppLayoutProps) {
  if (!isAppContextAvailable()) {
    return null
  }
  return (
    <BasicLayout header={<AppHeader {...{ backLink, CustomLogoWithBack }} />}>
      <WithConnection>{children}</WithConnection>
    </BasicLayout>
  )
}

export function HeaderlessLayout({ children }: AppLayoutProps) {
  if (!isAppContextAvailable()) {
    return null
  }
  return <BasicLayout header={<BasicHeader />}>{children}</BasicLayout>
}

export function MarketingLayout({ children, variant }: MarketingLayoutProps) {
  return (
    <BasicLayout
      header={<MarketingHeader />}
      footer={<Footer />}
      sx={{ bg: 'surface' }}
      variant={variant || 'marketingContainer'}
    >
      {children}
    </BasicLayout>
  )
}