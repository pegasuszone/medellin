import { useStargazeClient, useWallet } from "client";
import dynamic from "next/dynamic";
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
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import useToaster, { ToastTypes } from "hooks/useToaster";

const Countdown = dynamic(() => import("react-countdown"));

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
  const toaster = useToaster();

  const [offeredNfts, setOfferedNfts] = useState<Media[]>();
  const [wantedNfts, setWantedNfts] = useState<Media[]>();

  const [isLoading, setIsLoading] = useState<boolean>();

  const [isExpired, setIsExpired] = useState<boolean>(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const handleDetailsModal = useCallback((val: boolean) => {
    setIsDetailsModalOpen(val);
  }, []);

  const [isReplyModalOpen, setIsReplyModalOpen] = useState<boolean>(false);
  const handleReplyModal = useCallback((val: boolean) => {
    setIsReplyModalOpen(val);
    if (!val) setSelectedReply(undefined);
  }, []);

  const [isRetractModalOpen, setIsRetractModalOpen] = useState<boolean>(false);
  const handleRetractModal = useCallback((val: boolean) => {
    setIsRetractModalOpen(val);
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

  // Handle retracting the offer & authorization to the contract
  const handleRetract = useCallback(() => {
    if (!offeredNfts) return;

    const msg = { remove_offer: { id: offer.id } };

    const wasmMsg = {
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: MsgExecuteContract.fromPartial({
        sender: wallet?.address,
        msg: toUtf8(JSON.stringify(msg)),
        contract: CONTRACT_ADDRESS,
      }),
    };

    const msgs = [
      ...offeredNfts.map((nft) => {
        return {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: MsgExecuteContract.fromPartial({
            sender: wallet?.address,
            msg: toUtf8(
              JSON.stringify({
                revoke: {
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

    tx(
      msgs,
      {
        gas: 1499999,
      },
      () => {
        actionCallback();
      }
    );
  }, [tx, wantedNfts, offer]);

  // Countdown renderer
  const renderer = useCallback(
    ({
      days,
      hours,
      minutes,
      seconds,
    }: {
      days: number;
      hours: number;
      minutes: number;
      seconds: number;
    }) => {
      if (!offer) return;
      // Render a countdown
      return (
        <span>
          {days > 1 && <>{days}d </>}
          {hours > 1 && <>{hours}h </>}
          {hours < 1 && (
            <>
              {minutes > 1 && <>{minutes}m</>} {seconds > 1 && <>{seconds}s</>}
            </>
          )}
        </span>
      );
    },
    [offer]
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
      <Modal
        actions={[
          {
            name: "Confirm Retraction",
            type: "primary",
            action: () => {
              handleRetract();
            },
          },
          { name: "Cancel", type: "secondary", action: () => {} },
        ]}
        open={isRetractModalOpen}
        handleStateChange={handleRetractModal}
      >
        <p className="-mt-1 text-2xl font-bold">Retract Offer</p>
        <p className="mt-3 mb-4 text-sm text-white/75">
          Before you retract this offer, be advised that{" "}
          <b>retracting an offer is final</b> and will remove it from the inbox
          of the user you've sent it to.
        </p>
      </Modal>
      <div className="flex flex-col p-4 border rounded-lg border-white/10">
        {/* Desktop address view */}
        <div className="hidden grid-cols-2 gap-12 xl:grid">
          <Address address={offer.sender} copy={isPeer} />
          <Address address={offer.peer} copy={isSender} />
        </div>
        {/* Desktop NFT view */}
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
        {/* Mobile view */}
        <div className="lg:hidden">
          <Address address={offer.sender} copy={isPeer} />
          <div className="flex flex-row mt-2 space-x-2">
            {offeredNfts?.slice(0, 1).map((nft) => (
              <OfferNft nft={nft} />
            ))}
            {(offeredNfts?.length || 0) > 1 && (
              <div className="flex items-center justify-center flex-shrink-0 w-24 h-24 text-sm border rounded-md text-white/50 border-white/10">
                +{offeredNfts!.length - 1}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 lg:hidden">
          <Address address={offer.peer} copy={isSender} />
          <div className="flex flex-row mt-2 space-x-2">
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
        <div className="pt-4 mt-4 border-t lg:grid lg:grid-cols-2 border-white/10">
          <div className="flex items-center">
            {!isExpired ? (
              <p className="font-medium text-white/75">
                Offer expires in{" "}
                <span className="font-semibold text-white">
                  <Countdown
                    date={new Date(parseInt(offer?.expires_at!) / 1000000)}
                    renderer={renderer}
                    onComplete={() => {
                      setIsExpired(true);
                    }}
                  />
                </span>
              </p>
            ) : (
              <p className="font-semibold text-red-500">Offer is expired</p>
            )}
          </div>
          <div className="flex flex-col mt-4 space-y-2 lg:mt-0 lg:space-x-4 lg:space-y-0 lg:flex-row lg:justify-end lg:items-center">
            <button
              onClick={() => setIsDetailsModalOpen(true)}
              className="inline-flex items-center justify-center h-10 text-xs font-medium text-white border border-white rounded-lg lg:w-32 hover:bg-primary hover:border-none"
            >
              Details
            </button>
            {isPeer && (
              <button
                onClick={() => {
                  if (isExpired) {
                    return toaster.toast({
                      type: ToastTypes.Error,
                      title: "Cannot reply to expired offer",
                      message:
                        "This offer has expired and therefore cannot be replied to. The sender of the offer must renew it before you can reply to it.",
                    });
                  }
                  setIsReplyModalOpen(true);
                }}
                className="inline-flex items-center justify-center h-10 text-xs font-medium text-white rounded-lg lg:w-32 bg-primary hover:bg-primary-500"
              >
                Reply
              </button>
            )}
            {isSender && (
              <button
                onClick={() => {
                  setIsRetractModalOpen(true);
                }}
                className="inline-flex items-center justify-center h-10 text-xs font-medium text-white rounded-lg lg:w-32 bg-primary hover:bg-primary-500"
              >
                Retract
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
