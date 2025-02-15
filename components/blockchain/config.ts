import { fromPairs, zip } from 'lodash'
import { Dictionary } from 'ts-essentials'

import * as eth from './abi/ds-eth-token.abi.json'
import * as dsProxyFactory from './abi/ds-proxy-factory.abi.json'
import * as dsProxyRegistry from './abi/ds-proxy-registry.abi.json'
import * as dssProxyActionsDsr from './abi/dss-proxy-actions-dsr.json'
import * as erc20 from './abi/erc20.abi.json'
import * as otc from './abi/matching-market.abi.json'
import * as mcdJoinDai from './abi/mcd-join-dai.abi.json'
import * as mcdPot from './abi/mcd-pot.abi.json'
import * as otcSupport from './abi/otc-support-methods.abi.json'
import * as vat from './abi/vat.abi.json'

function asMap<D>(key: string, data: D[]): { [key: string]: D } {
  return fromPairs(
    zip(
      data.map((row: D) => (row as any)[key]),
      data,
    ),
  )
}

export interface TokenConfig {
  symbol: string
  precision: number
  digits: number
  maxSell: string
  name: string
  icon: string
  iconCircle: string
  iconColor: string
  ticker: string
}

// ticker comes from coinpaprika api https://api.coinpaprika.com/v1/tickers
const tokens = asMap('symbol', [
  {
    symbol: 'ETH',
    precision: 18,
    digits: 5,
    maxSell: '10000000',
    name: 'Ether',
    icon: 'ether',
    iconCircle: 'ether_circle_color',
    iconColor: 'ether_color',
    ticker: 'eth-ethereum',
  },
  // {
  //   symbol: 'WETH',
  //   precision: 18,
  //   digits: 5,
  //   maxSell: '10000000',
  //   name: 'Wrapped Ether',
  //   icon: AvatarSimple(ethSvg),
  //   // iconInverse: AvatarSimple(ethCircleSvg),
  //   iconCircle: AvatarSimple(ethCircleSvg),
  //   iconColor: AvatarSimple(ethCircleSvg),
  //   ticker: 'eth-ethereum',
  // },
  {
    symbol: 'DAI',
    precision: 18,
    digits: 4,
    maxSell: '10000000',
    name: 'Dai',
    icon: 'dai',
    iconCircle: 'dai_circle_color',
    iconColor: 'dai_color',
    ticker: 'dai-dai',
  },
  // {
  //   symbol: 'USDC',
  //   precision: 6,
  //   digits: 6,
  //   digitsInstant: 2,
  //   maxSell: '1000000000000000',
  //   name: 'USD Coin',
  //   icon: AvatarSimple(usdcSvg),
  //   iconCircle: AvatarSimple(usdcCircleSvg),
  //   iconColor: AvatarSimple(usdcColorSvg),
  //   ticker: 'usdc-usd-coin',
  // },
  // {
  //   symbol: 'CHAI',
  //   precision: 18,
  //   digits: 4,
  //   maxSell: '10000000',
  //   name: 'Maker',
  //   icon: AvatarSimple(mkrSvg),
  //   iconCircle: AvatarSimple(mkrSvg),
  //   iconColor: AvatarSimple(mkrSvg),
  //   ticker: '',
  // },
  // {
  //   symbol: 'MKR',
  //   precision: 18,
  //   digits: 4,
  //   maxSell: '10000000',
  //   name: 'Maker',
  //   icon: AvatarSimple(mkrSvg),
  //   iconCircle: AvatarSimple(mkrSvg),
  //   iconColor: AvatarSimple(mkrSvg),
  //   ticker: 'usdc-usd-coin',
  // },
  // {
  //   symbol: 'WBTC',
  //   precision: 8,
  //   digits: 5,
  //   digitsInstant: 3,
  //   safeCollRatio: 1.5,
  //   maxSell: '1000000000000000',
  //   name: 'Wrapped Bitcoin',
  //   icon: AvatarSimple(wbtcSvg),
  //   iconCircle: AvatarSimple(wbtcCircleSvg),
  //   iconColor: AvatarSimple(wbtcColorSvg),
  //   ticker: 'wbtc-wrapped-bitcoin',
  // },
])

export function getToken(token: string) {
  return tokens[token]
}

export interface ContractDesc {
  abi: any
  address: string
}

export function contractDesc(abi: any, address: string): ContractDesc {
  return { abi, address }
}

// const infuraProjectId = 'd96fcc7c667e4a03abf1cecd266ade2d'

const infuraProjectId = '58073b4a32df4105906c702f167b91d2'

// https://kovan.infura.io/v3/58073b4a32df4105906c702f167b91d2

