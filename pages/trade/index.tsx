import { Header, MediaView } from "components";
import { useCallback, useState, useEffect, useMemo } from "react";
import { useWallet } from "client";
import copy from "copy-to-clipboard";
import { queryInventory } from "client/query";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { Mod, Media } from "util/types";

const Trade = () => {
  const { wallet } = useWallet();

  const [userNfts, setUserNfts] = useState<any[]>();
  const [isLoadingUserNfts, setIsLoadingUserNfts] = useState<boolean>(false);

  const [peerNfts, setPeerNfts] = useState<any[]>();
  const [isLoadingPeerNfts, setIsLoadingPeerNfts] = useState<boolean>(false);

  const selectedUserNfts = useMemo(() => new Map<Mod, Media>(), []);
  const [selectedUserNftsRefreshCounter, setSelectedUserNftsRefreshCounter] =
    useState<number>(0);
  const refreshSelectedUserNfts = useCallback(
    () => setSelectedUserNftsRefreshCounter(selectedUserNftsRefreshCounter + 1),
    [selectedUserNftsRefreshCounter, setSelectedUserNftsRefreshCounter]
  );

  useEffect(() => {
    if (wallet) {
      setIsLoadingUserNfts(true);
      queryInventory(wallet?.address).then((inventory) => {
        console.log(inventory);
        setUserNfts(inventory);
        setIsLoadingUserNfts(false);
      });
    }
  }, [wallet]);

  const [copiedTradeUrl, setCopiedTradeUrl] = useState<boolean>(false);

  const copyTradeUrl = useCallback(() => {
    if (wallet) {
      console.log(
        process.env.NEXT_PUBLIC_BASE_URL! + "?peer=" + wallet?.address
      );
      copy(process.env.NEXT_PUBLIC_BASE_URL! + "?peer=" + wallet?.address);
      setCopiedTradeUrl(true);
      setTimeout(() => setCopiedTradeUrl(false), 2000);
    }
  }, [wallet, setCopiedTradeUrl]);

  return (
    <main>
      <div className="flex flex-col space-y-4 lg:items-center lg:space-y-0 lg:flex-row lg:justify-between">
        <Header>Trade</Header>
        <button
          onClick={copyTradeUrl}
          className="inline-flex items-center justify-center w-48 h-10 text-xs font-medium text-white border border-white rounded-lg hover:bg-primary hover:border-none"
        >
          {copiedTradeUrl ? "Copied!" : "Copy Trade URL"}
        </button>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <p className="text-lg font-medium text-white">Your NFTs</p>
          <p className="text-lg font-medium text-white">Their NFTs</p>
        </div>
        <div className="grid h-[35vh] grid-trade-custom gap-4">
          {/* User selected NFTs */}
          <div className="grid grid-cols-2 gap-2 p-4 overflow-y-scroll border rounded-lg border-primary/50 lg:grid-cols-3"></div>
          <div className="flex items-center justify-center">
            <ArrowsRightLeftIcon className="w-8 h-8 text-primary/50" />
          </div>
          {/* Peer selected NFTs */}
          <div className="grid grid-cols-2 gap-2 p-4 overflow-y-scroll border rounded-lg border-primary/50 lg:grid-cols-"></div>
        </div>
        <div className="grid h-[35vh] grid-trade-custom gap-4">
          {/* User inventory */}
          <div className="grid grid-cols-2 gap-2 p-4 overflow-y-scroll border rounded-lg border-white/10 lg:grid-cols-3">
            {userNfts?.map((nft) => (
              <MediaView nft={nft} onClick={() => {}} selected={false} />
            ))}
          </div>
          <div></div>
          {/* Peer inventory */}
          <div className="grid grid-cols-2 gap-2 p-4 overflow-y-scroll border rounded-lg border-white/10 lg:grid-cols-3"></div>
        </div>
      </div>
      <div className="mt-8 lg:flex lg:flex-row lg:justify-end lg:items-center">
        <button
          onClick={() => {}}
          className="inline-flex items-center justify-center px-16 py-4 text-sm font-medium text-white rounded-lg bg-primary hover:bg-primary-500"
        >
          Send Trade Offer
        </button>
      </div>
    </main>
  );
};

export default Trade;
