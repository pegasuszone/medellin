import { CollectionInfoResponse } from "@stargazezone/types/contracts/sg721";

export function isPromise(value: any) {
  return Boolean(value && typeof value.then === "function");
}

export interface Collection extends CollectionInfoResponse {
  name: string;
  symbol: string;
  contractAddress: string;
}

export interface Media {
  tokenId: string;
  creator: string;
  owner: string;
  tokenUri: string;
  name: string;
  description: string;
  image: string;
  collection: Collection;
  price: string | null;
  reserveFor?: string | null;
  expiresAt?: string | null;
  expiresAtDateTime?: string | null;
}
