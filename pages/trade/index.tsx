import { Header, MediaView, LogoSpinner, Empty } from "components";
import React, { useCallback, useState, useEffect, useMemo } from "react";
import { useStargazeClient, useWallet } from "client";
import copy from "copy-to-clipboard";
import { queryInventory } from "client/query";
import { Mod, Media, getNftMod } from "util/type";
import { fromBech32, toUtf8 } from "@cosmjs/encoding";
import { useRouter } from "next/router";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { CONTRACT_ADDRESS } from "util/constants";
import { useTx } from "contexts/tx";
import { ShortUrl } from "@prisma/client";
import useToaster, { ToastTypes } from "hooks/useToaster";
import { classNames } from "util/css";
import { fetchNfts } from "util/nft";

enum SelectTarget {
  User,
  Peer,
}

type Tab = "user" | "peer";

const TabItem = ({
  id,
  name,
  current,
  handleClick,
}: {
  id: Tab;
  name: string;
  current: boolean;
  handleClick: (name: Tab) => void;
}) => (
  <a
    onClick={() => handleClick(id)}
    className={classNames(
      current ? "bg-firefly-700" : "bg-firefly hover:bg-firefly-800",
      "inline-flex py-2.5 px-2 cursor-pointer items-center justify-center w-full border rounded-md border-white/10"
    )}
  >
    <p className="text-base font-medium text-white">{name}</p>
  </a>
);

const tabs: {
  id: Tab;
  name: string;
}[] = [
  {
    id: "user",
    name: "Your Inventory",
  },
  {
    id: "peer",
    name: "Their Inventory",
  },
];

