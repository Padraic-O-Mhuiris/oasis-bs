import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders/lib/src' // https://github.com/0xProject/0x-monorepo/issues/1400
import { AbstractConnector } from '@web3-react/abstract-connector'
import { ConnectorUpdate } from '@web3-react/types'
import { LedgerSubprovider } from 'ledgerConnector/ledgerSubprovider'
import Web3ProviderEngine from 'web3-provider-engine'
import CacheSubprovider from 'web3-provider-engine/subproviders/cache.js'

import { RPCSubprovider } from '@0x/subproviders/lib/src/subproviders/rpc_subprovider'

interface LedgerConnectorArguments {
  chainId: number
  url: string
  pollingInterval?: number
  requestTimeoutMs?: number
  accountFetchingConfigs?: any
  baseDerivationPath?: string
}

export class LedgerConnector extends AbstractConnector {
  private readonly chainId: number
  private readonly url: string
  private readonly pollingInterval?: number
  private readonly requestTimeoutMs?: number
  private readonly accountFetchingConfigs?: any
  private readonly baseDerivationPath?: string

  private provider: any

  constructor({
    chainId,
    url,
    pollingInterval,
    requestTimeoutMs,
    accountFetchingConfigs,
    baseDerivationPath,
  }: LedgerConnectorArguments) {
    super({ supportedChainIds: [chainId] })

    this.chainId = chainId
    this.url = url
    this.pollingInterval = pollingInterval
    this.requestTimeoutMs = requestTimeoutMs
    this.accountFetchingConfigs = accountFetchingConfigs
    this.baseDerivationPath = baseDerivationPath
  }

  public async activate(): Promise<ConnectorUpdate> {
    if (!this.provider) {
      const engine = new Web3ProviderEngine({ pollingInterval: this.pollingInterval })
      engine.addProvider(
        new LedgerSubprovider({
          networkId: this.chainId,
          ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
          accountFetchingConfigs: this.accountFetchingConfigs,
          baseDerivationPath: this.baseDerivationPath,
        }),
      )
      engine.addProvider(new CacheSubprovider())
      engine.addProvider(new RPCSubprovider(this.url, this.requestTimeoutMs))
      this.provider = engine
    }

    this.provider.start()

    return { provider: this.provider, chainId: this.chainId }
  }

  public async getProvider(): Promise<Web3ProviderEngine> {
    return this.provider
  }

  public async getChainId(): Promise<number> {
    return this.chainId
  }

  public async getAccount(): Promise<string> {
    return (await this.getAccounts(1))[0]
  }

  public async getAccounts(accountsLength: number): Promise<string[]> {
    return this.provider._providers[0].getAccountsAsync(accountsLength)
  }

  public deactivate() {
    this.provider.stop()
  }
}
