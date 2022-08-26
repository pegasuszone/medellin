import { NFT_API } from "util/constants";

export default async function queryInventory(address: string) {
  let tokenList = [];

  tokenList = await fetch(`${NFT_API}/api/v1beta/profile/${address}/nfts`).then(
    (res) => {
      return res.json();
    }
  );

  // sort by nft name
  tokenList.sort((a: any, b: any) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );

  return tokenList;
}
