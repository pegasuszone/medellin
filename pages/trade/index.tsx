import { capitalize } from "lodash";
import { Header, MediaView, LogoSpinner } from "components";
import { useCallback, useState, useEffect, useMemo } from "react";
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
      "inline-flex py-1.5 px-2 cursor-pointer items-center justify-center w-full border rounded-md border-white/10"
    )}
  >
    <p className="text-lg font-medium text-white">{name}</p>
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

const Inventory = ({
  nfts,
  handleClick,
}: {
  nfts: Media[];
  handleClick: (nft: Media) => void;
}) => (
  <div className="h-full p-4 overflow-y-scroll border rounded-lg border-white/10">
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
      {nfts.map((nft) => (
        <MediaView
          nft={nft}
          onClick={() => handleClick(nft)}
          selected={false}
        />
      ))}
    </div>
  </div>
);

const Trade = () => {
  const { wallet } = useWallet();
  const { tx } = useTx();
  const { client } = useStargazeClient();

  const toaster = useToaster();
  const router = useRouter();

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

      console.log(target, nft);

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
      const tradePath = "?peer=" + wallet?.address;

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
  }, [wallet, setCopiedTradeUrl]);

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
      <div className="grid grid-cols-1 gap-8 mt-6 lg:grid-cols-2 lg:mt-0">
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
              nfts={inventoryNfts || []}
              handleClick={handleInventoryItemClick}
            />
          </div>
        </div>
        <div className="space-y-4 lg:grid grid-trade-custom lg:gap-4 lg:space-y-0">
          <div>
            <p className="text-xl font-medium">Your Items</p>
            <p className="font-medium text-white/75">
              Once the trade is completed, they will receieve these items:
            </p>
            <div className="h-full mt-4">
              <Inventory
                nfts={
                  userNfts?.filter((nft) =>
                    selectedUserNfts.has(getNftMod(nft))
                  ) || []
                }
                handleClick={handleInventoryItemClick}
              />
            </div>
          </div>
          <div>
            <p className="text-xl font-medium">Their Items</p>
            <p className="font-medium text-white/75">
              Once the trade is completed, you will receieve these items:
            </p>
            <div className="h-full mt-4">
              <Inventory
                nfts={
                  peerNfts?.filter((nft) =>
                    selectedPeerNfts.has(getNftMod(nft))
                  ) || []
                }
                handleClick={handleInventoryItemClick}
              />
            </div>
          </div>
          {/* <button
            onClick={handleSendOffer}
            className="inline-flex items-center justify-center px-16 py-4 text-sm font-medium text-white rounded-lg bg-primary hover:bg-primary-500"
          >
            Send Trade Offer
          </button> */}
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
