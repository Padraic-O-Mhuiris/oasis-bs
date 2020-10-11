import * as z from 'zod'
import { EthereumAddresRegex, IntegerRegex } from 'helpers/regexes'

export const AddressSchema = z
  .string()
  .refine((val) => EthereumAddresRegex.test(val), 'Invalid Ethereum address')

export const AddressQuerySchema = z.object({
  address: AddressSchema,
})

export const IdQuerySchema = z.object({
  id: z.string().refine((val) => IntegerRegex.test(val), 'Invalid ID'),
})

export const RouteQuerySchema = z.union([AddressQuerySchema, IdQuerySchema])

export type Address = z.infer<typeof AddressSchema>

export type AddressQuery = z.infer<typeof AddressQuerySchema>

export type IdQuery = z.infer<typeof IdQuerySchema>

export type RouteQuery = z.infer<typeof RouteQuerySchema>
