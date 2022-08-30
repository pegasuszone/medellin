import { Collection, Media as MediaType } from "util/type";
import { Sg721QueryClient } from "types/sg721";
import { fetchTokenUriInfo, normalizeIpfsUri } from "util/nft";

export default async function getNFT({
  collection,
  tokenId,
  sg721,
}: {
  collection: Collection;
  tokenId: number | string;
  sg721: Sg721QueryClient;
}): Promise<MediaType> {
  // make sure tokenId is a string
  const tokenIdString = tokenId.toString();

  let nft, nftInfo;

  try {
    nft = await sg721.allNftInfo({ tokenId: tokenIdString });
  } catch (e) {
    throw new Error("Error fetching nft");
  }

  // Catch errors if token URI is broken
  try {
    nftInfo = await fetchTokenUriInfo(
      normalizeIpfsUri(nft.info.token_uri as string)
    );
  } catch (e) {
    try {
      nftInfo = await fetchTokenUriInfo(
        normalizeIpfsUri(`${nft.info.token_uri}.json`)
      );
    } catch (e) {
      throw new Error("Error fetching nft uri info");
    }
  }

  let mediaItem: MediaType = {
    ...nftInfo,
    creator: collection.creator,
    collection,
    tokenId,
    owner: nft.access.owner,
    tokenUri: nft.info.token_uri,
  };

  return mediaItem;
}
