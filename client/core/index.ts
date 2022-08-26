import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import { ChainInfo } from "@keplr-wallet/types";
import { TradeClient, TradeQueryClient } from "types/contract";
import { WalletData } from "./wallet";

const getCosmWasmClientImport = import("./cosmwasm/getCosmWasmClient");

export interface StargazeClientContructor {
  wallet: WalletData | null;
  chainInfo: ChainInfo;
  tradeContract: string;
  tradeCodeId: number;
  signingCosmWasmClient: SigningCosmWasmClient | null;
}

export class StargazeClient {
  private _cosmWasmClient: CosmWasmClient | null = null;
  public signingCosmWasmClient: SigningCosmWasmClient | null = null;
  public tradeClient: TradeQueryClient | null = null;
  public signingTradeClient: TradeClient | null = null;

  public tradeContract: string;
  public tradeCodeId: number;
  public chainInfo: ChainInfo;

  private _wallet: WalletData | null = null;

  constructor({
    wallet,
    chainInfo,
    tradeContract,
    tradeCodeId,
    signingCosmWasmClient,
  }: StargazeClientContructor) {
    this._wallet = wallet;
    this.chainInfo = chainInfo;
    this.tradeContract = tradeContract;
    this.tradeCodeId = tradeCodeId;
    this.signingCosmWasmClient = signingCosmWasmClient;
  }

  public async connect() {
    if (this._cosmWasmClient) {
      return;
    }

    const getCosmWasmClient = (await getCosmWasmClientImport).default;
    // create cosmwasm client
    this._cosmWasmClient = await getCosmWasmClient(this.chainInfo.rpc);

    await this.createStargazeContractClient();
  }

  public get cosmWasmClient(): CosmWasmClient {
    return this._cosmWasmClient as CosmWasmClient;
  }

  public get wallet(): WalletData {
    return this._wallet as WalletData;
  }

  private async createStargazeContractClient() {
    if (this._wallet?.address && this.signingCosmWasmClient) {
      this.signingTradeClient = new TradeClient(
        this.signingCosmWasmClient,
        this._wallet.address,
        this.tradeContract
      );
    } else if (this.cosmWasmClient) {
      this.tradeClient = new TradeQueryClient(
        this.cosmWasmClient,
        this.tradeContract
      );
    }

    return this.signingTradeClient ?? this.tradeClient;
  }

  public async connectSigning() {
    try {
      if (!this.cosmWasmClient) {
        throw new Error("Error loading cosmwasm client.");
      }

      if (!this.signingCosmWasmClient) {
        throw new Error("Couldn't connect signing cosmwasm client.");
      }

      // Create signed marketplace client
      await this.createStargazeContractClient();

      return this._wallet;
    } catch (e) {
      console.log(e);
    }
  }

  public async disconnectSigning() {
    this.signingCosmWasmClient?.disconnect();
    this._wallet = null;
    await this.createStargazeContractClient();
  }
}
