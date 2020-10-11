import { Global } from '@emotion/core'
import { createWeb3ReactRoot } from '@web3-react/core'
import { AppContextProvider } from 'components/AppContextProvider'
import { SetupWeb3Context } from 'components/blockchain/web3Context'
import { AppLayout } from 'components/Layouts'
import { ModalProvider } from 'helpers/modalHook'
import { AppProps } from 'next/app'
import React from 'react'
import { theme } from 'theme'
import { Box, ThemeProvider } from 'theme-ui'
import Web3 from 'web3'

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

let Web3AccountProvider: any
let Web3NetworkProvider: any

if (process.browser) {
  Web3AccountProvider = createWeb3ReactRoot('account')
  Web3NetworkProvider = createWeb3ReactRoot('network')
}

function App({ Component, pageProps }: AppProps) {
  const Layout = AppLayout
  const pageTheme = theme

  if (!process.browser) {
    return <div></div>
  }

  return (
    <ThemeProvider theme={pageTheme}>
      <Global styles={globalStyles} />

      <Web3AccountProvider {...{ getLibrary }}>
        <Web3NetworkProvider {...{ getLibrary }}>
          <AppContextProvider>
            <SetupWeb3Context>
              <ModalProvider>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </ModalProvider>
            </SetupWeb3Context>
          </AppContextProvider>
        </Web3NetworkProvider>
      </Web3AccountProvider>
    </ThemeProvider>
  )
}

export default App
