import { expect } from 'chai'
import { describe, it } from 'mocha'
import { createMocks } from 'node-mocks-http'

import healthHandler from '../../pages/api/health'

describe('health/ handler', () => {
  it('responds 200 GET', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    })

    await healthHandler(req, res)

    expect(res._getStatusCode()).to.be.eq(200)
    expect(res._getJSONData()).to.be.deep.eq({
      status: 200,
      message: 'Everything is okay!',
    })
  })
})
