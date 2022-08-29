export const microAmountMultiplier = 1_000_000;

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TRADE_CONTRACT_ADDRESS!;
export const CONTRACT_CODEID = parseInt(
  process.env.NEXT_PUBLIC_TRADE_CONTRACT_CODEID!
);

export const SG721_CODEID = parseInt(process.env.NEXT_PUBLIC_SG721_CODEID!);

export const NFT_API = process.env.NEXT_PUBLIC_NFT_API!;


export const DB_NAME = process.env.DB_NAME!;
export const DB_URL = process.env.DATABASE!;
export const DB_COLLECTION_NAME = process.env.COLLECTION_NAME!;