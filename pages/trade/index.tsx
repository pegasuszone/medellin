import { Header, MediaView } from "components";
import { useCallback, useState, useEffect, useMemo } from "react";
import { useStargazeClient, useWallet } from "client";
import copy from "copy-to-clipboard";
import { queryInventory } from "client/query";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { Mod, Media, getNftMod } from "util/type";
import { fromBech32, toUtf8 } from "@cosmjs/encoding";
import { Router, useRouter } from "next/router";
import { coins } from "@cosmjs/amino";
import offlineClient from "client/OfflineStargazeClient";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { CONTRACT_ADDRESS } from "util/constants";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { useTx } from "contexts/tx";
import { CreateShortUrl, getDestination } from "prisma";

const fee = {
  amount: coins(10, process.env.NEXT_PUBLIC_DEFAULT_GAS_DENOM!),
  gas: process.env.NEXT_PUBLIC_DEFAULT_GAS_FEE!,
};

const Trade = () => {
  const { wallet } = useWallet();
  const { tx } = useTx();
  const { client } = useStargazeClient();

  const router = useRouter();

  const [userNfts, setUserNfts] = useState<Media[]>();
  const [isLoadingUserNfts, setIsLoadingUserNfts] = useState<boolean>(false);

  const [peerNfts, setPeerNfts] = useState<Media[]>();
  const [isLoadingPeerNfts, setIsLoadingPeerNfts] = useState<boolean>(false);

  const [peerAddress, setPeerAddress] = useState<string>();
  useEffect(() => {
    selectedPeerNfts.clear();
    if (peerAddress) {
      setIsLoadingPeerNfts(true);
      queryInventory(peerAddress).then((inventory) => {
        setPeerNfts(inventory);
        setIsLoadingPeerNfts(false);
      });
    }
  }, [peerAddress]);

  const selectedUserNfts = useMemo(() => new Map<Mod, Media>(), []);
  const [selectedUserNftsRefreshCounter, setSelectedUserNftsRefreshCounter] =
    useState<number>(0);
  const refreshSelectedUserNfts = useCallback(
    () => setSelectedUserNftsRefreshCounter(selectedUserNftsRefreshCounter + 1),
    [selectedUserNftsRefreshCounter, setSelectedUserNftsRefreshCounter]
  );

  const selectedPeerNfts = useMemo(() => new Map<Mod, Media>(), []);
  const [selectedPeerNftsRefreshCounter, setSelectedPeerNftsRefreshCounter] =
    useState<number>(0);
  const refreshSelectedPeerNfts = useCallback(
    () => setSelectedPeerNftsRefreshCounter(selectedPeerNftsRefreshCounter + 1),
    [selectedPeerNftsRefreshCounter, setSelectedUserNftsRefreshCounter]
  );

  enum SelectTarget {
    User,
    Peer,
  }

  const selectNft = (target: SelectTarget, nft: any) => {
    switch (target) {
      case SelectTarget.User:
        switch (selectedUserNfts.has(getNftMod(nft))) {
          case true:
            selectedUserNfts.delete(getNftMod(nft));
            break;
          case false:
            selectedUserNfts.set(getNftMod(nft), nft);
            break;
        }
        refreshSelectedUserNfts();
        break;
      case SelectTarget.Peer:
        switch (selectedPeerNfts.has(getNftMod(nft))) {
          case true:
            selectedPeerNfts.delete(getNftMod(nft));
            break;
          case false:
            selectedPeerNfts.set(getNftMod(nft), nft);
            break;
        }
        refreshSelectedPeerNfts();
        break;
    }
  };

  useEffect(() => {
    if (wallet) {
      setIsLoadingUserNfts(true);
      queryInventory(wallet?.address).then((inventory) => {
        setUserNfts(inventory);
        setIsLoadingUserNfts(false);
      });
    }
  }, [wallet]);

  const [copiedTradeUrl, setCopiedTradeUrl] = useState<boolean>(false);

  const copyTradeUrl = useCallback(async () => {
    if (wallet) {
      // This can include a pre-selected array of nfts 
      const tradePath = "?peer=" + wallet?.address
      
      // this should include the pz-l.ink/[short_url] , which will redirect to pegasus-trade.zone/link/
      const shortUrl = await CreateShortUrl(tradePath)

      copy( process.env.SHORT_PUBLIC_URL + shortUrl );

      setCopiedTradeUrl(true);
      setTimeout(() => setCopiedTradeUrl(false), 2000);
    }
  }, [wallet, setCopiedTradeUrl]);

  const handleSendOffer = useCallback(async () => {
    if (!peerAddress) return;
    if (!peerNfts || !userNfts) return;
    if (selectedUserNfts.size < 1) return;
    if (selectedPeerNfts.size < 1) return;

    const signingCosmWasmClient = client?.signingCosmWasmClient;

    const msg = {
      create_offer: {
        peer: peerAddress,
        offered_nfts: userNfts
          ?.filter((nft) => selectedUserNfts.has(getNftMod(nft)))
          .map((nft) => {
            return {
              collection: String(nft.collection.contractAddress),
              token_id: parseInt(nft.tokenId),
            };
          }),
        wanted_nfts: peerNfts
          ?.filter((nft) => selectedPeerNfts.has(getNftMod(nft)))
          .map((nft) => {
            return {
              collection: String(nft.collection.contractAddress),
              token_id: parseInt(nft.tokenId),
            };
          }),
      },
    };

    const wasmMsg = {
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: MsgExecuteContract.fromPartial({
        sender: wallet?.address,
        msg: toUtf8(JSON.stringify(msg)),
        contract: CONTRACT_ADDRESS,
      }),
    };

    const msgs = [
      ...userNfts
        ?.filter((nft) => selectedUserNfts.has(getNftMod(nft)))
        .map((nft) => {
          return {
            typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
            value: MsgExecuteContract.fromPartial({
              sender: wallet?.address,
              msg: toUtf8(
                JSON.stringify({
                  approve: {
                    spender: CONTRACT_ADDRESS,
                    token_id: String(nft.tokenId),
                  },
                })
              ),
              contract: String(nft.collection.contractAddress),
            }),
          };
        }),
      wasmMsg,
    ];

    tx(msgs, {}, () => {
      router.push("/sent");
    });
  }, [
    wallet,
    client,
    peerAddress,
    userNfts,
    peerNfts,
    selectedUserNfts,
    selectedPeerNfts,
  ]);

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
        <div className="grid grid-cols-2 gap-16">
          <p className="text-lg font-medium text-white">Your NFTs</p>
          <p className="text-lg font-medium text-white">Their NFTs</p>
        </div>
        <div className="grid h-[35vh] grid-trade-custom gap-4">
          {/* User selected NFTs */}
          <div className="grid grid-cols-2 gap-2 p-4 overflow-y-scroll border rounded-lg border-primary/50 lg:grid-cols-3">
            {userNfts
              ?.filter((nft) => selectedUserNfts.has(getNftMod(nft)))
              .map((nft) => (
                <MediaView
                  nft={nft}
                  onClick={() => selectNft(SelectTarget.User, nft)}
                  selected={false}
                />
              ))}
          </div>
          <div className="flex items-center justify-center">
            <ArrowsRightLeftIcon className="w-8 h-8 text-primary/50" />
          </div>
          {/* Peer selected NFTs */}
          <div className="grid grid-cols-2 gap-2 p-4 overflow-y-scroll border rounded-lg border-primary/50 lg:grid-cols-3">
            {peerNfts
              ?.filter((nft) => selectedPeerNfts.has(getNftMod(nft)))
              .map((nft) => (
                <MediaView
                  nft={nft}
                  onClick={() => selectNft(SelectTarget.Peer, nft)}
                  selected={false}
                />
              ))}
          </div>
        </div>
        <div className="grid h-[35vh] grid-trade-custom gap-4">
          {/* User inventory */}
          <div className="grid grid-cols-2 gap-2 p-4 overflow-y-scroll border rounded-lg border-white/10 lg:grid-cols-3">
            {userNfts
              ?.filter((nft) => !selectedUserNfts.has(getNftMod(nft)))
              .map((nft) => (
                <MediaView
                  nft={nft}
                  onClick={() => selectNft(SelectTarget.User, nft)}
                  selected={false}
                />
              ))}
          </div>
          <div></div>
          {/* Peer inventory */}
          <div className="grid grid-cols-2 gap-2 p-4 overflow-y-scroll border rounded-lg border-white/10 lg:grid-cols-3">
            {peerNfts
              ?.filter((nft) => !selectedPeerNfts.has(getNftMod(nft)))
              .map((nft) => (
                <MediaView
                  nft={nft}
                  onClick={() => selectNft(SelectTarget.Peer, nft)}
                  selected={false}
                />
              ))}
          </div>
        </div>
      </div>
      <div className="mt-8 lg:flex lg:flex-row lg:justify-between lg:items-center">
        <input
          className="border w-full lg:w-96 bg-firefly rounded-lg border-white/10 focus:ring focus:ring-primary ring-offset-firefly px-4 py-2.5 text-white"
          placeholder="Enter peer address..."
          onChange={(e) => {
            try {
              fromBech32(e.currentTarget.value);
              setPeerAddress(e.currentTarget.value);
            } catch {
              if (!e.currentTarget.value) setPeerAddress(undefined);
            }
          }}
        />
        <button
          onClick={handleSendOffer}
          className="inline-flex items-center justify-center px-16 py-4 text-sm font-medium text-white rounded-lg bg-primary hover:bg-primary-500"
        >
          Send Trade Offer
        </button>
      </div>
    </main>
  );
};

export default Trade;