function none() {}
const Inventory = ({
  nfts,
  handleClick,
  small,
  isLoading,
  input,
  inputPlaceholder,
  inputOnChange,
}: {
  nfts: Media[];
  handleClick: (nft: Media) => void;
  small?: boolean;
  isLoading: boolean;
  input?: boolean;
  inputPlaceholder?: string;
  inputOnChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="h-full p-4 overflow-y-scroll border rounded-lg border-white/10">
    {isLoading ? (
      <div className="flex items-center justify-center h-full">
        <LogoSpinner />
      </div>
    ) : (
      <>
        {input && (
          <input
            className="border w-full bg-firefly mb-4 rounded-lg border-white/10 focus:ring focus:ring-primary ring-offset-firefly px-4 py-2.5 text-white"
            placeholder={inputPlaceholder}
            onChange={inputOnChange || none}
          />
        )}
        {nfts.length < 1 ? (
          <div className="flex items-center justify-center h-full">
            <Empty small={small} />
          </div>
        ) : (
          <div
            className={classNames(
              small ? "lg:grid-cols-3 2xl:grid-cols-4" : "2xl:grid-cols-3",
              "grid grid-cols-2 gap-2"
            )}
          >
            {nfts.map((nft) => (
              <MediaView
                nft={nft}
                onClick={() => handleClick(nft)}
                selected={false}
                small={small}
              />
            ))}
          </div>
        )}
      </>
    )}
  </div>
);

const Trade = () => {
  const { wallet } = useWallet();
  const { tx } = useTx();
  const { client } = useStargazeClient();

  const toaster = useToaster();
  const router = useRouter();

  const { peer: queryPeer, offer: queryOfferedNfts } = router.query;

  // Querystring manipulation
  useEffect(() => {
    if (!queryPeer) return;

    const peer = queryPeer as string;

    if (!peer) return;

    // If the peer is the user, remove it from the querystring
    if (peer === wallet?.address) router.push("/trade");

    // Is it a bech32 address?
    try {
      fromBech32(peer);
      setPeerAddress(peer);
      setCurrentTab("peer");
    } catch {
      // If not, maybe it's a shorturl?
      fetch("/api/shorturl?path=" + peer)
        .then((res) => {
          if (!res.ok) {
            // At this point we know it can't be an address, so we remove it
            router.push({ pathname: "/trade", query: {} });
          }
          return res.json();
        })
        .then((json) => {
          const peer = json.destination.replace("?peer=", "").split("&")[0];

          // If the peer is the user, remove it from the querystring
          if (peer === wallet?.address) router.push("/trade");

          // save the offer if it exists, if not don't include it
          let query = queryOfferedNfts
            ? {
                peer,
                offer: queryOfferedNfts,
              }
            : { peer };

          // If the shorturl exists, let's push it back as a bech32
          router.push({
            pathname: "/trade",
            query,
          });
        });
    }
  }, [queryPeer, wallet?.address]);

  // Populate the selectedNfts if the `offer` querystring exists
  useEffect(() => {
    if (
      !client?.cosmWasmClient ||
      !queryPeer ||
      !queryOfferedNfts ||
      !wallet?.address
    )
      return;
    const peer = queryPeer as string;
    const offer = queryOfferedNfts as string;

    if (!peer) return;

    // Fetch nft data & select nfts
    try {
      fetchNfts(
        offer.split(",").map((nft) => {
          const [collection, token_id] = nft.split("-");
          return { collection, token_id: parseInt(token_id) };
        }),
        client
      ).then((nfts) => {
        if (!nfts) return router.push("/trade");
        nfts.forEach((nft) => {
          console.log(getNftMod(nft));
          selectNft(SelectTarget.Peer, nft);
        });
      });
    } catch {
      router.push("/trade");
    }
  }, [client?.cosmWasmClient, queryPeer, queryOfferedNfts, wallet?.address]);

  const [currentTab, setCurrentTab] = useState<Tab>("user");

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

  const selectedUserNfts = useMemo(() => new Map<Mod, Media>(), [wallet]);
  const [selectedUserNftsRefreshCounter, setSelectedUserNftsRefreshCounter] =
    useState<number>(0);
  const refreshSelectedUserNfts = useCallback(
    () => setSelectedUserNftsRefreshCounter(selectedUserNftsRefreshCounter + 1),
    [selectedUserNftsRefreshCounter, setSelectedUserNftsRefreshCounter]
  );

  const selectedPeerNfts = useMemo(() => new Map<Mod, Media>(), [wallet]);
  const [selectedPeerNftsRefreshCounter, setSelectedPeerNftsRefreshCounter] =
    useState<number>(0);
  const refreshSelectedPeerNfts = useCallback(
    () => setSelectedPeerNftsRefreshCounter(selectedPeerNftsRefreshCounter + 1),
    [selectedPeerNftsRefreshCounter, setSelectedUserNftsRefreshCounter]
  );

  const inventoryNfts = useMemo(() => {
    switch (currentTab) {
      case "user":
        return userNfts?.filter((nft) => !selectedUserNfts.has(getNftMod(nft)));
      case "peer":
        return peerNfts?.filter((nft) => !selectedPeerNfts.has(getNftMod(nft)));
    }
  }, [
    currentTab,
    userNfts,
    peerNfts,
    selectedUserNfts,
    selectedPeerNfts,
    selectedUserNftsRefreshCounter,
    selectedPeerNftsRefreshCounter,
  ]);

  const isLoadingCurrentTab = useMemo(() => {
    switch (currentTab) {
      case "peer":
        return isLoadingPeerNfts;
      case "user":
        return isLoadingUserNfts;
    }
  }, [currentTab, isLoadingPeerNfts, isLoadingUserNfts]);

  const selectNft = (target: SelectTarget, nft: Media) => {
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

  const handleInventoryItemClick = useCallback(
    (nft: Media) => {
      let target: SelectTarget;

      switch (currentTab) {
        case "user":
          target = SelectTarget.User;
          break;
        case "peer":
          target = SelectTarget.Peer;
          break;
      }

      if (selectedPeerNfts.has(getNftMod(nft))) target = SelectTarget.Peer;
      if (selectedUserNfts.has(getNftMod(nft))) target = SelectTarget.User;

      selectNft(target, nft);
    },
    [currentTab, selectNft]
  );

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
      const tradePath =
        "?" +
        new URLSearchParams({
          peer: wallet?.address,
        }).toString();

      // this should include the pz-l.ink/[short_url] , which will redirect to pegasus-trade.zone/link/
      const shortUrl: ShortUrl = await fetch("/api/shorturl", {
        method: "POST",
        body: JSON.stringify({
          destination: tradePath,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          return res.json();
        })
        .catch((e) => {
          console.error(e);
        });

      copy(`${process.env.NEXT_PUBLIC_SHORT_URL!}/${shortUrl.tiny_url}`);

      toaster.toast({
        title: "Trade URL copied!",
        type: ToastTypes.Success,
        dismissable: true,
      });
      setCopiedTradeUrl(true);
      setTimeout(() => setCopiedTradeUrl(false), 2000);
    }
  }, [wallet, setCopiedTradeUrl, selectedUserNfts]);

  const handleSendOffer = useCallback(async () => {
    if (!peerAddress) return;
    if (!peerNfts || !userNfts) return;
    if (selectedUserNfts.size < 1) return;
    if (selectedPeerNfts.size < 1) return;

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
      <div className="flex flex-col space-y-2 lg:items-center lg:space-y-0 lg:flex-row lg:justify-between">
        <Header>Trade</Header>
        {wallet && (
          <button
            onClick={copyTradeUrl}
            className="inline-flex items-center justify-center h-10 text-xs font-medium text-white border border-white rounded-lg lg:w-48 hover:bg-primary hover:border-none"
          >
            {copiedTradeUrl ? "Copied!" : "Copy Trade URL"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-8 mt-3 mb-4 lg:mb-0 lg:mt-4 2xl:mt-6 lg:grid-cols-2">
        <div>
          <div className="grid grid-cols-1 gap-2 mb-4 lg:grid-cols-2">
            {tabs.map((tab) => (
              <TabItem
                {...tab}
                current={currentTab === tab.id}
                handleClick={(name: Tab) => setCurrentTab(name)}
              />
            ))}
          </div>
          <div className="lg:h-[75vh]">
            <Inventory
              isLoading={isLoadingCurrentTab}
              nfts={inventoryNfts || []}
              handleClick={handleInventoryItemClick}
              input={currentTab === "peer"}
              inputPlaceholder="Enter peer address..."
              inputOnChange={(e) => {
                const address = e.currentTarget.value;

                if (address === "") setPeerAddress(undefined);

                // Verify that the address is valid
                try {
                  fromBech32(address);
                } catch {
                  return;
                }

                if (address === wallet?.address) {
                  return toaster.toast({
                    title: "You cannot trade with yourself",
                    message:
                      "Enter an address that is not your own to view a peer inventory.",
                    type: ToastTypes.Warning,
                  });
                }

                setPeerAddress(address);
              }}
            />
          </div>
        </div>
        <div className="space-y-4 lg:grid grid-trade-custom lg:gap-4 lg:space-y-0">
          <div>
            <p className="text-xl font-medium">Your Items</p>
            <p className="font-medium text-white/75">
              They will receive these items...
            </p>
            <div className="lg:h-[28vh] mt-4">
              <Inventory
                isLoading={false}
                nfts={
                  userNfts?.filter((nft) =>
                    selectedUserNfts.has(getNftMod(nft))
                  ) || []
                }
                handleClick={handleInventoryItemClick}
                small
              />
            </div>
          </div>
          <div>
            <p className="text-xl font-medium">Their Items</p>
            <p className="font-medium text-white/75">
              You will receive these items...
            </p>
            <div className="lg:h-[28vh] mt-4">
              <Inventory
                isLoading={false}
                nfts={
                  peerNfts?.filter((nft) =>
                    selectedPeerNfts.has(getNftMod(nft))
                  ) || []
                }
                handleClick={handleInventoryItemClick}
                small
              />
            </div>
          </div>
          <button
            onClick={handleSendOffer}
            className="inline-flex items-center justify-center w-full px-16 py-4 text-sm font-medium text-white rounded-lg bg-primary hover:bg-primary-500"
          >
            Send Trade Offer
          </button>
        </div>
      </div>
    </main>
  );
};

export default Trade;
