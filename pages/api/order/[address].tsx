import { OnrampOrder } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from 'server/prisma'
import * as z from 'zod'

const paramsSchema = z.object({
  address: z.string(),
})

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const params = paramsSchema.parse(req.query)

  const orders: OnrampOrder[] = await prisma.raw`
    SELECT order_ref, order_status, dest_amount, created, onramp_provider.provider_type, dest_currency
    FROM onramp_order
    INNER JOIN onramp_provider ON onramp_order.onramp_provider_id = onramp_provider.id
    WHERE recipient = ${params.address}`

  orders
    ? res.json(
        orders.map((order: OnrampOrder) => ({
          id: order.order_ref,
          status: order.order_status,
          amount: order.dest_amount,
          type: (order as any).provider_type,
          date: order.created,
          token: order.dest_currency,
        })),
      )
    : res.json([])
}
