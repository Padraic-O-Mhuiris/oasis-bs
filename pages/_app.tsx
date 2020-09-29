import { CacheProvider, Global } from '@emotion/core'
// @ts-ignore
import { MDXProvider } from '@mdx-js/react'
import { Web3ReactProvider } from '@web3-react/core'
import { AppContextProvider } from 'components/AppContextProvider'
import { SetupWeb3Context } from 'components/blockchain/web3Context'
import { HeadTags } from 'components/HeadTags'
import { AppLayout, AppLayoutProps, MarketingLayoutProps } from 'components/Layouts'
// @ts-ignore
import { cache } from 'emotion'
import { ModalProvider } from 'helpers/modalHook'
import { appWithTranslation } from 'i18n'
import { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { landingTheme, theme } from 'theme'
// @ts-ignore
import { components, ThemeProvider } from 'theme-ui'
import Web3 from 'web3'

import { trackingEvents } from '../components/analytics/analytics'
import { mixpanelInit } from '../components/analytics/mixpanel'

function getLibrary(provider: any): Web3 {
  return new Web3(provider)
}

const globalStyles = `
  html,
  body,
  body > div:first-of-type,
  div#__next {
    height: 100%;
  }

  html {
    width: 100vw;
    overflow-x: hidden;

    @media screen and (max-width: ${theme.sizes.container}px) {
      width: 100%;
    }
  }

  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    overflow-anchor: none
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type=number] {
    -moz-appearance: textfield;
  }
`

// extending Component with static properties that can be attached to it
// to control theme, layout and it's props
interface CustomAppProps {
  Component: {
    theme?: string
    layoutProps?: AppLayoutProps | MarketingLayoutProps
    layout?: (props: AppLayoutProps | MarketingLayoutProps) => JSX.Element
  }
}

mixpanelInit()

function App({ Component, pageProps }: AppProps & CustomAppProps) {
  const Layout = Component.layout || AppLayout
  const layoutProps = Component.layoutProps
  const pageTheme = Component.theme === 'Landing' ? landingTheme : theme

  const router = useRouter()

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      trackingEvents.pageView(url)
    }

    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [])

  return (
    <ThemeProvider theme={pageTheme}>
      <CacheProvider value={cache}>
        <MDXProvider {...{ components }}>
          <Global styles={globalStyles} />
          <Web3ReactProvider {...{ getLibrary }}>
            <AppContextProvider>
              <ModalProvider>
                <HeadTags />
                <SetupWeb3Context>
                  <Layout {...layoutProps}>
                    <Component {...pageProps} />
                  </Layout>
                </SetupWeb3Context>
              </ModalProvider>
            </AppContextProvider>
          </Web3ReactProvider>
        </MDXProvider>
      </CacheProvider>
    </ThemeProvider>
  )
}

export default appWithTranslation(App)