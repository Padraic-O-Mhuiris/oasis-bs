import { MarketingLayout } from 'components/Layouts'
import { getQueryParams } from 'helpers/useRedirect'
import { NextPageContext } from 'next'
import PageNotFound from 'pages/404'
import React from 'react'

// it is used to catch paths like `/dashboard`, `/buy` without `[address]` param in query
// by default it will catch all paths like `/fff` also and don't present 404 page, which should be rendered
// so we need to explicitly speficy paths to catch in array below
const PATHS_TO_CATCH = ['dashboard', 'buy']

export default function AppDefaultPage({ error }: { error: boolean }) {
  return error ? <PageNotFound /> : null
}

export async function getServerSideProps({ res, query }: NextPageContext) {
  if (res && query && PATHS_TO_CATCH.includes(query.address as string)) {
    res.writeHead(302, { Location: `/connect${getQueryParams(query)}` })
    res.end()
  }

  return {
    props: {
      error: true,
    },
  }
}

AppDefaultPage.layout = MarketingLayout
