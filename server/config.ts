import * as z from 'zod'

export const configSchema = z.object({
  httpPassword: z.string().optional(),
  disableRequestLogging: z.boolean().optional(),
})

export type Config = z.infer<typeof configSchema>
