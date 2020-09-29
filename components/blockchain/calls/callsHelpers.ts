import { GasPrice$ } from 'components/blockchain/prices'
import { SendFunction, TxMeta, TxState } from 'components/blockchain/transactions'
import { combineLatest, from, Observable } from 'rxjs'
import { first, map, switchMap } from 'rxjs/internal/operators'

import { Context, ContextConnected } from '../network'

export const DEFAULT_GAS = 6000000

export interface CallDef<A, R> {
  call: (args: A, context: Context, account?: string) => any
  prepareArgs: (args: A, context: Context, account?: string) => any[]
  postprocess?: (r: any, a: A) => R
}

export interface TransactionDef<A extends TxMeta> {
  call?: (args: A, context: ContextConnected, account?: string) => any
  prepareArgs: (args: A, context: ContextConnected, account?: string) => any[]
  options?: (args: A) => any
}

export function call<D, R>(
  context: ContextConnected,
  { call, prepareArgs, postprocess }: CallDef<D, R>,
) {
  return (args: D) => {
    return from(
      call(
        args,
        context,
      )(...prepareArgs(args, context)).call(
        context.status === 'connected' ? { from: context.account } : {},
      ),
    ).pipe(map((i) => (postprocess ? postprocess(i, args) : i))) as Observable<R>
  }
}

// we accommodate for the fact that blockchain state
// can be different when tx execute and it can take more gas
const GAS_ESTIMATION_MULTIPLIER = 1.3
export function estimateGas<A extends TxMeta>(
  context: ContextConnected,
  { call, prepareArgs, options }: TransactionDef<A>,
  args: A,
) {
  const result = from(
    (call
      ? call(
          args,
          context,
          context.status === 'connected' ? context.account : undefined,
        )(...prepareArgs(args, context, context.account))
      : {
          from: context.account,
          ...(options ? options(args) : {}),
        }
    ).estimateGas({
      from: context.account,
      ...(options ? options(args) : {}),
    }),
  ).pipe(
    map((e: number) => {
      return Math.floor(e * GAS_ESTIMATION_MULTIPLIER)
    }),
  )
  // @ts-ignore
  return result as Observable<number>
}

export type SendTransactionFunction<A extends TxMeta> = <B extends A>(
  def: TransactionDef<B>,
  args: B,
) => Observable<TxState<B>>

export type EstimateGasFunction<A extends TxMeta> = <B extends A>(
  def: TransactionDef<B>,
  args: B,
) => Observable<number>

export function createSendTransaction<A extends TxMeta>(
  send: SendFunction<A>,
  context: ContextConnected,
): SendTransactionFunction<A> {
  return <B extends A>(
    { call, prepareArgs, options }: TransactionDef<B>,
    args: B,
  ): Observable<TxState<B>> => {
    return send(context.account, context.id, args, () =>
      call
        ? call(
            args,
            context,
            context.account,
          )(...prepareArgs(args, context, context.account)).send({
            from: context.account,
            ...(options ? options(args) : {}),
          })
        : context.web3.eth.sendTransaction({
            from: context.account,
            ...(options ? options(args) : {}),
          }),
    ) as Observable<TxState<B>>
  }
}

export function createSendWithGasConstraints<A extends TxMeta>(
  send: SendFunction<A>,
  context: ContextConnected,
  gasPrice$: GasPrice$,
) {
  return <B extends A>(callData: TransactionDef<B>, args: B): Observable<TxState<B>> => {
    return combineLatest(estimateGas(context, callData, args), gasPrice$).pipe(
      first(),
      switchMap(([gas, gasPrice]) => {
        return createSendTransaction(send, context)(callData, {
          ...args,
          options: (args1: A) => ({ ...args1, gas, gasPrice }),
        })
      }),
    )
  }
}
