import { CollectionInfoResponse } from "@stargazezone/types/contracts/sg721";
import { NFT } from "client/query";

export function mapObject(m: Map<any, any>): { [key: string]: any }[] {
  return Array.from(m, ([key, value]) => {
    return { [key]: value };
  });
}

export function truncateAddress(
  address: string,
  visibleFirst: number = 8,
  visibleLast: number = 4
) {
  return `${address.substring(0, visibleFirst)}...${address.substring(
    address.length - visibleLast,
    address.length
  )}`;
}

export type Mod = `${string}-${string}`;
export function getNftMod(nft: NFT): Mod {
  return `${nft.collection.contractAddress}-${nft.tokenId}`;
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
