import { useEffect, useMemo, useState, useCallback } from "react";
import { useWallet } from "client";
import { queryInventory } from "client/query";
import { Header, MediaView } from "components";
import { Media, Mod, getNftMod } from "util/types";
import { useRouter } from "next/router";
import { classNames } from "util/css";

const Inventory = () => {
  const { wallet } = useWallet();
  const router = useRouter();

  const { peer } = router.query;

  const selectedNfts = useMemo(() => new Map<Mod, Media>(), []);
  const [selectedNftsRefreshCounter, setSelectedNftsRefreshCounter] =
    useState<number>(0);
  const refreshSelectedNfts = useCallback(
    () => setSelectedNftsRefreshCounter(selectedNftsRefreshCounter + 1),
    [selectedNftsRefreshCounter, setSelectedNftsRefreshCounter]
  );

  const selectNft = (nft: any) => {
    switch (selectedNfts.has(getNftMod(nft))) {
      case true:
        selectedNfts.delete(getNftMod(nft));
        break;
      case false:
        selectedNfts.set(getNftMod(nft), nft);
        break;
    }
    refreshSelectedNfts();
  };

  const [nfts, setNfts] = useState<any[]>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (wallet) {
      setIsLoading(true);
      queryInventory(wallet?.address).then((inventory) => {
        console.log(inventory);
        setNfts(inventory);
        setIsLoading(false);
      });
    }
  }, [wallet]);

  const createTrade = useCallback(() => {
    let selectedNftMods = [];
    for (const key of selectedNfts.keys()) selectedNftMods.push(key);
    const selectedNftsString = selectedNftMods.join(",");

    let params = {};

    if (peer)
      params = {
        peer,
        offer: selectedNftsString,
      };
    else params = { offer: selectedNftsString };

    router.push("/trade?" + new URLSearchParams(params).toString());
  }, [selectedNfts]);

  return (
    <main className="h-screen">
      <div className="flex flex-col space-y-4 lg:items-center lg:space-y-0 lg:flex-row lg:justify-between">
        <Header>Inventory</Header>
        {selectedNfts.size > 0 && (
          <button
            onClick={createTrade}
            className="inline-flex items-center justify-center w-48 h-10 text-xs font-medium text-white border border-white rounded-lg hover:bg-primary hover:border-none"
          >
            Create Trade
          </button>
        )}
      </div>
      {isLoading ? (
        <p className="text-white">Loading...</p>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {nfts?.map((nft) => (
            <MediaView
              nft={nft}
              onClick={() => selectNft(nft)}
              selected={selectedNfts.has(getNftMod(nft))}
            />
          ))}
        </div>
      )}
      {!wallet && (
        <p className="text-lg font-light text-white">
          Connect a wallet to access your inventory.
        </p>
      )}
    </main>
  );
};

export default Inventory;
