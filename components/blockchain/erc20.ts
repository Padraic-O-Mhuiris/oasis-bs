import { BigNumber } from 'bignumber.js'
import { Context } from 'components/blockchain/network'
import { defer, from, Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { amountFromWei } from './utils'

export const MIN_ALLOWANCE = new BigNumber('0xffffffffffffffffffffffffffffffff')

export function createTokenBalance$(
  { contract, tokens }: Context,
  token: string,
  account: string,
): Observable<BigNumber> {
  return defer(() =>
    from(contract(tokens[token]).methods.balanceOf(account).call()).pipe(
      map((balance: any) => {
        return amountFromWei(new BigNumber(balance), token)
      }),
    ),
  )
}

export function createAllowance$(
  { tokens, contract }: Context,
  token: string,
  owner: string,
  spender: string,
): Observable<boolean> {
  return defer(() =>
    from(contract(tokens[token]).methods.allowance(owner, spender).call()).pipe(
      map((x: string) => new BigNumber(x).gte(MIN_ALLOWANCE)),
    ),
  )
}
