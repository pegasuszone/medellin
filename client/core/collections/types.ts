// Careful to only import types -- and not heavy code here.
import type { CollectionInfoResponse } from "@stargazezone/types/contracts/sg721";

export type SG721InfoResponse = {
  name: string;
  symbol: string;
};

export type NumTokensResponse = {
  count: number;
};

export interface Collection extends CollectionInfoResponse, SG721InfoResponse {
  contractAddress: string;
  numTokens?: number;

  // Marketplace types
  marketplaceInfo?: {
    count?: number;
    contractUri?: string;
    fee_recipient?: string;
    seller_fee_basis_points?: number;
    floorPrice?: string;
  };
}
