import express from 'express'
import { NextApiRequest, NextApiResponse } from 'next'
import { apiResolver } from 'next/dist/next-server/server/api-utils'

import * as newWyreOrderHandler from '../../pages/api/new_wyre_order'
import * as orderHandler from '../../pages/api/order/[address]'
import * as wyreHandler from '../../pages/api/wyre'
import { Dependencies, getApp } from '../../server/app'
import { Config } from '../../server/config'

export const DEFAULT_CONFIG: Config = {
  disableRequestLogging: true,
}

function nextApiResolver(handler: {
  default: (req: NextApiRequest, res: NextApiResponse) => void
}): express.RequestHandler {
  const emptyApiContext = {
    previewModeId: '',
    previewModeEncryptionKey: '',
    previewModeSigningKey: '',
  }
  return (req: express.Request, res: express.Response) =>
    apiResolver(req, res, { ...req.params }, handler, emptyApiContext)
}

export function setupServer(
  customConfig: Partial<Config> = {},
  customDependencies: Partial<Dependencies> = {},
): express.Application {
  function noopHandler(_req: any, _res: any, next: any) {
    next()
  }

  const app = getApp(
    { ...DEFAULT_CONFIG, ...customConfig },
    {
      nextHandler: noopHandler,
      ...customDependencies,
    },
  )

  app.post('/api/new_wyre_order', nextApiResolver(newWyreOrderHandler))
  app.post('/api/wyre', nextApiResolver(wyreHandler))
  app.get('/api/order/:address', nextApiResolver(orderHandler))

  return app
}
