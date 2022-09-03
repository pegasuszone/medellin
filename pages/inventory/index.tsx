import { useEffect, useMemo, useState, useCallback } from "react";
import { useWallet } from "client";
import { queryInventory } from "client/query";
import { Header, MediaView, LogoSpinner, Empty } from "components";
import { Media, Mod, getNftMod } from "util/type";
import { useRouter } from "next/router";

const Inventory = () => {
  const { wallet } = useWallet();
  const router = useRouter();

  const [nfts, setNfts] = useState<Media[]>();
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

  return (
    <main className="h-screen">
      <div className="flex flex-col space-y-4 lg:items-center lg:space-y-0 lg:flex-row lg:justify-between">
        <Header>Inventory</Header>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-[90vh]">
          <LogoSpinner />
        </div>
      ) : (
        <>
          {(nfts?.length || 0) < 1 ? (
            <div className="flex items-center justify-center h-[90vh]">
              <Empty />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mt-4 lg:mt-0 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {nfts?.map((nft) => (
                <MediaView nft={nft} onClick={() => {}} selected={false} />
              ))}
            </div>
          )}
        </>
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
