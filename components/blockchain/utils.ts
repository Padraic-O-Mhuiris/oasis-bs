import { BigNumber } from 'bignumber.js'
import padEnd from 'lodash/padEnd'
import { Dictionary } from 'ramda'
//@ts-ignore
import ethAbi from 'web3-eth-abi'

import { RAY } from '../constants'
import { getToken } from './config'

export function amountFromWei(amount: BigNumber, token: string): BigNumber {
  return amount.div(new BigNumber(10).pow(getToken(token).precision))
}

export function amountFromRay(amount: BigNumber): BigNumber {
  return amount.div(RAY)
}

export function amountToWei(amount: BigNumber, token: string): BigNumber {
  const precision = getToken(token).precision
  return amount.times(new BigNumber(10).pow(precision))
}

export function eth2weth(token: string): string {
  return token.replace(/^ETH/, 'WETH')
}

export function weth2eth(token: string): string {
  return token.replace(/^WETH/, 'ETH')
}

export function padLeft(string: string, chars: number, sign?: string) {
  return Array(chars - string.length + 1).join(sign || '0') + string
}

export const nullAddress = '0x0000000000000000000000000000000000000000'

export function storageHexToBigNumber(uint256: string): [BigNumber, BigNumber] {
  const match = uint256.match(/^0x(\w+)$/)
  if (!match) {
    throw new Error(`invalid uint256: ${uint256}`)
  }
  return match[0].length <= 32
    ? [new BigNumber(0), new BigNumber(uint256)]
    : [
        new BigNumber(`0x${match[0].substr(0, match[0].length - 32)}`),
        new BigNumber(`0x${match[0].substr(match[0].length - 32, 32)}`),
      ]
}

export function localStorageStoreDict(dict: Dictionary<boolean>, key: string) {
  localStorage.setItem(key, JSON.stringify(dict))
}

export function localStorageGetDict(key: string) {
  const dict = localStorage.getItem(key) || '{}'
  return JSON.parse(dict)
}

export function funcSigTopic(v: string): string {
  //@ts-ignore
  return padEnd(ethAbi.encodeFunctionSignature(v), 66, '0')
}
