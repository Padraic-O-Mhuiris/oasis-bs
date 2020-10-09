import { BigNumber } from 'bignumber.js'
import { NetworkContext } from 'components/blockchain/network'
import { defer, from, Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { amountFromWei } from './utils'

export const MIN_ALLOWANCE = new BigNumber('0xffffffffffffffffffffffffffffffff')

export function createTokenBalance$(
  { contract, tokens }: NetworkContext,
  token: string,
  address: string,
): Observable<BigNumber> {
  return defer(() =>
    from(contract(tokens[token]).methods.balanceOf(address).call()).pipe(
      map((balance: any) => {
        return amountFromWei(new BigNumber(balance), token)
      }),
    ),
  )
}

export function createAllowance$(
  { tokens, contract }: NetworkContext,
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
