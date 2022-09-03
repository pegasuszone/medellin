import { useStargazeClient, useWallet } from "client";
import React, { useEffect, useState, useCallback, SVGProps } from "react";
import { Offer } from "types/contract";
import { fetchNfts, getNFTLink } from "util/nft";
import { getNftMod, Media } from "util/type";
import Address from "./Address";
import ReactTooltip from "@huner2/react-tooltip";
import { Modal } from "./Modal";
import { VerticalMediaView } from "./MediaView";
import { classNames } from "util/css";
import { RadioGroup } from "@headlessui/react";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { toUtf8 } from "@cosmjs/encoding";
import { CONTRACT_ADDRESS } from "util/constants";
import { useTx } from "contexts/tx";
import { useRouter } from "next/router";
import {
  CheckCircleIcon,
  QuestionMarkCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

type ReplyType = "accept" | "reject" | "counteroffer";

interface Reply {
  name: string;
  description: string;
  type: ReplyType;
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
}

const replies = [
  {
    name: "Accept",
    description: "Accept the offer and complete the trade.",
    type: "accept",
    icon: CheckCircleIcon,
  },
  {
    name: "Reject",
    description: "Reject the offer, nothing happens.",
    type: "reject",
    icon: XCircleIcon,
  },
  // {
  //   name: "Counter-offer",
  //   description: "Modify the terms of the trade and send it back.",
  //   type: "counteroffer",
  //   icon: QuestionMarkCircleIcon,
  // },
];

const OfferNft = ({ nft }: { nft: Media }) => {
  return (
    <a
      rel="noopener noreferrer"
      target="_blank"
      href={getNFTLink({
        contract: nft.collection.contractAddress,
        tokenId: nft.tokenId,
      })}
      className="flex-shrink-0"
    >
      <ReactTooltip
        effect="solid"
        type="info"
        className="tooltip"
        arrowColor="rgba(0,0,0,0)"
      />
      <img
        src={nft.image}
        key={getNftMod(nft)}
        className="object-cover w-24 h-24 rounded-md cursor-pointer hover:shadow-xl"
        data-tip={nft.name}
      />
    </a>
  );
};

export default function OfferView({
  offer,
  actionCallback,
}: {
  offer: Offer;
  actionCallback: () => void;
}) {
  const { wallet } = useWallet();
  const { client } = useStargazeClient();
  const isSender = offer.sender === wallet?.address;
  const isPeer = offer.peer === wallet?.address;

  const router = useRouter();

  const { tx } = useTx();

  const [offeredNfts, setOfferedNfts] = useState<Media[]>();
  const [wantedNfts, setWantedNfts] = useState<Media[]>();

  const [isLoading, setIsLoading] = useState<boolean>();

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const handleDetailsModal = useCallback((val: boolean) => {
    setIsDetailsModalOpen(val);
  }, []);

  const [isReplyModalOpen, setIsReplyModalOpen] = useState<boolean>(false);
  const handleReplyModal = useCallback((val: boolean) => {
    setIsReplyModalOpen(val);
    if (!val) setSelectedReply(undefined);
  }, []);

  const [selectedReply, setSelectedReply] = useState<ReplyType>();

  // Fetch wanted & offered nfts
  useEffect(() => {
    if (wallet && client) {
      fetchNfts(offer.offered_nfts, client).then((nfts) =>
        setOfferedNfts(nfts)
      );
      fetchNfts(offer.wanted_nfts, client).then((nfts) => setWantedNfts(nfts));
    }
  }, [wallet, client]);

  useEffect(() => {
    if (wantedNfts && offeredNfts) {
      setIsLoading(false);
    } else if (!wantedNfts || !offeredNfts) {
      setIsLoading(true);
    }
  }, [wantedNfts, offeredNfts]);

  // Handle reply message
  const handleReply = useCallback(
    (reply: ReplyType) => {
      console.log(reply);
      if (!wantedNfts) return;

      let msg;

      switch (reply) {
        case "accept":
          msg = { accept_offer: { id: offer.id } };
          break;
        case "reject":
          msg = { reject_offer: { id: offer.id } };
          break;
        default:
          return;
      }

      const wasmMsg = {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: MsgExecuteContract.fromPartial({
          sender: wallet?.address,
          msg: toUtf8(JSON.stringify(msg)),
          contract: CONTRACT_ADDRESS,
        }),
      };

      const msgs = [
        ...(reply === "accept"
          ? wantedNfts.map((nft) => {
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
            })
          : []),
        wasmMsg,
      ];

      tx(
        msgs,
        {
          gas: 1499999,
        },
        () => {
          actionCallback();
        }
      );
    },
    [tx, wantedNfts, offer]
  );

  return (
    <>
      <Modal
        actions={[]}
        open={isDetailsModalOpen}
        handleStateChange={handleDetailsModal}
      >
        <p className="-mt-1 text-2xl font-bold">Details</p>
        <div className="mt-4">
          <p className="text-base">
            <Address address={wallet?.address!} /> will receive:
          </p>
          <div className="grid grid-flow-row gap-2 mt-2.5">
            {offeredNfts?.map((nft) => (
              <VerticalMediaView
                nft={nft}
                href={getNFTLink({
                  contract: nft.collection.contractAddress,
                  tokenId: nft.tokenId,
                })}
              />
            ))}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-base">
            <Address address={offer.sender} /> will receive:
          </p>
          <div className="grid grid-flow-row gap-2 mt-2.5">
            {wantedNfts?.map((nft) => (
              <VerticalMediaView
                nft={nft}
                href={getNFTLink({
                  contract: nft.collection.contractAddress,
                  tokenId: nft.tokenId,
                })}
              />
            ))}
          </div>
        </div>
      </Modal>
      <Modal
        actions={[
          {
            name: "Confirm",
            type: "primary",
            action: () => {
              if (!selectedReply) return;
              handleReply(selectedReply);
            },
          },
          { name: "Cancel", type: "secondary", action: () => {} },
        ]}
        open={isReplyModalOpen}
        handleStateChange={handleReplyModal}
      >
        <p className="-mt-1 text-2xl font-bold">Reply</p>
        <p className="mt-3 text-sm text-white/75">
          Before you reply to this offer, verify that you have viewed the offer
          details. <b>Accepting an offer is final</b>, and you will not be able
          to cancel the approval or retrieve your traded assets.
        </p>
        <RadioGroup value={selectedReply} onChange={setSelectedReply}>
          <RadioGroup.Label className="sr-only">
            {" "}
            Reply to offer{" "}
          </RadioGroup.Label>
          <div className="pb-2 mt-5 space-y-2">
            {replies.map((reply) => (
              <RadioGroup.Option
                key={reply.name}
                value={reply.type}
                className={({ checked, active }) =>
                  classNames(
                    checked
                      ? "border-transparent"
                      : "border-white/10 hover:bg-firefly-800",
                    active
                      ? "border-primary ring-2 ring-primary bg-firefly-700"
                      : "",
                    "relative block cursor-pointer rounded-lg border bg-firefly px-6 py-4 shadow-sm focus:outline-none sm:flex sm:justify-between"
                  )
                }
              >
                {({ active, checked }) => (
                  <>
                    <span className="flex items-center">
                      <span className="flex flex-col text-sm">
                        <RadioGroup.Label as="span" className="font-medium">
                          {reply.name}
                        </RadioGroup.Label>
                        <RadioGroup.Description
                          as="span"
                          className="text-white/75"
                        >
                          {reply.description}
                        </RadioGroup.Description>
                      </span>
                    </span>
                    <RadioGroup.Description
                      as="span"
                      className="hidden mt-2 text-sm lg:flex sm:mt-0 sm:ml-4 sm:flex-col"
                    >
                      <reply.icon
                        className="flex-shrink-0 w-6 h-6 mr-4 text-white"
                        aria-hidden="true"
                      />
                    </RadioGroup.Description>
                    <span
                      className={classNames(
                        active ? "border" : "border-2",
                        checked ? "border-primary-500" : "border-transparent",
                        "pointer-events-none absolute -inset-px rounded-lg"
                      )}
                      aria-hidden="true"
                    />
                  </>
                )}
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>
      </Modal>
      <div className="flex flex-col p-4 border rounded-lg border-white/10">
        <div className="hidden grid-cols-2 gap-12 xl:grid">
          <Address address={offer.sender} copy />
          <Address address={offer.peer} />
        </div>
        <div className="hidden grid-cols-2 gap-12 mt-4 xl:grid">
          <div className="flex flex-row space-x-4">
            {offeredNfts?.slice(0, 1).map((nft) => (
              <OfferNft nft={nft} />
            ))}
            {(offeredNfts?.length || 0) > 1 && (
              <div className="flex items-center justify-center flex-shrink-0 w-24 h-24 text-sm border rounded-md text-white/50 border-white/10">
                +{offeredNfts!.length - 1}
              </div>
            )}
          </div>
          <div className="flex flex-row space-x-4">
            {wantedNfts?.slice(0, 1).map((nft) => (
              <OfferNft nft={nft} />
            ))}
            {(wantedNfts?.length || 0) > 1 && (
              <div className="flex items-center justify-center flex-shrink-0 w-24 h-24 text-sm border rounded-md text-white/50 border-white/10">
                +{wantedNfts!.length - 1}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 pt-4 mt-4 border-t border-white/10">
          <div className="flex items-center">
            <p className="font-medium text-white/75">
              Offer expires 12-24-2022
            </p>
          </div>
          <div className="space-x-4 lg:flex lg:flex-row lg:justify-end lg:items-center">
            <button
              onClick={() => setIsDetailsModalOpen(true)}
              className="inline-flex items-center justify-center h-10 text-xs font-medium text-white border border-white rounded-lg lg:w-32 hover:bg-primary hover:border-none"
            >
              Details
            </button>
            <button
              onClick={() => setIsReplyModalOpen(true)}
              className="inline-flex items-center justify-center h-10 text-xs font-medium text-white rounded-lg lg:w-32 bg-primary hover:bg-primary-500"
            >
              Reply
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
