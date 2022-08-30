import { StargazeClient } from "..";

const getAllCollectionsImport = import("./getAllCollections");
const getCollectionImport = import("./getCollection");

export default class Collections {
  private stargazeClient: StargazeClient;

  constructor(stargazeClient: StargazeClient) {
    this.stargazeClient = stargazeClient;
  }

  public async getAll() {
    const getAllCollections = (await getAllCollectionsImport).default;
    return getAllCollections({
      codeId: this.stargazeClient.sg721CodeId,
      client: this.stargazeClient.cosmWasmClient,
    });
  }

  public async getOneByAddress(address: string) {
    try {
      const getCollection = (await getCollectionImport).default;
      return getCollection({
        address,
        client: this.stargazeClient.cosmWasmClient,
      });
    } catch {
      throw new Error("Error fetching collection.");
    }
  }
}