const protoMain = {
  id: '1',
  name: 'main',
  label: 'Mainnet',
  infuraUrl: `https://mainnet.infura.io/v3/${infuraProjectId}`,
  infuraUrlWS: `wss://mainnet.infura.io/ws/v3/${infuraProjectId}`,
  safeConfirmations: 10,
  otc: contractDesc(otc, '0x794e6e91555438aFc3ccF1c5076A74F42133d08D'),
  tokens: {
    WETH: contractDesc(eth, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
    DAI: contractDesc(erc20, '0x6B175474E89094C44Da98b954EedeAC495271d0F'),
    USDC: contractDesc(erc20, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
    MKR: contractDesc(erc20, '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'),
    CHAI: contractDesc(erc20, '0x06af07097c9eeb7fd685c692751d5c66db49c215'),
    // WBTC: contractDesc(erc20, '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'),
  } as Dictionary<ContractDesc>,
  otcSupportMethods: contractDesc(otcSupport, '0x9b3f075b12513afe56ca2ed838613b7395f57839'),
  mcdPot: contractDesc(mcdPot, '0x197E90f9FAD81970bA7976f33CbD77088E5D7cf7'),
  vat: contractDesc(vat, '0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B'),
  mcdJoinDai: contractDesc(mcdJoinDai, '0x9759A6Ac90977b93B58547b4A71c78317f391A28'),
  dsProxyRegistry: contractDesc(dsProxyRegistry, '0x4678f0a6958e4d2bc4f1baf7bc52e8f3564f3fe4'),
  dsProxyFactory: contractDesc(dsProxyFactory, '0xa26e15c895efc0616177b7c1e7270a4c7d51c997'),
  etherscan: {
    url: 'https://etherscan.io',
    apiUrl: 'https://api.etherscan.io/api',
    apiKey: '34JVYM6RPM3J1SK8QXQFRNSHD9XG4UHXVU',
  },
  taxProxyRegistries: ['0xaa63c8683647ef91b3fdab4b4989ee9588da297b'],
  dssProxyActionsDsr: contractDesc(
    dssProxyActionsDsr,
    '0x07ee93aEEa0a36FfF2A9B95dd22Bd6049EE54f26',
  ),
}

export type NetworkConfig = typeof protoMain

const main: NetworkConfig = protoMain

const kovan: NetworkConfig = {
  id: '42',
  name: 'kovan',
  label: 'Kovan',
  infuraUrl: `https://kovan.infura.io/v3/${infuraProjectId}`,
  infuraUrlWS: `wss://kovan.infura.io/ws/v3/${infuraProjectId}`,
  safeConfirmations: 6,
  otc: contractDesc(otc, '0xe325acB9765b02b8b418199bf9650972299235F4'),
  tokens: {
    WETH: contractDesc(eth, '0xd0a1e359811322d97991e03f863a0c30c2cf029c'),
    DAI: contractDesc(erc20, '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'),
    USDC: contractDesc(erc20, '0x198419c5c340e8De47ce4C0E4711A03664d42CB2'),
    MKR: contractDesc(erc20, '0xaaf64bfcc32d0f15873a02163e7e500671a4ffcd'),
    CHAI: contractDesc(erc20, '0xb641957b6c29310926110848db2d464c8c3c3f38'),
    // WBTC: contractDesc(erc20, '0xA08d982C2deBa0DbE433a9C6177a219E96CeE656'),
  },
  otcSupportMethods: contractDesc(otcSupport, '0x303f2bf24d98325479932881657f45567b3e47a8'),
  mcdPot: contractDesc(mcdPot, '0xEA190DBDC7adF265260ec4dA6e9675Fd4f5A78bb'),
  vat: contractDesc(vat, '0xbA987bDB501d131f766fEe8180Da5d81b34b69d9'),
  mcdJoinDai: contractDesc(mcdJoinDai, '0x5AA71a3ae1C0bd6ac27A1f28e1415fFFB6F15B8c'),
  dsProxyRegistry: contractDesc(dsProxyRegistry, '0x64a436ae831c1672ae81f674cab8b6775df3475c'),
  dsProxyFactory: contractDesc(dsProxyFactory, '0xe11e3b391f7e8bc47247866af32af67dd58dc800'),
  etherscan: {
    url: 'https://kovan.etherscan.io',
    apiUrl: 'https://api-kovan.etherscan.io/api',
    apiKey: '34JVYM6RPM3J1SK8QXQFRNSHD9XG4UHXVU',
  },
  taxProxyRegistries: ['0x64a436ae831c1672ae81f674cab8b6775df3475c'],
  dssProxyActionsDsr: contractDesc(
    dssProxyActionsDsr,
    '0xc5CC1Dfb64A62B9C7Bb6Cbf53C2A579E2856bf92',
  ),
}

export const networks = asMap('id', [main, kovan])
export const networksByName = asMap('name', [main, kovan])

export const dappName = 'Oasis'
export const pollingInterval = 12000
