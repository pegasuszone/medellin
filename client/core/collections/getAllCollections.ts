import type { CosmWasmClient } from "@cosmjs/cosmwasm-stargate/build/cosmwasmclient";
import getCollection from "./getCollection";

type Args = {
  codeId: number;
  client: CosmWasmClient;
};

export default async function getAllCollections(
  { codeId, client }: Args,
  exclude: string[] = []
) {
  if (!client) {
    throw new Error("No CosmWasm client provided.");
  }

  const collections = await client.getContracts(codeId);
  const filteredCollections = collections.filter((c) => !exclude.includes(c));

  return Promise.all(
    filteredCollections.map(
      async (address) => await getCollection({ address, client })
    )
  );
}
