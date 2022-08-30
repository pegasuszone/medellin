import { Sg721QueryClient } from "types/sg721";
import { StargazeClient } from "..";
const getNFTImport = import("./getNFT");

export default class NFTS {
  private stargazeClient: StargazeClient;

  constructor(stargazeClient: StargazeClient) {
    this.stargazeClient = stargazeClient;
  }

  public async getOne({
    collectionAddress,
    tokenId,
  }: {
    collectionAddress: string;
    tokenId: number | string;
  }) {
    try {
      const getNFT = (await getNFTImport).default;

      const collection = await this.stargazeClient.collections.getOneByAddress(
        collectionAddress
      );
      const sg721 = new Sg721QueryClient(client, collectionAddress);

      return getNFT({
        collection,
        tokenId,
        sg721,
      });
    } catch {
      throw new Error("Error fetching collection.");
    }
  }
}
