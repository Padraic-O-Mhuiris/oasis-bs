import { BigNumber } from 'bignumber.js'
import { NetworkContext } from 'components/blockchain/network'
import { amountFromWei } from 'components/blockchain/utils'
import { bindNodeCallback, defer, Observable } from 'rxjs'
import { map } from 'rxjs/operators'

type GetBalanceType = (account: string, callback: (err: any, r: BigNumber) => any) => any

export function createEtherBalance$<A>(
  { web3 }: NetworkContext,
  address: string,
): Observable<BigNumber> {
  return defer(() => bindNodeCallback(web3.eth.getBalance as GetBalanceType)(address)).pipe(
    map((balance) => {
      return amountFromWei(new BigNumber(balance), 'ETH')
    }),
  )
}
