import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from '@cosmjs/cosmwasm-stargate'
import { ChainInfo } from '@keplr-wallet/types'
import { TradeClient, TradeQueryClient } from 'types/Trade.client'
import { WalletData } from './wallet'
import Collections from './collections'
import NFTS from './nfts'

const getCosmWasmClientImport = import('./cosmwasm/getCosmWasmClient')

export interface StargazeClientContructor {
  wallet: WalletData | null
  chainInfo: ChainInfo
  tradeContract: string
  tradeCodeId: number
  sg721CodeId: number
  signingCosmWasmClient: SigningCosmWasmClient | null
}

export class StargazeClient {
  private _cosmWasmClient: CosmWasmClient | null = null
  public signingCosmWasmClient: SigningCosmWasmClient | null = null

  private _tradeClient: TradeQueryClient | null = null

  public tradeContract: string
  public tradeCodeId: number
  public sg721CodeId: number
  public chainInfo: ChainInfo

  private _wallet: WalletData | null = null

  private _collections: Collections | null = null
  private _nfts: NFTS | null = null

  constructor({
    wallet,
    chainInfo,
    tradeContract,
    tradeCodeId,
    sg721CodeId,
    signingCosmWasmClient,
  }: StargazeClientContructor) {
    this._wallet = wallet
    this.chainInfo = chainInfo
    this.tradeContract = tradeContract
    this.tradeCodeId = tradeCodeId
    this.sg721CodeId = sg721CodeId
    this.signingCosmWasmClient = signingCosmWasmClient
  }

  public async connect() {
    if (this._cosmWasmClient) {
      return
    }

    const getCosmWasmClient = (await getCosmWasmClientImport).default
    // create cosmwasm client
    this._cosmWasmClient = await getCosmWasmClient(this.chainInfo.rpc)

    this._tradeClient = new TradeQueryClient(
      this.cosmWasmClient,
      this.tradeContract,
    )
  }

  public get cosmWasmClient(): CosmWasmClient {
    return this._cosmWasmClient as CosmWasmClient
  }

  public get tradeClient(): TradeQueryClient {
    return this._tradeClient as TradeClient
  }

  public get wallet(): WalletData {
    return this._wallet as WalletData
  }

  public get collections(): Collections {
    if (!this.cosmWasmClient) {
      throw new Error('Client not connected. Missing connect()?')
    }

    if (this._collections) {
      return this._collections
    }

    this._collections = new Collections(this)

    return this._collections
  }

  public get nfts(): NFTS {
    if (!this.cosmWasmClient) {
      throw new Error('Client not connected. Missing connect()?')
    }

    if (this._nfts) {
      return this._nfts
    }

    this._nfts = new NFTS(this)

    return this._nfts
  }
}
